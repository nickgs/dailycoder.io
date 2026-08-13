# The Daily Coder ☕

A static "crossword for programmers" — one small, hand-solvable coding puzzle every
morning. The pitch: AI writes most of our code now, but solving little problems *by
hand* keeps your problem-solving sharp, the way a crossword keeps a writer's mind limber.

- **Sticky hook:** email newsletter ("get tomorrow's puzzle with your coffee") + a
  zero-login streak counter (localStorage).
- **Cross-promotion:** Sego Solutions footer placement.
- **Site:** static, hosted on My Stack. Solver state lives in the browser.
- **Newsletter:** a small Cloudflare Worker (`worker/`) on `api.dailycoder.io`
  handles signup, double opt-in, and the 7am broadcast. Subscribers live in
  Notion; Resend delivers.

## Files

```
index.html            # the page (multi-file source)
assets/styles.css     # cozy newspaper theme
assets/challenges.js  # THE DATA — the only file the morning agent edits
assets/app.js         # rendering, streaks, reveal gating, archive modal, signup
assets/img/hero.png   # hero illustration (Higgs-generated)
build.js              # → dist/index.html + today.json + puzzles.json
agent/daily-puzzle.md # the morning routine's instructions
worker/               # the newsletter backend (see worker/README.md)
dist/                 # build output, what gets published
```

## Local preview

```bash
node build.js                 # regenerate dist/index.html
python3 -m http.server 8000   # then open http://localhost:8000
```

(Open `index.html` directly too — it works from `file://` since the hero is a CDN URL
in the built version.)

## Publishing to My Stack

```bash
node build.js
# then ask Claude to publish, or run the push command it gives you:
#   npx -y -p @mystack.co/mcp mystack-push --dir ./dist --project dailycoder ...
```

Reusing the same project name updates the site in place.

## The daily loop

Two independent halves, on purpose — content is written by an agent, delivery is
deterministic. If the agent has an off day, nobody gets a stale repeat.

**6:15am ET · content** — a scheduled Claude routine following
[`agent/daily-puzzle.md`](agent/daily-puzzle.md):

1. Prepends one challenge object to `assets/challenges.js` (newest first).
   `index[0]` becomes "Today"; everything else falls into the archive. No other
   file changes — it's an append-only edit, about the safest automation there is.
2. Runs `node build.js`, which refuses to build if the ordering is wrong.
3. Publishes `dist/` to My Stack under project `dailycoder`.

**7:00am ET · delivery** — the Worker's cron fetches `dailycoder.io/today.json`,
and mails it to the Resend segment. If that file isn't dated today, it sends
nothing.

Wire the content half with `/schedule`; the delivery half is already a cron
trigger in `worker/wrangler.jsonc`.

## Still open

- **Puzzle-specific OG images** — link previews use the hero illustration for
  every puzzle. A per-puzzle card would share better.
- **Archive paging** — every puzzle ships inside `index.html`. Fine for a year or
  so of dailies, then it wants splitting.
- **`MAILING_ADDRESS`** in `worker/wrangler.jsonc` is still a placeholder and
  must be a real postal address before the first send (CAN-SPAM).
