const CACHE_NAME = 'asset-app-v2.0.3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // 新版本立即激活，不等待旧版本关闭
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  // 立即接管所有客户端
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // GitHub API 请求不缓存
  if (e.request.url.includes('api.github.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // 优先网络，网络成功则更新缓存
      const fetched = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      return fetched;
    })
  );
});
