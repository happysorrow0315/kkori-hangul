// 3챕터 미니게임: 별자리 잇기 (글자 조각이 적힌 별을 쓰는 순서대로 이으면 그림으로 변신)
import { el, shuffle, sleep, confetti, nudge, esc, toStage } from '../ui.js';
import { itemSVG, spaceBG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { syllables, compose, isCompound, VOWEL_SPLIT, combineVowels, SIMILAR } from '../hangul.js';
import { record, bumpSkill, skill } from '../adaptive.js';
import { frame, confirmExit, dots, picCard, rebind } from './common.js';

const AREA = { x0: 170, y0: 310, x1: 1120, y1: 780 }, SNAP = 50, MIN_GAP = 118;

function layout(n) {
  const pts = [];
  for (let t = 0; t < 4000 && pts.length < n; t++) {
    const p = [AREA.x0 + Math.random() * (AREA.x1 - AREA.x0), AREA.y0 + Math.random() * (AREA.y1 - AREA.y0)];
    if (pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > MIN_GAP)) pts.push(p);
  }
  while (pts.length < n) pts.push([AREA.x0 + Math.random() * 900, AREA.y0 + Math.random() * 400]);
  return pts;
}

export async function playStars(root, { words, boss = false }) {
  const f = frame(root, { bg: spaceBG(true), title: boss ? '좀비괴물과 대결! 별자리 잇기' : '별을 순서대로 이어서 별자리를 만들어요', cls: 'stars' });
  f.body.innerHTML = `
    <div class="g-top">${picCard()}<div class="g-blocks"></div><div class="st-tip">첫소리부터 쓰는 순서대로<br>별을 쭉 이어 봐요</div></div>
    <div class="g-dots"></div>
    <svg class="st-lines" viewBox="0 0 1180 820"></svg>
    <div class="st-area"></div>
    <div class="st-pic"></div>`;
  const $ = (s) => f.body.querySelector(s);
  const area = $('.st-area'), lines = $('.st-lines'), blocks = $('.g-blocks'), bigPic = $('.st-pic');
  const results = [];
  let aborted = false, current = null;
  rebind(f.exit, async () => { if (await confirmExit(root)) { aborted = true; current?.abort(); } });
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
    let idx = 0, mistakes = 0, hinted = false, done = false;
    f.node.dataset.w = target;
    $('.g-pic-svg').innerHTML = itemSVG(target);
    $('.g-pic').classList.remove('alive');
    rebind($('.g-say'), () => say(target));
    say(target);
    bigPic.innerHTML = '';
    bigPic.classList.remove('show');
    lines.innerHTML = '';

    const decoys = shuffle([...new Set(seq.flatMap((s) => SIMILAR[s.j] || []))].filter((j) => !seq.some((s) => s.j === j))).slice(0, 3 + Math.round(skill('stars') * 2));
    const all = [...seq.map((s, k) => ({ j: s.j, k })), ...decoys.map((j) => ({ j, k: -1 }))];
    const pts = layout(all.length);
    area.innerHTML = '';
    const stars = shuffle(all).map((s, i) => {
      const [x, y] = pts[i];
      const node = el(`<button class="st-star" data-j="${esc(s.j)}" data-k="${s.k}" style="left:${x}px;top:${y}px"><span>${esc(s.j)}</span></button>`);
      area.appendChild(node);
      return { ...s, x, y, node, on: false };
    });
    // 같은 글자 조각이 여러 개면 아무거나 순서에 맞게 쓸 수 있게
    const nextStar = (x, y) => stars.filter((s) => !s.on && s.j === seq[idx]?.j).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    let last = null;

    const drawBlocks = () => {
      blocks.innerHTML = built.map((b, i) => {
        const big = b.cho && b.jung ? compose(b.cho, b.jung, b.jong) : (b.cho || b.jung || '');
        return `<div class="g-block ${seq[idx]?.si === i ? 'cur' : ''}"><div class="g-big ${big ? '' : 'empty'}">${esc(big || '?')}</div></div>`;
      }).join('');
      f.node.dataset.need = seq[idx]?.j || '';
    };

    function connect(s) {
      s.on = true;
      s.node.classList.add('on');
      if (last) lines.insertAdjacentHTML('beforeend', `<line x1="${last.x}" y1="${last.y}" x2="${s.x}" y2="${s.y}"/>`);
      last = s;
      sfx('stroke');
      const want = seq[idx], b = built[want.si];
      if (want.part === 'cho') b.cho = s.j;
      else if (want.part === 'jong') b.jong = s.j;
      else if (b.jung && combineVowels(b.jung, s.j)) b.jung = combineVowels(b.jung, s.j);
      else b.jung = s.j;
      idx++;
      drawBlocks();
      if (idx >= seq.length) finish();
    }

    // 누르거나 끌면서 지나가면 다음 별이 이어짐
    let drawing = false;
    const at = (q) => stars.find((s) => Math.hypot(s.x - q.x, s.y - q.y) < SNAP);
    const onDown = (e) => {
      if (done) return;
      const q = toStage(e);
      const s = at(q);
      drawing = true;
      if (!s) return;
      if (s.on) return;
      if (s.j === seq[idx].j) connect(s);
      else {
        mistakes++;
        sfx('bad');
        nudge(s.node);
        say('음~ 그 별은 아직이야. 쓰는 순서를 생각해 봐!');
      }
    };
    const onMove = (e) => {
      if (!drawing || done) return;
      const q = toStage(e);
      const s = nextStar(q.x, q.y);
      if (s && Math.hypot(s.x - q.x, s.y - q.y) < SNAP) connect(s);
    };
    const onUp = () => { drawing = false; };
    area.onpointerdown = onDown;
    area.onpointermove = onMove;
    area.onpointerup = onUp;
    area.onpointercancel = onUp;

    async function finish() {
      done = true;
      sfx('win');
      lines.classList.add('glow');
      const cx = stars.filter((s) => s.on).reduce((a, s) => a + s.x, 0) / seq.length;
      const cy = stars.filter((s) => s.on).reduce((a, s) => a + s.y, 0) / seq.length;
      bigPic.style.left = Math.max(230, Math.min(950, cx)) + 'px';
      bigPic.style.top = Math.max(420, Math.min(680, cy)) + 'px';
      bigPic.innerHTML = itemSVG(target);
      bigPic.classList.add('show');
      $('.g-pic').classList.add('alive');
      confetti(cx, cy);
      await say(`반짝반짝! ${target} 별자리 완성!`);
      await sleep(600);
      lines.classList.remove('glow');
      record(target, { mistakes, hinted });
      bumpSkill('stars', !mistakes && !hinted, mistakes);
      resolve({ w: target, ok: true, mistakes, hinted });
    }

    drawBlocks();
    return {
      abort() { done = true; stopSay(); resolve(null); },
      hint() {
        if (done) return;
        hinted = true;
        say(target);
        const s = nextStar(last?.x ?? 600, last?.y ?? 500);
        if (s) { s.node.classList.remove('glow'); void s.node.offsetWidth; s.node.classList.add('glow'); }
      },
    };
  }
}
