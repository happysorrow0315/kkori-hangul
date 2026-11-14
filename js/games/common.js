// 미니게임 공통 틀
import { el, onTap, speech, esc } from '../ui.js';
import { catSVG } from '../art.js';
import { S } from '../state.js';

export function frame(root, { bg, title, cls }) {
  const node = el(`<div class="game ${cls} ch${S.chapter}">
    <div class="game-bg">${bg}</div>
    <button class="exit-btn" aria-label="나가기">✕</button>
    <div class="game-title">${esc(title)}</div>
    <button class="hint-btn" aria-label="꼬리에게 물어보기"><div class="hint-cat">${catSVG({ hat: S.profile?.catHat })}</div><span>도와줘!</span></button>
    <div class="game-body"></div>
  </div>`);
  root.appendChild(node);
  return {
    node,
    body: node.querySelector('.game-body'),
    exit: node.querySelector('.exit-btn'),
    hint: node.querySelector('.hint-btn'),
    title: node.querySelector('.game-title'),
  };
}

export async function confirmExit(root) {
  const i = await speech({ who: 'kkori', text: '음... 그만하고 마을로 돌아갈까?\n지금 그만하면 이번 미션은 보상이 없어.', buttons: ['계속할래', '마을로 갈래'], root });
  return i === 1;
}

export function speakerIcon() {
  return `<svg viewBox="0 0 100 100" stroke="#5a4032" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M18 38 H34 L54 20 V80 L34 62 H18Z" fill="#fff"/><path d="M66 34 Q76 50 66 66 M76 24 Q92 50 76 76" fill="none"/></svg>`;
}

// 그림 카드 + 듣기 버튼
export function picCard(cls = '') {
  return `<div class="g-pic ${cls}"><div class="g-pic-svg"></div><button class="g-say" aria-label="듣기">${speakerIcon()}</button></div>`;
}

// 같은 버튼에 라운드마다 핸들러가 쌓이지 않게 교체
export function rebind(node, fn) {
  node._fn = fn;
  if (!node._bound) { node._bound = true; onTap(node, (e) => node._fn && node._fn(e)); }
}

// 진행 점 표시 (● ● ○)
export function dots(total, cur) {
  return Array.from({ length: total }, (_, i) => `<i class="${i < cur ? 'done' : i === cur ? 'cur' : ''}"></i>`).join('');
}
