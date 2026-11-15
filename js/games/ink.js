// 4챕터 미니게임: 문어 먹물 지우기 (먹물을 문질러 지우고 글자를 읽어 맞는 그림 고르기)
import { el, shuffle, sleep, confetti, shake, esc, toStage, toast } from '../ui.js';
import { itemSVG, seaBG, hasItemArt } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { similarity, decompose, AE_SPLIT, VOWEL_SPLIT, isTrickyVowel } from '../hangul.js';
import { ALL_WORDS, wordsOf } from '../words.js';
import { record, bumpSkill, skill } from '../adaptive.js';
import { S } from '../state.js';
import { frame, confirmExit, dots, rebind } from './common.js';

const CARD = { x: 300, y: 110, w: 580, h: 270 }; // 글자 카드 (무대 좌표)
const GX = 29, GY = 13; // 지운 정도를 재는 칸
const BRUSH = 38;

const octoSVG = (mood = 'oops') => `<svg viewBox="0 0 140 140" stroke="#5a4032" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
  ${[20, 42, 64, 86, 108].map((x, i) => `<path d="M${x + 6} 86 C${x - 6} 104 ${x + 16} 112 ${x + 2} ${130 - (i % 2) * 8}" fill="none" stroke="#5a4032" stroke-width="16"/><path d="M${x + 6} 86 C${x - 6} 104 ${x + 16} 112 ${x + 2} ${130 - (i % 2) * 8}" fill="none" stroke="#ff8f8f" stroke-width="10"/>`).join('')}
  <path d="M18 80 C10 20 130 20 122 80 C110 96 30 96 18 80Z" fill="#ff8f8f"/>
  <circle cx="52" cy="58" r="10" fill="#fff"/><circle cx="88" cy="58" r="10" fill="#fff"/>
  <circle cx="${mood === 'oops' ? 54 : 52}" cy="60" r="4.5" fill="#5a4032" stroke="none"/><circle cx="${mood === 'oops' ? 90 : 88}" cy="60" r="4.5" fill="#5a4032" stroke="none"/>
  ${mood === 'oops' ? '<circle cx="70" cy="78" r="6" fill="#5a2a3a"/>' : '<path d="M60 74 Q70 84 80 74" fill="none" stroke-width="3.5"/>'}
  <ellipse cx="40" cy="74" rx="6" ry="3.5" fill="#ff9fb6" stroke="none" opacity=".7"/><ellipse cx="100" cy="74" rx="6" ry="3.5" fill="#ff9fb6" stroke="none" opacity=".7"/>
</svg>`;

// 헷갈리는 그림 고르기: ㅐ↔ㅔ 짝이 있으면 꼭 넣고, 나머지는 비슷한 글자
function confusers(target, n) {
  const pool = [...new Set([...wordsOf(S.chapter), ...ALL_WORDS])].filter((w) => w !== target && hasItemArt(w));
  const swap = [...target].map((c) => { const d = decompose(c); return d && { 'ㅐ': 'ㅔ', 'ㅔ': 'ㅐ' }[d.jung] ? String.fromCharCode(c.charCodeAt(0) + (d.jung === 'ㅐ' ? 112 : -112)) : c; }).join('');
  const out = swap !== target && pool.includes(swap) ? [swap] : [];
  const ranked = shuffle(pool).filter((w) => !out.includes(w)).sort((a, b) => similarity(target, b) - similarity(target, a));
  out.push(...shuffle(ranked.slice(0, 6)).slice(0, n - out.length));
  return out;
}

function inkBlots(ctx) {
  ctx.clearRect(0, 0, CARD.w, CARD.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#2b2440';
  ctx.fillRect(0, 0, CARD.w, CARD.h);
  ctx.fillStyle = '#3d3460';
  for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(Math.random() * CARD.w, Math.random() * CARD.h, 14 + Math.random() * 40, 0, Math.PI * 2); ctx.fill(); }
}

