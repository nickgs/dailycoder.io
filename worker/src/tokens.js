/* Stateless signed tokens.
   We never store a confirmation/unsubscribe token anywhere — the token IS the
   proof. Payload is HMAC-SHA256 signed with SIGNING_SECRET, so a token can be
   verified with nothing but the secret, and it expires on its own. */

const enc = new TextEncoder();

function b64urlEncode(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/* Constant-time compare — avoids leaking signature bytes via timing. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * @param {{email: string, purpose: "confirm"|"unsub", ttlDays?: number}} claims
 * @returns {Promise<string>} `<payload>.<signature>`
 */
export async function signToken({ email, purpose, ttlDays = 30 }, secret) {
  const payload = JSON.stringify({
    e: email.trim().toLowerCase(),
    p: purpose,
    x: Math.floor(Date.now() / 1000) + ttlDays * 86400,
  });
  const body = b64urlEncode(enc.encode(payload));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return body + "." + b64urlEncode(new Uint8Array(sig));
}

/**
 * @returns {Promise<{email: string, purpose: string} | null>} null when the
 *   token is malformed, tampered with, or expired.
 */
export async function verifyToken(token, secret) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const key = await hmacKey(secret);
  const expected = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  if (!timingSafeEqual(sig, b64urlEncode(new Uint8Array(expected)))) return null;

  let claims;
  try {
    claims = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
  } catch {
    return null;
  }
  if (!claims.e || !claims.p) return null;
  if (typeof claims.x === "number" && claims.x < Math.floor(Date.now() / 1000)) return null;

  return { email: claims.e, purpose: claims.p };
}

/* Unsubscribe tokens are long-lived: an unsub link sits in every email
   forever, so it must still work a year later. */
export const UNSUB_TTL_DAYS = 3650;
export const CONFIRM_TTL_DAYS = 14;
