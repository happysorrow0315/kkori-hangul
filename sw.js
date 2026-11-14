// 오프라인 실행용 서비스 워커
// 게임 파일을 바꾸면 VERSION을 올려야 아이패드에 새 버전이 받아져요.
const VERSION = 'kkori-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'fonts/Jua-Regular.ttf',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/main.js', 'js/ui.js', 'js/router.js', 'js/state.js', 'js/audio.js', 'js/art.js', 'js/hangul.js',
  'js/words.js', 'js/strokes.js', 'js/adaptive.js', 'js/quests.js', 'js/gate.js',
  'js/scenes/title.js', 'js/scenes/onboarding.js', 'js/scenes/village.js', 'js/scenes/panels.js',
  'js/scenes/parent.js', 'js/scenes/mission.js',
  'js/games/common.js', 'js/games/find.js', 'js/games/dig.js', 'js/games/trace.js', 'js/games/boss.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 캐시 먼저 보여주고, 인터넷이 되면 뒤에서 새 파일로 갱신
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request)
        .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
