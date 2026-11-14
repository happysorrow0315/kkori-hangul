// 의뢰(퀘스트)와 이야기
import { S, save, addInv } from './state.js';
import { pickWords, toolLevel } from './adaptive.js';
import { josa, hasBatchim } from './hangul.js';
import { pick } from './ui.js';

export const TYPE_INFO = {
  find: { label: '가게에서 찾기', short: '찾기' },
  dig: { label: '땅 파서 맞추기', short: '땅파기' },
  trace: { label: '봉인 마법 풀기', short: '봉인 풀기' },
};

export const RESTORE_PER_MISSION = 4;

// {A} = 지민아, {I} = 지민이 (뒤에 조사가 붙을 때)
export function fill(text) {
  const n = S.profile?.name || '친구';
  return text.replace(/\{A\}/g, josa(n, '아/야')).replace(/\{I\}/g, n + (hasBatchim(n) ? '이' : ''));
}

export const STORY = [
  {
    id: 's1', at: 0, giver: 'bear', type: 'find', word: '우유',
    title: '사라진 우유',
    intro: [
      { who: 'bear', text: '큰일 났어! 좀비괴물이 우리 가게 물건의 글자를 먹어 버렸어.' },
      { who: 'bear', text: '글자가 없어진 물건은 사라져 버려. 특히 우유가 꼭 필요한데...' },
      { who: 'kkori', text: '{A}, 좀비괴물보다 먼저 물건을 찾아 보자! 글자를 잘 읽으면 찾을 수 있어.' },
    ],
    outro: [
      { who: 'bear', text: '고마워! 우유가 다시 돌아왔어!' },
      { who: 'kkori', text: '글자를 되찾으면 물건이 살아나! 되찾은 물건으로 마을을 꾸밀 수도 있어.' },
    ],
  },
  {
    id: 's2', at: 8, giver: 'squirrel', type: 'dig', word: '요요',
    title: '토리의 요요',
    intro: [
      { who: 'squirrel', text: '으앙, 내 요요! 좀비괴물이 요요 글자를 땅속에 퉤 뱉어 버렸어.' },
      { who: 'kkori', text: '글자 조각을 파내서 요요를 다시 맞춰 보자!' },
    ],
    outro: [{ who: 'squirrel', text: '요요가 돌아왔다! 휘리릭~ 고마워!' }],
  },
  {
    id: 's3', at: 16, giver: 'owl', type: 'trace', word: '나무',
    title: '봉인된 나무',
    intro: [
      { who: 'owl', text: '에헴. 마을 나무에 좀비괴물이 봉인 마법을 걸었다네.' },
      { who: 'owl', text: '글자를 순서대로 따라 쓰면 봉인이 풀린다네. 이 마법 지팡이를 받게나.' },
      { who: 'kkori', text: '반짝이는 점에서 시작해서 화살표 방향으로 쓰면 돼!' },
    ],
    outro: [{ who: 'owl', text: '훌륭하구먼! 나무가 다시 초록색이 되었어.' }],
  },
  {
    id: 's4', at: 28, giver: 'rabbit', type: 'find', word: '사과',
    title: '할머니의 사과',
    intro: [
      { who: 'rabbit', text: '할미가 사과 파이를 구우려는데, 사과가 사라졌지 뭐니.' },
      { who: 'zombie', mood: 'evil', text: '으흐흐~ 사과 글자는 새콤달콤 맛있었지!' },
      { who: 'kkori', text: '과 글자를 잘 봐! ㄱ에 ㅗ랑 ㅏ가 합쳐진 글자야.' },
    ],
    outro: [{ who: 'rabbit', text: '고맙구나. 파이가 다 구워지면 꼭 놀러 오렴.' }],
  },
  {
    id: 's5', at: 40, giver: 'squirrel', type: 'dig', word: '과자',
    title: '땅속의 과자',
    intro: [
      { who: 'squirrel', text: '킁킁, 땅속에서 과자 냄새가 나!' },
      { who: 'kkori', text: 'ㅗ랑 ㅏ를 합치면 ㅘ가 돼. 조각을 잘 합쳐 봐!' },
    ],
    outro: [{ who: 'squirrel', text: '바삭바삭! 과자 찾았다!' }],
  },
  {
    id: 's6', at: 52, giver: 'bear', type: 'trace', word: '의자',
    title: '봉인된 의자',
    intro: [
      { who: 'bear', text: '가게 의자에 봉인이 걸려서 앉을 수가 없어.' },
      { who: 'kkori', text: '의는 ㅇ을 쓰고, ㅡ를 쓰고, 마지막에 ㅣ를 써. 같이 해 보자!' },
    ],
    outro: [{ who: 'bear', text: '휴, 이제 앉아서 쉴 수 있겠다. 고마워!' }],
  },
  {
    id: 's7', at: 64, giver: 'owl', type: 'dig', word: '회오리',
    title: '회오리를 멈춰라',
    intro: [
      { who: 'zombie', mood: 'evil', text: '회오리~ 회오리~ 마을을 다 날려 버릴 테다!' },
      { who: 'owl', text: '회오리 글자를 되찾으면 회오리를 멈출 수 있다네!' },
      { who: 'kkori', text: '회에는 ㅗ와 ㅣ가 합쳐진 ㅚ가 들어 있어.' },
    ],
    outro: [{ who: 'owl', text: '회오리가 잠잠해졌어. 자네 덕분이네.' }],
  },
  {
    id: 's8', at: 76, giver: 'rabbit', type: 'trace', word: '돼지',
    title: '돼지 저금통',
    intro: [
      { who: 'rabbit', text: '아이고, 할미의 돼지 저금통에 봉인이 걸렸단다.' },
      { who: 'zombie', mood: 'evil', text: '흥! 그 봉인은 아무도 못 풀걸?' },
      { who: 'kkori', text: '{I}라면 풀 수 있어! ㅙ는 ㅗ와 ㅐ가 합쳐진 거야.' },
    ],
    outro: [
      { who: 'rabbit', text: '꿀꿀 돼지가 돌아왔구나! 정말 대단하다.' },
      { who: 'kkori', text: '마을이 거의 다 살아났어. 조금만 더 힘내자!' },
    ],
  },
];

