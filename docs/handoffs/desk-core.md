# Desk core handoff — 2026-10-14

**Type01 follow-up:** independent HTTP200 Type01 Desk DNA (`superior_object_line:0`,mesh2498) now verified against1,480 generated settings. Type01/Type02 Desk both use clear-width>570mm for paired doors. The earlier Type01 unverified caveat below is superseded for the covered structural output. Detailed material/foot mesh/cable/local-width behaviour is still not complete.

## Status and API

`src/lib/furniture/desk/index.ts` exports `calculateDeskGeometry`, `availableStorageColumns`, `DESK_CHANNEL_OPTIONS`, `DeskInput`, `DeskResult`.
Input dimensions are millimetres. All returned panel/front/opening/beam/foot coordinates are centimetres. Origin: body bottom y=0, rear z=0, horizontal centre x=0. Lift the body 1.2cm for a displayed total 73cm. Body height71.8cm; source gallery adds12mm to height, while source small-foot geometry spans y−20..0mm. These are different measurements and must not be conflated.

Storage channels array excludes the legroom, retains left-to-right storage order. `legroomPosition` includes positions0..storageColumns. Every column descriptor exposes storageIndex or null. Standard UI has no density/style/height controls; width900..2400mm, depth400/500/600mm. Storage choices use applicable setup width ranges; width changes must choose a valid available count before invoking the generator. A fixed existing count is rejected if unavailable.

The 8 source storage compositions are exposed with source series IDs and Korean descriptive labels. Each storage accepts optional left/right door direction. Legroom is two ratio units, storage one unit. Individual fractional ratios are floored, remaining millimetres assigned in visual left-to-right order. This is not simple equal division.

## Confirmed Desk rules (Type02 and independently verified Type01)

- Body: 700mm structural pitch plus18mm cap. Stored rows are300/200/200,500/200, or700mm pitch according to composition.
- Same-height adjacent horizontal panels join across storage columns; no bottom or intermediate horizontal crosses the legroom. The top is full width in source gallery geometry (public maximum2400mm).
- A shared vertical is split at shelf levels from either adjacent storage. The outside wall beside edge legroom remains continuous y0..700mm.
- Legroom has a mandatory upper back y318..700mm and a beam y670..700,z(depth−44)..(depth−24), not a full-height back even with Back panels On. The observed gallery beam is30mm tall; earlier module constants40mm do not equal the final generated object bounds.
- Open storage keeps source end supports125mm; doors/drawers force backs. Full-height door backs wider570mm split horizontally into two pieces. Other heights stay whole in the covered cases.
- Both Desk families: door clear width>570mm creates two leaves. Odd millimetre belongs to the left leaf. This differs from the Type01 Bookcase550mm threshold.
- Door inserts have18mm thickness, z18..depth−30, at pitch300 and500 where inside a tall door. These are panels in the output.
- Feet follow storage walls, with16mm inward shift at outside storage walls and the storage/legroom boundary; outside legroom wall feet sit on its axis. Front/rear z25/depth−25.

`beams` is separate from `panels`: render it and include it deliberately in whichever structural reporting accepts beams. Do not silently drop it. Front bounds consume existing reference door/drawer placement functions; the source gallery's19mm envelope is converted by the existing material family renderer.

## Verification

Source: prior captured `/tmp/tylko-category-desk-type02-dna.json` and read-only offline public generator. No API request, source bundle, private owner/preset metadata, cookie, or token is embedded in runtime code. Numeric composition rules are implemented locally; generated results are frozen solely as independent test fixtures.

`node --test scripts/furniture-desk/structure.test.mjs`: 2,033 PASS. 2,032 generated settings check sorted panel positions/dimensions/material roles, front bounds/directions, beam boxes, and feet. 808 initial cases;552 mixed-channel heldout cases found the570mm boundary and it was corrected;672 further heldout/boundary cases passed unchanged. Includes all8 compositions, count/legroom positions, depths, backs and different door orientations. Precision1e−5cm in the comparison; this compares numeric generator outputs, not rounded UI labels.

