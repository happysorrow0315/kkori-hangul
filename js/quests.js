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
export const STORY = [
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

const GIVERS = {
  find: ['bear', 'rabbit'], dig: ['squirrel', 'owl'], trace: ['owl', 'rabbit'], fish: ['rabbit', 'squirrel'],
  bridge: ['bear', 'squirrel'], orb: ['owl', 'bear'], hidden: ['squirrel', 'rabbit'],
};

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
  return { id: 'q' + qid++, type, words, giver: pick(GIVERS[type]), text: questText(type, words[0]) };
}

export const nextStory = () => STORY.find((s) => !S.story.done.includes(s.id) && S.restore >= s.at);
export const bossReady = () => S.restore >= 100 && !S.story.bossDone && STORY.every((s) => S.story.done.includes(s.id));

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
  if (bossReady()) out.unshift({ id: 'boss-1', boss: true, type: 'boss', words: [], giver: 'zombie', text: '좀비괴물이 마지막 대결을 하자고 해!', title: '좀비괴물과 대결' });
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
    for (const m of [25, 50, 75, 100]) if (sum.restoreBefore < m && S.restore >= m) sum.milestones.push(m);
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
  if (q.boss) { S.story.bossDone = true; S.story.chapterClear = true; }
  refreshBoard(true);
  save();
  return sum;
}
