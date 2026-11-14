// 화면 전환
import { sceneEl } from './ui.js';
import { stopSay } from './audio.js';

const routes = {};
let cleanup = null;
let current = null;

export function register(name, fn) { routes[name] = fn; }
export const currentScene = () => current;

export async function go(name, params = {}) {
  if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
  cleanup = null;
  stopSay();
  const root = sceneEl();
  root.innerHTML = '';
  root.className = 'scene scene-' + name;
  current = name;
  cleanup = await routes[name](root, params);
}
