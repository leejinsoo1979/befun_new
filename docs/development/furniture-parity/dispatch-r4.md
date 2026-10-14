# R4 — 실제 책상·옷장 진입과 통합 후속 지시

2026-10-14. 이 문서는 아래 범위에서 R1~R3의 대기 지시보다 우선한다. 기존 수정은 보존한다. 현재 화면의 작업자는 Claude 2명+Codex 3명이며, 리더까지 총 6명이다. 원래 5인 체제에 추가된 맨 오른쪽 조립·배포 담당도 이번 배정에 포함한다. 화면이 바뀌었다면 아래 역할·세션명으로 식별한다.

## 현재 상태와 공통 계약

문제는 상품 목록에서 책상을 누르면 사진 페이지만 나오는 것이었다. 리더가 `/reference-product/desk-1..3`을 실제 편집기에 연결하고 3개 원본의 크기·색·수납 구성을 반영했다. 옷장 카탈로그는 아직 같은 정적 경로에 남아 있다. 새로운 생성기나 복원 형식을 만들지 말고 아래 구현을 사용한다.

- `src/lib/furniture/design.ts`: FurnitureDesign, createFurnitureDesign, parseFurnitureDesign, furnitureDesignHref. Desk/Edge/Tone의 실제 저장·검증 계약이다.
- `src/lib/furniture/desk-panel.ts`, `wardrobe-panel.ts`: view/intent를 실제 디자인 상태에 연결한다. 공통 필드/옵션 범위 변경은 리더가 맡는다.
- `src/components/furniture/FurnitureConfigurator.tsx`: 공통 실제 편집기. 선택적 title과 initial 디자인을 받는다.
- `src/app/(storefront)/[...segments]/page.tsx`: catalogFurnitureDesign(id)가 반환되면 편집기를 표시하고 미지원 ID는 기존 레퍼런스 페이지를 유지한다. 이 route는 리더 소유다.
- `src/lib/furniture/catalog-design.ts`: 상품별 확인된 초기값 연결. 쇼핑몰 담당에게 위임한다. 기존 책상 3개를 보존한다.
- `docs/handoffs/desk-wardrobe-integration.md`, `desk-catalog-entry.md`: 완료·미완료 및 실제 검사 범위. 기존 CORE 미게시 대기를 반복할 이유가 없다.

모든 담당은 AGENTS.md/CLAUDE.md/team-tasks 최신 절과 본인 인계를 읽고 수신시각·작업중인 파일을 append한다. 본인 범위 안에서 확인된 결함은 바로 수정한다. 타 담당 파일은 재현과 필요한 인터페이스를 남기고 소유자가 수정한다. 근거 없는 제조 치수·모든 경우 동치·실제 주문 가능 주장 금지. 독립 코드 검증과 브라우저/원본 비교는 각각 보고한다.

## 왼쪽1 — Claude 하드웨어·그래픽 / claude-graphics

**우선순위:** 진행 중인 CSG 성능 개선을 끝내고, 책상 외형 문제의 원인을 측정한다. 다른 담당이 만든 모델을 다시 만들지 않는다.

1. 현재 geometry.ts의 면별 group 재정렬과 CSG 캐시/220ms 지연 변경을 마감한다. 슬라이더를 빠르게 조작한 후 마지막 치수의 구멍이 표시되는지, 이전 비동기 작업이 새 geometry를 덮어쓰지 않는지 확인한다.
2. 기존 source 판재/문에서 구멍 형상, 재질 면 번호, 사용자 타공, 개폐·자원 해제가 유지되는지 확인한다. source 형상과 최적화 결과를 비교해 증거를 남긴다. FPS는 전원/viewport/가구 설정/패널 수를 함께 기록한다.
3. `/reference-product/desk-1`, `desk-3`과 해당 사례 원본을 비교한다. 합판 엣지가 거친 줄무늬로 보이는 원인을 face mapping/texture scale/material 중 어디인지 좁힌다. 원본 base/edge hex는 유지한다. 재질 관련 본인 파일에서 해결 가능한 부분만 수정하고 DeskPanel/DeskModel/FurnitureScene 수정은 리더에게 구체적 패치를 요청한다.
4. 다리·경첩·서랍 레일 차이는 같은 시점/크기의 캡처와 부품 ID로 기록한다. 사진 비례로 제작 치수를 확정하지 않는다.

