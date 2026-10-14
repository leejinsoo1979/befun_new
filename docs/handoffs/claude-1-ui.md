# Claude-1 / R1-UI 진행·인계

기준: [5인 개발 계획](../development/furniture-parity/README.md), [공통 계약 R1.2](../development/furniture-parity/contracts.md).

## 착수

- 실제 세션명: Claude Code CLI 세션 (이전 작업명 claude-optimizer — CNC 옵티마이저·OVVO 커넥터 담당)
- 수신/착수 시각: 2026-10-13 21:40 KST 수신·착수
- 상태: 진행 중
- 적용 계약 버전: R1.2 (문서 계약; `src/types/furniture.ts` 미게시 → preview 타입은 `furniture-panels/types.ts`에만 둠)
- 수정/잠금 파일: 신규 `src/components/ui/furniture-panels/**`, 이 문서. 그 외 소스 수정 없음.

## 첫 산출물과 진행 — 1단계: Edge/Tone 옷장 패널 (2026-10-13 22:xx)

- 수행 내용: 공통 계약 R1.2의 `FurniturePanelView` → 렌더, 사용자 조작 → `FurnitureEditIntent` 경계를 따르는 독립 패널을 구현. 값·범위·step·선택지·순서·visible·enabled·선택 구획은 모두 props(view)로 받고, 계산·clamp·store 접근은 하지 않음.
- 변경 파일(모두 신규, 잠금 범위 내):
  - `src/components/ui/furniture-panels/types.ts` — preview 타입(리더 타입 게시 시 교체 대상)
  - `src/components/ui/furniture-panels/FurniturePanel.tsx` — 진입 컴포넌트(탭·구획 선택·구획 요약·컨트롤 순서 렌더)
  - `src/components/ui/furniture-panels/controls.tsx` — slider / choice(pill·tile) / swatch / heightMode / action / notice / layout(캐러셀)
  - `src/components/ui/furniture-panels/panels.module.css` — 패널 전용 스타일(전역 CSS 수정 없음, Befun `--green` 사용)
  - `src/components/ui/furniture-panels/index.ts`
  - `src/components/ui/furniture-panels/preview/wardrobeFixtures.ts` — 관찰 사례 → view(PREVIEW)
  - `src/components/ui/furniture-panels/preview/WardrobePanelsPreview.tsx` — intent→view 재생 하네스(PREVIEW, 리더 상태 전이 대체 아님)
  - `src/components/ui/furniture-panels/preview/__verify__/panels.test.tsx.txt` — 검증 테스트 원본(프로젝트에 test runner가 없어 .txt로 보관)
  - `docs/handoffs/assets/claude-1-ui/*.png` — 화면 증거
- 사용한 근거 사례 ID: `category-wardrobe-edge-001…005`, `category-wardrobe-tone-001…009`, `docs/tylko-reference/wardrobe.md`, 각 사례 reference PNG의 우측 패널.

### 구현한 항목(관찰 순서 그대로)

| 패널 | 탭 | 항목 순서 |
|---|---|---|
| Edge | 외형 | 너비(40–600) · 높이(138–300, 점 표시, 천장 안내) · 깊이 27/36/45/60 · 구획 안내(156cm) · 상단 테두리 있음/없음 · 마감 도장/합판/우드룩 · 색상 11 |
| Edge | 내부 구성 | 구획 선택(1 / 구획 2) · 내부 배치 캐러셀 · 전면 오픈/중간 오픈/하단 오픈/닫힘 · 케이블 통로 +추가 · 문 방향 왼쪽/오른쪽(전면 오픈 시 숨김) · 기둥 높이 · 구획 깊이 27/36/45/60 |
| Tone | 외형 | 너비(40–600) · 높이 200/237/높이+ ↔ 기본 + 238–360 슬라이더 · 깊이(40–80) · 측정 안내 링크 · 조명 없음/내부(내부 시 후면 4cm 안내) · 외부 색상 3 · 내부 색상 5 |
| Tone | 내부 구성 | 구획 너비 요약 · 내부 배치 캐러셀 · 서랍 내부/외부(레이아웃 변경 안내) |

### 관찰 / 추정 / 미확인

- 관찰: 위 항목·순서·초기값·aria 범위·선택지, edge-002→003→004 문 방향 숨김/복귀, tone-001→002→003 높이+ 238 / 기본 237, tone-006→007 조명 4cm 안내, tone-004→005 서랍 외부 전환.
- 추정(화면 근사, 표시용): 스와치 색은 사례 PNG 픽셀 샘플(색명·재질값 미측정), 배치 썸네일 도식, Edge 높이 점 위치.
- 미확인(값을 지어내지 않음): 모든 슬라이더 step → `null`(입력 step="any"); 천장 높이 안내는 관찰값(198→208, 238→248)만 표시하고 나머지는 "리더 계산값 필요"; Tone 구획 너비는 너비100→94만 표시; Edge 구획 추가 후 UI, 배치 전체 목록, 숨김 시 값 보존 여부, 모바일 원본 레이아웃.

## 검증

- 실행 명령·환경: scratch 작업 공간에서 vitest 3 + jsdom + @testing-library/react(프로젝트 package.json 변경 없음), React는 프로젝트 node_modules 사용. 화면은 esbuild 정적 번들 + 헤드리스 Chrome(DPR 2). `tsc --noEmit` 0, `eslint src/components/ui/furniture-panels` 0.
- 결과: 17/17 pass
  - Edge 외형·내부 순서, 구획 2 기본 선택
  - edge-002→003→004 문 방향 숨김/복귀
  - 구획 조작 intent가 선택 구획 ID만 대상으로 함, 구획 2 변경 후 구획 1 값 불변
  - 전역 슬라이더 global target·숫자 값, step 미확인 시 step="any"
  - 같은 값 재선택 시 intent 없음
  - Tone 외형 순서, 높이+ 238–360 / 기본 237, 조명 4cm 안내 표시·해제, 서랍 외부 intent
  - hidden 미렌더, disabled 시 intent 차단·사유 표시, 비활성 옵션 화살표 건너뜀
  - 탭 role=tab/aria-selected·화살표 이동·포커스, 라디오 roving tabindex, PREVIEW 표시
- 화면/구조 비교 경로: `docs/handoffs/assets/claude-1-ui/ui-appearance.png`, `ui-interior.png`, `ui-states.png`(전면 오픈→문 방향 숨김, 높이+, 조명 내부), `ui-narrow.png`(뷰포트 340px). 레퍼런스: `docs/tylko-reference/screenshots/category-wardrobe-*-reference.png` 우측 패널.
- 좁은 화면: 뷰포트 340/900px 모두 가로 넘침 없음. 전면 타일 4개 한 줄, 깊이 4개 한 줄.
- 미검증 범위: 실제 3D·store 연결(리더 view/intent 미게시), 스크린리더 실기기, 터치 드래그, Tylko 모바일 패널과의 대조(원본 모바일 미관찰), 원본과 픽셀 단위 시각 비교(브랜드 색·글꼴이 다름).

## 연결 요청 (리더)

