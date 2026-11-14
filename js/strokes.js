// 자모 획순 데이터 (0~1 좌표, 각 획은 점 배열이며 순서대로 써야 함)
import { decompose, VOWEL_SPLIT } from './hangul.js';

function circle(cx, cy, rx, ry = rx, n = 28) {
  // 맨 위에서 시작해서 왼쪽(시계 반대 방향)으로 돈다
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = -Math.PI / 2 - (Math.PI * 2 * i) / n;
    pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return pts;
}

export const CONS = {
  'ㄱ': [[[0.1, 0.15], [0.85, 0.15], [0.8, 0.9]]],
  'ㄴ': [[[0.15, 0.1], [0.15, 0.85], [0.9, 0.85]]],
  'ㄷ': [[[0.15, 0.15], [0.85, 0.15]], [[0.15, 0.15], [0.15, 0.85], [0.9, 0.85]]],
  'ㄹ': [[[0.15, 0.12], [0.85, 0.12], [0.85, 0.48]], [[0.15, 0.48], [0.85, 0.48]], [[0.15, 0.48], [0.15, 0.88], [0.9, 0.88]]],
  'ㅁ': [[[0.15, 0.15], [0.15, 0.85]], [[0.15, 0.15], [0.85, 0.15], [0.85, 0.85]], [[0.15, 0.85], [0.85, 0.85]]],
  'ㅂ': [[[0.2, 0.1], [0.2, 0.88]], [[0.8, 0.1], [0.8, 0.88]], [[0.2, 0.48], [0.8, 0.48]], [[0.2, 0.88], [0.8, 0.88]]],
  'ㅅ': [[[0.5, 0.1], [0.12, 0.88]], [[0.42, 0.42], [0.88, 0.88]]],
  'ㅇ': [circle(0.5, 0.5, 0.36)],
  'ㅈ': [[[0.12, 0.15], [0.85, 0.15], [0.15, 0.88]], [[0.5, 0.48], [0.88, 0.88]]],
  'ㅊ': [[[0.5, 0.02], [0.5, 0.17]], [[0.12, 0.3], [0.85, 0.3], [0.15, 0.9]], [[0.5, 0.58], [0.88, 0.9]]],
  'ㅋ': [[[0.1, 0.15], [0.85, 0.15], [0.8, 0.9]], [[0.15, 0.5], [0.82, 0.5]]],
  'ㅌ': [[[0.15, 0.12], [0.85, 0.12]], [[0.15, 0.48], [0.8, 0.48]], [[0.15, 0.12], [0.15, 0.88], [0.9, 0.88]]],
  'ㅍ': [[[0.1, 0.15], [0.9, 0.15]], [[0.32, 0.15], [0.35, 0.85]], [[0.68, 0.15], [0.65, 0.85]], [[0.08, 0.85], [0.92, 0.85]]],
  'ㅎ': [[[0.5, 0.02], [0.5, 0.15]], [[0.15, 0.27], [0.85, 0.27]], circle(0.5, 0.64, 0.25, 0.24)],
};
const DOUBLE = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };

// 세로 모음 (자음 오른쪽)
const VOW_V = {
  'ㅏ': [[[0.35, 0], [0.35, 1]], [[0.35, 0.5], [0.85, 0.5]]],
  'ㅑ': [[[0.35, 0], [0.35, 1]], [[0.35, 0.36], [0.85, 0.36]], [[0.35, 0.64], [0.85, 0.64]]],
  'ㅓ': [[[0.05, 0.5], [0.6, 0.5]], [[0.6, 0], [0.6, 1]]],
  'ㅕ': [[[0.05, 0.36], [0.6, 0.36]], [[0.05, 0.64], [0.6, 0.64]], [[0.6, 0], [0.6, 1]]],
  'ㅣ': [[[0.5, 0], [0.5, 1]]],
  'ㅐ': [[[0.25, 0], [0.25, 1]], [[0.25, 0.5], [0.58, 0.5]], [[0.78, 0], [0.78, 1]]],
  'ㅔ': [[[0.05, 0.5], [0.42, 0.5]], [[0.42, 0.06], [0.42, 0.94]], [[0.82, 0], [0.82, 1]]],
  'ㅒ': [[[0.25, 0], [0.25, 1]], [[0.25, 0.38], [0.58, 0.38]], [[0.25, 0.62], [0.58, 0.62]], [[0.78, 0], [0.78, 1]]],
  'ㅖ': [[[0.05, 0.38], [0.42, 0.38]], [[0.05, 0.62], [0.42, 0.62]], [[0.42, 0.06], [0.42, 0.94]], [[0.82, 0], [0.82, 1]]],
};
// 가로 모음 (자음 아래)
const VOW_H = {
  'ㅗ': [[[0.5, 0.12], [0.5, 0.5]], [[0.04, 0.5], [0.96, 0.5]]],
  'ㅛ': [[[0.35, 0.12], [0.35, 0.5]], [[0.65, 0.12], [0.65, 0.5]], [[0.04, 0.5], [0.96, 0.5]]],
  'ㅜ': [[[0.04, 0.3], [0.96, 0.3]], [[0.5, 0.3], [0.5, 0.88]]],
  'ㅠ': [[[0.04, 0.3], [0.96, 0.3]], [[0.35, 0.3], [0.35, 0.88]], [[0.65, 0.3], [0.65, 0.88]]],
  'ㅡ': [[[0.04, 0.45], [0.96, 0.45]]],
};

