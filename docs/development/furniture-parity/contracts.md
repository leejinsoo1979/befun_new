# 공통 계약 R1.2 — 다섯 담당자 공통 기준

소유자: 리더(codex-analysis). **R1.3에서 UI view/intent 타입만 `src/types/furniture.ts`에 게시했습니다.** 상태·기하 결과·저장 스키마·registry·적용 함수는 아직 미구현입니다. UI 담당은 preview 타입을 공통 타입 re-export로 교체할 수 있습니다. 이 게시만으로 실제 가구 서비스 연결을 시작하지 않습니다.

## 1. 분류와 근거

서로 다른 필드로 관리할 축:
- `category`: 기존 storefront slug. sideboard, bookcase, wallstorage, desk, dressing_table, tv-stand, chest-of-drawers, shoerack, bedside_table, vinyl_storage, wardrobe.
- `productFamilyId`: Befun 내부의 제품군 식별자. UI 브랜드 이름만으로 결정하지 않습니다.
- `generatorId`: 실제 구조 계산 경로. 같은 collection 이름도 서로 다른 경로일 수 있습니다.
- `panelProfileId`: 우측 제어 항목/순서/방식의 식별자.
- `finishId`, `colorId`, `styleId`: 각각 마감·색·배치. 서로 대체하지 않습니다.
- `presetId`, `presetVersion`, `schemaVersion`: 초기 상태와 저장 호환성. 숨은 상태가 확인되면 명시적으로 추가합니다.

새 ID의 실제 문자열은 리더가 공유 타입/registry에 한 번만 정의합니다. Tylko의 숫자 enum을 Befun 영구 ID로 직접 쓰지 않습니다. 원본 collection/shelf_type/dna_version은 연구용 출처 메타데이터로 보존합니다.

특히 Tone 수납6/7/8, Tone 책장·벽수납14, Tone 옷장3을 구분합니다. Edge 옷장은 Cabinet/type4이며 Tone 옷장 Wardrobe/type3와 다릅니다. 기존 Slant 명칭을 현재 UI 스타일과 자동 대응시키지 않습니다.

## 2. 단위·좌표 계약

- **새 공통 구조/검증 경계의 길이는 mm**, 각도는 radian. 필드명은 `widthMm`, `positionMm`처럼 단위를 드러냅니다.
- UI는 cm 표시가 가능하되 변환은 공통 어댑터에서 한 번만 합니다. 표시 반올림값을 저장 좌표에 다시 쓰지 않습니다.
- 기존 `PanelData`, 선반 store와 조절발 경로는 cm 기반 코드가 있습니다. 전체를 즉시 mm로 바꾸지 않습니다. 리더가 legacy cm ↔ 신규 mm 변환 어댑터를 소유하며 왕복 검증합니다.
- 신규 가구 좌표: x는 정면 기준 오른쪽, y는 위쪽, z는 뒤에서 앞쪽. 원점은 바닥면 위 가구 전체 폭의 중앙·후면 기준점입니다. 경사진/돌출 부품도 이 기준으로 기록합니다. 기존 장면과 다른 기준은 어댑터가 변환합니다.
- 판재 position은 형상 중심, 크기는 폭/높이/깊이의 양수입니다. 가구 바닥 기준 높이와 몸체 바닥 높이를 구분합니다.
- 다리 instance의 `anchorMm`는 **몸체에 닿는 부품 상부 체결 기준점**입니다. 다리 자체 로컬 원점도 이 기준에 두고 아래쪽으로 형상을 만듭니다. 외형 bounding box와 앵커를 혼동하지 않습니다.
- 리더가 renderer의 기존 단위/회전 관례를 확인해 명시적 변환을 제공합니다. 각 담당은 `/10`, `*10`이나 중심 보정을 여러 위치에 넣지 않습니다.

## 3. 데이터 흐름과 소유권