const GIVERS = { find: ['bear', 'bear', 'rabbit'], dig: ['squirrel', 'squirrel', 'owl'], trace: ['owl', 'rabbit', 'bear'] };

function questText(type, w) {
  if (type === 'find') return pick(['좀비괴물이 가게 물건 글자를 먹어 버렸어! 먼저 찾아 줄래?', '가게 물건이 사라지고 있어! 좀비괴물보다 빨리 찾아 줘!']);
  if (type === 'dig') return `땅속에 ${w} 글자 조각이 묻혀 있어! 파내서 맞춰 줄래?`;
  return `${w}에 봉인 마법이 걸렸어! 글자를 따라 써서 풀어 줘!`;
}

let qid = Date.now();
function makeQuest(type, used) {
  const exclude = used.flatMap((q) => q.words);
  const n = type === 'find' ? 3 : type === 'dig' ? 2 : 1;
  const filter = type === 'trace' ? (w) => w.length <= 3 : null;
  const words = pickWords(n, exclude, filter);
  return { id: 'q' + qid++, type, words, giver: pick(GIVERS[type]), text: questText(type, words[0]) };
}

export const nextStory = () => STORY.find((s) => !S.story.done.includes(s.id) && S.restore >= s.at);
export const bossReady = () => S.restore >= 100 && !S.story.bossDone && STORY.every((s) => S.story.done.includes(s.id));

function storyQuest(s) {
  const extra = s.type === 'find' ? pickWords(2, [s.word]) : s.type === 'dig' ? pickWords(1, [s.word]) : [];
  return { id: 'story-' + s.id, type: s.type, words: [s.word, ...extra], giver: s.giver, text: s.intro[0].text, story: s.id, title: s.title };
}

export function refreshBoard() {
  let normal = S.board.filter((q) => !q.story && !q.boss);
  const out = [];
  for (const t of ['find', 'dig', 'trace']) out.push(normal.find((q) => q.type === t) || makeQuest(t, [...out, ...normal]));
  const s = nextStory();
  if (s) out.unshift(storyQuest(s));
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
  if (TYPE_INFO[q.type] && sum.items.length) {
    const before = toolLevel(q.type);
    S.tools[q.type] = (S.tools[q.type] || 0) + 1;
    const after = toolLevel(q.type);
    if (after > before) sum.upgrades.push({ type: q.type, level: after });
  }
  S.missionsDone++;
  if (q.story && sum.items.length && !S.story.done.includes(q.story)) S.story.done.push(q.story);
  if (q.boss) { S.story.bossDone = true; S.story.chapterClear = true; }
  if (sum.items.length || q.boss) S.board = S.board.filter((x) => x.id !== q.id);
  refreshBoard();
  save();
  return sum;
}
