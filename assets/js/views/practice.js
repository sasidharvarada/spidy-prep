/* Practice: unified question bank, question page, timed mock tests, revision queue + flashcards */
import { store } from "../store.js";
import { TRACKS, TRACK, MODS, Q, QUESTIONS, TYPES, TYPE_NAME, ROLES, ROLE, optionOrder, checkNum } from "../registry.js";
import { qDone, qTried, revisionDue, roleOf } from "../stats.js";
import { $, $$, esc, app, setTitle, pill, bar, ring, pct, plural, toast, empty, icon, ctx } from "../ui.js";
import { renderQ, toolsHtml, wireTools, metaRow, hintFor, relatedHtml, solHtml, fmtAns } from "../qview.js";
import { cWorkspace, vWorkspace, kWorkspace } from "../code.js";
import { qRow } from "./learn.js";

/* global order: track roadmap order, then module order, then insertion order */
const ORDER = new Map(); { let i = 0; const seen = new Set(); TRACKS.forEach(t => t.mods.forEach(id => { if (seen.has(id)) return; seen.add(id); MODS.get(id).qs.forEach(q => { if (!ORDER.has(q)) ORDER.set(q, i++); }); })); }
const STATUS = [["", "Any status"], ["new", "Not tried"], ["tried", "Tried, not solved"], ["solved", "Solved / done"], ["wrong", "Wrong last time"], ["bm", "Bookmarked"], ["difficult", "Marked difficult"], ["noted", "Has my note"]];

export function filterQs(p) {
  const track = p.get("track"), mod = p.get("mod"), type = p.get("type"), level = p.get("level"), status = p.get("status"), tag = p.get("tag"), sub = p.get("sub"), text = (p.get("text") || "").toLowerCase(), role = p.get("role");
  const roleMods = role && ROLE[role] ? new Set(ROLE[role].mods) : null;
  const tmods = track && TRACK[track] ? new Set(TRACK[track].mods) : null;
  const inMod = (q, set) => set.has(q.mod) || (q.also || []).some(m => set.has(m));
  let out = QUESTIONS.filter(q => {
    if (mod && q.mod !== mod && !(q.also || []).includes(mod)) return false;
    if (tmods && !inMod(q, tmods)) return false;
    if (roleMods && !inMod(q, roleMods)) return false;
    if (type ? q.type !== type : (q.type === "self" && !mod && p.get("self") !== "1")) return false;
    if (level && q.level !== level) return false;
    if (sub && q.sub !== sub) return false;
    if (tag && !store.tags(q.id).includes(tag)) return false;
    if (text && !(q.q + " " + (q.title || "")).toLowerCase().includes(text)) return false;
    if (status) {
      const a = store.att(q.id);
      if (status === "new" && qTried(q)) return false;
      if (status === "tried" && (!qTried(q) || qDone(q))) return false;
      if (status === "solved" && !qDone(q)) return false;
      if (status === "wrong" && !(a && a.lastOk === 0)) return false;
      if (status === "bm" && !store.bm(q.id)) return false;
      if (status === "difficult" && store.mark(q.id) !== "difficult") return false;
      if (status === "noted" && !store.note(q.id)) return false;
    }
    return true;
  });
  return out.sort((a, b) => (ORDER.get(a.id) ?? 1e9) - (ORDER.get(b.id) ?? 1e9));
}

