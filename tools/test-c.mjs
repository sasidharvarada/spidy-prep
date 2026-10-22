// Run: node tools/test-c.mjs   (needs gcc for cross-checking the reference outputs)
import fs from "node:fs"; import { execFileSync } from "node:child_process"; import os from "node:os"; import path from "node:path";
import { CRepl } from "../assets/vendor/xcc/repl.js";
import headers from "../assets/vendor/xcc/headers.js";
import runtimeMap from "../assets/vendor/xcc/runtime-map.js";
import { C_PROBLEMS } from "../assets/data/c-problems.js";
const cc = await WebAssembly.compile(fs.readFileSync("assets/vendor/xcc/cc.wasm"));
const rt = await WebAssembly.compile(fs.readFileSync("assets/vendor/xcc/runtime.wasm"));
async function xrun(code, entry, stdin = "") {
  let out = "", err = ""; const lines = stdin.split("\n"); let li = 0;
  const r = await CRepl.create({ ccModule: cc, runtimeModule: rt, runtimeMap, headers, stdout: s => out += s, stderr: s => err += s, stdin: () => li < lines.length ? lines[li++] + "\n" : null });
  const a = await r.run(code); if (a.status !== "ok") return { phase: "compile", out, err };
  const b = await r.run(entry === "tests" ? "__spidy_tests();" : "main();");
  return { phase: b.status === "ok" ? "done" : b.status, out, err };
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cprob-"));
function gccRun(code, stdin) {
  const f = path.join(tmp, "p.c"), exe = path.join(tmp, "p");
  fs.writeFileSync(f, code);
  execFileSync("gcc", [...(m32flag ? ["-m32"] : []), "-w", "-O0", "-o", exe, f], { stdio: "pipe" });
  return execFileSync(exe, [], { input: stdin, encoding: "utf8" });
}
let m32flag = true, m32 = true; try { gccRun("int main(){return 0;}", ""); } catch { m32flag = false; try { gccRun("int main(){return 0;}", ""); } catch { m32 = false; } }
let fail = 0;
for (const p of C_PROBLEMS) {
  const full = p.kind === "function" ? `${p.solution}\n#line 1 "tests"\n${p.harness}\n` : p.solution;
  const ins = p.kind === "function" ? [""] : p.tests;
  let note = "";
  for (const inp of ins) {
    const r = await xrun(full, p.kind === "function" ? "tests" : "main", inp);
    if (r.phase !== "done" || !r.out.trim()) { fail++; console.log("FAIL ref", p.id, r.phase, r.err.slice(0, 300)); continue; }
    if (m32) {
      const g = gccRun(p.kind === "function" ? full.replace('#line 1 "tests"', "") + "\nint main(void){ __spidy_tests(); return 0; }\n" : full, inp);
      if (g.trimEnd() !== r.out.trimEnd()) { fail++; console.log("FAIL gcc mismatch", p.id, "\n--xcc--\n" + r.out + "\n--gcc--\n" + g); }
    }
  }
  const sfull = p.kind === "function" ? `${p.starter}\n#line 1 "tests"\n${p.harness}\n` : p.starter;
  const s = await xrun(sfull, p.kind === "function" ? "tests" : "main", ins[0]);
  if (s.phase === "compile") { fail++; note = "STARTER DOES NOT COMPILE: " + s.err.slice(0, 200); }
  console.log(p.id.padEnd(12), "ok", note);
}
console.log(m32 ? "(cross-checked with gcc)" : "(gcc -m32 not available: not cross-checked)");
console.log(fail ? `${fail} FAILURES` : "ALL GOOD");
