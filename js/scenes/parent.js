// 부모 설정 (비밀번호로 들어감)
import { S, save, saveNow, pwHash, exportData, importData, resetAll } from '../state.js';
import { el, onTap, keypad, toast, esc } from '../ui.js';
import { say } from '../audio.js';
import { catAccuracy, hardestWords, skill, toolLevel, TOOL_NAMES } from '../adaptive.js';
import { CATS, wordsOf } from '../words.js';
import { go } from '../router.js';

export async function openParent(root, onChange) {
  const code = await keypad({ title: '부모님 비밀번호' });
  if (code === null) return;
  if (pwHash(code) !== S.settings.pwHash) { toast('비밀번호가 달라요'); return; }

  const seg = (key, opts) => `<div class="seg" data-key="${key}">${opts.map(([v, label]) => `<button data-v="${v}" class="${String(S.settings[key]) === String(v) ? 'on' : ''}">${label}</button>`).join('')}</div>`;
  const pct = (v) => (v === null ? '기록 없음' : Math.round(v * 100) + '%');
  const hard = hardestWords();
  const words = wordsOf(S.chapter);
  const node = el(`<div class="modal-dim top-modal"><div class="panel parent-panel">
    <button class="close-btn" aria-label="닫기">✕</button>
    <div class="panel-title">부모 설정</div>
    <div class="parent-scroll">
      <h3>학습 기록</h3>
      <div class="p-grid">
        <div>완료한 미션</div><b>${S.missionsDone}개</b>
        <div>도감</div><b>${Object.keys(S.dex).length} / ${words.length} 단어</b>
        <div>마을 복원</div><b>${S.restore}%</b>
        ${Object.entries(CATS).map(([k, v]) => `<div>정확도: ${esc(v)}</div><b>${pct(catAccuracy(k))}</b>`).join('')}
        <div>실력 지수 (찾기/땅파기/쓰기)</div><b>${['find', 'dig', 'trace'].map((t) => Math.round(skill(t) * 100)).join(' / ')}</b>
        <div>도구</div><b>${['find', 'dig', 'trace'].map((t) => TOOL_NAMES[t][toolLevel(t)]).join(', ')}</b>
      </div>
      <div class="p-sub">자주 틀린 단어</div>
      <div class="p-hard">${hard.length ? hard.map((h) => `<span>${esc(h.w)} <small>틀림 ${h.bad} · 맞힘 ${h.ok}</small></span>`).join('') : '아직 없어요'}</div>

      <h3>난이도 (자동이 기본, 직접 고르면 그 값이 우선)</h3>
      <div class="p-row"><div>좀비괴물 속도 (찾기)</div>${seg('zombieSpeed', [['auto', '자동'], ['slow', '느리게'], ['normal', '보통'], ['fast', '빠르게']])}</div>
      <div class="p-row"><div>땅파기 난이도</div>${seg('digLevel', [['auto', '자동'], ['easy', '쉽게'], ['hard', '어렵게']])}</div>
      <div class="p-row"><div>복모음 연습</div>${seg('compound', [['auto', '자동'], ['more', '더 많이']])}</div>

      <h3>사용 시간</h3>
      <div class="p-row"><div>부모 확인 간격</div>${seg('gateMinutes', [[15, '15분'], [20, '20분'], [30, '30분'], [45, '45분'], [60, '60분']])}</div>
      <div class="p-row"><div>지금까지 이어서 논 시간</div><b>${Math.floor((S.gate.played || 0) / 60)}분</b></div>

      <h3>음성</h3>
      <div class="p-row"><div>읽어 주는 속도</div>${seg('ttsRate', [[0.75, '느리게'], [0.9, '보통'], [1.05, '빠르게']])}<button class="btn small sky p-test">들어 보기</button></div>

      <h3>비밀번호와 데이터</h3>
      <div class="p-row"><button class="btn small p-pw">비밀번호 바꾸기</button></div>
      <div class="p-row"><button class="btn small mint p-export">백업 파일 저장</button><label class="btn small sky p-import">백업 불러오기<input type="file" accept=".json,application/json" hidden></label></div>
      <div class="p-note">게임 기록은 이 아이패드 안에만 저장돼요. 사파리 기록을 지우면 사라질 수 있으니 가끔 백업해 주세요.</div>
      <div class="p-row"><button class="btn small danger p-reset">처음부터 다시 하기</button></div>
    </div>
  </div></div>`);
  document.getElementById('top').appendChild(node);
  const close = () => { node.remove(); onChange?.(); };
  onTap(node.querySelector('.close-btn'), close);

  node.querySelectorAll('.seg').forEach((s) => s.querySelectorAll('button').forEach((b) => onTap(b, () => {
    const key = s.dataset.key;
    const v = b.dataset.v;
    S.settings[key] = ['gateMinutes', 'ttsRate'].includes(key) ? Number(v) : v;
    save();
    s.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  })));
  onTap(node.querySelector('.p-test'), () => say('안녕! 나는 꼬리야. 우유, 사과, 돼지.'));

  onTap(node.querySelector('.p-pw'), async () => {
    const a = await keypad({ title: '새 비밀번호', sub: '숫자 4자리' });
    if (a === null) return;
    const b = await keypad({ title: '한 번 더 입력', sub: '확인을 위해 다시 눌러 주세요' });
    if (b === null) return;
    if (a !== b) { toast('두 번 입력한 비밀번호가 달라요'); return; }
    S.settings.pwHash = pwHash(a);
    saveNow();
    toast('비밀번호를 바꿨어요');
  });

  onTap(node.querySelector('.p-export'), () => {
    saveNow();
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `꼬리대모험-백업-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
  node.querySelector('.p-import input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      importData(await file.text());
      toast('백업을 불러왔어요');
      node.remove();
      go('village');
    } catch (err) {
      toast(err.message || '파일을 읽지 못했어요');
    }
  });
  onTap(node.querySelector('.p-reset'), async () => {
    if (!confirm('정말 처음부터 다시 할까요? 모든 기록이 지워져요. (비밀번호와 설정은 유지)')) return;
    resetAll();
    node.remove();
    go('title');
  });
}
