// 4챕터 미니게임: 잠수함 탐험 (손가락으로 잠수함을 몰아 글자 거품을 순서대로 먹기, 해파리 피하기)
import { el, shuffle, sleep, confetti, nudge, esc, toStage } from '../ui.js';
import { itemSVG, seaBG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { decompose, vowelAlikes, similarSyllables, isTrickyVowel, AE_SPLIT, VOWEL_SPLIT } from '../hangul.js';
import { record, bumpSkill, skill } from '../adaptive.js';
import { S } from '../state.js';
import { frame, confirmExit, dots, picCard, rebind } from './common.js';

const AREA = { x0: 90, y0: 320, x1: 1150, y1: 790 };
const EAT = 70, ZAP = 62, SPEED = 560;

const subSVG = () => `<svg viewBox="0 0 160 110" stroke="#5a4032" stroke-width="4" stroke-linejoin="round"><path d="M66 30 V12 H84" fill="none" stroke-width="5"/><rect x="58" y="22" width="34" height="22" rx="8" fill="#ffd34d"/><path d="M10 60 C10 36 40 30 80 30 C124 30 146 42 146 60 C146 80 120 92 80 92 C40 92 10 84 10 60Z" fill="#ffd34d"/><circle cx="56" cy="60" r="12" fill="#bfe6ff"/><circle cx="90" cy="60" r="12" fill="#bfe6ff"/><circle cx="124" cy="60" r="10" fill="#bfe6ff"/><path d="M10 60 L-4 46 V76Z" fill="#ff8f6b"/></svg>`;
const jellySVG = () => `<svg viewBox="0 0 100 110" stroke="#5a4032" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"><path d="M28 54 C24 70 32 80 26 96 M42 56 C40 74 46 84 42 104 M58 56 C60 74 54 84 58 104 M72 54 C76 70 68 80 74 96" fill="none" stroke="#c9a6ff" stroke-width="5"/><path d="M14 56 C14 14 86 14 86 56 C76 60 70 54 62 58 C56 54 44 54 38 58 C30 54 24 60 14 56Z" fill="#e3d4ff"/><circle cx="38" cy="40" r="4" fill="#5a4032" stroke="none"/><circle cx="62" cy="40" r="4" fill="#5a4032" stroke="none"/><path d="M44 48 Q50 44 56 48" fill="none" stroke-width="3"/></svg>`;

// 모음 원리 설명: ㅐ → ㅏ+ㅣ
const vowelHow = (j) => { const p = AE_SPLIT[j] || VOWEL_SPLIT[j]; return p ? `${p[0]}에 ${p[1]}를 붙인 ${j}` : j; };

export async function playSub(root, { words, boss = false }) {
  const f = frame(root, { bg: seaBG(), title: boss ? '좀비괴물과 대결! 잠수함 탐험' : '잠수함을 몰아서 글자 거품을 먹어요', cls: 'sub' });
  f.body.innerHTML = `
    <div class="g-top">${picCard()}<div class="g-slots"></div><div class="sb-tip">손가락으로 잠수함을 끌고 다녀요<br>해파리는 찌릿찌릿 조심!</div></div>
    <div class="g-dots"></div>
    <div class="sb-area"></div>
    <div class="sb-sub">${subSVG()}</div>`;
  const $ = (s) => f.body.querySelector(s);
  const area = $('.sb-area'), subEl = $('.sb-sub'), slots = $('.g-slots');
  const sub = { x: 300, y: 600, tx: 300, ty: 600, stun: 0 };
  const placeSub = () => { subEl.style.transform = `translate(${sub.x - 70}px, ${sub.y - 48}px) scaleX(${sub.face || 1})`; };
  placeSub();
  // 화면 어디든 누르고 끌면 잠수함이 그쪽으로 감
  let steering = false;
  const steer = (e) => { const p = toStage(e); sub.tx = Math.max(AREA.x0, Math.min(AREA.x1, p.x)); sub.ty = Math.max(AREA.y0, Math.min(AREA.y1, p.y)); };
  area.addEventListener('pointerdown', (e) => { e.preventDefault(); steering = true; area.setPointerCapture?.(e.pointerId); steer(e); });
  area.addEventListener('pointermove', (e) => { if (steering) steer(e); });
  const stop = () => { steering = false; };
  area.addEventListener('pointerup', stop);
  area.addEventListener('pointercancel', stop);

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
    let idx = 0, mistakes = 0, hinted = false, running = true, paused = false, lastT = 0, peekUntil = 0;
    const bubbles = [], jellies = [];
    f.node.dataset.w = target;
    $('.g-pic-svg').innerHTML = itemSVG(target);
    $('.g-pic').classList.remove('alive');
    rebind($('.g-say'), () => say(target));
    say(target);
    area.querySelectorAll('.sb-bubble, .sb-jelly').forEach((n) => n.remove());

    const drawSlots = () => {
      const peek = performance.now() < peekUntil;
      slots.innerHTML = syls.map((s, i) => `<div class="g-slot ${i < idx ? 'on' : i === idx ? 'cur' : ''} ${peek && i >= idx ? 'peek' : ''}">${i < idx || peek ? esc(s) : ''}</div>`).join('');
      f.node.dataset.need = syls[idx] || '';
    };
    // 처음 만나는 글자는 잠깐 보여 주고 숨김 (기억해서 찾기)
    const peek = (ms) => { peekUntil = performance.now() + ms; drawSlots(); setTimeout(drawSlots, ms + 30); };
    if (!S.stats.words[target]?.ok || hinted) peek(boss ? 1400 : 2200);
    else drawSlots();

    function spawnBubbles() {
      bubbles.splice(0).forEach((b) => { b.el.classList.add('pop'); setTimeout(() => b.el.remove(), 300); });
      const need = syls[idx];
      const rivals = [...new Set([...vowelAlikes(need, 3), ...similarSyllables(need, 3)])].filter((s) => s !== need);
      const n = Math.min(rivals.length, 3 + Math.round(skill('sub') * 2) + (boss ? 1 : 0));
      const list = shuffle([need, need, ...shuffle(rivals).slice(0, n)]);
      list.forEach((s, i) => {
        const b = { s, x: AREA.x0 + 60 + ((i + 0.5) / list.length) * (AREA.x1 - AREA.x0 - 120) + (Math.random() - 0.5) * 60, y: AREA.y1 - Math.random() * (AREA.y1 - AREA.y0 - 40), vy: -(18 + Math.random() * 22), ph: Math.random() * 6 };
        b.el = el(`<div class="sb-bubble" data-s="${esc(s)}"><span>${esc(s)}</span></div>`);
        area.appendChild(b.el);
        bubbles.push(b);
      });
    }
    function spawnJellies() {
      const n = 1 + Math.round(skill('sub') * 1.5) + (boss ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const j = { x: AREA.x0 + 200 + Math.random() * 700, y: AREA.y0 + 60 + Math.random() * 340, vx: (Math.random() < 0.5 ? -1 : 1) * (50 + Math.random() * 40), ph: Math.random() * 6 };
        j.el = el(`<div class="sb-jelly">${jellySVG()}</div>`);
        area.appendChild(j.el);
        jellies.push(j);
      }
    }
    spawnBubbles();
    spawnJellies();

    function tick(t) {
      if (!running) return;
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
      lastT = t;
      if (!paused) {
        // 잠수함 이동
        if (sub.stun > 0) sub.stun -= dt;
        else {
          const dx = sub.tx - sub.x, dy = sub.ty - sub.y, d = Math.hypot(dx, dy);
          if (d > 2) { const step = Math.min(d, SPEED * dt); sub.x += (dx / d) * step; sub.y += (dy / d) * step; if (Math.abs(dx) > 8) sub.face = dx < 0 ? -1 : 1; }
        }
        placeSub();
        for (const b of bubbles) {
          b.ph += dt * 2;
          b.y += b.vy * dt;
          if (b.y < AREA.y0 + 10) { b.y = AREA.y1; }
          const x = b.x + Math.sin(b.ph) * 14;
          b.cx = x;
          b.el.style.transform = `translate(${x - 44}px, ${b.y - 44}px)`;
          if (!b.done && Math.hypot(x - sub.x, b.y - sub.y) < EAT) eat(b);
        }
        for (const j of jellies) {
          j.ph += dt * 2.4;
          j.x += j.vx * dt;
          if (j.x < AREA.x0 + 40 || j.x > AREA.x1 - 40) j.vx *= -1;
          const y = j.y + Math.sin(j.ph) * 30;
          j.el.style.transform = `translate(${j.x - 42}px, ${y - 46}px)`;
          if (sub.stun <= 0 && Math.hypot(j.x - sub.x, y - sub.y) < ZAP) zap(j);
        }
      }
      requestAnimationFrame(tick);
    }

    function zap(j) {
      sub.stun = 0.9;
      sfx('bad');
      subEl.classList.remove('zap'); void subEl.offsetWidth; subEl.classList.add('zap');
      // 해파리에서 살짝 밀려남
      const d = Math.hypot(sub.x - j.x, sub.y - j.y) || 1;
      sub.x = Math.max(AREA.x0, Math.min(AREA.x1, sub.x + ((sub.x - j.x) / d) * 70));
      sub.y = Math.max(AREA.y0, Math.min(AREA.y1, sub.y + ((sub.y - j.y) / d) * 70));
      sub.tx = sub.x; sub.ty = sub.y;
    }

    function eat(b) {
      const need = syls[idx];
      if (b.s === need) {
        b.done = true;
        sfx('ok');
        b.el.classList.add('pop');
        setTimeout(() => b.el.remove(), 300);
        bubbles.splice(bubbles.indexOf(b), 1);
        idx++;
        drawSlots();
        if (idx >= syls.length) { finish(); return; }
        say(b.s);
        spawnBubbles();
        return;
      }
      b.done = true;
      mistakes++;
      sfx('bad');
      nudge(subEl);
      b.el.classList.add('bad');
      setTimeout(() => { b.el.remove(); const k = bubbles.indexOf(b); if (k >= 0) bubbles.splice(k, 1); }, 400);
      const d = decompose(need);
      say(d && isTrickyVowel(d.jung) ? `그건 ${b.s}! ${vowelHow(d.jung)}가 들어간 글자를 찾아 봐.` : `그건 ${b.s}! 다른 거품을 찾아 봐.`);
    }

    async function finish() {
      running = false;
      sfx('win');
      $('.g-pic').classList.add('alive');
      confetti(600, 200);
      bubbles.splice(0).forEach((b) => b.el.remove());
      jellies.splice(0).forEach((j) => j.el.remove());
      await say(`뽀글뽀글~ ${target} 완성!`);
      await sleep(300);
      record(target, { mistakes, hinted });
      bumpSkill('sub', !mistakes && !hinted, mistakes);
      resolve({ w: target, ok: true, mistakes, hinted });
    }

    requestAnimationFrame(tick);
    return {
      abort() { running = false; stopSay(); resolve(null); },
      pause(v) { paused = v; },
      hint() {
        hinted = true;
        peek(1500);
        bubbles.filter((b) => b.s === syls[idx]).forEach((b) => { b.el.classList.remove('glow'); void b.el.offsetWidth; b.el.classList.add('glow'); });
      },
    };
  }
}