| 요청 ID | 문제/사례 | 현재 | 제안 | 영향 |
|---|---|---|---|---|
| UI-01 | 공통 타입 | preview 타입 `furniture-panels/types.ts` | `src/types/furniture.ts`에 `FurniturePanelView`·`FurnitureEditIntent` 게시 시 이 파일의 구조(컨트롤 kind 7종, ControlTarget global/section, heightMode intent)를 참고. 게시 후 UI가 import를 교체 | 리더, UI |
| UI-02 | view 계산 | 사례 고정 fixture | 제품군·선택 상태별로 `FurniturePanelView` 계산 함수 제공(범위·노출·활성·이유 포함). 천장 높이 안내·Tone 구획 너비 등 표시값도 view에 포함 | 리더 |
| UI-03 | intent 적용 | preview 하네스가 관찰 결과만 재생 | `applyFurnitureIntent(state, intent)` 상태 전이. heightMode extended/standard → 238/237, 전면 오픈 시 문 방향 값 보존 여부 결정 | 리더 |
| UI-04 | 연결 위치 | 미연결 | `configurator/page.tsx`·`MobileConfiguratorPanel.tsx`에서 제품군이 옷장일 때 기존 StyleSelector/DimensionPanel 대신 `<FurniturePanel view onIntent onSelectSection />` 렌더. 탭은 내부 상태(또는 activeTabId 제어) | 리더 |
| UI-05 | 미리보기 확인 경로 | 라우트 없음(허용 범위 밖) | 필요하면 dev 전용 라우트에서 `WardrobePanelsPreview` 렌더 | 리더 |
| UI-06 | 미확인 값 | step null, 배치 목록 일부 | step·배치 전체 목록·구획 추가 후 UI 관찰 시 사례 ID와 함께 view에 반영 | 리더/검증 |

## 2단계: 제품군별 profile 확장 (2026-10-13)

### 구현
- 추가 컨트롤/레이아웃(preview 타입 `furniture-panels/types.ts`):
  - `stepper` — value, canDecrement, canIncrement. 증감 가능 여부는 리더가 계산한다.
  - slider `displayValue` — 표시 문자열. `null`이면 값 pill을 숨긴다.
  - slider `numberInput` — 숫자 직접 입력. Enter 또는 blur에서만 intent를 보낸다.
  - choice 선택지 `imageUrl`/`activeImageUrl` — 스타일 아이콘. 기존 `public/imgs/icon` 파일을 쓴다.
  - 아이콘 추가 — style-minimal/hanging/legs, handle-grip/push.
  - view `layout` — `single`은 탭 없이 한 목록, `steps`는 단계 이동 버튼(aria-current=step)과 h4 섹션을 한 화면에 표시, `tabs`는 기본값.
- 제품군 profile 8종(`preview/familyFixtures.ts`, 하네스 `preview/FamilyPanelsPreview.tsx`). 표의 순서는 관찰 순서 그대로다.

| profile | 레이아웃 | 항목 순서 | 근거 사례 |
|---|---|---|---|
| original-row | single | 스타일·밀도·너비·높이(인덱스 0–9, 표시 cm)·깊이 24/32/40·뒷판·마감·색상 | category-bookcase-001 |
| original-column | single | 스타일(Frame 포함)·너비·높이·깊이 24–50·받침 발/소켈·뒷판·마감·색상 | category-sideboard-001 |
| original-column-tv-modern | single | 스타일·너비·높이·깊이·구획 스테퍼(−비활성)·받침·뒷판 안내문·마감·색상 | category-tv-stand-001 |
| desk | single | 너비·높이 73cm 고정 안내·깊이 40/50/60·수납 구획 스테퍼(−/+ 모두 비활성)·다리 공간(값 표시 없음)·뒷판 안내문·색상 | category-desk-001 |
| vinyl | single | 스타일 3종·너비·높이·깊이(24/32 비활성)·뒷판(없음 비활성)·색상 | category-vinyl_storage-001 |
| edge-low | tabs | 외형: 너비·높이·깊이 36/45/60·구획(너비 156cm 미만이면 안내문)·상단 테두리·마감·색상 / 내부 구성: 미관찰 안내 | category-sideboard-001, category-shoerack-001 |
| tone-low | steps | 스타일·크기(숫자 입력)·색상·배치(구획 수, 서랍 밀도)·요약 | category-sideboard-001, category-tv-stand-001 |
| tone-14 | steps | 크기(깊이 슬라이더 27–65, 숫자 입력)·마감 standard/premium matt·색상·구획 수 스테퍼·손잡이·요약 | category-wallstorage-001 |

### 관찰 / 추정 / 미확인
- 관찰:
  - Original 책장 스냅샷에서는 스타일 6종(Slant 포함)이 보였으나, 인벤토리 문서에는 5종으로 적혀 있다. 리더 확인이 필요하다.
  - Desk 높이는 73cm로 고정된다.
  - Vinyl은 깊이 24/32와 뒷판 없음이 비활성이다.
  - Tone14 깊이는 슬라이더다.
- 추정(preview 전용):
  - Edge 낮은 수납의 구획 스테퍼 노출 조건(너비 ≥156cm)은 94cm와 173cm 두 사례에서 추정했다. 실제 경계는 리더가 계산한다.
  - Tone 계열 서랍 밀도의 기본값.
- 미확인:
  - Original·Desk·Vinyl·Edge의 원본 색상 목록. 지금은 Befun 팔레트로 대체했고 화면에 그렇게 표시된다.
  - Edge 낮은 수납의 내부 구성 탭.
  - 모든 step 값(null).
  - Frame 스타일 아이콘. 저장소에 파일이 없어 라벨만 표시한다.

### 검증
- vitest 33/33 pass(옷장 17 + 제품군 16). 제품군 테스트는 `preview/__verify__/family.test.tsx.txt`에 사본이 있다. 검증한 항목:
  - profile 8종의 data-control-id 순서
  - Original 높이 인덱스 슬라이더의 aria-valuetext 163cm
  - Desk 고정 높이 안내, 스테퍼 −/+ 비활성, 다리 공간 값 미표시
  - Vinyl 비활성 선택지
  - 제품군별 깊이 선택지 차이
  - Tone14 숫자 입력이 Enter에서만 intent를 보냄, 스테퍼 + intent
  - steps 단계 버튼, 제목, aria-current
  - 하네스 echo
- `tsc --noEmit`에서 furniture-panels 관련 오류 0, eslint 0.
- 화면: `docs/handoffs/assets/claude-1-ui/family-900.png`, `family-340.png`, `family-steps.png`. 뷰포트 900/340px 모두 가로 넘침 없음, 콘솔·리소스 오류 없음.
- 옷장 화면은 회귀 재촬영 결과 넘침 없음.

### 연결 요청 추가
| 요청 ID | 문제/사례 | 현재 | 제안 | 영향 |
|---|---|---|---|---|
| UI-07 | 리더 타입에 필요한 구조 | preview 타입에만 있음 | `src/types/furniture.ts`에 다음을 포함해 달라: `stepper` kind, slider `displayValue`(null=숨김)·`numberInput`, 선택지 `imageUrl`/`activeImageUrl`, view `layout`(tabs/steps/single), 탭 `heading` | 리더 |
| UI-08 | 제품군 → panelProfileId 매핑 | fixture id 8종 | 리더 registry에서 제품군·하위 모델별 profile id를 확정한다. 특히 Original Classic과 Modern의 구획 스테퍼 차이, Edge 수납과 옷장의 구분이 필요하다 | 리더 |
| UI-09 | 스타일 목록 불일치 | 스냅샷에서는 Slant 포함 6종, 인벤토리는 5종 | 사례를 재확인한 뒤 view options에 반영 | 리더/검증 |
| UI-10 | 미확인 색상 목록 | Befun 팔레트로 대체 | 원본 색상 목록을 관찰하면 swatch options로 전달 | 리더/검증 |

## 3단계: 리더 2차 검토 반영 (2026-10-13, R1.3)

