// Offline support. Pages (and config.js) come from the network first so updates show
// up right away, falling back to the cache when offline. Other files (icons, manifest)
// are served from the cache and refreshed in the background.
const CACHE = 'battery-v3';
const FILES = ['./', './index.html', './config.js', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  // Only this app's own files; friend data from Supabase must always be live.
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const fresh = fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  });
  fresh.catch(() => {}); // offline: handled below
  const cached = caches.match(e.request, { ignoreSearch: true });
  const networkFirst = e.request.mode === 'navigate' || /\/(index\.html|config\.js)?$/.test(new URL(e.request.url).pathname);
  e.respondWith(networkFirst
    ? fresh.catch(() => cached)
    : cached.then(hit => hit || fresh));
});
