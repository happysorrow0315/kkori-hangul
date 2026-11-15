// 4챕터 미니게임: 보물상자 자물쇠 (모음 다이얼을 돌려 그림 이름을 맞추면 상자가 열림)
import { el, shuffle, sleep, confetti, shake, esc } from '../ui.js';
import { itemSVG, seaBG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { decompose, compose, vowelRivals, isTrickyVowel, AE_SPLIT, VOWEL_SPLIT, josa } from '../hangul.js';
import { ALL_WORDS } from '../words.js';
import { record, bumpSkill, skill } from '../adaptive.js';
import { S } from '../state.js';
import { frame, confirmExit, dots, picCard, rebind } from './common.js';

const how = (j) => { const p = AE_SPLIT[j] || VOWEL_SPLIT[j]; return p ? `${p[0]}+${p[1]}` : ''; };

const chestSVG = () => `<svg viewBox="0 0 400 300" stroke="#5a4032" stroke-width="6" stroke-linejoin="round">
  <g class="lk-lid"><path d="M20 120 C20 40 380 40 380 120Z" fill="#c9824a"/><path d="M60 120 C60 66 340 66 340 120" fill="none" stroke="#ffd34d" stroke-width="10"/><path d="M190 52 V120 M210 52 V120" stroke="#ffd34d" stroke-width="8"/></g>
  <rect x="20" y="118" width="360" height="170" rx="14" fill="#b07a4a"/><path d="M20 160 H380 M20 250 H380" stroke="#ffd34d" stroke-width="10"/>
</svg>`;

export async function playLock(root, { words, boss = false }) {
  const f = frame(root, { bg: seaBG(true), title: boss ? '좀비괴물과 대결! 보물상자 자물쇠' : '다이얼을 돌려서 보물상자를 열어요', cls: 'lock' });
  f.body.innerHTML = `
    <div class="g-top">${picCard()}<div class="lk-tip">그림의 이름이 비밀번호예요!<br>▲ ▼를 눌러 모음을 바꿔요</div></div>
    <div class="g-dots"></div>
    <div class="lk-chest">${chestSVG()}<div class="lk-peek"></div><div class="lk-prize"></div></div>
    <div class="lk-dials"></div>
    <button class="btn big lk-open">열어라!</button>`;
  const $ = (s) => f.body.querySelector(s);
  const dialsEl = $('.lk-dials'), chest = $('.lk-chest'), openBtn = $('.lk-open');
  const results = [];
  let aborted = false, current = null;
  rebind(f.exit, async () => { if (await confirmExit(root)) { aborted = true; current?.abort(); } });
  rebind(f.hint, () => current?.hint());
  rebind(openBtn, () => current?.check());
  for (let i = 0; i < words.length && !aborted; i++) {
    $('.g-dots').innerHTML = dots(words.length, i);
    const r = await new Promise((resolve) => { current = round(words[i], resolve); });
    if (r) results.push(r);
  }
  current = null;
  return { words: results, aborted };

  function round(target, resolve) {
    let mistakes = 0, hinted = false, done = false;
    f.node.dataset.w = target;
    chest.classList.remove('open');
    $('.lk-prize').innerHTML = '';
    $('.g-pic-svg').innerHTML = itemSVG(target);
    $('.g-pic').classList.remove('alive');
    rebind($('.g-say'), () => say(target));
    say(target);
    const nOpt = boss ? 4 : skill('lock') >= 0.5 ? 4 : 3;
    // 글자마다: 헷갈리는 모음이면 다이얼, 아니면 고정
    const dials = [...target].map((ch, i) => {
      const d = decompose(ch);
      if (!d || !isTrickyVowel(d.jung)) return { i, d, fixed: true, opts: [d?.jung], k: 0 };
      const opts = shuffle([d.jung, ...vowelRivals(d.jung).slice(0, nOpt - 1)]);
      let k = Math.floor(Math.random() * opts.length);
      if (opts[k] === d.jung) k = (k + 1) % opts.length; // 처음엔 틀린 모음에서 시작
      return { i, d, fixed: false, opts, k };
    });
    const sylOf = (x) => compose(x.d.cho, x.opts[x.k], x.d.jong) || '';
    const draw = () => {
      dialsEl.innerHTML = dials.map((x) => x.fixed
        ? `<div class="lk-dial fixed" data-i="${x.i}"><div class="lk-syl">${esc(target[x.i])}</div></div>`
        : `<div class="lk-dial" data-i="${x.i}"><button class="lk-up" aria-label="위로">▲</button><div class="lk-syl">${esc(sylOf(x))}</div><div class="lk-how">${esc(how(x.opts[x.k]))}</div><button class="lk-down" aria-label="아래로">▼</button></div>`).join('');
      dialsEl.querySelectorAll('.lk-dial:not(.fixed)').forEach((n) => {
        const x = dials[+n.dataset.i];
        const turn = (s) => { if (done) return; x.k = (x.k + s + x.opts.length) % x.opts.length; sfx('tap'); n.querySelector('.lk-syl').textContent = sylOf(x); n.querySelector('.lk-how').textContent = how(x.opts[x.k]); n.classList.remove('bad', 'spin'); void n.offsetWidth; n.classList.add('spin'); };
        n.querySelector('.lk-up').addEventListener('click', () => turn(-1));
        n.querySelector('.lk-down').addEventListener('click', () => turn(1));
        n.querySelector('.lk-syl').addEventListener('click', () => turn(1));
      });
    };
    draw();
    // 처음 보는 단어는 뚜껑에 잠깐 써서 보여 줌
    const peekEl = $('.lk-peek');
    const peek = (ms) => { peekEl.textContent = target; peekEl.classList.add('show'); setTimeout(() => peekEl.classList.remove('show'), ms); };
    if (!S.stats.words[target]?.seen) peek(2000);

    return {
      abort() { done = true; stopSay(); resolve(null); },
      async check() {
        if (done) return;
        const made = dials.map((x) => (x.fixed ? target[x.i] : sylOf(x))).join('');
        if (made === target) {
          done = true;
          sfx('win');
          chest.classList.add('open');
          $('.lk-prize').innerHTML = itemSVG(target);
          $('.g-pic').classList.add('alive');
          confetti(590, 380);
          await say(`딸깍! ${target}!`);
          await sleep(700);
          record(target, { mistakes, hinted });
          bumpSkill('lock', !mistakes && !hinted, mistakes);
          resolve({ w: target, ok: true, mistakes, hinted });
          return;
        }
        mistakes++;
        sfx('bad');
        shake(chest);
        dials.forEach((x) => { if (!x.fixed && x.opts[x.k] !== x.d.jung) dialsEl.querySelector(`.lk-dial[data-i="${x.i}"]`)?.classList.add('bad'); });
        const wrong = dials.find((x) => !x.fixed && x.opts[x.k] !== x.d.jung);
        const real = ALL_WORDS.includes(made) && made !== target;
        await say(real
          ? `어라? ${josa(made, '이/가')} 됐네! 그건 다른 말이야. 그림을 다시 봐!`
          : `음... ${made}? 빨간 다이얼을 다시 돌려 봐!${wrong && how(wrong.d.jung) && skill('lock') < 0.4 ? ` ${how(wrong.d.jung)}가 필요해.` : ''}`);
      },
      hint() {
        if (done) return;
        hinted = true;
        say(target);
        peek(1600);
      },
    };
  }
}
