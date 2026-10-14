# 차이와 재검증

2026-10-13. P0=구조·배치, P1=옵션·치수·상태, P2=외관·조작. 정식 사례가 없는 항목은 재현 확정 전이다.

| ID | 차이 | 근거 / 사례 | 우선순위 | 담당 | 수정 상태 / 재검증 |
|---|---|---|---|---|---|
| D-001 | Pattern 전체 가로판으로 두 행 병합 불가 | 이전 UI 탐색 + pattern.ts 코드; 정식 사례 대기 | P0 | 리더 | 미수정 |
| D-002 | Pattern 닫힌 가장자리와 근거 없는 난수/밀도 이동 | 이전 탐색 + 코드; 정식 사례 대기 | P0 | 리더 | 미수정 |
| D-003 | Pattern 문/서랍이 평균 Grid 간격 사용 | hardware.ts 코드, UI 재현 대기 | P0 | 리더 | 미수정 |
| D-004 | Mosaic 경계판 대신 셀 전체 상자 생성 | mosaic.ts 코드, 비교 사례 대기 | P0 | 리더 | 미수정 |
| D-005 | 초기 높이112와 28cm×4행+t2 기하122 불일치 | useShelfStore 코드; 받침 포함 차이 별도 | P1 | Claude-2 감사 / 리더 통합 | 배정, 착수 미확인 |
| D-006 | 새 행 기본32와18/28/38 선택값 불일치 | DimensionPanel 코드 | P1 | Claude-2 감사 / 리더 통합 | 배정, 착수 미확인 |
| D-007 | 치수 오버레이 Mosaic 계산 누락 | DimensionOverlay 코드 | P1 | 리더 | 미수정 |
| D-008 | Pattern width≤43 뒷판 옵션 무시 | pattern-005/006/007 | P1 | 리더 | 수정·부분 재검증 완료: 30/37cm UI 및 기하 검사 통과. 43cm 경계의 Tylko 동치는 미검증 |
| D-009 | 조명/재질/톤매핑 차이 | 기존 team-tasks 그래픽 작업 | P2 | 기존 claude 담당 | 진행 중 잠금 보존, 동일 조건 재검증 대기 |

각 수정은 실제 사례 ID, 수정 파일, 구조 결과, 치수 오차/정밀도, 시각 결과, lint/build 결과, 남은 제한을 추가한다. 미확인과 실패는 완료로 변경하지 않는다.

| 추가 ID | 차이 | 사례 | 우선순위 | 담당 | 상태 |
|---|---|---|---|---|---|
| D-010 | 좁은 Pattern OFF에서 Tylko 오른쪽 보강판이 있으나 Befun은 없음 | pattern-005 | P1 | 리더 | 미수정. 정확 폭·행별 위치 조사 필요 |
| D-011 | 치수 라벨 위치/모양, 카메라·스케일·배경·재질 불일치 | pattern-005/006/007 | P2 | Codex-보조 감사 / 그래픽 담당 | 미완료. 동일 viewport1220×882이나 카메라가 달라 정량 이미지 오차 미산출 |

## D-008 검증 기록

- 수정: `src/lib/three/styles/pattern.ts` 좁은 폭 분기의 행별 뒷판 생성. 기존 전체/개별 hardware 행 계약 적용.
- 실행: `node --test scripts/tylko-pattern/back-panels.test.mjs` — 3/3 통과.
- `npx eslint src/lib/three/styles/pattern.ts scripts/tylko-pattern/back-panels.test.mjs` — 통과.
- `npm run build` — 통과.
- `npm run lint` — 실패: 수정하지 않은 DimensionOverlay.tsx의 prefer-const 1개/any 2개, Scene.tsx의 any 1개. Scene은 다른 작업자 잠금 유지. 경고15개도 존재. 전체 검사 통과로 보고하지 않는다.
- 실제 Chrome 검증: 30cm ON/OFF, 37cm ON. 칸1개·표시 내경(26/33)×38cm 일치. 정확 내부 좌표 오차는 미측정. 이미지 전체 동치는 실패/보류.
- 가격 규칙 코드는 변경하지 않았다. 실제 패널 추가로 기존 패널 기반 계산 결과가 바뀌는 영향은 있음(30cm 화면 OFF 83,200원→ON 98,400원). Tylko 가격과의 일치를 목표로 변경하지 않았다.


## Pattern 핵심 교체 후 갱신 / reference-source-002

