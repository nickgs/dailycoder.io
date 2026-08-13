/* dailycoder-api — the whole backend for The Daily Coder.
   ------------------------------------------------------
   HTTP:
     POST /api/subscribe        signup form → Notion row (Pending) + confirm email
     GET  /api/confirm?t=…      double opt-in → Notion Active + Resend contact
     GET  /api/unsubscribe?t=…  our own unsub link (used in transactional mail)
     POST /api/resend-webhook   Resend → Notion (unsubscribes, bounces)
     POST /api/send-now         admin-only manual trigger for the daily send
     GET  /api/health

   Cron: fetches the published today.json and broadcasts it via Resend.
   The static site itself stays on My Stack — this Worker only serves /api. */

import { signToken, verifyToken, CONFIRM_TTL_DAYS } from "./tokens.js";
import {
  findSubscriber,
  createSubscriber,
  markActive,
  markStatus,
} from "./notion.js";
import {
  sendEmail,
  upsertContact,
  unsubscribeContact,
  sendBroadcast,
} from "./resend.js";
import { confirmEmail, dailyEmail, pageHTML } from "./email.js";

/* Deliberately strict but not clever: the real validation is that a human has
   to click a link in the inbox before anything is ever sent to them. */
const EMAIL_RE = /^[^\s@,;:<>()[\]\\]+@[^\s@.]+(\.[^\s@.]+)+$/;
const MAX_EMAIL_LEN = 254;

/* ---------------- small helpers ---------------- */

