// 아이패드 가로 화면 크기로 게임 전체 흐름 자동 테스트: node tools/test.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = process.env.SHOTS || 'tools/shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE });
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
// 음성은 바로 끝난 것으로 처리 (테스트 속도)
await page.addInitScript(() => {
  window.speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 30);
  window.speechSynthesis.cancel = () => {};
});

const shot = async (name) => { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
const step = (m) => console.log('▶', m);
async function speechUntil(selector, max = 30) {
  for (let i = 0; i < max; i++) {
    if (await page.locator(selector).count()) return;
    const b = page.locator('.speech-btns button').first();
    if (await b.count()) await b.click();
    await page.waitForTimeout(250);
  }
  throw new Error('대화를 넘겨도 ' + selector + ' 가 안 나타남');
}
async function clearSpeeches() {
  for (let i = 0; i < 20 && await page.locator('.speech-btns button').count(); i++) {
    await page.locator('.speech-btns button').first().click();
    await page.waitForTimeout(250);
  }
}
async function startQuest(type) {
  await page.locator('.vbtn.board').click();
  await page.waitForSelector('.qcard');
  const cards = page.locator('.qcard');
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    const label = await cards.nth(i).locator('.qtype').innerText();
    const want = { find: '가게에서 찾기', dig: '땅 파서 맞추기', trace: '봉인 마법 풀기' }[type];
    if (label.includes(want)) { await cards.nth(i).locator('.qgo').click(); return; }
  }
  await page.locator('.close-btn').click();
  // 게시판에 없으면 테스트용 의뢰를 바로 시작
  await page.evaluate(async (type) => { const { runMission } = await import('/js/scenes/mission.js'); runMission({ id: 'test-' + type, type, words: type === 'dig' ? ['바지', '나비'] : ['나무'], giver: 'owl', text: '테스트 의뢰' }); }, type);
}

async function playFind() {
  await speechUntil('.find .word-card-word');
  await shot('20-find');
  for (let r = 0; r < 3; r++) {
    await page.waitForSelector('.shelf-item');
    const target = await page.locator('.word-card-word').innerText();
    // 일부러 한 번 틀려 보기 (첫 라운드)
    if (r === 0) {
      const wrong = page.locator(`.shelf-item:not([data-w="${target}"])`).first();
      await wrong.scrollIntoViewIfNeeded();
      await wrong.click();
      await shot('21-find-wrong');
    }
    const item = page.locator(`.shelf-item[data-w="${target}"]`);
    await item.scrollIntoViewIfNeeded();
    await item.click();
    await page.waitForTimeout(1500);
  }
}

