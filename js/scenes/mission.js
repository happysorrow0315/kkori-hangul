// 미션 진행: 이야기 → 미니게임 → 보상 → 마을
import { S, save } from '../state.js';
import { go } from '../router.js';
import { sceneEl, el, speech, onTap, sleep, confetti, esc, starsText } from '../ui.js';
import { villageBG, riverBG, spaceBG, itemSVG, shovelSVG, wandSVG, shoeSVG, starSVG } from '../art.js';
import { say, sfx } from '../audio.js';
import { STORY, applyResults, fill, MILESTONES, villageLook } from '../quests.js';
import { CHAPTERS, LAST_CHAPTER } from '../words.js';
import { TOOL_NAMES } from '../adaptive.js';
import { josa } from '../hangul.js';
import { setInMission } from '../gate.js';
import { playBoss } from '../games/boss.js';
import { GAMES } from '../games/index.js';

function backdrop(root) {
  root.innerHTML = '';
  if (S.chapter >= 3) { root.appendChild(el(`<div class="mission-bg">${spaceBG()}</div>`)); return; }
  if (S.chapter >= 2) { root.appendChild(el(`<div class="mission-bg">${riverBG(S.chapter)}</div>`)); return; }
  const v = villageLook();
  root.appendChild(el(`<div class="mission-bg" style="filter:grayscale(${v.gray}%)">${villageBG(v.restore, v.opts)}</div>`));
}

async function storyTalk(lines, root) {
  for (const l of lines) await speech({ ...l, text: fill(l.text), root });
}

export async function runMission(q) {
  await go('mission');
  const root = sceneEl();
  const story = q.story ? STORY.find((s) => s.id === q.story) : null;
  if (story) { backdrop(root); await storyTalk(story.intro, root); }

  setInMission(true);
  root.innerHTML = '';
  let res;
  try {
    res = q.boss ? await playBoss(root) : await GAMES[q.type](root, { words: q.words });
  } finally {
    setInMission(false);
  }
  if (res.aborted || !res.words.length) { go('village'); return; }

  const sum = applyResults(q, res);
  if (res.bonusStars) { S.stars += res.bonusStars; sum.stars += res.bonusStars; save(); }
  await showResults(root, q, sum);

  if (story) { backdrop(root); await storyTalk(story.outro, root); }
  for (const m of sum.milestones) { backdrop(root); await milestoneTalk(m, root); }
  go('village');
}

async function milestoneTalk(m, root) {
  for (const l of (MILESTONES[S.chapter] || MILESTONES[1])[m] || []) await speech({ ...l, text: fill(l.text), root });
}

function showResults(root, q, sum) {
  return new Promise((resolve) => {
    root.innerHTML = '';
    backdrop(root);
    const toolIcon = { find: shoeSVG, dig: shovelSVG, trace: wandSVG };
    const node = el(`<div class="result">
      <div class="result-title">${q.boss ? `${S.chapter}챕터 클리어!` : '미션 성공!'}</div>
      <div class="result-items">${sum.items.map((r) => `
        <div class="result-item"><div class="result-pic">${itemSVG(r.w)}</div><div class="result-word">${esc(r.w)}</div><div class="result-stars">${starsText(r.stars)}</div>
        ${sum.newDex.includes(r.w) ? '<div class="result-new">도감 등록!</div>' : ''}</div>`).join('')}</div>
      <div class="result-row"><span class="result-star">${starSVG()}</span> 별 +${sum.stars}</div>
      ${sum.restoreGain ? `<div class="result-row">${CHAPTERS[S.chapter]?.progress || '마을 복원'} <div class="restore-bar"><i style="width:${sum.restoreBefore}%"></i></div> <b>${S.restore}%</b></div>` : ''}
      ${sum.upgrades.map((u) => `<div class="result-upgrade"><span class="up-icon">${toolIcon[u.type](u.level)}</span>${esc(josa(TOOL_NAMES[u.type][u.level - 1], '이/가'))} <b>${esc(TOOL_NAMES[u.type][u.level])}</b>${josa(TOOL_NAMES[u.type][u.level], '으로/로').slice(TOOL_NAMES[u.type][u.level].length)} 업그레이드!</div>`).join('')}
      ${q.boss ? `<div class="result-row small">${S.chapter < LAST_CHAPTER ? `마을로 가면 ${S.chapter + 1}챕터 ${CHAPTERS[S.chapter + 1].name} 모험이 시작돼요!` : `${S.chapter + 1}챕터는 다음 업데이트에서 열려요!`}</div>` : ''}
      <button class="btn big result-go">마을로 가기</button>
    </div>`);
    root.appendChild(node);
    sfx('win');
    confetti(590, 200, 40);
    setTimeout(() => { const bar = node.querySelector('.restore-bar i'); if (bar) bar.style.width = S.restore + '%'; }, 400);
    const words = sum.items.map((r) => r.w).join(', ');
    say(`${q.boss ? `${S.chapter}챕터 클리어!` : '미션 성공!'} ${josa(words, '을/를')} 되찾았어!${sum.upgrades.length ? ' 도구가 업그레이드됐어!' : ''}`);
    onTap(node.querySelector('.result-go'), resolve);
  });
}
