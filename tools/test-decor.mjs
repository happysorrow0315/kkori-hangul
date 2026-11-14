// 마을 꾸미기(어울리는 자리) 테스트: node tools/test-decor.mjs
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
const shot = async (n) => { await wait(400); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('  shot', n); };
async function clearSpeeches() { for (let i = 0; i < 20 && await page.locator('.speech-btns button').count(); i++) { await page.locator('.speech-btns button').first().click(); await wait(200); } }
const state = () => page.evaluate(async () => { const { S } = await import('/js/state.js'); return JSON.parse(JSON.stringify({ placed: S.placed, inv: S.inventory, flags: S.flags })); });

const WORDS = ['사과', '수박', '포도', '감', '오리', '곰', '용', '호랑이', '돼지', '모자', '양말', '치마', '우유', '피자', '사탕', '공', '풍선', '기차', '요요', '달', '별', '회오리', '왕관', '보석', '거울', '가방', '나무', '눈사람', '성'];

async function seed(chapter) {
  await page.goto('http://localhost:8080/tools/blank.html');
  await page.evaluate(({ chapter, WORDS }) => {
    const inv = {};
    WORDS.forEach((w) => { inv['word:' + w] = 1; });
    inv['decor:fountain'] = 1;
    localStorage.setItem('kkori-save-v1', JSON.stringify({
      version: 1, profile: { name: '테스트', avatar: { hair: 'long' }, catHat: 'wizard' }, chapter, restore: chapter === 1 ? 60 : 40,
      story: { done: chapter === 2 ? ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] : [], cleared: chapter === 2 ? [1] : [] },
      missionsDone: 10, inventory: inv,
      placed: [{ id: 'old1', key: 'word:바나나', x: 300, y: 560 }, { id: 'old2', key: 'decor:lamp', x: 600, y: 600 }],
      flags: { villageIntro: true },
    }));
  }, { chapter, WORDS });
  await page.goto('http://localhost:8080/');
  await page.locator('.title-start').click();
  await page.waitForSelector('.village');
  await wait(400);
}

try {
  // ── 2챕터 마을 (마법 왕국 테마)
  await seed(2);
  await shot('d-news');
  await clearSpeeches();
  let st = await state();
  if (st.placed.length !== 0 || !st.inv['word:바나나'] || !st.inv['decor:lamp']) throw new Error('예전 물건이 서랍으로 안 돌아옴');
  console.log('예전 물건 서랍으로: OK');

  await page.locator('.vbtn.deco').click();
  await clearSpeeches();
  await page.waitForSelector('.vdrawer .drawer-item');
  await shot('d-decorate');

  // 잘못된 자리에 끌어 놓기: 사과를 울타리로
  const apple = page.locator('.drawer-item[data-k="word:사과"]');
  const ab = await apple.boundingBox();
  await page.mouse.move(ab.x + ab.width / 2, ab.y + ab.height / 2);
  await page.mouse.down();
  await page.mouse.move(ab.x - 30, ab.y + 20, { steps: 4 });
  await page.mouse.move(870, 690, { steps: 10 });
  await shot('d-drag-hint');
  await page.mouse.up();
  await wait(300);
  await shot('d-wrong');
  st = await state();
  if (st.placed.some((p) => p.key === 'word:사과')) throw new Error('사과가 울타리에 놓임');
  console.log('잘못된 자리 거절: OK');

  // 맞는 자리에 끌어 놓기: 사과를 텃밭으로
  const ab2 = await page.locator('.drawer-item[data-k="word:사과"]').boundingBox();
  await page.mouse.move(ab2.x + ab2.width / 2, ab2.y + ab2.height / 2);
  await page.mouse.down();
  await page.mouse.move(ab2.x - 30, ab2.y + 20, { steps: 4 });
  await page.mouse.move(150, 700, { steps: 10 });
  await page.mouse.up();
  await wait(300);
  st = await state();
  const ap = st.placed.find((p) => p.key === 'word:사과');
  if (!ap || ap.spot !== 'garden') throw new Error('사과가 텃밭에 안 들어감: ' + JSON.stringify(ap));
  await shot('d-grow');
  console.log('텃밭에 심기: OK');

  // 나머지는 눌러서 자동으로
  for (let i = 0; i < 40; i++) {
    const it = page.locator('.vdrawer .drawer-item').first();
    if (!(await it.count())) break;
    await it.click();
    await wait(120);
  }
  st = await state();
  const bySpot = {};
  st.placed.forEach((p) => { bySpot[p.spot] = (bySpot[p.spot] || 0) + 1; });
  console.log('자리별 개수:', JSON.stringify(bySpot), '| 남은 서랍:', Object.keys(st.inv).length);
  for (const s of ['garden', 'pen', 'line', 'mat', 'toys', 'sky', 'shelf', 'free']) if (!bySpot[s]) throw new Error('비어 있는 자리: ' + s);
  await shot('d-placed-deco');

  // 동물을 서랍으로 돌려놓기
  const pen1 = st.placed.find((p) => p.spot === 'pen');
  const el = page.locator(`.placed[data-id="${pen1.id}"]`);
  const eb = await el.boundingBox();
  await page.mouse.move(eb.x + eb.width / 2, eb.y + eb.height / 2);
  await page.mouse.down();
  await page.mouse.move(1110, 400, { steps: 10 });
  await page.mouse.up();
  await wait(300);
  st = await state();
  if (st.placed.some((p) => p.id === pen1.id)) throw new Error('동물이 서랍으로 안 돌아감');
  console.log('서랍으로 돌려놓기: OK');

  await page.locator('.deco-done').click();
  await wait(2500); // 동물이 돌아다니는 시간
  await shot('d-village2');
  // 놓인 물건 누르면 이름
  await page.locator('.placed.spot-sky').first().dispatchEvent('pointerdown');
  await wait(200);
  if (!(await page.locator('.name-tag').count())) throw new Error('이름표 안 나옴');

  // ── 1챕터 마을 (동화 숲 테마)
  await seed(1);
  await clearSpeeches();
  await page.locator('.vbtn.deco').click();
  await clearSpeeches();
  for (let i = 0; i < 40; i++) {
    const it = page.locator('.vdrawer .drawer-item').first();
    if (!(await it.count())) break;
    await it.click();
    await wait(100);
  }
  await page.locator('.deco-done').click();
  await wait(1500);
  await shot('d-village1');
  console.log('✅ 꾸미기 테스트 통과');
} catch (e) {
  console.log('❌ 실패:', e.message);
  await page.screenshot({ path: `${OUT}/zz-decor-fail.png` });
} finally {
  console.log(errors.length ? '오류:\n' + errors.join('\n') : '콘솔 오류 없음');
  await browser.close();
}
