// 모든 그림은 코드로 그린 SVG
import { O, wrap, eye, blush, castle } from './svgkit.js';
import { ITEMS2, VILLAGERS2 } from './art2.js';

// ───────────────────────── 단어 그림 ─────────────────────────
const ITEMS = {
  '우유': `<rect x="42" y="9" width="16" height="8" rx="2" fill="#ff9fb6"/><path d="M30 32 L36 16 H64 L70 32 Z" fill="#dff0ff"/><rect x="30" y="32" width="40" height="56" rx="4" fill="#fff"/><rect x="30" y="50" width="40" height="22" fill="#7ec4ff"/><path d="M50 53 C45 60 45 65 50 66 C55 65 55 60 50 53Z" fill="#fff" stroke-width="2"/>`,
  '나무': `<rect x="44" y="56" width="12" height="34" rx="3" fill="#b07a4a"/><circle cx="30" cy="52" r="14" fill="#6bb865"/><circle cx="70" cy="52" r="14" fill="#6bb865"/><circle cx="50" cy="36" r="24" fill="#7cc576"/><path d="M38 26 q6-6 12-3" fill="none" stroke="#bdf0b0"/>`,
  '바나나': `<path d="M32 24 C36 56 60 72 88 56 C92 52 89 46 84 48 C62 58 50 46 48 24 Z" fill="#ffd23f"/><path d="M18 28 C16 66 48 88 84 72 C90 69 88 62 82 63 C56 68 38 54 36 28 Z" fill="#ffe066"/><path d="M24 40 C28 62 50 76 76 70" fill="none" stroke="#e6b800" stroke-width="2.5"/><path d="M18 28 L22 12 H44 L48 24 L36 28Z" fill="#8a6a3a"/><circle cx="85" cy="67" r="3" fill="#5a4032" stroke="none"/>`,
  '포도': `<path d="M50 34 L52 16" fill="none"/><path d="M52 21 C62 10 77 14 75 25 C66 28 58 26 52 21Z" fill="#7cc576"/><circle cx="34" cy="42" r="9" fill="#a77bff"/><circle cx="50" cy="42" r="9" fill="#a77bff"/><circle cx="66" cy="42" r="9" fill="#a77bff"/><circle cx="42" cy="57" r="9" fill="#a77bff"/><circle cx="58" cy="57" r="9" fill="#a77bff"/><circle cx="50" cy="72" r="9" fill="#a77bff"/><circle cx="31" cy="39" r="2.5" fill="#fff" stroke="none"/><circle cx="47" cy="39" r="2.5" fill="#fff" stroke="none"/><circle cx="63" cy="39" r="2.5" fill="#fff" stroke="none"/>`,
  '토마토': `<circle cx="50" cy="56" r="30" fill="#ff6b6b"/><ellipse cx="37" cy="50" rx="5" ry="8" fill="#ffb3b3" stroke="none"/><path d="M50 28 L38 24 L44 32 L34 36 L46 36 L50 44 L54 36 L66 36 L56 32 L62 24 Z" fill="#6bb865"/>`,
  '오이': `<g transform="rotate(-25 50 52)"><rect x="14" y="40" width="72" height="24" rx="12" fill="#7cc576"/><circle cx="28" cy="48" r="2" fill="#3f8a3a" stroke="none"/><circle cx="40" cy="56" r="2" fill="#3f8a3a" stroke="none"/><circle cx="52" cy="47" r="2" fill="#3f8a3a" stroke="none"/><circle cx="64" cy="56" r="2" fill="#3f8a3a" stroke="none"/><circle cx="74" cy="48" r="2" fill="#3f8a3a" stroke="none"/><path d="M86 52 h7" fill="none"/></g><circle cx="16" cy="76" r="6" fill="#ffe066"/>`,
  '고구마': `<path d="M86 44 l9 -5 M14 58 l-9 3" fill="none"/><path d="M14 56 C18 34 60 28 80 38 C93 46 89 64 74 70 C54 78 22 76 14 56Z" fill="#c45a8a"/><path d="M34 44 q4 5 2 9 M52 40 q4 6 0 10 M66 50 q4 4 0 8" fill="none" stroke="#8a3560" stroke-width="2"/>`,
  '모자': `<path d="M29 62 C28 34 72 34 71 62 Z" fill="#ffd166"/><ellipse cx="50" cy="66" rx="42" ry="12" fill="#ffd166"/><path d="M29 54 C40 58 60 58 71 54 L71 62 C60 66 40 66 29 62Z" fill="#ff8fab"/><path d="M70 58 l10 -6 l2 10z" fill="#ff8fab"/>`,
  '바지': `<path d="M28 16 H72 L80 86 H56 L50 40 L44 86 H20 Z" fill="#7ea8ff"/><path d="M28 16 H72 V26 H28Z" fill="#5d86e0"/><path d="M34 32 q6 6 12 0 M54 32 q6 6 12 0" fill="none" stroke-width="2"/>`,
  '치마': `<path d="M34 22 H66 L86 80 H14 Z" fill="#ff8fab"/><rect x="32" y="15" width="36" height="10" rx="3" fill="#e86f8f"/><path d="M41 27 L31 79 M50 27 V79 M59 27 L69 79" fill="none" stroke="#e86f8f" stroke-width="2"/><circle cx="36" cy="64" r="3" fill="#fff" stroke="none"/><circle cx="62" cy="50" r="3" fill="#fff" stroke="none"/><circle cx="72" cy="70" r="3" fill="#fff" stroke="none"/>`,
  '구두': `<path d="M14 64 C14 50 30 50 40 54 C52 58 62 46 72 48 C86 50 90 64 86 70 H16 C14 70 14 66 14 64Z" fill="#ff7b7b"/><rect x="11" y="69" width="80" height="9" rx="4" fill="${O}"/><path d="M38 54 L52 45" fill="none"/><circle cx="52" cy="45" r="3" fill="#ffd166"/>`,
  '거미': `<path d="M50 3 V36" fill="none" stroke-width="2"/><path d="M38 48 L20 36 L13 44 M37 55 L15 54 L11 63 M39 61 L20 69 L18 79 M44 66 L31 80 L31 89 M62 48 L80 36 L87 44 M63 55 L85 54 L89 63 M61 61 L80 69 L82 79 M56 66 L69 80 L69 89" fill="none"/><circle cx="50" cy="54" r="17" fill="#7a68a6"/><circle cx="43" cy="51" r="5.5" fill="#fff"/><circle cx="57" cy="51" r="5.5" fill="#fff"/>${eye(44, 52, 2.6)}${eye(58, 52, 2.6)}<path d="M45 61 Q50 65 55 61" fill="none" stroke-width="2"/>`,
  '나비': `<path d="M48 30 Q42 16 35 13 M52 30 Q58 16 65 13" fill="none"/><ellipse cx="32" cy="38" rx="21" ry="16" fill="#ff9fb6" transform="rotate(-20 32 38)"/><ellipse cx="68" cy="38" rx="21" ry="16" fill="#ff9fb6" transform="rotate(20 68 38)"/><ellipse cx="35" cy="66" rx="14" ry="12" fill="#ffd166"/><ellipse cx="65" cy="66" rx="14" ry="12" fill="#ffd166"/><circle cx="30" cy="38" r="5" fill="#fff" stroke="none"/><circle cx="70" cy="38" r="5" fill="#fff" stroke="none"/><rect x="46" y="28" width="8" height="50" rx="4" fill="${O}"/>`,
  '오리': `<path d="M20 58 C20 82 78 84 84 62 C86 52 75 50 67 54 C60 57 40 51 20 58Z" fill="#ffe066"/><circle cx="40" cy="38" r="16" fill="#ffe066"/><path d="M25 37 C13 34 11 45 23 45 Z" fill="#ff9f43"/>${eye(37, 34, 3)}<path d="M50 62 C56 54 70 56 72 64 C64 70 54 68 50 62Z" fill="#ffd23f"/>${blush(46, 44, 4, 2.5)}`,
  '하마': `<ellipse cx="24" cy="26" rx="7" ry="6" fill="#b9a7d6"/><ellipse cx="76" cy="26" rx="7" ry="6" fill="#b9a7d6"/><ellipse cx="50" cy="48" rx="34" ry="26" fill="#b9a7d6"/><ellipse cx="50" cy="66" rx="31" ry="18" fill="#cdbde6"/><ellipse cx="40" cy="61" rx="4" ry="3" fill="${O}" stroke="none"/><ellipse cx="60" cy="61" rx="4" ry="3" fill="${O}" stroke="none"/>${eye(36, 40, 4)}${eye(64, 40, 4)}<path d="M38 73 Q50 79 62 73" fill="none"/>${blush(24, 54)}${blush(76, 54)}`,
  '기차': `<circle cx="40" cy="18" r="5" fill="#e8e8f0"/><circle cx="34" cy="10" r="4" fill="#e8e8f0"/><rect x="38" y="25" width="11" height="16" fill="${O}"/><rect x="58" y="22" width="26" height="24" rx="4" fill="#ff7b7b"/><rect x="64" y="28" width="14" height="11" rx="2" fill="#bfe6ff"/><path d="M34 50 L16 60 V76 H34Z" fill="#ffd166"/><rect x="32" y="40" width="54" height="36" rx="6" fill="#ff7b7b"/><path d="M38 52 H80" fill="none" stroke="#ffd166" stroke-width="4"/><circle cx="44" cy="80" r="8" fill="${O}"/><circle cx="44" cy="80" r="3" fill="#fff" stroke="none"/><circle cx="72" cy="80" r="8" fill="${O}"/><circle cx="72" cy="80" r="3" fill="#fff" stroke="none"/>`,
  '피자': `<path d="M50 90 L17 24 C38 13 62 13 83 24 Z" fill="#ffd166"/><path d="M17 24 C38 13 62 13 83 24 L79 33 C60 23 40 23 21 33 Z" fill="#e8a65a"/><circle cx="43" cy="42" r="6.5" fill="#ff6b6b"/><circle cx="59" cy="50" r="6.5" fill="#ff6b6b"/><circle cx="49" cy="66" r="5.5" fill="#ff6b6b"/><path d="M36 54 l3 3 M62 36 l3 2 M56 72 l-2 3" fill="none" stroke="#4f9a4a"/>`,
  '여우': `<path d="M20 16 L30 52 L46 34Z" fill="#ff9f43"/><path d="M80 16 L70 52 L54 34Z" fill="#ff9f43"/><path d="M25 25 L31 44 L39 36Z M75 25 L69 44 L61 36Z" fill="${O}" stroke="none"/><path d="M16 42 C16 28 84 28 84 42 C84 62 62 80 50 86 C38 80 16 62 16 42Z" fill="#ff9f43"/><path d="M17 48 C27 64 40 74 50 86 C46 70 40 60 17 48Z" fill="#fff" stroke-width="2"/><path d="M83 48 C73 64 60 74 50 86 C54 70 60 60 83 48Z" fill="#fff" stroke-width="2"/><circle cx="50" cy="81" r="4.5" fill="${O}" stroke="none"/>${eye(38, 50, 3.5)}${eye(62, 50, 3.5)}`,
  '요요': `<path d="M50 4 V30" fill="none" stroke-width="2"/><circle cx="50" cy="6" r="3" fill="none" stroke-width="2"/><circle cx="50" cy="58" r="30" fill="#7ec4ff"/><circle cx="50" cy="58" r="18" fill="#ff8fab"/><circle cx="50" cy="58" r="6" fill="#fff"/><path d="M72 40 l2 5 l5 1 l-4 3 l1 5 l-4 -3 l-5 3 l1 -5 l-4 -3 l5 -1z" fill="#ffe066" stroke-width="1.5"/>`,
  '휴지': `<path d="M66 44 H84 V84 H70" fill="#fff"/><path d="M24 30 V78 A21 9 0 0 0 66 78 V30" fill="#fff"/><ellipse cx="45" cy="30" rx="21" ry="9" fill="#f4f4f4"/><ellipse cx="45" cy="30" rx="7" ry="3" fill="#cfc4b8"/><path d="M36 52 c2-3 6-3 4 1 l-4 4 l-4-4 c-2-4 2-4 4-1z M52 64 c2-3 6-3 4 1 l-4 4 l-4-4 c-2-4 2-4 4-1z M76 62 c2-3 6-3 4 1 l-4 4 l-4-4 c-2-4 2-4 4-1z" fill="#ff9fb6" stroke="none"/>`,
  '사과': `<path d="M50 30 Q50 20 54 13" fill="none"/><path d="M54 20 C60 10 74 12 74 18 C66 24 58 24 54 20Z" fill="#7cc576"/><path d="M50 30 C38 20 16 26 18 50 C20 74 38 88 50 82 C62 88 80 74 82 50 C84 26 62 20 50 30Z" fill="#ff5c5c"/><ellipse cx="33" cy="46" rx="5" ry="9" fill="#ffb3b3" stroke="none"/>`,
  '과자': `<circle cx="50" cy="52" r="34" fill="#e8b46a"/><circle cx="50" cy="52" r="28" fill="none" stroke="#d29a4f" stroke-width="2" stroke-dasharray="3 6"/><circle cx="38" cy="40" r="4.5" fill="#6b4226" stroke="none"/><circle cx="60" cy="38" r="4" fill="#6b4226" stroke="none"/><circle cx="50" cy="54" r="4.5" fill="#6b4226" stroke="none"/><circle cx="34" cy="62" r="4" fill="#6b4226" stroke="none"/><circle cx="64" cy="62" r="4.5" fill="#6b4226" stroke="none"/><circle cx="52" cy="72" r="3.5" fill="#6b4226" stroke="none"/>`,
  '교과서': `<rect x="24" y="14" width="56" height="74" rx="4" fill="#fff"/><rect x="20" y="10" width="56" height="74" rx="4" fill="#7ea8ff"/><rect x="20" y="10" width="11" height="74" rx="3" fill="#5d86e0"/><rect x="38" y="24" width="30" height="18" rx="3" fill="#fff"/><path d="M43 30 H63 M43 36 H57" fill="none" stroke-width="2"/><path d="M52 58 l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1z" fill="#ffe066" stroke-width="2"/>`,
  '쿼카': `<circle cx="27" cy="27" r="11" fill="#b98a5e"/><circle cx="73" cy="27" r="11" fill="#b98a5e"/><circle cx="27" cy="27" r="5" fill="#ffb3c6" stroke="none"/><circle cx="73" cy="27" r="5" fill="#ffb3c6" stroke="none"/><ellipse cx="50" cy="54" rx="34" ry="30" fill="#c99a6b"/><ellipse cx="50" cy="67" rx="16" ry="12" fill="#ecd2b0"/><ellipse cx="50" cy="60" rx="5" ry="3.5" fill="${O}" stroke="none"/><path d="M41 68 Q50 77 59 68" fill="none"/>${eye(37, 48)}${eye(63, 48)}${blush(28, 62)}${blush(72, 62)}`,
  '타워': `<path d="M50 8 V1 L61 4 L50 7" fill="#ffd166" stroke-width="2"/><rect x="33" y="34" width="34" height="56" fill="#efe4d4"/><path d="M27 37 L50 8 L73 37Z" fill="#ff8fab"/><rect x="44" y="45" width="12" height="15" rx="6" fill="#bfe6ff"/><path d="M42 90 V77 A8 8 0 0 1 58 77 V90Z" fill="#b07a4a"/><path d="M33 66 H43 M57 66 H67 M38 72 V66 M62 72 V66" fill="none" stroke="#c9b79c" stroke-width="2"/>`,
  '샤워기': `<path d="M22 92 V34 Q22 18 38 18 H50" fill="none" stroke="${O}" stroke-width="10"/><path d="M22 92 V34 Q22 18 38 18 H50" fill="none" stroke="#cdd6df" stroke-width="5"/><g transform="rotate(35 62 30)"><rect x="46" y="20" width="32" height="16" rx="8" fill="#cdd6df"/></g><path d="M58 50 q-2 5 0 7 q3 -2 0 -7z M68 52 q-2 5 0 7 q3 -2 0 -7z M76 46 q-2 5 0 7 q3 -2 0 -7z M62 64 q-2 5 0 7 q3 -2 0 -7z M74 62 q-2 5 0 7 q3 -2 0 -7z M84 56 q-2 5 0 7 q3 -2 0 -7z" fill="#7ec4ff" stroke="#4a9ad8" stroke-width="1.5"/>`,
  '외투': `<path d="M34 14 L22 22 L13 60 L24 63 L29 40 L29 89 H71 V40 L76 63 L87 60 L78 22 L66 14 L50 30Z" fill="#c9824a"/><path d="M34 14 L50 30 L43 37 L30 22Z M66 14 L50 30 L57 37 L70 22Z" fill="#a8683a"/><path d="M50 30 V89" fill="none"/><circle cx="56" cy="46" r="3" fill="${O}" stroke="none"/><circle cx="56" cy="60" r="3" fill="${O}" stroke="none"/><circle cx="56" cy="74" r="3" fill="${O}" stroke="none"/><path d="M34 66 H44 V74 H34Z" fill="none" stroke-width="2"/>`,
  '회오리': `<path d="M14 20 C40 30 60 30 86 20 L66 50 L56 72 L50 90 L44 74 L36 52 Z" fill="#b8c4d6"/><ellipse cx="50" cy="20" rx="36" ry="8" fill="#d3dcea"/><path d="M24 33 Q50 43 76 31 M31 47 Q50 55 69 45 M38 61 Q50 67 61 59 M44 75 Q50 79 55 73" fill="none" stroke="#7d8ba3" stroke-width="2.5"/><path d="M84 40 q6 -2 6 4 q-6 2 -6 -4z M12 50 q5 -3 7 2 q-5 3 -7 -2z" fill="#7cc576" stroke-width="1.5"/>`,
  '귀': `<path d="M38 15 C62 5 83 25 77 50 C73 66 61 66 57 78 C53 90 36 90 32 78 C30 70 40 68 42 60 C29 55 23 29 38 15Z" fill="#ffd2b0"/><path d="M45 26 C61 22 69 36 63 48 C59 54 51 52 51 44 C51 38 57 38 57 44" fill="none" stroke="#d99a72"/>`,
  '쥐': `<path d="M78 66 C97 70 95 88 80 85" fill="none" stroke="#ff9fb6" stroke-width="4"/><circle cx="31" cy="30" r="14" fill="#c4c4cf"/><circle cx="69" cy="30" r="14" fill="#c4c4cf"/><circle cx="31" cy="30" r="7" fill="#ffb3c6" stroke="none"/><circle cx="69" cy="30" r="7" fill="#ffb3c6" stroke="none"/><ellipse cx="50" cy="60" rx="30" ry="24" fill="#c4c4cf"/>${eye(40, 55)}${eye(60, 55)}<circle cx="50" cy="65" r="4" fill="#ff8fab"/><path d="M40 67 L24 64 M40 70 L26 74 M60 67 L76 64 M60 70 L74 74" fill="none" stroke-width="1.5"/>`,
  '가위': `<path d="M50 54 L80 10 L85 15 L57 58Z" fill="#dfe6ee"/><path d="M50 54 L20 10 L15 15 L43 58Z" fill="#dfe6ee"/><path d="M45 60 L40 64 M55 60 L60 64" fill="none" stroke-width="4"/><circle cx="34" cy="74" r="14" fill="#ff7b7b"/><circle cx="34" cy="74" r="6.5" fill="#fff"/><circle cx="66" cy="74" r="14" fill="#ff7b7b"/><circle cx="66" cy="74" r="6.5" fill="#fff"/><circle cx="50" cy="55" r="3.5" fill="${O}"/>`,
  '바위': `<path d="M10 82 L19 52 L36 35 L58 29 L77 41 L89 64 L88 82Z" fill="#a9a9b3"/><path d="M36 35 L44 58 L19 52 M44 58 L58 29 M44 58 L60 82 M60 82 L77 41" fill="none" stroke="#85858f" stroke-width="2"/><path d="M14 80 q6 -8 12 0 M70 80 q5 -6 10 0" fill="#7cc576" stroke-width="2"/>`,
  '의자': `<rect x="28" y="10" width="44" height="42" rx="6" fill="#d9965a"/><path d="M40 16 V46 M50 16 V46 M60 16 V46" fill="none" stroke="#b5743e" stroke-width="2.5"/><rect x="26" y="58" width="7" height="32" rx="2" fill="#a8683a"/><rect x="67" y="58" width="7" height="32" rx="2" fill="#a8683a"/><path d="M20 52 H80 L76 62 H24Z" fill="#c9824a"/><path d="M30 50 C40 44 60 44 70 50Z" fill="#ff9fb6" stroke-width="2"/>`,
  '돼지': `<path d="M24 32 L21 12 L41 23Z" fill="#ffb3c6"/><path d="M76 32 L79 12 L59 23Z" fill="#ffb3c6"/><ellipse cx="50" cy="53" rx="35" ry="30" fill="#ffc2d1"/><ellipse cx="50" cy="63" rx="15" ry="10.5" fill="#ff9fb6"/><ellipse cx="45" cy="63" rx="2.6" ry="3.6" fill="${O}" stroke="none"/><ellipse cx="55" cy="63" rx="2.6" ry="3.6" fill="${O}" stroke="none"/>${eye(35, 45)}${eye(65, 45)}${blush(25, 60)}${blush(75, 60)}`,
  '스웨터': `<path d="M34 14 L14 26 L8 58 L22 61 L26 42 V87 H74 V42 L78 61 L92 58 L86 26 L66 14 Q50 27 34 14Z" fill="#7cc576"/><path d="M27 56 H73 M27 68 H73" fill="none" stroke="#fff" stroke-width="5"/><path d="M36 16 Q50 29 64 16" fill="none" stroke="#4f9a4a" stroke-width="4"/><path d="M50 46 c2-4 8-4 6 1 l-6 6 l-6 -6 c-2-5 4-5 6-1z" fill="#ff8fab" stroke-width="1.5"/>`,
  '왜가리': `<path d="M46 68 L42 95 M57 68 L59 95" fill="none" stroke="#e0a040" stroke-width="3"/><path d="M71 50 L91 58 L72 61Z" fill="#9fb3c8"/><path d="M30 50 C30 36 60 34 72 46 C80 55 74 71 56 71 C44 71 30 65 30 50Z" fill="#c9d6e3"/><path d="M32 48 C22 36 24 22 32 16 L39 18 C33 26 33 36 41 46Z" fill="#c9d6e3"/><path d="M30 13 L7 18 L30 20Z" fill="#ffd166"/><ellipse cx="36" cy="16" rx="8" ry="6" fill="#c9d6e3"/><circle cx="37" cy="14.5" r="1.8" fill="${O}" stroke="none"/><path d="M42 12 L53 7" fill="none" stroke-width="2"/><path d="M44 49 C52 44 66 46 70 56 C60 62 48 58 44 49Z" fill="#9fb3c8"/>`,
};

