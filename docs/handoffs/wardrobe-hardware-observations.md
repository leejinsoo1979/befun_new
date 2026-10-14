# 옷장 손잡이·옷봉·조명 단면 인계

담당: desk_geometry. 확인일: 2026-10-14. 리더 승인 범위는 신규 기하 helper이며, 배치·문 회전·재질·조명은 리더 모델이 담당합니다. 제조 치수 확정 문서가 아닙니다.

## 납품과 계약

- `src/lib/furniture/wardrobe-hardware.ts`: 독립 BufferGeometry 생성. **입력 길이 cm, 출력 모든 좌표 cm**, 원본 모델 원점을 유지합니다. 반환값은 매 호출 새 geometry이며 소비자가 dispose합니다. 재질·조명·React 상태 없음.
- `createWardrobeGripHandle()`
- `createWardrobeShortHandle('left' | 'right')`
- `createWardrobeFrontBar(lengthCm)` — X 방향 가로 옷봉.
- `createWardrobeCrossBar(depthCm)` — Z 방향 깊이 옷봉. 인자에 **기하 bbox 길이가 아닌 source bar 입력 z2−z1**을 전달합니다.
- `createWardrobeLightProfile(widthCm)`
- `createWardrobeLightDiffuser(widthCm)` — 원본처럼 뒤가 열린 세 면입니다. 불투명 박스로 막지 않았습니다.
- `scripts/furniture-wardrobe/hardware.test.mjs`: 10개 회귀 검사.

## 근거

리더가 공개 renderer asset 경로에서 확보한 GLB를 로컬에서 검사했습니다. 경로는 `https://media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/<file>.glb`입니다. **raw/upload가 아닙니다.** 원본 GLB 전체를 repo에 복사하지 않았으며 단면 관찰값과 독립 생성 알고리즘을 사용합니다.

파일: `grip_handle.glb`, `short_handle_left.glb`, `short_handle_right.glb`, `front_wardrobe_bar.glb`, `cross_wardrobe_bar.glb`, `light_profile.glb`, `light_diffuser.glb`. 읽기용 임시 원본은 `/tmp/wardrobe-*.glb`; short left만 `/tmp/wardrobe-short-handle-left.glb`입니다.

배치/변형의 근거:

- `/tmp/tylko-wardrobe-nuxt/CG3UhuDu2.js` SHA256 `5899d44297ef8a53931945d36277de7e0713e3d6cadb9f3e9d70bc2ce5496443`
- `/tmp/tylko-wardrobes-bundle.js` SHA256 `1f633a6e826742499d803d82c3c4a9c9006db5cc39bc6310e472627dc2cfd34c`
- Nuxt renderer 심볼 `ZH`(grip), `mU`(short), `DU`(옷봉), `VW`(조명), `extendLineBones`(본 길이 변형). 구 번들 534/535의 문 렌더링도 대조.
- 기존 `observedHardware.ts` bounds와 일치 여부를 재확인했습니다. 기존 `public/models/handle_door.glb`(130×20×39 mm)나 `handle_right.glb`(45×314×21 mm)는 해당 손잡이와 다르므로 확대·축소 대체하지 않았습니다.

## 관찰한 배치 규칙

다음은 **mm** 설명입니다. helper 반환값과 리더 3D 위치는 cm로 변환하여 사용합니다.

### Grip

`handle===1`일 때 사용. direction 2는 오른쪽, 1은 왼쪽입니다. 닫힌 문에서 문 중심 기준 X는 direction 2일 때 `−(width/2−39)`, 반대면 `+(width/2−39)`입니다. 문 중심 기준 Y는 `1109−(y1+y2)/2`, Z는 +10입니다. 문 힌지 pivot의 parent/child X는 서로 상쇄되므로 닫힌 상태에 pivot을 두 번 더하지 않습니다. 해당 분기에는 1109의 높이 clamp가 없습니다.

실측 외곽은 X ±6, Y ±125, Z 0..20. 세로 캡슐형 grip의 뒤쪽 라운드와 앞쪽 모따기를 7개의 XY 윤곽으로 loft합니다. U자 손잡이나 단순 박스가 아닙니다.

### Short left/right

