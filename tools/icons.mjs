// 앱 아이콘 PNG 만들기: node tools/icons.mjs (서버가 켜져 있어야 함)
import { chromium } from 'playwright-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ executablePath: EDGE });
const page = await browser.newPage();
await page.goto('http://localhost:8080/tools/blank.html');
for (const size of [180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.evaluate(async (size) => {
    const { catSVG } = await import('/js/art.js');
    document.body.style.margin = '0';
    document.body.innerHTML = `<div style="width:${size}px;height:${size}px;background:radial-gradient(circle at 50% 40%,#fff4d6,#ffc98a);display:flex;align-items:center;justify-content:center"><div style="width:${size * 0.78}px;height:${size * 0.82}px;margin-top:${size * 0.06}px">${catSVG({ mood: 'happy' })}</div></div>`;
  }, size);
  await page.screenshot({ path: `icons/icon-${size}.png` });
  console.log('icon', size);
}
await browser.close();
