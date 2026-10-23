// voice-pad の SW: 画面表示を保ちつつ、flow-hub の活動トラッカーをHTMLへ注入する。
const CACHE = 'voice-pad-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png'];
const HUB_SCRIPT = '<script src="./hub-activity.js"></script><script src="./hub-handoff.js"></script>';

async function instrument(res) {
  const type = res.headers.get('content-type') || '';
  if (!type.includes('text/html')) return res;
  const text = await res.text();
  if (text.includes('hub-activity.js')) return new Response(text, {status:res.status, headers:res.headers});
  const body = text.replace(/<\/body>/i, HUB_SCRIPT + '</body>');
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  return new Response(body, {status:res.status, statusText:res.statusText, headers});
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(async res => {
    if (!res.ok) return res;
    const out = await instrument(res.clone());
    caches.open(CACHE).then(c => c.put(req, out.clone()));
    return out;
  }).catch(async () => {
    const cached = await caches.match(req, {ignoreSearch:true});
    return cached || fetch(req);
  }));
});