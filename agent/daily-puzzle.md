# Morning routine — publish today's puzzle

Runs every morning at **6:15am ET**, 45 minutes ahead of the 7am send, as the
`dailycoder-daily-puzzle` cron job on libc-agents. The Worker's cron reads
`https://dailycoder.io/today.json`; if that file's `date` isn't today, it
deliberately sends nothing. So this routine finishing on time is what makes the
newsletter go out.

**Working directory:** the repo root — `/srv/agents/nick/repos/dailycoder` on
libc-agents. This checkout is the source of truth for `assets/challenges.js`;
Nick's Mac pulls from it. Always start from a clean `git pull`.

## Steps

1. **`git pull`** first, so you're not writing on top of a stale checkout.

2. **Read `assets/challenges.js`.** Note the last ~7 entries: their `difficulty`,
   their `tags`, and the shape of the problems. You are avoiding repetition.

3. **Write exactly one new challenge object** and prepend it to the array so it
   becomes `index[0]`. Match the schema documented at the top of that file. Use
   today's date in `YYYY-MM-DD` (America/New_York). The `id` is a kebab-case slug
   and must be unique across the whole file — it becomes the permalink
   (`dailycoder.io/?p=<id>`) that today's email links to.

   Do not touch any other file. Do not edit or reorder existing entries.

4. **Run `node build.js`.** It refuses to build if the newest entry isn't first,
   so a green build confirms the ordering. It writes `dist/index.html`,
   `dist/today.json`, and `dist/puzzles.json`.

5. **Publish `dist/`** to My Stack — same project name updates the live site in
   place:

   ```bash
   npx -y -p @mystack.co/mcp mystack-push --dir ./dist --project dailycoder
   ```

   `MYSTACK_API_KEY` and `MYSTACK_API_URL` are already in the job's environment.

6. **Verify** — fetch `https://dailycoder.io/today.json` and confirm `date`
   matches today and `title` is the new puzzle. If it doesn't match, the send
   will skip; say so loudly rather than leaving it silent.

   Note: My Stack serves `index.html` with a 200 for unknown paths, so a missing
   `today.json` arrives as HTML rather than a 404. If the response isn't valid
   JSON, treat that as a failed publish, not a puzzle problem.

7. **Commit and push** so the Mac and GitHub stay in sync:

   ```bash
   git add assets/challenges.js
   git commit -m "Puzzle for <YYYY-MM-DD> — <title>"
   git push
   ```

   Commit only `assets/challenges.js`. `dist/` is gitignored build output.

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

Never edit an existing puzzle to "fix" a bad run; that rewrites an archive entry
subscribers may already have solved. Prepend a new one tomorrow instead.
