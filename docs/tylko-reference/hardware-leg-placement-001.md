# 장다리 연결 1차 — 2026-10-14

## 확인 근거
- 사용자 영상: https://www.youtube.com/watch?v=y_6rMHwOIzo&t=6s (Leg Assembly and Disassembly, Tylko). Chrome에서 3초와7초 장면 확인. 전체 동작의 근거는 기존 공식 해체 도해와 사용자4장 캡처를 함께 사용.
- 실물 장착: `cases/hardware-leg-mount-002.json`. 판재에 나사3개와 중앙 은색 잠금핀이 남는다. 키홀 장착판과 곧은 원통 다리는 함께 움직인다. 잠금핀 누름→판재에 평행한 슬라이드→분리. 영상의 화면 위쪽을 가구 world-Y로 해석하지 않는다.
- **기존 해석 정정:** observedHardware.ts의 long_leg 전체 bbox X/Z 확대만 보고 ‘사선 다리’로 해석한 것은 잘못이다. 원본 POSITION 정점을 높이별로 검사하면 하부/몸통은 원점 주위 원통이고, 상부 장착판이 옆으로 넓어진다. 기존 관찰 bounds값 자체와 node135°는 유지. 해당 잠금 파일은 담당자가 정정하도록 team-tasks에 요청.
- 공개 렌더 자산: https://media.tylko.com/cloudinary/image/upload/v1/renderer/geometry/long_leg.glb (17,392bytes). 노드 scale0.00103220064·Y135°를 보존한 원본 렌더 메시를 `public/models/furniture/long-leg.glb`로 제공한다. 런타임 외부 호출 없음. 직접 제작 모델/실물 정밀 CAD라고 표시하지 않는다. 원본 렌더 메시에도 실물 나사·키홀·잠금핀 세부가 모두 있다는 주장은 하지 않는다.

## 현재 구현
- `Feet: Standard / Legs`를 상품과 독립 컨피규레이터(모바일 포함)에 연결.
- 기존 몸통을 그대로 두고 하부 높이1cm→11cm, 표시 높이+10cm. 참조 UI의 동일 몸통63→73cm와 대응. 전체 GLB높이111.48mm와 UI증분100mm는 서로 다른 수치.
- 원본 노드 변환을 보존하고 m→cm100배를 부모에1회 적용. 다리를11cm 높이에 맞추려고 메시를 늘이지 않음. 바닥Y0, 상부 일부는 밑판에 겹치는 렌더용 배치.
- 수평 밑판에 접한 최하단 세로판 중심축을 수집. 일반900mm 누적 후보/양끝, Grid의2칸 간격 특례를 사용하고 최종 후보를 실제 세로축에 정렬. 각 지점 앞뒤1개. 분절된 밑판 중 한 판에만 귀속.
- 기본 앞뒤 축인셋9mm, corner/middle별 원본 회전 규칙. 이 값은 공개 함수의 fallback이며 모든 제품의 DNA override까지 일치했다고 주장하지 않음.
- 최신 사용자 변경: Classic/Natural도 Legs 허용. 깊이24cm/Pixel만 Standard로 보정. Classic/Natural의 Plinth는 **미구현**이다. 깊이/스타일 제약 해제 후 다리는 수동 재선택한다.
- Classic/Natural은 별도 실버 메탈/블랙 재질, Solid/Mix는 기존 선반 면 머티리얼 공유. 모델.geometry는 useGLTF cache 소유, 컴포넌트에서 dispose하지 않음.
- 치수패널,3D외경,상품상세,저장목록,카메라 높이는 공통baseHeight 사용. local/서버JSON/레거시URL에baseType 추가, 구 데이터는Standard.
- 가격/결제 규칙은 변경하지 않음. 다리 추가 가격은 별도 결정 필요.

## 검증 / 한계
- `node --test scripts/furniture-legs/legs.test.mjs`: 4검사. 실제5개 스타일×너비4×밀도3×깊이2=120조합의 축정렬·앞뒤쌍·중복없음·바닥높이, 저장복원, 구데이터, 제약전환 검사. **120조합은 비펀 내부 일관성 검사이고 Tylko와120조합 동치 비교가 아니다.**
- 실제 Chrome3003: Grid110cm에서Standard63→Legs73, 하부시점 장착판 안쪽 방향, Pattern전환과73cm 3D치수. 로컬 저장 링크를 열어Pattern/Legs/73cm 복원.
- 미확인: 논리 열과 실제 물리 세로축 분할의 모든 스타일 대응, product plinth__value/legs_offset_z override, Porto특례, Tone/Edge/Desk/옷장, 최대높이와안전성, 정확한 발개수동치, 실제3나사+핀 타공, 조립애니메이션 및 제조출력. 기존 조립안내/CNC에 이 렌더메시를 제조도면으로 넘기지 않음.
- 사진과public mesh의 세부 차이는 별도 후속. 실물 장착판 키홀/잠금핀 치수를 사진 픽셀로 임의 확정하지 않음.
- 최종 빌드: 격리 `next build --webpack` 전체 TypeScript/컴파일/정적생성 통과. 공용 .next 보존. 기존 저장21검사도 통과. 전체lint 오류0,기존7경고; 신규 테스트unused경고는 수정 후 해당파일 재검사0.
- 추가 실제 UI: depth24에서Standard63cm+Legs비활성,32복귀 후Legs재선택→Mosaic73cm 유지. 브라우저error0. 최종 사용자 탭은테라코타 상품Grid/Legs/73cm로 제공.

## 너비별 지지 보완 — legs-003
- Classic/Natural도 너비·밀도·스타일 변경으로 생성된 하단 세로판 축에서 다리를 재계산. 고정 개수/균등 간격 배치가 아니다. 각 선택 축 앞뒤 1개씩 배치한다.
- 기존 양방향 후보 탐색이 Gradient450cm/density50에서 가운데112.146cm 간격을 남겼다. 기존 후보는 보존하고 사이의 실제 세로판 축에 앞뒤 다리를 추가. 해당 사례 최대간격87.417cm, 총16개로 재검증.
- 90cm 초과 구간에 세로판이 없으면 칸 중앙에 임의 축을 만들지 않는다. 이 기준은 일반 렌더 배치 규칙이며 하중 인증값은 아니다.
- 내부420설정(2제품군×5스타일×7너비×3밀도×2깊이), 기존120설정 포함 전체9검사 PASS. 격리webpack/TypeScript/static generation 및 변경파일lint PASS. 실제Chrome Classic450, Natural Gradient450→30cm에서 다리 재배치와 블랙 유지 확인. 상세 cases/legs-003-width-support.json.
