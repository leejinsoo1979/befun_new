# 옷장 생성기 인계 — Edge core 구현 / Tone 통합

담당 wardrobe_geometry / 2026-10-14. 수정범위 `src/lib/furniture/wardrobe/**`, `scripts/furniture-wardrobe/**`. Tone core(`tone.ts`, `tone-rules.json`, tone core scripts)는 horizontal_rules 담당. 원본 엔진 번들은 프로젝트에 복사하지 않았다.

## 현재 제공 API / 단위

- `createWardrobeInput(model)`, `validateWardrobeInput(input)`, `normalizeWardrobeInput(input)`, `generateWardrobe(input)`.
- `getWardrobeLayoutOptions(model,input?,sectionId?)`, `getWardrobeDimensionOptions(model,widthMm?)`, `getEdgeColumnCounts(widthMm)`.
- 입력/원본 기하(mm), 표시용 `PanelData`/문/서랍/옷봉/개구부(cm). `sourceGeometryMm`에 비교 가능한 원본 규격 좌표를 보존한다.
- `fronts`는 문판, `drawers[].front`는 서랍판이다. 서랍 `parts`는 앞판 제외 4판이며 모두 가구 기준 전역 좌표다. 이중 렌더하지 않는다.
- `adapter(source, sectionIds)`로 문/서랍/옷봉/개구부/section에 동일한 stable ID를 전달한다.
- 저장 입력 검증은 잘못된 model, 빈 sections, 미등록 series, 중복/긴 ID, 비유한 치수, 불법 facade/direction/boolean/drawerStyle/높이 step을 거부한다. UI 옵션 변경 normalize의 자동보정과 저장 복원의 유효성 검사를 구분한다.

## Edge 확인된 일반 규칙

- 108개 내부 레시피와 11개 너비 구간별 허용 구획수는 최소 구조 카탈로그 `edge-catalog.json`에 보존한다. 단위·원본 mesh·버전·추출기가 명시되어 있다. 소유자/인증/가격 데이터는 제외했다.
- 너비에서 18mm를 제외한 구획 폭을 정수 mm로 나누고 잔여분은 좌측부터 배분한다. 구조판 두께18mm, 후판12mm, 이웃 구획의 높이/깊이에 따라 공용 벽을 조정한다.
- 높이·깊이·구획폭에 따라 실제 source와 동일하게 내부 레시피 대체 및 옷봉/서랍 허용 여부를 적용한다.
- facade: open→Open, middle-open→Split, bottom-open→Half, closed→Full 레시피 계열. facade 선택을 저장하며 스타일 변경 이후 숨은 임의 규칙을 덧붙이지 않는다. 원본 clean recipe/fallback은 공개 엔진으로 대조했다.
- 문 높이/폭에 따른 양개·상하 분할, 비대칭 line handle 문판 여유, 인접 문 틈, 내부 서랍 힌지 여유를 별도 계산한다.
- topEdge=false이면 실제 평상단 덮개/후판/벽 조정과 2400mm 이하 분할을 적용한다. 혼합 높이/깊이는 연속 동형 구간별로 처리한다.
- 개별 높이3000/global1980 원본 확인: preset global height는1980을 유지하지만 geometry.height는3000이다. Befun도 input global은 유지하고 `sourceGeometryMm.height/depth`는 실제 구획 최대치를 반환한다. 카메라와 외곽 치수는 실제 최대값을 사용해야 한다.

## Tone 서랍 렌더

- 실제 legacy Tone `getRender()`의 내부 i/b 및 외부 e 서랍 5판을 독립 구현했다. 12mm 판재, 외부 서랍 뒤쪽18mm 보정, 외부 전면은 별도 subtype f 레시피다.
- `source.drawer_fronts`로 큰 외부 앞판을 전달하며 section별 외부 서랍 순서로 대응한다.
- 72개 source 설정, 1,170개 물리판 대조: 각 bbox 끝점 오차 ≤1mm. 원본 getGeometry는 반올림, getRender는 올림을 사용하여 0.5mm 입력 경계에서 차이가 발생한다. 완전 치수 일치로 표기하지 않는다.
- 다른 공개 shelf renderer의 `toToneDrawerSegment`는 동일 raw 입력에 다른 상자/앞판 치수를 반환한다. 실제 Tone getRender 기준을 택했으며 두 버전의 완전 동치는 미확인이다.
- 서랍 레일 실물 인출거리는 미확인. 80% 깊이의 화면 시연용 이동량만 있고 `tone-drawer-runner-travel-unmeasured`를 반환한다. 제조치수로 사용하지 않는다.

## 검증 결과

- Edge 실제 Nuxt 엔진 `BmbMCiqU2.js` + public DNA Cabinet v6 대조: 너비/높이/깊이 경계1,120 + 전체108시리즈5,184 + 평상단1,120 + 혼합 개별높이/깊이400 = **7,824 설정**, 모든 slab/wall/back/door/drawer/bar bbox 일치.
- Edge 원본 renderer 물리 서랍1,036개 일치. 프로젝트에는160개 고정 fixture를 보존했다.
- 독립 문판 renderer288개 fixture 일치. 이는 확보한 공개 renderer에 대한 검사이며 현재 페이지 전체 시각 동치 검사는 아니다.
- 재실행: `node scripts/furniture-wardrobe/edge.test.mjs` (492개 source 사례 +160개 Edge drawer +72개 Tone drawer + 저장 유효성/stable IDs), `node --test scripts/furniture-wardrobe/fronts.test.mjs`.
- 범위 ESLint 통과. 최종 앱 build/브라우저 시각 비교는 리더 통합 단계이며 이 인계의 완료 범위에 포함하지 않는다.

