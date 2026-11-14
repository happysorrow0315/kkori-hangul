// 의뢰(퀘스트)와 이야기
import { S, save, addInv } from './state.js';
import { pickWords, toolLevel, TOOL_NAMES } from './adaptive.js';
import { josa, hasBatchim } from './hangul.js';
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
};
export const TYPES = Object.keys(TYPE_INFO);

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

export const STORIES = { 1: STORY1, 2: STORY2 };
export const STORY = [...STORY1, ...STORY2];

// 새 챕터로 넘어갈 때 이야기
export const CHAPTER_INTRO = {
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
export const MILESTONE_GIFTS = { 2: { 25: ['decor:lamp', 2], 75: ['decor:fountain', 1] } };

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

const GIVERS_BY_CH = {
  1: {
    find: ['bear', 'rabbit'], dig: ['squirrel', 'owl'], trace: ['owl', 'rabbit'], fish: ['rabbit', 'squirrel'],
    bridge: ['bear', 'squirrel'], orb: ['owl', 'bear'], hidden: ['squirrel', 'rabbit'],
  },
  2: {
    find: ['fairy', 'bear'], dig: ['dragon', 'squirrel'], trace: ['owl', 'fairy'], fish: ['dragon', 'rabbit'],
    bridge: ['dragon', 'bear'], orb: ['owl', 'fairy'], hidden: ['fairy', 'squirrel'],
  },
};
const giversFor = (t) => (GIVERS_BY_CH[S.chapter] || GIVERS_BY_CH[1])[t];

export const isCleared = (ch = S.chapter) => (S.story.cleared || []).includes(ch);

// 마을 모습: 1챕터는 복원도대로, 2챕터부터는 다 살아난 마을 + 성
export function villageLook() {
  const ch = S.chapter;
  const restore = ch > 1 ? 100 : S.restore;
  return {
    restore,
    gray: (100 - restore) * 0.9,
    opts: { banner: ch === 1, castle: ch > 2 || isCleared(2) || (ch === 2 && S.restore >= 50) },
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
  }
  return '';
}

let qid = Date.now();
function makeQuest(type, used) {
  const info = TYPE_INFO[type];
  const exclude = used.flatMap((q) => q.words);
  const filter = info.maxLen ? (w) => w.length <= info.maxLen : null;
  const words = pickWords(info.words, exclude, filter);
  return { id: 'q' + qid++, type, words, giver: pick(giversFor(type)), text: questText(type, words[0]) };
}

const storiesNow = () => STORIES[S.chapter] || [];
export const nextStory = () => storiesNow().find((s) => !S.story.done.includes(s.id) && S.restore >= s.at);
export const bossReady = () => S.restore >= 100 && !isCleared() && storiesNow().every((s) => S.story.done.includes(s.id));

function storyQuest(s) {
  const info = TYPE_INFO[s.type];
  const extra = pickWords(info.words - 1, [s.word], info.maxLen ? (w) => w.length <= info.maxLen : null);
  return { id: 'story-' + s.id, type: s.type, words: [s.word, ...extra], giver: s.giver, text: s.intro[0].text, story: s.id, title: s.title };
}

// 게시판: 이야기 의뢰 1개 + 서로 다른 놀이 2~3개 (방금 한 놀이는 빼고 무작위)
export function refreshBoard(force = false) {
  let normal = force ? [] : S.board.filter((q) => !q.story && !q.boss && TYPE_INFO[q.type]);
  const s = nextStory();
  const want = s ? 2 : 3;
  const recent = S.recentTypes || [];
  const avoid = new Set([...recent.slice(-2), s?.type].filter(Boolean));
  normal = normal.filter((q) => !avoid.has(q.type)).slice(0, want);
  const pool = shuffle(TYPES.filter((t) => !avoid.has(t) && !normal.some((q) => q.type === t)));
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