`options.shortHandle===true && handle===0`일 때 사용. direction 2 → right, 그 외 left. 좌우는 X만 반전하며 원점은 재중앙 정렬하지 않습니다.

원본 배치 함수의 길이 상수는 225, 위아래 여백은 50입니다. 손잡이 anchor Y는 아래와 같습니다.

- low = y1+50+112.5; high = y2−50−112.5
- high < low이면 문 Y 중앙, 아니면 970을 [low,high]로 clamp.
- 문 중심 기준 X는 direction 2 → −width/2, 반대면 +width/2.
- Z는 문 geometry 두께의 절반. pivot은 위와 동일하게 문 부모와 함께 적용.

원본 left bbox: X −24.90035..1.49998, Y −111.50524..113.49189, Z −20.01307..21.99973. 앞쪽 R4 grip과 약 1.5 mm 접힌 뒤쪽 클립을 별도 기하로 생성합니다. **끝 약 3 mm의 클립 곡면은 10개 관찰 단면을 잇는 근사**입니다. 원본의 약 +0.9933 mm Y 중심 편차를 보존합니다. 오른쪽 원본은 X 반전으로 일치합니다.

### 가로 옷봉 / front

source 중심 `(x1+x2,y1+y2,z1+z2)/2`에 배치. GLB X 길이 10 mm를 source width에 맞춰 X만 늘립니다. YZ 단면은 세로 40×깊이 20, 반지름 10의 캡슐입니다. helper에서 이미 길이가 적용되므로 mesh scale로 다시 늘리지 않습니다.

### 깊이 옷봉 / cross

source subtype `z`에 해당합니다. 중심 X/Z를 사용하되 **Y는 y2**입니다. GLB 전체를 Z scale하지 않습니다. 앞뒤 본의 Z를 `±(span−2)/2`로 옮겨 끝의 기둥/플랜지를 유지합니다.

따라서 최종 bbox 깊이는 **입력 span+14 mm**입니다. 300/340/500 mm 원본 skin 변형을 별도로 적용하여 314/354/514 mm 확인했습니다. 340 mm 기본 GLB bbox는 입력 span 326 mm에 대응합니다. 이 값을 340 mm 입력으로 다시 사용하면 크기가 틀립니다.

가로 단면 10×약 29.95 mm 모따기 레일, R6 기둥, R8 플랜지. Y −84.84658..+0.15342 mm 원점을 유지합니다. 기둥 원주 분할 16과 높이별 관찰 반경을 사용했습니다.

### 조명

리더가 source에서 확인한 anchor: X=(x1+x2)/2, Y=y1+7, Z=z2−24. helper에서 재중앙 정렬하지 않습니다.

`light_profile`의 비대칭 알루미늄 단면은 끝면 삼각형 외곽 경계에서 얻은 48점입니다. 내부 걸림턱과 꺾인 채널을 보존합니다. Y −13.5183..+0.3294, Z −22.2103..24.8006 mm.

원본 profile에는 X 좌측 끝의 약 0..0.0062 mm 굴곡이 있습니다. 현재 helper는 이 미세한 축방향 굴곡을 평면 압출로 정리합니다. 원본 10 mm 축의 0.0062 mm 차이는 650 mm 폭에 선형 확대하면 최대 약 0.403 mm입니다. **이 차이는 남아 있으며 완전 일치로 표시하지 않습니다.** diffuser는 원본의 비대칭 X 범위 비율을 보존했습니다.

`fake_light_rays.glb`는 가시적인 빛 표현용 도형이며 실측 광량 또는 물리 조명 근거가 아닙니다. helper로 복제하지 않았습니다. 소비자에서 발광면 material과 실제 조명을 별도 설정합니다.

## 검증 결과와 한계

모든 원본 정점을 생성 표면의 가장 가까운 삼각형과 비교한 편도 거리입니다. **전체 곡면 양방향 Hausdorff 거리나 사진의 픽셀 오차가 아닙니다.** 단위 mm.

| 부품 | 최대 | 평균 | 범위 |
|---|---:|---:|---|
| grip | 0.000372 | 0.0000784 | 원본 640 정점 |
| short 좌/우 | 0.4365 | 0.1085 | 각 원본 정점; 끝 loft 근사 포함 |
| front bar | 0.000001 | 0.0000004 | 원본 10 mm 길이 |
| cross bar | 0.000051 | 0.0000203 | 기본 포즈 입력 span 326 mm |
| light profile | 0.00620 | 0.00211 | 원본 10 mm 길이; 위 확대 차이 참조 |
| light diffuser | 0.000001 | 0.0000005 | 원본 크기 |

