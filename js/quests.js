// 의뢰(퀘스트)와 이야기
import { S, save, addInv } from './state.js';
import { pickWords, toolLevel, TOOL_NAMES } from './adaptive.js';
import { josa, hasBatchim, decompose, isTrickyVowel } from './hangul.js';
import { LAST_CHAPTER } from './words.js';
import { pick, shuffle } from './ui.js';

// 미니게임 7종. words = 미션 한 번에 나오는 단어 수
export const TYPE_INFO = {
  find: { label: '가게에서 찾기', words: 3 },
  dig: { label: '땅 파서 맞추기', words: 2 },
  trace: { label: '봉인 마법 풀기', words: 1, maxLen: 3 },
  fish: { label: '연못에서 글자 낚시', words: 2 },
  bridge: { label: '글자 다리 만들기', words: 2, maxLen: 3 },
  orb: { label: '마법 구슬 맞추기', words: 2 },
  hidden: { label: '숨은 글자 찾기', words: 1, maxLen: 3 },
  // 3챕터(우주) 새 놀이
  rocket: { label: '로켓 레이스', words: 2, maxLen: 3 },
  alien: { label: '외계인 말 듣기', words: 3, skip: ['짜장면'] },
  twin: { label: '쌍둥이 행성 합치기', words: 2, maxLen: 3, needDouble: true },
  stars: { label: '별자리 잇기', words: 2, maxLen: 3 },
  // 4챕터(바닷속) 새 놀이
  sub: { label: '잠수함 탐험', words: 2, maxLen: 3 },
  lock: { label: '보물상자 자물쇠', words: 2, maxLen: 3, needTricky: true },
  ink: { label: '문어 먹물 지우기', words: 3 },
  shell: { label: '조개 짝 맞추기', words: 3 },
};
export const TYPES = Object.keys(TYPE_INFO);
// 챕터마다 나오는 놀이 (3챕터부터는 그 챕터만의 새 놀이)
export const CH_TYPES = {
  1: ['find', 'dig', 'trace', 'fish', 'bridge', 'orb', 'hidden'],
  2: ['find', 'dig', 'trace', 'fish', 'bridge', 'orb', 'hidden'],
  3: ['find', 'dig', 'trace', 'rocket', 'alien', 'twin', 'stars'],
  4: ['find', 'dig', 'trace', 'sub', 'lock', 'ink', 'shell'],
};
// 마지막 챕터까지 다 깨면: 모든 챕터의 놀이와 글자로 자유 놀이 + 복습
export const reviewMode = () => S.chapter === LAST_CHAPTER && (S.story.cleared || []).includes(LAST_CHAPTER);
export const typesNow = () => (reviewMode() ? TYPES : CH_TYPES[S.chapter] || CH_TYPES[1]);
const hasTricky = (w) => [...w].some((c) => { const d = decompose(c); return d && isTrickyVowel(d.jung); });
export function wordFilter(type) {
  const info = TYPE_INFO[type] || {};
  return (w) => (!info.maxLen || w.length <= info.maxLen) && !(info.skip || []).includes(w)
    && (!info.needTricky || hasTricky(w))
    && (!info.needDouble || /[ㄲㄸㅃㅆㅉ]/.test([...w].map((c) => { const k = c.charCodeAt(0) - 0xac00; return k >= 0 && k < 11172 ? 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'[Math.floor(k / 588)] : ''; }).join('')));
}

// 한 챕터 = 미션 12개 (이야기 8개 + 자유 4개 정도)
export const MISSIONS_PER_CHAPTER = 12;
export const RESTORE_PER_MISSION = 9; // 11번째에 99%, 12번째에 100%

// {A} = 지민아, {I} = 지민이 (뒤에 조사가 붙을 때)
// 처음 시작 중(아직 저장 전)에 쓸 이름
let tempName = null;
export const setTempName = (n) => { tempName = n; };

export function fill(text) {
  const n = S.profile?.name || tempName || '친구';
  return text.replace(/\{A\}/g, josa(n, '아/야')).replace(/\{I\}/g, n + (hasBatchim(n) ? '이' : ''));
}

// 이야기 의뢰: 이야기만 따라가도 7가지 놀이를 모두 해 보게 배치
const STORY1 = [
  {
    id: 's1', at: 0, giver: 'bear', type: 'find', word: '우유', title: '사라진 우유',
    intro: [
      { who: 'bear', text: '헉헉... 큰일 났어! 좀비괴물이 우리 가게 물건 글자를 냠냠 먹어 버렸지 뭐야!' },
      { who: 'bear', text: '글자가 없어진 물건은 스르륵 사라져. 우유가 꼭 필요한데... 어쩌지?' },
      { who: 'kkori', text: '걱정 마세요! {A}, 우리가 좀비괴물보다 먼저 찾아 보자! 글자를 잘 읽으면 찾을 수 있어.' },
    ],
    outro: [
      { who: 'bear', text: '우와! 우유가 돌아왔다! 정말 고마워!' },
      { who: 'kkori', text: '헤헤, 봤지? 글자를 되찾으면 물건이 살아나! 되찾은 물건으로 마을도 꾸밀 수 있어~' },
    ],
  },
  {
    id: 's2', at: 9, giver: 'squirrel', type: 'dig', word: '요요', title: '토리의 요요',
    intro: [
      { who: 'squirrel', text: '으앙~ 내 요요! 좀비괴물이 요요 글자를 땅속에 퉤 뱉어 버렸어!' },
      { who: 'kkori', text: '음~ 그럼 우리가 땅을 파서 글자 조각을 찾아 주자. 할 수 있지?' },
    ],
    outro: [{ who: 'squirrel', text: '야호! 요요가 돌아왔다! 휘리릭~ 고마워, 친구야!' }],
  },
  {
    id: 's3', at: 18, giver: 'rabbit', type: 'fish', word: '오리', title: '연못의 오리',
    intro: [
      { who: 'rabbit', text: '어머나, 연못에 살던 오리가 안 보이지 뭐니.' },
      { who: 'zombie', mood: 'evil', text: '으흐흐~ 오리 글자는 물고기들한테 나눠 줬지롱!' },
      { who: 'kkori', text: '좋았어! 물고기가 들고 있는 글자를 차례로 낚아 보자. 첫 글자부터야!' },
    ],
    outro: [{ who: 'rabbit', text: '꽥꽥! 오리가 돌아왔구나. 고맙다, 아가야~' }],
  },
  {
    id: 's4', at: 27, giver: 'owl', type: 'trace', word: '나무', title: '봉인된 나무',
    intro: [
      { who: 'owl', text: '에헴, 에헴. 마을 나무에 좀비괴물이 봉인 마법을 걸었다네.' },
      { who: 'owl', text: '글자를 순서대로 따라 쓰면 봉인이 풀린다네. 자, 이 마법 지팡이를 받게나.' },
      { who: 'kkori', text: '반짝이는 점에서 시작해서 화살표 쪽으로 쭈욱~ 쓰면 돼!' },
    ],
    outro: [{ who: 'owl', text: '오호! 훌륭하구먼. 나무가 다시 초록색이 되었어.' }],
  },
  {
    id: 's5', at: 36, giver: 'rabbit', type: 'bridge', word: '사과', title: '강 건너 사과',
    intro: [
      { who: 'rabbit', text: '할미가 사과 파이를 구우려는데, 사과나무가 강 건너에 있단다.' },
      { who: 'zombie', mood: 'evil', text: '다리는 내가 다 먹어 버렸지! 냠냠, 바삭바삭~' },
      { who: 'kkori', text: '그럼 글자 블록으로 다리를 새로 만들자! 좀비괴물이 오기 전에 빨리!' },
    ],
    outro: [{ who: 'rabbit', text: '세상에, 다리까지 만들었구나! 파이 다 구워지면 꼭 놀러 오렴~' }],
  },
  {
    id: 's6', at: 45, giver: 'squirrel', type: 'hidden', word: '과자', title: '숨은 과자',
    intro: [
      { who: 'squirrel', text: '킁킁... 과자 냄새는 나는데, 글자가 그림 속에 꼭꼭 숨었대!' },
      { who: 'kkori', text: '눈을 크게 뜨고 찾아 보자. 어? ㅗ랑 ㅏ를 찾으면 둘이 합쳐져서 ㅘ가 된대!' },
    ],
    outro: [{ who: 'squirrel', text: '바삭바삭! 과자 찾았다! 너 정말 눈이 좋구나?' }],
  },
  {
    id: 's7', at: 54, giver: 'owl', type: 'orb', word: '회오리', title: '회오리를 멈춰라',
    intro: [
      { who: 'zombie', mood: 'evil', text: '회오리~ 회오리~ 마을을 몽땅 날려 버릴 테다!' },
      { who: 'owl', text: '이런! 회오리 글자 구슬을 순서대로 맞히면 회오리를 멈출 수 있다네!' },
      { who: 'kkori', text: '회에는 ㅗ와 ㅣ가 합쳐진 ㅚ가 들어 있어. 천천히, 하나씩 맞혀 보자!' },
    ],
    outro: [{ who: 'owl', text: '휴우~ 회오리가 잠잠해졌어. 자네 덕분이네!' }],
  },
  {
    id: 's8', at: 63, giver: 'bear', type: 'trace', word: '돼지', title: '돼지 저금통',
    intro: [
      { who: 'bear', text: '이를 어째... 가게 돼지 저금통에 봉인이 걸렸어.' },
      { who: 'zombie', mood: 'evil', text: '흥! 그 봉인은 아무도 못 풀걸?' },
      { who: 'kkori', text: '{I}라면 풀 수 있어! ㅙ는 ㅗ와 ㅐ가 합쳐진 거야.' },
    ],
    outro: [
      { who: 'bear', text: '꿀꿀~ 돼지가 돌아왔다! 정말 대단해!' },
      { who: 'kkori', text: '마을이 거의 다 살아났어! 조금만 더 힘내자, 아자아자!' },
    ],
  },
];

// ───── 2챕터: 마법 왕국 (받침) ─────
const STORY2 = [
  {
    id: 'c2s1', at: 0, giver: 'fairy', type: 'find', word: '왕관', title: '사라진 왕관',
    intro: [
      { who: 'fairy', text: '어서 와요! 여기는 마법 왕국이에요. 그런데... 큰일이 났어요!' },
      { who: 'zombie', mood: 'eat', text: '으흐흐~ 받침은 바삭바삭 제일 맛있다구! 냠냠!' },
      { who: 'fairy', text: '좀비괴물이 받침을 먹어서 왕관이 와과가 돼 버렸어요. 마법 상점에서 왕관을 찾아 주세요!' },
      { who: 'kkori', text: '받침은 글자 아래에 붙는 자음이야. 왕관에는 ㅇ 받침이랑 ㄴ 받침이 있어! 잘 읽어 보자~' },
    ],
    outro: [
      { who: 'fairy', text: '우와, 왕관이 반짝반짝 돌아왔어요! 고마워요!' },
      { who: 'kkori', text: '헤헤, 받침이 있어야 진짜 왕관이지!' },
    ],
  },
  {
    id: 'c2s2', at: 9, giver: 'dragon', type: 'dig', word: '용', title: '용용이의 이름',
    intro: [
      { who: 'dragon', text: '으앙~ 내 이름 용에서 ㅇ 받침이 사라져서, 다들 나를 요라고 불러!' },
      { who: 'kkori', text: '걱정 마! 땅속에서 ㅇ을 찾아서 아래 받침 칸에 붙여 주자.' },
    ],
    outro: [{ who: 'dragon', text: '야호! 이제 다시 용용이다! 크앙~ 고마워!' }],
  },
  {
    id: 'c2s3', at: 18, giver: 'fairy', type: 'fish', word: '사탕', title: '연못의 사탕',
    intro: [
      { who: 'fairy', text: '성 앞 연못 물고기들이 사탕 글자를 물고 도망갔어요!' },
      { who: 'kkori', text: '사랑 탕을 차례로 낚아 보자. 타랑 탕은 받침 하나 차이니까 잘 봐야 해~' },
    ],
    outro: [{ who: 'fairy', text: '달콤한 사탕이 돌아왔어요! 하나 드릴까요? 헤헤.' }],
  },
  {
    id: 'c2s4', at: 27, giver: 'owl', type: 'trace', word: '별', title: '사라진 별',
    intro: [
      { who: 'owl', text: '에헴, 왕국의 밤하늘에서 별이 사라졌다네. 봉인을 풀어야 해.' },
      { who: 'kkori', text: '별은 ㅂ, ㅕ를 쓰고 아래에 받침 ㄹ을 써! 받침은 맨 마지막에 쓰는 거야.' },
    ],
    outro: [{ who: 'owl', text: '오호, 별이 다시 반짝이는구먼!' }],
  },
  {
    id: 'c2s5', at: 36, giver: 'dragon', type: 'bridge', word: '공주', title: '공주님 구하기',
    intro: [
      { who: 'dragon', text: '공주님이 성에 갇혔어! 다리가 무너져서 갈 수가 없어.' },
      { who: 'zombie', mood: 'evil', text: '공주? 받침을 먹었으니 이제 고주지롱~' },
      { who: 'kkori', text: '그럼 글자 블록으로 다리를 만들어서 공주님을 구하자! 받침 있는 블록을 잘 골라~' },
    ],
    outro: [{ who: 'dragon', text: '공주님을 구했다! 너 정말 용감하다!' }],
  },
  {
    id: 'c2s6', at: 45, giver: 'fairy', type: 'hidden', word: '반지', title: '숨은 마법 반지',
    intro: [
      { who: 'fairy', text: '제 마법 반지가 그림 속에 꼭꼭 숨었어요. 받침 ㄴ도 숨어 있대요!' },
      { who: 'kkori', text: '음~ 반지는 ㅂ, ㅏ, 받침 ㄴ, 그리고 ㅈ, ㅣ야. 같이 찾아보자!' },
    ],
    outro: [{ who: 'fairy', text: '찾았다! 정말 고마워요! 헤헤.' }],
  },
  {
    id: 'c2s7', at: 54, giver: 'owl', type: 'orb', word: '마법사', title: '날아간 마법사',
    intro: [
      { who: 'owl', text: '큰일이네! 왕국 마법사의 글자가 구슬이 되어 날아다닌다네.' },
      { who: 'kkori', text: '법에는 받침 ㅂ이 있어. 첫소리, 가운데소리 다음에 받침을 맞히면 돼!' },
    ],
    outro: [{ who: 'owl', text: '마법사가 돌아왔다네! 고맙네, 꼬마 마법사!' }],
  },
  {
    id: 'c2s8', at: 63, giver: 'dragon', type: 'find', word: '거울', title: '마법 거울',
    intro: [
      { who: 'dragon', text: '좀비괴물이 성의 마법 거울도 노리고 있어!' },
      { who: 'zombie', mood: 'evil', text: '거울아 거울아~ 받침은 누가 제일 맛있니? 으하하!' },
      { who: 'kkori', text: '거울에는 받침 ㄹ이 있어. 좀비괴물보다 먼저 찾자, 아자!' },
    ],
    outro: [
      { who: 'dragon', text: '휴~ 마법 거울을 지켰어!' },
      { who: 'kkori', text: '마법 왕국이 거의 다 살아났어! 조금만 더 힘내자~' },
    ],
  },
];

// ───── 3챕터: 우주 (쌍자음, 나머지 받침) ─────
const STORY3 = [
  {
    id: 'c3s1', at: 0, giver: 'alien', type: 'rocket', word: '빵', title: '우주 빵집',
    intro: [
      { who: 'alien', text: '뿅뿅! 지구 친구 안녕! 큰일 났어. 좀비괴물이 우주에 나타났어!' },
      { who: 'zombie', mood: 'eat', text: '쌍둥이 글자는 한 입에 하나씩! 냠냠~ 빵이 방이 됐지롱!' },
      { who: 'kkori', text: '빵에는 ㅂ이 두 개 붙은 쌍둥이 글자 ㅃ이 있어. 로켓을 타고 빵 글자 별을 잡자!' },
    ],
    outro: [{ who: 'alien', text: '뿅! 고소한 빵이 돌아왔어! 고마워!' }],
  },
  {
    id: 'c3s2', at: 9, giver: 'robot', type: 'alien', word: '꿀', title: '외계인의 말',
    intro: [
      { who: 'robot', text: '삐빅. 외계인 친구 말을 듣고 맞는 문을 열어야 해. 꿀? 굴? 쿨?' },
      { who: 'kkori', text: 'ㄲ은 힘을 꽉 주어서 내는 소리야. 귀를 쫑긋 세우고 잘 들어 봐!' },
    ],
    outro: [{ who: 'robot', text: '삐삐! 정답! 너는 소리를 정말 잘 듣는구나.' }],
  },
  {
    id: 'c3s3', at: 18, giver: 'alien', type: 'twin', word: '딸기', title: '쌍둥이 행성',
    intro: [
      { who: 'alien', text: '딸기가 달기가 됐어! ㄸ의 쌍둥이 한쪽이 사라졌대.' },
      { who: 'kkori', text: 'ㄷ 행성 두 개를 끌어서 붙이면 ㄸ이 돼! 그다음 차례대로 눌러 보자~' },
    ],
    outro: [{ who: 'alien', text: '새콤달콤 딸기 완성! 쌍둥이 행성 최고!' }],
  },
  {
    id: 'c3s4', at: 27, giver: 'robot', type: 'stars', word: '토끼', title: '달토끼 별자리',
    intro: [
      { who: 'robot', text: '삐빅. 밤하늘의 달토끼 별자리가 흩어졌다.' },
      { who: 'kkori', text: '토끼를 쓰는 순서대로 별을 이어 보자. ㅌ, ㅗ, ㄲ, ㅣ!' },
    ],
    outro: [{ who: 'robot', text: '별자리 복구 완료. 반짝반짝 예쁘다, 삐삐!' }],
  },
  {
    id: 'c3s5', at: 36, giver: 'alien', type: 'find', word: '떡', title: '우주 정거장 가게',
    intro: [
      { who: 'alien', text: '우주 정거장 가게에서 떡을 찾아 줘! 덕이랑 헷갈리면 안 돼~' },
      { who: 'zombie', mood: 'evil', text: '떡? 쫄깃쫄깃 맛있겠다! 내가 먼저 찾을 테다!' },
    ],
    outro: [{ who: 'alien', text: '쫀득쫀득 떡이다! 같이 먹자, 뿅!' }],
  },
  {
    id: 'c3s6', at: 45, giver: 'robot', type: 'dig', word: '씨앗', title: '달 표면의 씨앗',
    intro: [
      { who: 'robot', text: '달 표면 아래에 씨앗이 묻혀 있다. 삐빅, 발굴 시작!' },
      { who: 'kkori', text: '씨에는 쌍둥이 ㅆ, 앗에는 받침 ㅅ이 있어. 땅을 파서 찾아보자!' },
    ],
    outro: [{ who: 'robot', text: '씨앗을 우주 화분에 심었다. 쑥쑥 자라라, 삐삐!' }],
  },
  {
    id: 'c3s7', at: 54, giver: 'alien', type: 'trace', word: '꽃', title: '우주 꽃밭',
    intro: [
      { who: 'alien', text: '우주 꽃밭의 꽃에 좀비괴물이 봉인을 걸었어!' },
      { who: 'kkori', text: '꽃은 ㄲ, ㅗ를 쓰고 아래에 받침 ㅊ을 써. 천천히 따라 써 보자~' },
    ],
    outro: [{ who: 'alien', text: '꽃이 활짝 피었어! 향기가 우주까지 퍼진다~' }],
  },
  {
    id: 'c3s8', at: 63, giver: 'robot', type: 'rocket', word: '코끼리', title: '우주 코끼리',
    intro: [
      { who: 'robot', text: '삐빅! 우주 코끼리가 고기리가 될 위기다!' },
      { who: 'zombie', mood: 'evil', text: '코끼리 코에 있는 쌍둥이 ㄲ, 내가 냠냠 할 거야!' },
      { who: 'kkori', text: '코, 끼, 리! 로켓을 타고 차례대로 잡자. 아자!' },
    ],
    outro: [
      { who: 'robot', text: '우주 코끼리 구조 완료! 삐삐삐!' },
      { who: 'kkori', text: '우주가 거의 다 살아났어! 조금만 더 힘내자~' },
    ],
  },
];

// ───── 4챕터: 바닷속 (ㅐ ㅔ ㅒ ㅖ, 복모음) ─────
const STORY4 = [
  {
    id: 'c4s1', at: 0, giver: 'mermaid', type: 'sub', word: '고래', title: '고래를 구해 줘',
    intro: [
      { who: 'mermaid', text: '안녕! 나는 인어 아라야. 큰일 났어! 좀비괴물이 바닷속 모음을 뒤죽박죽 섞어 버렸어!' },
      { who: 'zombie', mood: 'eat', text: '으흐흐~ 고래를 고레로 바꿔 버렸지롱! 꼬르륵~' },
      { who: 'kkori', text: '고래의 래는 ㄹ에 ㅐ야. ㅏ에 ㅣ를 붙인 ㅐ! 잠수함을 타고 고, 래 거품을 차례로 모으자!' },
    ],
    outro: [{ who: 'mermaid', text: '고래가 돌아왔어! 푸우~ 물을 뿜으면서 고맙대!' }],
  },
  {
    id: 'c4s2', at: 9, giver: 'turtle', type: 'lock', word: '조개', title: '거북 할아버지의 보물상자',
    intro: [
      { who: 'turtle', text: '허허, 내 보물상자 비밀번호는 조개란다. 그런데 좀비괴물이 다이얼을 마구 돌려 놨지 뭐냐.' },
      { who: 'kkori', text: '다이얼을 돌려서 모음을 맞추면 상자가 열려! 개는 ㅏ에 ㅣ를 붙인 ㅐ야. 아이 애!' },
    ],
    outro: [{ who: 'turtle', text: '허허허, 상자가 열렸구나! 진주를 하나 주마. 고맙다, 꼬마 친구!' }],
  },
  {
    id: 'c4s3', at: 18, giver: 'mermaid', type: 'ink', word: '게', title: '먹물 속 글자',
    intro: [
      { who: 'mermaid', text: '좀비괴물을 보고 문어가 깜짝 놀라서 먹물을 뿜었어! 글자가 다 가려졌어.' },
      { who: 'kkori', text: '먹물을 쓱쓱 지우고 글자를 읽어 봐. 개일까, 게일까? ㅓ에 ㅣ를 붙이면 ㅔ, 어이 에! 집게발 게는 ㅔ야!' },
    ],
    outro: [{ who: 'mermaid', text: '맞아, 그건 집게발 게야! 딸깍딸깍~ 게도 고맙대!' }],
  },
  {
    id: 'c4s4', at: 27, giver: 'turtle', type: 'shell', word: '개', title: '조개 속 짝꿍',
    intro: [
      { who: 'turtle', text: '조개마다 그림이나 글자가 하나씩 숨어 있단다. 그림과 글자 짝을 찾아 주겠니?' },
      { who: 'zombie', mood: 'evil', text: '멍멍 개랑 딸깍 게를 섞어 놨지! 헷갈릴걸? 으하하!' },
      { who: 'kkori', text: '괜찮아! 멍멍 개는 ㅐ, 집게발 게는 ㅔ. 글자 모양을 잘 보면 돼!' },
    ],
    outro: [{ who: 'turtle', text: '허허, 짝을 다 찾았구나. 눈이 아주 밝구나!' }],
  },
  {
    id: 'c4s5', at: 36, giver: 'mermaid', type: 'find', word: '케이크', title: '인어의 생일 케이크',
    intro: [
      { who: 'mermaid', text: '오늘은 내 생일이야! 그런데 조개 가게에 있던 케이크를 좀비괴물이 노리고 있어!' },
      { who: 'kkori', text: '케이크의 케는 ㅋ에 ㅔ! 좀비괴물보다 먼저 찾자!' },
    ],
    outro: [{ who: 'mermaid', text: '케이크를 지켰다! 같이 먹자~ 생일 축하 노래도 불러 줄래?' }],
  },
  {
    id: 'c4s6', at: 45, giver: 'turtle', type: 'dig', word: '새우', title: '모래 속 새우',
    intro: [
      { who: 'turtle', text: '새우가 모래 속에 숨었는데 글자가 조각조각 흩어졌단다.' },
      { who: 'kkori', text: '모래를 파면 ㅏ랑 ㅣ가 따로 나올 수도 있어. ㅏ 다음에 ㅣ를 붙이면 ㅐ가 돼!' },
    ],
    outro: [{ who: 'turtle', text: '새우가 톡톡 튀어나왔구나! 잘했다, 잘했어.' }],
  },
  {
    id: 'c4s7', at: 54, giver: 'mermaid', type: 'trace', word: '시계', title: '멈춘 시계',
    intro: [
      { who: 'mermaid', text: '바닷속 시계가 멈췄어! 좀비괴물이 봉인을 걸었대.' },
      { who: 'kkori', text: '계에는 ㅖ가 있어. ㅕ에 ㅣ를 붙인 거야! 순서대로 따라 쓰면 시계가 다시 째깍째깍!' },
    ],
    outro: [{ who: 'mermaid', text: '째깍째깍~ 시계가 다시 움직여! 고마워!' }],
  },
  {
    id: 'c4s8', at: 63, giver: 'turtle', type: 'lock', word: '원숭이', title: '원숭이의 보물',
    intro: [
      { who: 'turtle', text: '배를 타고 놀러 온 원숭이가 보물상자를 열지 못해서 울고 있단다.' },
      { who: 'zombie', mood: 'evil', text: '원숭이? 내가 온숭이로 바꿔 놨지! 으하하~' },
      { who: 'kkori', text: '원의 ㅝ는 ㅜ에 ㅓ를 붙인 거야. 우어, 워! 다이얼을 잘 돌려 보자!' },
    ],
    outro: [
      { who: 'turtle', text: '원숭이가 신나서 바나나를 나눠 주는구나. 허허!' },
      { who: 'kkori', text: '바닷속이 거의 다 살아났어! 조금만 더 힘내자~' },
    ],
  },
];

export const STORIES = { 1: STORY1, 2: STORY2, 3: STORY3, 4: STORY4 };
export const STORY = [...STORY1, ...STORY2, ...STORY3, ...STORY4];

// 새 챕터로 넘어갈 때 이야기
export const CHAPTER_INTRO = {
  4: [
    { who: 'owl', text: '에헴! 좀비괴물이 이번엔 잠수함을 타고 바닷속으로 들어갔다네!' },
    { who: 'kkori', mood: 'wow', text: '{A}! 바닷속으로 출발! 좀비괴물이 ㅐ랑 ㅔ를 뒤죽박죽 섞어 놓는대!' },
    { who: 'kkori', text: 'ㅐ는 ㅏ에 ㅣ를 붙여서 아이 애, ㅔ는 ㅓ에 ㅣ를 붙여서 어이 에! 소리는 비슷해도 모양이 달라.' },
    { who: 'kkori', text: '그래서 뜻을 보고 구별해야 해. 멍멍 개는 ㅐ, 집게발 게는 ㅔ! 같이 기억해 보자~' },
  ],
  3: [
    { who: 'owl', text: '에헴! 좀비괴물이 이번엔 로켓을 타고 우주로 날아갔다네!' },
    { who: 'kkori', mood: 'wow', text: '{A}! 우리도 우주로 출발하자! 좀비괴물이 쌍둥이 글자를 노린대!' },
    { who: 'kkori', text: 'ㄲ, ㄸ, ㅃ, ㅆ, ㅉ처럼 같은 자음 두 개가 붙은 글자가 쌍둥이 글자야. 한쪽을 먹으면 꿀이 굴이 돼 버려!' },
  ],
  2: [
    { who: 'owl', text: '에헴! 큰일이네. 좀비괴물이 하늘을 날아서 마법 왕국으로 갔다네!' },
    { who: 'kkori', mood: 'wow', text: '{A}! 이번엔 마법 왕국으로 가자! 좀비괴물이 받침을 노린대!' },
    { who: 'kkori', text: '받침은 글자 아래에 붙는 자음이야. 곰에서 ㅁ 받침이 없어지면... 고가 돼 버려! 우리가 지켜 주자~' },
  ],
};

// 진행도 25/50/75/100%에 나오는 이야기와 선물
export const MILESTONES = {
  1: {
    25: [{ who: 'kkori', mood: 'wow', text: '우와~ 마을 복원 25%! 봐 봐, 꽃이 피기 시작했어!' }],
    50: [{ who: 'kkori', mood: 'wow', text: '야호! 마을 복원 50%! 놀이터가 열렸어. 이제 놀이터에도 물건을 놓을 수 있어~' }],
    75: [{ who: 'kkori', mood: 'wow', text: '오오! 마을 복원 75%! 하늘에 무지개가 떴어!' }],
    100: [
      { who: 'kkori', mood: 'wow', text: '해냈다! 마을이 다 살아났어! 그런데... 어디서 으르렁 소리가 들려.' },
      { who: 'zombie', mood: 'evil', text: '누가 내 글자를 다 되찾았어?! 게시판에서 기다리고 있겠다!' },
    ],
  },
  2: {
    25: [{ who: 'fairy', text: '마법 왕국 25%! 고마운 마음을 담아 마법 가로등 두 개를 선물할게요. 꾸미기에서 놓아 보세요!' }],
    50: [{ who: 'kkori', mood: 'wow', text: '야호! 마법 왕국 50%! 우리 마을에도 작은 성이 생겼어!' }],
    75: [{ who: 'dragon', text: '마법 왕국 75%! 크앙~ 내가 아끼는 분수를 선물로 줄게!' }],
    100: [
      { who: 'kkori', mood: 'wow', text: '해냈다! 마법 왕국이 다 살아났어! 그런데... 또 으르렁 소리가?' },
      { who: 'zombie', mood: 'evil', text: '받침을 다 돌려놓다니! 게시판에서 기다리겠다!' },
    ],
  },
};
MILESTONES[3] = {
  25: [{ who: 'alien', text: '우주 25%! 뿅뿅~ 고마워서 반짝이 꽃밭을 선물할게!' }],
  50: [{ who: 'kkori', mood: 'wow', text: '야호! 우주 50%! 우리 기지에 별이 더 많이 떴어!' }],
  75: [{ who: 'robot', text: '우주 75%. 삐빅, 감사의 뜻으로 벤치를 선물한다.' }],
  100: [
    { who: 'kkori', mood: 'wow', text: '해냈다! 우주가 다 살아났어! 그런데... 어디서 으르렁 소리가?' },
    { who: 'zombie', mood: 'evil', text: '쌍둥이 글자를 다 돌려놓다니! 게시판에서 기다리겠다!' },
  ],
};
MILESTONES[4] = {
  25: [{ who: 'mermaid', text: '바닷속 25%! 고마워서 꽃밭을 선물할게!' }],
  50: [{ who: 'kkori', mood: 'wow', text: '야호! 바닷속 50%! 물고기들이 다시 헤엄치기 시작했어!' }],
  75: [{ who: 'turtle', text: '바닷속 75%로구나. 허허, 내가 아끼는 분수를 선물로 주마.' }],
  100: [
    { who: 'kkori', mood: 'wow', text: '해냈다! 바닷속이 다 살아났어! 그런데... 꼬르륵 소리가?' },
    { who: 'zombie', mood: 'evil', text: 'ㅐ랑 ㅔ를 다 돌려놓다니! 게시판에서 기다리겠다. 이번이 진짜 마지막이야!' },
  ],
};
export const MILESTONE_GIFTS = { 2: { 25: ['decor:lamp', 2], 75: ['decor:fountain', 1] }, 3: { 25: ['decor:flowers', 2], 75: ['decor:bench', 1] }, 4: { 25: ['decor:flowers', 2], 75: ['decor:fountain', 1] } };

// 보스 대결 대사 (run: 좀비괴물이 도망가는 장면)
export const BOSS_TALK = {
  1: {
    intro: [
      { who: 'zombie', mood: 'evil', text: '으아아! 마을이 다 살아났잖아! 가만두지 않겠다!' },
      { who: 'kkori', text: '{A}, 드디어 마지막 대결이야! 세 가지 미션을 모두 이기자, 아자!' },
    ],
    outro: [
      { who: 'zombie', mood: 'sad', text: '으앙... 내가 졌어. 글자가 너무 맛있어서 그랬단 말이야...' },
      { who: 'kkori', text: '좀비괴물아~ 글자는 먹는 게 아니라 읽는 거야!' },
      { who: 'zombie', mood: 'evil', text: '흥! 다음엔 마법 왕국의 받침을 먹으러 갈 테다! 으하하~', run: true },
      { who: 'kkori', mood: 'wow', text: '{A}! 우리가 동화 숲 마을을 지켰어! 1챕터 클리어야!' },
    ],
  },
  2: {
    intro: [
      { who: 'zombie', mood: 'evil', text: '받침을 다 돌려놓다니! 이번엔 진짜 화났다!' },
      { who: 'kkori', text: '{A}, 마법 왕국의 마지막 대결이야! 받침을 지키자, 아자!' },
    ],
    outro: [
      { who: 'zombie', mood: 'sad', text: '히잉... 받침이 너무 바삭해서 그랬단 말이야...' },
      { who: 'kkori', text: '좀비괴물아~ 받침은 먹는 게 아니라, 글자를 완성해 주는 거야!' },
      { who: 'zombie', mood: 'evil', text: '흥! 그럼 우주로 가서 쌍둥이 글자를 먹을 테다! 으하하~', run: true },
      { who: 'kkori', mood: 'wow', text: '{A}! 마법 왕국도 지켰어! 2챕터 클리어야!' },
    ],
  },
};

BOSS_TALK[3] = {
  intro: [
    { who: 'zombie', mood: 'evil', text: '쌍둥이 글자를 다 돌려놓다니! 우주 끝까지 쫓아왔구나!' },
    { who: 'kkori', text: '{A}, 우주의 마지막 대결이야! 쌍둥이 글자를 지키자, 아자!' },
  ],
  outro: [
    { who: 'zombie', mood: 'sad', text: '히잉... 쌍둥이 글자는 두 개라서 두 배로 맛있단 말이야...' },
    { who: 'kkori', text: '좀비괴물아~ 쌍둥이 글자는 둘이 꼭 붙어 있어야 해. 떼어 놓으면 안 돼!' },
    { who: 'zombie', mood: 'evil', text: '흥! 그럼 바닷속으로 가서 헷갈리는 모음 ㅐ랑 ㅔ를 먹을 테다! 꼬르륵~', run: true },
    { who: 'kkori', mood: 'wow', text: '{A}! 우주도 지켰어! 3챕터 클리어야!' },
  ],
};

BOSS_TALK[4] = {
  intro: [
    { who: 'zombie', mood: 'evil', text: '바닷속까지 쫓아왔구나! 이번이 진짜 진짜 마지막 대결이다!' },
    { who: 'kkori', text: '{A}, 정말 마지막 대결이야! 지금까지 배운 글자 실력을 다 보여 주자, 아자!' },
  ],
  outro: [
    { who: 'zombie', mood: 'sad', text: '으앙... 또 졌어. 사실은... 나도 글자를 읽고 싶었단 말이야.' },
    { who: 'zombie', mood: 'sad', text: '글자를 못 읽으니까 다들 나랑 안 놀아 줬어. 글자를 몽땅 먹어 버리면 다들 나처럼 될 줄 알았지...' },
    { who: 'kkori', text: '그랬구나... 좀비괴물아, 글자는 먹는 게 아니라 같이 읽는 거야.' },
    { who: 'me', text: '좀비괴물아, 우리랑 친구 하자! 글자 읽는 거 내가 알려 줄게.' },
    { who: 'zombie', mood: 'happy', text: '정말? 나랑 친구 해 줄 거야? 고마워! 이제 글자 안 먹을게. 대신 같이 읽을래!' },
    { who: 'kkori', mood: 'wow', text: '{A}! 우리가 해냈어! 동화 숲, 마법 왕국, 우주, 바닷속까지 모두 지켰어! 대모험 끝!' },
  ],
};

const GIVERS_BY_CH = {
  1: {
    find: ['bear', 'rabbit'], dig: ['squirrel', 'owl'], trace: ['owl', 'rabbit'], fish: ['rabbit', 'squirrel'],
    bridge: ['bear', 'squirrel'], orb: ['owl', 'bear'], hidden: ['squirrel', 'rabbit'],
  },
  2: {
    find: ['fairy', 'bear'], dig: ['dragon', 'squirrel'], trace: ['owl', 'fairy'], fish: ['dragon', 'rabbit'],
    bridge: ['dragon', 'bear'], orb: ['owl', 'fairy'], hidden: ['fairy', 'squirrel'],
  },
  3: {
    find: ['alien', 'robot'], dig: ['robot', 'alien'], trace: ['alien', 'owl'],
    rocket: ['alien', 'robot'], alien: ['robot', 'alien'], twin: ['alien', 'robot'], stars: ['robot', 'owl'],
  },
  4: {
    find: ['mermaid', 'turtle'], dig: ['turtle', 'mermaid'], trace: ['mermaid', 'owl'],
    sub: ['mermaid', 'turtle'], lock: ['turtle', 'mermaid'], ink: ['mermaid', 'turtle'], shell: ['turtle', 'mermaid'],
  },
};
// 지금 챕터에 없는 놀이(자유 놀이)는 그 놀이가 나왔던 챕터의 주민이 부탁
const giversFor = (t) => (GIVERS_BY_CH[S.chapter] || {})[t] || [4, 3, 2, 1].map((c) => GIVERS_BY_CH[c][t]).find(Boolean) || ['bear'];

export const isCleared = (ch = S.chapter) => (S.story.cleared || []).includes(ch);

// 마을 모습: 1챕터는 복원도대로, 2챕터부터는 다 살아난 마을 + 성
export function villageLook() {
  const ch = S.chapter;
  const restore = ch > 1 ? 100 : S.restore;
  return {
    restore,
    gray: (100 - restore) * 0.9,
    opts: { banner: ch === 1, theme: ch, castle: ch === 1 && isCleared(2) },
  };
}

function questText(type, w) {
  switch (type) {
    case 'find': return pick(['큰일이야! 좀비괴물이 가게 물건 글자를 먹어 버렸어. 먼저 찾아 줄래?', '가게 물건이 자꾸 사라져! 좀비괴물보다 빨리 찾아 줘~']);
    case 'dig': return `땅속에 ${w} 글자 조각이 묻혀 있어! 쓱싹쓱싹 파내서 맞춰 줄래?`;
    case 'trace': return `어머나, ${w}에 봉인 마법이 걸렸어! 글자를 따라 써서 풀어 줘!`;
    case 'fish': return `연못 물고기들이 ${w} 글자를 하나씩 물고 갔어. 낚아 줄래?`;
    case 'bridge': return '강을 건너야 하는데 다리가 없어! 글자 블록으로 다리를 만들어 줘~';
    case 'orb': return `${w} 글자가 마법 구슬이 되어 날아다녀! 순서대로 맞혀 줘!`;
    case 'hidden': return `${w} 글자가 그림 속에 꼭꼭 숨었어. 같이 찾아 볼래?`;
    case 'rocket': return '로켓을 타고 우주를 날며 글자 별을 모아 줘! 운석은 조심~';
    case 'alien': return '외계인 친구가 무슨 말을 하는지 잘 듣고 맞는 문을 열어 줘!';
    case 'twin': return `${w}에 필요한 쌍둥이 행성을 합쳐서 글자를 만들어 줘!`;
    case 'stars': return `${w} 별자리가 흩어졌어! 별을 순서대로 이어 줘~`;
    case 'sub': return '잠수함을 타고 글자 거품을 모아 줘! 해파리는 조심~';
    case 'lock': return '보물상자 비밀번호는 그림의 이름이야! 다이얼을 돌려서 열어 줘~';
    case 'ink': return '문어가 깜짝 놀라서 먹물을 뿜었어! 먹물을 지우고 무슨 글자인지 읽어 줘~';
    case 'shell': return '조개 속에 그림과 글자가 숨어 있어. 짝꿍을 찾아 줘!';
  }
  return '';
}

let qid = Date.now();
export function makeQuest(type, used = []) {
  const info = TYPE_INFO[type];
  const exclude = used.flatMap((q) => q.words);
  const words = pickWords(info.words, exclude, wordFilter(type));
  return { id: 'q' + qid++, type, words, giver: pick(giversFor(type)), text: questText(type, words[0]) };
}

const storiesNow = () => STORIES[S.chapter] || [];
export const nextStory = () => storiesNow().find((s) => !S.story.done.includes(s.id) && S.restore >= s.at);
export const bossReady = () => S.restore >= 100 && !isCleared() && storiesNow().every((s) => S.story.done.includes(s.id));

function storyQuest(s) {
  const info = TYPE_INFO[s.type];
  const extra = pickWords(info.words - 1, [s.word], wordFilter(s.type));
  return { id: 'story-' + s.id, type: s.type, words: [s.word, ...extra], giver: s.giver, text: s.intro[0].text, story: s.id, title: s.title };
}

// 게시판: 이야기 의뢰 1개 + 서로 다른 놀이 2~3개 (방금 한 놀이는 빼고 무작위)
export function refreshBoard(force = false) {
  let normal = force ? [] : S.board.filter((q) => !q.story && !q.boss && typesNow().includes(q.type));
  const s = nextStory();
  const want = s ? 2 : 3;
  const recent = S.recentTypes || [];
  const avoid = new Set([...recent.slice(-2), s?.type].filter(Boolean));
  normal = normal.filter((q) => !avoid.has(q.type)).slice(0, want);
  const pool = shuffle(typesNow().filter((t) => !avoid.has(t) && !normal.some((q) => q.type === t)));
  while (normal.length < want && pool.length) normal.push(makeQuest(pool.shift(), normal));
  const out = [...normal];
  // 이미 올라온 이야기 카드는 그대로 (예전 버전 카드라 내용이 다르면 새로 만듦)
  if (s) out.unshift(S.board.find((q) => q.story === s.id && q.type === s.type && q.words[0] === s.word) || storyQuest(s));
  if (bossReady()) out.unshift({ id: 'boss-' + S.chapter, boss: true, type: 'boss', words: [], giver: 'zombie', text: '좀비괴물이 마지막 대결을 하자고 해!', title: '좀비괴물과 대결' });
  S.board = out;
  save();
  return out;
}

export function starsFor(r) {
  if (!r.ok) return 0;
  if (!r.mistakes && !r.hinted) return 3;
  return r.mistakes <= 1 ? 2 : 1;
}

// 미션 결과를 저장하고 보상 요약을 돌려줌
export function applyResults(q, res) {
  const sum = { items: [], stars: 0, restoreBefore: S.restore, restoreGain: 0, upgrades: [], newDex: [], milestones: [] };
  for (const r of res.words) {
    if (!r.ok) continue;
    r.stars = starsFor(r);
    sum.stars += r.stars;
    addInv('word:' + r.w);
    sum.items.push(r);
    if (!S.dex[r.w]) { S.dex[r.w] = Date.now(); sum.newDex.push(r.w); }
  }
  if (sum.items.length && !q.boss) {
    S.restore = Math.min(100, S.restore + RESTORE_PER_MISSION);
    sum.restoreGain = S.restore - sum.restoreBefore;
    for (const m of [25, 50, 75, 100]) if (sum.restoreBefore < m && S.restore >= m) {
      sum.milestones.push(m);
      const gift = MILESTONE_GIFTS[S.chapter]?.[m];
      if (gift) addInv(gift[0], gift[1]);
    }
  }
  S.stars += sum.stars;
  if (TOOL_NAMES[q.type] && sum.items.length) {
    const before = toolLevel(q.type);
    S.tools[q.type] = (S.tools[q.type] || 0) + 1;
    const after = toolLevel(q.type);
    if (after > before) sum.upgrades.push({ type: q.type, level: after });
  }
  if (TYPE_INFO[q.type]) S.recentTypes = [...(S.recentTypes || []), q.type].slice(-3);
  S.missionsDone++;
  if (q.story && sum.items.length && !S.story.done.includes(q.story)) S.story.done.push(q.story);
  if (q.boss) {
    S.story.bossDone = true;
    S.story.chapterClear = true;
    S.story.cleared = [...new Set([...(S.story.cleared || []), S.chapter])];
  }
  refreshBoard(true);
  save();
  return sum;
}

// 다음 챕터로 넘어가기 (지금 챕터를 깼고 다음 챕터가 있을 때)
export const canAdvance = () => isCleared(S.chapter) && !!STORIES[S.chapter + 1];
export function advanceChapter() {
  S.chapter += 1;
  S.restore = 0;
  S.board = [];
  S.recentTypes = [];
  // 새 글자라 난이도를 조금 낮춰서 시작
  for (const k of Object.keys(S.stats.skill)) S.stats.skill[k] = Math.round(S.stats.skill[k] * 75) / 100;
  refreshBoard(true);
  save();
}
