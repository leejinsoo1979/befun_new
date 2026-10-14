# Claude-2 / R1-VISUAL 진행·인계

기준: [5인 개발 계획](../development/furniture-parity/README.md), [공통 계약 R1.2](../development/furniture-parity/contracts.md).

## 착수

- 실제 세션명: claude-graphics (Claude Code CLI, 사용자 화면 왼쪽 첫 번째 Claude)
- 수신/착수 시각: 2026-10-13 21:38 수신·착수
- 상태: 착수 — 1단계 부품 조사 중
- 적용 계약 버전: R1.2 (문서 계약; 공통 타입 구현 전)
- 수정/잠금 파일: 신규 `src/components/three/furniture-hardware/**`, 이 문서, 기존 본인 `src/lib/three/materials.ts`. 읽기 전용 확인: LevelingFeet.tsx, reference-feet.ts, hardware.ts, reference-hardware.ts, Shelf.tsx, Scene/Effects/카메라

## R4-HW — CSG 성능 마감 + 책상 외형 원인 측정 (2026-10-14 12:19)

수정 허용 범위: `lib/three/blum/geometry.ts`, `useBoredBox.ts`, Panel/Door 훅 연결부, materials.ts, 본인 hardware·문서. 루트 씬·카메라·광원·배치/생성기 미수정.

### 1. CSG 성능 개선 마감
| 사례 | 입력 | 기대 | 실제 | 판정 | 증거 |
|---|---|---|---|---|---|
| R4-CSG-01 재정렬 정확도 | Blum 문(57.6×27.4×1.6, 구멍 6) / 옆판(1.8×28×32, 마운트 구멍) | 삼각형 집합·면 재질 번호 불변, 그룹 ≤6 | 문 그룹 363→6(삼각형 2,050 동일), 옆판 92→6(672 동일), 모든 삼각형이 원래 면 번호 그룹에 속함 | pass | `lib/three/blum/geometry.r4.test.mjs` |
| R4-CSG-02 구멍 깊이 회귀 | 같은 판 | 컵 바닥 z=0.5, 옆판 고정공 x=0.25 | 동일 | pass | 같은 검사 + 기존 `boring.test.mjs` 6/6 |
| R4-CSG-03 캐시 | 같은 치수·구멍 2회 | 복제본 반환, 복제본 dispose가 캐시 무손상 | 통과, 구멍 없으면 BoxGeometry | pass | 같은 검사 |
| R4-CSG-04 빠른 변경 마지막 상태 | jsdom+React 19, 폭 12회 15ms 간격 변경, 지연 120ms | 드래그 중 상자, 멈춘 뒤 **마지막 폭**의 구멍, 이전 작업 덮어쓰기 없음 | 12회 변경 → geometry 13개, CSG 1회(마지막), 최종 bbox = 마지막 폭+offset | pass | 같은 검사 |
| R4-CSG-05 생성/해제 | 위 + unmount | 훅 소유 geometry 전부 dispose | 13/13 dispose, 캐시 원본은 LRU(64) 소유 | pass | 같은 검사 |
| R4-CSG-06 실제 화면 | 3003 `/furniture/bookcase-brown` (Grid 120×183×32, Natural 월넛, 문 2), headless Chrome 1440×900 DPR1, **AC 전원** | 드래그 후 구멍 복귀·그룹 ≤6 | 드래그 종료 0.8s 후 구멍 판 4개(삼각형 1341/1345), 최대 그룹 6. idle 60fps·draw 1,391/frame(이전 2,975), 드래그 p50 33ms(이전 150~216ms, 배터리 측정분 제외) | pass | perf 측정 로그(이 절) |
| R4-CSG-07 문 개폐·사용자 타공 | Door 회전 로직 미변경, desk-cable-geometry는 createBoredBox 출력 위에 추가 CSG | 개폐·케이블 구멍 유지 | Door.tsx는 geometry 생성 줄만 교체. desk cable-render 5/5, cable 1120/1120, structure 3513/3513 통과 | pass(개폐는 코드 대조, 브라우저 개폐 반복은 미실행) | 테스트 출력 |

- `scripts/furniture-desk/panel.test.mjs`는 옷장 `edge-catalog.json` import attribute 오류로 시작 전 실패 — 이번 변경과 무관(옷장 담당).
- 남은 드래그 비용: decor RoundedBoxGeometry 재생성(소품 담당), 판·재질 재생성에 따른 힙 증가.
- 리더 요청 **R4-REQ-01**: `lib/furniture/desk-cable-geometry.ts`의 `restoreFaceGroups`도 연속 구간 그룹이라 케이블 구멍 판이 수백 그룹이 됨 → `import { regroupByFace } from '../three/blum/geometry'` 후 `restoreFaceGroups(g)`를 `regroupByFace(g)`로 교체(형상 불변, 같은 면 판정).

### 2. 책상 합판 엣지 "거친 줄무늬" 원인
- 측정: `/reference-product/desk-3`(Classic Black 160×73×50) vs 원본 `screenshots/desk-catalog-003-reference.png`.
- **material(색·대비) 아님**: 엣지 픽셀(따뜻한 색만) 평균 우리 #c7b39c / 원본 #c7b9a1, 밝기 표준편차 28.6 / 32.8. 원본 hex(`REFERENCE_CLASSIC_COLORS`, edge 텍스처) 유지 — materials.ts 수정 없음.
- **판재 face mapping 아님**: desk-3 판 23개 전부 두께축이 createFaceMaterials 가정(가로 y, 세로 x, 뒷판 z)과 일치.
- **원인 = 보강 빔 재질 매핑**: 픽셀 피킹으로 legroom 상판 아래 줄을 `geometry.beams` 빔(77.3×3×2 cm, `matType: 'horizontalBase'`)으로 확인. DeskModel이 이를 `Panel`로 그려 3cm 앞면에 합판 엣지 텍스처가 1.67배 늘어 붙음 → 상판 엣지 아래 두 번째 점선 줄무늬. 원본 캡처에는 이 줄이 없음.
- 증거: [desk-3 전](claude-2-hardware-assets/r4-desk/before-desk-3-zoom.png) / [빔만 base 재질로 바꾼 시뮬레이션](claude-2-hardware-assets/r4-desk/sim-after-desk-3-zoom.png), desk-1 동일(`before-desk-1-zoom.png`, `sim-after-desk-1-zoom.png`). 시뮬레이션은 브라우저 런타임에서 빔 재질만 교체 — 소스 미변경.
- 리더 요청 **R4-REQ-02 (DeskModel.tsx)**: 빔을 엣지 텍스처 없는 단일 base 재질로.
  ```tsx
  {geometry.beams.map((beam, index) => <mesh key={`beam-${index}`} position={[beam.x, beam.y, beam.z]} material={materials.horizontalBase} castShadow receiveShadow>
    <boxGeometry args={[beam.w, beam.h, beam.d]} /></mesh>)}
  ```
  빔의 원본 재질 값은 source fixture에 없음(형상만) → 원본 캡처 근거의 표시 선택이며 제조 재질 확정 아님.

