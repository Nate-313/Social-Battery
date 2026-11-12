// ---------- Chats: class group chats (one per class per term), messages, friends ----------
function renderChats() {
  const t = state.chatTab;
  const reqN = state.requests.length;
  let body = "";
  if (t === "classes") {
    const joined = state.joinedChats;
    body = `<div class="small muted">One chat per class per term, open to students who list the class. Find more classes with the search bar.</div>
    <div class="card" style="padding:4px 10px">${joined.length ? joined.map(c => { const m = (state.chats.classes[c] || []).slice(-1)[0]; return `<button class="listrow" data-act="openThread" data-kind="class" data-id="${esc(c)}"><span class="av" style="width:42px;height:42px;border-radius:12px;background:var(--blue-soft);color:var(--blue-ink);font-size:12px">${esc(c.split(" ")[0])}</span><span class="grow" style="min-width:0"><b>${esc(c)} · ${TERM}</b><br><span class="small muted" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m ? esc(uname(m.from).split(" ")[0] + ": " + (m.text || (m.poll ? "Poll" : "Lock-in invite"))) : "Say hi to your classmates"}</span></span></button>` }).join("") : `<div class="empty">No class chats yet.</div>`}</div>
    ${state.myClasses.filter(c => !joined.includes(c)).length ? `<div class="eyebrow">Your classes without a chat</div><div class="row wrap" style="gap:6px">${state.myClasses.filter(c => !joined.includes(c)).map(c => `<button class="chip" data-act="joinChat" data-code="${esc(c)}">Join ${esc(c)}</button>`).join("")}</div>` : ""}`;
  } else if (t === "messages") {
    body = `<div class="card" style="padding:4px 10px">${state.chats.dms.filter(d => !d.with.some(u => state.blocked.includes(u))).map(d => { const m = d.msgs.slice(-1)[0]; return `<button class="listrow" data-act="openThread" data-kind="dm" data-id="${d.id}"><span class="avs">${d.with.slice(0, 2).map(u => av(u, 40)).join("")}</span><span class="grow" style="min-width:0"><b>${esc(d.name || d.with.map(uname).join(", "))}</b><br><span class="small muted" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m ? esc((m.from === "me" ? "You: " : "") + (m.lockIn ? "Lock-in invite" : m.text)) : ""}</span></span><span class="tiny muted">${m ? ago(m.ts) : ""}</span></button>` }).join("")}</div>
    <button class="btn line block" data-act="newGroup">New group chat</button>`;
  } else {
    const sugg = ["ben", "isla", "marcus"].filter(u => !state.friends.includes(u) && !state.requests.includes(u) && !state.blocked.includes(u));
    body = `<button class="searchbox" data-act="friendSearch" style="background:var(--surface);border:1px solid var(--line)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>Find friends by name or @handle</button>
    <div class="row"><button class="btn sm ghost grow" data-act="inviteLink">Copy invite link</button><button class="btn sm ghost grow" data-act="myQR">My QR code</button></div>
    ${reqN ? `<div class="eyebrow">Friend requests</div><div class="card" style="padding:4px 10px">${state.requests.map(u => `<div class="listrow">${av(u, 40)}<span class="grow"><b>${esc(uname(u))}</b><br><span class="small muted">@${esc(USERS[u].handle)} · ${u === "hana" ? "3 mutual friends" : "1 mutual friend"}</span></span><button class="btn sm" data-act="acceptReq" data-uid="${u}">Accept</button><button class="btn sm ghost" data-act="declineReq" data-uid="${u}">Decline</button></div>`).join("")}</div>` : ""}
    ${sugg.length ? `<div class="eyebrow">People you may know</div><div class="card" style="padding:4px 10px">${sugg.map(u => `<div class="listrow">${av(u, 40)}<span class="grow"><b>${esc(uname(u))}</b><br><span class="small muted">In CS 161 with you · 2 mutual</span></span>${state.sent.includes(u) ? `<span class="chip gray">Requested</span>` : `<button class="btn sm ghost" data-act="addFriend" data-uid="${u}">Add</button>`}</div>`).join("")}</div>` : ""}
    <div class="eyebrow">Friends · ${state.friends.length}</div><div class="card" style="padding:4px 10px">${state.friends.map(u => `<div class="listrow">${av(u, 40)}<span class="grow"><b>${esc(uname(u))}</b><br><span class="small muted">${liveFriends().includes(u) ? `<span style="color:var(--mint);font-weight:600">● Locked in now</span>` : "@" + esc(USERS[u].handle)}</span></span><button class="btn sm ghost" data-act="dmUser" data-uid="${u}">Message</button></div>`).join("")}</div>`;
  }
  return `<div class="stack"><h2 style="font-size:22px">Chats</h2>
    <div class="seg"><button class="${t === "classes" ? "on" : ""}" data-act="chatTab" data-v="classes">Classes</button><button class="${t === "messages" ? "on" : ""}" data-act="chatTab" data-v="messages">Messages</button><button class="${t === "friends" ? "on" : ""}" data-act="chatTab" data-v="friends">Friends${reqN ? ` (${reqN})` : ""}</button></div>${body}</div>`;
}
ACTS.chatTab = el => { state.chatTab = el.dataset.v; render() };
ACTS.acceptReq = el => { const u = el.dataset.uid; state.requests = state.requests.filter(x => x !== u); state.friends.push(u); save(); render(); toast(`You and ${uname(u)} are now friends`) };
ACTS.declineReq = el => { state.requests = state.requests.filter(x => x !== el.dataset.uid); save(); render() };
ACTS.addFriend = el => { state.sent.push(el.dataset.uid); save(); rerenderKeepScroll(); toast("Request sent. You'll be friends once they accept.") };
ACTS.inviteLink = async () => { const link = "https://locked.app/add/you-7Q2K"; try { await navigator.clipboard.writeText(link); toast("Invite link copied") } catch { openSheet(`<h3 style="font-size:19px">Your invite link</h3><input class="input" style="margin-top:10px" value="${link}" readonly onclick="this.select()">`) } };
ACTS.myQR = () => {
  let svg = "";
  try { const q = qrcode(0, "M"); q.addData("https://locked.app/add/you-7Q2K"); q.make(); svg = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }) } catch { svg = `<div class="empty">QR code unavailable offline.</div>` }
  openSheet(`<div style="text-align:center"><h3 style="font-size:19px">Scan to add me</h3><div style="width:220px;margin:14px auto;padding:10px;border-radius:18px;border:1px solid var(--line)">${svg}</div><div class="small muted">@you · Friends have to accept each other</div></div>`);
};
ACTS.friendSearch = () => openSearch("people");
ACTS.joinChat = el => joinChat(el.dataset.code);
function joinChat(code) {
  if (!state.myClasses.includes(code)) {
    openSheet(`<h3 style="font-size:19px">Join the ${esc(code)} chat</h3><p class="small ink2" style="margin:8px 0 14px">Class chats are for students taking the class. Adding ${esc(code)} to your classes also puts it first when you tag sessions.</p><button class="btn block" data-act="addClassJoin" data-code="${esc(code)}">Add ${esc(code)} to my classes and join</button>`);
    return;
  }
  if (!state.joinedChats.includes(code)) state.joinedChats.push(code); state.chats.classes[code] ||= []; save(); openThread("class", code);
}
ACTS.addClassJoin = el => { const c = el.dataset.code; closeSheet(); state.myClasses.push(c); save(); joinChat(c) };
ACTS.dmUser = el => { const u = el.dataset.uid; let d = state.chats.dms.find(x => x.with.length === 1 && x.with[0] === u); if (!d) { d = { id: "dm_" + u + Date.now(), with: [u], msgs: [] }; state.chats.dms.unshift(d); save() } openThread("dm", d.id) };
ACTS.newGroup = () => {
  const pick = [];
  const sh = openSheet(`<h3 style="font-size:19px">New group chat</h3><input class="input" id="gname" style="margin:10px 0" placeholder="Group name" maxlength="40"><div class="row wrap" style="gap:6px" id="gpick">${state.friends.map(u => `<button class="chip gray" data-u="${u}">${esc(uname(u))}</button>`).join("")}</div><button class="btn block" style="margin-top:14px" id="gmake">Create</button>`);
  $("#gpick", sh).onclick = e => { const b = e.target.closest("[data-u]"); if (!b) return; const u = b.dataset.u; const i = pick.indexOf(u); i < 0 ? pick.push(u) : pick.splice(i, 1); b.className = "chip " + (pick.includes(u) ? "sel" : "gray") };
  $("#gmake", sh).onclick = () => { const n = $("#gname", sh).value.trim(); if (!pick.length) { toast("Pick at least one friend"); return } if (moderate(n).lvl === "block") { toast("Choose a different group name"); return } const d = { id: "g" + Date.now(), name: n || null, with: pick, msgs: [] }; state.chats.dms.unshift(d); save(); closeSheet(); openThread("dm", d.id) };
};
function sendDM(u, text, extra = {}) { let d = state.chats.dms.find(x => x.with.length === 1 && x.with[0] === u); if (!d) { d = { id: "dm_" + u, with: [u], msgs: [] }; state.chats.dms.unshift(d) } d.msgs.push({ from: "me", text, ts: Date.now(), ...extra }); save() }

