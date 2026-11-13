// Hariyo service worker: keeps the app shell available offline; live data always comes from the network.
const V = "hariyo-v4";
const SHELL = ["/", "/index.html", "/app.css?v=4", "/app.js?v=4", "/crops.json", "/icon-192.png", "/fonts/mukta-latin-400-normal.woff2", "/fonts/baloo-2-latin-800-normal.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(m => m || caches.match("/index.html"))));
});
