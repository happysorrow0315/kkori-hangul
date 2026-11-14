// 1챕터 전체(미션 12개 + 보스)를 게시판에서 골라 가며 끝까지 플레이: node tools/test-chapter.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = 'tools/shots';
const CH = Number(process.env.CH || 1);
const P = CH === 1 ? 'c-' : 'c' + CH + '-';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EDGE });
const page = await (await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errors.push('console: ' + m.text()); });
await page.addInitScript(() => {
  window.speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 20);
  window.speechSynthesis.cancel = () => {};
});
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (n) => { await wait(300); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('  shot', n); };
const shotOnce = new Set();
const has = async (sel) => (await page.locator(sel).count()) > 0;
async function clickSpeech() { const b = page.locator('.speech-btns button').first(); if (await b.count()) { await b.click(); await wait(200); return true; } return false; }
async function clearSpeeches() { for (let i = 0; i < 25 && await clickSpeech();); }
const need = () => page.evaluate(() => document.querySelector('.game')?.dataset.need ?? null);

async function playFind() {
  const target = await page.locator('.word-card-word').innerText();
  const item = page.locator(`.shelf-item[data-w="${target}"]`);
  await item.scrollIntoViewIfNeeded();
  await item.click();
  await wait(1300);
}
async function playDig() {
  const w = await page.evaluate(() => document.querySelector('.dig-pic').dataset.w);
  const tiles = page.locator('.dig-tile');
  for (let i = 0; i < await tiles.count(); i++) for (let k = 0; k < 2; k++) await tiles.nth(i).dispatchEvent('pointerdown');
  await wait(600);
  const seq = await page.evaluate(async (w) => {
    const { syllables, VOWEL_SPLIT, isCompound } = await import('/js/hangul.js');
    const tray = [...document.querySelectorAll('.jamo-tile')].map((t) => t.dataset.j);
    return syllables(w).flatMap((d) => [d.cho, ...(isCompound(d.jung) && !tray.includes(d.jung) ? VOWEL_SPLIT[d.jung] : [d.jung]), ...(d.jong ? [d.jong] : [])]);
  }, w);
  for (const j of seq) { await page.locator(`.jamo-tile:not(.used)[data-j="${j}"]`).first().click(); await wait(80); }
  await page.locator('.dig-check').click();
  await wait(1500);
}
async function playTrace() {
  await wait(400);
  const word = await page.evaluate(() => [...document.querySelectorAll('.trace-word span')].map((s) => s.textContent).join(''));
  for (const ch of word) {
    const strokes = await page.evaluate(async (ch) => (await import('/js/strokes.js')).syllableStrokes(ch), ch);
    for (const s of strokes) {
      const box = await page.locator('.trace-ink').boundingBox();
      const P = ([x, y]) => [box.x + ((60 + x * 480) / 600) * box.width, box.y + ((60 + y * 480) / 600) * box.height];
      const pts = await page.evaluate(async (s) => (await import('/js/strokes.js')).samplePoly(s, 16), s);
      await page.mouse.move(...P(pts[0])); await page.mouse.down();
      for (const p of pts.slice(1)) await page.mouse.move(...P(p), { steps: 2 });
      await page.mouse.up();
      await wait(80);
    }
    await wait(800);
  }
  await wait(1200);
}
async function playFish(first) {
  if (first) {
    const n = await need();
    const wrong = page.locator(`.fish-one:not(.caught):not([data-s="${n}"])`).first();
    if (await wrong.count()) { await wrong.dispatchEvent('pointerdown'); await wait(250); await shot(P + 'fish-wrong'); await wait(600); }
  }
  for (let i = 0; i < 40 && await has('.game.fish'); i++) {
    if (await has('.speech')) { await clickSpeech(); continue; }
    const n = await need();
    if (!n) { await wait(400); continue; }
    const f = page.locator(`.fish-one:not(.caught)[data-s="${n}"]`).first();
    if (await f.count()) { await f.dispatchEvent('pointerdown'); await wait(750); } else await wait(300);
  }
}
async function playBridge(first) {
  if (first) {
    const n = await need();
    const wrong = page.locator(`.br-block:not(.busy):not([data-s="${n}"])`).first();
    if (await wrong.count()) { await wrong.click(); await wait(300); await shot(P + 'bridge-wrong'); await wait(800); }
  }
  for (let i = 0; i < 30 && await has('.game.bridge'); i++) {
    if (await has('.speech')) { await clickSpeech(); continue; }
    const n = await need();
    if (!n) { await wait(500); continue; }
    const b = page.locator(`.br-block:not(.busy)[data-s="${n}"]`).first();
    if (await b.count()) { await b.click(); await wait(150); } else await wait(300);
  }
}
async function playOrb(first) {
  if (first) {
    const n = await need();
    const wrong = page.locator(`.orb-one:not(.pop-out):not([data-j="${n}"])`).first();
    if (await wrong.count()) { await wrong.dispatchEvent('pointerdown'); await wait(250); await shot(P + 'orb-wrong'); await wait(400); }
  }
  for (let i = 0; i < 40 && await has('.game.orb'); i++) {
    if (await has('.speech')) { await clickSpeech(); continue; }
    const n = await need();
    if (!n) { await wait(400); continue; }
    const o = page.locator(`.orb-one:not(.pop-out)[data-j="${n}"]`).first();
    if (await o.count()) { await o.dispatchEvent('pointerdown'); await wait(250); } else await wait(300);
  }
}
async function playHidden(first) {
  if (first) {
    const n = (await need()).split(',');
    const wrong = page.locator('.hid-piece:not(.found)').filter({ hasNot: page.locator('xx') });
    const all = await wrong.evaluateAll((els) => els.map((e) => e.dataset.j));
    const k = all.findIndex((j) => !n.includes(j));
    if (k >= 0) { await wrong.nth(k).dispatchEvent('pointerdown'); await wait(250); await shot(P + 'hidden-wrong'); await wait(300); }
  }
  for (let i = 0; i < 30 && await has('.game.hidden'); i++) {
    const n = await need();
    if (!n) { await wait(500); continue; }
    const j = n.split(',')[0];
    const p = page.locator(`.hid-piece:not(.found)[data-j="${j}"]`).first();
    if (await p.count()) { await p.dispatchEvent('pointerdown'); await wait(300); } else await wait(300);
  }
}
async function playRocket() {
  for (let i = 0; i < 400 && await has('.game.rocket'); i++) {
    if (await has('.speech')) { await clickSpeech(); continue; }
    const lane = await page.evaluate(() => document.querySelector('.game')?.dataset.lane ?? '');
    if (lane !== '') await page.locator(`.rk-pad[data-lane="${lane}"]`).dispatchEvent('pointerdown');
    await wait(90);
  }
}
async function playAlien(first) {
  for (let i = 0; i < 30 && await has('.game.alien'); i++) {
    if (await has('.speech')) { await clickSpeech(); continue; }
    const w = await page.evaluate(() => document.querySelector('.game')?.dataset.w);
    if (first) { first = false; const wrong = page.locator(`.al-door:not([data-w="${w}"])`).first(); await wrong.click(); await wait(300); await shot(P + 'alien-wrong'); await wait(1200); }
    const d = page.locator(`.al-door[data-w="${w}"]:not(.open)`);
    if (await d.count()) { await d.click(); await wait(1600); } else await wait(300);
  }
}
async function clickCenter(loc) { const b = await loc.boundingBox(); if (!b) return false; await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); return true; }
async function playTwin(first) {
  for (let i = 0; i < 60 && await has('.game.twin'); i++) {
    if (await has('.speech')) { await clickSpeech(); continue; }
    const n = await need();
    if (!n) { await wait(400); continue; }
    const direct = page.locator(`.tw-planet:not(.pop-out)[data-j="${n}"]`).first();
    if (await direct.count()) { await clickCenter(direct); await wait(350); continue; }
    const base = await page.evaluate(async (n) => (await import('/js/hangul.js')).DOUBLE_OF[n], n);
    const two = page.locator(`.tw-planet:not(.pop-out)[data-j="${base}"]`);
    if (base && (await two.count()) >= 2) {
      const a = await two.nth(0).boundingBox(), b = await two.nth(1).boundingBox();
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 }); await page.mouse.up();
      await wait(400);
      if (first) { first = false; await shot(P + 'twin-merged'); }
      continue;
    }
    await wait(300);
  }
}
async function playStars(first) {
  for (let i = 0; i < 60 && await has('.game.stars'); i++) {
    if (await has('.speech')) { await clickSpeech(); continue; }
    const n = await need();
    if (!n) { await wait(400); continue; }
    if (first) {
      first = false;
      const wrong = page.locator(`.st-star:not(.on):not([data-j="${n}"])`).first();
      if (await wrong.count()) { await clickCenter(wrong); await wait(300); await shot(P + 'stars-wrong'); await clickSpeech(); }
      continue;
    }
    const s = page.locator(`.st-star:not(.on)[data-j="${n}"]`).first();
    if (await s.count()) { await clickCenter(s); await wait(200); } else await wait(300);
  }
}
const PLAY = { find: playFind, dig: playDig, trace: playTrace, fish: playFish, bridge: playBridge, orb: playOrb, hidden: playHidden, rocket: playRocket, alien: playAlien, twin: playTwin, stars: playStars };
const gameType = () => page.evaluate(() => {
  const g = document.querySelector('.game');
  return g ? ['find', 'dig', 'trace', 'fish', 'bridge', 'orb', 'hidden', 'rocket', 'alien', 'twin', 'stars'].find((t) => g.classList.contains(t)) : null;
});

