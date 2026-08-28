#!/usr/bin/env python3
"""Deliver the DailyCoder social digest by email, and close the loop in the DB.

Reads one JSON object on stdin (written by the digest agent), renders it to a
phone-readable email, sends it through Resend, and only then marks the included
items delivered so they never appear in a second digest.

Why this is a separate deterministic script, not something the agent does:
this repo already separates content generation from delivery (the 6:15 puzzle
job writes, the 7:00 Worker sends) precisely so a bad agent day produces silence
instead of a bad send. Same principle here. The agent's job ends when it has
written JSON; it cannot half-send, double-send, or mark items delivered that
never reached anyone.

Expected stdin schema — every field optional except engage/posts being lists:

    {
      "date":   "2026-08-27",
      "puzzle": {"title": "...", "url": "https://dailycoder.io/?p=slug"},
      "engage": [
        {"id": "hn:49466162",        # MUST match the listener's id, or the
         "source": "hackernews",     #   item silently re-appears tomorrow
         "title": "...",
         "url": "https://...",
         "why": "one line: why this is worth Nick's reply",
         "draft": "the suggested reply, in Nick's voice"}
      ],
      "posts": [
        {"platform": "mastodon", "text": "...", "note": "optional context"}
      ],
      "skipped": 12,
      "notes": "anything the agent wants to flag"
    }

Usage:
    ... | send_digest.py            send it
    ... | send_digest.py --dry-run  render to stdout, send nothing, mark nothing
"""

import argparse
import html
import json
import os
import sqlite3
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")

HERE = os.path.dirname(os.path.abspath(__file__))
ACCOUNTS_PATH = os.path.join(HERE, "accounts.json")

STATE_DIR = os.environ.get(
    "DC_SOCIAL_STATE", os.path.join(os.path.expanduser("~"), ".hermes", "state")
)
DB_PATH = os.path.join(STATE_DIR, "dailycoder_social.db")


def load_accounts():
    try:
        with open(ACCOUNTS_PATH, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, json.JSONDecodeError):
        return {}


# --------------------------------------------------------------------------
# action links — the whole point of the email
#
# Nick posts by hand from his own accounts, as himself. Nothing here automates
# a post; these are just the shortest path from "reading the digest on a phone"
# to "cursor blinking in a reply box on the right thread". Every one is a plain
# link a human taps.
# --------------------------------------------------------------------------


def reply_link(item, accounts):
    """Best available 'go reply to this' link. Returns (url, label)."""
    source = (item.get("source") or "").lower()
    url = item.get("url") or ""

    if source == "mastodon":
        # A Mastodon post lives on ITS OWN server, where Nick is not logged in.
        # /authorize_interaction on his HOME instance pulls the remote post into
        # his own session so the reply box is his account. Without the instance
        # configured this is impossible, and the raw link means: open it, copy
        # the URL, paste it into your own instance's search, then reply.
        instance = (accounts.get("mastodon_instance") or "").strip().strip("/")
        uri = item.get("uri") or url
        if instance and uri:
            return (
                f"https://{instance}/authorize_interaction?"
                + urllib.parse.urlencode({"uri": uri}),
                "Reply from your account",
            )
        return url, "Open post (set mastodon_instance for 1-tap reply)"

    if source == "hackernews":
        # HN has no reply-intent URL; the item page has the reply box on it.
        return url, "Open thread on HN"

    if source == "reddit":
        return url, "Open thread on Reddit"

    if source == "lobsters":
        return url, "Open thread on Lobsters"

    if source == "lemmy":
        return url, "Open thread"

    return url, "Open"


