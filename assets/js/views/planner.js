/* Planner: target date + role + daily hours -> a day-by-day schedule whose tasks link straight
   to the module, questions, test or revision. Tasks complete themselves when the work is done. */
import { store, dkey, fromKey } from "../store.js";
import { ROLES, ROLE, MODS, TRACKS, TRACK, Q } from "../registry.js";
import { modStats, readiness } from "../stats.js";
import { $, $$, esc, app, setTitle, pill, bar, ring, pct, plural, toast, fmtMins, fmtDate, empty } from "../ui.js";

const DAY = 864e5;
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* -------------------------------------------------------------- task status */
export function taskDone(t, plan) {
  if (t.done) return true;
  const m = MODS.get(t.ref);
  if (t.kind === "learn" && m) { const s = modStats(m); return s.tN + s.lN > 0 && s.tDone === s.tN && s.lDone === s.lN; }
  if (t.kind === "practice" && m) { const s = modStats(m); return s.pDone + s.sDone >= Math.min(t.n || 10, s.pN + s.sN); }
  if (t.kind === "test" && m) return store.mocks().some(x => x.scope === "mod:" + m.id && x.ts >= (plan.created || 0));
  if (t.kind === "mock") return store.mocks().some(x => !String(x.scope).startsWith("mod:") && dkey(new Date(x.ts)) >= addDays(t.date, -1) && dkey(new Date(x.ts)) <= addDays(t.date, 6));
  if (t.kind === "revise") { const rd = store.raw().revDays; for (let i = 0; i < 4; i++) if (rd[addDays(t.date, i)]) return true; return false; }
  if (t.kind === "apt") { const k = t.date; return (store.raw().qdays[k] || 0) > 0 && Object.entries(store.raw().att).some(([id, a]) => id.includes(":apt-") && a.last && dkey(new Date(a.last)) === k); }
  return false;
}
export const taskStatus = (t, plan) => taskDone(t, plan) ? "done" : t.date < dkey() ? "overdue" : t.date === dkey() ? "today" : "upcoming";
export function taskHref(t) {
  return { learn: `#/m/${t.ref}/learn`, practice: `#/practice?mod=${t.ref}&run=1`, test: `#/mock/run?mod=${t.ref}&n=10`, mock: `#/mock`, revise: "#/revise?mode=session", apt: "#/mock/run?track=aptitude&n=10&mins=12&title=Daily+aptitude" }[t.kind] || "#/";
}

/* -------------------------------------------------------------- generator */
export function generate(plan, from) {
  const role = ROLE[plan.role] || ROLES[0];
  const tracks = new Set(plan.tracks && plan.tracks.length ? plan.tracks : TRACKS.map(t => t.id));
  const keep = (plan.tasks || []).filter(t => taskDone(t, plan)); // finished tasks stay; everything else is re-planned
  const doneKeys = new Set(keep.filter(t => taskDone(t, plan)).map(t => t.kind + ":" + t.ref));
  const cap = Math.round((plan.hours || 2) * 60);
  const useApt = tracks.has("aptitude") && role.mods.some(id => id.startsWith("apt-"));
  const mods = role.mods.filter(id => !id.startsWith("apt-") && MODS.get(id).tracks.some(t => tracks.has(t)));
  // queue of work items
  const queue = [];
  for (const id of mods) {
    const m = MODS.get(id), s = modStats(m);
    if (s.status === "done") continue;
    const learnLeft = (s.tN - s.tDone) + (s.lN - s.lDone);
    if (learnLeft > 0 && !doneKeys.has("learn:" + id)) queue.push({ kind: "learn", ref: id, title: `Learn: ${m.title}`, mins: Math.max(30, 18 * (s.tN - s.tDone) + 15 * (s.lN - s.lDone)) });
    const pracN = s.pN + s.sN, target = Math.min(pracN, Math.max(8, Math.round(pracN * 0.7)));
    if (pracN && s.pDone + s.sDone < target && !doneKeys.has("practice:" + id)) queue.push({ kind: "practice", ref: id, n: target, title: `Practise: ${m.title} (${target - s.pDone - s.sDone} to go)`, mins: Math.min(120, Math.max(20, 4 * (target - s.pDone - s.sDone))) });
    if (m.qs.filter(q => ["mcq", "num"].includes(Q.get(q).type)).length >= 5 && !doneKeys.has("test:" + id) && !store.mocks().some(x => x.scope === "mod:" + id)) queue.push({ kind: "test", ref: id, title: `Module test: ${m.title}`, mins: 15 });
  }
  const tasks = [...keep], ids = new Set(keep.map(t => t.id)), add = t => { if (!ids.has(t.id)) { ids.add(t.id); tasks.push(t); } }, study = new Set(plan.days || [1, 2, 3, 4, 5, 6]), review = plan.reviewDay ?? 0;
  let day = from, guard = 0, aptI = 0, overflowMins = 0;
  const end = plan.target;
  while (queue.length && guard++ < 800) {
    const wd = fromKey(day).getDay();
    if (end && day > end) break;
    if (wd === review) { add({ id: `mock-${day}`, date: day, kind: "mock", ref: "", title: "Weekly timed mock test", mins: 40 }); add({ id: `rev-${day}`, date: day, kind: "revise", ref: "", title: "Revision queue: mistakes and difficult questions", mins: 30 }); day = addDays(day, 1); continue; }
    if (!study.has(wd)) { day = addDays(day, 1); continue; }
    let left = cap;
    if (useApt) { const a = `apt-${aptI++ % 3 + 1}`; add({ id: `apt-${day}`, date: day, kind: "apt", ref: a, title: "10 aptitude questions (timed)", mins: 15 }); left -= 15; }
    while (queue.length && left >= 15) {
      const w = queue[0];
      if (w.mins <= left) { add(Object.assign({ id: `${w.kind}-${w.ref}-${day}`, date: day }, w)); left -= w.mins; queue.shift(); }
      else if (left >= 30 || left === cap - (useApt ? 15 : 0)) { add(Object.assign({ id: `${w.kind}-${w.ref}-${day}-p`, date: day }, w, { mins: left, title: w.title + " (part)" })); w.mins -= left; left = 0; }
      else break;
    }
    day = addDays(day, 1);
  }
  queue.forEach(w => overflowMins += w.mins);
  // final stretch: full mock + revision on the last two days before the target
  if (end && end >= from) { add({ id: `final-mock-${end}`, date: addDays(end, -1) >= from ? addDays(end, -1) : end, kind: "mock", ref: "", title: "Full-length mock test", mins: 60 }); add({ id: `final-rev-${end}`, date: end, kind: "revise", ref: "", title: "Final revision: formula sheets and weak topics", mins: 60 }); }
  const studyDaysLeft = (() => { if (!end) return null; let n = 0; for (let d = from; d <= end; d = addDays(d, 1)) if (study.has(fromKey(d).getDay()) && fromKey(d).getDay() !== review) n++; return n; })();
  return Object.assign({}, plan, { tasks: tasks.sort((a, b) => a.date.localeCompare(b.date)), overflowMins, studyDaysLeft, generated: Date.now() });
}

