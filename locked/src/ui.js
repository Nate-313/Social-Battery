// ---------- Shell: tabs, layers, sheets ----------
const view = $("#view"), layers = $("#layers"), sheets = $("#sheets");
function setTab(t) { state.tab = t; $$(".tab").forEach(b => b.classList.toggle("on", b.dataset.tab === t)); render() }
function render() {
  const fn = { feed: renderFeed, map: renderMap, chats: renderChats, stats: renderStats }[state.tab];
  view.innerHTML = fn(); bindPlayers(view); afterRender[state.tab]?.(); view.scrollTop = view._keep || 0; view._keep = 0;
  $("#meAv").innerHTML = av("me", 32);
  const unread = notifications().filter(n => !n.read).length; $("#bellBtn .dot")?.remove(); if (unread) $("#bellBtn").insertAdjacentHTML("beforeend", `<span class="dot">${unread}</span>`);
}
const afterRender = {};
function rerenderKeepScroll() { view._keep = view.scrollTop; render() }
function openLayer(html, cls = "layer") { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; layers.appendChild(d); bindPlayers(d); return d }
function closeLayer(el) { (el || layers.lastElementChild)?.remove() }
function layerHead(title, extra = "") { return `<div class="layer-h"><button class="iconbtn" data-act="closeLayer" aria-label="Back">${ICON.back}</button><h2>${title}</h2>${extra}</div>` }
function openSheet(html) { const d = document.createElement("div"); d.className = "scrim"; d.innerHTML = `<div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`; d.addEventListener("click", e => { if (e.target === d) d.remove() }); sheets.appendChild(d); bindPlayers(d); return d }
function closeSheet() { sheets.lastElementChild?.remove() }

// One click handler for the whole app: elements declare data-act="name" and data-* args.
const ACTS = {};
document.addEventListener("click", e => {
  const tab = e.target.closest("[data-tab]"); if (tab && tab.classList.contains("tab")) { setTab(tab.dataset.tab); return }
  const el = e.target.closest("[data-act]"); if (!el) return;
  const fn = ACTS[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e) }
});
ACTS.closeLayer = el => closeLayer(el.closest(".layer,.reels,.story,.session"));
ACTS.closeSheet = () => closeSheet();
ACTS.tab = el => { closeAllLayers(); setTab(el.dataset.to) };
function closeAllLayers() { layers.innerHTML = ""; sheets.innerHTML = "" }

