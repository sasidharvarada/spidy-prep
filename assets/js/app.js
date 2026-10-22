/* ==========================================================================
   Spidy Prep - single-page app (hash routes, no build step)
   ========================================================================== */
import { store } from "./store.js";
import { esc, ring, gateWidget, dffWidget, bitsWidget, uartWidget, pwmWidget, kmapWidget, waveform } from "./widgets.js";
import { checkDesign, autoRun } from "./verilog.js";
import { CircuitEditor, checkCircuit, truthTable, PALETTE } from "./circuit.js";
import { EMBEDDED_COURSE } from "../data/course-embedded.js";
import { VLSI_COURSE } from "../data/course-vlsi.js";
import { C_PROBLEMS } from "../data/c-problems.js";
import { VERILOG_PROBLEMS } from "../data/verilog-problems.js";
import { CIRCUIT_PROBLEMS, problemCircuit, solutionCircuit, lockedIds, checkSpec } from "../data/circuit-problems.js";
import { MCQ_EXTRA } from "../data/mcq.js";
import { INTERVIEW, gradePrompt } from "../data/interview.js";

/* ---------- settings ---------- */
export const TRACKER_URL = "https://sasidharvarada.github.io/Embedded-Tracker/";

/* ---------- data indexes ---------- */
const COURSES = { embedded: EMBEDDED_COURSE, vlsi: VLSI_COURSE };
const allLessons = d => COURSES[d].modules.flatMap(m => m.lessons.map(l => Object.assign({ mod: m }, l)));
const KINDS = {
  c: { name: "Embedded C", list: C_PROBLEMS, color: "var(--blue)", blurb: "Bits, strings, memory, data structures and drivers - compiled by a real C compiler in your browser." },
  verilog: { name: "Verilog", list: VERILOG_PROBLEMS, color: "var(--vlsi)", blurb: "Write RTL and get it checked cycle by cycle against a reference design, with waveforms." },
  circuits: { name: "Digital circuits", list: CIRCUIT_PROBLEMS, color: "var(--red)", blurb: "Drag gates, draw wires and build circuits. Truth tables are checked automatically." },
};
const probKind = id => id.startsWith("c-") ? "c" : id.startsWith("v-") ? "verilog" : id.startsWith("k-") ? "circuits" : null;
const findProb = id => { const k = probKind(id); return k ? KINDS[k].list.find(p => p.id === id) : null; };
const probHref = id => `#/practice/${probKind(id)}/${id}`;
const mcqPool = d => {
  const out = [];
  allLessons(d).forEach(l => (l.quiz || []).forEach((q, i) => out.push(Object.assign({ id: `${l.id}-q${i}`, t: l.mod.title, src: l.title }, q))));
  MCQ_EXTRA[d].forEach((q, i) => out.push(Object.assign({ id: `x-${d}-${i}`, src: "Extra" }, q)));
  return out;
};
const ivPool = d => INTERVIEW[d].map((q, i) => Object.assign({ id: `${d}-${i}` }, q));

/* ---------- tiny helpers ---------- */
const app = document.getElementById("app");
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let cleanup = [];
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2600); }
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (x) { } ta.remove(); return ok; }
}
const pill = l => `<span class="pill pill--${l.toLowerCase()}">${l}</span>`;
const tick = on => `<span class="tick${on ? " on" : ""}" aria-label="${on ? "done" : "not done"}">✓</span>`;
const bar = (p, c) => `<div class="bar" style="--c:${c || "var(--red)"}"><i style="width:${Math.round(p)}%"></i></div>`;
function setTitle(t) { document.title = t ? `${t} · Spidy Prep` : "Spidy Prep - Embedded & VLSI interview practice"; }

/* ---------- code editor (CodeMirror 5 if loaded, else textarea) ---------- */
function makeEditor(host, value, mode, onChange) {
  if (window.CodeMirror) {
    const cm = window.CodeMirror(host, {
      value, mode, lineNumbers: true, indentUnit: 2, tabSize: 2, smartIndent: true, matchBrackets: true, autoCloseBrackets: true, styleActiveLine: true,
      extraKeys: { Tab: c => c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection("  ", "end"), "Ctrl-Enter": () => host.dispatchEvent(new CustomEvent("run")), "Cmd-Enter": () => host.dispatchEvent(new CustomEvent("run")) },
    });
    let marked = null;
    cm.on("change", () => { if (marked != null) { cm.removeLineClass(marked, "background", "cm-error-line"); marked = null; } onChange && onChange(cm.getValue()); });
    setTimeout(() => cm.refresh(), 0);
    return {
      get: () => cm.getValue(), set: v => cm.setValue(v), focus: () => cm.focus(),
      markLine(n) { if (marked != null) cm.removeLineClass(marked, "background", "cm-error-line"); if (n > 0 && n <= cm.lineCount()) { marked = n - 1; cm.addLineClass(marked, "background", "cm-error-line"); cm.scrollIntoView({ line: marked, ch: 0 }, 80); } },
    };
  }
  const ta = document.createElement("textarea"); ta.className = "fallback-ed"; ta.spellcheck = false; ta.value = value;
  ta.addEventListener("input", () => onChange && onChange(ta.value));
  ta.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") host.dispatchEvent(new CustomEvent("run")); });
  host.appendChild(ta);
  return { get: () => ta.value, set: v => { ta.value = v; }, focus: () => ta.focus(), markLine() { } };
}
let cEngine = null;
const getC = async () => cEngine || (cEngine = await import("./c-engine.js"));

/* ======================================================================== */
/* HOME                                                                      */
/* ======================================================================== */
function home() {
  setTitle("");
  const nLessons = allLessons("embedded").length + allLessons("vlsi").length;
  const nProbs = C_PROBLEMS.length + VERILOG_PROBLEMS.length + CIRCUIT_PROBLEMS.length;
  const nMcq = mcqPool("embedded").length + mcqPool("vlsi").length;
  const nIv = INTERVIEW.embedded.length + INTERVIEW.vlsi.length;
  const last = store.last();
  const st = progressStats();
  app.innerHTML = `
<header class="hero"><div class="wrap">
 <div>
  <span class="kicker">● free · no sign-up · runs in your browser</span>
  <h1>Learn it. Try it. <em>Explain it.</em></h1>
  <p class="lead">Embedded systems and VLSI interview prep in one place: short lessons, a real C compiler, a Verilog simulator, a drag-and-drop circuit lab, and ${nIv} interview questions with model answers.</p>
  <div class="row" style="margin-top:24px"><a class="btn btn--red" href="#/learn">Start learning →</a><a class="btn btn--ghost" href="#/practice">Practice problems</a></div>
  <div class="stats"><div><b>${nLessons}</b><span>lessons</span></div><div><b>${nProbs}</b><span>auto-checked problems</span></div><div><b>${nMcq}</b><span>MCQs</span></div><div><b>${nIv}</b><span>interview questions</span></div></div>
 </div>
 <div id="homeGate"></div>
</div></header>
<div class="wrap">
 ${last ? `<section class="sec" style="padding-top:28px"><a class="card cont" href="${esc(last.href)}"><div style="flex:1"><div class="kicker" style="color:var(--mute)">Continue where you left off</div><h3 style="font-size:19px;margin-top:4px">${esc(last.title)}</h3><p class="note">${esc(last.kind)}</p></div><span class="btn btn--ink">Continue →</span></a></section>` : ""}
 <section class="sec">
  <span class="kicker">Everything you need</span><h2>Four ways to get interview-ready</h2>
  <div class="grid g4" style="margin-top:18px">
   ${tile("#/learn", "var(--blue)", "Courses", `${nLessons} lessons from C and interrupts to CMOS, Verilog and STA. Each ends with a quiz.`, "Open courses", icon("book"))}
   ${tile("#/practice", "var(--vlsi)", "Practice", `${nProbs} problems in C, Verilog and circuits, checked automatically in your browser.`, "Start solving", icon("code"))}
   ${tile("#/interview", "var(--red)", "Interview prep", `Answer in your own words, check the key points, compare with a model answer.`, "Practise answers", icon("mic"))}
   ${tile("#/labs", "var(--teal)", "Labs", "C playground, Verilog simulator, circuit sandbox and a K-map solver.", "Open labs", icon("flask"))}
  </div>
 </section>
 <section class="sec">
  <span class="kicker">Your progress</span><h2>Keep the streak going</h2>
  <div class="grid g4" style="margin-top:16px">
   ${pcard(st.lessons.p, "var(--blue)", "Lessons", `${st.lessons.d} of ${st.lessons.n} done`)}
   ${pcard(st.probs.p, "var(--vlsi)", "Problems", `${st.probs.d} of ${st.probs.n} solved`)}
   ${pcard(st.iv.p, "var(--red)", "Interview", `${st.iv.d} of ${st.iv.n} answered well`)}
   <div class="card pcard"><div style="font-family:var(--disp);font-size:40px;font-weight:700;line-height:1;color:var(--amber)">${store.streak()}</div><div><h3>Day streak</h3><p>Study a little every day. <a href="${TRACKER_URL}" target="_blank" rel="noopener">Open my 12-week tracker</a></p></div></div>
  </div>
 </section>
 <section class="sec">
  <span class="kicker">How to use it - 2 hours a day</span><h2>One topic at a time</h2>
  <div class="grid g3" style="margin-top:14px">
   <div class="card"><b>1. Learn (30-40 min)</b><p class="note" style="margin-top:6px">Read one lesson, play with its demo, pass its quiz.</p></div>
   <div class="card"><b>2. Practise (50-60 min)</b><p class="note" style="margin-top:6px">Solve the linked problems without looking at the solution. Then the MCQs for that topic.</p></div>
   <div class="card"><b>3. Explain (20 min)</b><p class="note" style="margin-top:6px">Answer 3-5 interview questions out loud, then compare with the model answer.</p></div>
  </div>
 </section>
</div>`;
  gateWidget($("#homeGate"));
}
const tile = (href, c, title, text, go, ic) => `<a class="card tile" href="${href}" style="--c:${c}">${ic}<h3>${title}</h3><p>${text}</p><span class="go">${go} →</span></a>`;
const pcard = (p, c, t, s) => `<div class="card pcard">${ring(p, c, 76, Math.round(p) + "%")}<div><h3>${t}</h3><p>${s}</p></div></div>`;
function icon(n) {
  const a = 'class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  return {
    book: `<svg ${a}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/></svg>`,
    code: `<svg ${a}><path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m13 4-2 16"/></svg>`,
    mic: `<svg ${a}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>`,
    flask: `<svg ${a}><path d="M9 3h6"/><path d="M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7 15h10"/></svg>`,
  }[n];
}
function progressStats() {
  const lessons = [...allLessons("embedded"), ...allLessons("vlsi")];
  const probs = [...C_PROBLEMS, ...VERILOG_PROBLEMS, ...CIRCUIT_PROBLEMS];
  const iv = [...ivPool("embedded"), ...ivPool("vlsi")];
  const f = (d, n) => ({ d, n, p: n ? 100 * d / n : 0 });
  return {
    lessons: f(lessons.filter(l => store.lessonDone(l.id)).length, lessons.length),
    probs: f(probs.filter(p => store.solved(p.id)).length, probs.length),
    iv: f(iv.filter(q => store.iv(q.id).rating === "good").length, iv.length),
  };
}

