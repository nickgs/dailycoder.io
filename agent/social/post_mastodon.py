#!/usr/bin/env python3
"""Post ONE original status to Mastodon, with hard guardrails.

Nick authorised automated posting to @nulloperator@mastodon.social on
2026-08-27. This is the narrowest possible implementation of that, and the
narrowness is the point.

WHAT IT WILL DO
    Post an original status — the daily puzzle announcement — at most once a
    day, with a generative-AI disclosure appended.

WHAT IT REFUSES TO DO, in code, not by convention
    - Reply to anybody (`in_reply_to_id` is never set, and any text containing
      an @mention is rejected outright).
    - Post more than `max_per_day` times in a rolling day.
    - Post without a non-empty AI disclosure.
    - Post at all while `autopost.enabled` is false.

WHY THOSE SPECIFIC RULES

1. **Replies are the actual risk.** An automated account posting its own
   content on a schedule is ordinary and accepted on Mastodon. An automated
   account replying to strangers is a bot in the sense that gets reported,
   and Nick's stated worry — "I don't want to get in trouble with bots on
   these platforms" — is precisely that failure. Engagement replies stay in
   the digest email for him to send by hand.

2. **mastodon.social rule 1008 requires disclosing generative AI.** Quoted
   from the live instance rules on 2026-08-27: *"Content created by others
   must be attributed, and use of generative AI must be disclosed."* The
   DailyCoder puzzles are written by an LLM. Posting one automatically without
   saying so breaks a published rule of the instance hosting the account.

3. **The account is brand new** — created 2026-08-28, 0 followers, 0 statuses
   at the time this was written. A new account whose entire history is
   automated posts is the classic spam signature. See the README note in
   `agent/social-digest.md`; the honest advice is to post by hand for the first
   few weeks and turn this on once the account looks like a person.

CREDENTIAL
    Reads `MASTODON_ACCESS_TOKEN` from the environment — never a password, and
    never anything committed to this repo. Create it at
    mastodon.social → Preferences → Development → New application, with the
    single scope `write:statuses`. Revocable from that same screen without
    touching the account login.

USAGE
    echo "text to post" | post_mastodon.py            # respects all guards
    echo "text" | post_mastodon.py --dry-run          # render, post nothing
    post_mastodon.py --verify                         # check token + account
"""

import argparse
import json
import os
import re
import sqlite3
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ACCOUNTS_PATH = os.path.join(HERE, "accounts.json")

STATE_DIR = os.environ.get(
    "DC_SOCIAL_STATE", os.path.join(os.path.expanduser("~"), ".hermes", "state")
)
DB_PATH = os.path.join(STATE_DIR, "dailycoder_social.db")

MENTION_RE = re.compile(r"(?:^|[^\w/])@\w")
MAX_CHARS = 500  # mastodon.social default


def load_accounts():
    with open(ACCOUNTS_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def api(instance, path, token, data=None, method=None):
    url = f"https://{instance}{path}"
    body = urllib.parse.urlencode(data).encode() if data else None
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "dailycoder-social/0.1 (+https://dailycoder.io)",
        },
        method=method or ("POST" if body else "GET"),
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", "replace"))


def posts_today(conn):
    conn.execute(
        """CREATE TABLE IF NOT EXISTS autoposts (
               id TEXT PRIMARY KEY, platform TEXT, url TEXT, posted_at TEXT)"""
    )
    conn.commit()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    return conn.execute(
        "SELECT COUNT(*) FROM autoposts WHERE posted_at > ?", (cutoff,)
    ).fetchone()[0]


def record(conn, status):
    conn.execute(
        "INSERT OR REPLACE INTO autoposts VALUES (?,?,?,?)",
        (
            str(status.get("id")),
            "mastodon",
            status.get("url", ""),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    accounts = load_accounts()
    instance = (accounts.get("mastodon_instance") or "").strip().strip("/")
    cfg = accounts.get("autopost") or {}
    token = os.environ.get("MASTODON_ACCESS_TOKEN")

    if not instance:
        print("no mastodon_instance configured — nothing posted")
        return 1

    if args.verify:
        if not token:
            print("MASTODON_ACCESS_TOKEN is not set in this environment")
            return 1
        try:
            me = api(instance, "/api/v1/accounts/verify_credentials", token)
        except urllib.error.HTTPError as exc:
            print(f"token rejected: HTTP {exc.code} {exc.read()[:200]!r}")
            return 1
        print(f"token OK — @{me.get('acct')} on {instance}")
        print(f"  followers={me.get('followers_count')} statuses={me.get('statuses_count')}")
        print(f"  autopost.enabled={cfg.get('enabled')}")
        return 0

    text = sys.stdin.read().strip()
    if not text:
        print("nothing on stdin — nothing posted")
        return 1

    # ---- guardrails, checked before anything leaves this machine ----

    if not cfg.get("enabled"):
        print(
            "autopost.enabled is false in accounts.json — nothing posted.\n"
            "This is the safe default. Read the notes in that file before flipping it."
        )
        return 1

    if MENTION_RE.search(text):
        print(
            "REFUSED: text contains an @mention. This tool posts original statuses "
            "only — automated replies and mentions are exactly the behaviour that "
            "gets an account reported. Send it by hand from the digest instead."
        )
        return 1

    disclosure = (cfg.get("ai_disclosure") or "").strip()
    if not disclosure:
        print(
            "REFUSED: autopost.ai_disclosure is empty. mastodon.social rule 1008 "
            "requires disclosing use of generative AI, and the puzzles are "
            "LLM-written."
        )
        return 1

    full = f"{text}\n\n{disclosure}"
    if len(full) > MAX_CHARS:
        print(f"REFUSED: {len(full)} chars exceeds the {MAX_CHARS} limit")
        return 1

    conn = sqlite3.connect(DB_PATH, timeout=30)
    already = posts_today(conn)
    cap = int(cfg.get("max_per_day", 1))
    if already >= cap:
        print(f"REFUSED: already posted {already} time(s) in the last day (cap {cap})")
        return 1

    if args.dry_run:
        print(f"--- would post to @{accounts.get('mastodon_handle')}@{instance} ---")
        print(full)
        print(f"--- {len(full)} chars · {already}/{cap} used today · nothing sent ---")
        return 0

    if not token:
        print("MASTODON_ACCESS_TOKEN is not set — nothing posted")
        return 1

    try:
        status = api(
            instance,
            "/api/v1/statuses",
            token,
            data={"status": full, "visibility": "public"},
        )
    except urllib.error.HTTPError as exc:
        print(f"post failed: HTTP {exc.code} {exc.read()[:300]!r}")
        return 1
    except (urllib.error.URLError, OSError) as exc:
        print(f"post failed: {type(exc).__name__}: {exc}")
        return 1

    record(conn, status)
    print(f"posted: {status.get('url')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
