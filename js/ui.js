// 화면 공통 도구
import { S } from './state.js';
import { say, sfx, stopSay } from './audio.js';
import { catSVG, zombieSVG, avatarSVG, VILLAGERS, speakerSVG } from './art.js';

export const W = 1180, H = 820;
let scale = 1;

export const stageEl = () => document.getElementById('stage');
export const sceneEl = () => document.getElementById('scene');
export const topEl = () => document.getElementById('top');

export function fitStage() {
  const vw = window.innerWidth, vh = window.innerHeight;
  scale = Math.min(vw / W, vh / H);
  const st = stageEl();
  st.style.transform = `translate(${(vw - W * scale) / 2}px, ${(vh - H * scale) / 2}px) scale(${scale})`;
}

export function toStage(e) {
  const r = stageEl().getBoundingClientRect();
  return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 버튼 누를 때 공통 효과음
export function onTap(node, fn) {
  node.addEventListener('click', (e) => { sfx('tap'); fn(e); });
  return node;
}

export function portrait(who, mood) {
  if (who === 'kkori') return { name: '꼬리', svg: catSVG({ hat: S.profile?.catHat, mood }) };
  if (who === 'zombie') return { name: '좀비괴물', svg: zombieSVG(mood) };
  if (who === 'me') return { name: S.profile?.name || '나', svg: avatarSVG(S.profile?.avatar) };
  if (VILLAGERS[who]) return { name: VILLAGERS[who].name, svg: VILLAGERS[who].svg() };
  return null;
}

// 대화창: 버튼 순서(index)를 돌려줌
export function speech({ who = 'kkori', mood, text, buttons = ['다음'], speak = true, root } = {}) {
  return new Promise((resolve) => {
    const p = portrait(who, mood);
    const node = el(`<div class="speech-wrap">
      <div class="speech ${who === 'zombie' ? 'zombie' : ''}">
        ${p ? `<div class="speech-face">${p.svg}</div><div class="speech-name">${esc(p.name)}</div>` : ''}
        <div class="speech-text">${esc(text).replace(/\n/g, '<br>')}</div>
        <button class="speech-replay" aria-label="다시 듣기">${speakerSVG()}</button>
        <div class="speech-btns">${buttons.map((b, i) => `<button class="btn ${i === 0 ? '' : 'sky'}" data-i="${i}">${esc(b)}</button>`).join('')}</div>
      </div></div>`);
    (root || sceneEl()).appendChild(node);
    const plain = text.replace(/\n/g, ' ');
    if (speak) say(plain);
    onTap(node.querySelector('.speech-replay'), () => say(plain));
    node.querySelectorAll('.speech-btns button').forEach((b) => onTap(b, () => {
      stopSay();
      node.remove();
      resolve(+b.dataset.i);
    }));
  });
}

export async function talk(lines, root) {
  for (const l of lines) await speech({ ...l, root });
}

export function toast(msg, ms = 2200) {
  const t = el(`<div class="toast">${esc(msg)}</div>`);
  topEl().appendChild(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

export function confetti(x = W / 2, y = H / 2, n = 28) {
  const colors = ['#ff8fab', '#ffd166', '#7ec4ff', '#9be29b', '#b69cff', '#ff9f43'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    const ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 220;
    c.style.left = x + 'px';
    c.style.top = y + 'px';
    c.style.background = colors[i % colors.length];
    c.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    c.style.setProperty('--dy', Math.sin(ang) * dist - 80 + 'px');
    c.style.setProperty('--r', Math.random() * 720 - 360 + 'deg');
    topEl().appendChild(c);
    setTimeout(() => c.remove(), 1300);
  }
}

// 부모 비밀번호 키패드 → 입력한 4자리 또는 null(취소)
export function keypad({ title = '부모님 비밀번호', sub = '' } = {}) {
  return new Promise((resolve) => {
    let code = '';
    const node = el(`<div class="modal-dim top-modal"><div class="panel keypad">
      <div class="kp-title">${esc(title)}</div>
      ${sub ? `<div class="kp-sub">${esc(sub)}</div>` : ''}
      <div class="kp-dots">${'<i></i>'.repeat(4)}</div>
      <div class="kp-grid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '취소', 0, '⌫'].map((k) => `<button class="kp-key" data-k="${k}">${k}</button>`).join('')}</div>
    </div></div>`);
    topEl().appendChild(node);
    const dots = node.querySelectorAll('.kp-dots i');
    const draw = () => dots.forEach((d, i) => d.classList.toggle('on', i < code.length));
    node.querySelectorAll('.kp-key').forEach((b) => onTap(b, () => {
      const k = b.dataset.k;
      if (k === '취소') { node.remove(); resolve(null); return; }
      if (k === '⌫') code = code.slice(0, -1);
      else if (code.length < 4) code += k;
      draw();
      if (code.length === 4) setTimeout(() => { node.remove(); resolve(code); }, 150);
    }));
  });
}

export function shake(node) {
  node.classList.remove('shake');
  void node.offsetWidth;
  node.classList.add('shake');
}

export function nudge(node) {
  node.classList.remove('nudge');
  void node.offsetWidth;
  node.classList.add('nudge');
}

export function starsText(n) {
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
}
