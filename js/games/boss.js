// 챕터 마지막: 좀비괴물과 대결 (세 가지 미션을 연달아)
import { speech, el } from '../ui.js';
import { zombieSVG, villageBG } from '../art.js';
import { pickWords } from '../adaptive.js';
import { fill, BOSS_TALK, villageLook } from '../quests.js';
import { S } from '../state.js';
import { GAMES } from './index.js';
import { TYPE_INFO } from '../quests.js';
import { shuffle } from '../ui.js';

function stageBG(root) {
  root.innerHTML = '';
  root.appendChild(el(`<div class="boss-stage"><div class="game-bg">${villageBG(100, { banner: false, castle: villageLook().opts.castle })}</div><div class="boss-zombie">${zombieSVG('evil')}</div></div>`));
}
const line = (root, who, text, mood) => speech({ who, mood, text: fill(text), root });

const TAUNT = ['흥! 이번 건 어림없지!', '이번엔 더 어렵게 해 주마!', '마지막이다! 받아라!'];

export async function playBoss(root) {
  const types = shuffle(Object.keys(TYPE_INFO)).slice(0, 3);
  const used = [];
  const all = [];
  let bonusStars = 0;

  const talk = BOSS_TALK[S.chapter] || BOSS_TALK[1];
  stageBG(root);
  for (const l of talk.intro) await line(root, l.who, l.text, l.mood);

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
  for (const l of talk.outro) {
    await line(root, l.who, l.text, l.mood);
    if (l.run) root.querySelector('.boss-zombie').classList.add('run');
  }
  return { words: all, aborted: false, bonusStars };
}