export function itemSVG(word) {
  const inner = ITEMS[word] || ITEMS2[word];
  if (!inner) return wrap(`<rect x="15" y="15" width="70" height="70" rx="14" fill="#eee"/><text x="50" y="62" font-size="36" text-anchor="middle" stroke="none" fill="${O}">?</text>`);
  return wrap(inner);
}
export const hasItemArt = (w) => w in ITEMS || w in ITEMS2;

// ───────────────────────── 꾸미기 장식 ─────────────────────────
export const DECOR = {
  fountain: { name: '분수', price: 15, svg: `<ellipse cx="50" cy="80" rx="40" ry="12" fill="#bfe6ff"/><path d="M10 80 V72 A40 12 0 0 1 90 72 V80" fill="#dfe6ee"/><ellipse cx="50" cy="72" rx="40" ry="12" fill="#7ec4ff"/><rect x="45" y="40" width="10" height="32" fill="#dfe6ee"/><ellipse cx="50" cy="40" rx="18" ry="6" fill="#dfe6ee"/><path d="M50 36 C50 18 30 20 26 40 M50 36 C50 18 70 20 74 40 M50 36 V14" fill="none" stroke="#7ec4ff" stroke-width="3"/>` },
  lamp: { name: '가로등', price: 8, svg: `<circle cx="50" cy="22" r="16" fill="#fff4b0" stroke="none" opacity=".6"/><rect x="46" y="28" width="8" height="58" fill="#4f7a6b"/><rect x="36" y="84" width="28" height="8" rx="3" fill="#4f7a6b"/><path d="M38 30 L42 12 H58 L62 30Z" fill="#ffe27a"/><path d="M36 12 H64 L58 6 H42Z" fill="#4f7a6b"/>` },
  flowers: { name: '꽃밭', price: 10, svg: `<ellipse cx="50" cy="78" rx="42" ry="14" fill="#a8683a"/><path d="M22 74 V54 M38 72 V46 M54 72 V50 M70 74 V54" fill="none" stroke="#4f9a4a"/><circle cx="22" cy="50" r="8" fill="#ff8fab"/><circle cx="38" cy="42" r="8" fill="#ffe066"/><circle cx="54" cy="46" r="8" fill="#b69cff"/><circle cx="70" cy="50" r="8" fill="#ff9f43"/><circle cx="22" cy="50" r="3" fill="#fff" stroke="none"/><circle cx="38" cy="42" r="3" fill="#fff" stroke="none"/><circle cx="54" cy="46" r="3" fill="#fff" stroke="none"/><circle cx="70" cy="50" r="3" fill="#fff" stroke="none"/>` },
  bench: { name: '벤치', price: 10, svg: `<rect x="14" y="40" width="72" height="10" rx="3" fill="#d9965a"/><rect x="14" y="54" width="72" height="10" rx="3" fill="#d9965a"/><rect x="10" y="66" width="80" height="10" rx="3" fill="#c9824a"/><rect x="18" y="76" width="7" height="16" fill="#5a4032"/><rect x="75" y="76" width="7" height="16" fill="#5a4032"/>` },
};
export const decorSVG = (k) => wrap(DECOR[k]?.svg || '');

