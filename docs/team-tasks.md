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

| 작업 | 담당 | 수정 파일 (잠금) | 관련 분석 항목 | 시작 | 상태 |
|------|------|------------------|----------------|------|------|
| 쇼핑몰 원본 화면 재대조·누락 세부 구성 보완 (사용자 계속 지시) | `codex-storefront` | `src/components/storefront/**`, `src/app/(storefront)/**`, `public/imgs/storefront/**`, `docs/storefront-page-audit.md`, `docs/storefront-clone.md` | 메뉴·목록·상세·메인 반응형 | 2026-10-13 | 이번 보완·검증 마침, 잠금 해제. 전체 원본 1:1 완성은 미완료(폰트403·브랜드영상·상품/운영 정보). 최신 감사 문서 참조. SVG 및 다른 담당 configurator/3D 유지 |
| 쇼핑몰 누락 페이지 보완 + 실측 규격 + 컨피규레이터 로고 재사용 (사용자 직접 지시) | `codex-storefront` | `src/components/storefront/**`, `src/app/page.tsx`, 신규 `src/app/(storefront)/**`, `src/components/common/ShopLayout.tsx`, `src/app/cart/page.tsx`, `src/app/login/page.tsx`, `public/imgs/storefront/**`, `docs/storefront-clone.md`, `docs/storefront-page-audit.md` | Tylko 메인/메뉴/푸터 연결 페이지 | 2026-10-13 | 페이지 연결·로고·핵심 규격 보완 구현 및 검증 완료, 잠금 해제. 전체 원본 픽셀/운영 기능 동치는 미완료, 차이·필요 정보는 audit 문서 참조. configurator/3D 잠금 파일 수정 안 함 |
| Tylko 쇼핑몰 메인 클론 (사용자 직접 지시) | `codex-storefront` (Codex 앱) | `src/app/page.tsx`, 신규 `src/components/storefront/**`, 신규 `public/imgs/storefront/**`, 신규 `docs/storefront-clone.md` — 공통 Header/Footer/ShopLayout 및 다른 담당 잠금 파일은 수정하지 않음 | Tylko en-uk 메인 실제 화면 | 2026-10-13 | 메인 구현·브라우저 검증 완료, 잠금 해제; 최종 전체 빌드는 동시 작업 3D 타입 오류로 실패 |
| 3D 뷰어 그래픽 품질 개선 (조명/톤매핑/그림자/재질/AO) | `claude-graphics` (Claude Code CLI, 기존 `claude`) | `src/components/three/Scene.tsx`, `src/components/three/Background.tsx`, `src/components/three/Effects.tsx` (신규), `src/lib/three/materials.ts` — package.json 잠금 해제(의존성 추가 없음) | - | 2026-10-13 | 1차 완료, 사용자 검토 대기 — 잠금 유지 |
| 모바일 AR (안드로이드 WebXR 배치+실시간 수정 / 아이폰 Quick Look USDZ) (사용자 직접 지시) | `claude-graphics` (Claude Code CLI) | 신규 `src/components/three/ar/**`, 신규 `src/components/ui/AROverlay.tsx`, 신규 `src/components/ui/QuickLookSheet.tsx`, `src/components/three/Scene.tsx`, `src/components/three/Background.tsx` (데칼 export만), `src/app/configurator/page.tsx` (AR 버튼 분기만). 의존성 추가 없음 | - | 2026-10-13 | 1차 완료(실기기 미검증), 사용자 검토 대기 — 잠금 유지 |
| 컨피규레이터 모바일 반응형 UI (사용자 직접 지시) | `claude-graphics` (Claude Code CLI) | `src/app/configurator/page.tsx` (레이아웃만, 가격/저장/스타일 로직 수정 없음), 신규 `src/components/ui/MobileConfiguratorPanel.tsx`, `src/components/ui/PriceDisplay.tsx` (compact 표시 옵션 추가만), `src/components/ui/StyleSelector.tsx` (모바일 가로 스크롤만), `src/components/ui/FloatingBox.tsx` (모바일 배치만), 신규 `src/components/three/cameraEvents.ts`, `src/components/three/RowColliders.tsx` (터치 탭 동작 추가만), `src/components/ui/RowControls.tsx` (모바일에서 미리보기 이미지 숨김만) | - | 2026-10-13 | 1차 완료, 사용자 검토 대기 — 잠금 유지 |
| CNC 옵티마이저 이식 (250709in `main@7ecfd99`): 재단 엔진·MPR/DXF/PDF/CSV·가공 시뮬레이션 + Befun 패널 변환 + `/optimizer` 페이지 (사용자 직접 지시) | claude-optimizer (Claude Code CLI) | 신규만: `src/lib/optimizer/**`, `src/components/optimizer/**`, `src/app/optimizer/**`. 공통: `package.json`, `package-lock.json` (의존성 추가: jszip, polygon-clipping, three-bvh-csg, three-mesh-bvh, mediabunny, lucide-react, jspdf; devDep vitest). 기존 소스 수정 없음 | - | 2026-10-13 | 1~3단계 완료, 잠금 해제 |
| 컨피규레이터 → `/optimizer` 진입 버튼 (사용자 직접 지시) | claude-optimizer (Claude Code CLI) | `src/app/configurator/page.tsx` (버튼 추가만, 스타일 디스패치 수정 없음) | - | 2026-10-13 | 완료, 잠금 해제 |

## 조율 요청

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