def reddit_search_links(date_str, count=3):
    """Pre-built Reddit searches for the digest — one tap, no typing.

    Reddit is the one source that cannot run in the scheduled job. The server
    has no browser (hermes was installed --skip-browser, no chrome binary) and
    Reddit search HTML 403s over plain HTTP from that box. The API is off the
    table separately: the Responsible Builder Policy requires explicit written
    approval for commercial use, and DailyCoder funnels to Sego.

    What IS fine is Nick searching Reddit himself. So the digest carries the
    searches rather than the results — it removes the "what do I even type"
    friction, which is the part that actually stops him.

    Two hard-won URL details, both from failures on 2026-08-27:
      - sort=relevance, NOT sort=new. `new` returned Zelda villains and Dead by
        Daylight threads for a coding query.
      - t=month keeps it current without starving the result set.

    Phrases rotate by day-of-year so he isn't shown the same three every
    morning — deterministic, so two runs on the same day agree.
    """
    try:
        with open(os.path.join(HERE, "terms.json"), "r", encoding="utf-8") as fh:
            cfg = json.load(fh)
    except (OSError, json.JSONDecodeError):
        return []

    tiers = cfg.get("tiers") or {}
    tier3 = (tiers.get("3") or {}).get("terms", [])
    tier2 = (tiers.get("2") or {}).get("terms", [])
    if not tier3 and not tier2:
        return []

    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").timetuple().tm_yday
    except (ValueError, TypeError):
        day = datetime.now(ET).timetuple().tm_yday

    # Always weight toward tier 3 — those are the thesis terms (people worrying
    # aloud that AI is eroding their craft), which is who DailyCoder is for.
    # Taking consecutive slices instead clustered badly: one day produced
    # "project euler" / "codewars" / "exercism", three competitor site names in
    # a row, which are poor search targets. Draw from both tiers explicitly.
    n3 = min(len(tier3), max(1, count - 1)) if tier3 else 0
    n2 = count - n3
    picked = [tier3[(day * n3 + i) % len(tier3)] for i in range(n3)]
    if tier2 and n2 > 0:
        picked += [tier2[(day * n2 + i) % len(tier2)] for i in range(n2)]
    out = []
    for phrase in picked:
        url = "https://www.reddit.com/search/?" + urllib.parse.urlencode(
            {"q": f'"{phrase}"', "type": "posts", "sort": "relevance", "t": "month"}
        )
        out.append((url, phrase))
    return out


def compose_links(text, accounts, platform=None):
    """Pre-filled compose links for a standalone post. Returns [(url, label)]."""
    enabled = accounts.get("enabled_compose") or ["mastodon", "bluesky", "twitter"]
    if platform:
        wanted = [platform.lower()]
    else:
        wanted = [p.lower() for p in enabled]

    out = []
    for name in wanted:
        if name in ("mastodon", "fediverse"):
            instance = (accounts.get("mastodon_instance") or "").strip().strip("/")
            if instance:
                out.append(
                    (
                        f"https://{instance}/share?"
                        + urllib.parse.urlencode({"text": text}),
                        "Compose on Mastodon",
                    )
                )
        elif name in ("bluesky", "bsky"):
            out.append(
                (
                    "https://bsky.app/intent/compose?"
                    + urllib.parse.urlencode({"text": text}),
                    "Compose on Bluesky",
                )
            )
        elif name in ("twitter", "x"):
            out.append(
                (
                    "https://x.com/intent/tweet?"
                    + urllib.parse.urlencode({"text": text}),
                    "Compose on X",
                )
            )
    return out


def esc(text):
    return html.escape(str(text or ""))


def render_text(data, accounts):
    lines = []
    puzzle = data.get("puzzle") or {}
    if puzzle.get("title"):
        lines.append(f"TODAY'S PUZZLE: {puzzle['title']}")
        if puzzle.get("url"):
            lines.append(puzzle["url"])
        lines.append("")

    engage = data.get("engage") or []
    if engage:
        lines.append(f"=== REPLY TO THESE ({len(engage)}) ===")
        lines.append("")
        for n, item in enumerate(engage, 1):
            lines.append(f"{n}. [{item.get('source','?')}] {item.get('title','')}")
            link, label = reply_link(item, accounts)
            lines.append(f"   {label}: {link}")
            if item.get("why"):
                lines.append(f"   WHY: {item['why']}")
            if item.get("draft"):
                lines.append(f"   DRAFT: {item['draft']}")
            lines.append("")

    posts = data.get("posts") or []
    if posts:
        lines.append(f"=== POST THESE ({len(posts)}) ===")
        lines.append("")
        for n, post in enumerate(posts, 1):
            lines.append(f"{n}. [{post.get('platform','')}]")
            lines.append(f"   {post.get('text','')}")
            if post.get("note"):
                lines.append(f"   ({post['note']})")
            for url, label in compose_links(
                post.get("text", ""), accounts, post.get("platform")
            ):
                lines.append(f"   {label}: {url}")
            lines.append("")

    if not engage and not posts:
        lines.append("Nothing worth your time in the queue today.")
        lines.append("")

    reddit = reddit_search_links(data.get("date") or "")
    if reddit:
        lines.append("=== REDDIT — TAP TO SEARCH (not automated; see note) ===")
        lines.append("")
        for url, phrase in reddit:
            lines.append(f'   "{phrase}"')
            lines.append(f"   {url}")
        lines.append("")
        lines.append("   Or just ask Claude to find Reddit threads — it will")
        lines.append("   search and filter out anything u/direct151 already replied to.")
        lines.append("")

    if data.get("notes"):
        lines.append(f"NOTES: {data['notes']}")
        lines.append("")
    lines.append(
        f"({data.get('skipped', 0)} items scored but discarded. Nothing here has "
        "been posted and nothing will be — every link opens a normal compose box "
        "in your own logged-in account, and you send it yourself.)"
    )
    return "\n".join(lines)