### 변경
- **공통 타입 전환:** `furniture-panels/types.ts`를 `export type * from '@/types/furniture'` 한 줄로 바꿨다. 패널 내부 import 경로는 그대로이고, 이 파일에서 타입을 새로 정의하지 않는다.
- **UI-REVIEW-002 (P1):**
  - `SliderInput`의 draft 상태를 없앴다. 표시값은 항상 view 값이다. 그래서 pointercancel, 거절·보정된 값, 제품 교체 뒤에도 다음 렌더에서 view를 그대로 따른다. pointercancel은 intent를 따로 만들지 않으며, 이미 보낸 intent를 취소한다는 뜻으로도 해석하지 않는다.
  - **리더 연결 조건:** intent를 받으면 같은 렌더 주기에 새 view를 내려줘야 드래그 중 thumb가 따라온다. 비동기·디바운스로 적용하면 thumb가 이전 값으로 튄다.
  - `NumberField`: 입력 중에 외부 값이 바뀌면 입력하던 글자를 버리고 view 값을 보인다.
  - `ControlView`의 key에 `panelProfileId`를 넣었다. 제품이 바뀌면 같은 controlId라도 새로 마운트되어 이전 제품의 입력 상태를 쓰지 않는다.
- **UI-REVIEW-003 (P2):**
  - `entryIndex`를 추가해 Tab 진입점을 정한다. 선택값이 활성이면 그 항목, 아니면 첫 활성 항목, 전부 비활성이면 진입점이 없다.
  - Choice, Swatch, Layout, HeightMode 프리셋에 같은 규칙을 적용했다.
  - 진입점만 바꾸고 aria-checked는 바꾸지 않는다.

### 검증
- vitest 43/43 pass. 기존 33개에 검토 재현 10개를 더했다. 검토 재현 테스트의 사본은 `preview/__verify__/review.test.tsx.txt`.
  - 드래그 → pointerCancel(blur 없음) → 범위가 바뀐 새 view를 주면 새 값·max·aria-valuetext가 표시되고 추가 intent는 없다.
  - 같은 view를 다시 주면(거절) 원래 값으로 돌아간다.
  - 숫자 입력 999 → 보정된 600 view를 주면 600이 표시된다.
  - 입력 중 외부 값이 바뀌면 글자를 버리고, 그 뒤 blur해도 intent가 없다.
  - profile A→B(같은 global controlId) 뒤 blur해도 A에서 입력한 값으로 intent를 보내지 않는다.
  - 미선택 + 첫 옵션 비활성, 선택값 비활성, 선택값 활성, 전체 비활성, 진입 후 화살표로 비활성 건너뛰기를 확인했다.
- 실제 Chrome에서 Edge 너비를 드래그했다. 동기 echo 하네스에서 드래그 중 값이 118 → 249 → 391 → 534로 따라오고 값 pill도 일치했다.
- 옷장·제품군 화면은 900/340px 재촬영에서 넘침 없음, 리소스 오류 없음.
- `tsc --noEmit`에서 furniture 관련 오류 0, eslint 0.
- **한계:** 재현 테스트는 수정한 코드로만 실행했다. 수정 전 코드에서 실패하는지는 따로 돌리지 않았고, 소스 분석으로만 판단했다.

## 4단계: 접합 방식(OVVO / Tylko 클립) 미리보기 — terminal-instructions 왼쪽2 (2026-10-14)

이 단계는 **미리보기 사례만** 만들었다. 통합 완료가 아니며, 실제 상태 연결·저장·가공 반영과 옷장 생성은 리더 담당이다.

### 구현
새 view 필드나 타입은 만들지 않았다. 기존 choice/notice view와 `set` intent만 사용했다.
- 신규 파일: `preview/connectorFixtures.ts`, `preview/ConnectorPanelPreview.tsx`.
- 기존 Original 행 선반 profile의 컨트롤을 그대로 재사용하고, 그 뒤에 접합 방식 컨트롤을 덧붙였다.
- **현재 방식:** `connectorSystem` choice로 표시한다. id와 라벨은 공통 `@/types/connectors`의 `PANEL_CONNECTOR_SYSTEMS`를 쓴다.
- **검증된 모델 선택 가능 여부:**
  - OVVO: `connectorBody`/`connectorBack` choice로 표시한다. 선택지는 옵티마이저 카탈로그 `OVVO_CONNECTORS`이고, `autoApplicable` 값을 그대로 option.enabled로 쓴다. 카탈로그를 복제하지 않았다. 현재 V-Clasp가 비활성이다.
  - Tylko 클립: `clipModel` 컨트롤 전체가 비활성이고 사유("검증된 클립 모델 없음 — 품번·치수 미확정")를 표시한다. 선택지인 검정/주황(구형)/은색은 PDF connector-clip-003 p2에서 관찰한 색이다. 선택값은 null이다.
- **가공 상태:** `machiningStatus` notice로 표시한다.
  - OVVO: "선택 모델 가공 생성 대상(옵티마이저 기준)" 또는 "모델 미선택 — 접합 가공 없음".
  - 클립: 공통 문구 `CLIP_SPEC_PENDING`을 그대로 쓴다.
- **방식 전환:** OVVO 모델 컨트롤은 숨김(visible=false)만 하고 값은 지우지 않는다. 미리보기 하네스는 값을 그대로 반영(echo)한다.

### 검증
- vitest 49/49 pass(기존 43 + 접합 방식 6). 사본은 `preview/__verify__/connector.test.tsx.txt`. 확인한 항목:
  - 컨트롤 순서.
  - OVVO 모델의 활성 여부가 카탈로그 autoApplicable과 1:1로 일치.
  - 클립 전환 시 OVVO 모델이 숨겨지고, 클립 모델 전체가 비활성(tabIndex -1, aria-checked false)이며 사유와 가공 미확정 문구가 표시됨.
  - 스타일·깊이·마감·너비·백패널 모델을 바꾼 뒤 클립으로 전환하고, 클립 방식에서 색상을 바꾼 뒤 OVVO로 복귀해도 모든 값과 이전 OVVO 모델(V-1230R·PD20) 선택이 유지됨.
  - 방식 전환 intent는 `connectorSystem` set 1건뿐.
  - 키보드 화살표로 방식 전환, 모델 "없음" 선택 시 "가공 없음" 표시.
- 실제 Chrome(900/340px): 넘침 없음, 리소스 오류 없음. 방식 라디오에서 ArrowRight를 누르면 Tylko로 전환되고 포커스도 이동함.
- 화면: `docs/handoffs/assets/claude-1-ui/connector-ovvo-900.png`, `connector-clip-900.png`, `connector-clip-340.png`.
- tsc에서 furniture-panels 관련 오류 0, eslint 0.
- 미검증: 실제 상태·가공(옵티마이저 MPR)과의 연동, 새로고침 후 복원. QA 담당(왼쪽4) 범위다.

### 연결 요청 추가
| 요청 ID | 문제/사례 | 현재 | 제안 | 영향 |
|---|---|---|---|---|
| UI-11 | 선택지별 비활성 사유 | `ChoiceOption`에 사유 필드가 없음. OVVO 비활성 모델 목록을 컨트롤 notice로 대신 표시 | `ChoiceOption.disabledReason?: string` 추가. 추가되면 해당 버튼 title/aria-describedby로 표시 | 리더 타입 |
| UI-12 | 가공 상태 강조 | notice 한 종류만 있어 "생성됨"과 "미확정"의 시각적 구분이 없음 | `NoticeControl.tone?: 'info' \| 'warning'`을 두고 미확정을 경고 색으로 표시 | 리더 타입 |
| UI-13 | 방식 전환 시 값 보존 규칙 | 미리보기에서는 값을 보존하고 숨김만 함 | 리더의 `applyFurnitureIntent`에서 `connectorSystem` 전환이 다른 필드를 바꾸지 않도록 하고, 이전 OVVO 자동 가공 제거와 사용자/힌지 가공 보존 정책을 view에 반영 | 리더 |
| UI-14 | 노출 위치 | 일반 구매자 패널에 노출할지 미정 | 관리자/옵티마이저 전용이면 view에서 visible=false로 제어(UI 수정 불필요) | 리더/사용자 |