function threadMsgs(kind, id) { return kind === "class" ? (state.chats.classes[id] ||= []) : state.chats.dms.find(d => d.id === id).msgs }
ACTS.openThread = el => openThread(el.dataset.kind, el.dataset.id);
function openThread(kind, id) {
  const d = kind === "dm" ? state.chats.dms.find(x => x.id === id) : null;
  const title = kind === "class" ? `${id} · ${TERM}` : esc(d.name || d.with.map(uname).join(", "));
  const layer = openLayer(`${layerHead(title, kind === "class" ? `<button class="btn sm ghost" data-act="openClass" data-code="${esc(id)}">Class page</button>` : "")}
   <div class="layer-b" id="thr" style="display:flex;flex-direction:column;gap:8px"></div>
   <div id="thrWarn" style="padding:0 12px"></div>
   <div class="composer"><button class="iconbtn" id="thrPlus" aria-label="More options" style="background:var(--surface-2)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button><textarea class="input" id="thrIn" rows="1" placeholder="Message" style="min-height:40px;max-height:110px;resize:none" maxlength="1000"></textarea><button class="iconbtn" id="thrSend" aria-label="Send" style="background:var(--blue);color:#fff">${ICON.send}</button></div>`);
  const draw = () => {
    const msgs = threadMsgs(kind, id).filter(m => !state.blocked.includes(m.from));
    $("#thr", layer).innerHTML = (kind === "class" ? `<div class="banner blue small" style="align-self:stretch">${ICON.shield}<span><b>Pinned:</b> Help each other learn. Don't share graded answers, exam questions or solution code. That breaks the Stanford Honor Code, and messages that look like it are flagged.</span></div>` : "") +
      msgs.map((m, i) => {
        const me = m.from === "me";
        let inner = esc(m.text);
        if (m.poll) inner = `<b>${esc(m.text)}</b>${m.poll.opts.map((o, k) => { const tot = m.poll.votes.reduce((a, b) => a + b, 0) || 1; return `<button data-vote="${i}:${k}" style="display:block;width:100%;text-align:left;margin-top:6px;padding:7px 9px;border-radius:9px;background:${me ? "rgba(255,255,255,.18)" : "var(--surface-2)"};position:relative;overflow:hidden"><span style="position:absolute;inset:0;width:${m.poll.votes[k] / tot * 100}%;background:${me ? "rgba(255,255,255,.2)" : "var(--blue-soft)"}"></span><span style="position:relative" class="small">${esc(o)} · ${m.poll.votes[k]}</span></button>` }).join("")}`;
        if (m.invite) inner = `${esc(m.text)}<div style="margin-top:8px;padding:10px;border-radius:12px;background:${me ? "rgba(255,255,255,.16)" : "var(--blue-soft)"}"><b>Lock in at ${esc(spotName(m.invite.spot))}</b><br><span class="small">${esc(m.invite.time)} · ${m.invite.going.length} going</span><br><button class="btn sm" style="margin-top:8px" data-going="${i}">${m.invite.going.includes("me") ? "You're going" : "I'm in"}</button></div>`;
        if (m.lockIn) inner = `<b>Lock in with me?</b><div class="small">Our timers start together when you accept, wherever you are.</div>`;
        if (m.photo) inner = `<img src="${m.photo}" alt="Shared photo" style="border-radius:10px;max-height:220px">`;
        return `<div style="display:flex;flex-direction:column;align-items:${me ? "flex-end" : "flex-start"};gap:2px">${!me && kind === "class" ? `<span class="msgmeta">${esc(uname(m.from))}</span>` : ""}<div class="msg ${me ? "me" : ""}" ${!me ? `data-rep="${esc(m.from)}"` : ""}>${inner}</div></div>`;
      }).join("") || `<div class="empty">No messages yet.</div>`;
    const b = $("#thr", layer); b.scrollTop = b.scrollHeight;
  };
  draw();
  $("#thr", layer).addEventListener("click", e => {
    const v = e.target.closest("[data-vote]"); if (v) { const [i, k] = v.dataset.vote.split(":").map(Number); threadMsgs(kind, id)[i].poll.votes[k]++; save(); draw(); return }
    const g = e.target.closest("[data-going]"); if (g) { const m = threadMsgs(kind, id)[+g.dataset.going]; if (!m.invite.going.includes("me")) m.invite.going.push("me"); save(); draw(); return }
    const r = e.target.closest("[data-rep]"); if (r) openReport("message", null, r.dataset.rep);
  });
  const inp = $("#thrIn", layer), warn = $("#thrWarn", layer); let pendingWarn = null;
  const send = (force) => {
    const text = inp.value.trim(); if (!text) return; const m = moderate(text);
    if (m.lvl === "block") { warn.innerHTML = `<div class="banner danger" style="margin:8px 0">${ICON.shield}<span>${esc(modMessage(m))}</span></div>`; return }
    if (m.lvl === "warn" && !force) { pendingWarn = text; warn.innerHTML = `<div class="banner sun" style="margin:8px 0;flex-wrap:wrap">${ICON.shield}<span class="grow">${esc(modMessage(m))}</span><button class="btn sm ghost" id="sendAnyway">Send anyway</button></div>`; $("#sendAnyway", warn).onclick = () => send(true); return }
    threadMsgs(kind, id).push({ from: "me", text, ts: Date.now() }); save(); inp.value = ""; warn.innerHTML = ""; draw();
  };
  inp.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } };
  $("#thrSend", layer).onclick = () => send();
  $("#thrPlus", layer).onclick = () => {
    const sh = openSheet(`<div class="stack"><button class="btn line block" id="opPoll">Poll</button><button class="btn line block" id="opInv">Lock-in session invite</button><label class="btn line block" for="opPhoto">Photo<input type="file" id="opPhoto" accept="image/*" hidden></label></div>`);
    $("#opPoll", sh).onclick = () => { closeSheet(); const sh2 = openSheet(`<h3 style="font-size:19px">New poll</h3><input class="input" id="pq" style="margin-top:10px" placeholder="Question"><input class="input" id="p1" style="margin-top:8px" placeholder="Option 1"><input class="input" id="p2" style="margin-top:8px" placeholder="Option 2"><input class="input" id="p3" style="margin-top:8px" placeholder="Option 3 (optional)"><button class="btn block" style="margin-top:12px" id="pgo">Send poll</button>`); $("#pgo", sh2).onclick = () => { const q = $("#pq", sh2).value.trim(), opts = ["#p1", "#p2", "#p3"].map(s => $(s, sh2).value.trim()).filter(Boolean); if (!q || opts.length < 2) { toast("Add a question and two options"); return } if ([q, ...opts].some(t => moderate(t).lvl === "block")) { toast("That poll can't be posted"); return } threadMsgs(kind, id).push({ from: "me", text: q, poll: { opts, votes: opts.map(() => 0) }, ts: Date.now() }); save(); closeSheet(); draw() } };
    $("#opInv", sh).onclick = () => { closeSheet(); const sh2 = openSheet(`<h3 style="font-size:19px">Lock-in session</h3><select class="input" id="is" style="margin-top:10px">${SPOTS.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select><input class="input" id="it" type="time" value="19:00" style="margin-top:8px"><button class="btn block" style="margin-top:12px" id="igo">Send invite</button>`); $("#igo", sh2).onclick = () => { const [hh, mm] = $("#it", sh2).value.split(":").map(Number); const t = new Date(); t.setHours(hh, mm); threadMsgs(kind, id).push({ from: "me", text: "Who's locking in?", invite: { spot: $("#is", sh2).value, time: fmtTime(+t), going: ["me"] }, ts: Date.now() }); save(); closeSheet(); draw() } };
    $("#opPhoto", sh).onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const sc = scanFrames([{ img: im }]); closeSheet(); if (sc.flagged) { toast("This photo may be inappropriate, so it wasn't sent"); return } threadMsgs(kind, id).push({ from: "me", photo: rd.result, ts: Date.now() }); try { save() } catch { } draw() }; im.src = rd.result }; rd.readAsDataURL(f) };
  };
}