### 3. 다리·경첩·서랍 레일 차이 (같은 시점·크기 캡처: before-desk-1/3.png)
| 부품 ID | 우리 | 원본 캡처 | 판정 |
|---|---|---|---|
| `short_leg` (ShortLeg, DeskModel feet) | 판 아래 검은 발 보임, 22.5mm 모델을 source −20..0mm 위치에 그대로 | 같은 시점에서 발 보이지 않음 | 차이 기록. 높이·노출은 사진 비례로 확정 안 함(기존 exactParity:false) |
| Blum 경첩 컵·플레이트 (BlumPlate) | 닫힌 정면 시점에서 안 보임 | 안 보임 | 이 시점 비교 불가 → 문 열림 시점 원본 캡처 필요 |
| Movento 서랍 레일 | 닫힌 시점 안 보임 | 안 보임 | 같음 |

### 4. 함께 처리한 사용자 직접 지시 (기록)
- Classic 다리 색상에 "패널 색상"(`legFinish: 'panel'`) 추가: furniture-base 타입, store setter, leg-material 시그니처, FurnitureLegs(Classic이면 패널 재질, Natural이면 silver로 표시), FeetSelector(Classic에서만 버튼), savedDesign 검증·sharing 타입. lint 0 / tsc 내 범위 0. 브라우저 확인은 미실행.
- 백패널 기본 OFF(configuration.ts, catalog.ts), 상품 상단 제목·하트 제거, 내부 페이지 헤더 여백.

