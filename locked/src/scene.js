// ---------- Mock posts and history ----------
const NOW = Date.now();
function makeMockPosts() {
  const r = rng(42), out = [];
  const plan = [
    ["maya", "CS 161", "bender", 3.1, "pset 5 finally done 🫠", ["priya"], 1, true],
    ["jordan", "MATH 51", "huang", 2.2, "eigen-everything", [], 2.5, false],
    ["leo", "CS 106B", "gates", 1.6, "recursion is a lifestyle", [], 4, false],
    ["sam", "CS 161", "huang", 2.8, "midterm prep w/ the crew", ["leo", "priya"], 5.5, true],
    ["ava", "CHEM 33", "lathrop", 1.9, "orgo mechanisms on repeat", [], 7, false],
    ["noor", "PSYCH 1", "coho", 1.2, "", [], 9, true],
    ["diego", "ECON 50", "tresidder", 2.4, "lagrangians at tresidder", [], 11, false],
    ["zoe", "MATH 51", "green", 3.6, "4am-to-4am kind of day", ["noor"], 14, true],
    ["ethan", "MCAT", "lane", 4.2, "CARS passages all afternoon", [], 18, false],
    ["priya", "CS 229", "y2e2", 2.0, "backprop by hand", [], 21, false],
    ["maya", "PSYCH 1", "meyer", 1.1, "reading on the grass", [], 23, true],
  ];
  plan.forEach(([uid, cls, spot, hrs, cap, withU, hAgo, classShare], i) => {
    const end = NOW - hAgo * HOUR - r() * 40 * MIN, dur = hrs * HOUR;
    out.push({
      id: "m" + i, uid, with: withU, cls, spot, start: end - dur, end, dur, caption: cap,
      song: r() > .2 ? SONGS[Math.floor(r() * SONGS.length)] : null,
      goalsDone: Math.ceil(r() * 3) + 1, goalsTotal: 4, pauses: Math.floor(r() * 3), keys: Math.floor(r() * 30) + 3, seed: i * 97 + 13,
      classShare, comments: Math.floor(r() * 6),
    });
  });
  return out;
}
const MOCK_POSTS = makeMockPosts();
// Campus-wide post counts in the last 24 hours and people studying right now, per spot.
const SPOT_ACTIVITY = { green: [46, 19], bender: [28, 11], lathrop: [17, 6], huang: [39, 22], gates: [24, 9], y2e2: [21, 7], tresidder: [15, 4], coho: [12, 5], meyer: [8, 2], law: [11, 3], gsb: [9, 2], lane: [26, 13], arrillaga: [6, 1], cantor: [2, 0] };
const SPOT_SCORE = { green: 81, bender: 86, lathrop: 77, huang: 79, gates: 74, y2e2: 69, tresidder: 61, coho: 58, meyer: 64, law: 84, gsb: 72, lane: 83, arrillaga: 55, cantor: 70 };

// Sample history for "You" so Stats has something to show before you log your own sessions.
function makeHistory() {
  const r = rng(7), out = [], spots = ["green", "bender", "huang", "lathrop", "tresidder", "home", "coho", "y2e2"];
  const spotBias = { green: 8, bender: 12, huang: 4, lathrop: 2, tresidder: -9, home: -14, coho: -11, y2e2: -4 };
  for (let d = 44; d >= 1; d--) {
    if (d === 9 || d === 23 || d === 30 || d === 31) continue; // missed days
    const n = r() > .7 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const hour = [9, 10, 13, 14, 15, 16, 19, 20, 21, 22, 23][Math.floor(r() * 11)];
      const start = new Date(NOW - d * DAY); start.setHours(hour, Math.floor(r() * 60), 0, 0);
      const spot = spots[Math.floor(r() * spots.length)], cls = state.myClasses[Math.floor(r() * state.myClasses.length)] || "CS 161";
      const dur = (35 + r() * 170) * MIN, music = r() > .4, group = r() > .75;
      const hourBias = hour <= 11 ? 9 : hour <= 16 ? 2 : hour <= 21 ? 4 : -10;
      const lenBias = dur > 150 * MIN ? -6 : dur < 50 * MIN ? -3 : 3;
      const score = clamp(Math.round(68 + spotBias[spot] + hourBias + lenBias + (music ? 3 : 0) + (group ? -2 : 0) + (r() - .5) * 16), 22, 99);
      out.push({ id: "h" + d + k, sample: true, start: +start, dur, end: +start + dur, spot, cls, score, music, group, intensity: ["Light", "Normal", "Heavy"][Math.floor(r() * 3)] });
    }
  }
  return out;
}
const HISTORY = makeHistory();

