// 보스 대결 + 오답 흐름 테스트: node tools/test-boss.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = 'tools/shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EDGE });
const page = await (await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.addInitScript(() => {
  window.speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 30);
  window.speechSynthesis.cancel = () => {};
});
const shot = async (n) => { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n); };
async function speechUntil(sel, max = 40) {
  for (let i = 0; i < max; i++) {
    if (await page.locator(sel).count()) return;
    const b = page.locator('.speech-btns button').first();
    if (await b.count()) await b.click();
    await page.waitForTimeout(250);
  }
  throw new Error('안 나타남: ' + sel);
}
async function clearSpeeches() {
  for (let i = 0; i < 20 && await page.locator('.speech-btns button').count(); i++) { await page.locator('.speech-btns button').first().click(); await page.waitForTimeout(250); }
}
async function findRounds(n) {
  for (let r = 0; r < n; r++) {
    await page.waitForSelector('.shelf-item');
    const target = await page.locator('.word-card-word').innerText();
    const item = page.locator(`.shelf-item[data-w="${target}"]`);
    await item.scrollIntoViewIfNeeded();
    await item.click();
    await page.waitForTimeout(1500);
  }
}
async function digWord(word, wrongFirst) {
  await page.waitForSelector('.dig-tile:not(.open)');
  const tiles = page.locator('.dig-tile');
  const n = await tiles.count();
  for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) await tiles.nth(i).dispatchEvent('pointerdown');
  await page.waitForTimeout(700);
  const seq = await page.evaluate(async (w) => {
    const { syllables, VOWEL_SPLIT, isCompound } = await import('/js/hangul.js');
    const trayJ = [...document.querySelectorAll('.jamo-tile')].map((t) => t.dataset.j);
    const out = [];
    for (const d of syllables(w)) { out.push(d.cho); if (isCompound(d.jung) && !trayJ.includes(d.jung)) out.push(...VOWEL_SPLIT[d.jung]); else out.push(d.jung); }
    return out;
  }, word);
  if (wrongFirst) {
    // 미끼 자모를 섞어서 틀린 글자 만들기
    const decoy = await page.evaluate((seq) => [...document.querySelectorAll('.jamo-tile')].map((t) => t.dataset.j).find((j) => !seq.includes(j)), seq);
    const bad = [...seq];
    const vi = bad.findIndex((j, i) => i === 1);
    if (decoy) bad[vi] = decoy;
    for (const j of bad) { const t = page.locator(`.jamo-tile:not(.used)[data-j="${j}"]`).first(); if (await t.count()) await t.click(); await page.waitForTimeout(120); }
    if (!(await page.locator('.dig-check').isDisabled())) {
      await page.locator('.dig-check').click();
      await page.waitForSelector('.speech');
      await shot('35-dig-wrong');
      await clearSpeeches();
    }
    // 남은 칸 비우기
    for (let k = 0; k < 6; k++) { const on = page.locator('.dig-slot.on'); if (!(await on.count())) break; await on.first().click(); await page.waitForTimeout(80); }
  }
  for (const j of seq) { await page.locator(`.jamo-tile:not(.used)[data-j="${j}"]`).first().click(); await page.waitForTimeout(120); }
  await page.locator('.dig-check').click();
  await page.waitForTimeout(2000);
}
async function traceWord() {
  const word = await page.evaluate(() => [...document.querySelectorAll('.trace-word span')].map((s) => s.textContent).join(''));
  for (const ch of word) {
    const strokes = await page.evaluate(async (ch) => (await import('/js/strokes.js')).syllableStrokes(ch), ch);
    for (const s of strokes) {
      const box = await page.locator('.trace-ink').boundingBox();
      const P = ([x, y]) => [box.x + (60 + x * 480) / 600 * box.width, box.y + (60 + y * 480) / 600 * box.height];
      const pts = await page.evaluate(async ({ s }) => (await import('/js/strokes.js')).samplePoly(s, 20), { s });
      await page.mouse.move(...P(pts[0])); await page.mouse.down();
      for (const p of pts.slice(1)) await page.mouse.move(...P(p), { steps: 2 });
      await page.mouse.up();
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(900);
  }
}

try {
  await page.goto('http://localhost:8080/tools/blank.html');
  await page.evaluate(() => {
    localStorage.setItem('kkori-save-v1', JSON.stringify({
      version: 1, profile: { name: '테스트', avatar: { skin: '#ffe2cc', hair: 'pigtails', hairColor: '#3b2a20', outfit: '#ff8fab' }, catHat: 'crown' },
      restore: 96, stars: 40, story: { done: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'], bossDone: false, chapterClear: false },
      inventory: { 'word:사과': 2, 'word:돼지': 1, 'decor:fountain': 1 }, placed: [{ id: 'a', key: 'word:나무', x: 520, y: 560 }, { id: 'b', key: 'decor:lamp', x: 680, y: 520 }, { id: 'c', key: 'word:쿼카', x: 900, y: 600 }],
      dex: { '나무': 1, '쿼카': 1, '사과': 1 }, flags: { villageIntro: true },
    }));
  });
  await page.goto('http://localhost:8080/');
  await page.locator('.title-start').click();
  await page.waitForSelector('.village');
  await shot('90-village-96');

  // 땅파기 미션에서 틀렸다가 맞추기 → 100% 도달
  await page.locator('.vbtn.board').click();
  await page.waitForSelector('.qcard');
  const digWords = await page.evaluate(async () => (await import('/js/state.js')).S.board.find((q) => q.type === 'dig').words);
  const cards = page.locator('.qcard');
  for (let i = 0; i < await cards.count(); i++) if ((await cards.nth(i).locator('.qtype').innerText()).includes('땅 파서')) { await cards.nth(i).locator('.qgo').click(); break; }
  await page.waitForSelector('.dig-tile');
  await digWord(digWords[0], true);
  await digWord(digWords[1], false);
  await page.waitForSelector('.result');
  await page.locator('.result-go').click();
  await page.waitForSelector('.speech');
  await shot('91-milestone-100');
  await speechUntil('.village');
  await clearSpeeches();
  await shot('92-village-100');

  // 보스
  await page.locator('.vbtn.board').click();
  await page.waitForSelector('.qcard.boss');
  await shot('93-board-boss');
  await page.locator('.qcard.boss .qgo').click();
  await page.waitForSelector('.boss-stage');
  await shot('94-boss-intro');
  await speechUntil('.find .shelf-item');
  await findRounds(1);
  await speechUntil('.dig .dig-tile');
  const w2 = await page.evaluate(() => document.querySelector('.dig-pic-svg') && null);
  // 보스 땅파기 단어는 그림으로만 알 수 있으니 정답을 hint 로직처럼 상태에서 추론: 타일 전부 판 뒤 hint 사용
  const bossDigWord = await page.evaluate(() => document.querySelector('.dig-pic').dataset.w);
  await digWord(bossDigWord, false);
  await speechUntil('.trace .trace-ink');
  await page.waitForTimeout(500);
  await traceWord();
  await page.waitForSelector('.boss-stage', { timeout: 15000 });
  await shot('95-boss-sad');
  await speechUntil('.result');
  await shot('96-chapter-clear');
  await page.locator('.result-go').click();
  await page.waitForSelector('.village');
  await clearSpeeches();
  await shot('97-village-clear');
  const st = await page.evaluate(async () => { const { S } = await import('/js/state.js'); return { restore: S.restore, boss: S.story.bossDone, clear: S.story.chapterClear, board: S.board.map((q) => q.type) }; });
  console.log(JSON.stringify(st));
  if (!st.clear) throw new Error('챕터 클리어가 저장 안 됨');
  console.log('✅ 보스 흐름 통과');
} catch (e) {
  console.log('❌ 실패:', e.message);
  await page.screenshot({ path: `${OUT}/zz-boss-fail.png` });
} finally {
  console.log(errors.length ? '오류:\n' + errors.join('\n') : '콘솔 오류 없음');
  await browser.close();
}