function corsHeaders(env, request) {
  const allowed = (env.ALLOWED_ORIGINS || "https://dailycoder.io")
    .split(",")
    .map((s) => s.trim());
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** Per-IP throttle. Fails open — a KV blip must never block a real signup. */
async function rateLimited(env, request, { key, limit, windowSec }) {
  if (!env.RATE_LIMIT) return false;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = `rl:${key}:${ip}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  try {
    const n = parseInt((await env.RATE_LIMIT.get(bucket)) || "0", 10);
    if (n >= limit) return true;
    await env.RATE_LIMIT.put(bucket, String(n + 1), { expirationTtl: windowSec * 2 });
  } catch {
    return false;
  }
  return false;
}

function apiBase(env, request) {
  return env.API_BASE_URL || new URL(request.url).origin;
}

/* ---------------- POST /api/subscribe ---------------- */

async function handleSubscribe(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: a real browser leaves this hidden field empty. Bots fill it in.
  // Answer 200 so the bot believes it succeeded and doesn't retry.
  if (body.company) return json({ ok: true, status: "pending" });

  const email = String(body.email || "").trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  if (await rateLimited(env, request, { key: "sub", limit: 5, windowSec: 3600 })) {
    return json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const country = request.headers.get("CF-IPCountry") || "";
  const existing = await findSubscriber(env, email);

  if (existing?.status === "Active") {
    // Don't leak list membership to a stranger typing addresses — same copy
    // either way; the inbox is what tells the truth.
    return json({ ok: true, status: "pending" });
  }

  if (!existing) {
    await createSubscriber(env, { email, country });
  } else if (existing.status !== "Pending") {
    // Previously unsubscribed or bounced and coming back: reset to Pending and
    // make them confirm again rather than silently re-adding them.
    await markStatus(env, existing.id, "Pending", "Re-subscribed via site");
  }

  const token = await signToken(
    { email, purpose: "confirm", ttlDays: CONFIRM_TTL_DAYS },
    env.SIGNING_SECRET
  );
  const confirmUrl = `${apiBase(env, request)}/api/confirm?t=${encodeURIComponent(token)}`;
  const { html: h, text } = confirmEmail({
    confirmUrl,
    contact: env.CONTACT_LINE,
  });

  await sendEmail(env, {
    to: email,
    subject: "Confirm your Daily Coder subscription ☕",
    html: h,
    text,
  });

  return json({ ok: true, status: "pending" });
}

/* ---------------- GET /api/confirm ---------------- */

async function handleConfirm(request, env) {
  const token = new URL(request.url).searchParams.get("t");
  const claims = await verifyToken(token, env.SIGNING_SECRET);

  if (!claims || claims.purpose !== "confirm") {
    return html(
      pageHTML({
        title: "Link expired",
        heading: "That link has expired",
        body: "Confirmation links are good for two weeks. Pop your email in again and we'll send a fresh one.",
        cta: { href: "https://dailycoder.io/#newsletter", label: "Try again" },
      }),
      400
    );
  }

  const row = await findSubscriber(env, claims.email);
  if (!row) {
    return html(
      pageHTML({
        title: "Not found",
        heading: "We couldn't find that signup",
        body: "It may have been removed. Signing up again takes five seconds.",
        cta: { href: "https://dailycoder.io/#newsletter", label: "Subscribe" },
      }),
      404
    );
  }

  const contactId = await upsertContact(env, claims.email);
  await markActive(env, row.id, contactId);

  return html(
    pageHTML({
      title: "You're in",
      heading: "You're in ☕",
      body: "Tomorrow morning at 7am ET, a fresh puzzle lands in your inbox. Ten quiet minutes, no leaderboard, no pressure.",
      cta: { href: "https://dailycoder.io", label: "Solve today's puzzle" },
    })
  );
}

/* ---------------- GET /api/unsubscribe ---------------- */

async function handleUnsubscribe(request, env) {
  const token = new URL(request.url).searchParams.get("t");
  const claims = await verifyToken(token, env.SIGNING_SECRET);

  if (!claims || claims.purpose !== "unsub") {
    return html(
      pageHTML({
        title: "Invalid link",
        heading: "That unsubscribe link isn't valid",
        body: 'Email <a href="mailto:info@segosolutions.com" style="color:#a8512c;">info@segosolutions.com</a> and we\'ll take you off by hand.',
      }),
      400
    );
  }

  const row = await findSubscriber(env, claims.email);
  if (row) await markStatus(env, row.id, "Unsubscribed", "Unsubscribed via email link");
  await unsubscribeContact(env, claims.email);

  return html(
    pageHTML({
      title: "Unsubscribed",
      heading: "You're unsubscribed",
      body: "No more morning puzzles. Your streak is safe in your browser if you ever wander back.",
      cta: { href: "https://dailycoder.io", label: "Visit the site" },
    })
  );
}

/* ---------------- POST /api/resend-webhook ----------------
   Resend signs webhooks with Svix. Verify before trusting anything. */

async function verifySvix(request, rawBody, secret) {
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return false;

  // Reject replays outside a 5-minute window.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const keyBytes = Uint8Array.from(
    atob(secret.replace(/^whsec_/, "")),
    (c) => c.charCodeAt(0)
  );
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`)
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  // Header holds space-separated "v1,<sig>" pairs — any match is valid.
  return signature
    .split(" ")
    .some((part) => part.split(",")[1] === expected);
}

