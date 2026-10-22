// Minimal WASI (preview1) implementation with an in-memory file system.
// Enough to run the xcc compiler (cc.wasm) and the C REPL runtime,
// in node.js as well as in a browser worker.

const ERRNO = { SUCCESS: 0, BADF: 8, EXIST: 20, INVAL: 28, ISDIR: 31, NOENT: 44, NOSYS: 52, NOTDIR: 54 };
const FILETYPE = { CHARACTER_DEVICE: 2, DIRECTORY: 3, REGULAR_FILE: 4 };
const OFLAGS = { CREAT: 1, DIRECTORY: 2, EXCL: 4, TRUNC: 8 };
const FDFLAGS = { APPEND: 1 };

export class WASIExit extends Error {
  constructor(code) {
    super(`exit(${code})`);
    this.code = code;
  }
}

function normalize(path) {
  const out = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return "/" + out.join("/");
}

// Flat in-memory file system: Map<absolute path, {buf, size}>, where buf is
// an Uint8Array of capacity >= size; directories are implicit.
export class MemFS {
  constructor() {
    this.files = new Map();
  }
  writeFile(path, data) {
    if (typeof data === "string") data = new TextEncoder().encode(data);
    this.files.set(normalize(path), { buf: data, size: data.length });
  }
  readFile(path) {
    const f = this.files.get(normalize(path));
    return f === undefined ? undefined : f.buf.subarray(0, f.size);
  }
  // Write data at a position (amortized growth of the buffer).
  write(path, pos, data) {
    path = normalize(path);
    let f = this.files.get(path);
    if (f === undefined) this.files.set(path, (f = { buf: new Uint8Array(0), size: 0 }));
    const end = pos + data.length;
    if (end > f.buf.length) {
      const buf = new Uint8Array(Math.max(end, 2 * f.buf.length, 256));
      buf.set(f.buf.subarray(0, f.size));
      f.buf = buf;
    }
    if (pos > f.size) f.buf.fill(0, f.size, pos);
    f.buf.set(data, pos);
    f.size = Math.max(f.size, end);
  }
  size(path) {
    const f = this.files.get(normalize(path));
    return f === undefined ? 0 : f.size;
  }
  truncate(path) {
    this.writeFile(path, new Uint8Array(0));
  }
  readText(path) {
    const d = this.readFile(path);
    return d === undefined ? undefined : new TextDecoder().decode(d);
  }
  unlink(path) {
    return this.files.delete(normalize(path));
  }
  isDir(path) {
    path = normalize(path);
    if (path === "/") return true;
    const prefix = path + "/";
    for (const k of this.files.keys()) if (k.startsWith(prefix)) return true;
    return false;
  }
}

export class WASI {
  // options: { args, env, fs, stdin(): Uint8Array|string|null, stdout(bytes), stderr(bytes) }
  constructor(options = {}) {
    this.args = options.args || [];
    this.env = options.env || {};
    this.fs = options.fs || new MemFS();
    this.stdin = options.stdin || (() => null);
    this.stdout = options.stdout || (() => {});
    this.stderr = options.stderr || (() => {});
    this.memory = null;
    this.stdinBuffer = new Uint8Array(0);
    this.stdinEOF = false;
    // fd table: 0-2 stdio, 3 = preopened root "/",
    // 4 = preopened current directory "." (also "/"), for relative paths.
    this.fds = new Map([
      [0, { type: "stdin" }],
      [1, { type: "stdout" }],
      [2, { type: "stderr" }],
      [3, { type: "dir", path: "/", preopen: "/" }],
      [4, { type: "dir", path: "/", preopen: "." }],
    ]);
    this.nextFd = 5;
    this.imports = this.makeImports();
  }

  setMemory(memory) {
    this.memory = memory;
  }