/* -------------------------------------------------------------- view */
export function plannerPage() {
  setTitle("Planner");
  const plan = store.plan();
  if (!plan || !plan.tasks) return setupView(plan);
  const today = dkey();
  const st = plan.tasks.map(t => ({ t, s: taskStatus(t, plan) }));
  const done = st.filter(x => x.s === "done").length, overdue = st.filter(x => x.s === "overdue"), todays = st.filter(x => x.t.date === today);
  const role = ROLE[plan.role] || ROLES[0], rd = readiness(role);
  const daysLeft = plan.target ? Math.round((fromKey(plan.target) - fromKey(today)) / DAY) : null;
  const byWeek = {}; st.forEach(x => { const d = fromKey(x.t.date); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = dkey(mon); (byWeek[k] = byWeek[k] || []).push(x); });
  const showAll = sessionStorage.getItem("plan-all") === "1";
  const weeks = Object.keys(byWeek).sort().filter(k => showAll || addDays(k, 6) >= addDays(today, -7));
  app().innerHTML = `<div class="wrap page"><span class="kicker">Planner</span>
<div class="row" style="justify-content:space-between;align-items:flex-end"><div><h1 class="h1">${esc(role.title)} plan</h1><p class="lead">${plan.target ? `Target ${fromKey(plan.target).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })} · ${daysLeft >= 0 ? plural(daysLeft, "day") + " left" : "target date passed"}` : "No target date"} · ${plan.hours} h a day</p></div>
<div class="row"><button class="btn btn--ghost btn--sm" id="edit">Change plan</button><button class="btn ${overdue.length ? "btn--red" : "btn--ghost"} btn--sm" id="resched">Reschedule${overdue.length ? ` ${overdue.length} overdue` : ""}</button></div></div>
${plan.overflowMins > 0 ? `<div class="callout warn" style="margin-top:14px"><p><b>This plan does not fit before your target date.</b> About ${fmtMins(plan.overflowMins)} of study is left over. Increase daily hours, add study days, move the date, or remove some subjects - then press Change plan.</p></div>` : ""}
<div class="grid g4" style="margin-top:16px">
<div class="card pcard">${ring(st.length ? 100 * done / st.length : 0, "var(--green)", 70, pct(st.length ? 100 * done / st.length : 0))}<div><h3>Tasks done</h3><p>${done} of ${st.length}</p></div></div>
<div class="card pcard">${ring(rd.score, "var(--red)", 70, pct(rd.score))}<div><h3>Readiness</h3><p><a href="#/interview/${role.id}?tab=ready">How it is measured</a></p></div></div>
<div class="card"><h3 style="font-size:15px">Today</h3><p class="note">${todays.length ? `${todays.filter(x => x.s === "done").length}/${todays.length} done · ${fmtMins(todays.reduce((a, x) => a + x.t.mins, 0))}` : "Nothing scheduled"}</p>${hoursPicker()}</div>
<div class="card"><h3 style="font-size:15px">Overdue</h3><p class="note">${overdue.length ? `${plural(overdue.length, "task")} - press Reschedule to spread them over the coming days.` : "Nothing overdue. 👍"}</p></div></div>
${weeks.map(w => { const items = byWeek[w]; const wd = items.filter(x => x.s === "done").length;
    return `<section class="pweek"><div class="pweek__h"><h2>Week of ${fromKey(w).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</h2><span class="note">${wd}/${items.length} done</span><div style="flex:1;max-width:200px">${bar(100 * wd / items.length, "var(--green)")}</div></div>
${[...new Set(items.map(x => x.t.date))].sort().map(d => `<div class="pday${d === today ? " today" : ""}"><div class="pday__d"><b>${fmtDate(fromKey(d))}</b>${d === today ? '<span class="pill pill--today">Today</span>' : ""}</div><div class="pday__t">${items.filter(x => x.t.date === d).map(x => taskRow(x.t, x.s)).join("")}</div></div>`).join("")}</section>`; }).join("") || empty("No tasks. Press Change plan to generate a schedule.")}
<div class="row" style="margin-top:14px"><button class="btn btn--ghost btn--sm" id="all">${showAll ? "Hide past weeks" : "Show past weeks"}</button></div>
${interviewsBox()}</div>`;
  wireHours();
  $("#all").onclick = () => { sessionStorage.setItem("plan-all", showAll ? "0" : "1"); plannerPage(); };
  $("#edit").onclick = () => setupView(plan);
  $("#resched").onclick = () => { const np = generate(plan, today); store.setPlan(np); toast(overdue.length ? "Overdue tasks moved forward from today." : "Plan refreshed from today."); plannerPage(); };
  $$(".ptask input[type=checkbox]").forEach(c => c.onchange = () => { const t = plan.tasks.find(x => x.id === c.dataset.id); if (!t) return; if (c.checked) t.done = Date.now(); else delete t.done; store.setPlan(plan); plannerPage(); });
  wireInterviews();
}
export function taskRow(t, s) {
  const kinds = { learn: "Learn", practice: "Practice", test: "Test", mock: "Mock", revise: "Revise", apt: "Aptitude" };
  const auto = s === "done" && !t.done;
  return `<div class="ptask ${s}"><input type="checkbox" data-id="${esc(t.id)}" ${s === "done" ? "checked" : ""} ${auto ? "disabled title=\"Completed automatically from your progress\"" : ""} aria-label="Done"><span class="pill pill--k-${t.kind}">${kinds[t.kind] || t.kind}</span><a href="${taskHref(t)}">${esc(t.title)}</a><span class="note">${fmtMins(t.mins)}${s === "overdue" ? ' · <b style="color:var(--red)">overdue</b>' : ""}${auto ? " · auto" : ""}</span></div>`;
}