const vType = (j) => (j in VOW_V ? 'V' : j in VOW_H ? 'H' : 'M');

const BOX = {
  V: { cho: [0.06, 0.12, 0.56, 0.88], jung: [0.58, 0.04, 0.96, 0.96] },
  H: { cho: [0.2, 0.04, 0.8, 0.46], jung: [0.04, 0.46, 0.96, 0.96] },
  M: { cho: [0.06, 0.04, 0.54, 0.42], h: [0.04, 0.4, 0.66, 0.96], v: [0.62, 0.02, 0.96, 0.98] },
};
// 받침이 있을 때 (2챕터부터 사용)
const BOXJ = {
  V: { cho: [0.06, 0.06, 0.56, 0.5], jung: [0.58, 0.02, 0.96, 0.6], jong: [0.16, 0.62, 0.84, 0.96] },
  H: { cho: [0.22, 0.02, 0.78, 0.3], jung: [0.04, 0.3, 0.96, 0.6], jong: [0.16, 0.62, 0.84, 0.96] },
  M: { cho: [0.06, 0.02, 0.5, 0.28], h: [0.04, 0.26, 0.66, 0.6], v: [0.62, 0.02, 0.96, 0.62], jong: [0.16, 0.64, 0.84, 0.97] },
};

const mapPts = (s, [x0, y0, x1, y1]) => s.map(([x, y]) => [x0 + x * (x1 - x0), y0 + y * (y1 - y0)]);

function consStrokes(c) {
  if (CONS[c]) return CONS[c];
  const base = DOUBLE[c];
  if (base) return [...CONS[base].map((s) => mapPts(s, [0, 0, 0.5, 1])), ...CONS[base].map((s) => mapPts(s, [0.5, 0, 1, 1]))];
  return [];
}

export function syllableStrokes(ch) {
  const d = decompose(ch);
  if (!d) return [];
  const t = vType(d.jung);
  const b = (d.jong ? BOXJ : BOX)[t];
  const out = [];
  consStrokes(d.cho).forEach((s) => out.push(mapPts(s, b.cho)));
  if (t === 'V') VOW_V[d.jung].forEach((s) => out.push(mapPts(s, b.jung)));
  else if (t === 'H') VOW_H[d.jung].forEach((s) => out.push(mapPts(s, b.jung)));
  else {
    const [h, v] = VOWEL_SPLIT[d.jung];
    VOW_H[h].forEach((s) => out.push(mapPts(s, b.h)));
    VOW_V[v].forEach((s) => out.push(mapPts(s, b.v)));
  }
  if (d.jong) consStrokes(d.jong).forEach((s) => out.push(mapPts(s, b.jong)));
  return out;
}

// ───── 따라 쓰기 판정 ─────
function distToSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1e-9;
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function distToPoly(p, poly) {
  let m = Infinity;
  for (let i = 0; i < poly.length - 1; i++) m = Math.min(m, distToSeg(p, poly[i], poly[i + 1]));
  return m;
}
function polyLen(poly) {
  let l = 0;
  for (let i = 0; i < poly.length - 1; i++) l += Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]);
  return l;
}
export function samplePoly(poly, n) {
  const total = polyLen(poly), out = [];
  for (let k = 0; k <= n; k++) {
    let target = (total * k) / n;
    for (let i = 0; i < poly.length - 1; i++) {
      const seg = Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]);
      if (target <= seg || i === poly.length - 2) {
        const t = seg ? Math.min(1, target / seg) : 0;
        out.push([poly[i][0] + t * (poly[i + 1][0] - poly[i][0]), poly[i][1] + t * (poly[i + 1][1] - poly[i][1])]);
        break;
      }
      target -= seg;
    }
  }
  return out;
}

const TOL = { start: 0.15, end: 0.17, line: 0.12, cover: 0.13 };

function matches(user, guide) {
  if (user.length < 2) return false;
  const closed = Math.hypot(guide[0][0] - guide.at(-1)[0], guide[0][1] - guide.at(-1)[1]) < 0.05;
  if (Math.hypot(user[0][0] - guide[0][0], user[0][1] - guide[0][1]) > TOL.start) return false;
  if (!closed && Math.hypot(user.at(-1)[0] - guide.at(-1)[0], user.at(-1)[1] - guide.at(-1)[1]) > TOL.end) return false;
  if (polyLen(user) < polyLen(guide) * 0.5) return false;
  const near = user.filter((p) => distToPoly(p, guide) < TOL.line).length;
  if (near / user.length < 0.85) return false;
  const samples = samplePoly(guide, 12);
  const covered = samples.filter((s) => user.some((u) => Math.hypot(u[0] - s[0], u[1] - s[1]) < TOL.cover)).length;
  return covered / samples.length >= 0.8;
}

// 결과: 'ok' | 'reverse'(반대 방향) | 'bad'
export function judgeStroke(user, guide) {
  if (matches(user, guide)) return 'ok';
  if (matches([...user].reverse(), guide)) return 'reverse';
  return 'bad';
}
