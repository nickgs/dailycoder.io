/* DailyCoder.io — front-end logic (no backend, all localStorage) */
(function () {
  "use strict";

  var LS = {
    solved: "dc_solved",      // array of solved challenge ids
    streak: "dc_streak",      // { count, last }  last = YYYY-MM-DD
    email: "dc_subscribed"
  };

  // ---- tiny storage helpers ----
  function get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (e) { return fallback; }
  }
  function set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  // ---- date helpers ----
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function prettyDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }
  function shortDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }

  // ---- escape ----
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---- light JS syntax highlight (comments only, keeps it cozy not noisy) ----
  function highlight(code) {
    return esc(code).replace(/(\/\/[^\n]*)/g, '<span class="cmt">$1</span>');
  }

  var solved = get(LS.solved, []);

  function isSolved(id) { return solved.indexOf(id) !== -1; }

  function markSolved(id) {
    if (isSolved(id)) return;
    solved.push(id);
    set(LS.solved, solved);
    bumpStreak();
  }

  // ---- streak: counts consecutive days you marked something solved ----
  function bumpStreak() {
    var s = get(LS.streak, { count: 0, last: null });
    var t = todayISO();
    if (s.last === t) { /* already counted today */ }
    else if (s.last && daysBetween(s.last, t) === 1) { s.count += 1; s.last = t; }
    else { s.count = 1; s.last = t; }
    set(LS.streak, s);
    renderStreak();
  }

  function currentStreak() {
    var s = get(LS.streak, { count: 0, last: null });
    if (!s.last) return 0;
    var gap = daysBetween(s.last, todayISO());
    return gap <= 1 ? s.count : 0; // streak breaks after a missed day
  }

  function renderStreak() {
    var n = currentStreak();
    var el = document.getElementById("streak-chip");
    if (el) el.textContent = n > 0 ? "🔥 " + n + " day streak" : "🔥 Start your streak";
  }

  // ---- toast ----
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  // ---- render today's challenge ----
  function exampleRows(examples) {
    return examples.map(function (ex) {
      return '<div class="example">' +
        '<span class="lbl">in</span><span class="val">' + esc(ex.in) + "</span>" +
        '<span class="lbl">out</span><span class="val">' + esc(ex.out) + "</span>" +
        "</div>";
    }).join("");
  }

  function detailHTML(c, opts) {
    opts = opts || {};
    var solvedNow = isSolved(c.id);
    return (
      '<div class="badges">' +
        '<span class="badge diff-' + c.difficulty + '">' + c.difficulty + "</span>" +
        '<span class="badge">⏱ ~' + c.minutes + " min</span>" +
        c.tags.map(function (t) { return '<span class="badge">#' + esc(t) + "</span>"; }).join("") +
      "</div>" +
      "<h2>" + esc(c.title) + "</h2>" +
      '<p class="blurb">' + esc(c.blurb) + "</p>" +
      '<p class="prompt">' + esc(c.prompt) + "</p>" +
      '<div class="subhead">Examples</div>' +
      '<div class="examples">' + exampleRows(c.examples) + "</div>" +
      '<div class="subhead">Constraints</div>' +
      '<ul class="constraints">' +
        c.constraints.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
      "</ul>" +
      '<div class="why"><span class="why-label">Why this is good for your brain</span>' +
        esc(c.whyItMatters) + "</div>" +
      '<div class="reveal-row">' +
        '<button class="btn" data-act="hint">💡 Need a hint</button>' +
        '<button class="btn" data-act="solution">👀 Reveal solution</button>' +
        '<button class="btn btn-solved' + (solvedNow ? " is-done" : "") + '" data-act="solved">' +
          (solvedNow ? "✓ Solved" : "✓ I solved it") +
        "</button>" +
      "</div>" +
      '<div class="disclosure" data-disc="hint">' +
        '<div class="subhead">Hint</div>' +
        '<div class="hint-box">' + esc(c.hint) + "</div></div>" +
      '<div class="disclosure" data-disc="solution">' +
        '<div class="subhead">One way to solve it · ' + esc(c.solution.lang) + "</div>" +
        '<pre class="code">' + highlight(c.solution.code) + "</pre>" +
        '<p class="notes">' + esc(c.solution.notes) + "</p></div>"
    );
  }

  function wireDisclosures(root, c) {
    root.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      if (act === "hint" || act === "solution") {
        var disc = root.querySelector('[data-disc="' + act + '"]');
        disc.classList.toggle("open");
        if (disc.classList.contains("open")) disc.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else if (act === "solved") {
        markSolved(c.id);
        btn.classList.add("is-done");
        btn.textContent = "✓ Solved";
        toast("Nice. Streak counted for today 🔥");
        refreshArchiveStates();
      }
    });
  }

  // ---- archive ----
  function refreshArchiveStates() {
    document.querySelectorAll(".arch-card").forEach(function (card) {
      var id = card.getAttribute("data-id");
      card.classList.toggle("is-solved", isSolved(id));
    });
  }

  function openModal(c) {
    var modal = document.getElementById("modal-body");
    modal.innerHTML = detailHTML(c);
    wireDisclosures(modal, c);
    document.getElementById("modal-back").classList.add("open");
  }

  // ---- newsletter ----
  // API_BASE is substituted by build.js; running from source it stays as the
  // literal token, in which case we fall back to the production API.
  var API_BASE = "__API_BASE__".indexOf("__API") === 0
    ? "https://api.dailycoder.io"
    : "__API_BASE__";

  function wireNewsletter() {
    var form = document.getElementById("signup-form");
    if (!form) return;

    var input = form.querySelector('input[name="email"]');
    var button = form.querySelector("button");

    function fail(msg) {
      toast(msg);
      button.disabled = false;
      button.textContent = "Subscribe";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!email || email.indexOf("@") < 1) {
        toast("That doesn't look like an email address.");
        input.focus();
        return;
      }

      button.disabled = true;
      button.textContent = "Sending…";

      fetch(API_BASE + "/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          company: form.querySelector('input[name="company"]').value
        })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok, status: res.status, body: body };
          });
        })
        .then(function (r) {
          if (r.status === 429) return fail("Easy there — try again in a little while.");
          if (r.status === 400) return fail("That email address didn't validate.");
          if (!r.ok || !r.body.ok) return fail("Something broke on our end. Try again in a minute?");

          set(LS.email, email);
          form.innerHTML =
            '<div style="font-family:var(--mono);color:var(--sage);padding:6px 0;line-height:1.6;">' +
            "✓ Check your inbox — we sent a confirmation link.<br>" +
            '<span style="color:var(--ink-soft);font-size:13px;">' +
            "Click it and tomorrow's puzzle arrives at 7am." +
            "</span></div>";
        })
        .catch(function () {
          fail("Couldn't reach the server. Check your connection?");
        });
    });
  }

  // ---- boot ----
  document.addEventListener("DOMContentLoaded", function () {
    var data = window.CHALLENGES || [];
    if (!data.length) return;

    var today = data[0];
    var rest = data.slice(1);

    // edition line
    document.getElementById("edition-date").textContent = shortDate(today.date);
    document.getElementById("vol").textContent = "No. " + data.length;
    renderStreak();

    // today's card
    var card = document.getElementById("today-card");
    card.innerHTML = detailHTML(today);
    wireDisclosures(card, today);

    // archive
    var grid = document.getElementById("archive-grid");
    grid.innerHTML = rest.map(function (c) {
      return '<article class="card arch-card' + (isSolved(c.id) ? " is-solved" : "") +
        '" data-id="' + c.id + '">' +
        '<div class="date">' + shortDate(c.date) + "</div>" +
        "<h4>" + esc(c.title) + "</h4>" +
        '<div class="arch-blurb">' + esc(c.blurb) + "</div>" +
        '<div class="arch-foot">' +
          '<span class="badge diff-' + c.difficulty + '">' + c.difficulty + "</span>" +
          "<span>~" + c.minutes + " min</span>" +
        "</div></article>";
    }).join("");
    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".arch-card");
      if (!card) return;
      var id = card.getAttribute("data-id");
      var c = data.find(function (x) { return x.id === id; });
      if (c) openModal(c);
    });

    // modal close
    var back = document.getElementById("modal-back");
    document.getElementById("modal-close").addEventListener("click", function () { back.classList.remove("open"); });
    back.addEventListener("click", function (e) { if (e.target === back) back.classList.remove("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") back.classList.remove("open"); });

    wireNewsletter();

    // deep link: /?p=<challenge-id> opens that puzzle. This is what the daily
    // email links to, so a reader can jump straight to the hint and solution.
    var wanted = new URLSearchParams(location.search).get("p");
    if (wanted && wanted !== today.id) {
      var target = data.find(function (x) { return x.id === wanted; });
      if (target) openModal(target);
    }
  });
})();