export async function playInk(root, { words, boss = false }) {
  const f = frame(root, { bg: seaBG(), title: boss ? '좀비괴물과 대결! 먹물 지우기' : '먹물을 지우고 글자를 읽어요', cls: 'ink' });
  f.body.innerHTML = `
    <div class="ik-octo">${octoSVG()}</div>
    <div class="g-dots"></div>
    <div class="ik-card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px"><div class="ik-word"></div><canvas class="ik-ink" width="${CARD.w}" height="${CARD.h}"></canvas></div>
    <div class="ik-tip">손가락으로 먹물을<br>쓱쓱 문질러요.<br>조금만 지우고 맞히면<br>진주를 하나 더!</div>
    <div class="ik-choices"></div>`;
  const $ = (s) => f.body.querySelector(s);
  const canvas = $('.ik-ink'), ctx = canvas.getContext('2d'), wordEl = $('.ik-word'), choicesEl = $('.ik-choices'), octo = $('.ik-octo');
  const results = [];
  let aborted = false, current = null, bonusStars = 0;
  rebind(f.exit, async () => { if (await confirmExit(root)) { aborted = true; current?.abort(); } });
  rebind(f.hint, () => current?.hint());

  // 문질러 지우기 (손가락 위치 → 카드 안 좌표)
  let rubbing = false, prev = null;
  const toCard = (e) => { const p = toStage(e); return { x: p.x - CARD.x, y: p.y - CARD.y }; };
  const rub = (p) => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineWidth = BRUSH * 2;
    ctx.beginPath();
    ctx.moveTo((prev || p).x, (prev || p).y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    // 지운 칸 표시
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - (prev || p).x, p.y - (prev || p).y) / 10));
    for (let s = 0; s <= steps; s++) {
      const x = (prev || p).x + ((p.x - (prev || p).x) * s) / steps, y = (prev || p).y + ((p.y - (prev || p).y) * s) / steps;
      for (let gx = 0; gx < GX; gx++) for (let gy = 0; gy < GY; gy++) {
        const cx = ((gx + 0.5) * CARD.w) / GX, cy = ((gy + 0.5) * CARD.h) / GY;
        if (Math.hypot(cx - x, cy - y) < BRUSH) current?.cells.add(gx + gy * GX);
      }
    }
    prev = p;
    current?.rubbed();
  };
  canvas.addEventListener('pointerdown', (e) => { if (!current || current.done) return; e.preventDefault(); rubbing = true; prev = null; canvas.setPointerCapture?.(e.pointerId); rub(toCard(e)); });
  canvas.addEventListener('pointermove', (e) => { if (rubbing) rub(toCard(e)); });
  const end = () => { rubbing = false; prev = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  for (let i = 0; i < words.length && !aborted; i++) {
    $('.g-dots').innerHTML = dots(words.length, i);
    const r = await new Promise((resolve) => { current = round(words[i], resolve); });
    if (r) results.push(r);
  }
  current = null;
  return { words: results, aborted, bonusStars };

  function round(target, resolve) {
    let mistakes = 0, hinted = false, said = false;
    const st = { done: false, cells: new Set() };
    f.node.dataset.w = target;
    wordEl.textContent = target;
    wordEl.style.fontSize = (target.length >= 3 ? 120 : 150) + 'px';
    canvas.style.transition = 'none';
    canvas.style.opacity = 1;
    inkBlots(ctx);
    octo.innerHTML = octoSVG('oops');
    octo.classList.remove('squirt'); void octo.offsetWidth; octo.classList.add('squirt');
    sfx('pop');
    const opts = shuffle([target, ...confusers(target, boss || skill('ink') >= 0.6 ? 3 : 2)]);
    choicesEl.innerHTML = opts.map((w) => `<button class="ik-choice" data-w="${esc(w)}"><div class="ik-pic">${itemSVG(w)}</div></button>`).join('');
    const erased = () => st.cells.size / (GX * GY);
    st.rubbed = () => { if (!said && erased() > 0.12) { said = true; choicesEl.classList.add('ready'); } };

    choicesEl.querySelectorAll('.ik-choice').forEach((b) => b.addEventListener('click', async () => {
      if (st.done || b.classList.contains('nope')) return;
      if (erased() < 0.05) { toast('먼저 먹물을 문질러서 글자를 봐!'); say('먼저 먹물을 문질러 봐!'); shake(canvas.parentNode); return; }
      if (b.dataset.w === target) {
        st.done = true;
        const little = erased() < 0.45 && !hinted;
        sfx('win');
        b.classList.add('right');
        canvas.style.transition = 'opacity .5s';
        canvas.style.opacity = 0;
        octo.innerHTML = octoSVG('happy');
        confetti(590, 240);
        if (little) { bonusStars++; await say(`우와! 먹물을 조금만 지우고 읽었네! 진주 하나 더! ${target}!`); }
        else await say(`딩동댕! ${target}!`);
        await sleep(500);
        record(target, { mistakes, hinted });
        bumpSkill('ink', !mistakes && !hinted, mistakes);
        resolve({ w: target, ok: true, mistakes, hinted });
        return;
      }
      mistakes++;
      sfx('bad');
      b.classList.add('nope');
      shake(b);
      const d = [...target].map(decompose).find((x) => x && isTrickyVowel(x.jung));
      const p = d && (AE_SPLIT[d.jung] || VOWEL_SPLIT[d.jung]);
      await say(`음, 그건 ${b.dataset.w} 그림이야. ${p ? `글자를 잘 봐! ${p[0]}에 ${p[1]}를 붙인 ${d.jung}가 있어.` : '먹물을 더 지워서 잘 읽어 봐!'}`);
    }));

    return Object.assign(st, {
      abort() { st.done = true; stopSay(); resolve(null); },
      hint() {
        if (st.done) return;
        hinted = true;
        // 먹물을 가운데부터 크게 지워 줌
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(CARD.w * 0.15, CARD.h * 0.2, CARD.w * 0.7, CARD.h * 0.6);
        for (let gx = 0; gx < GX; gx++) for (let gy = 0; gy < GY; gy++) if (gx >= GX * 0.15 && gx < GX * 0.85 && gy >= GY * 0.2 && gy < GY * 0.8) st.cells.add(gx + gy * GX);
        st.rubbed();
        say(target);
      },
    });
  }
}
