// 미니게임 1: 좀비괴물보다 먼저 물건 찾기 (읽기)
import { el, onTap, shuffle, speech, sleep, confetti, shake, esc } from '../ui.js';
import { itemSVG, zombieSVG, martBG } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { similarity, josa } from '../hangul.js';
import { wordsOf } from '../words.js';
import { S } from '../state.js';
import { zombieSeconds, record, bumpSkill } from '../adaptive.js';
import { frame, confirmExit, dots } from './common.js';

const SHELF_COUNT = 16;

function shelfWords(target) {
  const all = wordsOf(S.chapter).filter((w) => w !== target);
  const similar = [...all].sort((a, b) => similarity(target, b) - similarity(target, a)).slice(0, 3);
  const rest = shuffle(all.filter((w) => !similar.includes(w))).slice(0, SHELF_COUNT - 1 - similar.length);
  return shuffle([target, ...similar, ...rest]);
}

export async function playFind(root, { words, boss = false }) {
  const f = frame(root, { bg: martBG(), title: boss ? '좀비괴물과 대결! 물건 찾기' : '좀비괴물보다 먼저 찾아라!', cls: 'find' });
  f.body.innerHTML = `
    <div class="find-top">
      <div class="word-card"><div class="word-card-label">이 글자를 찾아요</div><div class="word-card-word"></div></div>
      <div class="race">
        <div class="race-track"><div class="race-goal"><div class="race-goal-box">?</div></div><div class="race-zombie">${zombieSVG('evil')}</div></div>
        <div class="race-dots"></div>
      </div>
    </div>
    <button class="shelf-arrow left" aria-label="왼쪽">◀</button>
    <div class="shelf-scroll"><div class="shelf"></div></div>
    <button class="shelf-arrow right" aria-label="오른쪽">▶</button>`;
  const $ = (s) => f.body.querySelector(s);
  const wordEl = $('.word-card-word'), zombie = $('.race-zombie'), shelf = $('.shelf'), scroller = $('.shelf-scroll'), dotsEl = $('.race-dots');
  onTap($('.shelf-arrow.left'), () => scroller.scrollBy({ left: -560, behavior: 'smooth' }));
  onTap($('.shelf-arrow.right'), () => scroller.scrollBy({ left: 560, behavior: 'smooth' }));

  const results = [];
  let paused = false, aborted = false;
  let current = null; // 현재 라운드 제어

  onTap(f.exit, async () => {
    paused = true;
    if (await confirmExit(root)) { aborted = true; current?.abort(); } else paused = false;
  });
  onTap(f.hint, () => current?.hint());

  for (let i = 0; i < words.length && !aborted; i++) {
    dotsEl.innerHTML = dots(words.length, i);
    const r = await new Promise((resolve) => { current = round(words[i], resolve); });
    if (r) results.push(r);
  }
  current = null;
  return { words: results, aborted };

  function round(target, resolve) {
    let mistakes = 0, hinted = false, fails = 0, p = 0, running = false, lastT = 0, finished = false;
    const T0 = zombieSeconds() * (boss ? 0.85 : 1);
    let T = T0;

    function layout() {
      wordEl.textContent = target;
      shelf.innerHTML = '';
      const ws = shelfWords(target);
      ws.forEach((w) => {
        const b = el(`<button class="shelf-item" data-w="${esc(w)}"><div class="shelf-pic">${itemSVG(w)}</div><div class="shelf-label"></div></button>`);
        // click: 손가락으로 진열대를 밀 때는 선택되지 않음
        b.addEventListener('click', () => choose(b, w));
        shelf.appendChild(b);
      });
      scroller.scrollLeft = 0;
      p = 0;
      T = T0 * (1 + 0.2 * fails);
      zombie.style.left = '0%';
      zombie.innerHTML = zombieSVG('evil');
    }

    function tick(t) {
      if (!running) return;
      const dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 0;
      lastT = t;
      if (!paused) {
        p += dt / T;
        zombie.style.left = Math.min(100, p * 100) + '%';
        if (p >= 1) { timeout(); return; }
      }
      requestAnimationFrame(tick);
    }
    function startClock() { running = true; lastT = 0; requestAnimationFrame(tick); }

    async function choose(b, w) {
      if (!running || paused || finished || b.classList.contains('wrong')) return;
      if (w === target) {
        finished = true;
        running = false;
        sfx('ok');
        b.classList.add('found');
        const r = b.getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect();
        const k = st.width / 1180;
        confetti((r.left + r.width / 2 - st.left) / k, (r.top + r.height / 2 - st.top) / k);
        zombie.innerHTML = zombieSVG('sad');
        await say(`우와! ${target} 찾았다!`);
        await sleep(400);
        record(target, { mistakes, hinted });
        bumpSkill('find', !mistakes && !hinted, mistakes);
        resolve({ w: target, ok: true, mistakes, hinted });
      } else {
        mistakes++;
        sfx('bad');
        b.classList.add('wrong');
        b.querySelector('.shelf-label').textContent = w;
        shake(b);
        p = Math.min(0.97, p + 0.1);
        say(`이건 ${josa(w, '이야/야')}.`);
      }
    }

    async function timeout() {
      running = false;
      fails++;
      mistakes++;
      sfx('chomp');
      zombie.innerHTML = zombieSVG('eat');
      paused = true;
      await speech({ who: 'zombie', mood: 'eat', text: '냠냠! 내가 먼저 찾았지롱~', root });
      if (aborted) return;
      await speech({ who: 'kkori', text: fails >= 2 ? `괜찮아! 꼬리가 알려줄게. 찾을 글자는 ${josa(target, '이야/야')}.` : '괜찮아, 괜찮아! 다시 해 보자. 글자를 천천히 읽어 봐~', root });
      if (fails >= 2) hinted = true;
      paused = false;
      if (aborted) return;
      layout();
      startClock();
    }

    layout();
    startClock();
    return {
      abort() { running = false; stopSay(); resolve(null); },
      hint() {
        if (!running) return;
        hinted = true;
        say(target);
      },
    };
  }
}
