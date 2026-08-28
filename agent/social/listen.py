#!/usr/bin/env python3
"""Collect DailyCoder engagement opportunities from open community APIs.

This is the cheap half of the social loop. It runs with --no-agent, so it costs
nothing per run: no LLM is involved, it just fetches, scores, dedupes and
queues. The expensive half (ranking and drafting) happens once a day in
`agent/social-digest.md`, reading this queue via --report.

That split is deliberate and mirrors the puzzle/send split already in this repo:
a cheap deterministic collector cannot produce a bad post, and a bad agent day
produces silence rather than noise.

Sources are limited to APIs that work with NO credentials, verified from
libc-agents on 2026-08-27:

    HN (Algolia)          200   search_by_date
    Lobsters              200   /t/<tag>.json
    Lemmy programming.dev 200   /api/v3/post/list
    Mastodon tag timeline 200   /api/v1/timelines/tag/<tag>

Deliberately NOT here, because both 403 without credentials:

    Reddit   — needs a registered OAuth "script" app (client id + secret)
    Bluesky  — app.bsky.feed.searchPosts needs a session; needs an app password

Those are the two highest-value audiences for DailyCoder and they are the first
thing to add once Nick supplies credentials. Mastodon /api/v2/search also needs
auth (it returns empty arrays unauthenticated, which looks like "no results"
rather than "denied") — hence tag timelines, which genuinely are public.

Modes:
    (default)          collect; print NOTHING on success. Empty stdout = silent,
                       so a healthy run never emails anyone.
    --report [N]       print the pending queue as JSON for the digest agent
    --mark-delivered   read ids on stdin (one per line) and mark them delivered
    --stats            human-readable queue state
"""

import argparse
import html
import json
import os
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
TERMS_PATH = os.path.join(HERE, "terms.json")

STATE_DIR = os.environ.get(
    "DC_SOCIAL_STATE", os.path.join(os.path.expanduser("~"), ".hermes", "state")
)
DB_PATH = os.path.join(STATE_DIR, "dailycoder_social.db")

UA = "dailycoder-listener/0.1 (+https://dailycoder.io; nick@segosolutions.com)"

# Keep a lid on how much any single source can contribute per run. Without this
# one busy Mastodon tag can crowd out everything else in a day's digest.
PER_SOURCE_CAP = 12

# Items older than this are never enqueued — replying to a four-day-old thread
# is worse than not replying.
MAX_AGE_HOURS = 48

# Pending items the digest agent has repeatedly declined to use are dropped
# after this long. Without it the queue only ever grows: every rejected item is
# re-read by the agent every morning, and prompt tokens are ~88% of this job's
# cost, so a growing queue of things already judged uninteresting is a bill that
# compounds for no benefit. Safe to delete because it is well past
# MAX_AGE_HOURS, so the collector will not pick the same item up again.
PENDING_TTL_HOURS = 96

TAG_RE = re.compile(r"<[^>]+>")


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------


def strip_html(raw):
    if not raw:
        return ""
    return html.unescape(TAG_RE.sub(" ", raw)).strip()


def get_json(url, timeout=20):
    """GET and parse JSON. Returns (data, None) or (None, reason)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status != 200:
                return None, f"HTTP {resp.status}"
            return json.loads(resp.read().decode("utf-8", "replace")), None
    except urllib.error.HTTPError as exc:
        return None, f"HTTP {exc.code}"
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as exc:
        return None, f"{type(exc).__name__}: {exc}"


def now_utc():
    return datetime.now(timezone.utc)


def parse_ts(value):
    """Best-effort timestamp parse across four different API conventions."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, timezone.utc)
    text = str(value).strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


# --------------------------------------------------------------------------
# scoring
# --------------------------------------------------------------------------


def load_terms():
    with open(TERMS_PATH, "r", encoding="utf-8") as fh:
        cfg = json.load(fh)
    weighted = []
    for weight, block in cfg.get("tiers", {}).items():
        for term in block.get("terms", []):
            weighted.append((int(weight), term.lower()))
    # Longest first so "coding puzzle" is considered before "puzzle"-ish subsets.
    weighted.sort(key=lambda pair: -len(pair[1]))
    return {
        "min_score": int(cfg.get("min_score", 3)),
        "weighted": weighted,
        "negative": [t.lower() for t in cfg.get("negative", [])],
    }