**수정 허용:** 기존 본인 `src/lib/three/blum/geometry.ts`, `useBoredBox.ts`; 이미 맡은 `Panel.tsx`/`Door.tsx`의 훅 연결부; `src/lib/three/materials.ts`, 기존 본인 hardware 파일·검사·`docs/handoffs/claude-2-hardware.md`. 루트 3D 씬·카메라·광원·배치/생성기 미수정.

**완료 기준:** CSG 정확도 회귀, 빠른 변경의 마지막 상태, 생성/해제 검사, 변경 lint. 책상 외형은 수정 전후 캡처와 남은 차이 제출. 완료 시 `R4-HW-READY`를 기록한다.

## 왼쪽2 — Claude 옵션 UI / claude-optimizer (claude-1-ui)

**우선순위:** 미리보기에서 끝내지 말고 이미 연결된 실제 책상/옷장 패널을 수정한다.

1. `/reference-product/desk-1`, `/furniture-design/desk-modern`, `/furniture-design/wardrobe-edge`, `/furniture-design/wardrobe-tone`에서 외형/내부 구성을 직접 조작한다.
2. 구획 선택→내부 탭→도어 방향/수납 구성 변경→다른 구획 선택 시 선택 표시와 값이 실제 구획을 따라가는지 확인한다. 모델별로 숨김/비활성인 항목이 클릭·키보드로 변경되지 않는지 확인한다.
3. 너비·다리 공간·높이 입력의 포커스, 취소, 연속 조작, 외부값 갱신을 검사한다. 공급된 min/max/step/nullable step 의미를 보존한다. 원본에서 확인되지 않은 단위나 임계값을 UI에 새로 하드코딩하지 않는다.
4. 390px와 데스크톱에서 긴 색상명, 스와치, 구획 선택, 탭, 선택 테두리, 스크롤을 확인하고 overflow/포커스 문제를 수정한다. 키보드만으로 네 제품군 모두 핵심 옵션을 변경할 수 있어야 한다.

**수정 허용:** `src/components/ui/furniture-panels/**`, 본인 UI 테스트와 `docs/handoffs/claude-1-ui.md`. 공통 타입/상태 adapter/FurnitureConfigurator/모델은 리더 소유. adapter 값이 잘못되었으면 입력·기대·실제·controlId를 첨부해 요청한다.

**완료 기준:** 네 실제 경로, 데스크톱/390px, 키보드, 구획 전환 재현표와 변경 검사. Preview 통과를 실제 연결 완료로 바꾸지 않는다. `R4-UI-READY` 기록.

## 왼쪽3 — Codex 쇼핑몰 연결 / codex-storefront

**우선순위:** 옷장도 목록에서 실제 편집기로 들어가게 한다. 기존 책상 연결의 재구현은 하지 않는다.

