# Desk / Wardrobe 통합 검증 — 2026-10-14

## 실제 진입 경로

`/configurator-intro` → 책상(Original Classic / Original Modern), 옷장(Edge / Tone) → 커스터마이즈.
직접 경로는 `/furniture-design/desk-classic`, `desk-modern`, `wardrobe-edge`, `wardrobe-tone`이다.
리더가 생성기·우측 편집·3D·로컬 저장 및 URL 복원을 연결했다. 기존 선반 생성기 또는 스타일로 대신 그리지 않는다.

## 반영 범위

- Desk: 너비 90–240cm, 깊이40/50/60cm, 높이73cm, 수납 열 수·다리 공간 위치, 8종 수납 구성, 문 방향, 뒷판, 상판/후판 케이블 관통구멍. Classic9색, Modern12색. 구조판·상부 보강대·조절발 배치와 문/서랍을 렌더한다.
- Edge: 전체/개별 구획 치수, 폭에 따른 구획 수, 상부 테두리·평상단, 내부 레시피·전면 구성·문 방향, 높이별 후판 케이블 홀, 컬러/자작나무/우드, 우드 원형 손잡이, 실제 경첩 메시와 배치.
- Tone: 너비·높이 확장·깊이, 내부12배치, 열 폭 패턴, 내/외부 서랍, 외부3색·내부5색, 조명 부품, 옷봉, 경첩과 전면.
- 상태: 전체 JSON 파싱/유효성 검사, stable section ID, 로컬 저장/복원 및 공유 URL. 새로고침으로 같은 구조·옵션을 복구한다. 계정 저장과는 별개다.
- 뷰어: 문·서랍 개폐, 회전·확대·정면·시점 초기화·전체화면, 전체 너비/높이 표시. 3D 컨텍스트 복구 시 현재 편집 상태 유지.

## 근거와 검증

| 범위 | 대조/검사 | 판정 |
|---|---|---|
| Desk 생성/옵션/케이블 | 4,639 tests; Type01+Type02 구조3,512 / 케이블1,120 source 설정 | 해당 출력 범위 PASS |
| Desk CSG | 관통 raycast·체적·material slots·기존 blind bore 보존5검사 | PASS |
| Edge 구조 | 현재 Nuxt 엔진7,824 설정 | bbox 일치 |
| Edge 우드/케이블 | 각각1,296 source설정 | 비교한 구조/좌표 일치 |
| Edge 경첩 | 현재 Nuxt648 설정 | bbox 일치; legacy와 차이 발견·교정 |
| Tone 구조/경첩 | source720 설정, 프로젝트 고정155fixture | bbox 일치 |
| Tone 물리 서랍 | 72설정,1,170판 | 끝점오차 최대1mm; 완전일치 아님 |
| 공유/복원 | integration12검사 | PASS |
| 실제 화면 | Classic390px / Modern210cm / Edge 우드 케이블 / Tone 외부서랍·조명·내부색 | Chrome 조작 확인; 전체 조합 아님 |

자세한 비교 대상·단위·출처는 `desk-core.md`, `wardrobe-core.md`, `wardrobe-tone-core.md`, `wardrobe-hardware-observations.md`와 원본 사례를 참고한다. 런타임에 Tylko API를 호출하지 않는다. 공개 응답 전체나 인증정보는 저장하지 않았다. 필요한 텍스처·경첩 공개 자산은 로컬에 저장했다.

## 남은 차이 — 완료로 처리하지 않음

1. 전체 카메라·조명·그림자·내경 치수 UI의 화면 동치 미완료. 현재 치수 버튼은 전체 너비/높이만 표시한다.
2. Tone 서랍 인출거리는 실물 근거 미확보(깊이80% 표시용); 물리판 끝점은 반올림 차이 최대1mm.
3. Desk의 기존 조절발 메시22.5mm와 원본20mm bbox 차이, 기존 Blum 하드웨어의 원본 메시 동치 미완료.
4. 옷장 박스 패널의 원본 미세 bevel 차이. source UV atlas/재질 좌표와 렌더 조명 동치는 별도다.
5. 조명 프로필·발광면은 표시되지만 광량·색온도·내부 조도 실측 동치 미확인.
6. 신규 제품군의 계정 저장·장바구니·주문·CNC 제조/타공·전체 상세 갤러리 연결은 미완료. 가격/결제 규칙을 임의 추가하지 않았다.
7. 브라우저에서 많은 3D 탭/HMR 중 WebGL context lost가 발생했다. 원인 확정 없이 해결 완료로 선언하지 않는다. GPU idle rendering/dpr상한과 상태보존 재열기 추가; 복구 동작 별도검증.

## 담당 및 파일

리더: `src/components/furniture/`, `/furniture-design/[family]`, ConfiguratorIntro, 통합 docs.
Desk worker: desk core/fixtures, 하드웨어 helper.
Edge worker: Edge core/우측 패널/우드 UV.
Tone worker: Tone core/힌지 연결/격리 production build.
공유 `.next` 및 서버는 삭제·재시작하지 않았다. 기존 `.next/dev/types/validator.ts` 두 Route 오류는 격리 clean build와 구분한다. 빌드 결과는 `desk-wardrobe-build.md`에 기록한다.

## 최종 통합 재검증

2026-10-14 11:25:48 KST 스냅샷으로 production build/전체 TypeScript/정적17페이지 성공. 전체 lint 오류0, 기존경고7. 11:26:29 source SHA256 비교 차이0. 공유 서버·캐시는 유지했다.

추가 수정: 외부 서랍은 앞판만 외장재, 상자4판은 내부재질; Edge 상단 손잡이는 실제 GLB와 폭별 bone 변형 연결. Cleaf6면 UV atlas/치수별반복/결방향 적용. Tone3D에서 context loss를 직접 재현하고 재열기 후 색상·조명·개폐 상태가 유지되며 WebGL lost=false로 회복되는 것을 확인했다. 단일 복구 검사이며 GPU 손실 자체의 원인 해결로 선언하지 않는다.
