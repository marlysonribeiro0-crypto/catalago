const VERSION = 'agrovida-v9.0.0';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
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
    // Abre NA HORA com a cópia guardada e busca a versão nova em segundo plano (vale na próxima abertura).
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match('./index.html');
      const net = fetch(req).then(r => { if (r && r.ok) c.put('./index.html', r.clone()); return r; }).catch(() => hit);
      e.waitUntil(net.catch(() => {}));
      return hit || net;
    }));
    return;
  }
  if (url.origin === location.origin || CDN.includes(url.hostname)) e.respondWith(swr(req));
});
