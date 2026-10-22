/* ==========================================================================
   Spidy ECE Prep - app shell: router, header tools, search, theme, account.
   Hash routes, ES modules, no build step (works on GitHub Pages).
   ========================================================================== */
import { store } from "./store.js";
import { initSync, onSync, signIn, signOut, importTracker, syncState } from "./sync.js";
import { SEARCH } from "./registry.js";
import { $, $$, esc, app, toast, icon, setTitle, ctx, openModal, closeModal, rerender } from "./ui.js";
import { dashboard } from "./views/dashboard.js";
import { learnIndex, trackPage, modulePage, lessonPage } from "./views/learn.js";
import { practicePage, questionPage, mockPage, revisePage } from "./views/practice.js";
import { labIndex, labPage } from "./views/lab.js";
import { interviewIndex, interviewRole } from "./views/interview.js";
import { plannerPage } from "./views/planner.js";
import { progressPage, aboutPage } from "./views/progress.js";

const ROUTES = {
  "": () => dashboard(),
  learn: (a) => !a[0] ? learnIndex() : trackPage(a[0]),
  m: (a) => modulePage(a[0], a[1] || "learn"),
  lesson: (a) => lessonPage(a[0]),
  practice: (a, q) => practicePage(q),
  q: (a, q) => questionPage(decodeURIComponent(a[0] || ""), q),
  mock: (a, q) => mockPage(a[0], q),
  revise: (a, q) => revisePage(q),
  lab: (a) => !a[0] ? labIndex() : labPage(a[0]),
  interview: (a, q) => !a[0] ? interviewIndex() : interviewRole(a[0], q),
  planner: () => plannerPage(),
  progress: () => progressPage(),
  about: () => aboutPage(),
  search: (a, q) => searchPage(q.get("q") || ""),
};

function route() {
  ctx.cleanup.forEach(f => { try { f(); } catch (e) { } }); ctx.cleanup = [];
  $("#toast").classList.remove("on"); closeModal();
  const h = location.hash.replace(/^#\/?/, "");
  const [path, qs] = h.split("?");
  const parts = (path || "").split("/").filter(Boolean);
  const q = new URLSearchParams(qs || "");
  const nav = { "": "home", m: "learn", lesson: "learn", q: "practice", mock: "practice", revise: "practice", search: "" }[parts[0] || ""] ?? parts[0];
  $$(".nav a").forEach(x => x.classList.toggle("on", x.dataset.nav === nav));
  const fn = ROUTES[parts[0] || ""];
  try { if (fn) fn(parts.slice(1), q); else notFound(); }
  catch (e) {
    console.error(e);
    app().innerHTML = `<div class="wrap page"><h1 class="h1">Something went wrong on this page</h1><p class="lead">Your progress is safe. Try going back, or reload. If it keeps happening, the details below help fix it.</p><pre class="code">${esc(e.stack || e.message)}</pre><a class="btn btn--red" href="#/">Go to dashboard</a></div>`;
  }
  if (!q.has("keep")) window.scrollTo(0, 0);
  const m = $("main"); if (m) m.focus({ preventScroll: true });
}
export function notFound() { setTitle("Not found"); app().innerHTML = `<div class="wrap page"><h1 class="h1">Page not found</h1><p class="lead">That link does not match anything here. It may point to content that was renamed.</p><a class="btn btn--red" href="#/" style="margin-top:14px">Go to dashboard</a></div>`; }

/* ---------------- theme ---------------- */
function applyTheme() {
  const t = store.setting("theme");
  if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
  const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  $("#themeBtn").innerHTML = icon(dark ? "sun" : "moon"); $("#themeBtn").title = dark ? "Light mode" : "Dark mode";
}
$("#themeBtn").onclick = () => {
  const dark = document.documentElement.getAttribute("data-theme") ? document.documentElement.getAttribute("data-theme") === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  store.setSetting("theme", dark ? "light" : "dark"); applyTheme();
};

addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.closest(".CodeMirror")) { e.preventDefault(); openSearch(); }
});

