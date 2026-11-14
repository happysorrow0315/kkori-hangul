// 3챕터 미니게임: 쌍둥이 행성 합치기 (ㄱ+ㄱ=ㄲ 처럼 끌어서 합치고, 순서대로 눌러 글자 완성)
import { el, shuffle, pick, sleep, confetti, nudge, toast, esc } from '../ui.js';
import { itemSVG, spaceBG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { syllables, compose, isCompound, VOWEL_SPLIT, combineVowels, SIMILAR, DOUBLE_OF, isDouble, combineConsonants } from '../hangul.js';
import { record, bumpSkill, skill } from '../adaptive.js';
import { frame, confirmExit, dots, picCard, rebind } from './common.js';
import { toStage } from '../ui.js';

const AREA = { x0: 150, y0: 300, x1: 1160, y1: 800 }, R = 50;
const COLORS = ['#ff8fab', '#7ec4ff', '#9be29b', '#ffd166', '#b69cff', '#ff9f43', '#7ee0e6'];

export async function playTwin(root, { words, boss = false }) {
  const f = frame(root, { bg: spaceBG(), title: boss ? '좀비괴물과 대결! 쌍둥이 행성' : '쌍둥이 행성을 합쳐서 글자를 만들어요', cls: 'twin' });
  f.body.innerHTML = `
    <div class="g-top">${picCard()}<div class="g-blocks"></div><div class="tw-tip">같은 행성끼리 끌어서 붙이면 쌍둥이 글자가 돼요!<br>그다음 차례대로 눌러요</div></div>
    <div class="g-dots"></div>
    <div class="tw-area"></div>`;
  const $ = (s) => f.body.querySelector(s);
  const area = $('.tw-area'), blocks = $('.g-blocks');
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
    const seq = [];
    sy.forEach((d, si) => {
      seq.push({ j: d.cho, si, part: 'cho' });
      if (isCompound(d.jung)) VOWEL_SPLIT[d.jung].forEach((j) => seq.push({ j, si, part: 'jung' }));
      else seq.push({ j: d.jung, si, part: 'jung' });
      if (d.jong) seq.push({ j: d.jong, si, part: 'jong' });
    });
    const built = sy.map(() => ({ cho: '', jung: '', jong: '' }));
    let idx = 0, mistakes = 0, hinted = false, running = true, paused = false, lastT = 0, busy = false;
    const planets = [];
    f.node.dataset.w = target;
    $('.g-pic-svg').innerHTML = itemSVG(target);
    $('.g-pic').classList.remove('alive');
    rebind($('.g-say'), () => say(target));
    say(target);

    const drawBlocks = () => {
      blocks.innerHTML = built.map((b, i) => {
        const big = b.cho && b.jung ? compose(b.cho, b.jung, b.jong) : (b.cho || b.jung || '');
        return `<div class="g-block ${seq[idx]?.si === i ? 'cur' : ''}"><div class="g-big ${big ? '' : 'empty'}">${esc(big || '?')}</div></div>`;
      }).join('');
      f.node.dataset.need = seq[idx]?.j || '';
    };


    function addPlanet(j, x, y) {
      const ang = Math.random() * Math.PI * 2, sp = 14 + Math.random() * 16;
      const p = { j, x: x ?? AREA.x0 + R + Math.random() * (AREA.x1 - AREA.x0 - 2 * R), y: y ?? AREA.y0 + R + Math.random() * (AREA.y1 - AREA.y0 - 2 * R), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp };
      p.node = el(`<button class="tw-planet ${isDouble(j) ? 'double' : ''}" data-j="${esc(j)}" style="--c:${pick(COLORS)}"><span>${esc(j)}</span></button>`);
      p.node.addEventListener('pointerdown', (e) => grab(e, p));
      area.appendChild(p.node);
      planets.push(p);
      place(p);
      return p;
    }
    const place = (p) => { p.node.style.transform = `translate(${p.x - R}px, ${p.y - R}px)`; };
    const remove = (p) => { p.gone = true; p.node.remove(); planets.splice(planets.indexOf(p), 1); };

    // 행성 만들기: 쌍자음은 같은 자음 두 개로 나눠서
    area.innerHTML = '';
    const pieces = [];
    seq.forEach((s) => { if (isDouble(s.j)) pieces.push(DOUBLE_OF[s.j], DOUBLE_OF[s.j]); else pieces.push(s.j); });
    const decoys = shuffle([...new Set(pieces.flatMap((j) => SIMILAR[j] || []))].filter((j) => !pieces.includes(j) && !isDouble(j))).slice(0, 2 + Math.round(skill('twin') * 2));
    shuffle([...pieces, ...decoys]).forEach((j) => addPlanet(j));

    function tick(t) {
      if (!running) return;
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
      lastT = t;
      if (!paused) for (const p of planets) {
        if (p.drag) continue;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < AREA.x0 + R || p.x > AREA.x1 - R) { p.vx *= -1; p.x = Math.max(AREA.x0 + R, Math.min(AREA.x1 - R, p.x)); }
        if (p.y < AREA.y0 + R || p.y > AREA.y1 - R) { p.vy *= -1; p.y = Math.max(AREA.y0 + R, Math.min(AREA.y1 - R, p.y)); }
        place(p);
      }
      requestAnimationFrame(tick);
    }

    // 누르면 사용, 끌면 옮기기 (다른 행성 위에 놓으면 합치기)
    function grab(e, p) {
      if (!running || paused || busy) return;
      e.preventDefault();
      const s0 = toStage(e), ox = p.x - s0.x, oy = p.y - s0.y;
      let moved = false;
      p.drag = true;
      p.node.setPointerCapture?.(e.pointerId);
      p.node.classList.add('drag');
      const move = (ev) => {
        const q = toStage(ev);
        if (Math.hypot(q.x - s0.x, q.y - s0.y) > 12) moved = true;
        p.x = Math.max(AREA.x0, Math.min(AREA.x1, q.x + ox)); p.y = Math.max(AREA.y0, Math.min(AREA.y1, q.y + oy));
        place(p);
      };
      const up = () => {
        p.node.removeEventListener('pointermove', move);
        p.node.removeEventListener('pointerup', up);
        p.node.removeEventListener('pointercancel', up);
        p.drag = false;
        p.node.classList.remove('drag');
        if (!moved) { use(p); return; }
        const other = planets.find((o) => o !== p && !o.gone && Math.hypot(o.x - p.x, o.y - p.y) < R * 1.4);
        if (!other) return;
        const dbl = combineConsonants(p.j, other.j);
        if (dbl) {
          sfx('magic');
          const x = (p.x + other.x) / 2, y = (p.y + other.y) / 2;
          remove(p); remove(other);
          const np = addPlanet(dbl, x, y);
          np.node.classList.add('born');
          const pop = el(`<div class="combine-pop tw-pop" style="left:${x}px;top:${y - 80}px">${esc(p.j)} + ${esc(other.j)} = ${esc(dbl)}</div>`);
          area.appendChild(pop);
          setTimeout(() => pop.remove(), 2000);
          say(`우와! 쌍둥이 ${dbl}!`);
        } else {
          sfx('bad');
          [p, other].forEach((x) => { x.vx = (x.x - (p.x + other.x) / 2) * 3; x.vy = (x.y - (p.y + other.y) / 2) * 3; nudge(x.node); });
          setTimeout(() => planets.forEach((x) => { const sp = Math.hypot(x.vx, x.vy); if (sp > 40) { x.vx *= 30 / sp; x.vy *= 30 / sp; } }), 600);
          toast('같은 쌍둥이끼리만 합쳐져!');
        }
      };
      p.node.addEventListener('pointermove', move);
      p.node.addEventListener('pointerup', up);
      p.node.addEventListener('pointercancel', up);
    }

    function use(p) {
      const want = seq[idx];
      if (!want) return;
      if (p.j === want.j) {
        sfx('ok');
        p.node.classList.add('pop-out');
        p.gone = true;
        setTimeout(() => { p.node.remove(); planets.splice(planets.indexOf(p), 1); }, 300);
        const b = built[want.si];
        if (want.part === 'cho') b.cho = p.j;
        else if (want.part === 'jong') b.jong = p.j;
        else if (b.jung && combineVowels(b.jung, p.j)) b.jung = combineVowels(b.jung, p.j);
        else b.jung = p.j;
        idx++;
        drawBlocks();
        if (idx >= seq.length) finish();
        return;
      }
      // 쌍자음이 필요한데 홑자음을 누른 경우: 합치라고 알려줌
      if (isDouble(want.j) && DOUBLE_OF[want.j] === p.j) {
        nudge(p.node);
        say(`${p.j} 두 개를 합쳐서 ${want.j}을 만들어 봐!`);
        return;
      }
      mistakes++;
      sfx('bad');
      nudge(p.node);
      say('음~ 그건 아니야. 다음 글자 조각을 찾아 봐!');
    }

    async function finish() {
      running = false;
      sfx('win');
      $('.g-pic').classList.add('alive');
      confetti(590, 160);
      await say(`짠! ${target} 완성!`);
      await sleep(400);
      record(target, { mistakes, hinted });
      bumpSkill('twin', !mistakes && !hinted, mistakes);
      resolve({ w: target, ok: true, mistakes, hinted });
    }

    drawBlocks();
    requestAnimationFrame(tick);
    return {
      abort() { running = false; stopSay(); resolve(null); },
      pause(v) { paused = v; },
      hint() {
        hinted = true;
        const want = seq[idx];
        if (!want) return;
        say(target);
        const ps = planets.filter((p) => !p.gone && (p.j === want.j || (isDouble(want.j) && p.j === DOUBLE_OF[want.j])));
        ps.forEach((p) => { p.node.classList.remove('glow'); void p.node.offsetWidth; p.node.classList.add('glow'); });
      },
    };
  }
}
