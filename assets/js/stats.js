/* ==========================================================================
   Progress maths shared by dashboard, roadmap, planner and progress pages.
   Every number here is derived from the store - nothing is stored twice.
   ========================================================================== */
import { store, dkey, fromKey } from "./store.js";
import { MODS, TRACKS, TRACK, Q, QUESTIONS, LESSONS, ROLES } from "./registry.js";

const PRACTICE = q => q.type !== "self";
/* "done" for one question: solved (auto-checked types), rated good (concept), ticked (checklist) */
export function qDone(q) {
  if (q.type === "self") return store.done(q.id);
  if (q.type === "con") return store.iv(q.id).rating === "good" || store.solved(q.id);
  return store.solved(q.id);
}
export const qTried = q => q.type === "self" ? store.done(q.id) : q.type === "con" ? !!store.iv(q.id).rating || !!store.att(q.id) : !!store.att(q.id);

export function modStats(m) {
  if (typeof m === "string") m = MODS.get(m);
  const qs = m.qs.map(id => Q.get(id));
  const prac = qs.filter(PRACTICE), self = qs.filter(q => q.type === "self");
  const tDone = m.topics.filter(t => store.done(t.id)).length;
  const lDone = m.lessons.filter(id => store.lessonDone(id)).length;
  const pDone = prac.filter(qDone).length, sDone = self.filter(q => store.done(q.id)).length;
  let att = 0, ok = 0; prac.forEach(q => { const a = store.att(q.id); if (a) { att += a.n; ok += a.ok; } });
  const tried = prac.filter(qTried).length;
  // completion: topics (and lessons) are "learn", questions and checklist rows are "practice"
  const learnN = m.topics.length + m.lessons.length, learnD = tDone + lDone;
  const pracN = prac.length + self.length, pracD = pDone + sDone;
  const pct = learnN && pracN ? 100 * (0.5 * learnD / learnN + 0.5 * pracD / pracN) : learnN ? 100 * learnD / learnN : pracN ? 100 * pracD / pracN : 0;
  const acc = att ? 100 * ok / att : null;
  const status = pct >= 99.5 ? "done" : pct > 0 || tried ? "progress" : "todo";
  return { pct, acc, att, ok, tried, tDone, tN: m.topics.length, lDone, lN: m.lessons.length, pDone, pN: prac.length, sDone, sN: self.length, status };
}
export function trackStats(t) {
  if (typeof t === "string") t = TRACK[t];
  const ms = t.mods.map(id => modStats(id));
  const pct = ms.length ? ms.reduce((s, x) => s + x.pct, 0) / ms.length : 0;
  const done = ms.filter(x => x.status === "done").length;
  return { pct, done, n: ms.length, att: ms.reduce((s, x) => s + x.att, 0), ok: ms.reduce((s, x) => s + x.ok, 0) };
}
export function overall() {
  const prac = QUESTIONS.filter(PRACTICE);
  let att = 0, ok = 0, tried = 0, solved = 0;
  prac.forEach(q => { const a = store.att(q.id); if (a) { att += a.n; ok += a.ok; tried++; } if (qDone(q)) solved++; });
  const mods = [...MODS.values()].map(m => modStats(m));
  return { pct: mods.reduce((s, x) => s + x.pct, 0) / mods.length, att, ok, acc: att ? 100 * ok / att : null, tried, solved, n: prac.length,
    modsDone: mods.filter(x => x.status === "done").length, modsN: mods.length };
}

/* Weak topics: modules with enough attempts and low accuracy, or repeated mistakes. */
export function weakModules(limit = 6) {
  const out = [];
  for (const m of MODS.values()) {
    const s = modStats(m); if (s.att < 3) continue;
    const repeated = m.qs.map(id => store.att(id)).filter(a => a && (a.wrong || 0) >= 2).length;
    if (s.acc < 65 || repeated >= 2) out.push({ m, s, repeated, why: `${s.ok} of ${s.att} attempts right (${Math.round(s.acc)}%)${repeated ? `, ${repeated} question${repeated > 1 ? "s" : ""} missed twice or more` : ""}` });
  }
  return out.sort((a, b) => a.s.acc - b.s.acc).slice(0, limit);
}

/* Role order used by recommendations and the planner */
export function roleOf() { const p = store.plan(); return ROLES.find(r => r.id === (p && p.role)) || ROLES[0]; }

