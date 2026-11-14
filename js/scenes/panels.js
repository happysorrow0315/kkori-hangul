// 의뢰 게시판 / 상점 / 도감
import { S, save, addInv } from '../state.js';
import { el, onTap, esc, portrait, toast, confetti } from '../ui.js';
import { itemSVG, catSVG, decorSVG, DECOR, HAT_LIST, starSVG, zombieSVG } from '../art.js';
import { say, sfx } from '../audio.js';
import { refreshBoard, TYPE_INFO, fill } from '../quests.js';
import { wordsOf, catOf, CATS, CHAPTERS } from '../words.js';
import { runMission } from './mission.js';

function modal(root, cls, inner) {
  const node = el(`<div class="modal-dim"><div class="panel ${cls}"><button class="close-btn" aria-label="닫기">✕</button>${inner}</div></div>`);
  root.appendChild(node);
  onTap(node.querySelector('.close-btn'), () => node.remove());
  return node;
}

export function openBoard(root) {
  const board = refreshBoard();
  const node = modal(root, 'board-panel', `<div class="panel-title">의뢰 게시판</div><div class="qcards"></div>`);
  const wrap = node.querySelector('.qcards');
  board.forEach((q) => {
    const p = q.boss ? { name: '좀비괴물', svg: zombieSVG('evil') } : portrait(q.giver);
    const pic = q.boss ? zombieSVG('eat') : q.type === 'find' ? '<div class="qmystery">?</div>' : itemSVG(q.words[0]);
    const label = q.boss ? '마지막 대결' : TYPE_INFO[q.type].label;
    const text = fill(q.text);
    const c = el(`<div class="qcard ${q.story ? 'story' : ''} ${q.boss ? 'boss' : ''}">
      ${q.story ? `<div class="qribbon">이야기</div>` : ''}${q.boss ? `<div class="qribbon">대결!</div>` : ''}
      <div class="qhead"><div class="qface">${p.svg}</div><div class="qname">${esc(p.name)}</div></div>
      ${q.title ? `<div class="qtitle">${esc(q.title)}</div>` : ''}
      <div class="qtext">${esc(text)}</div>
      <div class="qtype"><span class="qpic">${pic}</span><span>${esc(label)}</span></div>
      <button class="btn qgo">할래요!</button>
    </div>`);
    onTap(c.querySelector('.qtext'), () => say(text));
    onTap(c.querySelector('.qhead'), () => say(text));
    onTap(c.querySelector('.qgo'), () => { node.remove(); runMission(q); });
    wrap.appendChild(c);
  });
  say('음~ 오늘은 어떤 의뢰를 해 볼까?');
}

export function openShop(root, onChange) {
  const node = modal(root, 'shop-panel', `<div class="panel-title">꼬리네 상점 <span class="shop-stars"><span class="hud-star">${starSVG()}</span><b></b></span></div><div class="shop-grid"></div>`);
  const grid = node.querySelector('.shop-grid');
  const draw = () => {
    node.querySelector('.shop-stars b').textContent = S.stars;
    grid.innerHTML = '';
    Object.entries(HAT_LIST).forEach(([k, h]) => {
      const owned = S.owned['hat:' + k];
      const wearing = S.profile?.catHat === k;
      const b = el(`<div class="shop-item"><div class="shop-pic">${catSVG({ hat: k })}</div><div class="shop-name">${esc(h.name)}</div>
        ${owned ? `<button class="btn ${wearing ? 'sky' : 'mint'} small">${wearing ? '벗기' : '씌우기'}</button>` : `<button class="btn small" ${S.stars < h.price ? 'disabled' : ''}><span class="hud-star">${starSVG()}</span>${h.price}</button>`}</div>`);
      onTap(b.querySelector('button'), () => {
        if (owned) { S.profile.catHat = wearing ? null : k; }
        else { if (S.stars < h.price) return; S.stars -= h.price; S.owned['hat:' + k] = true; S.profile.catHat = k; sfx('coin'); say(`${h.name} 샀다!`); }
        save(); draw(); onChange?.();
      });
      grid.appendChild(b);
    });
    Object.entries(DECOR).forEach(([k, d]) => {
      const have = S.inventory['decor:' + k] || 0;
      const b = el(`<div class="shop-item"><div class="shop-pic">${decorSVG(k)}</div><div class="shop-name">${esc(d.name)}${have ? ` <small>(${have}개)</small>` : ''}</div>
        <button class="btn small" ${S.stars < d.price ? 'disabled' : ''}><span class="hud-star">${starSVG()}</span>${d.price}</button></div>`);
      onTap(b.querySelector('button'), () => {
        if (S.stars < d.price) return;
        S.stars -= d.price; addInv('decor:' + k, 1); sfx('coin');
        say(`${d.name} 샀다! 꾸미기에서 놓을 수 있어.`);
        save(); draw(); onChange?.();
      });
      grid.appendChild(b);
    });
  };
  draw();
  say('별로 꼬리 모자나 마을 장식을 살 수 있어!');
}

export function openDex(root) {
  const chs = Array.from({ length: S.chapter }, (_, i) => S.chapter - i); // 최신 챕터 먼저
  const words = chs.flatMap((c) => wordsOf(c));
  const got = words.filter((w) => S.dex[w]).length;
  const secs = chs.map((c) => {
    const ws = wordsOf(c);
    const cats = [...new Set(ws.map(catOf))];
    return `<div class="dex-ch">${c}챕터 ${esc(CHAPTERS[c]?.name || '')} <small>${ws.filter((w) => S.dex[w]).length} / ${ws.length}</small></div>` + cats.map((cat) => sec(cat, ws)).join('');
  }).join('');
  function sec(cat, list) { return `<div class="dex-sec">${esc(CATS[cat])}</div><div class="dex-grid">${list.filter((w) => catOf(w) === cat).map((w) => S.dex[w]
    ? `<button class="dex-cell got" data-w="${esc(w)}"><div class="dex-pic">${itemSVG(w)}</div><div class="dex-word">${esc(w)}</div></button>`
    : `<div class="dex-cell"><div class="dex-pic shadow">${itemSVG(w)}</div><div class="dex-word">?</div></div>`).join('')}</div>`; }
  const node = modal(root, 'dex-panel', `<div class="panel-title">글자 도감 <small>${got} / ${words.length}</small></div><div class="dex-scroll">${secs}</div>`);
  node.querySelectorAll('.dex-cell.got').forEach((c) => onTap(c, () => { say(c.dataset.w); c.classList.remove('boing'); void c.offsetWidth; c.classList.add('boing'); }));
  if (got === words.length) { confetti(); say('도감을 다 모았어! 대단해!'); }
}
