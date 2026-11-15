// 마을 배경: 챕터 테마마다 다른 모습 + 꾸미기 자리(텃밭, 울타리, 빨랫줄...)
import { O, castle } from './svgkit.js';
import { SPOTS } from './village-data.js';

const THEMES = {
  1: {
    skyTop: '#9fd8ff', skyBot: '#e6f6ff', far: '#b7e4a0', near: '#9fd88a', path: '#f1d9a8',
    houseWall: '#fff1d6', houseRoof: '#ff8fa3', houseText: '꼬리네 집',
    shopWall: '#fff6e6', awning: '#7cc576', sign: '#ffd166', signText: '곰 아저씨네 가게',
    tree: '#7cc576', trunk: '#b07a4a', swing: '#ff8fa3', slide: '#ffd166',
    soil: '#a8744a', mound: '#8a5a32', fence: '#c9824a', rope: '#a8683a',
    mat1: '#ff8f8f', mat2: '#fff', shelf: '#d9965a', sand: '#f5e1b0', penGround: '#b5e6a0',
    flowers: ['#ff8fab', '#ffe066', '#b69cff', '#ff9f43'],
  },
  2: {
    skyTop: '#b49cff', skyBot: '#f1eaff', far: '#c9e8b0', near: '#b2e09d', path: '#e3d9fb',
    houseWall: '#ece6f8', houseRoof: '#b69cff', houseText: '꼬리네 성',
    shopWall: '#f7f1ff', awning: '#b69cff', sign: '#ffd34d', signText: '요정의 마법 상점',
    tree: '#ffb3dc', trunk: '#9a6fb8', swing: '#ffd34d', slide: '#b69cff',
    soil: '#8a6fb8', mound: '#6a50a0', fence: '#ffc83d', rope: '#c9a6ff',
    mat1: '#8f6ee8', mat2: '#ffd34d', shelf: '#bfe6ff', sand: '#e9e0ff', penGround: '#c6edb2',
    flowers: ['#ff8fd0', '#b69cff', '#7ee0e6', '#ffd34d'],
  },
  3: {
    skyTop: '#130f33', skyBot: '#4b3a8c', far: '#8f86c4', near: '#b9b2e0', path: '#e6e2f8',
    houseWall: '#e6ecf5', houseRoof: '#7ec4ff', houseText: '꼬리네 우주 기지',
    shopWall: '#e6ecf5', awning: '#ff8fab', sign: '#7ee0e6', signText: '우주 정거장 가게',
    tree: '#7ee0e6', trunk: '#8f86c4', swing: '#ffd34d', slide: '#ff8fab',
    soil: '#5d5487', mound: '#463e70', fence: '#7ec4ff', rope: '#ffd34d',
    mat1: '#2e5aa8', mat2: '#7ec4ff', shelf: '#cfd8e3', sand: '#a59cd2', penGround: '#d6d0f0',
    flowers: ['#7ee0e6', '#ffd34d', '#ff8fd0', '#b69cff'],
  },
  4: {
    skyTop: '#8ee6f0', skyBot: '#2f95cc', far: '#4fb3b8', near: '#f2dca6', path: '#fff3d6',
    houseWall: '#fff3e6', houseRoof: '#ff9fb6', houseText: '꼬리네 조개 집',
    shopWall: '#eafcff', awning: '#7ee0e6', sign: '#ffd34d', signText: '바닷속 조개 가게',
    tree: '#ff7b8f', trunk: '#8a6a4a', swing: '#ffd34d', slide: '#ff9f7a',
    soil: '#d9bd84', mound: '#c4a46a', fence: '#ff9f7a', rope: '#3f9a6a',
    mat1: '#2fa3b8', mat2: '#bff3f7', shelf: '#cfe6f0', sand: '#fff3d6', penGround: '#bfe9e6',
    flowers: ['#ff8fab', '#ffd34d', '#b69cff', '#7ee0e6'],
  },
};
const subArt = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${O}" stroke-width="5" stroke-linejoin="round"><path d="M70 30 V8 H92" fill="none" stroke-width="6"/><rect x="58" y="20" width="40" height="26" rx="10" fill="#ffd34d"/><path d="M0 70 C0 40 40 34 90 34 C140 34 168 50 168 70 C168 94 138 106 90 106 C40 106 0 96 0 70Z" fill="#ffd34d"/><circle cx="56" cy="70" r="14" fill="#bfe6ff"/><circle cx="96" cy="70" r="14" fill="#bfe6ff"/><circle cx="136" cy="70" r="12" fill="#bfe6ff"/><path d="M0 70 L-18 52 V88Z" fill="#ff8f6b"/></g>`;
const fishArt = (x, y, s, c, flip = 1) => `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})" stroke="${O}" stroke-width="3"><path d="M30 0 L48 -14 V14Z" fill="${c}"/><ellipse cx="0" cy="0" rx="34" ry="20" fill="${c}"/><circle cx="-18" cy="-4" r="4" fill="${O}" stroke="none"/></g>`;
const starfish = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -20 L6 -6 L20 -6 L9 3 L13 18 L0 9 L-13 18 L-9 3 L-20 -6 L-6 -6Z" fill="${c}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
const rocketArt = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${O}" stroke-width="5" stroke-linejoin="round"><path d="M50 0 C80 30 84 90 74 130 H26 C16 90 20 30 50 0Z" fill="#f2f4f8"/><path d="M26 130 L4 160 L28 150Z M74 130 L96 160 L72 150Z" fill="#ff6b6b"/><circle cx="50" cy="60" r="16" fill="#7ec4ff"/><path d="M36 130 L44 158 H56 L64 130" fill="#ffd34d"/></g>`;