## R2-UI: 기존 선반 실제 상태 연결 (dispatch-r2.md 왼쪽2) — **R2.1로 대체됨**

> 이 절의 setHeight 연결과 `legacyShelfAdapter.ts`는 R2.1 지시로 철회·삭제되었다. 아래 R2.1 절이 현재 상태다.

- **R2 ID / 수신:** R2-UI. 2026-10-14 06:25 KST 수신, claude-optimizer 세션(Claude Code CLI).
- **상태:** 상태 연결 완료 / 운영 마운트 대기. 옷장·제품군 미리보기 기록은 그대로 유지한다.

### 실제 수정 파일
- 신규 `furniture-panels/legacy/legacyShelfAdapter.ts`: `buildLegacyShelfView`, `applyLegacyShelfIntent`, 허용값 상수.
- 신규 `furniture-panels/legacy/LegacyShelfPanel.tsx`: 공개 입구 컴포넌트.
- `furniture-panels/index.ts`: export 1줄 추가.
- `preview/__verify__/legacy.test.tsx.txt`, `README.md`, 검사 환경 사본(`vitest.ui.config.ts.txt`, `setup.ts.txt`, `next-image.tsx.txt`).
- `docs/development/furniture-parity/contracts.md`: R2-UI 항목 아래에 구현 게시 1줄.
- 수정하지 않은 것: stores, types/furniture.ts, 운영 page, 가격, 생성기, StyleSelector/DimensionPanel/DensitySlider/BackPanelToggle.

### 구현
- **사용법:** `import { LegacyShelfPanel } from '@/components/ui/furniture-panels'` 후 `<LegacyShelfPanel onResult?={(intent, result) => …} />`. props 없이 동작한다.
- **구독:** `useShelfStore`의 width·height·depth·thickness·style·density·hasBackPanel·rowHeights·numRows를 개별 selector로 구독한다. 상태를 복사하거나 persist하지 않는다.
- **허용값·순서:** 운영 패널을 그대로 따른다.
  - 스타일: StyleSelector 순서·아이콘
  - 밀도: 0–100, step 1
  - 너비: 30–450, step 1
  - 높이: DimensionPanel과 같은 행 수 1–10. 표시는 두께 + Σ(행 높이 + 두께) + 조절발 1cm
  - 깊이: 24/32/40
  - 뒷판: 없음/있음
- **intent 적용:**
  - `set` + global + 화이트리스트 ID만 받는다.
  - 값 검증: 너비·밀도는 유한한 숫자, 높이는 1–10 정수, 깊이는 24/32/40, 스타일은 6종, 뒷판은 on/off.
  - 통과하면 해당 setter 하나만 호출한다. 범위 보정은 store setter가 한다.
  - 실패하면 아무 setter도 호출하지 않고 `{applied:false, reason}`을 돌려준다.
- **높이:** `setHeight(heightForRows(n))`만 쓴다. store의 `recalculateRows`는 기존 rowHeights 길이 안에서 행 수를 센 뒤에 12행까지 채운다. 그래서 초기 상태(배열 4개)에서 행을 늘리면 첫 호출로는 numRows가 늘지 않는다. 이 경우 채워진 배열로 `setHeight`를 한 번 더 호출한다. 아래 UI-15 참고.

### 검사
검사 명령과 환경은 `preview/__verify__/README.md`에 있다.
- **vitest 77/77 pass.** 이 중 R2-UI 28개는 실제 store를 사용한다.
  - 운영 패널과 대조: StyleSelector를 렌더해 스타일 순서 일치, DimensionPanel을 렌더해 깊이 선택지와 높이 표시값 일치.
  - 패널 → store: 너비·밀도·높이(초기 4행에서 6행으로 증가 후 2행으로 감소)·깊이·스타일·뒷판.
  - store → 패널: 외부 setter 변경이 즉시 표시됨. store가 보정한 값(너비 9999 → 450)도 그대로 표시됨.
  - 무변경 16개 사례: 미지원 type/action/heightMode, 구획 대상, 미지원 컨트롤, 문자열·NaN·Infinity, 높이 0/11/2.5, 깊이 33/문자, 스타일 frame, 뒷판 값. setter 호출 0회, shelf·hardware store 동일. 실제 store로 일괄 적용해도 무변경.
  - 관련 없는 상태 보존: 스타일·밀도를 바꿔도 색상(useMaterialStore), 하드웨어(useHardwareStore), localStorage(접합 선택 등)가 그대로.
  - 키보드: 진입점은 현재값이고 화살표로 실제 store가 바뀜.
- **실제 Chrome(esbuild 번들, 900/340px):**
  - Tab과 화살표만으로 6개 항목을 모두 변경(style slant, density 51, width 92, rows 5, depth 40, back on).
  - 외부에서 `setWidth(250)` 호출 시 즉시 표시.
  - 340px에서 터치 탭으로 스타일 변경.
  - 넘침 없음, 오류 0.
  - 화면: `docs/handoffs/assets/claude-1-ui/legacy-900.png`, `legacy-340.png`.
- **tsc·eslint:** tsc에서 furniture-panels 관련 오류 0, eslint 0.
- **격리 빌드:** 저장소 사본(공용 `.next` 미사용)에서 `next build --webpack` 통과(exit 0). 같은 시점 작업 트리에 있던 다른 담당 변경도 함께 빌드된 결과다.

### 기존 store의 정당한 보정 (어댑터 규칙 아님)
- 깊이: `setDepth`가 `reconcileHardware`를 실행한다. 예를 들어 깊이 24cm에서는 서랍 행이 정리되고(서랍 [1] → [], 문 [0] 유지) 이것이 기록된다.
- 높이: `setHeight` → `recalculateRows` → `reconcileHardware`. 줄어든 행의 하드웨어가 정리된다.
- 너비 30–450, 높이 38–228cm, 깊이 24–40, 밀도 0–100은 store가 clamp한다.

### 남은 차이 / 연결 요청
| 요청 ID | 내용 | 담당 |
|---|---|---|
| UI-15 | `recalculateRows`가 rowHeights를 채우기 전에 행 수를 세서, 배열이 짧으면 `setHeight` 한 번으로는 행이 늘지 않는다. 어댑터가 재호출로 우회하고 있다. store에서 먼저 채운 뒤 세도록 고치면 재호출이 필요 없다. 운영 DimensionPanel은 `setState`로 직접 써서 이 문제를 피하고, 채우는 기본값도 store(28)와 달리 32를 쓴다. | 리더(stores) |
| UI-16 | 운영 StyleSelector는 스타일을 바꿀 때 `useHardwareStore.reset()`도 호출한다. 어댑터는 지시대로 `setStyle`만 호출하므로 스타일을 바꿔도 문·서랍이 유지된다. 운영과 동작이 다르다. 스타일 전환 시 하드웨어를 초기화할지는 리더가 정책을 정해 store 또는 마운트 쪽에 반영해야 한다. | 리더 |
| UI-17 | 운영 마운트: `configurator/page.tsx`·`MobileConfiguratorPanel`에서 StyleSelector + DensitySlider + DimensionPanel + BackPanelToggle을 `<LegacyShelfPanel />`로 교체. 라벨이 영어에서 한국어로 바뀌므로 사용자 확인이 필요하다. 색상·마감 컨트롤은 이번 범위 밖이라 기존 컴포넌트를 유지한다. | 리더(page) |