// ───────────────────────── 꼬리 (고양이 친구) ─────────────────────────
const HATS = {
  ribbon: { name: '리본', price: 10, svg: `<path d="M78 24 L64 14 L66 34Z" fill="#ff6fa0"/><path d="M78 24 L92 14 L90 34Z" fill="#ff6fa0"/><circle cx="78" cy="24" r="5" fill="#ff3d84"/>` },
  crown: { name: '왕관', price: 20, svg: `<path d="M42 30 L40 10 L50 20 L60 6 L70 20 L80 10 L78 30Z" fill="#ffd34d"/><circle cx="60" cy="22" r="3" fill="#ff6b6b" stroke="none"/><circle cx="48" cy="24" r="2.5" fill="#7ec4ff" stroke="none"/><circle cx="72" cy="24" r="2.5" fill="#7ec4ff" stroke="none"/>` },
  wizard: { name: '마법사 모자', price: 18, svg: `<path d="M36 32 L72 -6 L84 32Z" fill="#8f6ee8"/><ellipse cx="60" cy="32" rx="30" ry="6" fill="#7a58d6"/><path d="M62 10 l2 4 l4 1 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -1z" fill="#ffe066" stroke-width="1.2"/>` },
  flower: { name: '꽃 왕관', price: 15, svg: `<path d="M34 32 Q60 18 86 32" fill="none" stroke="#6bb865" stroke-width="4"/><circle cx="38" cy="29" r="6" fill="#ff8fab"/><circle cx="50" cy="24" r="6" fill="#ffe066"/><circle cx="62" cy="22" r="6" fill="#b69cff"/><circle cx="74" cy="24" r="6" fill="#ff9f43"/><circle cx="84" cy="29" r="6" fill="#ff8fab"/>` },
};
export const HAT_LIST = HATS;

