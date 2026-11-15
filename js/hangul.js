// 한글 자모 조합/분해 엔진
export const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
export const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
export const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const BASE = 0xac00;

export function compose(cho, jung, jong = '') {
  const c = CHO.indexOf(cho), j = JUNG.indexOf(jung), k = JONG.indexOf(jong);
  if (c < 0 || j < 0 || k < 0) return null;
  return String.fromCharCode(BASE + (c * 21 + j) * 28 + k);
}

export function decompose(ch) {
  const code = ch.charCodeAt(0) - BASE;
  if (code < 0 || code > 11171) return null;
  const k = code % 28, j = ((code - k) / 28) % 21, c = Math.floor(code / 28 / 21);
  return { cho: CHO[c], jung: JUNG[j], jong: JONG[k] };
}

export const VOWEL_SPLIT = {
  'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'], 'ㅢ': ['ㅡ', 'ㅣ'],
};

// ㅐ ㅔ ㅒ ㅖ 도 사실은 두 모음이 합쳐진 것 (4챕터에서 원리로 가르침)
export const AE_SPLIT = { 'ㅐ': ['ㅏ', 'ㅣ'], 'ㅔ': ['ㅓ', 'ㅣ'], 'ㅒ': ['ㅑ', 'ㅣ'], 'ㅖ': ['ㅕ', 'ㅣ'] };

export function combineVowels(a, b) {
  for (const [k, [x, y]] of Object.entries(VOWEL_SPLIT)) if (x === a && y === b) return k;
  for (const [k, [x, y]] of Object.entries(AE_SPLIT)) if (x === a && y === b) return k;
  return null;
}

export const isVowel = (j) => JUNG.includes(j);
export const isCompound = (j) => j in VOWEL_SPLIT;

export function syllables(word) {
  return [...word].map(decompose);
}

export function hasBatchim(word) {
  const d = decompose(word[word.length - 1]);
  return !!(d && d.jong);
}

// 조사: josa('지우', '아/야') -> '지우야'
export function josa(word, pair) {
  const [a, b] = pair.split('/');
  return word + (hasBatchim(word) ? a : b);
}

// 헷갈리기 쉬운 자모 (땅파기 미끼 조각용)
export const SIMILAR = {
  'ㄱ': ['ㅋ', 'ㄴ'], 'ㄴ': ['ㄷ', 'ㄱ'], 'ㄷ': ['ㅌ', 'ㄹ'], 'ㄹ': ['ㄷ', 'ㅁ'], 'ㅁ': ['ㅂ', 'ㅇ'],
  'ㅂ': ['ㅍ', 'ㅁ'], 'ㅅ': ['ㅈ', 'ㅆ'], 'ㅇ': ['ㅎ', 'ㅁ'], 'ㅈ': ['ㅊ', 'ㅅ'], 'ㅊ': ['ㅈ', 'ㅎ'],
  'ㅋ': ['ㄱ', 'ㅌ'], 'ㅌ': ['ㄷ', 'ㅋ'], 'ㅍ': ['ㅂ', 'ㅌ'], 'ㅎ': ['ㅇ', 'ㅊ'],
  'ㄲ': ['ㄱ', 'ㅋ'], 'ㄸ': ['ㄷ', 'ㅌ'], 'ㅃ': ['ㅂ', 'ㅍ'], 'ㅆ': ['ㅅ', 'ㅈ'], 'ㅉ': ['ㅈ', 'ㅊ'],
  'ㅏ': ['ㅓ', 'ㅑ'], 'ㅓ': ['ㅏ', 'ㅕ'], 'ㅑ': ['ㅕ', 'ㅏ'], 'ㅕ': ['ㅑ', 'ㅓ'], 'ㅗ': ['ㅜ', 'ㅛ'],
  'ㅛ': ['ㅠ', 'ㅗ'], 'ㅜ': ['ㅗ', 'ㅠ'], 'ㅠ': ['ㅛ', 'ㅜ'], 'ㅡ': ['ㅣ', 'ㅜ'], 'ㅣ': ['ㅡ', 'ㅏ'],
  'ㅐ': ['ㅔ', 'ㅏ'], 'ㅔ': ['ㅐ', 'ㅓ'], 'ㅘ': ['ㅝ', 'ㅏ'], 'ㅙ': ['ㅞ', 'ㅚ'], 'ㅚ': ['ㅟ', 'ㅙ'],
  'ㅝ': ['ㅘ', 'ㅓ'], 'ㅞ': ['ㅙ', 'ㅔ'], 'ㅟ': ['ㅚ', 'ㅢ'], 'ㅢ': ['ㅡ', 'ㅟ'],
};

// 소리 가족: 예사소리 · 된소리 · 거센소리 (굴 / 꿀 / 쿨)
export const SOUND_FAMILY = [['ㄱ', 'ㄲ', 'ㅋ'], ['ㄷ', 'ㄸ', 'ㅌ'], ['ㅂ', 'ㅃ', 'ㅍ'], ['ㅅ', 'ㅆ'], ['ㅈ', 'ㅉ', 'ㅊ']];
export const familyOf = (c) => SOUND_FAMILY.find((f) => f.includes(c)) || null;
export const DOUBLE_OF = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };
export const isDouble = (c) => c in DOUBLE_OF;
export function combineConsonants(a, b) {
  if (a !== b) return null;
  return Object.keys(DOUBLE_OF).find((k) => DOUBLE_OF[k] === a) || null;
}