1. referenceCatalog의 wardrobe-1/2/3에서 실제 source URL을 읽는다. 열려 있는 VPN Chrome을 이용해 각 원본의 제품군(Edge/Tone), 너비·높이·깊이, 구획 수, 각 layout/facade/도어 방향, 내외부 색, 손잡이·서랍 구성을 기록한다. 원본 사이트 사용자 저장/장바구니는 변경하지 않는다.
2. 기존 `docs/tylko-reference/cases/category-wardrobe-*`와 동일 사례인지 대조한다. 사진 제목이나 이름만 보고 Edge/Tone을 결정하지 않는다. 근거 없는 초기값은 기본 Edge 디자인으로 대체하지 않는다.
3. 확인한 초기값을 `catalog-design.ts`에서 FurnitureDesign으로 반환하도록 확장한다. parseFurnitureDesign 왕복이 값과 구획 ID를 보존해야 한다. 원본 3종 중 표현 불가능한 구성이 있으면 source 값/누락 필드를 리더에게 먼저 보고하고, 가능한 다른 상품 연결은 계속한다.
4. 현 서버 route는 이미 같은 함수를 사용하므로 실제 옷장 편집기가 표시되는지 확인한다. 카탈로그 문구도 실제 지원 상태와 일치시킨다. 원본 이미지는 임의 다른 가족의 사진으로 교체하지 않는다.
5. 카테고리→각 상품→한 옵션 변경→로컬 저장/URL 공유→새로고침 복원을 검사한다. 기존 책상3종 regression도 실행한다. 계정/장바구니를 지원한다고 표시하지 않는다.

**단독 수정 허용:** `src/lib/furniture/catalog-design.ts`, `src/components/storefront/referenceCatalog.ts`, `ReferenceCatalogPages.tsx`, `scripts/furniture-integration/catalog.test.mjs`; 신규 `cases/wardrobe-catalog-*.json`, 대응 screenshots, `docs/handoffs/codex-storefront-integration.md`. `FurnitureConfigurator.tsx`, 공통design/생성기/모델/route 수정은 리더 요청으로 남긴다.

**완료 기준:** 3개 각각 supported/blocked와 원인을 구분, 실제 경로 캡처·입력·복원 결과, 변경 lint/회귀 검사, `R4-ENTRY-READY` 기록. 가격/결제/DB/배포 변경은 맡지 않는다.

## 왼쪽4 — Codex 독립 검증 / codex-assistant-validation

**우선순위:** 개발자가 잘못된 진입 경로를 놓치는 문제를 독립적으로 잡는다. 연결 구현이 끝나기를 기다리는 동안 책상부터 검사한다.

1. `/furniture-c/desk`에서 사진/상품명/3D 편집 링크 각각으로 진입한다. desk-1/2/3의 초기 크기, 재질, 수납열, 다리 공간이 사례 `desk-catalog-entry-001`과 일치하는지 확인한다. Intro 경로만 검사하고 통과로 보고하지 않는다.
2. Classic/Modern에서 너비·깊이·수납열·다리 공간·도어/서랍·색상 변경 후 URL/로컬 저장 복원을 검사한다. 내부 구획 stable ID, 선택 상태, 새로고침, 범위 경계와 조작 순서를 기록한다. 테스트용 디자인을 사용하며 사용자 저장 디자인을 덮어쓰지 않는다.
3. 옷장은 새 카탈로그 연결 전 `/furniture-design/wardrobe-edge`와 Tone의 실제 편집 흐름을 검사한다. R4-ENTRY-READY를 확인한 후 3개 목록 경로를 추가 재검증한다. 연결 미완료와 생성기 결함을 분리한다.
4. UI 담당 결과와 그래픽 담당 결과를 같은 입력에서 독립 재현한다. 390px·데스크톱, 하드리로드, 탭/구획 전환, WebGL 오류를 기록한다. 서버 계정/DB 저장은 로컬 성공과 구분한다.
5. FAIL은 URL, 전체 입력/초기 상태, 조작 순서, 기대값 근거, 실제값, 캡처·로그·오너와 함께 공유한다. 원본 fixture를 통과하도록 변경하지 않는다.

**수정 허용:** 신규 `scripts/furniture-validation/r4-*`, `docs/handoffs/assets/codex-qa/r4/**`, `docs/handoffs/codex-assistant-validation.md`와 본인 상태 append. 제품 소스·원본 fixture 읽기 전용.

