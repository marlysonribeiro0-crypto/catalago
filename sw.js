const CACHE = 'agrovida-v10.0.0';
const base = self.registration.scope;
const app = new URL('index.html', base).href;
const cdns = new Set(['cdnjs.cloudflare.com','cdn.jsdelivr.net','cdn.sheetjs.com','www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com']);
const staticPaths = ['manifest.json','logo.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'];
const files = new Set(staticPaths.map(path => new URL(path,base).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([app,new URL('manifest.json',base).href].map(url => new Request(url,{cache:'reload'})));
    const optional = staticPaths.slice(1).map(path => new URL(path,base).href);
    for (const module of ['firebase-app','firebase-firestore']) {
      optional.push('https://www.gstatic.com/firebasejs/10.7.1/' + module + '.js');
    }
    await Promise.allSettled(optional.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (/^agrovida-v\d/.test(key) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const route = url.origin + url.pathname;
  if (request.mode === 'navigate' && (route === app || route === base)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request, {cache:'no-cache'});
        if (response.ok && /text\/html/i.test(response.headers.get('content-type') || '')) {
          await cache.put(app,response.clone()).catch(()=>{});
        }
        if (response.status >= 500) return await cache.match(app) || response;
        return response;
      } catch {
        return await cache.match(app) || Response.error();
      }
    })());
  } else if (files.has(route) || cdns.has(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') await cache.put(request,response.clone()).catch(()=>{});
      return response;
    })());
  }
});
