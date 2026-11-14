// 챕터별 단어 목록
// cat: basic(받침 없는 기본 글자), compound(복모음)
export const CATS = {
  basic: '받침 없는 글자',
  compound: '복모음 (ㅘ ㅝ ㅚ ㅟ ㅢ ㅙ ㅞ)',
  batchim: '받침 있는 글자 (ㄱ ㄴ ㄹ ㅁ ㅂ ㅇ)',
  double: '쌍자음 (ㄲ ㄸ ㅃ ㅆ ㅉ)',
  batchim2: '나머지 받침 (ㅅ ㅈ ㅊ ㅌ ㅍ ㄷ ㅋ)',
};

export const CHAPTERS = {
  1: { name: '동화 숲', progress: '마을 복원' },
  2: { name: '마법 왕국', progress: '마법 왕국 구하기' },
  3: { name: '우주', progress: '우주 구하기' },
};
export const LAST_CHAPTER = 3;

export const CHAPTER_WORDS = {
  1: [
    // 받침 없는 기본 글자 (20)
    '우유', '나무', '바나나', '포도', '토마토', '오이', '고구마', '모자', '바지', '치마',
    '구두', '거미', '나비', '오리', '하마', '기차', '피자', '여우', '요요', '휴지',
    // 복모음 (16)
    '사과', '과자', '교과서', '쿼카', '타워', '샤워기', '외투', '회오리', '귀', '쥐',
    '가위', '바위', '의자', '돼지', '스웨터', '왜가리',
  ],
  2: [
    // 받침 하나로 뜻이 바뀌는 묶음 (공/곰/콩, 밥/밤/발 ...)
    '공', '곰', '콩', '밥', '밤', '발', '달', '별', '물', '문', '산', '손',
    '감', '귤', '집', '컵', '용', '성', '왕관', '공주', '마법사', '지팡이',
    '수박', '보석', '반지', '기린', '우산', '풍선', '연필', '거울', '양말', '사슴',
    '눈사람', '사탕', '가방', '호랑이',
  ],
  3: [
    // 쌍자음 (ㄲ ㄸ ㅃ ㅆ ㅉ) — 좀비괴물이 한쪽을 먹으면 꿀→굴, 빵→방
    '꿀', '꽃', '꼬리', '까치', '깃발', '토끼', '코끼리', '딸기', '땅콩', '똥', '떡', '별똥별',
    '뿔', '빵', '뿌리', '쌀', '씨앗', '짜장면', '찌개', '쓰레기통', '아빠', '까마귀', '꿀벌', '오뚝이',
    // 나머지 받침
    '옷', '붓', '빗', '솥', '잎', '부엌', '젓가락', '숟가락', '곶감', '밭', '숲', '깻잎',
  ],
};

const COMPOUND = /[ㅘㅙㅚㅝㅞㅟㅢ]/;
import { decompose } from './hangul.js';

const DOUBLE_CHO = /[ㄲㄸㅃㅆㅉ]/;
const BASIC_JONG = ['ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅇ'];
export function catOf(word) {
  const ds = [...word].map(decompose);
  if (ds.some((d) => d && DOUBLE_CHO.test(d.cho))) return 'double';
  if (ds.some((d) => d && d.jong && !BASIC_JONG.includes(d.jong))) return 'batchim2';
  if (ds.some((d) => d?.jong)) return 'batchim';
  return [...word].some((ch) => COMPOUND.test(decompose(ch)?.jung || '')) ? 'compound' : 'basic';
}
export const chapterOf = (word) => Number(Object.keys(CHAPTER_WORDS).find((c) => CHAPTER_WORDS[c].includes(word)) || 1);

export function wordsOf(chapter) {
  return CHAPTER_WORDS[chapter] || CHAPTER_WORDS[1];
}

export const ALL_WORDS = Object.values(CHAPTER_WORDS).flat();