// 소리가 비슷한 단어: 꿀 → 굴, 쿨 (첫소리 가족을 바꿈)
export function soundAlikes(word, n = 2) {
  const chars = [...word];
  const out = new Set();
  chars.forEach((ch, i) => {
    const d = decompose(ch);
    const fam = d && familyOf(d.cho);
    if (!fam) return;
    fam.filter((c) => c !== d.cho).forEach((c) => {
      const copy = [...chars];
      copy[i] = compose(c, d.jung, d.jong);
      out.add(copy.join(''));
    });
  });
  if (out.size < n) {
    chars.forEach((ch, i) => similarSyllables(ch, 3).forEach((s) => { const copy = [...chars]; copy[i] = s; out.add(copy.join('')); }));
  }
  const arr = [...out].filter((w) => w !== word);
  for (let i = arr.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [arr[i], arr[k]] = [arr[k], arr[i]]; }
  // 첫소리 가족을 바꾼 것(듣기 핵심)을 앞에
  arr.sort((a, b) => famDiff(word, b) - famDiff(word, a));
  return arr.slice(0, n);
}
function famDiff(a, b) {
  let s = 0;
  [...a].forEach((ch, i) => { const x = decompose(ch), y = decompose([...b][i] || ''); if (x && y && x.cho !== y.cho && familyOf(x.cho) && familyOf(x.cho) === familyOf(y.cho)) s++; });
  return s;
}

// 받침끼리 헷갈리기 쉬운 것
export const SIMILAR_JONG = { 'ㄱ': ['ㅇ', 'ㅂ'], 'ㄴ': ['ㅇ', 'ㅁ', 'ㄹ'], 'ㄹ': ['ㄴ', 'ㅁ'], 'ㅁ': ['ㅂ', 'ㄴ', 'ㅇ'], 'ㅂ': ['ㅁ', 'ㄱ'], 'ㅇ': ['ㄴ', 'ㅁ', 'ㄱ'],
  'ㅅ': ['ㄷ', 'ㅈ'], 'ㅈ': ['ㅅ', 'ㅊ'], 'ㅊ': ['ㅈ', 'ㅅ'], 'ㅌ': ['ㄷ', 'ㅅ'], 'ㅍ': ['ㅂ'], 'ㄷ': ['ㅅ', 'ㅌ'], 'ㅋ': ['ㄱ'] };

// 헷갈리기 쉬운 글자(음절) 만들기: 과 -> 고, 가, 궈 ...
export function similarSyllables(syl, n = 3, avoid = []) {
  const d = decompose(syl);
  if (!d) return [];
  const cand = new Set();
  (SIMILAR[d.cho] || []).forEach((c) => cand.add(compose(c, d.jung, d.jong)));
  (SIMILAR[d.jung] || []).forEach((j) => cand.add(compose(d.cho, j, d.jong)));
  if (VOWEL_SPLIT[d.jung]) VOWEL_SPLIT[d.jung].forEach((j) => cand.add(compose(d.cho, j, d.jong)));
  if (d.jong) {
    (SIMILAR_JONG[d.jong] || []).forEach((k) => cand.add(compose(d.cho, d.jung, k)));
    cand.add(compose(d.cho, d.jung, '')); // 받침이 빠진 글자
  }
  const out = [...cand].filter((s) => s && s !== syl && !avoid.includes(s));
  for (let i = out.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [out[i], out[k]] = [out[k], out[i]]; }
  return out.slice(0, n);
}

// 두 단어가 얼마나 비슷한지 (물건 찾기 미끼용)
export function similarity(a, b) {
  if (a === b) return -1;
  let score = 0;
  const sa = [...a], sb = [...b];
  if (sa.length === sb.length) score += 1;
  sa.forEach((ch, i) => {
    if (sb[i] === ch) score += 3;
    else if (sb.includes(ch)) score += 2;
    const da = decompose(ch), db = sb[i] ? decompose(sb[i]) : null;
    if (da && db) {
      if (da.cho === db.cho) score += 1;
      if (da.jung === db.jung) score += 1;
    }
  });
  return score;
}

// 4챕터: 모양이 헷갈리는 모음 (자물쇠 다이얼, 잠수함 거품용)
export const VOWEL_RIVALS = {
  'ㅐ': ['ㅔ', 'ㅏ', 'ㅓ', 'ㅒ'], 'ㅔ': ['ㅐ', 'ㅓ', 'ㅏ', 'ㅖ'], 'ㅒ': ['ㅖ', 'ㅐ', 'ㅑ', 'ㅔ'], 'ㅖ': ['ㅒ', 'ㅔ', 'ㅕ', 'ㅐ'],
  'ㅝ': ['ㅘ', 'ㅜ', 'ㅓ', 'ㅟ'], 'ㅘ': ['ㅝ', 'ㅗ', 'ㅏ', 'ㅚ'], 'ㅚ': ['ㅙ', 'ㅞ', 'ㅟ', 'ㅗ'], 'ㅙ': ['ㅞ', 'ㅚ', 'ㅗ', 'ㅐ'],
  'ㅞ': ['ㅙ', 'ㅚ', 'ㅜ', 'ㅔ'], 'ㅟ': ['ㅚ', 'ㅢ', 'ㅜ', 'ㅝ'], 'ㅢ': ['ㅟ', 'ㅡ', 'ㅣ', 'ㅚ'],
};
export const vowelRivals = (j) => VOWEL_RIVALS[j] || SIMILAR[j] || [];
// ㅐ ㅔ ㅒ ㅖ 나 복모음이 들어 있는 글자인지 (4챕터 놀이의 핵심 칸)
export const isTrickyVowel = (j) => j in VOWEL_RIVALS;
// 모음만 바꾼 헷갈리는 글자: 개 → 게, 가, 거
export function vowelAlikes(syl, n = 3) {
  const d = decompose(syl);
  if (!d) return [];
  const out = vowelRivals(d.jung).map((j) => compose(d.cho, j, d.jong)).filter((s) => s && s !== syl);
  return out.slice(0, n);
}