/* ---------------------------------------------------------------- bank */
export function practicePage(p) {
  setTitle("Practice");
  if (p.get("run") === "1") { const list = filterQs(p); p.delete("run"); const first = list.find(q => !qDone(q)) || list[0]; if (first) { location.replace(`#/q/${encodeURIComponent(first.id)}?${p}`); return; } }
  const allTags = [...new Set(Object.values(store.raw().tags).flat())].sort();
  const subs = [...new Set(QUESTIONS.map(q => q.sub).filter(Boolean))].sort();
  const due = revisionDue().length;
  const nCode = QUESTIONS.filter(q => ["c", "verilog", "circuit"].includes(q.type)).length;
  const track = p.get("track") || "";
  const modOpts = (track ? TRACK[track].mods : TRACKS.flatMap(t => t.mods)).filter((v, i, a) => a.indexOf(v) === i);
  const sel = (id, label, opts, val) => `<select id="${id}" aria-label="${label}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(val || "") === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  app().innerHTML = `<div class="wrap page"><span class="kicker">Practice</span><h1 class="h1">Question bank</h1>
<p class="lead">${QUESTIONS.filter(q => q.type !== "self").length} original questions with solutions - MCQs, numericals, concept answers, C, Verilog and circuits - plus ${QUESTIONS.filter(q => q.type === "self").length} checklist tasks from your tracker. Everything links back to its module.</p>
<div class="grid g4 qs-cards">
<a class="card mini" href="#/mock">${icon("timer")}<b>Timed mock test</b><span class="note">By role, track or module</span></a>
<a class="card mini" href="#/revise">${icon("repeat")}<b>Revision queue</b><span class="note">${due ? `${due} due now` : "Nothing due"}</span></a>
<a class="card mini" href="#/practice?type=c">${icon("code")}<b>Coding problems</b><span class="note">${nCode} with auto-check</span></a>
<a class="card mini" href="#/mock/run?track=aptitude&n=20&mins=25&title=Placement+aptitude+test">${icon("chart")}<b>Aptitude test</b><span class="note">20 questions · 25 min</span></a></div>
<div class="filters filters--bank">
${sel("fTrack", "Subject", [["", "All subjects"], ...TRACKS.map(t => [t.id, t.title])], track)}
${sel("fMod", "Topic / module", [["", "All modules"], ...modOpts.map(id => [id, MODS.get(id).title])], p.get("mod"))}
${sel("fType", "Question type", [["", "All types (no checklist)"], ...TYPES.map(t => [t, TYPE_NAME(t)])], p.get("type"))}
${sel("fLevel", "Difficulty", [["", "Any difficulty"], ["Easy", "Easy"], ["Medium", "Medium"], ["Hard", "Hard"]], p.get("level"))}
${sel("fStatus", "Status", STATUS, p.get("status"))}
${sel("fRole", "Role", [["", "Any role"], ...ROLES.map(r => [r.id, r.title])], p.get("role"))}
${subs.length ? sel("fSub", "Sub-topic", [["", "Any sub-topic"], ...subs.map(s => [s, s])], p.get("sub")) : ""}
${sel("fTag", "Your tags", [["", allTags.length ? "Your tags (company...)" : "No tags yet"], ...allTags.map(s => [s, s])], p.get("tag"))}
<input id="fText" type="search" placeholder="Words in the question" value="${esc(p.get("text") || "")}" aria-label="Search question text">
<button class="btn btn--ghost btn--sm" id="fClear">Clear</button></div>
<div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="note" id="fCount"></span><span class="row"><button class="btn btn--red btn--sm" id="fRun">Practise these one by one →</button><button class="btn btn--ghost btn--sm" id="fMock">Timed test from these</button></span></div>
<div class="qlist" id="fList"></div><div id="fMore"></div>
<p class="note" style="margin-top:14px">About company tags: this site does not label questions with company names, because there is no reliable public data on which company asks what. Use <b>＃ Tag</b> on any question to record where <i>you</i> were asked it, then filter by your tags here.</p></div>`;
  const read = () => { const q = new URLSearchParams(); [["track", "fTrack"], ["mod", "fMod"], ["type", "fType"], ["level", "fLevel"], ["status", "fStatus"], ["role", "fRole"], ["sub", "fSub"], ["tag", "fTag"], ["text", "fText"]].forEach(([k, id]) => { const el = $("#" + id); if (el && el.value) q.set(k, el.value.trim()); }); return q; };
  let shown = 60;
  const draw = () => {
    const q = read(), list = filterQs(q);
    history.replaceState(null, "", "#/practice" + (q.toString() ? "?" + q : ""));
    $("#fCount").textContent = `${list.length} question${list.length === 1 ? "" : "s"} · ${list.filter(qDone).length} done`;
    $("#fList").innerHTML = list.slice(0, shown).map(x => qRow(x, q.toString())).join("") || empty("No questions match these filters.", '<button class="btn btn--sm btn--ghost" onclick="document.getElementById(\'fClear\').click()">Clear filters</button>');
    $("#fMore").innerHTML = list.length > shown ? `<button class="btn btn--ghost" id="more" style="margin-top:10px">Show ${Math.min(60, list.length - shown)} more</button>` : "";
    const mb = $("#more"); if (mb) mb.onclick = () => { shown += 60; draw(); };
    $("#fRun").disabled = $("#fMock").disabled = !list.length;
  };
  $$(".filters select").forEach(s => s.addEventListener("change", () => { shown = 60; if (s.id === "fTrack") { $("#fMod").value = ""; const q = read(); location.hash = "#/practice?" + q; return; } draw(); }));
  let tt; $("#fText").addEventListener("input", () => { clearTimeout(tt); tt = setTimeout(() => { shown = 60; draw(); }, 200); });
  $("#fClear").onclick = () => { location.hash = "#/practice"; };
  $("#fRun").onclick = () => { const q = read(); q.set("run", "1"); location.hash = "#/practice?" + q; };
  $("#fMock").onclick = () => { const q = read(); q.set("n", "15"); location.hash = "#/mock/run?" + q; };
  draw();
}

/* ---------------------------------------------------------------- question page */
export function questionPage(id, p) {
  const q = Q.get(id); if (!q) { app().innerHTML = `<div class="wrap page"><h1 class="h1">Question not found</h1><p class="lead">It may have been renamed.</p><a class="btn btn--red" href="#/practice">Question bank</a></div>`; return; }
  const m = MODS.get(q.mod), t = TRACK[m.track];
  setTitle((q.title || q.q).slice(0, 60));
  const ctxq = new URLSearchParams(p); ctxq.delete("keep");
  const list = ctxq.toString() ? filterQs(ctxq) : m.qs.map(x => Q.get(x));
  const i = list.findIndex(x => x.id === q.id), prev = list[i - 1], next = list[i + 1];
  const href = x => `#/q/${encodeURIComponent(x.id)}${ctxq.toString() ? "?" + ctxq : ""}`;
  const nav = `<div class="qnav">${prev ? `<a class="btn btn--ghost btn--sm" href="${href(prev)}">← Previous</a>` : "<span></span>"}<span class="note">${i >= 0 ? `${i + 1} of ${list.length}` : ""}</span>${next ? `<a class="btn btn--ghost btn--sm" href="${href(next)}">Next →</a>` : `<a class="btn btn--ghost btn--sm" href="${ctxq.toString() ? "#/practice?" + ctxq : `#/m/${m.id}/practice`}">Back to list</a>`}</div>`;
  const head = `<div class="crumbs"><a href="#/practice${ctxq.toString() ? "?" + ctxq : ""}">Practice</a><span>/</span><a href="#/learn/${t.id}">${esc(t.short)}</a><span>/</span><a href="#/m/${m.id}/practice">${esc(m.title)}</a></div>${metaRow(q, { noMod: true })}`;
  store.setLast({ href: href(q), title: q.title || q.q, kind: `${TYPE_NAME(q.type)} · ${m.title}` });
  if (q.prob) {
    const after = `<div id="qtools" style="margin-top:14px">${toolsHtml(q)}</div>${relatedHtml(q)}${nav}`;
    ({ c: cWorkspace, verilog: vWorkspace, circuit: kWorkspace })[q.type](q, head, after);
    wireTools($("#qtools"), q, () => questionPage(id, p));
    return;
  }
  const h = hintFor(q);
  app().innerHTML = `<div class="wrap page" style="max-width:880px">${head}
<div class="qcard qcard--big" id="qc"></div>
${q.type !== "self" && h ? `<details class="hint"><summary>${h.own ? "Hint" : "Pointer"}</summary><div>${esc(h.text)}</div></details>` : ""}
<div id="qtools">${toolsHtml(q)}</div>
${relatedHtml(q)}${nav}</div>`;
  renderQ($("#qc"), q, { onAnswer: () => { const a = $("#qtools .qtools__att"); if (a) { const x = store.att(q.id); a.innerHTML = x ? `<span class="note">Attempts: ${x.n} · right: ${x.ok} (${Math.round(100 * x.ok / x.n)}%)</span>` : ""; } } });
  wireTools($("#qtools"), q, () => questionPage(id, p));
  const onKey = e => { if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return; if (e.key === "ArrowRight" && next) location.hash = href(next); if (e.key === "ArrowLeft" && prev) location.hash = href(prev); };
  addEventListener("keydown", onKey); ctx.cleanup.push(() => removeEventListener("keydown", onKey));
}