## R2.1-UI: 기존 동작 공유 handler + 실제 선반 상태 연결 (assignments/02-ui.md)

- **R2.1 ID / 수신:** R2.1-UI. 2026-10-14 수신, claude-optimizer 세션(Claude Code CLI).
- **상태 (따로 보고):**
  - source/store 연결: 완료.
  - 운영 마운트: 미완료(리더 담당).
  - Tylko 동치: 확인하지 않음. 이번 범위가 아니다.

### 실제 수정 파일
- 신규 `furniture-panels/legacy/actions.ts`: `setLegacyRowCount`, `setLegacyStyle`, `applyLegacyShelfIntent`, 허용값 상수.
- 신규 `furniture-panels/legacy/view.ts`: `buildLegacyShelfView`, `legacyDisplayHeight`.
- `furniture-panels/legacy/LegacyShelfPanel.tsx`: 공유 handler를 사용하도록 재작성. `controls` prop 추가.
- 삭제: R2에서 만든 `legacy/legacyShelfAdapter.ts`. 철회된 setHeight 경로다.
- `furniture-panels/index.ts`: export 추가.
- **위임 범위 수정 (handler 본문만):**
  - `DimensionPanel.tsx`: `handleRowCountChange` 본문을 `setLegacyRowCount(Math.max(1, Math.min(10, Math.round(newCount))))` 한 줄로 교체하고 import를 추가했다.
  - `StyleSelector.tsx`: `handleStyleChange`를 `setLegacyStyle`로 교체하고, 쓰지 않게 된 setStyle·resetHardware selector와 useHardwareStore import를 정리했다.
  - CSS·마크업·모바일 레이아웃은 바꾸지 않았다.
- 검사: `preview/__verify__/legacy-r21.test.tsx.txt`(R2의 `legacy.test.tsx.txt`는 삭제), README 갱신.
- 캡처: `docs/handoffs/assets/claude-1-ui/r2/legacy-panel-390.png`, `ops-after-1440.png`, `ops-after-390.png`.
- 수정하지 않은 것: stores, types, page, 가격, 생성기, 옷장 fixture. 옷장 fixture는 미리보기 전용이며 운영 생성기로 쓰지 않는다.

### 공유 handler (기존 동작 그대로)
- **`setLegacyRowCount(count)`**
  - 1–10 정수만 받고, 아니면 아무것도 하지 않는다.
  - 기존 rowHeights를 복사하고 부족할 때만 32cm 행을 추가한다.
  - `height = thickness + Σ(rowHeight + thickness)`.
  - rowHeights·numRows·height 세 필드만 한 번에 setState한 뒤 `reconcileHardware()`를 호출한다.
  - setHeight는 쓰지 않는다. 줄였다가 다시 늘려도 보관된 행 높이가 유지된다.
- **`setLegacyStyle(style)`**
  - 지원하는 6종만 받는다.
  - `setStyle` 후 `useHardwareStore.reset()`을 호출한다. 기존 StyleSelector 효과 그대로다.
  - **같은 스타일 재선택 시 차이:** 기존 버튼은 재클릭하면 이 함수를 다시 호출해 문·서랍이 초기화된다. FurniturePanel은 같은 값 재선택에 intent를 내지 않아 상태가 바뀌지 않는다. 새 삭제 동작은 추가하지 않았다. 재선택 시 reset을 없앨지 등 보존 정책은 리더 판단 사항이다(UI-16 유지).
- **`applyLegacyShelfIntent(intent)`**
  - `set` + global + 화이트리스트 ID만 받는다: `legacy.style/density/width/rowCount/depth/backPanel`.
  - 값 검증:
    - density 0–100, width 30–450: 유한한 숫자.
    - rowCount: 1–10 정수.
    - depth: 24/32/40.
    - style: 6종.
    - backPanel: on/off.
  - 통과하면 setLegacyStyle, setDensity, setWidth, setLegacyRowCount, setDepth, setHasBackPanel 중 하나를 호출한다.
  - 실패하면 `{applied:false, reason}`을 돌려주고 상태를 바꾸지 않는다.
- **view:** panelProfileId는 `befun-legacy-shelf`. 높이 슬라이더 값은 행 수이고, 표시값은 본체 높이 + 조절발 1cm(DimensionPanel과 동일)다. 이는 Tylko 실제 노출 높이를 확정한 값이 아니며, footHeight 교정은 리더 후속이다.

### 필수 재현 사례
검사 방법은 `preview/__verify__/README.md`에 있다. vitest는 86/86 pass이고, 이 중 R2.1 실제 store 검사가 37개다. preview 검사 49개는 이름을 바꾸지 않고 별도로 유지했다.

| ID | 결과 |
|---|---|
| UI-R2-01 | pass. [18,28,38]에서 3→4행: [18,28,38,32], 본체 126cm, 표시 127cm. 1행(22cm)도 38cm로 clamp되지 않음. |
| UI-R2-02 | pass. 4→2→4행에서 행 높이가 보관되어 [18,28,38,32]·126cm로 복귀. 3행의 문은 기존 규칙으로 정리되고 다시 늘려도 복원되지 않음(기존 동작). 18cm 행에는 기존 규칙상 문을 둘 수 없음. |
| UI-R2-03 | pass. 운영 DimensionPanel 슬라이더와 새 패널에 같은 초기값(문/서랍 포함)과 행 수 1/2/4/7/10을 넣으면 shelf·hardware·material 스냅샷이 동일. 표시 높이도 동일. |
| UI-R2-04 | pass. 문/서랍이 있는 상태에서 기존 버튼과 새 패널로 Mosaic 선택 시 스냅샷이 동일(하드웨어 reset 포함). 재질 유지. 같은 스타일 재선택 차이는 위에 기록. |
| UI-R2-05 | pass. 깊이 40→24 결과가 store `setDepth` 직접 호출과 동일(reconcileHardware). 색상·너비 불변. |
| UI-R2-06 | pass. 사용자 입력 뒤 외부에서 width 333·density 12로 바꾸면 즉시 표시. 그 뒤 pointercancel·blur가 와도 이전 입력이 되덮지 않음. 외부 setRowHeights도 반영. |
| UI-R2-07 | pass. 20개 사례에서 store 무변경: Infinity/NaN/범위 밖/문자열 width, density NaN·101, rowCount 0·11·2.5·Infinity, depth 33·빈 문자, style frame, backPanel 값, 이전 R2 ID, 미지원 컨트롤, section·action·heightMode·applyPreset. 모두 `applied:false`와 사유를 반환. |
| UI-R2-08 | pass. vitest: 키 1회에 store 1회 기록, 포커스 유지, 라디오 진입점은 현재값. 실제 Chrome 390px: 키보드로 3→4행(126cm, 표시 127cm, 기록 1회, 포커스 유지), Escape로 되돌아가지 않음, 너비 드래그 중 pointercancel 후 표시값과 store 일치(240), 커밋 후 값 튐 없음, 외부 density 즉시 반영, 넘침 없음, 오류 0. |

