/* Interview preparation by role - reuses the same questions as Learn/Practice (no duplicates) */
import { store, dkey, fromKey } from "../store.js";
import { ROLES, ROLE, MODS, Q, TYPE_NAME, optionOrder } from "../registry.js";
import { readiness, qDone } from "../stats.js";
import { $, $$, esc, app, setTitle, ring, pct, plural, toast, copy, empty, pill } from "../ui.js";
import { renderQ, toolsHtml, wireTools, solHtml, fmtAns } from "../qview.js";
import { qRow } from "./learn.js";

const roleQs = (r, pred) => { const seen = new Set(), out = []; r.mods.forEach(id => MODS.get(id).qs.forEach(q => { if (!seen.has(q)) { seen.add(q); const x = Q.get(q); if (pred(x)) out.push(x); } })); return out; };
const CODE_TYPES = { vlsi_design: ["verilog", "circuit"], rtl: ["verilog", "circuit"], dv: ["verilog", "c"], fpga: ["verilog", "circuit", "c"], firmware: ["c"], software: ["c"], core_ece: ["circuit"], my12: ["c", "verilog", "circuit"] };

export function interviewIndex() {
  setTitle("Interview preparation");
  const up = store.interviews().filter(x => x.date >= dkey()).sort((a, b) => a.date.localeCompare(b.date));
  app().innerHTML = `<div class="wrap page"><span class="kicker">Interview preparation</span><h1 class="h1">Practise for the role you want</h1>
<p class="lead">Each role pulls concept questions, quick-fire recall, coding problems and project/HR prompts from the modules that role needs. Same questions as the rest of the site, so progress counts everywhere.</p>
${up.length ? `<div class="card" style="margin-top:16px"><b>Upcoming interviews</b><div class="row" style="margin-top:8px">${up.map(x => `<span class="pill pill--tag">${esc(x.company)} · ${esc(x.role || "")} · ${fromKey(x.date).toLocaleDateString()} (${Math.round((fromKey(x.date) - fromKey(dkey())) / 864e5)} days)</span>`).join("")}</div><a class="note" href="#/planner">Manage dates in the planner →</a></div>` : ""}
<div class="grid g3" style="margin-top:18px">${ROLES.map(r => { const rd = readiness(r), n = roleQs(r, q => q.type === "con").length;
    return `<a class="card tile" href="#/interview/${r.id}" style="--c:var(--red)"><div class="row" style="justify-content:space-between;align-items:flex-start"><h3>${esc(r.title)}</h3>${ring(rd.score, rd.score >= 70 ? "var(--green)" : rd.score >= 40 ? "var(--amber)" : "var(--red)", 54, pct(rd.score))}</div><p>${esc(r.blurb)}</p><p class="note">${plural(r.mods.length, "module")} · ${n} concept questions</p><span class="go">Practise →</span></a>`; }).join("")}</div>
<p class="note" style="margin-top:14px">Readiness = 50% syllabus covered + 25% practice accuracy (full weight after 40 attempts) + 15% interview answers marked "nailed" + 10% recent mock tests. It is a study guide, not a prediction.</p></div>`;
}

