// 화면 전환
import { sceneEl } from './ui.js';
import { stopSay } from './audio.js';

const routes = {};
let cleanup = null;
let current = null;

export function register(name, fn) { routes[name] = fn; }
export const currentScene = () => current;

export async function go(name, params = {}) {
  // 새 버전이 준비돼 있으면 마을/시작 화면으로 갈 때 한 번 새로고침 (게임 중엔 안 함)
  if (window.__pendingReload && (name === 'village' || name === 'title')) { location.reload(); return; }
  if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
  cleanup = null;
  stopSay();
  const root = sceneEl();
  root.innerHTML = '';
  root.className = 'scene scene-' + name;
  current = name;
  try {
    cleanup = await routes[name](root, params);
  } catch (e) {
    console.error(e);
    // 하얀 화면 대신 안내 화면 (index.html의 __fatal)
    window.__fatal?.(`${name}: ${e && e.message ? e.message : e}`, true);
  }
}