| 차이 | 우선순위 | 담당 | 상태/재검증 |
|---|---|---|---|
| 임의 난수 배치, 밀도/행 병합/가장자리 불일치 | P0 | codex-analysis | Type02 열린 구조 수정. 3,636 수치 사례 좌표 일치; 다른 제품군 제외 |
| 칸 치수의 평균간격/20mm 추정 | P0 | codex-analysis | 실제 openings 연결. 18mm 판두께 반영. 전체 UI 표기 경계는 남음 |
| Pattern 문/서랍 평균 Grid 배치 | P0 | 리더, 후속 보조 통합 | 미해결. 정확 칸 배치와 하드웨어 규칙 연결 필요 |
| 병합 셀의 전체/행별 뒷판 | P0 | codex-analysis | motion표 적용, 좁은 폭 회귀 통과. 복합 조합 동치 미검증 |
| store20mm·발1cm vs Pattern18mm | P1 | 리더 | 미해결. 외경0.2cm 및 발 위치/높이 확인 필요 |
| 마감별 제품군 매핑 | P0 | 리더 | Type02만 검증. Type0를 동일하다고 가정하지 않음 |
| 화면 재질/카메라/조명 | P1 | claude-graphics/리더 | 수치 구조와 별도, 시각 일치 미완료 |
| 전체 lint | P2 | claude-graphics | DimensionOverlay 오류3개 해소. Scene.tsx 기존any1개 남음(타 담당 잠금) |

## Mosaic·치수·발 수정 / mosaic-001

| 차이 | 우선순위 | 담당 | 수정·재검증 |
|---|---|---|---|
| 칸을 메우는 나무 상자 | P0 | codex-analysis | 제거, 실제 셀 경계판 생성; 232/69/5×38 화면 검증 |
| OFF에서 기본 부분 뒷판 없음/보강대 가정 | P0 | codex-analysis | 설계표 기반 기본부분뒷판10개·병합/추가선반 적용 |
| 검정 치수 사각 박스 | P1 | codex-analysis | 회색 캡슐, 실제 칸내경, AO 제외; 화면 검증 |
| 내부 발의 균등 간격 어긋남 | P0 | codex-analysis | 모든 스타일 렌더 하단 부재 기준으로 변경. Mosaic288개 X/Z 비교; 다른 스타일 수치동치 미검증 |
| 240cm 초과 연속 가로판 | P0 | codex-analysis/horizontal_rules | 독립 분절 경로 구현,1216개 같은 입력 분절 비교; 전체기하 동치 아님 |
| 전체 마감/하드웨어/Mosaic 원본 생성 좌표 | P0 | codex-analysis | 미완료 |
| 조절발 원본 형상·높이 | P1 | codex-analysis | 미측정, 기존 단순 원통 형상 유지 |

## 재질 및 최신 발 제보 재검증 — 2026-10-13

| 사례 | 차이 | 우선순위/담당 | 상태 |
|---|---|---|---|
| material-source-001 | Terracotta 두 키가 서로 다른 임의 색 사용 | P1 / codex-analysis | 공개 RGB #954227로 통일; Solid/Mix/Classic 팔레트 연결·빌드 통과 |
| material-source-001 | 단색 거칠기/노이즈가 공개 LAMINATE 설정과 다름 | P1 / codex-analysis | 선반 재질별 override 적용; 공유 materials.ts 보존 |
| mosaic-001 | 같은 재질값인데 화면 밝기/음영이 다름 | P1 / claude-graphics 인계 요청 | **미완료**, 환경맵·광원·톤매핑 비교 필요; 수신 미확인 |
| material-source-001 | Natural 나뭇결 및 Classic 합판 엣지 | P1 / claude-graphics 인계 요청 | **미확인**, 같다고 선언하지 않음 |
| feet-defect-001 | Mosaic 외 스타일의 균등 발 배치 | P1 / codex-analysis | 실제 하단 세로판 입력으로 수정; 비균등 칸 회귀 통과. 다른 스타일 전체 Tylko 발 동치는 미확인 |

## 하드웨어 후속 — 2026-10-13 / 담당 codex-analysis

| 차이 | 사례 | 우선순위 | 상태 |
|---|---|---|---|
| 평균간격 기반 Pattern/Mosaic 도어·서랍 어긋남 | hardware-source-001 | P0 | 실제칸좌표로교체,204설정front경계일치 |
| Some/Max/혼합·높이/깊이제약 누락 | hardware-source-001 | P1 | 상태및UI반영,store회귀통과 |
| 앞판두께·서랍내부판규격·축오프셋 | hardware-source-001 | P1 | Type01/02renderer88규격사례일치 |
| 손잡이·힌지 세부 메시 | hardware-source-001 | P1 | 원본파일취득실패,동치미확인 |
| Classic 선택색5종뿐 | material-classic-002 | P1 | 실제UI9종반영 |
| Type01전체구조/자연목무늬/최종화면색 | material-classic-002 | P1 | 미확인범위유지 |

