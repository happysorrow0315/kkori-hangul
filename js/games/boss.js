// 챕터 마지막: 좀비괴물과 대결 (세 가지 미션을 연달아)
import { speech, el } from '../ui.js';
import { zombieSVG, villageBG } from '../art.js';
import { pickWords } from '../adaptive.js';
import { fill } from '../quests.js';
import { playFind } from './find.js';
import { playDig } from './dig.js';
import { playTrace } from './trace.js';

function stageBG(root) {
  root.innerHTML = '';
  root.appendChild(el(`<div class="boss-stage"><div class="game-bg">${villageBG(100, { banner: false })}</div><div class="boss-zombie">${zombieSVG('evil')}</div></div>`));
}
const line = (root, who, text, mood) => speech({ who, mood, text: fill(text), root });

export async function playBoss(root) {
  const [w1] = pickWords(1);
  const [w2] = pickWords(1, [w1]);
  const [w3] = pickWords(1, [w1, w2], (w) => w.length <= 2);
  const all = [];
  let bonusStars = 0;

  stageBG(root);
  await line(root, 'zombie', '으아아! 마을이 다 살아났잖아! 가만두지 않겠다!', 'evil');
  await line(root, 'kkori', '{A}, 마지막 대결이야! 세 가지 미션을 모두 이기자!');

  root.innerHTML = '';
  const r1 = await playFind(root, { words: [w1], boss: true });
  if (r1.aborted) return { words: [], aborted: true };
  all.push(...r1.words);

  stageBG(root);
  await line(root, 'zombie', '흥! 이번엔 글자를 땅속에 숨겨 주지!', 'evil');
  root.innerHTML = '';
  const r2 = await playDig(root, { words: [w2], boss: true });
  if (r2.aborted) return { words: [], aborted: true };
  all.push(...r2.words);
  bonusStars += r2.bonusStars || 0;

  stageBG(root);
  await line(root, 'zombie', '마지막이다! 봉인 마법을 받아라!', 'evil');
  root.innerHTML = '';
  const r3 = await playTrace(root, { words: [w3], boss: true });
  if (r3.aborted) return { words: [], aborted: true };
  all.push(...r3.words);

  stageBG(root);
  root.querySelector('.boss-zombie').innerHTML = zombieSVG('sad');
  await line(root, 'zombie', '으앙... 내가 졌어. 글자가 너무 맛있어서 그랬단 말이야...', 'sad');
  await line(root, 'kkori', '좀비괴물아, 글자는 먹는 게 아니라 읽는 거야!');
  await line(root, 'zombie', '흥! 다음엔 마법 왕국의 글자를 먹으러 갈 테다! 으하하~', 'evil');
  root.querySelector('.boss-zombie').classList.add('run');
  await line(root, 'kkori', '{A}, 우리가 동화 숲 마을을 지켰어! 1챕터 클리어야!', 'wow');
  return { words: all, aborted: false, bonusStars };
}