| 경계 | 입력/출력 내용 | 계산 소유자 |
|---|---|---|
| 상태 | 전역 치수, 제품군, 마감, 구획별 편집, 초기 preset/필요 seed | 리더 |
| `FurniturePanelView` | 현재 값·선택지·순서·단위·범위·step·visible·enabled·이유·선택 구획 ID | 리더가 상태에서 계산; UI는 렌더 |
| `FurnitureEditIntent` | 사용자의 변경 의도와 대상 구획/제어 ID; 저장 상태 직접 patch 금지 | Claude-1이 발생, 리더가 검증/적용 |
| `FurnitureGeometryResult` | 안정 ID의 판재·개구부·문/서랍·하드웨어 instance와 진단 | 리더 |
| `FurnitureHardwareInstance` | 부품 kind, 규격 ID, 치수, anchorMm, rotationRad, 재질 참조, 지지 판재 ID | 리더가 배치, Claude-2가 형상 표현 |
| 비교 입력 | 원본 관찰과 Befun 결과를 동일 단위로 정규화하되 분리 보존 | Codex-보조 |

위 이름은 공유 경계 이름입니다. 세부 union/interface 필드는 리더가 타입 파일에 게시합니다. UI는 순서를 임의 정렬하지 않고 받은 순서를 유지합니다. 메시 컴포넌트는 store를 직접 읽거나 발 개수를 계산하지 않습니다. 검증 도구는 제품 상태를 수정하지 않습니다.

`FurnitureEditIntent`는 최소 세 종류를 구분합니다: 전역 제어 변경, 특정 `sectionId`의 제어 변경, preset 적용. 구획은 배열 index 대신 안정 ID로 구분합니다. UI 선택 구획/패널 탭/문 열림 애니메이션은 가구 설계 상태와 분리합니다.

## 4. 상태 전이의 단일 소유

- preset 적용은 가구·재질·문/서랍 상태를 함께 검증해 교체합니다. 이전 제품의 hardware가 남지 않도록 리더가 처리합니다.
- 구획 삭제/재배치 시 orphan hardware 처리, 구획 ID 유지 규칙, 전환 후 선택 상태를 중앙에서 정의합니다.
- 옷장 `높이+ → Standard`의 238→237, 전면 개방 시 문방향 UI 숨김은 관찰 사례가 있습니다. 옵션이 숨을 때 저장값까지 지워지는지는 별도 미확인입니다. 임의 삭제하지 않습니다.
- UI slider min/max가 있다고 step=1이라고 추정하지 않습니다. 확인되지 않은 step은 null/미확인으로 기록하고 근거 없는 간격을 확정하지 않습니다.
- 모든 범위/자동 보정은 제품군·선택 상태별 규칙으로 계산합니다. UI와 생성기에서 각각 clamp하지 않습니다.
- 저장/공유는 mesh나 THREE 객체를 포함하지 않는 직렬화 가능한 데이터만 사용합니다. 구 저장 데이터의 category 누락을 사실상 Bookcase였다고 덮어쓰지 않습니다.

## 5. 근거와 품질 상태

- `unverified`: 근거/구현 미확인, `observed`: 원본 관찰 확보, `validated`: 정의된 검증을 통과. 상태는 기능·사례별로 부여합니다.
- null은 미측정/미확인입니다. 0, 빈 배열, false로 대체하지 않습니다. 검증 결과는 pass/fail/unknown/not-applicable을 구분합니다.
- 참고 수치의 출처를 사례 ID와 연결합니다. 기존 수치표는 fixture 전용 또는 clean-room이라고 설명하지 않습니다. 출처 문서의 사실관계를 유지합니다.
- 캡처의 `loading-preview-only`는 시각 비교 불가입니다. API 응답의 선취득 타입은 활성 preset 타입과 구분합니다.
- 외경/내경/판 중심/표시 치수의 의미와 정확도를 따로 기록합니다. 오차 허용치는 측정 근거를 붙여야 하며 통과시키려고 임의 확대하지 않습니다.

## 6. 일관성 검사와 계약 변경

통합 전 같은 사례에서 패널 표시값, 상태값, 생성 결과, 치수 표시, 저장 복구, CNC/조립 부품이 동일한 구조를 가리키는지 확인합니다. 3D만 맞고 분해도에서 통판이 남는 결과는 완료가 아닙니다.

계약 변경 요청은 각 handoff에 `요청 ID / 문제 사례 / 현재 계약 / 제안 / 영향 파일·담당 / 호환·검증 계획`으로 적습니다. 리더가 합의 내용을 이 파일에 기록하고 타입·어댑터·사용처를 함께 갱신합니다. 과거 계약에 맞춘 코드를 조용히 덮어쓰지 않습니다.

