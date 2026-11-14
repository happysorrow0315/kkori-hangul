// 챕터 마지막: 좀비괴물과 대결 (세 가지 미션을 연달아)
import { speech, el } from '../ui.js';
import { zombieSVG, villageBG } from '../art.js';
import { pickWords } from '../adaptive.js';
import { fill } from '../quests.js';
import { GAMES } from './index.js';
import { TYPE_INFO } from '../quests.js';
import { shuffle } from '../ui.js';

function stageBG(root) {
  root.innerHTML = '';
  root.appendChild(el(`<div class="boss-stage"><div class="game-bg">${villageBG(100, { banner: false })}</div><div class="boss-zombie">${zombieSVG('evil')}</div></div>`));
}
const line = (root, who, text, mood) => speech({ who, mood, text: fill(text), root });

const TAUNT = ['흥! 이번 건 어림없지!', '이번엔 더 어렵게 해 주마!', '마지막이다! 받아라!'];

export async function playBoss(root) {
  const types = shuffle(Object.keys(TYPE_INFO)).slice(0, 3);
  const used = [];
  const all = [];
  let bonusStars = 0;

  stageBG(root);
  await line(root, 'zombie', '으아아! 마을이 다 살아났잖아! 가만두지 않겠다!', 'evil');
  await line(root, 'kkori', '{A}, 드디어 마지막 대결이야! 세 가지 미션을 모두 이기자, 아자!');

  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    const info = TYPE_INFO[t];
    const [w] = pickWords(1, used, (x) => x.length <= (info.maxLen || 3));
    used.push(w);
    if (i) { stageBG(root); await line(root, 'zombie', TAUNT[i], 'evil'); }
    root.innerHTML = '';
    const r = await GAMES[t](root, { words: [w], boss: true });
    if (r.aborted) return { words: [], aborted: true };
    all.push(...r.words);
    bonusStars += r.bonusStars || 0;
  }

  stageBG(root);
  root.querySelector('.boss-zombie').innerHTML = zombieSVG('sad');
  await line(root, 'zombie', '으앙... 내가 졌어. 글자가 너무 맛있어서 그랬단 말이야...', 'sad');
  await line(root, 'kkori', '좀비괴물아~ 글자는 먹는 게 아니라 읽는 거야!');
  await line(root, 'zombie', '흥! 다음엔 마법 왕국의 글자를 먹으러 갈 테다! 으하하~', 'evil');
  root.querySelector('.boss-zombie').classList.add('run');
  await line(root, 'kkori', '{A}! 우리가 동화 숲 마을을 지켰어! 1챕터 클리어야!', 'wow');
  return { words: all, aborted: false, bonusStars };
}
