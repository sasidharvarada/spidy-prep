/* ==========================================================================
   Cloud sync with Firebase (optional).
   - Sign in with Google -> progress lives at Firestore users/{uid}
   - Works offline: localStorage is always the first copy
   - One-time import of the Embedded Tracker ticks from progress/main
   Needs firebase-config.js (window.FIREBASE_CONFIG). Without it the site
   simply runs in "this device only" mode.
   ========================================================================== */
import { store, mergeStates } from "./store.js";

const V = "10.12.2";
const listeners = new Set();
let st = { state: "off", user: null, msg: "", lastSync: 0 };
let F = null, unsubDoc = null, pushT = null, applyingRemote = false, lastPushed = 0;
const set = patch => { st = Object.assign({}, st, patch); listeners.forEach(f => { try { f(st); } catch (e) { console.error(e); } }); };
export const syncState = () => st;
export const onSync = f => { listeners.add(f); f(st); return () => listeners.delete(f); };

async function load() {
  if (F) return F;
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.projectId || !cfg.apiKey) throw Object.assign(new Error("No firebase-config.js"), { code: "no-config" });
  const [appM, authM, fsM] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const app = appM.getApps().length ? appM.getApp() : appM.initializeApp(cfg);
  F = { appM, authM, fsM, app, auth: authM.getAuth(app), db: fsM.getFirestore(app) };
  return F;
}

export async function initSync() {
  if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.projectId) { set({ state: "off", msg: "Cloud sync is not set up (firebase-config.js missing). Progress is saved on this device." }); return; }
  set({ state: "loading", msg: "Connecting..." });
  try {
    const { authM, auth } = await load();
    try { await authM.getRedirectResult(auth); } catch (e) { if (e && e.code !== "auth/no-auth-event") set({ state: "error", msg: explain(e) }); }
    authM.onAuthStateChanged(auth, user => { if (user) startUser(user); else stopUser(); });
  } catch (e) {
    console.warn("Firebase unavailable", e);
    set({ state: "error", msg: explain(e) });
  }
}

function stopUser() {
  if (unsubDoc) { unsubDoc(); unsubDoc = null; }
  set({ state: "local", user: null, msg: "Signed out. Progress is saved on this device only." });
}

async function startUser(user) {
  const { fsM, db } = F;
  const ref = fsM.doc(db, "users", user.uid);
  set({ state: "loading", user: { name: user.displayName, email: user.email, photo: user.photoURL }, msg: "Syncing..." });
  try {
    const snap = await fsM.getDoc(ref);
    let local = store.raw();
    if (snap.exists()) {
      const remote = parse(snap.data());
      applyingRemote = true; store.replace(mergeStates(local, remote), "sync"); applyingRemote = false;
    } else if (!local.imported.tracker) {
      // first sign-in: pull the Embedded Tracker ticks once if they are readable
      try { await importTracker(true); } catch (e) { /* tracker doc not readable: fine */ }
    }
    await push(true);
    unsubDoc = fsM.onSnapshot(ref, s => {
      if (s.metadata.hasPendingWrites || !s.exists()) return;
      const remote = parse(s.data());
      if (remote.updatedAt && remote.updatedAt === lastPushed) return; // echo of our own save
      applyingRemote = true; store.replace(mergeStates(store.raw(), remote), "sync"); applyingRemote = false;
      set({ lastSync: Date.now() });
    }, e => set({ state: "error", msg: explain(e) }));
    set({ state: "signedin", msg: "Synced to your Google account.", lastSync: Date.now() });
  } catch (e) {
    console.warn(e);
    set({ state: "error", msg: explain(e) });
  }
}

function parse(d) { try { return typeof d.data === "string" ? JSON.parse(d.data) : (d.data || {}); } catch (e) { return {}; } }

async function push(now) {
  if (!F || !F.auth.currentUser) return;
  clearTimeout(pushT);
  const go = async () => {
    const { fsM, db, auth } = F;
    let s = store.raw(), txt = JSON.stringify(s);
    if (txt.length > 900000) { const lite = Object.assign({}, s, { code: {}, circuits: {} }); txt = JSON.stringify(lite); set({ msg: "Saved code and circuits are too large to sync; they stay on this device." }); }
    try {
      lastPushed = s.updatedAt || Date.now();
      await fsM.setDoc(fsM.doc(db, "users", auth.currentUser.uid), { data: txt, updatedAt: lastPushed, v: 2 });
      set({ state: "signedin", lastSync: Date.now(), msg: "Synced to your Google account." });
    } catch (e) { set({ state: "error", msg: explain(e) }); }
  };
  if (now) return go();
  pushT = setTimeout(go, 1500);
}
store.on(why => { if (why === "sync" || applyingRemote) return; push(false); });
addEventListener("beforeunload", () => { if (pushT) { clearTimeout(pushT); push(true); } });

export async function signIn() {
  try {
    const { authM, auth } = await load();
    const prov = new authM.GoogleAuthProvider();
    try { await authM.signInWithPopup(auth, prov); }
    catch (e) {
      if (/popup-blocked|operation-not-supported|cancelled-popup/.test(e.code || "")) await authM.signInWithRedirect(auth, prov);
      else throw e;
    }
  } catch (e) { set({ state: "error", msg: explain(e) }); throw e; }
}
export async function signOut() { if (F) await F.authM.signOut(F.auth); }

/* Read the Embedded Tracker document (progress/main) and merge its ticks. */
export async function importTracker(quiet) {
  const { fsM, db } = await load();
  const snap = await fsM.getDoc(fsM.doc(db, "progress", "main"));
  if (!snap.exists()) { if (!quiet) throw new Error("The tracker document progress/main is empty."); return 0; }
  const d = snap.data() || {};
  return store.mergeTracker(d.done || {});
}

function explain(e) {
  const c = (e && e.code) || "";
  if (c === "no-config") return "Cloud sync is not set up (firebase-config.js missing). Progress is saved on this device.";
  if (c.includes("unauthorized-domain")) return "Google sign-in is blocked for this web address. In Firebase console > Authentication > Settings > Authorized domains, add this site's domain.";
  if (c.includes("operation-not-allowed")) return "Google sign-in is not enabled. In Firebase console > Authentication > Sign-in method, enable Google.";
  if (c.includes("popup-closed")) return "Sign-in window was closed.";
  if (c.includes("permission-denied")) return "Firestore refused access. Publish the security rules from README.md (users/{uid} must be readable and writable by its owner).";
  if (c.includes("unavailable") || /Failed to fetch|NetworkError|dynamically imported/i.test(e && e.message)) return "Offline or Firebase unreachable. Progress is saved on this device and will sync later.";
  return "Cloud sync problem: " + ((e && e.message) || c || "unknown error") + ". Progress is still saved on this device.";
}
