// 미니게임 공통 틀
import { el, onTap, speech, esc } from '../ui.js';
import { catSVG } from '../art.js';
import { S } from '../state.js';

export function frame(root, { bg, title, cls }) {
  const node = el(`<div class="game ${cls}">
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
  const i = await speech({ who: 'kkori', text: '그만하고 마을로 돌아갈까?\n지금 그만하면 이번 미션은 보상이 없어.', buttons: ['계속할래', '마을로 갈래'], root });
  return i === 1;
}

// 진행 점 표시 (● ● ○)
export function dots(total, cur) {
  return Array.from({ length: total }, (_, i) => `<i class="${i < cur ? 'done' : i === cur ? 'cur' : ''}"></i>`).join('');
}