export function catSVG({ hat = null, mood = 'happy' } = {}) {
  const eyes = mood === 'sleepy'
    ? `<path d="M41 58 q6 5 12 0 M67 58 q6 5 12 0" fill="none"/>`
    : `<ellipse cx="47" cy="57" rx="5" ry="6.5" fill="${O}" stroke="none"/><ellipse cx="73" cy="57" rx="5" ry="6.5" fill="${O}" stroke="none"/><circle cx="45" cy="54.5" r="2" fill="#fff" stroke="none"/><circle cx="71" cy="54.5" r="2" fill="#fff" stroke="none"/>`;
  const mouth = mood === 'wow'
    ? `<ellipse cx="60" cy="74" rx="5" ry="6" fill="#d9536f"/>`
    : `<path d="M53 70 Q56.5 75 60 70 Q63.5 75 67 70" fill="none" stroke-width="2.5"/>`;
  return wrap(`
    <path d="M84 104 C116 106 120 74 106 68 C97 65 93 74 101 78" fill="none" stroke="${O}" stroke-width="12"/>
    <path d="M84 104 C116 106 120 74 106 68 C97 65 93 74 101 78" fill="none" stroke="#ffbe6b" stroke-width="7"/>
    <ellipse cx="60" cy="96" rx="27" ry="20" fill="#ffcf8a"/>
    <ellipse cx="60" cy="100" rx="13" ry="11" fill="#fff3df" stroke="none"/>
    <path d="M30 44 L28 14 L52 32 Z" fill="#ffcf8a"/><path d="M90 44 L92 14 L68 32 Z" fill="#ffcf8a"/>
    <path d="M33 36 L32 22 L44 31Z M87 36 L88 22 L76 31Z" fill="#ffb3c6" stroke="none"/>
    <ellipse cx="60" cy="58" rx="34" ry="28" fill="#ffcf8a"/>
    <path d="M52 33 q2 6 0 10 M60 31 q2 7 0 12 M68 33 q2 6 0 10" fill="none" stroke="#f0a050" stroke-width="3"/>
    ${eyes}
    ${blush(38, 68, 6, 3.5)}${blush(82, 68, 6, 3.5)}
    <path d="M57 64 L63 64 L60 67.5Z" fill="#ff8fab" stroke-width="1.5"/>
    ${mouth}
    <path d="M30 64 L14 61 M30 69 L15 71 M90 64 L106 61 M90 69 L105 71" fill="none" stroke-width="1.5"/>
    <ellipse cx="48" cy="114" rx="8" ry="5" fill="#ffcf8a"/><ellipse cx="72" cy="114" rx="8" ry="5" fill="#ffcf8a"/>
    ${hat && HATS[hat] ? HATS[hat].svg : ''}
  `, '0 -8 120 128');
}

