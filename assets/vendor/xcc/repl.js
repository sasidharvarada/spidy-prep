// C REPL: each cell is compiled by xcc (in REPL mode) into a small WebAssembly
// side module, linked against the runtime (libc) and the previous cells:
// memory, function table and stack pointer are shared, so the state persists.
import { MemFS, WASI, WASIExit } from "./wasi.js";

const REPL_HEADER = `#line 1 "<repl>"
void __repl_show(const char *type, int kind, int size, int count, const void *p,
                 const char *desc);
void *__repl_check_ptr(const void *p, const char *where);
long long __repl_check_index(long long index, long long length, const char *where);
`;

const TMP = "/tmp/.repl";

// Runtime errors: same message whatever the JavaScript engine.
const RUNTIME_ERRORS = [
  [/divide by zero|division by zero/i, "division by zero"],
  [/call stack|too much recursion|stack overflow/i, "stack overflow (infinite recursion?)"],
  [/out of bounds/i, "invalid memory access"],
  [/integer overflow/i, "integer overflow"],
  [/unrepresentable|float.*integer/i, "float to integer conversion out of range"],
  [/indirect call|signature mismatch|null function|function signature/i, "invalid function pointer"],
  [/unreachable/i, "unreachable code reached"],
];

// Errors detected by the runtime (NULL pointer, array index...).
class ReplRuntimeError extends Error {}

function runtimeErrorMessage(e) {
  if (e instanceof ReplRuntimeError) return `Runtime error: ${e.message}\n`;
  const message = e?.message ?? String(e);
  for (const [re, text] of RUNTIME_ERRORS)
    if (re.test(message)) return `Runtime error: ${text}\n`;
  return `Runtime error: ${message}\n`;
}

function parseMap(text) {
  const map = { data: new Map(), dataEnd: 0, tableEnd: 0 };
  for (const line of text.split("\n")) {
    const [kind, name, value] = line.split(" ");
    switch (kind) {
      case "D": map.data.set(name, Number(value)); break;
      case "DATA_END": map.dataEnd = Number(name); break;
      case "TABLE_END": map.tableEnd = Number(name); break;
    }
  }
  return map;
}

// Compiler: cc.wasm (xcc compiled to WebAssembly) running on a file system
// where the headers are in /usr/include.
export class WasmCompiler {
  constructor(ccModule, fs) {
    this.ccModule = ccModule;
    this.fs = fs;
  }

  async compile(args) {
    const decoder = new TextDecoder();
    let messages = "";
    const wasi = new WASI({
      args: ["cc", ...args],
      fs: this.fs,
      stdout: (b) => { messages += decoder.decode(b); },
      stderr: (b) => { messages += decoder.decode(b); },
    });
    const instance = await WebAssembly.instantiate(this.ccModule, { wasi_snapshot_preview1: wasi.imports });
    wasi.setMemory(instance.exports.memory);
    let status = 0;
    try {
      instance.exports._start();
    } catch (e) {
      if (!(e instanceof WASIExit)) throw e;
      status = e.code;
    }
    // Temporary files of the compiler are not always removed.
    for (const path of [...this.fs.files.keys()])
      if (path.startsWith("/tmp/tmp") || path.startsWith("/tmp/xcc-")) this.fs.unlink(path);
    return { status, messages };
  }
}

export class CRepl {
  // options:
  //   ccModule, runtimeModule: compiled WebAssembly modules (cc.wasm, runtime.wasm)
  //   runtimeMap: text of the runtime symbol map
  //   headers: {relative path: content} installed in /usr/include
  //   stdout(text), stderr(text): output callbacks
  //   stdin(): synchronous, returns a string (a line) or null (end of file)
  //   fs: optional MemFS shared by the compiler and the C program
  static async create(options) {
    const repl = new CRepl(options);
    await repl.init();
    return repl;
  }

  constructor(options) {
    this.options = options;
    this.fs = options.fs ?? new MemFS();
    for (const [path, content] of Object.entries(options.headers ?? {}))
      this.fs.writeFile(`/usr/include/${path}`, content);
    this.compiler = new WasmCompiler(options.ccModule, this.fs);
    this.cells = [];  // Successfully loaded cells: {name, code}
    this.count = 0;  // Execution count
  }

