// 시작점
import { fitStage } from './ui.js';
import { register, go, currentScene } from './router.js';
import { titleScene } from './scenes/title.js';
import { onboardingScene } from './scenes/onboarding.js';
import { villageScene } from './scenes/village.js';
import { saveNow } from './state.js';
import './gate.js';

register('title', titleScene);
register('onboarding', onboardingScene);
register('village', villageScene);
register('mission', () => {});

fitStage();
window.addEventListener('resize', fitStage);
window.addEventListener('orientationchange', () => setTimeout(fitStage, 300));
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
window.addEventListener('pagehide', saveNow);
// 두 손가락 확대, 길게 눌러 메뉴 막기
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

go('title');

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // 새 버전이 다 받아지면(서비스 워커 교체) 게임 중이 아닐 때 한 번 새로고침
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || window.__pendingReload) return;
    window.__pendingReload = true;
    saveNow();
    if (['title', 'village'].includes(currentScene())) location.reload();
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => r.update()).catch(() => {});
}