// ───────────────────────── 좀비괴물 ─────────────────────────
export function zombieSVG(mood = 'evil') {
  const mouth = mood === 'sad'
    ? `<path d="M48 82 Q60 74 72 82" fill="none" stroke-width="3.5"/>`
    : mood === 'eat'
      ? `<ellipse cx="60" cy="80" rx="18" ry="13" fill="#5a2a3a"/><rect x="52" y="67" width="7" height="8" rx="1.5" fill="#fff"/><ellipse cx="62" cy="86" rx="8" ry="4" fill="#ff7b9b" stroke="none"/>`
      : `<path d="M44 76 Q60 90 76 76 Q60 82 44 76Z" fill="#5a2a3a"/><rect x="54" y="77" width="6" height="6" rx="1" fill="#fff" stroke-width="1.5"/>`;
  const tear = mood === 'sad' ? `<path d="M41 66 q-3 6 0 8 q3 -2 0 -8z" fill="#7ec4ff" stroke-width="1.5"/>` : '';
  return wrap(`
    <path d="M92 80 L112 72 Q116 76 112 80 L94 90Z" fill="#9ad97a"/>
    <path d="M24 46 C24 20 96 20 96 46 L98 96 Q90 108 80 100 Q72 110 62 102 Q52 110 44 100 Q34 108 26 98 Z" fill="#9ad97a"/>
    <path d="M30 52 L8 60 Q4 56 8 52 L28 44Z" fill="#9ad97a"/>
    <circle cx="80" cy="34" r="4" fill="#b69cff" stroke="none" opacity=".7"/><circle cx="36" cy="88" r="5" fill="#b69cff" stroke="none" opacity=".6"/><circle cx="86" cy="62" r="3" fill="#b69cff" stroke="none" opacity=".7"/>
    <path d="M34 36 L58 30" fill="none" stroke-width="2.5"/><path d="M38 31 l2 8 M45 29 l2 8 M52 28 l2 8" fill="none" stroke-width="2"/>
    <rect x="66" y="22" width="22" height="9" rx="3" fill="#f2e0c2" transform="rotate(18 77 26)"/>
    <circle cx="46" cy="56" r="11" fill="#fff"/><circle cx="48" cy="58" r="4.5" fill="${O}" stroke="none"/>
    <circle cx="74" cy="58" r="7.5" fill="#fff"/><circle cx="74" cy="60" r="3.2" fill="${O}" stroke="none"/>
    <path d="M65 52 L83 54" fill="none" stroke-width="3.5"/>
    ${tear}
    ${mouth}
    ${blush(34, 72, 5, 3)}${blush(86, 72, 5, 3)}
  `, '0 0 120 120');
}

// ───────────────────────── 주인공 아바타 ─────────────────────────
export const AVATAR_OPTIONS = {
  skin: ['#ffe2cc', '#f6c9a0', '#dca578'],
  hair: ['bob', 'pigtails', 'long'],
  hairColor: ['#3b2a20', '#7a4a2a', '#d9a05b', '#e86fa0'],
  outfit: ['#ff8fab', '#7ec4ff', '#ffd166', '#9be29b', '#b69cff'],
};

export function avatarSVG(a) {
  a = a || {}; // 저장 기록에 아바타가 비어 있어도 기본 모습으로
  const skin = a.skin || AVATAR_OPTIONS.skin[0];
  const hc = a.hairColor || AVATAR_OPTIONS.hairColor[0];
  const oc = a.outfit || AVATAR_OPTIONS.outfit[0];
  const style = a.hair || 'bob';
  const back = style === 'long'
    ? `<path d="M28 50 C26 90 30 108 40 112 H80 C90 108 94 90 92 50 Z" fill="${hc}"/>`
    : style === 'pigtails'
      ? `<path d="M30 46 C14 50 10 74 22 84 C26 70 32 62 34 54Z" fill="${hc}"/><path d="M90 46 C106 50 110 74 98 84 C94 70 88 62 86 54Z" fill="${hc}"/><circle cx="31" cy="46" r="4" fill="#ff6fa0"/><circle cx="89" cy="46" r="4" fill="#ff6fa0"/>`
      : `<path d="M28 50 C26 76 32 84 40 84 H80 C88 84 94 76 92 50 Z" fill="${hc}"/>`;
  return wrap(`
    ${back}
    <path d="M42 96 L36 132 H84 L78 96 Z" fill="${oc}"/>
    <path d="M44 100 L30 118 M76 100 L90 118" fill="none" stroke="${skin}" stroke-width="7"/>
    <rect x="53" y="82" width="14" height="14" fill="${skin}"/>
    <circle cx="60" cy="56" r="30" fill="${skin}"/>
    <path d="M28 60 C22 10 98 10 92 60 C86 46 76 40 64 40 C60 47 50 49 42 45 C36 48 31 53 28 60Z" fill="${hc}"/>
    ${eye(49, 60, 4)}${eye(71, 60, 4)}
    ${blush(41, 70)}${blush(79, 70)}
    <path d="M54 72 Q60 78 66 72" fill="none" stroke-width="2.5"/>
    <rect x="40" y="132" width="14" height="6" rx="3" fill="${O}"/><rect x="66" y="132" width="14" height="6" rx="3" fill="${O}"/>
  `, '0 10 120 132');
}

// ───────────────────────── 마을 주민 ─────────────────────────
export const VILLAGERS = {
  bear: { name: '곰 아저씨', svg: () => wrap(`<circle cx="30" cy="30" r="13" fill="#a8683a"/><circle cx="90" cy="30" r="13" fill="#a8683a"/><circle cx="30" cy="30" r="6" fill="#e0a87a" stroke="none"/><circle cx="90" cy="30" r="6" fill="#e0a87a" stroke="none"/><path d="M26 92 Q60 70 94 92 L98 120 H22Z" fill="#a8683a"/><path d="M42 90 H78 V120 H42Z" fill="#7cc576"/><ellipse cx="60" cy="58" rx="36" ry="32" fill="#b97a48"/><ellipse cx="60" cy="70" rx="16" ry="12" fill="#e8c8a0"/><ellipse cx="60" cy="64" rx="6" ry="4" fill="${O}" stroke="none"/><path d="M54 72 Q60 77 66 72" fill="none" stroke-width="2.5"/>${eye(46, 52)}${eye(74, 52)}${blush(36, 66)}${blush(84, 66)}`, '0 0 120 120') },
  rabbit: { name: '토끼 할머니', svg: () => wrap(`<ellipse cx="44" cy="22" rx="8" ry="22" fill="#fff" transform="rotate(-10 44 22)"/><ellipse cx="76" cy="22" rx="8" ry="22" fill="#fff" transform="rotate(10 76 22)"/><ellipse cx="44" cy="24" rx="3.5" ry="14" fill="#ffc2d1" stroke="none" transform="rotate(-10 44 24)"/><ellipse cx="76" cy="24" rx="3.5" ry="14" fill="#ffc2d1" stroke="none" transform="rotate(10 76 24)"/><path d="M26 94 Q60 74 94 94 L98 120 H22Z" fill="#b69cff"/><path d="M40 88 L60 104 L80 88" fill="none" stroke="#fff" stroke-width="3"/><ellipse cx="60" cy="62" rx="32" ry="28" fill="#fff"/><circle cx="48" cy="58" r="8" fill="none" stroke-width="2.5"/><circle cx="72" cy="58" r="8" fill="none" stroke-width="2.5"/><path d="M56 58 H64" fill="none" stroke-width="2.5"/>${eye(48, 58, 3)}${eye(72, 58, 3)}<path d="M57 70 L63 70 L60 73Z" fill="#ff8fab" stroke-width="1.5"/><path d="M55 76 Q60 80 65 76" fill="none" stroke-width="2"/>${blush(38, 72)}${blush(82, 72)}`, '0 0 120 120') },
  squirrel: { name: '다람쥐 토리', svg: () => wrap(`<path d="M86 110 C116 100 118 40 96 30 C80 24 74 44 86 52 C96 60 90 86 80 96Z" fill="#d9864a"/><path d="M38 36 L34 18 L50 30Z M82 36 L86 18 L70 30Z" fill="#c9733a"/><path d="M32 96 Q60 80 88 96 L90 120 H30Z" fill="#c9733a"/><ellipse cx="60" cy="96" rx="14" ry="16" fill="#f5dcc0" stroke="none"/><ellipse cx="60" cy="58" rx="30" ry="28" fill="#c9733a"/><ellipse cx="44" cy="70" rx="10" ry="8" fill="#f5dcc0" stroke="none"/><ellipse cx="76" cy="70" rx="10" ry="8" fill="#f5dcc0" stroke="none"/>${eye(48, 54, 4)}${eye(72, 54, 4)}<ellipse cx="60" cy="66" rx="4" ry="3" fill="${O}" stroke="none"/><path d="M56 72 Q60 76 64 72" fill="none" stroke-width="2"/><rect x="56" y="74" width="8" height="6" rx="1" fill="#fff" stroke-width="1.5"/>`, '0 0 120 120') },
  owl: { name: '부엉이 촌장님', svg: () => wrap(`<path d="M30 30 L26 8 L46 24Z M90 30 L94 8 L74 24Z" fill="#8a6a4a"/><ellipse cx="60" cy="68" rx="38" ry="46" fill="#a07850"/><ellipse cx="60" cy="86" rx="24" ry="26" fill="#e8d2b0" stroke="none"/><path d="M48 80 q4 4 8 0 M60 88 q4 4 8 0 M50 96 q4 4 8 0" fill="none" stroke="#c9a77c" stroke-width="2"/><circle cx="44" cy="50" r="15" fill="#fff"/><circle cx="76" cy="50" r="15" fill="#fff"/><circle cx="44" cy="50" r="15" fill="none" stroke="#ffd34d" stroke-width="3"/><circle cx="76" cy="50" r="15" fill="none" stroke="#ffd34d" stroke-width="3"/>${eye(44, 51, 6)}${eye(76, 51, 6)}<path d="M54 62 L66 62 L60 72Z" fill="#ff9f43"/><path d="M34 22 H86 L80 14 H40Z" fill="${O}"/><rect x="44" y="4" width="32" height="12" fill="${O}"/>`, '0 0 120 120') },
};

