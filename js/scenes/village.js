// 고양이 마을 (본거지): 둘러보기 + 꾸미기
import { S, save, addInv } from '../state.js';
import { el, onTap, speech, toStage, toast, esc, pick, shake } from '../ui.js';
import { villageBG, catSVG, avatarSVG, itemSVG, decorSVG, DECOR, starSVG, boardSVG, brushSVG, shopSVG, bookSVG, gearSVG, lockSVG } from '../art.js';
import { say, sfx } from '../audio.js';
import { refreshBoard, nextStory, bossReady, fill } from '../quests.js';
import { openBoard, openShop, openDex } from './panels.js';
import { openParent } from './parent.js';
import { checkGate } from '../gate.js';

const ZONE3_X = 786;
const ZONE3_OPEN = 50;
const GROUND_TOP = 470, GROUND_BOTTOM = 790;
const DRAWER_TOP = 664;

const itemArt = (key) => {
  const [kind, k] = key.split(':');
  return kind === 'word' ? itemSVG(k) : decorSVG(k);
};
const itemName = (key) => {
  const [kind, k] = key.split(':');
  return kind === 'word' ? k : DECOR[k]?.name || '';
};

export function villageScene(root) {
  refreshBoard();
  checkGate();
  let decorating = false;
  const node = el(`<div class="village">
    <div class="vbg"></div>
    <div class="vfog"><div class="vfog-lock">${lockSVG()}</div><div class="vfog-text">마을 복원 ${ZONE3_OPEN}%가 되면<br>놀이터가 열려요</div></div>
    <div class="vplaced"></div>
    <div class="vchar me">${avatarSVG(S.profile?.avatar)}</div>
    <div class="vchar cat"></div>
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
    <div class="drawer"><div class="drawer-list"></div><div class="drawer-hint">물건을 위로 끌어서 마을에 놓아요</div></div>
    <div class="trash">치우기</div>
    <button class="btn deco-done">꾸미기 끝!</button>
  </div>`);
  root.appendChild(node);
  const $ = (s) => node.querySelector(s);
  const placedLayer = $('.vplaced');

  function drawHud() {
    $('.vbg').innerHTML = villageBG(S.restore);
    $('.vbg').style.filter = `grayscale(${(100 - S.restore) * 0.9}%)`;
    $('.vfog').style.display = S.restore >= ZONE3_OPEN ? 'none' : '';
    $('.hud-restore i').style.width = S.restore + '%';
    $('.hud-restore b').textContent = S.restore + '%';
    $('.hud-stars b').textContent = S.stars;
    $('.vchar.cat').innerHTML = catSVG({ hat: S.profile?.catHat });
    $('.vbtn.board .badge').style.display = nextStory() || bossReady() ? '' : 'none';
  }

  function drawPlaced() {
    placedLayer.innerHTML = '';
    [...S.placed].sort((a, b) => a.y - b.y).forEach((p) => {
      const d = el(`<div class="placed ${p.key.startsWith('decor') ? 'decor' : ''}" data-id="${p.id}" style="left:${p.x}px;top:${p.y}px">${itemArt(p.key)}</div>`);
      d.addEventListener('pointerdown', (e) => onPlacedDown(e, d, p));
      placedLayer.appendChild(d);
    });
  }

  function drawDrawer() {
    const list = $('.drawer-list');
    const keys = Object.keys(S.inventory).filter((k) => S.inventory[k] > 0);
    list.innerHTML = keys.length ? '' : '<div class="drawer-empty">아직 물건이 없어요. 의뢰를 해결하고 물건을 되찾아요!</div>';
    keys.forEach((k) => {
      const b = el(`<div class="drawer-item" data-k="${esc(k)}"><div class="drawer-pic">${itemArt(k)}</div><div class="drawer-name">${esc(itemName(k))}</div><i>${S.inventory[k]}</i></div>`);
      b.addEventListener('pointerdown', (e) => onDrawerDown(e, b, k));
      list.appendChild(b);
    });
  }

  const validSpot = (x, y) => y >= GROUND_TOP && y <= (decorating ? DRAWER_TOP - 20 : GROUND_BOTTOM) && x >= 40 && x <= 1140 && (S.restore >= ZONE3_OPEN || x < ZONE3_X - 30);
  const overTrash = (x, y) => (x > 1020 && y > 560 && y < 664) || y > DRAWER_TOP;

  // ── 마을에 놓인 물건: 꾸미기 중엔 끌기, 아니면 이름 듣기
  function onPlacedDown(e, d, p) {
    if (!decorating) {
      sfx('pop');
      d.classList.remove('boing');
      void d.offsetWidth;
      d.classList.add('boing');
      const name = itemName(p.key);
      say(name);
      const tag = el(`<div class="name-tag" style="left:${p.x}px;top:${p.y - 70}px">${esc(name)}</div>`);
      placedLayer.appendChild(tag);
      setTimeout(() => tag.remove(), 1600);
      return;
    }
    e.preventDefault();
    const start = { x: p.x, y: p.y };
    d.classList.add('dragging');
    d.setPointerCapture?.(e.pointerId);
    const move = (ev) => {
      const q = toStage(ev);
      d.style.left = q.x + 'px';
      d.style.top = q.y + 'px';
      node.querySelector('.trash').classList.toggle('hot', overTrash(q.x, q.y));
    };
    const up = (ev) => {
      d.removeEventListener('pointermove', move);
      d.removeEventListener('pointerup', up);
      d.removeEventListener('pointercancel', up);
      node.querySelector('.trash').classList.remove('hot');
      const q = toStage(ev);
      if (overTrash(q.x, q.y)) {
        S.placed = S.placed.filter((x) => x.id !== p.id);
        addInv(p.key, 1);
        sfx('pop');
      } else if (validSpot(q.x, q.y)) {
        p.x = Math.round(q.x); p.y = Math.round(q.y);
      } else {
        p.x = start.x; p.y = start.y;
        if (q.x >= ZONE3_X - 30 && S.restore < ZONE3_OPEN) toast('놀이터는 아직 잠겨 있어요');
      }
      save();
      drawPlaced();
      drawDrawer();
    };
    d.addEventListener('pointermove', move);
    d.addEventListener('pointerup', up);
    d.addEventListener('pointercancel', up);
  }

  // ── 서랍에서 꺼내기: 위로 끌면 놓기, 그냥 누르면 빈자리에 자동으로 놓기
  function onDrawerDown(e, b, key) {
    const s0 = toStage(e);
    let ghost = null, moved = false;
    const move = (ev) => {
      const q = toStage(ev);
      if (!ghost) {
        if (Math.abs(q.x - s0.x) > 10 || Math.abs(q.y - s0.y) > 10) moved = true;
        if (s0.y - q.y > 14) {
          ghost = el(`<div class="placed dragging ${key.startsWith('decor') ? 'decor' : ''}">${itemArt(key)}</div>`);
          placedLayer.appendChild(ghost);
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
        if (validSpot(q.x, q.y)) place(key, q.x, q.y);
        else if (q.x >= ZONE3_X - 30 && S.restore < ZONE3_OPEN) toast('놀이터는 아직 잠겨 있어요');
      } else if (!moved && ev.type === 'pointerup') {
        const spot = freeSpot();
        place(key, spot.x, spot.y);
      }
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function freeSpot() {
    const maxX = S.restore >= ZONE3_OPEN ? 1100 : ZONE3_X - 60;
    for (let t = 0; t < 40; t++) {
      const x = 80 + Math.random() * (maxX - 80), y = 500 + Math.random() * 130;
      const behindChars = x > 170 && x < 440 && y < 620; // 주인공과 꼬리 뒤는 피함
      if (!behindChars && S.placed.every((p) => Math.hypot(p.x - x, p.y - y) > 70)) return { x, y };
    }
    return { x: 300, y: 560 };
  }

  function place(key, x, y) {
    if (!S.inventory[key]) return;
    addInv(key, -1);
    S.placed.push({ id: 'p' + Date.now() + Math.floor(Math.random() * 999), key, x: Math.round(x), y: Math.round(y) });
    save();
    sfx('pop');
    say(itemName(key));
    drawPlaced();
    drawDrawer();
  }

  function setDecorating(v) {
    decorating = v;
    node.classList.toggle('decorating', v);
    if (v) { drawDrawer(); say('물건을 위로 끌어서 마을에 놓아 봐!'); }
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
      '물건을 누르면 이름을 알려 줄게!',
      '꾸미기를 누르면 되찾은 물건으로 마을을 꾸밀 수 있어.',
      '별을 모아서 상점에서 모자를 사 줘~',
      '도감에서 모은 글자를 볼 수 있어.',
      '게시판에서 의뢰를 골라 봐!',
    ];
    const s = nextStory();
    speech({ who: 'kkori', text: bossReady() ? '좀비괴물이 게시판에서 기다리고 있어! 마지막 대결이야!' : s ? '게시판에 중요한 의뢰가 있어! 도와주러 가자!' : pick(lines) });
  });
  onTap($('.vchar.me'), () => { const c = $('.vchar.me'); c.classList.remove('boing'); void c.offsetWidth; c.classList.add('boing'); });

  drawHud();
  drawPlaced();

  if (!S.flags.villageIntro) {
    S.flags.villageIntro = true;
    save();
    (async () => {
      await speech({ who: 'kkori', text: '여기가 우리 마을이야. 좀비괴물 때문에 마을이 회색이 됐어.' });
      await speech({ who: 'kkori', text: '의뢰 게시판에서 할 일을 골라 글자를 되찾으면 마을에 색이 돌아와!' });
      $('.vbtn.board').classList.add('glow');
    })();
  }
}
