// Helpers for writing questions compactly. Numerical answers are computed
// in code (never typed by hand) so the answer key cannot have arithmetic slips.
//
// mcq(mod, level, question, options, correctIndex, solution, extra)
// num(mod, level, question, answer, unit, solution, extra)   extra.tol = relative tolerance (default 2%)
// con(mod, level, question, modelAnswer, keys, extra)        keys = [[label, regex], ...]
// extra: { hint, sub (subtopic), rel: [related concepts], roles: [...] }

export const slug = s => String(s).toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const L = { E: "Easy", M: "Medium", H: "Hard" };
export const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
function base(type, mod, lv, q, extra) {
  return Object.assign({ id: `q:${mod}:${slug(q).slice(0, 32)}-${hash(q).slice(0, 5)}`, type, mod, level: L[lv] || lv, q }, extra || {});
}
export const mcq = (mod, lv, q, o, a, sol, extra) => Object.assign(base("mcq", mod, lv, q, extra), { o, a, sol });
export const num = (mod, lv, q, ans, unit, sol, extra) => Object.assign(base("num", mod, lv, q, extra), { ans: +ans, unit: unit || "", sol });
export const con = (mod, lv, q, model, keys, extra) => Object.assign(base("con", mod, lv, q, extra), { model, keys: keys || [] });

// number formatting for solutions: r(3.14159, 3) -> "3.14"
export const r = (x, sig = 4) => {
  if (!isFinite(x)) return String(x);
  if (x === 0) return "0";
  const v = Number(Number(x).toPrecision(sig));
  return Math.abs(v) >= 1e6 || Math.abs(v) < 1e-3 ? v.toExponential(Math.max(0, sig - 1)).replace("e+", "e") : String(v);
};
export const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
export const C = (n, k) => { let x = 1; for (let i = 0; i < k; i++) x = x * (n - i) / (i + 1); return Math.round(x); };
export const fact = n => n <= 1 ? 1 : n * fact(n - 1);