// ───────────────────────── 도구 ─────────────────────────
Object.assign(VILLAGERS, VILLAGERS2);

const METAL = ['#c9a06a', '#cfd8e3', '#ffd34d'];
export function shovelSVG(level = 0) {
  return wrap(`<rect x="46" y="6" width="8" height="54" rx="3" fill="#b07a4a"/><rect x="36" y="4" width="28" height="9" rx="4" fill="#b07a4a"/><path d="M30 58 H70 V74 C70 90 50 96 50 96 C50 96 30 90 30 74Z" fill="${METAL[level]}"/>${level === 2 ? `<path d="M76 30 l3 6 l6 1 l-4 4 l1 6 l-6 -3 l-6 3 l1 -6 l-4 -4 l6 -1z" fill="#fff6b0" stroke-width="1.5"/>` : ''}`);
}
export function wandSVG(level = 0) {
  const tip = ['#7ec4ff', '#ff8fab', '#ffd34d'][level];
  return wrap(`<rect x="46" y="40" width="9" height="56" rx="4" fill="#8f6ee8" transform="rotate(20 50 68)"/><path d="M58 8 l6 12 l13 2 l-9 9 l2 13 l-12 -6 l-12 6 l2 -13 l-9 -9 l13 -2z" fill="${tip}"/>${level >= 1 ? `<circle cx="84" cy="14" r="4" fill="#fff6b0"/><circle cx="20" cy="30" r="3" fill="#fff6b0"/>` : ''}`);
}
export function shoeSVG(level = 0) {
  const c = ['#7ec4ff', '#ff8fab', '#ffd34d'][level];
  return wrap(`<path d="M12 70 C12 52 30 50 38 40 L52 44 C56 56 72 58 86 62 C94 64 94 76 88 78 H14 C12 78 12 74 12 70Z" fill="${c}"/><rect x="10" y="76" width="82" height="9" rx="4" fill="#fff"/><path d="M40 46 L48 54 M46 44 L54 52" fill="none" stroke-width="2.5"/>${level >= 1 ? `<path d="M2 60 H10 M0 68 H8" fill="none" stroke-width="2.5"/>` : ''}`);
}

export const starSVG = (fill = '#ffd34d') => wrap(`<path d="M50 6 l13 27 l29 4 l-21 20 l5 29 l-26 -14 l-26 14 l5 -29 l-21 -20 l29 -4z" fill="${fill}"/>`);
export const speakerSVG = () => wrap(`<path d="M18 38 H34 L54 20 V80 L34 62 H18Z" fill="#fff"/><path d="M66 34 Q76 50 66 66 M76 24 Q92 50 76 76" fill="none" stroke-width="5"/>`);
export const gearSVG = () => wrap(`<path d="M44 8 h12 l2 12 l9 4 l10 -7 l8 8 l-7 10 l4 9 l12 2 v12 l-12 2 l-4 9 l7 10 l-8 8 l-10 -7 l-9 4 l-2 12 h-12 l-2 -12 l-9 -4 l-10 7 l-8 -8 l7 -10 l-4 -9 l-12 -2 v-12 l12 -2 l4 -9 l-7 -10 l8 -8 l10 7 l9 -4z" fill="#dfe6ee"/><circle cx="50" cy="50" r="13" fill="#fff"/>`);
export const lockSVG = () => wrap(`<path d="M32 44 V32 A18 18 0 0 1 68 32 V44" fill="none" stroke-width="7"/><rect x="24" y="44" width="52" height="42" rx="8" fill="#ffd34d"/><circle cx="50" cy="62" r="6" fill="${O}" stroke="none"/><rect x="47" y="64" width="6" height="12" fill="${O}" stroke="none"/>`);
export const wormSVG = () => wrap(`<path d="M14 70 C24 50 36 50 44 66 C52 82 64 82 72 62 C76 52 84 50 88 56" fill="none" stroke="${O}" stroke-width="15"/><path d="M14 70 C24 50 36 50 44 66 C52 82 64 82 72 62 C76 52 84 50 88 56" fill="none" stroke="#ff9fb6" stroke-width="10"/><circle cx="86" cy="53" r="2.5" fill="${O}" stroke="none"/>`);
export const boneSVG = () => wrap(`<path d="M28 42 A9 9 0 1 1 34 30 L66 30 A9 9 0 1 1 72 42 A9 9 0 1 1 66 54 L34 54 A9 9 0 1 1 28 42Z" fill="#fffaf0" transform="rotate(-15 50 42) translate(0 10)"/>`);
export const boardSVG = () => wrap(`<rect x="44" y="60" width="12" height="34" fill="#a8683a"/><rect x="10" y="12" width="80" height="54" rx="6" fill="#d9965a"/><rect x="18" y="20" width="28" height="20" rx="2" fill="#fff"/><rect x="54" y="22" width="28" height="22" rx="2" fill="#fff6d6"/><rect x="22" y="44" width="26" height="16" rx="2" fill="#ffe0ea"/><circle cx="32" cy="20" r="3" fill="#ff6b6b"/><circle cx="68" cy="22" r="3" fill="#7ec4ff"/>`);
export const bookSVG = () => wrap(`<path d="M50 24 C40 16 22 16 12 20 V84 C22 80 40 80 50 88 C60 80 78 80 88 84 V20 C78 16 60 16 50 24Z" fill="#fff"/><path d="M50 24 V88" fill="none"/><path d="M20 34 H42 M20 46 H42 M58 34 H80 M58 46 H80 M20 58 H38" fill="none" stroke="#c9b79c" stroke-width="3"/><path d="M12 20 V84 C22 80 40 80 50 88" fill="none" stroke="#ff8fab" stroke-width="0"/>`);
export const shopSVG = () => wrap(`<rect x="16" y="40" width="68" height="48" rx="4" fill="#fff4dd"/><path d="M10 40 L18 18 H82 L90 40Z" fill="#ff8fab"/><path d="M26 18 L22 40 M42 18 L40 40 M58 18 L60 40 M74 18 L78 40" fill="none" stroke="#fff" stroke-width="4"/><rect x="40" y="58" width="20" height="30" rx="3" fill="#b07a4a"/><path d="M10 40 Q18 48 26 40 Q34 48 42 40 Q50 48 58 40 Q66 48 74 40 Q82 48 90 40" fill="#ff8fab"/>`);
export const brushSVG = () => wrap(`<path d="M62 14 L86 38 L52 72 L28 48Z" fill="#7ec4ff"/><path d="M28 48 L52 72 C46 84 30 92 14 88 C10 72 18 56 28 48Z" fill="#ff8fab"/><path d="M62 14 L74 2 L98 26 L86 38" fill="#b07a4a"/>`);

