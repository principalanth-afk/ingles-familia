/* Service worker: permite abrir la app sin internet (las lecciones funcionan offline;
   el reconocimiento de voz y el tutor de IA sí necesitan conexión). */
const CACHE = 'ingles-familia-v3';
const FILES = ['./', 'index.html', 'styles.css', 'js/content.js', 'js/phrasebook.js', 'js/speech.js', 'js/app.js', 'js/tutor.js', 'js/zahra.js', 'js/news.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // APIs de IA: siempre por red
  if (/generativelanguage|deepseek|openrouter|groq|mymemory|rss2json|allorigins|codetabs|bbci|npr/.test(url.hostname)) return;
  // Fuentes de Google: cache con actualización
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // App: red primero (para recibir actualizaciones), cache si no hay internet
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
