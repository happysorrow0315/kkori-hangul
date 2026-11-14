# 꼬리의 글자 대모험

7세 아이를 위한 아이패드용 한글 학습 게임(웹앱). 기획안: Claude Docs "꼬리의 글자 대모험 기획안".

## PC에서 실행

```
node tools/serve.js
```
브라우저에서 http://localhost:8080 을 연다.

## 아이패드에서 바로 해 보기 (같은 와이파이)

1. PC에서 `node tools/serve.js` 실행
2. 아이패드 사파리에서 `http://<PC의 IP>:8080` 접속 (IP는 PowerShell에서 `ipconfig`로 확인)
3. Windows 방화벽 허용 창이 뜨면 "개인 네트워크" 허용

이 방식은 PC가 켜져 있어야 하고 오프라인 실행은 안 된다. 정식 사용은 아래 GitHub Pages 배포.

## GitHub Pages 배포 (무료, 오프라인 실행 가능)

1. GitHub에 새 저장소를 만들고 이 폴더를 push (`node_modules`, `tools/shots`는 제외됨)
2. 저장소 Settings → Pages → Branch: `main`, 폴더: `/ (root)` → Save
3. 몇 분 뒤 `https://<아이디>.github.io/<저장소이름>/` 으로 접속
4. 아이패드 사파리에서 열고 공유 버튼 → "홈 화면에 추가"

게임 파일을 고친 뒤 다시 배포할 때는 `sw.js`의 `VERSION`을 올려야 아이패드에 새 버전이 받아진다.

## 개인정보

저장소는 공개된다. 아이 이름은 코드에 넣지 않고, 첫 실행 때 입력받아 아이패드 안(localStorage)에만 저장한다.
부모 비밀번호는 해시값만 코드에 들어 있고, 부모 설정에서 바꿀 수 있다.

## 테스트

```
npm install
node tools/serve.js          # 다른 창에서 켜 두기
node tools/test.mjs          # 처음 시작 ~ 미니게임 3종 ~ 꾸미기 ~ 상점 ~ 부모 설정 ~ 30분 잠금
node tools/test-chapter.mjs  # 게시판에서 골라 가며 1챕터 12개 미션 + 보스까지, 새 놀이 오답 흐름 포함
```
스크린샷은 `tools/shots/`에 저장된다. Microsoft Edge가 설치되어 있어야 한다.

## 구조

| 파일 | 역할 |
| --- | --- |
| `js/words.js` | 챕터별 단어 목록 |
| `js/quests.js` | 이야기 의뢰 8개, 일반 의뢰 생성, 보상 |
| `js/adaptive.js` | 난이도 자동 조절, 부모 수동 설정 반영 |
| `js/games/find.js` | 미니게임 1: 좀비괴물보다 먼저 물건 찾기 |
| `js/games/dig.js` | 미니게임 2: 땅 파서 자모 발굴 + 글자 조립 |
| `js/games/trace.js`, `js/strokes.js` | 미니게임 3: 봉인 마법 따라 쓰기 (획순 데이터) |
| `js/games/fish.js` | 미니게임 4: 연못에서 글자 낚시 |
| `js/games/bridge.js` | 미니게임 5: 글자 블록으로 다리 만들기 |
| `js/games/orb.js` | 미니게임 6: 마법 구슬 순서대로 맞히기 |
| `js/games/hidden.js` | 미니게임 7: 그림 속 숨은 글자 찾기 |
| `js/games/boss.js` | 챕터 마지막 좀비괴물 대결 (7종 중 무작위 3종) |
| `js/scenes/` | 시작, 처음 설정, 마을, 게시판/상점/도감, 부모 설정, 미션 진행 |
| `js/gate.js` | 30분마다 부모 비밀번호 확인 |
| `js/art.js` | 모든 그림 (SVG) |
