// 고양이 마을 (본거지): 둘러보기 + 어울리는 자리에 꾸미기
import { S, save, addInv } from '../state.js';
import { el, onTap, speech, toStage, toast, esc, pick, confetti } from '../ui.js';
import { villageBG, catSVG, zombieSVG, avatarSVG, itemSVG, decorSVG, DECOR, starSVG, boardSVG, brushSVG, shopSVG, bookSVG, gearSVG, lockSVG } from '../art.js';
import { say, sfx } from '../audio.js';
import { refreshBoard, nextStory, bossReady, fill, villageLook, canAdvance, advanceChapter, CHAPTER_INTRO, isCleared } from '../quests.js';
import { CHAPTERS, LAST_CHAPTER } from '../words.js';
import { josa } from '../hangul.js';
import { SPOTS, FREE_AREA, FREE_ZONES, homeOf, spotAt, inArea, TOY_MOTION, SKY_MOTION, TREASURE } from '../village-data.js';
import { openBoard, openShop, openDex } from './panels.js';
import { openParent } from './parent.js';
import { checkGate } from '../gate.js';

const LOCK_X = 716; // 1챕터에서 복원 50% 전까지 잠긴 오른쪽 구역
const ZONE3_OPEN = 50;
const CHAR_AREA = [330, 430, 476, 610]; // 주인공과 꼬리가 서 있는 곳

const itemArt = (key) => {
  const [kind, k] = key.split(':');
  return kind === 'word' ? itemSVG(k) : decorSVG(k);
};
const itemName = (key) => {
  const [kind, k] = key.split(':');
  return kind === 'word' ? k : DECOR[k]?.name || '';
};
const SPROUT = '<svg viewBox="0 0 40 40"><path d="M20 38 V20" stroke="#4f9a4a" stroke-width="4" fill="none"/><path d="M20 22 C10 22 6 14 8 8 C16 8 20 14 20 22Z M20 18 C28 18 34 12 32 6 C24 6 20 12 20 18Z" fill="#7cc576" stroke="#5a4032" stroke-width="2"/></svg>';

const PLACED_SAY = {
  garden: (n) => `${josa(n, '을/를')} 심었다! 쑥쑥 자라라~`,
  pen: (n) => `${josa(n, '이/가')} 울타리에 들어왔어!`,
  line: (n) => `${josa(n, '을/를')} 빨랫줄에 걸었어!`,
  mat: (n) => `${josa(n, '을/를')} 돗자리에 차렸어!`,
  toys: (n) => `${josa(n, '을/를')} 놀이터에 놓았어!`,
  sky: (n) => `${josa(n, '을/를')} 하늘에 띄웠어!`,
  shelf: (n) => `${josa(n, '을/를')} 선반에 올렸어!`,
  free: (n) => n,
};

