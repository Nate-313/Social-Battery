// ---------- Map: 24-hour heat map + live layer ----------
// Real street map (OpenStreetMap data, CARTO light tiles, drawn with Leaflet) when tiles can load.
// Otherwise a simplified campus drawing projected from the same coordinates, so positions stay true.
const MIN_POSTS_SHOWN = 3; // spots with fewer posts stay hidden so nobody can be pinpointed
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
// Simplified drawing bounds (south, west, north, east)
const BOUNDS = { s: 37.4205, w: -122.1820, n: 37.4350, e: -122.1595 };
const KX = 88.4, KY = 111.0; // km per degree of longitude / latitude at Stanford
const VW = 1000, VH = Math.round(VW * ((BOUNDS.n - BOUNDS.s) * KY) / ((BOUNDS.e - BOUNDS.w) * KX));
function proj([lat, lng]) { return [(lng - BOUNDS.w) / (BOUNDS.e - BOUNDS.w) * VW, (BOUNDS.n - lat) / (BOUNDS.n - BOUNDS.s) * VH] }

function spotCounts() {
  const c = {}; for (const s of SPOTS) c[s.id] = [...(SPOT_ACTIVITY[s.id] || [0, 0])];
  for (const p of state.myPosts) if (!p.private && p.spot !== "home" && Date.now() - p.end < DAY && c[p.spot]) c[p.spot][0]++;
  if (S && S.spot !== "home" && c[S.spot]) c[S.spot][1]++;
  return c;
}
function smoothPath(pts) {
  if (pts.length < 3) return "M" + pts.map(p => p.join(" ")).join(" L");
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2; d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}` }
  return d;
}
function campusSVG() {
  const roads = Object.entries(STREETS).map(([name, pts]) => { const pp = pts.map(proj).map(p => p.map(v => +v.toFixed(1))); return `<path d="${smoothPath(pp)}" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>` }).join("");
  const lm = LANDMARKS.map(l => {
    const [x, y] = proj(l.ll); let g = "";
    if (l.box) { const [a, b] = [proj(l.box[0]), proj(l.box[1])]; g += `<rect x="${Math.min(a[0], b[0])}" y="${Math.min(a[1], b[1])}" width="${Math.abs(b[0] - a[0])}" height="${Math.abs(b[1] - a[1])}" rx="8" fill="#ECE6FA" stroke="#DCD3F5" stroke-width="3"/>` }
    if (l.name === "The Oval") g += `<ellipse cx="${x}" cy="${y}" rx="34" ry="22" fill="#D4F2E6"/>`;
    if (l.dot) g += `<circle cx="${x}" cy="${y}" r="7" fill="#DCD3F5"/>`;
    return g + `<text x="${x}" y="${y + (l.dot ? 24 : 5)}" font-size="15" fill="#9A93BE" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-weight="700">${l.name}</text>`;
  }).join("");
  const labels = Object.keys(STREETS).filter(n => !n.startsWith("Campus Drive E")).map(n => { const pts = STREETS[n].map(proj), m = pts[n === "Jane Stanford Way" ? pts.length - 4 : Math.floor(pts.length / 2)]; return `<text x="${m[0]}" y="${m[1] - 12}" font-size="13" fill="#A9A3C8" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-weight="600">${n}</text>` }).join("");
  return `<svg viewBox="0 0 ${VW} ${VH}" aria-hidden="true"><rect width="${VW}" height="${VH}" fill="#F3F0FB"/>${roads}${lm}${labels}</svg>`;
}
const shortName = s => s.short || s.name;
function markersSVG(shown, counts, live) {
  return `<svg viewBox="0 0 ${VW} ${VH}" style="z-index:2">${shown.map(s => {
    const [x, y] = proj(s.ll), l = counts[s.id][1], r = live ? 10 + Math.sqrt(l) * 4 : 8;
    return `<g data-act="spot" data-id="${s.id}" style="cursor:pointer">${live && l ? `<circle cx="${x}" cy="${y}" r="8" fill="var(--blue)" class="pulse"/>` : ""}
     <circle cx="${x}" cy="${y}" r="${r + 18}" fill="transparent"/>
     <circle cx="${x}" cy="${y}" r="${r}" fill="${live ? "var(--blue)" : "#fff"}" stroke="${live ? "#fff" : "var(--ink)"}" stroke-width="3"/>
     ${live ? `<text x="${x}" y="${y + 5}" font-size="14" font-weight="800" fill="#fff" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif">${l}</text>` : ""}
     <text x="${x}" y="${s.below ? y + r + 20 : y - r - 9}" font-size="16" font-weight="700" fill="var(--ink)" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" paint-order="stroke" stroke="#fff" stroke-width="5">${esc(shortName(s))}</text></g>`;
  }).join("")}</svg>`;
}
function renderMap() {
  const counts = spotCounts(), live = state.mapMode === "live";
  const shown = SPOTS.filter(s => counts[s.id][0] >= MIN_POSTS_SHOWN);
  const max = Math.max(...Object.values(counts).map(c => c[0]));
  return `<div class="stack">
   <h2 style="font-size:22px">Where Stanford is locked in</h2>
   <div class="seg"><button class="${!live ? "on" : ""}" data-act="mapMode" data-v="heat">Last 24 hours</button><button class="${live ? "on" : ""}" data-act="mapMode" data-v="live">Live now</button></div>
   <div class="mapwrap" id="mapwrap" style="aspect-ratio:${VW}/${VH}">
     <div id="schem">${campusSVG()}<canvas id="heat" width="${VW / 2}" height="${Math.round(VH / 2)}"></canvas>${markersSVG(shown, counts, live)}</div>
     <div id="leaf" style="position:absolute;inset:0;z-index:3;visibility:hidden;background:transparent"></div>
     <canvas id="lheat" style="position:absolute;inset:0;z-index:4;pointer-events:none;width:100%;height:100%" hidden></canvas>
   </div>
   <div class="tiny muted" id="mapNote"></div>
   ${!live ? `<div class="row small"><span class="muted">Fewer posts</span><span class="legend-ramp grow"></span><span class="muted">More posts</span></div>` : `<div class="small ink2">${Object.values(counts).reduce((a, b) => a + b[1], 0)} people are in a session right now. Tap a spot to see who's there.</div>`}
   <div class="tiny muted">Spots with fewer than ${MIN_POSTS_SHOWN} posts stay hidden, and home or dorm sessions never appear, so nobody can be pinpointed.</div>
   <div class="eyebrow" style="margin-top:6px">Hottest spots, last 24 hours</div>
   <div class="card bars">${[...shown].sort((a, b) => counts[b.id][0] - counts[a.id][0]).slice(0, 6).map(s => { const n = counts[s.id][0]; return `<button class="barrow" style="text-align:left" data-act="spot" data-id="${s.id}"><span class="lbl">${esc(s.name)}</span><span class="bartrack"><span class="barfill" style="display:block;width:${n / max * 100}%;background:var(--coral)"></span></span><span class="val">${n}</span></button>` }).join("")}</div>
  </div>`;
}
// Heat: soft blobs per spot, colored through a violet-to-pink ramp
function paintHeat(cv, pts) {
  const x = cv.getContext("2d"), w = cv.width, h = cv.height; x.clearRect(0, 0, w, h);
  for (const p of pts) { const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, `rgba(0,0,0,${p.a})`); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2) }
  const img = x.getImageData(0, 0, w, h), d = img.data, ramp = [[201, 218, 255], [161, 140, 255], [123, 92, 255], [255, 122, 198], [255, 79, 142]];
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; if (!a) continue; const q = Math.min(.999, a) * (ramp.length - 1), k = Math.floor(q), f = q - k, c0 = ramp[k], c1 = ramp[k + 1]; d[i] = c0[0] + (c1[0] - c0[0]) * f; d[i + 1] = c0[1] + (c1[1] - c0[1]) * f; d[i + 2] = c0[2] + (c1[2] - c0[2]) * f; d[i + 3] = Math.min(220, a * 320) }
  x.putImageData(img, 0, 0);
}
function heatPoints(toXY, metersToPx) {
  const counts = spotCounts(), max = Math.max(...Object.values(counts).map(c => c[0]));
  return SPOTS.filter(s => counts[s.id][0] >= MIN_POSTS_SHOWN).map(s => { const n = counts[s.id][0], [x, y] = toXY(s.ll); return { x, y, r: metersToPx(70 + 110 * n / max), a: .3 + .7 * n / max } });
}
let lmap = null;
afterRender.map = () => {
  const heat = state.mapMode === "heat";
  const cv = $("#heat"); cv.hidden = !heat; cv.style.opacity = ".8";
  if (heat) paintHeat(cv, heatPoints(ll => proj(ll).map(v => v / 2), m => m / ((BOUNDS.e - BOUNDS.w) * KX * 1000) * VW / 2));
  $("#mapNote").textContent = "Simplified campus map. Spot positions come from Stanford's campus map.";
  initLeaflet();
};
function initLeaflet() {
  if (lmap) { try { lmap.remove() } catch { } lmap = null }
  const el = $("#leaf"); if (!el || !window.L) return;
  const counts = spotCounts(), live = state.mapMode === "live", heatOn = !live;
  const map = L.map(el, { zoomControl: false, attributionControl: true, zoomSnap: .25 }).fitBounds([[37.4228, -122.1790], [37.4335, -122.1600]]);
  lmap = map; let loaded = 0;
  const tiles = L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTR, subdomains: "abcd" }).addTo(map);
  tiles.on("tileload", () => { if (!loaded++) { el.style.visibility = "visible"; $("#schem").style.visibility = "hidden"; $("#mapNote").textContent = "Map data © OpenStreetMap contributors. Pinch to zoom."; map.invalidateSize(); drawL() } });
  const lcv = $("#lheat");
  const drawL = () => {
    if (!loaded || !heatOn) { lcv.hidden = true; return } lcv.hidden = false;
    const sz = map.getSize(); lcv.width = sz.x; lcv.height = sz.y;
    const mpp = 40075016.686 * Math.cos(CAMPUS[0] * Math.PI / 180) / Math.pow(2, map.getZoom() + 8);
    paintHeat(lcv, heatPoints(ll => { const p = map.latLngToContainerPoint(ll); return [p.x, p.y] }, m => m / mpp));
  };
  map.on("move zoom resize", drawL);
  for (const s of SPOTS) {
    if (counts[s.id][0] < MIN_POSTS_SHOWN) continue; const l = counts[s.id][1];
    const html = live ? `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center"><span style="min-width:28px;height:28px;padding:0 6px;border-radius:14px;background:#7B5CFF;color:#fff;font:800 13px 'Plus Jakarta Sans',sans-serif;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(123,92,255,.4)">${l}</span><span style="font:700 11px 'Plus Jakarta Sans',sans-serif;color:#1E1B3A;white-space:nowrap;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff">${esc(shortName(s))}</span></div>`
      : `<div style="transform:translate(-50%,-6px);display:flex;flex-direction:${s.below ? "column" : "column-reverse"};align-items:center;${s.below ? "" : "margin-top:-14px"}"><span style="width:12px;height:12px;border-radius:50%;background:#fff;border:2.5px solid #1E1B3A"></span><span style="font:700 11px 'Plus Jakarta Sans',sans-serif;color:#1E1B3A;white-space:nowrap;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff">${esc(shortName(s))}</span></div>`;
    L.marker(s.ll, { icon: L.divIcon({ className: "", html, iconSize: [0, 0] }), zIndexOffset: 500 }).addTo(map).on("click", () => openSpot(s.id));
  }
}
ACTS.mapMode = el => { state.mapMode = el.dataset.v; render() };
ACTS.spot = el => openSpot(el.dataset.id);
function openSpot(id) {
  const s = SPOTS.find(x => x.id === id), [n, l] = spotCounts()[s.id];
  const posts = allPosts().filter(p => p.spot === s.id).slice(0, 3);
  const classes = {}; allPosts().filter(p => p.spot === s.id).forEach(p => classes[p.cls] = (classes[p.cls] || 0) + 1);
  const top = Object.entries(classes).sort((a, b) => b[1] - a[1]).map(e => e[0]).concat(["CS 106B", "MATH 51", "CHEM 33"]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
  openSheet(`<h3 style="font-size:21px">${esc(s.name)}</h3>
  <div class="kpis" style="margin:12px 0"><div class="kpi"><div class="v">${n}</div><div class="k">Posts, 24h</div></div><div class="kpi"><div class="v">${l}</div><div class="k">Here now</div></div><div class="kpi"><div class="v" style="color:var(--blue)">${SPOT_SCORE[s.id]}</div><div class="k">Avg Lock Score</div></div></div>
  <div class="eyebrow">Top classes here</div><div class="row wrap" style="margin:6px 0 12px;gap:6px">${top.map(c => `<button class="chip" data-act="openClass" data-code="${esc(c)}">${esc(c)}</button>`).join("")}</div>
  ${posts.length ? `<div class="eyebrow">Friends' recent posts here</div><div class="stack" style="margin-top:6px">${posts.map(p => `<div class="row">${av(p.uid, 30)}<span class="grow small"><b>${esc(uname(p.uid))}</b> · ${esc(p.cls)} · ${fmtDur(p.dur)}</span><span class="tiny muted">${ago(p.end)}</span></div>`).join("")}</div>` : ""}
  <button class="btn block" style="margin-top:16px" data-act="studyHere" data-id="${s.id}">Lock in here</button>`);
}
ACTS.studyHere = el => { closeSheet(); ACTS.newSession(); if (draft) { draft.spot = el.dataset.id; renderSetup() } };
