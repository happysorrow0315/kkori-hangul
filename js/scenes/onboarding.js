// 처음 시작: 이름 → 아바타 → 오프닝 이야기
import { S, save } from '../state.js';
import { go } from '../router.js';
import { el, onTap, speech, sleep, toast, esc } from '../ui.js';
import { villageBG, catSVG, zombieSVG, avatarSVG, AVATAR_OPTIONS } from '../art.js';
import { say } from '../audio.js';
import { fill, refreshBoard } from '../quests.js';

export async function onboardingScene(root) {
  const name = await askName(root);
  S.profile = { name, avatar: null, catHat: null }; // 대사에 이름을 넣기 위해 먼저 설정 (아직 저장 안 함)
  const avatar = await makeAvatar(root, name);
  S.profile.avatar = avatar;
  await opening(root);
  save();
  refreshBoard();
  go('village');
}

function askName(root) {
  return new Promise((resolve) => {
    root.innerHTML = '';
    const node = el(`<div class="onb">
      <div class="onb-bg">${villageBG(100, { banner: false })}</div>
      <div class="onb-cat">${catSVG({ mood: 'happy' })}</div>
      <div class="panel onb-panel">
        <div class="onb-q">안녕! 나는 꼬리야.<br>너의 이름은 뭐야?</div>
        <input class="onb-input" maxlength="6" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="이름">
        <button class="btn big onb-ok">좋아!</button>
      </div></div>`);
    root.appendChild(node);
    say('안녕! 나는 꼬리야. 너의 이름은 뭐야?');
    const input = node.querySelector('.onb-input');
    onTap(node.querySelector('.onb-ok'), () => {
      const v = input.value.trim().replace(/\s+/g, '');
      if (!v) { toast('이름을 적어 줘!'); input.focus(); return; }
      if (!/^[가-힣a-zA-Z]{1,6}$/.test(v)) { toast('이름은 한글이나 영어로 6글자까지 적어 줘'); return; }
      input.blur();
      resolve(v);
    });
  });
}

function makeAvatar(root, name) {
  return new Promise((resolve) => {
    const a = { skin: AVATAR_OPTIONS.skin[0], hair: 'pigtails', hairColor: AVATAR_OPTIONS.hairColor[0], outfit: AVATAR_OPTIONS.outfit[0] };
    root.innerHTML = '';
    const rows = [
      ['skin', '피부'], ['hair', '머리 모양'], ['hairColor', '머리 색'], ['outfit', '옷 색'],
    ];
    const hairNames = { bob: '단발', pigtails: '양갈래', long: '긴 머리' };
    const node = el(`<div class="onb">
      <div class="onb-bg">${villageBG(100, { banner: false })}</div>
      <div class="panel avatar-panel">
        <div class="avatar-preview"></div>
        <div class="avatar-opts">
          <div class="onb-q small">${esc(fill('{A}, 내 모습을 꾸며 봐!'))}</div>
          ${rows.map(([k, label]) => `<div class="opt-row"><div class="opt-label">${label}</div><div class="opt-list" data-k="${k}">${AVATAR_OPTIONS[k].map((v) => k === 'hair'
            ? `<button class="opt txt" data-v="${v}">${hairNames[v]}</button>`
            : `<button class="opt" data-v="${v}" style="background:${v}"></button>`).join('')}</div></div>`).join('')}
          <button class="btn big avatar-done">완성!</button>
        </div>
      </div></div>`);
    root.appendChild(node);
    say(fill('{A}, 내 모습을 꾸며 봐!'));
    const prev = node.querySelector('.avatar-preview');
    const draw = () => {
      prev.innerHTML = avatarSVG(a);
      node.querySelectorAll('.opt-list').forEach((l) => l.querySelectorAll('.opt').forEach((o) => o.classList.toggle('on', a[l.dataset.k] === o.dataset.v)));
    };
    node.querySelectorAll('.opt').forEach((o) => onTap(o, () => { a[o.parentElement.dataset.k] = o.dataset.v; draw(); }));
    draw();
    onTap(node.querySelector('.avatar-done'), () => resolve({ ...a }));
  });
}

async function opening(root) {
  root.innerHTML = '';
  const node = el(`<div class="opening">
    <div class="opening-bg">${villageBG(100, { banner: false })}</div>
    <div class="opening-zombie">${zombieSVG('evil')}</div>
  </div>`);
  root.appendChild(node);
  const bg = node.querySelector('.opening-bg');
  const zb = node.querySelector('.opening-zombie');
  await speech({ who: 'narr', text: '여기는 글자로 만들어진 동화 숲 마을이에요.', root });
  zb.classList.add('in');
  await sleep(600);
  await speech({ who: 'zombie', mood: 'eat', text: '으흐흐~ 글자는 정말 맛있어! 냠냠!', root });
  bg.classList.add('gray');
  await sleep(800);
  await speech({ who: 'narr', text: '글자를 먹힌 물건들이 하나둘 사라지고, 마을은 회색이 되었어요.', root });
  zb.classList.add('out');
  await speech({ who: 'kkori', mood: 'wow', text: fill('{A}! 우리 같이 글자를 되찾자!\n글자를 되찾으면 물건이 다시 살아나!'), root });
}
