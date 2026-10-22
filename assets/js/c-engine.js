// Main-thread wrapper around c-worker.js with a time limit.
const TIME_LIMIT_MS = 4000;
let worker = null, seq = 0;
const pending = new Map();

function spawn() {
  worker = new Worker(new URL("./c-worker.js", import.meta.url), { type: "module" });
  worker.onmessage = ev => {
    const p = pending.get(ev.data.id);
    if (p) { pending.delete(ev.data.id); clearTimeout(p.timer); p.resolve(ev.data); }
  };
  worker.onerror = ev => {
    const msg = ev.message || "the C engine failed to start (open the site through http(s), not as a file)";
    for (const [id, p] of pending) { clearTimeout(p.timer); p.resolve({ phase: "runtime", out: "", err: msg }); }
    pending.clear(); worker = null;
  };
}

function send(job, limit) {
  if (!worker) spawn();
  const id = ++seq;
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      pending.delete(id);
      worker.terminate(); worker = null;   // kill the stuck program
      resolve({ phase: "timeout", out: "", err: `Time limit exceeded (${limit / 1000} s). Is there an infinite loop, or is scanf waiting for input you did not give?` });
    }, limit);
    pending.set(id, { resolve, timer });
    worker.postMessage(Object.assign({ id }, job));
  });
}

export function warmUp() { return send({ type: "warm" }, 20000); }

// Run a whole program (with main) on some stdin.
export function runProgram(code, stdin = "") {
  return send({ code, entry: "main", stdin }, TIME_LIMIT_MS);
}

// Run user code plus a hidden test harness that defines __spidy_tests().
export function runWithHarness(userCode, harness) {
  const code = `${userCode}\n#line 1 "tests"\n${harness}\n`;
  return send({ code, entry: "tests", stdin: "" }, TIME_LIMIT_MS);
}

// Check a problem: run the user's code and the reference solution the same
// way and compare their output line by line.
export async function checkProblem(p, userCode) {
  const results = [];
  const runOne = (code, stdin) => p.kind === "function" ? runWithHarness(code, p.harness) : runProgram(code, stdin);
  const inputs = p.kind === "function" ? [""] : p.tests;
  for (let i = 0; i < inputs.length; i++) {
    const you = await runOne(userCode, inputs[i]);
    if (you.phase !== "done") return { ok: false, phase: you.phase, err: you.err, out: you.out, testIndex: i, stdin: inputs[i] };
    const ref = await runOne(p.solution, inputs[i]);
    if (ref.phase !== "done") return { ok: false, phase: "internal", err: "reference solution failed: " + ref.err };
    const a = you.out.replace(/\s+$/g, "").split("\n").map(s => s.replace(/\s+$/, ""));
    const b = ref.out.replace(/\s+$/g, "").split("\n").map(s => s.replace(/\s+$/, ""));
    const n = Math.max(a.length, b.length);
    for (let k = 0; k < n; k++) {
      if (a[k] !== b[k]) return { ok: false, phase: "wrong", testIndex: i, stdin: inputs[i], line: k, you: a[k] ?? "(nothing)", exp: b[k] ?? "(nothing)", out: you.out, expOut: ref.out, passedLines: k, totalLines: b.length };
    }
    results.push({ lines: b.length, ms: you.ms });
  }
  const lines = results.reduce((s, r) => s + r.lines, 0);
  return { ok: true, lines, tests: inputs.length };
}
