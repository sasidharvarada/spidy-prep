/* ==========================================================================
   Store: all progress in one object, saved to localStorage on every change
   and (when signed in) synced to Firestore by sync.js.

   done      tracker-compatible ticks: topic ids, checklist row ids,
             "log:YYYY-MM-DD" = hours studied, "cfg:start" = plan start date
   att       question attempts  {n, ok, last, lastOk, t}
   mark      self-rated difficulty {qid: "easy"|"medium"|"difficult"}
   bm        bookmarks, notes, iv (interview answers), code, circuits
   rev       Leitner revision boxes {qid: {box, due}}
   mocks     mock test history, plan (planner), interviews (dates)
   ========================================================================== */
const KEY = "spidy-ece-v2";
const OLD_V1 = "spidy-lab-v1";
export const dkey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const blank = () => ({ v: 2, done: {}, att: {}, mark: {}, bm: {}, notes: {}, iv: {}, code: {}, circuits: {}, lessons: {}, rev: {}, mocks: [], sims: {}, tags: {},
  days: {}, time: {}, plan: null, interviews: [], last: null, settings: {}, imported: {}, updatedAt: 0, revDays: {}, qdays: {} });

let S = blank(), saveOk = true;
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { saveOk = false; }
const subs = new Set();
let pushTimer = null;
function save(silent) {
  S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); saveOk = true; } catch (e) { saveOk = false; }
  if (!silent) subs.forEach(f => { try { f("local"); } catch (x) { console.error(x); } });
}
function activity() { const k = dkey(); S.days[k] = (S.days[k] || 0) + 1; }

/* one-time import of the first Spidy Prep site's progress (same browser) */
(function importV1() {
  if (S.imported.v1) return;
  try {
    const raw = localStorage.getItem(OLD_V1); if (!raw) return;
    const o = JSON.parse(raw);
    Object.assign(S.lessons, o.lessons || {}); Object.assign(S.code, o.code || {}); Object.assign(S.circuits, o.circuits || {});
    for (const [id, t] of Object.entries(o.solved || {})) S.att[id] = S.att[id] || { n: 1, ok: 1, last: t, lastOk: 1, t };
    for (const [id, v] of Object.entries(o.mcq || {})) S.att[id] = S.att[id] || { n: 1, ok: v ? 1 : 0, last: Date.now(), lastOk: v, t: Date.now() };
    for (const [id, v] of Object.entries(o.iv || {})) S.iv["iv:" + id] = v;
    for (const [d, n] of Object.entries(o.days || {})) S.days[d] = (S.days[d] || 0) + n;
    S.imported.v1 = Date.now(); save(true);
  } catch (e) { console.warn("v1 import skipped", e); }
})();