// ───────────────────────── 배경 ─────────────────────────
export function villageBG(restore = 0, opts = {}) {
  const flowers = restore >= 25;
  const rainbow = restore >= 75;
  const done = restore >= 100 && opts.banner !== false;
  const fl = (x, y, c) => `<g><path d="M${x} ${y} v14" stroke="#4f9a4a" stroke-width="3"/><circle cx="${x}" cy="${y}" r="7" fill="${c}" stroke="${O}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="2.5" fill="#fff"/></g>`;
  return `<svg viewBox="0 0 1180 820" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8ff"/><stop offset="1" stop-color="#e6f6ff"/></linearGradient></defs>
    <rect width="1180" height="820" fill="url(#vsky)"/>
    ${rainbow ? `<g fill="none" stroke-width="22" opacity=".75"><path d="M120 470 A470 380 0 0 1 1060 470" stroke="#ff8fab"/><path d="M142 470 A448 358 0 0 1 1038 470" stroke="#ffd166"/><path d="M164 470 A426 336 0 0 1 1016 470" stroke="#9be29b"/><path d="M186 470 A404 314 0 0 1 994 470" stroke="#7ec4ff"/><path d="M208 470 A382 292 0 0 1 972 470" stroke="#b69cff"/></g>` : ''}
    <circle cx="1060" cy="100" r="54" fill="#ffe27a" stroke="#f5c542" stroke-width="5"/>
    <g fill="#fff" opacity=".95"><ellipse cx="200" cy="110" rx="70" ry="28"/><ellipse cx="250" cy="96" rx="46" ry="30"/><ellipse cx="640" cy="80" rx="80" ry="26"/><ellipse cx="690" cy="66" rx="44" ry="28"/></g>
    <path d="M0 400 C160 320 300 360 420 380 C560 300 760 330 900 370 C1000 330 1100 340 1180 360 V820 H0Z" fill="#b7e4a0"/>
    ${opts.castle ? castle(303, 442, 0.55) : ''}
    <path d="M0 450 C200 420 400 440 600 430 C800 420 1000 440 1180 430 V820 H0Z" fill="#9fd88a"/>
    <path d="M560 820 C540 700 640 640 600 540 C580 490 520 470 470 455 M600 540 C680 520 800 500 900 470" fill="none" stroke="#f1d9a8" stroke-width="46" stroke-linecap="round"/>
    <!-- 꼬리네 집 -->
    <g stroke="${O}" stroke-width="4" stroke-linejoin="round">
      <rect x="70" y="270" width="210" height="170" rx="8" fill="#fff1d6"/>
      <path d="M50 280 L175 180 L300 280Z" fill="#ff8fa3"/>
      <rect x="235" y="190" width="26" height="50" fill="#c9824a"/>
      <rect x="150" y="350" width="52" height="90" rx="20" fill="#c9824a"/>
      <circle cx="191" cy="398" r="4" fill="#ffd34d"/>
      <rect x="92" y="310" width="44" height="40" rx="6" fill="#bfe6ff"/>
      <rect x="218" y="310" width="44" height="40" rx="6" fill="#bfe6ff"/>
      <path d="M114 310 V350 M92 330 H136 M240 310 V350 M218 330 H262" stroke-width="3"/>
    </g>
    <text x="175" y="255" font-size="26" text-anchor="middle" fill="#fff" stroke="${O}" stroke-width="6" paint-order="stroke" font-family="Jua">꼬리네 집</text>
    <!-- 곰 아저씨네 가게 -->
    <g stroke="${O}" stroke-width="4" stroke-linejoin="round">
      <rect x="430" y="250" width="240" height="190" rx="8" fill="#fff6e6"/>
      <path d="M415 260 L432 210 H668 L685 260Z" fill="#7cc576"/>
      <path d="M468 210 L460 260 M510 210 L506 260 M550 210 L550 260 M590 210 L594 260 M630 210 L640 260" stroke="#fff" stroke-width="8"/>
      <path d="M415 260 Q438 280 461 260 Q484 280 507 260 Q530 280 553 260 Q576 280 599 260 Q622 280 645 260 Q665 278 685 260" fill="#7cc576"/>
      <rect x="455" y="300" width="80" height="70" rx="6" fill="#bfe6ff"/>
      <rect x="575" y="320" width="70" height="120" rx="8" fill="#c9824a"/>
      <rect x="455" y="158" width="190" height="46" rx="12" fill="#ffd166"/>
    </g>
    <text x="550" y="191" font-size="24" text-anchor="middle" fill="${O}" font-family="Jua">곰 아저씨네 가게</text>
    <!-- 놀이터 -->
    <g stroke="${O}" stroke-width="4" stroke-linejoin="round">
      <path d="M840 440 L870 280 L900 440 M1000 440 L1030 280 L1060 440" fill="none" stroke="#ff8fa3" stroke-width="10"/>
      <path d="M860 284 H1040" stroke="#ff8fa3" stroke-width="10"/>
      <path d="M930 290 V380 M970 290 V380" stroke-width="3"/>
      <rect x="920" y="378" width="60" height="12" rx="4" fill="#ffd166"/>
      <path d="M1080 440 L1080 330 L1110 330 L1110 440" fill="none" stroke="#7ec4ff" stroke-width="8"/>
      <path d="M1110 340 Q1150 380 1170 440" fill="none" stroke="#ffd166" stroke-width="16"/>
      <circle cx="790" cy="300" r="60" fill="#7cc576"/><rect x="780" y="350" width="20" height="90" fill="#b07a4a"/>
    </g>
    ${flowers ? [fl(40, 470, '#ff8fab'), fl(330, 480, '#ffe066'), fl(700, 470, '#b69cff'), fl(760, 520, '#ff9f43'), fl(380, 760, '#ff8fab'), fl(1120, 760, '#ffe066'), fl(980, 500, '#ff8fab')].join('') : ''}
    ${done ? `<g font-family="Jua"><rect x="440" y="92" width="300" height="56" rx="28" fill="#fff" stroke="${O}" stroke-width="4"/><text x="590" y="130" font-size="30" text-anchor="middle" fill="#ff6fa0">동화 숲 마을 복원 완료!</text></g>` : ''}
  </svg>`;
}

export function martBG(ch = 1) {
  const m = ch >= 2;
  return `<svg viewBox="0 0 1180 820" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <rect width="1180" height="820" fill="${m ? '#efe6ff' : '#ffe8c9'}"/>
    <g fill="${m ? '#d9c8f5' : '#f5d4a8'}"><rect y="0" width="1180" height="24"/></g>
    <g stroke="${m ? '#ddd0f5' : '#e8c08e'}" stroke-width="3">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 100 + 50} 0 V820"/>`).join('')}</g>
    ${m ? `<g fill="#ffd34d" opacity=".7">${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 89) % 1180}" cy="${30 + ((i * 47) % 200)}" r="${3 + (i % 3)}"/>`).join('')}</g>` : ''}
    <rect y="700" width="1180" height="120" fill="${m ? '#b69cff' : '#d9a46a'}"/>
  </svg>`;
}