/* ======================================================================== */
/* LEARN                                                                     */
/* ======================================================================== */
function learnIndex() {
  setTitle("Courses");
  app.innerHTML = `<div class="wrap page"><span class="kicker">Courses</span><h1 class="h1">Learn the concept. See it work.</h1>
<p class="lead">Short, focused lessons in the order interviewers build on them. Every lesson has a quiz and links to practice problems; many have a live demo.</p>
<div class="grid g2" style="margin-top:24px">${Object.values(COURSES).map(c => {
    const ls = allLessons(c.id), d = ls.filter(l => store.lessonDone(l.id)).length;
    return `<a class="card tile" href="#/learn/${c.id}" style="--c:${c.color}"><h3 style="font-size:24px">${c.title}</h3><p>${esc(c.intro)}</p>
<p class="note">${c.modules.length} modules · ${ls.length} lessons · about ${Math.round(ls.reduce((s, l) => s + l.mins, 0) / 60)} hours</p>${bar(100 * d / ls.length, c.color)}<span class="note">${d} of ${ls.length} done</span><span class="go">Open course →</span></a>`;
  }).join("")}</div></div>`;
}
function course(d) {
  const c = COURSES[d]; if (!c) return notFound();
  setTitle(c.title);
  const ls = allLessons(d), done = ls.filter(l => store.lessonDone(l.id)).length;
  const next = ls.find(l => !store.lessonDone(l.id));
  app.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/learn">Courses</a><span>/</span><span>${c.title}</span></div>
<div class="course-head"><div><h1 class="h1">${c.title}</h1><p class="lead">${esc(c.intro)}</p></div>
<div class="card" style="min-width:240px"><div class="row" style="justify-content:space-between"><b>${done} / ${ls.length} lessons</b><span class="note">${Math.round(100 * done / ls.length)}%</span></div>${bar(100 * done / ls.length, c.color)}
${next ? `<a class="btn btn--red" style="margin-top:12px;width:100%" href="#/learn/${d}/${next.id}">${done ? "Next" : "Start"}: ${esc(next.title)}</a>` : `<p class="note" style="margin-top:10px">All done - try the <a href="#/practice/mcq/${d}">MCQs</a> or <a href="#/interview/${d}">interview questions</a>.</p>`}</div></div>
${c.modules.map((m, mi) => `<section class="mod"><h2><span>${String(mi + 1).padStart(2, "0")}</span>${esc(m.title)}</h2><div class="lessons">${m.lessons.map(l => `
<a class="lrow" href="#/learn/${d}/${l.id}">${tick(store.lessonDone(l.id))}<div><h3>${esc(l.title)}</h3><p>${esc(l.sum)}</p></div><span class="meta">${l.demo ? "demo · " : ""}${l.mins} min</span></a>`).join("")}</div></section>`).join("")}
<div class="row" style="margin-top:30px"><a class="btn btn--ink" href="#/practice/mcq/${d}">MCQ practice for this course</a><a class="btn btn--ghost" href="#/interview/${d}">Interview questions</a></div></div>`;
}
function lesson(d, id) {
  const c = COURSES[d]; const ls = c ? allLessons(d) : []; const i = ls.findIndex(l => l.id === id); if (i < 0) return notFound();
  const l = ls[i], prev = ls[i - 1], next = ls[i + 1];
  setTitle(l.title);
  store.setLast({ href: `#/learn/${d}/${l.id}`, title: l.title, kind: `${c.title} lesson` });
  const prob = (l.practice || []).map(findProb).filter(Boolean);
  app.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/learn">Courses</a><span>/</span><a href="#/learn/${d}">${c.title}</a><span>/</span><span>${esc(l.mod.title)}</span></div>
<div class="lesson"><article>
<h1 class="h1">${esc(l.title)}</h1><p class="lead">${esc(l.sum)}</p><p class="note" style="margin:6px 0 20px">${l.mins} min read · lesson ${i + 1} of ${ls.length}</p>
${l.demo ? `<div class="demo" id="demo"></div>` : ""}
<div class="prose">${l.body}</div>
<div class="take"><b>THE IDEA TO KEEP</b>${esc(l.takeaway)}</div>
<section class="quiz"><h2 style="font-size:22px">Quick check</h2><p class="note">Pick an answer to see why. Get them all right to mark the lesson done.</p><div id="quiz"></div></section>
<div class="row" style="margin-top:20px"><button class="btn ${store.lessonDone(l.id) ? "btn--green" : "btn--ink"}" id="markDone">${store.lessonDone(l.id) ? "✓ Lesson done" : "Mark lesson done"}</button><button class="btn btn--ghost" id="tutor">Copy AI tutor prompt</button></div>
<div class="pager">${prev ? `<a class="btn btn--ghost" href="#/learn/${d}/${prev.id}">← ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="btn btn--red" href="#/learn/${d}/${next.id}">${esc(next.title)} →</a>` : `<a class="btn btn--red" href="#/practice/mcq/${d}">Course MCQs →</a>`}</div>
</article>
<aside class="lesson-side">
 <div class="card side-card"><h4>Practice this</h4>${prob.length ? `<div class="plinks">${prob.map(p => `<a href="${probHref(p.id)}">${tick(store.solved(p.id))}<span style="flex:1">${esc(p.title)}</span><span class="note">${KINDS[probKind(p.id)].name.split(" ")[0]}</span></a>`).join("")}</div>` : `<p class="note">No coding problem for this one - test yourself with the <a href="#/practice/mcq/${d}">MCQs</a>.</p>`}</div>
 <div class="card side-card"><h4>Interview angle</h4><p class="note">Can you explain this topic in 60 seconds with no notes? Try the <a href="#/interview/${d}">interview questions</a>.</p></div>
</aside></div></div>`;
  if (l.demo) ({ gate: gateWidget, dff: dffWidget, bits: bitsWidget, uart: uartWidget, pwm: pwmWidget, kmap: kmapWidget })[l.demo]($("#demo"));
  renderQuiz($("#quiz"), (l.quiz || []).map((q, k) => Object.assign({ id: `${l.id}-q${k}` }, q)), ok => {
    if (ok && !store.lessonDone(l.id)) { store.setLesson(l.id); const b = $("#markDone"); b.textContent = "✓ Lesson done"; b.className = "btn btn--green"; toast("Lesson complete. Nice work!"); }
  });
  $("#markDone").onclick = () => { const on = !store.lessonDone(l.id); store.setLesson(l.id, on); $("#markDone").textContent = on ? "✓ Lesson done" : "Mark lesson done"; $("#markDone").className = "btn " + (on ? "btn--green" : "btn--ink"); };
  $("#tutor").onclick = async () => {
    const txt = [`You are my patient teacher. I am preparing for ${d === "vlsi" ? "VLSI / digital design" : "embedded systems"} job interviews in India.`, "",
      `Topic: ${l.title} (${c.title} > ${l.mod.title})`, `Summary: ${l.sum}`, "",
      "Teach in this order:", "1. Definition in simple words and where it is used in real chips or boards.",
      "2. Symbols, diagrams (drawn with text), truth tables, waveforms, formulas and units - explain every term.",
      "3. One fully worked example with every step.", "4. Common mistakes and what people confuse it with.", "5. A short summary table.",
      "6. Then give me 5 problems from easy to interview level, one at a time. Wait for my answer, check it and explain my mistakes.",
      "7. Finally ask me 3 interview questions on this topic and grade my answers.", "", "Use simple English. Stop after step 5 and wait for me to say 'ready'."].join("\n");
    toast(await copy(txt) ? "Prompt copied - paste it into any AI chat." : "Could not copy - your browser blocked it.");
  };
}
function renderQuiz(host, qs, onAllRight) {
  if (!qs.length) { host.innerHTML = '<p class="note">No quiz for this lesson.</p>'; return; }
  const got = {};
  host.innerHTML = qs.map((q, i) => `<div class="qz" data-q="${i}"><h4>${i + 1}. ${esc(q.q)}</h4><div class="opts">${q.o.map((o, k) => `<button type="button" class="opt" data-k="${k}"><b>${"ABCD"[k]}</b><span>${esc(o)}</span></button>`).join("")}</div></div>`).join("");
  host.addEventListener("click", e => {
    const b = e.target.closest(".opt"); if (!b || b.disabled) return;
    const box = b.closest(".qz"), i = +box.dataset.q, q = qs[i], k = +b.dataset.k, ok = k === q.a;
    $$(".opt", box).forEach(x => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add("right"); });
    if (!ok) b.classList.add("wrong");
    box.insertAdjacentHTML("beforeend", `<div class="why"><b>${ok ? "Correct." : "Not quite."}</b> ${esc(q.why || "")}</div>`);
    store.setMcq(q.id, ok); got[i] = ok;
    if (Object.keys(got).length === qs.length && Object.values(got).every(Boolean) && onAllRight) onAllRight(true);
  });
}

/* ======================================================================== */
/* PRACTICE                                                                  */
/* ======================================================================== */
function practiceIndex() {
  setTitle("Practice");
  const card = (k, href) => { const K = KINDS[k], d = K.list.filter(p => store.solved(p.id)).length;
    return `<a class="card tile" href="${href}" style="--c:${K.color}"><h3>${K.name}</h3><p>${K.blurb}</p><p class="note">${K.list.length} problems · ${d} solved</p>${bar(100 * d / K.list.length, K.color)}<span class="go">Open →</span></a>`; };
  const mc = d => { const pool = mcqPool(d), ans = pool.filter(q => store.mcq(q.id) != null).length, right = pool.filter(q => store.mcq(q.id) === 1).length;
    return `<a class="card tile" href="#/practice/mcq/${d}" style="--c:${COURSES[d].color}"><h3>${COURSES[d].title} MCQs</h3><p>${pool.length} questions with explanations, from every lesson plus extras.</p><p class="note">${ans} answered · ${ans ? Math.round(100 * right / ans) : 0}% correct</p>${bar(100 * ans / pool.length, COURSES[d].color)}<span class="go">Start a set →</span></a>`; };
  app.innerHTML = `<div class="wrap page"><span class="kicker">Practice</span><h1 class="h1">Learn by doing</h1>
<p class="lead">Every problem is checked automatically, right here in your browser. Nothing to install, nothing to pay for.</p>
<div class="grid g3" style="margin-top:22px">${card("c", "#/practice/c")}${card("verilog", "#/practice/verilog")}${card("circuits", "#/practice/circuits")}</div>
<div class="grid g2" style="margin-top:16px">${mc("embedded")}${mc("vlsi")}</div></div>`;
}
function problemList(k) {
  const K = KINDS[k]; if (!K) return notFound();
  setTitle(K.name + " problems");
  const topics = [...new Set(K.list.map(p => p.topic))];
  app.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/practice">Practice</a><span>/</span><span>${K.name}</span></div>
<h1 class="h1">${K.name} problems</h1><p class="lead">${K.blurb}</p>
<div class="filters"><select id="fl" aria-label="Level"><option value="">All levels</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
<select id="ft" aria-label="Topic"><option value="">All topics</option>${topics.map(t => `<option>${esc(t)}</option>`).join("")}</select>
<select id="fs" aria-label="Status"><option value="">Any status</option><option value="todo">Not solved</option><option value="done">Solved</option></select>
<span class="note" id="fc"></span></div><div class="plist" id="pl"></div></div>`;
  const draw = () => {
    const L = $("#fl").value, T = $("#ft").value, S = $("#fs").value;
    const rows = K.list.filter(p => (!L || p.level === L) && (!T || p.topic === T) && (!S || (S === "done") === store.solved(p.id)));
    $("#fc").textContent = `${rows.length} shown · ${K.list.filter(p => store.solved(p.id)).length}/${K.list.length} solved`;
    $("#pl").innerHTML = rows.map(p => `<a class="prow" href="#/practice/${k}/${p.id}">${tick(store.solved(p.id))}<div><h3>${esc(p.title)}</h3><span class="topic">${esc(p.topic)}${p.par ? ` · target ${p.par} gate${p.par > 1 ? "s" : ""}` : ""}</span></div>${pill(p.level)}<span class="pill">${p.kind === "program" ? "stdin/stdout" : k === "c" ? "function" : k === "verilog" ? (p.spec.kind === "seq" ? "clocked" : "combinational") : (p.seq ? "sequential" : "combinational")}</span></a>`).join("") || '<div class="empty">No problems match.</div>';
  };
  ["#fl", "#ft", "#fs"].forEach(s => $(s).addEventListener("change", draw)); draw();
}
function probPager(k, id) {
  const L = KINDS[k].list, i = L.findIndex(p => p.id === id), prev = L[i - 1], next = L[i + 1];
  return `<div class="pager">${prev ? `<a class="btn btn--ghost btn--sm" href="#/practice/${k}/${prev.id}">← ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="btn btn--ghost btn--sm" href="#/practice/${k}/${next.id}">${esc(next.title)} →</a>` : ""}</div>`;
}
function relatedLessons(id) {
  const out = [];
  for (const d of ["embedded", "vlsi"]) allLessons(d).forEach(l => { if ((l.practice || []).includes(id)) out.push({ d, l }); });
  return out.length ? `<p class="note" style="margin-top:12px">Learn it first: ${out.map(x => `<a href="#/learn/${x.d}/${x.l.id}">${esc(x.l.title)}</a>`).join(", ")}</p>` : "";
}
function descPanel(k, p, extra) {
  return `<div class="crumbs"><a href="#/practice">Practice</a><span>/</span><a href="#/practice/${k}">${KINDS[k].name}</a></div>
<h1 class="h1" style="font-size:26px">${esc(p.title)} ${store.solved(p.id) ? '<span class="pill pill--done">Solved</span>' : ""}</h1>
<div class="row" style="margin:6px 0 14px">${pill(p.level)}<span class="pill">${esc(p.topic)}</span></div>
<div class="prose">${p.desc}</div>${extra || ""}
<details class="hint"><summary>Hint</summary><div>${esc(p.hint || "No hint for this one.")}</div></details>
<details class="hint" id="solDet"><summary>Show a reference solution</summary><div id="solBox"></div></details>
${relatedLessons(p.id)}${probPager(k, p.id)}`;
}
function wireSolution(p, render) {
  $("#solDet").addEventListener("toggle", () => {
    if (!$("#solDet").open || $("#solBox").dataset.done) return;
    $("#solBox").dataset.done = 1;
    render($("#solBox"));
  });
}

