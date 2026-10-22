/* Dashboard: today's plan, continue, recommendations, weak topics, stats, readiness, interview dates */
import { store, dkey, fromKey } from "../store.js";
import { TRACKS, ROLES, ROLE, MODS } from "../registry.js";
import { overall, trackStats, modStats, weakModules, recommendations, revisionDue, readiness, daySeries, weekStats, roleOf } from "../stats.js";
import { syncState } from "../sync.js";
import { $, $$, esc, app, setTitle, bar, ring, pct, plural, fmtMins, lineChart, donut, icon, empty } from "../ui.js";
import { taskStatus, taskRow, hoursPicker, wireHours } from "./planner.js";

export function dashboard() {
  setTitle("");
  const plan = store.plan(), today = dkey(), o = overall(), w = weekStats(), role = roleOf();
  const todays = plan && plan.tasks ? plan.tasks.filter(t => t.date === today).map(t => ({ t, s: taskStatus(t, plan) })) : [];
  const overdue = plan && plan.tasks ? plan.tasks.map(t => ({ t, s: taskStatus(t, plan) })).filter(x => x.s === "overdue") : [];
  const upcomingMock = plan && plan.tasks ? plan.tasks.find(t => t.kind === "mock" && t.date >= today && taskStatus(t, plan) !== "done") : null;
  const last = store.last(), recs = recommendations(4), weak = weakModules(5), due = revisionDue().length;
  const ivs = store.interviews().filter(x => x.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const mods = [...MODS.values()].map(m => modStats(m).status);
  const series = daySeries(28), labels = series.map(x => `${x.d.getDate()}/${x.d.getMonth() + 1}`);
  const mocks = store.mocks(), lastMock = mocks[mocks.length - 1];
  const sync = syncState();
  const hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  app().innerHTML = `<div class="wrap page dash">
<div class="dash__head"><div><span class="kicker">${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span><h1 class="h1">${greet}${sync.user && sync.user.name ? ", " + esc(sync.user.name.split(" ")[0]) : ""}.</h1>
<p class="lead">${plan ? `Preparing for <b>${esc(role.title)}</b>${plan.target ? ` · ${Math.max(0, Math.round((fromKey(plan.target) - fromKey(today)) / 864e5))} days to your target` : ""}.` : "Set a target date and role in the planner to get a day-by-day plan."}</p></div>
<div class="streak"><b>${store.streak()}</b><span>day streak</span></div></div>
${!sync.user && sync.state !== "off" ? `<div class="callout" style="margin-top:12px"><p>${icon("cloud")} Progress is saved in this browser. <button class="linkbtn" onclick="document.getElementById('acctBtn').click()">Sign in with Google</button> to sync your phone and laptop and pull in your Embedded Tracker ticks.</p></div>` : ""}

<div class="dgrid">
<section class="card dcard dcard--wide"><div class="dcard__h"><h2>Today's plan</h2><a href="#/planner" class="note">Open planner →</a></div>
${plan ? (todays.length ? `<div class="ptasks">${todays.map(x => taskRow(x.t, x.s)).join("")}</div>` : `<p class="note">Nothing scheduled today${plan.days && !plan.days.includes(new Date().getDay()) ? " - it is a rest day in your plan" : ""}.</p>`)
      + (overdue.length ? `<p class="overdue">${plural(overdue.length, "task")} overdue · <a href="#/planner">reschedule</a></p>` : "")
      : `<div class="empty" style="padding:10px 0;text-align:left"><p>No plan yet. The planner fits every module for your role into your days, with weekly mocks and revision.</p><a class="btn btn--red btn--sm" href="#/planner" style="margin-top:10px">Create my plan</a></div>`}
<div style="margin-top:12px">${hoursPicker()}</div></section>

<section class="card dcard"><div class="dcard__h"><h2>Continue</h2></div>
${last ? `<a class="cont" href="${esc(last.href)}"><div style="flex:1"><b>${esc(last.title)}</b><p class="note">${esc(last.kind || "")}</p></div><span class="btn btn--ink btn--sm">Go →</span></a>` : `<p class="note">Start with a track in <a href="#/learn">Learn</a>.</p>`}
<div class="dcard__h" style="margin-top:14px"><h2>Recommended next</h2></div>
<div class="recs">${recs.map(r => `<a class="rec" href="${r.href}"><span class="pill">${esc(r.kind)}</span><b>${esc(r.title)}</b><span class="note">${esc(r.why)}</span></a>`).join("") || '<p class="note">All caught up.</p>'}</div></section>

<section class="card dcard"><div class="dcard__h"><h2>Weak topics</h2><a href="#/revise" class="note">${due} to revise →</a></div>
${weak.length ? `<div class="weak">${weak.map(x => `<a href="#/m/${x.m.id}/revise"><span><b>${esc(x.m.title)}</b><span class="note">${esc(x.why)}</span></span>${bar(x.s.acc, "var(--red)")}</a>`).join("")}</div>` : `<p class="note">A topic shows up here once you have 3+ attempts in it with under 65% right, or keep missing the same questions. Nothing yet.</p>`}</section>

<section class="card dcard"><div class="dcard__h"><h2>Overall</h2><a href="#/progress" class="note">Details →</a></div>
${donut([{ name: "Completed", v: mods.filter(x => x === "done").length, c: "var(--green)" }, { name: "In progress", v: mods.filter(x => x === "progress").length, c: "var(--amber)" }, { name: "Not started", v: mods.filter(x => x === "todo").length, c: "var(--line)" }], 130, pct(o.pct))}
<p class="note" style="margin-top:6px">Modules · overall completion ${pct(o.pct)}</p></section>

<section class="card dcard"><div class="dcard__h"><h2>Practice</h2></div>
<div class="kpis"><div><b>${o.solved}</b><span>solved of ${o.n}</span></div><div><b>${o.att}</b><span>attempts</span></div><div><b>${o.acc == null ? "-" : pct(o.acc)}</b><span>accuracy</span></div><div><b>${mocks.length}</b><span>mock tests${lastMock ? ` · last ${Math.round(100 * lastMock.right / lastMock.n)}%` : ""}</span></div></div>
${upcomingMock ? `<p class="note" style="margin-top:8px">Next scheduled mock: <b>${fromKey(upcomingMock.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</b> · <a href="#/mock">start one now</a></p>` : `<p class="note" style="margin-top:8px"><a href="#/mock">Take a timed mock test →</a></p>`}</section>

<section class="card dcard"><div class="dcard__h"><h2>This week</h2></div>
<div class="kpis"><div><b>${w.hours}</b><span>hours logged</span></div><div><b>${fmtMins(w.mins)}</b><span>active on site</span></div><div><b>${w.qs}</b><span>questions answered</span></div><div><b>${w.days}/7</b><span>days studied</span></div></div></section>

<section class="card dcard dcard--wide"><div class="dcard__h"><h2>Last 4 weeks</h2><span class="note">hours logged vs. active time on this site</span></div>
${lineChart([{ name: "Hours logged", c: "var(--red)", v: series.map(x => x.hours) }, { name: "Active hours (auto)", c: "var(--blue)", v: series.map(x => +(x.mins / 60).toFixed(2)) }], { labels, min: 2, aria: "Study hours per day for the last 28 days" })}
${lineChart([{ name: "Questions answered", c: "var(--green)", v: series.map(x => x.qs) }], { labels, min: 5, h: 110, aria: "Questions answered per day" })}</section>

<section class="card dcard"><div class="dcard__h"><h2>Readiness by role</h2><a href="#/interview" class="note">Interview prep →</a></div>
<div class="rready">${ROLES.filter(r => r.id !== "my12").map(r => { const x = readiness(r); return `<a href="#/interview/${r.id}?tab=ready"><span>${esc(r.title)}</span>${bar(x.score, r.id === role.id ? "var(--red)" : "var(--ink2)")}<b>${pct(x.score)}</b></a>`; }).join("")}</div></section>

<section class="card dcard"><div class="dcard__h"><h2>Interviews</h2><a href="#/planner" class="note">Add →</a></div>
${ivs.length ? `<div class="ivdates">${ivs.map(x => { const d = Math.round((fromKey(x.date) - fromKey(today)) / 864e5); return `<div><b>${d === 0 ? "Today" : d === 1 ? "Tomorrow" : d + " days"}</b><span>${esc(x.company)}${x.role ? " · " + esc(x.role) : ""}<br><span class="note">${fromKey(x.date).toLocaleDateString()}</span></span></div>`; }).join("")}</div>` : '<p class="note">No interview dates yet. Add them in the planner to get a countdown here.</p>'}</section>

<section class="card dcard dcard--wide"><div class="dcard__h"><h2>Tracks</h2><a href="#/learn" class="note">All roadmaps →</a></div>
<div class="tracks">${TRACKS.map(t => { const s = trackStats(t); return `<a href="#/learn/${t.id}"><span>${esc(t.title)}</span>${bar(s.pct, t.color)}<span class="note">${s.done}/${s.n} · ${pct(s.pct)}</span></a>`; }).join("")}</div></section>
</div></div>`;
  wireHours(() => dashboard());
  $$(".ptask input[type=checkbox]").forEach(c => c.onchange = () => { const t = plan.tasks.find(x => x.id === c.dataset.id); if (!t) return; if (c.checked) t.done = Date.now(); else delete t.done; store.setPlan(plan); dashboard(); });
}