- **운영 화면 회귀 (3003 dev, 실제 Chrome):** handler를 추출한 뒤에도 DimensionPanel 행 수가 4→5→3행, 123→157→93cm로 동작하고, StyleSelector의 Mosaic 선택이 반영된다. 1440px와 390px 모바일 탭 모두 확인, 페이지 오류 0.
- **tsc·eslint:** `tsc --noEmit --incremental false` 오류 0. 변경 파일 eslint 0.
- **격리 빌드:**
  - 1차(controls prop 추가 전 작업 트리): 저장소 사본에서 `next build --webpack` 통과(exit 0).
  - 2차(최종 반영본): **실패(exit 1).** 원인은 다른 담당 소유 파일 `src/components/assembly-guide/GuideScene.tsx:158`의 타입 오류("A spread argument must either have a tuple type…")다. R2.1-ASM이 작업 중인 파일로 보인다. 내 변경 파일은 tsc·eslint 오류 0이다. 해당 파일은 수정하지 않았고, 조립 담당이 수정하면 재빌드가 필요하다.
  - 3차(06:50, GuideScene 06:48 수정본 포함): 여전히 실패(exit 1). 같은 오류가 `GuideScene.tsx:159`로 위치만 옮겨졌다.
  - 4차(07:25, GuideScene 07:01 수정본 포함): **통과(exit 0).** 최종 R2.1-UI 반영본(controls prop 포함)의 격리 프로덕션 빌드를 확인했다.
- **QA 교차검증 참고:** codex-assistant-validation.md:137의 'UI 82/82(legacy28 포함)'는 철회된 R2 `legacy.test.tsx`(setHeight 경로, 삭제됨) 기준이다. R2.1 검사는 `preview/__verify__/legacy-r21.test.tsx.txt` 37개이고, 전체는 86개다. R2.1 기준으로 재검증을 요청한다.

### 리더 마운트 인계
- **import:** `import { LegacyShelfPanel } from '@/components/ui/furniture-panels';`
- **데스크톱:** `src/app/configurator/page.tsx` 우측 패널의 `<StyleSelector /> <DensitySlider /> <DimensionPanel /> <BackPanelToggle />` 네 줄을 `<LegacyShelfPanel />` 한 줄로 바꾼다. 6개 제어를 포함한다.
- **모바일:** `MobileConfiguratorPanel.tsx`의 탭별 교체.
  - style 탭: `<LegacyShelfPanel controls={['legacy.style','legacy.density']} />`
  - size 탭: `<LegacyShelfPanel controls={['legacy.width','legacy.rowCount','legacy.depth']} />`
  - option 탭: BackPanelToggle을 `<LegacyShelfPanel controls={['legacy.backPanel']} />`로 바꾼다. 같은 탭의 다른 요소는 그대로 둔다.
- **상품 상세:** `storefront/ProductConfigurator.tsx:139`에도 같은 네 컴포넌트가 있다. 담당(codex-storefront)과 조율이 필요하다.
- **그대로 남길 것:** PriceDisplay(가격), ColorPicker(색상·마감), 구매 버튼, 행 팝업(RowControls·FloatingBox·핫스팟), AR·보기 도구, 상단 제목.
- **바뀌는 점:** 라벨이 영어(Style/Density/Width/Height/Depth/Back panels)에서 한국어로 바뀐다. 운영 슬라이더의 hover −/+ 버튼과 `?` 도움말 버튼은 FurniturePanel에 없다. 사용자 확인이 필요하다.
- **마운트 후:** 같은 화면에서 UI-R2-03/04(기존과 같은 결과)와 3D 반영을 다시 확인해야 한다. 리더가 연결한 뒤 내가 재검증할 수 있다.

### 남은 차이 / 요청
- UI-15: store `setHeight`/`recalculateRows`의 짧은 배열 문제. R2.1에서는 setHeight를 쓰지 않으므로 이 어댑터에는 영향이 없다. store 자체 이슈로만 남긴다.
- UI-16: 스타일 변경·재선택 시 하드웨어 reset 보존 정책은 리더 판단 사항이다.
- UI-18 (신규): 새 행 기본 높이가 store `recalculateRows`는 28cm, 공유 handler(기존 DimensionPanel)는 32cm로 다르다. 기존 동작을 유지했으며, 통일할지는 리더 판단이다.

## R3-UI: 높이/Feet 동기화 + 운영 패널 직접 마운트 (assignments/r3/02-ui.md)

- **수신:** 2026-10-14 08:05 KST, claude-optimizer 세션(Claude Code CLI). R2.1 증거는 위에 그대로 보존한다.
- **착수 잠금:** `furniture-panels/**`, `FeetSelector.tsx`(이번에 수정 안 함), `MobileConfiguratorPanel.tsx`, 그리고 `ProductConfigurator.tsx`·`app/configurator/page.tsx`의 패널 import/JSX 영역만.
- **충돌 회피:** 리더의 'Natural 장다리 Silver/Black' 임시 잠금(FeetSelector·legFinish)이 진행 중이었다. 그 잠금 문서가 "다른 UI 마운트는 유지"로 허용하고 있어, 마운트는 정확한 문자열 일치 치환으로만 했다. FeetSelector와 legFinish 관련 코드는 건드리지 않았다.
- **판정 (각각 별도):**
  - 구현: 완료.
  - 운영 연결: 완료. 두 URL, desktop과 390px.
  - 레퍼런스(Tylko) 일치: 확인하지 않음(범위 밖).
  - 제조 치수 확정: 해당 없음. 높이 +1/+11cm는 furniture-base의 표시값이며 제조 확정값이 아니다.

### 수정 파일
- `furniture-panels/legacy/view.ts`: `baseType`을 입력으로 받고, 높이 표시를 `baseHeight(baseType)`로 계산한다(고정 +1 제거). 라벨과 도움말 위치는 운영과 같다(Style…Back panels, `?`는 Density·Depth·Back panels).
- `furniture-panels/legacy/actions.ts`:
  - `setLegacyStyle`에서 같은 스타일 재선택을 no-op으로 통일했다. 다른 스타일 선택 시 hardware reset은 그대로 둔다.
  - 마운트 묶음 상수 `LEGACY_BEFORE_FEET`, `LEGACY_AFTER_FEET`, `LEGACY_MOBILE_TABS`를 추가했다.
- 신규 `furniture-panels/legacy/LegacyControls.tsx`: legacy 전용 렌더러.
  - 운영 패널과 같은 마크업·클래스(cfg-row, tylko-slider-wrap/pill/thumb-group/step-btn/height-markers/pill-group/help, StyleSelector 타일)를 쓴다.
  - 공용 FurniturePanel과 다른 제품 preview는 바꾸지 않았다.
  - 접근성: range에 aria-label/valuetext, 선택 버튼에 aria-pressed, group 라벨. hover용 −/+ 버튼은 range 키보드와 중복되므로 tabIndex -1로 두었다.
- `furniture-panels/legacy/LegacyShelfPanel.tsx`: `baseType`을 구독하고 LegacyControls로 렌더한다.
- `furniture-panels/index.ts`: export 추가.
- **마운트 (import·JSX만):**
  - `app/configurator/page.tsx`: StyleSelector, DensitySlider, DimensionPanel, BackPanelToggle을 `<LegacyShelfPanel controls={LEGACY_BEFORE_FEET} /><FeetSelector /><LegacyShelfPanel controls={LEGACY_AFTER_FEET} />`로 교체.
  - `storefront/ProductConfigurator.tsx:138`: 같은 방식으로 교체.
  - `ui/MobileConfiguratorPanel.tsx`: 탭별로 교체. style 탭은 Style·Density, size 탭은 Width·Height·Depth, option 탭은 Feet + Back panels.
  - 저장 handler, snapshot, 가격, cart, 공유 복구, ColorPicker(Finish/Colour), FeetSelector는 바꾸지 않았다.
