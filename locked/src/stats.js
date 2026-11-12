// ---------- Stats, Flow State streak, analytics ----------
function mySessions() {
  const mine = state.myPosts.map(p => ({ start: p.start, end: p.end, dur: p.dur, spot: p.spot, cls: p.cls, score: p.score, music: p.music, group: p.group, intensity: p.intensity }));
  return HISTORY.concat(mine).sort((a, b) => a.start - b.start);
}
function dayKeyOffset(off) { return studyDay(Date.now() - off * DAY) }
// Flow State: consecutive study days with at least 30 Locked minutes. Days run 4 AM–4 AM.
// One streak freeze per week covers a missed day automatically.
function flowState() {
  const mins = {}; for (const s of mySessions()) { const k = studyDay(s.start); mins[k] = (mins[k] || 0) + s.dur / MIN }
  const qualifies = off => (mins[dayKeyOffset(off)] || 0) >= 30;
  const todayDone = qualifies(0); let off = todayDone ? 0 : 1, streak = 0; const freezes = new Set(), used = [];
  while (off < 400) {
    if (qualifies(off)) { streak++; off++; continue }
    const wk = Math.floor(off / 7); if (!freezes.has(wk) && qualifies(off + 1)) { freezes.add(wk); used.push(off); off++; continue }
    break;
  }
  const freezeThisWeek = !freezes.has(0);
  return { streak, todayDone, todayMin: Math.round(mins[dayKeyOffset(0)] || 0), freezesUsed: used.length, freezeAvailable: freezeThisWeek };
}
const TIERS = [
  { at: 0, name: "Iron", a: "#A4ABBF", b: "#5B6275" }, { at: 3, name: "Bronze", a: "#F0B07A", b: "#9C5B2E" }, { at: 7, name: "Silver", a: "#F4F6FB", b: "#98A2B8" },
  { at: 14, name: "Gold", a: "#FFE58A", b: "#D99A00" }, { at: 30, name: "Engraved Gold", a: "#FFE58A", b: "#C78300" }, { at: 50, name: "Ruby", a: "#FF8FA6", b: "#B5123A" },
  { at: 100, name: "Diamond", a: "#D6F7FF", b: "#3D9BFF" }, { at: 365, name: "Legend", a: "#FFD1F0", b: "#6B5BFF" }
];
function tierFor(n) { let t = TIERS[0], i = 0; TIERS.forEach((x, k) => { if (n >= x.at) { t = x; i = k } }); return { ...t, i, next: TIERS[i + 1] } }
// The Flow State lock gets bigger and more detailed as the streak grows.
function lockSVG(n, size = 170) {
  const t = tierFor(n), i = t.i, id = "lk" + Math.random().toString(36).slice(2, 7);
  const prism = i >= 7 ? `<linearGradient id="${id}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8FD8"/><stop offset=".35" stop-color="#FFD36B"/><stop offset=".65" stop-color="#6BE5FF"/><stop offset="1" stop-color="#8B7BFF"/></linearGradient>` : "";
  const bodyFill = i >= 7 ? `url(#${id}p)` : `url(#${id}g)`;
  const scale = .78 + Math.min(i, 7) * .032;
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="${t.name} lock, ${n} day streak"><defs>
   <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient>${prism}
   <radialGradient id="${id}f" cx=".5" cy=".8" r=".7"><stop offset="0" stop-color="#FFF4B0"/><stop offset=".45" stop-color="#FFB81F"/><stop offset="1" stop-color="#FF5B3A"/></radialGradient>
   <radialGradient id="${id}glow"><stop offset="0" stop-color="${t.a}" stop-opacity=".9"/><stop offset="1" stop-color="${t.a}" stop-opacity="0"/></radialGradient></defs>
   ${i >= 6 ? `<g class="spin">${Array.from({ length: 12 }, (_, k) => `<path d="M100 100 L${100 + 98 * Math.cos(k * Math.PI / 6 - .07)} ${100 + 98 * Math.sin(k * Math.PI / 6 - .07)} L${100 + 98 * Math.cos(k * Math.PI / 6 + .07)} ${100 + 98 * Math.sin(k * Math.PI / 6 + .07)}Z" fill="${t.a}" opacity=".35"/>`).join("")}</g>` : ""}
   ${i >= 3 ? `<circle cx="100" cy="112" r="${60 + i * 5}" fill="url(#${id}glow)"/>` : ""}
   <g transform="translate(100 108) scale(${scale}) translate(-100 -108)">
   ${i >= 5 ? `<g stroke="${t.b}" stroke-width="5" fill="none" opacity=".85">${[0, 1, 2].map(k => `<ellipse cx="${30 - k * 14}" cy="${120 + k * 9}" rx="9" ry="6"/><ellipse cx="${170 + k * 14}" cy="${120 + k * 9}" rx="9" ry="6"/>`).join("")}</g>` : ""}
   <path d="M64 92 V66 a36 36 0 0 1 72 0 V92" fill="none" stroke="${i >= 7 ? "#B9B3FF" : t.b}" stroke-width="17" stroke-linecap="round"/>
   <path d="M64 92 V66 a36 36 0 0 1 72 0 V92" fill="none" stroke="${t.a}" stroke-width="7" stroke-linecap="round" opacity=".7"/>
   <rect x="38" y="86" width="124" height="98" rx="22" fill="${bodyFill}" stroke="${t.b}" stroke-width="4"/>
   <rect x="48" y="94" width="104" height="10" rx="5" fill="#fff" opacity=".35"/>
   ${i >= 4 ? `<g stroke="${t.b}" stroke-width="2" fill="none" opacity=".55"><path d="M52 170 q12 -14 24 0 t24 0 t24 0 t24 0"/><path d="M52 116 q12 10 24 0 t24 0 t24 0 t24 0"/><circle cx="58" cy="143" r="5"/><circle cx="142" cy="143" r="5"/></g>` : ""}
   ${i >= 3 ? `<path class="flame" d="M100 116 c-16 18 -14 30 -8 38 c2 3 1 -8 8 -12 c7 4 6 15 8 12 c6 -8 8 -20 -8 -38z" fill="url(#${id}f)"/><rect x="94" y="150" width="12" height="18" rx="4" fill="${t.b}"/>`
      : `<circle cx="100" cy="128" r="11" fill="${t.b}"/><rect x="94" y="132" width="12" height="26" rx="5" fill="${t.b}"/>`}
   </g>
   ${i >= 5 ? Array.from({ length: 6 }, (_, k) => `<circle class="twinkle" style="animation-delay:${k * .3}s" cx="${[40, 165, 30, 172, 70, 135][k]}" cy="${[50, 60, 150, 150, 30, 28][k]}" r="${[3, 4, 2.5, 3, 2, 3][k]}" fill="${i >= 7 ? "#FF8FD8" : "#FFB81F"}"/>`).join("") : ""}
  </svg>`;
}
function avg(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0 }
function groupScore(list, keyFn) { const g = {}; for (const s of list) { const k = keyFn(s); if (k == null) continue; (g[k] ||= []).push(s.score) } return Object.entries(g).map(([k, v]) => ({ k, v: Math.round(avg(v)), n: v.length })) }
function barsHTML(rows, color = "var(--blue)", fmt = v => v, maxV = 100) {
  return `<div class="bars">${rows.map(r => `<div class="barrow" data-tip="${esc(r.k)}: ${fmt(r.v)}${r.n ? ` · ${r.n} sessions` : ""}"><span class="lbl">${esc(r.k)}</span><span class="bartrack"><span class="barfill" style="display:block;width:${clamp(r.v / maxV * 100, 1, 100)}%;background:${color}"></span></span><span class="val">${fmt(r.v)}</span></div>`).join("")}</div>`;
}
function renderStats() {
  const f = flowState(), t = tierFor(f.streak), all = mySessions(), week = all.filter(s => Date.now() - s.start < 7 * DAY);
  const weekMin = week.reduce((a, s) => a + s.dur / MIN, 0), load = Math.round(week.reduce((a, s) => a + s.dur / MIN * s.score / 100, 0)), wAvg = Math.round(avg(week.map(s => s.score)));
  const tod = h => h >= 4 && h < 12 ? "Morning" : h < 17 ? "Afternoon" : h < 22 ? "Evening" : "Late night";
  const byTime = ["Morning", "Afternoon", "Evening", "Late night"].map(k => groupScore(all, s => tod(new Date(s.start).getHours())).find(r => r.k === k) || { k, v: 0, n: 0 });
  const bySpot = groupScore(all, s => spotName(s.spot).replace(" (private)", "")).sort((a, b) => b.v - a.v).slice(0, 6);
  const byLen = ["Under 1 h", "1–2 h", "2–3 h", "3 h +"].map(k => groupScore(all, s => s.dur < HOUR ? "Under 1 h" : s.dur < 2 * HOUR ? "1–2 h" : s.dur < 3 * HOUR ? "2–3 h" : "3 h +").find(r => r.k === k) || { k, v: 0, n: 0 });
  const byCls = groupScore(all, s => s.cls).sort((a, b) => b.v - a.v);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], byDay = days.map((k, i) => groupScore(all.filter(s => new Date(s.start).getDay() === i), () => k)[0] || { k, v: 0, n: 0 });
  const music = groupScore(all, s => s.music ? "With music" : "No music"), group = groupScore(all, s => s.group ? "With friends" : "Solo"), inten = groupScore(all, s => s.intensity);
  const last14 = Array.from({ length: 14 }, (_, i) => { const off = 13 - i, k = dayKeyOffset(off); return { off, k, m: Math.round(all.filter(s => studyDay(s.start) === k).reduce((a, s) => a + s.dur / MIN, 0)) } });
  const maxM = Math.max(60, ...last14.map(d => d.m));
  const bestT = [...byTime].sort((a, b) => b.v - a.v)[0], best = bySpot[0], worst = bySpot[bySpot.length - 1];
  const upcoming = state.exams.filter(e => e.ts > Date.now()).sort((a, b) => a.ts - b.ts);
  return `<div class="stack" style="gap:14px">
   <div class="row" style="justify-content:space-between"><h2 style="font-size:22px">Your stats</h2>${all.some(s => s.sample) ? `<span class="chip sun">Includes sample data</span>` : ""}</div>
   <div class="flowhero"><div class="eyebrow">Flow State</div>
     <div style="display:grid;place-items:center;margin:4px 0">${lockSVG(f.streak, 150 + Math.min(t.i, 7) * 8)}</div>
     <div style="font-family:var(--f-display);font-weight:800;font-size:46px;line-height:1" class="tnum">${f.streak}</div>
     <div class="small ink2"><b>day streak · ${t.name} lock</b></div>
     <div class="small muted" style="margin-top:6px">${f.todayDone ? "Today counts. Nice." : `Study ${Math.max(0, 30 - f.todayMin)} more minutes before 4 AM to keep it going.`}</div>
     <div class="row" style="justify-content:center;gap:6px;margin-top:10px;flex-wrap:wrap"><span class="chip ${f.freezeAvailable ? "mint" : "gray"}">${f.freezeAvailable ? "1 streak freeze ready this week" : "This week's freeze is used"}</span>${t.next ? `<span class="chip gray">${t.next.at - f.streak} days to ${t.next.name}</span>` : ""}</div>
     <button class="btn sm ghost" style="margin-top:12px" data-act="tierPreview">See every lock tier</button></div>
   <div class="kpis"><div class="kpi"><div class="v">${fmtDur(weekMin * MIN)}</div><div class="k">Locked this week</div></div><div class="kpi"><div class="v" style="color:var(--blue)">${wAvg || "–"}</div><div class="k">Avg Lock Score</div></div><div class="kpi" data-tip="Locked Load = minutes × Lock Score ÷ 100, summed over the week"><div class="v">${load}</div><div class="k">Locked Load</div></div></div>
   ${best && worst && best.k !== worst.k ? `<div class="banner blue"><span>You score <b>${best.v - worst.v} points higher</b> at ${esc(best.k)} than at ${esc(worst.k)}, and your best time of day is <b>${bestT.k.toLowerCase()}</b> (avg ${bestT.v}).</span></div>` : ""}
   <div class="card"><div class="row" style="justify-content:space-between"><b>Locked minutes, last 14 days</b><span class="tiny muted">Goal line: 30 min</span></div>
     <div class="vbars" style="margin-top:10px;position:relative">${last14.map(d => `<div class="vb ${d.m < 30 ? "dim" : ""}" style="height:${d.m / maxM * 100}%" data-tip="${d.off === 0 ? "Today" : d.off === 1 ? "Yesterday" : d.off + " days ago"}: ${d.m} min"></div>`).join("")}<div style="position:absolute;left:0;right:0;bottom:${30 / maxM * 100}%;border-top:1.5px dashed var(--coral)"></div></div>
     <div class="row tiny muted" style="justify-content:space-between;margin-top:4px"><span>2 weeks ago</span><span>Today</span></div></div>
   <div class="card"><b>When you study best</b><div class="tiny muted" style="margin-bottom:10px">Average Lock Score by time of day</div>${barsHTML(byTime)}</div>
   <div class="card"><b>Where you study best</b><div class="tiny muted" style="margin-bottom:10px">Average Lock Score by spot</div>${barsHTML(bySpot)}</div>
   <div class="card"><b>Best day of the week</b><div class="tiny muted" style="margin-bottom:10px">Average Lock Score</div>${barsHTML(byDay)}</div>
   <div class="card"><b>Ideal session length</b><div class="tiny muted" style="margin-bottom:10px">Average Lock Score by length</div>${barsHTML(byLen)}</div>
   <div class="card"><b>By class</b><div class="tiny muted" style="margin-bottom:10px">Average Lock Score</div>${barsHTML(byCls)}</div>
   <div class="card"><b>What helps you focus</b><div class="tiny muted" style="margin-bottom:10px">Average Lock Score</div>${barsHTML(music.concat(group).concat(inten.map(r => ({ ...r, k: r.k + " work" }))))}</div>
   <div class="card"><div class="row" style="justify-content:space-between"><b>Exam countdown</b><button class="btn sm ghost" data-act="addExam">Add exam</button></div>
     <div class="stack" style="margin-top:10px">${upcoming.length ? upcoming.map(e => { const hrs = all.filter(s => s.cls === e.cls && s.start > Date.now() - 14 * DAY).reduce((a, s) => a + s.dur, 0); return `<div class="row"><span class="chip coral">${Math.ceil((e.ts - Date.now()) / DAY)} days</span><span class="grow"><b>${esc(e.cls)} ${esc(e.label)}</b><br><span class="small muted">${fmtDur(hrs)} locked for ${esc(e.cls)} in the last 2 weeks</span></span></div>` }).join("") : `<div class="small muted">Add your exams to see how much you've studied for each.</div>`}</div></div>
   <button class="card" style="text-align:left;background:linear-gradient(135deg,#2D5BFF,#6B3CFF);color:#fff;border:0" data-act="wrapped"><div class="eyebrow" style="color:rgba(255,255,255,.75)">End of ${TERM}</div><div style="font-family:var(--f-display);font-weight:800;font-size:24px">Your Locked Wrapped</div><div class="small" style="opacity:.85">Your term in study: hours, spots, songs, streaks. Tap to preview.</div></button>
   <div class="card row" style="align-items:flex-start"><span style="color:var(--blue)"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/></svg></span><div class="grow"><b>Locked for your laptop</b><div class="small muted">A Mac and Windows companion that pairs with your phone session and tracks which apps and sites are in front, so focus time counts toward a more objective score.</div><button class="btn sm ghost" style="margin-top:8px" data-act="laptop">Join the beta list</button></div></div>
   <div class="tiny muted">How your Lock Score works: Presence 45% (at your desk in each camera check), Continuity 30% (pauses, exits, emergency unlocks), Goals 25% (goals you set before starting). Length isn't in the score; it's shown as Locked time.</div>
  </div>`;
}
ACTS.tierPreview = () => openSheet(`<h3 style="font-size:19px;margin-bottom:10px">Flow State locks</h3><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">${TIERS.map(t => `<div class="card" style="text-align:center;padding:10px">${lockSVG(Math.max(t.at, 0), 110)}<div><b>${t.name}</b></div><div class="tiny muted">${t.at ? t.at + "+ days" : "Start"}</div></div>`).join("")}</div>`);
ACTS.laptop = () => toast("You're on the list. We'll email your Stanford address when the beta opens.");
ACTS.addExam = () => {
  const sh = openSheet(`<h3 style="font-size:19px">Add an exam</h3><select class="input" id="ec" style="margin-top:10px">${state.myClasses.map(c => `<option>${esc(c)}</option>`).join("")}</select><input class="input" id="el" style="margin-top:8px" value="Midterm" maxlength="30"><input class="input" id="ed" type="date" style="margin-top:8px"><button class="btn block" style="margin-top:12px" id="ego">Add</button>`);
  $("#ego", sh).onclick = () => { const d = $("#ed", sh).value; if (!d) { toast("Pick a date"); return } state.exams.push({ cls: $("#ec", sh).value, label: $("#el", sh).value || "Exam", ts: +new Date(d + "T09:00") }); save(); closeSheet(); rerenderKeepScroll() };
};
ACTS.wrapped = () => {
  const all = mySessions(), hrs = Math.round(all.reduce((a, s) => a + s.dur, 0) / HOUR);
  const spot = groupScore(all, s => spotName(s.spot)).sort((a, b) => b.n - a.n)[0];
  const cls = groupScore(all, s => s.cls).sort((a, b) => b.n - a.n)[0];
  const best = [...all].sort((a, b) => b.score - a.score)[0];
  const slides = [
    ["#2D5BFF", "This term you locked in for", `${hrs} hours`, `across ${all.length} sessions`],
    ["#FF5B3A", "Your home base", esc(spot?.k || "Green Library"), `${spot?.n || 0} sessions there`],
    ["#10B27F", "The class that got the most of you", esc(cls?.k || "CS 161"), `${cls?.n || 0} sessions`],
    ["#6B3CFF", "Your best session scored", `${best?.score || 90}`, `on ${new Date(best?.start || Date.now()).toLocaleDateString([], { month: "short", day: "numeric" })}`],
    ["#121430", "Your top locked-in song", "Experience", "Ludovico Einaudi · played in 9 sessions"],
  ];
  let i = 0; const el = openLayer("", "story");
  const draw = () => { const [bg, a, b, c] = slides[i]; el.style.background = bg; el.innerHTML = `<div class="bars2">${slides.map((_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div><div class="row" style="justify-content:space-between;margin-top:12px">${logoSVG(22, "#fff", "rgba(255,255,255,.25)")}<button class="iconbtn" data-act="closeLayer" aria-label="Close" style="color:#fff">${ICON.close}</button></div><div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px"><div style="font-size:18px;opacity:.85">${a}</div><div class="big">${b}</div><div style="font-size:16px;opacity:.85">${c}</div></div><div class="tiny" style="opacity:.7;text-align:center">Tap to continue</div>` };
  el.addEventListener("click", e => { if (e.target.closest("[data-act]")) return; i++; if (i >= slides.length) el.remove(); else draw() }); draw();
};
// Hover / tap tooltips for chart marks
(() => {
  let tip = null;
  const show = (el, x, y) => { if (!tip) { tip = document.createElement("div"); tip.className = "tip"; document.body.appendChild(tip) } tip.textContent = el.dataset.tip; tip.hidden = false; const w = tip.offsetWidth; tip.style.left = clamp(x - w / 2, 8, innerWidth - w - 8) + "px"; tip.style.top = (y - 40) + "px" };
  document.addEventListener("pointermove", e => { const el = e.target.closest("[data-tip]"); if (el) show(el, e.clientX, e.clientY); else if (tip) tip.hidden = true });
  document.addEventListener("pointerdown", e => { const el = e.target.closest("[data-tip]"); if (el) show(el, e.clientX, e.clientY) });
})();
