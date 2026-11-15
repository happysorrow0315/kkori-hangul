// 4챕터 화면 미리보기 (마을, 새 놀이 4종, 단어 그림): node tools/preview4.mjs
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
const shot = (n) => page.screenshot({ path: `${OUT}/p4-${n}.png` });
try {
  await page.goto('http://localhost:8080/tools/blank.html');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('kkori-save-v1', JSON.stringify({ version: 1, profile: { name: '테스트', avatar: { hair: 'bob' }, catHat: null }, chapter: 4, restore: 100, story: { done: [], cleared: [1, 2, 3, 4] }, flags: { villageIntro: true, decor2: true, ending: true }, stars: 30 }));
  });
  await page.goto('http://localhost:8080/');
  await page.locator('.title-start').click();
  await page.waitForSelector('.village');
  await wait(800);
  await shot('village');
  await page.locator('.vbtn.board').click();
  await wait(600);
  await shot('board-review');
  await page.locator('.btab[data-tab="free"]').click();
  await wait(400);
  await shot('board-free');
  await page.locator('.board-panel .close-btn').click();

  for (const [t, words] of [['sub', ['해파리']], ['lock', ['원숭이']], ['ink', ['게']], ['shell', ['개', '시계', '바퀴']]]) {
    await page.evaluate(async ([t, words]) => {
      const { GAMES } = await import('/js/games/index.js');
      const root = document.getElementById('scene');
      root.innerHTML = '';
      window.__g = GAMES[t](root, { words });
    }, [t, words]);
    await wait(t === 'shell' ? 900 : 700);
    await shot(t);
    if (t === 'ink') {
      const box = await page.locator('.ik-ink').boundingBox();
      await page.mouse.move(box.x + 40, box.y + 120); await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 140, { steps: 8 }); await page.mouse.up();
      await wait(200);
      await shot('ink-rub');
    }
    if (t === 'sub') {
      await page.mouse.move(700, 500); await page.mouse.down(); await page.mouse.move(800, 600, { steps: 5 }); await wait(500); await page.mouse.up();
      await shot('sub-move');
    }
  }
  // 단어 그림 36개
  await page.evaluate(async () => {
    const { itemSVG, VILLAGERS } = await import('/js/art.js');
    const { CHAPTER_WORDS } = await import('/js/words.js');
    document.body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(10,110px);gap:6px;padding:8px;background:#fff;font:16px sans-serif">${CHAPTER_WORDS[4].map((w) => `<div style="text-align:center"><div style="width:100px;height:100px;margin:auto">${itemSVG(w)}</div>${w}</div>`).join('')}<div style="text-align:center"><div style="width:100px;height:100px">${VILLAGERS.mermaid.svg()}</div>인어</div><div style="text-align:center"><div style="width:100px;height:100px">${VILLAGERS.turtle.svg()}</div>거북</div></div>`;
  });
  await wait(300);
  await shot('items');
} catch (e) {
  console.log('❌', e.message);
  await shot('fail');
} finally {
  console.log(errors.length ? '오류:\n' + errors.join('\n') : '콘솔 오류 없음');
  await browser.close();
}