/* ---------- C problem ---------- */
function cProblem(id) {
  const p = C_PROBLEMS.find(x => x.id === id); if (!p) return notFound();
  setTitle(p.title);
  store.setLast({ href: `#/practice/c/${id}`, title: p.title, kind: "Embedded C problem" });
  const isProg = p.kind === "program";
  app.innerHTML = `<div class="wrap page"><div class="ws">
<section class="ws-desc">${descPanel("c", p, `<p class="note">${isProg ? `Your program reads from standard input. It is run on ${p.tests.length} hidden input${p.tests.length > 1 ? "s" : ""} and its output is compared line by line with the reference.` : "Write the function(s) only - no main(). Hidden tests call them and print the results; your output must match the reference line by line."}</p>`)}</section>
<section class="ws-main">
 <div class="edwrap"><div class="edbar"><span class="fname">main.c</span><button class="btn btn--sm btn--ghost" id="reset">Reset code</button><button class="btn btn--sm btn--ink" id="run">▶ Run</button><button class="btn btn--sm btn--red" id="submit">Submit</button></div><div id="ed"></div></div>
 ${isProg ? `<label class="note" for="stdin">Input (stdin) for Run</label><textarea id="stdin" class="stdin" spellcheck="false">${esc(p.tests[0])}</textarea>` : ""}
 <div class="out" id="out"><div class="out-h">Output</div><div class="out-b"><p class="note">Press <b>Run</b> to compile and run, or <b>Submit</b> to check against the tests. Shortcut: Ctrl+Enter runs.</p><p class="note" id="engNote">The compiler loads on first use (about 0.5 MB).</p></div></div>
</section></div></div>`;
  const ed = makeEditor($("#ed"), store.code(id) || p.starter, "text/x-csrc", v => store.setCode(id, v));
  getC().then(m => m.warmUp()).then(() => { const n = $("#engNote"); if (n) n.textContent = "C compiler ready."; }).catch(() => { });
  $("#reset").onclick = () => { if (confirm("Replace your code with the starter code?")) { ed.set(p.starter); store.clearCode(id); } };
  const out = (cls, head, body) => { $("#out").innerHTML = `<div class="out-h ${cls}">${head}</div><div class="out-b">${body}</div>`; };
  const busy = on => { ["#run", "#submit"].forEach(s => $(s).disabled = on); };
  const showErr = r => {
    const m = /main\.c\((\d+)\)/.exec(r.err || ""); if (m) ed.markLine(+m[1]);
    const head = r.phase === "compile" ? "✗ Compile error" : r.phase === "timeout" ? "✗ Time limit exceeded" : "✗ Runtime error";
    out("bad", head, `<pre>${esc(r.err || "")}</pre>${r.out ? `<p class="note" style="margin-top:8px">Output before the error:</p><pre>${esc(r.out)}</pre>` : ""}`);
  };
  async function run() {
    busy(true); out("", '<span class="spin"></span> Compiling and running...', "");
    try {
      const C = await getC();
      const r = isProg ? await C.runProgram(ed.get(), $("#stdin").value) : await C.runWithHarness(ed.get(), p.harness);
      if (r.phase !== "done") showErr(r);
      else out("", `Output <span class="note" style="font-weight:400">(${r.ms} ms)</span>`, `<pre>${esc(r.out || "(no output)")}</pre>${!isProg ? '<p class="note" style="margin-top:8px">This is the hidden test harness calling your functions. Submit to compare it with the expected output.</p>' : ""}`);
    } finally { busy(false); }
  }
  async function submit() {
    busy(true); out("", '<span class="spin"></span> Running the tests...', "");
    try {
      const C = await getC(); const r = await C.checkProblem(p, ed.get());
      if (r.ok) {
        store.setSolved(id);
        out("ok", `✓ Accepted - all ${r.lines} output line${r.lines > 1 ? "s" : ""} match`, `<p>Well done! ${isProg ? `Passed ${r.tests} test input${r.tests > 1 ? "s" : ""}.` : ""}</p><p class="note" style="margin-top:6px">Interview tip: explain your solution out loud, including its time and memory cost.</p>`);
        toast("Accepted! Problem solved.");
      } else if (r.phase === "wrong") {
        out("bad", `✗ Wrong answer${isProg ? ` on test ${r.testIndex + 1}` : ""} - line ${r.line + 1}`, `${isProg ? `<p class="note">Input:</p><pre>${esc(r.stdin)}</pre>` : ""}
<div class="diff"><b>yours</b><span class="you">${esc(r.you)}</span><b>expected</b><span class="exp">${esc(r.exp)}</span></div>
<p class="note">${r.passedLines} of ${r.totalLines} lines matched before this one.</p>
<details class="hint"><summary>Full outputs</summary><div class="grid g2"><div><p class="note">Yours</p><pre>${esc(r.out)}</pre></div><div><p class="note">Expected</p><pre>${esc(r.expOut)}</pre></div></div></details>`);
      } else if (r.phase === "internal") out("warn", "Checker problem", `<pre>${esc(r.err)}</pre>`);
      else showErr(r);
    } finally { busy(false); }
  }
  $("#run").onclick = run; $("#submit").onclick = submit; $("#ed").addEventListener("run", run);
  wireSolution(p, box => { box.innerHTML = `<pre class="code">${esc(p.solution)}</pre><button class="btn btn--sm btn--ghost" id="useSol">Load it into the editor</button>`; $("#useSol").onclick = () => { if (confirm("Replace your code with the reference solution?")) ed.set(p.solution); }; });
}

