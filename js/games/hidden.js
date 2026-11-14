// 미니게임 7: 숨은 글자 찾기 (그림 속 자모를 찾아 글자 완성, 복모음 합치기)
import { el, shuffle, sleep, confetti, nudge, esc } from '../ui.js';
import { itemSVG, hiddenBG, hideSpots } from '../art.js';
import { S } from '../state.js';
import { say, sfx, stopSay } from '../audio.js';
import { syllables, compose, combineVowels, isCompound, VOWEL_SPLIT, SIMILAR, SIMILAR_JONG, josa } from '../hangul.js';
import { record, bumpSkill, skill } from '../adaptive.js';
import { frame, confirmExit, picCard, rebind } from './common.js';

export async function playHidden(root, { words, boss = false }) {
  const target = words[0];
  const f = frame(root, { bg: hiddenBG(S.chapter), title: boss ? '좀비괴물과 대결! 숨은 글자' : '그림 속에 숨은 글자를 찾아요', cls: 'hidden' });
  f.body.innerHTML = `<div class="g-top hid-top">${picCard()}<div class="g-blocks"></div></div><div class="hid-area"></div>`;
  const $ = (s) => f.body.querySelector(s);
  const blocks = $('.g-blocks'), area = $('.hid-area');
  const sy = syllables(target);
  const ghost = skill('hidden') < 0.55; // 처음엔 찾을 모양을 흐리게 보여줌
  // 칸: 첫소리 + 가운데소리(복모음은 항상 두 조각으로 숨김)
  const slots = sy.map((d) => ({ cho: { want: d.cho, got: '' }, jung: (isCompound(d.jung) ? VOWEL_SPLIT[d.jung] : [d.jung]).map((j) => ({ want: j, got: '' })), full: d.jung, jong: d.jong ? { want: d.jong, got: '' } : null }));
  const cells = (s) => [s.cho, ...s.jung, ...(s.jong ? [s.jong] : [])];
  const need = slots.flatMap((s) => cells(s).map((x) => x.want));
  let mistakes = 0, hinted = false, done = false;
  f.node.dataset.w = target;

  $('.g-pic-svg').innerHTML = itemSVG(target);
  rebind($('.g-say'), () => say(target));

  const remaining = () => slots.flatMap(cells).filter((x) => !x.got).map((x) => x.want);
  function drawBlocks() {
    blocks.innerHTML = slots.map((s) => {
      const jungGot = s.jung.every((x) => x.got);
      const jungNow = jungGot ? s.full : s.jung.map((x) => x.got).filter(Boolean).reduce((a, b) => combineVowels(a, b) || a + b, '');
      const big = s.cho.got && jungGot && (!s.jong || s.jong.got) ? compose(s.cho.got, s.full, s.jong ? s.jong.got : '') : '';
      const cell = (x) => `<div class="hid-slot ${x.got ? 'on' : ''}">${x.got ? esc(x.got) : ghost ? `<span class="ghost">${esc(x.want)}</span>` : '?'}</div>`;
      return `<div class="g-block"><div class="g-big ${big ? '' : 'empty'}">${esc(big || (s.cho.got || '') + (jungNow || '') || '?')}</div>
        <div class="hid-slots">${cell(s.cho)}${s.jung.map(cell).join('')}${s.jong ? cell(s.jong) : ''}</div></div>`;
    }).join('');
    f.node.dataset.need = remaining().join(',');
  }

  // 자모 숨기기
  const decoys = shuffle([...new Set(need.flatMap((j) => [...(SIMILAR[j] || []), ...(SIMILAR_JONG[j] || [])]))].filter((j) => !need.includes(j))).slice(0, 3 + Math.round(skill('hidden') * 2));
  const spots = shuffle(hideSpots(S.chapter));
  [...need, ...decoys].forEach((j, i) => {
    const [x, y, c] = spots[i % spots.length];
    const rot = Math.round(Math.random() * 50 - 25);
    const size = 50 + Math.round(Math.random() * 14) - Math.round(skill('hidden') * 8);
    const b = el(`<button class="hid-piece" data-j="${esc(j)}" style="left:${x}px;top:${y}px"><span style="color:${c};font-size:${size}px;transform:rotate(${rot}deg)">${esc(j)}</span></button>`);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(b); });
    area.appendChild(b);
  });

  let resolveAll;
  const finished = new Promise((r) => { resolveAll = r; });

  async function tap(b) {
    if (done || b.classList.contains('found')) return;
    const j = b.dataset.j;
    const slot = slots.flatMap(cells).find((x) => !x.got && x.want === j);
    if (slot) {
      slot.got = j;
      b.classList.add('found');
      sfx('pop');
      drawBlocks();
      // 복모음 두 조각이 다 모이면 합치기 안내
      const s = slots.find((x) => x.jung.includes(slot));
      if (s && s.jung.length === 2 && s.jung.every((x) => x.got)) {
        sfx('magic');
        const i = slots.indexOf(s);
        blocks.children[i]?.appendChild(el(`<div class="combine-pop">${esc(s.jung[0].want)} + ${esc(s.jung[1].want)} = ${esc(s.full)}</div>`));
        say(`우와! ${s.jung[0].want}랑 ${s.jung[1].want}가 만나서 ${s.full}가 됐어!`);
      }
      setTimeout(() => b.remove(), 400);
      if (!remaining().length) win();
    } else {
      mistakes++;
      sfx('bad');
      nudge(b);
      const tag = el(`<div class="hid-tag" style="left:${b.style.left};top:${b.style.top}">${esc(j)}</div>`);
      area.appendChild(tag);
      setTimeout(() => tag.remove(), 1300);
      say(`음~ 이건 ${josa(j, '이야/야')}. 다른 걸 찾아 봐!`);
    }
  }

  async function win() {
    done = true;
    await sleep(500);
    sfx('win');
    $('.g-pic').classList.add('alive');
    confetti(590, 160);
    await say(`찾았다! ${target}!`);
    await sleep(500);
    resolveAll();
  }

  rebind(f.exit, async () => { if (await confirmExit(root)) { done = true; stopSay(); resolveAll('abort'); } });
  rebind(f.hint, () => {
    if (done) return;
    hinted = true;
    say(target);
    const want = remaining()[0];
    const b = [...area.querySelectorAll('.hid-piece:not(.found)')].find((x) => x.dataset.j === want);
    if (b) { b.classList.remove('glow'); void b.offsetWidth; b.classList.add('glow'); }
  });

  drawBlocks();
  say(`그림 속에 ${target} 글자 조각이 숨어 있어! 찾아 볼까?`);
  const r = await finished;
  if (r === 'abort') return { words: [], aborted: true };
  record(target, { mistakes, hinted });
  bumpSkill('hidden', !mistakes && !hinted, mistakes);
  return { words: [{ w: target, ok: true, mistakes, hinted }], aborted: false };
}