Changed-files ESLint PASS. Full app build and live UI/3D verification belong to leader integration; this worker did not run shared dev or mutate browser state. No assertion of full app/CNC parity.

## Explicit remaining scope

- Type01 Desk independent DNA now verified:1,480 settings match panels/fronts/beams/feet. Its rendering family remainsType01 for the existing19mm door/full handles. The prior550mm paired-door guess inherited from Bookcase was corrected to570mm for Desk; unsupported structural warning removed.
- Cable openings, cable-management system, local-edge width editing, inserts toggle and drawer-handle flip are not exposed by this core version.
- Detailed foot mesh, joint/connector machining and manufacturing subdivision are not validated by these gallery fixtures.
- Pricing/business rules are not changed by the worker.

## Type01 validation follow-up

Type01 capture wrapper SHA256 `409b55446e740bae4cbc98a5f531aa2b29e741f20bc8ecd0303161f9f6ebd8e9`. New frozen `type01-source-fixtures.json` contains808 baseline+672 mixed-channel/boundary settings. Combined Type02+Type01 structural corpus3,512 settings passes independently, plus invalid-input and focused adapter tests. The Type01 API body is used only for offline evidence, not embedded in runtime. Root is observing the Desk-specific colour list separately.

## 케이블 관리 / local-edge 후속 (2026-10-14)

### 새 선택적 계약
- `DeskInput.cableManagement?: 'off' | 'left' | 'right'`: 다리 공간 1열의 케이블 관리. 기본 off.
- `DeskChannel.cableOpenings?: boolean`: 안정적인 수납 순서별 케이블 구멍. 기본 false. 해당 구성에서 구멍이 불가능해도 저장된 선택은 보존하며 출력에서는 제외한다.
- `DeskResult.cableOpenings: DeskCableOpening[]`: `panelIndex`, `columnIndex`, `storageIndex`(다리 공간 null), `surface: 'top' | 'back'`, `x,y,z,radius`. 단위 cm, 몸체 좌표. `panelIndex`는 같은 결과의 실제 `panels` 인덱스이며 모든 구멍에 유효한 호스트를 검증한다.
- `DeskResult.cableOpeningAvailability: boolean[]`: 각 수납 열의 실효 케이블 구멍 지원 여부.
- 공유 상태 normalize/parse 및 실제 관통구멍 렌더링은 리더가 통합한다. 이 서브태스크는 선택과 기하 계약까지 완료하며 **화면 타공 렌더링을 완료했다고 주장하지 않는다**.

### 관찰된 생성 규칙
공개 Desk Type01/Type02 DNA와 공개 geometry decoder 결과를 독립 비교했다. 런타임에는 이들 API/번들을 호출하지 않는다.
- 모든 구멍 반지름 30mm.
- 다리 공간 선택은 상판과 뒤판에 하나씩 총 2개. x는 왼쪽 벽 중심 +89mm 또는 오른쪽 벽 중심 −89mm. 상판 marker `(y=709,z=61)`, 뒤판 marker `(y=659,z=9)` mm. 뒤판 실제 두께는 0..12mm이며 marker z=9를 판 중심으로 재해석하지 않는다.
- 수납 뒤판 구멍은 drawer에는 생성되지 않는다. 문에는 강제 뒤판으로, 오픈칸에는 전체 backPanel ON일 때만 생성된다. 가능한 칸은 opening(하단·중단), door(하단에서 50·350mm 두 개), mix(하단·중단), drawer(최상단 오픈), some-drawer(최하단 오픈), door-drawer(하단 문), some-door(하단 문·상단 오픈). drawers에는 없다.
- 수납 구멍 y는 해당 칸 내경 하단 +50mm, door 단일 큰칸은 +350mm 하나 추가. x는 열 왼쪽 벽 축 +round(열 pitch/2). 넓고 높은 뒤판이 양분되는 door는 첫 번째 뒤판에 pitch/4 위치로 바뀐다. 방향 선택으로 수납 구멍 x는 바뀌지 않는다.
- 이 범위에 대해 양 제품군 각각 560개 독립 source fixture 저장: `scripts/furniture-desk/cable-type01-fixtures.json`, `cable-type02-fixtures.json`. 너비 907/1471/1784/1785/2393, 가능한 열 수와 다리 공간 위치, 8종 수납, 뒤판 ON/OFF, 깊이 400/500/600, 케이블 OFF/좌/우를 조합. 모든 구멍/가용성과 실제 호스트 판 내부 포함 검사 통과. 전체 가능한 조합 전수 검증은 아님.

