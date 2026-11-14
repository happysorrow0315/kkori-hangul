// 오프라인 실행용 서비스 워커
// 게임 파일을 바꾸면 VERSION을 올려야 아이패드에 새 버전이 받아져요.
// 새 버전은 파일 전체를 서버에서 한꺼번에 새로 받아 두고(섞임 방지), 받은 뒤에만 바꿔 씀.
const VERSION = 'kkori-v5';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'fonts/Jua-Regular.ttf',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/main.js', 'js/ui.js', 'js/router.js', 'js/state.js', 'js/audio.js', 'js/art.js', 'js/hangul.js',
  'js/words.js', 'js/strokes.js', 'js/adaptive.js', 'js/quests.js', 'js/gate.js',
  'js/scenes/title.js', 'js/scenes/onboarding.js', 'js/scenes/village.js', 'js/scenes/panels.js',
  'js/scenes/parent.js', 'js/scenes/mission.js',
  'js/games/common.js', 'js/games/index.js', 'js/games/find.js', 'js/games/dig.js', 'js/games/trace.js', 'js/games/boss.js',
  'js/games/fish.js', 'js/games/bridge.js', 'js/games/orb.js', 'js/games/hidden.js',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' → 브라우저에 남은 예전 파일 말고 서버에서 직접 받음
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 이 버전의 캐시에 있는 파일만 씀 (뒤에서 파일 하나씩 갈아 끼우지 않음)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      return fetch(e.request);
    }),
  );
});
