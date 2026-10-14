# Team Tasks

에이전트별 담당 작업, 수정 파일, 진행 상태를 기록한다. 작업 시작 **전에** 항목을 추가하고, 끝나면 갱신한다.

## 규칙

1. 개발 전에 `AGENTS.md`, `CLAUDE.md`, `docs/web-analysis.md`, `docs/analysis-questions.md`를 읽는다.
2. 작업 시작 전에 아래 "진행 중" 표에 담당 범위와 수정할 파일을 기록한다.
3. 다른 에이전트가 "진행 중"으로 잡아둔 파일은 수정하지 않는다. 필요하면 아래 "조율 요청"에 남긴다.
4. 다른 에이전트의 변경 사항을 임의로 되돌리거나 덮어쓰지 않는다. 파일을 수정하기 직전에 다시 읽는다.
5. 분석 문서(`web-analysis.md`)는 분석 담당 Codex가, 소스 구현은 개발 에이전트가 담당한다.
6. 완료 후 변경 내용, 검증 결과(`npm run lint`, `npm run build`, 수동 확인), 남은 질문을 "완료" 섹션에 기록한다.

## 에이전트

| ID | 도구 | 역할 |
|----|------|------|
| `claude-1` | Antigravity / Claude | 개발 |
| `claude-2` | Antigravity / Claude | 개발 |
| `codex-dev` | Antigravity / Codex | 개발 |
| `codex-analysis` | Codex 앱 | 웹 분석 (`docs/web-analysis.md`, 질문 답변) |

자신의 ID를 정해 모든 기록에 사용한다.

## 진행 중

- `codex-storefront` / **완료·잠금 해제** / 최신 사용자 추가 지시 / 2026-10-14 10:49 KST: 제공 로고의 패널 순차 쌓임 로딩 애니메이션 착수. 추가 잠금 `src/components/ui/ConfiguratorLoading.tsx`, `src/components/ui/configurator-loading.module.css`의 연출만. 기존 로딩 담당 납품/잠금 해제 확인. SceneReady/Scene/동적로딩 마운트·ready 조건·3D/AR 및 다른 담당 소스는 보존. SVG의 원본 형태를 clip 단위 패널로 나눠 같은 로고를 완성하며 reduced-motion에서는 정적인 완성 로고 표시. 앞선 일반 검정·footer 흰색 변경은 구현/브라우저/lint·격리build 확인 완료, 이번 연출과 함께 최종 인계.

- `codex-storefront` / **완료·잠금 해제** / 사용자 제공 SVG 로고 교체 / 2026-10-14 10:44 KST: 일반 로고 검정,푸터 흰색 지시 수신·착수. 좁은 잠금: `public/imgs/icon/befun_logo.svg`,신규 `public/imgs/icon/befun_logo-white.svg`, `StorefrontUI.tsx` BrandLogo props/src만, `StorefrontFrame.tsx` footer BrandLogo variant만, `storefront.module.css` footerLogo 흰 배경/패딩 규칙만, 본인 handoff. 제공 파일의 실제 SVG 표시 영역·원본 PNG mask를 그대로 재사용하며 새 글자/심볼을 그리지 않음. 기존 기본 asset 경로를 교체해 configurator/assembly 헤더에도 같은 검정 로고가 적용되므로 해당 담당 page/scene/handler 소스는 수정하지 않음. 이전 헤더 배치·제목 제거·R3 및 다른 담당 작업 보존.

- `codex-storefront` → 리더/QA / **R3 최종 SAVE-BASE-READY · SAVE-CONSUMER-PATCH / 2026-10-14 08:29 KST / 잠금 해제**: 허용6소스+검사+handoff 완료. 현재 source와 최종 격리 build6파일 hash 일치,44/44 검사·변경lint0오류·전체lint0오류/기존7경고·최종webpack/type/static generation 통과. Chrome Standard/Mosaic·Legs/Pattern 로컬 저장/목록/복구/새로고침/재저장 및 Classic→Natural/Black 유지 확인. 실제503과mock200,불완전200의 이전링크제거/무효config 복구거부 분리. 읽기 전용 configurator 수동12행 DTO/legacy URL/이전링크 초기화 patch는 `scripts/storefront-save-validation/r3-consumer.patch`에 게시(dry-run·별도preview tsc 통과),**리더 운영 적용 대기**. 실제DB왕복만 환경 미설정blocked. 자세한6사례·함수 exports·source fingerprint·캡처는 `docs/handoffs/codex-storefront-integration.md`의 R3 최종 인계. 아래 R3 착수/1차 READY의 잠금 유지 표시는 과거 기록이며 이번 최종 기록으로 해제.

- `codex-storefront` → 리더/QA / **SAVE-BASE-READY · SAVE-CONSUMER-PATCH 1차 게시 / R3**: 허용된 저장·URL·share 복구 소스 수정, R3+parser44 검사 및 전체lint(오류0/기존경고7), 08:14 KST 소스 snapshot 격리 webpack build/type 통과. `scripts/storefront-save-validation/r3-consumer.patch` 게시: `configurator/page.tsx` 수동 snapshot의 비활성12행 제거/currentConfiguration 재사용, legacy URL mount 복구, 저장 시작 시 이전 공유·AR 링크 해제 및 반환code 검증. 이 소비자 파일은 직접 수정하지 않았으며 UI 마운트 해제 뒤 리더가 적용. ProductConfigurator는 currentConfiguration/restoreSavedConfiguration을 이미 사용하므로 별도 patch 불필요. 최신 “클래식도”에 맞춰 Classic/Natural 다리·Silver/Black 보존,24cm/Pixel만 보정. 실제DB왕복만blocked, 원본/CNC 완전일치와 분리. 담당 Chrome 브라우저 최종 검증·증거 정리 중이며 소스 잠금은 최종 해제 기록 전까지 유지.

- `codex-assembly` / **R3-ASM 수신08:10 → 납품·잠금 해제08:47 KST / 2026-10-14** / 실제 세션 `01a13548-3202-7aa2-8a54-0ff6840d3f75`, Codex `/root`: dispatch-r3 및 assignments/r3/05-assembly 수신. 기존 cinematic 잠금을 이어서 `src/components/assembly-guide/**`, `src/lib/assembly-guide/**`, `src/app/assembly-guide/**`, `docs/assembly-guide.md`, `docs/handoffs/assets/codex-assembly/{cinematic,r3-legs}/**` 잠금. 원본 신규 추가 시 `public/assembly-guide/legs/**`만 사용. 먼저 최신 cinematic 실제 재생·390px·lint/type/build 마무리, 이후 다리 원본 자료/topic/독립 단계 구현. HW `legs/**`, long-leg.glb·FurnitureLegs·furniture-base·store/CNC/상품 UI 읽기 전용. R2.1 증거 보존. 기존 인계는 `docs/assembly-guide.md`이며 수신 기록 추가.

- `codex-storefront` / **R3-SAVE 수신·착수 / 2026-10-14 08:06 KST** / 세션 `befun 메인 tylko로 클론코딩` (`01a1341b-6348-7bf0-afc8-9c89fb62522b`): R3가 이전 배정보다 우선함을 확인. 잠금: `src/components/storefront/{configuration.ts,savedDesign.ts,savedDesign.test.ts,SavedDesignPages.tsx}`, `src/lib/sharing.ts`, `src/app/share/[code]/page.tsx`, `scripts/storefront-save-validation/**`, 본인 handoff. 기존 snapshot/restore·baseType·URL/로컬 목록/공유 복구를 직접 수정·검증. ProductConfigurator/configurator page·store/type·DB/API/env/가격/gallery는 읽기 전용이며 필요한 소비자 handler patch만 제출. 기존 선반 작업은 새 제품군 계약/DB 없이 진행. R2.1 완료 증거 보존.

- `codex-storefront` / 2026-10-14 07:54 KST / 사용자 “안된거 마저해”: SAVE-10 후속 준비 상태 재확인·handoff 기록 완료, 문서 잠금 해제. DATABASE_URL 미설정, 실행 PostgreSQL 컨테이너는 다른 프로젝트 이름/포트. Befun용 기존 DB 설정 파일 또는 전용 개발 DB 신규 구성 선택 요청 중. 실제 DB 왕복은 아직 blocked. 앱 소스/env/schema/공유 서버 및 리더 소스 변경 없음. CORE-01 함수 미게시로 접합·새 제품 연결 요청 유지. SQL diff는 출력 파일 미생성으로 준비 성공 처리하지 않음. 자세한 후속 순서는 본인 handoff 최신 SAVE-10 절 참조.

- `codex-analysis` / 2026-10-14 상세 Tylko 원본 사진 연결: 사용자 교정으로 신규 3D 갤러리 작업 철회·파일 제거, Shelf 변경도 이번 턴 범위만 원복. 수정 잠금: ProductDetails.tsx, ProductMaterialGallery.tsx, galleryMaterials.ts 및 신규 갤러리 매핑 데이터. 실제 Tylko 사진·스와치 사용. 이전 실시간 3D 방향은 폐기.

- `codex-analysis` / 2026-10-14 상판 이음선 가시성 수정 완료·잠금 해제: `Shelf.tsx`의 seam 표시 연결만, 신규 `HorizontalPanelSeams.tsx`, `lib/three/horizontal-seams.ts`, `scripts/tylko-hardware/horizontal-seams.test.mjs`, 사례/검증 기록. 실제 분절 생성기·CNC·재질/조명은 변경하지 않음. 동일 높이·두께·깊이에서 맞닿는 가로 부재 경계만 표시. 4 tests·lint·격리 webpack build 통과. Chrome 318cm/70%/4행/131cm/Mix 상면·사선 확인. 사례 `tylko-reference/cases/horizontal-seam-318.json`. 원본 분절 규칙 완전 일치 검증과는 별개.

### 최신 실행 배정 R2.1 — 개별 지시서 재작성 / 2026-10-14

[R2.1 전체 지시·붙여넣기 문구](development/furniture-parity/dispatch-r2.md). 아래 R2보다 우선. 모두 **배정 게시/수신 미확인**이며 작업자는 본인 handoff에서 착수를 기록한다.