- `node --test scripts/furniture-wardrobe/hardware.test.mjs`: 10 PASS. 3개 길이별 rail 단면/늘어남, 광원 profile bbox, short 좌우 반전, raycast로 캡슐 끝과 clip 빈 공간, 잘못된 입력 검사.
- 변경 파일 ESLint PASS.
- `npx tsc --noEmit --pretty false`: 기존 `.next/dev/types/validator.ts:25`의 Route generic 오류 2개만 남음. 이 작업 파일의 타입 오류 없음.
- 브라우저 시각 대조·문 open 회전과의 결합·전체 build는 리더 통합 검증 범위입니다. 원본 법선/재질의 픽셀 동일성은 검증하지 않았습니다.
- 타공/나사/제조 도면·공차는 이 관찰 기하로 확정하지 않습니다.

## 2026-10-14 후속 — 경첩 및 원목 원형 손잡이

### 경첩 규칙과 버전 차이

- `wardrobe-hinges.ts`는 입력 raw mm, 출력 envelope mm 및 렌더 placement cm를 분리한다. 제조 타공·실제 제조사 SKU는 추론하지 않는다.
- **현재 Edge**는 Nuxt `BmbMCiqU2`의 `ms/bs/hs/xs`에 근거한다. 문 면적 기반 개수에 문 높이 700 mm 이상일 때 1개 추가, 2~6개 제한. 배치 박스 높이는 ceil(41/2)×2 = 42 mm다. 선반은 바닥 포함 전체, 문과 Y 겹침 필터; 아래21/위31 mm 확장, 서랍은 양쪽24 mm 확장한다. 금지구간 합집합 후 끝 경첩은 위/아래로 밀고 중간은 가까운 경계로 밀며, 21 mm 이내 중복은 제거한다. source의 순서·동일거리 처리까지 보존했다.
- 기존 legacy module1966은 최대5개/41 mm/다른 간격이다. 초기 217사례 legacy 일치만으로 현재 Edge 일치라고 주장할 수 없음을 발견하여 **런타임 Edge를 현재 규칙으로 교체**했다. legacy fixtures는 역사 비교 자료로 보존하되 Edge 회귀에 사용하지 않는다.
- `edge-hinge-current-source.json`의 현재 Nuxt 648설정은 sibling `wardrobe_geometry`가 독립 엔진으로 추출했고, core 연결 후 모든 경첩 좌표·방향을 1 mm 반올림 정밀도로 대조 PASS. 소수 내부 좌표까지 완전 같다는 주장은 하지 않는다.
- Tone helper는 legacy module1671의 높이 경계1300/2300 mm,2/3/4개,raw door top/bottom offset,pre-trim standard shelves 기준이다. 109 legacy 사례 PASS. **현재 Tone 전체 생성기와의 연결·최신 원본 대조는 아직 미완료**이며 다른 담당 통합이 필요하다. offsets 없는 입력은 거부한다.
- `resolveWardrobeHingePlacements`는 wing(문과 회전)/anchor(고정 벽)을 별도 반환한다. 원본 renderer의 좌우 Z회전0/π, 문/벽 원점과 Z기준 유지. 기존 Blum의 2개 고정/50 mm 끝간격이나 모델을 혼용하지 않는다.

### 실제 경첩 렌더 자산

- 공개 원본 `geometry/hinge_wing.glb`, `geometry/hinge_anchor.glb`를 리더 승인 아래 `public/models/wardrobe/hinge-wing.glb`, `hinge-anchor.glb`로 저장했다. 출처·SHA256은 동일 폴더 README에 있다. 런타임 외부 Tylko 호출 없음.
- 각각 단일 non-skinned Mesh이며 노드 TRS 없음. 원본 metres → cm ×100만 적용하며 원점/normal/UV를 보존한다.
- `loadWardrobeHingeGeometry(asset)` 비동기 BufferGeometry 반환. 내부 import geometry/material/texture는 해제, 반환 geometry는 소비자가 dispose해야 한다(언마운트 뒤 로드완료도 포함). 별도 모듈 캐시 없음.
- wing7,735 + anchor6,152 =13,887개 정점 모두 source×100과 일치 검사 PASS. 단순 박스/범용 Blum 근사로 대체하지 않았다. 전체 문 개폐 시 시각·간섭 검증은 리더 단계.