export function hoursPicker() {
  const k = "log:" + dkey(), v = Number(store.get(k)) || 0;
  return `<div class="hours" role="group" aria-label="Hours studied today">${[0.5, 1, 1.5, 2, 3].map(h => `<button class="${v === h ? "on" : ""}" data-hr="${h}">${h}h</button>`).join("")}</div><p class="note" style="margin-top:4px">Hours studied today (same log as your tracker)</p>`;
}
export function wireHours(onChange) { $$(".hours [data-hr]").forEach(b => b.onclick = () => { const k = "log:" + dkey(), h = +b.dataset.hr; store.setVal(k, Number(store.get(k)) === h ? null : h); if (onChange) onChange(); else plannerPage(); }); }

function interviewsBox() {
  const a = store.interviews().slice().sort((x, y) => x.date.localeCompare(y.date));
  return `<section class="card" style="margin-top:22px"><h2 style="font-size:20px">Interview dates</h2><p class="note">Add real interviews or online tests; the dashboard counts down to them.</p>
<div class="qlist" style="margin-top:10px">${a.map((x, i) => `<div class="qrow"><span class="qrow__t"><b>${esc(x.company)}</b> · ${esc(x.role || "")} ${x.date < dkey() ? '<span class="note">(past)</span>' : ""}</span><span class="note">${fromKey(x.date).toLocaleDateString()}</span><button class="btn btn--sm btn--ghost" data-del="${i}" aria-label="Remove">✕</button></div>`).join("") || '<p class="note">None yet.</p>'}</div>
<form class="row" id="ivf" style="margin-top:10px"><input name="company" placeholder="Company" required class="numin" style="flex:1;min-width:140px"><input name="role" placeholder="Role (optional)" class="numin" style="flex:1;min-width:140px"><input name="date" type="date" required class="numin" min="${addDays(dkey(), -365)}"><button class="btn btn--ink btn--sm">Add</button></form></section>`;
}
function wireInterviews() {
  const a = store.interviews().slice().sort((x, y) => x.date.localeCompare(y.date));
  $$("[data-del]").forEach(b => b.onclick = () => { a.splice(+b.dataset.del, 1); store.setInterviews(a); plannerPage(); });
  $("#ivf").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); a.push({ company: f.get("company").trim(), role: f.get("role").trim(), date: f.get("date") }); store.setInterviews(a); toast("Interview added."); plannerPage(); };
}

