# dailycoder-api

The backend for The Daily Coder: signup, double opt-in, unsubscribe sync, and
the 7am broadcast. Runs as a single Cloudflare Worker on `api.dailycoder.io`.

The **site itself does not move** — `dist/` still publishes to My Stack. My Stack
is static-only (no functions, no cron), which is the only reason this Worker
exists. It serves nothing but `/api/*`.

```
Browser ──POST /api/subscribe──▶ Worker ──▶ Notion row (Pending)
                                   └──────▶ Resend: confirmation email
Inbox ────GET /api/confirm──────▶ Worker ──▶ Notion row (Active)
                                   └──────▶ Resend: create contact
Cron 7am ET ───────────────────▶ Worker ──▶ fetch dailycoder.io/today.json
                                   └──────▶ Resend: broadcast to audience
Resend unsubscribe ────────────▶ Worker ──▶ Notion row (Unsubscribed)
```

## Setup, in order

Everything below needs accounts/keys only you can create. Steps 1–4 are one-time.

### 1. Resend — verify the domain

1. Create the account, add domain `dailycoder.io`.
2. Resend gives you DKIM + SPF records. Add them in **Cloudflare DNS** (the
   domain is already on Cloudflare nameservers). Set those records to
   **DNS-only, not proxied** — proxying breaks mail records.
3. Add a DMARC record while you're there:
   `_dmarc.dailycoder.io  TXT  "v=DMARC1; p=none; rua=mailto:nick@segosolutions.com"`
4. Wait for the domain to show **Verified**.

### 2. Resend — the audience

Subscribers live in a Resend **Audience** — an explicit list, not a rule-based
segment. `RESEND_AUDIENCE_ID` is already set to `2ec5097e-…` ("Dailycoder Subs").

The Worker manages membership itself: `POST /audiences/{id}/contacts` on
confirmation (idempotent — re-adding returns the same contact id), and
broadcasts target `audience_id`.

Do **not** add custom contact `properties`. Resend requires every property to be
declared on the audience first and 422s the whole create otherwise — that cost
an afternoon.

### 3. Notion — integration access

The database already exists:
**DailyCoder · Subscribers** — `3b7aa03c-c162-80d3-af1e-fe55d65fa3c2`

1. Create an internal integration at <https://www.notion.so/my-integrations>.
2. Copy its secret (`ntn_…`) — that's `NOTION_TOKEN`.
3. Open the database → **⋯ → Connections → Connect to** → your integration.
   **Without this step every Notion call 404s.**

### 4. Cloudflare — Worker, KV, DNS

```bash
cd worker
npm install
npx wrangler login

# KV: used for signup throttling + the once-per-day send lock
npx wrangler kv namespace create RATE_LIMIT
#   → paste the returned id into wrangler.jsonc kv_namespaces[0].id

# Secrets
npx wrangler secret put NOTION_TOKEN
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put SIGNING_SECRET        # openssl rand -hex 32
npx wrangler secret put ADMIN_SECRET          # openssl rand -hex 32
npx wrangler secret put RESEND_WEBHOOK_SECRET # from step 5, after deploying

npx wrangler deploy
```

Then in the Cloudflare dashboard, add the custom domain `api.dailycoder.io`
pointing at this Worker (Workers & Pages → dailycoder-api → Settings → Domains).

`CONTACT_LINE` carries the Sego postal address because US CAN-SPAM requires a
physical mailing address in commercial email. Don't reduce it to just an email.

**If a deploy seems to have no effect, suspect a stale bundle before debugging
the logic.** `wrangler deploy` has twice reported a fresh Version ID at 100%
while still serving the previous code. `/api/health` returns a `build` field for
exactly this reason — curl it after deploying. The fix is
`rm -rf .wrangler/tmp .wrangler/state` then redeploy.

### 5. Resend — webhook back to Notion

In Resend → Webhooks, add `https://api.dailycoder.io/api/resend-webhook` for
events `contact.updated`, `email.bounced`, `email.complained`. Copy the signing
secret (`whsec_…`) into `RESEND_WEBHOOK_SECRET` and redeploy.

This is what keeps Notion honest when someone unsubscribes from an email rather
than through our own link.

## Verifying before you trust it

```bash
curl https://api.dailycoder.io/api/health

# Real end-to-end signup — use an address you can open
curl -X POST https://api.dailycoder.io/api/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'
# → expect a Pending row in Notion + a confirmation email.
#   Click the link → row flips to Active, contact appears in Resend.

# Dry-run the daily send outside the 7am window (force skips the time and
# stale-content guards, so point it at a segment with only you in it first)
curl -X POST 'https://api.dailycoder.io/api/send-now?force=1' \
  -H "X-Admin-Secret: $ADMIN_SECRET"

npx wrangler tail   # watch the real 7am cron fire
```

Preview both emails locally without sending anything:

```bash
npm run preview-email && open .preview/daily.html
```

## Safety properties worth knowing

- **Nothing sends without double opt-in.** A row sits at `Pending` until a human
  clicks the emailed link; only then is a Resend contact created.
- **The send is fail-safe.** If `today.json` isn't dated today — the content
  agent failed, the publish didn't land — the cron sends nothing rather than
  re-mailing yesterday's puzzle.
- **Exactly one send per day.** Two crons fire (11:00 and 12:00 UTC) so one of
  them is always 7am ET across DST; the ET-hour check plus a KV `sent:<date>`
  lock mean only one does the work.
- **Tokens are stateless and signed.** Confirmation links expire in 14 days;
  neither confirm nor unsubscribe links can be forged without `SIGNING_SECRET`.
- **Signups never reveal list membership.** An already-subscribed address gets
  the same response as a new one.

## Env reference

| Name | Kind | What it's for |
|---|---|---|
| `NOTION_TOKEN` | secret | Notion integration secret |
| `RESEND_API_KEY` | secret | Resend API key |
| `SIGNING_SECRET` | secret | HMAC key for confirm/unsub tokens |
| `RESEND_WEBHOOK_SECRET` | secret | Svix signing secret |
| `ADMIN_SECRET` | secret | Guards `POST /api/send-now`; also unlocks `detail` on 500s |
| `NOTION_DB_ID` | var | Subscribers database |
| `RESEND_AUDIENCE_ID` | var | Broadcast target |
| `FROM_ADDRESS` | var | `The Daily Coder <puzzle@dailycoder.io>` |
| `REPLY_TO` | var | Where replies land |
| `CONTACT_LINE` | var | Contact line in the email footer |
| `SITE_URL` | var | Where `today.json` is fetched from |
| `API_BASE_URL` | var | Used to build confirm/unsub links |
| `ALLOWED_ORIGINS` | var | CORS allowlist for the signup form |