/* Recommended next steps, each with a reason the user can read. */
export function recommendations(n = 4) {
  const role = roleOf(), out = [];
  const next = role.mods.find(id => modStats(id).status !== "done");
  if (next) { const m = MODS.get(next), s = modStats(m); out.push({ href: `#/m/${m.id}`, title: m.title, why: s.status === "todo" ? `Next module in your "${role.title}" path.` : `You are ${Math.round(s.pct)}% through it - finish before moving on.`, kind: "Continue path" }); }
  weakModules(2).forEach(w => out.push({ href: `#/m/${w.m.id}/revise`, title: w.m.title, why: `Weak spot: ${w.why}.`, kind: "Fix a weak topic" }));
  const due = revisionDue().length; if (due) out.push({ href: "#/revise", title: `${due} question${due > 1 ? "s" : ""} due for revision`, why: "Spaced repetition: these come back on day 1, 3, 7, 14 and 30 after you answer them.", kind: "Revise" });
  const lastMock = store.mocks().slice(-1)[0];
  if (!lastMock || Date.now() - lastMock.ts > 7 * 864e5) out.push({ href: "#/mock", title: "Take a timed mock test", why: lastMock ? "Your last mock was over a week ago." : "You have not taken a mock test yet - it shows what you can recall under time pressure.", kind: "Mock" });
  return out.slice(0, n);
}

/* Revision queue: wrong last time, marked difficult, bookmarked, or due in the Leitner schedule */
export function revisionDue() {
  const now = Date.now(), out = [];
  for (const q of QUESTIONS) {
    if (q.type === "self") continue;
    const a = store.att(q.id), r = store.rev(q.id), mk = store.mark(q.id);
    const reasons = [];
    if (a && a.lastOk === 0) reasons.push("wrong last time");
    if (mk === "difficult") reasons.push("marked difficult");
    if (store.bm(q.id)) reasons.push("bookmarked");
    if (r && r.due && r.due <= now && a) reasons.push("due for spaced review");
    if (q.type === "con" && store.iv(q.id).rating === "review") reasons.push("interview answer to review");
    if (reasons.length) out.push({ q, reasons, pri: (a && a.lastOk === 0 ? 3 : 0) + (mk === "difficult" ? 2 : 0) + (r && r.due <= now ? 1 : 0) });
  }
  return out.sort((x, y) => y.pri - x.pri);
}

/* Readiness for a role, with its parts so the score is explainable. */
export function readiness(role) {
  const ms = role.mods.map(id => MODS.get(id));
  const comp = ms.reduce((s, m) => s + modStats(m).pct, 0) / (ms.length || 1);
  let att = 0, ok = 0, ivN = 0, ivGood = 0;
  const ids = new Set(ms.flatMap(m => m.qs));
  ids.forEach(id => { const q = Q.get(id); const a = store.att(id); if (a && q.type !== "self") { att += a.n; ok += a.ok; } if (q.type === "con") { ivN++; if (store.iv(id).rating === "good") ivGood++; } });
  const acc = att ? 100 * ok / att : 0;
  const mocks = store.mocks().filter(m => !m.role || m.role === role.id).slice(-5);
  const mock = mocks.length ? mocks.reduce((s, m) => s + 100 * m.right / m.n, 0) / mocks.length : 0;
  const iv = ivN ? 100 * ivGood / ivN : 0;
  const conf = Math.min(1, att / 40); // accuracy only counts fully after 40 attempts
  const score = 0.5 * comp + 0.25 * acc * conf + 0.15 * iv + 0.10 * mock;
  return { score, parts: [["Syllabus covered", comp, 50], ["Practice accuracy" + (conf < 1 ? ` (based on ${att} attempts)` : ""), acc * conf, 25], ["Interview answers nailed", iv, 15], ["Recent mock tests", mock, 10]] };
}

/* Last N days of activity: hours logged, active minutes, questions answered */
export function daySeries(n = 28) {
  const out = [];
  const attByDay = store.raw().qdays || {};
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = dkey(d); out.push({ k, d, hours: store.hoursOn(k), mins: Math.round(store.timeOn(k) / 60), qs: attByDay[k] || 0, acts: store.days()[k] || 0 }); }
  return out;
}
export function weekStats() {
  const s = daySeries(7);
  return { hours: s.reduce((a, x) => a + x.hours, 0), mins: s.reduce((a, x) => a + x.mins, 0), qs: s.reduce((a, x) => a + x.qs, 0), days: s.filter(x => x.hours || x.mins >= 10 || x.acts).length };
}
export { dkey, fromKey };
