/* Learn: tracks -> roadmap -> module (Learn / Watch / Practice / Simulate / Test / Interview / Revise) -> lesson */
import { store } from "../store.js";
import { TRACKS, TRACK, MODS, Q, LESSONS, SIMS, resourcesFor, TYPE_NAME } from "../registry.js";
import { modStats, trackStats, qDone, qTried, revisionDue } from "../stats.js";
import { $, $$, esc, app, setTitle, pill, tick, bar, ring, pct, plural, fmtMins, toast, copy, extLink, empty, tutorPrompt, icon } from "../ui.js";
import { renderQ, toolsHtml, wireTools, solHtml } from "../qview.js";
import { gateWidget, dffWidget, bitsWidget, uartWidget, pwmWidget, kmapWidget } from "../widgets.js";

const statusPill = s => s.status === "done" ? pill("Completed", "done") : s.status === "progress" ? pill("In progress", "prog") : pill("Not started", "todo");

/* ---------------------------------------------------------------- tracks */
export function learnIndex() {
  setTitle("Learn");
  app().innerHTML = `<div class="wrap page"><span class="kicker">Learn</span><h1 class="h1">Pick a track. Follow the roadmap.</h1>
<p class="lead">Every track is an ordered roadmap of modules. Each module has notes and topics to learn, curated videos, practice questions, simulations, a quick test, interview questions and a revision sheet.</p>
<div class="grid g3" style="margin-top:22px">${TRACKS.map(t => { const s = trackStats(t); const nq = t.mods.reduce((a, id) => a + MODS.get(id).qs.filter(x => Q.get(x).type !== "self").length, 0);
    return `<a class="card tile" href="#/learn/${t.id}" style="--c:${t.color}"><div class="row" style="justify-content:space-between;align-items:flex-start"><h3>${esc(t.title)}</h3>${ring(s.pct, t.color, 54, pct(s.pct))}</div><p>${esc(t.blurb)}</p>
<p class="note">${t.mods.length} modules · ${nq} questions · ${s.done} completed</p>${bar(s.pct, t.color)}<span class="go">Open roadmap →</span></a>`; }).join("")}</div>
<div class="card" style="margin-top:20px"><b>How a module works</b><p class="note" style="margin-top:4px">Learn the topics (tick each one when you can explain it) → watch one linked video if the notes are not enough → practise the questions → try the simulation → take the 10-question test → answer the interview questions out loud → revise from the formula sheet and your mistakes.</p></div></div>`;
}