  view() {
    return new DataView(this.memory.buffer);
  }
  bytes() {
    return new Uint8Array(this.memory.buffer);
  }
  readString(ptr, len) {
    return new TextDecoder().decode(this.bytes().subarray(ptr, ptr + len));
  }
  // iovecs: array of [ptr, len]
  iovecs(ptr, count) {
    const v = this.view();
    const r = [];
    for (let i = 0; i < count; i++) r.push([v.getUint32(ptr + 8 * i, true), v.getUint32(ptr + 8 * i + 4, true)]);
    return r;
  }
  resolvePath(dirfd, ptr, len) {
    const dir = this.fds.get(dirfd);
    if (dir === undefined || dir.type !== "dir") return null;
    const p = this.readString(ptr, len);
    return normalize(p.startsWith("/") ? p : dir.path + "/" + p);
  }

  fillStdin() {
    if (this.stdinEOF) return;
    let data = this.stdin();
    if (data === null || data === undefined) {
      this.stdinEOF = true;
      return;
    }
    if (typeof data === "string") data = new TextEncoder().encode(data);
    const buf = new Uint8Array(this.stdinBuffer.length + data.length);
    buf.set(this.stdinBuffer);
    buf.set(data, this.stdinBuffer.length);
    this.stdinBuffer = buf;
  }

