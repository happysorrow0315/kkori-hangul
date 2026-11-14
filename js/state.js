// 저장 데이터 (아이패드 기기 안 localStorage에만 저장)
const KEY = 'kkori-save-v1';
const DEFAULT_PW_HASH = '2006304b';

export function pwHash(s) {
  let h = 0x811c9dc5;
  for (const ch of 'kkori:' + s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}

function defaults() {
  return {
    version: 1,
    profile: null, // { name, avatar:{skin,hair,hairColor,outfit}, catHat }
    chapter: 1,
    restore: 0,
    stars: 0,
    inventory: {}, // 'word:우유' | 'decor:lamp' -> 개수
    placed: [], // { id, key, x, y }
    owned: {}, // 'hat:crown': true
    dex: {}, // 단어 -> 처음 얻은 날짜
    stats: { words: {}, skill: { find: 0.3, dig: 0.3, trace: 0.3 } },
    tools: { find: 0, dig: 0, trace: 0 }, // 미션 완료 횟수
    missionsDone: 0,
    story: { done: [], bossDone: false, chapterClear: false },
    board: [],
    settings: {
      pwHash: DEFAULT_PW_HASH,
      gateMinutes: 30,
      zombieSpeed: 'auto', // auto | slow | normal | fast
      digLevel: 'auto', // auto | easy | hard
      compound: 'auto', // auto | more
      ttsRate: 0.9,
    },
    gate: { played: 0 },
    flags: {},
  };
}

function merge(base, data) {
  for (const k of Object.keys(data || {})) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && data[k] && typeof data[k] === 'object' && !Array.isArray(data[k])) {
      merge(base[k], data[k]);
    } else if (data[k] !== undefined) base[k] = data[k];
  }
  return base;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return merge(defaults(), JSON.parse(raw));
  } catch (e) { /* 저장소를 못 쓰는 환경 */ }
  return defaults();
}

export const S = load();

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 150);
}
export function saveNow() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 무시 */ }
}

export function resetAll() {
  const keepSettings = { ...S.settings };
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, defaults());
  S.settings = keepSettings;
  saveNow();
}

export function exportData() {
  return JSON.stringify({ app: 'kkori', savedAt: new Date().toISOString(), data: S }, null, 1);
}

export function importData(text) {
  const parsed = JSON.parse(text);
  const data = parsed && parsed.app === 'kkori' ? parsed.data : null;
  if (!data || data.version !== 1) throw new Error('올바른 백업 파일이 아니에요');
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, merge(defaults(), data));
  saveNow();
}

export function addInv(key, n = 1) {
  S.inventory[key] = (S.inventory[key] || 0) + n;
  if (S.inventory[key] <= 0) delete S.inventory[key];
  save();
}
