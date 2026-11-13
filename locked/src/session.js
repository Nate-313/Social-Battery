// ---------- Study score ----------
// Lock Score (0–100) measures quality only. Length is reported separately as Locked time.
//   Presence 45%   share of checks where you were at your desk (micro-motion required, so a photo or empty chair fails)
//   Continuity 30% starts at 100: free pause = under 10 min, one per started hour; extra short pause −8, long pause −12,
//                  leaving the app −5, emergency unlock −20
//   Goals 25%      share of the goals you set before starting that you checked off
// If you set no goals, presence and continuity are reweighted to 60/40.
function scoreSession(s) {
  const activeMin = s.activeMs / MIN, hours = Math.max(1, Math.ceil(activeMin / 60));
  const presence = s.checks ? s.present / s.checks : 1;
  let cont = 100, free = hours; const notes = [];
  for (const p of s.pauses) {
    const m = ((p.end || s.endAt) - p.start) / MIN * s.speed;
    if (m < 10 && free > 0) { free--; notes.push(`Pause ${Math.round(m)} min: free (1 per hour)`) }
    else if (m < 10) { cont -= 8; notes.push(`Extra short pause: −8`) }
    else { cont -= 12; notes.push(`Pause over 10 min: −12`) }
  }
  if (s.leftApp) { cont -= 5 * s.leftApp; notes.push(`Left the app ${s.leftApp}×: −${5 * s.leftApp}`) }
  if (s.emergency) { cont -= 20 * s.emergency; notes.push(`Emergency unlock: −${20 * s.emergency}`) }
  cont = clamp(cont, 0, 100);
  const total = s.goals.length, done = s.goals.filter(g => g.done).length, goals = total ? done / total : null;
  const score = goals === null ? Math.round(.6 * presence * 100 + .4 * cont) : Math.round(.45 * presence * 100 + .30 * cont + .25 * goals * 100);
  return { score: clamp(score, 0, 100), presence, cont, goals, done, total, notes };
}

