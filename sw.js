const VERSION = 'agrovida-v7.0.1';
const SHELL = [
  '/catalogo/',
  '/catalogo/index.html',
  '/catalogo/manifest.json',
  '/catalogo/icons/icon-192.png',
  '/catalogo/icons/icon-512.png'
];
const CDN = ['cdn.tailwindcss.com','cdnjs.cloudflare.com','cdn.jsdelivr.net','cdn.sheetjs.com','www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(()=>{})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
const swr = (req) => caches.open(VERSION).then(async c => {
  const hit = await c.match(req);
  const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(
      Promise.race([fetch(req), new Promise((_, rej) => setTimeout(rej, 4000))])
        .then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('/catalogo/index.html', cp)); return r; })
        .catch(() => caches.match('/catalogo/index.html'))
    );
    return;
  }
  if (url.origin === location.origin || CDN.includes(url.hostname)) e.respondWith(swr(req));
});
