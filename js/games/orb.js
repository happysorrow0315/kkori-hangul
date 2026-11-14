// 미니게임 6: 마법 구슬 맞추기 (날아다니는 자모를 순서대로 맞혀 글자 완성)
import { el, shuffle, pick, sleep, confetti, nudge, speech, esc } from '../ui.js';
import { itemSVG, traceBG, zombieSVG, wandSVG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { syllables, compose, combineVowels, isCompound, VOWEL_SPLIT, SIMILAR, SIMILAR_JONG } from '../hangul.js';
import { record, bumpSkill, skill, splitChance } from '../adaptive.js';
import { frame, confirmExit, dots, picCard, rebind } from './common.js';

const AREA = { x0: 150, y0: 300, x1: 1160, y1: 800 }, R = 52, MAX_STEPS = 5;
const ORB_COLORS = ['#ff8fab', '#7ec4ff', '#9be29b', '#ffd166', '#b69cff', '#ff9f43'];

export async function playOrb(root, { words, boss = false }) {
  const f = frame(root, { bg: traceBG(), title: boss ? '좀비괴물과 대결! 마법 구슬' : '마법 구슬을 순서대로 맞혀요', cls: 'orb' });
  f.body.innerHTML = `
    <div class="g-top">${picCard()}<div class="g-blocks"></div>
      <div class="orb-steps"><div class="orb-zombie">${zombieSVG('evil')}</div><div class="orb-dots"></div></div>
    </div>
    <div class="g-dots"></div>
    <svg class="orb-zap" viewBox="0 0 1180 820"><line x1="590" y1="820" x2="590" y2="820"/></svg>
    <div class="orb-area"></div>
    <div class="orb-wand">${wandSVG(0)}</div>`;
  const $ = (s) => f.body.querySelector(s);
  const area = $('.orb-area'), blocks = $('.g-blocks'), zap = $('.orb-zap line');
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
    const sy = syllables(target);
    const split = Math.random() < splitChance();
    // 맞혀야 할 순서: 첫소리 → 가운데소리(복모음은 두 조각)
    const seq = [];
    sy.forEach((d, si) => {
      seq.push({ j: d.cho, si, part: 'cho' });
      if (split && isCompound(d.jung)) VOWEL_SPLIT[d.jung].forEach((j) => seq.push({ j, si, part: 'jung' }));
      else seq.push({ j: d.jung, si, part: 'jung' });
      if (d.jong) seq.push({ j: d.jong, si, part: 'jong' });
    });
    const built = sy.map(() => ({ cho: '', jung: '', jong: '' }));
    let idx = 0, mistakes = 0, hinted = false, steps = 0, running = true, paused = false, busy = false, lastT = 0;
    const orbs = [];
    f.node.dataset.w = target;
    $('.g-pic-svg').innerHTML = itemSVG(target);
    $('.g-pic').classList.remove('alive');
    rebind($('.g-say'), () => say(target));
    say(target);

    const drawBlocks = () => {
      blocks.innerHTML = built.map((b, i) => {
        const big = b.cho && b.jung ? compose(b.cho, b.jung, b.jong) : (b.cho || b.jung || '');
        const cur = seq[idx]?.si === i;
        return `<div class="g-block ${cur ? 'cur' : ''}"><div class="g-big ${big ? '' : 'empty'}">${esc(big || '?')}</div></div>`;
      }).join('');
      f.node.dataset.need = seq[idx]?.j || '';
    };
    const drawSteps = () => {
      $('.orb-dots').innerHTML = Array.from({ length: MAX_STEPS }, (_, i) => `<i class="${i < steps ? 'on' : ''}"></i>`).join('');
      $('.orb-zombie').style.left = (steps / MAX_STEPS) * 100 + '%';
    };

    function spawnAll() {
      area.innerHTML = '';
      orbs.length = 0;
      const need = seq.slice(idx).map((s) => s.j);
      const decoys = shuffle([...new Set(need.flatMap((j) => [...(SIMILAR[j] || []), ...(SIMILAR_JONG[j] || [])]))].filter((j) => !need.includes(j)))
        .slice(0, 3 + Math.round(skill('orb') * 2));
      [...need, ...decoys].forEach((j) => addOrb(j));
    }
    function addOrb(j) {
      const ang = Math.random() * Math.PI * 2, sp = (60 + Math.random() * 50 + skill('orb') * 50) * (boss ? 1.3 : 1);
      const o = { j, x: AREA.x0 + R + Math.random() * (AREA.x1 - AREA.x0 - 2 * R), y: AREA.y0 + R + Math.random() * (AREA.y1 - AREA.y0 - 2 * R), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp };
      o.node = el(`<button class="orb-one" data-j="${esc(j)}" style="--c:${pick(ORB_COLORS)}">${esc(j)}</button>`);
      o.node.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(o); });
      area.appendChild(o.node);
      orbs.push(o);
      move(o);
    }
    const move = (o) => { o.node.style.transform = `translate(${o.x - R}px, ${o.y - R}px)`; };

    function tick(t) {
      if (!running) return;
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
      lastT = t;
      if (!paused) for (const o of orbs) {
        if (o.gone) continue;
        o.x += o.vx * dt; o.y += o.vy * dt;
        if (o.x < AREA.x0 + R || o.x > AREA.x1 - R) { o.vx *= -1; o.x = Math.max(AREA.x0 + R, Math.min(AREA.x1 - R, o.x)); }
        if (o.y < AREA.y0 + R || o.y > AREA.y1 - R) { o.vy *= -1; o.y = Math.max(AREA.y0 + R, Math.min(AREA.y1 - R, o.y)); }
        move(o);
      }
      requestAnimationFrame(tick);
    }

    async function hit(o) {
      if (!running || paused || busy || o.gone) return;
      busy = true;
      zap.setAttribute('x2', o.x); zap.setAttribute('y2', o.y);
      zap.classList.add('on');
      setTimeout(() => zap.classList.remove('on'), 220);
      const want = seq[idx];
      if (o.j === want.j) {
        sfx('magic');
        o.gone = true;
        o.node.classList.add('pop-out');
        setTimeout(() => o.node.remove(), 300);
        const b = built[want.si];
        if (want.part === 'cho') b.cho = o.j;
        else if (want.part === 'jong') b.jong = o.j;
        else if (b.jung && combineVowels(b.jung, o.j)) {
          const before = b.jung;
          b.jung = combineVowels(before, o.j);
          drawBlocks();
          blocks.children[want.si]?.appendChild(el(`<div class="combine-pop">${esc(before)} + ${esc(o.j)} = ${esc(b.jung)}</div>`));
          idx++;
          f.node.dataset.need = seq[idx]?.j || '';
          busy = false;
          if (idx >= seq.length) finish();
          return;
        } else b.jung = o.j;
        idx++;
        drawBlocks();
        if (idx >= seq.length) { finish(); return; }
      } else {
        mistakes++;
        steps++;
        sfx('bad');
        nudge(o.node);
        o.node.classList.add('nope');
        setTimeout(() => o.node.classList.remove('nope'), 500);
        o.vx *= -1.4; o.vy *= -1.4;
        drawSteps();
        if (steps >= MAX_STEPS) { await caught(); }
      }
      busy = false;
    }

    async function caught() {
      paused = true;
      sfx('chomp');
      await speech({ who: 'zombie', mood: 'eat', text: '냠냠! 구슬은 내 거야~', root });
      if (!running) return;
      await speech({ who: 'kkori', text: '괜찮아! 천천히 다시 해 보자. 하나씩 차례로 맞히는 거야.', root });
      steps = 0; idx = 0;
      built.forEach((b) => { b.cho = ''; b.jung = ''; b.jong = ''; });
      drawBlocks(); drawSteps(); spawnAll();
      paused = false;
    }

    async function finish() {
      running = false;
      sfx('win');
      drawBlocks();
      $('.g-pic').classList.add('alive');
      confetti(590, 160);
      await say(`짠! ${target} 완성!`);
      await sleep(400);
      record(target, { mistakes, hinted });
      bumpSkill('orb', !mistakes && !hinted, mistakes);
      resolve({ w: target, ok: true, mistakes, hinted });
    }

    drawBlocks(); drawSteps(); spawnAll();
    requestAnimationFrame(tick);
    return {
      abort() { running = false; stopSay(); resolve(null); },
      pause(v) { paused = v; },
      hint() {
        hinted = true;
        say(target);
        const o = orbs.find((x) => !x.gone && x.j === seq[idx]?.j);
        if (o) { o.node.classList.remove('glow'); void o.node.offsetWidth; o.node.classList.add('glow'); }
      },
    };
  }
}