### 개별 열 너비 — 지원 안 함 확인
두 DNA의 mesh2498은 `distortion_mode='shift'`. 공개 UI 가용성은 `'edge'` 모드에서만 local-edge를 활성화한다. Desk SHIFT에서는 `configurator_custom_params.lines`에 값이 있어도 적용하지 않는다. 위 1,120 사례 각각에 `'1_2':113, '2_3':-91` offset을 넣어도 열 경계가 변하지 않는 것을 비교했다. 따라서 Desk에 개별 열 너비 입력을 추가하지 않았다. 기존 2:1 배분 + 정수 잔여 분배, 열 수, 다리 공간 위치 선택을 유지한다.

### UI와 재질
- Modern 선택 목록을 리더가 실제 화면과 갤러리에서 대조한 정확한 12색 순서로 제한: White, Gray, Sand+Midnight Blue, Olive Green, Sage Green, Butter Yellow, Cotton, Teracotta, Stone Gray, Reisinger Pink, Lilac, Dark Brown. Classic 9색 유지.
- 기존 통합 패널 구조에 다리 공간 케이블(global), 수납 케이블(section) control 연결. 이는 리더가 요청한 탭 UI 대응이며 Tylko popup 배치까지 동일하다고 주장하지 않는다.
- 결과: Desk 전체 테스트 **4,639 PASS**, 변경 core/panel ESLint PASS. 전체 프로젝트 빌드·실제 화면 확인은 리더 통합 검증 단계.

### 케이블 관통 렌더 후속 완료
리더 위임으로 `DeskModel.tsx`가 `DeskPanel.tsx`를 사용하도록 연결했다. 신규 `desk-cable-geometry.ts`는 기존 `createBoredBox`의 경첩 타공 결과에 별도 CSG 원통을 뺀다. 상판은 Y축, 뒤판은 Z축으로 양면을 0.1mm씩 초과해 절삭한다. source marker의 뒤판 z=9mm를 구멍 깊이로 오인하지 않고 실제 호스트 판을 관통한다. 구멍 96각 tessellation은 화면 표현용이며 source CAD 형상과 동일하다고 주장하지 않는다.

- 검정 원/표면 decal이 아닌 실제 삼각형 기하 절삭.
- BoxGeometry 6면 재질 슬롯 유지, 상판 내벽은 edge 재질. 뒤판은 기존 단일 backPanel 재질.
- 중간 CSG geometry/캐시/임시 material 해제. React 기하 교체·unmount 시 반환 geometry 해제. `createFaceMaterials`가 만든 material/map만 해제하고 부모 소유 재질·공유 텍스처는 유지.
- 회귀 검사 5개 PASS: 두 제품군×케이블 좌우로 모든 구멍의 양방향 관통 raycast, 구멍 밖 판 보존, 절삭 체적, 6면 재질 슬롯, 동일 판에 기존 경첩 타공을 함께 적용한 경우 blind floor·표면 잔여 두께 유지.
- 변경 세 파일 ESLint PASS. 프로젝트 TypeScript 검사에는 기존 `.next/dev/types/validator.ts` route constraint 오류 2개만 있으며 신규 파일 오류 없음. 전체 빌드·실제 브라우저는 리더가 최종 확인.
