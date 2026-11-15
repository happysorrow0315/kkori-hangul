// 4챕터 미니게임: 조개 짝 맞추기 (조개를 두 개씩 열어 그림과 글자 짝 찾기)
import { el, shuffle, sleep, confetti, esc } from '../ui.js';
import { itemSVG, seaBG, hasItemArt } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { similarity, decompose, AE_SPLIT, VOWEL_SPLIT, isTrickyVowel } from '../hangul.js';
import { ALL_WORDS } from '../words.js';
import { record, bumpSkill, skill, wordPool } from '../adaptive.js';
import { frame, confirmExit, rebind } from './common.js';

const clamSVG = () => `<svg viewBox="0 0 120 100" stroke="#5a4032" stroke-width="4" stroke-linejoin="round"><path d="M60 92 L10 50 C12 14 108 14 110 50Z" fill="#ffc2d1"/><path d="M60 92 L26 26 M60 92 L44 18 M60 92 V16 M60 92 L76 18 M60 92 L94 26" fill="none" stroke="#e86f8f" stroke-width="3"/><rect x="42" y="86" width="36" height="12" rx="5" fill="#ff9fb6"/></svg>`;

// ㅐ↔ㅔ 처럼 모음 하나만 다른 짝 (헷갈림 실수 판단용)
const vowelOnlyDiff = (a, b) => {
  if (a.length !== b.length || a === b) return false;
  let diff = 0;
  [...a].forEach((c, i) => { const x = decompose(c), y = decompose([...b][i]); if (c !== [...b][i]) { if (x && y && x.cho === y.cho && x.jong === y.jong) diff++; else diff += 9; } });
  return diff === 1;
};
const vowelTip = (w) => { const d = [...w].map(decompose).find((x) => x && isTrickyVowel(x.jung)); const p = d && (AE_SPLIT[d.jung] || VOWEL_SPLIT[d.jung]); return p ? ` ${w}에는 ${p[0]}에 ${p[1]}를 붙인 ${d.jung}가 있어.` : ''; };

