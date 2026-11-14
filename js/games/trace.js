// 미니게임 3: 봉인 마법 따라 쓰기 (애플펜슬/손가락)
import { el, onTap, sleep, confetti, esc } from '../ui.js';
import { itemSVG, traceBG, wandSVG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { S } from '../state.js';
import { syllableStrokes, judgeStroke, samplePoly } from '../strokes.js';
import { toolLevel, record, bumpSkill } from '../adaptive.js';
import { frame, confirmExit } from './common.js';

const SIZE = 600, PAD = 60, BOX = SIZE - PAD * 2;
const P = ([x, y]) => [PAD + x * BOX, PAD + y * BOX];
const pathD = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${P(p)[0].toFixed(1)} ${P(p)[1].toFixed(1)}`).join(' ');
const PEN = ['#4f9dff', 'rainbow', '#ffb81c'];

export async function playTrace(root, { words, boss = false }) {
  const word = words[0];
  const level = toolLevel('trace');
  const f = frame(root, { bg: traceBG(S.chapter), title: boss ? '좀비괴물과 대결! 봉인 풀기' : '글자를 따라 써서 봉인을 풀어요', cls: 'trace' });
  f.body.innerHTML = `
    <div class="trace-left">
      <div class="seal">
        <div class="seal-pic">${itemSVG(word)}</div>
        <svg class="seal-ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke="#c9a6ff" stroke-width="6" stroke-dasharray="14 10"/><circle cx="100" cy="100" r="74" fill="none" stroke="#e7d6ff" stroke-width="3"/><path d="M100 22 L118 70 L170 70 L128 100 L144 150 L100 120 L56 150 L72 100 L30 70 L82 70Z" fill="none" stroke="#c9a6ff" stroke-width="3"/></svg>
        <svg class="seal-chain" viewBox="0 0 200 200"><path d="M10 40 L190 160 M10 160 L190 40" stroke="#8a7aa8" stroke-width="10" stroke-dasharray="18 8" stroke-linecap="round"/></svg>
      </div>
      <div class="trace-word"></div>
      <div class="trace-tip">반짝이는 점에서 시작해요</div>
      <div class="trace-wand">${wandSVG(level)}</div>
    </div>
    <div class="trace-board">
      <svg class="trace-guide" viewBox="0 0 ${SIZE} ${SIZE}"></svg>
      <canvas class="trace-ink" width="${SIZE * 2}" height="${SIZE * 2}"></canvas>
    </div>`;
  const $ = (s) => f.body.querySelector(s);
  const guide = $('.trace-guide'), canvas = $('.trace-ink'), tip = $('.trace-tip'), wordEl = $('.trace-word');
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  const chars = [...word];
  let aborted = false, done = false, totalFails = 0, hinted = false;
  let ci = 0, strokes = [], si = 0, strokeFails = 0;
  let demoTimer = null;
  let resolveAll;
  const finished = new Promise((r) => { resolveAll = r; });

  onTap(f.exit, async () => {
    if (await confirmExit(root)) { aborted = true; done = true; stopSay(); resolveAll(); }
  });
  onTap(f.hint, () => { if (done) return; hinted = true; say(chars[ci]); demo(); });

  function renderWord() {
    wordEl.innerHTML = chars.map((c, i) => `<span class="${i < ci ? 'done' : i === ci ? 'cur' : ''}">${esc(c)}</span>`).join('');
  }

  function penColor(t = 0) {
    const c = PEN[level];
    return c === 'rainbow' ? `hsl(${(t * 0.25) % 360} 90% 60%)` : c;
  }

  function renderGuide() {
    const cur = strokes[si];
    let h = '';
    strokes.forEach((s, i) => {
      const cls = i < si ? 'done' : i === si ? 'cur' : 'todo';
      h += `<path class="g-${cls}" d="${pathD(s)}" ${i < si ? `stroke="${PEN[level] === 'rainbow' ? `hsl(${i * 50} 85% 60%)` : PEN[level]}"` : ''}/>`;
    });
    if (cur) {
      const [sx, sy] = P(cur[0]);
      const smp = samplePoly(cur, 10);
      const [ax, ay] = P(smp[1]);
      const ang = (Math.atan2(ay - sy, ax - sx) * 180) / Math.PI;
      h += `<g transform="translate(${sx} ${sy}) rotate(${ang})"><path class="g-arrow" d="M30 -12 L52 0 L30 12Z"/></g>`;
      h += `<circle class="g-start" cx="${sx}" cy="${sy}" r="22"/><text x="${sx}" y="${sy + 9}" class="g-num">${si + 1}</text>`;
    }
    guide.innerHTML = h;
  }

  function demo() {
    const cur = strokes[si];
    if (!cur) return;
    clearTimeout(demoTimer);
    guide.querySelector('.g-demo')?.remove();
    const pts = samplePoly(cur, 30);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('class', 'g-demo');
    dot.setAttribute('r', '16');
    guide.appendChild(dot);
    let k = 0;
    const step = () => {
      if (k >= pts.length) { dot.remove(); return; }
      const [x, y] = P(pts[k++]);
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      demoTimer = setTimeout(step, 28);
    };
    step();
  }

  function startChar() {
    strokes = syllableStrokes(chars[ci]);
    si = 0;
    strokeFails = 0;
    renderWord();
    renderGuide();
    say(chars[ci]);
    if ((S.tools.trace || 0) < 3) setTimeout(demo, 500);
  }

  // ───── 그리기 ─────
  let penSeen = false, activeId = null, pts = [], lastPt = null, t0 = 0;
  const toLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * SIZE, ((e.clientY - r.top) / r.height) * SIZE];
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (done || activeId !== null) return;
    if (e.pointerType === 'pen') penSeen = true;
    else if (penSeen && e.pointerType === 'touch') return; // 펜 쓸 때 손바닥 무시
    activeId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    pts = [toLocal(e)];
    lastPt = pts[0];
    t0 = performance.now();
    ctx.clearRect(0, 0, SIZE, SIZE);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeId) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events) {
      const p = toLocal(ev);
      ctx.strokeStyle = penColor(performance.now() - t0);
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (level === 2) { ctx.shadowColor = '#fff3a0'; ctx.shadowBlur = 12; }
      ctx.beginPath();
      ctx.moveTo(lastPt[0], lastPt[1]);
      ctx.lineTo(p[0], p[1]);
      ctx.stroke();
      lastPt = p;
      pts.push(p);
    }
    e.preventDefault();
  });
  const end = (e) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    if (done) return;
    const norm = pts.map(([x, y]) => [(x - PAD) / BOX, (y - PAD) / BOX]);
    if (norm.length < 3) { ctx.clearRect(0, 0, SIZE, SIZE); return; }
    const res = judgeStroke(norm, strokes[si]);
    if (res === 'ok') {
      sfx('stroke');
      ctx.clearRect(0, 0, SIZE, SIZE);
      si++;
      strokeFails = 0;
      tip.textContent = pickPraise();
      if (si >= strokes.length) charDone();
      else renderGuide();
    } else {
      totalFails++;
      strokeFails++;
      sfx('bad');
      canvas.classList.add('fail');
      setTimeout(() => { ctx.clearRect(0, 0, SIZE, SIZE); canvas.classList.remove('fail'); }, 450);
      tip.textContent = res === 'reverse' ? '반짝이는 점에서 시작해 봐!' : '회색 길을 따라 천천히 그려 봐!';
      if (strokeFails >= 2) demo();
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  async function charDone() {
    renderGuide();
    guide.classList.add('glow');
    await say(chars[ci]);
    await sleep(300);
    guide.classList.remove('glow');
    ci++;
    if (ci < chars.length) { startChar(); return; }
    done = true;
    renderWord();
    sfx('break');
    $('.seal').classList.add('broken');
    confetti(230, 300);
    await say(`우와! ${word} 봉인이 풀렸어!`);
    await sleep(600);
    resolveAll();
  }

  startChar();
  await finished;
  clearTimeout(demoTimer);
  if (aborted) return { words: [], aborted: true };
  const mistakes = Math.floor(totalFails / 3);
  record(word, { mistakes, hinted });
  bumpSkill('trace', !mistakes && !hinted, mistakes);
  return { words: [{ w: word, ok: true, mistakes, hinted }], aborted: false };
}

const PRAISE = ['잘했어!', '좋아!', '멋져!', '최고야!', '반짝반짝!'];
const pickPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