- 기존 `StyleSelector`·`DensitySlider`·`DimensionPanel`·`BackPanelToggle`은 운영에서 더 이상 마운트되지 않지만 파일은 남겼다. 삭제할지는 리더 판단이다.
- 제품군 preview(옷장 Edge/Tone, Desk 등)는 그대로 preview로 보존했다. generic shelf에 연결하지 않았다.

### 사례 결과
| 사례 | 입력·조작 | 기대 | 실제 | 판정 | 증거 |
|---|---|---|---|---|---|
| R3-UI-01 | Grid·110cm·2행(28·28)·깊이32·Solid에서 Feet Legs | 63→73cm, 3D와 일치 | 패널 63→73cm(두 URL 모두). sideboard 사양 `110 × 73 × 32 cm`. 3D 치수 오버레이 73. vitest: 운영 DimensionPanel 표시와 같고 차이는 baseHeight 차이(+10)와 같음 | pass | `claude-1-ui-assets/r3/configurator-standard-dims.png`, `configurator-legs-dims.png`, `sideboard-desktop-legs-dims.png` |
| R3-UI-01 기록 | 행 28·32 | — | 본체 66cm이므로 67→77cm. 지시서의 63은 28·28행 기준 | 기록 | vitest |
| R3-UI-02 | Legs 후 깊이24 / Pixel / Classic 색상 | 화면이 store 지원 제약과 일치 | 깊이24·Pixel: Standard로 복귀, 높이 −10, Legs 비활성(브라우저 두 URL과 vitest). Classic: 08:07 현재 store 규칙(`supportsLongLegs(depth, style)`, 색상 조건 없음)으로는 Legs가 유지되고 화면도 일치 | pass(규칙은 리더가 변경 중) | `*-desktop.png`, vitest |
| R3-UI-03 | Pattern·Mosaic, 문/서랍 포함, 행 2/5/1 | 공유 handler와 같은 결과 | 운영 DimensionPanel과 새 패널의 shelf·hardware·material 스냅샷이 동일 | pass | vitest |
| R3-UI-04 | 두 URL, 1440과 390px | 중복 없음, 넘침 없음, 포커스 유지 | desktop 라벨 순서 Style, Density, Width, Height, Depth, Feet, Back panels, Finish(+Colour), 중복 없음. configurator 모바일 탭: 스타일 [Style, Density] / 크기 [Width, Height, Depth] / 색상 [Finish] / 옵션 [Feet, Back panels]. sideboard 390은 단일 목록, 같은 순서. 모두 넘침 없음. Height 슬라이더 키보드 입력 후 포커스 유지. 페이지 오류 0 | pass | `configurator-390-*.png`, `sideboard-390.png`, `*-desktop.png` |
| R3-UI-05 | 구성 일괄 복구(setState), 색상 변경, 드래그 중 외부 변경 | 즉시 반영, 오래된 드래그 값이 되덮지 않음 | 복구된 width·density·style·depth·rows·baseType가 즉시 표시. pointerup·blur 뒤에도 140 유지. Solid→Natural 색상 변경은 shelf 값과 73cm를 바꾸지 않음 | pass | vitest |
| R3-UI-06 | 기존 검사를 현재 파일로 실행 | 회귀 없음 | 96/96 pass. 기존 86개 중 legacy 37개는 운영 표현에 맞춰 selector만 바꿨다(라벨 영어화, radio→aria-pressed button). 같은 스타일 재선택 검사는 R3 지시대로 'no-op 통일'로 바꿨다. preview 49개는 그대로. R3 신규 10개 | pass | `preview/__verify__/legacy-r3.test.tsx.txt`, `README.md` |

- **검사:** eslint(변경 파일과 마운트 3파일) 0, `tsc --noEmit --incremental false` 0.
- **격리 build:** 저장소 사본(공용 .next 미사용)에서 `next build --webpack` **통과(exit 0)**. 시작 2026-10-14 08:16:09, src 소스 fingerprint `77bbbff57177934e`(ts/tsx/css shasum 합).
- **브라우저:** 3003 공유 dev 서버에서 별도 headless Chrome으로 확인했다. 사용자 VPN Chrome의 다른 탭은 건드리지 않았다. 스크립트: `preview/__verify__/r3-live-browser.mjs.txt`.

### UI-LIVE-READY
- **URL:** `/configurator`(desktop 우측 패널과 모바일 하단 탭), `/furniture/sideboard-terra`(상품 컨피규레이터).
- **export:** `import { LegacyShelfPanel, LEGACY_BEFORE_FEET, LEGACY_AFTER_FEET, LEGACY_MOBILE_TABS } from '@/components/ui/furniture-panels'`.
- **변경 영역:** 위 '마운트' 3곳의 import·JSX만.
- **유지:** FeetSelector, ColorPicker, 가격, 저장·공유, 구매, 행 팝업·핫스팟, AR·보기.
- **남은 항목:**
  - 리더의 Natural 다리 규칙이 완료되면 R3-UI-02의 Classic 조건을 다시 확인한다.
  - SAVE 담당의 baseType 복구 patch가 반영되면, 공유 링크 복구 후 높이 표시가 맞는지 다시 확인한다.
  - 다른 제품군·옷장 연결에 필요한 props는 리더의 view 계산 함수가 `FurniturePanelView`를 넘기면 바로 연결된다. 기존 preview 컴포넌트 계약 그대로다.
- **해제 잠금:** R3-UI 잠금 전체를 해제했다(team-tasks 기록). 리더 확인 후 재검증이 필요하면 다시 잠근다.

## R4-UI: 실제 책상/옷장 패널 조작 검증·수정 (사용자 전달 지시, 2026-10-14)

- **수신:** 2026-10-14 11:50 KST, claude-optimizer 세션. 잠금: `furniture-panels/**`, 본인 UI 테스트, 이 handoff, `claude-1-ui-assets/r4/**`.
- **연결 구조 확인:** 네 경로 모두 `FurnitureConfigurator`가 리더 adapter(`deskPanelView`/`applyDeskIntent`, `wardrobePanelView`/`applyWardrobeIntent`)의 view를 내 공용 `FurniturePanel`에 넘긴다. adapter·모델·Configurator는 수정하지 않았다.
- **판정 (각각 별도):**
  - 실제 경로 UI 동작: 아래 표대로 pass.
  - preview 검사: 별도로 유지했고, 실제 연결 판정과 섞지 않는다.
  - 옷장·책상 생성 규칙의 Tylko 동치: 확인하지 않음(리더 소유).

### 수정 (furniture-panels 내부만)
| 결함 | 재현 | 수정 |
|---|---|---|
| R4-FIX-1 높이 모드 전환 시 키보드 포커스 유실 | `/furniture-design/wardrobe-tone`에서 '높이 +' 버튼을 Enter → 버튼이 사라지면서 포커스가 body로 빠짐. '기본 높이'도 같은 증상 | `controls.tsx` HeightMode: 전환이 view에 실제로 반영되면 다음 조작 지점으로 포커스를 옮긴다. 확장 시 슬라이더, 기본 높이 시 선택된 프리셋. adapter가 전환을 거절하면 버튼이 남아 있으므로 포커스도 그대로다 |
| R4-FIX-2 radiogroup 안에 radio가 아닌 버튼 | '높이 +' 버튼이 프리셋 radiogroup 안에 있었음 | 프리셋만 `radiogroup`으로 묶고, 모드 전환 버튼은 같은 pill 줄의 그룹 밖에 둠(`.presetGroup`). 모양은 그대로 |
| R4-FIX-3 390px에서 한글 라벨이 단어 중간에서 줄바꿈 | '구획 내경 너/비', '다리 공간 케/이블' | `.label`에 `word-break: keep-all` 추가(어절 단위로 줄바꿈). 한 어절이 칸보다 길 때만 글자 단위로 넘김 |