/* ---------------------------------------------------------------- mock tests */
function seeded(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function buildMock(p) {
  const q = new URLSearchParams(p); ["n", "mins", "title", "seed", "fresh"].forEach(k => q.delete(k));
  if (!q.get("type")) q.set("type", ""); // mcq + num only below
  let pool = filterQs(q).filter(x => x.type === "mcq" || x.type === "num");
  if (p.get("fresh") === "1") { const f = pool.filter(x => !store.att(x.id)); if (f.length >= 5) pool = f; }
  const n = Math.min(+p.get("n") || 15, pool.length), rnd = seeded(+p.get("seed") || Date.now());
  const a = [...pool]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  // keep roughly one third Easy/Medium/Hard when possible
  return a.slice(0, n);
}
let running = null;
export function mockPage(sub, p) {
  if (sub === "run") return runMock(p);
  setTitle("Mock tests");
  const role = roleOf();
  const hist = store.mocks().slice().reverse();
  app().innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/practice">Practice</a><span>/</span><span>Mock tests</span></div>
<h1 class="h1">Timed mock tests</h1><p class="lead">Questions are drawn at random from the bank. No hints during the test; full solutions after you submit. Every answer feeds your accuracy, weak topics and revision queue.</p>
<div class="grid g3" style="margin-top:18px">
<a class="card tile" style="--c:var(--red)" href="#/mock/run?role=${role.id}&n=20&mins=30&title=${encodeURIComponent(role.title + " technical mock")}"><h3>${esc(role.title)} technical</h3><p>20 questions · 30 min from your planner role.</p><span class="go">Start →</span></a>
<a class="card tile" style="--c:var(--amber)" href="#/mock/run?track=aptitude&n=20&mins=25&title=Placement+aptitude+test"><h3>Placement aptitude</h3><p>20 quant, logical and verbal questions · 25 min.</p><span class="go">Start →</span></a>
<a class="card tile" style="--c:var(--violet)" href="#/mock/run?n=30&mins=40&title=Mixed+ECE+mock"><h3>Mixed ECE</h3><p>30 questions across every track · 40 min.</p><span class="go">Start →</span></a></div>
<h2 class="h2">Build your own</h2>
<form class="card mockform" id="mf">
<label>Scope <select name="scope">${["", ...TRACKS.map(t => "track:" + t.id), ...ROLES.map(r => "role:" + r.id)].map(v => `<option value="${v}" ${v === `${p.get("track") ? "track:" + p.get("track") : ""}` ? "selected" : ""}>${v ? (v.startsWith("track:") ? "Track: " + TRACK[v.slice(6)].title : "Role: " + ROLE[v.slice(5)].title) : "Everything"}</option>`).join("")}</select></label>
<label>Questions <select name="n">${[10, 15, 20, 30, 40].map(n => `<option ${n === 20 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
<label>Minutes <select name="mins">${[10, 15, 20, 25, 30, 40, 60].map(n => `<option ${n === 30 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
<label>Difficulty <select name="level"><option value="">Mixed</option><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
<label class="chk"><input type="checkbox" name="fresh" value="1"> <span>Prefer questions I have not seen</span></label>
<button class="btn btn--red">Start test →</button></form>
<h2 class="h2">History</h2>${hist.length ? `<div class="tbl"><table><tr><th>Date</th><th>Test</th><th>Score</th><th>Time</th></tr>${hist.slice(0, 30).map(x => `<tr><td>${new Date(x.ts).toLocaleDateString()}</td><td>${esc(x.title || "Mock")}</td><td><b>${x.right}/${x.n}</b> (${Math.round(100 * x.right / x.n)}%)</td><td>${Math.round((x.secs || 0) / 60)} min</td></tr>`).join("")}</table></div>` : empty("No mock tests yet. Start with a short one above.")}</div>`;
  $("#mf").onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target), q = new URLSearchParams();
    const sc = f.get("scope"); if (sc) q.set(sc.split(":")[0], sc.split(":")[1]);
    ["n", "mins", "level", "fresh"].forEach(k => f.get(k) && q.set(k, f.get(k)));
    q.set("title", sc ? (sc.startsWith("track:") ? TRACK[sc.slice(6)].title : ROLE[sc.slice(5)].title) + " mock" : "Custom mock");
    location.hash = "#/mock/run?" + q;
  };
}
function runMock(p) {
  const key = p.toString();
  if (!running || running.key !== key || running.finished) {
    if (!p.get("seed")) { p.set("seed", String(Date.now() % 1e9)); location.replace("#/mock/run?" + p); return; }
    const qs = buildMock(p);
    const mod = p.get("mod");
    const title = p.get("title") || (mod ? `${MODS.get(mod).title} test` : "Mock test");
    running = { key, qs, answers: {}, flags: {}, cur: 0, start: Date.now(), limit: 60000 * (+p.get("mins") || Math.ceil(qs.length * 1.5)), title, scope: mod ? "mod:" + mod : p.get("track") ? "track:" + p.get("track") : p.get("role") ? "role:" + p.get("role") : "all", role: p.get("role") || "" };
  }
  const R = running;
  setTitle(R.title);
  if (!R.qs.length) { app().innerHTML = `<div class="wrap page">${empty("Not enough auto-checked questions for this scope. Try a wider scope.", '<a class="btn btn--red btn--sm" href="#/mock">Back to mock tests</a>')}</div>`; running = null; return; }
  app().innerHTML = `<div class="wrap page mock"><div class="mock__bar"><b>${esc(R.title)}</b><span class="mock__timer" id="mt"></span><button class="btn btn--red btn--sm" id="msub">Submit test</button></div>
<div class="mock__grid"><div><div class="note" id="mpos"></div><div class="qcard qcard--big" id="mq"></div>
<div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn btn--ghost btn--sm" id="mprev">← Previous</button><button class="btn btn--ghost btn--sm" id="mflag">⚑ Flag for review</button><button class="btn btn--ink btn--sm" id="mnext">Next →</button></div></div>
<aside class="card mock__nav"><h4>Questions</h4><div class="mnav" id="mnav"></div><p class="note" style="margin-top:8px">Answered · ⚑ flagged · current</p></aside></div></div>`;
  const answered = q => R.answers[q.id] != null && R.answers[q.id] !== "";
  const drawNav = () => { $("#mnav").innerHTML = R.qs.map((q, i) => `<button class="${i === R.cur ? "cur " : ""}${answered(q) ? "ans " : ""}${R.flags[q.id] ? "flag" : ""}" data-i="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join(""); };
  const show = () => { const q = R.qs[R.cur]; $("#mpos").textContent = `Question ${R.cur + 1} of ${R.qs.length} · ${MODS.get(q.mod).title}${q.level ? " · " + q.level : ""}`; renderQ($("#mq"), q, { mock: true, answers: R.answers, onPick: drawNav }); $("#mflag").textContent = R.flags[q.id] ? "⚑ Unflag" : "⚑ Flag for review"; drawNav(); $("#mprev").disabled = R.cur === 0; $("#mnext").textContent = R.cur === R.qs.length - 1 ? "Review →" : "Next →"; };
  $("#mnav").onclick = e => { const b = e.target.closest("button"); if (b) { R.cur = +b.dataset.i; show(); } };
  $("#mprev").onclick = () => { R.cur = Math.max(0, R.cur - 1); show(); };
  $("#mnext").onclick = () => { if (R.cur < R.qs.length - 1) { R.cur++; show(); } else $("#msub").focus(); };
  $("#mflag").onclick = () => { const q = R.qs[R.cur]; R.flags[q.id] = !R.flags[q.id]; show(); };
  const tick = () => { const left = R.limit - (Date.now() - R.start); if (left <= 0) { finish(true); return; } const s = Math.ceil(left / 1000); const el = $("#mt"); if (el) { el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} left`; el.classList.toggle("low", s < 60); } };
  const timer = setInterval(tick, 500); ctx.cleanup.push(() => clearInterval(timer)); tick();
  $("#msub").onclick = () => { const un = R.qs.filter(q => !answered(q)).length; if (un && !confirm(`${un} question${un > 1 ? "s are" : " is"} unanswered and will count as wrong. Submit anyway?`)) return; finish(false); };
  function finish(timeUp) {
    clearInterval(timer); if (R.finished) return; R.finished = true;
    const res = R.qs.map(q => { const a = R.answers[q.id]; const has = a != null && a !== ""; const ok = has && (q.type === "mcq" ? a === q.a : !!checkNum(q, a)); if (has) store.record(q.id, ok); return { q, a, has, ok }; });
    const right = res.filter(x => x.ok).length, secs = Math.round(Math.min(R.limit, Date.now() - R.start) / 1000);
    store.addMock({ title: R.title, scope: R.scope, role: R.role, n: R.qs.length, right, secs, qids: R.qs.map(q => q.id), wrong: res.filter(x => !x.ok).map(x => x.q.id) });
    const byMod = {}; res.forEach(x => { const k = x.q.mod; byMod[k] = byMod[k] || { n: 0, ok: 0 }; byMod[k].n++; if (x.ok) byMod[k].ok++; });
    const pc = 100 * right / R.qs.length;
    app().innerHTML = `<div class="wrap page" style="max-width:900px"><div class="card" style="text-align:center;padding:26px">${ring(pc, pc >= 70 ? "var(--green)" : pc >= 50 ? "var(--amber)" : "var(--red)", 120, pct(pc), `${right}/${R.qs.length}`)}
<h1 class="h1" style="margin-top:10px">${timeUp ? "Time is up. " : ""}${pc >= 80 ? "Excellent!" : pc >= 60 ? "Good - review the misses." : "Keep going - the review below shows exactly what to fix."}</h1>
<p class="note">${esc(R.title)} · ${Math.round(secs / 60)} min · ${res.filter(x => !x.has).length} unanswered</p>
<div class="row" style="justify-content:center;margin-top:12px"><a class="btn btn--red" href="#/revise">Revise mistakes</a><a class="btn btn--ghost" href="#/mock">Another test</a></div></div>
<h2 class="h2">By module</h2><div class="tbl"><table><tr><th>Module</th><th>Score</th></tr>${Object.entries(byMod).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).map(([k, v]) => `<tr><td><a href="#/m/${k}">${esc(MODS.get(k).title)}</a></td><td>${v.ok}/${v.n}</td></tr>`).join("")}</table></div>
<h2 class="h2">Review</h2>${res.map((x, i) => `<div class="qcard review ${x.ok ? "ok" : "bad"}"><div class="qstem"><span class="qnum">${i + 1}.</span>${esc(x.q.q)}</div>
<p>${x.q.type === "mcq" ? `Your answer: <b>${x.has ? esc(x.q.o[x.a]) : "—"}</b>${x.ok ? "" : ` · Correct: <b>${esc(x.q.o[x.q.a])}</b>`}` : `Your answer: <b>${x.has ? esc(x.a) : "—"}</b>${x.ok ? "" : ` · Correct: <b>${esc(fmtAns(x.q))}</b>`}`}</p>
<div class="why">${solHtml(x.q.sol)}</div><a class="note" href="#/q/${encodeURIComponent(x.q.id)}">Open question →</a></div>`).join("")}</div>`;
    window.scrollTo(0, 0);
  }
  show();
}

/* ---------------------------------------------------------------- revision */
export function revisePage(p) {
  setTitle("Revision");
  const mod = p.get("mod"), mode = p.get("mode") || "list";
  let due = revisionDue(); if (mod) due = due.filter(x => x.q.mod === mod || (x.q.also || []).includes(mod));
  const scope = mod ? ` in ${esc(MODS.get(mod).title)}` : "";
  const tabs = `<div class="tabs" style="margin:6px 0 16px">${[["list", "Queue"], ["session", "Revise one by one"], ["cards", "Flashcards"]].map(([k, l]) => `<a href="#/revise?${new URLSearchParams(Object.assign({}, mod ? { mod } : {}, { mode: k }))}" class="${k === mode ? "on" : ""}">${l}</a>`).join("")}</div>`;
  const head = `<div class="wrap page" style="max-width:900px"><span class="kicker">Revise</span><h1 class="h1">Revision${scope}</h1><p class="lead">Questions you got wrong, marked difficult or bookmarked, plus spaced repetition: each right answer pushes a question further out (1, 3, 7, 14, 30 days); a wrong one brings it back tomorrow.</p>${tabs}`;
  if (mode === "list") {
    app().innerHTML = head + (due.length ? `<p class="note">${plural(due.length, "question")} in the queue.</p><div class="qlist">${due.map(x => qRow(x.q, mod ? "mod=" + mod : "").replace("</a>", `<span class="why-tags">${x.reasons.map(r => `<span class="pill">${esc(r)}</span>`).join("")}</span></a>`)).join("")}</div>`
      : empty("Your revision queue is empty. Answer questions in Practice - mistakes and anything you mark difficult will appear here.", '<a class="btn btn--red btn--sm" href="#/practice">Go to practice</a>')) + "</div>";
    return;
  }
  const pool = (due.length ? due.map(x => x.q) : []).filter(q => q.type !== "self" && !q.prob);
  if (!pool.length) { app().innerHTML = head + empty(mod ? "Nothing due in this module. Flashcards use questions you answered wrong, bookmarked or marked difficult." : "Nothing due right now.", `<a class="btn btn--sm btn--ghost" href="#/practice${mod ? "?mod=" + mod : ""}">Practise instead</a>`) + "</div>"; return; }
  let i = 0, right = 0;
  if (mode === "session") {
    app().innerHTML = head + `<div class="note" id="rpos"></div><div class="qcard qcard--big" id="rq"></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn btn--ink" id="rnext">Next →</button></div></div>`;
    const show = () => {
      if (i >= pool.length) { store.revDone(); $("#rq").innerHTML = `<h2>Session done</h2><p class="note">${right} of ${pool.length} right. Correct ones move to a later review date.</p><a class="btn btn--red btn--sm" href="#/">Back to dashboard</a>`; $("#rnext").hidden = true; $("#rpos").textContent = ""; return; }
      const q = pool[i]; $("#rpos").textContent = `${i + 1} of ${pool.length} · ${MODS.get(q.mod).title}`;
      renderQ($("#rq"), q, { onAnswer: ok => { if (ok) right++; } });
    };
    $("#rnext").onclick = () => { i++; show(); }; show(); return;
  }
  // flashcards
  app().innerHTML = head + `<div class="note" id="fpos"></div><div class="flash" id="fc" tabindex="0" role="button" aria-label="Flip card"></div><div class="row" style="justify-content:center;margin-top:14px" id="fbtn"></div></div>`;
  const back = q => q.type === "mcq" ? `<b>${esc(q.o[q.a])}</b>${solHtml(q.sol)}` : q.type === "num" ? `<b class="mono">${esc(fmtAns(q))}</b>${solHtml(q.sol)}` : `<p>${esc(q.model)}</p>`;
  let flipped = false;
  const show = () => {
    if (i >= pool.length) { store.revDone(); $("#fc").innerHTML = `<div class="flash__f"><h2>Deck done</h2><p class="note">${right} of ${pool.length} known.</p></div>`; $("#fbtn").innerHTML = `<a class="btn btn--red" href="#/revise">Back to queue</a>`; $("#fpos").textContent = ""; return; }
    const q = pool[i]; flipped = false; $("#fpos").textContent = `Card ${i + 1} of ${pool.length} · ${MODS.get(q.mod).title} · tap the card to flip`;
    $("#fc").innerHTML = `<div class="flash__f">${esc(q.q)}${q.type === "mcq" ? `<ul class="flash__o">${optionOrder(q).map(k => `<li>${esc(q.o[k])}</li>`).join("")}</ul>` : ""}</div>`;
    $("#fbtn").innerHTML = `<button class="btn btn--ink" id="flip">Show answer</button>`; $("#flip").onclick = flip;
  };
  const flip = () => {
    if (flipped || i >= pool.length) return; flipped = true; const q = pool[i];
    $("#fc").innerHTML = `<div class="flash__b">${back(q)}</div>`;
    $("#fbtn").innerHTML = `<button class="btn btn--green" id="knew">✓ I knew it</button><button class="btn btn--amber" id="didnt">✗ I didn't</button>`;
    $("#knew").onclick = () => { store.record(q.id, true); right++; i++; show(); };
    $("#didnt").onclick = () => { store.record(q.id, false); i++; show(); };
  };
  $("#fc").onclick = flip; $("#fc").onkeydown = e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } };
  show();
}