async function drawStrokes() {
  const word = await page.evaluate(() => [...document.querySelectorAll('.trace-word span')].map((s) => s.textContent).join(''));
  for (const ch of word) {
    const strokes = await page.evaluate(async (ch) => (await import('/js/strokes.js')).syllableStrokes(ch), ch);
    for (const s of strokes) {
      const box = await page.locator('.trace-ink').boundingBox();
      const P = ([x, y]) => [box.x + (60 + x * 480) / 600 * box.width, box.y + (60 + y * 480) / 600 * box.height];
      const pts = await page.evaluate(async ({ s }) => (await import('/js/strokes.js')).samplePoly(s, 20), { s });
      const [x0, y0] = P(pts[0]);
      await page.mouse.move(x0, y0);
      await page.mouse.down();
      for (const p of pts.slice(1)) { const [x, y] = P(p); await page.mouse.move(x, y, { steps: 2 }); }
      await page.mouse.up();
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(900);
  }
}

try {
  step('시작 화면');
  await page.goto('http://localhost:8080/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.title-start');
  await shot('01-title');
  await page.locator('.title-start').click();

  step('이름 입력');
  await page.waitForSelector('.onb-input');
  await shot('02-name');
  await page.locator('.onb-input').fill('테스트');
  await page.locator('.onb-ok').click();

  step('아바타');
  await page.waitForSelector('.avatar-done');
  await page.locator('.opt.txt').nth(2).click();
  await page.locator('.opt-list[data-k="outfit"] .opt').nth(3).click();
  await shot('03-avatar');
  await page.locator('.avatar-done').click();

  step('오프닝');
  await page.waitForSelector('.speech');
  await shot('04-opening');
  await page.locator('.speech-btns button').first().click();
  await page.waitForTimeout(900);
  await shot('05-opening-zombie');
  await speechUntil('.village');
  await shot('06-village-intro');
  await clearSpeeches();
  await shot('07-village');

  step('의뢰 게시판');
  await page.locator('.vbtn.board').click();
  await page.waitForSelector('.qcard');
  await shot('10-board');
  await page.locator('.close-btn').click();

  step('찾기 미션 (이야기 1: 우유)');
  await startQuest('find');
  await playFind();
  await page.waitForSelector('.result');
  await shot('22-result');
  await page.locator('.result-go').click();
  await speechUntil('.village');
  await clearSpeeches();

  step('땅파기 미션');
  // 테스트용: 단어를 알아내기 위해 itemSVG 카드의 단어를 S.board에서 읽음
  await page.locator('.vbtn.board').click();
  await page.waitForSelector('.qcard');
  const digWords = await page.evaluate(async () => (await import('/js/state.js')).S.board.find((q) => q.type === 'dig').words);
  await page.locator('.close-btn').click();
  await startQuest('dig');
  for (let r = 0; r < digWords.length; r++) {
    await page.evaluate((w) => { window.__lastDigWord = w; }, digWords[r]);
    if (r === 0) await speechUntil('.dig .dig-tile');
    await page.waitForSelector('.dig-tile:not(.open)');
    const tiles = page.locator('.dig-tile');
    const n = await tiles.count();
    for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) await tiles.nth(i).dispatchEvent('pointerdown');
    await page.waitForTimeout(700);
    if (r === 0) await shot('30-dig-dug');
    const seq = await page.evaluate(async () => {
      const { syllables, VOWEL_SPLIT, isCompound } = await import('/js/hangul.js');
      const trayJ = [...document.querySelectorAll('.jamo-tile')].map((t) => t.dataset.j);
      const out = [];
      for (const d of syllables(window.__lastDigWord)) {
        out.push(d.cho);
        if (isCompound(d.jung) && !trayJ.includes(d.jung)) out.push(...VOWEL_SPLIT[d.jung]); else out.push(d.jung);
      }
      return out;
    });
    if (r === 0) {
      // 일부러 틀리게: 첫 조각만 놓고 나머지는 엉뚱하게
    }
    for (const j of seq) { await page.locator(`.jamo-tile:not(.used)[data-j="${j}"]`).first().click(); await page.waitForTimeout(150); }
    await shot(`31-dig-built-${r}`);
    await page.locator('.dig-check').click();
    await page.waitForTimeout(2000);
  }
  await page.waitForSelector('.result');
  await shot('33-dig-result');
  await page.locator('.result-go').click();
  await page.waitForTimeout(500);
  await clearSpeeches();

  step('따라 쓰기 미션');
  await startQuest('trace');
  await speechUntil('.trace .trace-ink');
  await page.waitForTimeout(600);
  await shot('40-trace');
  // 한 번 엉터리로 그어 보기
  const box = await page.locator('.trace-ink').boundingBox();
  await page.mouse.move(box.x + 500, box.y + 500); await page.mouse.down(); await page.mouse.move(box.x + 520, box.y + 300, { steps: 5 }); await page.mouse.up();
  await page.waitForTimeout(200);
  await shot('41-trace-fail');
  await page.waitForTimeout(500);
  await drawStrokes();
  await page.waitForSelector('.result', { timeout: 15000 });
  await shot('42-trace-result');
  await page.locator('.result-go').click();
  await page.waitForTimeout(500);
  await clearSpeeches();

  step('꾸미기');
  await page.locator('.vbtn.deco').click();
  await clearSpeeches();
  await page.waitForSelector('.drawer-item');
  await shot('50-decorate');
  const it = page.locator('.drawer-item').first();
  const b = await it.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y - 40, { steps: 4 });
  await page.mouse.move(500, 560, { steps: 8 });
  await page.mouse.up();
  await page.locator('.drawer-item').first().click(); // 그냥 누르면 자동 배치
  await shot('51-decorated');
  await page.locator('.deco-done').click();
  await page.locator('.placed').first().dispatchEvent('pointerdown');
  await shot('52-tap-item');

  step('상점 / 도감');
  await page.evaluate(async () => { (await import('/js/state.js')).S.stars += 30; });
  await page.locator('.vbtn.shop').click();
  await page.waitForSelector('.shop-item');
  await page.locator('.shop-item button').nth(1).click();
  await shot('60-shop');
  await page.locator('.close-btn').click();
  await page.locator('.vbtn.dex').click();
  await shot('61-dex');
  await page.locator('.close-btn').click();

  step('부모 설정');
  // 테스트용 비밀번호로 바꿔서 진행 (실제 비밀번호는 코드에 적지 않음)
  await page.evaluate(async () => { const m = await import('/js/state.js'); m.S.settings.pwHash = m.pwHash('1234'); });
  await page.locator('.parent-btn').click();
  for (const k of '1234') await page.locator(`.kp-key[data-k="${k}"]`).click();
  await page.waitForSelector('.parent-panel');
  await shot('70-parent');
  await page.locator('.parent-panel .close-btn').click();

  step('30분 알림');
  await page.evaluate(async () => { (await import('/js/state.js')).S.gate.played = 99999; });
  await page.waitForSelector('.gate', { timeout: 5000 });
  await shot('80-gate');
  await page.locator('.gate .btn').click();
  for (const k of '1111') await page.locator(`.kp-key[data-k="${k}"]`).click();
  await page.waitForTimeout(300);
  if (!(await page.locator('.gate').count())) throw new Error('틀린 비밀번호로 잠금이 풀림');
  await page.locator('.gate .btn').click();
  for (const k of '1234') await page.locator(`.kp-key[data-k="${k}"]`).click();
  await page.waitForTimeout(400);
  if (await page.locator('.gate').count()) throw new Error('맞는 비밀번호로 잠금이 안 풀림');

  step('보스 전 상태 확인');
  const st = await page.evaluate(async () => { const { S } = await import('/js/state.js'); return { restore: S.restore, stars: S.stars, done: S.story.done, inv: S.inventory, tools: S.tools }; });
  console.log(JSON.stringify(st));
  console.log('✅ 전체 흐름 통과');
} catch (e) {
  console.log('❌ 실패:', e.message);
  await page.screenshot({ path: `${OUT}/zz-fail.png` });
} finally {
  console.log(errors.length ? '오류:\n' + errors.join('\n') : '콘솔 오류 없음');
  await browser.close();
}
