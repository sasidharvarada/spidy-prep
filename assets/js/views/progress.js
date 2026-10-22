/* Progress: completion, attempts, accuracy, repeated mistakes, time, mocks, revision, bookmarks, notes, backup */
import { store, dkey } from "../store.js";
import { TRACKS, TRACK, MODS, Q, QUESTIONS, LESSONS, TYPE_NAME } from "../registry.js";
import { overall, trackStats, modStats, daySeries } from "../stats.js";
import { syncState, importTracker } from "../sync.js";
import { $, $$, esc, app, setTitle, bar, ring, pct, plural, fmtMins, lineChart, toast, empty } from "../ui.js";
import { qRow } from "./learn.js";

export function progressPage() {
  setTitle("Progress");
  const o = overall(), S = store.raw(), series = daySeries(28), labels = series.map(x => `${x.d.getDate()}/${x.d.getMonth() + 1}`);
  const totalMins = Math.round(Object.values(S.time).reduce((a, x) => a + x, 0) / 60), totalHours = Object.entries(S.done).filter(([k]) => k.startsWith("log:")).reduce((a, [, v]) => a + (Number(v) || 0), 0);
  const repeated = QUESTIONS.filter(q => { const a = S.att[q.id]; return a && (a.wrong || 0) >= 2; }).sort((a, b) => S.att[b.id].wrong - S.att[a.id].wrong);
  const bms = QUESTIONS.filter(q => S.bm[q.id]), notes = Object.keys(S.notes).filter(k => Q.has(k)).map(k => Q.get(k));
  const mocks = S.mocks.slice(-20);
  const sel = new URLSearchParams(location.hash.split("?")[1] || "").get("track") || TRACKS[0].id;
  const t = TRACK[sel] || TRACKS[0];
  const sync = syncState();
  app().innerHTML = `<div class="wrap page"><span class="kicker">Progress</span><h1 class="h1">Where you stand</h1>
<div class="grid g4" style="margin-top:16px">
<div class="card pcard">${ring(o.pct, "var(--red)", 76, pct(o.pct))}<div><h3>Overall completion</h3><p>${o.modsDone}/${o.modsN} modules completed</p></div></div>
<div class="card pcard">${ring(o.n ? 100 * o.solved / o.n : 0, "var(--green)", 76, String(o.solved))}<div><h3>Questions solved</h3><p>${o.tried} tried of ${o.n} · ${o.att} attempts</p></div></div>
<div class="card pcard">${ring(o.acc || 0, "var(--blue)", 76, o.acc == null ? "-" : pct(o.acc))}<div><h3>Accuracy</h3><p>${o.ok} right of ${o.att} attempts</p></div></div>
<div class="card pcard"><div class="bignum">${store.streak()}</div><div><h3>Day streak</h3><p>${fmtMins(totalMins)} active · ${totalHours} h logged</p></div></div></div>
<div class="grid g4" style="margin-top:12px"><div class="card mini"><b>${S.mocks.length}</b><span class="note">mock tests</span></div><div class="card mini"><b>${Object.values(S.sims).reduce((a, x) => a + x, 0)}</b><span class="note">simulations opened</span></div><div class="card mini"><b>${Object.values(S.revDays).reduce((a, x) => a + x, 0)}</b><span class="note">revision sessions</span></div><div class="card mini"><b>${Object.keys(S.lessons).length}/${LESSONS.size}</b><span class="note">lessons done</span></div></div>

<h2 class="h2">Tracks</h2><div class="tbl"><table><tr><th>Track</th><th>Completion</th><th>Modules done</th><th>Accuracy</th></tr>${TRACKS.map(x => { const s = trackStats(x); return `<tr><td><a href="#/progress?track=${x.id}">${esc(x.title)}</a></td><td style="min-width:160px">${bar(s.pct, x.color)} <span class="note">${pct(s.pct)}</span></td><td>${s.done}/${s.n}</td><td>${s.att ? pct(100 * s.ok / s.att) : "-"}</td></tr>`; }).join("")}</table></div>

<h2 class="h2">Modules in <select id="trk" aria-label="Track">${TRACKS.map(x => `<option value="${x.id}" ${x.id === t.id ? "selected" : ""}>${esc(x.title)}</option>`).join("")}</select></h2>
<div class="tbl"><table><tr><th>#</th><th>Module</th><th>Completion</th><th>Topics</th><th>Solved</th><th>Attempts</th><th>Accuracy</th></tr>${t.mods.map((id, i) => { const m = MODS.get(id), s = modStats(m); return `<tr><td>${i + 1}</td><td><a href="#/m/${m.id}">${esc(m.name || m.title)}</a></td><td style="min-width:120px">${bar(s.pct, t.color)}</td><td>${s.tDone}/${s.tN}</td><td>${s.pDone}/${s.pN}</td><td>${s.att}</td><td>${s.acc == null ? "-" : `<span style="color:${s.acc < 60 ? "var(--red)" : s.acc < 80 ? "var(--amber-t)" : "var(--green)"}">${pct(s.acc)}</span>`}</td></tr>`; }).join("")}</table></div>

<h2 class="h2">Time</h2><div class="card">${lineChart([{ name: "Hours logged", c: "var(--red)", v: series.map(x => x.hours) }, { name: "Active hours (auto)", c: "var(--blue)", v: series.map(x => +(x.mins / 60).toFixed(2)) }], { labels, min: 2 })}
<p class="note">Active time counts only while this site is open, visible and you used it in the last 2 minutes. Logged hours are what you enter on the dashboard (shared with your tracker).</p></div>

${mocks.length ? `<h2 class="h2">Mock tests</h2><div class="card">${lineChart([{ name: "Score %", c: "var(--violet)", v: mocks.map(x => Math.round(100 * x.right / x.n)) }], { labels: mocks.map(x => new Date(x.ts).toLocaleDateString(undefined, { day: "numeric", month: "numeric" })), min: 100, every: Math.max(1, Math.ceil(mocks.length / 8)) })}</div>` : ""}

<h2 class="h2">Repeated mistakes <span class="note" style="font-weight:400">· wrong twice or more</span></h2>${repeated.length ? `<div class="qlist">${repeated.slice(0, 30).map(q => qRow(q)).join("")}</div>` : empty("None. Questions you get wrong twice or more are listed here.")}
<h2 class="h2">Bookmarks</h2>${bms.length ? `<div class="qlist">${bms.map(q => qRow(q, "status=bm")).join("")}</div>` : empty("No bookmarks yet - use ☆ Bookmark under any question.")}
<h2 class="h2">Your notes</h2>${notes.length ? `<div class="qlist">${notes.map(q => `<a class="qrow" href="#/q/${encodeURIComponent(q.id)}"><span class="qrow__t"><b>${esc((q.title || q.q).slice(0, 90))}</b><br><span class="note">${esc(store.note(q.id).slice(0, 160))}</span></span></a>`).join("")}</div>` : empty("No notes yet - use ✎ Note under any question.")}

<h2 class="h2">Sync and backup</h2><div class="card">
<p><b>Cloud sync:</b> ${esc(sync.msg || "")}</p>
<div class="row" style="margin-top:10px"><button class="btn btn--ink" onclick="document.getElementById('acctBtn').click()">${sync.user ? "Account" : "Sign in / sync settings"}</button><button class="btn btn--ghost" id="imp1">Import Embedded Tracker ticks</button>
<button class="btn btn--ghost" id="exp">Export backup file</button><label class="btn btn--ghost">Import backup file<input type="file" id="imp" accept=".json,application/json" hidden></label><button class="btn btn--ghost" id="rst" style="color:var(--red-d)">Reset all progress</button></div>
<p class="note" style="margin-top:8px">Tracker import reads your tracker's Firestore document (progress/main) and adds its topic ticks, checklist ticks, hour logs and plan start date here. It never deletes anything. ${S.imported.tracker ? `Last imported ${new Date(S.imported.tracker).toLocaleString()}.` : ""}${S.imported.v1 ? " Progress from the first Spidy Prep site in this browser was imported automatically." : ""}</p></div></div>`;
  $("#trk").onchange = () => { location.hash = "#/progress?track=" + $("#trk").value + "&keep=1"; };
  $("#imp1").onclick = async () => { const b = $("#imp1"); b.disabled = true; b.textContent = "Importing..."; try { const n = await importTracker(); toast(n ? `Imported ${n} ticks and hour logs.` : "Nothing new - already up to date."); progressPage(); } catch (e) { b.disabled = false; b.textContent = "Import Embedded Tracker ticks"; toast("Could not read the tracker: " + (e.message || e)); } };
  $("#exp").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([store.exportJSON()], { type: "application/json" })); a.download = `spidy-ece-progress-${dkey()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  $("#imp").onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { store.importJSON(t); toast("Progress imported."); progressPage(); } catch (x) { toast("That file is not a Spidy backup."); } }); };
  $("#rst").onclick = () => { if (confirm("Delete all progress, notes, saved code and the plan on this device? If you are signed in, the cloud copy is replaced too. This cannot be undone.")) { store.reset(); progressPage(); toast("Everything reset."); } };
}

export function aboutPage() {
  setTitle("About");
  app().innerHTML = `<div class="wrap page" style="max-width:820px"><span class="kicker">About</span><h1 class="h1">About Spidy ECE Prep</h1>