async function handleWebhook(request, env) {
  const raw = await request.text();
  if (!env.RESEND_WEBHOOK_SECRET) {
    return json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
  }
  if (!(await verifySvix(request, raw, env.RESEND_WEBHOOK_SECRET))) {
    return json({ ok: false, error: "bad_signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  const email = (
    event?.data?.email ||
    event?.data?.to?.[0] ||
    ""
  ).toLowerCase();
  if (!email) return json({ ok: true, skipped: "no_email" });

  const STATUS_FOR = {
    "contact.updated": null, // resolved below — depends on the unsubscribed flag
    "email.bounced": "Bounced",
    "email.complained": "Unsubscribed",
  };

  let status = STATUS_FOR[event.type];
  if (event.type === "contact.updated") {
    status = event.data?.unsubscribed ? "Unsubscribed" : null;
  }
  if (!status) return json({ ok: true, skipped: event.type });

  const row = await findSubscriber(env, email);
  if (row) await markStatus(env, row.id, status, `Resend: ${event.type}`);
  return json({ ok: true });
}

/* ---------------- the daily send ---------------- */

function nowInET() {
  // Workers ship full ICU, so Intl handles EDT/EST for us.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

/**
 * @param {boolean} force  skip the 7am / already-sent guards (manual trigger)
 */
export async function runDailySend(env, { force = false } = {}) {
  const { date, hour } = nowInET();

  if (!force && hour !== 7) {
    return { sent: false, reason: `not 7am ET (currently ${hour}:00)` };
  }

  // Idempotency: two cron triggers fire (11:00 and 12:00 UTC) so that exactly
  // one of them is 7am ET year-round. This also protects against retries.
  const sentKey = `sent:${date}`;
  if (!force && env.RATE_LIMIT) {
    if (await env.RATE_LIMIT.get(sentKey)) {
      return { sent: false, reason: "already sent today" };
    }
  }

  const siteUrl = env.SITE_URL || "https://dailycoder.io";
  const res = await fetch(`${siteUrl}/today.json?cb=${Date.now()}`, {
    cf: { cacheTtl: 0 },
  });
  if (!res.ok) throw new Error(`today.json → ${res.status}`);

  // The static host serves index.html for unknown paths with a 200, so a
  // missing today.json arrives as HTML, not a 404. Parse defensively and treat
  // anything that isn't a real puzzle as "no content" — skip, don't crash.
  let puzzle;
  try {
    puzzle = JSON.parse(await res.text());
  } catch {
    return { sent: false, reason: "today.json is not JSON (SPA fallback? not published?)" };
  }
  for (const field of ["id", "date", "title", "prompt"]) {
    if (!puzzle?.[field]) {
      return { sent: false, reason: `today.json missing "${field}"` };
    }
  }

  // Never mail a stale puzzle. If the content agent didn't run, we stay quiet
  // rather than re-sending yesterday's to the whole list.
  if (!force && puzzle.date !== date) {
    return {
      sent: false,
      reason: `stale content: today.json is ${puzzle.date}, today is ${date}`,
    };
  }

  const { subject, html: body, text } = dailyEmail(puzzle, {
    unsubscribeUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
    contact: env.CONTACT_LINE,
    siteUrl,
  });

  const result = await sendBroadcast(env, { subject, html: body, text });

  if (env.RATE_LIMIT) {
    await env.RATE_LIMIT.put(sentKey, result?.id || "1", { expirationTtl: 60 * 60 * 72 });
  }
  return { sent: true, broadcastId: result?.id, date, subject };
}

/* ---------------- router ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(env, request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (url.pathname === "/api/health") {
        return json({ ok: true, time: new Date().toISOString(), build: "launch-2026-08-10" }, { headers: cors });
      }

      if (url.pathname === "/api/subscribe" && request.method === "POST") {
        const res = await handleSubscribe(request, env);
        for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
        return res;
      }

      if (url.pathname === "/api/confirm" && request.method === "GET") {
        return await handleConfirm(request, env);
      }

      if (url.pathname === "/api/unsubscribe" && request.method === "GET") {
        return await handleUnsubscribe(request, env);
      }

      if (url.pathname === "/api/resend-webhook" && request.method === "POST") {
        return await handleWebhook(request, env);
      }

      // Manual send trigger — handy for testing before you trust the cron.
      if (url.pathname === "/api/send-now" && request.method === "POST") {
        if (
          !env.ADMIN_SECRET ||
          request.headers.get("X-Admin-Secret") !== env.ADMIN_SECRET
        ) {
          return json({ ok: false, error: "unauthorized" }, { status: 401 });
        }
        const force = url.searchParams.get("force") === "1";
        return json(await runDailySend(env, { force }));
      }

      return json({ ok: false, error: "not_found" }, { status: 404, headers: cors });
    } catch (err) {
      console.error("dailycoder-api error:", err.stack || err.message);
      // Callers holding ADMIN_SECRET get the real message. `wrangler tail` is
      // unreliable for short-lived requests, and guessing at a 500 from the
      // outside is miserable — but the detail must never reach the public.
      const detail =
        env.ADMIN_SECRET && request.headers.get("X-Admin-Secret") === env.ADMIN_SECRET
          ? { detail: err.message }
          : {};
      return json(
        { ok: false, error: "server_error", ...detail },
        { status: 500, headers: cors }
      );
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runDailySend(env)
        .then((r) => console.log("daily send:", JSON.stringify(r)))
        .catch((e) => console.error("daily send failed:", e.stack || e.message))
    );
  },
};
