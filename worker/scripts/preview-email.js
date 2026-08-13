/* Render both emails to ../.preview/*.html so you can open them in a browser
   (and drag them into Litmus/Mail) without deploying anything.

   Usage: npm run preview-email */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { confirmEmail, dailyEmail, pageHTML } from "../src/email.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const out = path.join(here, "../.preview");

// Reuse the real challenge data rather than a fixture, so the preview shows
// exactly what subscribers would get.
const challengesSrc = fs.readFileSync(
  path.join(repo, "assets/challenges.js"),
  "utf8"
);
const window = {};
new Function("window", challengesSrc)(window);
const puzzle = window.CHALLENGES[0];

const CONTACT = "Questions? info@segosolutions.com";

fs.mkdirSync(out, { recursive: true });

const confirm = confirmEmail({
  confirmUrl: "https://api.dailycoder.io/api/confirm?t=preview",
  contact: CONTACT,
});
fs.writeFileSync(path.join(out, "confirm.html"), confirm.html);
fs.writeFileSync(path.join(out, "confirm.txt"), confirm.text);

const daily = dailyEmail(puzzle, {
  unsubscribeUrl: "https://api.dailycoder.io/api/unsubscribe?t=preview",
  contact: CONTACT,
});
fs.writeFileSync(path.join(out, "daily.html"), daily.html);
fs.writeFileSync(path.join(out, "daily.txt"), daily.text);

fs.writeFileSync(
  path.join(out, "confirmed-page.html"),
  pageHTML({
    title: "You're in",
    heading: "You're in ☕",
    body: "Tomorrow morning at 7am ET, a fresh puzzle lands in your inbox.",
    cta: { href: "https://dailycoder.io", label: "Solve today's puzzle" },
  })
);

console.log(`Wrote previews to ${path.relative(repo, out)}/`);
console.log(`  daily subject: ${daily.subject}`);