def button(url, label, primary=False):
    """A tap target big enough for a thumb. Email clients only reliably style
    inline <a>, so everything is inline CSS and nothing depends on a class."""
    bg = "#b5642f" if primary else "#f3ecdd"
    fg = "#ffffff" if primary else "#5c5344"
    border = "#b5642f" if primary else "#ddd2ba"
    return (
        f'<a href="{esc(url)}" style="display:inline-block;padding:11px 17px;'
        f"margin:6px 7px 0 0;background:{bg};color:{fg};border:1px solid {border};"
        "border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;"
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"
        f'">{esc(label)}</a>'
    )


def render_html(data, accounts):
    puzzle = data.get("puzzle") or {}
    engage = data.get("engage") or []
    posts = data.get("posts") or []

    # Warm paper palette, matching the site's cozy-newspaper aesthetic.
    css_card = (
        "background:#fffdf8;border:1px solid #e6ddc9;border-radius:8px;"
        "padding:14px 16px;margin:0 0 14px 0;"
    )
    out = [
        '<div style="font-family:Georgia,\'Iowan Old Style\',serif;max-width:640px;'
        'margin:0 auto;padding:20px;color:#2f2a24;background:#faf6ee;">'
    ]

    if puzzle.get("title"):
        out.append(
            f'<div style="{css_card}border-left:4px solid #b5642f;">'
            f'<div style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;'
            f'color:#8a7c66;margin-bottom:5px;">Today&rsquo;s puzzle</div>'
            f'<a href="{esc(puzzle.get("url",""))}" '
            f'style="font-size:18px;color:#1f3a5f;text-decoration:none;font-weight:bold;">'
            f"{esc(puzzle['title'])}</a></div>"
        )

    if engage:
        out.append(
            '<h2 style="font-size:13px;letter-spacing:.09em;text-transform:uppercase;'
            f'color:#8a7c66;margin:22px 0 10px;">Reply to these ({len(engage)})</h2>'
        )
        for item in engage:
            out.append(f'<div style="{css_card}">')
            out.append(
                f'<div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;'
                f'color:#a0937c;margin-bottom:4px;">'
                f'{esc(item.get("source",""))}</div>'
            )
            out.append(
                f'<a href="{esc(item.get("url",""))}" style="font-size:16px;color:#1f3a5f;'
                f'text-decoration:none;font-weight:bold;line-height:1.35;">'
                f'{esc(item.get("title",""))}</a>'
            )
            if item.get("why"):
                out.append(
                    f'<div style="font-size:13px;color:#6b6152;margin:8px 0 0;'
                    f'font-style:italic;line-height:1.5;">{esc(item["why"])}</div>'
                )
            if item.get("draft"):
                out.append(
                    '<div style="font-size:11px;letter-spacing:.07em;text-transform:uppercase;'
                    'color:#a0937c;margin:12px 0 5px;">Suggested reply &mdash; select to copy</div>'
                    '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;'
                    "font-size:14px;line-height:1.55;background:#f3ecdd;border-radius:6px;"
                    f'padding:11px 13px;white-space:pre-wrap;">{esc(item["draft"])}</div>'
                )
            link, label = reply_link(item, accounts)
            if link:
                out.append(button(link, label, primary=True))
            out.append("</div>")

    if posts:
        out.append(
            '<h2 style="font-size:13px;letter-spacing:.09em;text-transform:uppercase;'
            f'color:#8a7c66;margin:22px 0 10px;">Post these ({len(posts)})</h2>'
        )
        for post in posts:
            out.append(f'<div style="{css_card}">')
            out.append(
                f'<div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;'
                f'color:#a0937c;margin-bottom:6px;">{esc(post.get("platform",""))}</div>'
                '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;'
                "font-size:14px;line-height:1.55;background:#f3ecdd;border-radius:6px;"
                f'padding:11px 13px;white-space:pre-wrap;">{esc(post.get("text",""))}</div>'
            )
            if post.get("note"):
                out.append(
                    f'<div style="font-size:12px;color:#6b6152;margin-top:7px;'
                    f'font-style:italic;">{esc(post["note"])}</div>'
                )
            links = compose_links(post.get("text", ""), accounts, post.get("platform"))
            for n, (url, label) in enumerate(links):
                out.append(button(url, label, primary=(n == 0)))
            out.append("</div>")

    if not engage and not posts:
        out.append(
            f'<div style="{css_card}color:#6b6152;font-style:italic;">'
            "Nothing worth your time in the queue today. That is a real answer, "
            "not a failure &mdash; a quiet day beats a forced reply.</div>"
        )

    reddit = reddit_search_links(data.get("date") or "")
    if reddit:
        out.append(
            '<h2 style="font-size:13px;letter-spacing:.09em;text-transform:uppercase;'
            'color:#8a7c66;margin:22px 0 10px;">Reddit &mdash; tap to search</h2>'
        )
        out.append(f'<div style="{css_card}">')
        for url, phrase in reddit:
            out.append(button(url, f"“{phrase}”"))
        out.append(
            '<div style="font-size:12px;color:#6b6152;margin-top:12px;line-height:1.55;">'
            "Reddit can&rsquo;t run in this job &mdash; the server has no browser and "
            "the API needs commercial approval. These are searches, not results. "
            "Ask Claude to &ldquo;find me Reddit threads&rdquo; for a ranked list "
            "with anything you&rsquo;ve already replied to filtered out.</div>"
        )
        out.append("</div>")

    if data.get("notes"):
        out.append(
            f'<div style="{css_card}background:#f6eede;font-size:13px;color:#6b6152;">'
            f'{esc(data["notes"])}</div>'
        )

    footer = (
        f'{int(data.get("skipped", 0))} items scored but discarded. '
        "Nothing here has been posted anywhere and nothing will be &mdash; "
        "every button opens a normal compose box in your own logged-in account, "
        "and you type or paste and send it yourself."
    )
    if not (accounts.get("mastodon_instance") or "").strip():
        footer += (
            " <b>Tip:</b> set <code>mastodon_instance</code> in "
            "<code>agent/social/accounts.json</code> to turn Mastodon posts into "
            "one-tap replies from your own account."
        )
    out.append(
        '<div style="font-size:11px;color:#a0937c;margin-top:18px;line-height:1.6;'
        f'border-top:1px solid #e6ddc9;padding-top:12px;">{footer}</div></div>'
    )
    return "".join(out)