| 추가 차이 | 사례 | 우선순위 | 상태·재검증 |
|---|---|---|---|
| Slant393cm 가로판3장이 통판으로 남음 | slant-split-001 | P0 | 수정:6부재,최대218.1cm;분해도·CNC동일 |
| 다른스타일에분절함수미연결 | slant-split-001 | P0 | 6스타일연결;분절선oracle비교+정수폭길이검사통과 |
| 기존힌지GLB가닫힌문앞으로돌출 | hardware-ui-001 | P1 | 로컬원점등록수정;최종닫힘/열림화면재검증 |
| 소수폭Pattern240.1cm규칙공백 | slant-split-001 | P1 | 미해결. UI정수폭검사와구분 |
| 개발중간헐적흰뷰어 | hardware-ui-001 | P1 | 새로고침후재검증정상;원인확정/해결주장안함 |

## 2026-10-13 네 스타일 생성기 통합 재검증

| ID | 차이/사례 | 우선순위·담당 | 상태와 근거 |
|---|---|---|---|
| STYLE-T02-04 | Grid/Slant/Pixel/Gradient 근사 생성 | P0 codex-analysis + 내부 보조 | Type02 수정. source-001 4종, 물리 판재·front·개구부 비교 통과. Type01 제외 |
| SPLIT-SUBMM | 263.3cm의 반mm 세계좌표를 정수mm로 반올림해 분절 후보 변경 | P0 codex-analysis |18mm source판 좌표를1e-6mm 정밀도로 보존. 기존20mm 경로 보존. Pixel/Gradient 보류480사례 및 기존분절26사례 통과 |
| SPLIT-393-CORRECTION | 기존393cm Slant 축 자체가 레퍼런스와 다름 | P0 codex-analysis | `slant-split-002`: 하단208.8+184.2, 중/상229.6+163.4cm. 실제 source 전체 생성+분절 및CNC 일치. 이전 legacy축 기반 수치는 이력으로만 보존 |
| FRONT-T02-04 | 평균 간격 기준 문/서랍 위치 | P0 codex-analysis | 스타일 actual fronts를 Shelf/hardware/CNC에 연결. 고정 사례와 Pixel UI 검증; 하드웨어 외형/운동 미완료 |
| DIM-T02-04 |18mm 판·열린 가장자리·6cm미만 치수 | P1 codex-analysis | 실제 개구부 라벨 연결. 4종 UI0/100 표시 일치. 전체 가림/겹침 제거 미완료 |
| HOVER-ROW | 팝업 닫힘 후 강조 잔류/이전 타이머 간섭 | P2 codex-analysis | 공통 상태+선택행 일치 검사 수정, Chrome 재확인 |
| TYPE01-ALL | Classic/Natural 전체 생성 규칙 | P0 codex-analysis | 미완료. 실제 DNA 접근 자료 미확보, 기존 구현 보존 |
| VISUAL-ALL | 재질/조명/카메라·하드웨어 외형·모바일 | P1 담당별 조율 | 미완료. 화면16장으로 구조와 시각 차이를 분리 |
| DEV-WHITE | HMR 이후 개발viewer 흰 화면 | P1 claude-graphics 조율 | 미해결. Effects 폐기 객체 재사용 가능성, production3008 정상. 담당 잠금 파일 수정하지 않음 |

최종 회귀1435통과·lint 오류0/기존경고10·webpack build통과. 미확인 항목을 완료로 전환하지 않았습니다.


### GALLERY-001 — 상세 사진 재질 선택 부재
- 우선순위: P1 / 담당: 리더 / 사례: gallery-materials-001 및 gallery-materials-001-befun.
- 수정: 기본 컨피규레이터 갤러리에12개 원형 스와치와 재질별8장 교체·확대·키보드 조작 적용.
- 재검증:12종 URL 대응,블루/옐로 로딩 및 확대,상단slider유지,390px overflow 정상. 이 범위 수정완료. 모든 제품군·96장 개별다운로드·원본모바일 동치는미검증.

### CONNECTOR-001 — 접합 배치/양면 가공 정합
- P1 / 리더. 사례: `scripts/connector-validation/connector.test.mjs`의 짧은 접합·양면 슬롯·실제 Grid 및 54설정(레퍼런스 실측 사례 아님).
- 수정/재검증: 간격 제약·보링 보존·두께 mismatch 차단·양면/동일면 충돌 검출, MPR 제조 출력 차단. 신규11검사 통과.
- 남은 차이: 충돌 자동 재배치, 주 컨피규레이터의 커넥터 타공 표시, Tylko 고유 위치/출고 커넥터·옷장 접합은 미완료. [상세](../panel-connector-validation.md).