**완료 기준:** pass/fail/unknown/blocked가 분리된 결과와 재현 명령, 책상3종·옷장2제품군·카탈로그옷장 연결 후 결과. `R4-QA-READY`는 검증 보고 제출이며 전체 동치 승인 의미가 아니다.

## 왼쪽5 / 맨 오른쪽 — Codex 조립 안내·배포 / codex-assembly

**식별:** 기존 세션 `01a13548-3202-7aa2-8a54-0ff6840d3f75`, 앱 작업명 `Log in`. 새 작업자를 만들거나 기존 실행을 중단하지 않는다.

**우선순위:** 사용자가 직접 요청하여 이미 착수한 양면 라미네이트·자작 엣지·분해 시뮬레이션을 먼저 마감한다. 기존 배포 요청도 유지하되 대기 중인 배포 때문에 구현 작업을 멈추지 않는다.

1. OVVO 시연 판재의 넓은 앞뒤 면은 같은 라미네이트, 절단면은 자작나무 적층 엣지로 표현한다. 판재 회전·분해 후에도 면 배정과 결 방향이 유지되는지 정면/후면/단면 캡처로 검증한다. 공용 materials.ts를 덮어쓰지 않고 본인 시연 재질 안에서 수정한다.
2. 선택한 OVVO 모델의 공식 해제 가능 여부와 순서를 확인하여 분해 동작을 구현한다. 모델별로 다른 해제 방식을 혼용하거나 단순 역재생을 공식 절차로 표시하지 않는다. Tylko 클립·다리 해제 절차와 분리한다. 확인하지 못한 이동 거리·타공·내부 형상은 제조용 확정치로 기록하지 않는다.
3. 기존 OVVO P/R, Tylko 5단계, 백패널 7단계, 다리 원본 5단계 안내를 회귀 검사한다. 재생→일시정지→탐색→초기화→주제/접합 방식 변경 시 이전 부품과 애니메이션이 남지 않아야 한다. 반복 조작의 geometry/material 해제도 확인한다.
4. 이미 구현한 정적 다리 GLB 관찰과 원본 영상 안내를 실제 정밀 기구 시뮬레이션 완료로 보고하지 않는다. 원본으로 확인된 동작, 설명용 시연, 미확인 제조 치수를 인계에서 구분한다.
5. 책상·옷장 실제 디자인을 조립 안내에 전달할 때 필요한 최소 입력 계약을 제안한다. 기존 FurnitureDesign과 공통 생성 결과를 읽고, 부품 ID·접합 방식·치수·선택 상태 중 현재 전달되지 않는 필드를 구체적으로 기록한다. 별도 가구 생성기/저장 형식을 만들지 않는다. 제품 쪽 진입 버튼·공통 계약 연결은 리더에게 요청하고, 그 대기 중 위 1~4를 완료한다.
6. 기존 재게시 요청은 독립 게시 사본에서 이어간다. Git 반영, build 통과, 업로드, QUEUED, 운영 READY를 구분하고 commit/deployment ID·포함/제외 변경을 기록한다. 다른 프로젝트의 빌드 취소는 별도 사용자 응답 전 실행하지 않는다. R4 진행 중 파일을 임의로 안정본에 포함하지 않는다.

**단독 수정 허용:** 현재 잠금 중인 `src/components/assembly-guide/**`, `src/lib/assembly-guide/**`, `docs/assembly-guide.md`, 본인 신규 `docs/handoffs/assets/codex-assembly/material-disassembly/**`. 추가 테스트·자산 파일이 필요하면 먼저 정확한 경로를 team-tasks에 기록한다. 기존 배포 인계는 본인 상태만 갱신한다. 공통 가구 모델/상태/타입, 하드웨어 원본, CNC·타공, 공용 재질, 공유 .git은 수정하지 않는다.