export const store = {
  raw: () => S,
  ok: () => saveOk,
  on(f) { subs.add(f); return () => subs.delete(f); },
  /* replace everything (used by sync and import) */
  replace(next, why) { S = Object.assign(blank(), next); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } subs.forEach(f => f(why || "replace")); },

  /* ticks */
  done: k => !!S.done[k],
  setDone(k, on = true) { if (on) S.done[k] = Date.now(); else delete S.done[k]; activity(); save(); },
  get: k => S.done[k],
  setVal(k, v) { if (v == null || v === "") delete S.done[k]; else S.done[k] = v; save(); },

  /* attempts */
  att: id => S.att[id] || null,
  record(id, ok) {
    const a = S.att[id] || { n: 0, ok: 0 }; a.n++; if (ok) a.ok++; a.last = Date.now(); a.lastOk = ok ? 1 : 0; a.t = a.last;
    if (!ok) a.wrong = (a.wrong || 0) + 1;
    { const k = dkey(); S.qdays[k] = (S.qdays[k] || 0) + 1; }
    S.att[id] = a;
    // Leitner box: right moves up, wrong goes back to box 1
    const r = S.rev[id] || { box: 0 }; r.box = ok ? Math.min(5, (r.box || 0) + 1) : 1; r.due = Date.now() + [0, 1, 3, 7, 14, 30][r.box] * 864e5; S.rev[id] = r;
    activity(); save();
  },
  solved: id => !!(S.att[id] && S.att[id].ok),
  mark: id => S.mark[id] || "",
  setMark(id, v) { if (!v || S.mark[id] === v) delete S.mark[id]; else S.mark[id] = v; save(); },
  bm: id => !!S.bm[id],
  toggleBm(id) { if (S.bm[id]) delete S.bm[id]; else S.bm[id] = Date.now(); save(); return !!S.bm[id]; },
  note: id => S.notes[id] || "",
  setNote(id, t) { if (t && t.trim()) S.notes[id] = t; else delete S.notes[id]; save(); },
  tags: id => S.tags[id] || [],
  setTags(id, arr) { const a = [...new Set(arr.map(x => x.trim()).filter(Boolean))]; if (a.length) S.tags[id] = a; else delete S.tags[id]; save(); },
  rev: id => S.rev[id] || null,
  revDone() { const k = dkey(); S.revDays[k] = (S.revDays[k] || 0) + 1; save(); },

  iv: id => S.iv[id] || {},
  setIv(id, patch) { S.iv[id] = Object.assign({}, S.iv[id], patch, { t: Date.now() }); if (patch.rating) activity(); save(); },
  code: id => S.code[id],
  setCode(id, c) { S.code[id] = c; save(true); },
  clearCode(id) { delete S.code[id]; save(true); },
  circuit: id => S.circuits[id],
  setCircuit(id, c) { S.circuits[id] = c; save(true); },
  clearCircuit(id) { delete S.circuits[id]; save(true); },
  lessonDone: id => !!S.lessons[id],
  setLesson(id, on = true) { if (on) S.lessons[id] = Date.now(); else delete S.lessons[id]; activity(); save(); },
  sim(id) { S.sims[id] = (S.sims[id] || 0) + 1; activity(); save(true); },

  addMock(m) { S.mocks.push(Object.assign({ ts: Date.now() }, m)); activity(); save(); },
  mocks: () => S.mocks,
  plan: () => S.plan,
  setPlan(p) { S.plan = p; save(); },
  interviews: () => S.interviews,
  setInterviews(a) { S.interviews = a; save(); },

  setLast(info) { S.last = Object.assign({ t: Date.now() }, info); save(true); },
  last: () => S.last,
  setting: k => S.settings[k],
  setSetting(k, v) { S.settings[k] = v; save(); },

  /* time spent: counted only while the tab is visible and the user is active */
  tick(sec) { const k = dkey(); S.time[k] = (S.time[k] || 0) + sec; save(true); },
  timeOn: k => S.time[k] || 0,
  hoursOn: k => Number(S.done["log:" + k]) || 0,
  days: () => S.days,
  streak() {
    const act = k => S.days[k] || S.done["log:" + k] || (S.time[k] || 0) >= 600;
    let n = 0; const d = new Date(); if (!act(dkey(d))) d.setDate(d.getDate() - 1);
    while (act(dkey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  },

  /* merge tracker ticks {done} from the Embedded Tracker */
  mergeTracker(done) {
    let n = 0;
    for (const [k, v] of Object.entries(done || {})) {
      if (k.startsWith("log:")) { if (!S.done[k] || Number(v) > Number(S.done[k])) { S.done[k] = v; n++; } }
      else if (k === "cfg:start") { if (!S.done[k]) { S.done[k] = v; n++; } }
      else if (v && !S.done[k]) { S.done[k] = typeof v === "number" ? v : Date.now(); n++; }
    }
    S.imported.tracker = Date.now(); save(); return n;
  },
  exportJSON: () => JSON.stringify(S),
  importJSON(txt) { const v = JSON.parse(txt); if (!v || typeof v !== "object" || (!v.done && !v.att && !v.solved)) throw new Error("Not a Spidy backup"); if (v.solved && !v.att) { localStorage.setItem(OLD_V1, txt); S.imported.v1 = 0; location.reload(); return; } S = Object.assign(blank(), v); save(); },
  reset() { S = blank(); S.imported.v1 = Date.now(); save(); },
};

/* Merge two copies of the state (local and cloud) without losing work. */
export function mergeStates(a, b) {
  const A = Object.assign(blank(), a), B = Object.assign(blank(), b), out = blank();
  const newer = (x, y) => (!x ? y : !y ? x : ((y.t || y.last || 0) > (x.t || x.last || 0) ? y : x));
  const byNewer = k => { out[k] = Object.assign({}, A[k]); for (const [id, v] of Object.entries(B[k])) out[k][id] = newer(out[k][id], v); };
  // ticks: union (a tick removed on one device can come back; acceptable and safe)
  out.done = Object.assign({}, B.done, A.done);
  for (const k of Object.keys(out.done)) if (k.startsWith("log:")) out.done[k] = Math.max(Number(A.done[k]) || 0, Number(B.done[k]) || 0) || out.done[k];
  ["att", "iv", "rev"].forEach(byNewer);
  out.att = Object.fromEntries(Object.entries(out.att).map(([id, v]) => { const x = A.att[id], y = B.att[id]; return [id, x && y ? Object.assign({}, newer(x, y), { n: Math.max(x.n, y.n), ok: Math.max(x.ok, y.ok) }) : v]; }));
  const newerTop = (A.updatedAt || 0) >= (B.updatedAt || 0) ? A : B, older = newerTop === A ? B : A;
  ["mark", "bm", "notes", "tags", "code", "circuits", "lessons", "sims"].forEach(k => out[k] = Object.assign({}, older[k], newerTop[k]));
  ["days", "time", "revDays", "qdays"].forEach(k => { out[k] = Object.assign({}, A[k]); for (const [d, v] of Object.entries(B[k])) out[k][d] = Math.max(out[k][d] || 0, v); });
  const seen = new Set(); out.mocks = [...A.mocks, ...B.mocks].filter(m => { const id = m.ts + ":" + m.title; if (seen.has(id)) return false; seen.add(id); return true; }).sort((x, y) => x.ts - y.ts);
  out.plan = newerTop.plan || older.plan; out.interviews = newerTop.interviews.length ? newerTop.interviews : older.interviews;
  out.last = newer(A.last, B.last); out.settings = Object.assign({}, older.settings, newerTop.settings); out.imported = Object.assign({}, older.imported, newerTop.imported);
  out.updatedAt = Math.max(A.updatedAt || 0, B.updatedAt || 0);
  return out;
}

/* active-time counter: +15 s every 15 s while visible and there was input in the last 2 minutes */
let lastInput = Date.now();
["pointerdown", "keydown", "scroll", "touchstart"].forEach(e => addEventListener(e, () => { lastInput = Date.now(); }, { passive: true }));
setInterval(() => { if (document.visibilityState === "visible" && Date.now() - lastInput < 120000) store.tick(15); }, 15000);