export function digBG(ch = 1) {
  return `<svg viewBox="0 0 1180 820" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <rect width="1180" height="820" fill="${ch >= 2 ? '#e6dcff' : '#bfe6ff'}"/>
    ${ch >= 2 ? castle(930, 215, 0.6) : ''}
    <g fill="#fff"><ellipse cx="160" cy="70" rx="80" ry="26"/><ellipse cx="980" cy="60" rx="90" ry="24"/></g>
    <path d="M0 220 C200 190 400 210 600 200 C800 190 1000 215 1180 200 V820 H0Z" fill="#9fd88a"/>
    <rect y="460" width="1180" height="360" fill="#a8744a"/>
    <path d="M0 460 C200 450 400 470 600 458 C800 448 1000 468 1180 456" fill="none" stroke="#6bb865" stroke-width="16"/>
    <g fill="#8f5f3a">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 97) % 1180}" cy="${500 + ((i * 53) % 300)}" r="${3 + (i % 4)}"/>`).join('')}</g>
  </svg>`;
}

export function traceBG() {
  return `<svg viewBox="0 0 1180 820" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="tsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b3a8c"/><stop offset="1" stroke-color="#8e6fd6" stop-color="#8e6fd6"/></linearGradient></defs>
    <rect width="1180" height="820" fill="url(#tsky)"/>
    <g fill="#fff6b0">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 131) % 1180}" cy="${(i * 71) % 420}" r="${1.5 + (i % 3)}" opacity="${0.4 + (i % 5) / 8}"/>`).join('')}</g>
    <circle cx="1040" cy="110" r="50" fill="#fff6d6"/><circle cx="1062" cy="96" r="44" fill="#4b3a8c"/>
    <path d="M0 700 C100 640 160 690 240 650 C320 610 380 680 460 640 C560 600 640 680 760 640 C860 610 940 670 1040 630 C1100 610 1150 640 1180 630 V820 H0Z" fill="#3a2d6e"/>
    <g fill="#2d2258">${[60, 220, 380, 980, 1120].map((x) => `<path d="M${x} 700 L${x - 50} 700 L${x} 520 L${x + 50} 700Z"/>`).join('')}</g>
  </svg>`;
}

// ───────────────────────── 새 미니게임 배경 ─────────────────────────
export function pondBG(ch = 1) {
  return `<svg viewBox="0 0 1180 820" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <rect width="1180" height="820" fill="${ch >= 2 ? '#e6dcff' : '#bfe6ff'}"/>
    ${ch >= 2 ? castle(560, 225, 0.55) : ''}
    <g fill="#fff"><ellipse cx="260" cy="70" rx="80" ry="24"/><ellipse cx="900" cy="56" rx="90" ry="26"/></g>
    <path d="M0 230 C200 200 420 230 600 215 C820 200 1000 225 1180 210 V820 H0Z" fill="#9fd88a"/>
    <ellipse cx="640" cy="580" rx="560" ry="250" fill="#5fb4e8" stroke="#5a4032" stroke-width="6"/>
    <ellipse cx="640" cy="590" rx="520" ry="215" fill="#7ec4ff"/>
    <g fill="none" stroke="#bfe6ff" stroke-width="4" stroke-linecap="round" opacity=".8">
      <path d="M260 470 q20 -10 40 0 M820 440 q20 -10 40 0 M500 700 q20 -10 40 0 M960 650 q20 -10 40 0 M350 620 q20 -10 40 0"/>
    </g>
    <g stroke="#5a4032" stroke-width="3"><ellipse cx="180" cy="720" rx="44" ry="16" fill="#6bb865"/><ellipse cx="1080" cy="520" rx="40" ry="14" fill="#6bb865"/><circle cx="190" cy="712" r="7" fill="#ff8fab"/></g>
    <g stroke="#5a4032" stroke-width="3" fill="#7cc576"><path d="M70 470 q10 -60 0 -110 M90 470 q20 -50 30 -90 M50 470 q-10 -50 -20 -80" fill="none" stroke="#4f9a4a" stroke-width="6"/></g>
  </svg>`;
}

export function riverBG(ch = 1) {
  return `<svg viewBox="0 0 1180 820" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <rect width="1180" height="820" fill="${ch >= 2 ? '#e6dcff' : '#bfe6ff'}"/>
    <g fill="#fff"><ellipse cx="300" cy="80" rx="90" ry="26"/><ellipse cx="860" cy="64" rx="80" ry="24"/></g>
    <path d="M0 300 C200 260 400 290 600 270 C800 250 1000 280 1180 262 V820 H0Z" fill="#b7e4a0"/>
    <rect x="0" y="470" width="1180" height="350" fill="#5fb4e8"/>
    <g fill="none" stroke="#bfe6ff" stroke-width="5" stroke-linecap="round"><path d="M260 560 q25 -12 50 0 M700 600 q25 -12 50 0 M480 720 q25 -12 50 0 M900 700 q25 -12 50 0 M360 790 q25 -12 50 0"/></g>
    <path d="M0 410 H190 C205 480 200 640 170 820 H0Z" fill="#9fd88a" stroke="#5a4032" stroke-width="6"/>
    <path d="M1180 410 H1000 C985 480 990 640 1020 820 H1180Z" fill="#9fd88a" stroke="#5a4032" stroke-width="6"/>
    ${ch >= 2 ? castle(1005, 412, 0.78) : '<g stroke="#5a4032" stroke-width="4"><circle cx="1090" cy="330" r="60" fill="#7cc576"/><rect x="1080" y="370" width="20" height="44" fill="#b07a4a"/></g>'}
  </svg>`;
}

// 숨은 글자 찾기: 그림 장면과 글자를 숨길 자리(그 자리 색과 비슷한 색)
export const HIDE_SPOTS = [
  [170, 330, '#5aa356'], [290, 335, '#5aa356'], [230, 440, '#5aa356'], [330, 410, '#5aa356'], [130, 410, '#5aa356'],
  [232, 570, '#8a5a32'], [232, 690, '#8a5a32'],
  [470, 560, 'wall'], [600, 650, 'wall'], [600, 545, 'wall'], [470, 680, 'wall'],
  [530, 432, 'roof'],
  [730, 712, '#4f9a4a'], [840, 735, '#4f9a4a'], [1010, 690, '#4f9a4a'], [1100, 730, '#4f9a4a'],
  [870, 525, '#4f9ad8'], [990, 535, '#4f9ad8'],
  [720, 345, '#9ccbe8'], [1000, 330, '#9ccbe8'], [420, 335, '#9ccbe8'],
  [360, 775, '#7cb86a'], [660, 790, '#7cb86a'],
];
export function hideSpots(ch = 1) {
  const c = { wall: ch >= 2 ? '#cfc2ea' : '#e3c69c', roof: ch >= 2 ? '#9a80e6' : '#e0607e' };
  return HIDE_SPOTS.map(([x, y, k]) => [x, y, c[k] || k]);
}
export function hiddenBG(ch = 1) {
  const m = ch >= 2;
  return `<svg viewBox="0 0 1180 820" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <rect width="1180" height="820" fill="#bfe6ff"/>
    <g fill="#fff"><ellipse cx="700" cy="310" rx="90" ry="34"/><ellipse cx="990" cy="295" rx="80" ry="30"/><ellipse cx="420" cy="295" rx="70" ry="28"/></g>
    <path d="M0 470 C300 440 700 460 1180 450 V820 H0Z" fill="#9fd88a"/>
    <g stroke="#5a4032" stroke-width="5" stroke-linejoin="round">
      <rect x="205" y="430" width="55" height="340" rx="10" fill="#b07a4a"/>
      <circle cx="230" cy="370" r="125" fill="#7cc576"/>
      <rect x="420" y="470" width="230" height="270" rx="8" fill="${m ? '#ece6f8' : '#fff1d6'}"/>
      <path d="M396 474 L535 360 L674 474Z" fill="${m ? '#b69cff' : '#ff8fa3'}"/>${m ? '<path d="M535 360 V330 L556 338 L535 346" fill="#ff8fab"/>' : ''}
      <rect x="512" y="640" width="48" height="100" rx="18" fill="#c9824a"/>
      <ellipse cx="930" cy="530" rx="170" ry="62" fill="#7ec4ff"/>
      <ellipse cx="785" cy="725" rx="130" ry="72" fill="#6bb865"/>
      <ellipse cx="1055" cy="710" rx="120" ry="82" fill="#6bb865"/>
    </g>
    <path d="M300 820 C380 770 600 760 700 820Z" fill="#9bcf88"/>
  </svg>`;
}

export function fishSVG(color = '#ff9f43') {
  return wrap(`<path d="M150 50 L182 22 L178 50 L182 78Z" fill="${color}"/><ellipse cx="90" cy="50" rx="68" ry="40" fill="${color}"/><circle cx="40" cy="42" r="7" fill="#fff"/><circle cx="38" cy="42" r="3.5" fill="${O}" stroke="none"/><path d="M26 60 q6 4 12 0" fill="none" stroke-width="2.5"/><path d="M98 12 q12 -10 24 2" fill="${color}"/>`, '0 0 190 100');
}

export function rodSVG() {
  return wrap(`<path d="M10 90 L90 10" stroke="#b07a4a" stroke-width="9"/><path d="M10 90 L90 10" stroke="#d9a46a" stroke-width="4"/><circle cx="26" cy="74" r="8" fill="#ff8fab"/>`);
}
