// voice-pad の SW: 画面を開けるようにするだけ。通信(Worker宛・POSTなど)には触れない。
// 画面を変えたら、下の CACHE の数字を1つ上げる（更新が早く届く）。
const CACHE = 'voice-pad-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // Worker宛・POST は素通し
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req, { ignoreSearch: true })));
});