/* ---------- Verilog problem ---------- */
function vProblem(id) {
  const p = VERILOG_PROBLEMS.find(x => x.id === id); if (!p) return notFound();
  setTitle(p.title);
  store.setLast({ href: `#/practice/verilog/${id}`, title: p.title, kind: "Verilog problem" });
  const sp = p.spec;
  const how = sp.kind === "comb" ? "Your module is simulated next to a reference design for every input combination (or 400 random ones for wide inputs), and the outputs are compared."
    : `Your module is clocked for ${sp.cycles || 40} cycles with random inputs${sp.reset ? `, starting with ${sp.reset.name} = ${sp.reset.active}` : ""}. Outputs are compared with a reference design after inputs change and after every rising edge of <code>${sp.clk}</code>.`;
  app.innerHTML = `<div class="wrap page"><div class="ws">
<section class="ws-desc">${descPanel("verilog", p, `<p class="note">${how}</p>`)}</section>
<section class="ws-main">
 <div class="edwrap"><div class="edbar"><span class="fname">${esc(sp.top)}.v</span><button class="btn btn--sm btn--ghost" id="reset">Reset code</button><button class="btn btn--sm btn--ink" id="run">▶ Simulate</button><button class="btn btn--sm btn--red" id="submit">Submit</button></div><div id="ed"></div></div>
 <div class="out" id="out"><div class="out-h">Simulation</div><div class="out-b"><p class="note"><b>Simulate</b> drives your design with sample inputs and draws the waveform. <b>Submit</b> checks it against the reference. Ctrl+Enter simulates.</p></div></div>
</section></div></div>`;
  const ed = makeEditor($("#ed"), store.code(id) || p.starter, "text/x-verilog", v => store.setCode(id, v));
  $("#reset").onclick = () => { if (confirm("Replace your code with the starter code?")) { ed.set(p.starter); store.clearCode(id); } };
  const out = (cls, head, body) => { $("#out").innerHTML = `<div class="out-h ${cls}">${head}</div><div class="out-b">${body}</div>`; };
  const warnHtml = w => w && w.length ? `<p class="note" style="margin-top:8px;color:#92400E">Warnings:</p><ul class="warnlist">${w.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  function run() {
    try {
      const r = autoRun(ed.get(), { top: sp.top, cycles: 16 });
      out("", `Waveform of your design <span class="note" style="font-weight:400">(sample inputs${r.clk ? ", " + r.clk + " driven automatically" : ""})</span>`, `<div id="wv"></div>${warnHtml(r.warnings)}${r.log ? `<p class="note" style="margin-top:8px">$display output:</p><pre>${esc(r.log)}</pre>` : ""}`);
      waveform($("#wv"), r.trace, r.design.ports);
    } catch (e) { if (e.line) ed.markLine(e.line); out("bad", "✗ Error", `<pre>${esc(e.message)}</pre>`); }
  }
  function submit() {
    const r = checkDesign(ed.get(), p.solution, sp);
    if (r.error) { if (r.errorLine) ed.markLine(r.errorLine); out("bad", "✗ Cannot check yet", `<pre>${esc(r.error)}</pre>${warnHtml(r.warnings)}`); return; }
    if (r.ok) {
      store.setSolved(id);
      out("ok", `✓ Accepted - ${r.passed} checks passed`, `<p>Your design matches the reference on every check.</p>${warnHtml(r.warnings)}<div id="wv" style="margin-top:10px"></div>`);
      toast("Accepted! Problem solved.");
    } else {
      const m = r.mismatch;
      out("bad", `✗ Mismatch at ${esc(m.label)}`, `<p class="note">Inputs: <code>${esc(m.inputs)}</code></p>
<div class="diff">${m.outs.map(o => `<b>${esc(o.name)}</b><span><span class="you">yours ${esc(o.you)}</span> · <span class="exp">expected ${esc(o.exp)}</span></span>`).join("")}</div>
<p class="note">${r.passed} checks passed before this. The red column in the waveform is the first mismatch.</p>${warnHtml(r.warnings)}<div id="wv" style="margin-top:10px"></div>`);
    }
    const ref = compilePorts(p.solution, sp.top);
    waveform($("#wv"), r.trace, ref, { compare: true });
  }
  $("#run").onclick = run; $("#submit").onclick = submit; $("#ed").addEventListener("run", run);
  wireSolution(p, box => { box.innerHTML = `<pre class="code">${esc(p.solution)}</pre><button class="btn btn--sm btn--ghost" id="useSol">Load it into the editor</button>`; $("#useSol").onclick = () => { if (confirm("Replace your code with the reference solution?")) ed.set(p.solution); }; });
}
function compilePorts(src, top) {
  // ports with direction and width, from the reference design (for the waveform layout)
  try { const r = autoRun(src, { top, cycles: 1 }); return r.design.ports.map(p => ({ name: p.name, dir: p.dir, w: p.w })); } catch (e) { return []; }
}

/* ---------- Circuit problem ---------- */
function kProblem(id) {
  const p = CIRCUIT_PROBLEMS.find(x => x.id === id); if (!p) return notFound();
  setTitle(p.title);
  store.setLast({ href: `#/practice/circuits/${id}`, title: p.title, kind: "Circuit problem" });
  const pal = p.allowed ? [...p.allowed] : PALETTE.filter(t => !["IN", "OUT", "CLK"].includes(t));
  app.innerHTML = `<div class="wrap page"><div class="ws ws--lab">
<section class="ws-desc">${descPanel("circuits", p, `<p class="note">${p.allowed ? `<b>Allowed parts:</b> ${p.allowed.join(", ")}. ` : ""}${p.par ? `Target: <b>${p.par} gate${p.par > 1 ? "s" : ""}</b> or fewer for a star.` : ""}</p>
<p class="note">Add parts from the left bar, drag from a pin to another pin to wire them, click inputs to test. The labelled pins are fixed.</p>`)}</section>
<section class="ws-main"><div id="lab"></div>
<div class="row"><button class="btn btn--red" id="check">Check circuit</button><button class="btn btn--ghost" id="resetC">Start over</button><span class="note" id="gcount"></span></div>
<div class="out" id="out"><div class="out-h">Result</div><div class="out-b"><p class="note">Press <b>Check circuit</b> to test every input combination${p.seq ? " (and clock sequence)" : ""}.</p></div></div></section></div></div>`;
  const saved = store.circuit(id);
  let editor;
  const mk = circ => {
    editor = new CircuitEditor($("#lab"), { circuit: circ, locked: lockedIds(p), palette: pal, width: 760, height: Math.max(420, 60 + Math.max(p.pins.in.length + (p.pins.clk ? 1 : 0), p.pins.out.length) * 80),
      onChange: c => { store.setCircuit(id, c); count(); } });
    count();
  };
  const count = () => { const n = editor.circ.comps.filter(c => !["IN", "OUT", "CLK", "ONE", "ZERO"].includes(c.type)).length; $("#gcount").textContent = `${n} gate${n === 1 ? "" : "s"} used${p.par ? ` · target ${p.par}` : ""}`; };
  mk(saved || problemCircuit(p));
  $("#resetC").onclick = () => { if (confirm("Remove everything you built?")) { store.clearCircuit(id); mk(problemCircuit(p)); } };
  $("#check").onclick = () => {
    const r = checkCircuit(editor.circ, checkSpec(p));
    if (r.error) { $("#out").innerHTML = `<div class="out-h bad">✗ ${esc(r.error)}</div>`; return; }
    const ins = p.seq ? ["clock", ...p.pins.in] : p.pins.in;
    const tbl = `<table class="ttab"><tr>${ins.map(n => `<th>${esc(n)}</th>`).join("")}${p.pins.out.map((n, i) => `<th class="${i === 0 ? "sepc" : ""}">${esc(n)}</th>`).join("")}<th>expected</th></tr>${r.rows.map(row => `<tr class="${row.good ? "good" : "bad"}">${ins.map(n => `<td>${row.in[n] ?? ""}</td>`).join("")}${p.pins.out.map((n, i) => `<td class="o${i === 0 ? " sepc" : ""}">${row.got[n]}</td>`).join("")}<td>${p.pins.out.map(n => row.exp[n]).join(" ")}</td></tr>`).join("")}</table>`;
    if (r.ok) {
      store.setSolved(id);
      const star = p.par && r.gates <= p.par;
      $("#out").innerHTML = `<div class="out-h ok">✓ Correct${star ? " ★ with the minimum gate count" : ""}</div><div class="out-b"><p>${r.gates} gate${r.gates === 1 ? "" : "s"} used${p.par && !star ? ` - it can be done with ${p.par}. Try again for the star!` : "."}</p>${tbl}</div>`;
      toast(star ? "Correct, and minimal! ★" : "Correct!");
    } else $("#out").innerHTML = `<div class="out-h bad">✗ ${r.rows.filter(x => !x.good).length} row${r.rows.filter(x => !x.good).length > 1 ? "s" : ""} wrong</div><div class="out-b"><p class="note">Red rows show where your outputs differ from the expected ones.</p>${tbl}</div>`;
  };
  wireSolution(p, box => { box.innerHTML = `<p class="note">The reference uses ${p.par} gate${p.par > 1 ? "s" : ""}. Loading it replaces your circuit.</p><button class="btn btn--sm btn--ghost" id="useSol">Load the reference circuit</button>`; $("#useSol").onclick = () => { if (confirm("Replace your circuit with the reference solution?")) { const c = solutionCircuit(p); store.setCircuit(id, c); mk(c); } }; });
}

