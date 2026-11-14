// 미니게임 5: 글자 다리 만들기 (그림을 보고 글자 블록을 순서대로 놓아 다리 짓기)
import { el, shuffle, sleep, confetti, shake, speech, esc } from '../ui.js';
import { itemSVG, riverBG, zombieSVG, avatarSVG, catSVG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { similarSyllables, josa } from '../hangul.js';
import { S } from '../state.js';
import { record, bumpSkill, skill } from '../adaptive.js';
import { frame, confirmExit, speakerIcon, rebind } from './common.js';

const X0 = 200, X1 = 990;

export async function playBridge(root, { words, boss = false }) {
  const f = frame(root, { bg: riverBG(S.chapter), title: boss ? '좀비괴물과 대결! 다리 만들기' : '글자 블록으로 다리를 만들어요', cls: 'bridge' });
  f.body.innerHTML = `
    <div class="br-race"><div class="br-track"><div class="br-zombie">${zombieSVG('evil')}</div></div><span>좀비괴물이 쫓아와요!</span></div>
    <div class="br-pics"></div>
    <div class="br-planks"></div>
    <div class="br-heroes"><div class="br-me">${avatarSVG(S.profile?.avatar)}</div><div class="br-cat">${catSVG({ hat: S.profile?.catHat })}</div></div>
    <div class="br-raft"></div>`;
  const $ = (s) => f.body.querySelector(s);
  const pics = $('.br-pics'), planksEl = $('.br-planks'), raft = $('.br-raft'), zombie = $('.br-zombie'), heroes = $('.br-heroes');

  // 칸마다 어떤 단어의 몇 번째 글자인지
  const planks = [];
  words.forEach((w, k) => [...w].forEach((s) => planks.push({ s, k, filled: false })));
  const n = planks.length, gap = 8, pw = (X1 - X0 - gap * (n - 1)) / n;
  const mistakes = words.map(() => 0);
  let hinted = false, idx = 0, p = 0, fails = 0, running = true, paused = false, aborted = false, lastT = 0;
  const T = (boss ? 55 : 75) - 25 * skill('bridge') + 10 * Math.max(0, n - 5);

  // 단어 그림을 그 단어 칸 위에 놓기
  words.forEach((w, k) => {
    const first = planks.findIndex((pl) => pl.k === k), cnt = [...w].length;
    const cx = X0 + (first + cnt / 2) * (pw + gap) - gap / 2;
    const card = el(`<div class="br-pic" style="left:${cx - 85}px"><div class="br-pic-svg">${itemSVG(w)}</div><button class="g-say" aria-label="듣기">${speakerIcon()}</button></div>`);
    rebind(card.querySelector('.g-say'), () => say(w));
    pics.appendChild(card);
  });
  f.node.dataset.w = words.join(',');

  function drawPlanks() {
    planksEl.innerHTML = planks.map((pl, i) => `<div class="br-plank ${pl.filled ? 'on' : i === idx ? 'cur' : ''} ${i && planks[i - 1].k !== pl.k ? 'gapl' : ''}" style="left:${X0 + i * (pw + gap)}px;width:${pw}px">${pl.filled ? esc(pl.s) : ''}</div>`).join('');
    f.node.dataset.need = planks[idx]?.s || '';
  }

  function fillRaft() {
    const need = planks.filter((pl) => !pl.filled).map((pl) => pl.s);
    const dec = shuffle([...new Set(need.flatMap((s) => similarSyllables(s, 2, need)))]).slice(0, Math.max(3, 9 - need.length));
    raft.innerHTML = '';
    shuffle([...need, ...dec]).forEach((s) => {
      const b = el(`<button class="br-block" data-s="${esc(s)}">${esc(s)}</button>`);
      b.addEventListener('click', () => put(b));
      raft.appendChild(b);
    });
  }

  async function put(b) {
    if (!running || paused || b.classList.contains('busy')) return;
    const pl = planks[idx];
    if (!pl) return;
    const s = b.dataset.s;
    if (s === pl.s) {
      sfx('dig');
      pl.filled = true;
      b.remove();
      say(s);
      idx++;
      drawPlanks();
      if (idx >= n) win();
      return;
    }
    // 틀린 블록: 다리에 올렸다가 물에 풍덩
    mistakes[pl.k]++;
    sfx('bad');
    b.classList.add('busy');
    const drop = el(`<div class="br-drop" style="left:${X0 + idx * (pw + gap)}px;width:${pw}px">${esc(s)}</div>`);
    f.body.appendChild(drop);
    say(`풍덩! ${josa(s, '이/가')} 아니었네~`);
    p = Math.min(0.95, p + 0.1);
    setTimeout(() => { drop.remove(); b.classList.remove('busy'); }, 900);
  }

  function tick(t) {
    if (!running) return;
    const dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 0;
    lastT = t;
    if (!paused) {
      p += dt / T;
      zombie.style.left = Math.min(100, p * 100) + '%';
      if (p >= 1) { caught(); return; }
    }
    requestAnimationFrame(tick);
  }

  async function caught() {
    paused = true;
    fails++;
    sfx('chomp');
    zombie.innerHTML = zombieSVG('eat');
    await speech({ who: 'zombie', mood: 'eat', text: '으하하~ 다리가 다 안 됐지롱! 블록은 내가 냠냠!', root });
    if (aborted) return;
    await speech({ who: 'kkori', text: '괜찮아! 다시 해 보자. 그림 옆 스피커를 누르면 단어를 들을 수 있어.', root });
    planks.forEach((pl) => { pl.filled = false; });
    words.forEach((_, k) => { mistakes[k]++; });
    idx = 0; p = 0;
    zombie.innerHTML = zombieSVG('evil');
    drawPlanks();
    fillRaft();
    paused = false;
    lastT = 0;
    requestAnimationFrame(tick);
  }

  let resolveAll;
  const done = new Promise((r) => { resolveAll = r; });
  async function win() {
    running = false;
    sfx('win');
    zombie.innerHTML = zombieSVG('sad');
    heroes.classList.add('cross');
    confetti(600, 420);
    await say(`야호! 다리 완성! ${words.join(', ')}!`);
    await sleep(1400);
    resolveAll();
  }

  rebind(f.exit, async () => { paused = true; if (await confirmExit(root)) { aborted = true; running = false; stopSay(); resolveAll(); } else paused = false; });
  rebind(f.hint, () => {
    hinted = true;
    const pl = planks[idx];
    if (!pl) return;
    say(words[pl.k]);
    const b = [...raft.querySelectorAll('.br-block')].find((x) => x.dataset.s === pl.s);
    if (b) { b.classList.remove('glow'); void b.offsetWidth; b.classList.add('glow'); }
  });

  drawPlanks();
  fillRaft();
  say('그림을 보고 글자 블록을 차례로 놓아서 다리를 만들어!');
  requestAnimationFrame(tick);
  await done;
  if (aborted) return { words: [], aborted: true };
  const res = words.map((w, k) => ({ w, ok: true, mistakes: mistakes[k], hinted }));
  res.forEach((r) => record(r.w, r));
  bumpSkill('bridge', mistakes.every((m) => !m) && !hinted, Math.max(...mistakes));
  return { words: res, aborted: false };
}