## 미확인 / 통합 주의

- Edge round 손잡이 형상, 옷봉/손잡이 실물 메시, Tone 조명 실물 단면, CNC/타공/커넥터/실물 하중은 본 생성기의 완료 범위가 아니다. unsupported를 유지한다.
- 바 bbox는 실제 봉의 단면이나 반지름이 아니다. 제조값으로 취급하지 않는다.
- Tone 문판은 별도 공개 renderer288fixture 중 Tone 사례 기준이다. 현재 Tone 페이지의 최종 문판 렌더와 추가 시각 비교가 필요하다.
- layout options의 source 레시피 존재·fallback·깊이제약은 구현했으나 원본 getThumbnails 목록과 모든 상태별 정렬까지 일치한다고 선언하지 않는다.
- 실측 없는 항목과 Tone 최대1mm 반올림 차이는 해결 완료로 처리하지 않는다.

## 자료 이력

초기에는 UI/공개 preset만 확보되어 임의 기하를 만들지 않았다. 이후 리더가 public DNA/현재 Edge Nuxt 엔진/Tone legacy 엔진을 확보하여 실제 general rules와 source oracle 검증을 진행했다. 원본 개인정보가 포함된 전체 DNA는 프로젝트에 저장하지 않고 구조 레시피만 추출했다. 직접 API 호출은 런타임에 없으며 오프라인 카탈로그로 생성한다.

최종 타입 검사: `npx tsc --noEmit --incremental false`에서 본 구현 오류는 없고 기존 `.next/dev/types/validator.ts` Route constraint 오류2개가 남았다. dev cache 파일은 수정하지 않았다. Tone core의 추가155 고정fixture/720 heldout 결과는 `wardrobe-tone-core.md`에 별도 기록되어 있다.

## 후속 확정 — Edge 우드 / 케이블 / 현재 힌지

이 항목은 위의 `round unsupported` 및 힌지 미구현 상태를 갱신한다.

- Edge 우드는 Original Ash/Oak/Walnut와 다른 `VENEER_TYPE13`(shelf_type5), material0 Light Cleaf /1 Dark Cleaf다. UI 키 `E_LightCleaf`, `E_DarkCleaf`; `edgeVeneer`를 색상과 동기화하여 저장·복원한다. source `_colors`의 Cleaf 기본 tint는0xffffff이고 소형 스와치 대체색은 lightCleafish#CBC3AC/darkCleafish#72553B다.
- source Type5는 문 Z+2mm/round handle, 외부서랍 뒤쪽Z+22mm·전면Z+2mm(타입별 원래 서랍 깊이 보정과 후단 보정 합계). source engine에 type5 discriminator를 적용한 1,296설정(108series×3height×4depth)에서 문/서랍/판 bbox 일치. 별도 type5 DNA 콘텐츠까지 일치하는지는 미검증이다.
- round문은 좌우 각2mm를 공제한다. ringHandle은 힌지 반대쪽 physical문 가장자리에서55mm; 높이993mm 기준이며 문 전체가 아래면top−55, 위면bottom+55. 원본 asset handle_ring.glb/handle_hole.glb. root가 실제 메시/텍스처 담당.
- Edge 후판 케이블: `sections[].cableHeightsMm` 선택배열, `result.cableOptions` 유효 높이목록. sourcegeometry.cable_management는 중심점 mm와radius30(직경60mm). 뒤판 분절선65mm이내/서랍 내부와 겹치는 후보를 제외하고 올라간 선반에 따른22mm 보정을 적용한다. 1,296설정(108series×3height×2depth×평상단 유무)에서 옵션목록 및 선택한 모든 홀 중심점이 일치했다.
- 우측 UI는 실제 source 높이별 on/off 선택. source 표시값은floor(mm/10) cm이므로 실제99mm는9cm로 표시된다. 상부 케이블 기능은 Cabinet원본에서숨겨져 있어 미노출. 후판 실제CSG는root소유.
- 현재 Nuxt Edge 힌지는 legacy 알고리즘과다름을648source사례검증으로발견했다. desk_geometry가 현재42mm/높이별 수량/전체선반회피 규칙으로 교정했고, core에서 전체판재·서랍/문 및section식별자를 전달한다. 이제648개 exact bbox검증통과; source.hinges와result.hinges(cm asset placements)를 제공한다.
- 원목텍스처 source URL base는 `https://media.tylko.com/cloudinary/image/upload/v1/renderer`, 아래경로: `texture/light_cleaf_512_albedo.jpg`, `light_cleaf_512_bump.jpg`, `dark_cleaf_512_albedo.jpg`, `dark_cleaf_512_bump.jpg`. repo기존 generic natural텍스처와 동일하다고 가정하지 않았다. root가4개원본로컬자산확보.
- UV:source renderer SCALAR=.001(m),plane repeat=(2*u/.9,2*v/.9),offset u>v이면(0,(1-v/.9)/2),아니면((1-u/.9)/2,0). veneer slab mapRatio=(width,depth,thickness),회전90°;front=(width,height,thickness),회전0°. 모두미터입력. 제조치수와무관한시각매핑규칙.
- `edge.test.mjs`에추가144우드/144케이블고정fixture, `edge-options.test.mjs` 우드선택·케이블복원·Tone횡옷봉glyph3검증 통과. `hinges.test.mjs` 현재Edge648검증은desk_geometry소유. 기존integration12개+Tone155개도통과. ESLint통과. TypeScript는기존.nextRoute2개만오류.