/* ---------------------------------------------------------------- roadmap (Striver-style) */
export function trackPage(tid) {
  const t = TRACK[tid]; if (!t) return notFoundHere();
  setTitle(t.title);
  const s = trackStats(t);
  const next = t.mods.find(id => modStats(id).status !== "done");
  let n = 0;
  app().innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/learn">Learn</a><span>/</span><span>${esc(t.title)}</span></div>
<div class="course-head"><div><h1 class="h1">${esc(t.title)}</h1><p class="lead">${esc(t.blurb)}</p></div>
<div class="card" style="min-width:250px"><div class="row" style="justify-content:space-between"><b>${s.done} / ${s.n} modules</b><span class="note">${pct(s.pct)}</span></div>${bar(s.pct, t.color)}
${next ? `<a class="btn btn--red" style="margin-top:12px;width:100%" href="#/m/${next}">${modStats(next).status === "todo" ? "Start" : "Continue"}: ${esc(MODS.get(next).title)}</a>` : `<p class="note" style="margin-top:10px">Track complete. Keep it fresh with <a href="#/mock?track=${t.id}">a mock test</a>.</p>`}</div></div>
<div class="row" style="margin-bottom:8px"><button class="btn btn--sm btn--ghost" id="expAll">Expand all</button><button class="btn btn--sm btn--ghost" id="colAll">Collapse all</button><a class="btn btn--sm btn--ghost" href="#/practice?track=${t.id}">All ${esc(t.short)} questions</a><a class="btn btn--sm btn--ghost" href="#/mock?track=${t.id}">Mock test</a></div>
${t.parts.map(p => { const ms = p.mods.filter(id => MODS.has(id)); const ps = ms.map(id => modStats(id)); const pp = ps.reduce((a, x) => a + x.pct, 0) / (ps.length || 1);
    return `<section class="rm-part"><div class="rm-part__h"><h2>${esc(p.title)}</h2><span class="note">${ps.filter(x => x.status === "done").length}/${ms.length} · ${pct(pp)}</span><div style="flex:1;max-width:220px">${bar(pp, t.color)}</div></div>
${ms.map(id => { const m = MODS.get(id), st = modStats(m), shared = m.track !== t.id; n++;
      const nq = st.pN + st.sN;
      return `<details class="rm-mod${st.status === "done" ? " done" : ""}" data-m="${m.id}"><summary><span class="rm-num">${n}</span>${tick(st.status === "done")}<span class="rm-title">${esc(m.name || m.title)}${shared ? ` <span class="note">(also in ${esc(TRACK[m.track].short)})</span>` : ""}</span>
<span class="rm-meta">${m.lessons.length ? `<span class="badge" title="Has a full lesson">Lesson</span>` : ""}${(m.sims || []).length ? `<span class="badge" title="Has a simulation">Sim</span>` : ""}<span class="note">${plural(nq, "item")}</span>${pill(m.level)}<span class="rm-pct">${pct(st.pct)}</span></span></summary>
<div class="rm-body"><ol class="rm-topics">${m.topics.map(tp => `<li><label class="chk"><input type="checkbox" data-t="${esc(tp.id)}" ${store.done(tp.id) ? "checked" : ""}><span><b>${esc(tp.n)}</b>${tp.learn ? `<span class="note"> - ${esc(tp.learn)}</span>` : ""}</span></label></li>`).join("")}</ol>
<div class="row"><a class="btn btn--sm btn--red" href="#/m/${m.id}">Open module →</a><a class="btn btn--sm btn--ghost" href="#/m/${m.id}/practice">Practice (${st.pN})</a><a class="btn btn--sm btn--ghost" href="#/m/${m.id}/test">Test</a><span class="note">${st.tDone}/${st.tN} topics · ${st.pDone}/${st.pN} questions solved${st.acc != null ? ` · ${Math.round(st.acc)}% accuracy` : ""}</span></div></div></details>`; }).join("")}</section>`; }).join("")}</div>`;
  $(".page", app()).addEventListener("change", e => { const c = e.target.closest("input[data-t]"); if (!c) return; store.setDone(c.dataset.t, c.checked); });
  $("#expAll").onclick = () => $$(".rm-mod").forEach(d => d.open = true);
  $("#colAll").onclick = () => $$(".rm-mod").forEach(d => d.open = false);
}

/* ---------------------------------------------------------------- module */
const TABS = [["learn", "Learn"], ["watch", "Watch"], ["practice", "Practice"], ["simulate", "Simulate"], ["test", "Test"], ["interview", "Interview"], ["revise", "Revise"]];
export function modulePage(id, tab) {
  const m = MODS.get(id); if (!m) return notFoundHere();
  if (!TABS.some(x => x[0] === tab)) tab = "learn";
  const t = TRACK[m.track], st = modStats(m);
  setTitle(m.title);
  store.setLast({ href: `#/m/${m.id}/${tab}`, title: m.title, kind: `${t.title} module` });
  const ids = t.mods, i = ids.indexOf(m.id), prev = MODS.get(ids[i - 1]), next = MODS.get(ids[i + 1]);
  const qs = m.qs.map(x => Q.get(x));
  const cnt = { practice: qs.filter(q => q.type !== "self").length + qs.filter(q => q.type === "self").length, interview: qs.filter(q => q.type === "con").length + m.topics.reduce((a, x) => a + x.probs.length, 0), simulate: (m.sims || []).length, watch: resourcesFor(m).length };
  app().innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/learn">Learn</a><span>/</span><a href="#/learn/${t.id}">${esc(t.title)}</a><span>/</span><span>${esc(m.part)}</span></div>
<div class="mod-head"><div><h1 class="h1">${esc(m.title)}</h1>
<div class="row">${statusPill(st)}${pill(m.level)}<span class="note">about ${fmtMins(m.mins)} · ${plural(m.topics.length, "topic")} · ${plural(st.pN, "question")}${st.sN ? ` · ${st.sN} checklist tasks` : ""}${m.when ? ` · tracker: ${esc(m.when)}` : ""}</span></div></div>
<div class="mod-prog">${ring(st.pct, t.color, 64, pct(st.pct))}<div class="note">${st.tDone}/${st.tN} topics<br>${st.pDone}/${st.pN} solved${st.acc != null ? `<br>${Math.round(st.acc)}% accuracy` : ""}</div></div></div>
<nav class="mtabs" aria-label="Module sections">${TABS.map(([k, l]) => `<a href="#/m/${m.id}/${k}" class="${k === tab ? "on" : ""}" ${k === tab ? 'aria-current="page"' : ""}>${l}${cnt[k] != null ? ` <span>${cnt[k]}</span>` : ""}</a>`).join("")}</nav>
<div id="tab" class="tabbody"></div>
<div class="pager">${prev ? `<a class="btn btn--ghost btn--sm" href="#/m/${prev.id}">← ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="btn btn--ghost btn--sm" href="#/m/${next.id}">${esc(next.title)} →</a>` : ""}</div></div>`;
  ({ learn: tabLearn, watch: tabWatch, practice: tabPractice, simulate: tabSim, test: tabTest, interview: tabInterview, revise: tabRevise })[tab]($("#tab"), m);
}

function tabLearn(host, m) {
  const ls = m.lessons.map(id => LESSONS.get(id));
  host.innerHTML = `<div class="split"><div>
${m.desc ? `<p class="lead" style="margin-bottom:12px">${esc(m.desc)}</p>` : ""}
${m.notes.length ? `<div class="callout">${m.notes.map(n => `<p>${esc(n)}</p>`).join("")}</div>` : ""}
${m.formulas.length ? `<h3 class="h3">Key formulas</h3>${m.formulas.map(f => `<div class="formula">${esc(f)}</div>`).join("")}` : ""}
${ls.length ? `<h3 class="h3">Lesson${ls.length > 1 ? "s" : ""}</h3><div class="lessons">${ls.map(l => `<a class="lrow" href="#/lesson/${l.id}">${tick(store.lessonDone(l.id))}<div><h3>${esc(l.title)}</h3><p>${esc(l.sum)}</p></div><span class="meta">${l.demo ? "demo · " : ""}${l.mins} min</span></a>`).join("")}</div>`
      : `<div class="callout warn"><p><b>Study notes, not a full lesson.</b> This module gives you the topic list, what to learn in each, practice and resources. For explanations, use the videos in <a href="#/m/${m.id}/watch">Watch</a> or the AI tutor prompt below.</p></div>`}
<h3 class="h3">Topics <span class="note" style="font-weight:400">· tick a topic when you can explain it without notes</span></h3>
<ol class="topics">${m.topics.map(tp => `<li class="topic"><label class="chk"><input type="checkbox" data-t="${esc(tp.id)}" ${store.done(tp.id) ? "checked" : ""}><span><b>${esc(tp.n)}</b></span></label>
${tp.learn ? `<p class="topic__l">${esc(tp.learn)}</p>` : ""}${tp.probs.length ? `<ul class="topic__p">${tp.probs.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}</li>`).join("") || '<li class="note">No topics.</li>'}</ol></div>
<aside class="side"><div class="card side-card"><h4>Next steps</h4><div class="plinks">
<a href="#/m/${m.id}/practice">${icon("code")}<span>Practise ${m.qs.length ? "the questions" : ""}</span></a>${(m.sims || []).length ? `<a href="#/m/${m.id}/simulate">${icon("flask")}<span>Try the simulation</span></a>` : ""}
<a href="#/m/${m.id}/test">${icon("timer")}<span>Take the module test</span></a><a href="#/m/${m.id}/interview">${icon("mic")}<span>Interview questions</span></a></div></div>
<div class="card side-card"><h4>AI tutor</h4><p class="note">Copies a teaching prompt for this module - paste it into any AI chat.</p><button class="btn btn--sm btn--ghost" id="tutor" style="margin-top:8px">Copy AI tutor prompt</button></div></aside></div>`;
  host.addEventListener("change", e => { const c = e.target.closest("input[data-t]"); if (c) { store.setDone(c.dataset.t, c.checked); if (c.checked) toast("Topic ticked."); } });
  $("#tutor").onclick = async () => toast(await copy(tutorPrompt(m)) ? "Prompt copied - paste it into any AI chat." : "Could not copy.");
}

function tabWatch(host, m) {
  const rs = resourcesFor(m);
  host.innerHTML = `<p class="lead">Free, legitimate resources picked for this module. They open on other sites - this site only links to them and does not copy their content.</p>
<div class="extlist" style="margin-top:14px">${rs.map(extLink).join("")}</div>
<p class="note" style="margin-top:12px">"YouTube search" links run a search for this module so you can pick a current, well-rated video. Channel and site links were checked when this site was built; if one moves, use the search link.</p>`;
}

export function qRow(q, ctxq) {
  const a = store.att(q.id), d = qDone(q), tr = qTried(q);
  const st = d ? '<span class="st st--ok">✓</span>' : tr ? '<span class="st st--try">•</span>' : '<span class="st"></span>';
  return `<a class="qrow" href="#/q/${encodeURIComponent(q.id)}${ctxq ? "?" + ctxq : ""}">${st}<span class="qrow__t">${esc(q.title || q.q)}</span><span class="qrow__m">${pill(TYPE_NAME(q.type), "type")}${q.level ? pill(q.level) : ""}${store.bm(q.id) ? '<span title="Bookmarked">★</span>' : ""}${a && q.type !== "self" ? `<span class="note">${a.ok}/${a.n}</span>` : ""}</span></a>`;
}
function tabPractice(host, m) {
  const qs = m.qs.map(id => Q.get(id));
  const groups = [["Auto-checked questions", qs.filter(q => ["mcq", "num"].includes(q.type))], ["Coding, RTL and circuits", qs.filter(q => ["c", "verilog", "circuit"].includes(q.type))], ["Concept questions (written answers)", qs.filter(q => q.type === "con")], ["Checklist tasks (from your tracker)", qs.filter(q => q.type === "self")]];
  const probs = m.topics.filter(t => t.probs.length);
  host.innerHTML = `<div class="row" style="margin-bottom:10px"><a class="btn btn--red btn--sm" href="#/practice?mod=${m.id}&run=1">Practise one by one →</a><a class="btn btn--ghost btn--sm" href="#/practice?mod=${m.id}">Open in the question bank (filters)</a></div>
${groups.filter(g => g[1].length).map(([h, list]) => `<h3 class="h3">${h} <span class="note" style="font-weight:400">· ${list.filter(qDone).length}/${list.length} done</span></h3><div class="qlist">${list.map(q => qRow(q, "mod=" + m.id)).join("")}</div>`).join("") || empty("No questions in this module yet - use the topic problems below and the AI tutor prompt.")}
${probs.length ? `<h3 class="h3">Topic problems <span class="note" style="font-weight:400">· solve on paper, then tick the topic in Learn</span></h3><div class="card"><ol class="probs">${probs.map(t => t.probs.map(p => `<li>${esc(p)} <span class="note">(${esc(t.n)})</span></li>`).join("")).join("")}</ol></div>` : ""}`;
}

function tabSim(host, m) {
  const sims = (m.sims || []).map(k => Object.assign({ k }, SIMS[k]));
  host.innerHTML = sims.length ? `<div class="grid g3">${sims.map(s => `<a class="card tile" href="${s.href}" style="--c:${s.kind === "sim" ? "var(--violet)" : "var(--teal)"}"><span class="badge badge--${s.kind}">${s.kind === "sim" ? "Software simulation" : "Interactive model"}</span><h3>${esc(s.title)}</h3><span class="go">Open →</span></a>`).join("")}</div>
<p class="note" style="margin-top:12px"><b>Interactive model</b> = an educational picture of the idea with ideal behaviour. <b>Software simulation</b> = runs the code or circuit you write (C compiler, Verilog simulator, logic simulator). Neither models real silicon timing, noise or analog effects.</p>`
    : empty(`No simulation is linked to this module. The <a href="#/lab">ECE Lab</a> has every tool if you want to experiment.`);
}

function tabTest(host, m) {
  const pool = m.qs.map(id => Q.get(id)).filter(q => q.type === "mcq" || q.type === "num");
  const hist = store.mocks().filter(x => x.scope === "mod:" + m.id).slice(-5).reverse();
  host.innerHTML = pool.length ? `<div class="card"><h3 style="font-size:20px">Module test</h3><p class="note" style="margin:6px 0 12px">${Math.min(10, pool.length)} questions from ${pool.length} (MCQ and numerical), ${Math.ceil(Math.min(10, pool.length) * 1.5)} minutes, no hints. Unanswered ones count as wrong. Results go to your progress and revision queue.</p>
<a class="btn btn--red" href="#/mock/run?mod=${m.id}&n=10">Start the test →</a></div>
${hist.length ? `<h3 class="h3">Your last attempts</h3><div class="qlist">${hist.map(x => `<div class="qrow"><span class="st ${x.right / x.n >= 0.7 ? "st--ok" : ""}">${Math.round(100 * x.right / x.n)}%</span><span class="qrow__t">${x.right}/${x.n} right in ${Math.round(x.secs / 60)} min</span><span class="note">${new Date(x.ts).toLocaleDateString()}</span></div>`).join("")}</div>` : ""}`
    : empty("This module has no auto-checked questions to build a test from. Use Practice and Interview instead.");
}

function tabInterview(host, m) {
  const qs = m.qs.map(id => Q.get(id)).filter(q => q.type === "con");
  const probs = m.topics.flatMap(t => t.probs.map(p => ({ p, t: t.n })));
  host.innerHTML = `${qs.length ? `<p class="lead">Answer out loud or type it, then compare with the model answer and key points.</p><div id="ivq"></div>` : ""}
${probs.length ? `<h3 class="h3">Explain-out-loud prompts</h3><p class="note">From your tracker roadmap. Say each answer in about a minute, as if to an interviewer.</p><div class="card"><ol class="probs">${probs.map(x => `<li>${esc(x.p)} <span class="note">(${esc(x.t)})</span></li>`).join("")}</ol></div>` : ""}
${!qs.length && !probs.length ? empty("No interview questions here yet.") : ""}
<p class="note" style="margin-top:12px">For a role-based mock interview that mixes modules, open <a href="#/interview">Interview preparation</a>.</p>`;
  if (qs.length) {
    const box = $("#ivq"); box.innerHTML = qs.map((q, i) => `<div class="qcard" id="iq${i}"></div><div id="it${i}"></div>`).join("");
    qs.forEach((q, i) => { renderQ($("#iq" + i), q, { num: i + 1 }); $("#it" + i).innerHTML = toolsHtml(q); wireTools($("#it" + i), q); });
  }
}

function tabRevise(host, m) {
  const due = revisionDue().filter(x => x.q.mod === m.id || (x.q.also || []).includes(m.id));
  const ls = m.lessons.map(id => LESSONS.get(id));
  const wrong = m.qs.map(id => Q.get(id)).filter(q => { const a = store.att(q.id); return a && a.wrong; });
  host.innerHTML = `<div class="split"><div>
<h3 class="h3" style="margin-top:0">Revision sheet</h3>
${m.formulas.map(f => `<div class="formula">${esc(f)}</div>`).join("")}
${ls.map(l => `<div class="take"><b>${esc(l.title.toUpperCase())}</b>${esc(l.takeaway)}</div>`).join("")}
<ul class="revlist">${m.topics.map(tp => `<li><b>${esc(tp.n)}</b>${tp.learn ? ` - ${esc(tp.learn)}` : ""}</li>`).join("")}</ul>
${m.notes.map(n => `<p class="note">${esc(n)}</p>`).join("")}
</div><aside class="side"><div class="card side-card"><h4>Your revision queue here</h4>${due.length ? `<div class="qlist">${due.slice(0, 12).map(x => qRow(x.q, "mod=" + m.id)).join("")}</div>` : `<p class="note">Nothing due. Questions you get wrong, mark difficult or bookmark appear here.</p>`}
<div class="row" style="margin-top:10px"><a class="btn btn--sm btn--red" href="#/revise?mod=${m.id}">Revise these</a><a class="btn btn--sm btn--ghost" href="#/revise?mod=${m.id}&mode=cards">Flashcards</a></div></div>
<div class="card side-card"><h4>Mistakes so far</h4><p class="note">${wrong.length ? `${plural(wrong.length, "question")} answered wrong at least once.` : "None yet."}</p></div></aside></div>`;
}

/* ---------------------------------------------------------------- lesson */
export function lessonPage(id) {
  const l = LESSONS.get(id); if (!l) return notFoundHere();
  const m = MODS.get(l.mods[0]), t = TRACK[m.track];
  setTitle(l.title);
  store.setLast({ href: `#/lesson/${l.id}`, title: l.title, kind: "Lesson" });
  const quiz = (l.quiz || []).map((x, k) => Q.get(`${l.id}-q${k}`)).filter(Boolean);
  const all = [...LESSONS.values()].filter(x => x.course === l.course), i = all.indexOf(l), prev = all[i - 1], next = all[i + 1];
  app().innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/learn">Learn</a><span>/</span><a href="#/learn/${t.id}">${esc(t.title)}</a><span>/</span><a href="#/m/${m.id}">${esc(m.title)}</a></div>
<div class="lesson"><article>
<h1 class="h1">${esc(l.title)}</h1><p class="lead">${esc(l.sum)}</p><p class="note" style="margin:6px 0 20px">${l.mins} min read · part of ${l.mods.map(x => `<a href="#/m/${x}">${esc(MODS.get(x).title)}</a>`).join(", ")}</p>
${l.demo ? `<div class="demo" id="demo"></div><p class="note" style="margin:-14px 0 20px">Interactive model - ideal behaviour, for intuition.</p>` : ""}
<div class="prose">${l.body}</div>
<div class="take"><b>THE IDEA TO KEEP</b>${esc(l.takeaway)}</div>
<section class="quiz"><h2 style="font-size:22px">Quick check</h2><p class="note">Answer all correctly to complete the lesson.</p><div id="quiz"></div></section>
<div class="row" style="margin-top:20px"><button class="btn ${store.lessonDone(l.id) ? "btn--green" : "btn--ink"}" id="markDone">${store.lessonDone(l.id) ? "✓ Lesson done" : "Mark lesson done"}</button><a class="btn btn--ghost" href="#/m/${m.id}/practice">Practise this module →</a></div>
<div class="pager">${prev ? `<a class="btn btn--ghost" href="#/lesson/${prev.id}">← ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="btn btn--red" href="#/lesson/${next.id}">${esc(next.title)} →</a>` : ""}</div>
</article>
<aside class="lesson-side"><div class="card side-card"><h4>In this module</h4><div class="plinks">${m.topics.slice(0, 8).map(tp => `<a href="#/m/${m.id}/learn">${tick(store.done(tp.id))}<span>${esc(tp.n)}</span></a>`).join("")}</div></div>
<div class="card side-card"><h4>Practice</h4><p class="note">${plural(m.qs.filter(x => Q.get(x).type !== "self").length, "question")} in <a href="#/m/${m.id}/practice">${esc(m.title)}</a>.</p></div></aside></div></div>`;
  if (l.demo) ({ gate: gateWidget, dff: dffWidget, bits: bitsWidget, uart: uartWidget, pwm: pwmWidget, kmap: kmapWidget })[l.demo]($("#demo"));
  const got = {};
  $("#quiz").innerHTML = quiz.map((q, k) => `<div class="qcard" id="lq${k}"></div>`).join("") || '<p class="note">No quiz for this lesson.</p>';
  quiz.forEach((q, k) => renderQ($("#lq" + k), q, { num: k + 1, onAnswer: ok => { got[k] = ok; if (Object.keys(got).length === quiz.length && Object.values(got).every(Boolean) && !store.lessonDone(l.id)) { store.setLesson(l.id); const b = $("#markDone"); b.textContent = "✓ Lesson done"; b.className = "btn btn--green"; toast("Lesson complete. Nice work!"); } } }));
  $("#markDone").onclick = () => { const on = !store.lessonDone(l.id); store.setLesson(l.id, on); $("#markDone").textContent = on ? "✓ Lesson done" : "Mark lesson done"; $("#markDone").className = "btn " + (on ? "btn--green" : "btn--ink"); };
}

function notFoundHere() { app().innerHTML = `<div class="wrap page"><h1 class="h1">Not found</h1><p class="lead">That module or lesson does not exist (it may have been renamed).</p><a class="btn btn--red" href="#/learn">Back to Learn</a></div>`; }