function setupView(plan) {
  const p = plan || {};
  const role = p.role || "my12", today = dkey();
  const start = store.get("cfg:start") || today;
  app().innerHTML = `<div class="wrap page" style="max-width:860px"><span class="kicker">Planner</span><h1 class="h1">${plan ? "Change your plan" : "Plan your preparation"}</h1>
<p class="lead">Choose the role, the date you want to be ready by and how much time you have. The planner orders the modules for that role, fits them into your days, adds a weekly mock test and revision, and links every task to the exact page. Finished work ticks tasks off automatically.</p>
<form id="pf" class="card setup">
<label>Target role<select name="role">${ROLES.map(r => `<option value="${r.id}" ${r.id === role ? "selected" : ""}>${esc(r.title)}</option>`).join("")}</select><span class="note" id="rblurb"></span></label>
<div class="grid g3"><label>Start date<input type="date" name="start" value="${esc(start)}"></label><label>Be ready by<input type="date" name="target" value="${esc(p.target || addDays(today, 84))}" required></label><label>Hours per study day<select name="hours">${[1, 1.5, 2, 2.5, 3, 4, 5, 6].map(h => `<option ${h === (p.hours || 2) ? "selected" : ""}>${h}</option>`).join("")}</select></label></div>
<fieldset><legend>Study days</legend><div class="row">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label class="chk"><input type="checkbox" name="days" value="${d}" ${(p.days || [1, 2, 3, 4, 5, 6]).includes(d) ? "checked" : ""}><span>${WD[d]}</span></label>`).join("")}</div></fieldset>
<label>Weekly mock test and revision day<select name="review">${[0, 1, 2, 3, 4, 5, 6].map(d => `<option value="${d}" ${(p.reviewDay ?? 0) === d ? "selected" : ""}>${WD[d]}</option>`).join("")}</select></label>
<fieldset><legend>Subjects to include</legend><div class="row">${TRACKS.map(t => `<label class="chk"><input type="checkbox" name="tracks" value="${t.id}" ${!p.tracks || !p.tracks.length || p.tracks.includes(t.id) ? "checked" : ""}><span>${esc(t.title)}</span></label>`).join("")}</div><span class="note">Only modules of the chosen role are scheduled; this narrows them further.</span></fieldset>
<div class="row"><button class="btn btn--red">${plan ? "Rebuild my plan" : "Create my plan"} →</button>${plan ? '<button type="button" class="btn btn--ghost" id="cancel">Cancel</button><button type="button" class="btn btn--ghost" id="del" style="color:var(--red-d)">Delete plan</button>' : ""}</div>
<p class="note">Rebuilding keeps tasks you already completed and re-plans everything else from the start date.</p></form></div>`;
  const rb = () => { $("#rblurb").textContent = (ROLE[$("[name=role]").value] || {}).blurb || ""; };
  $("[name=role]").onchange = rb; rb();
  if ($("#cancel")) $("#cancel").onclick = () => plannerPage();
  if ($("#del")) $("#del").onclick = () => { if (confirm("Delete the plan and all its tasks? Your progress is not affected.")) { store.setPlan(null); plannerPage(); } };
  $("#pf").onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target);
    const np = { role: f.get("role"), start: f.get("start") || today, target: f.get("target"), hours: +f.get("hours"), days: f.getAll("days").map(Number), reviewDay: +f.get("review"), tracks: f.getAll("tracks"), created: (plan && plan.created) || Date.now(), tasks: plan && plan.role === f.get("role") ? plan.tasks : [] };
    if (!np.days.length) { toast("Pick at least one study day."); return; }
    if (np.target <= np.start) { toast("The target date must be after the start date."); return; }
    if (!np.tracks.length) { toast("Pick at least one subject."); return; }
    store.setVal("cfg:start", np.start);
    store.setPlan(generate(np, np.start > today ? np.start : today));
    toast("Plan ready."); plannerPage();
  };
}
