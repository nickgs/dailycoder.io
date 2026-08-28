# Morning routine — the DailyCoder social digest

Runs every morning at **8:05am ET** as the `dailycoder-social-digest` cron job
on libc-agents, after the 6:15 puzzle job and the 7:00 send. By the time this
runs, today's puzzle is live and mailed, so you can link to it.

**Working directory:** `/srv/agents/nick/repos/dailycoder`.

Your output is **an email to Nick, not a post to the internet.** Nothing you
write here is published by anyone but him, by hand, after reading it. Write
drafts he could send as-is — but assume he will read every word first, because
he will.

**You have no posting credentials and never will.** Nick posts from his own
logged-in accounts as himself, tapping a link in the email that opens a normal
compose box. That is a deliberate decision, not a missing feature: an automated
account replying to strangers is a bot, gets treated as one, and would put his
real accounts at risk. Do not propose automating the send, do not ask for API
tokens for posting, and do not write drafts that only make sense coming from a
bot.

He posts **as himself** — first person, his own 20+ years of building software
behind it. There is no separate DailyCoder brand persona.

## Steps

1. **`git pull`** so you're running the current scripts and vocabulary.

2. **Read the queue:**

   ```bash
   python3 agent/social/listen.py --report --limit 40
   ```

   That's JSON: `{"pending": N, "items": [...]}`. Each item has a `score` from
   cheap keyword matching, the `matched` terms, `source`, `url`, `excerpt` and
   `engagement`. **The score got it into the queue; it does not mean it's
   worth replying to.** Your job is the judgment the keyword filter can't do.

3. **Read today's puzzle** from `dist/today.json` (or fetch
   `https://dailycoder.io/today.json`) for its `title` and `id`. The permalink
   is `https://dailycoder.io/?p=<id>`.

4. **Pick at most 5 threads worth replying to.** Fewer is better. Zero is a
   legitimate answer on a quiet day — see "Silence" below.

5. **Draft one reply per thread**, in Nick's voice, following the rules below.

6. **Draft 1–2 standalone posts.** Usually today's puzzle. Suggest a platform
   and a rough time.

7. **Emit JSON on stdout and pipe it to the sender:**

   ```bash
   python3 agent/social/send_digest.py <<'EOF'
   { ...your JSON... }
   EOF
   ```

   Schema is documented at the top of `send_digest.py`. Use `--dry-run` first if
   you want to check the rendering; it sends nothing and marks nothing.

   **Three fields matter more than they look:**

   - **`id`** — copy it verbatim from the queue. It's what marks the item
     delivered so it never appears in a second digest. Get it wrong and Nick
     sees the same thread every morning until he stops reading the email.
   - **`uri`** — for Mastodon items only, pass the queue's `uri` straight
     through. It's what builds the one-tap "reply from your own account" link.
     Drop it and Nick gets a plain link to someone else's server, where he
     isn't logged in and can't reply without four more taps.
   - **`platform`** on each post — set it to `mastodon`, `bluesky` or
     `twitter` when the post is meant for one place, and leave it `null` when
     it suits all of them. `null` emits a compose button for every enabled
     platform, which is usually what you want for the daily puzzle.

## What makes a thread worth replying to

**The best target is someone worrying out loud that AI is eroding their craft.**
That's the conversation DailyCoder was built for. Its whole thesis is: *AI
writes most of our code now, and that's fine — but solving a small problem by
hand is to a programmer what a crossword is to a writer.* Someone articulating
half of that idea is not a lead, they're a person you can agree with usefully.

Also good: people asking how to keep their fundamentals sharp, people building
or discussing puzzle/kata sites, people running dev newsletters.

**Discard, every time:**

- **Self-promotional launches.** A "Show HN: I built an AI agent thing" that
  merely says "vibe coding" in its pitch is not a conversation, it's an ad. The
  keyword filter can't tell. You can.
- **Rage-bait and layoff news.** "CEO fires devs for AI" threads are 400
  comments of doom. Nothing Nick says there helps anyone or reaches anyone.
- **Threads where the honest reply is "yes, agreed."** If you can't add
  something concrete, there's no reply to draft.
- **Anything already 300+ comments deep.** He'd be shouting into a stadium.
- **Job posts, course sales, crypto.** The vocabulary file vetoes most of these
  already; catch the rest.

## Rules for the drafts themselves

**At most ONE of the replies may mention DailyCoder.** The others are genuine
contributions with no link at all. This is not modesty, it's the only version
that works: a person who replies to five threads a day with the same link is a
spammer and gets treated as one on every platform in this list. The one link,
in the one thread where it's actually the answer to what someone asked, is the
whole play.

**Nick's voice:** direct, concrete, a little dry. He has 20+ years of building
software and two decades running an IT department — he speaks from having done
the thing, not from having read about it. First person, specific, no hedging.

**Never:**
- Open with "Great point!" or "This resonates" or any LinkedIn throat-clearing.
- Use em-dashes as a tic, or the word "leverage", or "in today's fast-paced".
- Claim experience he doesn't have, or numbers that aren't real. If a draft
  needs a statistic to work, the draft is wrong.
- Write a reply longer than about 80 words. Nobody reads the long one.
- Pretend to be a disinterested party when recommending his own site. The one
  link should read as "I built a thing for exactly this" — honest and brief.

**In the `why` field**, tell Nick in one line why this thread and not the other
thirty. He's reading this on a phone between meetings and deciding in about two
seconds whether to tap through. "Top of HN, comments are full of the exact
skill-erosion worry" is useful. "Relevant to DailyCoder" is not.

## Silence

**A digest with zero engage items is a good outcome, not a failed run.** Send
it anyway — the empty state is rendered deliberately, and Nick knowing the
system looked and found nothing is worth more than a forced reply to a mediocre
thread. The failure mode that kills this system is him learning the email is
full of filler and stopping reading it.

If the queue is empty because the *collector* is broken (every source erroring,
`pending: 0` several days running), say so in `notes` — that's a real problem
and it looks exactly like a quiet week.

## Known gaps to mention in `notes` when relevant

- **Reddit and Bluesky are dark.** Both 403 without credentials, and both are
  where this audience actually lives. Reddit needs a registered script app
  (client id + secret); Bluesky needs an app password. Until then this listens
  to HN, Lobsters, Lemmy and Mastodon only — which is a real coverage gap, not
  a quiet internet.
- Tune `agent/social/terms.json` if the queue fills with the same kind of
  irrelevance repeatedly. It's read at runtime; no code change needed.