def send(data, subject, accounts):
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        print("NOT SENT — RESEND_API_KEY missing from the job environment")
        return False
    payload = json.dumps(
        {
            "from": os.environ.get("AGENT_MAIL_FROM", "Hermes <hermes@mystack.co>"),
            "to": [os.environ.get("AGENT_MAIL_TO", "nick@segosolutions.com")],
            "subject": subject,
            "text": render_text(data, accounts),
            "html": render_html(data, accounts),
        }
    ).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            # Cloudflare fronts api.resend.com and 403s "Python-urllib/3.x"
            # with error 1010. Same fix as dailycoder_send_watchdog.py.
            "User-Agent": "dailycoder-social-digest",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status in (200, 201):
                return True
            print(f"NOT SENT — Resend returned HTTP {resp.status}")
            return False
    except urllib.error.HTTPError as exc:
        print(f"NOT SENT — Resend HTTP {exc.code}: {exc.read()[:300].decode('utf-8','replace')}")
        return False
    except (urllib.error.URLError, OSError) as exc:
        print(f"NOT SENT — {type(exc).__name__}: {exc}")
        return False


def mark_delivered(ids):
    """Only called after a confirmed send, so nothing is ever silently dropped."""
    if not ids or not os.path.exists(DB_PATH):
        return 0
    conn = sqlite3.connect(DB_PATH, timeout=30)
    stamp = datetime.now(timezone.utc).isoformat()
    conn.executemany(
        "UPDATE items SET delivered_at = ? WHERE id = ? AND delivered_at IS NULL",
        [(stamp, i) for i in ids],
    )
    conn.commit()
    changed = conn.total_changes
    conn.close()
    return changed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    raw = sys.stdin.read().strip()
    if not raw:
        print("no JSON on stdin — nothing sent")
        return 1
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"stdin is not valid JSON ({exc}) — nothing sent")
        return 1

    accounts = load_accounts()
    engage = data.get("engage") or []
    posts = data.get("posts") or []
    today = data.get("date") or datetime.now(ET).strftime("%Y-%m-%d")

    if engage or posts:
        subject = f"DailyCoder social · {len(engage)} to reply, {len(posts)} to post"
    else:
        subject = "DailyCoder social · quiet day, nothing worth replying to"

    if args.dry_run:
        print(f"SUBJECT: {subject}\n")
        print(render_text(data, accounts))
        print(f"\n[dry run — nothing sent, nothing marked delivered]")
        return 0

    if not send(data, subject, accounts):
        return 1

    ids = [i["id"] for i in engage if i.get("id")]
    marked = mark_delivered(ids)
    print(f"sent · {len(engage)} to reply, {len(posts)} to post, {marked} marked delivered")
    return 0


if __name__ == "__main__":
    sys.exit(main())
