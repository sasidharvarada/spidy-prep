// Run: node tools/audit-practice.mjs
// This audits the shipped practice metadata. It cannot certify private tests:
// the current GitHub Pages architecture ships browser-side evaluators.
globalThis.localStorage = { getItem() { return null; }, setItem() {} };
const { C_PROBLEMS } = await import("../assets/data/v1/c-problems.js");
const { VERILOG_PROBLEMS } = await import("../assets/data/v1/verilog-problems.js");
const { CIRCUIT_PROBLEMS } = await import("../assets/data/v1/circuit-problems.js");
const { DSA_PROBLEMS } = await import("../assets/data/qb/q-dsa.js");
const { QUESTIONS } = await import("../assets/js/registry.js");

const CODE_PROBLEMS = [...C_PROBLEMS, ...DSA_PROBLEMS];
const all = [...CODE_PROBLEMS, ...VERILOG_PROBLEMS, ...CIRCUIT_PROBLEMS];
const ids = new Set();
const issues = [];
for (const p of all) {
  if (ids.has(p.id)) issues.push(`${p.id}: duplicate id`);
  ids.add(p.id);
  for (const key of ["id", "title", "level", "desc", "hint"]) if (!p[key]) issues.push(`${p.id}: missing ${key}`);
}
for (const p of CODE_PROBLEMS) {
  for (const key of ["starter", "solution"]) if (!p[key]) issues.push(`${p.id}: missing ${key}`);
  if (p.kind === "program" && (!Array.isArray(p.tests) || p.tests.length < 5)) issues.push(`${p.id}: fewer than 2 samples plus 3 evaluation inputs`);
  if (p.kind === "function" && !p.harness) issues.push(`${p.id}: missing function harness`);
}
for (const p of VERILOG_PROBLEMS) {
  for (const key of ["starter", "solution", "spec"]) if (!p[key]) issues.push(`${p.id}: missing ${key}`);
}
for (const p of CIRCUIT_PROBLEMS) {
  for (const key of ["pins", "sol"]) if (!p[key]) issues.push(`${p.id}: missing ${key}`);
  if (!p.check && !(p.seq && p.model)) issues.push(`${p.id}: missing combinational check or sequential model`);
}
const counts = QUESTIONS.reduce((m, q) => (m[q.type] = (m[q.type] || 0) + 1, m), {});
console.log(JSON.stringify({
  questionBank: counts,
  executable: { c: CODE_PROBLEMS.length, verilog: VERILOG_PROBLEMS.length, circuit: CIRCUIT_PROBLEMS.length },
  metadataIssues: issues,
  hiddenTestsPrivate: false,
  note: "C/Verilog reference evaluators and circuit specifications are shipped to the browser; a trusted grading backend is required for genuine hidden tests."
}, null, 2));
process.exit(issues.length ? 1 : 0);
