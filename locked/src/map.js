// ---------- Map: 24-hour heat map + live layer ----------
const MIN_POSTS_SHOWN = 3; // spots with fewer posts stay hidden so nobody can be pinpointed
function spotCounts() {
  const c = {}; for (const s of SPOTS) c[s.id] = [...(SPOT_ACTIVITY[s.id] || [0, 0])];
  for (const p of state.myPosts) if (!p.private && p.spot !== "home" && Date.now() - p.end < DAY && c[p.spot]) c[p.spot][0]++;
  if (S && S.spot !== "home" && c[S.spot]) c[S.spot][1]++;
  return c;
}
function campusSVG() {
  return `<svg viewBox="0 0 1000 1080" aria-hidden="true">
  <rect width="1000" height="1080" fill="#EEF2EA"/>
  <path d="M0 0H1000V150C820 130 700 170 560 120 420 70 240 140 0 110Z" fill="#D9EBCF"/>
  <path d="M60 270c40-60 170-70 210-10s10 150-70 160S20 330 60 270Z" fill="#CFE2F6"/><text x="150" y="335" font-size="22" fill="#6C88A8" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600">Lake Lag</text>
  <path d="M40 880C200 800 360 980 560 900S900 980 1000 900V1080H0Z" fill="#E3EEDC"/>
  <path d="M590 0 L515 270" stroke="#fff" stroke-width="20" stroke-linecap="round"/><path d="M590 0 L515 270" stroke="#E2DCCB" stroke-width="4" stroke-dasharray="2 22" stroke-linecap="round"/>
  <text x="575" y="80" font-size="16" fill="#8F94A8" font-family="Inter,sans-serif" font-weight="600" transform="rotate(-74 575 80)">Palm Drive</text>
  <path d="M120 230 C 300 120 760 120 940 300 C 1010 520 960 800 760 900 C 540 990 260 960 130 800 C 40 640 40 380 120 230Z" fill="none" stroke="#fff" stroke-width="18"/>
  <path d="M150 560H900" stroke="#fff" stroke-width="12"/><text x="200" y="550" font-size="15" fill="#8F94A8" font-family="Inter,sans-serif" font-weight="600">Jane Stanford Way</text>
  <ellipse cx="515" cy="320" rx="70" ry="48" fill="#CFE6C4"/><text x="515" y="326" font-size="15" fill="#5E8A55" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600">The Oval</text>
  <rect x="425" y="395" width="180" height="140" rx="6" fill="#F1E3C8" stroke="#E2CFA8" stroke-width="3"/><rect x="465" y="430" width="100" height="70" fill="#EEF2EA"/><text x="515" y="472" font-size="14" fill="#9C7F4F" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700">Main Quad</text>
  <circle cx="712" cy="525" r="14" fill="#F1E3C8" stroke="#E2CFA8" stroke-width="3"/><text x="712" y="560" font-size="13" fill="#9C7F4F" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600">Hoover Tower</text>
  <rect x="290" y="370" width="130" height="90" rx="6" fill="#E6E9F3"/><text x="355" y="485" font-size="12" fill="#8F94A8" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600">Science &amp; Engineering Quad</text>
  <rect x="250" y="120" width="170" height="90" rx="8" fill="#E6E9F3"/><text x="335" y="232" font-size="12" fill="#8F94A8" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600">Medical Center</text>
  <rect x="470" y="600" width="140" height="80" rx="8" fill="#E6E9F3"/><text x="540" y="700" font-size="12" fill="#8F94A8" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600">White Plaza</text>
  </svg>`;
}
function renderMap() {
  const counts = spotCounts();
  const shown = SPOTS.filter(s => counts[s.id][0] >= MIN_POSTS_SHOWN);
  const live = state.mapMode === "live";
  return `<div class="stack">
   <div class="row" style="justify-content:space-between"><h2 style="font-size:22px">Where Stanford is locked in</h2></div>
   <div class="seg"><button class="${!live ? "on" : ""}" data-act="mapMode" data-v="heat">Last 24 hours</button><button class="${live ? "on" : ""}" data-act="mapMode" data-v="live">Live now</button></div>
   <div class="mapwrap" id="mapwrap">${campusSVG()}<canvas id="heat" width="500" height="540"></canvas>
     <svg viewBox="0 0 1000 1080" style="z-index:2">${shown.map(s => {
    const [n, l] = counts[s.id]; const r = live ? 9 + Math.sqrt(l) * 4 : 8;
    return `<g data-act="spot" data-id="${s.id}" style="cursor:pointer">${live && l ? `<circle cx="${s.x}" cy="${s.y}" r="8" fill="var(--blue)" class="pulse"/>` : ""}
       <circle cx="${s.x}" cy="${s.y}" r="${r + 18}" fill="transparent"/>
       <circle cx="${s.x}" cy="${s.y}" r="${r}" fill="${live ? "var(--blue)" : "#fff"}" stroke="${live ? "#fff" : "var(--ink)"}" stroke-width="3"/>
       ${live ? `<text x="${s.x}" y="${s.y + 5}" font-size="14" font-weight="800" fill="#fff" text-anchor="middle" font-family="Inter,sans-serif">${l}</text>` : ""}
       <text x="${s.x}" y="${s.y - r - 9}" font-size="17" font-weight="700" fill="var(--ink)" text-anchor="middle" font-family="Inter,sans-serif" paint-order="stroke" stroke="#fff" stroke-width="5">${esc(s.name.replace(/ \(.*\)/, "").replace("Engineering Center", "").replace("Computer Science", "").replace("Knight Management Center", "GSB").trim())}</text></g>`
  }).join("")}</svg></div>
   ${!live ? `<div class="row small"><span class="muted">Fewer posts</span><span class="legend-ramp grow"></span><span class="muted">More posts</span></div>` : `<div class="small ink2">${Object.values(counts).reduce((a, b) => a + b[1], 0)} people are in a session right now. Tap a spot to see who's there.</div>`}
   <div class="tiny muted">Spots with fewer than ${MIN_POSTS_SHOWN} posts stay hidden, and home or dorm sessions never appear, so nobody can be pinpointed.</div>
   <div class="eyebrow" style="margin-top:6px">Hottest spots, last 24 hours</div>
   <div class="card bars">${shown.sort((a, b) => counts[b.id][0] - counts[a.id][0]).slice(0, 6).map(s => { const n = counts[s.id][0], max = Math.max(...Object.values(counts).map(c => c[0])); return `<button class="barrow" style="text-align:left" data-act="spot" data-id="${s.id}"><span class="lbl">${esc(s.name)}</span><span class="bartrack"><span class="barfill" style="display:block;width:${n / max * 100}%;background:var(--coral)"></span></span><span class="val">${n}</span></button>` }).join("")}</div>
  </div>`;
}
afterRender.map = () => {
  if (state.mapMode !== "heat") { $("#heat").hidden = true; return }
  const cv = $("#heat"), x = cv.getContext("2d"), counts = spotCounts(), max = Math.max(...Object.values(counts).map(c => c[0]));
  const w = cv.width, h = cv.height; x.clearRect(0, 0, w, h);
  for (const s of SPOTS) { const n = counts[s.id][0]; if (n < MIN_POSTS_SHOWN) continue; const px = s.x / 2, py = s.y / 2, rad = 30 + 45 * (n / max); const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, `rgba(0,0,0,${.25 + .75 * n / max})`); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2) }
  const img = x.getImageData(0, 0, w, h), d = img.data;
  const ramp = [[191, 211, 255], [110, 139, 255], [255, 184, 31], [255, 91, 58], [211, 20, 58]];
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; if (!a) continue; const p = Math.min(.999, a) * (ramp.length - 1), k = Math.floor(p), f = p - k, c0 = ramp[k], c1 = ramp[k + 1]; d[i] = c0[0] + (c1[0] - c0[0]) * f; d[i + 1] = c0[1] + (c1[1] - c0[1]) * f; d[i + 2] = c0[2] + (c1[2] - c0[2]) * f; d[i + 3] = Math.min(235, a * 330) }
  x.putImageData(img, 0, 0); cv.style.mixBlendMode = "normal"; cv.style.opacity = ".78";
};
ACTS.mapMode = el => { state.mapMode = el.dataset.v; render() };
ACTS.spot = el => {
  const s = SPOTS.find(x => x.id === el.dataset.id), [n, l] = spotCounts()[s.id];
  const posts = allPosts().filter(p => p.spot === s.id).slice(0, 3);
  const classes = {}; allPosts().filter(p => p.spot === s.id).forEach(p => classes[p.cls] = (classes[p.cls] || 0) + 1);
  const top = Object.entries(classes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]).concat(["CS 106B", "MATH 51", "CHEM 33"]).slice(0, 3);
  openSheet(`<h3 style="font-size:21px">${esc(s.name)}</h3>
  <div class="kpis" style="margin:12px 0"><div class="kpi"><div class="v">${n}</div><div class="k">Posts, 24h</div></div><div class="kpi"><div class="v">${l}</div><div class="k">Here now</div></div><div class="kpi"><div class="v" style="color:var(--blue)">${SPOT_SCORE[s.id]}</div><div class="k">Avg Lock Score</div></div></div>
  <div class="eyebrow">Top classes here</div><div class="row wrap" style="margin:6px 0 12px;gap:6px">${top.map(c => `<button class="chip" data-act="openClass" data-code="${esc(c)}">${esc(c)}</button>`).join("")}</div>
  ${posts.length ? `<div class="eyebrow">Friends' recent posts here</div><div class="stack" style="margin-top:6px">${posts.map(p => `<div class="row">${av(p.uid, 30)}<span class="grow small"><b>${esc(uname(p.uid))}</b> · ${esc(p.cls)} · ${fmtDur(p.dur)}</span><span class="tiny muted">${ago(p.end)}</span></div>`).join("")}</div>` : ""}
  <button class="btn block" style="margin-top:16px" data-act="studyHere" data-id="${s.id}">Lock in here</button>`);
};
ACTS.studyHere = el => { closeSheet(); ACTS.newSession(); if (draft) { draft.spot = el.dataset.id; renderSetup() } };