export function villageScene(root) {
  refreshBoard();
  checkGate();
  migratePlaced();
  let decorating = false;
  let raf = 0;
  const node = el(`<div class="village">
    <div class="vbg"></div>
    <div class="vzones"></div>
    <div class="vfog"><div class="vfog-lock">${lockSVG()}</div><div class="vfog-text">마을 복원 ${ZONE3_OPEN}%가 되면<br>놀이터와 울타리가 열려요</div></div>
    <div class="vplaced"></div>
    <div class="vchar me">${avatarSVG(S.profile?.avatar)}</div>
    <div class="vchar cat"></div>
    <div class="vchar zombie" hidden>${zombieSVG('happy')}</div>
    <div class="hud">
      <div class="hud-name">${esc(S.profile?.name || '')}</div>
      <div class="hud-restore"><span>마을 복원</span><div class="restore-bar"><i></i></div><b></b></div>
      <div class="hud-stars"><span class="hud-star">${starSVG()}</span><b></b></div>
    </div>
    <div class="vmenu">
      <button class="vbtn board"><span class="vicon">${boardSVG()}</span>의뢰<i class="badge">!</i></button>
      <button class="vbtn deco"><span class="vicon">${brushSVG()}</span>꾸미기</button>
      <button class="vbtn shop"><span class="vicon">${shopSVG()}</span>상점</button>
      <button class="vbtn dex"><span class="vicon">${bookSVG()}</span>도감</button>
    </div>
    <button class="parent-btn" aria-label="부모 설정">${gearSVG()}</button>
    <div class="vdrawer">
      <div class="vdrawer-title">물건 서랍</div>
      <div class="vdrawer-list"></div>
      <button class="btn mint deco-done">꾸미기 끝!</button>
    </div>
  </div>`);
  root.appendChild(node);
  const $ = (s) => node.querySelector(s);
  const placedLayer = $('.vplaced');
  const zonesEl = $('.vzones');

  const zone3Open = () => S.chapter > 1 || S.restore >= ZONE3_OPEN;
  const locked = (x, y) => !zone3Open() && x >= LOCK_X && y >= 430;

  // ── 자리 표시 (꾸미기 중에만 보임)
  zonesEl.innerHTML = Object.entries(SPOTS).map(([id, s]) => {
    const [x0, y0, x1, y1] = s.area;
    return `<div class="spot-zone" data-spot="${id}" style="left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px"><span>${esc(s.label)}</span></div>`;
  }).join('') + FREE_ZONES.map(([x0, y0, x1, y1], i) => `<div class="spot-zone free-zone" style="left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px">${i ? '<span>빈 땅</span>' : ''}</div>`).join('');
  const zoneEl = (id) => zonesEl.querySelector(`[data-spot="${id}"]`);
  const flashZone = (id) => { const z = zoneEl(id); if (!z) return; z.classList.remove('flash'); void z.offsetWidth; z.classList.add('flash'); };

  function drawHud() {
    const v = villageLook();
    $('.vbg').innerHTML = villageBG(v.restore, v.opts);
    $('.vbg').style.filter = `grayscale(${v.gray}%)`;
    $('.vfog').style.display = zone3Open() ? 'none' : '';
    $('.hud-restore span').textContent = CHAPTERS[S.chapter]?.progress || '마을 복원';
    $('.hud-restore i').style.width = S.restore + '%';
    $('.hud-restore b').textContent = S.restore + '%';
    $('.hud-stars b').textContent = S.stars;
    $('.vchar.cat').innerHTML = catSVG({ hat: S.profile?.catHat });
    $('.vbtn.board .badge').style.display = nextStory() || bossReady() ? '' : 'none';
  }

  // ── 놓인 물건 그리기
  const walkers = new Map(); // 울타리 동물 움직임
  function sizeOf(p) {
    if (p.spot === 'free') return p.key.startsWith('decor') ? 92 : 76;
    return SPOTS[p.spot].size;
  }
  function posOf(p) {
    if (p.spot === 'free' || p.spot === 'pen') return { x: p.x, y: p.y };
    const [x, y] = SPOTS[p.spot].slots[p.i] || [p.x || 500, p.y || 600];
    return { x, y };
  }
  function motionOf(p) {
    const w = p.key.split(':')[1];
    if (p.spot === 'toys') return TOY_MOTION[w] || 'bounce';
    if (p.spot === 'sky') return SKY_MOTION[w] || 'twinkle';
    if (p.spot === 'line') return 'sway';
    if (p.spot === 'pen') return 'bob';
    if (p.spot === 'shelf' && TREASURE.includes(w)) return 'treasure';
    if (p.spot === 'garden') return 'breeze';
    return '';
  }
  function drawPlaced(fresh = null) {
    placedLayer.innerHTML = '';
    for (const p of S.placed) {
      const { x, y } = posOf(p);
      const sz = sizeOf(p);
      const d = el(`<div class="placed spot-${p.spot} ${fresh === p.id ? 'new' : ''}" data-id="${p.id}" style="left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;z-index:${Math.round(y)}">
        <div class="pin m-${motionOf(p)}" style="animation-delay:-${(p.id.charCodeAt(p.id.length - 1) % 10) / 10}s">${itemArt(p.key)}</div>
        ${fresh === p.id && p.spot === 'garden' ? `<div class="sprout">${SPROUT}</div>` : ''}</div>`);
      d.addEventListener('pointerdown', (e) => onPlacedDown(e, d, p));
      placedLayer.appendChild(d);
      if (p.spot === 'pen') {
        const old = walkers.get(p.id);
        walkers.set(p.id, { p, d, x: old?.x ?? x, y: old?.y ?? y, tx: x, ty: y, wait: Math.random() * 2, v: 22 + Math.random() * 18 });
      }
    }
    for (const id of [...walkers.keys()]) if (!S.placed.some((p) => p.id === id)) walkers.delete(id);
  }

  // 울타리 동물이 돌아다님
  let lastT = 0;
  function tick(t) {
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;
    const [x0, y0, x1, y1] = SPOTS.pen.area;
    const m = SPOTS.pen.size / 2 + 8;
    for (const w of walkers.values()) {
      if (w.drag) continue;
      if (w.wait > 0) { w.wait -= dt; continue; }
      const dx = w.tx - w.x, dy = w.ty - w.y, dist = Math.hypot(dx, dy);
      if (dist < 2) {
        w.wait = 1 + Math.random() * 3;
        w.tx = x0 + m + Math.random() * (x1 - x0 - 2 * m);
        w.ty = y0 + m + Math.random() * (y1 - y0 - 2 * m);
        continue;
      }
      const step = Math.min(dist, w.v * dt);
      w.x += (dx / dist) * step; w.y += (dy / dist) * step;
      w.p.x = Math.round(w.x); w.p.y = Math.round(w.y);
      w.d.style.left = w.x + 'px'; w.d.style.top = w.y + 'px'; w.d.style.zIndex = Math.round(w.y);
      w.d.classList.toggle('flip', dx > 0);
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  // ── 서랍
  function drawDrawer() {
    const list = $('.vdrawer-list');
    const keys = Object.keys(S.inventory).filter((k) => S.inventory[k] > 0);
    list.innerHTML = keys.length ? '' : '<div class="drawer-empty">아직 물건이 없어요.<br>의뢰를 해결하면 물건을 되찾아요!</div>';
    keys.forEach((k) => {
      const home = homeOf(k);
      const b = el(`<div class="drawer-item" data-k="${esc(k)}"><div class="drawer-pic">${itemArt(k)}</div><div class="drawer-name">${esc(itemName(k))}</div><i>${S.inventory[k]}</i><b class="drawer-home">${home === 'free' ? '빈 땅' : esc(SPOTS[home].label)}</b></div>`);
      b.addEventListener('pointerdown', (e) => onDrawerDown(e, b, k));
      list.appendChild(b);
    });
  }

  // ── 자리 정하기
  const usedSlots = (spot, exceptId) => new Set(S.placed.filter((p) => p.spot === spot && p.id !== exceptId).map((p) => p.i));
  function nearestSlot(spot, x, y, exceptId) {
    const used = usedSlots(spot, exceptId);
    let best = -1, bd = Infinity;
    SPOTS[spot].slots.forEach(([sx, sy], i) => {
      if (used.has(i)) return;
      const d = x == null ? i : Math.hypot(sx - x, sy - y);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  const penCount = (exceptId) => S.placed.filter((p) => p.spot === 'pen' && p.id !== exceptId).length;
  function randomIn([x0, y0, x1, y1], m) { return { x: x0 + m + Math.random() * (x1 - x0 - 2 * m), y: y0 + m + Math.random() * (y1 - y0 - 2 * m) }; }
  const clearAt = (x, y, r = 34) => [[0, 0], [-r, -r], [r, -r], [-r, r], [r, r]].every(([dx, dy]) => !spotAt(x + dx, y + dy) && !inArea(CHAR_AREA, x + dx, y + dy) && inArea(FREE_AREA, x + dx, y + dy) && !locked(x + dx, y + dy));
  function freeGround() {
    for (let t = 0; t < 120; t++) {
      const z = FREE_ZONES[t % FREE_ZONES.length];
      const q = randomIn(z, 4);
      if (!clearAt(q.x, q.y)) continue;
      if (S.placed.every((p) => p.spot !== 'free' || Math.hypot(p.x - q.x, p.y - q.y) > 60) || t > 80) return q;
    }
    return { x: 390, y: 700 };
  }

  // 놓을 자리 결정: {spot, i} 또는 {spot:'free'|'pen', x, y}, 안 되면 {err}
  function resolveDrop(key, x, y, exceptId) {
    const home = homeOf(key);
    const name = itemName(key);
    if (locked(x, y)) return { err: '이쪽은 아직 잠겨 있어요' };
    const at = spotAt(x, y);
    if (home === 'free') {
      if (!at && clearAt(x, y, 26)) return { spot: 'free', x: Math.round(x), y: Math.round(y) };
      return { err: `${josa(name, '은/는')} 빈 땅에 놓아 줘!` };
    }
    if (at !== home) return { err: `${josa(name, '은/는')} ${SPOTS[home].label}에 놓아 줘!`, flash: home };
    if (home === 'pen') {
      if (penCount(exceptId) >= SPOTS.pen.max) return { err: '울타리가 꽉 찼어!' };
      const m = SPOTS.pen.size / 2 + 6, [x0, y0, x1, y1] = SPOTS.pen.area;
      return { spot: 'pen', x: Math.round(Math.max(x0 + m, Math.min(x1 - m, x))), y: Math.round(Math.max(y0 + m, Math.min(y1 - m, y))) };
    }
    const i = nearestSlot(home, x, y, exceptId);
    if (i < 0) return { err: `${josa(SPOTS[home].label, '이/가')} 꽉 찼어!` };
    return { spot: home, i };
  }
  function autoDrop(key) {
    const home = homeOf(key);
    if (home === 'free') return { spot: 'free', ...freeGround() };
    if (locked(SPOTS[home].area[0], SPOTS[home].area[1] + 10)) return { err: `${josa(SPOTS[home].label, '은/는')} 마을 복원 ${ZONE3_OPEN}%에 열려요` };
    if (home === 'pen') {
      if (penCount() >= SPOTS.pen.max) return { err: '울타리가 꽉 찼어!' };
      const q = randomIn(SPOTS.pen.area, SPOTS.pen.size / 2 + 8);
      return { spot: 'pen', x: Math.round(q.x), y: Math.round(q.y) };
    }
    const i = nearestSlot(home);
    if (i < 0) return { err: `${josa(SPOTS[home].label, '이/가')} 꽉 찼어!` };
    return { spot: home, i };
  }
  function failDrop(r) {
    sfx('bad');
    toast(r.err);
    if (r.flash) flashZone(r.flash);
    say(r.err);
  }

  function placeNew(key, r) {
    if (!S.inventory[key]) return;
    addInv(key, -1);
    const p = { id: 'p' + Date.now() + Math.floor(Math.random() * 999), key, spot: r.spot };
    if (r.i != null) p.i = r.i; else { p.x = r.x; p.y = r.y; }
    S.placed.push(p);
    save();
    sfx(r.spot === 'garden' ? 'magic' : 'pop');
    say(PLACED_SAY[r.spot](itemName(key)));
    drawPlaced(p.id);
    drawDrawer();
  }

  // ── 하이라이트
  const highlight = (key) => {
    const home = homeOf(key);
    zonesEl.querySelectorAll('.spot-zone').forEach((z) => z.classList.toggle('hot', z.dataset.spot === home));
    node.classList.toggle('free-hot', home === 'free');
    zonesEl.querySelectorAll('.free-zone').forEach((z) => z.classList.toggle('hot', home === 'free'));
  };
  const unhighlight = () => { zonesEl.querySelectorAll('.spot-zone').forEach((z) => z.classList.remove('hot')); node.classList.remove('free-hot'); };

  // ── 놓인 물건: 꾸미기 중엔 옮기기/치우기, 아니면 이름 듣기
  function onPlacedDown(e, d, p) {
    if (!decorating) {
      sfx('pop');
      const pin = d.querySelector('.pin');
      pin.classList.remove('boing'); void pin.offsetWidth; pin.classList.add('boing');
      const name = itemName(p.key);
      say(name);
      const { x, y } = posOf(p);
      const tag = el(`<div class="name-tag" style="left:${x}px;top:${y - sizeOf(p) / 2 - 46}px">${esc(name)}</div>`);
      placedLayer.appendChild(tag);
      setTimeout(() => tag.remove(), 1600);
      return;
    }
    e.preventDefault();
    const w = walkers.get(p.id);
    if (w) w.drag = true;
    d.classList.add('dragging');
    d.style.zIndex = 2000;
    d.setPointerCapture?.(e.pointerId);
    highlight(p.key);
    const move = (ev) => {
      const q = toStage(ev);
      d.style.left = q.x + 'px';
      d.style.top = q.y + 'px';
      $('.vdrawer').classList.toggle('hot', q.x > 1036);
    };
    const up = (ev) => {
      d.removeEventListener('pointermove', move);
      d.removeEventListener('pointerup', up);
      d.removeEventListener('pointercancel', up);
      unhighlight();
      $('.vdrawer').classList.remove('hot');
      if (w) w.drag = false;
      const q = toStage(ev);
      if (q.x > 1036) {
        // 서랍으로 돌려놓기
        S.placed = S.placed.filter((x) => x.id !== p.id);
        addInv(p.key, 1);
        sfx('pop');
      } else {
        const r = resolveDrop(p.key, q.x, q.y, p.id);
        if (r.err) failDrop(r);
        else {
          p.spot = r.spot;
          if (r.i != null) { p.i = r.i; delete p.x; delete p.y; } else { p.x = r.x; p.y = r.y; delete p.i; }
          if (w) { w.x = p.x; w.y = p.y; w.tx = p.x; w.ty = p.y; w.wait = 1; }
          sfx('pop');
        }
      }
      save();
      drawPlaced();
      drawDrawer();
    };
    d.addEventListener('pointermove', move);
    d.addEventListener('pointerup', up);
    d.addEventListener('pointercancel', up);
  }

  // ── 서랍에서 꺼내기: 왼쪽으로 끌면 원하는 곳에, 그냥 누르면 어울리는 자리에 자동으로
  function onDrawerDown(e, b, key) {
    const s0 = toStage(e);
    let ghost = null, moved = false;
    const move = (ev) => {
      const q = toStage(ev);
      if (!ghost) {
        if (Math.abs(q.x - s0.x) > 10 || Math.abs(q.y - s0.y) > 10) moved = true;
        if (s0.x - q.x > 14) {
          ghost = el(`<div class="placed dragging" style="width:90px;height:90px;z-index:2000"><div class="pin">${itemArt(key)}</div></div>`);
          placedLayer.appendChild(ghost);
          highlight(key);
        } else return;
      }
      ghost.style.left = q.x + 'px';
      ghost.style.top = q.y + 'px';
      ev.preventDefault();
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (ghost) {
        const q = toStage(ev);
        ghost.remove();
        unhighlight();
        if (q.x > 1036) return;
        const r = resolveDrop(key, q.x, q.y);
        if (r.err) failDrop(r); else placeNew(key, r);
      } else if (!moved && ev.type === 'pointerup') {
        const r = autoDrop(key);
        if (r.err) failDrop(r); else placeNew(key, r);
      }
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function setDecorating(v) {
    decorating = v;
    node.classList.toggle('decorating', v);
    if (v) {
      drawDrawer();
      say('물건마다 어울리는 자리가 있어! 물건을 끌면 어디에 놓을지 반짝반짝 알려 줄게~');
    }
  }

  onTap($('.vbtn.board'), () => openBoard(root));
  onTap($('.vbtn.deco'), () => setDecorating(true));
  onTap($('.deco-done'), () => setDecorating(false));
  onTap($('.vbtn.shop'), () => openShop(root, drawHud));
  onTap($('.vbtn.dex'), () => openDex(root));
  onTap($('.parent-btn'), () => openParent(root, () => { drawHud(); drawPlaced(); }));
  onTap($('.vchar.cat'), () => {
    const c = $('.vchar.cat');
    c.classList.remove('boing'); void c.offsetWidth; c.classList.add('boing');
    const lines = [
      '헤헤, 물건을 콕 누르면 이름을 알려 줄게!',
      '꾸미기를 누르면 되찾은 물건을 어울리는 자리에 놓을 수 있어. 과일은 텃밭에, 동물은 울타리에!',
      '음~ 별을 모아서 상점에서 나한테 모자 사 줄래? 헤헤.',
      '도감을 열면 지금까지 모은 글자를 볼 수 있어!',
      '오늘은 어떤 의뢰를 해 볼까? 게시판을 열어 봐!',
      '야옹~ 나는 네가 글자 찾는 거 보는 게 제일 좋아!',
    ];
    const s = nextStory();
    speech({ who: 'kkori', text: bossReady() ? '앗! 좀비괴물이 게시판에서 기다리고 있어! 마지막 대결이야!' : s ? '어라? 게시판에 중요한 의뢰가 왔어! 얼른 도와주러 가자!' : pick(lines) });
  });
  // 대모험을 끝내면 좀비괴물이 마을 친구가 됨
  const friend = () => isCleared(LAST_CHAPTER);
  $('.vchar.zombie').hidden = !friend();
  onTap($('.vchar.zombie'), () => {
    const z = $('.vchar.zombie');
    z.classList.remove('boing'); void z.offsetWidth; z.classList.add('boing');
    speech({ who: 'zombie', mood: 'happy', text: pick([
      '헤헤, 나 이제 글자 읽을 수 있다! 개는 멍멍, 게는 집게발!',
      '글자는 먹는 것보다 읽는 게 더 재밌어. 진짜야!',
      '오늘은 어떤 놀이 할 거야? 나도 구경할래!',
      '꿀이랑 굴은 소리가 달라. 꿀은 힘을 꽉! 헤헤.',
      '받침이 있어야 곰이 곰이지. 받침 없으면 고야, 고!',
    ]) });
  });
  onTap($('.vchar.me'), () => { const c = $('.vchar.me'); c.classList.remove('boing'); void c.offsetWidth; c.classList.add('boing'); });

  drawHud();
  drawPlaced();

  // 챕터를 깼으면 다음 챕터로 (이야기와 함께)
  if (canAdvance()) {
    (async () => {
      const next = S.chapter + 1;
      for (const l of CHAPTER_INTRO[next] || []) await speech({ ...l, text: fill(l.text) });
      advanceChapter();
      drawHud();
      await speech({ who: 'kkori', mood: 'wow', text: `우와~ 마을도 ${CHAPTERS[next].name}처럼 바뀌었어! 게시판에서 첫 의뢰를 골라 봐!` });
      $('.vbtn.board').classList.add('glow');
    })();
  } else if (S.flags.decorNews) {
    delete S.flags.decorNews;
    save();
    (async () => {
      await speech({ who: 'kkori', mood: 'wow', text: '짠! 새로운 꾸미기가 생겼어. 물건마다 어울리는 자리가 있대!' });
      await speech({ who: 'kkori', text: '과일은 텃밭에 심으면 쑥쑥 자라고, 동물은 울타리에서 뛰어놀고, 옷은 빨랫줄에 걸 수 있어. 놓아뒀던 물건은 서랍에 넣어 놨어!' });
      $('.vbtn.deco').classList.add('glow');
    })();
  } else if (friend() && S.chapter === LAST_CHAPTER && !S.flags.ending) {
    S.flags.ending = true;
    save();
    (async () => {
      confetti(590, 300, 50);
      await speech({ who: 'kkori', mood: 'wow', text: fill('{A}! 봐 봐, 좀비괴물이 우리 마을에 놀러 왔어!') });
      await speech({ who: 'zombie', mood: 'happy', text: '헤헤, 안녕! 이제 나도 이 마을 친구야. 글자 먹는 대신 같이 읽을 거야!' });
      await speech({ who: 'kkori', text: '이제 게시판에 골라 놀기가 생겼어! 1챕터부터 4챕터까지 모든 놀이를 마음대로 골라서 할 수 있어.' });
      await speech({ who: 'kkori', text: '복습 의뢰에는 예전에 헷갈렸던 글자가 더 자주 나온대. 별도 계속 모을 수 있어~' });
      $('.vbtn.board').classList.add('glow');
    })();
  } else if (!S.flags.villageIntro) {
    S.flags.villageIntro = true;
    save();
    (async () => {
      await speech({ who: 'kkori', text: '짠! 여기가 우리 마을이야. 그런데... 좀비괴물 때문에 마을이 회색이 됐어.' });
      await speech({ who: 'kkori', text: '의뢰 게시판에서 할 일을 골라서 글자를 되찾으면, 마을에 색이 다시 돌아와! 같이 해 보자~' });
      $('.vbtn.board').classList.add('glow');
    })();
  }

  return () => cancelAnimationFrame(raf);
}

// 예전 방식(아무 데나 놓기)으로 놓은 물건은 한 번 서랍으로 돌려놓음
function migratePlaced() {
  if (S.flags.decor2) return;
  S.flags.decor2 = true;
  const old = S.placed.filter((p) => !p.spot);
  if (old.length) {
    old.forEach((p) => addInv(p.key, 1));
    S.placed = S.placed.filter((p) => p.spot);
    S.flags.decorNews = true;
  } else if (S.profile && S.missionsDone > 0) S.flags.decorNews = true;
  save();
}
