
const CACHE_NAME = 'cattetris-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/main.js',
    '/new_images/down.png',
    '/new_images/down_with_speed.png',
    '/new_images/left.png',
    '/new_images/new_I.png',
    '/new_images/new_J.png',
    '/new_images/new_L.png',
    '/new_images/new_O.png',
    '/new_images/new_S.png',
    '/new_images/new_T.png',
    '/new_images/new_Z.png',
    '/new_images/right.png',
    '/new_images/rotate.png',
    '/new_images/thumbnail.png',
    '/new_images/thumbnail_f.png',
    '/sounds/game_over.wav',
    '/sounds/hard_drop.wav',
    '/sounds/line_clear.wav',
    '/sounds/move.wav',
    '/sounds/rotate.wav',
    '/sounds/tetris_clear.wav'
];

// 서비스 워커 설치
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 요청에 대한 응답
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 캐시가 있으면 캐시에서 응답, 없으면 네트워크로 요청
                return response || fetch(event.request);
            })
    );
});

// 오래된 캐시 정리
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
