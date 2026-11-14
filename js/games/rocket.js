// 3챕터 미니게임: 로켓 레이스 (줄을 옮겨 다니며 맞는 글자 별 잡기, 운석 피하기)
import { el, shuffle, pick, sleep, confetti, nudge, esc } from '../ui.js';
import { itemSVG, spaceBG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { similarSyllables, decompose, compose, familyOf } from '../hangul.js';
import { record, bumpSkill, skill } from '../adaptive.js';
import { frame, confirmExit, dots, picCard, rebind } from './common.js';

const LANES = [400, 600, 800];
const ROCKET_Y = 720, TOP_Y = 300, HIT = 46;

// 소리 가족을 바꾼 헷갈리는 글자 (빵 → 방, 팡)
function rivals(syl) {
  const d = decompose(syl);
  const out = new Set();
  const fam = d && familyOf(d.cho);
  if (fam) fam.filter((c) => c !== d.cho).forEach((c) => out.add(compose(c, d.jung, d.jong)));
  similarSyllables(syl, 3).forEach((s) => out.add(s));
  out.delete(syl);
  return [...out];
}

const rocketSVG = () => `<svg viewBox="0 0 100 140" stroke="#5a4032" stroke-width="4" stroke-linejoin="round"><path d="M50 4 C76 26 80 70 72 100 H28 C20 70 24 26 50 4Z" fill="#f2f4f8"/><path d="M28 100 L10 124 L30 116Z M72 100 L90 124 L70 116Z" fill="#ff6b6b"/><circle cx="50" cy="52" r="14" fill="#7ec4ff"/><path d="M38 100 L44 126 H56 L62 100" fill="#ffd34d"/><path d="M42 26 C46 18 54 18 58 26" fill="none" stroke="#ff6b6b" stroke-width="6"/></svg>`;
const rockSVG = () => `<svg viewBox="0 0 100 100" stroke="#5a4032" stroke-width="4"><path d="M18 30 L44 12 L78 20 L90 52 L72 86 L34 88 L12 62Z" fill="#9a8f86"/><circle cx="40" cy="40" r="8" fill="#7d7268"/><circle cx="64" cy="62" r="10" fill="#7d7268"/></svg>`;

export async function playRocket(root, { words, boss = false }) {
  const f = frame(root, { bg: spaceBG(), title: boss ? '좀비괴물과 대결! 로켓 레이스' : '로켓을 움직여 글자 별을 잡아요', cls: 'rocket' });
  f.body.innerHTML = `
    <div class="g-top">${picCard()}<div class="g-slots"></div><div class="g-dots"></div></div>
    <div class="rk-track">${LANES.map((x, i) => `<div class="rk-lane" style="left:${x - 100}px"></div>`).join('')}</div>
    <div class="rk-objs"></div>
    <div class="rk-rocket">${rocketSVG()}</div>
    <div class="rk-pads">${LANES.map((x, i) => `<button class="rk-pad" data-lane="${i}" style="left:${x - 100}px" aria-label="${i + 1}번 줄"></button>`).join('')}</div>
    <div class="rk-tip">줄을 눌러서 로켓을 옮겨요</div>`;
  const $ = (s) => f.body.querySelector(s);
  const objsEl = $('.rk-objs'), rocket = $('.rk-rocket'), slots = $('.g-slots');
  let lane = 1;
  const moveRocket = (i) => { lane = i; rocket.style.left = LANES[i] - 55 + 'px'; };
  moveRocket(1);
  f.body.querySelectorAll('.rk-pad').forEach((p) => p.addEventListener('pointerdown', (e) => { e.preventDefault(); moveRocket(+p.dataset.lane); }));

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
    let idx = 0, mistakes = 0, hinted = false, running = true, paused = false, lastT = 0, sinceNeed = 0;
    const objs = [];
    const speed = (150 + skill('rocket') * 80) * (boss ? 1.2 : 1);
    f.node.dataset.w = target;
    $('.g-pic-svg').innerHTML = itemSVG(target);
    $('.g-pic').classList.remove('alive');
    rebind($('.g-say'), () => say(target));
    say(target);
    objsEl.innerHTML = '';
    const drawSlots = () => {
      slots.innerHTML = syls.map((s, i) => `<div class="g-slot ${i < idx ? 'on' : i === idx ? 'cur' : ''}">${i < idx ? esc(s) : ''}</div>`).join('');
      f.node.dataset.need = syls[idx] || '';
    };
    drawSlots();

    function spawnRow() {
      const need = syls[idx];
      const withNeed = sinceNeed >= 1 || Math.random() < 0.7;
      const needLane = withNeed ? Math.floor(Math.random() * 3) : -1;
      sinceNeed = withNeed ? 0 : sinceNeed + 1;
      const pool = shuffle(rivals(need));
      for (let i = 0; i < 3; i++) {
        let o;
        if (i === needLane) o = { kind: 'syl', s: need };
        else if (Math.random() < 0.28) o = { kind: 'rock' };
        else if (pool.length && Math.random() < 0.85) o = { kind: 'syl', s: pool.shift() };
        else continue;
        o.lane = i; o.y = TOP_Y;
        o.el = el(o.kind === 'rock'
          ? `<div class="rk-obj rock">${rockSVG()}</div>`
          : `<div class="rk-obj star" data-s="${esc(o.s)}"><span>${esc(o.s)}</span></div>`);
        o.el.style.left = LANES[i] - 45 + 'px';
        objsEl.appendChild(o.el);
        objs.push(o);
      }
    }

    function tick(t) {
      if (!running) return;
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
      lastT = t;
      if (!paused) {
        if (!objs.length || Math.min(...objs.map((o) => o.y)) > TOP_Y + 190) spawnRow();
        for (const o of [...objs]) {
          o.y += speed * dt;
          o.el.style.top = o.y - 45 + 'px';
          if (!o.done && o.lane === lane && Math.abs(o.y - ROCKET_Y) < HIT) hit(o);
          if (o.y > 860) { o.el.remove(); objs.splice(objs.indexOf(o), 1); }
        }
        // 테스트/힌트용: 가장 가까운 필요한 별의 줄
        const next = objs.filter((o) => !o.done && o.kind === 'syl' && o.s === syls[idx] && o.y < ROCKET_Y + 10).sort((a, b) => b.y - a.y)[0];
        f.node.dataset.lane = next ? next.lane : '';
      }
      requestAnimationFrame(tick);
    }

    function hit(o) {
      o.done = true;
      if (o.kind === 'syl' && o.s === syls[idx]) {
        sfx('ok');
        o.el.classList.add('got');
        setTimeout(() => o.el.remove(), 300);
        say(o.s);
        idx++;
        drawSlots();
        if (idx >= syls.length) finish();
        return;
      }
      mistakes++;
      sfx('bad');
      nudge(rocket);
      rocket.classList.add('ouch');
      setTimeout(() => rocket.classList.remove('ouch'), 500);
      o.el.classList.add('bump');
      if (o.kind === 'syl') {
        const tag = el(`<div class="rk-float">${esc(o.s)}!</div>`);
        tag.style.left = LANES[o.lane] - 40 + 'px';
        f.body.appendChild(tag);
        setTimeout(() => tag.remove(), 900);
      }
    }

    async function finish() {
      running = false;
      sfx('win');
      $('.g-pic').classList.add('alive');
      confetti(600, 200);
      objsEl.innerHTML = '';
      await say(`슝~ ${target} 완성!`);
      await sleep(300);
      record(target, { mistakes, hinted });
      bumpSkill('rocket', !mistakes && !hinted, mistakes);
      resolve({ w: target, ok: true, mistakes, hinted });
    }

    requestAnimationFrame(tick);
    return {
      abort() { running = false; stopSay(); resolve(null); },
      pause(v) { paused = v; },
      hint() {
        hinted = true;
        say(syls[idx]);
        objs.filter((o) => o.kind === 'syl' && o.s === syls[idx]).forEach((o) => { o.el.classList.remove('glow'); void o.el.offsetWidth; o.el.classList.add('glow'); });
      },
    };
  }
}
