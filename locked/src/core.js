// ---------- Core helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MIN = 60000, HOUR = 3600000, DAY = 86400000;
const store = {
  get(k, d) { try { const v = localStorage.getItem("locked." + k); return v ? JSON.parse(v) : d } catch { return d } },
  set(k, v) { try { localStorage.setItem("locked." + k, JSON.stringify(v)) } catch { } }
};
function rng(seed) { let s = typeof seed === "string" ? [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) : seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function fmtDur(ms) { const m = Math.round(ms / MIN); const h = Math.floor(m / 60); return h ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${m}m` }
function fmtClock(ms) { const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" : "") + String(m).padStart(h ? 2 : 1, "0") + ":" + String(x).padStart(2, "0") }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }
function ago(ts) { const d = Date.now() - ts; if (d < MIN) return "now"; if (d < HOUR) return Math.round(d / MIN) + "m"; if (d < DAY) return Math.round(d / HOUR) + "h"; return Math.round(d / DAY) + "d" }
// Study days run 4 AM to 4 AM, so a 1 AM session counts for the night before.
function studyDay(ts) { const d = new Date(ts - 4 * HOUR); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
function initials(n) { return n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() }
function av(uid, size = 36) { const u = USERS[uid] || { name: "?", color: "#999" }; return `<span class="av" style="width:${size}px;height:${size}px;background:${u.color};font-size:${Math.round(size * .38)}px" aria-hidden="true">${uid === "me" ? "Y" : initials(u.name)}</span>` }
function uname(uid) { return USERS[uid]?.name || "Someone" }
function spotName(id) { return id === "home" ? HOME_SPOT.name : (SPOTS.find(s => s.id === id)?.name || state.customSpots.find(s => s.id === id)?.name || "Somewhere") }
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600) }
const ICON = {
  key: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/></svg>`,
  chat: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg>`,
  more: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
  back: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  close: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  pin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  lock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  play: `<svg width="56" height="56" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>`,
  send: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>`,
  shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  film: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4"/></svg>`,
};

// ---------- Logo: "lo" + a sideways shackle forming the c, locked into a box holding the k, then "ed" ----------
function logoSVG(h = 30, color = "var(--ink)", accent = "var(--blue)") {
  return `<svg height="${h}" viewBox="0 0 276 84" role="img" aria-label="locked"><g fill="${color}" font-family="Plus Jakarta Sans, Avenir Next, system-ui, sans-serif" font-weight="800">
  <text x="0" y="66" font-size="78" letter-spacing="-3">lo</text>
  <text x="193" y="66" font-size="78" letter-spacing="-3">ed</text></g>
  <path d="M135 28 H112 a19 19 0 0 0 0 38 H135" fill="none" stroke="${color}" stroke-width="11.5"/>
  <rect x="129" y="16" width="56" height="62" rx="11" fill="${accent}"/>
  <text x="157" y="66" text-anchor="middle" fill="#fff" font-family="Plus Jakarta Sans, Avenir Next, system-ui, sans-serif" font-weight="800" font-size="56">k</text></svg>`;
}

// ---------- Content safety ----------
// Every caption, comment, chat message and Reel title goes through moderate() before it is
// shown to anyone. Production adds a server-side moderation model plus image checks
// (Apple's on-device Sensitive Content Analysis on iPhone, then a server scan of the video).
const MOD_RULES = [
  { cat: "Harassment or self-harm", lvl: "block", re: /\b(kys|kill (your|ur)self|go die|you should die|nobody likes you)\b/ },
  { cat: "Sexual content", lvl: "block", re: /\b(nudes?|porn\w*|onlyfans|send pics|sexting)\b/ },
  { cat: "Profanity or slurs", lvl: "block", re: /\b(f+u+c+k+\w*|sh+i+t+\w*|bitch\w*|cunt\w*|whore|slut|retard\w*)\b/ },
  { cat: "Selling drugs", lvl: "block", re: /\b(selling|sell|buy|dm for|got) (adderall|addy|xanax|molly|coke|percs?|ritalin)\b/ },
  { cat: "Threats or violence", lvl: "block", re: /\b(shoot (up|this)|bomb (the|this)|i('| wi)ll hurt)\b/ },
  { cat: "Possible Honor Code issue", lvl: "warn", re: /\b(answers? (to|for) (the )?(midterm|final|exam|quiz|pset|problem set)|pset solutions?|exam answers?|send (me )?(your|the) (code|solutions?))\b/ },
  { cat: "Personal info", lvl: "warn", re: /(\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b)|(\b[\w.+-]+@[\w-]+\.[\w.]+\b)/ },
];
function normalizeText(t) { return t.toLowerCase().replace(/[0]/g, "o").replace(/[1!|]/g, "i").replace(/3/g, "e").replace(/[4@]/g, "a").replace(/[5$]/g, "s").replace(/7/g, "t").replace(/(.)\1{2,}/g, "$1$1") }
function moderate(text) {
  if (!text || !text.trim()) return { lvl: "ok", hits: [] };
  const raw = text.toLowerCase(), norm = normalizeText(text), squash = norm.replace(/[\s._*-]+/g, " ");
  const hits = MOD_RULES.filter(r => r.re.test(raw) || r.re.test(norm) || r.re.test(squash));
  const lvl = hits.some(h => h.lvl === "block") ? "block" : hits.length ? "warn" : "ok";
  return { lvl, hits: hits.map(h => h.cat) };
}
function modMessage(m) {
  if (m.lvl === "block") return `This can't be posted: ${m.hits.filter((_, i) => i < 2).join(", ").toLowerCase()}. Locked keeps the feed safe for everyone. Edit it and try again.`;
  if (m.lvl === "warn") return `Heads up: ${m.hits.join(", ").toLowerCase()}. ${m.hits.includes("Possible Honor Code issue") ? "Sharing graded answers can violate the Stanford Honor Code." : "Think twice before sharing contact details publicly."}`;
  return "";
}
// Quick image check on captured frames. Production uses a trained model; the demo checks that
// the camera wasn't covered and samples frames for a large share of skin-like pixels.
function scanFrames(frames) {
  const c = document.createElement("canvas"); c.width = 24; c.height = 32; const x = c.getContext("2d", { willReadFrequently: true });
  let dark = 0, skinHeavy = 0, n = 0;
  const sample = frames.filter(f => f && f.img).filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 24)) === 0);
  for (const f of sample) {
    try { x.drawImage(f.img, 0, 0, 24, 32) } catch { continue }
    const d = x.getImageData(0, 0, 24, 32).data; let lum = 0, skin = 0;
    for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; lum += (r + g + b) / 3; if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - Math.min(g, b) > 15) skin++ }
    n++; if (lum / (d.length / 4) < 12) dark++; if (skin / (d.length / 4) > .72) skinHeavy++;
  }
  return { n, flagged: n > 0 && skinHeavy / n > .5, covered: n > 0 && dark / n > .8 };
}