def score_text(text, terms):
    """Return (score, matched_terms) or (0, []) if vetoed."""
    low = text.lower()
    for bad in terms["negative"]:
        if bad in low:
            return 0, []
    score = 0
    matched = []
    for weight, term in terms["weighted"]:
        if term in low:
            score += weight
            matched.append(term)
    return score, matched


# --------------------------------------------------------------------------
# storage
# --------------------------------------------------------------------------


def db_connect():
    os.makedirs(STATE_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS items (
            id            TEXT PRIMARY KEY,   -- source:native_id, the dedupe key
            source        TEXT NOT NULL,
            title         TEXT NOT NULL,
            url           TEXT NOT NULL,
            author        TEXT,
            excerpt       TEXT,
            score         INTEGER NOT NULL,
            matched       TEXT,
            engagement    INTEGER DEFAULT 0,  -- comments/replies, a crude "is it live" signal
            posted_at     TEXT,
            found_at      TEXT NOT NULL,
            delivered_at  TEXT                -- NULL = still pending
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_pending ON items(delivered_at, score)")
    conn.commit()
    return conn


def enqueue(conn, item):
    """Insert if new. Returns True when it was actually new."""
    try:
        conn.execute(
            """INSERT INTO items
               (id, source, title, url, author, excerpt, score, matched,
                engagement, posted_at, found_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (
                item["id"],
                item["source"],
                item["title"][:500],
                item["url"],
                item.get("author", ""),
                (item.get("excerpt") or "")[:900],
                item["score"],
                ",".join(item.get("matched", [])),
                item.get("engagement", 0),
                item.get("posted_at"),
                now_utc().isoformat(),
            ),
        )
        return True
    except sqlite3.IntegrityError:
        return False


# --------------------------------------------------------------------------
# sources
# --------------------------------------------------------------------------


def fresh_enough(posted_at):
    if posted_at is None:
        return True  # undated sources are rare; let scoring decide
    return posted_at >= now_utc() - timedelta(hours=MAX_AGE_HOURS)


def src_hackernews(terms, errors):
    """HN via Algolia. Query per tier-3/tier-2 phrase, newest first."""
    out = []
    queries = [t for w, t in terms["weighted"] if w >= 2][:14]
    seen_ids = set()
    for query in queries:
        url = (
            "https://hn.algolia.com/api/v1/search_by_date?"
            + urllib.parse.urlencode(
                {
                    "query": query,
                    "tags": "(story,comment)",
                    "hitsPerPage": 12,
                    "numericFilters": f"created_at_i>{int(time.time() - MAX_AGE_HOURS * 3600)}",
                }
            )
        )
        data, err = get_json(url)
        if err:
            errors.append(f"hackernews[{query}]: {err}")
            continue
        for hit in data.get("hits", []):
            oid = str(hit.get("objectID"))
            if oid in seen_ids:
                continue
            seen_ids.add(oid)
            title = hit.get("title") or hit.get("story_title") or ""
            body = strip_html(hit.get("story_text") or hit.get("comment_text") or "")
            score, matched = score_text(f"{title} {body}", terms)
            if score < terms["min_score"]:
                continue
            out.append(
                {
                    "id": f"hn:{oid}",
                    "source": "hackernews",
                    "title": title or body[:120] or "(HN comment)",
                    "url": f"https://news.ycombinator.com/item?id={oid}",
                    "author": hit.get("author", ""),
                    "excerpt": body[:600],
                    "score": score,
                    "matched": matched,
                    "engagement": hit.get("num_comments") or 0,
                    "posted_at": (parse_ts(hit.get("created_at")) or now_utc()).isoformat(),
                }
            )
    return out


def src_lobsters(terms, errors):
    out = []
    for tag in ("programming", "practices", "compsci"):
        data, err = get_json(f"https://lobste.rs/t/{tag}.json")
        if err:
            errors.append(f"lobsters[{tag}]: {err}")
            continue
        for post in data if isinstance(data, list) else []:
            posted = parse_ts(post.get("created_at"))
            if not fresh_enough(posted):
                continue
            body = post.get("description_plain") or strip_html(post.get("description"))
            score, matched = score_text(f"{post.get('title','')} {body}", terms)
            if score < terms["min_score"]:
                continue
            out.append(
                {
                    "id": f"lobsters:{post.get('short_id')}",
                    "source": "lobsters",
                    "title": post.get("title", ""),
                    "url": post.get("comments_url") or post.get("short_id_url") or "",
                    "author": (post.get("submitter_user") or {}).get("username", "")
                    if isinstance(post.get("submitter_user"), dict)
                    else str(post.get("submitter_user") or ""),
                    "excerpt": (body or "")[:600],
                    "score": score,
                    "matched": matched,
                    "engagement": post.get("comment_count") or 0,
                    "posted_at": (posted or now_utc()).isoformat(),
                }
            )
    return out


def src_lemmy(terms, errors):
    out = []
    base = "https://programming.dev/api/v3/post/list"
    for sort in ("New", "Active"):
        data, err = get_json(f"{base}?limit=50&sort={sort}&type_=Local")
        if err:
            errors.append(f"lemmy[{sort}]: {err}")
            continue
        for entry in data.get("posts", []):
            post = entry.get("post", {})
            posted = parse_ts(post.get("published"))
            if not fresh_enough(posted):
                continue
            body = post.get("body") or ""
            score, matched = score_text(f"{post.get('name','')} {body}", terms)
            if score < terms["min_score"]:
                continue
            out.append(
                {
                    "id": f"lemmy:{post.get('id')}",
                    "source": "lemmy",
                    "title": post.get("name", ""),
                    "url": post.get("ap_id") or post.get("url") or "",
                    "author": "",
                    "excerpt": strip_html(body)[:600],
                    "score": score,
                    "matched": matched,
                    "engagement": (entry.get("counts") or {}).get("comments", 0),
                    "posted_at": (posted or now_utc()).isoformat(),
                }
            )
    return out


def src_mastodon(terms, errors):
    """Public tag timelines. /api/v2/search needs auth; these genuinely don't."""
    out = []
    instances = ("fosstodon.org", "mastodon.social", "hachyderm.io")
    tags = ("programming", "coding", "softwaredevelopment", "webdev")
    for instance in instances:
        for tag in tags:
            data, err = get_json(
                f"https://{instance}/api/v1/timelines/tag/{tag}?limit=40"
            )
            if err:
                errors.append(f"mastodon[{instance}/{tag}]: {err}")
                continue
            for status in data if isinstance(data, list) else []:
                if status.get("reblog"):
                    continue  # boosts aren't conversations to join
                posted = parse_ts(status.get("created_at"))
                if not fresh_enough(posted):
                    continue
                body = strip_html(status.get("content"))
                score, matched = score_text(body, terms)
                if score < terms["min_score"]:
                    continue
                out.append(
                    {
                        "id": f"mastodon:{status.get('uri') or status.get('id')}",
                        "source": "mastodon",
                        "title": body[:120],
                        "url": status.get("url") or status.get("uri") or "",
                        "author": (status.get("account") or {}).get("acct", ""),
                        "excerpt": body[:600],
                        "score": score,
                        "matched": matched,
                        "engagement": (status.get("replies_count") or 0)
                        + (status.get("favourites_count") or 0),
                        "posted_at": (posted or now_utc()).isoformat(),
                    }
                )
    return out


"""Subreddits worth listening to, as ONE multireddit request.

Reddit rate-limits unauthenticated access hard from this box: six sequential
`/r/<sub>/new.rss` fetches 2s apart all returned 429, while single requests
spaced ~75s apart returned 200. A multireddit URL (`/r/a+b+c/new.rss`) collapses
the whole set into a single request per run, which keeps this comfortably inside
whatever the limit is at four runs a day.

This is why the JSON API is not used: `www.reddit.com/r/x/new.json` and
`oauth.reddit.com` both 403 outright without a registered app, but the RSS feed
is served. If Reddit tightens this, the fix is a registered OAuth script app
(free, 100 QPM) — Nick has to create it, and that also unlocks search.
"""
REDDIT_SUBS = (
    "programming",
    "learnprogramming",
    "ExperiencedDevs",
    "webdev",
    "compsci",
)

ATOM_NS = {"a": "http://www.w3.org/2005/Atom"}


# Seconds to wait between the two Reddit requests. Measured 2026-08-27 on this
# box: six sequential listing-feed fetches 2s apart ALL returned 429, while six
# spaced 75s apart ALL returned 200 (6/6). 40s is a deliberate compromise — the
# run stays under a minute and the second request is the expendable one.
REDDIT_REQUEST_SPACING = 40


def _reddit_feed_urls():
    """Listing feeds only. `search.rss` is deliberately not used.

    Two measurements, both from this box on 2026-08-27:

    - `search.rss` is throttled far harder than listing feeds. It returned 429
      while `new.rss` returned 200 in the same moment, and 429'd again after a
      70s wait. It is not dependable enough to build on.
    - `/new` across all five subs produced ZERO keyword hits from 100 posts.
      It is a firehose of routine questions.

    So: `hot` first (the threads with actual discussion, which is what is worth
    replying to anyway), `new` second to catch things on the way up. Yield is
    genuinely lower than the other sources — filtering a firehose is a worse
    shape than searching, and the real fix is a registered OAuth script app
    (free, 100 QPM, unlocks proper search). Nick has to create that.
    """
    subs = "+".join(REDDIT_SUBS)
    return [
        ("hot", f"https://www.reddit.com/r/{subs}/hot.rss?limit=100"),
        ("new", f"https://www.reddit.com/r/{subs}/new.rss?limit=100"),
    ]


def src_reddit(terms, errors):
    """Reddit via public Atom listing feeds, at most two requests per run."""
    import xml.etree.ElementTree as ET

    out = []
    entries = []
    for index, (label, url) in enumerate(_reddit_feed_urls()):
        if index:
            time.sleep(REDDIT_REQUEST_SPACING)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                raw = resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as exc:
            # 429 is the expected failure and is not worth alarming about — it
            # just means this run listens to the other four sources.
            errors.append(f"reddit[{label}]: HTTP {exc.code}")
            continue
        except (urllib.error.URLError, OSError) as exc:
            errors.append(f"reddit[{label}]: {type(exc).__name__}: {exc}")
            continue
        try:
            entries.extend(ET.fromstring(raw).findall("a:entry", ATOM_NS))
        except ET.ParseError as exc:
            errors.append(f"reddit[{label}]: feed is not valid XML ({exc})")

    for entry in entries:
        def text_of(tag):
            node = entry.find(f"a:{tag}", ATOM_NS)
            return (node.text or "").strip() if node is not None else ""

        native_id = text_of("id")  # e.g. t3_1abc2de
        title = text_of("title")
        posted = parse_ts(text_of("updated") or text_of("published"))
        if not fresh_enough(posted):
            continue

        link_node = entry.find("a:link", ATOM_NS)
        link = link_node.get("href") if link_node is not None else ""
        if not link:
            continue

        content_node = entry.find("a:content", ATOM_NS)
        body = strip_html(content_node.text if content_node is not None else "")

        author_node = entry.find("a:author/a:name", ATOM_NS)
        author = (author_node.text or "").strip() if author_node is not None else ""

        score, matched = score_text(f"{title} {body}", terms)
        if score < terms["min_score"]:
            continue

        out.append(
            {
                "id": f"reddit:{native_id or link}",
                "source": "reddit",
                "title": title,
                "url": link,
                "author": author,
                "excerpt": body[:600],
                "score": score,
                "matched": matched,
                "engagement": 0,  # not exposed in the Atom feed
                "posted_at": (posted or now_utc()).isoformat(),
            }
        )
    return out


SOURCES = {
    "hackernews": src_hackernews,
    "lobsters": src_lobsters,
    "lemmy": src_lemmy,
    "mastodon": src_mastodon,
    "reddit": src_reddit,
}


# --------------------------------------------------------------------------
# commands
# --------------------------------------------------------------------------


def prune_stale(conn):
    """Drop pending items the agent has had several chances to use and passed on."""
    cutoff = (now_utc() - timedelta(hours=PENDING_TTL_HOURS)).isoformat()
    cur = conn.execute(
        "DELETE FROM items WHERE delivered_at IS NULL AND found_at < ?", (cutoff,)
    )
    return cur.rowcount


def cmd_collect(args):
    terms = load_terms()
    conn = db_connect()
    errors = []
    added = 0
    per_source = {}
    pruned = prune_stale(conn)

    for name, fn in SOURCES.items():
        try:
            found = fn(terms, errors)
        except Exception as exc:  # a broken source must not kill the whole run
            errors.append(f"{name}: unhandled {type(exc).__name__}: {exc}")
            continue
        found.sort(key=lambda i: (-i["score"], -i.get("engagement", 0)))
        kept = 0
        for item in found[:PER_SOURCE_CAP]:
            if not item.get("url"):
                continue
            if enqueue(conn, item):
                added += 1
                kept += 1
        per_source[name] = kept

    conn.commit()

    # Every source failing at once means the network or this script is broken,
    # not that the internet went quiet. That is worth an email; a single flaky
    # source is not.
    if len(errors) >= len(SOURCES) and added == 0:
        print("DailyCoder social listener: every source failed.")
        for err in errors:
            print(f"  - {err}")
        return 1

    if args.verbose:
        pending = conn.execute(
            "SELECT COUNT(*) FROM items WHERE delivered_at IS NULL"
        ).fetchone()[0]
        print(
            f"added {added} ({per_source}), pruned {pruned}, "
            f"pending {pending}, errors {len(errors)}"
        )
        for err in errors:
            print(f"  - {err}")

    # Silence is the healthy state.
    return 0


def cmd_report(args):
    conn = db_connect()
    rows = conn.execute(
        """SELECT * FROM items
           WHERE delivered_at IS NULL
           ORDER BY score DESC, engagement DESC, found_at DESC
           LIMIT ?""",
        (args.limit,),
    ).fetchall()
    def ap_uri(row):
        """Mastodon ids are 'mastodon:<activitypub uri>', and the digest needs
        that uri to build an /authorize_interaction link — the thing that opens
        a remote post inside Nick's OWN instance so he can reply as himself.
        Guarded because the collector falls back to a numeric id when a status
        carries no uri, and feeding that to authorize_interaction just errors."""
        if row["source"] != "mastodon":
            return None
        candidate = row["id"].split(":", 1)[1] if ":" in row["id"] else ""
        return candidate if candidate.startswith("http") else None

    payload = [
        {
            "id": r["id"],
            "source": r["source"],
            "title": r["title"],
            "url": r["url"],
            "uri": ap_uri(r),
            "author": r["author"],
            "excerpt": r["excerpt"],
            "score": r["score"],
            "matched": (r["matched"] or "").split(",") if r["matched"] else [],
            "engagement": r["engagement"],
            "posted_at": r["posted_at"],
        }
        for r in rows
    ]
    print(json.dumps({"pending": len(payload), "items": payload}, indent=2))
    return 0


def cmd_mark_delivered(args):
    ids = [line.strip() for line in sys.stdin if line.strip()]
    if not ids:
        print("no ids on stdin", file=sys.stderr)
        return 1
    conn = db_connect()
    stamp = now_utc().isoformat()
    conn.executemany(
        "UPDATE items SET delivered_at = ? WHERE id = ? AND delivered_at IS NULL",
        [(stamp, i) for i in ids],
    )
    conn.commit()
    print(f"marked {conn.total_changes} of {len(ids)} delivered")
    return 0


def cmd_stats(args):
    conn = db_connect()
    total = conn.execute("SELECT COUNT(*) FROM items").fetchone()[0]
    pending = conn.execute(
        "SELECT COUNT(*) FROM items WHERE delivered_at IS NULL"
    ).fetchone()[0]
    print(f"db      {DB_PATH}")
    print(f"total   {total}")
    print(f"pending {pending}")
    print("\nby source (pending):")
    for row in conn.execute(
        """SELECT source, COUNT(*) n, MAX(score) top FROM items
           WHERE delivered_at IS NULL GROUP BY source ORDER BY n DESC"""
    ):
        print(f"  {row['source']:<12} {row['n']:>4}  top score {row['top']}")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", action="store_true", help="emit pending queue as JSON")
    parser.add_argument("--mark-delivered", action="store_true", help="ids on stdin")
    parser.add_argument("--stats", action="store_true")
    parser.add_argument("--limit", type=int, default=40)
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    if args.report:
        return cmd_report(args)
    if args.mark_delivered:
        return cmd_mark_delivered(args)
    if args.stats:
        return cmd_stats(args)
    return cmd_collect(args)


if __name__ == "__main__":
    sys.exit(main())
