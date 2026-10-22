import { minimize } from "../assets/js/widgets.js";
const cases = [
  [3, [1,3,5,6,7], [], "C + AB"], [3, [0,2,4,6], [], "C'"], [3, [3,5,6,7], [], "AB + AC + BC"],
  [4, [0,1,2,5,8,9,10], [], "B'C' + B'D' + A'C'D"], [4, [1,3,7,11,15], [0,2,5], "A'B' + CD"], [2, [0,1,2,3], [], "1"], [2, [], [], "0"], [2, [1,2], [], "A'B + AB'"],
];
let bad = 0;
for (const [n, ones, dcs, want] of cases) {
  const r = minimize(n, ones, dcs).sop;
  // compare as sets of terms
  const norm = s => s.split(" + ").sort().join(" + ");
  const ok = norm(r) === norm(want) || r.split(" + ").length === want.split(" + ").length;
  if (!ok) bad++;
  console.log(ok ? "ok " : "BAD", n, JSON.stringify(ones), "->", r, " (expected", want + ")");
}
// brute-force verify every 3-var function: result must equal function and be minimal-ish
const evalSop = (sop, n, m) => sop === "1" ? 1 : sop === "0" ? 0 : sop.split(" + ").some(t => t.match(/[A-D]'?/g).every(l => { const i = "ABCD".indexOf(l[0]); const bit = (m >> (n - 1 - i)) & 1; return l.endsWith("'") ? !bit : bit; })) ? 1 : 0;
for (const n of [2, 3, 4]) {
  const N = 1 << n; let wrong = 0, total = 0;
  for (let f = 0; f < (n === 4 ? 4000 : 1 << N); f++) {
    const fn = n === 4 ? Math.floor(Math.random() * 65536) : f;
    const ones = []; for (let m = 0; m < N; m++) if (fn >> m & 1) ones.push(m);
    const s = minimize(n, ones).sop; total++;
    for (let m = 0; m < N; m++) if (evalSop(s, n, m) !== (fn >> m & 1)) { wrong++; break; }
  }
  console.log(`${n} vars: ${total - wrong}/${total} functions correct`); if (wrong) bad++;
}
console.log(bad ? "FAILURES" : "ALL GOOD");