| 버전 | 변경 | 상태 |
|---|---|---|
| R1.1 | 11개 category, 분류 축 분리, 신규 mm 경계/기존 cm 어댑터, 구획 ID, UI 의도/기하 결과/하드웨어 경계 | 문서 계약 게시; 공통 TypeScript 구현 대기 |

## R1.2 — 다섯 번째 담당과 경계 정정

- Codex 쇼핑몰 연결 담당은 기존 storefront의 카테고리 선택·상품·저장 목록·공유 진입 UI를 소유합니다. 공통 state/serialize/applyPreset 함수를 호출하며 자체 생성 공식을 만들지 않습니다.
- Claude UI 담당은 컨피규레이터 우측 옵션 패널에 집중합니다. 카테고리 시작 화면을 중복 구현하지 않습니다.
- 리더는 src/types/furniture.ts, lib/sharing.ts의 공통 직렬화, stores, configurator/page.tsx, 3D/CNC 연결을 소유합니다. storefront/ConfiguratorIntro.tsx의 실제 수정 소유자는 쇼핑몰 연결 담당으로 정정합니다.
- storefront 범위 밖 공통 파일 변경은 연결 요청으로 인계합니다. shared URL과 과거 데이터의 호환 정책은 리더의 공통 함수로 유지합니다.
- R1.2는 R1.1의 단위·좌표·상태·검증 기준을 유지하고 인원과 파일 소유권만 상세화합니다. 실제 세션 대응은 README 식별표가 기준이며 수신 여부는 각 handoff에 기록합니다.

## R1.3 — UI 경계의 실제 TypeScript 게시 / 2026-10-13 23:16 이후

- 실제 import: `import type { FurniturePanelView, FurnitureEditIntent } from '@/types/furniture'`.
- UI-01/UI-07 수용: 컨트롤 8종(slider/choice/swatch/heightMode/action/notice/layout/stepper), displayValue/numberInput, 이미지 선택지, tabs/steps/single, heading, target/sectionId를 기존 preview 정의와 호환되게 게시했다.
- UI 담당 수정: `src/components/ui/furniture-panels/types.ts`의 중복 정의를 `export type * from '@/types/furniture';`로 교체. 다른 담당의 shared 타입 역참조는 금지. 리더가 잠금 파일을 직접 덮어쓰지 않았다.
- 이 단계의 ID는 문자열이며 제품 지원/registry 확인을 대체하지 않는다. 사용자 입력은 표시 단위이고 mm 저장 상태와의 변환은 이후 리더 어댑터에서 한 번만 한다.
- `applyFurnitureIntent`, preset 적용/복구/직렬화와 FurnitureGeometryResult/FurnitureHardwareInstance의 실제 구현은 아직 없다. storefront/3D 연결 대기는 해제되지 않았다. preview fixture를 실제 설계 상태로 저장하거나 판매 preset으로 승격하지 않는다.

## 사용자 결정 추가 — 패널 접합 2종

공통 ID는 `src/types/connectors.ts`의 `PanelConnectorSystem = 'ovvo' | 'tylko-clip'`을 사용한다. OVVO의 영구형/분리형은 하위 품번 옵션이며 두 시스템을 뜻하지 않는다. 상세 역할/현재 구현/미확정은 [connector-systems.md](../../tylko-reference/connector-systems.md). 현재 optimizer 선택/로컬 저장 경계만 연결됐고 고객 설계·공유·주문 통합은 미완료다. 다리 장착 방식은 별도 속성으로 유지한다.


## R2 실행 경계 예외 — 2026-10-14

[R2 지시서](dispatch-r2.md)가 이번 작업의 기준이다. R1.3 공통 타입은 그대로이며 새 제품군 계약이 구현됐다는 뜻이 아니다.

