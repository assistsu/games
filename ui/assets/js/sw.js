const staticCacheName = 'site-static-v3';
const assets = [
  /** JS files */
  '/assets/js/bundle/main.js',
  '/assets/js/bundle/bundle.0.js',
  '/assets/js/bundle/bundle.1.js',
  '/assets/js/bundle/bundle.2.js',
  '/assets/js/bundle/bundle.3.js',
  '/assets/js/bundle/bundle.4.js',
  '/assets/js/bundle/bundle.5.js',
  '/assets/js/bundle/bundle.6.js',
  '/assets/js/bundle/bundle.7.js',
  '/assets/js/bundle/bundle.8.js',
  /** Image files */
  '/assets/images/uno.png',
  '/assets/images/ass.png',
  '/assets/images/CLUB.png',
  '/assets/images/DIAMOND.png',
  '/assets/images/HEART.png',
  '/assets/images/SPADE.png',
  '/assets/images/joker.png',
  /** Audio files */
  '/assets/music/new-notify.mp3',
  '/assets/music/error-notify.mp3',
  '/assets/music/light-notify.mp3',
  '/assets/music/buzz-notify.mp3',
];
// install event
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      cache.addAll(assets);
    })
  );
});
// activate event
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== staticCacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});
// fetch event
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request);
    })
  );
});