const fl = (x, y, c) => `<g><path d="M${x} ${y} v14" stroke="#4f9a4a" stroke-width="3"/><circle cx="${x}" cy="${y}" r="7" fill="${c}" stroke="${O}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="2.5" fill="#fff"/></g>`;
const sparkle = (x, y, r, c = '#fff6b0') => `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z" fill="${c}"/>`;

function spotsArt(t, theme) {
  const g = [];
  // 빨랫줄
  g.push(`<g stroke="${O}" stroke-width="4"><rect x="34" y="452" width="10" height="132" rx="3" fill="${t.trunk}"/><rect x="326" y="452" width="10" height="132" rx="3" fill="${t.trunk}"/></g>
    <path d="M40 470 Q186 512 330 470" fill="none" stroke="${t.rope}" stroke-width="4"/>
    ${theme >= 2 ? [80, 130, 186, 240, 290].map((x, i) => `<path d="M${x} ${476 + Math.sin((x - 40) / 290 * Math.PI) * 30} l8 16 l8 -16z" fill="${['#ffd34d', '#ff8fd0', '#7ee0e6'][i % 3]}" stroke="${O}" stroke-width="1.5"/>`).join('') : ''}`);
  // 텃밭
  const [gx0, gy0, gx1, gy1] = SPOTS.garden.area;
  g.push(`<rect x="${gx0}" y="${gy0}" width="${gx1 - gx0}" height="${gy1 - gy0}" rx="22" fill="${t.soil}" stroke="${O}" stroke-width="4"/>
    ${SPOTS.garden.slots.map(([x, y]) => `<ellipse cx="${x}" cy="${y + 26}" rx="30" ry="11" fill="${t.mound}"/>`).join('')}
    ${theme >= 2 ? [[60, 700], [190, 620], [320, 700], [120, 785]].map(([x, y]) => sparkle(x, y, 7)).join('') : ''}`);
  // 선반
  const [sx0, , sx1] = SPOTS.shelf.area;
  g.push(`<g stroke="${O}" stroke-width="3">
    <rect x="${sx0 + 6}" y="500" width="10" height="56" fill="${t.shelf}"/><rect x="${sx1 - 16}" y="500" width="10" height="56" fill="${t.shelf}"/>
    <rect x="${sx0}" y="496" width="${sx1 - sx0}" height="12" rx="4" fill="${t.shelf}" ${theme >= 2 ? 'opacity=".85"' : ''}/>
    <rect x="${sx0}" y="552" width="${sx1 - sx0}" height="12" rx="4" fill="${t.shelf}" ${theme === 2 ? 'opacity=".85"' : ''}/></g>`);
  // 소풍 돗자리
  const [mx0, my0, mx1, my1] = SPOTS.mat.area;
  const cells = [];
  for (let y = my0; y < my1; y += 24) for (let x = mx0; x < mx1; x += 24) if (((x - mx0) / 24 + (y - my0) / 24) % 2 === 0) cells.push(`<rect x="${x}" y="${y}" width="${Math.min(24, mx1 - x)}" height="${Math.min(24, my1 - y)}" fill="${t.mat2}" opacity=".85"/>`);
  g.push(`<g><rect x="${mx0}" y="${my0}" width="${mx1 - mx0}" height="${my1 - my0}" rx="10" fill="${t.mat1}"/>${cells.join('')}<rect x="${mx0}" y="${my0}" width="${mx1 - mx0}" height="${my1 - my0}" rx="10" fill="none" stroke="${O}" stroke-width="4"/></g>`);
  // 놀이터 모래밭
  const [tx0, ty0, tx1, ty1] = SPOTS.toys.area;
  g.push(`<ellipse cx="${(tx0 + tx1) / 2}" cy="${(ty0 + ty1) / 2 + 22}" rx="${(tx1 - tx0) / 2}" ry="${(ty1 - ty0) / 2 - 8}" fill="${t.sand}" stroke="${O}" stroke-width="3"/>`);
  // 동물 울타리
  const [px0, py0, px1, py1] = SPOTS.pen.area;
  const posts = [];
  for (let x = px0; x <= px1; x += 44) posts.push(`<rect x="${x - 5}" y="${py0 - 14}" width="10" height="30" rx="3" fill="${t.fence}"/>`, `<rect x="${x - 5}" y="${py1 - 14}" width="10" height="26" rx="3" fill="${t.fence}"/>`);
  for (let y = py0 + 30; y < py1 - 10; y += 44) posts.push(`<rect x="${px0 - 5}" y="${y}" width="10" height="26" rx="3" fill="${t.fence}"/>`, `<rect x="${px1 - 5}" y="${y}" width="10" height="26" rx="3" fill="${t.fence}"/>`);
  g.push(`<rect x="${px0}" y="${py0}" width="${px1 - px0}" height="${py1 - py0}" rx="14" fill="${t.penGround}"/>
    <g stroke="${O}" stroke-width="3"><rect x="${px0}" y="${py0 - 4}" width="${px1 - px0}" height="8" rx="3" fill="${t.fence}"/><rect x="${px0}" y="${py1 - 6}" width="${px1 - px0}" height="8" rx="3" fill="${t.fence}"/>
    <rect x="${px0 - 4}" y="${py0}" width="8" height="${py1 - py0}" rx="3" fill="${t.fence}"/><rect x="${px1 - 4}" y="${py0}" width="8" height="${py1 - py0}" rx="3" fill="${t.fence}"/>${posts.join('')}</g>`);
  return g.join('');
}