/* ---------- MCQ runner ---------- */
function mcqPage(d) {
  const c = COURSES[d]; if (!c) return notFound();
  setTitle(c.title + " MCQs");
  const pool = mcqPool(d); const topics = [...new Set(pool.map(q => q.t))];
  app.innerHTML = `<div class="wrap page" style="max-width:820px"><div class="crumbs"><a href="#/practice">Practice</a><span>/</span><span>${c.title} MCQs</span></div>
<h1 class="h1">${c.title} MCQs</h1><div class="tabs" style="margin:6px 0 4px">${Object.values(COURSES).map(x => `<a href="#/practice/mcq/${x.id}" class="${x.id === d ? "on" : ""}">${x.title}</a>`).join("")}</div>
<div class="filters"><select id="mt" aria-label="Topic"><option value="">All topics</option>${topics.map(t => `<option>${esc(t)}</option>`).join("")}</select>
<select id="mm" aria-label="Which questions"><option value="new">Not answered yet</option><option value="wrong">Ones I got wrong</option><option value="all">All, shuffled</option></select>
<select id="mn" aria-label="Set size"><option value="10">10 questions</option><option value="20">20 questions</option><option value="999">All of them</option></select>
<button class="btn btn--red btn--sm" id="go">Start set</button></div><div id="mq"></div></div>`;
  let set = [], i = 0, right = 0;
  function start() {
    const T = $("#mt").value, M = $("#mm").value, N = +$("#mn").value;
    let qs = pool.filter(q => !T || q.t === T);
    if (M === "new") qs = qs.filter(q => store.mcq(q.id) == null); else if (M === "wrong") qs = qs.filter(q => store.mcq(q.id) === 0);
    qs = qs.sort(() => Math.random() - 0.5).slice(0, N);
    if (!qs.length) { $("#mq").innerHTML = `<div class="card empty">${M === "new" ? "You have answered every question here. Choose 'All, shuffled' to go again." : M === "wrong" ? "Nothing wrong here - great!" : "No questions."}</div>`; return; }
    set = qs; i = 0; right = 0; show();
  }
  function show() {
    if (i >= set.length) {
      const p = 100 * right / set.length;
      $("#mq").innerHTML = `<div class="card" style="text-align:center;padding:30px">${ring(p, p >= 70 ? "var(--green)" : "var(--amber)", 120, Math.round(p) + "%", `${right}/${set.length}`)}<h2 style="margin-top:12px">${p >= 80 ? "Excellent!" : p >= 60 ? "Good - review the misses." : "Keep going - re-read the lessons for the misses."}</h2><div class="row" style="justify-content:center;margin-top:14px"><button class="btn btn--red" id="again">Another set</button><a class="btn btn--ghost" href="#/learn/${d}">Back to lessons</a></div></div>`;
      $("#again").onclick = start; return;
    }
    const q = set[i];
    $("#mq").innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="note">Question ${i + 1} of ${set.length} · ${esc(q.t)}${q.src && q.src !== "Extra" ? " · from: " + esc(q.src) : ""}</span><span class="note">${right} correct</span></div>${bar(100 * i / set.length, c.color)}<div id="one" style="margin-top:12px"></div><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn btn--ink" id="next" disabled>Next →</button></div>`;
    renderQuiz($("#one"), [q]);
    $("#one").addEventListener("click", e => { const b = e.target.closest(".opt"); if (!b) return; setTimeout(() => { if (store.mcq(q.id) === 1 && !q._c) { right++; q._c = 1; } $("#next").disabled = false; $("#next").focus(); }, 0); });
    $("#next").onclick = () => { i++; show(); };
  }
  $("#go").onclick = start;
  start();
}