export function interviewRole(rid, p) {
  const r = ROLE[rid]; if (!r) { app().innerHTML = `<div class="wrap page">${empty("Unknown role.", '<a class="btn btn--sm btn--red" href="#/interview">All roles</a>')}</div>`; return; }
  const tab = p.get("tab") || "concepts";
  setTitle(r.title + " interview");
  const rd = readiness(r);
  const tabs = [["concepts", "Concept questions"], ["quick", "Quick-fire"], ["coding", "Coding"], ["hr", "Projects and HR"], ["ready", "Readiness"]];
  app().innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/interview">Interview</a><span>/</span><span>${esc(r.title)}</span></div>
<div class="row" style="justify-content:space-between"><div><h1 class="h1">${esc(r.title)}</h1><p class="lead">${esc(r.blurb)}</p></div>${ring(rd.score, "var(--red)", 76, pct(rd.score), "ready")}</div>
<div class="tabs" style="margin:12px 0 16px">${tabs.map(([k, l]) => `<a href="#/interview/${r.id}?tab=${k}" class="${k === tab ? "on" : ""}">${l}</a>`).join("")}</div><div id="iv"></div></div>`;
  const host = $("#iv");
  if (tab === "concepts") return concepts(host, r, p);
  if (tab === "quick") return quick(host, r);
  if (tab === "coding") { const qs = roleQs(r, q => (CODE_TYPES[r.id] || []).includes(q.type)); host.innerHTML = qs.length ? `<p class="note">${qs.filter(qDone).length}/${qs.length} solved. Interviewers watch how you think: say your plan before you code.</p><div class="qlist">${qs.map(q => qRow(q, "role=" + r.id + "&type=" + q.type)).join("")}</div>` : empty("No coding problems for this role."); return; }
  if (tab === "hr") return hr(host, r);
  host.innerHTML = `<div class="card"><h3 style="font-size:19px">How the ${pct(rd.score)} is made</h3><div class="tbl" style="margin-top:8px"><table><tr><th>Part</th><th>Your score</th><th>Weight</th></tr>${rd.parts.map(([n, v, w]) => `<tr><td>${esc(n)}</td><td>${pct(v)}</td><td>${w}%</td></tr>`).join("")}</table></div></div>
<h3 class="h3">Modules for this role</h3><div class="qlist">${r.mods.map(id => { const m = MODS.get(id); return `<a class="qrow" href="#/m/${m.id}"><span class="qrow__t">${esc(m.title)}</span><span class="note">${esc(m.part)}</span></a>`; }).join("")}</div>`;
}

function concepts(host, r, p) {
  const all = roleQs(r, q => q.type === "con");
  if (!all.length) { host.innerHTML = empty("No concept questions in this role's modules yet."); return; }
  let filt = p.get("f") || "", cur = null;
  const list = () => all.filter(q => !filt || (filt === "none" ? !store.iv(q.id).rating : store.iv(q.id).rating === filt));
  host.innerHTML = `<div class="ws ws--iv"><section><div class="qcard qcard--big ivcard" id="qc"></div><div id="qt"></div><div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn btn--ghost btn--sm" id="rnd">Random question</button><button class="btn btn--ink btn--sm" id="nx">Next →</button></div></section>
<aside><div class="filters" style="margin-top:0"><select id="fs" aria-label="Status"><option value="">All (${all.length})</option><option value="none">Not tried</option><option value="review">To review</option><option value="good">Nailed</option></select><button class="btn btn--sm btn--ghost" id="ai">Copy AI mock interviewer prompt</button></div><div class="ivlist" id="il"></div></aside></div>`;
  $("#fs").value = filt;
  const drawList = () => { $("#il").innerHTML = list().map(q => `<button type="button" class="ivrow${q === cur ? " cur" : ""}" data-id="${esc(q.id)}"><span class="dot ${store.iv(q.id).rating || ""}"></span><span>${esc(q.q)}</span><span class="note">${esc(MODS.get(q.mod).title)}</span></button>`).join("") || '<div class="empty">Nothing here.</div>'; };
  const show = q => { cur = q; $("#qc").innerHTML = ""; renderQ($("#qc"), q, { onAnswer: drawList }); $("#qc").insertAdjacentHTML("afterbegin", `<div class="note" style="margin-bottom:6px">${esc(MODS.get(q.mod).title)} · ${esc(q.level)}</div>`); $("#qt").innerHTML = toolsHtml(q); wireTools($("#qt"), q); drawList(); };
  $("#il").onclick = e => { const b = e.target.closest(".ivrow"); if (b) { show(Q.get(b.dataset.id)); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  $("#fs").onchange = () => { filt = $("#fs").value; drawList(); };
  $("#nx").onclick = () => { const L = list(); show(L[(L.indexOf(cur) + 1) % L.length] || all[0]); };
  $("#rnd").onclick = () => { const L = list(); show(L[Math.floor(Math.random() * L.length)] || all[0]); };
  $("#ai").onclick = async () => toast(await copy(`Act as a technical interviewer hiring a fresher for a ${r.title} role in India. Interview me for 30 minutes on: ${r.mods.map(id => MODS.get(id).title).join(", ")}. Ask one question at a time, start easy and go deeper based on my answers, include one design or debugging scenario and one question about my projects. After each answer give a score out of 10 and a short better answer. At the end, list my 3 weakest areas.`) ? "Prompt copied - paste it into any AI chat." : "Could not copy.");
  show(list().find(q => !store.iv(q.id).rating) || list()[0] || all[0]);
}

function quick(host, r) {
  const pool = roleQs(r, q => q.type === "mcq" || q.type === "num");
  if (!pool.length) { host.innerHTML = empty("No quick-fire questions for this role."); return; }
  let q, flipped, n = 0, ok = 0;
  host.innerHTML = `<p class="note">Interviewers often fire short questions. Answer out loud in a sentence, then reveal and be honest with yourself.</p><div class="note" id="qp"></div><div class="flash" id="fc" tabindex="0" role="button" aria-label="Reveal answer"></div><div class="row" style="justify-content:center;margin-top:14px" id="fb"></div>`;
  const next = () => { q = pool[Math.floor(Math.random() * pool.length)]; flipped = false; $("#qp").textContent = `${n} answered · ${ok} known · ${MODS.get(q.mod).title}`; $("#fc").innerHTML = `<div class="flash__f">${esc(q.q)}</div>`; $("#fb").innerHTML = '<button class="btn btn--ink" id="rv">Reveal answer</button>'; $("#rv").onclick = reveal; };
  const reveal = () => { if (flipped) return; flipped = true; $("#fc").innerHTML = `<div class="flash__b"><b>${esc(q.type === "mcq" ? q.o[q.a] : fmtAns(q))}</b>${solHtml(q.sol)}</div>`; $("#fb").innerHTML = '<button class="btn btn--green" id="k1">✓ I knew it</button><button class="btn btn--amber" id="k0">✗ I didn\'t</button>'; $("#k1").onclick = () => { store.record(q.id, true); n++; ok++; next(); }; $("#k0").onclick = () => { store.record(q.id, false); n++; next(); }; };
  $("#fc").onclick = reveal; next();
}

function hr(host, r) {
  const res = r.mods.filter(id => id.startsWith("res-")).map(id => MODS.get(id));
  const hrRows = roleQs(r, q => q.type === "self" && q.mod === "hr-1");
  host.innerHTML = `${res.length ? `<h3 class="h3" style="margin-top:0">Your projects, told well</h3><p class="note">From your tracker's resume track. Say each answer out loud and record yourself once.</p>${res.map(m => `<div class="card" style="margin-top:10px"><div class="row" style="justify-content:space-between"><b>${esc(m.title)}</b><a class="note" href="#/m/${m.id}">Open module →</a></div><ul class="probs" style="margin-top:6px">${m.topics.map(t => `<li><label class="chk"><input type="checkbox" data-t="${esc(t.id)}" ${store.done(t.id) ? "checked" : ""}><span><b>${esc(t.n)}</b> - ${esc(t.probs[0] || t.learn)}</span></label></li>`).join("")}</ul></div>`).join("")}` : ""}
${hrRows.length ? `<h3 class="h3">HR round and getting hired</h3><div class="qlist">${hrRows.map(q => qRow(q, "mod=hr-1")).join("")}</div>` : ""}
${!res.length && !hrRows.length ? empty("Nothing here for this role.") : ""}`;
  host.addEventListener("change", e => { const c = e.target.closest("input[data-t]"); if (c) store.setDone(c.dataset.t, c.checked); });
}
