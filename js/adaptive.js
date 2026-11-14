// 난이도 자동 조절 + 부모 수동 설정
import { S, save } from './state.js';
import { wordsOf, catOf } from './words.js';

function st(w) {
  if (!S.stats.words[w]) S.stats.words[w] = { seen: 0, ok: 0, bad: 0, streak: 0, last: -99 };
  return S.stats.words[w];
}

export function record(w, { mistakes = 0, hinted = false } = {}) {
  const s = st(w);
  s.seen++;
  s.last = S.missionsDone;
  if (!mistakes && !hinted) { s.ok++; s.streak++; } else { s.bad += Math.min(3, mistakes) + (hinted ? 1 : 0); s.streak = 0; }
  save();
}

export const skill = (type) => S.stats.skill[type] ?? 0.3;

export function bumpSkill(type, clean, mistakes = 1) {
  let v = skill(type) + (clean ? 0.08 : -0.05 * Math.min(3, Math.max(1, mistakes)));
  S.stats.skill[type] = Math.max(0, Math.min(1, v));
  save();
}

export function catAccuracy(cat) {
  let ok = 0, n = 0;
  for (const [w, s] of Object.entries(S.stats.words)) if (catOf(w) === cat) { ok += s.ok; n += s.ok + s.bad; }
  return n ? ok / n : null;
}

function weight(w) {
  const s = S.stats.words[w];
  let x;
  if (!s || !s.seen) x = 1.6;
  else {
    x = 1 + (s.bad * 0.7) / (1 + s.ok * 0.4);
    if (s.streak >= 3) x *= 0.35;
    if (S.missionsDone - s.last < 2) x *= 0.3;
  }
  if (catOf(w) === 'compound') {
    if (S.settings.compound === 'more') x *= 2;
    else {
      const a = catAccuracy('compound'), b = catAccuracy('basic');
      if (a !== null && b !== null && a < b - 0.1) x *= 1.5;
    }
  }
  return x;
}

export function pickWords(n, exclude = [], filter = null) {
  const pool = wordsOf(S.chapter).filter((w) => !exclude.includes(w) && (!filter || filter(w)));
  const out = [];
  while (out.length < n && pool.length) {
    const ws = pool.map(weight);
    let r = Math.random() * ws.reduce((a, b) => a + b, 0);
    let i = 0;
    for (; i < pool.length - 1; i++) { r -= ws[i]; if (r <= 0) break; }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export function toolLevel(type) {
  const n = S.tools[type] || 0;
  return n >= 12 ? 2 : n >= 5 ? 1 : 0;
}

export const TOOL_NAMES = {
  find: ['꼬리 운동화', '반짝 운동화', '황금 운동화'],
  dig: ['나무 삽', '은 삽', '황금 삽'],
  trace: ['마법 지팡이', '무지개 지팡이', '별빛 지팡이'],
};

// 좀비괴물이 물건에 도착하기까지 걸리는 시간(초)
export function zombieSeconds() {
  const fixed = { slow: 50, normal: 36, fast: 26 }[S.settings.zombieSpeed];
  const base = fixed ?? 46 - 22 * skill('find');
  return base + toolLevel('find') * 3;
}

export function digDecoys() {
  const fixed = { easy: 1, hard: 4 }[S.settings.digLevel];
  return fixed ?? 2 + Math.round(skill('dig') * 2);
}

// 복모음을 두 조각(ㅜ+ㅓ)으로 나눠 묻을 확률
export function splitChance() {
  if (S.settings.digLevel === 'hard') return 1;
  if (S.settings.digLevel === 'easy') return 0;
  return 0.35 + 0.45 * skill('dig');
}

export function hardestWords(k = 8) {
  return Object.entries(S.stats.words)
    .filter(([, s]) => s.bad > 0)
    .sort((a, b) => b[1].bad - a[1].bad)
    .slice(0, k)
    .map(([w, s]) => ({ w, ...s }));
}
