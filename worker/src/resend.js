/* Minimal Resend REST client.

   Contact model: subscribers live in an **Audience** (an explicit list), so
   membership is something we manage — contacts are added to
   `RESEND_AUDIENCE_ID` on confirmation. We deliberately do NOT set custom
   contact properties: Resend requires each property to be declared on the
   audience first, and an undeclared one fails the whole create with a 422. */

const RESEND_API = "https://api.resend.com";

async function resendFetch(env, path, init = {}) {
  const res = await fetch(RESEND_API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* fall through */
  }
  if (!res.ok) {
    const err = new Error(
      `Resend ${init.method || "GET"} ${path} → ${res.status}: ${
        json?.message || text.slice(0, 300)
      }`
    );
    err.status = res.status;
    throw err;
  }
  return json;
}

/** One-off transactional email (used for the confirmation message). */
export async function sendEmail(env, { to, subject, html, text, headers }) {
  return resendFetch(env, "/emails", {
    method: "POST",
    body: JSON.stringify({
      from: env.FROM_ADDRESS,
      to: [to],
      subject,
      html,
      ...(text ? { text } : {}),
      ...(headers ? { headers } : {}),
    }),
  });
}

/**
 * Add the confirmed subscriber to the audience. Re-adding an existing contact
 * is how a re-subscribe clears the unsubscribed flag, so this is idempotent:
 * both a fresh add and an existing address end with them subscribed.
 * @returns {Promise<string|null>} the Resend contact id, if we got one
 */
export async function upsertContact(env, email) {
  const json = await resendFetch(
    env,
    `/audiences/${env.RESEND_AUDIENCE_ID}/contacts`,
    {
      method: "POST",
      body: JSON.stringify({ email: email.toLowerCase(), unsubscribed: false }),
    }
  );
  return json?.id || null;
}

export async function unsubscribeContact(env, email) {
  try {
    return await resendFetch(
      env,
      `/audiences/${env.RESEND_AUDIENCE_ID}/contacts/${encodeURIComponent(
        email.toLowerCase()
      )}`,
      { method: "PATCH", body: JSON.stringify({ unsubscribed: true }) }
    );
  } catch (err) {
    // A contact that never confirmed won't be in the audience — fine by us.
    if (err.status === 404) return null;
    throw err;
  }
}

/** Create and immediately send the daily broadcast to the audience. */
export async function sendBroadcast(env, { subject, html, text }) {
  return resendFetch(env, "/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      audience_id: env.RESEND_AUDIENCE_ID,
      from: env.FROM_ADDRESS,
      reply_to: env.REPLY_TO || undefined,
      subject,
      html,
      ...(text ? { text } : {}),
      send: true,
    }),
  });
}
