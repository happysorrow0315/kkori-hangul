// 미니게임 4: 연못에서 글자 낚시 (글자 읽기 + 순서대로 낚기)
import { el, shuffle, pick, sleep, confetti, nudge, esc } from '../ui.js';
import { itemSVG, pondBG, fishSVG, rodSVG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { similarSyllables, josa } from '../hangul.js';
import { wordsOf } from '../words.js';
import { S } from '../state.js';
import { record, bumpSkill, skill } from '../adaptive.js';
import { frame, confirmExit, dots, picCard, rebind } from './common.js';

const LANES = [400, 500, 600, 700];
const LANE_SPEED = [70, 95, 60, 85]; // 같은 줄 물고기는 같은 속도 (겹치지 않게)
const COLORS = ['#ff9f43', '#ff8fab', '#ffd166', '#9be29b', '#b69cff', '#7ec4ff'];
const ROD = { x: 1080, y: 300 };

export async function playFish(root, { words, boss = false }) {
  const f = frame(root, { bg: pondBG(), title: boss ? '좀비괴물과 대결! 글자 낚시' : '연못에서 글자를 낚아요', cls: 'fish' });
  f.body.innerHTML = `
    <div class="g-top">${picCard()}<div class="g-slots"></div><div class="g-dots"></div></div>
    <div class="rod">${rodSVG()}</div>
    <svg class="fish-line" viewBox="0 0 1180 820"><line x1="${ROD.x}" y1="${ROD.y}" x2="${ROD.x}" y2="${ROD.y}"/></svg>
    <div class="fish-tip">${esc('그림을 보고 첫 글자부터 차례로 낚아요')}</div>
    <div class="fish-area"></div>`;
  const $ = (s) => f.body.querySelector(s);
  const area = $('.fish-area'), line = $('.fish-line line'), slots = $('.g-slots');
  const results = [];
  let aborted = false, current = null;
  rebind(f.exit, async () => { current?.pause(true); if (await confirmExit(root)) { aborted = true; current?.abort(); } else current?.pause(false); });
  rebind(f.hint, () => current?.hint());

  for (let i = 0; i < words.length && !aborted; i++) {
    $('.g-dots').innerHTML = dots(words.length, i);
    const r = await new Promise((resolve) => { current = round(words[i], resolve); });
    if (r) results.push(r);
  }
  current = null;
  return { words: results, aborted };

  function round(target, resolve) {
    const syls = [...target];
    let idx = 0, mistakes = 0, hinted = false, busy = false, running = true, paused = false, lastT = 0;
    f.node.dataset.w = target;
    f.node.dataset.need = syls[0];
    $('.g-pic-svg').innerHTML = itemSVG(target);
    rebind($('.g-say'), () => say(target));
    say(target);

    const drawSlots = () => {
      slots.innerHTML = syls.map((s, i) => `<div class="g-slot ${i < idx ? 'on' : i === idx ? 'cur' : ''}">${i < idx ? esc(s) : ''}</div>`).join('');
    };
    drawSlots();

    // 미끼 글자: 비슷한 글자 + 다른 단어 글자
    const decoyPool = [...new Set(syls.flatMap((s) => similarSyllables(s, 3, syls)))];
    const others = shuffle(wordsOf(S.chapter).flatMap((w) => [...w]).filter((s) => !syls.includes(s)));
    const nFish = 7 + Math.round(skill('fish') * 2);
    const fishes = [];

    function spawn(s, lane, x) {
      const dir = lane % 2 ? 1 : -1;
      const speed = (LANE_SPEED[lane] + skill('fish') * 45) * (boss ? 1.25 : 1);
      const node = el(`<div class="fish-one" data-s="${esc(s)}"><div class="fish-body">${fishSVG(pick(COLORS))}</div><div class="fish-label">${esc(s)}</div></div>`);
      const fo = { node, s, x, y: LANES[lane], vx: speed * dir, caught: false };
      node.classList.toggle('right', dir > 0);
      node.addEventListener('pointerdown', (e) => { e.preventDefault(); cast(fo); });
      area.appendChild(node);
      fo.lane = lane;
      fishes.push(fo);
      place(fo);
      return fo;
    }
    const freeX = (lane) => { for (let t = 0; t < 30; t++) { const x = 200 + Math.random() * 860; if (fishes.every((o) => o.caught || o.lane !== lane || Math.abs(o.x - x) > 200)) return x; } return 140; };
    const place = (fo) => { fo.node.style.transform = `translate(${fo.x - 85}px, ${fo.y - 45}px)`; };
    function nextSyllable() {
      // 아직 연못에 없는 필요한 글자를 먼저 넣음
      const need = syls.slice(idx).find((s) => !fishes.some((fo) => !fo.caught && fo.s === s));
      if (need && Math.random() < 0.75) return need;
      return Math.random() < 0.6 && decoyPool.length ? pick(decoyPool) : pick(others.length ? others : decoyPool);
    }
    area.innerHTML = '';
    const start = shuffle([...syls, ...shuffle(decoyPool).slice(0, 4)]);
    while (start.length < nFish) start.push(pick(others.length ? others : decoyPool));
    start.slice(0, nFish).forEach((s, i) => spawn(s, i % LANES.length, 200 + Math.floor(i / LANES.length) * 440 + (i % LANES.length) * 100));

    function tick(t) {
      if (!running) return;
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
      lastT = t;
      if (!paused) {
        for (const fo of fishes) {
          if (fo.caught || fo.hold) continue;
          fo.x += fo.vx * dt;
          if (fo.x > 1080) fo.x = 190;
          if (fo.x < 190) fo.x = 1080;
          place(fo);
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    async function cast(fo) {
      if (busy || paused || fo.caught || !running) return;
      busy = true;
      fo.hold = true;
      sfx('pop');
      line.setAttribute('x2', fo.x); line.setAttribute('y2', fo.y);
      await sleep(180);
      if (fo.s === syls[idx]) {
        fo.caught = true;
        sfx('ok');
        fo.node.classList.add('caught');
        fo.node.style.transform = `translate(${fo.x - 85}px, ${fo.y - 260}px) scale(.6)`;
        say(fo.s);
        idx++;
        f.node.dataset.need = syls[idx] || '';
        drawSlots();
        await sleep(450);
        fo.node.remove();
        fishes.splice(fishes.indexOf(fo), 1);
        line.setAttribute('x2', ROD.x); line.setAttribute('y2', ROD.y);
        if (idx >= syls.length) { finish(); return; }
        { const lane = fo.lane; spawn(nextSyllable(), lane, freeX(lane)); }
      } else {
        mistakes++;
        sfx('bad');
        nudge(fo.node);
        fo.node.classList.add('nope');
        say(`이건 ${josa(fo.s, '이야/야')}.`);
        await sleep(500);
        fo.node.classList.remove('nope');
        fo.vx *= 2.2;
        setTimeout(() => { fo.vx /= 2.2; }, 1200);
        line.setAttribute('x2', ROD.x); line.setAttribute('y2', ROD.y);
      }
      fo.hold = false;
      busy = false;
    }

    async function finish() {
      running = false;
      sfx('win');
      $('.g-pic').classList.add('alive');
      confetti(590, 160);
      await say(`우와! ${target} 완성!`);
      await sleep(400);
      $('.g-pic').classList.remove('alive');
      record(target, { mistakes, hinted });
      bumpSkill('fish', !mistakes && !hinted, mistakes);
      resolve({ w: target, ok: true, mistakes, hinted });
    }

    return {
      abort() { running = false; stopSay(); resolve(null); },
      pause(v) { paused = v; },
      hint() {
        hinted = true;
        say(target);
        const fo = fishes.find((x) => !x.caught && x.s === syls[idx]);
        if (fo) { fo.node.classList.remove('glow'); void fo.node.offsetWidth; fo.node.classList.add('glow'); }
      },
    };
  }
}