/* ---------------- search ---------------- */
function searchResults(q, n = 40) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean); if (!words.length) return [];
  const out = [];
  for (const x of SEARCH) {
    if (!words.every(w => x.l.includes(w))) continue;
    const tl = x.t.toLowerCase(); let s = { Track: 6, Module: 5, Lesson: 4, Topic: 3 }[x.k] || 1;
    if (tl.startsWith(words[0])) s += 3; if (words.every(w => tl.includes(w))) s += 2;
    out.push([s, x]);
  }
  return out.sort((a, b) => b[0] - a[0]).slice(0, n).map(x => x[1]);
}
const resRow = x => `<a class="sres" href="${x.href}"><span class="pill">${esc(x.k)}</span><span class="sres__t">${esc(x.t)}</span><span class="sres__s">${esc(x.s)}</span></a>`;
function openSearch() {
  openModal(`<div class="search"><div class="search__bar">${icon("search")}<input id="sq" type="search" placeholder="Search modules, topics, lessons, questions..." autocomplete="off" aria-label="Search"><button class="btn btn--sm btn--ghost" data-close-btn>Esc</button></div><div id="sr" class="search__res"><p class="note" style="padding:14px">Try "setup time", "I2C", "Kadane", "mutex" or "op-amp".</p></div></div>`, box => {
    const inp = $("#sq", box); inp.focus();
    const draw = () => { const v = inp.value.trim(); const r = searchResults(v, 30); $("#sr", box).innerHTML = !v ? "" : r.length ? r.map(resRow).join("") + `<a class="sres sres--all" href="#/search?q=${encodeURIComponent(v)}">See all results →</a>` : `<p class="note" style="padding:14px">Nothing matches "${esc(v)}".</p>`; };
    inp.addEventListener("input", draw);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { const a = $(".sres", box); if (a) { location.hash = a.getAttribute("href"); } } });
    box.addEventListener("click", e => { if (e.target.closest("a")) closeModal(); });
  });
}
function searchPage(q) {
  setTitle("Search");
  const r = searchResults(q, 300);
  app().innerHTML = `<div class="wrap page" style="max-width:860px"><h1 class="h1">Search</h1><form class="filters" id="sf"><input id="sq2" type="search" value="${esc(q)}" placeholder="Search everything" style="flex:1;min-width:200px" aria-label="Search"><button class="btn btn--red btn--sm">Search</button></form>
<p class="note">${r.length} result${r.length === 1 ? "" : "s"}${r.length === 300 ? " (showing the first 300)" : ""}</p><div class="slist">${r.map(resRow).join("") || '<div class="empty card">No matches. Try fewer or different words.</div>'}</div></div>`;
  $("#sf").onsubmit = e => { e.preventDefault(); location.hash = "#/search?q=" + encodeURIComponent($("#sq2").value.trim()); };
}
$("#searchBtn").innerHTML = icon("search"); $("#searchBtn").onclick = openSearch;

/* ---------------- account / sync ---------------- */
function drawAcct(s) {
  const b = $("#acctBtn");
  const dot = { signedin: "ok", loading: "busy", error: "bad" }[s.state] || "";
  b.innerHTML = s.user && s.user.photo ? `<img src="${esc(s.user.photo)}" alt="" referrerpolicy="no-referrer"><i class="sdot ${dot}"></i>` : `${icon("cloud")}<i class="sdot ${dot}"></i>`;
  b.title = s.user ? `Signed in as ${s.user.email} - ${s.msg}` : s.msg || "Sign in to sync";
}
export function accountModal() {
  const s = syncState();
  openModal(`<h2 style="font-size:22px">Account and sync</h2>
<p class="note" style="margin:6px 0 14px">${esc(s.msg || "")}</p>
${s.user ? `<div class="row"><b>${esc(s.user.name || "")}</b><span class="note">${esc(s.user.email || "")}</span></div><p class="note" style="margin-top:8px">Progress syncs to Firestore under your account (users/your-id). It is also kept in this browser, so the site works offline.</p>
<div class="row" style="margin-top:14px"><button class="btn btn--ghost" id="mImp">Import my Embedded Tracker ticks</button><button class="btn btn--ghost" id="mOut">Sign out</button></div>`
      : s.state === "off" ? `<p>Cloud sync needs a <code>firebase-config.js</code> file next to index.html (see README). Until then everything is saved in this browser - use <a href="#/progress">Export</a> to back it up.</p>`
        : `<p>Sign in with Google to keep the same progress on your phone and laptop. Without signing in, progress stays in this browser.</p><div class="row" style="margin-top:14px"><button class="btn btn--red" id="mIn">Sign in with Google</button></div>`}
<div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn btn--ink btn--sm" data-close-btn>Close</button></div>`, box => {
    const i = $("#mIn", box), o = $("#mOut", box), im = $("#mImp", box);
    if (i) i.onclick = async () => { i.disabled = true; try { await signIn(); closeModal(); toast("Signed in - syncing your progress."); } catch (e) { i.disabled = false; accountModal(); } };
    if (o) o.onclick = async () => { await signOut(); closeModal(); toast("Signed out. Progress stays on this device."); };
    if (im) im.onclick = async () => { im.disabled = true; im.textContent = "Importing..."; try { const n = await importTracker(); toast(n ? `Imported ${n} ticks and hour logs from the tracker.` : "Nothing new to import - already up to date."); closeModal(); rerender(); } catch (e) { im.disabled = false; im.textContent = "Import failed - try again"; toast("Could not read the tracker: " + (e.message || e)); } };
  });
}
$("#acctBtn").onclick = accountModal;
onSync(drawAcct);

/* re-render the current page when another device's progress arrives */
let lastSyncRender = 0;
store.on(why => { if (why === "sync" && Date.now() - lastSyncRender > 1500 && !document.activeElement.closest("textarea,input,.CodeMirror")) { lastSyncRender = Date.now(); route(); } });

applyTheme();
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
addEventListener("hashchange", route);
route();
initSync();
if (!store.ok()) setTimeout(() => toast("This browser is blocking storage - progress will not be saved. Turn off private mode or sign in."), 800);