<div class="prose"><p>A personal, free platform for ECE placement preparation: learn, practise, simulate, test, plan and track in one place. It merges the Embedded Tracker (roadmap, checklist, hour log and 12-week plan) with the Spidy Prep lessons, coding problems and labs.</p>
<h3>Content</h3><p>All lessons, notes, explanations and questions on this site are original. Numerical answers are computed in code, not typed by hand. External resources (YouTube, NPTEL, MIT OpenCourseWare, HDLBits, ChipVerify, FreeRTOS, Espressif, Bootlin, kernel.org, takeuforward, IndiaBix, Khan Academy) are only linked and open on their own sites. Company tags are your own: the site does not claim which company asks which question.</p>
<h3>Simulations</h3><p><b>Software simulations</b> run what you write: C code (xcc compiler in WebAssembly), Verilog (a two-state simulator written for this site) and gate-level circuits. <b>Interactive models</b> (FSM stepper, RTOS scheduler, timing calculator, RC, tiny CPU, bus waveforms) show ideal behaviour for learning. None model real silicon timing, noise or analog effects.</p>
<h3>Your data</h3><p>Progress is stored in your browser. If you sign in with Google it is also saved in your own Firebase project (Firestore, users/your-id). Nothing is sent anywhere else.</p>
<h3>Open-source credits</h3><ul><li>xcc C compiler (@basthon/xcc-wasm) - MIT licence</li><li>CodeMirror 5 - MIT licence</li><li>Firebase JavaScript SDK - Apache 2.0</li><li>Fonts: Space Grotesk, Inter, JetBrains Mono (Google Fonts, SIL Open Font License)</li></ul>
<p>See <a href="assets/vendor/README.txt">assets/vendor/README.txt</a> for licence details.</p></div></div>`;
}
