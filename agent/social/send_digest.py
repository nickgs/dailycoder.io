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
import urllib.request
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")

STATE_DIR = os.environ.get(
    "DC_SOCIAL_STATE", os.path.join(os.path.expanduser("~"), ".hermes", "state")
)
DB_PATH = os.path.join(STATE_DIR, "dailycoder_social.db")


def esc(text):
    return html.escape(str(text or ""))


def render_text(data):
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
            lines.append(f"   {item.get('url','')}")
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
            lines.append("")

    if not engage and not posts:
        lines.append("Nothing worth your time in the queue today.")
        lines.append("")

    if data.get("notes"):
        lines.append(f"NOTES: {data['notes']}")
        lines.append("")
    lines.append(
        f"({data.get('skipped', 0)} items scored but discarded. "
        "Nothing here has been posted — every item is yours to send or ignore.)"
    )
    return "\n".join(lines)


def render_html(data):
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
                    'color:#a0937c;margin:12px 0 5px;">Suggested reply</div>'
                    '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;'
                    "font-size:14px;line-height:1.55;background:#f3ecdd;border-radius:6px;"
                    f'padding:11px 13px;white-space:pre-wrap;">{esc(item["draft"])}</div>'
                )
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
            out.append("</div>")

    if not engage and not posts:
        out.append(
            f'<div style="{css_card}color:#6b6152;font-style:italic;">'
            "Nothing worth your time in the queue today. That is a real answer, "
            "not a failure &mdash; a quiet day beats a forced reply.</div>"
        )

    if data.get("notes"):
        out.append(
            f'<div style="{css_card}background:#f6eede;font-size:13px;color:#6b6152;">'
            f'{esc(data["notes"])}</div>'
        )

    out.append(
        '<div style="font-size:11px;color:#a0937c;margin-top:18px;line-height:1.6;'
        'border-top:1px solid #e6ddc9;padding-top:12px;">'
        f'{int(data.get("skipped", 0))} items scored but discarded. '
        "Nothing here has been posted anywhere &mdash; every line is a draft "
        "waiting on you.</div></div>"
    )
    return "".join(out)


def send(data, subject):
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        print("NOT SENT — RESEND_API_KEY missing from the job environment")
        return False
    payload = json.dumps(
        {
            "from": os.environ.get("AGENT_MAIL_FROM", "Hermes <hermes@mystack.co>"),
            "to": [os.environ.get("AGENT_MAIL_TO", "nick@segosolutions.com")],
            "subject": subject,
            "text": render_text(data),
            "html": render_html(data),
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

    engage = data.get("engage") or []
    posts = data.get("posts") or []
    today = data.get("date") or datetime.now(ET).strftime("%Y-%m-%d")

    if engage or posts:
        subject = f"DailyCoder social · {len(engage)} to reply, {len(posts)} to post"
    else:
        subject = "DailyCoder social · quiet day, nothing worth replying to"

    if args.dry_run:
        print(f"SUBJECT: {subject}\n")
        print(render_text(data))
        print(f"\n[dry run — nothing sent, nothing marked delivered]")
        return 0

    if not send(data, subject):
        return 1

    ids = [i["id"] for i in engage if i.get("id")]
    marked = mark_delivered(ids)
    print(f"sent · {len(engage)} to reply, {len(posts)} to post, {marked} marked delivered")
    return 0


if __name__ == "__main__":
    sys.exit(main())
