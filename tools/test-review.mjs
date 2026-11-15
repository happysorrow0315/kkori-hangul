// 엔딩 뒤 자유 놀이: '골라 놀기'에서 놀이 15종을 모두 열어 보고 오류가 없는지 확인: node tools/test-review.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = 'tools/shots';
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
const has = async (sel) => (await page.locator(sel).count()) > 0;
async function clearSpeeches() { for (let i = 0; i < 25; i++) { const b = page.locator('.speech-btns button').first(); if (!(await b.count())) return; await b.click(); await wait(200); } }
let ok = true;
try {
  await page.goto('http://localhost:8080/tools/blank.html');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('kkori-save-v1', JSON.stringify({ version: 1, profile: { name: '테스트', avatar: { hair: 'bob' }, catHat: null }, chapter: 4, restore: 100, story: { done: [], bossDone: true, chapterClear: true, cleared: [1, 2, 3, 4] }, flags: { villageIntro: true, decor2: true }, stars: 5 }));
  });
  await page.goto('http://localhost:8080/');
  await page.locator('.title-start').click();
  await page.waitForSelector('.village');
  await wait(500);
  // 엔딩 장면 (처음 한 번)
  if (!(await has('.speech'))) { console.log('❌ 엔딩 대화가 안 나옴'); ok = false; }
  await page.screenshot({ path: `${OUT}/r-ending.png` });
  await clearSpeeches();
  if (await page.locator('.vchar.zombie').isHidden()) { console.log('❌ 마을에 좀비 친구가 없음'); ok = false; }
  const types = await page.evaluate(async () => (await import('/js/quests.js')).TYPES);
  for (const t of types) {
    await page.locator('.vbtn.board').click();
    await page.waitForSelector('.btab');
    const cards = await page.evaluate(async () => (await import('/js/state.js')).S.board.map((q) => `${q.type}:${q.words.join('/')}`));
    await page.locator('.btab[data-tab="free"]').click();
    await page.locator(`.free-btn[data-t="${t}"]`).click();
    await wait(1500);
    const w = await page.evaluate(() => document.querySelector('.game')?.dataset.w || [...document.querySelectorAll('.sh-clam')].map((c) => c.dataset.w).join('/') || document.querySelector('.word-card-word')?.textContent || '');
    const got = await has(`.game.${t}`);
    console.log(`${got ? 'OK' : '❌'} ${t} (${w}) | 복습 의뢰: ${cards.join(', ')}`);
    if (!got) ok = false;
    await page.screenshot({ path: `${OUT}/r-${t}.png` });
    await page.locator('.exit-btn').click();
    await wait(300);
    await page.locator('.speech-btns button').nth(1).click();
    await page.waitForSelector('.village');
    await wait(400);
    await clearSpeeches();
  }
  console.log(ok ? '✅ 자유 놀이 15종 열기 통과' : '❌ 실패');
} catch (e) {
  console.log('❌ 실패:', e.message);
  await page.screenshot({ path: `${OUT}/zz-review-fail.png` });
} finally {
  console.log(errors.length ? '오류:\n' + errors.join('\n') : '콘솔 오류 없음');
  await browser.close();
}