### 실제 경로 재현표
1440과 390 각각 34/34 pass, 페이지 오류 0. 로그 `claude-1-ui-assets/r4/r4-keyboard-run.log`, 스크립트 `preview/__verify__/r4-real-routes-keyboard.mjs.txt`. 조작은 모두 키보드 포커스와 키 입력(Arrow, Home/End, Space, Enter)으로 했다.

| ID | 경로 | 조작 | 기대 | 실제(1440) |
|---|---|---|---|---|
| R4-E-01 | wardrobe-edge | 외형 탭에서 ArrowRight | 내부 구성 탭 선택, 포커스 이동 | 내부 구성 / focus 내부 구성 |
| R4-E-02 | 〃 | 구획 선택에서 ArrowRight | 구획 2 선택, 포커스 이동 | 구획 2 |
| R4-E-03 | 〃 | 구획 2 전면=모두 열림(Space) | 문 방향 숨김 | 숨김 확인 |
| R4-E-04 | 〃 | 구획 1로 이동 | 구획 1 원래 전면(하단 열림), 문 방향 다시 보임 | 하단 열림, 보임 |
| R4-E-05·07 | 〃 | 구획 1 문 방향=오른쪽 → 구획 2 → 구획 1 | 구획별 값 유지 | 오른쪽 유지 |
| R4-E-06 | 〃 | 구획 2로 이동 | 모두 열림 유지, 문 방향 숨김 | 확인 |
| R4-E-08 | 〃 | 구획 높이 ArrowRight×2 | 인덱스 +2, 표시 cm 갱신, 포커스 유지 | 2(198cm)→4(229cm) |
| R4-E-09 | 〃 | 너비 ArrowRight×5(연속) | +5cm, step 1, 포커스 유지 | 118→123 |
| R4-E-10 | 〃 | 너비 Home | 최소 40cm, adapter가 구획 수 보정 | 40cm, 구획 1 |
| R4-E-11 | 〃 | 너비 드래그 중 pointercancel | 표시값 = 실제 설계값(헤더 치수), 값 튐 없음 | 320 = 헤더 `320 × 198 × 60` |
| R4-E-12 | 〃 | 저장 → 너비 End → 불러오기 | 외부 복원값이 즉시 반영 | 320 |
| R4-T-01~03 | wardrobe-tone | '높이 +' Enter → ArrowRight×2 → '기본 높이' Enter | 238 + 슬라이더 포커스 → 240 → 237 선택 + 프리셋 포커스 | 일치(수정 후) |
| R4-T-04 | 〃 | 깊이 ArrowLeft | −1cm(step 1) | 53→52 |
| R4-T-05 | 〃 | 외부 색상 3번째(Space) | 선택되고 이름 표시 | 그래파이트 |
| R4-T-06 | 〃 | 내부 구성 서랍=외부 | 외부 | 외부 |
| R4-desk-1-01 | reference-product/desk-1 | 너비 슬라이더 속성 | nullable step → `step="any"`, 임의 step 없음, min/max는 공급값 | any, 90–240 |
| R4-desk-1-02 | 〃 | 너비 ArrowRight×2 | 증가, 포커스 유지 | 200→203 (step any에서는 브라우저 기본 증분) |
| R4-desk-1-03·04 | 〃 | 수납 구획 + → 다리 공간 End | 다리 공간 max = 구획 수, 값 pill 없음(displayValue null), 포커스 유지 | 0–3, End → 3 |
| R4-desk-1-05~07 | 〃 | 수납 1 구성=도어 → 수납 2 → 수납 1 | 도어 방향 표시, 구획별 값 유지 | 수납 2 '도어 · 서랍', 수납 1 '도어' 유지 |
| R4-desk-1-08 | 〃 | 도어 방향 변경 | 반영 | 왼쪽 경첩 |
| R4-desk-1-09 / modern-09 | 〃 / desk-modern | 비활성 스테퍼 click(force)·Enter | 구획 수 불변 | desk-modern 1→1(+/− 모두 비활성) |
| R4-desk-modern-01~08 | furniture-design/desk-modern | desk-1과 같은 흐름(수납 구획 1개) | 같음 | pass |

- **390px:** 같은 34개 사례 모두 pass. 네 경로의 외형·내부 구성 탭 모두 문서 가로 넘침 없음, 패널 밖으로 나가는 요소 0. 캡처 `claude-1-ui-assets/r4/final-*-{1440,390}-{appearance,interior}.png`, `final-wardrobe-edge-390-interior-viewport.png`(실제 뷰포트에서 겹침 없음 확인).
- **긴 이름과 스와치:** 'Sand+Midnight Blue'(샌드 · 미드나잇 블루) 등 긴 색 이름은 스와치 아래 이름 줄에서 줄바꿈되고, 넘침 없음. 데스크 수납 구성의 긴 옵션 8개는 pill이 여러 줄로 감김. 레이아웃 캐러셀은 ‹ › 버튼과 가로 스크롤 유지.
- **vitest:** 100/100(기존 96 + R4 4). `r4.test.tsx`는 리더의 실제 adapter와 FurnitureConfigurator와 같은 배선을 사용한다. 검사 항목: HeightMode 포커스 이동, radiogroup 구성, desk 너비 `step=any`·min/max, 다리 공간 pill 숨김·step 1.
- **eslint:** furniture-panels 0.
- **tsc:** 오류 2건이지만 모두 공유 dev 서버가 생성한 `.next/dev/types/validator.ts`(Route 타입)에 있고, 이전 리더 기록과 같다. 내 파일은 0.
- **격리 build:** 저장소 사본(공용 .next 미사용)에서 `next build --webpack` **통과(exit 0)**. 시작 2026-10-14 12:20:12, src fingerprint `aed6afa5003439e6`.

### 리더 요청 / 참고 (adapter 소유, 수정하지 않음)
- **R4-REQ-1 (desk legSpace aria):** `legSpace`는 `displayValue: null`, `unit: ''`라서 화면에는 값이 없고, 스크린리더는 숫자만 읽는다(예: '1'). 위치를 설명하는 `displayValue`(예: '수납 1 오른쪽')를 주면 aria-valuetext로 쓴다. UI에서 단위나 문구를 새로 만들지 않았다.
- **R4-REQ-2 (desk width step):** `step: null`이므로 키보드 화살표 증분이 브라우저 기본값(실측 1.5cm)이다. 원본 step이 확인되면 view에 넣어 주면 된다. UI에서 하드코딩하지 않았다.
- 조사 중 의심했던 Edge 너비 40cm에서 구획 4개가 남는 현상은 내 검사 순서 오류였다. 실제 adapter에서는 320cm(4구획)→40cm(1구획)로 정상이다.

### R4-UI-READY
- **경로:** `/reference-product/desk-1`, `/furniture-design/desk-modern`, `/furniture-design/wardrobe-edge`, `/furniture-design/wardrobe-tone`. desktop과 390px, 키보드 조작, 구획 전환 재현표 위와 같음.
- **변경 파일:** `furniture-panels/controls.tsx`(HeightMode), `furniture-panels/panels.module.css`(`.label` keep-all, `.presetGroup`).
- **해제 잠금:** R4-UI 잠금 전체 해제(team-tasks 기록).

## 다음 단계

1. ~~제품군별 profile 확장~~ — 2단계에서 완료(preview fixture 기준).
2. ~~공통 타입 전환~~ — 3단계에서 완료(R1.3 re-export).
3. 리더의 view 계산과 intent 적용이 나오면 fixture를 실제 view로 바꿔 순서·노출을 다시 대조한다.