// ---------- Generative timelapse scene (used for friends' posts and when no camera is available) ----------
function sceneDraw(ctx, w, h, t, seed, startTs, durMs) {
  const r = rng(seed); const skin = ["#F2C9A0", "#C68E62", "#8D5A3B", "#E8B48A", "#5E3B28"][seed % 5];
  const shirt = ["#2D5BFF", "#FF5B3A", "#10B27F", "#A24BFF", "#FFB81F", "#0FA3C9"][seed % 6];
  const hair = ["#1D1A2B", "#4A2E1A", "#2B1B10", "#B67A3C", "#111"][seed % 5];
  const clock = new Date(startTs + t * durMs), hr = clock.getHours() + clock.getMinutes() / 60;
  const day = clamp(1 - Math.abs(hr - 13) / 7, 0, 1); // 1 at 1 PM, 0 after 8 PM
  const q = Math.floor(t * 600); const jr = rng(seed * 1000 + q); // quantized jitter makes it read as a timelapse
  // wall
  const wall = `rgb(${Math.round(40 + 190 * day)},${Math.round(42 + 180 * day)},${Math.round(70 + 160 * day)})`;
  ctx.fillStyle = wall; ctx.fillRect(0, 0, w, h);
  // window with sky
  const wx = w * .56, wy = h * .1, ww = w * .36, wh = h * .3;
  const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, day > .5 ? "#7EC3FF" : day > .15 ? "#FF9A6B" : "#0E1438"); sky.addColorStop(1, day > .5 ? "#CDE8FF" : day > .15 ? "#FFD39A" : "#232A5C");
  ctx.fillStyle = sky; ctx.fillRect(wx, wy, ww, wh);
  const sunX = wx + ww * ((hr % 24) / 24), sunY = wy + wh * (.85 - .6 * day);
  ctx.fillStyle = day > .15 ? "#FFE58A" : "#E6E9FF"; ctx.beginPath(); ctx.arc(sunX, sunY, w * .03, 0, 7); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = w * .012; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
  // lamp glow at night
  if (day < .4) { const g = ctx.createRadialGradient(w * .2, h * .55, 5, w * .2, h * .55, w * .6); g.addColorStop(0, `rgba(255,210,120,${.45 * (1 - day / .4)})`); g.addColorStop(1, "rgba(255,210,120,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h) }
  // shelf + books
  ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(w * .05, h * .3, w * .4, h * .015);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = ["#FF5B3A", "#2D5BFF", "#FFB81F", "#10B27F", "#A24BFF", "#fff"][(i + seed) % 6]; const bh = h * (.06 + r() * .04); ctx.fillRect(w * .07 + i * w * .055, h * .3 - bh, w * .045, bh) }
  // person (bobbing / leaning, presence gaps when away)
  const away = (Math.sin(t * 31 + seed) > .985);
  const lean = Math.sin(t * 55 + seed) * w * .02 + (jr() - .5) * w * .03;
  const cx = w * .42 + lean, cy = h * .5 + (jr() - .5) * h * .015;
  if (!away) {
    ctx.fillStyle = shirt; ctx.beginPath(); ctx.ellipse(cx, cy + h * .2, w * .22, h * .16, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - w * .22, cy + h * .2, w * .44, h * .1);
    ctx.fillStyle = skin; ctx.fillRect(cx - w * .04, cy + h * .02, w * .08, h * .06);
    ctx.beginPath(); ctx.ellipse(cx, cy - h * .03, w * .1, h * .085, 0, 0, 7); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(cx, cy - h * .075, w * .108, h * .055, 0, Math.PI, 0); ctx.fill();
    // headphones some of the time
    if (seed % 3 === 0) { ctx.strokeStyle = "#222"; ctx.lineWidth = w * .018; ctx.beginPath(); ctx.arc(cx, cy - h * .04, w * .115, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke() }
    // arm writing
    const ax = cx + w * .1 + Math.sin(t * 900 + seed) * w * .04;
    ctx.strokeStyle = shirt; ctx.lineWidth = w * .07; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(cx + w * .15, cy + h * .14); ctx.lineTo(ax, cy + h * .28); ctx.stroke();
  }
  // desk
  ctx.fillStyle = "#B9835A"; ctx.fillRect(0, h * .78, w, h * .22); ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.fillRect(0, h * .78, w, h * .012);
  // laptop
  ctx.fillStyle = "#C9CEDB"; ctx.fillRect(w * .58, h * .66, w * .3, h * .12); ctx.fillStyle = "#AEB4C5"; ctx.fillRect(w * .55, h * .78, w * .36, h * .015);
  ctx.fillStyle = day < .4 ? "rgba(160,200,255,.9)" : "#E6EEFF"; ctx.fillRect(w * .6, h * .675, w * .26, h * .095);
  // papers + mug
  ctx.save(); ctx.translate(w * .2, h * .86); ctx.rotate(-.12 + (jr() - .5) * .05); ctx.fillStyle = "#fff"; ctx.fillRect(-w * .12, -h * .04, w * .24, h * .07); ctx.restore();
  ctx.fillStyle = ["#FF5B3A", "#2D5BFF", "#10B27F"][seed % 3]; ctx.fillRect(w * .07, h * .73, w * .065, h * .07);
}
// Overlay drawn on every timelapse: clock, elapsed, class tag, song.
function overlayDraw(ctx, w, h, t, meta) {
  const s = w / 300;
  const clock = new Date(meta.start + t * meta.dur);
  const pill = (x, y, txt, align = "left", bg = "rgba(10,12,30,.62)") => {
    ctx.font = `700 ${12 * s}px JetBrains Mono, monospace`; const tw = ctx.measureText(txt).width + 16 * s;
    const px = align === "right" ? x - tw : x; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(px, y, tw, 22 * s, 11 * s); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(txt, px + 8 * s, y + 15.5 * s);
  };
  pill(10 * s, 10 * s, clock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  pill(w - 10 * s, 10 * s, fmtClock(t * meta.dur), "right");
  if (meta.cls) pill(10 * s, h - 32 * s, meta.cls, "left", "rgba(45,91,255,.9)");
  if (meta.song) { ctx.font = `600 ${11 * s}px Inter, sans-serif`; const txt = "♪ " + meta.song.t + " · " + meta.song.a; ctx.fillStyle = "rgba(10,12,30,.62)"; const tw = Math.min(ctx.measureText(txt).width + 16 * s, w - 20 * s); ctx.beginPath(); ctx.roundRect(10 * s, h - 60 * s, tw, 22 * s, 11 * s); ctx.fill(); ctx.save(); ctx.beginPath(); ctx.rect(10 * s, h - 60 * s, tw - 6 * s, 22 * s); ctx.clip(); ctx.fillStyle = "#fff"; ctx.fillText(txt, 18 * s, h - 45 * s); ctx.restore() }
  // progress bar
  ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(0, h - 3 * s, w, 3 * s); ctx.fillStyle = "#fff"; ctx.fillRect(0, h - 3 * s, w * t, 3 * s);
}
function cardDraw(ctx, w, h, text) {
  ctx.fillStyle = "#0B0D1E"; ctx.fillRect(0, 0, w, h); const s = w / 300;
  ctx.fillStyle = "#FFB81F"; ctx.beginPath(); ctx.roundRect(w / 2 - 70 * s, h / 2 - 26 * s, 140 * s, 52 * s, 14 * s); ctx.fill();
  ctx.fillStyle = "#121430"; ctx.font = `800 ${17 * s}px Bricolage Grotesque, sans-serif`; ctx.textAlign = "center"; ctx.fillText(text, w / 2, h / 2 + 6 * s); ctx.textAlign = "left";
}

// ---------- Players: one animation loop drives every visible timelapse ----------
const PLAYERS = new Map(); let playerSeq = 0;
const LOOP_MS = 20000; // every timelapse is exactly 20 seconds
function playerHTML(spec) {
  const id = "pl" + (++playerSeq); PLAYERS.set(id, { ...spec, t0: performance.now(), paused: false, visible: false, pausedAt: 0 });
  return `<div class="player" data-player="${id}"><canvas width="600" height="800"></canvas><div class="pp">${ICON.play}</div></div>`;
}
const playerObserver = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { const p = PLAYERS.get(e.target.dataset.player); if (p) p.visible = e.isIntersecting }), { threshold: .2 }) : null;
function bindPlayers(root) {
  $$("[data-player]", root).forEach(el => {
    const p = PLAYERS.get(el.dataset.player); if (!p || p.el) return; p.el = el; p.ctx = el.querySelector("canvas").getContext("2d");
    if (playerObserver) playerObserver.observe(el); else p.visible = true;
    el.addEventListener("click", () => { p.paused = !p.paused; if (p.paused) p.pausedAt = performance.now(); else p.t0 += performance.now() - p.pausedAt; el.classList.toggle("paused", p.paused) });
    drawPlayer(p, 0.02);
  });
}
function drawPlayer(p, t) {
  const c = p.ctx, w = 600, h = 800;
  if (p.frames && p.frames.length) {
    const f = p.frames[Math.min(p.frames.length - 1, Math.floor(t * p.frames.length))];
    if (f.card) cardDraw(c, w, h, f.card);
    else if (f.img && f.img.complete !== false) { const iw = f.img.naturalWidth || f.img.width, ih = f.img.naturalHeight || f.img.height, sc = Math.max(w / iw, h / ih); c.drawImage(f.img, (w - iw * sc) / 2, (h - ih * sc) / 2, iw * sc, ih * sc) }
  } else {
    const pc = p.pauseAt && p.pauseAt.find(pt => Math.abs(t - pt) < .012);
    if (pc !== undefined && pc !== null && p.pauseAt.length) cardDraw(c, w, h, "Paused " + (p.pauseMin || 7) + " min"); else sceneDraw(c, w, h, t, p.seed, p.start, p.dur);
  }
  overlayDraw(c, w, h, t, p);
}
function playerLoop(now) {
  for (const [id, p] of PLAYERS) {
    if (!p.el || !document.body.contains(p.el)) { if (p.el) { playerObserver?.unobserve(p.el); PLAYERS.delete(id) } continue }
    if (!p.visible || p.paused) continue;
    drawPlayer(p, ((now - p.t0) % LOOP_MS) / LOOP_MS);
  }
  requestAnimationFrame(playerLoop);
}
requestAnimationFrame(playerLoop);
function framesFromData(arr) { return arr.map(f => { if (f.card) return f; const im = new Image(); im.src = f.src; return { img: im } }) }
