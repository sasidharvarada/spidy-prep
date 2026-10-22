// Progress and saved work, kept in this browser (localStorage).
const KEY = "spidy-lab-v1";
const blank = () => ({ lessons: {}, solved: {}, code: {}, circuits: {}, mcq: {}, iv: {}, last: null, days: {} });
let S = blank();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* private mode */ }

function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function activity() { const k = today(); S.days[k] = (S.days[k] || 0) + 1; }

export const store = {
  get: () => S,
  lessonDone: id => !!S.lessons[id],
  setLesson(id, on = true) { if (on) S.lessons[id] = Date.now(); else delete S.lessons[id]; activity(); save(); },
  solved: id => !!S.solved[id],
  setSolved(id) { if (!S.solved[id]) { S.solved[id] = Date.now(); activity(); save(); } },
  code: id => S.code[id],
  setCode(id, code) { S.code[id] = code; save(); },
  clearCode(id) { delete S.code[id]; save(); },
  circuit: id => S.circuits[id],
  setCircuit(id, c) { S.circuits[id] = c; save(); },
  clearCircuit(id) { delete S.circuits[id]; save(); },
  mcq: id => S.mcq[id],
  setMcq(id, ok) { S.mcq[id] = ok ? 1 : 0; activity(); save(); },
  iv: id => S.iv[id] || {},
  setIv(id, patch) { S.iv[id] = Object.assign({}, S.iv[id], patch, { t: Date.now() }); activity(); save(); },
  setLast(info) { S.last = Object.assign({ t: Date.now() }, info); save(); },
  last: () => S.last,
  streak() {
    let n = 0; const d = new Date();
    const key = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    if (!S.days[key(d)]) d.setDate(d.getDate() - 1);
    while (S.days[key(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  },
  days: () => S.days,
  exportJSON: () => JSON.stringify(S, null, 1),
  importJSON(txt) { const v = JSON.parse(txt); if (typeof v !== "object" || !v) throw new Error("not a Spidy backup"); S = Object.assign(blank(), v); save(); },
  reset() { S = blank(); save(); },
};
