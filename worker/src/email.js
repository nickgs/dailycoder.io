/* Email + landing-page HTML.

   Email clients are a hostile rendering target: no <style> reliability in
   Gmail/Outlook, no flexbox, no CSS vars. Everything below is table layout +
   inline styles on purpose. Palette matches assets/styles.css. */

const PAPER = "#f4ece0";
const CARD = "#fbf6ee";
const INK = "#2b2622";
const INK_SOFT = "#6b6157";
const RULE = "#d8cab4";
const TERRACOTTA = "#a8512c";
const SAGE = "#6f8c6a";
const SERIF = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, monospace";

export function esc(s) {
  return String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );
}

/* ---------- shared chrome ---------- */

function shell(inner, { preheader = "" } = {}) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
</head>
<body style="margin:0;padding:0;background:${PAPER};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CARD};border:1px solid ${RULE};border-radius:10px;">
${inner}
</table>
</td></tr></table>
</body></html>`;
}

/* Transactional mail gets a plain sign-off — there is no list to leave yet. */
function plainFooter(contact) {
  return `<tr><td style="padding:20px 30px 24px;border-top:1px solid ${RULE};font-family:${SANS};font-size:12px;color:${INK_SOFT};" align="center">
  <a href="https://dailycoder.io" style="color:${TERRACOTTA};text-decoration:none;">dailycoder.io</a>
  ${contact ? `<div style="padding-top:8px;color:#8d8378;font-size:11px;">${esc(contact)}</div>` : ""}
</td></tr>`;
}

function masthead(subtitle) {
  return `<tr><td style="padding:26px 30px 14px;border-bottom:1px solid ${RULE};" align="center">
  <div style="font-family:${SERIF};font-size:27px;font-weight:700;color:${INK};letter-spacing:-.3px;">The Daily Coder<span style="color:${TERRACOTTA};">.</span></div>
  <div style="font-family:${SANS};font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${INK_SOFT};padding-top:6px;">${esc(subtitle)}</div>
</td></tr>`;
}

function footer({ unsubscribeUrl, contact }) {
  return `<tr><td style="padding:22px 30px 26px;border-top:1px solid ${RULE};font-family:${SANS};font-size:12px;line-height:1.7;color:${INK_SOFT};" align="center">
  <a href="https://dailycoder.io" style="color:${TERRACOTTA};text-decoration:none;">dailycoder.io</a>
  &nbsp;·&nbsp;
  <a href="https://segosolutions.com" style="color:${TERRACOTTA};text-decoration:none;">Sego Solutions</a>
  <div style="padding-top:10px;">
    <a href="${unsubscribeUrl}" style="color:${INK_SOFT};text-decoration:underline;">Unsubscribe</a>
    — no hard feelings, your brain is already limber.
  </div>
  ${contact ? `<div style="padding-top:10px;color:#8d8378;font-size:11px;">${esc(contact)}</div>` : ""}
</td></tr>`;
}

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto 2px;"><tr>
    <td style="background:${TERRACOTTA};border-radius:7px;">
      <a href="${href}" style="display:inline-block;padding:13px 30px;font-family:${SANS};font-size:15px;font-weight:600;color:#fff;text-decoration:none;">${esc(label)}</a>
    </td></tr></table>`;
}

/* ---------- 1. double opt-in confirmation ---------- */

export function confirmEmail({ confirmUrl, contact }) {
  const html = shell(
    masthead("Confirm your subscription") +
      `<tr><td style="padding:28px 34px 10px;font-family:${SANS};font-size:16px;line-height:1.65;color:${INK};">
    <p style="margin:0 0 16px;">One click and tomorrow's puzzle lands with your coffee.</p>
    <p style="margin:0 0 22px;color:${INK_SOFT};font-size:15px;">We use confirmed opt-in, so nothing gets sent until you press this:</p>
  </td></tr>
  <tr><td style="padding:0 34px 24px;" align="center">${button(confirmUrl, "Confirm my subscription")}
    <div style="font-family:${SANS};font-size:12px;color:${INK_SOFT};padding-top:14px;">If you didn't sign up, just ignore this — you won't hear from us again.</div>
  </td></tr>` +
      plainFooter(contact),
    { preheader: "Confirm your subscription to The Daily Coder" }
  );

  const text = `The Daily Coder — confirm your subscription

One click and tomorrow's puzzle lands with your coffee:
${confirmUrl}

If you didn't sign up, ignore this and you won't hear from us again.
dailycoder.io${contact ? `\n${contact}` : ""}`;

  return { html, text };
}

/* ---------- 2. the daily puzzle ---------- */

function examplesBlock(examples = []) {
  if (!examples.length) return "";
  const rows = examples
    .map(
      (ex) => `<tr>
      <td width="34" style="width:34px;padding:5px 12px 5px 0;font-family:${MONO};font-size:12px;color:${INK_SOFT};white-space:nowrap;vertical-align:top;">in</td>
      <td style="padding:5px 0;font-family:${MONO};font-size:13px;color:${INK};">${esc(ex.in)}</td></tr>
    <tr>
      <td width="34" style="width:34px;padding:0 12px 12px 0;font-family:${MONO};font-size:12px;color:${SAGE};white-space:nowrap;vertical-align:top;">out</td>
      <td style="padding:0 0 12px;font-family:${MONO};font-size:13px;color:${INK};">${esc(ex.out)}</td></tr>`
    )
    .join("");
  return `${subhead("Examples")}
  <tr><td style="padding:0 34px 6px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${PAPER};border:1px solid ${RULE};border-radius:8px;padding:12px 16px;">
      ${rows}
    </table></td></tr>`;
}