// ---------- Session setup ----------
let draft = null;
ACTS.newSession = () => {
  if (S) { showSession(); return }
  draft = { cls: state.myClasses[0] || "General", goals: [], spot: "green", lock: true, with: [], intensity: "Normal", fast: true };
  renderSetup();
};
function renderSetup() {
  closeAllLayers();
  const late = lateNight();
  openLayer(`${layerHead("New session")}
  <div class="layer-b"><div class="stack" style="gap:18px">
    ${late ? `<div class="banner sun"><b>It's ${fmtTime(Date.now())}.</b>&nbsp;Sleep counts too. Your streak is safe until 4 AM.</div>` : ""}
    <div class="field"><label>Class</label><button class="input row" style="text-align:left" data-act="pickClass"><span class="chip">${esc(draft.cls)}</span><span class="grow small muted">${esc(findTag(draft.cls)?.title || "")}</span><span class="muted small">Change</span></button></div>
    <div class="field"><label>Goals for this session</label>
      <div class="small muted">Set them now. You can check them off while you study, but you can't edit them after you start.</div>
      <div class="stack" style="gap:6px" id="goalList">${draft.goals.map((g, i) => `<div class="row card" style="padding:9px 12px"><span class="grow">${esc(g.t)}</span><button class="iconbtn" style="width:28px;height:28px" data-act="rmGoal" data-i="${i}" aria-label="Remove goal">${ICON.close}</button></div>`).join("")}</div>
      <div class="row"><input class="input" id="goalIn" placeholder="e.g. Finish problems 1–3" maxlength="80"><button class="btn sm ghost" data-act="addGoal">Add</button></div></div>
    <div class="field"><label for="spotSel">Where are you?</label>
      <select class="input" id="spotSel">${SPOTS.concat(state.customSpots).map(s => `<option value="${s.id}" ${s.id === draft.spot ? "selected" : ""}>${esc(s.name)}</option>`).join("")}<option value="home" ${draft.spot === "home" ? "selected" : ""}>Home / dorm (never shown on the map)</option></select></div>
    <div class="field"><label>Studying with</label><div class="row wrap" style="gap:6px">${state.friends.slice(0, 8).map(u => `<button class="chip ${draft.with.includes(u) ? "sel" : "gray"}" data-act="toggleWith" data-uid="${u}">${esc(uname(u).split(" ")[0])}</button>`).join("")}</div><div class="tiny muted">They'll get a request to make this a joint post.</div></div>
    <div class="field"><label>How heavy is this work? <span class="muted">(optional, used only in your stats, never in your score)</span></label><div class="seg">${["Light", "Normal", "Heavy"].map(x => `<button class="${draft.intensity === x ? "on" : ""}" data-act="setInt" data-v="${x}">${x}</button>`).join("")}</div></div>
    <div class="card row" style="align-items:flex-start"><div class="grow"><b>Lock me in</b><div class="small muted">Blocks other apps until you end. An emergency unlock is always there, but costs 20 points.</div></div><button class="toggle ${draft.lock ? "on" : ""}" data-act="tglLock" role="switch" aria-checked="${draft.lock}" aria-label="Lock me in"></button></div>
    <div class="card row" style="align-items:flex-start;background:var(--sun-soft);border-color:transparent"><div class="grow"><b>Demo clock</b><div class="small ink2">1 real second counts as 1 minute, so you can see breaks, pauses and the score quickly. Turn off for a real session.</div></div><button class="toggle ${draft.fast ? "on" : ""}" data-act="tglFast" role="switch" aria-checked="${draft.fast}" aria-label="Demo clock"></button></div>
    <button class="btn block" data-act="startSession" style="padding:16px">Lock in</button>
    <p class="tiny muted" style="text-align:center">Front camera records one frame every few seconds. Raw frames stay on your phone; only the 20-second timelapse you choose to post is uploaded.</p>
  </div></div>`);
  $("#spotSel").onchange = e => draft.spot = e.target.value;
  $("#goalIn").onkeydown = e => { if (e.key === "Enter") ACTS.addGoal() };
}
ACTS.addGoal = () => { const v = $("#goalIn").value.trim(); if (!v) return; draft.goals.push({ t: v, done: false }); renderSetup(); setTimeout(() => $("#goalIn")?.focus(), 0) };
ACTS.rmGoal = el => { draft.goals.splice(+el.dataset.i, 1); renderSetup() };
ACTS.toggleWith = el => { const u = el.dataset.uid; draft.with = draft.with.includes(u) ? draft.with.filter(x => x !== u) : [...draft.with, u]; renderSetup() };
ACTS.setInt = el => { draft.intensity = el.dataset.v; renderSetup() };
ACTS.tglLock = () => { draft.lock = !draft.lock; renderSetup() };
ACTS.tglFast = () => { draft.fast = !draft.fast; renderSetup() };
ACTS.pickClass = () => tagPicker(code => { draft.cls = code; renderSetup() });
function tagPicker(cb, title = "Tag a class") {
  const sh = openSheet(`<h3 style="font-size:19px;margin-bottom:10px">${title}</h3><input class="input" id="tagQ" placeholder="Search CS 161, Psych, MCAT…" autocomplete="off"><div class="stack" style="gap:2px;margin-top:10px" id="tagRes"></div>`);
  const draw = q => { q = q.trim().toLowerCase(); const mine = state.myClasses.map(findTag).filter(Boolean); let list = q ? ALL_TAGS.filter(c => (c.code + " " + c.title + " " + c.cross.join(" ")).toLowerCase().includes(q)) : mine.concat(EXTRA_TAGS);
    list = list.slice(0, 40);
    $("#tagRes", sh).innerHTML = (q ? "" : `<div class="eyebrow" style="margin:4px 0">Your classes and other tags</div>`) + list.map(c => `<button class="listrow" data-code="${esc(c.code)}"><span class="chip ${c.kind === "tag" ? "gray" : ""}">${esc(c.code)}</span><span class="grow small" style="min-width:0">${esc(c.kind === "tag" ? "Non-course tag" : c.title)}${c.cross.length ? `<span class="muted"> · also ${esc(c.cross.join(", "))}</span>` : ""}</span></button>`).join("") + (q && !list.length ? `<div class="muted small">No match. The full app searches every course in ExploreCourses.</div>` : "") };
  draw(""); const qi = $("#tagQ", sh); qi.oninput = () => draw(qi.value); setTimeout(() => qi.focus(), 50);
  $("#tagRes", sh).addEventListener("click", e => { const b = e.target.closest("[data-code]"); if (b) { closeSheet(); cb(b.dataset.code) } });
}
function lateNight() { const h = new Date().getHours(); return state.lateGuard && h >= 2 && h < 4 }

// ---------- Session engine ----------
let S = null, tickTimer = null, wakeLock = null;
const cap = document.createElement("canvas"); cap.width = 270; cap.height = 360; const capx = cap.getContext("2d", { willReadFrequently: true });
const tiny = document.createElement("canvas"); tiny.width = 16; tiny.height = 20; const tinyx = tiny.getContext("2d", { willReadFrequently: true });
const MAX_FRAMES = 480;
ACTS.startSession = async () => {
  S = {
    ...draft, startAt: Date.now(), lastTick: Date.now(), activeMs: 0, mode: "running", pauses: [], breaks: [], leftApp: 0, emergency: 0,
    frames: [], interval: 2500, lastCap: 0, checks: 0, present: 0, prevSig: null, stillRun: 0, speed: draft.fast ? 60 : 1, nextBreakAt: 60, cam: null, video: null, seed: Math.floor(Math.random() * 1e6),
  };
  closeAllLayers();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.srcObject = stream; await v.play(); S.cam = stream; S.video = v;
  } catch { S.cam = null; toast("Camera isn't available here, so this demo uses a simulated camera") }
  try { wakeLock = await navigator.wakeLock?.request("screen") } catch { }
  showSession(); tickTimer = setInterval(tick, 1000); tick();
};
function sessionNow() { return S.startAt + (Date.now() - S.startAt) * S.speed } // the "clock" in demo mode runs 60× fast
function tick() {
  if (!S) return; const now = Date.now(), dt = (now - S.lastTick) * S.speed; S.lastTick = now;
  if (S.mode === "running") {
    S.activeMs += dt;
    if (now - S.lastCap >= (S.speed > 1 ? 1000 : S.interval)) { capture(); S.lastCap = now }
    if (S.activeMs / MIN >= S.nextBreakAt) { S.nextBreakAt += 60; S.breakOffer = true }
  } else if (S.mode === "paused") {
    const p = S.pauses[S.pauses.length - 1]; if ((now - p.start) * S.speed >= 30 * MIN) { p.end = now; S.autoEnded = true; endSession(); return }
  } else if (S.mode === "break") {
    if (now >= state.breakUntil) { S.mode = "running"; S.breaks[S.breaks.length - 1].end = now; toast("Break's over. Back to locked.") }
  }
  updateSessionUI();
}
function capture() {
  const w = cap.width, h = cap.height;
  if (S.video) { const v = S.video, vw = v.videoWidth || 640, vh = v.videoHeight || 480, sc = Math.max(w / vw, h / vh); capx.save(); capx.translate(w, 0); capx.scale(-1, 1); capx.drawImage(v, (w - vw * sc) / 2, (h - vh * sc) / 2, vw * sc, vh * sc); capx.restore() }
  else sceneDraw(capx, w, h, (S.activeMs / (4 * HOUR)) % 1, S.seed, S.startAt, 4 * HOUR);
  // presence: a person at a desk makes small movements; an empty chair or a photo makes none
  tinyx.drawImage(cap, w * .2, h * .1, w * .6, h * .6, 0, 0, 16, 20); const d = tinyx.getImageData(0, 0, 16, 20).data;
  const sig = []; for (let i = 0; i < d.length; i += 4) sig.push((d[i] + d[i + 1] + d[i + 2]) / 3);
  let diff = 0; if (S.prevSig) for (let i = 0; i < sig.length; i++) diff += Math.abs(sig[i] - S.prevSig[i]); diff /= sig.length; S.prevSig = sig;
  const mean = sig.reduce((a, b) => a + b, 0) / sig.length;
  const moving = S.video ? diff > 1.2 : !(Math.sin((S.activeMs / (4 * HOUR)) * 31 + S.seed) > .985);
  S.stillRun = moving ? 0 : S.stillRun + 1;
  S.checks++; const here = mean > 14 && S.stillRun < 8; if (here) S.present++; S.here = here;
  S.frames.push({ src: cap.toDataURL("image/jpeg", .62) });
  if (S.frames.length > MAX_FRAMES) { S.frames = S.frames.filter((f, i) => f.card || i % 2 === 0); S.interval *= 2 } // keep the timelapse at a fixed size
}
function showSession() {
  if (!S) return; $(".session")?.remove();
  const el = openLayer(`<div class="row" style="width:100%;justify-content:space-between"><span class="rec" id="recLbl"><i></i>Recording</span><span class="tiny" style="color:#6F7398">${esc(S.cls)} · ${esc(spotName(S.spot))}</span></div>
   <div style="text-align:center;width:100%" id="sMid"></div>
   <div style="width:100%" class="stack" id="sBot"></div>`, "session");
  el.id = "sessionLayer"; updateSessionUI();
}
function updateSessionUI() {
  const el = $("#sessionLayer"); if (!el || !S) return;
  const mid = $("#sMid", el), bot = $("#sBot", el), drift = (Math.floor(Date.now() / 20000) % 5) * 6; // nudge text so the dark screen doesn't burn in
  $("#recLbl", el).innerHTML = S.mode === "running" ? `<i></i>Recording · ${S.frames.length} frames${S.here === false ? " · <span style='color:#FFB81F'>can't see you</span>" : ""}` : S.mode === "paused" ? "Paused" : "On break";
  let midHTML = "";
  if (S.mode === "running") midHTML = `<div class="clock" style="transform:translateY(${drift}px)">${fmtClock(S.activeMs)}</div><div class="tiny" style="color:#6F7398;margin-top:6px">${S.speed > 1 ? "Demo clock: 1 sec = 1 min" : "Locked in"}${S.lock ? " · other apps blocked" : ""}</div>`;
  else if (S.mode === "paused") { const p = S.pauses[S.pauses.length - 1], pm = (Date.now() - p.start) * S.speed; midHTML = `<div class="clock" style="color:#FFB81F">${fmtClock(pm)}</div><div class="small" style="color:#8F93B8;margin-top:6px">Paused. Ends automatically at 30:00.<br>${pm < 10 * MIN ? "Under 10 minutes: free once per hour." : "Over 10 minutes: this pause costs 12 points."}</div>` }
  else midHTML = `<div class="clock" style="color:#10B27F">${fmtClock(Math.max(0, state.breakUntil - Date.now()) * S.speed)}</div><div class="small" style="color:#8F93B8;margin-top:6px">Break time doesn't count as a pause.</div><button class="sbtn" style="margin-top:14px" data-act="openReels">Open Break Reels</button>`;
  if (S.breakOffer && S.mode === "running") midHTML += `<div style="margin-top:22px;background:#15172B;border:1px solid #23264A;border-radius:16px;padding:14px;color:#E8EAF6"><b>${Math.floor(S.activeMs / HOUR)} hour locked.</b> Take a 10-minute break? Reels unlock while you rest.<div class="row" style="justify-content:center;margin-top:10px"><button class="sbtn end" data-act="takeBreak">Take a break</button><button class="sbtn" data-act="skipBreak">Keep going</button></div></div>`;
  if (lateNight()) midHTML += `<div class="small" style="margin-top:18px;color:#FFB81F">It's ${fmtTime(Date.now())}. Sleep counts too. Your streak is safe until 4 AM.</div>`;
  if (mid.innerHTML !== midHTML) mid.innerHTML = midHTML;
  const goals = S.goals.length ? `<div>${S.goals.map((g, i) => `<button class="sgoal ${g.done ? "done" : ""}" data-act="checkGoal" data-i="${i}"><span class="box">${g.done ? "✓" : ""}</span><span>${esc(g.t)}</span></button>`).join("")}</div>` : "";
  const btns = `<div class="row" style="justify-content:center;flex-wrap:wrap">${S.mode === "paused" ? `<button class="sbtn end" data-act="resume">Resume</button>` : S.mode === "running" ? `<button class="sbtn" data-act="pause">Pause</button>` : `<button class="sbtn" data-act="endBreak">End break</button>`}<button class="sbtn end" data-act="endSession">End & post</button></div>
    ${S.lock ? `<button class="sbtn em" style="align-self:center" data-act="emergency">Emergency unlock (−20)</button>` : ""}`;
  const botHTML = goals + btns; if (bot._h !== botHTML) { bot.innerHTML = botHTML; bot._h = botHTML }
}
ACTS.checkGoal = el => { const g = S.goals[+el.dataset.i]; g.done = !g.done; updateSessionUI() };
ACTS.pause = () => { S.mode = "paused"; S.pauses.push({ start: Date.now() }); updateSessionUI() };
ACTS.resume = () => { const p = S.pauses[S.pauses.length - 1]; p.end = Date.now(); const m = Math.max(1, Math.round((p.end - p.start) * S.speed / MIN)); S.frames.push({ card: `Paused ${m} min` }, { card: `Paused ${m} min` }); S.mode = "running"; updateSessionUI() };
ACTS.takeBreak = () => { S.breakOffer = false; S.mode = "break"; state.breakUntil = Date.now() + 10 * MIN / S.speed; S.breaks.push({ start: Date.now() }); S.frames.push({ card: "Break" }); updateSessionUI() };
ACTS.skipBreak = () => { S.breakOffer = false; updateSessionUI() };
ACTS.endBreak = () => { state.breakUntil = Date.now(); S.mode = "running"; S.breaks[S.breaks.length - 1].end = Date.now(); updateSessionUI() };
ACTS.emergency = () => openSheet(`<h3 style="font-size:19px">Emergency unlock?</h3><p class="small ink2" style="margin:8px 0 14px">Your session keeps running, but this costs 20 points from today's Lock Score. Calls to emergency services always work without unlocking.</p><div class="stack"><button class="btn danger block" data-act="doEmergency">Unlock for 2 minutes (−20)</button><button class="btn ghost block" data-act="closeSheet">Stay locked</button></div>`);
ACTS.doEmergency = () => { S.emergency++; closeSheet(); toast("Unlocked. In the iPhone app, other apps open for 2 minutes.") };
document.addEventListener("visibilitychange", () => { if (document.hidden && S && S.mode === "running") { S.leftApp++; S.pendingLeft = true } else if (!document.hidden && S?.pendingLeft) { S.pendingLeft = false; toast(S.lock ? "You left Locked: −5. The iPhone app blocks this when Lock me in is on." : "You left Locked: −5") } });
function stopCamera() { S?.cam?.getTracks().forEach(t => t.stop()); try { wakeLock?.release() } catch { } wakeLock = null }
ACTS.endSession = () => endSession();
function endSession() {
  if (!S) return; clearInterval(tickTimer); S.endAt = Date.now();
  if (S.mode === "paused") S.pauses[S.pauses.length - 1].end ||= Date.now();
  stopCamera(); if (S.mode === "break") S.breaks[S.breaks.length - 1].end = Date.now();
  if (!S.frames.length) capture();
  const res = scoreSession(S); const fin = S; S = null; closeAllLayers();
  state.breakUntil = Date.now() + 10 * MIN; // finishing a session unlocks Reels for 10 minutes
  openComposer(fin, res);
}

// ---------- Post composer ----------
function openComposer(s, res) {
  const frames = framesFromData(s.frames);
  const suggested = state.spotify ? SONGS[s.seed % SONGS.length] : null;
  const c = { s, res, frames, caption: "", song: suggested, spot: s.spot, newSpot: "", classShare: false, rating: 0, with: [...s.with] };
  const durReal = s.activeMs;
  const layer = openLayer(`${layerHead("Post your session")}<div class="layer-b"><div class="stack" style="gap:16px" id="comp"></div></div>`);
  const draw = () => {
    const parts = [["Presence", Math.round(res.presence * 100), "At your desk in each camera check"], ["Continuity", Math.round(res.cont), "Pauses, exits and unlocks"], ...(res.goals !== null ? [["Goals", Math.round(res.goals * 100), `${res.done} of ${res.total} done`]] : [])];
    $("#comp", layer).innerHTML = `
    ${s.autoEnded ? `<div class="banner sun">This session ended automatically after a 30-minute pause.</div>` : ""}
    <div style="border-radius:18px;overflow:hidden">${playerHTML({ frames, start: s.startAt, dur: Math.max(durReal, MIN), cls: s.cls, song: c.song })}</div>
    <div class="card"><div class="row"><div class="grow"><div class="eyebrow row" style="gap:4px">${ICON.lock} Lock Score · only you see this</div><div style="font-family:var(--f-display);font-weight:800;font-size:44px;line-height:1;color:var(--blue)" class="tnum">${res.score}</div></div><div style="text-align:right"><div class="eyebrow">Locked time</div><div style="font-family:var(--f-display);font-weight:800;font-size:24px" class="tnum">${fmtDur(durReal)}</div></div></div>
      <div class="bars" style="margin-top:12px">${parts.map(([k, v, d]) => `<div class="barrow" title="${esc(d)}"><span class="lbl">${k}</span><span class="bartrack" style="background:var(--surface-2)"><span class="barfill" style="width:${v}%;display:block"></span></span><span class="val">${v}</span></div>`).join("")}</div>
      ${res.notes.length ? `<div class="tiny muted" style="margin-top:10px">${res.notes.map(esc).join(" · ")}</div>` : ""}</div>
    <div class="card"><b>How focused did it feel?</b><div class="small muted">This doesn't change your score. It's a check that the score matches how the session felt.</div>
      <div class="row" style="margin-top:10px;gap:6px">${[1, 2, 3, 4, 5].map(n => `<button class="chip ${c.rating === n ? "sel" : "gray"}" style="flex:1;justify-content:center;padding:9px" data-r="${n}">${n}</button>`).join("")}</div></div>
    <div class="field"><label for="capIn">Caption</label><textarea class="input" id="capIn" maxlength="280" placeholder="What did you get done?">${esc(c.caption)}</textarea><div id="capWarn"></div></div>
    <div class="field"><label>Class</label><div class="row"><span class="chip">${esc(s.cls)}</span>${findTag(s.cls)?.kind === "course" ? `<span class="grow"></span><span class="small ink2">Also share to the ${esc(s.cls)} feed</span><button class="toggle ${c.classShare ? "on" : ""}" id="csT" role="switch" aria-checked="${c.classShare}" aria-label="Share to class feed"></button>` : ""}</div></div>
    <div class="field"><label for="cSpot">Location</label><select class="input" id="cSpot">${SPOTS.concat(state.customSpots).map(x => `<option value="${x.id}" ${x.id === c.spot ? "selected" : ""}>${esc(x.name)}</option>`).join("")}<option value="home" ${c.spot === "home" ? "selected" : ""}>Home / dorm (private)</option><option value="__new">+ Add a new spot</option></select>
      ${c.spot === "__new" ? `<input class="input" id="newSpot" placeholder="Name the spot, e.g. Hume Writing Center" value="${esc(c.newSpot)}">` : ""}
      <div class="tiny muted" id="geo">${c.spot === "home" ? "Home sessions never appear on the map." : "Checking that you're near this spot…"}</div></div>
    <div class="field"><label>Locked-in song</label>
      ${c.song ? songHTML(c.song) : ""}
      <div class="row"><button class="btn sm ghost" id="songBtn">${c.song ? "Change song" : "Add a song"}</button>${c.song ? `<button class="btn sm line" id="songRm">Remove</button>` : ""}${!state.spotify ? `<span class="tiny muted grow">Connect Spotify in your profile and Locked picks the song you played during your most focused stretch.</span>` : `<span class="tiny muted grow">Picked from what you played during your most focused stretch.</span>`}</div></div>
    <div class="field"><label>Studied with</label><div class="row wrap" style="gap:6px">${state.friends.slice(0, 8).map(u => `<button class="chip ${c.with.includes(u) ? "sel" : "gray"}" data-w="${u}">${esc(uname(u).split(" ")[0])}</button>`).join("")}</div><div class="tiny muted">Tagged friends have to accept before the joint post shows on their profile.</div></div>
    <div class="banner blue">${ICON.shield}<span>Before anything goes live, Locked checks your caption and timelapse for inappropriate content. Your friends see this post; ${c.classShare ? `classmates in ${esc(s.cls)} will too.` : "it isn't shared to the class feed."}</span></div>
    <div id="postErr"></div>
    <button class="btn block" id="postBtn" style="padding:15px">Post</button>
    <button class="btn ghost block" id="privBtn">Save privately (still counts for your streak and stats)</button>`;
    bindPlayers(layer);
    const capIn = $("#capIn", layer); capIn.oninput = () => { c.caption = capIn.value; const m = moderate(c.caption); $("#capWarn", layer).innerHTML = m.lvl === "ok" ? "" : `<div class="banner ${m.lvl === "block" ? "danger" : "sun"}" style="margin-top:6px">${ICON.shield}<span>${esc(modMessage(m))}</span></div>` }; capIn.oninput();
    $$("[data-r]", layer).forEach(b => b.onclick = () => { c.rating = +b.dataset.r; draw() });
    $$("[data-w]", layer).forEach(b => b.onclick = () => { const u = b.dataset.w; c.with = c.with.includes(u) ? c.with.filter(x => x !== u) : [...c.with, u]; draw() });
    const csT = $("#csT", layer); if (csT) csT.onclick = () => { c.classShare = !c.classShare; draw() };
    $("#cSpot", layer).onchange = e => { c.spot = e.target.value; draw() };
    const ns = $("#newSpot", layer); if (ns) ns.oninput = () => c.newSpot = ns.value;
    $("#songBtn", layer).onclick = () => songPicker(sng => { c.song = sng; draw() });
    const rm = $("#songRm", layer); if (rm) rm.onclick = () => { c.song = null; draw() };
    $("#postBtn", layer).onclick = () => publish(c, false, layer);
    $("#privBtn", layer).onclick = () => publish(c, true, layer);
    verifyGeo(c.spot);
  };
  draw();
}
function verifyGeo(spotId) {
  const el = $("#geo"); if (!el || spotId === "home" || spotId === "__new") return;
  if (!navigator.geolocation) { el.textContent = "Location check unavailable here."; return }
  navigator.geolocation.getCurrentPosition(pos => {
    const sp = SPOTS.find(s => s.id === spotId); const ref = sp?.ll || CAMPUS;
    const dLat = (pos.coords.latitude - ref[0]) * 111000, dLng = (pos.coords.longitude - ref[1]) * 88000, dist = Math.hypot(dLat, dLng);
    el.innerHTML = dist < 400 ? `<span style="color:var(--mint)">✓ Verified: you're near ${esc(spotName(spotId))}</span>` : `<span style="color:#8A5A00">You don't seem to be near ${esc(spotName(spotId))}. The post will show the spot as "unverified".</span>`;
  }, () => { el.textContent = "Couldn't check your location in this preview. The iPhone app verifies it before posting." }, { timeout: 6000 });
}
function songPicker(cb) {
  const sh = openSheet(`<h3 style="font-size:19px;margin-bottom:10px">Most locked-in song</h3><input class="input" id="songQ" placeholder="Search songs"><div class="stack" style="gap:2px;margin-top:10px" id="songRes"></div><p class="tiny muted" style="margin-top:10px">Viewers hear a 30-second preview through Apple Music or open the full song in their own Spotify. That keeps the music licensed.</p>`);
  const drawS = q => { q = q.toLowerCase(); $("#songRes", sh).innerHTML = SONGS.filter(s => (s.t + " " + s.a).toLowerCase().includes(q)).map(s => `<button class="listrow" data-t="${esc(s.t)}"><b class="small">${esc(s.t)}</b><span class="small muted">${esc(s.a)}</span></button>`).join("") };
  drawS(""); $("#songQ", sh).oninput = e => drawS(e.target.value);
  $("#songRes", sh).addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (b) { closeSheet(); cb(SONGS.find(s => s.t === b.dataset.t)) } });
}
async function publish(c, priv, layer) {
  const err = $("#postErr", layer);
  if (c.spot === "__new") { const n = c.newSpot.trim(); const m = moderate(n); if (!n || m.lvl === "block") { err.innerHTML = `<div class="banner danger">Give the new spot an appropriate name.</div>`; return } const id = "c" + Date.now(); state.customSpots.push({ id, name: n, ll: CAMPUS }); c.spot = id }
  const m = moderate(c.caption);
  if (m.lvl === "block") { err.innerHTML = `<div class="banner danger">${ICON.shield}<span>${esc(modMessage(m))}</span></div>`; return }
  if (!priv) {
    err.innerHTML = `<div class="banner blue">${ICON.shield}<span>Checking your caption and timelapse…</span></div>`;
    const scan = scanFrames(c.frames); await new Promise(r => setTimeout(r, 700));
    if (scan.flagged) { err.innerHTML = `<div class="banner danger">${ICON.shield}<span>Some frames may show inappropriate content, so this post can't go to the feed. You can still save it privately. If this is a mistake, request a review.</span></div>`; return }
  }
  const p = {
    id: "p" + Date.now(), uid: "me", with: c.with, cls: c.s.cls, spot: c.spot, start: c.s.startAt, end: c.s.startAt + c.s.activeMs, dur: c.s.activeMs,
    caption: c.caption.trim(), song: c.song, goalsDone: c.res.done, goalsTotal: c.res.total, pauses: c.s.pauses.length, keys: 0, comments: 0, score: c.res.score, rating: c.rating,
    classShare: c.classShare && !priv, private: priv, intensity: c.s.intensity, music: !!c.song, group: c.with.length > 0, status: m.lvl === "warn" ? "review" : "live",
    frameData: c.s.frames,
  };
  p.frames = c.frames; state.myPosts.unshift(p); const { frames, ...rest } = p; idb.put(rest); save();
  closeLayer(layer); state.feedTab = "friends"; setTab(priv ? "stats" : "feed");
  toast(priv ? "Saved privately. It counts for your streak and stats." : m.lvl === "warn" ? "Posted. A reviewer will take a quick look because of the flagged wording." : c.with.length ? "Posted! Tagged friends got a request to join the post." : "Posted to your friends' feeds");
}
