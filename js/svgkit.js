// SVG 그림 공용 도구
export const O = '#5a4032';
export const wrap = (inner, vb = '0 0 100 100', extra = '') =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" stroke="${O}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" ${extra}>${inner}</svg>`;
export const eye = (x, y, r = 3.5) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${O}" stroke="none"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.35}" fill="#fff" stroke="none"/>`;
export const blush = (x, y, rx = 6, ry = 3.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ff9fb6" opacity=".55" stroke="none"/>`;

// 성 (마법 왕국): x,y = 왼쪽 아래 기준, s = 크기 배율
export function castle(x, y, s = 1, wall = '#ece6f8', roof = '#b69cff') {
  const t = (dx, dy) => `${x + dx * s} ${y + dy * s}`;
  return `<g stroke="${O}" stroke-width="${4 * Math.min(1, s)}" stroke-linejoin="round">
    <rect x="${x + 30 * s}" y="${y - 120 * s}" width="${140 * s}" height="${120 * s}" fill="${wall}"/>
    <rect x="${x}" y="${y - 160 * s}" width="${44 * s}" height="${160 * s}" fill="${wall}"/>
    <rect x="${x + 156 * s}" y="${y - 160 * s}" width="${44 * s}" height="${160 * s}" fill="${wall}"/>
    <rect x="${x + 76 * s}" y="${y - 190 * s}" width="${48 * s}" height="${80 * s}" fill="${wall}"/>
    <path d="M${t(-6, -160)} L${t(22, -215)} L${t(50, -160)}Z" fill="${roof}"/>
    <path d="M${t(150, -160)} L${t(178, -215)} L${t(206, -160)}Z" fill="${roof}"/>
    <path d="M${t(70, -190)} L${t(100, -250)} L${t(130, -190)}Z" fill="${roof}"/>
    <path d="M${t(100, -250)} V${y - 272 * s} L${t(118, -264)} L${t(100, -258)}" fill="#ff8fab"/>
    <path d="M${t(84, 0)} V${y - 44 * s} A${16 * s} ${16 * s} 0 0 1 ${t(116, -44)} V${y}Z" fill="#a8683a"/>
    <rect x="${x + 14 * s}" y="${y - 120 * s}" width="${16 * s}" height="${22 * s}" rx="${8 * s}" fill="#fff6b0"/>
    <rect x="${x + 170 * s}" y="${y - 120 * s}" width="${16 * s}" height="${22 * s}" rx="${8 * s}" fill="#fff6b0"/>
    <rect x="${x + 92 * s}" y="${y - 168 * s}" width="${16 * s}" height="${22 * s}" rx="${8 * s}" fill="#fff6b0"/>
  </g>`;
}