- **R2-UI 단일 소유자: Claude UI.** `src/components/ui/furniture-panels/legacy/**`에서 기존 선반 store → FurniturePanelView 및 intent → 기존 공개 setter의 좁은 어댑터를 구현한다. 입구는 `LegacyShelfPanel`. 기존 cm 값을 표시 cm로 연결하며 mm 신규 설계 저장 경계를 만들지 않는다. 공통 타입/store/운영 page는 리더 소유 유지. 기존 ‘모든 어댑터는 리더’ 규칙에서 이 경로만 예외다.
  - 구현 게시(Claude UI, 2026-10-14):
    - import: `import { LegacyShelfPanel } from '@/components/ui/furniture-panels'`. 순수 함수는 `furniture-panels/legacy/legacyShelfAdapter.ts`의 `buildLegacyShelfView`·`applyLegacyShelfIntent`.
    - 컨트롤과 호출 setter: controlId `style`·`density`·`width`·`height`(행 수 1–10)·`depth`(24/32/40)·`backPanel`(on/off), global만 허용. 각각 `setStyle`·`setDensity`·`setWidth`·`setHeight`·`setDepth`·`setHasBackPanel`만 호출한다.
    - 단위는 store cm 그대로 표시 cm이며 변환하지 않는다.
    - 거절: 그 밖의 intent, 구획 대상, 비유한수, 선택지 밖 값은 아무 setter도 호출하지 않는다.
- **R2-SAVE 단일 소유자: Codex storefront.** `src/lib/db.ts`, `src/app/api/designs/route.ts`, `src/app/api/designs/[code]/route.ts`의 adapter 구성/미설정 실패 처리만 위임한다. 리더는 동시에 수정하지 않는다. 공통 직렬화·DB schema·env·주문/결제/인증 정책은 위임 대상이 아니다.
- **OVVO 모델 단일 소유자: Claude 하드웨어.** 신규 `src/components/three/furniture-hardware/ovvo/**`와 mm 접합 좌표 계약을 소유한다. Codex 조립 담당은 이 모델을 소비하고 조립 화면/시퀀스만 수정한다. 계약 게시 전 양쪽이 임의로 별도 최종 치수표를 만들지 않는다.
- 공통 새 상태/registry/옷장 생성/실제 3D·CNC/고객 설계 접합 저장은 리더 소유 유지. 미측정 제조 규격은 이번 배정으로 확정되지 않는다.


## R2.1 — 실제 소스 확인 후 실행 경계 정정

R2 예외 중 다음 항목을 정정한다. 실제 구현 완료 선언이 아니라 이번 작업자가 구현할 계약이다. 상세는 assignments/00~05 개별 지시서를 따른다.

1. UI의 높이는 setHeight 직접 호출이 아니다. DimensionPanel의 기존 행 수 handler를 legacy/actions.ts로 추출하여 기존/새 UI가 같이 호출한다. `setLegacyRowCount`, `setLegacyStyle`, `applyLegacyShelfIntent`는 이번 신규 공개 함수 이름이다. 지정 rowHeights/numRows/height 세 필드에 대한 원자적 setState와 reconcileHardware만 허용하며 전체 store 덮어쓰기는 금지한다. StyleSelector의 기존 reset 효과도 같은 함수로 공유한다. DimensionPanel/StyleSelector 두 파일은 handler 추출·호출 영역만 UI에 위임하며 기존 레이아웃/모바일 잠금은 유지한다.
2. SAVE는 db/design API뿐 아니라 ProductConfigurator.saveDesign/결과 안내와 share/[code]/page.tsx의 fetch 오류/재시도 부분까지 소유한다. 공유 page는 SAVE가 이번 파일 작업을 끝내고 해제한 뒤 리더가 정상 복구를 수정한다. 두 사람이 동시에 파일을 편집하지 않는다.
3. API 오류: 400 INVALID_DESIGN, 401 AUTH_REQUIRED, 503 DESIGN_STORAGE_UNAVAILABLE, 500 DESIGN_STORAGE_FAILED, 404 DESIGN_NOT_FOUND. 기존 error 문구 필드는 유지하고 code를 추가한다. 정상200응답·익명POST 허용·목록 인증 정책은 보존한다. 실제 DB 미설정과 잘못된 config의 우선순위/브라우저 fallback은 03-storefront 지시서에 따른다.
4. HW 모듈은 ovvo/index.ts를 실제 소비 입구로 게시하고 PH/RH/PC/RC별 원점·축·최종 변환·근거 상태를 전달한다. ASM은 GuideScene의 임의 모델을 이 구현으로 교체한다. MM 제조 규격은 시각 모델의 추정치와 분리한다.
5. 설계별 접합 저장 및 옷장 계약은 리더 CORE-01/03의 실제 타입/모듈 게시가 선행한다. R2.1 문서가 있다고 그 구현이 존재하는 것으로 취급하지 않는다.
