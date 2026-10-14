# 02 — Claude 옵션 UI 담당 (기존 역할 코드 Claude-1)

작업 ID R1-UI. [공통 계약](contracts.md)을 먼저 읽습니다. 결과는 [UI 인계](../../handoffs/claude-1-ui.md)에 기록합니다.

## 허용 파일과 금지 경계

허용: 신규 `src/components/ui/furniture-panels/**`, 그 안의 preview/검증 자료, 본인 인계 문서. 공통 타입 게시 전 preview 타입은 이 디렉터리 안에만 둡니다.

기존 page, stores, StyleSelector, DimensionPanel, MobileConfiguratorPanel, PriceDisplay와 공통 타입은 리더 통합 대상입니다. 직접 수정하지 말고 연결 위치와 구체적인 변경안을 인계합니다. ConfiguratorIntro는 Codex 쇼핑몰 연결 담당 소유입니다. package.json에 preview 패키지를 추가하지 않습니다. 기존 storefront를 중복 구현하지 않습니다.

## 즉시 시작할 작업

1. [옷장 문서](../../tylko-reference/wardrobe.md)와 사례를 읽고 Edge/Tone 패널 항목·순서·선택 상태를 목록화합니다.
2. props로 받은 값·범위·선택지·상태를 표시하고 callback으로 변경 의도만 내보내는 독립 패널을 만듭니다. 직접 store 변경·구조 계산·강제 clamp는 하지 않습니다.
3. Edge 외형/내부 구성 탭, 구획 선택, 배치 캐러셀, 전면·문 방향·구획별 치수 제어를 구현합니다.
4. Tone 외형/내부 구성, 높이200/237/확장 모드, 깊이 slider, 조명, 내외부 색, 내외부 서랍을 구현합니다.
5. [기존 제품군 표](../../tylko-reference/category-inventory.md)를 기준으로 행 선반/낮은 수납/Desk/Vinyl/Edge/Tone 패널 차이를 확장합니다. 한 공통 패널에 모든 옵션을 노출하지 않습니다.

## 관찰된 상호작용을 그대로 표현

- Edge 전면 Offen에서 문 방향이 사라지고 Nichts offen에서 복귀합니다. 숨김이 값 삭제라는 뜻은 아닙니다.
- Tone 높이+는200→238, Standard 복귀는237입니다. 실제 변경값은 리더의 상태 전이 결과로 받습니다.
- 조명 켜짐에는 후면4cm 안내가 나타납니다. 미확인 부품 치수를 UI에서 계산하지 않습니다.
- 전역 치수와 선택 구획의 치수는 제어 ID/대상을 분리합니다. 잘못된 구획에 callback을 보내지 않습니다.
- 한국어 라벨과 Befun 브랜드/가격 정책을 유지합니다. 원본 옵션의 의미·순서·조절 방식은 보존합니다.

## 산출물과 완료 기준

독립 패널 컴포넌트, 공통 계약을 적용하는 진입 컴포넌트, 관찰 사례 기반 preview 데이터, 연결 설명이 필요합니다. 조작이 다른 구획을 수정하지 않는지, disabled/hidden/selected 구분, 키보드 조작, 좁은 화면 스크롤과 overflow를 확인합니다. 모바일 레퍼런스 미확인 부분은 자체 대응인지 원본 관찰인지 구분합니다.

의미 있는 조건부 전환·callback 대상 검증을 수행하고 실제 3D 미연결 preview는 명시합니다. UI 완료와 생성기 동치를 분리해서 보고합니다.

## 화면 위치

사용자 첨부 화면의 **왼쪽 두 번째 Claude**에게 배정합니다. 왼쪽 첫 번째 Claude는 하드웨어·기존 그래픽 담당입니다. 파일명 Claude-1은 역할 코드이며 창 순서가 아닙니다.
