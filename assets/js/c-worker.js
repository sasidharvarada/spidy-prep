// Runs C code with the xcc WebAssembly compiler, inside a Web Worker so an
// infinite loop can be stopped by terminating the worker.
import { CRepl } from "../vendor/xcc/repl.js";
import headers from "../vendor/xcc/headers.js";
import runtimeMap from "../vendor/xcc/runtime-map.js";

let modules = null;
async function load() {
  if (modules) return modules;
  const get = async f => WebAssembly.compile(await (await fetch(new URL(`../vendor/xcc/${f}`, import.meta.url))).arrayBuffer());
  const [cc, rt] = await Promise.all([get("cc.wasm"), get("runtime.wasm")]);
  modules = { cc, rt };
  return modules;
}

const MAX_OUT = 20000;

// job: { id, code, entry: "main" | "tests", stdin }
async function run(job) {
  const { cc, rt } = await load();
  let out = "", err = "", truncated = false;
  const lines = (job.stdin || "").split("\n");
  let li = 0;
  const repl = await CRepl.create({
    ccModule: cc, runtimeModule: rt, runtimeMap, headers,
    stdout: s => { if (out.length < MAX_OUT) out += s; else truncated = true; },
    stderr: s => { err += s; },
    stdin: () => (li < lines.length ? lines[li++] + (li < lines.length || job.stdin.endsWith("\n") ? "\n" : "") : null),
  });
  const t0 = performance.now();
  const a = await repl.run(job.code);
  if (a.status !== "ok") return { phase: "compile", out, err: cleanErr(err), ms: 0 };
  const call = job.entry === "tests" ? "__spidy_tests();" : "main();";
  const b = await repl.run(call);
  const ms = Math.round(performance.now() - t0);
  if (b.status === "error") {
    const e = cleanErr(err);
    if (/main/.test(e)) return { phase: "compile", out, err: "Your program needs a main() function.\n\n" + e, ms };
    return { phase: "compile", out, err: e, ms };
  }
  return { phase: b.status === "ok" ? "done" : "runtime", out: truncated ? out + "\n... (output cut off)" : out, err: cleanErr(err), ms };
}
function cleanErr(e) {
  return e.replace(/cell\[1\]/g, "main.c").replace(/cell\[2\]: /g, "").replace(/cell\[\d+\]/g, "line");
}

self.onmessage = async ev => {
  const job = ev.data;
  try {
    if (job.type === "warm") { await load(); self.postMessage({ id: job.id, warm: true }); return; }
    const r = await run(job);
    self.postMessage(Object.assign({ id: job.id }, r));
  } catch (e) {
    self.postMessage({ id: job.id, phase: "runtime", out: "", err: String(e && e.message || e) });
  }
};
