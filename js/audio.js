// 음성(TTS)과 효과음
import { S } from './state.js';

let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  const ko = vs.filter((v) => (v.lang || '').toLowerCase().startsWith('ko'));
  voice = ko.find((v) => /yuna|유나/i.test(v.name)) || ko.find((v) => /female|여/i.test(v.name)) || ko[0] || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

let speakId = 0;
export function say(text, { rate } = {}) {
  if (!text || !('speechSynthesis' in window)) return Promise.resolve();
  const id = ++speakId;
  try { speechSynthesis.cancel(); } catch (e) { /* 무시 */ }
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    if (voice) u.voice = voice;
    u.rate = rate ?? S.settings.ttsRate ?? 0.9;
    u.pitch = 1.1;
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    u.onend = finish;
    u.onerror = finish;
    setTimeout(finish, 800 + text.length * 380);
    // iOS: cancel 직후 바로 speak하면 무시되는 경우가 있어 살짝 늦춤
    setTimeout(() => { if (id === speakId) speechSynthesis.speak(u); else finish(); }, 60);
  });
}
export function stopSay() {
  speakId++;
  try { speechSynthesis.cancel(); } catch (e) { /* 무시 */ }
}

// ───── 효과음 (Web Audio로 직접 합성) ─────
let ctx = null;
export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    // iOS 음성 잠금 해제용 빈 발화
    if ('speechSynthesis' in window && !unlockAudio.done) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
      unlockAudio.done = true;
    }
  } catch (e) { /* 무시 */ }
}

function tone(freq, start, dur, type = 'sine', vol = 0.18, slideTo = null) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}

function noise(start, dur, vol = 0.2) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 900;
  g.gain.value = vol;
  src.buffer = buf;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(ctx.currentTime + start);
}

export function sfx(name) {
  if (!ctx) return;
  try {
    switch (name) {
      case 'tap': tone(660, 0, 0.08, 'triangle', 0.12); break;
      case 'ok': tone(660, 0, 0.12, 'triangle'); tone(880, 0.1, 0.12, 'triangle'); tone(1320, 0.2, 0.2, 'triangle'); break;
      case 'bad': tone(300, 0, 0.18, 'square', 0.08, 200); tone(220, 0.15, 0.22, 'square', 0.08, 160); break;
      case 'dig': noise(0, 0.15, 0.35); tone(120, 0, 0.12, 'sine', 0.2, 70); break;
      case 'pop': tone(500, 0, 0.1, 'sine', 0.2, 1100); break;
      case 'coin': tone(988, 0, 0.08, 'square', 0.08); tone(1319, 0.08, 0.2, 'square', 0.08); break;
      case 'magic': [0, 0.07, 0.14, 0.21, 0.28].forEach((t, i) => tone(800 + i * 220, t, 0.18, 'sine', 0.12)); break;
      case 'stroke': tone(880, 0, 0.1, 'sine', 0.12); tone(1175, 0.06, 0.14, 'sine', 0.1); break;
      case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.2, 'triangle', 0.15)); break;
      case 'zombie': tone(180, 0, 0.3, 'sawtooth', 0.07, 120); tone(140, 0.25, 0.35, 'sawtooth', 0.07, 90); break;
      case 'chomp': noise(0, 0.08, 0.3); noise(0.15, 0.08, 0.3); tone(150, 0, 0.3, 'square', 0.06, 90); break;
      case 'break': noise(0, 0.4, 0.4); [1200, 900, 1500, 1100].forEach((f, i) => tone(f, i * 0.05, 0.25, 'triangle', 0.08)); break;
    }
  } catch (e) { /* 무시 */ }
}
