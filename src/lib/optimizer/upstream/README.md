# upstream (250709in CNC 옵티마이저)

출처: https://github.com/leejinsoo1979/250709in `main@7ecfd99` (2026-10-13)

재단 배치 엔진, MPR/CIX/DXF/PDF/CSV 내보내기, 재단·엣지·가공 시뮬레이션, 옵티마이저 화면(`CNCOptimizerPro`)을 원본 그대로 가져왔다.
Befun 쪽 연결은 `../befun/`(패널 변환·스냅샷 store), `src/components/optimizer/`, `src/app/optimizer/`에 있다.

## 원칙

- 원본 `src/` 경로 구조를 그대로 유지한다. 원본이 바뀌면 같은 경로로 다시 가져온다.
- 로직은 수정하지 않는다. 가져올 때의 변경은 아래뿐이다.
  - import 경로: `@/` → `@/lib/optimizer/upstream/`, `react-router-dom` → `shims/react-router-dom`, `firebase/firestore` → `shims/firebase-firestore`
  - 타입만 보정(런타임 동일): `useRef<T>()` → `useRef<T | undefined>(undefined)`(React 19 타입), `Rect.x/y`의 `!`, `Blob`의 `as BlobPart`,
    `types.ts`의 `Panel.canRotate?` 선언 추가, `types/cutlist.ts`의 `OptimizationType`에 `'OPTIMAL_L' | 'OPTIMAL_W'` 추가,
    `domain/boring/types.ts`의 `rowCount`에 `3` 추가, `exporters/index.ts`의 `boringsByType` 캐스트, `mprPanelConversion.ts`의 optional 처리, `csvExporter.ts` 매개변수 타입
  - `// @ts-nocheck`(원본에 있던 strict 오류, Vite는 타입 검사를 안 해서 남아 있음): `CNCOptimizerPro.tsx`, `CuttingLayoutPreview2.tsx`, `ExportBar.tsx`, `SidebarLeft/PanelsTable.tsx`
- 데이터 추가: `editor/shared/controls/styling/materialData.ts`에 Befun 색상 견본을 덧붙임(재생 시뮬레이션 겉면색, `../befun/colors.ts`).
- [Befun 확장] 커넥터 슬롯(OVVO): 파일에 `[Befun 확장]` 표기.
  - `domain/boring/types.ts`: `ConnectorSlot`, `PanelBoringData.connectorSlots`
  - `domain/boring/exporters/connectorMpr.ts`(신규): 슬롯 MPR(상면 KO=00, 마구리 측면 평면 KO 01~04 — 공장 확인 필요), 하면 가공 판재를 반전 적재 프로그램 `(하면)`으로 분리, 슬롯 검증
  - `mprExporter.ts`·`mprProduction.ts`: 위 확장 연결, '가장자리 개방' 보링(면 보링 커넥터) 외곽 검사 예외, 파일별 `panelId`
  - 시뮬레이션: `program.ts`(mill 가공면에 마구리 4면), `panelMachining.ts`(슬롯 → 루터/앵글헤드 경로, 하면 보링 포함), `panelSawProcess.ts`(키홀 한 번에 전체 깊이, 마구리 슬롯 공정, 하면 보링 반전), `removal.ts`(마구리 슬롯 캡슐 부피 CSG), `replayPose.ts`, `layoutMachining.ts`, `routingPaths.ts`
  - `ExportBar.tsx`: manufacturing.json 파일↔판재 대응을 파일별 `panelId`로
- ESLint 대상에서 제외(`eslint.config.mjs`).

## Befun shim (파일 첫 줄에 `[Befun shim]` 표기)

| 파일 | 대체 내용 |
|------|-----------|
| `editor/CNCOptimizer/hooks/useCncPanelData.ts` | 원본 가구 패널 대신 Befun 디자인 스냅샷 패널(`../befun/store.ts`) |
| `editor/CNCOptimizer/components/PanelHighlight3DViewer.tsx` | 원본 공간 3D 뷰어 대신 Befun 판재 상자 뷰어(같은 props, meshName 하이라이트) |
| `store/core/spaceConfigStore.ts` | `spaceInfo.panelThickness`·`materialConfig`만 제공. Befun 엣지색을 `interiorEdgeColor/doorEdgeColor`로 넣어 엣지밴딩 공정을 만든다(Classic은 합판 단면 노출로 없음) |
| `store/core/furnitureStore.ts`, `data/modules.ts`, `editor/shared/furniture/types.ts`, `editor/shared/utils/lowerCabinetDowelShelves.ts`, `editor/shared/viewer3d/utils/geometry.ts`, `domain/boring/index.ts` | 원본 가구 모듈 관련. Befun에는 배치 모듈이 없어 빈 값 |
| `editor/SketchMode/conversion/conversionStore.ts`, `editor/Configurator/designWorkspace.ts` | 스케치 컨버팅 없음(`cnc: null`) |
| `access/store.ts`, `firebase/admins.ts` | 기능 권한 항상 허용(접근 제어는 Befun 라우트에서) |
| `auth/AuthProvider.tsx`, `firebase/*` | Firebase 미사용 |
| `contexts/ThemeContext.tsx`, `theme/index.ts`, `components/common/Logo.tsx` | 고정 라이트 테마, Befun 로고. 테마 CSS 변수는 `src/components/optimizer/optimizer-theme.css` |
| `i18n/useTranslation.ts` | `locales/ko.json` 직접 조회 |

## 가져오지 않은 원본 코드

원본 가구에서 판재를 뽑는 `useLivePanelData`, `panelExtractor`, `panelTextureNames`, 공간 편집기, 스케치 모드, Firebase 저장.

## 검증 방법

원본 단위 테스트(코어만 쓰는 69개 파일, 475개)를 이 디렉터리에 대고 돌려 473개 통과. 실패 2개(`EdgeBander.scene` 테이프, `replayAppearance` 블랙 견본)는 원본 코드에서도 같은 결과로 실패한다.
R3F 9에서는 테스트의 `createRoot(...).configure()`를 `await root.configure()`로 바꿔야 한다.

## 정적 파일

`public/sfx/cnc/`(효과음), `public/hdri/studio_small_09.hdr`, `public/materials/{solid,countertop}/`(재생 재질 견본)을 원본에서 복사했다.