| 작업 | 담당 | 수정 범위의 핵심 | 실제 인계/완료 기준 |
|---|---|---|---|
| R2.1-HW | 왼쪽1 Claude 하드웨어 | furniture-hardware/ovvo/**, 본인 handoff/캡처 | PH/RH/PC/RC·import/축 계약·조립 연결 대조. assignments/01-hardware.md |
| R2.1-UI | 왼쪽2 Claude UI | furniture-panels/legacy/**, index; DimensionPanel/StyleSelector **handler 추출·호출만** | 실제 store 연결, 기존 행수/스타일 동작 공유. assignments/02-ui.md · **source/store 연결 완료, 운영 마운트 대기(리더)**, UI-R2-01~08 pass, 86 tests, handoff 마운트 인계 |
| R2.1-SAVE | 왼쪽3 Codex storefront | db.ts·design API; ProductConfigurator saveDesign/안내·공유page fetch 오류/재시도 | **지정 구현·사용자 오류 흐름·검증 완료, 잠금 해제.** 서버회귀21/legacy17/import/live·브라우저·격리build 통과. 실제DB왕복은 URL 미설정으로 blocked. handoff 최상단 참조 |
| R2.1-QA | 왼쪽4 Codex QA | scripts/furniture-validation/**, 본인 handoff/캡처 | 원본2결함 독립 재검증·R2 산출물 실제 연결 교차검증. assignments/04-qa.md |
| R2.1-ASM | 추가 왼쪽5 Codex 조립 | assembly-guide app/components/lib, 안내 문서/캡처 | HW 모델 실제 연결·P/R 동작·간섭 교정. assignments/05-assembly.md |
| R2.1-CORE | 리더 | 공통 상태/저장복구·registry·옷장·배치/가공·실제 마운트 | CORE-01 먼저 실제 게시, READY마다 코드/화면 교차점검. assignments/00-leader.md |

**공통 파일 직렬 편집:** share/[code]/page.tsx는 SAVE 오류 작업 완료·해제 후 리더 복구 작업. DimensionPanel/StyleSelector는 UI handler 영역만 위임; graphics 레이아웃 유지. 다른 이전 소유권 충돌이 있으면 해당 파일만 조율하며 독립 범위 진행.


- `codex-analysis` / 사용자 “지시서 성의없다” / 2026-10-14: R2.1 개별 실행 지시 재작성·경로 대조 완료. 아래 문서 편집 잠금 해제: `docs/development/furniture-parity/{dispatch-r2,dispatch-r2-initial,terminal-instructions,contracts,README}.md`, 신규 `docs/development/furniture-parity/assignments/**`, 본 문서의 R2.1 배정. 실제 코드와 인계 기록의 연결 지점·선행 조건을 확인하며 기존 작업자 기록은 수정하지 않음.

### 이전 실행 배정 R2 — 사용자 “지시해” / 2026-10-14

상세: [R2 지시서](development/furniture-parity/dispatch-r2.md). 아래는 **배정 예약**이며 자동 수신/착수 아님. 수신한 작업자가 실제 착수·잠금을 기록한다. 이전 완료 작업 재수행 지시보다 우선하며 기존 변경은 보존한다.

| 작업 | 단일 담당 | 이번 수정 허용 범위 | 완료 기준 | 현재 상태 |
|---|---|---|---|---|
| R2-HW OVVO 형상 교정 | 왼쪽1 Claude 하드웨어 | 신규 three/furniture-hardware/ovvo/**, 본인 handoff | 공식 P/R 대조·접합 좌표·형상/간섭 교정 캡처 | 배정 / 수신 미확인 |
| R2-UI 실제 선반 상태 연결 | 왼쪽2 Claude UI | ui/furniture-panels/legacy/**, 본인 index export/handoff | 실제 store 양방향 연결·미지원 무변경·기존 보정 유지; 운영 마운트 별도 | 해당 범위 완료: 상태 연결 완료 / 운영 마운트 대기(리더). 77 tests·격리 build 통과. handoff UI-15~17. 잠금 해제 |
| R2-SAVE 서버 저장 오류 수정 | 왼쪽3 Codex storefront | lib/db.ts, app/api/designs/route.ts, app/api/designs/[code]/route.ts, scripts/storefront-save-validation/**, 본인 handoff | adapter/환경 미설정 처리·기존 소비자 회귀; 실제 DB 왕복 별도 표시 | 배정 / 수신 미확인 |
| R2-QA 독립 재검증 | 왼쪽4 Codex QA | scripts/furniture-validation/**, 본인 handoff | QA-L4-04/08 실제 재현 후 R2 산출물 교차 검증 | 배정 / 수신 미확인 |
| R2-ASM OVVO 시연 교정 | 추가 왼쪽5 `codex-assembly` | components/lib/app의 assembly-guide/**, docs/assembly-guide.md | 하드웨어 모델 재사용·P/R 동작/간섭 교정·Tylko 회귀 | 사용자 직접 지시 수신·착수. R2-HW ovvo/**·좌표 계약은 아직 미게시. 기존 오류 재현·변환/시퀀스 분리 진행 |
| R2-CORE 공통 상태·옷장·실제 배치 연결 | 리더 codex-analysis | 공통 types/stores/lib/furniture/sharing, 생성기/Shelf/배치/CNC, page 실제 연결; 기존 graphics 잠금 및 R2 위임 파일 제외 | 계약 게시→실제 연결→QA→수정; 미확정 유지 | 리더 책임 / 미완료 |


- `codex-analysis` / 2026-10-14 사용자 “지시해”: 후속 실행 배정 R2 문서 게시 완료, 아래 문서 편집 잠금 해제: `docs/development/furniture-parity/{dispatch-r2,terminal-instructions,contracts,README}.md`, 본 `team-tasks.md`의 R2 항목. 기존 소스/작업자 인계 내용은 보존. 게시와 작업자 수신·착수는 구분한다.

| 작업 | 담당 | 수정 파일 (잠금) | 관련 분석 항목 | 시작 | 상태 |
|------|------|------------------|----------------|------|------|
| 고객용 조립 안내 — 추가 왼쪽5 Tylko 클립 시퀀스 | `codex-assembly` (현재 대화) | `src/app/assembly-guide/**`, `src/components/assembly-guide/**`, `src/lib/assembly-guide/**`, `docs/assembly-guide.md`; ViewToolbar 안내 버튼 title만 | terminal-instructions 추가 왼쪽5, connector-clip-003/004 | 2026-10-14 | Tylko 설명 시퀀스 구현·안내 연결·검증 완료, 이번 파일 잠금 해제. 하드웨어 담당 모델/좌표 소비, 검사12통과·변경lint0·격리build통과. 전체lint 타담당3오류. 실제 제품/CNC 미확정·OVVO 재감사 교정·다리 전용 안내는 미완료. docs/assembly-guide.md 참조 |
| R1-VISUAL/R2-HW 3D 하드웨어 외형(다리·조절발·손잡이·힌지·레일·Tylko 클립/상대 핀·**OVVO V-1230P/R `furniture-hardware/ovvo/**`**) + 기존 그래픽(materials.ts) | `claude-graphics` (Claude Code CLI) | 신규 `src/components/three/furniture-hardware/**`, `docs/handoffs/claude-2-hardware.md`, 기존 `src/lib/three/materials.ts`(본인 범위 유지). 읽기 전용: LevelingFeet.tsx, reference-feet.ts, hardware.ts, reference-hardware.ts, Shelf.tsx, Scene/Effects/카메라 | furniture-parity R1.2 / 03 | 2026-10-13 21:38 | 착수 |
| 컨피규레이터 아래로 이어지는 상품 상세 스크롤 (사용자 첨부 화면 지시) | `codex-storefront` | 신규 `src/app/configurator/layout.tsx`, `storefront/ConfiguratorShell.tsx`, `ProductDetails.tsx`, `product-details.module.css`; 기존 `CatalogPages.tsx`, `ProductConfigurator.tsx`, `StorefrontUI.tsx`, `storefront.module.css`, 감사 문서 | 첨부 독일어 regalsystem 3690311,j | 2026-10-13 | 스크롤·상세 연결 구현 및 브라우저 검증 완료, 잠금 해제. core configurator/3D/AR 담당 파일 보존. 전체 원본 1:1 완성을 뜻하지 않음 |
| 쇼핑몰 원본 화면 재대조·누락 세부 구성 보완 (사용자 계속 지시) | `codex-storefront` | `src/components/storefront/**`, `src/app/(storefront)/**`, `public/imgs/storefront/**`, `docs/storefront-page-audit.md`, `docs/storefront-clone.md` | 메뉴·목록·상세·메인 반응형 | 2026-10-13 | 이번 보완·검증 마침, 잠금 해제. 전체 원본 1:1 완성은 미완료(폰트403·브랜드영상·상품/운영 정보). 최신 감사 문서 참조. SVG 및 다른 담당 configurator/3D 유지 |
| 쇼핑몰 누락 페이지 보완 + 실측 규격 + 컨피규레이터 로고 재사용 (사용자 직접 지시) | `codex-storefront` | `src/components/storefront/**`, `src/app/page.tsx`, 신규 `src/app/(storefront)/**`, `src/components/common/ShopLayout.tsx`, `src/app/cart/page.tsx`, `src/app/login/page.tsx`, `public/imgs/storefront/**`, `docs/storefront-clone.md`, `docs/storefront-page-audit.md` | Tylko 메인/메뉴/푸터 연결 페이지 | 2026-10-13 | 페이지 연결·로고·핵심 규격 보완 구현 및 검증 완료, 잠금 해제. 전체 원본 픽셀/운영 기능 동치는 미완료, 차이·필요 정보는 audit 문서 참조. configurator/3D 잠금 파일 수정 안 함 |
| Tylko 쇼핑몰 메인 클론 (사용자 직접 지시) | `codex-storefront` (Codex 앱) | `src/app/page.tsx`, 신규 `src/components/storefront/**`, 신규 `public/imgs/storefront/**`, 신규 `docs/storefront-clone.md` — 공통 Header/Footer/ShopLayout 및 다른 담당 잠금 파일은 수정하지 않음 | Tylko en-uk 메인 실제 화면 | 2026-10-13 | 메인 구현·브라우저 검증 완료, 잠금 해제; 최종 전체 빌드는 동시 작업 3D 타입 오류로 실패 |
| 3D 뷰어 그래픽 품질 개선 (조명/톤매핑/그림자/재질/AO) | `claude-graphics` (Claude Code CLI, 기존 `claude`) | `src/components/three/Scene.tsx`, `src/components/three/Background.tsx`, `src/components/three/Effects.tsx` (신규), `src/lib/three/materials.ts` — package.json 잠금 해제(의존성 추가 없음) | - | 2026-10-13 | 1차 완료, 사용자 검토 대기 — 잠금 유지 |
| 모바일 AR (안드로이드 WebXR 배치+실시간 수정 / 아이폰 Quick Look USDZ) (사용자 직접 지시) | `claude-graphics` (Claude Code CLI) | 신규 `src/components/three/ar/**`, 신규 `src/components/ui/AROverlay.tsx`, 신규 `src/components/ui/QuickLookSheet.tsx`, 신규 `src/components/ui/{ARDimensionSheet,RulerSlider}.tsx`, `src/components/three/Scene.tsx`, `src/components/three/Background.tsx` (데칼 export만), `src/app/configurator/page.tsx` (AR 버튼 분기만). 의존성 추가 없음 | - | 2026-10-13 | 1차 완료(실기기 미검증), 사용자 검토 대기 — 잠금 유지 |
| 컨피규레이터 모바일 반응형 UI (사용자 직접 지시) | `claude-graphics` (Claude Code CLI) | `src/app/configurator/page.tsx` (레이아웃만, 가격/저장/스타일 로직 수정 없음), 신규 `src/components/ui/MobileConfiguratorPanel.tsx`, `src/components/ui/PriceDisplay.tsx` (compact 표시 옵션 추가만), `src/components/ui/StyleSelector.tsx` (모바일 가로 스크롤만), `src/components/ui/FloatingBox.tsx` (모바일 배치만), 신규 `src/components/three/cameraEvents.ts`, `src/components/three/RowColliders.tsx` (터치 탭 동작 추가만), `src/components/ui/RowControls.tsx` (모바일에서 미리보기 이미지 숨김만) | - | 2026-10-13 | 1차 완료, 사용자 검토 대기 — 잠금 유지 |
| CNC 옵티마이저 이식 (250709in `main@7ecfd99`): 재단 엔진·MPR/DXF/PDF/CSV·가공 시뮬레이션 + Befun 패널 변환 + `/optimizer` 페이지 (사용자 직접 지시) | claude-optimizer (Claude Code CLI) | 신규만: `src/lib/optimizer/**`, `src/components/optimizer/**`, `src/app/optimizer/**`. 공통: `package.json`, `package-lock.json` (의존성 추가: jszip, polygon-clipping, three-bvh-csg, three-mesh-bvh, mediabunny, lucide-react, jspdf; devDep vitest). 기존 소스 수정 없음 | - | 2026-10-13 | 1~3단계 완료, 잠금 해제 |
| 컨피규레이터 → `/optimizer` 진입 버튼 (사용자 직접 지시) | claude-optimizer (Claude Code CLI) | `src/app/configurator/page.tsx` (버튼 추가만, 스타일 디스패치 수정 없음) | - | 2026-10-13 | 완료, 잠금 해제 |
| R1-UI 제품별 우측 옵션 패널 (Edge/Tone 옷장부터) | Claude-1 / claude-optimizer 세션 (Claude Code CLI) | 신규 `src/components/ui/furniture-panels/**`, `docs/handoffs/claude-1-ui.md` — 기존 page/stores/StyleSelector/DimensionPanel/MobileConfiguratorPanel/PriceDisplay/공통 타입 수정 없음 | furniture-parity 02 | 2026-10-13 | 1–4단계 완료(옷장 + 제품군 8 profile, R1.3 타입 전환, UI-REVIEW-002/003, 접합 방식 OVVO/Tylko 클립 미리보기, 49 tests — 미리보기이며 통합 아님). 리더 view 계산·intent 적용·page 연결 대기 — handoff UI-02~04, 08~10 |

## 조율 요청

- `claude-optimizer`(Claude UI) 사용자 직접 지시 / 2026-10-14: **가구 우측 핫스팟 반투명 + 숨쉬는 글로우 → 완료·잠금 해제.** 평소: 흰색 55% 반투명+blur, 2.4초 주기로 투명도 0.6↔1과 초록 글로우가 숨쉬듯 반복. hover/focus: 멈추고 또렷하게. 열린 행: 불투명 초록+고정 글로우. prefers-reduced-motion이면 애니메이션 없음(코드만, 브라우저 미검증). Chrome 3003: 애니메이션 running(무한, 2.4s), 클릭 시 팝업 열림, 오류0. 캡처 `docs/handoffs/claude-1-ui-assets/hotspot-glow/`. 좁은 잠금: `src/components/three/RowHotspots.tsx`의 버튼 스타일만, 신규 `RowHotspots.module.css`. 위치 계산·hover/focus 처리(911행 작업)·팝업 열기 동작 보존.

- `claude-optimizer`(Claude UI) 사용자 직접 지시 / 2026-10-14 09:50: **상단 노란 알림바 닫기 기능 → 완료·잠금 해제.** X 버튼(aria-label '알림 닫기')으로 닫으면 localStorage `befun-announcement-dismissed`에 보관하고 모든 storefront 페이지에 적용한다. 알림바 높이를 `--announce-h`(52px, 700px 이하 40px, 닫힘 0) 변수로 바꿔 헤더 top·hero 높이·영상 커버가 함께 올라간다. 실제 Chrome 1440/390에서 옷장·홈·sideboard-terra·configurator 확인: 닫기 후 header top 76→24(모바일 56→16), 새로고침·이동 후 유지, 저장값 삭제 시 복귀, Enter로 닫힘, 넘침·오류 0. 캡처 `docs/handoffs/claude-1-ui-assets/announcement/`. 좁은 잠금: `src/components/storefront/StorefrontFrame.tsx`의 announcement 마크업·닫힘 상태만, `storefront.module.css`의 announcement/header top/hero 높이/menuBackdrop의 알림바 높이 값만(CSS 변수화). 다른 storefront 작업 보존.

- `claude-optimizer`(Claude UI) **R3-UI 수신·착수 → UI-LIVE-READY 게시·잠금 해제**(08:20): 운영 `/configurator`(desktop·모바일 탭)·`/furniture/sideboard-terra`에 LegacyShelfPanel 마운트, Feet 사이 배치, 높이 baseHeight 동기화. 96 tests, eslint/tsc 0, 격리 build PASS(fingerprint 77bbbff57177934e). 상세 handoff claude-1-ui.md R3 절. 원 착수 기록: (assignments/r3/02-ui.md). 잠금: `src/components/ui/furniture-panels/**`, `src/components/ui/FeetSelector.tsx`, `src/components/ui/MobileConfiguratorPanel.tsx`; 좁은 잠금 `src/components/storefront/ProductConfigurator.tsx`·`src/app/configurator/page.tsx`의 **패널 import/JSX 마운트 영역만**(저장 handler·snapshot·가격·cart·공유 복구 보존); `src/components/ui/DimensionPanel.tsx`·`StyleSelector.tsx`는 R2.1 위임 handler 유지(마운트 후 미사용 시 삭제하지 않음). 기록 `docs/handoffs/claude-1-ui.md`, `docs/handoffs/claude-1-ui-assets/r3/**`. stores/types/furniture-base/configuration/savedDesign/Shelf 읽기 전용.
  - 충돌 회피: 리더의 'Natural 장다리 Silver/Black' 임시 잠금(FeetSelector Natural 색상 옵션, configurator snapshot legFinish)이 진행 중(08:06 수정)이므로 해당 영역은 손대지 않음. 1~3단계(furniture-panels 내부)부터 진행하고, 마운트는 리더 잠금 해제 확인 후 수정 직전 재읽기로 패널 JSX만 교체.

- **`codex-storefront` → 리더: R2.1-SAVE 완료·잠금 해제 알림 / 2026-10-14 07:04 KST.** [최종 인계](handoffs/codex-storefront-integration.md#r21-save-최종-인계--2026-10-14). db/design API의 올바른 PoolConfig·lazy import·미설정503 및 400/401/404/500 code, 상품의 입력오류/서버성공/로컬보관 구분, 공유404/503/500/네트워크·같은코드 재시도 구현. 서버fixture21검사/legacy17검사/실제모듈 import/3003 live/브라우저10사례 통과. 전체lint 오류0/기존경고7, 최종 격리build/TypeScript 통과. **share/[code]/page.tsx 오류 편집 종료: 리더가 정상 config 복구 작업 시작 가능. handleLoadDesign 원문 SHA256 보존 확인.** 이번 db/API/ProductConfigurator/공유page/scripts/handoff 잠금 해제. 실제 DB 왕복은 DATABASE_URL 미설정으로 blocked이며 mock 성공과 구분. env/schema/공통접합/가격·주문/결제/인증정책 및 공용서버 운영 변경 없음.

- `claude-optimizer`(Claude UI) → R2.1-ASM(Codex 조립): 2026-10-14 현재 작업 트리의 격리 `next build --webpack`이 `src/components/assembly-guide/GuideScene.tsx:158` 타입 오류(spread에 튜플 타입 필요)로 실패합니다. 해당 파일은 수정하지 않았습니다. 수정 후 알려 주시면 R2.1-UI 재빌드를 기록하겠습니다.
  - 해소(07:25): GuideScene 07:01 수정본으로 격리 build 통과(exit 0). R2.1-UI 빌드 확인 완료.
- `claude-optimizer`(Claude UI) → R2.1-QA(Codex 검증): 교차검사의 legacy28은 철회된 R2 setHeight 버전입니다. 현재 R2.1 검사는 `furniture-panels/preview/__verify__/legacy-r21.test.tsx.txt`(37개, 전체 86개)이며, 재실행 방법은 같은 폴더의 README.md에 있습니다.

- `codex-storefront` R2.1-SAVE 후속 수신·범위 확대: assignments/03-storefront.md의 고정 HTTP/code 계약 확인. 기존 R2 잠금에 `ProductConfigurator.tsx`의 saveDesign/결과 안내 및 `src/app/share/[code]/page.tsx`의 fetch 오류/재시도 영역 추가. 정상 config 복구(handleLoadDesign)는 리더 소유로 원문 보존하며 이 파일은 본 작업 해제 후 리더가 편집하도록 요청. 새 공통 serializer/schema/env/주문·결제 변경 없음. 이전 R2 독립검사16개·실제 미설정503·격리build 통과 후 사용자 새 지시에 맞춰 오류 code와 화면 처리를 이어서 수정.

- `claude-optimizer`(Claude UI) **R2.1-UI 수신·착수 → 해당 범위 완료·잠금 해제** 2026-10-14 (assignments/02-ui.md). 잠금: `furniture-panels/legacy/**`(view.ts·actions.ts·LegacyShelfPanel.tsx; 이전 legacyShelfAdapter.ts는 대체 삭제), `furniture-panels/index.ts` export, **`DimensionPanel.tsx`의 행 수 handler 추출·호출만**, **`StyleSelector.tsx`의 스타일 handler 추출·호출만**(CSS/마크업/모바일 레이아웃 보존), handoff·`docs/handoffs/assets/claude-1-ui/r2/**`. stores/types/page/가격/생성기는 수정하지 않음.

- `codex-storefront` R2-SAVE 수신·착수 / 2026-10-14 06:18 KST / 세션 `befun 메인 tylko로 클론코딩` (`01a1341b-6348-7bf0-afc8-9c89fb62522b`): 잠금 `src/lib/db.ts`, `src/app/api/designs/route.ts`, `src/app/api/designs/[code]/route.ts`, 신규 `scripts/storefront-save-validation/**`, 본인 handoff. R2 좁은 소유권 위임 확인. PrismaPg 인수 교정, import 안전한 지연 client 및 미설정503, 입력/인증/기존 소비자 회귀를 구현·검증. schema/env/공통 저장·접합·주문·결제/인증 정책은 변경하지 않음. 공용 서버 재시작/공유 `.next` 변경 없음, 독립 build 사용.

- `claude-optimizer`(Claude UI) **R2-UI 수신·착수 → 완료·잠금 해제** 2026-10-14 06:25 KST: dispatch-r2.md 왼쪽2. 잠금: 신규 `src/components/ui/furniture-panels/legacy/**`, `furniture-panels/index.ts`(export 추가만), `docs/handoffs/claude-1-ui.md`. stores·types/furniture.ts·운영 page·가격·생성기·StyleSelector/DimensionPanel 등 운영 패널은 수정하지 않음(읽기·비교만).

- `codex-storefront` 최신 왼쪽3 지시 수신 / 2026-10-14 00:07 KST: 접합 방식의 상품 진입·저장·공유·복구 누락 추적 및 서버 저장 실패 원인 조사. 잠금: `docs/handoffs/codex-storefront-integration.md`만(진행 근거·접합 연결 요청·서버 진단 기록). 읽기 전용: storefront configuration/savedDesign/ProductConfigurator, common types/stores/sharing/db/auth/API, optimizer connectors/session, prisma. 공통 저장 구조·API·환경 변수·다른 담당 소스는 변경하지 않음. local3003에 제한된 실패 재현/읽기 검사를 수행하며 실제 주문/결제는 실행하지 않음.
- `codex-storefront` 최신 왼쪽3 감사·진단 완료 / 2026-10-14: [handoff의 ENTRY-CONNECTOR-003 / ENTRY-SAVE-004](handoffs/codex-storefront-integration.md) 요청 게시. 접합은 optimizer 전역 localStorage만 보존, 상품/standalone snapshot에 없고 parseSavedDesign·양쪽 공유 복구·legacy URL에서 제외됨. raw API JSON/장바구니 persist가 직접 필터링하는 것으로 오판하지 않음. 클립 선택→상품 저장 fallback→공유 복구→optimizer의 이전 클립 잔류 실제 재현, OVVO/V-1230P로 원복 확인. 서버 POST missing400/valid500·목록401·없는code조회500, save/fetch 로그 모두 빈 문자열 Pool 초기화 TypeError. `db.ts:11 new PrismaPg(connectionString)`이 설치 API의 Pool/PoolConfig 형식과 불일치하며 DATABASE_URL도 미설정. 네트워크 없는 Pool 단독 재현으로 문자열 인수 실패/설정 객체 생성 성공 확인. DB 접속·권한·migration 원인으로 확대하지 않음. savedDesign17 tests 통과. 문서만 변경하여 앱 lint/build 미재실행, 공통 schema/db/API/env 변경·서버 재시작 없음. 본 handoff 잠금 해제; 실제 수정/접합 포함 서버 왕복은 리더 연결 대기.

- `claude-optimizer`(Claude-1 UI 세션) 사용자 직접 지시 / 2026-10-14 00:05 KST: **행 팝업을 가구 우측 핫스팟 클릭으로 열기.** 좁은 잠금: 신규 `src/components/three/RowHotspots.tsx`, `RowColliders.tsx`(hover 시 팝업 선택 제거 + 핫스팟 마운트만), `FloatingBox.tsx`(데스크톱 자동 닫힘 → 닫기 버튼/바깥 클릭/Esc만). 리더의 기존 잠금(행 일치 검사·하이라이트 잔류 수정)은 보존하고, 마지막 수정 20:03 이후 변경이 없음을 확인했다. RowControls·store·Shelf는 수정하지 않는다.
- `claude-optimizer` 행 팝업 핫스팟 **완료, 잠금 해제** (2026-10-14 00:40 KST):
  - 신규 `RowHotspots.tsx`: 행마다 가구 우측 정면 끝에 원형 핫스팟을 둔다. 위치는 매 프레임 현재 카메라로 계산하고, 열린 팝업은 궤도 회전 중에도 핫스팟 옆을 따라간다. 선택된 행은 초록색, aria-expanded로 표시한다.
  - `RowColliders.tsx`: hover는 하이라이트와 도어/서랍 열기만 한다(팝업 없음). 팝업이 열려 있으면 hover를 무시한다. 터치로 행을 탭해 여는 동작은 유지했다.
  - `FloatingBox.tsx` 데스크톱: 마우스가 떠나면 자동으로 닫히던 동작을 없앴다. 닫기 버튼, 같은 핫스팟 재클릭, 바깥 클릭(드래그 제외), Esc로 닫는다.
  - 리더가 넣은 행 일치/하이라이트 잔류 수정의 의도는 유지했다. 이전 행 타이머는 제거되어 해당 결함 경로가 없다.
  - 검증(3003 Chrome, 1440/390px): hover만으로 팝업 미표시, 클릭 열림, 이탈 후 유지, 옵션 클릭 후 유지, 궤도 회전 추종(간격 12px), 행 전환/토글/바깥 클릭/Esc/X/키보드 Enter, 모바일 탭 열기·닫기 통과. 페이지 오류 0, tsc·eslint 0.
  - 화면: `docs/handoffs/assets/claude-1-ui/hotspot-desktop.png`, `hotspot-mobile.png`.

- `codex-storefront` 2026-10-14 00:01 KST 후속 지시 수신: terminal-instructions 최신 왼쪽3 및 CORE-REVIEW-002 확인. R1.3 UI 타입만 게시, registry/적용/복구/직렬화는 여전히 미구현. 좁은 문서 잠금 `docs/handoffs/codex-storefront-integration.md`: ENTRY-MAPPING-002 진입 상태·버튼·안내 문구 및 실패/복구 정책 설계 보완. 제품 소스와 리더 공통 타입 수정 없음.
- `codex-storefront` 후속 문서 보완 완료: 기존 선반/연결 준비/활성 preset 미확인/reference/검증된 preset/복구 실패의 표시·진입·저장 정책6종, category/model 왕복·중복 적용·실패 시 이전 상태 보존·legacy 분류·갤러리 독립성 설계 인계. R1.3 타입 게시 상태로 handoff 갱신, 제품 소스 변경 없음. 문서 잠금 해제. 문서만 수정했으므로 앱 lint/build 추가 실행 없음; 실제 서비스 연결은 ENTRY-CONTRACT-001 대기 유지.

- `codex-storefront` R1-ENTRY 재개 / 2026-10-13 21:42 KST: 실제 세션 `befun 메인 tylko로 클론코딩` (`01a1341b-6348-7bf0-afc8-9c89fb62522b`). 갤러리 직접 구현 회수 및 리더 잠금을 확인하여 ProductDetails/ProductMaterialGallery/material-gallery/galleryMaterials 소스는 읽기 전용으로 검증. 현재 잠금: `docs/handoffs/codex-storefront-integration.md`만. 공통 `src/types/furniture.ts`와 `src/lib/furniture/**` 미게시를 확인하여 계약 지시대로 진입점 조사·데이터 매핑 및 독립 확인부터 진행. 공통 apply/preset/serialize 요청은 본인 handoff에 게시하며 자체 대체 계약을 만들지 않음.
- `codex-storefront` → 리더 R1-CORE: [ENTRY-CONTRACT-001 / ENTRY-MAPPING-002](handoffs/codex-storefront-integration.md#연결계약-요청) 게시. 실제 공통 함수 import/signature 및 registry 검증 상태가 필요. 현행 intro의 Edge/Tone은 legacy 상품의 색상만 변경하고 wallunits도 wallstorage preset을 재사용하므로 새 제품군 연결 완료로 처리할 수 없음. 공통 소스는 수정하지 않음.
- `codex-storefront` R1-ENTRY 이번 조사·교차 확인 인계 / 2026-10-13 23:12 KST: [handoff](handoffs/codex-storefront-integration.md)에 진입점8개, 기존13선택 처리, 원본11category/34모델(활성28/미확인6) 매핑 및 연결 요청 기록. 리더 갤러리12종×8장 URL/로딩·확대·키보드·상단slider유지·390px overflow, 별도 Edge 사진7장 보존 확인. 기존 상품 저장→로컬 공유→저장 목록→편집/새로고침의 치수·가격 유지 확인. savedDesign17tests, 전체lint 오류0/기존경고8, 격리 `/private/tmp/befun-entry-check-pb9960i0` build/TypeScript 통과. 제품 소스 변경/공유서버 재시작 없음. 본인 handoff 잠금 해제. 전체 R1-ENTRY 실연결은 미완료: CORE-REVIEW-001/ENTRY-CONTRACT-001의 리더 공통 함수·registry 게시 대기.

- `codex-storefront` 좁은 추가 작업(사용자 썸네일 제거 직접 지시 / 2026-10-13): `src/components/storefront/ProductConfigurator.tsx`만 잠금. 뷰어 하단 3D/사진 썸네일 및 사진 전환 상태를 제거하며 상세 본문 갤러리/저장/가격/3D 소스는 유지합니다. 이전 광범위 작업 대기는 계속 유지하며 R1 분담 소스를 수정하지 않았습니다. 썸네일 제거·검증 완료, 이 파일 잠금 해제.

- `codex-storefront` 추가 잠금: `three/display/ViewToolbar.tsx`(보기 도구 기본 접힘 상태만). 기존 소품/보링/조립 버튼 및 그린 스타일 모두 보존. ViewCamera는 이번에 near1/far5000만 수정하며 시네마틱 및 각 방향 버튼과 충돌할 수 있는 각도 제한은 적용하지 않습니다.

- `codex-storefront` 사용자 상단 이상/반짝임 피드백 대응 (2026-10-13): 잠금 `storefront/ConfiguratorShell.tsx`, `product-details.module.css`, 감사 문서, `three/display/ViewCamera.tsx`(현재 담당 완료·해제 확인, 카메라 near/far 정밀도 및 기존 승인 각도 제한만). 부유 옵션 카드의 원본420px/오른쪽74px와 컴팩트 도구 배치를 대조 중입니다. `ViewToolbar.tsx`는 소품 작업 완료·잠금 해제를 확인했지만 필요 시 별도 등록 후 수정합니다. graphics의 Scene/Effects/Background/materials 잠금은 보존합니다.
- `codex-storefront` → `claude-graphics`: 사용자3014 화면에서 반짝임 피드백. 현재 ViewCamera가 Scene의 near1/far5000 대신 near0.1/far10000 카메라를 makeDefault하여 깊이 정밀도가 낮아지는 것을 확인했습니다. 해당 카메라 범위 수정·검증은 이번 대응에서 맡겠습니다. Effects useMemo→cleanup dispose 생명주기는 이전 조율 요청 그대로 남아 있으며 graphics 파일을 수정하지 않습니다. stationary/moving/specular 중 사용자 구분 답변 대기. Effects/조명 담당의 반짝임·HMR 진단 필요 시 이 기록을 참고해 주세요.

- `codex-storefront` 스크롤 공통 처리 추가 범위: `StorefrontUI.tsx`·`storefront.module.css`. 상품 상세의 3D도 일반 휠/세로 터치로 페이지를 내릴 수 있게 동일 처리 완료. Scene/ViewCamera 파일 수정 없음. 잠금 해제.

- `codex-storefront` 스크롤 상세 연결(사용자 첨부 화면 직접 지시 / 2026-10-13): 신규 `src/app/configurator/layout.tsx`, `src/components/storefront/ConfiguratorShell.tsx`, `ProductDetails.tsx`, `product-details.module.css`와 기존 `CatalogPages.tsx`·`ProductConfigurator.tsx`·감사 문서 구현 완료, 잠금 해제(`StorefrontFrame.tsx`는 읽기 재사용만, 수정 없음). graphics 담당 `configurator/page.tsx`·모바일 패널·Scene·가격/AR 동작은 수정하지 않았습니다. 새 route layout에서 쇼핑몰 프레임/하단 상세 연결, route 전용 래퍼 CSS로 한 화면 고정 해제. 기존 컨피규레이터 페이지의 내부 컴포넌트 구조는 유지해 주세요.

- `codex-storefront` 추가 범위(2026-10-13): `.env.local`의 누락된 `NEXTAUTH_SECRET`만 로컬 난수로 설정합니다. 프로덕션 미리보기의 공통 SessionProvider가 NO_SECRET/500을 반환하는 원인을 확인했습니다. 기존 값이 있으면 변경하지 않으며 DATABASE_URL·OAuth·결제 설정은 손대지 않습니다. .gitignore의 .env* 무시 규칙 확인. 값은 문서·로그·클라이언트에 출력하지 않습니다.

- `codex-storefront` → `codex-analysis` (2026-10-13): 새 `GridInput.family`를 쇼핑몰의 `configurationPrice`/`catalog.productPrice`에도 전달했습니다(classic·natural=type01, 나머지=type02). 기존 configurator PriceDisplay와 같은 규칙입니다. storefront 입력·공유·카탈로그 파일은 이 차수 담당 범위로 계속 잠금 유지합니다. 직전 동시 빌드에서 RowControls cells 타입 오류가 발생했지만 다시 읽은 소스는 openings/mosaic.cells 분기로 수정되어 있고 tsc 재검사는 통과했습니다. 다른 담당 파일은 수정하지 않았습니다.

- `claude-graphics` → `codex-display` (사용자 직접 지시로 잠금 파일 수정, 19:45): `display/ViewToolbar.tsx`와 `display.module.css`를 수정함. ① 주황(#e97836/#f49557)을 Befun 그린(#339922, 선택 배경 #e8f5e3, 글자 #287515, 진행바 #5fc24a)으로 변경. ② '보기' 접기/펼치기 토글을 전 화면 크기에서 표시(데스크톱은 펼친 상태, 767px 이하는 접힌 상태로 시작). 로직·스토어는 수정하지 않음. 이후 이 두 파일을 수정할 때 위 변경을 유지해 주세요.

- `claude-graphics` → `codex-display`: `display/ViewCamera.tsx`의 OrbitControls에 ① `zoomToCursor` 추가 요청(사용자 승인), ② 카메라 교체로 빠진 각도 제한 복원 요청(polar 0.15π~π/2-0.02, azimuth ±π/3. 없으면 실제 벽·바닥 룸이 바닥 아래·벽 뒤에서 깨져 보임). codex-display 잠금이라 직접 수정하지 않았음.

- `claude-graphics` → `codex-analysis`: `Shelf.tsx`의 REFERENCE_COLORS 분기가 단색 머티리얼의 map/roughnessMap을 제거하고 roughness 0.7, envMapIntensity 0.78로 덮어써서, 사용자 피드백("솔리드 컬러 미흡")으로 넣은 도장 미세 질감과 roughness 0.5가 해당 색상에서는 적용되지 않음. 리더 잠금이라 되돌리지 않았음. 의도된 Tylko 기준이면 유지하고, 아니면 materials.ts 값을 쓰도록 조정 부탁. 판단은 사용자 확인 필요.

- `claude-graphics` → `codex-analysis`: 현재 `npx tsc` 오류는 `src/components/three/DimensionOverlay.tsx:208` (`styleResult.cells`가 unknown) 1건뿐이고, 이 때문에 전체 `npm run build`가 실패함(storefront-clone.md 기록과 동일). T-01 잠금 파일이라 수정하지 않았음.

- `codex-storefront` 추가 잠금 / 사용자 전체 페이지 지시: `src/components/common/ShopLayout.tsx`, `src/app/cart/page.tsx`, `src/app/login/page.tsx`를 쇼핑몰 공통 내비게이션/원본 레이아웃 연결 범위로 수정합니다. 기존 auth/주문/결제 동작은 유지하고 신규 계정 alias 페이지는 storefront 그룹에서 작성합니다. 다른 담당 잠금의 configurator/3D는 수정하지 않습니다.

- `claude-graphics` → `codex-storefront` (2026-10-13): `src/app/page.tsx`가 `@/components/storefront/Storefront`를 import하지만 해당 파일이 없어 dev 서버 전체에 Module not found 오류 오버레이가 뜨고 `/`가 500을 반환함. 잠금 파일이라 수정하지 않았음. `Storefront.tsx`를 먼저 추가하거나 page.tsx를 임시로 되돌려 주세요. → **해결됨** (16:57 `storefront.module.css` 추가 후 `/` 200 확인)

- T-01 재개 / codex-analysis: Pattern 핵심 생성 규칙 구현을 진행합니다. `src/lib/three/styles/pattern.ts`, 신규 `src/lib/three/styles/pattern-*.ts`, `scripts/tylko-pattern/**`, `docs/tylko-reference/**`를 다시 잠급니다. 기존 공개 JS에서 Bookcase 설계표 API 경로를 확인했고 실제 로딩 응답과 생성 규칙을 조사 중입니다. 다른 담당의 파일 잠금은 유지합니다.

- `claude-graphics` → `codex-analysis`: 그래픽 담당 ID는 `claude-graphics`(기존 `claude`). 잠금 유지: `Scene.tsx`, `Background.tsx`, `Effects.tsx`(신규), `materials.ts`. T-01~T-04 범위와 겹치지 않음. 참고: `DimensionOverlay`는 Shelf 그룹 안에서 렌더되므로 이제 GTAO 후처리와 Neutral 톤매핑을 거친다. 불투명 메쉬를 추가하면 AO가 적용되고, 원치 않으면 `userData.excludeFromAO = true`를 쓰면 된다. 카메라 회전 범위 제한(바닥 아래·벽 뒤 금지)이 Tylko 비교 스크린샷의 시점에 영향을 줄 수 있다.
- T-01 추가 허용 (1차 편집 완료): `scripts/tylko-pattern/**` — 리더의 Pattern 기하 회귀 검증. 보조 작업자 비교 도구 경로와 분리한다.

### Tylko 전체 일치 작업 — 2026-10-13 / codex-analysis (리더)

사용자 최신 지시로 리더의 범위를 레퍼런스 분석뿐 아니라 핵심 규칙 구현·공통 코드 최종 통합까지 확장한다. 기존 그래픽 작업의 잠금과 완료 기록은 유지한다. 아래 배정은 공유 문서에 게시한 상태이며, 각 작업자의 수신·착수는 아직 확인하지 못했다. 실제로 시작할 때 자신의 상태와 잠금을 갱신한다.

| ID / 담당 | 수정 허용 파일·영역 | 작업 / 완료 기준 | 선행 작업 | 상태 |
|---|---|---|---|---|
| T-01 / codex-analysis 리더 | `docs/tylko-reference/**`, `docs/web-analysis.md`, `docs/team-tasks.md`, `src/lib/three/styles/pattern.ts`, `src/lib/three/styles/grid.ts`의 공통 타입, `src/lib/three/layout.ts` (신규), `src/components/three/DimensionOverlay.tsx` | Pattern부터 사례 기록, 셀 구조·내경·경계 규칙 분석 및 확인된 수정. 전체 방향과 통합. 공통 타입 변경은 먼저 문서에 계약 게시 | 기존 자료 읽기 | 1차 산출물 완료·전체 진행 중; 현재 소스 편집 잠금 해제, 공통 담당 리더 유지 |
| T-02 / Claude-1 (`claude-1`) | `scripts/tylko-compare/**`, `docs/worker-results/claude-1.md` (신규) | 의존성 추가 없는 구조 비교 CLI: 사례 JSON과 Befun 측정 JSON의 행·셀 수/순서·span을 정확 비교, 치수는 명시된 오차로 비교, null은 미측정으로 출력. 틀린 사례·누락 사례를 성공 처리하지 않는 자체 테스트와 실행 설명 제공 | 아래 측정 계약 / 사례 스키마 확인 | 문서 배정, 수신·착수 미확인 |
| T-03 / Claude-2 (`claude-2`) | `scripts/tylko-state-audit/**`, `docs/worker-results/claude-2.md` (신규) | Befun 옵션·저장·스타일 전환 코드 읽기 및 재현 가능한 상태 검증. 초기 높이 불일치, 행 추가 기본 높이, 제한·자동 보정, hardware/row index 유지 문제를 파일:줄과 재현 절차로 보고. 검증 코드와 수정 제안 제공, 공통 store 직접 수정 금지 | 옵션 문서의 미확인 항목 구분 | 문서 배정, 수신·착수 미확인 |
| T-04 / Codex-보조 (`codex-dev`) | `scripts/tylko-visual-audit/**`, `docs/worker-results/codex-dev.md` (신규) | 스크린샷 쌍의 viewport·카메라·옵션 메타데이터 검증, 구조 비교와 시각 비교를 분리한 보고 도구. 동일/차이/비교불가 구분. Befun 패널과 치수 표시의 코드 감사 및 수정 제안 | 실제 사례·스크린샷 확보 | 문서 배정, 수신·착수 미확인 |

공통 파일(`package.json`, lockfile, store, Shelf, Scene, materials 등)은 배정 없이 수정하지 않는다. 신규 작업은 기존 `claude` 그래픽 담당과 동일 인물이라고 가정하지 않는다. 그래픽 담당은 자신의 ID와 잠금 유지 여부를 이 문서에 확인해 주시기 바란다. 병합 없이 같은 폴더를 공유하므로 파일 수정 직전에 다시 읽는다.

측정 계약: cm 단위, rowIndex는 아래부터 0, 셀은 왼쪽부터 정렬. `clearWidthsCm`은 화면 반올림 내경이며 좌표가 아니다. 정확한 좌표는 별도 필드와 측정 방법을 명시한다. `null`/없는 값은 0이나 일치로 취급하지 않는다. `initialState`와 조작 순서가 불완전한 사례는 완전 재현 판정 금지. 원본 사례는 리더만 갱신하고 작업자는 결과 파일에 제안한다. 인증정보·쿠키·토큰 저장 금지.

단계: T-01 Pattern 기초 → 밀도 1% 및 구조 전환 경계 → 너비·행 높이·재질 상호작용 → 미사용 설정 검증 → Grid/Slant → Mosaic → Pixel/Gradient → 하드웨어·상태 복원 → 외관·반응형 통합. 이 순서는 확인된 독립 수정의 조기 반영을 막지 않는다.

다른 에이전트가 잡고 있는 파일을 수정해야 할 때 기록한다.

- `claude-optimizer` → `codex-analysis`: 옵티마이저의 Befun 패널 변환(`src/lib/optimizer/befun/`)이 `src/lib/three/styles/*`의 `PanelData`(w/h/d/x/y/z/matType, cm)를 **읽기 전용**으로 사용함. 공통 타입(`PanelData`, 스타일 함수 시그니처)을 바꾸면 이 문서에 알려 주세요.
- `codex-analysis` → `claude-optimizer` (2026-10-13): 이번 수정은 Pattern 폭≤43의 뒷판 누락만 보완했고 `PanelData`/함수 시그니처는 그대로입니다. 뒷판 ON 또는 hardware 행이면 반환 패널에 backPanel이 추가되므로 패널 수와 재단량이 증가합니다. 추후 셀 메타데이터 계약을 추가하기 전에 여기서 알리겠습니다.
- `claude-optimizer` → `codex-storefront`, `claude-graphics` (2026-10-13, 사용자 직접 지시): 메인 로고를 벡터로 다시 그림. `public/imgs/icon/befun_logo.svg` 신규, `main_logo_new.png`는 같은 디자인의 720px 렌더로 교체(기존은 `main_logo_new_prev.png`로 백업). 이어서 사용자 지시로 두 곳의 로고 `src`를 `/imgs/icon/befun_logo.svg`로 바꿈(`StorefrontUI.tsx` BrandLogo 1줄, `configurator/page.tsx` 헤더 Image 1곳 — `unoptimized`·`priority`·height 28). 다른 로직은 수정 없음. 비율이 180×39 → 424×100으로 약간 달라져 가로 120px 기준 높이 26 → 28px.
- `claude-optimizer` (2026-10-13, 사용자 직접 지시): 파비콘을 새 로고 아이콘으로 교체. `src/app/favicon.ico`(16 픽셀 정렬 전용 + 32/48/64), 신규 `src/app/icon.svg`, `src/app/apple-icon.png`(180). 기존은 `public/imgs/icon/favicon_prev.ico`로 백업. `layout.tsx` 수정 없음(Next 파일 규칙으로 자동 연결).
- `claude-optimizer` (2026-10-13): 로고 워드마크를 원래 글자체로 복구 — 기존 로고(`main_logo3.png` 고해상도)의 "befun" 글자를 그대로 벡터화해 `befun_logo.svg`·`main_logo_new.png`에 반영(f 위 점은 현행 로고에 맞춰 제거). 아이콘은 이전과 동일.
- `claude-optimizer` → `codex-storefront` (2026-10-13, 사용자 직접 지시): 메인 랜딩의 Tylko 사진을 AI 생성 이미지로 교체. 신규 `public/imgs/storefront/befun/*.avif` 19장(출처·방식 `SOURCES.md`, 프롬프트 `docs/landing-images/`). 수정: `Storefront.tsx`(히어로 포스터, Tylko 영상 사용 중지 `failed=true`, brand·gift·material·showroom·Befun Life 이미지, Befun Life 이름), `catalog.ts`(공간 이야기 6명 가상 한국인 이름+이미지), `ProcessCards.tsx`(step 이미지 경로), `navigation.ts`(journalArticles 이름·slug), `EditorialPages.tsx`(`creatorKeys` 실존 인물 이름 제거). 남은 Tylko 연결: CollectionChooser(컬렉션 이미지·색 견본), 제품 카드 `unreal_*.webp`, 다른 페이지(기프트카드·인스피레이션·쇼룸·Pro·레퍼런스 카탈로그·상품 갤러리).
- `claude-optimizer` → `codex-storefront` (2026-10-13, 이어서): 메인 제품 카드 6종을 컨피규레이터 렌더(`befun/products/*-a|b.webp`)로 교체(`catalog.ts` image/alternate), "컬러를 고르세요"(`CollectionChooser.tsx`)를 Befun 3개 라인(Solid 12·Natural 3·Classic 9색, `befun/collections/*.webp`, 견본색 reference-colors)으로 교체. 메인 페이지 Tylko 요청 0건 확인. 참고: `palette`의 '그린' #a9bb9b는 컨피규레이터 `S_Green`(#034A22) 렌더와 다름.
- `claude-optimizer` → `codex-storefront` (2026-10-13, 사용자 지시 "리뷰는 목업, 그냥 넣어"): ① `StorefrontUI.tsx` `ReferenceImage`가 tylko.com 주소를 요청하지 않고 `fallback` 로컬 이미지를 씀 — **새 이미지는 Tylko URL을 쓰지 말고 `public/imgs/storefront/befun/`을 쓰세요.** ② 예전 Tylko 유래 로컬 파일(`creator-*`, `step-*`, `storage/wardrobe/sofa/tone.avif`, `unreal_*.webp`)을 같은 이름의 Befun 이미지로 덮어씀(원본 백업은 작업자 scratch). ③ `ProductDetails.tsx` 리뷰를 가상 한국인 목업(지민·현우·수아)·Befun 이미지로, 쇼룸 4곳을 Befun 목업(성수·한남·판교·연남)으로, Tylko 문구·외부 링크 제거. `EditorialPages.tsx` 쇼룸 페이지 Tylko/런던 매장 → Befun 목업. `ReferenceCatalogPages.tsx` 안내 문구에서 Tylko 제거. 18개 페이지 순회: Tylko 요청 0, 깨진 이미지 0. 남은 것: URL 경로 `/about-tylko`·`/tylko-pro`, 채용 링크(tylko.recruitee), 레퍼런스 카탈로그 상품(책상·화장대·소파 등 Befun 미판매)·`/sofa/*` 존재 여부는 제품 범위 결정 필요.
- `claude-optimizer` (2026-10-13, 사용자 지시): 제품 카드 이미지를 원래 Tylko 렌더(`unreal_*.webp`)로 되돌림 — `catalog.ts` image/alternate 원복, `unreal_*.webp` 파일 원본 복원. 렌더 이미지(`befun/products/`)는 남겨 둠. 오픈 전 교체 필요(저작권).
- (예) `claude-2` → `codex-dev`: `src/stores/useShelfStore.ts`에 `foo` 필드 추가 필요. 완료 후 알려주세요.

## 완료

### T-01 첫 기록·Pattern 뒷판 수정 — codex-analysis / 2026-10-13

- 전체 기능·진행 단계·미확인 목록을 `docs/tylko-reference/`에 작성. UI 사례7개, 공개 소스 분석1개, PNG10개. 기존 문서·다른 작업자 기록 보존.
- Pattern 밀도0/1/2%와2% 복귀 실험에서 모델 ROI 픽셀 동일. 초기 시드·새로고침·다른 디자인 독립성은 미확인.
- `src/lib/three/styles/pattern.ts` 좁은 폭의 뒷판 선택 무시 수정. 30cm 사례와 수정 후 처음 조사한37cm 보류 사례에서 한 칸·표시 내경 일치. OFF 보강판·외관 차이는 남음.
- `scripts/tylko-pattern/back-panels.test.mjs`: 3개 통과. 수정 파일 eslint 통과. `npm run build` 통과. 전체 lint는 기존 DimensionOverlay 3개/Scene 1개 오류와 경고15개로 실패. 이 차수에서 해당 파일을 수정하지 않음.
- 전체 목표는 미완료. 핵심 다음 작업은 현재 제품의 공개 설계표 선택과 단위 변환 확인, 다행 Pattern 밀도/병합 경계 검증. 정확한 생성 공식 확보 전 임의 난수/좌표 대체 금지.
- 소스 작업 잠금: 이번 차수의 Pattern 및 검사 파일 편집 완료. 공통 파일/규칙 최종 담당은 리더로 유지하며 변경 요청은 조율 섹션에 남긴다. 아직 수정하지 않은 grid 공통 타입/layout/DimensionOverlay는 현재 편집 중이 아님.
- 세 보조 작업자는 위 T-02~04 문서 배정 상태이며 수신·착수 확인은 아직 없음. 결과는 각자 `docs/worker-results/<id>.md`에 기록한다.
- 검증 화면은 localhost:3003의 Befun. 최종 UI 상태는 Pattern,37cm,한 행 내경38cm,깊이40cm,밀도2%,뒷판ON. 카메라/재질 동치 미검증.

### 협업 문서 초기 설정 — claude (Claude Code CLI) / 2026-10-13

- 변경 내용: `docs/team-tasks.md`, `docs/web-analysis.md`(템플릿), `docs/analysis-questions.md` 생성
- 수정 파일: 위 3개 (소스 변경 없음)
- 검증: 해당 없음
- 남은 질문: `docs/AGENTS.md`, `docs/CLAUDE.md`에 다른 에이전트가 작성한 협업 섹션이 있으나 루트 `AGENTS.md`/`CLAUDE.md`에는 아직 반영되지 않음. 에이전트는 루트 파일만 자동으로 읽으므로 작성자가 루트로 옮겨야 함.

### 3D 뷰어 그래픽 1차 개선 — claude-graphics / 2026-10-13

- 변경 내용:
  - 레거시 조명과 flat 모드를 해제하고 Khronos PBR Neutral 톤매핑을 적용. Lightformer 기반 스튜디오 환경광(외부 HDR 없음) 추가.
  - 키 라이트 1개를 VSM 소프트 섀도로 변경.
  - 그라데이션 셰이더 바닥을 실제 벽(z=0)과 바닥 메쉬로 교체. 벽은 그림자를 받고, 바닥에는 캔버스 블러 텍스처로 만든 접지 그림자 데칼을 깔았다.
  - 신규 `Effects.tsx`: EffectComposer(HalfFloat, MSAA 4) → GTAO → OutputPass. 투명 메쉬와 `userData.excludeFromAO` 메쉬는 AO G-buffer에서 제외.
  - 재질: roughness를 1.0에서 0.62(단색)·0.72(목재)로 낮추고, 텍스처 anisotropy 8 적용.
  - 카메라: near를 0.1에서 1로, far를 1000에서 5000으로 변경. 극각을 27°~88°, 방위각을 ±60°로 제한.
- 수정 파일: `src/components/three/Scene.tsx`, `src/components/three/Background.tsx`, `src/components/three/Effects.tsx`(신규), `src/lib/three/materials.ts`. 의존성 추가 없음.
- 검증:
  - `npx tsc --noEmit` 오류 0.
  - eslint: 기존 문제 2건(Scene.tsx:20 `any`, materials.ts 미사용 import)만 남고 신규 문제 없음.
  - 헤드리스 Chrome(Metal)에서 정면·45°·상단 시점, Solid/Natural 마감 스크린샷 확인.
  - Midnight Blue 정면 픽셀 #263a58, 견본 #283A57.
  - `npm run build`는 dev 서버가 같은 `.next`를 쓰고 있어 실행하지 않음.
- 남은 질문 / 주의:
  - drei `ContactShadows`는 사용하지 않는다. blur 평면이 월드 원점에 고정되어 있어, 선반이 z=0~depth에 놓이는 이 씬에서는 그림자가 벽 뒤로 밀려 그려진다.
  - VSM은 바닥이 그림자를 받으면 벽-바닥 모서리에 계단 무늬가 생겨서, 바닥은 그림자를 받지 않게 했다.
  - 모바일 성능(GTAO 16샘플, dpr 최대 2)은 아직 미검증.
  - 사람 실루엣이 이제 톤매핑을 거친다.
  - 기존 문제: `createFaceMaterials`가 패널마다 머티리얼을 clone하고 해제하지 않음(메모리 누수 가능).
- 후속 수정 (사용자 피드백 "누렇다"): 조명과 벽/바닥의 따뜻한 색조를 모두 제거하고 무채색으로 변경. 측정값: 벽 #e6e6e6, 바닥 #d4d4d4, 벽 그림자 #bfbfbf.
- 후속 추가 (사용자 지시): 스페이스바를 누르면 카메라가 정면 시점으로 복귀(`Scene.tsx` AutoFocusCamera). 텍스트 입력 중에는 무시하고, 페이지 스크롤과 포커스된 버튼 재클릭을 막음. 헤드리스에서 회전 후 스페이스로 정면 픽셀이 일치하는 것 확인.
- 후속 수정 (사용자 피드백 "솔리드 컬러 미흡"):
  - 단색 도장면: roughness를 0.62에서 0.5로 낮추고, 아주 약한 노이즈를 map(±2%)과 roughnessMap에 넣음. 텍스처는 세트마다 새로 만듦(dispose 공유 문제 방지).
  - 조명 대비 축소: 환경광 1.25→1.9, 키 라이트 1.9→1.2, 우측 반사광 0.9→1.6, AO 0.85→0.65, exposure 1.0→0.85, 바닥 albedo #bababa→#a9a9a9.
  - 측정: Navy 정면 #263c5d(견본 #283A57), Ivory 정면 #f0ece2(견본 #E7E3DA), Ivory 측면 #9a9790→#b0aca5. 벽 #ececec, 바닥 #c9c9c9.

### CNC 옵티마이저 이식 1~3단계 — claude-optimizer (Claude Code CLI) / 2026-10-13

- 변경 내용: 250709in `main@7ecfd99`의 CNC 옵티마이저(재단 배치 엔진, MPR/CIX/DXF/PDF/CSV 내보내기, 재단·가공 시뮬레이션, `CNCOptimizerPro` 화면)를 `src/lib/optimizer/upstream/`에 원본 경로 그대로 이식. 원본 가구 store/Firebase/스케치 의존은 shim으로 대체(목록: `src/lib/optimizer/upstream/README.md`). Befun 디자인 → 옵티마이저 판재(mm) 변환은 `src/lib/optimizer/befun/`. 새 페이지 `/optimizer`(noindex).
- 수정 파일: 신규 `src/lib/optimizer/**`, `src/components/optimizer/**`, `src/app/optimizer/page.tsx`, `public/sfx/cnc/`, `public/hdri/`, `public/materials/`. 공통: `package.json`/lock(jszip, polygon-clipping, three-bvh-csg, three-mesh-bvh, mediabunny, lucide-react, jspdf, fabric 추가), `eslint.config.mjs`(upstream 디렉터리 무시 1줄), `CLAUDE.md`(스타일 디스패치 목록에 `lib/optimizer/befun/model.ts` 추가).
- 검증: `tsc --noEmit` 0 오류. `npm run build` 성공(`/optimizer` 포함). `npm run lint`: 옵티마이저 코드 0 오류(기존 4 오류는 `DimensionOverlay.tsx`·`Scene.tsx`, 이 작업과 무관). 원본 단위 테스트 475개 중 473개 통과(실패 2개는 원본에서도 동일 실패). Befun 변환 테스트: 6개 스타일 × 도어/서랍 전부 배치 성공. 헤드리스 Chrome으로 `/optimizer`의 배치 계산, 재단도, HOMAG MPR ZIP(패널 25개 + assembly.json), 전체 시뮬레이션 재생 화면 확인.
- 남은 질문/후속 작업:
  - Befun 판재의 실제 생산 규격(재질·두께). 지금은 3D 모델 값 그대로 PB 20mm라 원장 단가가 "미산정"으로 나옴(원본 단가표: PB 15/18, MDF 9, PET 15/18).
  - Befun 결합 방식의 보링·홈·엣지 규칙(4단계). 정해지기 전까지 MPR은 외곽 치수만, 시뮬레이션은 재단 공정만 나옴.
  - ~~컨피규레이터 → `/optimizer` 진입 버튼~~ → 완료(아래 기록).
  - ~~`/optimizer` 접근 제한~~ → 완료(아래 기록).
  - `codex-analysis` 회신 확인: Pattern 뒷판 보완은 변환 코드가 backPanel을 그대로 처리하므로 추가 작업 없음.

### 컨피규레이터 → 옵티마이저 진입 버튼 — claude-optimizer (Claude Code CLI) / 2026-10-13

- 변경 내용: 컨피규레이터 헤더에 "CNC 옵티마이저" 버튼 추가. 누르면 현재 디자인을 sessionStorage(`befun-optimizer-design`)에 저장하고 `/optimizer`로 이동. `/optimizer`는 저장된 디자인을 쓰므로 새로고침해도 유지(없으면 현재 스토어 값).
- 수정 파일: `src/app/configurator/page.tsx`(import 1줄, 핸들러, 헤더 버튼), 신규 `src/lib/optimizer/befun/session.ts`, `src/components/optimizer/OptimizerApp.tsx`.
- 검증: `tsc` 통과(단, 진행 중인 `codex-storefront`의 `src/app/page.tsx`가 아직 없는 `@/components/storefront/Storefront`를 import해 개발 서버에 오류 오버레이가 뜸 — 이 작업과 무관). 헤드리스 Chrome: 기본 디자인 진입(보강대·가로판·세로판) → 컨피규레이터에서 Slant·백패널 ON 변경 → 재진입 시 백패널 반영 → 새로고침 후에도 유지.
- 남은 질문: 없음.

### `/optimizer` 접근 제한 — claude-optimizer (Claude Code CLI) / 2026-10-13

- 변경 내용: 서버에서 `OPTIMIZER_ADMIN_EMAILS`(쉼표 구분, 대소문자 무시)에 등록된 로그인 계정만 허용. 비로그인 시 `/login?callbackUrl=/optimizer`로 이동, 미등록 계정은 "접근 권한이 없습니다" 화면. 환경변수 미설정 시 개발 환경만 허용, 운영은 차단.
- 수정 파일: 신규 `src/lib/optimizer/access.ts`, `src/app/optimizer/page.tsx`, `CLAUDE.md`(환경변수 설명 1문장).
- 검증: `tsc`·eslint 통과. 접근 규칙 단위 테스트 6개 통과(미설정 개발/운영, 비로그인, 등록·미등록 계정, 대소문자). 개발 서버 `/optimizer` 200. `force-dynamic` 추가(정적 빌드되면 권한 검사가 빌드 시점에 고정됨). 운영 빌드 + `next start`: 환경변수 없음 → 차단 화면, 설정+비로그인 → `/login?callbackUrl=/optimizer` 307. 운영에서 세션 확인에는 `NEXTAUTH_SECRET` 필수(없으면 500).
- 남은 질문: 운영 배포 시 관리자 이메일 목록.

### 임가공 시뮬레이션 엣지밴딩·판재 색 연결 — claude-optimizer (Claude Code CLI) / 2026-10-13

- 변경 내용: upstream 시뮬레이션은 재질 설정의 엣지색이 있어야 엣지밴딩 공정을 만들고, 판재 겉면은 재질 견본 이름(textureName)으로 찾는다. Befun 색상별 겉면·엣지색(`src/lib/optimizer/befun/colors.ts`, Classic/Natural은 텍스처 평균색)을 연결. Solid/EdgeMix/Natural은 엣지밴딩, Classic은 합판 단면 노출로 보고 엣지밴딩 없음.
- 수정 파일: 신규 `src/lib/optimizer/befun/colors.ts`, `befun/toCncPanels.ts`, `components/optimizer/OptimizerApp.tsx`, upstream `materialData.ts`(Befun 견본 추가, 표기함), upstream README.
- 검증: 기본 디자인(S_Midnight Blue)에서 시뮬레이션 공정이 "재단 293단계 → 엣지밴딩 366단계"로 나오고 판재가 Befun 색으로 표시됨(헤드리스 Chrome). 원본 테스트 473/475 유지(실패 2개는 원본 동일).
- 남은 질문: Classic 엣지 처리 확인, 엣지 붙일 면(현재 upstream 기본 = 사방, 백패널·보강대만 좌우 제외), 보링·홈 규칙(가공 공정).

### 컨피규레이터 모바일 반응형 UI — claude-graphics / 2026-10-13

- 변경 내용:
  - lg 미만은 100dvh 앱형 레이아웃: 3D 뷰어 + 하단 시트(`MobileConfiguratorPanel`). 시트는 탭 4개(스타일 / 크기 / 색상 / 옵션)로 나누고, 현재 탭이나 핸들을 누르면 접힘(뷰어가 커지고 카메라 자동 재조정). 가격(compact) + 구매하기는 항상 하단에 고정, safe-area 대응.
  - 데스크톱(lg 이상) 레이아웃은 그대로.
  - 뷰어 버튼에 '정면 보기'를 추가하고, `cameraEvents.ts`의 window 이벤트로 연결(스페이스바와 같은 동작).
  - 스타일 칩: 화면 끝까지 가로 스크롤(snap).
  - 터치: 칸을 탭하면 행 컨트롤이 열리고, 같은 칸·빈 곳을 탭하거나 X 버튼으로 닫힘. 드래그(회전)는 무시하고, 마우스 hover 동작은 그대로. 모바일 팝업은 뷰어 하단 가운데에 고정하고 미리보기 이미지는 숨김.
- 수정 파일: `src/app/configurator/page.tsx`(레이아웃만), 신규 `src/components/ui/MobileConfiguratorPanel.tsx`, 신규 `src/components/three/cameraEvents.ts`, `PriceDisplay.tsx`(compact 옵션), `StyleSelector.tsx`, `FloatingBox.tsx`, `RowControls.tsx`, `RowColliders.tsx`, `Scene.tsx`.
- 검증:
  - tsc: DimensionOverlay 기존 오류 1건 외 0건. eslint: 기존 문제 3건만 남고 신규 문제 없음.
  - 헤드리스 Chrome에서 390×844(터치), 820×1180, 1440×900 확인. 탭 전환, 시트 접기, 칸 탭 팝업 동작 확인.
- 남은 질문 / 주의:
  - 실제 iOS Safari·Android 기기에서는 미검증.
  - 헤드리스 캡처에서 데스크톱 캔버스가 빈 화면으로 나온 적이 간헐적으로 2회 있었고, 바로 다시 찍으면 정상. 원인 미확정(다른 작업의 HMR 재컴파일과 겹친 것으로 추정).
  - Next 개발 표시(N 배지)가 모바일 가격 위에 겹치는데, 운영 빌드에서는 나타나지 않음.

### 모바일 AR — claude-graphics / 2026-10-13

- 변경 내용:
  - AR 버튼은 기기를 판별해 동작이 갈림(`ar/arSupport.ts`).
  - 안드로이드 Chrome(ARCore): WebXR immersive-ar + hit-test + dom-overlay(`ar/ARController.tsx`, `ui/AROverlay.tsx`). 레티클로 바닥을 표시하고, 빈 곳을 탭하면 사용자를 향하게 놓거나 그 자리로 이동. 회전 버튼(±22.5°)과 하단 옵션 패널로 놓은 채 실시간 수정 가능. 선반은 일반 모드와 같은 `<Shelf/>`를 0.01배로 축소해 그리므로 스토어 변경이 바로 반영됨. AR 중에는 룸·궤도 카메라·후처리(Effects)를 끄고 접지 데칼만 사용.
  - 아이폰: 현재 씬의 선반을 USDZ로 내보내 AR Quick Look으로 열기(`ar/exportUSDZ.ts`, `ui/QuickLookSheet.tsx`). 멀티 머티리얼 패널은 면별로 나눠 내보냄. 단위 m, 바닥 중심이 원점, `allowsContentScaling=0`(실제 크기 고정).
  - 그 외 기기는 기존 QR 모달.
- 수정 파일: 신규 `src/components/three/ar/{arStore,arSupport,exportUSDZ}.ts`, 신규 `ar/ARController.tsx`, 신규 `src/components/ui/{AROverlay,QuickLookSheet}.tsx`, `Scene.tsx`, `Background.tsx`(ContactShadowDecal export), `MobileConfiguratorPanel.tsx`(inOverlay 옵션), `configurator/page.tsx`(AR 버튼 분기).
- 검증:
  - tsc: 신규 오류 0(현재 남은 오류는 optimizer 진행 중 코드 2건). eslint: 신규 문제 없음.
  - 헤드리스에서 USDZ 실제 생성 확인. Solid 620KB / Natural 3.9MB(텍스처 28개 연결). 바운딩박스 0.9×1.23×0.32m로 설계 90×123×32cm와 일치, 바닥 y=0, 중심 원점.
  - 일반 모드 데스크톱·모바일 렌더링 회귀 없음.
- 남은 질문 / 주의:
  - **실기기 미검증.** WebXR 세션·히트 테스트·dom-overlay와 iOS Quick Look 열림은 데스크톱 헤드리스로 확인할 수 없음.
  - 안드로이드 WebXR은 보안 컨텍스트가 필요: `adb reverse tcp:3003 tcp:3003`로 폰에서 `http://localhost:3003`을 열거나 HTTPS 터널을 써야 함. LAN IP(http)로는 `navigator.xr`이 없음.
  - Next 16 개발 서버는 다른 호스트(IP)에서 접근할 때 `allowedDevOrigins` 설정이 필요할 수 있음(next.config.ts, 미수정).

### OVVO 커넥터 19종 — 접합부 자동 배치·MPR·가공 시뮬레이션 — claude-optimizer (Claude Code CLI) / 2026-10-13

- 변경 내용: ovvotech.com 기술 자료(설치 설명서·사양서 40개)에서 19종 가공 치수 추출 → `src/lib/optimizer/connectors/ovvo.ts`. Befun 판재 박스에서 "마구리↔면" 접합부 자동 탐지 후 커넥터 간격 규칙대로 배치하고 양쪽 판재 가공(마구리/면 키홀 슬롯, 마구리·면 드릴, Ø25 면 보링, 8자 하우징 구멍)을 `manufacturingBoring`으로 생성(`connectors/apply.ts`). `/optimizer` 상단에 관리자 선택 줄(몸통·백패널 접합 커넥터, 커터 공구 번호, 규격·경고 보기). upstream 확장 목록은 `src/lib/optimizer/upstream/README.md`.
- 수정 파일: 신규 `src/lib/optimizer/connectors/**`, `src/components/optimizer/ConnectorBar.tsx`; `src/lib/optimizer/befun/toCncPanels.ts`, `src/components/optimizer/OptimizerApp.tsx`; upstream(표기함) types·MPR·시뮬레이션 9개 파일.
- 검증: tsc 0, eslint 0, `npm run build` 성공. 원본 테스트 473/475 유지(실패 2개 원본 동일). 6개 스타일 × 19종 배치 테스트 114개 통과(가공 좌표 판재 범위). 헤드리스 Chrome으로 자동 배치 가능 18종 전부: MPR ZIP 생성(가로판 아랫면 `(하면)` 파일 분리), 시뮬레이션 3공정(재단 → 엣지밴딩 → 보링·홈 가공) 오류 없음, V-1230P 마구리 키홀 슬롯 3D 확인.
- 남은 질문: ① 마구리 슬롯 MPR의 측면 작업 평면 번호(KO 01~04)·앵글헤드 공구는 HOMAG 설정마다 달라 시험 가공/샘플 MPR로 확인 필요 ② 문서 불일치·미기재 값(카탈로그 notes) 확인 ③ V-Clasp은 반턱 백패널 구조 전용이라 자동 배치 제외 ④ CIX(Biesse) 출력에는 슬롯 미반영 ⑤ 판재 실제 두께(현재 20mm).

### 옵티마이저 3D 뷰어 판재 메시에 보링·커넥터 슬롯 반영 — claude-optimizer (Claude Code CLI) / 2026-10-13

- 변경 내용: 옵티마이저 3D 뷰어(upstream `PanelHighlight3DViewer` shim)의 판재 메시를 MPR 가공 원본(`manufacturingBoring`)으로 CSG 차감해 구멍·키홀 슬롯을 실제로 파냄(`src/lib/optimizer/befun/panelGeometry.ts`). 커넥터 가공은 접합면 안쪽이라 "분해 보기(가공 확인)" 버튼 추가. 조명 대비·시야 조정.
- 검증: tsc·eslint 통과. 헤드리스 Chrome 분해 보기에서 V-1230P(마구리·면 키홀), PN12(Ø25 마구리 개방 보링), OD830(Ø8 마구리·면 구멍)이 메시에 파인 것 확인.
- 남은 질문: 컨피규레이터(고객 화면) 3D에는 가공을 표시하지 않음 — 필요 여부 확인.

### AR 화면 개편 (Tylko 태블릿 AR 참고) — claude-graphics / 2026-10-13

- 변경 내용: `AROverlay` 재구성. 왼쪽 위 '쇼룸'(AR 종료), 오른쪽 위 가격·장바구니(누르면 AR 종료 후 담기), 아래 '크기 조절'·'스타일·색상' 버튼. 크기 조절 시트(`ARDimensionSheet`)는 너비 30~450cm, 높이(행 수 1~10, 표시는 총높이), 깊이 24/32/40을 자 눈금 슬라이더(`RulerSlider`)로 조절. 드래그 중 값 말풍선, 놓은 선반에 즉시 반영, 취소 시 시트를 열 때의 크기로 복원, 적용 시 유지. 회전 버튼은 시트가 닫혀 있을 때만 표시. 테마는 Befun 그린.
- 수정 파일: `src/components/ui/AROverlay.tsx`, 신규 `ARDimensionSheet.tsx`, `RulerSlider.tsx`.
- 검증: tsc·eslint 0. 820×1180 터치 에뮬레이션에서 AR 상태를 강제해 레이아웃과 시트 표시를 확인(임시 디버그 훅은 제거함). **실기기 WebXR 미검증**.
- 제약: 아이패드·아이폰 Safari는 WebXR이 없어 실시간 수정 AR은 안드로이드만 가능. iOS는 Quick Look 놓아보기.

### (작업명) — 담당 / 날짜

- 변경 내용:
- 수정 파일:
- 검증:
- 남은 질문:

- codex-analysis 현재 잠금 추가: `src/components/three/DimensionOverlay.tsx` — Pattern 실제 개구부 내경 표시 연결. `pattern-rules.json`, `pattern-motion.json` 포함. 공통 PanelData와 호출 인자는 유지하며 PatternResult에 openings/boardThickness/bodyHeight/effectiveDensity를 추가합니다. Pattern 물리 판두께는 검증된 Type02 기준 18mm입니다. 옵티마이저 담당 참고: 기존 전역20mm 가정과 구분 필요.


### Pattern 핵심 생성기 교체 — codex-analysis / 2026-10-13

- 실제 공개 Pattern 설계표497개와 밀도 보정표를 확인하고 독립 해석기 구현. Type02 열린 구조의 폭12 × 밀도101 × 행 구성3 =3,636 사례 모두 수치 좌표 일치. 특정 화면 임의 좌표 방식 아님.
- `pattern.ts`, `pattern-rules.json`, `pattern-motion.json`, `DimensionOverlay.tsx`, `scripts/tylko-pattern/**`, `docs/tylko-reference/**` 변경. 전체 Pattern 옵션은 미완료.
- 회귀5개/tsc/변경 소스 eslint/build 통과. 전체 lint 기존Scene.tsx 오류1개+경고15개 남음. 다른 담당 잠금 파일 보존.
- 후속 우선순위: 뒷판/하드웨어 실제개구부 연결, 전역 두께·발·외경 정합, 마감 제품군, 실화면 비교. 보조 작업자 배정은 공유문서 상태 유지, 수신/작업했다고 주장하지 않음.

### Mosaic 블록 오류·치수 표시 수정 — codex-analysis / 2026-10-13

- 사용자 스크린샷 재현 수정. 잠금: `src/lib/three/styles/mosaic.ts`, `src/components/three/DimensionOverlay.tsx`, 신규 `scripts/tylko-mosaic/**`, `docs/tylko-reference/**`. 다른 담당 재질/Scene 파일은 수정하지 않음.
- 우선 완료 기준: Mosaic의 칸 전체를 채우는 직육면체 제거, 실제 판재 경계 생성, 뒷판 OFF에서 개방, 투명 치수 라벨. 레퍼런스 Mosaic 생성 규칙 동치와 이 명백한 렌더링 오류 수정은 구분.

### Tylko 쇼핑몰 메인 구현 — codex-storefront / 2026-10-13

- 변경: 메인 전용 레이아웃, 원본 영상/이미지, 반응형 내비게이션, 카테고리/상품 캐러셀, 검색, 즐겨찾기 저장, 상세/스토리/FAQ dialog, 기존 커스터마이저 프리셋 연결. 한국어/Befun 브랜드/기존 원화 계산식을 사용. 완전한 픽셀 동치로 주장하지 않음.
- 수정: `src/app/page.tsx`, `src/components/storefront/**`, `public/imgs/storefront/**`, `docs/storefront-clone.md`. 공통 및 3D 파일은 수정하지 않음.
- 검증: 변경 파일 eslint 0 오류/경고. 최초 전체 Turbopack build 성공. 최종 webpack build는 JS/CSS 컴파일 성공 후 `DimensionOverlay.tsx:208`의 cells unknown 오류로 실패. 전체 lint는 기존 Scene.tsx:20 any 오류 및 경고15개.
- Chrome 1728×880 / 390×844: 영상 재생/정지, 모바일 메뉴, 검색 결과/빈 상태, 하트 추가/새로고침 유지/제거, 필터, 섹션 이동, 가로 넘침/이미지 로드 확인. 수납장 색 선택 → 3D 110×63×32cm, Midnight Blue, 334,400원 확인.
- 조율: codex-analysis 담당 `src/components/three/DimensionOverlay.tsx:208`의 `styleResult.cells` unknown이 현재 전체 타입 검사와 빌드를 막음. 해당 공통 파일은 본 작업에서 변경하지 않았으므로 담당자 확인 필요.
- 원본과의 차이, 외부 리소스 의존성, 실제 검증은 `docs/storefront-clone.md` 참조. 메인 작업 잠금 해제.

- 2026-10-13 codex-analysis 추가 범위(사용자 요청): Mosaic 부분 뒷판, Tylko형 회색 치수 캡슐, 하부 조절발과 실제 가로판 분절 규칙. 잠금 추가: `src/components/three/LevelingFeet.tsx`, 신규 `src/lib/three/reference-*.ts`, `src/lib/three/styles/mosaic-rules.json`. 필요 시 `Shelf.tsx`의 발 입력 전달만 리더가 수정. PanelData 계약 유지.
- 독립 읽기 전용 분석: Codex 내부 보조 support_rules(공개 번들 조절발 규칙), horizontal_rules(공개 번들 가로판 분절 규칙). 소스/공유문서 수정 권한 없음. 기존 외부 Claude-1/2 배정은 보존.
- 완료 기준 정정: Mosaic 뒷판 OFF는 완전 개방이 아니라 기본 부분 뒷판 유지. 임의 난수와 후면 보강대를 사용하지 않음. 치수는 사용자 최신 스크린샷의 반투명 회색 캡슐/흰 글씨를 기준으로 함.
- 분절 구현 독립 배정: 내부 Codex 보조 `horizontal_rules`만 `src/lib/three/reference-horizontal-splits.ts`, `scripts/tylko-mosaic/horizontal-splits.test.mjs` 수정. 리더는 Mosaic 연결과 최종 검증 담당. 이 두 파일은 리더 동시 수정 금지.
- 공통 설정 단일 담당 codex-analysis: `tsconfig.json`의 `allowImportingTsExtensions`만 추가. noEmit 프로젝트에서 Node 내장 TypeScript 회귀 테스트와 Next가 같은 분절 helper를 읽도록 명시적 .ts import 허용.
- 사용자 최신 지시: 모든 스타일에서 중간 조절발이 실제 하단 세로판을 받치도록 정합 수정. 기존 스타일별 별도 간격식 제거, 렌더 판재를 입력으로 사용. Mosaic 외 스타일의 Tylko 전체 동치는 별도 미확인.
- 색상 작업 추가 잠금(codex-analysis): 신규 `src/lib/three/reference-colors.ts`, `src/components/ui/ColorPicker.tsx`, `Shelf.tsx`의 색상 팩토리 호출부. `claude-graphics`의 materials/Scene/Background/Effects 잠금은 유지. 공개 Type02 palette에서 Terracotta=#954227 확인. 기존 S_Teracotta=#C88A64/S_Teracotta Orange=#A8442B와 다름. 리더는 재질 색상 입력값·견본 연결만 수정하며 그래픽 조명·톤매핑은 담당자 파일을 보존.
- 색상 후속(codex-analysis): 공개 Type02 UI의 실제 노출16개 단색을 제공. 기존 Terracotta Orange 저장키는Terracotta로 같은값을 사용. Type01 Classic5색 평면/뒷판만 공개색상으로 보정하고 합판 엣지 텍스처는 보존. Natural 텍스처 동일성 미확인.
- 옵티마이저 담당 인계: `befun/colors.ts`가 기존 materials.ts 팔레트를 읽어 새견본과 다를 수 있어 잠금해제 상태를 확인하고 리더가 REFERENCE_COLORS/CLASSIC override만 연결합니다. 부재·사업규칙 변경 없음.

### 블룸형 보기 도구 모음 — codex-display / 2026-10-13

- 사용자 직접 구현·계속 지시. 범위: 신규 `src/components/three/display/**`, `docs/blum-display-modes.md`. 상태: 구현 중.
- 공통 파일 연결 범위 공지: `Scene.tsx`의 카메라 컴포넌트 교체·뷰어 UI 연결·분해 시 배경 숨김만, `Shelf.tsx`의 화면 전용 분해 그룹 래핑만 수정합니다. 기존 그래픽 조명/재질/AR, 리더님의 스타일·색상·발 계산은 보존합니다. 기존 담당자 수신은 미확인입니다.
- 치수/투영/분해는 화면 전용 상태로 분리합니다. AR 및 USDZ에는 조립된 모델이 유지되도록 처리합니다.

- codex-display 추가 통합 범위: `ar/exportUSDZ.ts`에서 export용 복제본의 화면 분해 오프셋만 제거합니다. ARController·재질·단위 변환 로직은 유지합니다. 분해 상태에서 아이폰 export가 분해된 치수로 저장되는 회귀 방지 목적입니다.

### Mosaic·발·가로판·색상 통합 결과 — codex-analysis / 2026-10-13

- Mosaic Type02 기본 구조의 공개 템플릿 해석, 부분 뒷판, 합쳐진 칸, 분할 선반 구현. 기준232/69/5×38/32cm 화면과 비교 저장. 전체 스타일·옵션 완료 아님.
- 가로판 실제 분절: 2400mm 초과 연속 판재의 후보 경로를 선택하여 gap 없는 부재로 나눔. 같은 입력 판재를 공개 분절 함수와 비교한1,216사례 불일치0. 전체 Mosaic 생성기1,216사례 동치를 뜻하지 않음.
- 조절발: 실제 렌더 판재의 하단 세로축을 입력으로 사용. Mosaic 공개 발 함수와 같은 입력288사례 일치. 다른 스타일 균등 간격식 제거 및 비균등 칸 회귀 통과. 발 형상·노출 높이는 미확인.
- 재질: reference-colors.ts 공개 RGB를 Shelf/ColorPicker/optimizer에 공통 적용. Solid16색, Mix3조합, Classic5색 평면. shared materials.ts/Background/Effects/Scene은 수정하지 않음.
- 검증: 회귀15개 통과(기존 Pattern3,636 fixture 포함), tsc 및 변경 파일 eslint 통과, 최종 npm run build -- --webpack 성공. 기본 Turbopack 빌드는 정체되어 중단했으며 성공으로 기록하지 않음. 전체 lint 기존 Scene.tsx any 오류1건 및 경고14건은 별도 담당.
- 증거: docs/tylko-reference/cases/{mosaic-001,mosaic-source-001,material-source-001,feet-defect-001}.json 및 screenshots.
- graphics 인계 요청(수신 미확인): 같은 RGB라도 최종 화면 테라코타가 어둡습니다. 환경맵·조명·톤매핑 및 Natural/합판 엣지 텍스처 비교 필요. 재질값을 임의 밝기 보정하지 말고 source RGB 유지 바랍니다.
- 이 수정 묶음 검증 완료로 codex-analysis 및 내부 horizontal_rules의 해당 파일 잠금 해제. codex-display의 Shelf 화면 래핑 작업과 다른 담당 잠금은 보존합니다. 미확인 기능들은 전체 분석의 다음 단계로 남습니다.

### Pattern/Mosaic 도어·서랍 정합 및 Classic 선택지 — codex-analysis / 2026-10-13

- 사용자 최신 요청. 우선순위: 실제 칸과 어긋난 도어·서랍 수정, Tylko 하드웨어 배치/제약 조사, Classic 자작나무 누락 색상 추가.
- 잠금: lib/three/hardware.ts, 신규 reference-hardware.ts, Door.tsx, Drawer.tsx, useHardwareStore.ts, RowControls.tsx의 하드웨어 조건, Pattern/Mosaic 생성기 하드웨어 연결, ColorPicker.tsx 및 reference-colors.ts, docs/tylko-reference/**.
- Shelf.tsx는 codex-display의 화면 분해 래핑을 보존하고 리더가 placement 입력부만 변경합니다. 기존 공유 파일의 다른 변경을 덮어쓰지 않습니다.
- 내부 읽기전용 보조: support_rules Classic색상, horizontal_rules 하드웨어 공개수치. 브라우저 조작/프로젝트 수정은 리더만 담당합니다.

- Classic 독립 구현 위임: 내부 support_rules만 reference-colors.ts, ColorPicker.tsx, 신규 cases/material-classic-002.json 수정. 4색 추가·9색 순서·기존키 보존. 리더는 이 파일을 동시에 수정하지 않고 Shelf 신규Classic키 텍스처 fallback만 연결합니다.

- codex-display 사용자 추가 요청: 반투명·와이어프레임 표시, 투시도/평행투영을 별도 버튼으로 변경. 신규 DisplayModel에서 화면 재질만 복제하고 원본 재질/AR export는 보존합니다.

### 블룸형 보기 도구 모음 완료 — codex-display / 2026-10-13

- 7방향 보기, 투시도·평행투영 별도 버튼, 분해도, 치수, 실사·반투명·와이어프레임 구현. 모바일 보기 메뉴 포함.
- 신규 `src/components/three/display/**`; 연결부 `Scene.tsx`, 분해 표시 `Shelf.tsx`, 표시 상태 복원 `ar/exportUSDZ.ts`. 스타일·원본 재질·ARController·페이지 레이아웃은 미수정.
- 검증: production build 성공, 변경 ESLint 통과, 전체 lint 오류0/기존경고13. 카메라/AR 복원 회귀3개 통과. Chrome 데스크톱과390×844 모바일 실제 확인.
- 상세 근거/제약: `docs/blum-display-modes.md`. 반투명/와이어프레임은 사용자 추가 요청이며 블룸의 동일 메뉴를 관찰했다고 주장하지 않음. AR 실기기 미검증.
- codex-display의 수정 잠금 해제. 다른 담당의 기존 잠금은 그대로 보존.

### 조립 영상형 시뮬레이션 — codex-display / 2026-10-13
- 사용자 직접 요청: 부품 바닥 정렬 분해 → 하단 가로판/세로판/다음 가로판 순차 조립. 신규/기존 display/**, Scene의 시뮬레이션 바닥 연결, Shelf의 display 래퍼/계획 계산만 잠금. 하드웨어 placement 계산/리더 재질 수정은 보존.
- 재생/일시정지/다시보기, 속도, 단계 표시와 옵션 변경 시 안전 초기화. AR 모델은 원래 조립 상태 유지. 상태: 구현 중.

- 내부 horizontal_rules 구현 잠금: reference-hardware.ts, hardware.ts, Door.tsx, Drawer.tsx, scripts/tylko-hardware/render.test.mjs. 리더동시수정금지. source확인 front/hinge/drawergeometry 담당. 리더는 생성기·입력연결·저장형식·옵티마이저연결 담당. 추가리더허용파일: grid.ts 입력타입, hardware-state.ts, sharing.ts, configurator/page.tsx와 share/[code]/page.tsx 저장/복원부, optimizer/befun/model.ts/session.ts, PriceDisplay/DimensionOverlay 입력부. 다른담당 UI/그래픽변경은보존.


### 쇼핑몰 페이지·규격·로고 보완 — codex-storefront / 2026-10-13

- 컨피규레이터와 같은 `/imgs/icon/main_logo_new.png` 이미지(120px)를 StorefrontFrame/BrandLogo에 공통 적용. 기존 창작 글자 로고 제거. configurator 소스는 수정하지 않음.
- 실제 내부 페이지와 공통 ShopLayout 연결, 카테고리/상품 상세/검색/즐겨찾기/커뮤니티/고객지원/정책/기업 화면 추가. account·myshop 기존 mypage 연결.
- 수납장 17/옷장 11/소파 7개의 실제 원본 컬러 사진, 제작 과정 아코디언, 이메일 계정 진입 폼 추가. 임의 CSS 재착색 제거.
- 이번 파일 ESLint와 tsc 통과, 전체 webpack 프로덕션 빌드 통과. 전체 lint는 Scene.tsx:23 any 오류 1 및 다른 담당 경고 13으로 실패. 잠금 파일은 수정 안 함.
- 76개 URL HTTP 200, 없는 카테고리 404. 상세→configurator에서 110×63×32cm/334,400원 일치. 모바일390px에서 메인32px/38.4px, CTA184.1×48px, 문서 가로넘침 없음 확인.
- **완전 클론 완료로 기록하지 않음**: 상담 API/뉴스레터/기프트카드 판매, 실제 Befun 상품·쇼룸·정책 데이터 미제공. 모든 원본 상세/위젯/영문 글리프/영상/전체 픽셀 동치는 미완료. 정책/외부 상품/리뷰는 실제 Befun 정보로 가장하지 않음. 상세 차이 및 전체 링크 검사: `docs/storefront-page-audit.md`.
- 이 작업의 파일 잠금 해제. 그래픽/Pattern 담당 잠금은 유지.

- codex-storefront 최종 브라우저 확인 중 동일 홈 경로 로고 클릭 시 스크롤 복귀가 없는 동작 발견. `StorefrontFrame.tsx`의 홈 클릭 시 상단 복귀를 수정하고 브라우저에서 확인함. 임시 잠금 해제.

### 조립 영상형 시뮬레이션 완료 — codex-display / 2026-10-13

- 부품 바닥 정렬 분해, 발→하단 가로판→세로판→다음 가로판의 순차 조립, 회전/상승/수직 안착 경로, 부드러운 카메라 맞춤 구현.
- 일시정지/재개, 0.5×·1×·2×, 건너뛰기, 단계/진행률, 다시 보기(자동 분해 후 재조립). 구조 옵션 변경 시 안전 초기화.
- 검증: display 회귀8개 통과, 변경 ESLint 통과, production build 성공. Chrome에서 바닥 정렬/단별 조립/일시정지/2×/다시 보기 완료 및 깊이 변경 초기화 확인. 모바일390×844 확인 후 viewport 복원.
- 문/서랍은 부품 단위이며 내부 체결·충돌 물리 시뮬레이션은 범위 밖. AR 원본 변환/재질 복원 회귀 통과, 실기기 미검증. 상세 docs/blum-display-modes.md.
- codex-display의 display/** 및 Scene/Shelf 화면 연결부 잠금 해제. 리더 하드웨어/그래픽 담당 수정과 잠금 보존. 공유 문서 기록이며 다른 담당 수신 여부는 미확인.

- 내부 support_rules 후속 잠금: useShelfStore.ts, DimensionPanel.tsx의 하드웨어 정리부 및 scripts/tylko-hardware/store.test.mjs. 행 삭제 후 rowStyles 부활 방지/제약 보정. 리더는 동시 수정하지 않음. 리더 추가 잠금: optimizer/befun/toCncPanels.ts 하드웨어 실제 부재좌표 연결.

- support_rules 행삭제 상태정리 완료: store 회귀5개/eslint/tsc통과, 해당잠금해제. horizontal_rules 신규잠금 ViewCamera.tsx: 실제numRows만카메라높이계산. 같은파일에서옵션변경후흰색화면원인진단계측가능. 그래픽 Effects/Background/Scene파일임의수정금지.

### 조절발 사전 체결 수정 — codex-display / 2026-10-13
- 사용자 요청: 조절발은 최하단 가로판에 붙어 함께 이동. assemblyPlan.ts/test, Shelf.tsx의 표시 래퍼, LevelingFeet.tsx의 표시 대상 필터만 잠금. 발 좌표 계산과 다른 담당 카메라/하드웨어는 보존.
- 완료: 조절발 독립 이동/단계를 제거하고 각 최하단 가로판의 동일 변환 그룹에 배치. 분할 바닥판 경계에서도 발 중복 없이 소속 결정. 바닥 정렬 시 발 높이1cm를 확보. 실제 발 좌표 계산은 변경 없음.
- 검증: display 테스트9개 통과(분할판 소속·바닥 관통 방지 추가), 변경 ESLint 및 tsc 통과. Chrome에서 분해 정렬 및 조립 시작 확인. 위 잠금 해제.

- 사용자Slant393cm통판결함긴급: horizontal_rules잠금 reference-horizontal-splits.ts, grid/slant/pixel/gradient/pattern.ts의최종가로판분절연결부분, scripts/tylko-hardware/all-style-splits.test.mjs. 리더동시수정금지. 실제세로판축후보와공개분절규칙사용,전체240cm초과부재검사및393cm회귀. 모든스타일원본전체생성동치와이누락수정은구분.

- 내부support_rules잠금 Door.tsx단독: 닫힌문앞면에기존힌지GLB원점불일치로흰원형돌출발견. 실제로컬GLB경계측정후reference앵커로매핑. 원본renderer숫자helper는변경하지않음. 메시동치주장금지. 리더브라우저재검증.

- support_rules추가허용 Drawer.tsx의reference slim손잡이같은로컬GLB좌표매핑수정. 리더는진단 ViewCamera.tsx임시로그수정중이며종료시제거.

- horizontal_rules 추가허용 scripts/tylko-pattern/*.test.mjs: 기존분절전구조fixture검증은수평조각union으로의미유지,별도분절검증은최종부재직접비교. 기존검증삭제금지.

### Blum 실물 경첩·보링 요구 접수 — codex-display / 2026-10-13
- 사용자 요청: 실제 Blum 경첩, 컵홀/고정홀/측판 보링과 실제 도어 타공을 정확히 반영.
- 현재 Door.tsx는 BoxGeometry의 막힌 판과 미확인 GLB를 사용. reference-hardware의 Tylko 앵커는 Blum 제조 보링 규격 증거가 아님.
- 품번/플레이트 조합 사용자 확인 중. 독립 문서 docs/blum-hinge-boring.md만 작성. support_rules의 Door.tsx 및 리더 CNC 잠금은 보존. 미확정 수치로 제조용 타공 생성하지 않음.

### 하드웨어·Classic·전스타일분절 통합 결과 / codex-analysis

- Pattern/Mosaic 실칸 기반 front 생성, None/Some/Max/혼합, 깊이·행 제한, 삭제 상태 정리, Type01/02 전면 및 서랍 부재 규격, 저장/공유/CNC 연결. Classic 실제 노출9색과Blue렌더 확인.
- 사용자Slant393cm결함수정: 모든스타일실제가로판분절연결. 같은설정분해도6개가로판및CNC6개길이일치. 최대218.1cm.
- 내부horizontal_rules: 공개분절함수분기/정규화연결,oracle2940+Mosaic960,정수범위424200길이·예외검사. 모든가구의원본동치와구분.
- 내부support_rules: Classic색상·상태정리·힌지/손잡이로컬GLB원점등록. 부재앞돌출수정Chrome재검증. 원본GLB메시동치미확인.
- 최종140회귀+CNC통합1,tsc/build통과. 전체lint오류0경고12. ViewCamera임시진단코드제거완료. 기록docs/tylko-reference/cases/{hardware-source-001,hardware-ui-001,slant-split-001}.json.
- 남음: 모든스타일생성/개별편집전체조합,Type01전체프레임,목무늬/광원,원본GLB형상,Pattern소수폭240.1규칙공백. 개발중흰뷰어재현원인미확정. 이번리더/내부보조잠금모두해제. 외부작업자의기존담당유지.

### 단색 재질 팩토리 설정 보존 — codex-analysis / 2026-10-13

- claude-graphics 조율 요청 접수. 잠금: Shelf.tsx의 REFERENCE_COLORS 후처리 분기만. 기준 base/edge RGB는 유지하고 createColorMaterials 결과의 텍스처·roughness·환경광 설정을 그대로 사용합니다. materials.ts는 graphics 담당 소유를 유지합니다.
- 별도의 실측 roughness/envMapIntensity 근거가 없으므로 Shelf에서 강제하지 않습니다. Classic 분기는 이번 요청 범위 밖입니다.

- 완료: Shelf.tsx의 REFERENCE_COLORS 후처리 전체 제거. base/edge RGB와 createColorMaterials 입력은 유지하고 map/roughnessMap/roughness/envMapIntensity를 팩토리 기본값 그대로 사용합니다. 불필요한 metalness/needsUpdate 재할당도 제거했습니다. materials.ts 수정 없음.
- 검증: 전체 lint 오류0·기존경고12, webpack production build 통과. Chrome Mosaic232cm/밀도66%/4×28cm/깊이32cm에서 Midnight Blue·Terracotta·Cotton·White 정면 및45도방위각 화면8장 저장. Ivory는 현재 옵션에 없으며 White/Cotton과 동일하다고 가정하지 않았습니다. 사례 material-factory-003.
- 조율 요청(graphics): Midnight Blue 입체 시점은 여전히 어둡게 보입니다. 화면 RGB나 Tylko 픽셀 동치는 이번에 측정하지 않았으며 재질 수치를 임의 보정하지 않았습니다. 저장된 화면을 조명/톤매핑 검토에 사용해 주세요. Shelf의 단색 분기 잠금 해제.

### Blum 경첩·실제 보링 구현 — codex-display / 2026-10-13
- 사용자 구현 승인, 품번 미정이므로 공식 도면 기반 인셋 조합 선정. 이전 리더/내부보조 잠금 해제 확인.
- 잠금: 신규 lib/three/blum/**, components/three/blum/**, Door.tsx 경첩/도어 지오메트리, Shelf.tsx 보링/플레이트 연결, Panel.tsx 선택 보링 연결, display/assemblyPlan.ts 도어 눕힘 방향/체결 공간, docs/blum-hinge-boring.md. 조명/재질 팩토리/리더 스타일 생성기는 보존.

### 나머지 스타일 생성 동치 — codex-analysis / 2026-10-13

- 사용자 요청: 모든 스타일을 Tylko와 동일하게. 이번 단계는 Grid/Slant/Gradient/Pixel의 실제 대응·수치 생성·하드웨어·회귀·UI 비교.
- 리더: 기존 VPN Chrome 분석, 제품군/스타일 대응, 공유 입력 및 치수·하드웨어·CNC 통합, 문서 최종 검증. 잠금: GridInput 공통계약 조율, hardware.ts의 레퍼런스 front 분기, DimensionOverlay.tsx, RowControls.tsx, PriceDisplay.tsx, configurator/page.tsx 입력, optimizer/befun/model.ts. Shelf.tsx는 codex-display의 보링 연결을 보존하고 입력 인자만 리더가 변경 가능. materials/Scene/Background/Effects/Blum소스는 다른 담당 잠금 보존.
- 내부 horizontal_rules: Grid/Slant 공개 규칙 해석·구현. 소유 grid.ts/slant.ts 생성부분, 신규 reference-grid-slant*.ts 또는 숫자규칙JSON, scripts/tylko-grid-slant/**. GridInput 공통타입은 리더와 계약 먼저 조율.
- 내부 support_rules: Pixel/Gradient 공개 규칙 해석·구현. 소유 pixel.ts/gradient.ts, 신규 reference-pixel-gradient*.ts 또는 숫자규칙JSON, scripts/tylko-pixel-gradient/**. 다른 스타일/공통파일 수정 금지.
- 공통 결과 계약: panels/panelCount/panelSpacing 유지, fronts:ReferenceFront[] 및 openings:{rowIndex,rowSpan,x,y,width,height,openLeft,openRight}[]와 bodyHeight, boardThickness 추가 가능. 실제 front 선택은 생성기가 담당. 단위cm;공개source비교mm. 기본 Type02, 제품군 차이 확인 시 family 입력 계약 리더와 조율.
- 공통 목표: 임의 난수·선형근사 제거; 칸수/판재/실제개구부/부분뒷판/문서랍 모드/분절 수치비교. 공개 코드 그대로 서비스에 삽입하지 않고 독립규칙구현 및 숫자데이터만 저장. 한 옵션씩 UI 검증, 별도 미사용조합 검증. 전체조합동치와 측정 범위 구분.
- 추가 범위: displayStore/ViewToolbar에 보링 확인 버튼, assembledClone의 화면 전용 숨김 복원. toCncPanels.ts 마지막 연결부와 신규 blum/cnc.ts에 동일 보링 데이터 연결(기존 커넥터 가공 유지). 현재 해당 잠금 없음 확인.

- 리더 추가 잠금: reference-horizontal-splits.ts 소수 폭의 좌표계 정규화. held-out263.3cm에서 세계좌표 반올림이 분절 후보를 바꾸는 결함 조사·수정. 보조는 해당 파일 수정하지 않습니다.

- codex-display 보링 구현 검증 중: 71B3790/174H7100E, 실제35/8/5mm 구멍, 도어와 측판의 소속 분리, 보링 보기, 동일 CNC 좌표. 17회귀+6스타일 CNC 통합 통과. 변경 ESLint/webpack build 통과. Gradient 기존 사례 도어1개는 적합한 측판 없음으로 보링 생성/생산 차단됨; 리더의 생성기 개선과 조율 필요. 공식 CAD 미확보라 금속 외형/운동은 도면 기반 시각 모델임.

- 리더 추가 잠금 RowColliders.tsx/FloatingBox.tsx: 스타일·행 전환 검증에서 팝업 종료 후 초록색 하이라이트 잔류 및 이전 행 타이머가 새 행 팝업을 닫는 현상 확인. 공유 선택상태 사용 및 행 일치 검사만 수정.
- codex-display 최종 검증: 보링/표시17개, 기존하드웨어89개, 기존CNC 및 신규6스타일CNC 통합 통과. 변경ESLint 통과. 공유 및 독립스냅샷 webpack production build 성공. Chrome Grid90cm/하단도어2개/보링20개, 컵홀 뒷면·고정홀·측판플레이트·분해 확인.
- 잠금 해제: codex-display의 Blum 관련 파일 및 좁은 Shelf/Door/Panel/CNC/display 연결부. 다른 담당 잠금 보존. 공식CAD/정확한4절링크 운동/실물 체결 검증은 미완료로 명시. 관련 근거·제약 docs/blum-hinge-boring.md.

### 시네마틱 조립 연출 — codex-display / 2026-10-13
- 사용자 요청: 조립 영상을 더 시네마틱하게. 잠금 display/{ViewCamera,AssemblySequence,AssemblyTransport,displayStore,display.module.css,cinematic*}. 기존 스타일/하드웨어·그래픽 조명 변경 없음.
- 단계별 추적 카메라, 오프닝 와이드→조립 단 추적→완성 오빗, 시네마틱 on/off, 일시정지 동기화 및 수동 카메라 인계 구현.

### 조율 요청 — graphics 소유 Effects.tsx / 2026-10-13

- 개발 서버3003에서 HMR 이후 모든 스타일 3D가 흰 화면으로 남는 현상 재현. 브라우저 오류 로그에는 예외가 없었고, 투영 변경으로 복구되지 않았습니다. 동일 코드의 production build3008은 정상 표시됩니다. 생산 환경 전체에서 안전하다는 의미는 아닙니다.
- 읽기 진단: useMemo에서 생성한 composer를 useEffect cleanup에서 dispose하므로 StrictMode setup→cleanup→setup에서 폐기 객체 재사용 가능. 추가 GTAO/OutputPass도 composer.dispose만으로 해제되지 않음. 원인 확정 아님.
- 제안: 생성/크기 설정/개별 pass·composer 폐기를 같은 layout effect 안에서 묶고 ref로 useFrame에 전달. 후처리 미준비 시 raw render fallback. camera 교체와 HMR 회귀 필요.
- Effects/Scene/materials는 graphics 잠금을 존중하여 리더가 수정하지 않았습니다. 개발 흰 화면은 미해결 P1로 남깁니다.

- codex-display 시네마틱 완료: 와이드 도입→단별 추적→3.2초 완성 오빗, 단계 사이0.35초 안착, 일시정지 동기화, 직접 조작 시 수동 인계. assemblyPlan.ts는 기존 타이밍 상수 export만 추가.
- 검증: display 테스트15개, 변경 ESLint, TypeScript, 독립 스냅샷 webpack production build 통과. Chrome3019 Grid90cm/4단에서 바닥 정렬→추적 조립→일시정지(두 캡처 동일 구도)→재개→완성 오빗→100% 완료 확인. 세로 화면 완성 구도는 투영 수치 테스트로 확인.
- 시네마틱 잠금 해제: display/{ViewCamera,AssemblySequence,AssemblyTransport,displayStore,display.module.css,cinematic*}, assemblyPlan.ts 상수 export. 다른 담당의 잠금·Effects HMR 조사 상태는 그대로 유지.

### 네 스타일 통합 결과 — codex-analysis / 2026-10-13

- horizontal_rules 완료: Grid/Slant Type02 수치 데이터·독립 생성·물리 분절/front/opening1,296사례 및추가14,832설정 대조. 담당 파일 잠금 해제.
- support_rules 완료: Pixel/Gradient Type02 독립 생성·경계264+보류480 고정사례·개발전체2,064설정 대조. 담당 파일 잠금 해제. Type01은 두 보조 모두 기존 경로 보존.
- 리더 통합: family전달, 실제 fronts 하드웨어/CNC/견적 연결, 개구부치수, source18mm 반mm분절좌표 보존, 행팝업상태정리. 기존타작업자 Blum/시네마틱 구현 보존.
- 검증: 최종1435테스트통과, 전체lint오류0/기존경고10, webpack production build성공. 기존 VPN Chrome reference와 production3008에서4스타일0/100 화면16장, Pixel문/서랍2장 기록. 사례·수치범위·한계는 docs/tylko-reference/README.md 최신상태 참조.
- 리더 이번 단계 수정 파일 잠금 해제. Type01/개별편집/시각동치/개발흰화면은 미완료로 인계. graphics의 재질/Scene/Effects 잠금은 유지.
- 후속 우선순위: (1)graphics Effects 생명주기와 HMR 흰화면 해결 (2)Type01 실제 구조자료 확보 (3)임의셀편집·전환/새로고침 상태동치 (4)동일 카메라/광원/재질 및 모바일. 3008은 검증용 production 서버이며 사용자 기존3003 개발세션을 대체하지 않았습니다.

### 순차 체결·카메라 재연출 — codex-display / 2026-10-13
- 사용자 수정 요청: 바닥판→왼쪽부터 세로판→해당 단 후면보강대→다음 가로판. 잠금 display/{assemblyPlan*,AssemblySequence,ViewCamera,cinematic*}. 부품별 순차 타이밍과 연속 곡선 이동, 체결점 추적 및 보강대 카메라 구현.

### 카테고리 10종 질의 답변·계약 작성 — codex-analysis / 2026-10-13
- 범위: 확인된 API/런타임 데이터 출처/이용조건 조사 상태와 UI·생성기 분담 답변. 이번 작업에서 기존 생성기나 데이터는 삭제·교체하지 않습니다.
- 잠금: 신규 docs/tylko-reference/categories-and-data-provenance.md, 본 문서와 docs/analysis-questions.md 답변 append. 기존 다른 작업자 파일 보존.


### 쇼핑몰 계속 지시 보완 — codex-storefront / 2026-10-13

- 상품 상세 상단의 실제 3D·옵션·가격·장바구니·전체화면 연결, 6개 원본 갤러리(3/8/8/8/7/8), 사진/3D 전환, 확대와 사양 항목 추가.
- 17개 레퍼런스 카테고리(액세서리 합본 포함)와 원본 상품40개 별도 상세. 가구 선택 시작 페이지/저장 목록/구성 공유 페이지/투자자 alias 추가.
- 오른쪽620px 필터 drawer, 원본 컨테이너max1632 및16/32/48/56px 여백, 카테고리10개 버튼의 4개 화면별 폭·높이·글자 실측값 반영. 모바일 푸터 펼침.
- 새 family 입력을 카탈로그/상세 가격에도 적용. 최신 사용자 승인 SVG 로고 그대로 사용. 다른 담당 3D/configurator/가격표시/정책/DB/결제 파일을 수정하지 않음.
- 실제 저장 API 실패 확인(DATABASE_URL 없음) → 브라우저 저장 및 JSON 구성 링크 복원 지원. 로컬/서버 저장 구별. 로컬 NEXTAUTH_SECRET 비어 있을 때만 생성(.env* ignored, 출력/문서 값 없음); auth/session200 확인. 해당 임시 환경 범위 잠금 해제.
- 수정 storefront ESLint0, 전체 lint오류0/기존경고11. Node24 기본 test17개 통과, tsc통과, 최종webpack production build통과. 새 테스트 패키지/스크립트 설정은 추가하지 않음.
- 프로덕션3014의120URL:117개200 + 의도한307 3개(각각추적시200); 없는레퍼런스상품404. 개발서버 동시작업중 간헐500은 재조회/프로덕션에서 정상이나 HMR안정성 완전해결은 주장하지 않음.
- 브라우저: 월넛책장 목록/상세/전체화면796,000원 및120×183×32 유지, 변경구성장바구니전달, 로컬저장→공유링크재로드 복원·목록 유지, 모바일필터/푸터/북엔드별도상세, 메인390/800/1728규격 확인. 테스트카트/로컬디자인 삭제.
- 원본폰트URL은CSS에서확인했으나403차단; 원본브랜드영상도관찰소스/재생실패. 분석질문 Q-storefront-01 게시. 모든원본SKU·내부세부콘텐츠·리뷰·실Befun정책/운영/서버주문흐름은 아직완전동치가아님. `docs/storefront-page-audit.md` 최신보완에 상세기록. 이번구현파일잠금해제, 원래전체목표미완료.
- 미리보기 서버 `npm start -- --port 3014`(담당 세션94119)를 실행 중으로 남김. dev3003는 다른 담당 환경이므로 정지/재시작하지 않았음.

- 순차 체결 구현: render index 보존, 부품별 stage를 높이/종류/좌우좌표로 별도 정렬. 같은 단 supportPanel/backPanel은 세로판 이후·위 가로판 이전에 체결. 순차 비중첩, 뒤섞인 입력의 좌우순서, 회전 완료 후 삽입, 카메라 후면 접근 회귀 추가.
- 검증: display17개 통과, 변경 ESLint/tsc 통과, 독립스냅샷 webpack production build 성공. Chrome3019에서 한쪽 세로판만 세워진 중간 단계 및 단별 적층·움직이는 카메라 확인.

### 카테고리 UI/생성기 계약 v1 — claude-graphics 답변
- 답변 문서: [categories-and-data-provenance.md](tylko-reference/categories-and-data-provenance.md). API 확인은 Bookcase/type1/version6 한 조합, 다른9종 및Classic/Tone제품군대응 미확인.
- 데이터 사용 사실: 추출·정규화 수치JSON이 실제 런타임에 포함됨. fixture전용/clean-room이라고 설명하지 않음. 생성기 API호출 없음, storefront 외부이미지는 별개. 이용허가 확인 전이며 법적 허용 판정 없음.
- 계약: FurnitureCategory는 기존10종slug유지. FurniturePreset{id,version,category,label,status,config:DesignConfig|null,evidenceCaseIds}. 미확인수치null. 문서 본문에 상세 타입/적용 규약 기재.
- 분담 동의: graphics=기존선택화면/프리셋UI 및 신규lib/furniture/presets.ts(기존storefront담당과 겹침조율); 리더=공통types/furniture.ts·ShelfConfig/DesignConfig호환필드·store일괄적용·실제생성규칙·저장/CNC연결. 이번에는 문서계약만 게시, 소스타입변경 없음.
- 카테고리와 style/마감/제품군은 분리. Desk/Dressing table을 행삭제 프리셋으로 대체하지 않음. 기존13개선택화면과 빈프리셋을 조사했으므로 중복선택화면을 새로 만들지 않음.
- 답변 문서 작성 완료, 문서 잠금 해제. 기존 스타일/그래픽/스토어프런트 담당 잠금 유지. 실제 카테고리별 구현 착수 시 각 담당이 파일 잠금 갱신.
- 완료·잠금 해제: 이번 순차 체결의 assemblyPlan/AssemblySequence/ViewCamera/cinematic 및 테스트. 다른 담당 파일은 수정하지 않음. 실제 Tylko 작업자/커넥터 물리 동작의 완전 재현을 주장하지 않음.

### 카테고리 전수 대응 조사 — codex-analysis / 2026-10-13
- 사용자 지시: 나머지 카테고리 모두 확인. 기존 VPN Chrome의 독일어 configurator-intro 탭 사용, Claude가 사용하는 영문 intro/sideboard 탭은 보존.
- 잠금: docs/tylko-reference/categories-and-data-provenance.md 최신 조사 추가, 신규 cases/category-*.json 및 screenshots/category-*; README와 본 문서 진행 결과 append.
- 범위: 10종 UI의 제공 제품군·실제 이동 URL·초기 옵션·관찰된 DNA 요청/데이터 대응, 책상/화장대 구조. 미확인값은 null. 제품 코드 변경 없음.

### 반응형 선반 소품 — codex-display / 2026-10-13
- 사용자 요청: Tylko 화면처럼 소품 아이콘 토글, 가구 크기/칸 변경에 반응, 책/화병/상자/화분의 디테일과 자연스러운 배치.
- 잠금: 신규 components/three/decor/**, Shelf.tsx 소품 연결, display/{ViewToolbar,displayStore,assembledClone}, 신규 소품 검증/문서. 다른 담당 조명/재질/카테고리 변경 보존.
- 실제 판재 공간에서 배치 계산, 소품 실물 크기 유지, 문/서랍 칸 제외, 조립·보링·기술표시에서는 숨김. 장식은 견적/CNC/AR 모델에서 제외.


### 컨피규레이터 하단 스크롤 — codex-storefront / 2026-10-13

- 사용자 첨부 화면의 독일어 상품을 실제 링크에서 대조. `/configurator`의 하단 누락과 모바일 한 화면 고정 해제. 동일 쇼핑몰 프레임 및 공통 ProductDetails로 갤러리/사양/브랜드/특징/공간 사례/Sound/소재·선물/추천/쇼룸/계정/푸터 연결. 6개 상품 상세도 동일 콘텐츠 사용.
- 일반 캔버스 휠로 문서 스크롤, Ctrl/핀치 확대와 드래그 회전 유지. 모바일 캔버스 pan-y 및 옵션 영역 스크롤 연결. 기존 AR/구매/가격 로직 유지. 숨겨진 중복 헤더의 CNC 버튼은 하단 상세 내비게이션에서 기존 저장·이동 동작 유지.
- 변경 ESLint 통과. 전체 lint 재검사 오류0/기존경고8(첫 검사 중 다른 담당 decor/layout prefer-const 오류는 이후 해당 담당 변경으로 해소, 우리가 수정하지 않음). 공유 dev/prod .next 타입 충돌을 피한 독립 스냅샷 최종 webpack production build/TypeScript 통과.
- Chrome 데스크톱: production3014 캔버스 위 스크롤 Y880→갤러리, 특징 카드의 디자인 복귀→Y0. 모바일390 문서 폭390, 깊이40 변경 후 사양90×123×40, 사진 확대/닫기 후 body overflow 복구. 6개 스타일49×60/GUI제목14 유지. 실제 휴대폰 AR/터치 검증은 이번 수행 범위가 아님.
- 모든 이번 잠금 해제. 최신 source/audit 저장. 다른 담당 graphics·카테고리·생성기 작업 파일은 덮어쓰지 않음. 원본 폰트/브랜드 동영상/운영·픽셀 동치는 여전히 미완료.
- 기존 우리 production3014 세션을 교체: `/private/tmp/befun-scroll-preview-1sro1bbp`, `npm start -- --port 3014`, 세션42045. 사용자 기존 dev3003 및 다른 담당 서버는 중단하지 않음. 최종 브라우저 `/configurator` 미리보기 유지.

- 반응형 소품 구현 완료: 신규 decor/layout·models·ShelfDecor 및 테스트, Shelf 연결, 보기 소품 아이콘, displayStore 토글, AR 복제본 제거. 소품 고유 치수 유지/칸별 재배치/문서랍 제외/조립·기술표시 숨김. 책등과 종이 단면, 중공 화병, 직물 상자, 곡면 잎을 자체 모델링. 최대14묶음, 재질별 병합과 텍스처 재사용.
- 검증: 표시·소품25테스트 통과. 별도 scripts/decor-integration.test.mjs로 실제6스타일432설정의 소품3,074건 판재 비간섭 확인. 윗단 엇갈린 칸막이를 현재 칸으로 잘못 계산하지 않도록 회귀 추가. 공유 .next/dev 생성타입 충돌은 다른 작업자 산출물을 지우지 않고 독립 production build로 검증.
- Chrome: 소품 on/off, 너비30/90/232cm, Grid/Slant 전환, 소품 위 클릭으로 행 선택, 하단 도어Max 추가 시 해당 칸 비움 확인. 문서 docs/shelf-accessories.md. 원본 Tylko 소품 모델/픽셀동치라고 주장하지 않음.
- 최종 변경 ESLint 및 독립스냅샷 production build(TypeScript 포함) 통과. Chrome232cm/6단 Slant에서 책·눕힌 책·화분·수납상자·화병이 높이 변경에 재배치되는 완성 화면 확인. 소품 담당의 decor/**, Shelf 소품 연결, ViewToolbar/displayStore/assembledClone, scripts/decor-integration.test.mjs 잠금 해제. 다른 담당 파일과 기존 개발서버는 보존.

### 카테고리 전수 대응 조사 결과·분담 보완 — codex-analysis / 2026-10-13
- 10개 카테고리32개 초기 모델 링크와 UI 확인. 공개 활성 preset26개,6개는응답미확인(null); DNA요청과활성값분리. 최종표 docs/tylko-reference/category-inventory.md 및 cases/category-*-001.json.
- collection7종: Bookcase/Sideboard/Desk/VinylStorage/Chest/TvStand/Wallstorage. Original신발장Bookcase,Edge신발장Sideboard; 책상/화장대Desk; Tone책장/벽수납type14. Modern벽수납초기혼입기록정정,활성1/Bookcase확인.
- PNG32개 중18개렌더개요/14개로딩preview상태명시. 로딩이미지를시각동치근거로쓰지않음. 보유preset제품ID/URL일치와JSON/파일링크검증. 코드변경없으므로이번문서조사에lint/build미실행.
- 리더 핵심규칙·공통타입·다리좌표·분절·문서랍배치·최종통합,graphics 확정규격의다리/손잡이표현·재질·카테고리UI,보조 비교도구/회귀검증. 각파일소유자1명,규칙추정병렬구현금지. graphics의기존잠금유지.
- 다리규격후속: 유형별관찰사례,외형치수/정밀도,판재기준좌표/개수,분절·세로판관계,폭경계,미확인체결부를리더가문서화한뒤graphics에전달. 아직다리정밀사양·전체카테고리구현완료아님.
- 이번추가작성: category-inventory.md/category-source-notes.md, README/analysis-questions답변append. 문서잠금해제. 기존다른담당소스잠금유지.

### 옷장 및 제품별 우측 패널 조사 — codex-analysis / 2026-10-13
- 사용자 요청: 제품마다 다른 우측 UI 반영, 옷장 추가 확인.
- 잠금: 신규 docs/tylko-reference/wardrobe.md, cases/category-wardrobe-*.json, screenshots/category-wardrobe-*; category-inventory/appearance-and-interactions/README 및 본 문서 append.
- 제품군별 패널 순서·조절 방식·조건부 노출과 옷장 내부 편집 조사. 이번 조사에서 다른 담당 소스 수정 없음.

### 소품 표면 품질 개선 — codex-display / 2026-10-13
- 사용자 피드백: 소품 재질/렌더링이 낮은 품질로 보임. 잠금 decor/models.ts, 신규 decor/surfaces.ts 및 테스트/문서. 소품의 표면 요철·거칠기·반사 차이와 환경광 반응을 조정. graphics 소유 Scene/Effects/가구 재질은 수정하지 않음.
- 코드 확인: 장면 환경광1.9/균일 배경0.9, 소품은 기존 단색 재질 및 색 텍스처뿐. 소품 전용 재질로 먼저 개선하며 전체 조명 동치는 미확인.
- 소품 표면 개선 완료: surfaces.ts 선형 요철/거칠기 맵, 색공간 분리, 직조·종이 적층·미세 기공·잎맥, 유약/무광 재질 분리, 소품별 envMapIntensity0.45~0.82. 소품8테스트/변경ESLint/독립production build(TypeScript) 통과. Chrome90cm Grid와180cm Slant 실사 표시 확인.
- graphics 조율 참고: Scene의 고르게 밝은 환경은 넓은 면의 명암과 작은 소품의 표면 차이를 약화시킬 가능성 있음. 전역 노출/AO/광원 수정은 기존 가구색 대조를 깨뜨릴 수 있어 담당 잠금을 보존. 현재 시각차의 재질·조명별 정량 기여도는 미측정; renderer 자체의 오류라고 결론내리지 않음.
- 잠금 해제: 소품 models.ts/surfaces.ts 및 문서. 원본 모델·사진 수준 재현 완료를 주장하지 않음.

### 옷장·우측 UI 조사 결과 — codex-analysis / 2026-10-13
- Edge/Tone 실제 intro 링크2개 및 활성preset 확인. Edge=4/Cabinet/v6/mesh2590, Tone=3/Wardrobe/v4/mesh2321. 기존Tone14책장·6/7/8수납과분리.
- docs/tylko-reference/wardrobe.md,14개 case JSON/PNG에 외형/내부구성 순서·범위·조작 기록. Edge 전면 개방 시 문방향 숨김/복귀, 내부옷봉배치변경. Tone 높이+238–360/Standard복귀237, 내외부서랍전환, 조명4cm후면여유안내, 원본URL새로고침초기복귀.
- graphics 인계: 우측패널을제품군/편집상태별profile로구분. Edge옷장은구획별높이/깊이/문방향, Tone옷장은높이버튼/확장모드·깊이slider·조명·내외부색·서랍모드. 상세문서기준으로UI설계,공통타입/생성규칙은리더담당.
- wardrobe를공통카테고리계약에추가해야함. 이번에는문서조사만,공통소스변경없음. 다리/분절공식·모든레이아웃·모바일·동치검증은미완료.
- 문서/JSON/PNG존재·preset ID/제품URL대응 검증. 소스변경없어lint/build미실행. 이번문서잠금해제,다른담당잠금유지.

### 실행 작업 배정 R1 — 리더 + Claude-1 + Claude-2 + Codex-보조 / 2026-10-13

사용자 질문에 따른 실행 결정: 분담한다. 아래 배정은 이전의 포괄적인 분담 설명보다 우선하며, 기존 작업자의 활성 파일 잠금을 해제하거나 넘기는 지시가 아니다. 전달 방식은 공유 문서이다. 다른 세션에 자동 전송하거나 수신 확인한 상태는 아니다. 각 작업자는 이 절을 읽고 본인 행에 착수 시각·실제 세션명을 append한다. Claude-1/2와 기존 claude-graphics 세션의 대응은 수신자가 명시한다.

| 작업 ID / 담당 | 이번 작업 | 수정 허용 범위 | 선행 조건 / 완료 기준 | 현재 상태 |
|---|---|---|---|---|
| R1-CORE / 리더(codex-analysis) | 제품군별 공통 상태 계약, 생성 규칙, 판재 분절·다리 배치·문/서랍 좌표, 최종 연결 | 신규 src/types/furniture.ts, src/lib/furniture/configuration/**, 기존 types/shelf.ts·lib/sharing.ts·stores·생성기 연결부는 착수 시 세부 잠금 등록; Shelf.tsx/page.tsx 최종 연결 단일 소유 | 기존 코드/저장 호환 확인 후 공통 계약 게시; 각 제품군마다 보류 사례로 구조 검증 후 연결 | 리더 담당 확정; 공통 계약 소스 구현 전 |
| R1-UI / Claude-1 | 제품군별 우측 옵션 패널을 독립 컴포넌트로 구현. 먼저 조사된 Edge/Tone 옷장의 외형/내부 구성 패널, 이어 기존 카테고리 차이 반영 | 신규 src/components/ui/furniture-panels/**, docs/handoffs/claude-1-ui.md. 기존 전역 패널/store/page/ConfiguratorIntro는 수정하지 않고 연결 패치 요청을 인계 | wardrobe.md 및 appearance-and-interactions.md 순서·범위·조건부 항목을 사용. 현재 값/선택 구획/콜백을 props로 받아 전역 store와 분리. mock preview 가능. 전면 개방 시 문 방향 숨김, 높이+↔Standard 값 전환, 전역/구획 값 분리 검증. 미구현 생성 기능을 작동하는 것으로 표시하지 않음 | 배정 게시; 수신·착수 미확인 |
| R1-VISUAL / Claude-2 | 다리·조절발·손잡이 등 하드웨어 외형 컴포넌트. 기존 구현을 조사해 재사용 후보·누락·필요 치수를 먼저 정리 | 신규 src/components/three/furniture-hardware/**, docs/handoffs/claude-2-hardware.md. materials.ts/Scene/Effects/Shelf 및 배치 규칙 파일은 수정하지 않음 | 먼저 현재 부품 목록과 필요한 규격을 보고. 리더가 검증한 치수/좌표 규격을 제공하면 메시 구현. 다리 개수/배치 공식은 리더 소유; 미확인 치수를 임의 확정하지 않음. 재질은 외부 입력, mm↔scene 단위 경계 명시. 정면/측면/하부 비교와 자원 해제 확인 | 배정 게시; 기존 부품 조사 즉시 가능, 정밀 외형은 규격 의존 |
| R1-QA / Codex-보조 | 카테고리 근거 검사·구조 비교 도구·회귀 검증 | 신규 scripts/furniture-validation/**, docs/handoffs/codex-assistant-validation.md. 제품 소스와 원본 사례 JSON은 읽기 전용 | 첫 단계: 모든 category 사례의 URL/preset ID·스크린샷 상태·null/미확인 필드·단위 검사. 두 번째: 생성 결과의 판재/구획/문서랍/다리 좌표 비교 어댑터와 보고서. 로딩 스크린샷이나 null을 통과로 처리하지 않음. 원본 근거와 Befun 결과를 분리 | 배정 게시; 근거 검사 즉시 가능 |

#### 작업 순서와 인계

1. Claude-1은 기존 상태와 분리한 패널을, Claude-2는 부품 조사와 규격 요구 목록을, Codex-보조는 근거 검증 도구를 시작할 수 있다. 리더는 그동안 공통 상태와 핵심 생성 규칙을 진행한다.
2. 한 파일은 한 담당자만 수정한다. 각자 허용 디렉터리 밖 수정이 필요하면 handoff 문서에 파일·이유·구체적인 변경안을 남긴다. 다른 작업자의 파일을 직접 고치지 않는다.
3. 신규 컴포넌트의 임시 props 계약은 자기 디렉터리에 두되, 공유 타입을 각자 만들지 않는다. 리더의 공통 타입이 나오면 해당 계약에 맞춘다. 실제 데이터/생성기 연결과 기존 store 이관은 리더가 통합한다.
4. 결과에는 변경 파일, 사용한 근거 사례 ID, 관찰/추정/미확인 구분, 실행한 검증과 실패, 연결에 필요한 사항을 기록한다. UI 완성·외형 완성·생성기 완성·레퍼런스 동치를 별도로 보고한다.
5. 리더는 한 제품군의 UI·구조·하드웨어를 통합해 같은 사례와 미사용 설정으로 검증한 뒤 다음 제품군으로 확장한다. 가격·결제·브랜드 정책은 이번 배정에서 변경하지 않는다.
6. 착수 요청 문구: “docs/team-tasks.md의 실행 작업 배정 R1에서 본인 작업을 확인하고, 허용 파일 안에서 착수한 뒤 지정 handoff 문서에 결과를 남겨 주세요.”


### 사용자 대기 지시 — codex-storefront / 2026-10-13

- 사용자: 리더가 컨피규레이터 분담 구현 문서를 작성 중이므로 기다릴 것. 이 시점부터 추가 수정/빌드/검증/3014 교체 중단, 리더 문서 및 사용자 재개 지시 대기.
- 3014는 이전 스크롤 상세 버전 `/private/tmp/befun-scroll-preview-1sro1bbp`, 세션42045를 유지. 새 시각 수정은3014에 배포하지 않음. 임시3023 검증 서버(세션9071)는 종료.
- 현재 소스에 남긴 미배포 변경: product-details.module.css의 카드420px/여백/타이틀/60×49 스타일 버튼/도구 위치, ViewToolbar 기본 접힘, ViewCamera near1/far5000. 기존 graphics Scene/Effects/materials/Background 파일은 수정하지 않았음. ConfiguratorShell은 이번 차수 소스 변경 없음.
- 독립 스냅샷 `/private/tmp/befun-visual-fix-qpte_lxw`의 build/TypeScript, 기존카메라·시네마틱8개, 전체lint 오류0/기존경고8 통과. 그러나 마지막 브라우저 화면에서 음수32px 카드 겹침으로 카드 왼쪽32px가 캔버스에 가려지는 시각 결함을 발견했음. 사용자 대기 지시 때문에 아직 수정하지 않음. 이번 UI 보완은 완료 아님.
- 정지 캔버스 부분의 연속 캡처2장은 동일, 오류 로그 없음. 사용자 ‘반짝거림’의 광택/동적 깜빡임 구분 및 원인·해소는 아직 확인하지 못함. 깊이 범위 수정만으로 완전히 해결했다고 주장하지 않음.
- 리더가 재배정할 수 있도록 이번 codex-storefront의 ConfiguratorShell/product-details.module.css/ViewCamera/ViewToolbar/감사 문서 잠금 해제. 위 미배포 변경·시각 결함을 먼저 확인한 뒤 리더 문서에 맞춰 이어서 작업할 것. 다른 담당 잠금은 그대로 유지.

### 4인 개발 문서 패키지 작성 — codex-analysis / 2026-10-13
- 사용자 요구: 4명이 나눠 개발할 독립 지시서와 공통 일관성 기준을 프로젝트에 저장.
- 문서 잠금: 신규 docs/development/furniture-parity/**, 신규 docs/handoffs/{leader-core,claude-1-ui,claude-2-hardware,codex-assistant-validation}.md; 본 문서와 레퍼런스 README에 목차 링크 append.
- 기존 R1 분담을 상세화하며 활성 소스 잠금은 변경하지 않음. 다른 세션의 착수 상태를 추정하지 않음.

### 4인 개발 문서 R1.1 게시 — 2026-10-13

- 공통 진입점: [개발 계획](development/furniture-parity/README.md).
- 공통 기준: [계약](development/furniture-parity/contracts.md), [검증 기준](development/furniture-parity/acceptance.md). 기존 R1을 상세화하며 신규 개발 인터페이스는 R1.1을 기준으로 한다. 실제 공유 TypeScript 타입은 아직 구현 전이다.
- 리더: [작업 지시](development/furniture-parity/01-leader.md) / [인계](handoffs/leader-core.md).
- Claude-1: [작업 지시](development/furniture-parity/02-claude-1-ui.md) / [인계](handoffs/claude-1-ui.md).
- Claude-2: [작업 지시](development/furniture-parity/03-claude-2-hardware.md) / [인계](handoffs/claude-2-hardware.md).
- Codex-보조: [작업 지시](development/furniture-parity/04-codex-validation.md) / [인계](handoffs/codex-assistant-validation.md).
- 각 담당의 허용 디렉터리, 즉시 가능한 작업, 선행 조건, 완료 기준, 공통 파일 변경 절차를 분리했다. 신규 mm 경계와 기존 cm 어댑터, 좌표/앵커, 상태와 편집 의도, 구획 ID, pass/fail/unknown을 통일했다.
- 문서 7개와 인계 문서 4개 준비. 다른 세션의 수신/착수는 미확인이며 자동 통신을 실행하지 않았다. 기존 활성 소스 잠금은 유지한다.
- 이번 문서 작성 잠금 해제. 이후 contracts/README/acceptance와 분석 문서의 공통 규격 변경은 리더 소유, 각 handoff는 해당 담당자가 갱신한다.


### 상품 뷰어 썸네일 제거 — codex-storefront / 2026-10-13
- 사용자3003/furniture/bookcase-plum 첨부 화면 지시로 ProductConfigurator.tsx의 하단3D/미리보기 이미지 줄과 사진 전환 상태·사용하지 않는 import 제거. 모든 해당 상품 뷰어 및 공유 구성 뷰어에 적용. 본문 ProductDetails 갤러리, 3D/행 편집, 전체 화면, 가격/장바구니/저장 로직은 보존.
- Chrome3003 실제 페이지: canvas1, 제품보기 썸네일줄0, 레퍼런스사진 전환버튼0, 전체화면버튼1, 본문사진7개 유지 확인.
- 전체lint 오류0/기존경고8, 독립스냅샷 /private/tmp/befun-thumbnails-check-i77se_9p의 webpack production build/TypeScript 통과. 프로젝트 dev 서버 재시작/기존3014 교체 없음.
- 이 좁은 작업만 완료·잠금 해제. 이전 광범위 구현 대기 및 R1 배정 대기는 유지.

### 인원·세션 식별 정정 및 5인 문서 갱신 — 리더 / 2026-10-13
- 사용자 정정: 리더 포함 총5명. 이전4인 구성은 잘못된 인원 집계이며 아래 최신5인 배정으로 대체한다.
- 문서 잠금: docs/development/furniture-parity/**, 신규 docs/handoffs/codex-storefront-integration.md, 기존handoff 공통링크표기, reference README의최신안내.
- 확인한 실제 Codex 작업: 리더=Respond to greeting(01a133ec-d441-76e3-a6c1-54b17931c687); 쇼핑몰=befun 메인 tylko로 클론코딩(01a1341b-6348-7bf0-afc8-9c89fb62522b); 추가Codex=Create repository AGENTS guide(01a133e8-8c93-7352-9af8-96cd31ba2af9). 제목은실제목록에서확인,임의별칭으로동일세션이라고추정하지않음.
- Claude 두 실제세션명은현재미확인. UI 담당과하드웨어담당역할슬롯으로명시하고수신자가본인세션명을등록한다. 배정게시와수신/착수확인은별개.

### 최종 5인 배정 R1.2 — 사용자 인원 확인 반영

구성은 **Claude 2명 + 보조 Codex 2명 + 리더(현재 대화) 1명 = 총5명**이다.

| 담당 역할 | 실제 세션 식별 | 작업 지시서 |
|---|---|---|
| 리더 | 현재 대화 Respond to greeting | development/furniture-parity/01-leader.md |
| Claude 옵션 UI | 실제 대화명 미확인; 역할 지시서 수신자가 등록 | development/furniture-parity/02-claude-1-ui.md |
| Claude 3D 하드웨어 | 실제 대화명 미확인; 다른 Claude 세션이 등록 | development/furniture-parity/03-claude-2-hardware.md |
| Codex 검증 | Create repository AGENTS guide | development/furniture-parity/04-codex-validation.md |
| Codex 쇼핑몰 연결 | befun 메인 tylko로 클론코딩 | development/furniture-parity/05-codex-storefront.md |

- 최신 진입점: [5인 개발 계획](development/furniture-parity/README.md). 기존 4인 설명보다 본 배정이 우선한다.
- Claude 번호는 세션 확인을 뜻하지 않는다. 실제 대화명 등록 전에는 역할명으로 식별한다. 수신/착수 확인 없이 실행 중이라고 표시하지 않는다.
- 공통 규격은 R1.2로 통일. 실제 storefront 파일은 쇼핑몰 연결 담당, 독립 옵션 패널은 Claude UI, 3D 부품 외형은 Claude 하드웨어, 비교 도구는 Codex 검증, 공통 타입/store/생성기/직렬화/최종 통합은 리더 소유.
- 문서 수정 완료, 문서 작성 잠금 해제. 다른 세션에 메시지를 보내거나 작업명을 바꾸지는 않았다.


### 화면 왼쪽 순서별 배정 명시 — 리더 / 2026-10-13 21:30 이후
- 사용자 첨부 4개 터미널 화면 기준: 왼쪽1 Claude 기존 graphics → R1-VISUAL(03), 왼쪽2 Claude → R1-UI(02), 왼쪽3 Codex → R1-ENTRY(05), 왼쪽4 Codex → R1-QA(04). 현재 대화는 리더로 총5명. 역할 문서 번호는 화면 순서와 다르다.
- 문서 수정 잠금: development/furniture-parity/{README,02-claude-1-ui,03-claude-2-hardware,05-codex-storefront,terminal-instructions}.md, 관련 handoff 식별 정보, 신규 tylko-reference/gallery-materials.md 및 cases/gallery-materials-001.json. 다른 작업자의 기존 기록 보존.
- 상세 갤러리 재질 전환은 쇼핑몰 연결 담당의 첫 구현 작업으로 배정. 리더는 12종 스와치/각8장 실제 URL 관찰 자료를 인계하며 해당 소스는 동시에 수정하지 않는다. 배정 문구 게시와 작업자의 수신·착수는 구분한다.

- 화면별 복사 지시문과 역할 문서 보완 완료. gallery-materials.md 및 gallery-materials-001.json에 12종/96개 관찰 URL 인계. 제품 소스 수정 없음. 문서 링크·JSON 검증 후 이번 문서 잠금 해제; 작업자 착수는 아직 미확인.


### 상세 갤러리 직접 구현 — 리더 / 사용자 “어서해라” 지시
- 이전 R1-ENTRY 갤러리 배정을 이 좁은 작업에 한해 리더가 회수. storefront 담당은 해당 파일을 동시에 수정하지 말 것. 그 외 진입/저장 연결 배정 유지.
- 잠금: src/components/storefront/ProductDetails.tsx, 신규 ProductMaterialGallery.tsx, material-gallery.module.css, galleryMaterials.ts. 기존 product-details.module.css는 재사용하고 수정하지 않음.
- 재질12종 선택/8장 교체/확대/반응형 및 브라우저 검증을 리더가 직접 완료한다.

### 사용자 직접 지시: 회전 배경·그림자 회귀 수정 → R1-QA / 2026-10-13
- 담당: Create repository AGENTS guide (01a133e8-8c93-7352-9af8-96cd31ba2af9). 사용자 요청 순서대로 기존 표시 모드 회귀를 먼저 수정하고 검증 전담으로 전환.
- 좁은 수정 잠금: Scene.tsx의 studio 조건, Background.tsx 바닥 그림자 수신, docs/blum-display-modes.md. 현재 graphics 조명·재질 변경은 보존. 기술 시점/AR/분해도 정책은 유지.
- 이후 R1-QA 잠금: scripts/furniture-validation/** 및 docs/handoffs/codex-assistant-validation.md. 제품 소스와 레퍼런스 원본은 읽기 전용.

- 회전 회귀 수정: Scene studio 조건에서 freeOrbit 제거; 바닥 receiveShadow 복원. ESLint 2개 파일 및 격리 production build/TypeScript 통과. 3019 Chrome 일반 회전 뒤 벽·사람·접지/투사 그림자 유지 관찰. 기술 후면 모드에서는 기존처럼 룸 제외. Tylko 픽셀 동치는 미측정. Scene/Background/보기 문서 좁은 수정 잠금 해제. 이후 검증 전담: 제품 소스 수정 중단.


### 상세 갤러리 재질 전환 직접 구현 완료 — 리더 / 2026-10-13
- 사용자 후속 “어서해라”에 따라 리더가 직접 구현. ProductDetails.tsx 연결, 신규 ProductMaterialGallery.tsx/material-gallery.module.css/galleryMaterials.ts. 기존 product-details.module.css·store·3D·가격 코드는 수정하지 않음.
- 기본 컨피규레이터 Original Classic 갤러리: 12종 스와치 우측 정렬, 선택 원형 테두리, 재질별8장 교체, 해당 사진 확대, 키보드 라디오 전환, 모바일 가로 스크롤. 로딩/오류 상태와 이미지별 상태 재설정. 다른 제품군의 기존 사진 배열은 유지.
- Chrome localhost3003: 12종 각각8장 URL 대응 확인. 블루/옐로8장 실제 로딩 성공, 옐로 확대 소스/닫기/스크롤 복원, 방향키 전환, 상단slider 값 전후 동일. 모바일390px에서 페이지폭390/아이콘영역358/스크롤폭436 확인. 스크린샷3장·cases/gallery-materials-001-befun.json 저장.
- 검증: 변경 파일 ESLint 통과; 전체lint 오류0/기존 영역 경고9; 독립 스냅샷 /private/tmp/befun-gallery-check-tr42mp9j에서 npm run build -- --webpack 및 TypeScript 통과. 공유 개발 서버 재시작 없음.
- 제한: 모든96개 이미지의 개별 다운로드 완료/모든 제품군별 재질 이미지/원본 모바일 픽셀 동치는 미검증. 별도상품 탭은 조립모드 중 갤러리가 없어 조작하지 않음. 외부이미지 CDN 의존은 기존 구조와 동일.
- 이번 갤러리 소스 잠금 해제. storefront 담당은 이 구현을 보존하고 나머지 진입/저장 연결 작업을 이어갈 것. 앞의 갤러리 구현대기 지시는 이 완료 기록으로 대체.


### 리더 중간 교차 검토 운영 — 사용자 요청 / 2026-10-13
- 잠금: 신규 docs/development/furniture-parity/leader-review.md 및 README/01-leader.md의 검토 안내 append. 각 작업자 활성 소스와 handoff는 직접 수정하지 않음.
- 역할: 리더가 핵심 규칙·공통 상태·최종 통합을 직접 맡고, 각 작업자의 초안/연결 직전/완료 보고 시 코드·근거·화면을 교차 확인. 보고서만으로 완료 처리하지 않음.

- 1차 코드 검토 결과: [leader-review.md](development/furniture-parity/leader-review.md). CORE-REVIEW-001(공통 타입/적용 함수 리더 우선), VISUAL-REVIEW-001(긴 다리45°/쿼터니언135°불일치 원본 재확인), UI-REVIEW-001(draft 취소/외부값 전환 검증), QA-REVIEW-001(근거 검사≠구조 동치).
- 네 담당 handoff의 수신/착수 기록 확인. 리더가 다리 단품 검사와 근거 검사4테스트 직접 통과 확인. 각 담당 소스 수정 없음. 이번 검토 문서 잠금 해제.


### 패널 커넥터·타공 정합 수정 — 리더 / 2026-10-13
- 사용자 패널 커넥터 위치/타공 지시. 기존 OVVO 작업 기록 인계 및 소스 확인. 현재 UI 담당은 furniture-panels만 수정 중이며 기존 connector 소스 신규 활성 잠금 없음.
- 리더 잠금: src/lib/optimizer/connectors/apply.ts, 신규 validation.ts, src/lib/optimizer/befun/toCncPanels.ts 최종검증 연결, 신규 scripts/connector-validation/**, docs/panel-connector-validation.md. 다른 작업자 파일은 보존.
- 먼저 간격 제약 위반, 양면 관통/동일면 중복 가공, 기존 보링 덮어쓰기 및 두께 불일치를 수정·검증. Tylko 고유 배치 및 주 컨피규레이터 메시 연결은 별도 미검증으로 유지.

### R1-QA 첫 독립 검증 인계 / 2026-10-13
- 사용자 지정 04 및 terminal-instructions 네 번째 지시 수신·실행. 결과: docs/handoffs/codex-assistant-validation.md. QA 단계 제품 소스·원본 레퍼런스 수정 없음.
- scripts/furniture-validation에 근거 감사/명시 어댑터/안정 ID mm 비교기/독립 검사/JSON 결과/재현 문서 추가. 기존 회귀1462 tests 및 신규30 tests 통과. 초기제품34개 중 preset28 확인/6미확인, preview14개 비교불가 유지.
- 최신3003 Chrome 독립 확인: 갤러리12×8 이미지/확대/상단옵션유지/390px모바일 통과; 로컬공유링크 새로고침복구 통과. 서버저장은 로컬fallback; 미저장 width171은 새로고침150으로복귀. QA-001~005로 인계.
- 신규공통타입 및 실측 mm 비교입력 부재로 전체구조/신규제품군 동치 unknown. 미확인을 pass로 처리하지 않음. 이번 QA 작성 잠금 해제; 제품군별 통합결과를 받으면 재검증.

### 고객용 조립 안내 착수 — codex-assembly / 2026-10-13
- 사용자 요구: 영상만으로 고객이 조립을 따라 할 수 있도록 커넥터 삽입, 패널 결합, 결합부 클로즈업·내부 보기·완료 확인 제공.
- 위 신규 디렉터리와 ViewToolbar 진입 연결만 잠금. 기존 리더 OVVO 가공·CNC 및 다른 작업자 소스 변경 없음.
- 실제 출고 커넥터 품번·배송 사전조립 상태·제품별 조립 순서 확인 요청 중. 공식 자료로 예시를 검증하고, 미확정 정보를 고객용 제조 지침으로 확정하지 않음.

### 사용자 화면 기준 2차 중간점검 착수 — 리더 / 2026-10-13 23:16 이후
- 기존 네 담당 handoff와 실제 import 연결, 단품/독립 검사를 대조한다. 다섯 번째 터미널의 codex-assembly는 별도 고객 조립 안내 작업이며 기존 QA 담당을 대체하지 않는다.
- 리더 잠금 추가: 신규 src/types/furniture.ts(UI 공통 경계만 먼저 게시), docs/development/furniture-parity/{leader-review,contracts,terminal-instructions,README}.md, 신규 checks/mid-review-002.*, docs/handoffs/leader-core.md, docs/tylko-reference/differences.md. 기존 connector 검증 문서 잠금 유지.
- UI·하드웨어·storefront·assembly 담당의 활성 소스와 handoff는 직접 덮어쓰지 않는다. 수정 요청은 리더 검토 문서에 기록한다. 공통 UI 타입 게시를 생성기/상태 적용 완료로 표시하지 않는다.

### 우측 옵션 카드 가림 사용자 직접 수정 요청 / R1-QA / 2026-10-13
- 첨부3003 화면에서 카드 왼쪽32px가 뷰어에 가려짐. 사용자의 새 직접 지시로 product-details.module.css 데스크톱 카드 margin만 좁게 수정. 기존 타 담당 활성 갤러리/커넥터/조립 소스는 보존.

### 보기 메뉴 통합 사용자 직접 지시 / 2026-10-13
- 기존 세로 ruler/share/AR/front 버튼을 보기 안으로 이동, 치수/정면 중복 제거, 아래 펼침 적용. 좁은 잠금: configurator/page.tsx 도구행, Scene toolbar props, ViewToolbar 추가 actions 및 display.module.css 메뉴 스타일. 조립 담당 ViewToolbar 진입 작업은 보존하며 기존 기능 삭제/재작성하지 않음.
- 우측 카드 margin 수정은3003의1728/1024 폭에서 경계 겹침0 확인, lint 오류0/기존경고8, 격리 build/TypeScript 통과. 카드 CSS 잠금 해제.

- 보기 메뉴 통합 완료: 페이지의 ruler/share/AR/front 별도 행 삭제, Scene→ViewToolbar optional callback으로 기존 공유/AR 핸들러 연결. 치수/정면은 기존 메뉴 기능 사용. 아래 방향 grid 메뉴·높이 제한·내부 스크롤·Escape 접기 제공. 공유/AR 서버 동작 자체는 변경 없음.
- 검증:3003 데스크톱 및390px 모바일에서 외부 아이콘0, 메뉴가 버튼 아래/캔버스 내부에 표시. 치수 토글·Esc접기 확인. 수정TSX3개 ESLint 통과. 격리 webpack build/TypeScript 통과. 모바일 viewport 변경 중 WebGL 캔버스 소실 관찰은 메뉴 배치 검증과 분리하며 화면 복원/재로드; GPU 렌더 회귀 원인은 미확인. 보기 메뉴 좁은 파일 잠금 해제.

### 사용자 직접 요청: 도움말 원형·드래그 방지 / 2026-10-13
- 좁은 잠금: globals.css의 .tylko-help/.cfg-row, configurator/page.tsx 최상위 drag/selection 처리. 기존 슬라이더 pointer/touch 이벤트 유지.

### 리더 2차 중간점검 결과·후속 배정 / 2026-10-13
- 결과/재현/담당별 조치: [leader-review.md 2차 점검](development/furniture-parity/leader-review.md), [각 터미널 후속 지시](development/furniture-parity/terminal-instructions.md). 문서 게시이며 자동 수신·착수 확인은 아님.
- 핵심 병목: 리더 공통 상태·registry·적용/복구·새 생성기 미구현. 이번에는 src/types/furniture.ts에 **UI view/intent만** 실제 게시(R1.3). UI 담당은 본인 types.ts를 type re-export로 교체 가능. storefront/옷장3D 연결 대기는 유지한다.
- Claude 하드웨어: 긴 다리 회전·short_leg 노출/매입·손잡이 채널 장착 근거 보완. Claude UI: cancel·외부값/profile 전환·키보드 진입 수정. storefront: 공통 함수 게시 뒤 8개 진입점 연결. QA: 수정/실연결 후 독립 재검증. 추가 조립 담당: 누락 import 완성 및 같은 connector plan 소비.
- 조립 안내 ViewToolbar 연결은 앞의 보기 메뉴 완료/잠금 해제를 확인한 뒤 별도 좁은 잠금을 등록하고 통합한다. 메뉴를 이전 버전으로 덮어쓰지 않는다. configurator/page.tsx는 현재 도움말/드래그 작업 잠금이 있으므로 건드리지 않는다.
- 리더 재검사43개 통과(커넥터11·QA30·하드웨어 파일2), 변경 파일 ESLint 통과, 새 공통 UI 타입 단독 strict 타입 검사 통과. 최신 전체 타입 검사 스냅샷은 dev route 생성 타입2건·진행 중 AssemblyGuide 부재 import1건으로 실패. 이전 격리 build 통과를 최신 전체 성공으로 재사용하지 않는다.
- 커넥터 수정 상세: [panel-connector-validation.md](panel-connector-validation.md). 실제 충돌은 감지·제조 차단되며 자동 재배치/메인 Shelf 연결/Tylko 고유 접합 동일성은 미완료.
- 이번 점검/공통 UI 타입/커넥터 수정 소스·검사·문서 작성 잠금 해제. 해당 핵심 소스 소유권은 리더 유지. 다른 담당 활성 소스 변경 없음.

- 도움말/드래그 수정 완료: 공통 .tylko-help width/height/min/max24px, aspect-ratio1, padding0 고정. cfg-row 선택 금지 및 configurator root native dragstart 취소, input/textarea 선택은 허용.3003에서 도움말4개 모두24×24, Back panels 라벨 드래그 선택문자열 없음, 실제 너비슬라이더 드래그90→114 동작 후90복원. 페이지 ESLint 및 격리 build/TypeScript 통과. 이번 좁은 잠금 해제.

- codex-assembly: 보기 메뉴 통합 완료·잠금 해제(660–661행) 확인. 최신 optional 공유/AR callback과 아래 펼침 메뉴를 보존하면서 ViewToolbar의 `/assembly-guide` 안내 진입 버튼만 좁게 잠금·추가합니다.

### 사용자 제공 다리 설치·분리 도면 인계 — 리더
- 좁은 문서 잠금: 신규 cases/hardware-leg-mount-001.json, screenshots/hardware-leg-mount-001-*.png, hardware-source-notes.md 후속 기록. graphics/assembly 소스는 수정하지 않는다.
- 앞선 설치도와 추가 Dismantling legs(p24)에서 중앙 잠금핀을 누른 채 장착부를 슬라이드한 후 다리를 분리하는 절차를 확인. 나사 체결판·원통형 다리·잠금핀·열쇠구멍 체결부를 함께 표현해야 한다.
- Claude 하드웨어와 codex-assembly는 hardware-leg-mount-001을 확인할 것. 그림의 분리 절차를 나사 풀기 또는 단순 수직 분리로 대체하지 않는다. 판재 접합용 OVVO 동작과 이 다리 장착부를 혼동하지 않는다. 도면상의 위 방향을 월드 Y 이동으로 바로 지정하지 않는다.
- 8개 다리/배치는 이 그림의 한 구성에서 관찰한 값이다. 모든 제품의 다리 수로 일반화하지 않는다. 정확한 치수·슬라이드 거리·제품군/GLB 대응은 null로 유지한다.
- 저장 완료: 원본 이미지2장, hardware-leg-mount-001.json, hardware-source-notes.md 설명. JSON 및 이미지 경로 확인. 이번 문서 작성 잠금 해제; 담당자 수신/구현은 아직 미확인.

### 패널 접합 방식 2종 분리 — 리더 / 사용자 직접 결정
- OVVO와 Tylko 클립 두 옵션을 유지한다. 다리 잠금장치와 별도의 패널 접합 설정이다.
- 잠금: 신규 src/types/connectors.ts, optimizer/connectors/apply.ts, components/optimizer/{ConnectorBar,OptimizerApp}.tsx, scripts/connector-validation/connector.test.mjs, 신규 docs/tylko-reference/connector-systems.md 및 cases/connector-clip-001.json와 대응 screenshots, contracts.md 후속 기록.
- 현재 optimizer 선택/저장 경계에 system을 추가하며 기존 system 미기록 데이터는 기존 OVVO 의미를 유지. 클립 치수 미확정 동안 OVVO 가공으로 대체하지 않고 제조 준비 상태를 차단한다. 판매용 상단 UI/공유 설계 전체 통합은 별도 남은 작업.
- 문서 추가 범위: tylko-reference/README.md의 신규 자료 링크, development/furniture-parity/checks/connector-systems-* 검사 로그.
- 구현 완료 범위: optimizer의 OVVO/tylko-clip 선택·localStorage 복구·가공 분기. 클립 선택 중 이전 OVVO 자체 가공 제거, 기존 보링 보존, 구조 판재 제조 차단. 클립 정확한 형상/가공/조립 동작은 미완료.
- 검증: 커넥터13+조립예시4=17검사 통과. 전체 lint 오류0/기존경고8. 격리 스냅샷 /private/tmp/befun-connector-systems-check-y6tvjyf1에서 전체 TypeScript 통과. build는 최초 Google Fonts DNS 실패, 권한 확장 재시도에서 next/font Google loader null 파싱 오류로 실패(성공으로 표시하지 않음). 제품 소스/개발 서버의 폰트 설정 변경 없음.
- Chrome3003에서 두 옵션 표시, 클립 선택 시 OVVO 선택 필드 숨김·미확정 가공 안내, 새로고침 후 클립 선택 유지 확인. 기존 OVVO/몸통없음/후면없음으로 복원. reference 사진2장과 Befun 선택 화면1장·사례 JSON 저장.
- 담당별 후속 지시: [connector-systems.md](tylko-reference/connector-systems.md). codex-assembly의 V-1230R/P를 사용자 요청의 두 방식으로 오인하지 말 것. 새 클립 방식은 별도 시퀀스/모델 필요. 문서 게시이며 수신·실구현 미확인.
- 이번 변경 소스·문서 잠금 해제. 핵심 접합/타공 소스 소유권은 리더 유지.

### KNAPP Mod-eez 추가 참고자료 조사 — 리더
- 사용자 제공 Mod-eez Sets / Anti-Rotation 화면2장과 제조사 공개 규격을 확인한다. 좁은 문서 잠금: connector-systems.md, 신규 cases/connector-clip-002.json, screenshots/connector-clip-002-*.png.
- OVVO / Tylko 클립 두 방식 계약을 유지. KNAPP 제품과 실제 Tylko 부품의 동일 품번 여부를 구분하며, 미확정 치수를 제조 가공으로 적용하지 않는다. 타 담당 소스 수정 없음.

- codex-assembly 사용자 추가 근거: https://tylko.elevio.help/en/articles/32-back-panels-and-supports . 실제 브라우저에서 하단 고정핀/상단 스프링핀, 아래 먼저 삽입 후 상단 클릭 잠금 확인. 같은 신규 안내 범위에 백패널 안내 장면 추가. 전체제품 제조용 매뉴얼 완료로 표시하지 않음.
- 조사·기록 완료: 사용자 원본 화면2장, connector-clip-002 사례, connector-systems.md KNAPP 항목. 공식 슬라이드/경사 클립 원리와 여러 잠금 변형 확인. Tylko 동일 품번은 미확인. 설치 PDF 링크 확보했으나 페이지 렌더 404/cache miss로 도면 치수는 제조에 적용하지 않음.
- Claude 하드웨어·codex-assembly·QA 후속 지시는 connector-systems.md 마지막 항목에 게시. 자동 수신·착수는 확인하지 않음. 문서/증거만 변경했으므로 앱 lint/build 재실행 없음; JSON 파싱 및 이미지 원본 동일성 검사. 이번 문서 잠금 해제.

### Tylko Original 공식 패널 체결 PDF 반영 — 리더
- 사용자 제공 Aligning Horizontal and Vertical Elements 13쪽 전체 텍스트/렌더 확인. 좁은 문서 잠금: connector-systems.md, 신규 connector-clip-003 사례/원본 PDF/페이지 이미지. 하드웨어·조립 담당 소스 보존.
- 13쪽 전체 시각 확인 완료. connector-clip-003에 공식 색상 대응/구형 주황/locking·non-locking/핀 진입 후 클립 장축 슬라이드/끝선 정렬을 기록. 원본 PDF와 주요7쪽 렌더 저장.
- Claude 하드웨어 및 codex-assembly: connector-systems.md의 connector-clip-003 계약을 우선 참조. KNAPP는 품번 후보 자료이며 Tylko 직접 조립 근거는 이번 PDF. 접근과 슬라이드를 분리하고 로컬 접합축을 사용. 색상별 잠금 역할·실제 이동 mm·가공 치수는 아직 미확정.
- 문서 게시이며 자동 수신·착수 미확인. 앱 소스 변경 없음, lint/build 재실행 없음. JSON 파싱·PDF 해시 동일성·이미지 경로 검증 완료. 이번 좁은 문서 잠금 해제.

### Tylko 클립 실물 외형 지정 — 리더
- 사용자 추가 사진을 실제 구현 대상 외형으로 지정. 좁은 잠금: connector-systems.md 후속 항목, 신규 cases/connector-clip-004.json 및 해당 원본 이미지. 다른 담당 소스 보존.
- 원본 이미지/connector-clip-004 사례/외형 우선순위 지침 저장. Claude 하드웨어는 사용자 지정 검정·주황 단면 매입 외형을 기준으로 삼고 공식 PDF의 핀 진입/슬라이드와 연결할 것. KNAPP 동일 품번·치수·색상별 잠금 역할은 미확정. 문서 게시이며 수신·구현 확인 아님. 원본 바이트 및 JSON 확인 완료. 소스 변경 없어 lint/build 재실행 없음. 이번 문서 잠금 해제.

### 사용자 재신고: 상품 상세 도움말 타원 재현 / 2026-10-14
- 실제 열린 /furniture/sideboard-terra 탭에서 Back panels 도움말49×60px 재현. storefront.module.css의 광범위 버튼 규칙이 원인. 지난 일반/configurator 검증으로 상품까지 완료라고 한 범위 오류 정정.
- 좁은 잠금: storefront.module.css productOptions 도움말/스타일 버튼 selector, ProductConfigurator.tsx 옵션 div dragstart 처리만. 다른 storefront 작업 보존.

### 2026-10-14 후속 전달 지시 정리 — 리더
- 사용자 요청에 따라 최신 handoff를 확인하고 terminal-instructions.md 상단에 담당별 후속 지시를 게시한다. 해당 문서만 좁게 잠금. UI R1.3 수정 완료 보고를 반영하고 동일 작업을 재배정하지 않는다.

- 재신고 원인 수정: productOptions의49×60 버튼 규칙을 :has(img) 스타일 선택 버튼에만 한정. 도움말은24×24 패딩0 명시. 상품 옵션 영역에도 user-select:none/dragstart preventDefault 적용.
- 사용자 실제 sideboard-terra 탭에서 새로고침 없이 HMR로 49×60→24×24 변경 확인, 표시 도움말4개 모두 원형. 별도 상품 탭에서 Back panels 드래그 선택문자열없음 확인. ProductConfigurator ESLint 및 격리 build/TypeScript 통과. 좁은 잠금 해제.
- 후속 지시 게시 완료: development/furniture-parity/terminal-instructions.md 최상단 2026-10-14 절. 기본4담당+추가조립담당을 구분하고, UI 완료 작업 반복 배정 없이 신규 커넥터 외형·시퀀스·UI 미리보기·저장 경로 감사·독립 QA를 분담. 공통 상태/생성기/실제 연결은 리더 책임 유지. 문서만 변경, 소스 검사 재실행 없음. 문서 잠금 해제.

### 책 배치 사용자 직접 수정 → 왼쪽4 후속 QA / 2026-10-14
- 먼저 decor/layout.ts,models.ts 및 해당 tests에서 세운 책을 측판 쪽으로 배치/약한 기대기 수정. 이후 제품 소스 수정 중단하고 최신 terminal-instructions 왼쪽4 독립검증. QA 잠금 scripts/furniture-validation/** 및 본인 handoff.

### 추가 왼쪽5 지시 수신·착수 — codex-assembly / 2026-10-14
- 사용자 최신 지시와 terminal-instructions.md 최상단·connector-clip-003/004, 하드웨어 clipContract.ts/illustrativeDimensions.ts 확인. assembly-guide 범위만 잠금. 기존 OVVO·백패널 시연과 ViewToolbar 진입 구현은 유지하며 ViewToolbar 잠금 해제. 이전 격리 webpack build/TypeScript 통과, 조립 검사8개 통과.
- HW-ASSEMBLY-01: clipContract의 원점 O=핀 입구/표면, +X=체결 상대 이동, +Z=상대 판 방향을 소비합니다. 하드웨어 담당의 클립/핀 컴포넌트 export와 props, 소유 재질, 단품 기준점 검증 결과를 handoff에 게시 부탁합니다. 현재 계약/설명용 치수만 존재하며 외형은 중복 구현하지 않습니다. 실제 travel mm·품번·색상별 잠금 역할은 미확정 유지.

### OVVO 도면·실제 구현 재감사 — 리더 / 2026-10-14
- 사용자 외형 오류 지적으로 V-1230P/R 공식 설치도와 R 사양서 원본을 다시 내려받아 시각 대조. 좁은 잠금: 신규 docs/tylko-reference/ovvo-implementation-audit.md, sources/ovvo-audit-001-*, screenshots/ovvo-audit-001-*, cases/ovvo-audit-001.json.
- assembly-guide는 codex-assembly 활성 잠금으로 보존. 이번 감사에서 코드 형상과 가공 단면의 오류를 확정하고 우선 수정 요청을 게시한다.

- codex-assembly / HW-ASSEMBLY-01 소비 확인: 하드웨어 담당 TylkoClip.tsx의 TylkoClip/TylkoClipPin/createClipMaterials가 게시되어 직접 import 연결. 해당 geometry/contract/치수 파일은 수정하지 않음. 재질은 안내 장면이 생성·소유·dispose하며 내부 보기에서 소유 재질에만 투명도 적용. 로컬 좌표 기준과 illustrative 객체를 공유. 판 접근/핀 진입과 장축 슬라이드를 독립 단계로 검사12개 통과; 브라우저 검증 진행 중.
- OVVO 재감사 결과: docs/tylko-reference/ovvo-implementation-audit.md. 공식 도면과 현 소스 대조에서 박스 하우징/임의 커넥터 형상, 언더컷 없는 홈, 끝캡-홈 간섭 확인. 기존 배치/치수 검사 통과를 외형 동일성으로 취급하지 않음.
- **codex-assembly 우선 수정 요청 OVVO-AUDIT-001~003**: 활성 잠금 GuideScene.tsx의 OVVO 형상/홈/맞물림을 교정하고 공식 도면과 단면 비교 제출. 리더는 동시 수정하지 않음. 리더는 optimizer 프로파일/미확정 제조 규격 검증 담당. 문서 게시이며 담당 수신 미확인.
- 공식 PDF3개·렌더3개·감사 사례 저장, JSON/경로 및 현재 도형 간섭 산술 확인. 소스 변경 없음으로 lint/build 재실행 없음. 이번 감사 문서 잠금 해제; 오류 수정 완료 아님.

- codex-assembly 범위 ESLint 오류0 확인. 최신 전체 npm run lint는 QA가 추가 중인 scripts/furniture-validation/ui-left4의 independent.test.tsx any2건·panels.test.tsx any1건(총3오류), 기타11경고로 실패. 타 담당 잠금 파일을 직접 수정하지 않고 소유자에게 이 기록으로 인계. 격리 assembly webpack build/전체 TypeScript는 통과.

- 왼쪽4 QA 후속 완료(2026-10-14 00:21): 제품 소스 수정 없이 UI47pass/1fail, 접합독립8pass/1fail, 기존커넥터13pass. 실제 clip 새로고침 유지·MPR25판재 차단 확인. 사용자 가공 재생성 손실(P1)·in-place OVVO복귀 시 clip 차단사유 잔류(P2)를 codex-assistant-validation.md에 인계. 브라우저 복귀는 제어 timeout으로 미확인/마지막 clip 상태 명시. QA 도구/handoff 잠금 해제. 선행 decor9검사·432설정 통과, 시각 최종검증 미확인(책 배치 완료라고 보고하지 않음); decor 좁은 잠금 해제.

- codex-assembly 좁은 추가 잠금: ViewToolbar.tsx의 기존 조립 안내 버튼 title만 Tylko/OVVO/백패널 진입 내용으로 갱신. 기존 보기 메뉴·공유·AR는 변경 없음. 최신 잠금 해제 기록 확인. OVVO 재감사001~003 수신: 현 클립 작업의 통과로 OVVO 외형/간섭을 완료 처리하지 않으며, 현재 OVVO 시연의 미검증 형상 상태를 안내에 명시하고 별도 교정 과제로 인계.

### 추가 왼쪽5 Tylko 설명 시퀀스 완료·인계 — codex-assembly / 2026-10-14
- [구현·좌표·검증·남은 과제](assembly-guide.md). 색상 대응→입구 정렬→핀 진입→장축 슬라이드→끝선/직각 확인의 5단계. 하드웨어 담당 TylkoClip/TylkoClipPin 및 illustrative 치수를 직접 소비. 자체 클립 외형 복제 없음. OVVO8/7단계·백패널7단계는 별도 topic이며 다리 해제 기구를 재사용하지 않음.
- 안내 진입:3003 /assembly-guide 기본 Tylko, ?topic=tylko-clip 명시 진입. 기존 보기→조립 안내 실제 연결 확인, 공유/AR 메뉴 유지. 단계 자동정지/확인 후 다음/건너뛴 단계 복귀/색상교체 초기화/모바일 선택표시/클로즈업·끝선 직각 육안 확인.
- 최종 조립 검사12개 통과, 변경범위 ESLint 오류0/경고0. 최신 src/scripts/root config 격리 snapshot webpack build 및 전체 TypeScript 통과. 전체 lint는 QA 도구 explicit-any3건/11경고로 실패(타 담당 파일 미수정).
- 실제 출고 규격·제품 panel/joint plan·제조 가공·전체 제품 조립·음성 가청출력·MP4·다리 전용 안내는 미검증/미완료. OVVO 재감사001~003 교정도 미완료, 화면에서 초기시연 상태 명시. 현재 Tylko 성공을 해당 검증 성공으로 오인하지 않음.
- 이번 assembly-guide/**, docs/assembly-guide.md 및 ViewToolbar 안내 title의 좁은 잠금 해제. 공용 서버/.next와 타 담당 소스 보존.

### 05:36 중간점검 및 QA 오류2건 수정 — 리더 / 2026-10-14
- QA-L4-04 차단 사유 잔류와 QA-L4-08 사용자 가공 삭제를 직접 수정한다. 잠금: optimizer/connectors/{apply.ts,blocks.ts,reapply.ts}, optimizer/befun/toCncPanels.ts 검증 연결부, upstream/domain/boring/types.ts 출처 필드만, components/optimizer/OptimizerApp.tsx 방식 변경부, scripts/connector-validation/connector.test.mjs, 신규 docs/development/furniture-parity/checks/leader-qa-fixes-* 및 점검 기록.
- QA 원본 검사와 다른 담당 소스는 수정하지 않는다. 방식 변경 때 현재 판재를 유지하고 자동 접합 가공만 교체, 차단 사유는 생성 주체별 갱신한다. UI/하드웨어 단품 완료를 전체 연결 완료로 표시하지 않는다.
- 중간점검 문서 잠금 추가: development/furniture-parity/{README,leader-review,terminal-instructions}.md 및 handoffs/leader-core.md 후속 기록. 다른 담당 handoff는 수정하지 않음.
- 수정 완료: QA-L4-04/08. 현재 CNC 판재 복제 후 자동 접합 가공만 교체, 생성 주체별 차단 사유 갱신 및 변경 후 충돌 재검사. 외부 차단/사용자 가공 보존. QA 원본 수정 없음.
- 수정 전 QA 원본 실패2건 재현, 수정 후 접합26/26·UI통합48/48 통과. 추가4회귀 포함. 변경lint 통과, 전체lint 오류0/기존경고7. 격리 전체TypeScript/webpack build통과(최초 Fonts DNS 실패 후 권한 확장 재실행). 최신 Chrome 수동 가공 UI·새로고침 사용자 가공 영구보존은 검증/구현 범위 아님.
- 최신 문서: leader-review.md 3차 및 README/terminal-instructions/leader-core. OVVO 외형/제품군 실제 통합 미완료 유지. QA 담당은 수정본 원본 실패테스트 독립 재실행 요청. 문서 게시/수신 미확인. 이번 소스·문서 좁은 잠금 해제.

### 사용자 직접 요청 — Vitra Eames House Bird 소품 / 2026-10-14
- codex-assistant: decor/layout.ts·models.ts·신규 bird.ts 및 소품 검사만 좁게 잠금. 사진의 검정 새 형태, 고정 실물 스케일, 넉넉한 칸에 한 점 배치. 공식 CAD 동일 모델로 표시하지 않고 직접 만든 시각 모델임을 기록. 다른 담당 접합/조립/UI 소스 보존.
- House Bird 소품 구현·연결 완료. 직접 제작한 연속 곡면 모델(공식 CAD 아님), 검정 래커/철사 다리/작은 눈,278×276×85mm 기준 고정 스케일. 높은 칸은 책2권 위, 낮은 칸은 단독(29cm 이상 확보); 부족하면 다른 소품으로 대체하며 가구당 최대1점. 기존 소품 보기/숨기기·그림자·재질 배칭 경로 사용.
- 소품10검사 통과,432설정/3162배치 판재 간섭 없음, 변경3파일 ESLint 통과. 전체 TypeScript는 기존 .next/dev/types/validator.ts의 LayoutRoutes 제약 오류2건으로 실패(제품 소품 파일 오류 없음); 공용 .next는 수정하지 않음. 별도3027 단품 3D와 실제3003 sideboard-terra 110×73×32/윗행38cm에서 책 위 새 렌더 육안 확인. 사진/공식 제품 페이지를 기준으로 만든 시각 모델이며 정밀 CAD 동일성은 주장하지 않음. 이번 decor 좁은 잠금 해제.

### 사용자 피스 창작 지적 정정 — codex-assembly / 2026-10-14
- 현재 Tylko 피스는 실물 복제가 아닌 illustrative 머리/목 치수·모따기 모델이며 드라이버 홈도 미표현. 클립 내부 언더컷도 추정. 원본 사진·PDF와의 동일성을 확인하지 않고 기본 3D 시연으로 제공한 문제 수신.
- 좁은 재잠금: AssemblyGuide.tsx, guide.module.css, 신규 ReferenceClipGuide.tsx, src/lib/assembly-guide/clipReferences.ts, public/imgs/assembly-guide/**(사용자 제공 PDF의 도해 영역 렌더만), docs/assembly-guide.md. 하드웨어 담당 geometry/contract/illustrative 소스는 읽기 전용 유지.
- 기본 화면을 원본 도해 기반 단계 보기로 전환, 기존 3D는 사용자가 선택한 경우에만 추정 모델로 표시. 완료 표시·확인 문구도 실제 출고 조립 검증으로 오해되지 않게 교정. 피스 실물 모델 교정은 하드웨어 담당에 소유 범위 인계; 임의 나사산·드라이버홈 치수를 새로 창작하지 않음.

### 사용자 직접 요청 — Tylko 화면형 스피커·소형 조명 / 2026-10-14
- codex-assistant 좁은 잠금: decor/models.ts,layout.ts,신규 electronics.ts 및 해당 테스트. 첨부 화면의 노출 유닛 세로형 스피커·반구형 갓 조명에 맞춘 시각 소품. 고정 크기/칸 간섭/소품 토글 유지. 다른 담당 소스 보존.
- 스피커/조명 추가 완료: 첨부 화면 기준 노출 유닛 세로형 스피커(12×24/34×15cm), 금속 반구형 갓 테이블 조명(18×25×18cm). 직접 제작한 시각 모델이며 특정 제조사 CAD·실측이라고 주장하지 않음. 스피커 전면 실제 구멍·오목한 진동판·고무 서라운드·나사·발, 조명 얇은 이중 갓·금속 지지대·스위치·따뜻한 emissive 하부 확산판. 조명은 소품 발광 재질이며 주변을 비추는 추가 PointLight는 없음.
- 칸 크기에 맞는 고정 모델 선택/각1점 제한/14개 전체 소품 예산 유지. 가구 크기 변경 시 재배치, 문·서랍 칸 제외, 부족한 높이/깊이에선 다른 소품 선택. 큰 가구 budget에서도 bird/speaker/lamp 보존.
- 검증: 소품11검사 통과,432설정/3222배치 판재 간섭 없음, 변경파일 ESLint 및 decor 범위 TypeScript 통과. 별도3027 근접 렌더에서 진동판 전면 방향 교정 후 확인. 실제3003 상품110×165×32 화면에 스피커/새/조명 배치 및 보기→소품 OFF로 모두 숨김/ON복원 확인. 전체앱 build는 이번 변경에서 재실행하지 않음. 이번 decor 좁은 잠금 해제.

### R2-QA 수신·착수 — codex-assistant
- dispatch-r2.md 수신. scripts/furniture-validation/** 및 docs/handoffs/codex-assistant-validation.md만 잠금. 리더 수정본 원본 실패검사·사용자 가공/외부 차단 보존·브라우저 왕복·타 담당 게시 결과 교차검증. 제품 소스 변경 없음.

### R2-ASM 수신·착수 — codex-assembly / 2026-10-14
- 사용자 직접 지시와 dispatch-r2.md의 R2-ASM 확인. 잠금: src/components/assembly-guide/**, src/lib/assembly-guide/**, src/app/assembly-guide/**, docs/assembly-guide.md. 하드웨어 ovvo/**와 CNC/핵심 접합 계획은 읽기 전용.
- 선행 산출물 확인: 현재 ovvo/** 디렉터리 및 R2-HW 좌표·부품 인계가 없음. 형상 복제/별도 최종 치수표 생성 없이 기존 OVVO 감사 오류 재현, 공식 P/R 조합·동작축 대조, 소비 어댑터와 시퀀스 분리를 독립 진행.
- R2-HW 연결 요청 ASM-HW-R2-01: PH/PC/RC/RH 모델 export/props·단위·삽입/슬라이드/해제축·장착 원점·포켓 윤곽/체결 변환을 handoff에 게시하면 같은 데이터를 import하여 교체합니다. 기존 가공·언더컷 미확정 데이터는 확정하지 않음.
- 직전 피스 지적 정정: Tylko 기본은 원본 실물 사진/공식 PDF 도해, 기존 3D는 명시적으로 선택한 추정 모델. 실제 조립 완료가 아닌 자료 확인으로 문구 교정. 전체 lint 오류0/기존경고7, 조립 검사12개·격리 webpack build/TypeScript 통과. 해당 실물 3D 교정 완료는 아님.

### R2.1-QA 수신·진행 — codex-assistant
- assignments/04-qa.md 수신, 기존 QA 잠금 유지 및 assets/codex-qa/r2/** 추가. 제품 소스/원본 실패 기준 보존. 실제 수동 타공 판재가 접합 전환에서 소실되는 P1 QA-R2-B01을 본 handoff에 즉시 게시. 자동 원본74개는 통과했으나 실제 편집 UI 경로는 별도 FAIL.

### R2.1-ASM 수신·진행 — codex-assembly / 2026-10-14
- assignments/05-assembly.md 수신. R2 범위를 이어 실제 OVVO 교정 수행. 추가 잠금: docs/handoffs/assets/codex-assembly/r2/** 캡처·검증 결과. R2-HW 소스와 handoff는 읽기 전용.
- HW의 ovvoContract/OvvoParts/ovvoGeometry는 게시됐지만 HW-CONTRACT-READY 및 ovvo/index.ts 공개 입구는 아직 미확인. 그 신호 전에는 기존 장면 재현·P/R 공식 도면 대조·간섭 검사·형상/pose 분리만 진행.
- 주의: 현재 HW panelAPose의 R 시작/완료 차이는 해제15mm를 차용한 설명용 좌표이며 조립15mm 공식 표기는 아님. 소비 시 예제 pose/제조 실측을 구분하고 15mm 해제와 조립 거리의 혼용을 완료로 취급하지 않음.
- `claude-graphics` → `codex-assembly` **HW-CONTRACT-READY** 2026-10-14: import 입구 `@/components/three/furniture-hardware/ovvo` 게시(OvvoPH/RH/PC/RC, `guideMounts(model, phase, centerZ, gap, faceY)` → 장면 mm 위치·쿼터니언). 축·앵커·소유권·출처 상태와 HW-01~05 증거는 [claude-2-hardware.md](handoffs/claude-2-hardware.md#hw-contract-ready). 해제 15 → 조립 거리 사용은 **inferred**. 끝쪽 하우징은 장면 X축 π가 아닌 Z축 π(계약) 사용 요청. 연결 후 알려 주시면 실제 화면 앵커·모델 전환을 HW-03/05로 재확인합니다.

### ASM-CONNECTED — codex-assembly → HW·QA / R2.1 2026-10-14
- `GuideScene.tsx`는 공개 `@/components/three/furniture-hardware/ovvo`의 OvvoPH/RH/PC/RC와 guideMounts를 직접 소비. 기존 Housing/Connector 함수 제거. mm 그대로 scale=1.
- base는 guideMounts(P pressed/R locked, center)의 baseHousing. 움직이는 판 내부 endHousing/connector도 같은 settled 변환을 사용하고 부모에 절대 샘플 `(0, panelGap, panelSlide)`를 한 번만 적용. 따라서 R inserted = `(0,0,center+15)`, locked = `(0,0,center)`. 끝 PH = Q·X_Sπ(장면 Zπ), 커넥터 = Q만. 접합점은 기존 CNC planner의 ±105mm 그대로.
- 홈은 도면 입구/평면 외곽만 표현. 미확정 내부 깊이구간은 명시적 cutaway이며 가짜 직선 목재 포켓 벽 제거. 내부 투명화와 별도로 실제 새 메시 정점/캡슐 외곽 검사. 절단은 world X=0, 양면 표시로 남은 후면도 관찰 가능. 완전 collision-free/CAD 동일성/제조 승인은 주장하지 않음.
- `sequence.jointPose`는 sampleOvvoAssembly + HW guideMounts에서 받은 예제 이동을 소비. 15mm는 해제 공식표기, assemblyTravelStatus='inferred'. P는 압입만. R 해제 별도 순수 sampler/검사만 있고 조립 역재생을 해체 안내로 제공하지 않음.
- 비교 증거: `docs/handoffs/assets/codex-assembly/r2/{before,after}-{P,R}-{front,side,section}.jpg`, `{before,after}-P-pressed.jpg`, `{before,after}-R-inserted.jpg`, `{before,after}-R-slide-mid.jpg`, `after-R-locked.jpg`. 동일 40° 카메라·첫 joint·1728×937. 앞선 before 소스도 `.txt`로 보존.
- 검사: `node --no-warnings --test src/lib/assembly-guide/*.test.mjs` 24/24(기존12 포함). 양쪽 실제 장착 메시 외곽/반대 RC 방향 실패 검사 포함. 표면 z=0 접촉은 관통 정점으로 취급하지 않으며 내부 언더컷은 unknown.
- HW 담당에게 요청: 위 변환 코드/실제 캡처의 앵커·PH 뒤집기·RC 방향 해석을 HW-03/05로 재확인하고 이 문서 또는 본인 handoff에 확인 결과 게시 부탁합니다. QA 재현: `http://localhost:3003/assembly-guide?topic=connector`, R 06→07 단면/내부, P 06 단면, 재생 중 P→R→P. 데스크톱/390px 조작·최종 lint/build는 계속 진행 중.
- `claude-graphics` → `codex-assembly` **HW-03/HW-05 실제 연결 확인 완료** 2026-10-14: GuideScene 06:48 반영본 대조 — settled guideMounts + 판 그룹 이동 1회 적용(이중 변환 없음), R 이동 +15 inferred, 판 A 하우징 계약 Z축 π 사용, PH/RH/PC/RC 방향 해석 일치. 브라우저 P↔R 6회 전환 콘솔 오류 0, 조립 검사 24/24. 캡처 `docs/handoffs/claude-2-hardware-assets/r2-ovvo/hw03-guide-*.png`. 참고: R 06 근접 화면 받침판 그림자 acne(GuideScene shadow bias) — 담당 판단.

### R2.1-QA 독립 검증 인계 — codex-assistant / 2026-10-14
- **승인 보류 / P1 QA-R2-B01 OPEN.** Chrome 실제 원장 편집에서200×180/X100/Y90/Ø30 사용자 판재를 추가한 뒤 clip전환 시26→25로 소실. 동일 사례2회 확인. 원본 QA-L4-04/08 포함 자동74개는 통과하지만 CNC 편집 UI가 mock된 범위이므로 P1 해소 근거가 아님. 수정 담당 리더: CNCProvider 편집 값과 Befun livePanels 재동기화 경로.
- 실제 Chrome 일괄 MPR/CIX 미확정 clip25판재 차단 PASS, 보링CSV 비활성. 방식 변경 없는 새로고침은 사용자 판재/구멍 좌표 복구 PASS. 직접 Befun store 구멍의 remount 손실은 별도 QA-R2-REFRESH-01 FAIL로 분리(최근 수정 보장 밖). 종료 시 OVVO/V-1230P/back없음/25판재 복귀 확인.
- HW-CONTRACT-READY 독립 검사 PASS(외형/좌표 계약만), ASM-CONNECTED import/중복 모델 제거·24검사·실제 P/R0/50/100% 캡처 확인. UI37검사 PASS/운영 마운트 미완료. SAVE17검사·실제 import guard·실서버503/400/401 및 Chrome local fallback/공유 retry PASS, 실제 DB blocked. 미게시 CORE READY·정밀 CAD/언더컷 제조·실제 단일판 버튼은 unknown 유지.
- 상세: docs/handoffs/codex-assistant-validation.md R2.1 판정, scripts/furniture-validation/r21-results.json·fingerprints·로그, docs/handoffs/assets/codex-qa/r2/**. 원본 실패 검사 SHA 동일, 제품 소스 수정 없음. scripts/furniture-validation/**·본 handoff·QA 캡처 잠금 해제. 수정 후 같은 B01 사례로 재검증 필요.

### R2.1-ASM 제출 완료·잠금 해제 — codex-assembly / 2026-10-14
- [ASM-01~07 결과·공식 도면·전후9쌍](handoffs/assets/codex-assembly/r2/ASM-01-07.md), [최신 안내 인계](assembly-guide.md), [manifest](handoffs/assets/codex-assembly/r2/manifest.json). 실제 실행3003 `/assembly-guide?topic=connector`.
- 공유 PH/RH/PC/RC 교체·끝 PH Zπ·앵커1회·절대 샘플·미확정 포켓 내부 생략 완료. HW-03/HW-05 연결 확인 수신. R15mm 공식 해제/조립 inferred 구분. Tylko5와 백패널7 보존, 다리 동작 별도.
- 검사24/24(기존12 포함), 변경eslint 오류/경고0, 전체lint 오류0/기존경고7. 최종 격리webpack build/전체TypeScript 통과. 데스크톱1728×937/390×844 조작·모델 전환·확대/회전/카메라 복귀·브라우저 error0. 공용 서버/.next 보존.
- 캡처는 CUA 원본 **JPEG**이며 인코딩 확인 후 `.jpg`로 확장자를 바로잡음(픽셀 변경 없음). 이전 PNG 표기 정정. 같은 시점 전후9쌍 크기 동일·SHA256·이미지 링크 확인. 모바일 보기 도구 너비288→94px 겹침 교정, 근접 그림자 bias 및 내부 보기 그림자 보정.
- 미완료/unknown: 공급사 CAD·내부 언더컷/탄성·정밀 R조립거리·전체제품 panel/joint plan·제조승인·다리 안내·MP4·실제 음성 출력. 이번 완료는 OVVO 예제 접합 시연 교정 범위.
- 이번 소유 잠금 해제: src/components/assembly-guide/**, src/lib/assembly-guide/**, src/app/assembly-guide/**, public/imgs/assembly-guide/**, docs/assembly-guide.md, docs/handoffs/assets/codex-assembly/r2/**. HW/CNC/Shelf/store 및 타 담당 소스 수정 없음.

### 사용자 직접 요청 — 우측 핫스팟 하이라이트 / codex-assistant
- 기존 터치/팝업 작업 위에 사용자 지정 상호작용만 좁게 수정: RowColliders.tsx의 hover 하이라이트 쓰기 제거, RowHotspots.tsx의 핫스팟 hover/focus 상태 처리. 터치 탭·도어/서랍 미리보기·팝업 위치 로직 보존. 해당 변경 범위 잠금.
- 완료: 칸 직접 hover의 hoveredRow 쓰기 제거, 우측 핫스팟 pointerenter/focus에서만 hover 지정·이탈 시 선택 행 복귀. 클릭 선택/팝업 닫기/기존 터치 탭 보존. 실제 Chrome3003 칸 hover 무하이라이트 → 핫스팟 hover 반투명 → 클릭 후 이탈 유지 → 닫기 후 칸 hover 무하이라이트 확인, 콘솔 error0. 캡처 docs/handoffs/assets/codex-qa/hotspot-hover/*.jpg. 변경파일 eslint0, 전체lint 오류0/기존경고7, 네트워크 허용 후 격리 webpack build/TypeScript 통과. 공용 .next/서버 보존. 이번 좁은 잠금 해제.

### 사용자 디자인 재작업 요청 — codex-assembly / 2026-10-14
- 조립 안내의 befun UI 불일치·아이보리 톤·느린 재생·카메라 연출 부족 수신. 사용자 Vectary Roof 링크 실제 브라우저 확인(전체 모델→하드웨어 클로즈업·적은 조작·중립 배경·명확한 재질). 기존 befun storefront/configurator의 실제 UI를 기준으로 조립 화면 재작업.
- 잠금: src/components/assembly-guide/**, src/lib/assembly-guide/**, src/app/assembly-guide/**, docs/assembly-guide.md, 신규 docs/handoffs/assets/codex-assembly/cinematic/**. R2 검증/전후 자료는 보존하고 하드웨어/CNC/storefront/display 공용 소스는 읽기 전용.
- 조립 정확성 계약은 유지. 브랜드 폰트/공식 로고·흰색/검정 UI·작은 보기 도구·화면 중심 3D·연속 보기/빠른 동작·카메라 전환을 연결. 미확정 형상/15mm 출처를 시각 개선으로 확정하지 않음.

### 上판 소품 — codex-assistant / 사용자 직접 요청
- 좁은 잠금: decor/layout.ts, ShelfDecor.tsx, layout.test.mjs. 낮고 넓은 가구 상판의 실제 지지면·고정 크기·중앙 여백·소품 토글 검증. 타 담당 소스 보존.
- 완료: 몸체 높이100cm 이하·폭100cm 이상·가로/세로1.35 이상에서 상판 조명+책 위 Bird, 폭180cm 이상이면 왼쪽 책 묶음 추가. 실제 최상단 판재 지지면/분할 틈/깊이/돌출 판재 검사, 고정 크기·중앙 여백·전체14점 예산·중복 Bird/조명 제거. 기존 소품 토글/분해/AR 제외 공유.
- 검증: 소품13검사 PASS, 변경 eslint0, 전체lint 오류0/기존경고7, 최신 소스 격리 webpack build/TypeScript PASS. 실제 Chrome3003 110×63→450×63 상판 재배치·소품OFF/ON·450×335 상판 제외 확인, 원래110×63복원, error0. 캡처 docs/handoffs/assets/codex-qa/top-decor/{sideboard,wide,off,tall}.jpg. 이번 소품 잠금 해제.

### 상판 소품 후속 검증 — codex-assistant
- 사용자 "안된거 마저해" 수신. 상판/전체QA 범위 질문을 남기고 독립 확인 가능한 상판 추가 검증 수행. 6개 실제 스타일 생성기 × 폭110/180/232/300/450 × 깊이24/32/40 × 밀도0/50/100 × 행1/2 =540조합, 상판 소품 전체 누락0. 실제3003 /configurator 232×63 Pattern/Pixel/Mosaic 전환에서도 상판 지지·배치 확인, 브라우저error0. 캡처 top-decor/configurator-{pattern,pixel,mosaic}.jpg. 원래Grid90×123복원. 이번 제품 소스 변경 없음. 기존 R2.1 QA 실패/미확인 항목을 완료로 변경하지 않음.


### 2026-10-14 원본 사진 로컬 제공 — 리더
- 사용자 교정: 신규 3D 상세 갤러리 대신 실제 Tylko 원본 이미지를 사용. 잘못 추가한 LiveDesignGallery/LiveDesignViews는 제거했고 이번 갤러리 작업의 Shelf 변경은 원복했다. 기존 상판 이음선 수정은 보존했다.
- `public/imgs/tylko-gallery/`: 선반 wallstorage와 sideboard/cplus 각각 Classic 12종·Modern 17종 × 사진8장 = 총464장, 원본 SVG 아이콘29개. 493개 파일의 존재/크기/SHA-256 기록. 이미지 가공·색조 필터 없음. 인증정보/쿠키/토큰/응답 헤더 저장 없음.
- 갤러리는 상단 현재 색상에 대응하는 로컬 사진 세트를 선택한다. 갤러리 아이콘은 사진만 전환하며, 이후 상단 색상을 바꾸면 해당 색상으로 다시 맞춘다. 선택 테두리/8장 배열/확대 보기/키보드 라디오/모바일 가로 스크롤 유지.
- 소스: `galleryClassicMaterials.json`, `galleryModernMaterials.json`, `gallerySideboardPhotos.json`, `galleryMaterials.ts`, `ProductMaterialGallery.tsx`, `ProductDetails.tsx`. 외부 CDN 의존 제거 범위는 위 두 갤러리 제품군이다. 다른 제품군 기존 사진은 보존했다.
- 실제 Chrome3003 확인: 사이드보드 Solid Midnight Blue 사진8장 로드, 하단 Butter Yellow 전환·확대, 상단 Classic C_Blue 변경 시 사진과 선택상태 자동 전환. /configurator Classic Blue/Yellow 원본8장 표시. 모바일390px에서 페이지폭390px·갤러리 모든 img 동일 origin 확인. 추가3D갤러리 없음(canvas1개).
- 자료: `cases/gallery-materials-004-local.json`, `screenshots/gallery-004-*.png`. 58개 사진 세트 모두8장이고 AVIF 파일 헤더 확인. 브라우저로 모든464장을 개별 시각 검수했다고 주장하지 않는다.
- 검증: 변경파일 ESLint 오류0, 전체lint 오류0/기존경고7. 격리 webpack 컴파일 성공. 전체 TypeScript/build는 타 담당 수정 중인 `AssemblyGuide.tsx:47`의 `GuidePlayback.continuous/reference` 타입 누락으로 실패. 갤러리 파일의 TypeScript 오류는 없었음. 공유 .next/서버 재시작 없음.
- 남음: bookcase/chest/tvstand/Edge/Tone 제품군 원본 로컬화·색상 대응, 미대응 Befun 색상(N_Beech 및 일부Mix), 스타일별 별도 촬영 세트 존재 여부. 고정된 원본 사진을 임의 사용자 칸배치와 동일한 렌더라고 표시하지 않는다. 구조/스타일 변경에 따른 정확한 사진 일치는 완료로 처리하지 않는다.
- 위 갤러리 소스·로컬 이미지 작업 잠금 해제. 다른 담당자는 현재 원본 파일/연결 보존.
- 조율 요청 → codex-assembly: GuidePlayback 타입에 continuous/reference 소비 코드와 선언을 맞추고 전체 TypeScript를 재검증해 주세요. 해당 잠금 파일은 리더가 수정하지 않았습니다.

### 2026-10-14 다리 실제 연결 — 리더 / 진행 중
- 사용자 제공 Leg Assembly and Disassembly 영상 및 4장 실물 캡처를 기준으로 다리 연결을 진행한다. 나사3개+중앙 잠금핀은 판재에 남고 다리/장착판이 함께 슬라이드 분리되는 구조. 잠금핀을 패널 OVVO/clip과 혼동하지 않는다.
- 좁은 잠금: 신규 lib/three/furniture-base.ts, components/three/FurnitureLegs.tsx, components/ui/FeetSelector.tsx, public/models/furniture/long-leg.glb, stores/useShelfStore.ts의 baseType 필드, Shelf.tsx 다리/높이 연결부, DimensionOverlay/DimensionPanel/ProductDetails/ProductConfigurator의 하부 높이 및 옵션 연결부, storefront/configuration.ts·savedDesign.ts의 baseType 직렬화, 관련 신규 검사 및 reference 기록.
- 기존 furniture-hardware/** 및 assembly-guide/** 담당자 소스는 수정하지 않는다. 기존 feet1cm와 장다리 상승량100mm를 별도 처리한다. 실제 제조 타공 좌표/규격은 새로 확정하지 않는다.
- support_rules는 읽기 전용 다리 후보/하단 세로판 정렬 규칙 조사. 실제 제품 DNA override·제품군 전체 일치 검증은 미완료이며 일반 fallback과 구별해 기록한다.
- 연결 누락 방지 추가 잠금: app/configurator/page.tsx·MobileConfiguratorPanel.tsx의 FeetSelector 마운트/저장 필드, lib/sharing.ts·app/share/[code]/page.tsx·SavedDesignPages.tsx의 선택 보존/치수만, display/ViewCamera.tsx의 하부 높이 프레이밍만. 가격/제조 가공/타 담당 조립 시퀀스는 이번 작업에서 변경하지 않음.
- HW 조율 → claude-graphics: `observedHardware.ts` long_leg의 ‘사선 다리’ 주석은 정정 필요. 이번 원본 POSITION 높이별 검사에서 몸통은 원점 중심의 곧은 원통, 넓은 bbox는 상부 장착판임을 확인. 노드135°/bounds 수치는 유지. `hardware-leg-placement-001.md` 및 사용자 실물4장 참고. 기존 잠금 파일은 리더 미수정.
- ASM 조율 → codex-assembly: 다리는 panel clip/OVVO와 별도. 나사3개+중앙핀은 판재에 남고 장착판/다리 일체가 슬라이드 분리. 이번 실제 Shelf 다리 연결은 완료됐지만 다리 전용 단계 안내는 미완료. 사용자가 준 영상/4장캡처와 `hardware-leg-mount-002.json`을 근거로 후속 시퀀스를 만들되 미측정 거리/타공치수는 확정하지 않음. 문서 게시이며 자동 수신은 확인하지 않음.
- 1차 연결 완료: 장다리 원본 렌더메시 로컬 제공, Feet선택,실제Shelf장착/하단 세로축 정렬,63→73cm 높이·3D치수·상품정보·카메라,선택 저장/복원. Chrome3003 Grid/Pattern/Mosaic·하부시점·24cm제약·로컬 저장 링크 복원 확인, 콘솔error0.
- 검증: 신규4검사(5스타일120조합 내부지지축 포함),기존저장21검사 통과. 전체lint 오류0/기존경고7+신규테스트unused1은 수정 후 해당범위eslint0. React skill 기준으로 안정selector·공유geometry/material 소유·버튼키보드/pressed·단위1회변환 점검. 최신 격리webpack build/전체TypeScript 통과(최초fonts DNS 실패 후 네트워크 허용 재검증). 공용 .next/서버 재시작 없음.
- 소스geometry는 공인 제조CAD가 아닌 공개 렌더자산. Plinth/모든제품군/실물키홀·나사·핀타공/분리애니메이션/제품DNA개수·깊이override 동치는 미완료. 가격 추가는 별도결정. 문서 `hardware-leg-placement-001.md`와 `cases/legs-001.json` 참조. 이번 다리 연결의 좁은 잠금 해제.

### Blum 공식 CAD 교체 — codex-assistant / 사용자 직접 요청
- 요구: 단순 유사 형상이 아닌 실제71B3790 및174H7100E 형상. 현재BlumHardware.tsx는 parametric, 가변길이 두 링크이며 공식기구학이 아님. 기존hinge_right*.glb도 Blender export 외 품번/제조사 출처 확인 불가.
- 공식 제품 DB에서 로그인 필요를 실제Chrome 확인, 로그인 탭 준비 및 사용자 로그인 요청. CAD 미확보 상태에서 제품 소스 수정/완료 주장하지 않음. 교체 기준 docs/blum-hinge-boring.md 추가. 제품 파일 잠금은 CAD 확보 후 등록 예정.


### R3 후속 배정 문서 작성 — 리더 / 2026-10-14
- 사용자 요청: 작업자들이 기다리므로 즉시 착수 가능한 후속 지시 게시. 최신 인계 R2.1 및 장다리 1차 연결 결과를 기준으로 한다.
- 문서 잠금: docs/development/furniture-parity/dispatch-r3.md, assignments/r3/**, README.md·terminal-instructions.md 최상단 안내, 이 배정 기록. 기존 R2 지시와 타 담당 인계는 보존한다.
- 작업자 수신/착수는 아직 미확인. 문서 게시와 전달·수신을 구별한다.

- Blum CAD 사용자 로그인 완료. 좁은 잠금: components/three/blum/**, 신규 public/models/blum/**, scripts/blum-cad/**, docs/blum-hinge-boring.md. 공식 원본 확보/변환/축검증 진행. Door.tsx 변경은 장착/개폐 연결에 필요한 범위만 추가 기록 후 수행. 보링 숫자 임의 변경 없음.

### R3 배정 게시 — 2026-10-14 / 리더
- 최신 지시: [dispatch-r3](development/furniture-parity/dispatch-r3.md), 개별 assignments/r3/00~05. 문서 작성 잠금 해제.
- HW: furniture-hardware/**의 장다리 원본/체결 표시 계약. UI: furniture-panels/FeetSelector/MobilePanel 및 ProductConfigurator/configurator 마운트 영역을 이번에 위임. SAVE: configuration/savedDesign/SavedDesignPages/sharing/share page 및 저장 검사. QA: 검사/증거만. ASM: 기존 assembly-guide 범위의 연출 마무리+다리 안내.
- 공통 store/타입/생성·지지/패널 분절/CNC 핵심은 리더. ProductConfigurator/configurator 저장 handler는 UI 보존, SAVE는 patch 인계, 리더가 UI 해제 후 통합한다.
- 수신 전 배정이며 각 담당이 착수 잠금을 기록한다. 기존 진행 중 사용자 직접 요청은 보존. R2 완료 자료를 지우지 않는다.

### R3 전달 결과 — 리더 / 2026-10-14
- Codex 쇼핑몰(`01a1341b-6348-7bf0-afc8-9c89fb62522b`), QA(`01a133e8-8c93-7352-9af8-96cd31ba2af9`), 조립(`01a13548-3202-7aa2-8a54-0ff6840d3f75`)의 기존 작업을 확인하고 후속 메시지 전달을 시도했다. 세 작업 모두 도구가 `already has an active writer` 오류를 반환하여 **전달되지 않음**. 기존 CLI 세션을 중단하거나 중복 실행하지 않았다.
- Claude2개 세션은 자동 전달 경로 미확인. 따라서 현재 전체 상태는 지시서 게시 완료/작업자 수신 미확인. 각 터미널에 dispatch-r3의 해당 실행문을 전달하면 바로 착수 가능하다.
- 문서 검증: dispatch와 개별6개 문서의 상대 링크 모두 유효. 제품 소스 변경 없음, build 미실행.
- 경첩71B3790 공식 DAE/STEP/PNG 확보 및 GLB변환(공급사5메시 정점 수 보존), 변환eslint 통과. 원본해시/단위manifest 기록. 플레이트174H7100E 공식 CAD 목록 확인했으나 Chrome 다운로드차단, 사용자 직접다운로드 요청. 제품 렌더링 연결/정확개폐 미완료 유지; 관련 신규원본·변환 스크립트만 수정.

### Natural 장다리 Silver/Black — 사용자 직접 변경 / 리더 착수
- 최신 사용자 지시로 Natural도 장다리 허용. Natural+Legs일 때 실버 메탈/블랙 2색을 제공하며 기본 실버, 선택 저장/복구. Classic·24cm·Pixel 제약은 유지. 이는 Befun 요구사항이며 Tylko 실측 동일성 주장이 아님.
- R3 좁은 임시 회수/잠금: FeetSelector.tsx의 Natural 색상 옵션, furniture-base.ts 지원조건·LegFinish 타입, useShelfStore.ts legFinish 필드, FurnitureLegs.tsx 재질선택 및 새 leg-material.ts; configuration.ts/savedDesign.ts/sharing.ts/share page/configurator snapshot의 legFinish 필드만. 다른 UI 마운트·SAVE 작업은 유지, 해당 필드 동시 수정 금지.
- 리더 완료 후 이 필드 잠금을 해제하며 R3 담당자는 변경된 규칙/저장 필드를 보존한다.
- `claude-graphics` **R3-HW 수신·착수** 2026-10-14 08:06 (assignments/r3/01-hardware.md). 잠금: `src/components/three/furniture-hardware/**`(observedHardware.ts 장다리 해석 정정, 신규 legs/** 표시 어댑터), `docs/handoffs/claude-2-hardware.md`, `docs/handoffs/claude-2-hardware-assets/r3-legs/**`. long-leg.glb·FurnitureLegs.tsx·furniture-base.ts·Shelf·materials·assembly-guide·stores·CNC 읽기 전용.

- 추가 사용자 지시 “클래식도” 반영: **Classic/Natural 모두** 금속 다리 실버/블랙 제공. 위 최초 Natural-only/Classic제약 기록은 철회. supportsLongLegs는 재질 제약 제거, 깊이/Pixel 제약 유지. R3의 Classic/Natural 무효 legs 사례는 이 최신 요구로 대체하며 재질 변경만으로 다리를 해제하지 않는다.

### Classic/Natural 금속 다리 인계 — 리더 / 2026-10-14
- 구현/Chrome 확인 완료: Classic/Natural+Legs에서 실버 메탈/블랙 버튼, 기본 silver, 별도 목재 텍스처 없는 금속 재질. 선택은 Standard/Legs·Classic/Natural 전환 시 유지. Solid/Mix는 기존 본체 재질 사용.
- store legFinish/setLegFinish, DTO optional legFinish, 구버전 silver, enum validation, 상품·전체화면 snapshot/공유·로컬복원 연결. supportsLongLegs(depth,style,legacyColor?)는 기존 3인수 소비자 타입 호환을 허용하지만 color를 제약에 사용하지 않음.
- Chrome3003 Natural실버/블랙·Classic블랙/실버 렌더 확인, Classic블랙 로컬 저장→design-preview 복원 PASS. 서버503은 기존 환경 문제로 실DB 저장 성공 아님. 새 UI 담당 운영 마운트 후에도 선택/높이73 유지 확인.
- 신규/회귀 leg7검사(내부120설정 포함),저장parser17,서버mock21 통과. 전체lint0오류/기존7경고. React 점검: store scalar selector·memoized material·소유재질만 dispose·aria-pressed 버튼.
- UI/SAVE에게: 위 legFinish 필드와 최신 지원 규칙 보존. **이번 좁은 소스 잠금 해제**. 각 담당의 기존 R3 잠금으로 복귀. 상세 사례 cases/legs-002-metal-finishes.json.
- 공유 개발 중 gallery useId hydration mismatch 관찰(다리 오류와 별도). 최종 격리 빌드는 아래 결과로 추가 기록.
- `claude-graphics` → `codex-assembly`·리더 **LEG-VISUAL-READY** 2026-10-14 08:13: `import { LongLeg } from '@/components/three/furniture-hardware/legs/LongLeg'` (`<LongLeg unit="mm"|"cm" material={…}/>`, 부모 scale 1회, 원점=접지점·장착면 +Y 111.48mm, 원본 135° 유지). 원본 GLB는 노드1·메시1·연결성분1 → **몸통+장착판 rigid, 노드 분리 불가 → 전체 group을 함께 이동**. **나사3·중앙핀·키홀은 GLB에 없음**(fixed, inAsset=false); 치수 전부 null. 계약 `legs/longLegContract.ts`, 상세·증거 [claude-2-hardware.md](handoffs/claude-2-hardware.md) R3-HW 절. observedHardware long_leg "사선 다리" 해석 정정(값 유지). R3-HW-01~04 pass, 05는 ASM 연결 대기.

- Classic/Natural 다리 색상 최종 격리 webpack build/전체 TypeScript/static generation 통과. UI 담당 baseType 연결 중 스냅샷 불일치와 기존3인수 소비자 호환 문제를 최신 스냅샷/호환 선언으로 해소한 뒤 통과.

### Classic/Natural 너비별 지지 재검증 — 사용자 추가 요청 / 리더
- 너비 변경에 따라 기존 planFurnitureLegs가 최하단 세로판으로 개수·위치를 재계산함을 확인. type01 5스타일×7폭 검사 중 Gradient450cm/density50의 선택 지지축 사이112.15cm가 발견됨(중간에 실제 세로판 존재).
- 좁은 잠금: src/lib/three/furniture-base.ts의 기존90cm 일반 지지 규칙 보완, scripts/furniture-legs/legs.test.mjs 및 관련 사례. 기존 슬롯/서랍/판재 생성은 변경하지 않는다.

### R3-ASM 독립 단계 진행 / 2026-10-14 08:20 KST
- 기존 cinematic 최신 절개 캡까지 lint·격리 webpack build/전체 TypeScript 통과. 자료 `codex-assembly/cinematic/README.md` 및 소스 fingerprint. 기존 R2.1 재작업 없음.
- LEG-VISUAL-READY 08:13 수신. `LongLeg` 단위mm(내부×1000 1회)·원점접지0·장착면111.48·원본노드135°·rigid판+몸통, 로더geometry/호출자material 소유 계약 소비 예정. GLB에 나사/핀/키홀 없음 및 null 이동거리 확인. 공식 영상 실제 0.996/2.005/3.997/7.687/8.785/9.487/10.981초 장면 확인·담당 탭 영상 영역만 원본캡처.
- HW 조율: 핀/나사/키홀 및 이동거리 미측정은 자체 하드웨어를 창작해 채우지 않는다. 원본 장면을 기본으로 연결하고 공유 원본 모델은 방향 설명 보기로 분리. ASM 실제 URL/소비 파일 게시 후 HW-05 대조 요청. 잠금 유지.

### Classic/Natural 너비별 지지 보완 완료 — 리더
- legs-003: 기존 후보 보존 후90cm 초과 구간의 실제 하단 세로축을 추가. Gradient450/density50의112.146cm 공백을87.417cm 이하로 보완. 균등분할/임의 칸중앙 배치 없음.
- 내부420조합+기존120조합 포함9검사, 변경범위lint, 격리webpack/TypeScript/static generation PASS. Chrome Classic450/Natural450→30cm 재배치·블랙 유지 시각 확인. Tylko 전체제품 지지 개수/하중 동치 검증은 별도 미완료.
- planner/tests/사례 좁은 잠금 해제. UI/HW/SAVE는 legFinish 및 Classic/Natural 허용 규칙 보존. cases/legs-003-width-support.json 참조.

### R3 작업자 교차점검 — 리더 착수
- 사용자 요청에 따라 최신 인계와 실제 소스/검사를 대조. 문서 잠금: docs/development/furniture-parity/review-r3.md, checks/review-r3-* 및 이 기록. 타 담당 잠금 제품 소스는 읽기 전용. 독립 UI/SAVE·HW 소스 리뷰 병행. 진행 중 ASM 파일을 완료본으로 승인하지 않는다.

### R3 교차점검 결과·수정 요청 — 리더 / 2026-10-14 08:25
- 최신 지시/판정: docs/development/furniture-parity/review-r3.md. UI96·SAVE65·조립/HW/다리40 기존검사 통과, 전체lint0오류/기존7경고. 독립 진단에서 SAVE 구자료 행배열 거부(P1), HW StrictMode/Suspense primitive 소실(P2) 재현. 전체 승인 보류.
- 왼쪽1 HW: REVIEW-R3-HW-01 수정(기존 본인 잠금). 왼쪽3 SAVE: REVIEW-R3-SAVE-01 legacy 호환 수정(본인 잠금). 왼쪽2 UI는 재작성하지 말고 복구 통합 후 재검증. 왼쪽4 QA는 이미 게시된 UI-LIVE-READY 후속 착수, 신규두회귀 독립검사. 추가왼쪽5 ASM은 진행 중 상태 유지하고 HW 수정 소비/최종 READY 제출.
- 리더 책임: 제출된 r3-consumer.patch 미통합, CNC 실제 사용자편집 손실/재진입, 옷장·Desk 운영생성기 미완료. 작업자 미납품과 구분.
- 제품 소스 수정 없음. 원본 검사/인계 보존. 점검 문서·증거 잠금 해제. 지시서 게시이며 작업자 자동 전달/수신은 아직 미확인.

### R3-ASM → HW 어댑터 초기 마운트 조율 / 2026-10-14 08:34 KST
- 실제 Chrome390 `?topic=legs`에서 GLB200·공유환경120fps이나 원본모델 최초 마운트 메시0 재현. `LongLeg.tsx`의 effect cleanup `releaseLongLegInstance(instance)`가 StrictMode setup/cleanup/setup 동안 primitive를 부모에서 떼고 setup에서 재부착하지 않음. HMR 후는 메시1이어서 초기실패가 가려짐. 전체 새로고침으로 판정.
- HW 잠금은 수정하지 않았다. ASM 소비자만 provider `createLongLegInstance` + `LONG_LEG_ASSET`/`longLegSceneScale(mm)` 사용, R3F primitive 자연 언마운트·dispose=null로 연결한다. 외형복제/재질소유권/원본geometry 변형 없음. 별도 guessed pin/screw/keyhole 모델 없음.
- HW 담당 요청: LongLeg effect setup에서 소유 group으로 instance 재부착하거나 effect의 조기 removeFromParent를 제거하고 R3F 언마운트에 맡기는 방식 검토. 공개 어댑터가 교정되면 동일 factory를 직접 쓰는 ASM 소비자는 호환된다. 최신 실제모델 재로드·전환 검증을 이어간다.

### Grid 220cm 도어 폭 확인 — 리더 / 2026-10-14
- 사용자 사진에 대한 VPN Chrome Tylko 실조작 대조. 문서/증거 잠금: cases/grid-doors-220.json, screenshots/grid-doors-220-*, styles/grid.md 및 differences.md 추가 기록. 제품 소스 변경 없음.
- 확인 완료: Tylko 동일 입력4칸/표시내경52cm/하단단문4장, Befun 사진3칸/3장. GRID-TYPE01-220 P1 OPEN(리더). 양개문 누락으로 단정하지 않음. 사례JSON·레퍼런스 열린/닫힌화면·사용자원본 저장. 제품 소스 미변경, build 불필요. 문서 잠금 해제.

### LEG-GUIDE-READY 게시 / codex-assembly / 2026-10-14 08:38 KST
- 수신/실행 URL http://localhost:3003/assembly-guide?topic=legs . 기존 인계 docs/assembly-guide.md 및 r3-legs/README.md/ready.json. 원본 자료·실제 공식영상 iframe·다리 조립/분리5단계·핀/잠금 전 완료차단·공유GLB 외형 소비 연결. 정밀3D모션·핀/나사/키홀/거리·타공은 unknown, 창작모델/CNC 출력 없음.
- 최신 factory 마운트 수정 포함 35검사·lint0오류/기존7경고·격리 webpack build/전체TypeScript 통과. 모바일 최초GLB로딩/원본영상·분리순서·0/50/100원본슬라이드·조립잠금 gate·2×일시정지/topic초기화 증거 게시.
- HW 담당: LEG-VISUAL-READY의 동일 provider factory/자산/TRS/mm×1000 1회·캐시geometry/호출자material 소유를 대조해 R3-HW-05 확인 요청. LongLeg StrictMode 조기detach 교정 요청은 위 기록 참조. HW 소스는 미수정.
- 리더 확인을 기다리는 동안 남은 독립 데스크톱·기존3topic 회귀·반복 마운트 검증 계속. 잠금 아직 유지.

### R3-ASM 리뷰 수신 및 독립 추가 검증 / 2026-10-14 08:43 KST
- review-r3.md REVIEW-R3-HW-01/ASM 판정 수신. R3-ASM-03 정밀3D 이동 미구현/고정부품 unknown을 README와READY에 명시. 원본 영상에서는 실제 움직임·나사/핀 잔류를 확인한다. 공용 LongLeg 교정/독립 HW-05는 생산자 확인 대기이며 완료로 바꾸지 않는다.
- 독립 후속: 데스크톱 원본/공유모델6회 왕복 후 실제 메시 유지·error/warn0, 드래그 후 자동카메라 복귀/전체14.4초 종료, 백패널7단계2× 전체 최종1000 정지. 390px 임시 override는 담당 탭CDP만 적용·해제 완료. 공유 서버/전역 viewport 변경 없음.

### GRID-TYPE01 도어 수정 — 리더 착수
- 잠금: styles/grid.ts, reference-grid-slant-grid.ts, 신규 reference-grid-type01-rules.json, scripts/tylko-grid-slant/type01* 및 관련 근거 문서. 기존 4칸 단정은 마감 변경 후에도 Type02 구조 유지된 관찰로 제한한다. 확보된 Type01 Bookcase DNA에서220cm/0%는3칸/양개문6장. 이 제품군 구분에 따라 수정. 다른 담당 HW/UI/SAVE 잠금 파일 수정하지 않음.

### R3-ASM 최종 납품·잠금 해제 / codex-assembly / 2026-10-14 08:47 KST
- 결과: docs/assembly-guide.md / codex-assembly/r3-legs/README.md / ready.json, URL http://localhost:3003/assembly-guide?topic=legs . 선행 cinematic 연출 마무리 + 원본 다리 조립/분리5단계·실제공식영상·핀/잠금 gate·동일GLB 외형 연결. R2.1 반복/증거 삭제 없음.
- 최신35검사 PASS, 전체lint 오류0/기존7경고, factory 초기 마운트·자막 최종 수정 포함 격리 `/private/tmp/befun-r3-asm-build-5pucdfzx` webpack build/전체TypeScript PASS. 소스fingerprint/시각 기록, 제출 코드 일치.
- desktop1728×937/390×844 actual Chrome 검증: 원본/모델6회 유지, 최초 새로고침 유지, 수동회전/자동복귀, 2×일시정지/seek/topic초기화, 핀누름/잠금 전 완료차단, 원본영상 재생/닫기, 기존P7/백패널7/Tylko5 최종1000 정지. error/warn0. 담당 탭 emulation/Network진단 복원, 원본다리01/1×정지 검토용탭 유지.
- R3-ASM-03 정밀3D 이동 **미구현/unknown**. 실제 움직임은 원본영상/캡처로 안내한다. 나사·핀·키홀/거리·타공 null을 창작하지 않음. 공용 LongLeg REVIEW-R3-HW-01 교정·HW-05 독립확인은 HW 생산자 요청 상태. 리더 전체 승인과 개별 원본 안내 납품을 구분.
- 이번 잠금 해제: src/components/assembly-guide/**, src/lib/assembly-guide/**, src/app/assembly-guide/**, docs/assembly-guide.md, docs/handoffs/assets/codex-assembly/{cinematic,r3-legs}/**, public/assembly-guide/legs/**. HW/제품/store/CNC/GLB/공유 서버/.next 수정 없음.

- 사용자 문판 작음/양개문 모양 피드백 추가: 리더 Door.tsx의 Type01 손잡이 생성부만 잠금(Blum 개폐/장착 코드 보존), 신규 lib/three/type01-handle.ts 및 테스트. HW 관찰 단면과 원본 비대칭 앵커 범위를 사용해 가로폭을 임의 축소하던 연결 수정. 원본 GLB 다운로드403으로 완전 메시 동치는 미확인 유지.

### mmmcraft MOVENTO 이식 — codex-assistant / 사용자 직접 요청
- 가구 깊이400mm 확인. 760H4000S는 최소403mm 설치공간이 필요하므로 원본350mm CAD로 적합성부터 연결.
- 잠금: Drawer.tsx, 신규 components/three/blum/Movento*.tsx, lib/three/blum/movento*, public/models/blum/movento/**, scripts/blum-cad/movento* 및 docs/blum-movento.md. 리더 Door.tsx 손잡이 변경 영역 보존.
- 원본250709in 커밋7ecfd99aabe98e1984d74ffe6056f86f9d296281 읽기전용. mmmcraft 소스/저장소 수정 없음. 경첩은 품번/인셋 호환을 별도로 검토하며 이번 언더레일 연결에 섞어 품번을 바꾸지 않음.

### GRID-TYPE01 / DOOR-T01-HANDLE-GAP 리더 결과 — 2026-10-14
- 앞선 `Grid220cm 도어 폭 확인`의 Type014칸 판단을 철회합니다. 마감만 바꾼Type02 구조 관찰을 다른제품군에 적용한 오류였습니다. Type01 mesh2398 기준3칸·양개문6장이 맞습니다.
- 구현: Grid 두family 일반 생성기 연결, Type01 폭/밀도 후보·merger·혼합내용·양개front 처리. 임의220cm 특수처리 없음. Type01 Door 손잡이10/30mm 공제량을 전체형상폭으로 쓰던 축소 제거, HW 관찰30/50mm 단면·앵커 보존. HW/Blum/Drawer 잠금 파일 미수정.
- 검증: source972 + heldout294 구조 사례, Type02기존1298, 손잡이외곽6, 다리9검사 통과. 실제Chrome Pattern110Natural하단Max 빈틈 감소, Grid220Natural하단양개6장 닫힘/열림 확인. 스크린샷·사례는 docs/tylko-reference/cases/{grid-type01-doors-220,type01-handle-gap-pattern-110}.json.
- lint0오류/기존7경고. 격리 `/var/folders/6g/88hr_s5d1bd3qf45tzmk8zrr0000gn/T/befun-door-build-_ozu5kvb` webpack build/TypeScript PASS. 공유dev서버/.next 미변경.
- 미확인: 손잡이50뒷날개모서리,30단면대칭보완1점,19mm문판채널가공,정밀원본메시/재질동치. Grid의임의개별편집·CNC전체흐름·다른Type01스타일 전부검증한것아님.
- 리더 이번잠금해제: styles/grid.ts, reference-grid-slant-grid.ts, reference-grid-type01-rules.json, Door.tsx의Type01손잡이부분, type01-handle.ts, scripts/tylko-grid-slant/type01*, 해당사례문서. 다른담당자의잠금은그대로유지.

### DESK-CORE / desk_geometry 착수 — 2026-10-14
- 리더 위임: Desk mesh2498 생성 규칙·source 대조. 잠금 신규 `src/lib/furniture/desk/**`, `scripts/furniture-desk/**`, `docs/handoffs/desk-core.md`. 공유타입/store/UI/Shelf 및 타작업자 파일 수정 금지. 브라우저 미조작.
- 입력mm→출력PanelData/ReferenceFront/openings cm 계약. 미확인 치수/기능은 추정 구현하지 않음.

### Desk·옷장 실제 제품군 연결 — 리더 착수 / 2026-10-14
- 사용자 직접요청. 내부 보조 desk_geometry: 신규 lib/furniture/desk/** 및 scripts/furniture-desk/**, wardrobe_geometry: 신규 lib/furniture/wardrobe/** 및 scripts/furniture-wardrobe/**. 브라우저는 리더만 조작. 기존 외부 HW/SAVE/UI/Blum 잠금 보존.
- 리더 잠금: 신규 lib/furniture/{design,registry,panel-view}.ts, components/furniture/**, app/(storefront)/furniture-design/**, scripts/furniture-integration/**, ConfiguratorIntro.tsx의Desk/옷장 진입·모델필터 부분. UI FurniturePanel/controls는 읽기만 하고 재사용. 기존선반state/저장schema를 다른제품군으로 가장하지 않음. 공통 mm상태·검증·3D·동일payload복원부터 연결.

### WARDROBE-CORE — 리더 보조 / 2026-10-14
- 담당: wardrobe_geometry. Edge/Tone 옷장 source 규칙·독립 기하 생성 및 검증. 허용/잠금: 신규 src/lib/furniture/wardrobe/**, scripts/furniture-wardrobe/**, docs/handoffs/wardrobe-core.md. 공통타입/store/UI/Shelf 및 다른 담당 파일은 수정하지 않는다.
- 선행: 원본 Edge Cabinet(type4/v6), Tone Wardrobe(type3/v4) DNA 응답 본문 확보. 기존 사례는 초기 상태와 UI만 있고 정확한 판 좌표는 null이므로 추정값으로 채우지 않는다. 리더가 Chrome 자료 수집, 본 담당은 병렬 브라우저 조작 없음.

### DESK-CORE 납품 / desk_geometry — 2026-10-14
- 신규 `src/lib/furniture/desk/index.ts` Type02 Desk 일반 생성기: setup 폭/수납열수, legroom2x 이동,8채널 구성,도어방향,강제/선택백패널,가로판연결/세로단분절,수납내부선반,beam,발앵커. mm입력/cm출력 계약은 docs/handoffs/desk-core.md.
- `scripts/furniture-desk/structure.test.mjs` 2,033 PASS: source2,032설정 패널/front/beam/feet 비교,지원범위차단1검사.672최종 heldout PASS. 변경범위eslint PASS. full app build/live시각은리더통합후수행예정,이worker가완료했다고주장하지않음.
- Type01독립DNA미확인(unsupported반환), cable/local-edge/가공도면미완료.공유소스/store/UI/browser서버미수정.
- 납품파일잠금해제. 리더소비가능. 신규수정시재잠금후알림.

### DESK-PANEL / desk_geometry 후속 착수 — 2026-10-14
- 리더 위임: 신규 `src/lib/furniture/desk-panel.ts`, `scripts/furniture-desk/panel*` 잠금. 공통design.ts 및FurniturePanel/UI는읽기전용. 안정sectionId기반뷰/intent, 너비변경구획보정, 관찰옵션순서와미확인팔레트범위분리.

### DESK-PANEL 납품 / desk_geometry — 2026-10-14
- 신규 desk-panel.ts의deskPanelView/applyDeskIntent연결.너비/높이73/깊이/수납수/다리공간/뒷판/색상순서,8내부구성·안정sectionId·단문힌지선택.너비변경normalize자동보정,stale/disabled/invalid입력차단.
-3어댑터검사PASS,변경범위lintPASS. tsc는공유.next/dev/types/validator.ts기존route오류만출력,Desk오류없음. 리더격리build예정.
- Modern12색목록은색이름미확인으로기존검증Solid색상유일목록연결,동일목록단정금지. Classic구조미검증지속. scripts/furniture-desk/panel-notes.md에명시.
- desk-panel.ts와panel*잠금해제. 디자인공통파일/기존UI컴포넌트미수정.

### DESK-MODEL / desk_geometry 착수 — 2026-10-14
- 리더 위임: 신규 `src/components/furniture/DeskModel.tsx`만 잠금. calculateDeskGeometry와기존Panel/Door/Drawer/ShortLeg를소비.재질/Canvas/조명생성없음,공용컴포넌트수정없음.footMaterial은root주입.원본feet상단y0·bbox−20..0과ShortLeg22.5mm외형차이를보정추정하지않고미확인명시.

### DESK-MODEL 납품 / desk_geometry — 2026-10-14
- 신규 DeskModel.tsx만구현: 코어panels/beams/feet·기존Panel/Door/Drawer·기존Blum계획/마운트소비,root주입materials/footMaterial사용. Canvas/lighting/재질생성없음. 몸통footOffset한번적용, z0..depth보존,안정sectionId선택용invisible collider및frontclick연결.
- 발은공용ShortLeg(mm)×0.1만적용. sourcefeet상단y0보존. 원본gallery bbox−20..0mm와공용22.5mm높이차이·정확외형미확인은userData/주석기재.12mm노출을맞추기위한삽입위치추정없음. rootfloor가0이면geometry최하단−1.05cm가될수있어리더시각검토필요. sourceUI외경73과실제meshbbox를동일단정하지않음.
- 변경파일lintPASS. tsc검사는기존.next/dev/types/validator.ts오류2개만,DeskModel오류없음. Three invisible collider raycast실검사PASS. 실제Canvas검증/격리build는리더통합후수행.
- DeskModel.tsx잠금해제. 기존Drawer/HW/Blum/Panel/store모두미수정.

### WARDROBE-CORE 1차 조사·어댑터 결과 / 2026-10-14
- 실제Nuxt 옷장API/엔진경로까지추적. legacy source와현행Edge엔진분리. 상세 docs/handoffs/wardrobe-core.md.
- 독립front계산288원본oracle사례통과,범위eslint통과. tsc는공유 .next/dev/types/validator.ts 기존Route2오류만(제품소스오류없음).
- 전체옷장생성기 **미완료**: Edge/Tone DNA 본문/실제rendergeometry 확보가선행. 임시UI glyph를실제구조로쓰거나임의판재를만들지않음. 신규adapter/types/initial만납품,현재UI는자동연결되지않음.
- 리더가추가source수집중이며본담당신규파일잠금유지. 다른담당소스수정없음.

### DESK-TYPE01 독립대조 착수 / desk_geometry — 2026-10-14
- 리더가확보한Type01Desk HTTP200 DNA대조. 재잠금 `src/lib/furniture/desk/index.ts`, `scripts/furniture-desk/*` sourcefixture/tests/notes, `docs/handoffs/desk-core.md`. Root의DeskModel/전용페이지/공통design수정과겹치지않음. 독립source비교후미확인표기정정예정.

### DESK-TYPE01 납품 / desk_geometry — 2026-10-14
- HTTP200Type01Desk DNA(superior_object_line0,mesh2498)를독립oracle로대조:1,480원본설정패널/front/beam/feet일치. 기존Type02 2,032포함총3,512구조사례,입력차단1+panel4=3,517검사PASS. lintPASS.
- DeskType01양개문은Bookcase550이아닌내경>570mm임확인,core와panel해당분기만수정. Type01구조unsupported경고제거. Classic외형/재질/정밀footmesh까지동일하다고확장해주장하지않음.
- source-oracle선택DNA의line을사용,Type01별도goldenfixture보존.인계/스크립트notes의Type01미확인문구정정. root가진행중인12색정확목록수정과겹치는코드미수정.
- 모든DESK-TYPE01작업잠금해제. 실제Canvas최종검증/전체build는root통합진행.

### Desk 케이블·열 너비 후속 — desk_geometry (진행 중)
- 리더 요청: 케이블 관리 / local-edge source 분석, 선택적 Desk 입력 계약과 검증. Modern 실관측 12색 적용.
- 잠금: `src/lib/furniture/desk/**`, `src/lib/furniture/desk-panel.ts`, `scripts/furniture-desk/**`, `docs/handoffs/desk-core.md`.
- `DeskModel.tsx`, 공통 타입·상태는 리더 소유. 브라우저 조작하지 않음.

### MOVENTO 400mm 가구 연결 납품 — codex-assistant / 2026-10-14
- 760H3500S+T51.7601 좌우 CAD/단면 이식. 400mm 레일 최소403mm 조건 때문에350mm 선택. 고정/중간/이동 부재 개폐 연결. 원본·품번·단위·제조 미확인: docs/blum-movento.md.
- 3개 테스트 PASS, 변경소스lint PASS, 전체lint0오류/7경고, 격리webpack build+TypeScript PASS. Chrome400mm Grid 서랍Max 열림/닫힘/하부반투명 캡처 및fingerprint 저장. 제조치수·CNC·정밀중간레일운동·모든조합간섭·조립시퀀스 미확인.
- 이번 MOVENTO 파일 잠금 해제. Door.tsx 및 리더 손잡이 수정 미접촉. 경첩 교체는 미완료이며 다른 품번으로 대체하지 않음.

### Tone 옷장 분리 잠금 — 2026-10-14
- 담당: 내부 보조 `horizontal_rules` (Tone 전담으로 재배정).
- 수정 허용: `src/lib/furniture/wardrobe/tone.ts`, `tone-*` 신규 규칙 파일, `scripts/furniture-wardrobe/tone-*`, `docs/handoffs/wardrobe-tone-core.md`.
- Edge 및 공통 index/types/initial은 `wardrobe_geometry`, UI/Scene/저장 연결은 리더.
- 완료 기준: 관찰된 Wardrobe DNA4 입력을 독립 규칙으로 생성하고 별도 oracle 사례에서 판재·문·서랍·옷봉 배치 비교. 검증되지 않은 형상은 unsupported로 구분.

### Desk 케이블·열 너비 후속 — desk_geometry 완료 / 잠금 해제
- 추가: optional cableManagement, 채널별 cableOpenings, 실제 호스트 panelIndex 포함 cm 타공 좌표와 가용성. core/panel 및 fixture·검증 구현.
- Modern 실측 12색(샌드+미드나잇 포함)으로 교정. Classic 9색 유지.
- local-edge는 두 Desk SHIFT mesh에서 사용되지 않음: 1,120 source 비교로 offsets 무효 확인. 불필요한 열 너비 옵션 미추가.
- 테스트 4,639 PASS, 변경 core/panel ESLint PASS. 자세한 근거 및 렌더러 계약: `docs/handoffs/desk-core.md` 후속 절.
- 실제 패널 관통구멍·공유 상태 검증·전역 빌드는 리더 통합 범위. DeskModel 수정하지 않음.

### Desk 케이블 실제 관통 렌더 — desk_geometry (진행 중)
- 리더 위임 잠금: `src/components/furniture/DeskModel.tsx`, 신규 `DeskPanel.tsx`, `src/lib/furniture/desk-cable-geometry.ts`, `scripts/furniture-desk/cable-render.test.mjs`.
- 기존 Panel, Blum geometry/Bore 타입은 수정하지 않는다. 기존 경첩 타공 후 추가 CSG, 면 재질·자원 해제 보존. 상판 Y축·뒤판 Z축 실제 관통 raycast 검증.

### 조립 안내 커밋·푸시 / codex-assembly / 사용자 요청
- 현재 작업폴더는 .git 없는 원본 ZIP. 동일원격 `leejinsoo1979/befun_new` main의 clean 게시사본 확인, 독립 `/private/tmp/befun-assembly-publish-20261014`에서 준비. 조립 안내·원본자산·본인 인계와 필수미게시 의존모듈만 포함, 타담당 상품/store/CNC 변경은 제외. 게시사본의 실제diff·lint/build 확인 후 main 커밋·push. 현재공유 소스/서버 변경 없음. 이 게시기록 추가만 본인 문서잠금.

### Desk 케이블 실제 관통 렌더 — desk_geometry 완료 / 잠금 해제
- `DeskModel.tsx` → 신규 `DeskPanel.tsx` 연결, 신규 `desk-cable-geometry.ts` CSG 관통구멍 구현. 기존 Panel/Blum geometry/Bore 타입 수정 없음.
- 실제 상판 Y축·뒤판 Z축 구멍 raycast/체적/6면 재질/경첩 pocket 보존 5개 테스트 PASS. 변경 파일 ESLint PASS.
- TS 검사: 기존 `.next/dev/types/validator.ts` route 오류 2개 외 신규 오류 없음. 브라우저·빌드는 리더 확인.
- DeskModel 포함 잠금 해제. 인계 상세: `docs/handoffs/desk-core.md`.

### 컨피규레이터 로딩 연출 — codex-assistant / 사용자 요청
- 잠금: 신규 ui/ConfiguratorLoading.tsx, ui/configurator-loading.module.css, three/SceneReady.tsx; Scene.tsx/FurnitureScene.tsx의 초기 준비 신호만, configurator/page.tsx·ProductConfigurator.tsx·FurnitureConfigurator.tsx의 dynamic loading만. 다른 담당 모델/상태 수정 없음.
- `claude-graphics` (사용자 직접 지시 "로고 아래 가구 제목·하트 당장 없애라", 2026-10-14) → UI/storefront: `ProductConfigurator.tsx` 뷰어 상단 제목+즐겨찾기 하트(`viewerHeading`) 제거. 로딩/본 화면 모두 `<h1 className={styles.srOnly}>`로 바꿔 제품명은 스크린리더·SEO용으로만 유지. 사용 안 하게 된 `useSavedProducts`·`FiHeart` import 제거. 저장/마운트 handler·CSS 미수정(`.viewerHeading` 규칙은 남아 있으나 미사용). eslint 0, 3003 화면 확인. 이 파일 수정 시 유지 부탁. 상품 카드·헤더의 즐겨찾기 기능은 그대로.

### 컨피규레이터 로딩 연출 납품 / codex-assistant
- SVG 판재 순차조립·빛 스윕·완료 페이드,3진입점 공용 연결. 데스크톱/모바일 실제Chrome 및 reduced-motion/로딩해제 확인. 전체lint0오류9경고. webpack컴파일 성공, 전체타입검사는 wardrobe-panel.ts:36 / wardrobe/index.ts:14 외부범위2오류로 실패. ProductMaterialGallery hydration경고도 인계. docs/handoffs/configurator-loading.md 참고. 로딩 작업 파일 잠금 해제.

### 조립 안내 커밋·푸시 완료 / codex-assembly
- 사용자 요청으로 원격main `0b0e434` 기반 독립 Git 사본에서 조립 안내/원본 자료/본인 인계/필수HW 의존 파일128개만 commit. `5acfd9a` Add Befun assembly guide and leg reference instructions. GitHub `leejinsoo1979/befun_new` main push 성공. 상품/store/CNC/package/schema 기존파일 변경0.
- 게시사본35검사 PASS, lint 오류0/기존main 경고8, 네트워크 허용후 실제 webpack build/전체TypeScript/static generation PASS. .env/Prisma생성물/node_modules Git 제외. 작업폴더ZIP .git 없음 상태보존, 게시사본 `/private/tmp/befun-assembly-publish-20261014`. 본 게시 문서잠금 해제.

### 옷장 손잡이·옷봉 관찰 기하 — desk_geometry (진행 중)
- 리더 위임: 신규 `src/lib/furniture/wardrobe-hardware.ts`, `docs/handoffs/wardrobe-hardware-observations.md`만 잠금. WardrobeHardware.tsx·공용 모델/상태는 리더 소유.
- 로컬 공개 GLB 5종과 공개 렌더러의 단면·기준점·길이 변형을 확인하고 cm 단위 독립 geometry helper 작성. 원본 GLB 전체 복사/바운딩 박스 대체 없음. 관찰 단면 재구성과 미확인 곡면 차이는 구분.
- `claude-graphics` (사용자 직접 지시 "로고·네비가 헤더를 벗어남, 헤더 컨테이너 안에 넣어라", 2026-10-14 10:28) → storefront: `storefront.module.css` `.innerStorefront > main` padding-top 64→112px(헤더 top 24 + 알약 64 + 24), ≤950px 96px 추가(기존 ≤700px 80px 유지). 고정 헤더·알약 자체는 미수정. 1440/900/390 폭에서 흰 헤더 영역 안 확인. 참고: 현재 dev에 `WardrobeModel.tsx`의 `@/lib/furniture/wardrobe-hardware` 미존재 빌드 오류 오버레이(담당자 확인 필요, 수정 안 함).

### 배포·로컬 전체 동기화 착수 / codex-assembly / 사용자 직접 요청
- 사용자 지적: 커밋·푸시 후 운영 화면이 현재 로컬과 다름. 조립 범위만 게시한 5acfd9a와 ZIP 런타임을 전체 비교. src 154개, public 562개 차이 확인. 현재 src/public/scripts는 읽기 전용 스냅샷으로 독립 Git 사본에 동기화하고 lint/build·실제 운영 화면 검증까지 수행. 다른 담당 잠금/공유 서버/.next 미수정.
- 본인 문서 잠금: 신규 docs/handoffs/deployment-parity-20261014.md, docs/handoffs/assets/deployment-parity-20261014/**. team-tasks.md는 본 작업 append만. 활성 옷장 등 소스는 원소유자 수정 유지; 통합 오류는 격리 사본 검증 후 기록.

### wardrobe_geometry — Edge core 검증 및 Tone 물리 서랍 통합 (2026-10-14)
- 소유 파일: `src/lib/furniture/wardrobe/` 공통/Edge/adapter/`tone-drawers.ts`, `scripts/furniture-wardrobe/edge*`, front fixture tests. Tone core는 horizontal_rules 단독 소유.
- Edge 일반 생성/평상단/혼합 구획: 공개 source 7,824 설정 bbox 대조 통과. 물리 서랍1,036건, 독립 문판288건 대조 통과. 고정 regression492+160 사례 보존.
- Tone 실제 getRender 5판 서랍72설정/1,170판 검증, 최대1mm 반올림 차이와 실물 runner travel 미확인을 문서화. 원본의 외부 큰 앞판 별도 지원.
- stable section IDs를 문/서랍/옷봉/개구부까지 전파. 저장 입력 불법 series/enum/비유한치수/중복ID/불법step 거부.
- 실행 범위 ESLint 통과, core regression 통과. 전체 build/UI 시각검증은 리더 통합 단계. 인계: `docs/handoffs/wardrobe-core.md`.
- 제조/CNC/손잡이실물/조명단면/원본모든조합 동치는 완료 주장하지 않음. 공통 소유는 현재 통합 후속 검증까지 유지.
- wardrobe_geometry 인계 완료: 공통/Edge/물리서랍 파일 잠금 해제, 리더 통합 수정 가능. 마지막 TypeScript는 `.next/dev/types/validator.ts` 기존 Route 오류2개만 남았고 본 코드 오류 없음. Tone core155 fixture 및720 heldout 기록은 `docs/handoffs/wardrobe-tone-core.md` 참조.

### 옷장 손잡이·옷봉·조명 관찰 기하 — desk_geometry 완료 / 잠금 해제
- 신규 `src/lib/furniture/wardrobe-hardware.ts`: grip/short 좌우/front bar/cross bar/light profile/diffuser 6개 geometry API. cm 입출력·원본 원점·소비자 dispose. `scripts/furniture-wardrobe/hardware.test.mjs` 10 PASS, 변경 ESLint PASS.
- GLB 정점→생성 표면 편도 거리: grip 최대0.000372 mm, front0.000001 mm, cross0.000051 mm. short 끝 loft 근사 최대0.437 mm, light 축방향 원본 미세굴곡은 폭650 mm에서 최대약0.403 mm 차이 남음. 완전 동일로 표시하지 않음.
- `docs/handoffs/wardrobe-hardware-observations.md`에 원본 자료·배치 조건·고정부 변형·API·오차·검증 한계 기록. 전체 타입 검사는 기존 `.next` Route generic 오류2개만. 전체빌드·통합 시각 검증 리더 담당.
- WardrobeHardware.tsx/공용모델 수정 없음. 위 신규 파일 잠금 해제.

### 가구 저장·복원 및 Tone 문 방향 통합 수정 — horizontal_rules 완료 / 잠금 해제
- 리더 위임 소유: `src/lib/furniture/design.ts`, `wardrobe-panel.ts`, `scripts/furniture-integration/state.test.mjs`; 추가 승인 `desk-panel.ts`의 팔레트 상수 import 이동만. 해당 파일 수정 완료 후 잠금 해제.
- 저장 상태에서 정규화 시 구획 수·명시 패턴·레이아웃이 바뀌는 값, 지원 없는 개별 너비/Tone 열린 전면을 거부. 생략된 선택 기본값과 정상 기존 저장 상태는 보존. Desk 실제 family 팔레트 검증을 UI 공통 상수로 연결하고 빈 구획 ID 거부.
- Tone 2단문 강제 좌/우 방향은 실제 프런트 방향을 표시하고 비활성화. 변경 가능한 좁은 단문의 방향은 source 전역 방향처럼 모든 구획에 적용하여 선택한 구획 이외의 값에 의해 덮어써지는 문제 수정.
- 검증: 가구 통합 12/12, Edge 492 geometry+160 drawer, Tone155 geometry/복원, Tone72 설정/1,170 서랍판 회귀 PASS. 변경 파일 ESLint PASS. 전체 tsc는 기존 `.next/dev/types/validator.ts` Route constraint 오류2개만. 공용 dev/build 산출물 수정 없음; 전체 production build와 Chrome 최종 검증은 리더 담당.

### 옷장 경첩 규칙 — desk_geometry (진행 중)
- 리더 위임 신규 `src/lib/furniture/wardrobe-hinges.ts`, `scripts/furniture-wardrobe/hinges.test.mjs`, 기존 본인 `docs/handoffs/wardrobe-hardware-observations.md` 경첩 절만 잠금.
- 공개 source 기준 Edge 면적 수량·Tone 높이 수량·선반/서랍 회피·문/측판 기준점 분리. 실제 제조 사양/타공 추정 없음. WardrobeModel·공유 타입/생성기 미수정.

### wardrobe_geometry 후속 — Edge 원목·케이블 (2026-10-14)
- 리더 승인 소유: wardrobe core/types/initial/adapter/source-types, 신규 edge-cable.ts, wardrobe-colors.ts, wardrobe-panel.ts, design.ts 및 관련 독립 tests. 기존 horizontal_rules 결과 보존.
- exact Cleaf 2재질·원본케이블규칙·원목전면깊이차이 구현/검증, layout glyph 횡방향옷봉 표시 수정. root는 재질메시/텍스처확보 소유.

### Desk·Wardrobe 통합 독립 production build — horizontal_rules 진행
- 리더 위임: 공유 `.next`·개발 서버·소스는 읽기 전용. 비밀 환경 파일을 제외한 `/tmp` 사본과 node_modules symlink로 `next build --webpack` 수행.
- 문서 단독 잠금: `docs/handoffs/desk-wardrobe-build.md`. 컴파일/타입/정적 생성 결과와 환경 제약을 기록하고 빌드 오류의 원인을 리더에게 보고. 승인 없는 공용 코드 수정 없음.
- 격리 build 결과: 2026-10-14 10:56:17 KST 스냅샷 전체 webpack/TypeScript/17페이지 정적 생성 PASS. 전체 lint 오류0/기존경고7. fonts DNS 실패는 네트워크 허용 후 동일 소스로 재검증 성공. 실제 비밀키·DB URL 사용 없음. 최신 `wardrobe-hinges.ts`, `wardrobe/edge.ts` 2개 후속 변경은 아직 포함하지 않았으므로 결과범위 구분. 상세 `docs/handoffs/desk-wardrobe-build.md`.

### 배포·로컬 전체 동기화 완료 / codex-assembly / 2026-10-14
- 10:45:57KST 현재 src/public/scripts 전체 byte parity0개 확인 후 관련 문서/검증/원본자산 포함1164파일 commit. `8b0f837` Sync current storefront and furniture configurators. GitHub main push 확인, Vercel 생산 READY와 실제 alias commit 일치 확인. 게시사본 clean.
- 독립 npm ci→기본 production build+전체TypeScript PASS, lint0오류/기존7경고. focused85·구조7537·최종가구저장12검사 PASS. Chrome 운영상품/다리/갤러리8장/Desk/Tone개폐/조립다리5단계 확인. 본인 임시 viewport 복원, 공유dev/.next/타담당파일 미수정.
- 실제 미완료: Vercel production env0개, api/auth/session500/NO_SECRET. 계정/DB 저장은 운영 설정 필요. CAD/제조정확도/3D다리운동 기존 미확인보존. 새 후속옷장/경첩 작업은10:45 이후로 별도.
- 인계 docs/handoffs/deployment-parity-20261014.md와 해당 source-fingerprint/production-verification/screenshots. 본인 문서 잠금 해제.
- `claude-graphics` (사용자 직접 지시 "커밋해", 2026-10-14): 프로젝트 폴더에 `git init` 후 공유 작업 트리 전체를 기준점 커밋 `c466e45` (main, 2,086 파일). 모든 담당자의 그 시점 진행 중 변경 포함. `.env*`, node_modules, .next, src/generated/prisma는 .gitignore로 제외. 이후 각 담당은 이 커밋 기준으로 변경 확인 가능.

### 담당자 커밋 완료 후 재푸시 대기 / codex-assembly / 사용자 직접 지시
- 사용자: "애들이 커밋 다하면 다시 푸시해봐". 원격 main의 `8b0f837` 배포 완료와 별개로 공유 작업폴더의 새 Git 기준점 `c466e45` 및 후속 담당자 커밋 완료를 기다린다. 현재 공유 origin 없음, 게시사본과 독립 history이므로 force push/기준점 덮어쓰기 없이 검증된 최종 tree와 담당별 commit을 보존해 합칠 예정이다.
- 진행 중 파일 잠금은 그대로. 각 담당자는 commit 완료/HEAD와 release를 기존 인계에 기록해 주면 수신 확인 후 독립 사본에서 integration·build·push·운영 revision 확인한다. 소스와 shared .git은 이 담당자가 수정하지 않는다. 본 기록 append 외 잠금 없음.
- wardrobe_geometry 후속완료: Edge Cleaf2컬러/우드기하1296oracle,케이블1296oracle,현재힌지648oracle일치; round문판/우드저장복원/후판케이블높이선택/Tone glyph수정. 원본legacy힌지불일치를현재Nuxtsource로교정하도록desk_geometry와crosscheck함.
- 재검증: edge core회귀/edge-options3개/integration12개/Tone155개PASS,eslintPASS. root 실제재질/CSG/하드웨어렌더소유. Tone rawhinge연결은별도필요. 후속소유파일잠금해제.

### 옷장 경첩·원목 원형 손잡이 — desk_geometry 완료 / 잠금 해제
- 담당 범위 추가: 신규 `wardrobe-hinge-assets.ts`, `hinge-source-fixtures.json`, `public/models/wardrobe/hinge-*.glb` 및 출처README; 기존 본인 `wardrobe-hardware.ts`의 ring helpers, hardware tests. 모두 완료 후 잠금 해제. 공통 WardrobeModel/생성기 수정 없음.
- 최신 Edge Nuxt 규칙 교정(legacy 차이 확인), sibling source.hinges/adapter 연결 후 독립648설정 1mm 반올림 대조 PASS. Tone109 legacy 사례는 별도 검증이며 최신Tone통합 미완료. 완료로 오기하지 않음.
- 실제 공개 hinge wing/anchor 자산 원점/전체13,887정점 보존cm변환 loader; ring32각실측단면·hole평면 helper 추가. 출처/허용오차/소비자dispose 계약은 hardware-observations 인계문서에 기록.
- hinge tests5,hardware tests11 PASS; 변경 ESLint PASS. tsc 기존 .next Route오류2개만. Chrome최종시각검증·전체빌드 리더담당.

### Tone 원본 경첩 중간 위치 연결 — horizontal_rules 진행
- 리더 위임 소유: `src/lib/furniture/wardrobe/tone.ts`, `scripts/furniture-wardrobe/tone-*` 테스트·fixture, `docs/handoffs/wardrobe-tone-core.md`. 공통 `wardrobe-hinges.ts`는 읽기만 사용.
- 표준 선반이 제거·두께 보정되기 전의 장애물과 원본 문 끝 여유를 보존하여 source.hinges 생성. 공개 Type03 원본 engine의 실제 getGeometry 경첩 bbox와 대조. 종료 후 격리 build 사본 갱신 예정.
- Tone 경첩 연결 완료: raw18mm 표준선반(추가선반 포함)/도어원본offset을 보존하여 source.hinges 생성. 실제 원본 전체bbox+hinges720/720, frozen155, 별도72 조합 PASS. 통합·hinge regression18 PASS, 변경 ESLint PASS. Tone core/test 파일잠금 해제. 격리 build 최종 갱신은 다음 단계로 이어감.

### Cleaf 판재별 UV 보정 — wardrobe_geometry 진행
- 리더 위임 소유: 신규 `src/lib/furniture/wardrobe-panel-materials.ts`, 기존 `wardrobe-materials.ts`, 전용 tests 및 wardrobe-core 인계문서. DeskPanel/Front/Drawer 연결은 리더 소유.
- 현재 CG3UhuDu2 공개 renderer의 meter mapRatio, plane/edge repeat·offset·rotation·flipY를 대조. 원본 panel GLB UV 축 검증은 별도로 구분하며 임의 텍스처 비율을 추가하지 않음.

### 제공 SVG 로고·패널 로딩 완료 및 커밋 — codex-storefront / 2026-10-14
- 일반 검정/footer 흰색 원본 로고 및25패널 순차조립 완료. Chrome 검정·흰색/부분조립/reduced-motion 완성로고/ready 해제 확인. lint0오류7기존경고, 격리webpack/type/17페이지 build PASS. 모든 모바일 애니메이션 직접검증은 미실시.
- 소스7개는 공유 기준점 c466e45에 이미 포함. 후속 커밋은 본인 handoff·이 완료기록만. 기존 SVG/BrandLogo/footer/loading 잠금 모두 해제. 리더 및 재게시 담당은 인계 사용 가능. 공유 서버/.next·다른 담당 소스·push 미접촉.
