// 30분마다 부모님 비밀번호 확인
import { S, save, pwHash } from './state.js';
import { el, topEl, keypad, onTap, toast } from './ui.js';
import { catSVG } from './art.js';
import { say, stopSay } from './audio.js';

const GRACE = 180; // 미션 중이면 끝날 때까지 최대 3분 기다림
let last = Date.now();
let inMission = false;
let showing = false;

export function setInMission(v) {
  inMission = v;
  if (!v) checkGate();
}

const limit = () => (S.settings.gateMinutes || 30) * 60;

setInterval(() => {
  const now = Date.now();
  const dt = Math.min(5, (now - last) / 1000);
  last = now;
  if (document.hidden || showing || !S.profile) return;
  S.gate.played = (S.gate.played || 0) + dt;
  if (Math.floor(S.gate.played) % 15 === 0) save();
  checkGate();
}, 1000);

export function checkGate() {
  if (showing || !S.profile) return;
  const p = S.gate.played || 0;
  if (p < limit()) return;
  if (inMission && p < limit() + GRACE) return;
  showGate();
}

function showGate() {
  showing = true;
  stopSay();
  const mins = S.settings.gateMinutes || 30;
  const node = el(`<div class="gate">
    <div class="gate-cat">${catSVG({ hat: S.profile?.catHat, mood: 'sleepy' })}</div>
    <div class="gate-text">우리 벌써 ${mins}분이나 놀았어!<br>더 놀려면 엄마 아빠한테 허락받고 와~</div>
    <button class="btn big">부모님 확인</button>
  </div>`);
  topEl().appendChild(node);
  say(`우리 벌써 ${mins}분이나 놀았어! 더 놀려면 엄마 아빠한테 허락받고 와.`);
  onTap(node.querySelector('button'), async () => {
    const code = await keypad({ title: '부모님 비밀번호', sub: `${mins}분 더 놀 수 있어요` });
    if (code === null) return;
    if (pwHash(code) === S.settings.pwHash) {
      S.gate.played = 0;
      save();
      node.remove();
      showing = false;
      last = Date.now();
      toast('부모님이 허락해 주셨어요!');
    } else {
      toast('비밀번호가 달라요');
    }
  });
}
