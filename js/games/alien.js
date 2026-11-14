// 3챕터 미니게임: 외계인 말 듣기 (굴 / 꿀 / 쿨 처럼 소리가 비슷한 말을 듣고 구별)
import { el, shuffle, sleep, confetti, shake, esc } from '../ui.js';
import { itemSVG, spaceBG, VILLAGERS } from '../art.js';
import { say, sfx, stopSay } from '../audio.js';
import { soundAlikes } from '../hangul.js';
import { record, bumpSkill } from '../adaptive.js';
import { frame, confirmExit, dots, speakerIcon, rebind } from './common.js';

export async function playAlien(root, { words, boss = false }) {
  const f = frame(root, { bg: spaceBG(), title: boss ? '좀비괴물과 대결! 외계인 말 듣기' : '외계인의 말을 듣고 맞는 문을 열어요', cls: 'alien' });
  f.body.innerHTML = `
    <div class="al-alien">${VILLAGERS.alien.svg()}</div>
    <div class="al-bubble"><button class="al-say" aria-label="다시 듣기">${speakerIcon()}</button><span>다시 듣기</span></div>
    <div class="g-dots"></div>
    <div class="al-doors"></div>`;
  const $ = (s) => f.body.querySelector(s);
  const doorsEl = $('.al-doors'), alien = $('.al-alien');
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
    let mistakes = 0, hinted = false, done = false;
    f.node.dataset.w = target;
    const options = shuffle([target, ...soundAlikes(target, 2)]);
    doorsEl.innerHTML = options.map((w) => `<button class="al-door" data-w="${esc(w)}"><div class="al-door-inner"><div class="al-word">${esc(w)}</div></div><div class="al-pic"></div></button>`).join('');
    const speak = async () => {
      alien.classList.remove('talk'); void alien.offsetWidth; alien.classList.add('talk');
      sfx('magic');
      await sleep(250);
      await say(target);
    };
    rebind($('.al-say'), speak);
    setTimeout(speak, 300);

    doorsEl.querySelectorAll('.al-door').forEach((d) => d.addEventListener('click', async () => {
      if (done || d.classList.contains('nope')) return;
      if (d.dataset.w === target) {
        done = true;
        sfx('win');
        d.querySelector('.al-pic').innerHTML = itemSVG(target);
        d.classList.add('open');
        alien.classList.add('happy');
        const r = d.getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect(), k = st.width / 1180;
        confetti((r.left + r.width / 2 - st.left) / k, (r.top - st.top) / k + 80);
        await say(`딩동댕! ${target}!`);
        await sleep(500);
        alien.classList.remove('happy');
        record(target, { mistakes, hinted });
        bumpSkill('alien', !mistakes && !hinted, mistakes);
        resolve({ w: target, ok: true, mistakes, hinted });
        return;
      }
      mistakes++;
      sfx('bad');
      d.classList.add('nope');
      shake(d);
      await say(`삐빅! 그건 ${d.dataset.w}! 다시 들어 봐~`);
      await sleep(150);
      speak();
    }));

    return {
      abort() { done = true; stopSay(); resolve(null); },
      async hint() {
        if (done) return;
        hinted = true;
        await say(target, { rate: 0.7 });
        const d = [...doorsEl.querySelectorAll('.al-door')].find((x) => x.dataset.w === target);
        if (d) { d.classList.remove('glow'); void d.offsetWidth; d.classList.add('glow'); }
      },
    };
  }
}