  async init() {
    const { runtimeModule, runtimeMap, stdout, stderr, stdin } = this.options;
    const decoder = new TextDecoder();
    // UTF-8 sequences can be split between writes.
    const outDecoder = new TextDecoder(), errDecoder = new TextDecoder();
    this.wasi = new WASI({
      fs: this.fs,
      stdout: (b) => stdout(outDecoder.decode(b, { stream: true })),
      stderr: (b) => stderr(errDecoder.decode(b, { stream: true })),
      stdin,
    });
    const cString = (ptr) => {
      const bytes = new Uint8Array(this.exports.memory.buffer, ptr);
      return decoder.decode(bytes.subarray(0, bytes.indexOf(0)));
    };
    const env = {
      __repl_result: (ptr, len) => {
        const bytes = new Uint8Array(this.exports.memory.buffer, ptr, len);
        this.result = decoder.decode(bytes);
      },
      __repl_runtime_error: (message) => {
        throw new ReplRuntimeError(cString(message));
      },
    };
    const instance = await WebAssembly.instantiate(runtimeModule, {
      wasi_snapshot_preview1: this.wasi.imports,
      env,
    });
    this.exports = instance.exports;
    this.wasi.setMemory(this.exports.memory);
    this.exports.__repl_init();

    this.data = parseMap(runtimeMap).data;  // Data symbol → address
    this.functions = new Map();  // Function name → current definition
    for (const [name, value] of Object.entries(this.exports))
      if (typeof value === "function") this.functions.set(name, value);
    this.cellFunctions = new Set();  // Functions defined by cells (late bound)
    this.wrappers = new Map();
  }

  source(code, name) {
    const prelude = this.cells.map((c) => `#line 1 "${c.name}"\n${c.code}\n;\n`).join("");
    return `${REPL_HEADER}${prelude}#line 1 "${name}"\n${code}\n`;
  }

  importFunction(name) {
    if (!this.cellFunctions.has(name)) {
      const f = this.functions.get(name);
      if (f === undefined) throw new Error(`undefined reference to \`${name}'`);
      return f;
    }
    // Late binding: a redefinition in a later cell is taken into account.
    if (!this.wrappers.has(name)) this.wrappers.set(name, (...args) => this.functions.get(name)(...args));
    return this.wrappers.get(name);
  }

  // Run a cell. Returns {status, result} where status is "ok", "error"
  // (compile or link error) or "exception" (runtime error), and result the
  // display of the last expression (if any).
  async run(code) {
    const { stderr } = this.options;
    const name = `cell[${++this.count}]`;
    const fs = this.fs;
    this.result = undefined;
    fs.writeFile(`${TMP}/cell.c`, this.source(code, name));
    fs.writeFile(`${TMP}/in.map`, [...this.data].map(([n, a]) => `D ${n} ${a}\n`).join(""));
    fs.unlink(`${TMP}/cell.wasm`);

    const table = this.exports.__indirect_function_table;
    const brk = this.exports.sbrk(0);
    const dataBase = (brk + 15) & ~15;
    const tableBase = table.length;
    const { status, messages } = await this.compiler.compile([
      `--repl-cell=${name}`, "-nostdlib", "--entry-point=",
      "-I/",  // User files (#include "file.h")
      "-Wl,--side-module", "-Wl,--allow-undefined", "-Wl,--export-all",
      `-Wl,--data-base=${dataBase}`, `-Wl,--table-base=${tableBase}`,
      `-Wl,--map-in=${TMP}/in.map`, `-Wl,--map-out=${TMP}/out.map`,
      "-o", `${TMP}/cell.wasm`, `${TMP}/cell.c`,
    ]);
    if (messages) stderr(messages);
    if (status !== 0) return { status: "error" };

    // Reserve memory for the data of the cell, and room in the function table.
    const map = parseMap(fs.readText(`${TMP}/out.map`));
    if (map.dataEnd > brk) this.exports.sbrk(map.dataEnd - brk);
    if (map.tableEnd > table.length) table.grow(map.tableEnd - table.length);

    const self = this;
    const env = new Proxy({
      memory: this.exports.memory,
      __indirect_function_table: table,
      __stack_pointer: this.exports.__stack_pointer,
    }, {
      get(target, prop) {
        return prop in target ? target[prop] : self.importFunction(prop);
      },
    });
    let instance;
    try {
      instance = (await WebAssembly.instantiate(fs.readFile(`${TMP}/cell.wasm`), { env })).instance;
    } catch (e) {
      stderr(`${name}: ${e.message}\n`);
      return { status: "error" };
    }

    // The cell is loaded: its definitions are now available.
    this.cells.push({ name, code });
    for (const [n, a] of map.data) this.data.set(n, a);
    for (const [n, f] of Object.entries(instance.exports)) {
      if (typeof f !== "function" || n === "__repl_cell") continue;
      this.functions.set(n, f);
      this.cellFunctions.add(n);
    }

    let result = "ok";
    const run = instance.exports.__repl_cell;
    if (run !== undefined) {
      const sp = this.exports.__stack_pointer.value;
      try {
        run();
      } catch (e) {
        this.exports.__stack_pointer.value = sp;  // Unwind the C stack.
        if (e instanceof WASIExit) {
          if (e.code !== 0) stderr(`exit(${e.code})\n`);
        } else {
          result = "exception";
          stderr(runtimeErrorMessage(e));
        }
      }
    }
    this.exports.__repl_flush();
    return { status: result, result: this.result };
  }
}
