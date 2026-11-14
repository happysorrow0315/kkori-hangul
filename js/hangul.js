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

export function combineVowels(a, b) {
  for (const [k, [x, y]] of Object.entries(VOWEL_SPLIT)) if (x === a && y === b) return k;
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
  'ㅏ': ['ㅓ', 'ㅑ'], 'ㅓ': ['ㅏ', 'ㅕ'], 'ㅑ': ['ㅕ', 'ㅏ'], 'ㅕ': ['ㅑ', 'ㅓ'], 'ㅗ': ['ㅜ', 'ㅛ'],
  'ㅛ': ['ㅠ', 'ㅗ'], 'ㅜ': ['ㅗ', 'ㅠ'], 'ㅠ': ['ㅛ', 'ㅜ'], 'ㅡ': ['ㅣ', 'ㅜ'], 'ㅣ': ['ㅡ', 'ㅏ'],
  'ㅐ': ['ㅔ', 'ㅏ'], 'ㅔ': ['ㅐ', 'ㅓ'], 'ㅘ': ['ㅝ', 'ㅏ'], 'ㅙ': ['ㅞ', 'ㅚ'], 'ㅚ': ['ㅟ', 'ㅙ'],
  'ㅝ': ['ㅘ', 'ㅓ'], 'ㅞ': ['ㅙ', 'ㅔ'], 'ㅟ': ['ㅚ', 'ㅢ'], 'ㅢ': ['ㅡ', 'ㅟ'],
};

// 받침끼리 헷갈리기 쉬운 것
export const SIMILAR_JONG = { 'ㄱ': ['ㅇ', 'ㅂ'], 'ㄴ': ['ㅇ', 'ㅁ', 'ㄹ'], 'ㄹ': ['ㄴ', 'ㅁ'], 'ㅁ': ['ㅂ', 'ㄴ', 'ㅇ'], 'ㅂ': ['ㅁ', 'ㄱ'], 'ㅇ': ['ㄴ', 'ㅁ', 'ㄱ'] };

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