### Edge 원목 원형 손잡이

- 실제 asset IDs는 `ringHandle`→`geometry/handle_ring.glb`, `ringHole`→`geometry/handle_hole.glb`. renderer `hU`/legacy1020에서 확인.
- `createWardrobeRingHandle()`는 측정한5점 반경/Z 단면을32분할 회전시킨 열린 링. 4개띠256삼각형으로 원본을 재현한다. 외반경22.29907736 mm, 내반경21.43667001 mm, Z −4.45981463..1.91494438 mm. `createWardrobeRingHole()`는 반경22.01436646 mm의32각평면 삽입물이다. 실제 제조 관통구멍이라는 뜻이 아니다.
- 원본 정점→생성 표면 편도 거리: 링 최대0.00000312 mm, hole 최대0.00000202 mm. 부동소수 오차 수준이나 양방향 Hausdorff/최종 재질 비교는 아니다. 링 중앙이 막히지 않는 raycast 검증 PASS.
- 원목 front 물리 X는 raw x1+2,x2−2, 두께18 mm. 손잡이 X는 오른쪽힌지일 때 물리x1+55, 왼쪽힌지일 때 물리x2−55. Y는 raw전체가993보다아래면y2−55, 위면y1+55, 걸치면993. Z는 doorcenter+9 mm, hole은추가+1 mm. Chrome과 veneerHole재질은 소비자 담당.

### 검증 및 남은 범위

- `node --test scripts/furniture-wardrobe/hinges.test.mjs`: 5 tests PASS (Tone109legacy + Edge648current 포함).
- `node --test scripts/furniture-wardrobe/hardware.test.mjs`: 11 tests PASS.
- 변경 TS/MJS ESLint PASS. `tsc --noEmit`: 기존 `.next/dev/types/validator.ts` Route constraint 오류2개만 남음.
- WardrobeModel/공통 타입/생성기 직접 수정 없음. sibling이 Edge `source.hinges`/adapter placements를 연결. Tone 연결, 최종 Chrome 개폐·재질 시각검증 및 전체 production build는 리더 통합 단계.

## Edge 외부 서랍 전체너비 상단 손잡이 후속

- 현재 renderer `CG3UhuDu2`의 `_U`는 `subtype === 'e'`에서만 `fullHandleTop`을 생성한다. 원목 여부로 ring으로 바꾸는 분기가 없다. 원목 도어의 `gU/hU` round손잡이와 분리한다. 별도 `XU` veneerDrawer/anode 경로를 Edge `_U`에 혼용하지 않는다.
- 기존 `resolveEdgeDrawer`의 handle 위치는 source와 이미 일치: front중심X, front윗변Y, front중심Z. `drawers.ts`는 수정하지 않았다. geometry길이는 `front.w` cm로 전달한다. 내부 `d` 서랍은 handle null.
- `loadWardrobeFullHandle(widthCm)`는 로컬 원본 `horizontal-handle-50.glb`를 읽어 좌우bone을 source동일 ±(widthM−.002)/2로 이동한 후 정적geometry로 bake한다. 전체X비율확대를 하지 않으므로 단부곡면은 유지된다. 원점/normal/UV보존, cm출력. 반환geometry는소비자dispose,언마운트뒤완료도dispose.
- 원본폭100mm,Y−20..30mm,Z−9.746585..9.259439mm. 손잡이는 front윗변을 기준으로 위30mm/아래20mm 걸친다. source paintedMetal은 drawer색상을사용. fullhandle이빠진기존화면은 이50mm높이상부형상이없었다.
- `scripts/furniture-wardrobe/full-handle.test.mjs` 5PASS:10/30/60/90cm에서 모든정점을독립bone이동식과 대조하고Y/Z/normal/UV/dispose보존,external/internal분기를검사. 변경 ESLintPASS. 원본GLB출처/SHA256은 public/models/wardrobe/README.md.
