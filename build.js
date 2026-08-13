/* Builds the publishable dist/ for static hosting.

   Outputs:
     dist/index.html   one self-contained page (CSS + JS inlined, hero on CDN)
     dist/today.json   today's challenge alone — this is what the send Worker
                       fetches each morning, so it never has to parse HTML
     dist/puzzles.json the full archive, for anything else that wants the data

   Source stays multi-file; assets/challenges.js is still the only file the
   morning agent edits. */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const HERO_CDN =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3CUSATHTIYfywZxiRH7FtePKt0L/hf_20260627_153348_7b86b264-2f8f-4a4a-9c83-d8c0f25852de.png";
const API_BASE = process.env.DC_API_BASE || "https://api.dailycoder.io";

let html = read("index.html");
const css = read("assets/styles.css");
const challenges = read("assets/challenges.js");
const app = read("assets/app.js");

// Evaluate the data file so the build can derive real numbers and today.json.
const win = {};
new Function("window", challenges)(win);
const all = win.CHALLENGES || [];
if (!all.length) {
  console.error("build: assets/challenges.js produced no challenges — aborting.");
  process.exit(1);
}

// Newest first is an invariant the whole site depends on (index[0] = Today).
const sorted = [...all].sort((a, b) => (a.date < b.date ? 1 : -1));
if (sorted[0].id !== all[0].id) {
  console.error(
    `build: challenges are out of order — newest should be first, but ` +
      `"${sorted[0].id}" (${sorted[0].date}) sorts above "${all[0].id}" (${all[0].date}).`
  );
  process.exit(1);
}

const today = all[0];

// 1. inline stylesheet
html = html.replace(
  '<link rel="stylesheet" href="assets/styles.css" />',
  "<style>\n" + css + "\n</style>"
);

// 2. point hero at the CDN
html = html.replace('src="assets/img/hero.png"', 'src="' + HERO_CDN + '"');

// 3. inline scripts
html = html.replace(
  '<script src="assets/challenges.js"></script>\n  <script src="assets/app.js"></script>',
  "<script>\n" + challenges + "\n</script>\n  <script>\n" + app + "\n</script>"
);

// 4. bake in build-time values (API host, real puzzle count)
html = html
  .replace(/__API_BASE__/g, API_BASE)
  .replace(/__PUZZLE_COUNT__/g, String(all.length));

const dist = path.join(root, "dist");
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, "index.html"), html);
fs.writeFileSync(path.join(dist, "today.json"), JSON.stringify(today, null, 2));
fs.writeFileSync(path.join(dist, "puzzles.json"), JSON.stringify(all));

console.log(`Wrote dist/index.html (${html.length} bytes)`);
console.log(`Wrote dist/today.json  → ${today.date} · ${today.title}`);
console.log(`Wrote dist/puzzles.json (${all.length} puzzles)`);
