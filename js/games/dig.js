// 미니게임 2: 땅 파서 자모 발굴 + 글자 조립 (조합 원리)
import { el, onTap, shuffle, pick, speech, sleep, confetti, shake, esc, toast } from '../ui.js';
import { itemSVG, digBG, shovelSVG, wormSVG, boneSVG, starSVG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { syllables, compose, combineVowels, isVowel, VOWEL_SPLIT, AE_SPLIT, SIMILAR, SIMILAR_JONG, josa } from '../hangul.js';
import { ALL_WORDS } from '../words.js';
import { S } from '../state.js';
import { digDecoys, splitChance, toolLevel, record, bumpSkill } from '../adaptive.js';
import { frame, confirmExit, dots } from './common.js';

const COLS = 6, ROWS = 3;
// 나눠 묻을 수 있는 모음: 복모음 + (4챕터부터) ㅐ=ㅏ+ㅣ, ㅔ=ㅓ+ㅣ
const splitOf = (j) => VOWEL_SPLIT[j] || (S.chapter >= 4 ? AE_SPLIT[j] : null);
const isCompound = (j) => !!splitOf(j);

export async function playDig(root, { words, boss = false }) {
  const level = toolLevel('dig');
  const f = frame(root, { bg: digBG(S.chapter), title: boss ? '좀비괴물과 대결! 땅 파기' : '땅을 파서 글자를 맞춰요', cls: 'dig' });
  f.body.innerHTML = `
    <div class="dig-top">
      <div class="dig-pic"><div class="dig-pic-svg"></div><button class="dig-say" aria-label="듣기">${speakerIcon()}</button></div>
      <div class="dig-blocks"></div>
      <button class="btn dig-check" disabled>완성!</button>
    </div>
    <div class="dig-dots"></div>
    <div class="dig-tray"><div class="dig-tray-empty">땅을 파서 글자 조각을 찾아요</div></div>
    <div class="dig-field"></div>
    <div class="dig-shovel">${shovelSVG(level)}</div>`;
  const $ = (s) => f.body.querySelector(s);

  const results = [];
  let aborted = false, current = null, bonusStars = 0;
  onTap(f.exit, async () => { if (await confirmExit(root)) { aborted = true; current?.abort(); } });
  onTap(f.hint, () => current?.hint());

  for (let i = 0; i < words.length && !aborted; i++) {
    $('.dig-dots').innerHTML = dots(words.length, i);
    const r = await new Promise((resolve) => { current = round(words[i], resolve); });
    if (r) results.push(r);
  }
  current = null;
  return { words: results, aborted, bonusStars };

  function round(target, resolve) {
    const sy = syllables(target);
    const split = Math.random() < splitChance();
    let mistakes = 0, hinted = false, done = false;
    let tileSeq = 0;

    // 묻을 조각 만들기
    const needed = [];
    sy.forEach((d) => {
      needed.push(d.cho);
      if (split && isCompound(d.jung)) needed.push(...splitOf(d.jung));
      else needed.push(d.jung);
      if (d.jong) needed.push(d.jong);
    });
    const decoys = [];
    const nDecoy = digDecoys();
    for (let k = 0; k < nDecoy * 4 && decoys.length < nDecoy; k++) {
      const base = pick(needed);
      const cand = pick([...(SIMILAR[base] || []), ...(SIMILAR_JONG[base] || [])]);
      if (cand && !needed.includes(cand) && !decoys.includes(cand)) decoys.push(cand);
    }
    const contents = shuffle([
      ...needed.map((j) => ({ kind: 'jamo', j })),
      ...decoys.map((j) => ({ kind: 'jamo', j })),
      { kind: 'coin' }, { kind: 'coin' },
      { kind: pick(['worm', 'bone']) },
      ...Array(Math.max(0, COLS * ROWS - needed.length - decoys.length - 3)).fill({ kind: 'empty' }),
    ]).slice(0, COLS * ROWS);

    // 화면 초기화
    $('.dig-pic-svg').innerHTML = itemSVG(target);
    $('.dig-pic').classList.remove('alive');
    $('.dig-pic').dataset.w = target;
    onTapOnce($('.dig-say'), () => say(target));
    say(target);
    const tray = $('.dig-tray');
    tray.innerHTML = '<div class="dig-tray-empty">땅을 파서 글자 조각을 찾아요</div>';
    const field = $('.dig-field');
    field.innerHTML = '';
    const checkBtn = $('.dig-check');
    // 칸: 첫소리, 가운데소리, (받침 있는 글자만) 받침. 값은 {j, ids:[]}
    const slots = sy.map((d) => ({ cho: null, jung: null, jong: null, hasJong: !!d.jong }));
    const full = (s) => s.cho && s.jung && (!s.hasJong || s.jong);
    const made1 = (s) => compose(s.cho.j, s.jung.j, s.jong?.j || '');
    let last = 0;

    contents.forEach((c, idx) => {
      const t = el(`<button class="dig-tile" data-idx="${idx}"><div class="dig-dirt"></div></button>`);
      t._c = c;
      t._hits = 0;
      t.addEventListener('pointerdown', () => digTile(t));
      field.appendChild(t);
    });

    const blocks = $('.dig-blocks');
    function renderBlocks() {
      blocks.innerHTML = '';
      blocks.classList.toggle('has-jong', slots.some((x) => x.hasJong));
      slots.forEach((s, i) => {
        const big = s.cho && s.jung ? made1(s) : (s.cho?.j || s.jung?.j || '');
        const b = el(`<div class="dig-block ${i === last ? 'active' : ''}">
          <div class="dig-big ${big ? '' : 'empty'}">${esc(big || '?')}</div>
          <div class="dig-slots">
            <button class="dig-slot ${s.cho ? 'on' : ''}" data-part="cho">${esc(s.cho?.j || '')}</button>
            <button class="dig-slot ${s.jung ? 'on' : ''}" data-part="jung">${esc(s.jung?.j || '')}</button>
          </div>${s.hasJong ? `<button class="dig-slot jong ${s.jong ? 'on' : ''}" data-part="jong">${esc(s.jong?.j || '받침')}</button>` : ''}</div>`);
        b.querySelectorAll('.dig-slot').forEach((sl) => onTap(sl, () => unplace(i, sl.dataset.part)));
        onTap(b.querySelector('.dig-big'), () => { if (big && s.cho && s.jung) say(big); });
        blocks.appendChild(b);
      });
      checkBtn.disabled = !slots.every(full);
    }
    renderBlocks();

    function trayTile(j) {
      tray.querySelector('.dig-tray-empty')?.remove();
      const id = 't' + tileSeq++;
      const b = el(`<button class="jamo-tile pop" data-id="${id}" data-j="${esc(j)}">${esc(j)}</button>`);
      onTap(b, () => place(b));
      tray.appendChild(b);
      return b;
    }

    async function digTile(t) {
      if (done || t.classList.contains('open')) return;
      t._hits++;
      sfx('dig');
      t.classList.remove('hit');
      void t.offsetWidth;
      t.classList.add('hit');
      const need = level >= 2 ? 1 : 2;
      if (t._hits < need) { t.classList.add('crack'); return; }
      t.classList.add('open');
      const c = t._c;
      if (c.kind === 'jamo') {
        t.innerHTML = `<div class="dig-found">${esc(c.j)}</div>`;
        sfx('pop');
        await sleep(350);
        t.innerHTML = '';
        trayTile(c.j);
      } else if (c.kind === 'coin') {
        t.innerHTML = `<div class="dig-coin">${starSVG()}</div>`;
        sfx('coin');
        bonusStars++;
      } else if (c.kind === 'worm') {
        t.innerHTML = `<div class="dig-junk wiggle">${wormSVG()}</div>`;
        say('꽝! 지렁이야.');
      } else if (c.kind === 'bone') {
        t.innerHTML = `<div class="dig-junk">${boneSVG()}</div>`;
        say('꽝! 뼈다귀야.');
      }
    }

    function place(tile) {
      if (done || tile.classList.contains('used')) return;
      const j = tile.dataset.j, id = tile.dataset.id;
      let target_i = -1;
      if (isVowel(j)) {
        const cur = slots[last];
        if (cur?.jung && combineVowels(cur.jung.j, j)) {
          const before = cur.jung.j;
          cur.jung = { j: combineVowels(before, j), ids: [...cur.jung.ids, id] };
          tile.classList.add('used');
          sfx('magic');
          renderBlocks();
          const blk = blocks.children[last];
          blk.appendChild(el(`<div class="combine-pop">${esc(before)} + ${esc(j)} = ${esc(cur.jung.j)}</div>`));
          return;
        }
        // 왼쪽부터 차례로 채움 (자음이 있는 칸 우선)
        target_i = slots.findIndex((s) => s.cho && !s.jung);
        if (target_i < 0) target_i = slots.findIndex((s) => !s.jung);
        if (target_i < 0) { shake(tile); return; }
        slots[target_i].jung = { j, ids: [id] };
      } else {
        let part = 'cho';
        target_i = -1;
        for (let i = 0; i < slots.length && target_i < 0; i++) {
          if (!slots[i].cho) { target_i = i; part = 'cho'; }
          else if (slots[i].hasJong && !slots[i].jong) { target_i = i; part = 'jong'; }
        }
        if (target_i < 0) { shake(tile); return; }
        slots[target_i][part] = { j, ids: [id] };
      }
      last = target_i;
      tile.classList.add('used');
      renderBlocks();
    }

    function unplace(i, part) {
      if (done) return;
      const s = slots[i][part];
      if (!s) return;
      s.ids.forEach((id) => tray.querySelector(`[data-id="${id}"]`)?.classList.remove('used'));
      slots[i][part] = null;
      last = i;
      renderBlocks();
    }

    onTapOnce(checkBtn, async () => {
      if (done || checkBtn.disabled) return;
      const made = slots.map(made1).join('');
      if (made === target) {
        done = true;
        sfx('win');
        $('.dig-pic').classList.add('alive');
        blocks.classList.add('solved');
        confetti(590, 140);
        await say(`짠! ${target} 완성!`);
        await sleep(500);
        blocks.classList.remove('solved');
        record(target, { mistakes, hinted });
        bumpSkill('dig', !mistakes && !hinted, mistakes);
        resolve({ w: target, ok: true, mistakes, hinted });
        return;
      }
      mistakes++;
      sfx('bad');
      shake(blocks);
      // 어떤 글자가 틀렸는지 찾기
      let tip = '';
      slots.forEach((s, i) => {
        const want = sy[i];
        if (s.cho.j === want.cho && s.jung.j === want.jung && (s.jong?.j || '') === want.jong) return;
        if (s.cho.j === want.cho && s.jung.j === want.jung) { tip = '받침을 다시 봐! 아래에 붙는 글자야.'; return; }
        if (isCompound(want.jung) && s.jung.j === splitOf(want.jung)[0] && s.cho.j === want.cho) tip = `${s.jung.j}에 모음을 하나 더 합쳐 봐!`;
      });
      const isWord = ALL_WORDS.includes(made);
      const msg = isWord
        ? `어라? ${josa(made, '이/가')} 나왔네! 그림을 다시 잘 봐 봐~`
        : `음... ${made}? 그런 말은 없어! ${tip || '다시 맞춰 보자.'}`;
      if (isWord) {
        const pop = el(`<div class="wrong-made">${itemSVG(made)}<div>${esc(made)}</div></div>`);
        f.body.appendChild(pop);
        setTimeout(() => pop.remove(), 2600);
      }
      await speech({ who: 'kkori', mood: 'wow', text: msg, root });
      // 틀린 글자 칸만 비우기
      slots.forEach((s, i) => {
        const want = sy[i];
        if (s.cho && s.cho.j !== want.cho) unplace(i, 'cho');
        if (s.jung && s.jung.j !== want.jung) unplace(i, 'jung');
        if (s.jong && s.jong.j !== want.jong) unplace(i, 'jong');
      });
    });

    function hint() {
      if (done) return;
      hinted = true;
      say(target);
      // 다음에 필요한 조각 찾기
      for (let i = 0; i < sy.length; i++) {
        const s = slots[i], want = sy[i];
        let need = null;
        if (!s.cho || s.cho.j !== want.cho) need = [want.cho];
        else if (!s.jung || s.jung.j !== want.jung) {
          need = isCompound(want.jung) ? [want.jung, ...splitOf(want.jung)] : [want.jung];
          if (s.jung && isCompound(want.jung) && s.jung.j === splitOf(want.jung)[0]) need = [splitOf(want.jung)[1]];
        } else if (want.jong && (!s.jong || s.jong.j !== want.jong)) need = [want.jong];
        if (!need) continue;
        const t = [...tray.querySelectorAll('.jamo-tile:not(.used)')].find((x) => need.includes(x.dataset.j));
        if (t) { glow(t); return; }
        const tile = [...field.querySelectorAll('.dig-tile:not(.open)')].find((x) => x._c.kind === 'jamo' && need.includes(x._c.j));
        if (tile) { glow(tile); return; }
        if (s.cho && s.cho.j !== want.cho) { glow(blocks.children[i]); toast('이 글자 칸을 눌러서 빼 봐!'); return; }
      }
    }
    function glow(n) { n.classList.remove('glow'); void n.offsetWidth; n.classList.add('glow'); }

    return { abort() { done = true; stopSay(); resolve(null); }, hint };
  }
}

// 같은 버튼에 라운드마다 핸들러가 쌓이지 않도록 교체
function onTapOnce(node, fn) {
  node._fn = fn;
  if (!node._bound) {
    node._bound = true;
    onTap(node, (e) => node._fn && node._fn(e));
  }
}

function speakerIcon() {
  return `<svg viewBox="0 0 100 100" stroke="#5a4032" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M18 38 H34 L54 20 V80 L34 62 H18Z" fill="#fff"/><path d="M66 34 Q76 50 66 66 M76 24 Q92 50 76 76" fill="none"/></svg>`;
}
