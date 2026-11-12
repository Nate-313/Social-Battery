// ---------- Search (places, classes, people, posts) ----------
ACTS.search = () => openSearch("all");
function openSearch(tab) {
  let cur = tab;
  const layer = openLayer(`<div class="layer-h"><button class="iconbtn" data-act="closeLayer" aria-label="Back">${ICON.back}</button><input class="input" id="sq" placeholder="Search places, classes, people, keywords" autocomplete="off" style="border-radius:999px"></div>
   <div style="padding:10px 16px 0"><div class="seg" id="stabs">${["all", "people", "classes", "places", "posts"].map(t => `<button data-t="${t}" class="${t === cur ? "on" : ""}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div></div>
   <div class="layer-b" id="sres"></div>`);
  const q = $("#sq", layer);
  const draw = () => {
    const s = q.value.trim().toLowerCase(), out = [];
    const people = Object.values(USERS).filter(u => u.id !== "me" && !state.blocked.includes(u.id) && (!s || (u.name + " " + u.handle).toLowerCase().includes(s)));
    const classes = ALL_TAGS.filter(c => s && (c.code + " " + c.title + " " + c.cross.join(" ")).toLowerCase().includes(s)).slice(0, 20);
    const places = SPOTS.concat(state.customSpots).filter(p => !s || p.name.toLowerCase().includes(s));
    const posts = allPosts().filter(p => s && ((p.caption || "") + " " + p.cls + " " + spotName(p.spot) + " " + uname(p.uid)).toLowerCase().includes(s));
    const sec = (title, html) => out.push(`<div class="eyebrow" style="margin:14px 0 6px">${title}</div><div class="card" style="padding:4px 10px">${html}</div>`);
    if ((cur === "all" || cur === "classes") && (classes.length || cur === "classes")) sec("Classes", classes.map(c => `<button class="listrow" data-act="openClass" data-code="${esc(c.code)}"><span class="chip ${c.kind === "tag" ? "gray" : ""}">${esc(c.code)}</span><span class="grow small" style="min-width:0">${esc(c.title)}</span>${state.joinedChats.includes(c.code) ? `<span class="chip mint">Joined</span>` : ""}</button>`).join("") || `<div class="small muted" style="padding:10px 4px">Type a course code or name, like "106B" or "orgo".</div>`);
    if ((cur === "all" || cur === "people") && people.length) sec("People", people.slice(0, cur === "all" ? 4 : 30).map(u => `<div class="listrow">${av(u.id, 38)}<span class="grow"><b>${esc(u.name)}</b><br><span class="small muted">@${esc(u.handle)}</span></span>${state.friends.includes(u.id) ? `<button class="btn sm ghost" data-act="dmUser" data-uid="${u.id}">Message</button>` : state.requests.includes(u.id) ? `<button class="btn sm" data-act="acceptReq" data-uid="${u.id}">Accept</button>` : state.sent.includes(u.id) ? `<span class="chip gray">Requested</span>` : `<button class="btn sm" data-act="addFriend" data-uid="${u.id}">Add friend</button>`}</div>`).join(""));
    if ((cur === "all" || cur === "places") && places.length) sec("Places", places.slice(0, cur === "all" ? 4 : 30).map(p => `<button class="listrow" ${SPOTS.includes(p) ? `data-act="spot" data-id="${p.id}"` : ""}><span class="av" style="width:38px;height:38px;border-radius:12px;background:var(--coral-soft);color:var(--coral)">${ICON.pin}</span><span class="grow"><b>${esc(p.name)}</b><br><span class="small muted">${SPOT_ACTIVITY[p.id] ? `${SPOT_ACTIVITY[p.id][1]} studying now · ${SPOT_ACTIVITY[p.id][0]} posts today` : "Added by students"}</span></span></button>`).join(""));
    if ((cur === "all" || cur === "posts") && posts.length) sec("Posts", posts.slice(0, 10).map(p => `<div class="listrow">${av(p.uid, 34)}<span class="grow small"><b>${esc(uname(p.uid))}</b> · ${esc(p.cls)} · ${esc(spotName(p.spot))}<br><span class="muted">${esc(p.caption || fmtDur(p.dur))}</span></span></div>`).join(""));
    $("#sres", layer).innerHTML = out.join("") || `<div class="empty">${s ? "Nothing matches that yet." : "Search for a class to find its group chat and posts."}</div>`;
  };
  q.oninput = draw; $("#stabs", layer).onclick = e => { const b = e.target.closest("[data-t]"); if (!b) return; cur = b.dataset.t; $$("#stabs button", layer).forEach(x => x.classList.toggle("on", x === b)); draw() };
  draw(); setTimeout(() => q.focus(), 60);
}
// Class page: the chat, posts and live activity for one class
ACTS.openClass = el => {
  closeSheet(); const code = el.dataset.code, c = findTag(code) || { code, title: "", cross: [] };
  const posts = allPosts().filter(p => p.cls === code && (p.classShare || state.friends.includes(p.uid) || p.uid === "me"));
  const live = (code.length * 7) % 19 + 3, inClass = state.myClasses.includes(code), joined = state.joinedChats.includes(code);
  const layer = openLayer(`${layerHead(esc(code))}<div class="layer-b"><div class="stack">
    <div><h2 style="font-size:24px">${esc(code)}</h2><div class="ink2">${esc(c.title)}</div>${c.cross.length ? `<div class="small muted">Same class as ${esc(c.cross.join(", "))}</div>` : ""}</div>
    <div class="kpis"><div class="kpi"><div class="v">${live}</div><div class="k">Locked in now</div></div><div class="kpi"><div class="v">${posts.length + 12}</div><div class="k">Posts this week</div></div><div class="kpi"><div class="v">${(code.length * 13) % 140 + 60}</div><div class="k">In the chat</div></div></div>
    ${joined ? `<button class="btn block" data-act="openThread" data-kind="class" data-id="${esc(code)}">Open ${esc(code)} chat</button>` : `<button class="btn block" data-act="joinChat" data-code="${esc(code)}">${inClass ? "Join" : "Join"} the ${esc(code)} chat · ${TERM}</button>`}
    ${!inClass ? `<button class="btn line block" data-act="addMyClass" data-code="${esc(code)}">Add to my classes</button>` : ""}
    <div class="eyebrow">Posts about ${esc(code)}</div>
    ${posts.length ? posts.map(postHTML).join("") : `<div class="empty">No posts for this class yet. Be the first.</div>`}
  </div></div>`);
  bindPlayers(layer);
};
ACTS.addMyClass = el => { state.myClasses.push(el.dataset.code); save(); closeLayer(); toast(`${el.dataset.code} added to your classes`) };

// ---------- Notifications ----------
function notifications() {
  const r = state.notifsRead;
  return [
    { id: "n1", read: r, html: `<b>Maya</b> tagged you in a joint post from Bender Room`, act: `<button class="btn sm" data-act="acceptJoint">Accept</button>` },
    ...state.requests.map(u => ({ id: "r" + u, read: false, html: `<b>${esc(uname(u))}</b> sent you a friend request`, act: `<button class="btn sm" data-act="acceptReq" data-uid="${u}">Accept</button>` })),
    { id: "n2", read: r, html: `<b>Sam</b> invited you to lock in at Huang at 7:00 PM`, act: `<button class="btn sm ghost" data-act="tab" data-to="chats">View</button>` },
    { id: "n3", read: r, html: `<b>Jordan</b> and 4 others gave your post a key` },
    { id: "n4", read: r, html: `Your streak freeze for this week is ready` },
  ];
}
ACTS.notifs = () => { const list = notifications(); state.notifsRead = true; save(); openSheet(`<h3 style="font-size:19px;margin-bottom:8px">Notifications</h3><div class="stack" style="gap:2px">${list.map(n => `<div class="listrow"><span class="grow small">${n.html}</span>${n.act || ""}</div>`).join("")}</div>`); render() };
ACTS.acceptJoint = () => { closeSheet(); toast("Joint post accepted. It's on your profile now.") };

// ---------- Profile ----------
ACTS.profile = () => {
  const layer = openLayer(`${layerHead("Profile")}<div class="layer-b" id="prof"></div>`);
  const draw = () => {
    const f = flowState();
    $("#prof", layer).innerHTML = `<div class="stack" style="gap:16px">
     <div class="row">${av("me", 64)}<div class="grow"><h2 style="font-size:22px">You</h2><div class="small muted">@you · Stanford</div></div><div style="text-align:center">${lockSVG(f.streak, 64)}<div class="tiny"><b>${f.streak} days</b></div></div></div>
     <div class="field"><label>My classes · ${TERM}</label><div class="row wrap" style="gap:6px">${state.myClasses.map(c => `<span class="chip">${esc(c)} <button data-rm="${esc(c)}" aria-label="Remove ${esc(c)}" style="color:inherit;opacity:.7">×</button></span>`).join("")}<button class="chip gray" id="addCls">+ Add class</button></div></div>
     <div class="card stack" style="gap:14px">
      <div class="row"><div class="grow"><b>Spotify</b><div class="small muted">Locked picks your most locked-in song from what played during your most focused stretch.</div></div><button class="toggle ${state.spotify ? "on" : ""}" id="tSp" role="switch" aria-checked="${state.spotify}" aria-label="Connect Spotify"></button></div>
      <div class="row"><div class="grow"><b>Late-night guard</b><div class="small muted">A gentle reminder after 2 AM that your streak is safe until 4 AM.</div></div><button class="toggle ${state.lateGuard ? "on" : ""}" id="tLg" role="switch" aria-checked="${state.lateGuard}" aria-label="Late-night guard"></button></div>
     </div>
     <div class="card"><b>Privacy</b><ul class="small ink2" style="margin:8px 0 0;padding-left:18px;display:grid;gap:4px"><li>Your Lock Score is private. Friends see your time, goals and pauses.</li><li>Posts go to friends only, plus a class feed when you choose to share there.</li><li>Raw camera frames never leave your phone. Only the 20-second timelapse you post is uploaded.</li><li>Home and dorm sessions never show on the map.</li></ul></div>
     <div class="card"><b>Safety</b><ul class="small ink2" style="margin:8px 0 0;padding-left:18px;display:grid;gap:4px"><li>Captions, comments, messages and Reels are checked before anyone sees them.</li><li>Timelapses and clips are scanned for nudity and violence.</li><li>Anything 3 people report is hidden until reviewed.</li><li>Blocked: ${state.blocked.length ? state.blocked.map(u => esc(uname(u))).join(", ") + ` <button class="chip gray" id="unb">Unblock all</button>` : "nobody"}</li></ul></div>
     <button class="btn line block" id="resetDemo">Reset demo data</button>
    </div>`;
    $$("[data-rm]", layer).forEach(b => b.onclick = () => { state.myClasses = state.myClasses.filter(c => c !== b.dataset.rm); save(); draw() });
    $("#addCls", layer).onclick = () => tagPicker(code => { if (!state.myClasses.includes(code)) state.myClasses.push(code); save(); draw() }, "Add a class");
    $("#tSp", layer).onclick = () => { state.spotify = !state.spotify; save(); draw() };
    $("#tLg", layer).onclick = () => { state.lateGuard = !state.lateGuard; save(); draw() };
    const ub = $("#unb", layer); if (ub) ub.onclick = () => { state.blocked = []; save(); draw() };
    $("#resetDemo", layer).onclick = async () => { try { Object.keys(localStorage).filter(k => k.startsWith("locked.")).forEach(k => localStorage.removeItem(k)) } catch { } for (const p of state.myPosts) await idb.del(p.id); location.reload() };
  };
  draw();
};

// ---------- Break Reels ----------
function reelsOpen() { return state.breakUntil && Date.now() < state.breakUntil }
ACTS.openReels = () => {
  if (!reelsOpen()) { openSheet(`<div style="text-align:center"><div style="color:var(--coral);display:grid;place-items:center">${ICON.film}</div><h3 style="font-size:20px;margin-top:6px">Reels are locked</h3><p class="small ink2" style="margin:8px 0 14px">Reels open for 10 minutes on your hourly break or right after you finish a session, so they never become the distraction.</p><button class="btn block" data-act="newSession">Start a session</button></div>`); return }
  let tab = "friends";
  const el = openLayer("", "reels");
  const draw = () => {
    const clips = REEL_PROMPTS.map((p, i) => ({ p, uid: tab === "friends" ? state.friends[i % state.friends.length] : ["ben", "isla", "marcus", "hana"][i % 4], seed: i + (tab === "friends" ? 0 : 50), keys: 12 + i * 7 })).concat(state.myReels || []);
    el.innerHTML = `<div class="row" style="padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;gap:8px"><button class="iconbtn" data-act="closeLayer" aria-label="Close" style="color:#fff">${ICON.close}</button><div class="seg grow" style="background:rgba(255,255,255,.12)"><button class="${tab === "friends" ? "on" : ""}" data-rt="friends">Friends</button><button class="${tab === "everyone" ? "on" : ""}" data-rt="everyone">Everyone</button></div><span class="chip mint mono" id="rTimer"></span></div>
     <div class="reel-feed" id="rfeed">${clips.map((c, i) => `<div class="reel"><canvas width="400" height="700" data-reel="${i}"></canvas><div class="cap"><div class="chip coral" style="margin-bottom:6px">Prompt</div><div style="font-family:var(--f-display);font-weight:800;font-size:20px">${esc(c.p)}</div><div class="small" style="margin-top:4px">@${esc(USERS[c.uid]?.handle || "you")}</div></div><div class="side"><button>${ICON.key}<span>${c.keys}</span></button><button data-act="report" data-kind="clip" data-uid="${c.uid}">${ICON.more}<span>Report</span></button></div></div>`).join("")}</div>
     <div style="padding:10px 16px calc(12px + env(safe-area-inset-bottom,0px))"><button class="btn coral block" id="recReel">Record a clip for today's prompt</button></div>`;
    $$("[data-rt]", el).forEach(b => b.onclick = () => { tab = b.dataset.rt; draw() });
    $("#recReel", el).onclick = () => recordReel();
    const cvs = $$("[data-reel]", el);
    const loop = () => { if (!document.body.contains(el)) return; const tl = state.breakUntil - Date.now(); const tm = $("#rTimer", el); if (tm) tm.textContent = tl > 0 ? fmtClock(tl * (S?.speed || 1)) + " left" : "Break over"; if (tl <= 0) { el.remove(); toast("Break's over. Reels are locked again."); return }
      const ft = performance.now() / 1000; cvs.forEach(cv => { const r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; reelDraw(cv.getContext("2d"), 400, 700, ft, +cv.dataset.reel + (tab === "friends" ? 0 : 50)) }); requestAnimationFrame(loop) };
    loop();
  };
  draw();
};
function reelDraw(x, w, h, t, seed) {
  const hue = (seed * 47) % 360; const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, `hsl(${hue} 85% 58%)`); g.addColorStop(1, `hsl(${(hue + 60) % 360} 80% 45%)`); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(255,255,255,${.08 + i * .02})`; x.beginPath(); x.arc(w / 2 + Math.sin(t * (1 + i * .3) + i) * 140, h * .4 + Math.cos(t * (1.2 + i * .2) + i * 2) * 160, 30 + i * 12, 0, 7); x.fill() }
  const bx = w / 2 + Math.sin(t * 3 + seed) * 50, by = h * .45 + Math.abs(Math.sin(t * 5 + seed)) * -60;
  x.fillStyle = "#121430"; x.beginPath(); x.ellipse(bx, by + 110, 70, 90, 0, Math.PI, 0); x.fill(); x.fillRect(bx - 70, by + 110, 140, 60);
  x.fillStyle = "#F2C9A0"; x.beginPath(); x.arc(bx, by, 52, 0, 7); x.fill();
  x.fillStyle = "#121430"; x.beginPath(); x.arc(bx - 18, by - 6, 6, 0, 7); x.arc(bx + 18, by - 6, 6, 0, 7); x.fill();
  x.strokeStyle = "#121430"; x.lineWidth = 5; x.beginPath(); x.arc(bx, by + 12, 18, .15 * Math.PI, .85 * Math.PI); x.stroke();
  x.strokeStyle = "#121430"; x.lineWidth = 22; x.lineCap = "round"; const wave = Math.sin(t * 8 + seed) * .8;
  x.beginPath(); x.moveTo(bx - 60, by + 90); x.lineTo(bx - 110, by + 30 + wave * 40); x.stroke(); x.beginPath(); x.moveTo(bx + 60, by + 90); x.lineTo(bx + 110, by + 30 - wave * 40); x.stroke();
}
async function recordReel() {
  const prompt = REEL_PROMPTS[new Date().getDate() % REEL_PROMPTS.length];
  const sh = openSheet(`<h3 style="font-size:19px">Today's prompt</h3><div style="font-family:var(--f-display);font-weight:800;font-size:22px;margin:6px 0 12px">${esc(prompt)}</div><div id="rr" class="stack"><div class="small muted">Up to 20 seconds. Clips are checked automatically before anyone sees them.</div><button class="btn coral block" id="rgo">Start recording</button><label class="btn line block" for="rfile">Or upload a clip<input type="file" id="rfile" accept="video/*" hidden></label></div>`);
  const done = () => { closeSheet(); state.myReels = [...(state.myReels || []), { p: prompt, uid: "me", seed: 99, keys: 0 }]; toast("Clip passed the safety check and was posted to Reels") };
  $("#rfile", sh).onchange = e => { if (e.target.files[0]) { if (e.target.files[0].size > 60e6) { toast("That clip is too long. Keep it under 20 seconds."); return } done() } };
  $("#rgo", sh).onclick = async () => {
    let stream; try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true }) } catch { $("#rr", sh).innerHTML = `<div class="banner sun">The camera isn't available in this preview. Upload a clip instead, or open the app on your phone.</div>`; return }
    const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.srcObject = stream; v.style.cssText = "width:100%;border-radius:14px;transform:scaleX(-1)"; await v.play();
    const box = $("#rr", sh); box.innerHTML = ""; box.appendChild(v); const lbl = document.createElement("div"); lbl.className = "mono"; box.appendChild(lbl);
    let left = 20; lbl.textContent = "Recording · 0:20"; const stopBtn = document.createElement("button"); stopBtn.className = "btn block"; stopBtn.textContent = "Stop"; box.appendChild(stopBtn);
    const iv = setInterval(() => { left--; lbl.textContent = "Recording · 0:" + String(left).padStart(2, "0"); if (left <= 0) fin() }, 1000);
    const fin = () => { clearInterval(iv); stream.getTracks().forEach(t => t.stop()); done() }; stopBtn.onclick = fin;
  };
}

// ---------- Boot ----------
(async function boot() {
  const saved = await idb.all();
  state.myPosts = saved.sort((a, b) => b.end - a.end).map(p => ({ ...p, frames: framesFromData(p.frameData || []) }));
  setTab("feed");
})();