// ---------- State ----------
const state = {
  tab: "feed", feedTab: "friends", chatTab: "classes", mapMode: "heat",
  myClasses: store.get("classes", ["CS 161", "MATH 51", "PSYCH 1"]),
  joinedChats: store.get("joined", ["CS 161", "MATH 51"]),
  customSpots: store.get("spots", []),
  friends: store.get("friends", ["maya", "jordan", "priya", "leo", "sam", "ava", "diego", "noor", "ethan", "zoe"]),
  requests: store.get("requests", ["hana", "marcus"]),
  sent: store.get("sent", []),
  blocked: store.get("blocked", []),
  hiddenPosts: store.get("hidden", []),
  exams: store.get("exams", [{ cls: "CS 161", ts: Date.now() + 5 * DAY + 3 * HOUR, label: "Midterm" }]),
  spotify: store.get("spotify", false),
  lateGuard: store.get("lateGuard", true),
  myPosts: [], // filled from IndexedDB on boot
  keys: store.get("keys", {}),
  comments: store.get("comments", {}),
  chats: store.get("chats", null),
  notifsRead: store.get("notifsRead", false),
  freezeUsedWeek: store.get("freezeWeek", null),
};
function save() {
  store.set("classes", state.myClasses); store.set("joined", state.joinedChats); store.set("spots", state.customSpots);
  store.set("friends", state.friends); store.set("requests", state.requests); store.set("sent", state.sent); store.set("blocked", state.blocked);
  store.set("hidden", state.hiddenPosts); store.set("exams", state.exams); store.set("spotify", state.spotify); store.set("lateGuard", state.lateGuard);
  store.set("keys", state.keys); store.set("comments", state.comments); store.set("chats", state.chats); store.set("notifsRead", state.notifsRead);
}
if (!state.chats) {
  state.chats = { classes: {}, dms: DM_SEEDS.map(d => ({ ...d, msgs: d.msgs.map(([from, text], i) => ({ from, text, ts: Date.now() - (d.msgs.length - i) * 9 * MIN })) })) };
  for (const [cls, msgs] of Object.entries(CHAT_SEEDS)) state.chats.classes[cls] = msgs.map(([from, text, extra], i) => ({ from, text, ts: Date.now() - (msgs.length - i) * 23 * MIN, ...(extra || {}) }));
}

// ---------- IndexedDB for your own timelapses (frames are too big for localStorage) ----------
const idb = {
  db: null,
  async open() { if (this.db) return this.db; return this.db = await new Promise((res, rej) => { try { const r = indexedDB.open("locked", 1); r.onupgradeneeded = () => r.result.createObjectStore("posts", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) } catch (e) { rej(e) } }) },
  async all() { try { const db = await this.open(); return await new Promise(res => { const q = db.transaction("posts").objectStore("posts").getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]) }) } catch { return [] } },
  async put(p) { try { const db = await this.open(); db.transaction("posts", "readwrite").objectStore("posts").put(p) } catch { } },
  async del(id) { try { const db = await this.open(); db.transaction("posts", "readwrite").objectStore("posts").delete(id) } catch { } },
};