**완료 기준:** 변경 면 배정의 전후 캡처, 모델별 근거와 분해 동작, 기존 안내 회귀, 데스크톱/390px 조작, 변경 검사 결과 및 미확인 항목을 제출한다. `R4-ASM-READY`는 이번 안내 수정 완료이며 실제 주문 가구 전체 조립·제조 승인 의미가 아니다. 배포 상태는 별도로 보고한다.

## 리더의 통합 책임과 중간 점검

리더는 원본 해석·생성 규칙·공통 상태/복원·DeskModel/WardrobeModel/Scene·route를 직접 맡는다. 각 담당 첫 인계가 들어오면 수정 파일/근거/동작을 확인하고, 공유 타입이 필요한 요청은 실제 구현하여 전달한다. UI·하드웨어 단품이 완성되었다는 이유로 작업자를 대기시키지 않는다.

순서: 다섯 담당이 기존 사용자 직접 요청을 보존하며 독립 진행 → 첫 재현/근거 보고 교차검토 → 소유자 수정 → 실제 상품 경로에 통합 → 독립 QA → 같은 실패 사례 재검증 → 안정본 격리 build. 진행 중 최신 소스를 무단 배포하거나 다른 담당의 미완료 수정을 완료본에 섞지 않는다.

## 전달 상태와 복사해서 전달할 문장

리더가 Codex 두 기존 작업에 메시지 전달을 시도했으나 active writer 충돌로 실패했다. Claude 두 창 역시 자동 수신 확인이 없다. 따라서 현재는 **문서 배정 완료·수신 대기**이다. 아래 문장을 기존 각 창에 전달하고, 담당자의 수신 기록으로 착수를 확인한다.

- 왼쪽1: `docs/development/furniture-parity/dispatch-r4.md의 왼쪽1 Claude 하드웨어·그래픽 지시를 수행하세요. 현재 CSG 작업부터 마감하고 책상 외형 차이까지 확인하세요. 수신과 결과를 본인 인계에 남기세요.`
- 왼쪽2: `docs/development/furniture-parity/dispatch-r4.md의 왼쪽2 Claude 옵션 UI 지시를 수행하세요. 실제 책상/Edge/Tone 경로에서 조작·모바일·키보드 문제를 수정하세요. 수신과 결과를 본인 인계에 남기세요.`
- 왼쪽3: `docs/development/furniture-parity/dispatch-r4.md의 왼쪽3 Codex 쇼핑몰 연결 지시를 수행하세요. 기존 공통 편집기를 사용해 옷장 카탈로그3종을 원본 초기값으로 연결하세요. 수신과 결과를 본인 인계에 남기세요.`
- 왼쪽4: `docs/development/furniture-parity/dispatch-r4.md의 왼쪽4 Codex 독립 검증 지시를 수행하세요. 책상 실제 카탈로그 경로부터 지금 검사하고 옷장 연결 후 재검증하세요. 제품 소스는 수정하지 마세요.`

- 왼쪽5 / 맨 오른쪽: `docs/development/furniture-parity/dispatch-r4.md의 왼쪽5 codex-assembly 지시를 확인하세요. 현재 진행 중인 양면 라미네이트·자작 엣지·모델별 공식 분해 동작을 먼저 완료하고 기존 조립 안내를 회귀 검증하세요. 책상·옷장 실제 디자인 연결에 필요한 입력 계약을 리더에게 남기세요. 기존 배포는 상태를 따로 보고하고, 다른 프로젝트 빌드는 승인 없이 취소하지 마세요. 수신·파일 잠금·근거·검증·미완료 항목을 본인 인계에 기록하세요.`

### 최신 수신 정정
team-tasks 후속 기록에서 왼쪽3 storefront와 왼쪽4 QA의 R4 수신·착수를 확인했다. 앞의 직접 전달 실패 기록은 이력을 보존한 것이다. 왼쪽5는 사용자 직접 요청인 조립 시뮬레이터 수정에 이미 착수했으며, 이번 R4 추가 지시 자체의 수신 여부는 별도 확인한다.
