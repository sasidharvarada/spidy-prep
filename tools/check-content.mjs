// Run: node tools/check-content.mjs  - builds the registry and reports content problems
globalThis.localStorage = { getItem() { return null; }, setItem() {} };
const r = await import("../assets/js/registry.js");
const rep = r.registryReport();
console.log(JSON.stringify({ modules: rep.modules, tracks: rep.tracks, lessons: rep.lessons, questions: rep.questions, byType: rep.byType, search: rep.search }, null, 1));
let bad = 0;
if (rep.noSol.length) { bad++; console.log("Questions without a solution:", rep.noSol); }
if (rep.explainUnused.length) { bad++; console.log("Unused explanations:", rep.explainUnused); }
for (const q of r.QUESTIONS) {
  if (q.type === "mcq" && !(q.a >= 0 && q.a < q.o.length)) { bad++; console.log("Bad MCQ answer index", q.id); }
  if (q.type === "num" && !isFinite(q.ans)) { bad++; console.log("Bad numeric answer", q.id); }
  if (q.type === "num" && !r.checkNum(q, String(q.ans))) { bad++; console.log("Answer fails its own check", q.id); }
}
console.log(bad ? `${bad} PROBLEMS` : "CONTENT OK");
process.exit(bad ? 1 : 0);
