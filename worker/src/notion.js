/* Minimal Notion REST client — just the four calls this Worker needs.
   Pinned to API version 2022-06-28 (stable database_id semantics). */

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

async function notionFetch(env, path, init = {}) {
  const res = await fetch(NOTION_API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON error body — fall through to the throw below */
  }
  if (!res.ok) {
    throw new Error(
      `Notion ${init.method || "GET"} ${path} → ${res.status}: ${
        json?.message || text.slice(0, 300)
      }`
    );
  }
  return json;
}

/** @returns {Promise<{id: string, status: string} | null>} */
export async function findSubscriber(env, email) {
  const json = await notionFetch(env, `/databases/${env.NOTION_DB_ID}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: { property: "Email", title: { equals: email.toLowerCase() } },
      page_size: 1,
    }),
  });
  const page = json.results?.[0];
  if (!page) return null;
  return {
    id: page.id,
    status: page.properties?.Status?.select?.name || null,
  };
}

export async function createSubscriber(env, { email, country }) {
  const json = await notionFetch(env, "/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: env.NOTION_DB_ID },
      properties: {
        Email: { title: [{ text: { content: email.toLowerCase() } }] },
        Status: { select: { name: "Pending" } },
        "Subscribed At": { date: { start: new Date().toISOString() } },
        Source: { select: { name: "site" } },
        ...(country
          ? { Country: { rich_text: [{ text: { content: country } }] } }
          : {}),
      },
    }),
  });
  return json.id;
}

/**
 * @param {Record<string, any>} props already-shaped Notion property values
 */
export async function updateSubscriber(env, pageId, props) {
  return notionFetch(env, `/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: props }),
  });
}

export async function markActive(env, pageId, resendContactId) {
  return updateSubscriber(env, pageId, {
    Status: { select: { name: "Active" } },
    "Confirmed At": { date: { start: new Date().toISOString() } },
    ...(resendContactId
      ? {
          "Resend Contact ID": {
            rich_text: [{ text: { content: resendContactId } }],
          },
        }
      : {}),
  });
}

export async function markStatus(env, pageId, status, note) {
  return updateSubscriber(env, pageId, {
    Status: { select: { name: status } },
    ...(note ? { Notes: { rich_text: [{ text: { content: note } }] } } : {}),
  });
}
