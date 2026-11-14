// 음성(TTS)과 효과음
import { S } from './state.js';

// 아이패드에 깔린 한국어 음성 중 가장 좋은 여자 목소리를 고름
// (설정 → 손쉬운 사용 → 말하기 콘텐츠 → 음성 → 한국어 에서 '고급/프리미엄' 음성을 받으면 자동으로 사용)
let voice = null;
const isMale = (v) => /minsu|민수|male|남성|남자/i.test(v.name + ' ' + v.voiceURI);
function quality(v) {
  const n = (v.name + ' ' + v.voiceURI).toLowerCase();
  let s = 0;
  if (/premium|프리미엄/.test(n)) s += 30;
  if (/enhanced|향상|고급/.test(n)) s += 20;
  if (/yuna|유나/.test(n)) s += 5;
  if (isMale(v)) s -= 100;
  if (v.localService) s += 1;
  return s;
}
export function koreanVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices()
    .filter((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith('ko'))
    .sort((a, b) => quality(b) - quality(a));
}
export function pickVoice() {
  const ko = koreanVoices();
  voice = (S.settings.voiceURI && ko.find((v) => v.voiceURI === S.settings.voiceURI)) || ko[0] || null;
  return voice;
}
export const currentVoice = () => voice;
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

// 문장마다 높낮이와 빠르기를 바꿔서 덜 딱딱하게 읽기
function phrases(text) {
  // 구버전 사파리 호환을 위해 lookbehind 없이 문장 단위로 자름
  return (text.replace(/\s+/g, ' ').match(/[^.!?~…]+[.!?~…]*/g) || [text])
    .map((t) => t.trim())
    .filter((t) => t && !/^[.!?~…]+$/.test(t));
}
function prosody(t, base) {
  let pitch = 1.18, rate = base;
  if (/\?$/.test(t)) { pitch = 1.3; }
  else if (/!$/.test(t)) { pitch = 1.32; rate = base * 1.04; }
  else if (/~$/.test(t)) { pitch = 1.24; rate = base * 0.9; }
  if (/\.\.\.|…/.test(t)) { pitch = 1.08; rate = base * 0.86; }
  if (/^(우와|와아|오호|짠|헤헤|히히|어라|앗|으앙|좋았어|야호|오오)/.test(t)) pitch += 0.08;
  return { pitch: Math.min(1.6, pitch), rate };
}

let speakId = 0;
export function say(text, { rate } = {}) {
  if (!text || !('speechSynthesis' in window)) return Promise.resolve();
  const id = ++speakId;
  try { speechSynthesis.cancel(); } catch (e) { /* 무시 */ }
  if (!voice) pickVoice();
  const base = rate ?? S.settings.ttsRate ?? 0.95;
  const parts = phrases(text);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    setTimeout(finish, 1200 + text.length * 400);
    let i = 0;
    const next = () => {
      if (id !== speakId || i >= parts.length) { finish(); return; }
      const t = parts[i++];
      const u = new SpeechSynthesisUtterance(t.replace(/~/g, ''));
      u.lang = 'ko-KR';
      if (voice) u.voice = voice;
      const k = prosody(t, base);
      u.pitch = k.pitch;
      u.rate = k.rate;
      u.onend = () => setTimeout(next, 90);
      u.onerror = () => next();
      speechSynthesis.speak(u);
    };
    // iOS: cancel 직후 바로 speak하면 무시되는 경우가 있어 살짝 늦춤
    setTimeout(next, 60);
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
