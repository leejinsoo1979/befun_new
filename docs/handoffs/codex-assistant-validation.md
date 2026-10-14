# Codex-보조 / R1-QA 진행·인계

기준: [5인 개발 계획](../development/furniture-parity/README.md), [공통 계약 R1.1](../development/furniture-parity/contracts.md).

## 착수

- 실제 세션명: Create repository AGENTS guide / 01a133e8-8c93-7352-9af8-96cd31ba2af9
- 수신/착수 시각: 2026-10-13T12:43:45.931360+00:00
- 상태: 사용자 직접 지시 수신, R1-QA 착수
- 적용 계약 버전: R1.2 (문서 계약; src/types/furniture.ts 부재 확인)
- 수정/잠금 파일: scripts/furniture-validation/** 및 본 인계 문서

## 첫 산출물과 진행

- 수행 내용:
- 변경 파일:
- 사용한 근거 사례 ID:
- 관찰 사실 / 추정 / 미확인:

## 검증

- 실행 명령·환경:
- 결과와 실패 항목:
- 화면/구조 비교 경로:
- 미검증 범위:

## 공통 계약 변경·연결 요청

요청 ID / 문제 사례 / 현재 계약 / 변경 제안 / 영향 파일·담당 / 호환 및 검증 계획.

## 완료·인계

- 구현 / 실제 연결 / 검증 상태를 각각 기입:
- 리더가 연결할 진입점과 사용법:
- 남은 차이·다음 작업:
- 잠금 해제 파일·시각:


## R1-QA 독립 검증 결과 — 2026-10-13

수신한 04 지시서와 terminal-instructions 네 번째 지시, R1.2 계약·acceptance를 읽고 수행. 사용자의 선행 요청인 배경 회귀만 먼저 좁게 수정했으며, 아래 QA 단계에서는 제품 소스·원본 사례 수정 없음. 코드·측정의 기준은 [소스 지문](../../scripts/furniture-validation/source-fingerprints.json)에 기록.

### 선행 배경 회귀 수정

- 원인: Scene의 `!freeOrbit` 조건이 OrbitControls 조작 시작과 동시에 Background 전체를 제거. 바닥에는 receiveShadow도 없었음.
- 변경: 일반 정면/입체 보기에서 freeOrbit만으로 배경을 제거하지 않음, 바닥 receiveShadow 추가. 현재 다른 담당의 환경광/재질 설정 보존.
- ESLint 두 파일, 독립 snapshot `/tmp/befun-blum-check-i2w8i1y4`의 webpack production build/TypeScript 통과. 3019 Chrome에서 회전 후 사람·벽·바닥·그림자 유지, 후면 프리셋의 모델 가림 없음 확인. 기술 모드/AR/분해도 룸 제외 정책 유지. 극단적 자유 회전의 후면·바닥 아래 시점과 Tylko 픽셀 동치는 미검증.
- Scene/Background/표시 문서 좁은 잠금 해제. 검증 단계에서 추가 제품 수정 없음.

### A. 원본 근거 검사

[검사 도구와 명령](../../scripts/furniture-validation/README.md), [기계 판독 결과](../../scripts/furniture-validation/reference-results.json).

- 조사 JSON 61개: case ID 중복 0, 확인 가능한 URL/preset ID 충돌 0, 참조된 로컬 스크린샷 누락 0. 필드 검사 pass416/fail0/unknown322이며, 이는 동치 사례 수가 아님.
- 모델 배열 32개 + 옷장 초기 제품 2개 = 초기 제품34개. 활성 preset28개 확인,6개 미확인. 옷장 조작14개는 초기 제품2개의 수정 이력이며 currentInternalParameters=null을 초기 preset으로 대체하지 않음.
- loading-preview-only14개는 비교 불가로 유지. 모든 category geometry는 미측정. UI cm, API mm, 행 index를 혼동하지 않도록 명시 단위 없는 필드는 unknown. 제조 정밀도·sliderStep null도 unknown.
- 이미지 표본 직접 검사: `category-sideboard-original-classic-reference.png`는 실제 로딩 문구/비활성 옵션 화면, `category-wardrobe-edge-002-reference.png`는 내부 구성 패널과 열린 옷장이 보임. 후자는 렌더 완료 관찰일 뿐 판 좌표의 정밀 계측 근거는 아님. 나머지 전체 이미지는 존재/기록 상태 검사이며 전수 육안 검사라고 주장하지 않음.
- 갤러리 원본은 스크린샷 배열이 비어 있고 URL/CSS 관찰이 근거. 새 Befun 갤러리 결과 JSON은 구현 담당의 기록으로 분리하며 본 독립 결과를 대신하지 않음.

### B. 구조·조립·CNC 및 상태 회귀

- 기존 검사 실행: hardware, grid/slant, pattern, pixel/gradient, mosaic, display test glob. [실행 로그](../../scripts/furniture-validation/regression.log): **1,462 tests pass**, fail0. 기존 source/heldout fixtures 범위의 회귀이며 1,462개 독립 제품 동치 사례가 아님.
- 신규 독립 검사 [로그](../../scripts/furniture-validation/independent-tests.log): **30 tests pass**, fail0. 근거 어댑터·비교기의 pass/fail/unknown 예제, 6스타일×3너비(90/232/393cm) 18개 내부 일관성 사례, 실제 store 저장복구/값 복귀/변경 순서, 12재질96URL 일치 포함.
- 같은 생성 결과의 판재 좌표·크기 multiset이 CNC까지 유지되고 조립 앵커/부품 수가 일치. 문 개수, 서랍 구성판 수, 발의 바닥판 귀속 확인. CNC 0.1mm 반올림에 의한 최대0.05mm 오차만 허용(제조 공차 아님). 실제 GPU mesh와 전체 개구부 topology 전수 비교는 하지 못함.
- 공통 타입 `src/types/furniture.ts`와 새 제품군의 측정된 mm 부품 입력은 아직 없음. 새 제품군 칸 내경/토폴로지, 개구부-문-서랍 연결, 장다리/받침 앵커, 모든 재질별 분절, 가려진 판재의 동치는 **unknown**.
- 비교 도구는 reference/generated를 별도 입력으로 받고 안정 ID·역할·연결·mm 좌표를 비교. missing/extra/unknown/수치오차 분리. source 근거 없는 허용오차나 배열 위치 ID를 만들지 않음. 최대 길이3000mm 같은 보편 규칙을 추가하지 않음.

### C. 독립 브라우저 확인

[기계 판독 브라우저 결과](../../scripts/furniture-validation/browser-results.json). Chrome localhost3003 최신 개발 화면, 별도 QA 탭 사용. 공유 개발 서버/타 담당 탭을 종료하지 않음.

- `/configurator?skipLoad=true`: 재질12종 모두 선택, 각8개 이미지 실제 로드 및 URL 재질 경로 확인. 상단 range 값·pressed 보기 버튼이 전환 전후 동일. 실제 store 내부 전체 상태는 브라우저 DOM 검사만으로 확정하지 않음.
- 데스크톱 월넛1번 및 모바일 월넛8번 확대: 선택 사진과 확대 src 동일·로드 완료.390×844에서 document width390, gallery width390, 스와치12개/사진8개, 마지막 스와치 선택 가능, 모달 사진312px. 전체 페이지 가로 overflow 없음. viewport 복원 완료.
- `/furniture/bookcase-plum`: 자체 사진7개 유지,12재질 갤러리 강제 적용 없음.
- 저장복구: 상품 너비150→171cm → 저장·공유 → 로컬 저장 안내 → 생성된 design-preview 링크 진입 → 새로고침. 너비171cm/7행/표시높이223cm 유지. 실제 store 단위 테스트에서도 문·서랍 rowStyles 포함 JSON/로컬 parser/restore 왕복 통과.
- 서버 저장 실패 및 미저장 새로고침 초기화는 아래 별도 이슈. 서버에 성공 저장됐다고 처리하지 않음. 다른 브라우저 세션/계정 저장 목록/DB shareCode 복구, 신규 제품군 preset 전환과 구획 편집은 미확인.

### 차이·연결 요청

| ID | 우선순위/담당 제안 | 재현·기대·실제 | 상태 |
|---|---|---|---|
| QA-001 | P1 리더 + storefront | bookcase-plum 너비171 → 저장·공유. 서버 저장 성공 기대에 대해 서버 불가 안내와 로컬 fallback 관찰. DB/auth 원인 미확정 | 서버 경로 fail; 로컬 경로 pass |
| QA-002 | P2 리더 + storefront | bookcase-plum 너비150→171 → 저장 없이 새로고침하면150으로 복귀. 사용자 요구의 새로고침 복구 범위에 미저장 초안을 포함할지 확정 필요 | 요청 복구 기준 fail; 정책 결정 대기 |
| QA-003 | P1 리더 | 공통 mm 결과·안정 part/section ID·관측 reference topology·수치 정밀도 부재. compare.mjs로 입력 연결 필요 | unknown, 구현/측정 의존 |
| QA-004 | P1 리더 조사 | preset6개 미확인·preview14개·옷장 currentInternalParameters14개 null. 초기값으로 보완 금지 | unknown, 추가 관찰 필요 |
| QA-005 | P2 리더 + graphics | 갤러리 사진 전환은 통과. 가구 자체의 재질/픽셀 동치는 같은 카메라·광원·옵션의 대응 측정 없음 | unknown |

### 인계

현재 가능한 근거 감사·기존 회귀·독립 도구·갤러리 및 로컬 공유 검증은 수행 완료. R1 전체 동치 검증은 완료 아님. 다음 입력은 리더의 공통 타입/어댑터와 제품군별 실제 관측 mm reference/generated 쌍, 측정 정밀도/최대 길이 spec, 개발에 사용하지 않은 보류 사례. 제품 변경 대신 위 재현 결과를 인계함. QA 도구/본 문서 이번 작성 잠금 해제; 다음 통합본에 재검증 가능.

## 사용자 추가 직접 수정 — 우측 카드/보기 메뉴

2026-10-13: 우측 카드의 margin-left:-32px를 제거해 뷰어 가림 해소(1728/1024폭 경계 겹침0). 기존 세로 아이콘은 삭제, 공유/AR callback을 Scene→ViewToolbar로 연결, 치수/정면 중복 제거. 메뉴는 아래 방향으로 펼치고 모바일 내부 스크롤/높이 제한 및Esc접기 제공.3003 데스크톱/390px 메뉴 배치·치수 토글 확인, TSX lint 및 격리 production build 통과. 제품 소스 수정은 이 별도 사용자 직접 지시 범위에 한함. 공유·AR 백엔드/기기 세션 성공은 이번 메뉴 이동 검증 범위 밖.

### 도움말 수정 범위 정정 — 2026-10-14
이전 일반/configurator 검사만으로 상품 상세까지 완료라고 한 보고는 부정확했음. 사용자 실제 /furniture/sideboard-terra에서49×60px 재현. storefront.module.css productOptions 광범위 버튼 규칙을 이미지가 있는 스타일 버튼으로 제한하고 도움말24×24·상품 옵션 드래그 방지 추가. 사용자 열린 탭 HMR 반영 및 별도 상품 화면에서4개 도움말24×24/라벨 드래그 선택없음 확인. ESLint/격리build 통과.

## 왼쪽4 후속 독립 검증 — 2026-10-14

수신·착수: 2026-10-14T00:11:39.785605+09:00 / R1-QA. 최신 terminal-instructions 왼쪽4, connector-systems 및 connector-clip-003/004 확인. 담당 잠금은 scripts/furniture-validation/** 및 이 handoff. 제품 소스 읽기 전용. 선행 책 배치 검사9개 및432설정/3128소품 간섭 검사 통과, 화면 검증은 별도 미확인으로 유지.

### 왼쪽4 결과 — 00:20 KST / 최신 지시 독립 재현

제품 소스 수정 없음. [소스 지문](../../scripts/furniture-validation/left4-source-fingerprints.json), [UI/통합 로그](../../scripts/furniture-validation/left4-ui.log), [접합 독립 로그](../../scripts/furniture-validation/left4-connectors.log), [기존 OVVO 로그](../../scripts/furniture-validation/left4-existing-connectors.log).

| ID | 판정 | 재현·실제 결과·범위 |
|---|---|---|
| UI-R1.3 | pass | 현재 제품 컴포넌트를 별도 Vitest3/jsdom 환경에서 실행. 담당자 43개 전부 재통과. 독립 추가3개: 입력 중 외부값232 전달 후 Enter에서 폐기된555 재전송 없음, 개별 옵션 전부 disabled일 때 Tab/클릭/화살표 intent 없음, pointercancel 후 다른 profile의90/max120 반영. UI 총46개 pass. 실제 터치/모바일 새 캡처 및 상단 store 통합은 별도 미확인. |
| QA-L4-01/07 | pass (설정·컴포넌트) | 실제 settings 저장/load에서 system·기억한 OVVO 모델·공구번호 유지. 실제 OptimizerApp+ConnectorBar+생성기+store를 렌더하고 OVVO→클립→unmount/remount→OVVO 실행: 클립 복구, OVVO 판재 baseline 완전 동일. 무거운 CNCOptimizerPro와 공간 설정만 대체, session 입력은 고정 fixture. 브라우저 새로고침과 동일한 전체 페이지 테스트라고 주장하지 않음. |
| QA-L4-B01 | pass (브라우저) | 별도 Chrome localhost3003/optimizer 탭, 기본25판재. 클립 선택 후 새로고침: ‘Tylko 클립 방식’, 접합부0·커넥터0·확인1, 미확정 안내 유지. 초기 최적화 완료 모달을 닫고 검사. |
| QA-L4-02 | pass (적용 함수) | V-1230P 적용된 직각 두 판재에 user:42, blum-hinge:1 구멍과 user:slot 추가→applyConnectors(clip). connector: 자동 가공만 제거, 추가3개 데이터 그대로 보존, 구조판 전부 제조차단. |
| QA-L4-05 | pass (생성기) | 6스타일,171×92×32cm,밀도63%,28cm×3행,도어0행. 매번 새로 생성하는 실제 snapshot 경로로 OVVO→clip→OVVO 비교: 마지막 판재/접합 report baseline 동일. 실제 생성 힌지가 비어 있지 않음을 검사하고 clip에서도 동일성 확인. |
| QA-L4-03 | pass (출력 함수) | clip 판재와 정상판을 섞어 exportBoringData 호출. CSV/DXF/MPR/CIX 모두 success=false, files=[], 미확정 사유. 통합 내보내기 입구 기준이며 모든 저수준 생성함수의 직접 호출까지 보장하지 않음. |
| QA-L4-B02 | pass (실제 MPR UI) | 클립 선택·새로고침→Export→HOMAG(MPR). 브라우저 알림 ‘MPR 내보내기를 중단했습니다. 확정되지 않은 가공이 있는 판재가25개…Tylko 클립…미확정’ 확인. 파일 성공 생성으로 처리하지 않음. CSV/DXF/CIX의 실제 버튼 동작은 미확인. |
| QA-L4-04 | **fail / P2** | 같은 panels 객체에 OVVO→clip→OVVO 재적용. 슬롯은 복구되지만 manufacturingReady=false 및 이전 CLIP_SPEC_PENDING 사유가 그대로 남음. apply.ts는 자동 ops만 지우고 이전 방식이 생성한 차단 사유를 지우지 않음. 현 OptimizerApp은 새 판재 생성으로 이 문제를 우회하지만 in-place 재사용자는 잘못 차단됨. 수정 요청: 리더가 사유 출처를 구분해 폐기된 접합 사유만 제거, 다른 차단 사유 보존. |
| QA-L4-08 | **fail / P1** | 실제 OptimizerApp OVVO 초기화→CNC store 기존 판재에 user:qa-preserve 사용자 구멍 추가→실제 ConnectorBar onChange로 clip 선택. 같은 ID 판재에서 구멍 사라짐. snapshotDesign(next)가 design에서 새 판재를 만들고 setSnapshot으로 교체하기 때문. 저장된 설계로 생성되는 힌지는 보존되지만 기존 판재 사용자 가공은 보존 안 됨. 수동 구멍 입력 UI는 대체했으므로 그 입력 화면 E2E는 미확인; 통합 경계의 데이터 손실 자체는 실행 재현됨. 수정 요청: 리더의 안정 part ID·가공 출처 계약에 따라 사용자 편집을 병합/복구. |
| QA-L4-06/HW | pass (설명용 계약만) | 현재 하드웨어 clip 검사 재실행 통과. 별도 독립101샘플: 진입 중 상대X=0, 슬라이드 중 gapZ=0, pinInClip+panelOffset의X가 고정 핀 앵커와 일치. entered/locked는 공유 pinPositionInClip과 같고 마지막 panelOffset=[0,0,0]. Scene은 같은 TylkoClip/TylkoClipPin을 import. |
| QA-L4-U01 | **미확인** | 실제 가구 접합점에 연결된 전체 모델의 끝선·직각·간섭, 실제 mm 이동/품번/가공 치수 및 색상별 잠금 역할. 현재 설명용 모델/시퀀스 검사만 통과했으며 Tylko 제조 동치로 판정하지 않음. |
| QA-L4-U02 | **미확인** | MPR 알림 확인 뒤 브라우저 제어가 Emulation.setFocusEmulationEnabled timeout으로 중단. 따라서 브라우저에서 OVVO 복귀 완료/초기값 복원은 확인 못 함. 마지막 확인된 설정은 clip. 실제 컴포넌트 remount/복귀 pass와 분리. 사용자 탭·공유 서버 종료 없음. |

#### 실행 환경·재현 방법

- Node24.19.0. `node --test scripts/furniture-validation/left4-connectors.test.mjs`: **8pass/1fail**. 실패를 숨기는 skip/expected-failure 처리 없음.
- `QA_UI_DEPS=<기존 테스트 node_modules 절대경로> node scripts/furniture-validation/run-left4-ui.mjs`: **47pass/1fail** (R1.3 43 + 독립 UI3 + optimizer2). 의존성은 Vitest3.2.7/jsdom/@testing-library/react·jest-dom. 이번에는 Claude scratchpad/testrun/node_modules 재사용. 테스트 소스는 ui-left4/*.txt에 보존하고 실행 시 /tmp로 복사해 제품 tsc glob·package.json에 영향 없음.
- `node --test scripts/connector-validation/connector.test.mjs`: 기존13pass. Tylko 동치13사례가 아님.
- `node --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs src/components/three/furniture-hardware/connectors/clip.test.mjs`: all clip checks passed. 초기 loader 없는 시도는 확장자 해석 오류였으며 제품 실패로 세지 않음.
- 접합·UI 오류2건은 제품 소스를 고치지 않고 재현 테스트로 남김. 소스 변경 없는 QA라 전체 앱 build 재실행 안 함. 검증 도구·본 handoff 잠금 해제. 위2건 수정 후 실패 테스트와 연결 경로 재검증 필요.

## R2-QA 수신·착수

2026-10-14T06:18:13.656871+09:00 / Codex 독립 QA. dispatch-r2.md 수신. 제품 소스 읽기 전용; scripts/furniture-validation/** 및 본 handoff 잠금. QA-L4-04/08 원본 검사를 변경하지 않고 리더 수정본을 재실행하며, 추가 보존/외부 차단 사유·브라우저·타 담당 게시 산출물을 교차검사한다.

## R2.1-QA 수신 및 중간 P1 인계

- assignments/04-qa.md 수신. 기존 R2 검증을 이어가며 원본 QA-L4-04/08 기준과 제품 소스 보존. scripts/furniture-validation/**, 본 handoff, assets/codex-qa/r2/** 잠금.
- 원본 접합26/26, 원본 UI48/48 독립 재실행 통과. 실제 CNC UI를 mock한 범위이며 실제 편집 보존 승인과 다름. 후속 UI 교차검사82/82(legacy28 포함), 추가 보존/단품 차단6/6, 조립12/12 및 OVVO 단품 검사 통과.
- **QA-R2-B01 / P1 / FAIL**: Chrome3003/optimizer, 초기 OVVO V-1230P·back없음·25판재. 계산→원장에 그리기→200×180mm 이름 `R2-QA 임시 타공 판재` 추가→원형 구멍 X100/Y90/Ø30mm→원장에 적용. 26판재와 새 이름 확인. Tylko clip으로 전환하자25판재로 복귀하고 해당 이름 소실. 원본 QA-L4-08은 BefunCncStore 직접 주입이라 통과하지만 실제 편집은 CNCProvider 별도 상태에 기록되는 경로. 담당: 리더(CNC/Optimizer 통합). 원인 확정 전 source 경로 교차조사 중.
- 브라우저 왕복/출력 후 알림 닫기 timeout 발생. 최초 설정 복귀는 아직 미확인. 마지막 확인: selector clip, MPR alert는 이전 OVVO connector 충돌6판재를 표시. 이 상태를 clip 차단 PASS로 처리하지 않음. 브라우저 추가 검증 진행 중.
- fingerprint: scripts/furniture-validation/r21-source-fingerprints.json. 새 검증 결과를 아래 추가 예정.

## R2.1-QA 독립 판정 — 2026-10-14 06:58 KST

**판정: 승인 보류(FAIL).** 원본 QA-L4-04/08은 수정본에서 통과했지만, 실제 CNC 편집 화면에서는 사용자 판재·가공이 접합 전환으로 소실됩니다. 제품 소스, 원본 실패 검사, 타 담당 검사를 수정하지 않았습니다. 이 차수의 독립 검증 결과이며 프로젝트 전체 완료/제조 승인/Tylko 동치 승인이 아닙니다.

### 실행 환경·코드 지문

- 실행: 기존 Chrome(extension 1) 안의 QA 전용 `/optimizer` 탭, 실행 중인 `localhost:3003`. 사용자 작업 탭을 새로고침하거나 공유 서버를 재시작하지 않음. VPN 연결 여부 자체는 **미확인**.
- 초기: OVVO / 몸통 V-1230P / 백패널 없음 / 25판재. 가로판 900×320×18mm, 세로판 282×320×18mm, 보강대 282×125×12mm. 편집 원장 1220×2440mm, PB18T. 캡처 viewport1728px 너비.
- [시작 fingerprint](../../scripts/furniture-validation/r21-source-fingerprints.json), [최종 fingerprint](../../scripts/furniture-validation/r21-final-fingerprints.json): SHA-256, 실행 시각, 중간 철회 파일 목록. QA-L4-04/08 원본 파일은 시작/종료 SHA 동일 확인.
- [사례별 판정 JSON](../../scripts/furniture-validation/r21-results.json), [캡처 목록·시각·SHA](assets/codex-qa/r2/capture-index.json). 로그의 실행 시각과 캡처별 mtime을 구분해 기록. 타 담당이 작업 중이므로 해당 fingerprint만 검증 대상으로 삼음.

### 원본 및 추가 자동 검사

| 사례 | 초기/조작·기대 | 실제·판정 | 증거 / 담당 |
|---|---|---|---|
| QA-L4-04 | 동일 판재 OVVO→clip→OVVO, 이전 clip 사유 해제 | **PASS**. 원본 그대로 26/26(독립9+리더17) | `r21-original-connectors.log` / 리더 |
| QA-L4-08 | 실제 OptimizerApp의 Befun store에 user hole 주입 후 전환 | **PASS**. 원본 UI48/48. CNC 편집 컴포넌트만 mock된 범위 | `r21-original-ui.log` / 리더 |
| QA-R2-01 | 외부 생성자 사유·출처 없는 차단을 포함해3회 왕복 | **PASS**. 외부 사유/차단 유지, clip 사유 해제 | `r21-preservation.log` / 리더 |
| QA-R2-02 | clip 상태를 JSON 직렬화/복구 후 OVVO | **PASS**. 소유권·구멍 유지; 객체 참조에만 의존하지 않음 | 같은 로그 / 리더 |
| QA-R2-03 | 실제 OptimizerApp, 구멍+슬롯+이름+수량3 변경 후 왕복 | **PASS(컴포넌트 범위)**. 패널 ID·값 보존. CNC UI는 mock, 실제 편집 경로와 다름 | `r21-optimizer.log` / 리더 |
| QA-R2-04/05 | 새 OVVO 슬롯 중심에 user hole 충돌→접합 없음 | **PASS**. 충돌 시 MPR 차단, 접합 제거 후 자기 충돌만 해제; 구멍·외부 차단 유지 | `r21-preservation.log` / 리더 |
| QA-R2-06 | clip+정상 판 혼합 및 단일판 CSV/DXF/MPR/CIX | **PASS(함수)**. success=false/files=[] | 원본 접합 로그 및 추가 보존8/8 / 리더 |
| QA-R2-REFRESH-01 | Befun store 직접 주입 구멍, clip 선택 유지 상태 remount | **FAIL / P2 / 별도 범위**. clip 선택은 남고 구멍은 사라짐. 최근 수정 보장 밖이며 아래 실제 drawing 저장 경로의 실패를 뜻하지 않음 | `r21-optimizer.log`: 1pass/1fail / 리더 persistence |

추가 검사는 기존 테스트를 약화하지 않고 별도 파일로 작성했습니다. `r21-optimizer`의 실패 assertion도 그대로 남겼습니다. R2 UI82/82 기록은 당시 어댑터 검증이며 R2.1에서 해당 어댑터가 철회됐습니다. 현재 UI 판정은 아래37개로 대체하고 과거 기록은 보존합니다.

### Chrome 핵심 실패 — QA-R2-B01 / P1 / FAIL

**재현(두 번 확인, 두 번째 캡처 보관)**

1. 위 초기 OVVO25판재에서 계산하기 → 원장에 그리기.
2. 200×180mm 판재를1개 추가. 첫 이름 `R2-QA 임시 타공 판재`, 두 번째 이름 `R21-refresh-hole`.
3. 해당 판재에 원형 구멍을 그린 뒤 X100/Y90/지름30mm 입력·Enter. 이는 편집기의 **관통 cutout**이며 커넥터 blind-slot과 혼동하지 않음.
4. 원장에 적용 → 패널목록26과 새 이름을 확인.
5. Tylko clip 선택 → 패널목록25, 사용자 판재 이름 소실. OVVO 복귀/새로고침 후에도 최종25판재.

**기대:** 자동 connector 가공만 변경, 사용자 판재·가공·이름·ID 유지. **실제:** 사용자 판재와 그 가공 전체가 목록에서 사라짐. UI에 내부 ID가 노출되지 않아 실제 브라우저 ID 보존은 미확인; 자동 컴포넌트 검사에서만 ID를 확인함.

- [추가한 구멍](assets/codex-qa/r2/user-hole-before.png), [26판재](assets/codex-qa/r2/user-panel26-before-refresh.png), [clip 전환 후25판재](assets/codex-qa/r2/user-panel-after-clip.png), [당시 DOM](assets/codex-qa/r2/user-panel-after-clip.txt).
- 원인 경로: `OptimizerApp.changeSelection`은 `useBefunCncStore`를 복제하지만, `CNCOptimizerPro`의 원장 편집 적용은 별도 `CNCProvider.setPanels(applied.panels,true)`에 저장. 접합 변경으로 `livePanelsKey`가 달라지면 userHasModified를 해제하고 `livePanels.map(toCutlistPanel)`로 덮어씀(현재536–589행). 이 경로를 수정할 담당은 **리더(CNC/Optimizer 통합)**.
- 수동 connector 슬롯 편집 UI는 이번 경로에서 확인하지 못함. blind-slot 실제 UI 보존은 **unknown**, 직접 store에 넣은 슬롯 보존만 PASS.

### Chrome 복구·출력 분리 판정

| ID | 조작·기대 | 실제 / 판정 | 캡처 |
|---|---|---|---|
| QA-R2-B02 | 새로고침한 clip25판재 계산 후 실제 MPR/CIX 버튼 | **PASS**. 각각 미확정 clip25판재를 사유와 함께 차단. 보링 CSV 버튼 disabled | [MPR AX](assets/codex-qa/r2/clip-mpr-block.txt), [CIX AX](assets/codex-qa/r2/clip-cix-block.txt), [메뉴](assets/codex-qa/r2/clip-export-menu.png) |
| QA-R2-B03 | 접합 변경 없이 편집 적용 후 새로고침 | **PASS**.26판재·이름·200×180·구멍 X100/Y90/Ø30 복구 | [복구 치수](assets/codex-qa/r2/user-hole-restored-values.png) |
| QA-R2-B04 | clip 선택 후 새로고침, 검사 종료 OVVO 복귀 | **PASS**. clip 저장 확인. 종료 시 별도 QA 탭에서 OVVO V-1230P/back없음/25판재 재확인 | [최종 복귀](assets/codex-qa/r2/final-ovvo-restored.png) |

출력 경고창은 접근성 텍스트로 캡처했습니다. alert 닫기/OVVO 전환에서 브라우저 제어 timeout이 발생했고, 한 중간 상태에서는 선택값과 이전 OVVO 충돌 알림이 불일치했습니다. 그 중간 상태를 clip 차단 PASS로 쓰지 않았습니다. 새로고침 후 별도 재현에서 정확한 clip25판재 사유를 확인했습니다. 경고창이 남은 첫 QA 탭은 종료하고 새 QA 탭에서 최초 설정을 복귀했습니다.

실제 버튼의 단일판 출력과 제조 DXF 경로는 **unknown**. 메뉴의 `CAD 도면(DXF)`는 컷팅 레이아웃 출력이므로 제조 보링 DXF 함수와 동일한 검증으로 간주하지 않습니다. 위 PASS는 실제 일괄 MPR/CIX와 보링 CSV 비활성에 한정합니다.

### HW/UI/SAVE/ASM 교차 판정

- **HW-CONTRACT-READY — 계약 PASS / 제조 unknown.** 공개 index의 PH/RH/PC/RC·guideMounts와 실제 export 일치, mm 무스케일, X_S→+Z/Y_S→+X/Z_S→+Y, 끝 하우징 반전 확인. `ovvo.r21.test.mjs` 독립 재실행 통과([로그](../../scripts/furniture-validation/r21-hardware.log)). PDF 대비 합성 비교 캡처도 읽어 PH 포크·RC 비대칭·RH 창 구조를 확인했지만 비례/내부 단면의 CAD 동일성은 승인하지 않음. R 조립15mm는 해제15mm에서 차용한 **inferred**, 언더컷은 계속 unknown.
- **ASM-CONNECTED — 연결/설명용 시퀀스 PASS.** `GuideScene`에서 HW 공개 모듈 import 및 자체 Housing/Connector 제거를 독립 확인. 새 조립24/24 재실행, 두 접합점 변환·0/0.5/1 샘플·역탐색 검사 통과([로그](../../scripts/furniture-validation/r21-assembly.log)). 실제 Chrome에서 R7단계 슬라이드/P6단계 압입을 같은 단면 카메라에서0/50/100% 캡처, 모델 전환 시 콘솔 error0. [R0](assets/codex-qa/r2/assembly-r-slide-0.png) / [R50](assets/codex-qa/r2/assembly-r-slide-50.png) / [R100](assets/codex-qa/r2/assembly-r-slide-100.png), [P0](assets/codex-qa/r2/assembly-p-press-0.png) / [P50](assets/codex-qa/r2/assembly-p-press-50.png) / [P100](assets/codex-qa/r2/assembly-p-press-100.png). 실제 탄성·언더컷 간섭·공급사 CAD 일치는 unknown. **시각차이 QA-R2-V01:** P50%에서 상부 판재가 단계 제목 뒤로 겹쳐 가독성이 낮음(캡처 참조), 제조 실패로 분류하지 않음.
- **UI source/store PASS / 운영 마운트 unknown(미완료).** 현재 R2.1 검사37/37을 원문 복사 후 독립 실행([로그](../../scripts/furniture-validation/r21-ui-crosscheck.log)). `[18,28,38]→4행` = 본체126/표시127cm, 기존/새 handler의 행 증감·스타일 reset·깊이 하드웨어 보정 대조 포함. R2의28cm 재호출 어댑터는 현재 삭제됨. 신규 패널 실제 운영 마운트와 이번 차수의 모바일 브라우저/키보드 검증은 승인하지 않음. 정확한 `UI-STORE-CONNECTED` 신호는 조회 시 미게시, handoff source/store완료 기록은 확인.
- **SAVE 오류/로컬 fallback PASS / 실제 DB unknown.** 최신 API/DB 경계16/16([로그](../../scripts/furniture-validation/r21-save-final.log)); 실행 서버에서 미설정503·잘못된 JSON400·익명 목록401·기존 로그인/컨피규레이터200 확인([로그](../../scripts/furniture-validation/r21-save-live.log)). 없는 설계404는 configured DB test double에서만 확인, 실제 DB는 미설정으로 blocked. 상품 저장 버튼은 [서버503/이 브라우저 보관 안내](assets/codex-qa/r2/save-local-fallback.png)를 명확히 표시. `/share/R2MISS01`은 [서비스 미준비·다시 시도](assets/codex-qa/r2/share503-retry.png)를 표시하고 재시도 후에도 같은503 안내 유지. 로컬 보관 사례1개(테라코타 사이드보드110×62×32)를 만들었으며 기존 저장 자료를 임의 삭제하지 않음. `SAVE-FLOW-READY`는 조회 시 미게시, 작업 중 구현 스냅샷에 대한 선행 교차검증임.
- **CORE-01/CORE-WARDROBE — unknown.** READY 신호 미게시. 설계A/B 접합 전역 오염, 새 공통 복구, Edge/Tone 실제3D 연결은 이번 결과에서 PASS로 승격하지 않음.

### 재실행·인계

명령/범위는 `scripts/furniture-validation/README.md`의 R2.1 절 참조. 산출물은 `r21-*.log`, `r21-results.json`, fingerprint2개와 위 캡처. 제품 소스/AGENTS.md/공유 .next/환경설정/실제 DB/다른 담당 문서는 수정하지 않았습니다.

리더는 **QA-R2-B01**을 수정한 뒤 같은200×180/X100/Y90/Ø30 사례로 재검증을 요청해야 합니다. 컴포넌트의 QA-L4-08 통과만으로 해당 P1을 닫으면 안 됩니다. 실제 편집 persistence(B03 PASS)와 직접 Befun store remount(REFRESH-01 FAIL)를 구별하세요. 미게시 READY 산출물 및 이후 fingerprint 변경분은 후속 검증 대상입니다.

### 종료 직전 추가 확인

- 제품 소스는 위 최종 확인 시점까지 변하지 않았고 SAVE 담당의 검사 파일만 보강됨. 새 SAVE17/17을 다시 실행해 통과(`r21-save-updated.log`). 별도 프로세스의 실제 generated Prisma client/auth adapter import·미설정 접근 guard도 통과(`r21-save-import.log`), 실제 DB 왕복을 뜻하지 않음. 앞의16/16은 과거 실행 기록으로 보존.
- 최종 fingerprint를 갱신하고 실제 편집 `sheetDrawing.ts`/CNCProvider 및 실행한 새 검사 파일도 포함. QA 신규 실행기·보존 검사 ESLint 통과.
- 이번 차수 QA 잠금 해제. 사용자 편집 손실 P1은 열린 상태이고, 제품 수정/재승인은 리더의 같은 사례 수정본 대기.


## R3-QA 수신·착수 — 2026-10-14T08:08:51.897167+09:00

- 실제 담당: 현재 사용자 대화의 codex-assistant QA. team-tasks의 QA 세션 식별자는 `01a133e8-8c93-7352-9af8-96cd31ba2af9`이며 런타임 ID 직접 조회는 하지 않음. 사용자 직접 전달로 수신 확인.
- 잠금: `scripts/furniture-validation/r3*`, `docs/handoffs/codex-assistant-validation.md`, `docs/handoffs/assets/codex-qa/r3/**`. 제품 소스 및 기존 R2/R2.1 검사·fingerprint 수정 금지. R3 개별 허용 범위에 따라 수신은 이 문서에 기록.
- 착수: 신규 R3 독립 장다리 검사·결과·fingerprint. CAD 연결 작업은 이번 지시에 따라 보류, 해당 제품 소스 수정하지 않음.
- 초기 기준 불일치: 지시서 28/32행과 legs-001.json의 [28,28]은 별도 사례로 검증.63→73 기대값을 두 입력에 무조건 적용하지 않음.
- 최신 사용자 규칙: Classic/Natural 장다리 허용 및 silver/black. 과거 문서의 재질 제한은 현재 실패 기준으로 사용하지 않음. 깊이24/Pixel 제한은 유지.
- 조회 시 UI-LIVE-READY/SAVE-BASE-READY/CNC-PRESERVE-READY 게시 없음. QA-R2-B01/QA-R2-REFRESH-01 OPEN 보존. 기존 완료 R2.1 검사를 반복하지 않음.

### R3 독립 단계 제출 — 2026-10-14T08:15:37.437977+09:00

**판정: 조건부 / 전체 승인 보류.** 제품 소스 수정 없음. 기존 R2.1 완료 검사를 반복하지 않았고 원본 QA 파일21개 SHA 동일. 신규 검사: `node scripts/furniture-validation/r3-legs.mjs`; 상세 입력/좌표/기대 출처/결과는 `scripts/furniture-validation/r3-results.json`, `r3-legs-results.json`.

| 사례 | 입력·조작 | 기대 / 실제 | 판정·남음 |
|---|---|---|---|
| R3-QA-LEG-01 | Grid110/28·28/32/Solid, Standard→Legs; 정면·바닥·입체45° | 실제Chrome63→73cm, 바닥6다리. 내부축 정렬 통과. Tylko Board/Grid/Columns2/110×73×32에서도 육안6다리 | 구현 pass / 정밀 레퍼런스 unknown |
| R3-QA-LEG-01-alt | 지시서의28·32행 | 내부계산67→77cm. JSON28·28행의63→73과 다름 | 기준 문서 불일치; 두 입력 혼합 금지 |
| R3-QA-LEG-02 | 새 Pattern89cm/32depth/37%와90cm/40depth/37%, 각28·32행 | 각4다리, 하단 세로축·앞뒤쌍·중복없음. 실제Chrome Pattern110/32에서Legs73 유지 | 내부정합 pass / 신규3설정 화면동치 unknown |
| R3-QA-LEG-03 | 새 Mosaic181/40/61%/18·38행 |8다리 내부정렬 pass. 실제Chrome 별도110/40/50%73cm→depth24 Standard63/Legsdisabled | 구현 pass / 원본DNA·정밀인셋 unknown |
| R3-QA-UI-01 | 운영 패널 교체 전후 관찰 | 검증 중 구 버튼명→새group/aria-label로 HMR 교체; 일시 로딩 후복구. 최종READY 미게시 | blocked: 두URL/390px/키보드/외부복구 최종검증 대기 |
| R3-QA-SAVE-01 | 동일 자기 사례 저장→복구→재저장 | SAVE-BASE-READY 미게시. 이번 실제DB 미검증 | blocked; 이전DB미설정/모의검사로 통과승격 없음 |
| R3-QA-CNC-01 | 원본200×180/X100/Y90/Ø30, OVVO→clip2회 | CNC-PRESERVE-READY 미게시 | blocked; QA-R2-B01 OPEN, 원본26→25 증거보존 |
| R3-QA-CNC-02 | 직접Befun store구멍 remount 및 제조차단 | 리더수정본 대기 | blocked; QA-R2-REFRESH-01 별도OPEN |

- 레퍼런스 URL: https://tylko.com/en-de/furniture/sideboard/4665612,j . 기존 VPN Chrome에서 **QA 새 탭만** 조작. 최초Plywood/200×63×40→Board→Grid→폭110→깊이32→BackOn→Legs→Columns3→2. 새 Grid UI는 Density 대신 Columns이므로 Density50 동치를 단정하지 않음. 도어설정까지 같다고 주장하지 않음. 원본초기상태 `assets/codex-qa/r3/reference-initial.txt`, 대응상태 `reference-grid2.txt/jpg`.
- 캡처: `assets/codex-qa/r3/grid-{front,bottom,perspective}.jpg`, `pattern-live.jpg`, `mosaic-live.jpg/txt`, `depth24.txt`. 입체 카메라 소스direction[1,.7,1]의 수평45°. 화면픽셀의 원근상 어긋남과 내부축오차를 구분. 레퍼런스 깊이인셋·DNA override·제조값은null/unknown.
- HW LEG-VISUAL-READY 수신 후 새 `legs/longLeg.test.mjs`를 독립 실행, pass(`r3-hardware.log`). 계약과 FurnitureLegs의cm×100/clone/공유geometry소유 일치 확인. 나사·핀·키홀 실물치수/형상은미확정. 원본GLB사용을 제조승인으로 해석하지 않음. ASM READY 미게시.
- 검사: 새 r3-legs.mjs ESLint통과. 격리 `/private/tmp/befun-r3-qa-t9lq9cxb` webpack build/전체TypeScript exit0. 최초GoogleFonts DNS차단 후승인된 네트워크 재실행통과. 기록 `r3-build*.log`, `r3-build-snapshot.json`. 종료시 동시변경hardware/index.ts는 해당빌드승인밖(`r3-live-drift.json`). 공유.next/서버 보존. 전체lint는 이번 실행하지 않음.
- 수정 파일: 신규 `scripts/furniture-validation/r3*`, 본handoff, `docs/handoffs/assets/codex-qa/r3/**`만. 제품소스/타담당 인계/원본실패기준 수정 없음. `r3-original-preservation.json`, `r3-evidence-fingerprints.json`에증거해시.
- R3-QA-INDEPENDENT-READY: 독립결과 제출. UI-LIVE-READY/SAVE-BASE-READY/CNC-PRESERVE-READY 뒤 후속수행 필요. 이번신규QA파일·캡처 잠금해제, 후속재검증시재등록. 미완료항목을완료로처리하지 않음.