export async function playShell(root, { words, boss = false }) {
  const f = frame(root, { bg: seaBG(true), title: boss ? '좀비괴물과 대결! 조개 짝 맞추기' : '조개를 열어서 그림과 글자 짝을 찾아요', cls: 'shell' });
  const total = boss ? 4 : Math.max(words.length, 3) + (skill('shell') >= 0.55 ? 1 : 0);
  // 짝 단어: 미션 단어 + 비슷한 단어 (개가 있으면 게도)
  const pool = wordPool().filter((w) => !words.includes(w) && hasItemArt(w));
  const extra = [];
  for (const w of words) {
    const twin = [...pool, ...ALL_WORDS].find((x) => x !== w && vowelOnlyDiff(w, x) && hasItemArt(x));
    if (twin && !extra.includes(twin) && !words.includes(twin) && extra.length < 2) extra.push(twin);
  }
  const twins = extra.length;
  const ranked = shuffle(pool).filter((w) => !extra.includes(w)).sort((a, b) => Math.max(...words.map((x) => similarity(x, b))) - Math.max(...words.map((x) => similarity(x, a))));
  while (words.length + extra.length < total && ranked.length) extra.push(ranked.shift());
  // 헷갈리는 짝(개/게)은 빼지 않음
  const pairs = [...words, ...extra].slice(0, Math.max(total, words.length + twins));
  const cards = shuffle(pairs.flatMap((w) => [{ w, kind: 'pic' }, { w, kind: 'word' }]));
  const cols = cards.length <= 6 ? 3 : 4;

  f.body.innerHTML = `
    <div class="sh-tip">조개를 두 개씩 열어 봐요. 그림과 글자가 짝꿍이면 진주가 나와요!</div>
    <div class="sh-grid" style="grid-template-columns:repeat(${cols}, 200px)">${cards.map((c, i) => `
      <button class="sh-clam" data-i="${i}" data-w="${esc(c.w)}" data-kind="${c.kind}">
        <div class="sh-in">${c.kind === 'pic' ? `<div class="sh-pic">${itemSVG(c.w)}</div>` : `<div class="sh-word">${esc(c.w)}</div>`}</div>
        <div class="sh-lid">${clamSVG()}</div>
      </button>`).join('')}</div>`;
  const grid = f.body.querySelector('.sh-grid');
  const clams = [...grid.querySelectorAll('.sh-clam')];
  const wrongs = {}; // 단어별 헷갈림 실수
  let open = [], busy = false, matched = 0, hinted = false, done = false;

  return new Promise((resolve) => {
    const finish = async (aborted) => {
      if (done) return;
      done = true;
      if (aborted) { stopSay(); resolve({ words: [], aborted: true }); return; }
      sfx('win');
      confetti(590, 300, 40);
      await say('짝꿍을 다 찾았다! 반짝반짝 진주가 가득!');
      await sleep(500);
      const res = words.map((w) => {
        const mistakes = wrongs[w] || 0;
        record(w, { mistakes, hinted });
        return { w, ok: true, mistakes, hinted };
      });
      const tot = res.reduce((a, r) => a + r.mistakes, 0);
      bumpSkill('shell', !tot && !hinted, tot);
      resolve({ words: res, aborted: false });
    };
    rebind(f.exit, async () => { if (done) return; if (await confirmExit(root)) finish(true); });
    rebind(f.hint, () => {
      if (done || busy) return;
      hinted = true;
      const left = clams.find((c) => !c.classList.contains('done') && !c.classList.contains('open'));
      if (!left) return;
      clams.filter((c) => c.dataset.w === left.dataset.w && !c.classList.contains('done')).forEach((c) => { c.classList.remove('glow'); void c.offsetWidth; c.classList.add('glow'); });
      say(left.dataset.w);
    });

    // 처음엔 아주 잠깐 다 열어서 보여 줌 (어려울수록 짧게)
    (async () => {
      busy = true;
      await sleep(400);
      clams.forEach((c) => c.classList.add('open'));
      await sleep(boss ? 900 : skill('shell') < 0.4 ? 1800 : 1200);
      clams.forEach((c) => c.classList.remove('open'));
      await sleep(400);
      busy = false;
    })();

    clams.forEach((c) => c.addEventListener('click', async () => {
      if (done || busy || c.classList.contains('open') || c.classList.contains('done')) return;
      c.classList.add('open');
      sfx('pop');
      if (c.dataset.kind === 'pic') say(c.dataset.w);
      open.push(c);
      if (open.length < 2) return;
      const [a, b] = open;
      open = [];
      busy = true;
      if (a.dataset.w === b.dataset.w && a.dataset.kind !== b.dataset.kind) {
        await sleep(250);
        sfx('ok');
        a.classList.add('done'); b.classList.add('done');
        matched++;
        say(`${a.dataset.w}! 짝꿍 찾았다!`);
        busy = false;
        if (matched >= pairs.length) finish(false);
        return;
      }
      // 그림과 글자를 열었는데 모음 하나만 다른 경우 = 헷갈림 실수 (개 그림 + 게 글자)
      if (a.dataset.kind !== b.dataset.kind && vowelOnlyDiff(a.dataset.w, b.dataset.w)) {
        const pic = a.dataset.kind === 'pic' ? a : b, word = pic === a ? b : a;
        if (words.includes(pic.dataset.w)) wrongs[pic.dataset.w] = (wrongs[pic.dataset.w] || 0) + 1;
        else if (words.includes(word.dataset.w)) wrongs[word.dataset.w] = (wrongs[word.dataset.w] || 0) + 1;
        sfx('bad');
        [a, b].forEach((x) => x.classList.add('nope'));
        await say(`앗, 아까워! 그림은 ${pic.dataset.w}, 글자는 ${word.dataset.w}야.${vowelTip(pic.dataset.w)}`);
      } else await sleep(900);
      [a, b].forEach((x) => x.classList.remove('open', 'nope'));
      busy = false;
    }));
  });
}