function subhead(label) {
  return `<tr><td style="padding:18px 34px 8px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:${TERRACOTTA};">${esc(label)}</td></tr>`;
}

/**
 * @param {object} c        a challenge object from challenges.js
 * @param {string} unsubscribeUrl  Resend merge tag, or a real URL for previews
 */
export function dailyEmail(c, { unsubscribeUrl, contact, siteUrl = "https://dailycoder.io" }) {
  const permalink = `${siteUrl}/?p=${encodeURIComponent(c.id)}`;
  const prettyDate = new Date(c.date + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const badges = [
    c.difficulty,
    `~${c.minutes} min`,
    ...(c.tags || []).map((t) => `#${t}`),
  ]
    .map(
      (b) =>
        `<span style="display:inline-block;font-family:${SANS};font-size:11px;color:${INK_SOFT};border:1px solid ${RULE};border-radius:20px;padding:3px 11px;margin:0 5px 6px 0;">${esc(b)}</span>`
    )
    .join("");

  const inner =
    masthead(prettyDate) +
    `<tr><td style="padding:26px 34px 0;">${badges}</td></tr>
  <tr><td style="padding:6px 34px 0;font-family:${SERIF};font-size:26px;line-height:1.25;font-weight:700;color:${INK};">${esc(c.title)}</td></tr>
  <tr><td style="padding:10px 34px 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK_SOFT};font-style:italic;">${esc(c.blurb)}</td></tr>
  <tr><td style="padding:18px 34px 0;font-family:${SANS};font-size:16px;line-height:1.7;color:${INK};">${esc(c.prompt).replace(/\n\n/g, "</p><p style=\"margin:14px 0 0;\">").replace(/\n/g, "<br>")}</td></tr>
  ${examplesBlock(c.examples)}
  ${
    (c.constraints || []).length
      ? subhead("Constraints") +
        `<tr><td style="padding:0 34px;font-family:${SANS};font-size:14px;line-height:1.7;color:${INK_SOFT};">
      <ul style="margin:0;padding-left:20px;">${c.constraints.map((x) => `<li style="margin:0 0 5px;">${esc(x)}</li>`).join("")}</ul>
    </td></tr>`
      : ""
  }
  <tr><td style="padding:20px 34px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${PAPER};border-left:3px solid ${SAGE};border-radius:0 8px 8px 0;">
      <tr><td style="padding:14px 18px;font-family:${SANS};font-size:14px;line-height:1.65;color:${INK_SOFT};">
        <span style="display:block;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${SAGE};padding-bottom:5px;">Why this is good for your brain</span>
        ${esc(c.whyItMatters)}
      </td></tr></table></td></tr>
  <tr><td style="padding:26px 34px 8px;" align="center">${button(permalink, "Hint & solution on the site →")}</td></tr>
  <tr><td style="padding:0 34px 26px;font-family:${SANS};font-size:13px;color:${INK_SOFT};" align="center">
    Sit with it over your coffee first. The solution isn't going anywhere.
  </td></tr>` +
    footer({ unsubscribeUrl, contact });

  const text = `THE DAILY CODER — ${prettyDate}

${c.title}
${c.blurb}

${c.prompt}

EXAMPLES
${(c.examples || []).map((ex) => `  in:  ${ex.in}\n  out: ${ex.out}`).join("\n\n")}

CONSTRAINTS
${(c.constraints || []).map((x) => `  - ${x}`).join("\n")}

WHY THIS IS GOOD FOR YOUR BRAIN
${c.whyItMatters}

Hint & solution: ${permalink}

—
dailycoder.io · Unsubscribe: ${unsubscribeUrl}${contact ? `\n${contact}` : ""}`;

  return {
    subject: `${c.title} — your ${prettyDate.split(",")[0].toLowerCase()} puzzle ☕`,
    html: shell(inner, { preheader: c.blurb }),
    text,
  };
}

/* ---------- 3. landing pages (confirm / unsubscribe results) ---------- */

export function pageHTML({ title, heading, body, cta }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · The Daily Coder</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☕</text></svg>">
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:${PAPER};color:${INK};font-family:${SANS};padding:24px;}
  .card{max-width:460px;width:100%;background:${CARD};border:1px solid ${RULE};border-radius:12px;
        padding:40px 34px;text-align:center;box-shadow:0 12px 30px -18px rgba(43,38,34,.45);}
  .logo{font-family:${SERIF};font-size:24px;font-weight:700;margin-bottom:26px;}
  .logo span{color:${TERRACOTTA};}
  h1{font-family:${SERIF};font-size:26px;margin:0 0 12px;}
  p{color:${INK_SOFT};line-height:1.65;margin:0 0 22px;font-size:15px;}
  a.btn{display:inline-block;background:${TERRACOTTA};color:#fff;text-decoration:none;
        padding:12px 26px;border-radius:7px;font-weight:600;font-size:15px;}
</style></head>
<body><div class="card">
  <div class="logo">The Daily Coder<span>.</span></div>
  <h1>${esc(heading)}</h1>
  <p>${body}</p>
  ${cta ? `<a class="btn" href="${cta.href}">${esc(cta.label)}</a>` : ""}
</div></body></html>`;
}
