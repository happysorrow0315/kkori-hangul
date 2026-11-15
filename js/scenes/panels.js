// 의뢰 게시판 / 상점 / 도감
import { S, save, addInv } from '../state.js';
import { el, onTap, esc, portrait, toast, confetti } from '../ui.js';
import { itemSVG, catSVG, decorSVG, DECOR, HAT_LIST, starSVG, zombieSVG } from '../art.js';
import { say, sfx } from '../audio.js';
import { refreshBoard, TYPE_INFO, TYPES, fill, reviewMode, makeQuest, CH_TYPES } from '../quests.js';
import { wordsOf, catOf, CATS, CHAPTERS } from '../words.js';
import { runMission } from './mission.js';

function modal(root, cls, inner) {
  const node = el(`<div class="modal-dim"><div class="panel ${cls}"><button class="close-btn" aria-label="닫기">✕</button>${inner}</div></div>`);
  root.appendChild(node);
  onTap(node.querySelector('.close-btn'), () => node.remove());
  return node;
}

// 골라 놀기 버튼 그림
const TYPE_PIC = { find: '사과', dig: '고구마', trace: '나무', fish: '오리', bridge: '공주', orb: '회오리', hidden: '과자', rocket: '별똥별', alien: '꿀', twin: '딸기', stars: '토끼', sub: '고래', lock: '열쇠', ink: '게', shell: '조개' };
const chapterOfType = (t) => Number(Object.keys(CH_TYPES).find((c) => CH_TYPES[c].includes(t)) || 1);

export function openBoard(root) {
  const board = refreshBoard();
  const review = reviewMode();
  const node = modal(root, 'board-panel', review
    ? `<div class="panel-title board-tabs"><button class="btab on" data-tab="q">복습 의뢰</button><button class="btab" data-tab="free">골라 놀기</button></div><div class="qcards"></div><div class="free-grid" hidden></div>`
    : `<div class="panel-title">의뢰 게시판</div><div class="qcards"></div>`);
  const wrap = node.querySelector('.qcards');
  if (review) {
    const grid = node.querySelector('.free-grid');
    grid.innerHTML = TYPES.map((t) => `<button class="free-btn" data-t="${t}"><span class="free-pic">${itemSVG(TYPE_PIC[t])}</span>${esc(TYPE_INFO[t].label)}<small>${chapterOfType(t)}챕터</small></button>`).join('');
    grid.querySelectorAll('.free-btn').forEach((b) => onTap(b, () => { node.remove(); runMission(makeQuest(b.dataset.t)); }));
    node.querySelectorAll('.btab').forEach((b) => onTap(b, () => {
      node.querySelectorAll('.btab').forEach((x) => x.classList.toggle('on', x === b));
      const free = b.dataset.tab === 'free';
      grid.hidden = !free;
      wrap.hidden = free;
      say(free ? '하고 싶은 놀이를 골라 봐! 1챕터부터 4챕터까지 다 있어.' : '틀렸던 글자가 자주 나오는 복습 의뢰야!');
    }));
  }
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
  say(review ? '대모험을 다 끝냈어! 복습 의뢰를 하거나, 골라 놀기에서 하고 싶은 놀이를 골라 봐!' : '음~ 오늘은 어떤 의뢰를 해 볼까?');
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
