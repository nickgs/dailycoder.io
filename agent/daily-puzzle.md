# Morning routine — publish today's puzzle

Run this every morning at **6:15am ET**, 45 minutes ahead of the 7am send. The
Worker's cron reads `https://dailycoder.io/today.json`; if that file's `date`
isn't today, it deliberately sends nothing. So this routine finishing on time is
what makes the newsletter go out.

Working directory: `/Users/nickgs/Sites/dailycoder.io`

## Steps

1. **Read `assets/challenges.js`.** Note the last ~7 entries: their `difficulty`,
   their `tags`, and the shape of the problems. You are avoiding repetition.

2. **Write exactly one new challenge object** and prepend it to the array so it
   becomes `index[0]`. Match the schema documented at the top of that file. Use
   today's date in `YYYY-MM-DD` (America/New_York). The `id` is a kebab-case slug
   and must be unique across the whole file — it becomes the permalink
   (`dailycoder.io/?p=<id>`) that today's email links to.

   Do not touch any other file. Do not edit or reorder existing entries.

3. **Run `node build.js`.** It refuses to build if the newest entry isn't first,
   so a green build confirms the ordering. It writes `dist/index.html`,
   `dist/today.json`, and `dist/puzzles.json`.

4. **Publish `dist/`** to My Stack under project `dailycoder` (same project name
   updates the live site in place).

5. **Verify** — fetch `https://dailycoder.io/today.json` and confirm `date`
   matches today and `title` is the new puzzle. If it doesn't match, the send
   will skip; say so loudly rather than leaving it silent.

## Puzzle-quality guardrails

- **Hand-solvable in 5–15 minutes with pen and paper.** This is a warm-up, not
  an interview gauntlet. If it needs a whiteboard, it's too big.
- Always include every schema field: playful title, one-line blurb, 3 worked
  examples, constraints, a "why this is good for your brain" note, one hint, and
  a revealed solution with notes.
- **Rotate topics and difficulty.** Strings, arrays, stacks, bit tricks, binary
  search, math, greedy, recursion, hashing, two-pointers, simulation. Never run
  the same primary tag or the same difficulty two days in a row.
- Prompts are language-agnostic; the revealed solution is one clean JavaScript
  implementation.
- Aim for a small "oh, that's clever" turn — the moment a crossword clue clicks.
  A puzzle that's only tedious isn't worth a morning.
- The examples must be *correct*. Trace them by hand against your own solution
  before you write them down; a wrong worked example is the one mistake
  subscribers will definitely notice.

## If something goes wrong

Publishing a broken or duplicate puzzle is worse than publishing nothing — the
send is fail-safe by design. If you can't produce a puzzle you'd be happy to
receive, stop, leave `challenges.js` untouched, and report why. The Worker will
skip the send on its own and nobody gets a stale repeat.