### 검증 / 지문
- lint: blum/**, Panel.tsx, Door.tsx 오류 0. 테스트: geometry.r4 5/5, boring 6/6, desk cable-render 5, cable 1120, structure 3513.
- 수정 파일: `src/lib/three/blum/geometry.ts`, `src/lib/three/blum/useBoredBox.ts`(신규), `src/lib/three/blum/geometry.r4.test.mjs`(신규), `src/components/three/Panel.tsx`·`Door.tsx`(훅 연결 줄만).

**R4-HW-READY** — 12:19. 남은 항목: R4-REQ-01/02 리더 반영, 소품 재생성 비용, 문 열림 시점 원본 캡처.

## R3-HW — 원본 장다리·체결부 공용 표시 계약 (assignments/r3/01-hardware.md)

- 수신·착수: 2026-10-14 08:06. 실제 세션 `claude-graphics` (Claude Code CLI, 왼쪽1). dispatch-r3.md · AGENTS.md · CLAUDE.md · team-tasks 잠금 확인.
- 잠금(본인): `src/components/three/furniture-hardware/**` (이번 착수 파일: `specs/observedHardware.ts`, 신규 `legs/**`), 이 문서, `docs/handoffs/claude-2-hardware-assets/r3-legs/**`.
- 읽기 전용: `public/models/furniture/long-leg.glb`(덮어쓰기 금지), FurnitureLegs.tsx, furniture-base.ts, Shelf.tsx, materials.ts(재질/조명 수정 없음), assembly-guide/**, stores/**, CNC.
- 독립 단계 순서: HW-01~04 먼저(리더/CNC/DB 대기 없음), HW-05는 ASM 연결 후.
- R2.1 OVVO 결과·증거는 보존(재작업 없음). 미결: 앞서 사용자 지시로 바꾼 GuideScene 그림자 3속성 — 사용자 결정 대기(아래 R2.1 절 참고).

### R3-HW 조사 결과 — 원본 long-leg.glb (08:13)

- 자산 sha256 `ce1bd336615c…` 17,392 B, Blender glTF I/O 1.8.19. **변경 없음**(테스트가 매번 해시 확인).
- 구성: scene → 노드 1개 `long_leg` → 메시 1개 `leg_s_plus` → 프리미티브 1개. 머티리얼·텍스처·스킨·애니메이션 없음. 위치 용접 시 **연결 성분 1개** → 몸통과 장착판은 노드로 분리할 수 없는 **rigid 메시**.
- 형상(메시 단위, ×1.0322 = mm): y 0..98 = 반경 8 **곧은 원통 몸통**(높이별 단면 중심이 축 위, 최대 편차 0.23). y 98..108 = **둥근 모서리 사각 장착판**(몸통은 판의 한 모서리), 윗판 3.5, 접힌 테두리 98..104.5. 몸통 윗면 축에 얕은 원형 오목(반경 5.8, 용도 미확인).
- **나사 3개·중앙 잠금핀·키홀 구멍 형상은 GLB에 없음.** 장착판 윗면은 막힌 면 → 고정 부품은 자산 밖.
- 정정: `observedHardware.ts` long_leg note의 "사선 다리"를 곧은 원통 + 장착판으로 고침. bounds·135°·scale 값은 그대로.

### LEG-VISUAL-READY — 2026-10-14 08:13 (조립 codex-assembly · 리더 소비용)

```ts
import { LongLeg } from '@/components/three/furniture-hardware/legs/LongLeg';
import { LONG_LEG_PARTS, LONG_LEG_UNKNOWN, LONG_LEG_GEOMETRY_MM, longLegHeight } from '@/components/three/furniture-hardware/legs/longLegContract';
// 같은 심볼은 '@/components/three/furniture-hardware'에서도 export. ('…/legs'는 기존 legs.tsx로 해석되므로 파일 경로까지 쓸 것)

// 조립 안내(mm 장면): 다리+장착판 전체를 하나로 이동 (분리 = 판재와 평행 슬라이드 후 이탈)
<group position={[x, y, z]} rotation={[0, yaw, 0]}><LongLeg unit="mm" material={legMat} /></group>
// 가구(cm 장면)
<group position={anchorCm} rotation={[0, rotationY, 0]}><LongLeg unit="cm" material={legMat} /></group>
```
| 항목 | 계약 |
|---|---|
| 단위 | GLB 노드 TRS 적용 후 m. 장면 변환은 `LongLeg`의 부모 group에서 **한 번**: cm ×100, mm ×1000. 추가 스케일·비균일 늘이기 금지 |
| 원점 / 접지점 | 몸통 축 × 접지면 (y = 0) |
| 장착면 | 장착판 윗면 y = 111.48 mm (`longLegHeight('cm')` = 11.148), 법선 +Y. 리더 baseHeight 11 cm와 0.148 cm 차이 = 밑판 겹침 (늘이지 않음) |
| 기본 회전 | 원본 노드 +Y 135°(0, 0.92388, 0, 0.38268) 유지. 장착판 펼침 방향 (−√½, 0, +√½). 배치 yaw는 소비자 group |
| moving | `leg_shaft` + `mounting_plate` — 한 메시, 함께 이동 |
| fixed | `screw_1..3`, `central_pin` — **GLB 미포함** (`inAsset: false`). 그려야 하면 소비자가 별도 illustrative props로 격리, 제조 export 금지 |
| unknown | 나사·핀 중심, 나사 머리 지름, 핀 돌출, 키홀 윤곽, 슬라이드 거리, 판 구멍 배치 = `null`, `manufacturingReady: false` |
| 재질 | 주입 시 호출자 소유(dispose 책임 호출자). 생략 시 GLB 기본 재질(로더 소유) |
| geometry | `useGLTF` 캐시 소유. `clone(true)`로 공유, 언마운트 시 dispose하지 않고 떼어내기만 (`releaseLongLegInstance`) |

### R3-HW 결과

| 사례 ID | 입력·초기상태 | 조작 | 기대 | 실제 | 판정 | 증거 | 수정 파일 |
|---|---|---|---|---|---|---|---|
| R3-HW-01 | long-leg.glb 원본 | 원본/측면 2방향/어댑터 cm 렌더, 장착판 위·아래·비스듬히 확대 + 정점 검사 | 몸통 곧음, 판 회전·크기 원본 | 몸통 반경 8.000 일정·축 편차 0.23(메시), 판은 y≥98에서만, bounds = observedHardware 값, 노드 135°·scale 보존 | pass | [전체/측면/어댑터](claude-2-hardware-assets/r3-legs/r3-hw01-original-vs-adapter.png) · [장착판 확대](claude-2-hardware-assets/r3-legs/r3-hw01-plate-closeup.png) · `legs/longLeg.test.mjs` | specs/observedHardware.ts(note), legs/** |
| R3-HW-02 | cm·mm 장면 | 부모 ×100 / ×1000 1회 후 정밀 bbox | 렌더 높이 = 111.48 mm | cm 11.1478, mm 111.4777, 접지 0, 이중 변환 아님 | pass | [높이 비교](claude-2-hardware-assets/r3-legs/r3-hw02-height-cm.png) · 테스트 | — |
| R3-HW-03 | 사진 4장·사례 002·GLB | fixed/moving 분류, 자산 포함 여부 검사 | 목록·unknown 분리, 실제 import 경로 | 위 READY 표. 나사·핀 GLB 미포함 확인 | pass | 테스트 4항목 · 이 절 | legs/longLegContract.ts |
| R3-HW-04 | 같은 로더 scene | 주입 재질로 200회 생성·해제, dispose 이벤트 감시 | 공유 geometry/material dispose 0 | dispose 0, 자식 누수 0, 원본 scene 재질 불변 | pass (순수 함수 기준. R3F 실제 마운트 반복은 ASM 연결 후 브라우저 확인) | 테스트 2항목 | legs/longLegInstance.ts, LongLeg.tsx |
| R3-HW-05 | ASM 연결 | 같은 앵커·회전·단위 사용 대조 | — | ASM 미연결 | blocked (LEG-GUIDE-READY 대기) | — | — |

**참고 — 리더 FurnitureLegs.tsx(읽기 전용)와의 일치**: `scene.clone(true)` + 부모 `scale={100}` 1회 + `dispose={null}` + 재질 주입 → 이 계약과 같은 방식. 수정 요청 없음. 리더가 원하면 `<LongLeg unit="cm" material={legMaterial} />`로 대체 가능(동작 동일).

**기존 단품 운영 연결 미완료 표**
| 단품 | 구현 | 레퍼런스 일치 | 운영 연결 | 제조 치수 | 남은 항목 |
|---|---|---|---|---|---|
| ShortLeg (short_leg) | ✅ 선반 프로파일 | bounds Ø16×22.5 일치 | ❌ 사용처 0 (LevelingFeet.tsx 그대로) | 미확정 | HW-REQ-01: 노출 높이·판 매입 깊이 근거 필요. 장다리 값으로 대체 안 함 |
| PlaneLeg (plane_leg) | ✅ | bounds Ø15×30 일치 | ❌ 사용처 0 | 미확정 | HW-REQ-02: 어떤 옵션이 이 다리를 쓰는지 사례 확정 |
| FullHeightHandle30 | ✅ 단면 압출 | 단면 윤곽 관찰값 | ❌ 사용처 0 (Door.tsx는 handle_drawer_unit.glb 늘려 씀) | 미확정 | HW-REQ-03: 문 두께 19 vs 채널 16.7 관계 근거 필요. 장다리 값으로 대체 안 함 |
| LongLeg (long_leg) | ✅ 이번 | 원본 GLB 그대로 | 리더 FurnitureLegs.tsx가 같은 방식으로 운영 연결 | 나사·핀·키홀 unknown | ASM 연결(R3-HW-05) |

**검증 (08:13 기준, 과거 결과 아님)**
- 테스트: legs / handles / clip / ovvo / ovvo.r21 / **longLeg** 6종 통과.
- `npx eslint src/components/three/furniture-hardware` 오류 0. `npx tsc --noEmit` 내 범위 오류 0 (`.next/dev/types/validator.ts` 2건만 남음, 생성 파일).
- 격리 build: `/private/tmp/befun-r3-hw-build-bVQM`(rsync 사본, 공용 .next 미사용) `next build --webpack` **exit 0** (08:11 시작). 같은 시점 작업 트리의 다른 담당 변경도 함께 빌드된 결과.
- fingerprint(sha256 앞 16): long-leg.glb `ce1bd336615cba18`, LongLeg.tsx `f2df692aff2b9ce2`, longLegInstance.ts `195865dd33ccd383`, longLegContract.ts `bb1a3386d04cbbbe`, observedHardware.ts `807389eac3a93cd4`.
- 캡처 재생성: `node src/components/three/furniture-hardware/legs/preview/capture.mjs <outDir> <tmpDir>` (tmpDir 127.0.0.1:8767 정적 서빙).
- 남은 항목: R3-HW-05(ASM 연결 후), R3F 실제 반복 마운트 브라우저 확인(ASM/리더 화면에서). 잠금 유지: `furniture-hardware/**`, 이 문서, `r3-legs/**`.

## R2.1-HW — OVVO 부품 교정 + 조립 화면 연결 (assignments/01-hardware.md)

- 수신·착수: 2026-10-14 06:26. AGENTS.md / CLAUDE.md / team-tasks.md 확인.
- 잠금(본인): `src/components/three/furniture-hardware/ovvo/**`, `furniture-hardware/index.ts`, 이 문서, `docs/handoffs/claude-2-hardware-assets/r2-ovvo/**`.
- 읽기 전용: GuideScene/sequence/ovvoMotion, optimizer ovvo.ts·apply.ts·panelGeometry.ts, Shelf, stores, 공통 타입.
- 자료 실제 파일명: `docs/tylko-reference/sources/ovvo-audit-001-v1230p-instructions.pdf`, `…-v1230r-instructions.pdf`, `…-v1230r-spec.pdf`, `screenshots/ovvo-audit-001-p.png / -r.png / -spec.png`.

### HW-CONTRACT-READY — 2026-10-14 (claude-graphics) · 조립(왼쪽5 codex-assembly) 소비용

**import 입구**
```ts
import { OvvoPH, OvvoRH, OvvoPC, OvvoRC, guideMounts } from '@/components/three/furniture-hardware/ovvo';
// 같은 심볼은 '@/components/three/furniture-hardware'에서도 export (guideMounts·SLOT_TO_GUIDE_* 포함)
```
| 심볼 | 시그니처 | 비고 |
|---|---|---|
| `OvvoPH/RH/PC/RC` | `({ material }: { material: THREE.Material }) => JSX` | 각자 `useMemo(() => xxGeometry())`로 **새 geometry 생성·unmount 시 dispose**. material은 **주입·소유권 호출자**(부품이 dispose하지 않음) |
| `phGeometry/rhGeometry/pcGeometry/rcGeometry()` | `() => THREE.BufferGeometry` | 호출마다 독립 버퍼. 직접 쓰면 호출자가 dispose |
| `guideMounts(model, phase, centerZ, approachGapMm=15, faceY=0)` | `→ { baseHousing, endHousing, connector }: GuideMount` | `GuideMount = { position:[x,y,z] (mm), quaternion:[x,y,z,w] }` |
| `panelAPose(model, phase, gap=15)` | `→ { position, rotation:[π,0,0] }` (J 기준) | `'P': 'separated'\|'pressed'`, `'R': 'aligned'\|'inserted'\|'locked'` |
| `slotPointToGuide / guidePointToSlot` | `([x,y,z], centerZ, faceY=0)` | S ↔ 장면 점 변환 |
| `checkRTongueEngagement(±1)`, `connectorInsideBothSlots`, `maxRadialExcess` | 검사용 | QA·조립 공용 |

**단위·원점·축** — 단위 **mm**, GuideScene(1 unit = 1 mm)에 **추가 스케일 금지**(HW-03 테스트로 확인).
- 홈 좌표 S: 원점 = 홈 장축 중앙 × 판 표면, +Z = 판 바깥 법선, +X = 홈 장축, +Y = Z×X. 오른손계.
- 접합 J = **아래 판 B**의 S(P: PH / R: RH 있는 판). 위쪽 판 A = J에서 X축 π + 이동 (ovvoContract.ts 명명).
- S → GuideScene: X_S→+Z, Y_S→+X, Z_S→+Y. 행렬(행=장면 x,y,z) `[[0,1,0],[0,0,1],[1,0,0]]`, det +1. 쿼터니언 `(−0.5, −0.5, −0.5, 0.5)`.
- 판 A 쪽 하우징 = `quatMul(Q, (1,0,0,0))` → 열림 방향 장면 −Y. **주의**: 기존 GuideScene는 끝쪽 하우징을 장면 X축 π로 뒤집음. 이 계약은 장면 Z축(=X_S) π — PH 포크 방향이 반대가 되므로 계약 값 사용 요청.

**최종 체결 변환 (centerZ = jointExample.centers[i], faceY = 0)**
| 모델·단계 | baseHousing | connector / endHousing 위치 |
|---|---|---|
| P separated | (0,0,c) | (0, gap, c) |
| P pressed | (0,0,c) | (0, 0, c) — 앵커 일치 |
| R aligned | (0,0,c) | (0, gap, c+15) |
| R inserted | (0,0,c) | (0, 0, c+15) |
| R locked | (0,0,c) | (0, 0, c) — 앵커 일치, 체결 이동 = 장면 −Z |

**출처 상태**
| 항목 | 상태 |
|---|---|
| 홈 30 × 9.4, 깊이 12.5 ±0.5, 커터 이동 20.5–20.7, 판 ≥ 15, 간격 A/B | **공급사 도면값** (ovvo-audit-001 PDF) |
| 해제 이동 15 | **도면 표기(해제)**. 조립 삽입→체결 거리로 쓰는 것은 **추정(inferred)** — 조립 거리 공식 표기 없음. `assemblySlideMm`에 넣을 때 status `inferred` 표기 필요, 관찰값 아님 |
| PH 포크·RC L자·RH 립/창 위상(topology), 부품 순서·방향 | **PDF 분해도 관찰** (HW-01 캡처) |
| 부품 단면 층 높이·두께·혀/립/창 치수·바브 | **설명용 근사** `OVVO_ILLUSTRATIVE.status = 'illustrative'` — CNC/BOM 금지 |
| 홈 언더컷 내부 윤곽, 압입 간섭량, 공급사 CAD 형상 | **미측정** (`undercutProfile: null`) |

### R2.1-HW 증거 (HW-01~05)
| ID | 증거 | 결과 |
|---|---|---|
| HW-01 | [P](claude-2-hardware-assets/r2-ovvo/hw01-P-pdf-vs-model.png) · [R](claude-2-hardware-assets/r2-ovvo/hw01-R-pdf-vs-model.png) — 공식 PDF 분해도와 같은 방향(위 PH 뒤집힘 → 커넥터 → 아래 하우징), 확정/추정/미확정 색 표기 | 순서·방향·위상 일치(포크 열림 −X, RC 혀 −X 치우친 L자). 단면 비례는 설명용이라 PDF와 다름(PC 높이 등) — 형상 일치 주장 아님 |
| HW-02 | [교정 전/후 같은 단면](claude-2-hardware-assets/r2-ovvo/hw02-endcap-before-after.png) (z_S = −0.5 수평 단면, 같은 카메라) + `ovvo.r21.test.mjs` | 기존 GuideScene 끝캡 **1.105 mm 침범 재현** → 교정 PH −0.100 / RH −0.200 mm (외곽 안). 언더컷은 미확정 |
| HW-03 | `ovvo.r21.test.mjs` HW-03 6항목 + **실제 GuideScene 연결 확인 (06:48 반영본)** | det +1, 쿼터니언=행렬, mm 무스케일, R inserted +15 (장면 +Z), 판 A 하우징 법선 −Y, locked 앵커 공유. 연결 코드 대조: `GuideScene.tsx:131` 장착 변환은 settled 단계(`pressed`/`locked`) `guideMounts`만 사용 → 이동은 판 그룹 `position(0, panelGap, panelSlide)` **한 번만 적용**(이중 적용 없음). `ovvoMounts.ts`의 R 이동 = guideMounts(inserted−locked).z = +15, status `inferred` 표기. 판 A 하우징은 계약 쿼터니언(Z축 π) 그대로 사용 — 기존 X축 π 제거 확인. 화면: [R 06 삽입](claude-2-hardware-assets/r2-ovvo/hw03-guide-R-insert.png) · [R 08 완료](claude-2-hardware-assets/r2-ovvo/hw03-guide-R-final.png) · [P 07 완료](claude-2-hardware-assets/r2-ovvo/hw03-guide-P-final.png). 조립 검사 `node --test src/lib/assembly-guide/*.test.mjs` 24/24 통과 |
| HW-04 | `ovvo.r21.test.mjs` HW-04 4항목 | RC 정방향 통과 / 장축 반대(Z π) 거부: "locked tongue not under lip region, inserted tongue does not fit the window" + 홈 외곽 이탈. PC 대칭이라 양방향 통과(P는 방향 요구 없음) |
| HW-05 | `ovvo.r21.test.mjs` HW-05 3항목 + 브라우저 | 팩토리 독립 버퍼·dispose 격리·40회 정점 수 고정(PH 1248, RH 2100, PC 3936, RC 3936). 브라우저(headless Chrome, localhost:3003/assembly-guide?topic=connector): P↔R 6회 전환 + 마지막 단계 이동 중 **콘솔 error/warning/예외 0건**, 캔버스 유지(1150×601). 재질은 GuideScene 소유·unmount 시 dispose, geometry는 부품 소유 — 계약대로 |

**부품별 상태**
| 부품 | 구현 | 자료 일치 확인 | 미확정 | 단품 완료 | GuideScene 연결 확인 |
|---|---|---|---|---|---|
| PH | ✅ 포크 스택 | 위상·방향 (HW-01), 홈 외곽 안 (HW-02) | 단면 치수, 언더컷 | ✅ | ✅ 06:48 연결 확인 |
| RH | ✅ 립·창·바닥 | 위상 (HW-01), 홈 외곽 안 (HW-02) | 립/창 길이 | ✅ | ✅ 06:48 연결 확인 |
| PC | ✅ 대칭 | 대칭·누름 체결 (HW-04) | 단면 치수 | ✅ | ✅ 06:48 연결 확인 |
| RC | ✅ L자 비대칭 | 방향 판정 (HW-04) | 혀 길이·위치, 바브 | ✅ | ✅ 06:48 연결 확인 |

**참고(조립 담당 파일, 수정 안 함)**: R 06 삽입 근접 화면에서 받침판 위 그림자 계단 무늬(shadow acne)가 보임 — `GuideScene` 그림자 bias 조정 여지.

**검증 실행 (2026-10-14)** — `node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs <test>`:
legs / handles / clip / ovvo / ovvo.r21 → 5종 모두 통과. `npx eslint src/components/three/furniture-hardware` 통과. `npx tsc --noEmit`: furniture-hardware 오류 0. 전체 4건은 `.next/dev/types/validator.ts` 2건 + `GuideScene.tsx:158` 2건(조립 담당 파일, 수정 안 함).
캡처 재생성: `ovvo/preview/r21-capture.mjs <outDir> <tmpDir> <pdfDir>` (tmpDir 127.0.0.1:8766 정적 서빙).

## R2-HW — OVVO V-1230P/R 단품 형상 교정

- R2 ID: R2-HW / 세션: claude-graphics(Claude Code CLI, 왼쪽1) / 수신·착수: 2026-10-14 06:20 / 상태: **검증 대기**(단품 범위 완료, 실제 연결·CAD 일치 미검증)
- 소유(신규): `src/components/three/furniture-hardware/ovvo/**`, 공용 `furniture-hardware/index.ts` export. Tylko 클립 단품은 유지.
- 근거: ovvo-implementation-audit.md, cases/ovvo-audit-001.json, sources/ovvo-audit-001-*.pdf(P 설치도·R 설치도·R 사양서) 고해상도 렌더로 직접 판독.
- 금지 범위 준수: Shelf/배치/CNC/GuideScene 미수정.

### R2-HW 좌표 계약 (조립 담당이 그대로 소비) — `ovvo/ovvoContract.ts`

- **단위:** mm. 회전은 radian.
- **홈 좌표 S (판마다 하나, 장착 포켓 기준):**
  - 원점 = 홈 장축 중앙이 판 표면(접합면)과 만나는 점
  - +Z = 판 바깥 법선(상대 판 쪽). 홈은 z ∈ [−12.5, 0]
  - +X = 홈 장축(커터 이동 방향). 커터 중심 x = ±10.3
  - +Y = Z×X
  - 하우징 PH/RH는 S에서 단위 변환으로 착좌(윗면 z=0, 장축 중앙).
- **접합 좌표 J** = 아래쪽 판 B의 S. P에서는 PH가 있는 판, R에서는 RH가 있는 판.
- **위쪽 판 A:** S_A = J 기준 X축 π 회전(z→−z, y→−y) 후 (dx, 0, dz) 평행이동. 커넥터(PC/RC)는 판 A와 함께 (dx, 0, dz)로 이동하며 회전은 없음(+z 절반 = A쪽).
- **P(누름):**
  - 분리 (0,0,gap) → 체결 (0,0,0)
  - 삽입축 = −Z_J
- **R(삽입·슬라이드):**
  - 정렬 (15,0,gap) → 삽입 (15,0,0) → 체결 (0,0,0)
  - 슬라이드축 = −X_J, 이동 15(도면 해제 표기)
  - 해제(도면): +X_J로 15 슬라이드 → +Z_J로 들어 올림
- **함수:** `panelAPose(model, phase, gap)`, `panelAToJoint` / `jointToPanelA`(왕복 검증됨), `insideSlotEnvelope`(홈 외곽 검사).
- **컴포넌트:** `OvvoPH` / `OvvoRH`(S 기준), `OvvoPC` / `OvvoRC`(J 기준), 설명용 `OvvoJoint({model, phase})`. 재질은 주입, geometry는 자체 dispose.
- 조립 담당은 이 함수와 컴포넌트를 import해서 GuideScene의 상자형 Housing/Connector를 교체할 것. 별도 치수표를 다시 만들지 말 것.

### R2-HW 결과

**구현 (단품, 실제 가구 미연결)** — `src/components/three/furniture-hardware/ovvo/{ovvoContract.ts, ovvoGeometry.ts, OvvoParts.tsx, ovvo.test.mjs, preview/capture.mjs}`
- **PH:** 평면 U자 포크. 두 레일이 +x 끝 둥근 다리로 연결되고 −x 끝은 열림. 단면은 입구 립 → 얇은 벽 → 바깥 바브 → 아래 V를 깊이별 판 적층(계단 근사)으로 표현.
- **PC:** 위아래 대칭 화살촉(몸통 → 바브 → 좁아짐 → 끝), 양끝 둥금.
- **RC:** L자 비대칭. 위 = PC 반쪽(전체 길이 17.2), 아래 혀 = −x로 치우친 짧은 구간(x −12.4..−3.4)이라 위쪽보다 −x로 더 나옴. 사양서 렌더의 L자 외관과 부합.
- **RH:** 바닥 있는 홈통. 입구 립은 −x 구간(−13.5..−2.0)에만 있어 개구가 좁고(±2.1, 혀 목만 통과), +x 구간(−2.0..12.0)은 넓은 창(±4.0)이라 혀 삽입 가능. 내부 통로와 바닥 포함.
- 모든 부품 평면 끝은 홈 원호(중심 ±10.3, 반경 4.7) 안에 둥글게 맞춤.

**도면 대비 확인 / 미확인**

| 항목 | 상태 |
|---|---|
| 홈 외곽 30 × 9.4, 깊이 12.5 ± 0.5, 커터 이동 20.5–20.7 | 도면값 사용 (확인) |
| P = PH+PC+PH 누름 / R = PH+RC+RH 삽입 → 슬라이드, 해제 15 | 도면 순서·표기 반영 (확인) |
| PH 평면 U자 포크, PC 대칭, RC L자 비대칭, RH 립·창 구분 | 도면·사양서 외관에서 판독 (형태 확인, 치수는 설명용) |
| 부품 단면 치수(립·벽·바브·V 반폭/깊이), RC 혀 길이·위치, RH 창/립 길이 | **미확정 — 설명용(OVVO_ILLUSTRATIVE)** |
| 홈 내부 언더컷 단면(Depth 그림의 목·걸림부) | **unknown** — 외곽 캡슐만 사용, 하우징 바브가 언더컷에 걸리는 깊이 미확정 |
| 압입 간섭량, 바브 탄성, R 잠금 걸쇠 세부 | **unknown** (내부 잠금 형상은 추정 표현) |
| 판 두께 15mm 이상, 권장 간격 P(35–80/150–350) R(35–80/100–250) | 계약 데이터에 기록 (배치는 리더) |

**감사 001/003 교정 결과**
- **OVVO-AUDIT-001(상자형 외형):** 교정용 모델을 제공함. 단 GuideScene 교체는 조립 담당 소관이라 현재 화면은 아직 그대로임. 모델 형상은 도면 외관(포크·화살촉·L자·립/창)을 따름. 단면 치수는 설명용.
- **OVVO-AUDIT-003(끝캡이 홈 원호 침범):** 이 모델에서는 해소. 하우징 PH·RH의 모든 정점이 홈 외곽 안에 있음(테스트 정점 검사). 커넥터도 P 체결, R 삽입·체결 단계에서 양쪽 판 홈 외곽 안에 있음.
- **OVVO-AUDIT-002(언더컷 가공):** 범위 밖(리더/조립). 언더컷 윤곽은 미확정이라 unknown 유지.

**검사**
- `node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs src/components/three/furniture-hardware/ovvo/ovvo.test.mjs` → pass
  - 도면 캡슐 30mm 일치
  - PH·RH 홈 외곽 정점 검사
  - 단계별 커넥터 양 판 외곽 검사
  - PC 대칭 / RC L자
  - R 혀 목 < 립 개구, 바브는 립 아래, 체결 시 립 구간, 삽입 시 창 구간
  - 단계 변환과 좌표 왕복
- 기존 legs·handles·clip 테스트 재통과. tsc·eslint(furniture-hardware) 0.
- 모든 검사는 **설명용 치수의 자기 일관성과 도면 외곽 준수**만 확인함. 실제 OVVO CAD와의 형상 일치는 검증하지 않음.

**캡처** (`docs/handoffs/claude-2-hardware-assets/`)
- P: `ovvo-P-front`, `-side`, `-section-x0`, `-before-separated`, `-after-pressed`
- R: `ovvo-R-front`, `-side`, `-section-x-8`, `-before-inserted`, `-after-locked`
- 회색 반투명은 홈 외곽(언더컷 미확정).

**다음 담당:** 조립 담당(R2-ASM) — 위 계약과 컴포넌트로 GuideScene 교체. 리더 — 실제 접합점에 S/J 배치, AUDIT-002·005 가공 판정. QA — 같은 계약으로 단계·간섭 재현.

## 2026-10-14 지시 수신 — Tylko 클립·상대 핀

- 수신·착수: 2026-10-14 00:07. terminal-instructions.md 2026-10-14 공통 지시와 '왼쪽1'.
- 읽은 근거: connector-systems.md, cases connector-clip-003(공식 PDF)/004(사용자 지정 사진)/001/002, hardware-leg-mount-001, leader-review.md VISUAL-REVIEW-001~003.
- 담당 파일(신규·잠금): `src/components/three/furniture-hardware/connectors/**`, `docs/handoffs/claude-2-hardware-assets/**`(단품 캡처). 기존 잠금 유지. Shelf/Door/배치/환경광은 수정하지 않음.

### 결과 — Tylko 클립·상대 핀 (2026-10-14 00:07~)

**구현 (단품, 미연결)** — `src/components/three/furniture-hardware/connectors/`
- `clipContract.ts`: 좌표·치수 계약, 단계별 핀 위치(`pinPositionInClip`), 치수 상호 조건(`validateClipPair`), 제조 출력 차단(`isManufacturingReady`: 클립·핀 모두 `status:'measured'`일 때만 true).
- `clipGeometry.ts`: 양끝이 둥근 장방형(stadium) 클립. 접합면 쪽 **립**에만 열쇠구멍(둥근 입구 + 장축 방향 좁은 홈)이 있고, 그 아래는 핀 머리가 지나가는 **언더컷 통로**. 상대 핀은 목 + 모따기 머리.
- `TylkoClip.tsx`: `TylkoClip`, `TylkoClipPin`, 설명용 `TylkoClipJoint`(단계별 결합 표시). 재질은 주입. `createClipMaterials(color)`는 호출자가 소유·dispose. 색은 PDF p2의 black/orange/silver이고 **색상별 잠금 역할은 넣지 않음**.
- `illustrativeDimensions.ts`: **설명용 치수(제조 불가)**. 사진 비례 눈대중으로, 클립 32×9×12, 립 2, 입구 Ø6.5, 홈 3.2, 이동 11 / 핀 머리 Ø5.5×2, 목 Ø2.6×6. 단품 캡처와 조립 설명에만 사용.
- 모든 치수는 mm prop으로 받음. 컴포넌트·계약에 기본값 없음.

**좌표 계약 (클립 로컬, mm)** — 조립 담당·리더 소비용
- 원점 O = 핀 입구 중심과 접합면(클립이 박힌 판의 단면 표면)의 교점.
- +Z = 접합면 바깥 법선(상대 판 쪽). 클립 몸체는 z ∈ [−depth, 0].
- +X = 클립 장축 = 체결 슬라이드 방향. 핀은 클립 기준으로 입구(x=0)에서 체결 위치(x=travel)로 이동.
- +Y = X×Z (클립 폭 = 판 두께 방향).
- 핀 로컬: 원점 P = 상대 판 면과 핀 축의 교점, +Z = 핀 축(판 면 바깥).
- 결합: 핀 +Z = 클립 −Z. 단계별 P 위치(클립 좌표)는 정렬 (0,0,gap) → 진입 (0,0,0) → 체결 (travel,0,0). PDF p5의 '아래 화살표'는 +X의 한 예시일 뿐이며, 월드 방향은 리더가 접합점 자세로 변환.
- 몸체 장축 범위: `clipBodyExtent()` (입구 중심 기준, 양끝 여유 균등).

**검증**
- `node --no-warnings --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs src/components/three/furniture-hardware/connectors/clip.test.mjs` → pass. 내용: 설명용 치수의 기하 일관성과 제조 차단, 조건 위반 탐지 5종, 몸체 bounds·길이, 립 열쇠구멍과 언더컷이 비어 있는지(정점 검사), 핀 원점·축·머리 반경, 단계별 위치.
- 기존 legs/handles 테스트 재통과. tsc·eslint(furniture-hardware) 0.
- **단품 캡처** (`docs/handoffs/claude-2-hardware-assets/`): `clip-front-orange.png`, `clip-front-black.png`(정면, 접합면 방향), `clip-side.png`(측면), `clip-section-y0.png`(y=0 단면, 체결 상태: 핀 목이 립 홈에, 머리가 언더컷에), `clip-iso-aligned/entered/locked.png`(단계별). 캡처 생성기: `connectors/preview/capture.mjs`(설명용 치수 표기 포함).

**미확인 / 하지 않은 것**
- 실제 치수 전부(길이·폭·깊이·립·입구·홈·이동 거리·핀 돌출량), 판 두께 조건, 배치 간격, 색상별 locking/non-locking 대응, 공급사·품번 → null 유지. 사진 비례로 확정하지 않음.
- 립/언더컷 내부 구조는 열쇠구멍 슬라이드가 성립하려면 필요한 **최소 기구 추정**임(PDF p2 사진의 입구·홈 형상만 관찰). 실제 내부 스프링/잠금 걸쇠(locking 타입)는 표현하지 않음. 은색 금속 클립(p2 오른쪽)의 판금 형상도 미구현.
- 실제 가구 연결, 접합점 배치, CNC 포켓은 리더 담당. 이 모델의 치수를 가공에 쓰면 안 됨(`isManufacturingReady` false).

**연결 요청**
- **HW-REQ-04 (리더)**: connector plan의 접합점마다 `{clipOrigin(접합면 위 입구 중심), clipAxisX(슬라이드 방향 단위벡터), clipNormalZ(접합면 법선), pinPanelId, color, dims(measured|illustrative)}`를 제공하면, 이 계약으로 클립·핀을 배치함. 단위 mm, cm 장면에는 어댑터(×0.1).
- **조립 담당(왼쪽5)**: `pinPositionInClip(clip, phase, gap)`과 위 좌표 계약을 쓰면 형상을 중복 제작하지 않아도 됨. 설명용 치수임을 화면에 표기 요청.

### VISUAL-REVIEW-001/003 처리 (2026-10-14)

- **001 long_leg 회전 체인**: 해결. 루트 노드 1개(부모 없음), 쿼터니언 (0,0.92388,0,0.38268) = +Y축 **135°**(이전 '45°'는 오기), scale **0.0010322**(이전 '0.001'은 근사), translation 0. 전 정점에 TRS를 적용한 world bounds는 x −39.22..8.26, y 0..111.48, z −8.26..39.22 mm. 변환 전 메시 bounds는 별도 기록. 모서리 방향(−x,+z)으로 벌어지는 사선 다리. 가구 모서리별 미러/회전 규칙은 미확인이라 **배치 보류 유지**.
- **003 short_leg 노출 높이·매입 깊이**: 새 근거 없음. 총 22.5mm(패드 8 + 스템)만 관찰. 스템이 판재에 묻히는 깊이와 노출 높이는 미확인 → 기존 10mm 대체 금지 유지.
- **003 FullHeightHandle30 채널 16.7mm vs 문 19mm**: 미확인 유지. 문 모서리 가공 여부, 30/50 사용처, 정면 축은 Tylko 렌더러에서 문·손잡이 상대 배치를 관찰해야 확정 가능(다음 작업 후보). Door 연결 금지 유지.

## 첫 산출물과 진행 (2026-10-13 21:38~)

- 수행 내용:
  1. Tylko 렌더러 하드웨어 GLB 목록 확보. 공개 번들 `vueCplusV2-es6`의 `{id, masterId, filePath:"geometry/*.glb"}` 표에서 추출. 실제 경로는 `media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/`(200 응답 확인).
  2. 다리 6종·손잡이 10종·힌지 2종·옷장 레일 2종의 bounds를 측정함. glTF accessor min/max만 읽었고, 메시는 저장하지 않음. 회전체 다리는 높이별 최대 반지름 프로파일만 추출.
  3. 측정값은 `specs/observedHardware.ts`(mm, status=observed)에 기록. `ShortLeg`, `PlaneLeg`, `LatheLeg` 컴포넌트를 구현함(원점=상부 앵커, 재질 주입, 자체 geometry만 dispose).
- 변경 파일(모두 신규, 본인 디렉터리): `src/components/three/furniture-hardware/{index.ts, LatheLeg.tsx, legGeometry.ts, legs.tsx, legs.test.mjs, specs/observedHardware.ts}`.
- 사용한 근거: tylko.com 공개 번들 + 위 GLB 직접 측정(VPN Chrome m5, 2026-10-13). 사이드보드 4665612,j에서 Feet=Legs 선택 시 높이 63→73cm 관찰.
- 관찰 / 추정 / 미확인:
  - 관찰: 아래 표의 bounds와 short_leg·plane_leg 프로파일.
  - 추정: vertical_handle_30/50 = fullHandleLeft/Right(번들 id 문자열 기준).
  - 미확인: lift_leg 단면(링인지 경사면인지), long_leg 실제 배치 회전, 각 다리가 쓰이는 제품군/옵션 매핑, 다리 앵커와 몸체 바닥 사이 간격(스템이 판재에 묻히는지).

### 부품 조사 표 (재사용 / 수정 필요 / 근거 부족)

| 부품 | Tylko 관찰 (mm) | Befun 현재 | 판정 |
|---|---|---|---|
| 기본 조절발 short_leg | Ø16 패드 8mm + Ø6.5까지 좁아지는 스템, 총 H22.5 | `LevelingFeet.tsx` Foot: Ø25×H10 원통 + 캡 + 홈, 재질 인라인 생성 | **수정 필요** → `ShortLeg` 구현 완료, 연결 대기 |
| plane_leg | Ø15×30 원기둥 | 없음 | `PlaneLeg` 구현 완료 / 사용 제품군 미확인 |
| lift_leg | Ø50×28 | 없음 | 근거 부족(단면) |
| long_leg (Legs 옵션) | 메시 65×108×58(mm 메시, 노드 scale 0.001, Y 45°) | 없음 | 근거 부족(배치 회전·단면). 총높이 +10cm 관찰 |
| thick_leg | 60×100×60 | 없음 | 근거 부족 |
| pillar_leg | Ø60, 본으로 높이 가변(기본 200) | 없음 | 근거 부족(가변 규칙) |
| slim_handle (Type02) | 130×21×39 | `handle_door.glb` 130×20×39 | **재사용 가능** (치수 일치, 단면 동일 여부 미확인) |
| grip_handle | 12×250×20 | 없음 | 근거 부족(사용처) |
| horizontal/vertical_handle_30/50 (Type01 전체 손잡이) | 본 2개로 길이 가변, 단면 폭 30/50 | `handle_drawer_unit.glb`를 bounds로 늘려 사용 | 수정 필요(단면 프로파일 미측정) |
| short_handle_left/right | 26×225×42 미러 쌍 | `handle_right.glb` 45×314×21(cm GLB) | 불일치 / 사용처 미확인 |
| handle_ring / handle_hole | Ø44.6 / Ø44 평면 | 없음 | 근거 부족(사용처) |
| anode | 120×1×14 | 없음 | 근거 부족 |
| hinge_anchor | 36×17×74 | `hinge_right.glb` 37×17×80 | 수정 필요(길이 6mm 차) |
| hinge_wing | 37×57×16 | `hinge_right_fe.glb` 37×58×18 | 수정 필요(소폭) |
| 옷장 레일 cross/front_wardrobe_bar | 16×85×340(본 가변) / 10×40×20 | 없음 | 근거 부족(옷장 생성기 대기) |


### 2차 (21:45~) — 힌지 판정 · Type01 전체 높이 손잡이

- 힌지: 현재 문 힌지는 `hinge_right.glb`가 아니라 codex-display가 만든 Blum 실규격 파라메트릭(`blum/BlumHardware.tsx`)을 씀. Tylko hinge_wing/anchor 치수로 덮으면 Blum 작업과 충돌하므로 **변경하지 않음**. Tylko 치수는 observedHardware.ts에 참고용으로만 둠.
- Type01 전체 높이 손잡이 `vertical_handle_30` 단면 추출: 끝면(y=-50mm) 삼각형의 경계 에지를 추적함. 29.1×18.9mm. 구성은 −z쪽 긴 날개(x −19.2..0), +z쪽 짧은 립(x −2.9..0), 둘 사이 폭 16.7mm 채널(문 모서리 삽입), +x쪽 반지름 약 8.3mm 반원 손가락 홈. 홈 원호의 z=±1.1 한 점은 대칭으로 추정.
- 구현: `FullHeightHandle30`(높이 mm는 prop, y 중앙 정렬, x=0 채널 바닥, z=0 문 두께 중심)과 `handleGeometry.ts`(단면 압출). 단면 데이터는 `OBSERVED_FULL_HANDLE_30_SECTION`.
- `vertical_handle_50`: 30의 x 미러에 그립 쪽 뒤 날개(x −29.2..−8.9, z −9.7..−8.2)가 하나 더 붙은 형태로 관찰됨(총폭 48.4). 사용처(어떤 문/폭)가 미확인이라 **미구현**.
- 검증: `node src/components/three/furniture-hardware/handles.test.mjs`. 높이 100/380/1900mm에서 y 중앙 정렬, 단면 bounds가 관찰 bounds와 0.8mm 이내(관찰 x −20은 반올림 값). 단면 SVG 육안 확인(자기교차 없음). tsc·eslint 0.
- 연결 요청 **HW-REQ-03**: 현재 `Door.tsx`의 Type01 full 손잡이는 `handle_drawer_unit.glb`를 bounds로 늘려 씀. 리더/Door 소유자가 `<FullHeightHandle30 heightMm={…} material={…}/>`로 교체 검토. 좌우는 scale.x=-1, mm→cm는 어댑터 group(scale 0.1). Type01 문 두께 19mm와 채널 16.7mm의 관계(문 모서리 가공 여부)는 미확인.

## 검증

- 실행 명령·환경: `node src/components/three/furniture-hardware/legs.test.mjs` (Node 24, three 0.182). `npx tsc --noEmit`(furniture-hardware 오류 0), `npx eslint src/components/three/furniture-hardware`(0).
- 결과: short_leg H22.5 Ø16, plane_leg H30 Ø15. 윗면 = 원점(앵커), 바닥 = -H, 중심축 일치. pass.
- 화면/구조 비교 경로: 미실시. 장면 연결 전이라 정면·측면·하부 비교 캡처는 아직 없음.
- 미검증 범위: Tylko 화면과의 시각 비교, 실제 장면 연결(cm 어댑터), 재질 주입 시 그림자·AO, 손잡이·힌지·레일 구현.

## 공통 계약 변경·연결 요청

요청 ID / 문제 사례 / 현재 계약 / 변경 제안 / 영향 파일·담당 / 호환 및 검증 계획.

- **HW-REQ-01 / 기본 조절발 교체**
  - 문제: `LevelingFeet.tsx`의 Foot이 Ø25×10mm인데, Tylko short_leg는 Ø16×22.5mm.
  - 현재: 리더 소유 LevelingFeet가 형상과 배치를 함께 가짐.
  - 제안: 배치(calculateShortFeet)는 그대로 두고, Foot 대신 `<ShortLeg material=…/>`를 mm→cm 어댑터 group(scale 0.1) 안에 앵커 위치로 렌더. 재질은 리더가 주입(현재 검은 무광 재질이면 `new MeshStandardMaterial({color:'#1a1a1a', roughness:0.6})` 1개를 공유).
  - 영향: LevelingFeet.tsx(리더), Shelf.tsx의 `footHeight=1`(10mm) — 총높이 22.5mm 다리면 몸체 높이가 달라지므로, 스템이 판재 안에 묻히는지(노출 높이) 리더 확인 필요. D-005 높이 불일치와 함께 판단.
  - 검증: 정면·하부 캡처 비교, 발 개수 불변 회귀.
- **HW-REQ-02 / 다리 종류 매핑**: Standard/Plinth/Legs 등 옵션별로 어떤 GLB(short/plane/lift/long/thick/pillar)를 쓰는지 리더 사례로 확정 요청. 확정된 것부터 형상 구현.

## 완료·인계

- 구현 / 실제 연결 / 검증 상태:
  - 구현: ShortLeg, PlaneLeg, LatheLeg와 관찰 사양 데이터.
  - 실제 연결: 미연결(HW-REQ-01 대기).
  - 검증: 치수·앵커 단위 테스트 pass, 시각 비교 미실시.
- 리더가 연결할 진입점: `import { ShortLeg } from '@/components/three/furniture-hardware'`. mm 단위이고 원점은 상부 체결점. cm 장면에서는 `<group position={anchorCm} scale={0.1}><ShortLeg material={m}/></group>`.
- 남은 차이·다음 작업: ① 손잡이 단면 측정(Type01 전체 손잡이) ② 힌지 2종 치수 보정 ③ 다리 종류 매핑 확정 후 long/thick/pillar ④ 옷장 레일.
- 잠금 해제 파일·시각: 진행 중이라 아직 없음.

## 기존 그래픽 담당 미해결 사항 (리더 인계)

- **[해결 2026-10-13] 솔리드가 너무 어둡게 보임**: 환경광은 그대로 두고 `materials.ts`의 단색 팩토리(`createColorMaterials`)에만 화면 보정을 넣음. linear 색을 out = albedo×1.25 + 0.03으로 보정. 원목·텍스처 경로는 영향 없음. 측정(정면 패널, 우리 → Tylko 화면): Midnight #363842→#393943, Black #3f3f3e→#414141, Terracotta #b95e45→#b45c48, White #f5f5f5→#ffffff. 리더의 REFERENCE_COLORS 값(재질값)은 그대로 쓰고 표시 단계에서만 보정함. CNC/저장 색 데이터에는 영향 없음.
- **[해결 2026-10-14] 조명 균형 복원(사용자 승인)**: 솔리드 보정용으로 낮췄던 키 라이트와 그림자를 원래대로 되돌림. 키 라이트 1.2→1.9, 환경광 1.9→1.25, 오른쪽 보조광 1.6→0.9, AO 0.65→0.85, 노출 0.85→1.0, 바닥 albedo #a9a9a9→#bababa. 벽 그림자 복원(벽 #e6e6e6 / 그림자 #bfbfbf). 솔리드 보정 LIFT 0.03→0.038 재보정. 정면: Midnight #383942(Tylko #393943), Black #40403f(#414141), Terracotta #b35c45(#b45c48), White #f4f4f4.

- **솔리드 컬러 품질**(사용자 피드백 "솔리드 미흡"): Tylko 화면은 같은 재질값에서 Midnight Blue 정면 #393943, Black #414141, Terracotta #b45c48(우리 #111424 / #1a1a18 / #963e1e). 밝고 균일한 환경 반사(F0 약 4%)로 회색 리프트가 생기는 것이 원인. 환경광을 바꾸면 원목까지 바뀌고 번들거린다는 사용자 판단에 따라 **환경광 변경은 금지**. 다음 시도는 materials.ts의 솔리드 재질만 조정(광택 없이 명도 보정).
- **슬라이더 깜빡임**(`/furniture/sideboard-terra`): 헤드리스 녹화로는 재현되지 않음. 후보 ① `display/ViewCamera.tsx` near=0.1(이전 1)로 접지 데칼·바닥 z-fighting ② 카메라 재프레이밍 ③ VSM/AO 재계산. 카메라는 codex-display 소유라 수정하지 않음.
- **카메라**: ViewCamera에 커서 기준 줌(`zoomToCursor`) 추가와 각도 제한(polar 0.15π~π/2-0.02, azimuth ±π/3) 복원 요청이 미반영. 이번 배정은 Scene/Effects·카메라 수정 범위를 넓히지 않으므로 리더/codex-display에 인계.
- **3014 미리보기 서버**: `/private/tmp/befun-scroll-preview-1sro1bbp` 복사본이 원본과 동기화되지 않음. 그래픽 실험 상태가 남아 있던 Scene.tsx만 원본으로 맞춤(21:0x).
- 기존 잠금: Scene.tsx·Background.tsx·Effects.tsx(현재 codex-display 연결부 공존)·materials.ts·ar/**·MobileConfiguratorPanel 등. 상세는 team-tasks.md.

## 화면 위치별 배정 보완 — 리더

사용자 21:30 첨부 화면 기준: 왼쪽 첫 번째 Claude, 기존 claude-graphics; R1-VISUAL입니다. [전달 지시문](../development/furniture-parity/terminal-instructions.md)을 확인하세요. 고유 세션명·착수 시각·잠금은 작업자가 기록합니다. 배정 게시이며 구현 완료/착수 확인은 아닙니다.
