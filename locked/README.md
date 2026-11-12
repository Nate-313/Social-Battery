# Locked — demo

A clickable, working demo of **Locked**, a Strava-style app for studying. Open `index.html`
from any HTTPS host (GitHub Pages works) on your phone to use the real front camera.

## What works in the demo
- **+ Session:** class tag, goals (locked once you start), spot, studying-with, optional workload,
  "Lock me in" (soft lock with a −20 emergency unlock), and a demo clock (1 sec = 1 min).
- **Recording:** dark screen with a small timer; the front camera grabs a frame every few seconds,
  thinned automatically so every timelapse plays in exactly 20 seconds with clock, elapsed time,
  class and song overlays. Pauses show as a "Paused N min" card; 30 minutes paused ends the session.
- **Lock Score (0–100, private):** Presence 45% · Continuity 30% · Goals 25%. See `src/session.js`.
- **Posting:** caption, class-feed sharing, location with GPS check, locked-in song,
  joint posts, private save, 1–5 self-rating that doesn't affect the score.
- **Safety:** text moderation on captions, comments, chats, poll and spot names; frame scan
  before posting; report + block on posts, comments, messages and Reels. See `moderate()` in `src/core.js`.
- **Map:** 24-hour heat map and live layer; spots with under 3 posts and home sessions stay hidden.
- **Chats:** per-term class chats (join from search), honor-code pin and warnings, polls,
  lock-in invites, DMs, group chats, friends with requests, suggestions, invite link and QR.
- **Stats:** Flow State streak (30 min/day, 4 AM reset, 1 freeze/week) with an evolving lock,
  Locked Load, best time/spot/day/length/class/music/group, exam countdown, Locked Wrapped.
- **Break Reels:** unlocked only on a break or right after a session.

Data lives on the device (localStorage + IndexedDB). Friends, posts and chats from others are sample data.

## Build
`./build.sh` concatenates `src/` into `index.html`.
