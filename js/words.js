// 챕터별 단어 목록
// cat: basic(받침 없는 기본 글자), compound(복모음)
export const CATS = {
  basic: '받침 없는 글자',
  compound: '복모음 (ㅘ ㅝ ㅚ ㅟ ㅢ ㅙ ㅞ)',
};

export const CHAPTER_WORDS = {
  1: [
    // 받침 없는 기본 글자 (20)
    '우유', '나무', '바나나', '포도', '토마토', '오이', '고구마', '모자', '바지', '치마',
    '구두', '거미', '나비', '오리', '하마', '기차', '피자', '여우', '요요', '휴지',
    // 복모음 (16)
    '사과', '과자', '교과서', '쿼카', '타워', '샤워기', '외투', '회오리', '귀', '쥐',
    '가위', '바위', '의자', '돼지', '스웨터', '왜가리',
  ],
};

const COMPOUND = /[ㅘㅙㅚㅝㅞㅟㅢ]/;
import { decompose } from './hangul.js';

export function catOf(word) {
  return [...word].some((ch) => COMPOUND.test(decompose(ch)?.jung || '')) ? 'compound' : 'basic';
}

export function wordsOf(chapter) {
  return CHAPTER_WORDS[chapter] || CHAPTER_WORDS[1];
}

export const ALL_WORDS = Object.values(CHAPTER_WORDS).flat();