### INTEGRATION-002 — 신규 제품군 부품/패널 미연결
- P1 / 리더 통합, UI·graphics·storefront 보조 / 근거: 2026-10-13 23:16 사용자 화면과 [2차 소스 점검](../development/furniture-parity/leader-review.md).
- 옷장2·기타8 UI profile, ShortLeg/PlaneLeg/FullHeightHandle30은 독립 구현이나 실제 page/Shelf/Door 소비 연결 없음. 공통 UI 타입 게시, 상태·registry·적용/복구·생성기 연결 대기.
- 테스트 통과와 제품 동치를 구분한다. Tylko 모든 카테고리 동일 구현 상태가 아니다.


### GALLERY-004 / P1 / 담당 codex-analysis
- 차이: 상단 색상 변경이 상세 사진에 반영되지 않음, 외부 CDN 이미지가 Befun에서 차단됨.
- 수정: 선반·사이드보드58개 원본사진 세트를 로컬 파일로 제공하고 상단 색상과 갤러리 선택 연결.
- 재검증: gallery-materials-004-local, 로컬 사진8장/색상 전환/확대/모바일 PASS.
- 미해결: 다른 제품군, 미대응색상, 스타일별 사진 대응. 사진 촬영 속 구조는 고정이며 사용자 치수·칸배치 동일 재현 완료 아님.

### LEG-001 / P1 / 리더 — 실제 연결 부분 수정
- 사례legs-001: Feet옵션과장다리 렌더·높이+10cm·로컬저장복원 연결. 120조합 내부지지축검사 통과. source bbox를 사선다리로 해석한 오류 정정.
- OPEN: product별DNA override·정확한개수/깊이좌표 레퍼런스 대조·Classic/Natural Plinth·Tone/Desk/옷장·실물3나사/중앙핀 정밀 타공. ‘모든 다리 완전 일치’로 완료 처리하지 않음.

### GRID-TYPE01-220 — 이전 판단 (아래 정정으로 대체)
- 사례 `grid-doors-220`: Natural Grid0% 220×63×32cm. Tylko4칸·표시내경52·하단단문4장, Befun 사용자화면3칸·단문3장. legacy type01 density/spacing 경로가 원인 후보로 확인됨.
- 제품코드 수정/회귀검증 미완료. 임의 양개문 추가로 덮지 않고 type01 Grid 일반규칙부터 교정. 기존 Type02 Pattern 569mm 메모는 다른family/Grid에 무조건 적용 금지.


### GRID-TYPE01-220 정정 / P1 / 리더
- 앞의4칸 기준은 Type02 초기 구조 유지 사례. Type01 비교로 사용한 결론 철회.
- Type01 실제 mesh2398로 일반 생성기 수정:220cm/0%3칸·양개문6장. 사례 grid-type01-doors-220.972+294 source 비교,1298Type02 회귀,9다리 검사 PASS. Chrome 닫힘/열림 확인. 이 구조 차이 수정완료; 전체 스타일/제품군 완료 아님.

### DOOR-T01-HANDLE-GAP / P1 / 리더
- 사용자 Pattern110cm Natural 사진에서 문 손잡이 쪽5–15mm 누락.10/30mm 판재공제량으로30/50mm 손잡이를 축소한 원인.
- 관찰 단면·원래 앵커를 유지하도록 Door 연결 수정, 판재 크기/Blum 개폐는 보존.6개 외곽범위 검사 및 Pattern110·Grid220 닫힘/열림 확인. 사례 type01-handle-gap-pattern-110.
- 미해결: 손잡이 원본 메시의 모서리/끝단 정밀 동치,19mm 문판 채널 가공 상세. 부분 수정으로 기록하며 완전 외형 동치로 처리하지 않음.

## Desk / Wardrobe integration — 2026-10-14

담당: 리더. 구조/옵션 연결 완료 범위와 미해결 항목은 [통합 검증](../handoffs/desk-wardrobe-integration.md)에 정리했습니다. P1: Tone 서랍 물리판 최대1mm·인출거리 미확인, Desk 원본 하드웨어 메시 차이, 계정저장/제조 연결 미완료. P2: 전체 내경치수·카메라·조명·bevel 외관 차이. 재검증 완료 항목과 미확인 항목을 분리하며 전체 동치로 닫지 않습니다.