  makeImports() {
    const self = this;
    const wasi = {
      args_sizes_get(argcPtr, sizePtr) {
        const v = self.view();
        const enc = self.args.map((a) => new TextEncoder().encode(a + "\0"));
        v.setUint32(argcPtr, enc.length, true);
        v.setUint32(sizePtr, enc.reduce((s, a) => s + a.length, 0), true);
        return ERRNO.SUCCESS;
      },
      args_get(argvPtr, bufPtr) {
        const v = self.view();
        const b = self.bytes();
        self.args.forEach((a, i) => {
          const e = new TextEncoder().encode(a + "\0");
          v.setUint32(argvPtr + 4 * i, bufPtr, true);
          b.set(e, bufPtr);
          bufPtr += e.length;
        });
        return ERRNO.SUCCESS;
      },
      environ_sizes_get(countPtr, sizePtr) {
        const v = self.view();
        const enc = Object.entries(self.env).map(([k, x]) => new TextEncoder().encode(`${k}=${x}\0`));
        v.setUint32(countPtr, enc.length, true);
        v.setUint32(sizePtr, enc.reduce((s, a) => s + a.length, 0), true);
        return ERRNO.SUCCESS;
      },
      environ_get(envPtr, bufPtr) {
        const v = self.view();
        const b = self.bytes();
        Object.entries(self.env).forEach(([k, x], i) => {
          const e = new TextEncoder().encode(`${k}=${x}\0`);
          v.setUint32(envPtr + 4 * i, bufPtr, true);
          b.set(e, bufPtr);
          bufPtr += e.length;
        });
        return ERRNO.SUCCESS;
      },
      clock_time_get(id, precision, timePtr) {
        const ns = BigInt(Math.round((id === 0 ? Date.now() : performance.now()) * 1e6));
        self.view().setBigUint64(timePtr, ns, true);
        return ERRNO.SUCCESS;
      },
      clock_res_get(id, resPtr) {
        self.view().setBigUint64(resPtr, 1000n, true);
        return ERRNO.SUCCESS;
      },
      random_get(ptr, len) {
        crypto.getRandomValues(self.bytes().subarray(ptr, ptr + len));
        return ERRNO.SUCCESS;
      },
      proc_exit(code) {
        throw new WASIExit(code);
      },
      sched_yield() {
        return ERRNO.SUCCESS;
      },
      fd_write(fd, iovs, iovsLen, nwrittenPtr) {
        const f = self.fds.get(fd);
        if (f === undefined) return ERRNO.BADF;
        let total = 0;
        const chunks = [];
        for (const [ptr, len] of self.iovecs(iovs, iovsLen)) {
          chunks.push(self.bytes().slice(ptr, ptr + len));
          total += len;
        }
        const data = new Uint8Array(total);
        let o = 0;
        for (const c of chunks) {
          data.set(c, o);
          o += c.length;
        }
        if (f.type === "stdout") self.stdout(data);
        else if (f.type === "stderr") self.stderr(data);
        else if (f.type === "file") {
          const pos = f.append ? self.fs.size(f.path) : f.pos;
          self.fs.write(f.path, pos, data);
          f.pos = pos + total;
        } else return ERRNO.BADF;
        self.view().setUint32(nwrittenPtr, total, true);
        return ERRNO.SUCCESS;
      },
      fd_read(fd, iovs, iovsLen, nreadPtr) {
        const f = self.fds.get(fd);
        if (f === undefined) return ERRNO.BADF;
        let total = 0;
        if (f.type === "stdin") {
          if (self.stdinBuffer.length === 0) self.fillStdin();
          for (const [ptr, len] of self.iovecs(iovs, iovsLen)) {
            const n = Math.min(len, self.stdinBuffer.length);
            self.bytes().set(self.stdinBuffer.subarray(0, n), ptr);
            self.stdinBuffer = self.stdinBuffer.subarray(n);
            total += n;
            if (n < len) break;
          }
        } else if (f.type === "file") {
          const data = self.fs.readFile(f.path) || new Uint8Array(0);
          for (const [ptr, len] of self.iovecs(iovs, iovsLen)) {
            const n = Math.max(0, Math.min(len, data.length - f.pos));
            self.bytes().set(data.subarray(f.pos, f.pos + n), ptr);
            f.pos += n;
            total += n;
            if (n < len) break;
          }
        } else return ERRNO.BADF;
        self.view().setUint32(nreadPtr, total, true);
        return ERRNO.SUCCESS;
      },
      fd_seek(fd, offset, whence, newOffsetPtr) {
        const f = self.fds.get(fd);
        if (f === undefined || f.type !== "file") return ERRNO.BADF;
        const size = self.fs.size(f.path);
        const off = Number(offset);
        f.pos = whence === 0 ? off : whence === 1 ? f.pos + off : size + off;
        self.view().setBigUint64(newOffsetPtr, BigInt(f.pos), true);
        return ERRNO.SUCCESS;
      },
      fd_tell(fd, offsetPtr) {
        const f = self.fds.get(fd);
        if (f === undefined || f.type !== "file") return ERRNO.BADF;
        self.view().setBigUint64(offsetPtr, BigInt(f.pos), true);
        return ERRNO.SUCCESS;
      },
      fd_close(fd) {
        if (!self.fds.has(fd)) return ERRNO.BADF;
        if (fd > 4) self.fds.delete(fd);
        return ERRNO.SUCCESS;
      },
      fd_sync() {
        return ERRNO.SUCCESS;
      },
      fd_fdstat_get(fd, statPtr) {
        const f = self.fds.get(fd);
        if (f === undefined) return ERRNO.BADF;
        const v = self.view();
        const type = f.type === "dir" ? FILETYPE.DIRECTORY : f.type === "file" ? FILETYPE.REGULAR_FILE : FILETYPE.CHARACTER_DEVICE;
        v.setUint8(statPtr, type);
        v.setUint16(statPtr + 2, 0, true);
        v.setBigUint64(statPtr + 8, 0xffffffffffffffffn, true);
        v.setBigUint64(statPtr + 16, 0xffffffffffffffffn, true);
        return ERRNO.SUCCESS;
      },
      fd_fdstat_set_flags() {
        return ERRNO.SUCCESS;
      },
      fd_prestat_get(fd, ptr) {
        const f = self.fds.get(fd);
        if (f === undefined || f.preopen === undefined) return ERRNO.BADF;
        const v = self.view();
        v.setUint8(ptr, 0);
        v.setUint32(ptr + 4, new TextEncoder().encode(f.preopen).length, true);
        return ERRNO.SUCCESS;
      },
      fd_prestat_dir_name(fd, ptr, len) {
        const f = self.fds.get(fd);
        if (f === undefined || f.preopen === undefined) return ERRNO.BADF;
        self.bytes().set(new TextEncoder().encode(f.preopen).subarray(0, len), ptr);
        return ERRNO.SUCCESS;
      },
      fd_filestat_get(fd, ptr) {
        const f = self.fds.get(fd);
        if (f === undefined) return ERRNO.BADF;
        if (f.type === "file") return self.filestat(ptr, FILETYPE.REGULAR_FILE, self.fs.size(f.path));
        if (f.type === "dir") return self.filestat(ptr, FILETYPE.DIRECTORY, 0);
        return self.filestat(ptr, FILETYPE.CHARACTER_DEVICE, 0);
      },
      path_filestat_get(dirfd, flags, pathPtr, pathLen, ptr) {
        const path = self.resolvePath(dirfd, pathPtr, pathLen);
        if (path === null) return ERRNO.BADF;
        const data = self.fs.readFile(path);
        if (data !== undefined) return self.filestat(ptr, FILETYPE.REGULAR_FILE, data.length);
        if (self.fs.isDir(path)) return self.filestat(ptr, FILETYPE.DIRECTORY, 0);
        return ERRNO.NOENT;
      },
      path_open(dirfd, dirflags, pathPtr, pathLen, oflags, rightsBase, rightsInh, fdflags, fdPtr) {
        const path = self.resolvePath(dirfd, pathPtr, pathLen);
        if (path === null) return ERRNO.BADF;
        let data = self.fs.readFile(path);
        if (data === undefined) {
          if (self.fs.isDir(path)) {
            const fd = self.nextFd++;
            self.fds.set(fd, { type: "dir", path });
            self.view().setUint32(fdPtr, fd, true);
            return ERRNO.SUCCESS;
          }
          if (!(oflags & OFLAGS.CREAT)) return ERRNO.NOENT;
          data = new Uint8Array(0);
          self.fs.writeFile(path, data);
        } else {
          if (oflags & OFLAGS.DIRECTORY) return ERRNO.NOTDIR;
          if ((oflags & OFLAGS.CREAT) && (oflags & OFLAGS.EXCL)) return ERRNO.EXIST;
          if (oflags & OFLAGS.TRUNC) self.fs.writeFile(path, new Uint8Array(0));
        }
        const fd = self.nextFd++;
        self.fds.set(fd, { type: "file", path, pos: 0, append: !!(fdflags & FDFLAGS.APPEND) });
        self.view().setUint32(fdPtr, fd, true);
        return ERRNO.SUCCESS;
      },
      path_unlink_file(dirfd, pathPtr, pathLen) {
        const path = self.resolvePath(dirfd, pathPtr, pathLen);
        if (path === null) return ERRNO.BADF;
        return self.fs.unlink(path) ? ERRNO.SUCCESS : ERRNO.NOENT;
      },
      path_create_directory() {
        return ERRNO.SUCCESS;
      },
      path_remove_directory() {
        return ERRNO.SUCCESS;
      },
      path_rename(fd1, p1, l1, fd2, p2, l2) {
        const from = self.resolvePath(fd1, p1, l1);
        const to = self.resolvePath(fd2, p2, l2);
        const data = self.fs.readFile(from);
        if (data === undefined) return ERRNO.NOENT;
        self.fs.writeFile(to, data);
        self.fs.unlink(from);
        return ERRNO.SUCCESS;
      },
      poll_oneoff() {
        return ERRNO.NOSYS;
      },
    };
    return new Proxy(wasi, {
      get(target, name) {
        if (name in target) return target[name];
        return () => ERRNO.NOSYS;
      },
    });
  }

  filestat(ptr, type, size) {
    const v = this.view();
    for (let i = 0; i < 64; i += 8) v.setBigUint64(ptr + i, 0n, true);
    v.setUint8(ptr + 16, type);
    v.setBigUint64(ptr + 32, BigInt(size), true);
    return ERRNO.SUCCESS;
  }
}