/* ======================================================================== */
/* INTERVIEW                                                                 */
/* ======================================================================== */
function interviewIndex() {
  setTitle("Interview prep");
  app.innerHTML = `<div class="wrap page"><span class="kicker">Interview prep</span><h1 class="h1">Can you explain what you know?</h1>
<p class="lead">Type your answer the way you would say it in the room. Then check which key points you covered and compare with a model answer. Mark each one "nailed it" or "review again".</p>
<div class="grid g2" style="margin-top:22px">${Object.values(COURSES).map(c => { const pool = ivPool(c.id), g = pool.filter(q => store.iv(q.id).rating === "good").length, r = pool.filter(q => store.iv(q.id).rating === "review").length;
    return `<a class="card tile" href="#/interview/${c.id}" style="--c:${c.color}"><h3 style="font-size:22px">${c.title}</h3><p>${pool.length} questions across ${[...new Set(pool.map(q => q.t))].join(", ")}.</p><p class="note">${g} nailed · ${r} to review</p>${bar(100 * g / pool.length, c.color)}<span class="go">Practise →</span></a>`; }).join("")}</div>
<div class="card" style="margin-top:18px"><b>Tip: use an AI as your interviewer.</b><p class="note" style="margin-top:4px">Each question has a "Copy AI grading prompt" button. Paste it into any AI chat with your answer to get a score, a better answer and follow-up questions.</p></div></div>`;
}
function interviewPage(d, qid) {
  const c = COURSES[d]; if (!c) return notFound();
  setTitle(c.title + " interview questions");
  const pool = ivPool(d); const topics = [...new Set(pool.map(q => q.t))];
  let filt = { t: "", s: "" };
  let cur = pool.find(q => q.id === qid) || pool.find(q => !store.iv(q.id).rating) || pool[0];
  app.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/interview">Interview prep</a><span>/</span><span>${c.title}</span></div>
<div class="row" style="justify-content:space-between"><h1 class="h1">${c.title} interview questions</h1><div class="tabs">${Object.values(COURSES).map(x => `<a href="#/interview/${x.id}" class="${x.id === d ? "on" : ""}">${x.title}</a>`).join("")}</div></div>
<div class="ws ws--iv" style="margin-top:10px">
<section id="qcard"></section>
<aside><div class="filters" style="margin-top:0"><select id="it" aria-label="Topic"><option value="">All topics</option>${topics.map(t => `<option>${esc(t)}</option>`).join("")}</select>
<select id="is" aria-label="Status"><option value="">Any status</option><option value="none">Not tried</option><option value="review">To review</option><option value="good">Nailed</option></select>
<button class="btn btn--sm btn--ghost" id="rnd">Random</button></div><div class="ivlist" id="il"></div></aside></div></div>`;
  function list() {
    const rows = pool.filter(q => (!filt.t || q.t === filt.t) && (!filt.s || (filt.s === "none" ? !store.iv(q.id).rating : store.iv(q.id).rating === filt.s)));
    $("#il").innerHTML = rows.map(q => `<button type="button" class="ivrow${q === cur ? " cur" : ""}" data-id="${q.id}"><span class="dot ${store.iv(q.id).rating || ""}"></span><span>${esc(q.q)}</span><span class="note">${esc(q.t)}</span></button>`).join("") || '<div class="empty">Nothing here.</div>';
  }
  function show() {
    const s = store.iv(cur.id); const idx = pool.indexOf(cur);
    history.replaceState(null, "", `#/interview/${d}/${cur.id}`);
    $("#qcard").innerHTML = `<div class="ivq"><div class="meta"><span><b>${esc(cur.t)}</b> · ${esc(cur.lv)}</span><span>${idx + 1} / ${pool.length}</span></div>
<h2>${esc(cur.q)}</h2><label class="sr" for="ans">Your answer</label><textarea id="ans" placeholder="Type your answer as you would say it...">${esc(s.answer || "")}</textarea>
<div class="row"><button class="btn btn--red" id="chk">Check my answer</button><button class="btn btn--ghost" id="show">Just show the answer</button><button class="btn btn--ghost" id="ai">Copy AI grading prompt</button></div>
<div id="res"></div></div>
<div class="pager"><button class="btn btn--ghost btn--sm" id="prevQ" ${idx ? "" : "disabled"}>← Previous</button><button class="btn btn--ghost btn--sm" id="nextQ">Next question →</button></div>`;
    const reveal = scoreIt => {
      const ans = $("#ans").value.trim(); store.setIv(cur.id, { answer: ans });
      let hit = 0;
      const keys = cur.keys.map(([label, re]) => { const h = scoreIt && new RegExp(re, "i").test(ans); if (h) hit++; return `<span class="key${h ? " hit" : ""}">${h ? "✓ " : ""}${esc(label)}</span>`; }).join("");
      const sc = Math.round(10 * hit / cur.keys.length);
      $("#res").innerHTML = `<div class="model"><h4>MODEL ANSWER</h4><p>${esc(cur.a)}</p><h4 style="margin-top:12px">KEY POINTS${scoreIt ? " YOU MENTIONED" : ""}</h4><div class="keys">${keys}</div>
${scoreIt ? `<div class="score">Covered <b>${hit} / ${cur.keys.length}</b> key points → rough score <b>${ans ? Math.max(1, sc) : 0}/10</b>. Keyword matching is only a guide - judge your own clarity too.</div>` : ""}
<div class="row" style="margin-top:12px"><button class="btn btn--green btn--sm" data-r="good">✓ I nailed it</button><button class="btn btn--sm" style="background:var(--amber);color:#fff" data-r="review">↻ Review again</button></div></div>`;
      $$("[data-r]", $("#res")).forEach(b => b.onclick = () => { store.setIv(cur.id, { rating: b.dataset.r }); list(); toast(b.dataset.r === "good" ? "Marked as nailed." : "Added to your review list."); next(); });
    };
    $("#chk").onclick = () => { if (!$("#ans").value.trim()) { toast("Write an answer first (even a short one)."); $("#ans").focus(); return; } reveal(true); };
    $("#show").onclick = () => reveal(false);
    $("#ai").onclick = async () => toast(await copy(gradePrompt(d, cur, $("#ans").value.trim())) ? "Prompt copied - paste it into any AI chat." : "Could not copy.");
    $("#ans").addEventListener("input", () => store.setIv(cur.id, { answer: $("#ans").value }));
    $("#prevQ").onclick = () => { cur = pool[Math.max(0, idx - 1)]; show(); list(); };
    $("#nextQ").onclick = next;
    list();
  }
  function next() { const idx = pool.indexOf(cur); cur = pool[(idx + 1) % pool.length]; show(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  $("#il").addEventListener("click", e => { const b = e.target.closest(".ivrow"); if (!b) return; cur = pool.find(q => q.id === b.dataset.id); show(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("#it").onchange = () => { filt.t = $("#it").value; list(); };
  $("#is").onchange = () => { filt.s = $("#is").value; list(); };
  $("#rnd").onclick = () => { const rows = pool.filter(q => (!filt.t || q.t === filt.t)); cur = rows[Math.floor(Math.random() * rows.length)] || cur; show(); };
  show();
}

/* ======================================================================== */
/* LABS                                                                      */
/* ======================================================================== */
function labsIndex() {
  setTitle("Labs");
  app.innerHTML = `<div class="wrap page"><span class="kicker">Labs</span><h1 class="h1">Free play</h1><p class="lead">No problem statement, no checker - just tools. Everything runs in your browser and your work is kept on this device.</p>
<div class="grid g4" style="margin-top:22px">
${tile("#/labs/c", "var(--blue)", "C playground", "Write and run any C program with standard input. A real compiler, about 20 ms per run.", "Open", icon("code"))}
${tile("#/labs/verilog", "var(--vlsi)", "Verilog simulator", "Simulate your RTL with automatic stimulus and see the waveform.", "Open", icon("code"))}
${tile("#/labs/circuit", "var(--red)", "Circuit sandbox", "Every gate, mux and flip-flop. Build anything and print its truth table.", "Open", icon("flask"))}
${tile("#/labs/tools", "var(--teal)", "K-map and calculators", "K-map solver, timer/PWM calculator, UART frame viewer, register bits.", "Open", icon("book"))}
</div></div>`;
}
const C_SAMPLE = `#include <stdio.h>
#include <stdint.h>

int main(void) {
  uint8_t a = 200, b = 100;
  uint8_t sum = a + b;           /* wraps around */
  printf("200 + 100 as uint8_t = %u\\n", sum);

  int n;
  if (scanf("%d", &n) == 1)
    printf("you typed %d, in hex 0x%X\\n", n, n);
  return 0;
}
`;
const V_SAMPLE = `// Edit and press Simulate. Inputs named clk / rst are driven automatically.
module counter (
  input            clk,
  input            rst,
  input            en,
  output reg [3:0] count,
  output           max
);
  always @(posedge clk) begin
    if (rst)     count <= 4'd0;
    else if (en) count <= count + 1'b1;
  end
  assign max = &count;
endmodule
`;
function cLab() {
  setTitle("C playground");
  app.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/labs">Labs</a><span>/</span><span>C playground</span></div><h1 class="h1">C playground</h1>
<p class="lead">32-bit C compiler (xcc) compiled to WebAssembly. Array bounds and NULL pointers are checked at run time, and programs are stopped after 4 seconds.</p>
<div class="ws ws--play" style="margin-top:16px">
<div class="edwrap"><div class="edbar"><span class="fname">playground.c</span><button class="btn btn--sm btn--ghost" id="reset">Reset</button><button class="btn btn--sm btn--red" id="run">▶ Run</button></div><div id="ed"></div></div>
<div class="ws-main"><label class="note" for="stdin">Input (stdin)</label><textarea id="stdin" class="stdin" spellcheck="false">42</textarea><div class="out" id="out"><div class="out-h">Output</div><div class="out-b"><p class="note">Press Run (or Ctrl+Enter).</p></div></div></div></div></div>`;
  const ed = makeEditor($("#ed"), store.code("lab-c") || C_SAMPLE, "text/x-csrc", v => store.setCode("lab-c", v));
  getC().then(m => m.warmUp()).catch(() => { });
  $("#reset").onclick = () => { if (confirm("Reset to the sample program?")) { ed.set(C_SAMPLE); store.clearCode("lab-c"); } };
  async function run() {
    $("#run").disabled = true; $("#out").innerHTML = '<div class="out-h"><span class="spin"></span> Running...</div>';
    try {
      const r = await (await getC()).runProgram(ed.get(), $("#stdin").value);
      const m = /main\.c\((\d+)\)/.exec(r.err || ""); if (m) ed.markLine(+m[1]);
      $("#out").innerHTML = r.phase === "done" ? `<div class="out-h ok">Finished in ${r.ms} ms</div><div class="out-b"><pre>${esc(r.out || "(no output)")}</pre></div>`
        : `<div class="out-h bad">${r.phase === "compile" ? "Compile error" : r.phase === "timeout" ? "Time limit" : "Runtime error"}</div><div class="out-b"><pre>${esc(r.err)}</pre>${r.out ? `<pre style="margin-top:8px">${esc(r.out)}</pre>` : ""}</div>`;
    } finally { $("#run").disabled = false; }
  }
  $("#run").onclick = run; $("#ed").addEventListener("run", run);
}
function vLab() {
  setTitle("Verilog simulator");
  app.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/labs">Labs</a><span>/</span><span>Verilog simulator</span></div><h1 class="h1">Verilog simulator</h1>
<p class="lead">Two-state simulation of synthesizable Verilog: modules and instances, parameters, assign, always @(*) and clocked blocks, case, for loops, memories and $display. The last module (or the one nobody instantiates) is the top.</p>
<div class="edwrap" style="margin-top:16px"><div class="edbar"><span class="fname">design.v</span><label class="note">cycles <input id="cyc" type="number" value="16" min="2" max="200" style="width:64px;border:1px solid var(--line);border-radius:6px;padding:3px 6px"></label><button class="btn btn--sm btn--ghost" id="reset">Reset</button><button class="btn btn--sm btn--red" id="run">▶ Simulate</button></div><div id="ed"></div></div>
<div class="out" id="out" style="margin-top:12px"><div class="out-h">Waveform</div><div class="out-b"><p class="note">Press Simulate (or Ctrl+Enter). Inputs get random values; clk and reset are driven for you.</p></div></div></div>`;
  const ed = makeEditor($("#ed"), store.code("lab-v") || V_SAMPLE, "text/x-verilog", v => store.setCode("lab-v", v));
  $("#reset").onclick = () => { if (confirm("Reset to the sample design?")) { ed.set(V_SAMPLE); store.clearCode("lab-v"); } };
  function run() {
    try {
      const r = autoRun(ed.get(), { cycles: Math.max(2, Math.min(200, +$("#cyc").value || 16)), seed: Date.now() % 100000 });
      $("#out").innerHTML = `<div class="out-h ok">Top module: ${esc(r.design.top)}</div><div class="out-b"><div id="wv"></div>${r.warnings.length ? `<ul class="warnlist">${r.warnings.map(w => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}${r.log ? `<p class="note" style="margin-top:8px">$display output:</p><pre>${esc(r.log)}</pre>` : ""}</div>`;
      waveform($("#wv"), r.trace, r.design.ports, { maxSteps: 400 });
    } catch (e) { if (e.line) ed.markLine(e.line); $("#out").innerHTML = `<div class="out-h bad">Error</div><div class="out-b"><pre>${esc(e.message)}</pre></div>`; }
  }
  $("#run").onclick = run; $("#ed").addEventListener("run", run);
}
function circuitLab() {
  setTitle("Circuit sandbox");
  app.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/labs">Labs</a><span>/</span><span>Circuit sandbox</span></div><h1 class="h1">Circuit sandbox</h1>
<p class="lead">Add inputs, gates and outputs; drag from pin to pin to wire. Click an input to flip it, click a clock for one pulse. Double-click an input or output to rename it. Ctrl+Z undoes.</p>
<div id="lab" style="margin-top:14px"></div><div class="row" style="margin-top:10px"><button class="btn btn--ink" id="tt">Show truth table</button><span class="note">Your circuit is saved on this device.</span></div><div id="ttout" style="margin-top:10px"></div></div>`;
  const ed = new CircuitEditor($("#lab"), { circuit: store.circuit("lab") || { comps: [{ id: "c1", type: "IN", label: "A", x: 40, y: 60 }, { id: "c2", type: "IN", label: "B", x: 40, y: 160 }, { id: "c3", type: "AND", n: 2, x: 300, y: 90 }, { id: "c4", type: "OUT", label: "Y", x: 540, y: 100 }], wires: [{ from: { c: "c1", p: "o0" }, to: { c: "c3", p: "i0" } }, { from: { c: "c2", p: "o0" }, to: { c: "c3", p: "i1" } }, { from: { c: "c3", p: "o0" }, to: { c: "c4", p: "i0" } }] },
    height: 560, onChange: c => store.setCircuit("lab", c) });
  $("#tt").onclick = () => {
    const t = truthTable(ed.circ);
    if (!t) { $("#ttout").innerHTML = '<p class="note">Add at least one Input and one Output.</p>'; return; }
    if (t.tooMany) { $("#ttout").innerHTML = '<p class="note">Too many inputs for a table (max 6).</p>'; return; }
    $("#ttout").innerHTML = `<div class="card" style="overflow-x:auto"><table class="ttab"><tr>${t.ins.map(n => `<th>${esc(n)}</th>`).join("")}${t.outs.map((n, i) => `<th class="${i ? "" : "sepc"}">${esc(n)}</th>`).join("")}</tr>${t.rows.map(r => `<tr>${r.ins.map(v => `<td>${v}</td>`).join("")}${r.outs.map((v, i) => `<td class="${i ? "" : "sepc"}">${r.osc ? "~" : v}</td>`).join("")}</tr>`).join("")}</table><p class="note" style="margin-top:6px">Flip-flops are taken at their current state; "~" means the circuit oscillates.</p></div>`;
  };
}
function toolsLab() {
  setTitle("Tools");
  app.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/labs">Labs</a><span>/</span><span>Tools</span></div><h1 class="h1">K-map and calculators</h1>
<div class="grid g2" style="margin-top:16px;align-items:start"><div id="t1"></div><div id="t2"></div><div id="t3"></div><div id="t4"></div><div id="t5"></div><div id="t6"></div></div></div>`;
  kmapWidget($("#t1"), { vars: 4 }); pwmWidget($("#t2")); uartWidget($("#t3")); bitsWidget($("#t4")); dffWidget($("#t5")); gateWidget($("#t6"));
}

/* ======================================================================== */
/* PROGRESS                                                                  */
/* ======================================================================== */
function progressPage() {
  setTitle("Progress");
  const L = d => { const ls = allLessons(d); return { d: ls.filter(l => store.lessonDone(l.id)).length, n: ls.length }; };
  const P = k => { const l = KINDS[k].list; return { d: l.filter(p => store.solved(p.id)).length, n: l.length }; };
  const M = d => { const pool = mcqPool(d); const ans = pool.filter(q => store.mcq(q.id) != null); return { d: ans.length, n: pool.length, acc: ans.length ? 100 * ans.filter(q => store.mcq(q.id) === 1).length / ans.length : 0 }; };
  const I = d => { const pool = ivPool(d); return { d: pool.filter(q => store.iv(q.id).rating === "good").length, r: pool.filter(q => store.iv(q.id).rating === "review").length, n: pool.length }; };
  const cardP = (t, x, c, sub) => `<div class="card pcard">${ring(x.n ? 100 * x.d / x.n : 0, c, 80, Math.round(x.n ? 100 * x.d / x.n : 0) + "%")}<div><h3>${t}</h3><p>${sub || `${x.d} of ${x.n}`}</p></div></div>`;
  const days = store.days(); const list = [];
  for (let i = 27; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; list.push({ d, v: days[k] || 0 }); }
  const mx = Math.max(5, ...list.map(x => x.v));
  const me = M("embedded"), mv = M("vlsi"), ie = I("embedded"), iv = I("vlsi");
  app.innerHTML = `<div class="wrap page"><span class="kicker">Progress</span><h1 class="h1">How far you have come</h1><p class="lead">Saved in this browser only. Use Export to back it up or move it to another device.</p>
<h2 style="font-size:20px;margin:24px 0 10px">Courses</h2><div class="grid g2">${cardP("Embedded lessons", L("embedded"), "var(--emb)")}${cardP("VLSI lessons", L("vlsi"), "var(--vlsi)")}</div>
<h2 style="font-size:20px;margin:24px 0 10px">Problems</h2><div class="grid g3">${cardP("Embedded C", P("c"), "var(--blue)")}${cardP("Verilog", P("verilog"), "var(--vlsi)")}${cardP("Circuits", P("circuits"), "var(--red)")}</div>
<h2 style="font-size:20px;margin:24px 0 10px">MCQs and interview</h2><div class="grid g4">${cardP("Embedded MCQs", me, "var(--emb)", `${me.d}/${me.n} answered · ${Math.round(me.acc)}% right`)}${cardP("VLSI MCQs", mv, "var(--vlsi)", `${mv.d}/${mv.n} answered · ${Math.round(mv.acc)}% right`)}${cardP("Embedded interview", ie, "var(--red)", `${ie.d} nailed · ${ie.r} to review`)}${cardP("VLSI interview", iv, "var(--red)", `${iv.d} nailed · ${iv.r} to review`)}</div>
<h2 style="font-size:20px;margin:24px 0 10px">Last 4 weeks <span class="note" style="font-weight:400">· streak ${store.streak()} day${store.streak() === 1 ? "" : "s"}</span></h2>
<div class="card"><svg viewBox="0 0 560 120" style="width:100%;height:auto" role="img" aria-label="Activity per day">${list.map((x, i) => `<rect x="${i * 20 + 2}" y="${100 - 90 * x.v / mx}" width="15" height="${Math.max(2, 90 * x.v / mx)}" rx="3" fill="${x.v ? "var(--red)" : "#ECEAE3"}"><title>${x.d.toDateString()}: ${x.v} actions</title></rect>${i % 7 === 0 ? `<text x="${i * 20 + 2}" y="116" class="wv-step">${x.d.getDate()}/${x.d.getMonth() + 1}</text>` : ""}`).join("")}</svg></div>
<h2 style="font-size:20px;margin:24px 0 10px">Back up</h2>
<div class="row"><button class="btn btn--ink" id="exp">Export progress</button><label class="btn btn--ghost">Import progress<input type="file" id="imp" accept=".json,application/json" hidden></label><button class="btn btn--ghost" id="rst" style="color:var(--red-d)">Reset everything</button><a class="btn btn--ghost" href="${TRACKER_URL}" target="_blank" rel="noopener">My 12-week tracker ↗</a></div></div>`;
  $("#exp").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([store.exportJSON()], { type: "application/json" })); a.download = `spidy-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  $("#imp").onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { store.importJSON(t); toast("Progress imported."); progressPage(); } catch (x) { toast("That file is not a Spidy backup."); } }); };
  $("#rst").onclick = () => { if (confirm("Delete all progress, saved code and circuits on this device? This cannot be undone.")) { store.reset(); progressPage(); toast("Everything reset."); } };
}

function notFound() { setTitle("Not found"); app.innerHTML = `<div class="wrap page"><h1 class="h1">Page not found</h1><p class="lead">That link does not match anything here.</p><a class="btn btn--red" href="#/" style="margin-top:14px">Go home</a></div>`; }

/* ======================================================================== */
/* ROUTER                                                                    */
/* ======================================================================== */
function route() {
  cleanup.forEach(f => f()); cleanup = [];
  $("#toast").classList.remove("on");
  const parts = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
  const [a, b, c2] = parts;
  $$(".nav a").forEach(x => x.classList.toggle("on", x.dataset.nav === (a || "home")));
  try {
    if (!a) home();
    else if (a === "learn") !b ? learnIndex() : !c2 ? course(b) : lesson(b, c2);
    else if (a === "practice") {
      if (!b) practiceIndex();
      else if (b === "mcq") mcqPage(c2 || "embedded");
      else if (!c2) problemList(b);
      else ({ c: cProblem, verilog: vProblem, circuits: kProblem }[b] || notFound)(c2);
    }
    else if (a === "interview") !b ? interviewIndex() : interviewPage(b, c2);
    else if (a === "labs") !b ? labsIndex() : ({ c: cLab, verilog: vLab, circuit: circuitLab, tools: toolsLab }[b] || notFound)();
    else if (a === "progress") progressPage();
    else notFound();
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div class="wrap page"><h1 class="h1">Something went wrong</h1><pre class="code">${esc(e.stack || e.message)}</pre></div>`;
  }
  if (!location.hash.startsWith("#/interview/") || !parts[2]) window.scrollTo(0, 0);
  const m = $("main"); if (m) m.focus({ preventScroll: true });
}
window.addEventListener("hashchange", route);
route();