export function villageBG(restore = 0, opts = {}) {
  const theme = THEMES[opts.theme] ? opts.theme : 1;
  const t = THEMES[theme];
  const flowers = theme === 2 || restore >= 25;
  const rainbow = theme === 1 && restore >= 75;
  const done = theme === 1 && restore >= 100 && opts.banner !== false;
  const id = 'vs' + theme;
  return `<svg viewBox="0 0 1180 820" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.skyTop}"/><stop offset="1" stop-color="${t.skyBot}"/></linearGradient></defs>
    <rect width="1180" height="820" fill="url(#${id})"/>
    ${rainbow ? `<g fill="none" stroke-width="22" opacity=".75"><path d="M120 470 A470 380 0 0 1 1060 470" stroke="#ff8fab"/><path d="M142 470 A448 358 0 0 1 1038 470" stroke="#ffd166"/><path d="M164 470 A426 336 0 0 1 1016 470" stroke="#9be29b"/><path d="M186 470 A404 314 0 0 1 994 470" stroke="#7ec4ff"/><path d="M208 470 A382 292 0 0 1 972 470" stroke="#b69cff"/></g>` : ''}
    ${theme === 4 ? `<g fill="#fff" opacity=".16">${[150, 470, 800, 1050].map((x) => `<path d="M${x} 0 L${x + 90} 0 L${x - 40} 440 L${x - 140} 440Z"/>`).join('')}</g>${Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 149) % 1180}" cy="${20 + ((i * 71) % 300)}" r="${4 + (i % 4) * 3}" fill="none" stroke="#fff" stroke-width="2.5" opacity=".5"/>`).join('')}${fishArt(960, 215, 0.9, '#ffb03b')}${fishArt(560, 110, 0.6, '#ff8fab', -1)}${fishArt(220, 150, 0.8, '#b69cff', -1)}<g stroke="${O}" stroke-width="4" transform="translate(-330 60)"><path d="M1000 70 C1000 40 1060 30 1110 40 C1150 48 1170 70 1160 90 C1150 110 1050 112 1010 100 Z" fill="#5d86e0"/><path d="M1006 92 C1040 108 1120 108 1150 92 C1120 100 1040 100 1006 92Z" fill="#cfe6ff"/><path d="M1160 70 L1178 52 L1176 86Z" fill="#5d86e0"/><circle cx="1030" cy="70" r="4" fill="${O}" stroke="none"/><path d="M1060 38 C1056 22 1050 18 1044 22 M1060 38 C1064 22 1072 18 1078 22" fill="none" stroke="#fff" stroke-width="4"/></g>` : theme === 3 ? `${Array.from({ length: 50 }, (_, i) => `<circle cx="${(i * 137) % 1180}" cy="${(i * 53) % 330}" r="${1 + (i % 3) * 0.8}" fill="#fff" opacity="${0.4 + (i % 5) / 8}"/>`).join('')}<g stroke="${O}" stroke-width="4"><circle cx="1070" cy="110" r="48" fill="#ff9f6b"/><ellipse cx="1070" cy="110" rx="82" ry="16" fill="none" stroke="#ffd34d" stroke-width="6" transform="rotate(-18 1070 110)"/></g>` : theme === 1
      ? `<circle cx="1060" cy="100" r="54" fill="#ffe27a" stroke="#f5c542" stroke-width="5"/>`
      : `<path d="M1074 52 A50 50 0 1 0 1100 140 A40 40 0 1 1 1074 52Z" fill="#fff4b0" stroke="#e8c84a" stroke-width="4"/>${[[300, 60], [520, 40], [760, 70], [940, 40], [180, 140], [1000, 200]].map(([x, y], i) => sparkle(x, y, 6 + (i % 3) * 2)).join('')}`}
    <g fill="#fff" opacity="${theme >= 3 ? 0 : 0.95}"><ellipse cx="200" cy="110" rx="70" ry="28"/><ellipse cx="250" cy="96" rx="46" ry="30"/><ellipse cx="640" cy="80" rx="80" ry="26"/><ellipse cx="690" cy="66" rx="44" ry="28"/></g>
    <path d="M0 400 C160 320 300 360 420 380 C560 300 760 330 900 370 C1000 330 1100 340 1180 360 V820 H0Z" fill="${t.far}"/>
    ${theme === 4 ? subArt(300, 330, 0.62) : theme === 3 ? rocketArt(318, 278, 0.95) : opts.castle || theme === 2 ? castle(303, 442, 0.55) : ''}
    ${theme === 4 ? starfish(880, 470, 1, '#ff9f7a') + starfish(470, 790, 0.9, '#ffd34d') + starfish(40, 795, 0.8, '#ff8fab') : ''}
    ${theme === 3 ? `<g stroke="${O}" stroke-width="3" fill="#a59cd2"><ellipse cx="880" cy="470" rx="40" ry="10"/><ellipse cx="460" cy="790" rx="50" ry="12"/></g>` : ''}
    <path d="M0 450 C200 420 400 440 600 430 C800 420 1000 440 1180 430 V820 H0Z" fill="${t.near}"/>
    <path d="M720 820 C700 760 720 720 700 660 C690 600 640 560 615 445" fill="none" stroke="${t.path}" stroke-width="44" stroke-linecap="round"/>
    ${theme === 2 ? `<path d="M720 820 C700 760 720 720 700 660 C690 600 640 560 615 445" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 22" stroke-linecap="round" opacity=".8"/>` : ''}
    <!-- 꼬리네 집 -->
    <g stroke="${O}" stroke-width="4" stroke-linejoin="round">
      <rect x="70" y="270" width="210" height="170" rx="8" fill="${t.houseWall}"/>
      ${theme === 2 ? `<rect x="250" y="210" width="44" height="230" fill="${t.houseWall}"/><path d="M244 212 L272 160 L300 212Z" fill="${t.houseRoof}"/><path d="M272 160 V140 L290 148 L272 154" fill="#ff8fab"/>` : theme >= 3 ? '' : `<rect x="235" y="190" width="26" height="50" fill="#c9824a"/>`}
      ${theme === 4 ? `<path d="M175 150 L50 280 C60 210 120 160 175 150 C230 160 290 210 300 280Z" fill="${t.houseRoof}"/><path d="M175 150 L90 280 M175 150 L132 280 M175 150 V280 M175 150 L218 280 M175 150 L260 280" fill="none" stroke="#e86f8f" stroke-width="4"/><path d="M50 280 H300" stroke-width="5"/><circle cx="175" cy="150" r="10" fill="#fff"/>` : theme === 3 ? `<path d="M60 280 A115 100 0 0 1 290 280Z" fill="${t.houseRoof}" opacity=".9"/><path d="M175 180 V150" stroke-width="4"/><circle cx="175" cy="146" r="8" fill="#ff6b6b"/><path d="M110 230 q20 -30 50 -36" fill="none" stroke="#fff" stroke-width="5" opacity=".8"/>` : `<path d="M50 280 L175 180 L300 280Z" fill="${t.houseRoof}"/>`}
      <rect x="150" y="350" width="52" height="90" rx="20" fill="#c9824a"/>
      <circle cx="191" cy="398" r="4" fill="#ffd34d"/>
      <rect x="92" y="310" width="44" height="40" rx="${theme >= 2 ? 20 : 6}" fill="${theme >= 2 ? '#fff6b0' : '#bfe6ff'}"/>
      <rect x="${theme === 2 ? 258 : 218}" y="${theme === 2 ? 260 : 310}" width="${theme === 2 ? 28 : 44}" height="40" rx="${theme === 2 ? 14 : 6}" fill="${theme === 2 ? '#fff6b0' : '#bfe6ff'}"/>
      ${theme === 1 ? '<path d="M114 310 V350 M92 330 H136 M240 310 V350 M218 330 H262" stroke-width="3"/>' : ''}
    </g>
    <text x="175" y="255" font-size="26" text-anchor="middle" fill="#fff" stroke="${O}" stroke-width="6" paint-order="stroke" font-family="Jua">${t.houseText}</text>
    <!-- 가게 -->
    <g stroke="${O}" stroke-width="4" stroke-linejoin="round">
      <rect x="430" y="250" width="240" height="190" rx="8" fill="${t.shopWall}"/>
      <path d="M415 260 L432 210 H668 L685 260Z" fill="${t.awning}"/>
      <path d="M468 210 L460 260 M510 210 L506 260 M550 210 L550 260 M590 210 L594 260 M630 210 L640 260" stroke="#fff" stroke-width="8"/>
      <path d="M415 260 Q438 280 461 260 Q484 280 507 260 Q530 280 553 260 Q576 280 599 260 Q622 280 645 260 Q665 278 685 260" fill="${t.awning}"/>
      <rect x="455" y="300" width="80" height="70" rx="${theme >= 3 ? 35 : 6}" fill="${theme >= 2 ? '#fff6b0' : '#bfe6ff'}"/>
      <rect x="575" y="320" width="70" height="120" rx="8" fill="#c9824a"/>
      <rect x="455" y="158" width="190" height="46" rx="12" fill="${t.sign}"/>
    </g>
    <text x="550" y="190" font-size="24" text-anchor="middle" fill="${O}" font-family="Jua">${t.signText}</text>
    ${theme === 2 ? sparkle(470, 150, 9, '#fff') + sparkle(632, 152, 7, '#fff') : ''}
    <!-- 나무와 놀이기구 -->
    <g stroke="${O}" stroke-width="4" stroke-linejoin="round">
      <path d="M840 440 L870 280 L900 440 M1000 440 L1030 280 L1060 440" fill="none" stroke="${t.swing}" stroke-width="10"/>
      <path d="M860 284 H1040" stroke="${t.swing}" stroke-width="10"/>
      <path d="M930 290 V380 M970 290 V380" stroke-width="3"/>
      <rect x="920" y="378" width="60" height="12" rx="4" fill="${t.slide}"/>
      <path d="M1080 440 L1080 330 L1110 330 L1110 440" fill="none" stroke="${theme >= 2 ? '#ffd34d' : '#7ec4ff'}" stroke-width="8"/>
      <path d="M1110 340 Q1150 380 1170 440" fill="none" stroke="${t.slide}" stroke-width="16"/>
      ${theme === 4 ? `<path d="M790 440 V360 M790 380 C770 360 760 330 764 300 M790 370 C810 350 820 320 816 290 M790 360 C790 330 796 300 790 260 M764 330 C750 320 744 300 748 286 M816 320 C832 310 836 292 832 280" fill="none" stroke="${O}" stroke-width="20" stroke-linecap="round"/><path d="M790 440 V360 M790 380 C770 360 760 330 764 300 M790 370 C810 350 820 320 816 290 M790 360 C790 330 796 300 790 260 M764 330 C750 320 744 300 748 286 M816 320 C832 310 836 292 832 280" fill="none" stroke="${t.tree}" stroke-width="13" stroke-linecap="round"/>` : theme === 3 ? `<rect x="780" y="350" width="20" height="90" fill="${t.trunk}"/><path d="M790 230 L830 300 L812 360 H768 L750 300Z" fill="${t.tree}"/><path d="M790 230 L790 360 M750 300 L830 300" stroke="#fff" stroke-width="3" opacity=".7"/>` : `<circle cx="790" cy="300" r="60" fill="${t.tree}"/><rect x="780" y="350" width="20" height="90" fill="${t.trunk}"/>`}
    </g>
    ${theme === 2 ? [[760, 280], [812, 266], [790, 320], [770, 310], [820, 300]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" opacity=".8"/>`).join('') : ''}
    ${theme === 4 ? [[20, 440], [400, 440], [690, 440], [1150, 440]].map(([x, y]) => `<path d="M${x} ${y} C${x - 12} ${y - 30} ${x + 12} ${y - 50} ${x} ${y - 80}" fill="none" stroke="#3f9a6a" stroke-width="10" stroke-linecap="round"/>`).join('') : ''}
    ${flowers ? [[40, 460], [360, 760], [700, 452], [1060, 800], [380, 600], [420, 460]].map(([x, y], i) => fl(x, y, t.flowers[i % 4])).join('') : ''}
    ${opts.spots === false ? '' : spotsArt(t, theme)}
    ${done ? `<g font-family="Jua"><rect x="20" y="94" width="300" height="56" rx="28" fill="#fff" stroke="${O}" stroke-width="4"/><text x="170" y="132" font-size="30" text-anchor="middle" fill="#ff6fa0">동화 숲 마을 복원 완료!</text></g>` : ''}
  </svg>`;
}