// 게임 하나(또는 보스의 여러 게임)를 결과 화면까지 진행
async function playUntilResult() {
  const seenFirst = new Set();
  for (let guard = 0; guard < 200; guard++) {
    if (await has('.result')) return;
    if (await has('.speech')) { await clickSpeech(); continue; }
    const t = await gameType();
    if (!t) { await wait(300); continue; }
    if (!shotOnce.has(t)) { shotOnce.add(t); await shot(P + 'game-' + t); }
    const first = !seenFirst.has(t) && ['fish', 'bridge', 'orb', 'hidden', 'alien', 'twin', 'stars'].includes(t);
    seenFirst.add(t);
    await PLAY[t](first);
    await wait(300);
  }
  throw new Error('결과 화면이 안 나옴');
}

try {
  await page.goto('http://localhost:8080/tools/blank.html');
  await page.evaluate((ch) => {
    localStorage.clear();
    localStorage.setItem('kkori-save-v1', JSON.stringify(ch === 3
      ? { version: 1, profile: { name: '테스트', avatar: { hair: 'bob' }, catHat: null }, chapter: 2, restore: 100, story: { done: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 'c2s1', 'c2s2', 'c2s3', 'c2s4', 'c2s5', 'c2s6', 'c2s7', 'c2s8'], bossDone: true, chapterClear: true, cleared: [1, 2] }, flags: { villageIntro: true, decor2: true } }
      : ch === 2
      ? { version: 1, profile: { name: '테스트', avatar: { hair: 'bob' }, catHat: null }, chapter: 1, restore: 100, story: { done: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'], bossDone: true, chapterClear: true }, flags: { villageIntro: true } }
      : { version: 1, profile: { name: '테스트', avatar: {}, catHat: null }, flags: { villageIntro: true } }));
  }, CH);
  await page.goto('http://localhost:8080/');
  await page.locator('.title-start').click();
  await page.waitForSelector('.village');
  if (CH >= 2) { await wait(600); await shot(P + 'transition'); }
  const played = [];
  for (let m = 0; m < 20; m++) {
    await clearSpeeches();
    await page.locator('.vbtn.board').click();
    await page.waitForSelector('.qcard');
    const cards = await page.evaluate(async () => (await import('/js/state.js')).S.board.map((q) => q.boss ? 'boss' : (q.story ? 'story:' : '') + q.type));
    const restore = await page.evaluate(async () => (await import('/js/state.js')).S.restore);
    console.log(`미션 ${m + 1} | 복원 ${restore}% | 게시판: ${cards.join(', ')}`);
    if (m === 0) await shot(P + 'board');
    const normalTypes = cards.filter((c) => !c.startsWith('story') && c !== 'boss');
    if (new Set(normalTypes).size !== normalTypes.length) throw new Error('게시판에 같은 놀이가 겹침');
    const isBoss = cards[0] === 'boss';
    played.push(cards[0]);
    await page.locator('.qcard .qgo').first().click();
    await playUntilResult();
    if (isBoss) await shot(P + 'boss-result');
    await page.locator('.result-go').click();
    await wait(500);
    await clearSpeeches();
    if (isBoss) break;
  }
  const st = await page.evaluate(async () => { const { S } = await import('/js/state.js'); return { restore: S.restore, missions: S.missionsDone, clear: S.story.chapterClear, stories: S.story.done.length, tools: S.tools, dex: Object.keys(S.dex).length }; });
  console.log('플레이 순서:', played.join(' → '));
  console.log(JSON.stringify(st));
  const kinds = new Set(played.map((p) => p.replace('story:', '')));
  console.log('해 본 놀이 종류:', [...kinds].join(', '));
  const ch = await page.evaluate(async () => { const { S } = await import('/js/state.js'); return { chapter: S.chapter, cleared: S.story.cleared }; });
  console.log('챕터:', JSON.stringify(ch));
  if (!st.clear || !ch.cleared.includes(CH)) throw new Error('챕터 클리어 안 됨');
  if (st.missions !== 13) console.log('⚠ 미션 수가 13(12+보스)이 아님:', st.missions);
  await shot(P + 'village-end');
  console.log('✅ ' + CH + '챕터 전체 통과');
} catch (e) {
  console.log('❌ 실패:', e.message);
  await page.screenshot({ path: `${OUT}/zz-chapter-fail.png` });
} finally {
  console.log(errors.length ? '오류:\n' + errors.join('\n') : '콘솔 오류 없음');
  await browser.close();
}