// ---------- Feed ----------
function allPosts() {
  const mine = state.myPosts.filter(p => !p.private);
  return mine.concat(MOCK_POSTS).filter(p => !state.hiddenPosts.includes(p.id) && !state.blocked.includes(p.uid)).sort((a, b) => b.end - a.end);
}
function renderFeed() {
  const posts = allPosts().filter(p => state.feedTab === "friends" ? (p.uid === "me" || state.friends.includes(p.uid)) : (p.classShare && state.myClasses.includes(p.cls)));
  return `<div class="stack">
    <div class="row" style="justify-content:space-between">${logoSVG(28)}<span class="chip gray tnum">${liveFriends().length} friends locked in now</span></div>
    <div class="seg" role="tablist"><button class="${state.feedTab === "friends" ? "on" : ""}" data-act="feedTab" data-v="friends">Friends</button><button class="${state.feedTab === "classes" ? "on" : ""}" data-act="feedTab" data-v="classes">My classes</button></div>
    ${reelsCTA()}
    ${state.feedTab === "classes" ? `<div class="small muted">Posts your classmates shared to ${state.myClasses.map(esc).join(", ")}. Manage classes in your profile.</div>` : ""}
    ${posts.length ? posts.map(postHTML).join("") : `<div class="empty">No posts yet. Tap + to start your first session.</div>`}
  </div>`;
}
ACTS.feedTab = el => { state.feedTab = el.dataset.v; render() };
function liveFriends() { return ["priya", "sam", "zoe"].filter(u => state.friends.includes(u)) }
function reelsCTA() {
  const open = reelsOpen();
  return `<button class="reelcta" data-act="openReels"><span style="color:var(--coral)">${ICON.film}</span><span class="grow"><b>Break Reels</b><br><span class="small ink2">${open ? `Unlocked: ${fmtClock(state.breakUntil - Date.now())} of break left` : "Unlock on your break or after you finish a session"}</span></span><span class="chip ${open ? "mint" : "coral"}">${open ? "Open" : ICON.lock + " Locked"}</span></button>`;
}
function postHTML(p) {
  const people = [p.uid, ...(p.with || [])];
  const names = people.length > 1 ? `${esc(uname(p.uid))} <span class="muted">with</span> ${p.with.map(u => esc(uname(u).split(" ")[0])).join(", ")}` : esc(uname(p.uid));
  const keyed = state.keys[p.id], kc = (p.keys || 0) + (keyed ? 1 : 0);
  const cc = (p.comments || 0) + (state.comments[p.id]?.length || 0);
  const pl = playerHTML(p.frames ? { frames: p.frames, start: p.start, dur: p.dur, cls: p.cls, song: p.song } : { seed: p.seed, start: p.start, dur: p.dur, cls: p.cls, song: p.song, pauseAt: [.33, .71].slice(0, p.pauses), pauseMin: 4 + (p.seed % 6) });
  return `<article class="post">
    <div class="post-h"><div class="avs">${people.slice(0, 3).map(u => av(u, 36)).join("")}</div>
      <div class="grow"><div class="name">${names}</div><div class="tiny muted row" style="gap:4px">${ICON.pin}<span>${esc(spotName(p.spot))} · ${ago(p.end)}</span></div></div>
      <button class="iconbtn" data-act="postMenu" data-id="${p.id}" aria-label="Post options">${ICON.more}</button></div>
    ${pl}
    <div class="post-stats">
      <div class="stat"><div class="v">${fmtDur(p.dur)}</div><div class="k">Locked time</div></div>
      <div class="stat"><div class="v">${p.goalsDone}/${p.goalsTotal}</div><div class="k">Goals done</div></div>
      ${p.uid === "me" ? `<div class="stat"><div class="v" style="color:var(--blue)">${p.score}</div><div class="k row" style="gap:3px">${ICON.lock} Only you see this</div></div>` : `<div class="stat"><div class="v">${p.pauses}</div><div class="k">Pauses</div></div>`}
    </div>
    <div class="post-b">
      ${p.caption ? `<div>${esc(p.caption)}</div>` : ""}
      <div class="row wrap" style="gap:6px"><button class="chip" data-act="openClass" data-code="${esc(p.cls)}">${esc(p.cls)}</button>${p.classShare ? `<span class="chip gray">Shared to class</span>` : ""}${p.status === "review" ? `<span class="chip sun">In review</span>` : ""}</div>
      ${p.song ? songHTML(p.song) : ""}
    </div>
    <div class="post-a">
      <button class="${keyed ? "on" : ""}" data-act="key" data-id="${p.id}" aria-pressed="${!!keyed}">${ICON.key}<span class="tnum">${kc}</span></button>
      <button data-act="comments" data-id="${p.id}">${ICON.chat}<span class="tnum">${cc}</span></button>
      <span class="grow"></span>
      ${p.uid !== "me" ? `<button data-act="lockInvite" data-uid="${p.uid}">Lock in with ${esc(uname(p.uid).split(" ")[0])}</button>` : ""}
    </div></article>`;
}
function songHTML(s) {
  const h = [...(s.t + s.a)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return `<div class="song"><span class="art" style="background:linear-gradient(135deg,hsl(${h % 360} 85% 60%),hsl(${(h + 70) % 360} 80% 50%))"></span><span class="grow" style="min-width:0"><b>${esc(s.t)}</b><br><span class="muted">${esc(s.a)} · most locked-in song</span></span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></div>`;
}
ACTS.key = el => { const id = el.dataset.id; state.keys[id] = !state.keys[id]; save(); rerenderKeepScroll() };
ACTS.lockInvite = el => { const u = el.dataset.uid; sendDM(u, "", { lockIn: true }); toast(`Lock-in invite sent to ${uname(u).split(" ")[0]}: your timers start together when they accept`) };
ACTS.comments = el => {
  const id = el.dataset.id, p = allPosts().find(x => x.id === id) || state.myPosts.find(x => x.id === id);
  const seeded = Array.from({ length: Math.min(p?.comments || 0, 3) }, (_, i) => ({ uid: ["jordan", "ava", "leo"][i], text: ["locked in fr", "what floor were you on?", "this timelapse is insane"][i] }));
  const list = seeded.concat(state.comments[id] || []);
  const sh = openSheet(`<h3 style="font-size:19px;margin-bottom:10px">Comments</h3>
   <div class="stack" id="clist">${list.map(c => `<div class="row" style="align-items:flex-start">${av(c.uid, 30)}<div class="grow"><b class="small">${esc(uname(c.uid))}</b><div>${esc(c.text)}</div></div><button class="iconbtn" data-act="report" data-kind="comment" aria-label="Report comment">${ICON.more}</button></div>`).join("") || `<div class="muted small">No comments yet.</div>`}</div>
   <div class="hr" style="margin:14px 0"></div>
   <div id="cerr"></div>
   <div class="row"><input class="input" id="cin" placeholder="Add a comment" maxlength="300"><button class="btn sm" data-act="addComment" data-id="${id}">Post</button></div>`);
  setTimeout(() => $("#cin", sh)?.focus(), 50);
};
ACTS.addComment = el => {
  const inp = $("#cin"), text = inp.value.trim(); if (!text) return;
  const m = moderate(text); if (m.lvl === "block") { $("#cerr").innerHTML = `<div class="banner danger" style="margin-bottom:10px">${ICON.shield}<span>${esc(modMessage(m))}</span></div>`; return }
  (state.comments[el.dataset.id] ||= []).push({ uid: "me", text }); save(); closeSheet(); rerenderKeepScroll(); toast("Comment posted");
};
ACTS.postMenu = el => {
  const id = el.dataset.id, p = allPosts().find(x => x.id === id) || state.myPosts.find(x => x.id === id); if (!p) return;
  if (p.uid === "me") openSheet(`<h3 style="font-size:19px;margin-bottom:12px">Your post</h3><div class="stack"><button class="btn line block" data-act="deletePost" data-id="${id}">Delete post</button><button class="btn ghost block" data-act="closeSheet">Cancel</button></div>`);
  else openReport("post", id, p.uid);
};
ACTS.deletePost = el => { const id = el.dataset.id; state.myPosts = state.myPosts.filter(p => p.id !== id); idb.del(id); closeSheet(); render(); toast("Post deleted") };

// ---------- Reporting & blocking (every post, comment, message and Reel) ----------
const REPORT_REASONS = ["Nudity or sexual content", "Harassment or bullying", "Hate speech or symbols", "Violence, threats or self-harm", "Drugs or illegal sales", "Academic dishonesty", "Spam or fake", "Something else"];
function openReport(kind, id, uid) {
  openSheet(`<h3 style="font-size:19px">Report this ${kind}</h3><p class="small muted" style="margin:6px 0 12px">Reports are anonymous. Anything reported by 3 people is hidden right away until a reviewer checks it.</p>
  <div class="stack" style="gap:6px">${REPORT_REASONS.map(r => `<button class="listrow" style="padding:11px 8px;border:1px solid var(--line)" data-act="doReport" data-kind="${kind}" data-id="${id || ""}" data-uid="${uid || ""}">${esc(r)}</button>`).join("")}</div>
  ${uid ? `<div class="hr" style="margin:14px 0"></div><button class="btn line block" data-act="blockUser" data-uid="${uid}">Block ${esc(uname(uid))}</button>` : ""}`);
}
ACTS.report = el => openReport(el.dataset.kind || "item", el.dataset.id, el.dataset.uid);
ACTS.doReport = el => { if (el.dataset.kind === "post" && el.dataset.id) { state.hiddenPosts.push(el.dataset.id); save() } closeSheet(); rerenderKeepScroll(); toast("Thanks. It's hidden for you and sent for review.") };
ACTS.blockUser = el => { const u = el.dataset.uid; state.blocked.push(u); state.friends = state.friends.filter(f => f !== u); save(); closeSheet(); rerenderKeepScroll(); toast(`${uname(u)} is blocked. They can't see your posts or message you.`) };
