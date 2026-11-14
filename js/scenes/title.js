// 시작 화면
import { S, resetAll } from '../state.js';
import { go } from '../router.js';
import { el, onTap } from '../ui.js';
import { villageBG, catSVG, zombieSVG } from '../art.js';
import { unlockAudio } from '../audio.js';

export function titleScene(root) {
  // 처음 시작을 다 마치지 못한 기록(아바타 없음)은 비우고 처음부터 (부모 설정은 유지)
  if (S.profile && !S.profile.avatar) resetAll();
  root.appendChild(el(`<div class="title">
    <div class="title-bg">${villageBG(100, { banner: false })}</div>
    <div class="title-logo"><div class="title-sub">좀비괴물에게서 글자를 지켜라!</div><h1>꼬리의 글자 대모험</h1></div>
    <div class="title-cat">${catSVG({ hat: S.profile?.catHat, mood: 'happy' })}</div>
    <div class="title-zombie">${zombieSVG('evil')}</div>
    <button class="btn big title-start">${S.profile ? '이어서 하기' : '시작하기'}</button>
  </div>`));
  onTap(root.querySelector('.title-start'), () => {
    unlockAudio();
    go(S.profile ? 'village' : 'onboarding');
  });
}
