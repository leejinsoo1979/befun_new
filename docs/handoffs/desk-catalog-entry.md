# 책상 상품 진입 누락 수정 — 2026-10-14

사용자 재현: 쇼핑 목록의 책상을 선택하면 `/reference-product/desk-1` 정적 사진과 외부 링크만 표시되었다. 리더의 기존 통합은 `/configurator-intro`만 연결했으며 실제 카탈로그 경로 검증이 빠졌다.

## 변경

- catch-all 서버 페이지에서 3개 책상 ID를 공통 FurnitureConfigurator로 연결. 기존 URL 그대로 열리며 모델을 새로 구현하지 않는다.
- 카탈로그 디자인 편집 링크/안내 변경. 각 페이지에서 책상 이름을 표시한다.
- `catalog-design.ts`에 브라우저로 확인한 초기 디자인 입력만 보관. 런타임 Tylko 호출 없음.
- `desk-1`: Classic, Clay Brown, 200×73×60cm, 수납2열, 중앙 다리 공간, 좌측 2서랍+상부오픈 / 우측 도어+상부서랍.
- `desk-2`: Modern, Sand+Midnight Blue, 240×73×50cm, 수납4열, 왼쪽 다리 공간, 도어+상부오픈2열 / 2서랍+상부오픈2열.
- `desk-3`: Classic, Black Plywood, 160×73×50cm, 수납2열, 중앙 다리 공간, 좌측 오픈3단 / 우측 도어+상부서랍.
- 원본 초기 경첩 방향/케이블 구멍은 미확인. 기존 right/off 기본값 사용. 화면 관찰을 실제 제작 좌표 실측으로 취급하지 않는다.

## 검증

- 실제 VPN Chrome 3개 원본 페이지 관찰. 사례: `docs/tylko-reference/cases/desk-catalog-entry-001.json`.
- 문제 URL에서 3D 렌더 확인. 너비·깊이 변경 및 도어/서랍 열기 확인.
- 카탈로그의 샌드·블루 편집 링크를 눌러 진입; 깊이50→60cm 저장 후 새로고침하여 색상, 4수납열, 좌측 다리 공간과 수정 깊이 유지 확인.
- 블랙 책상 3D와160×73×50 초기값 확인. 원본/비펀 스크린샷 사례에 기록.
- 통합 회귀14개 PASS, 수정 TS/TSX ESLint PASS.
- 클라이언트 lazy wrapper 실험에서 useId hydration 불일치 발견하여 제거. 실제 서버 route가 편집기를 선택하도록 변경, 이후 직접 로드 및 새로고침에 신규 오류 없음.
- 격리 사본 `/tmp/befun-desk-wardrobe-build-crs3ts1g`의 `build-desk-catalog.log`: production webpack build/typecheck/static generation PASS. 공유 .next와3003서버는 재시작하지 않음.

## 남은 범위

책상 진입 오류 수정 완료이며 전체 Tylko 시각 동치 완료가 아니다. 기존 카메라·조명·합판 엣지·하드웨어 차이, 원본 사진 갤러리와 주문 연결은 기존 통합 인계의 미완료로 유지한다. 옷장 등 다른 카탈로그 사진의 실제 프리셋 연결은 이번 3개 책상 수정에 포함되지 않는다.
