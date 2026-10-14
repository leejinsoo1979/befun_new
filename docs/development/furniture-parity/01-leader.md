# 01 — 리더: 공통 규칙·상태·최종 통합

담당: codex-analysis / 작업 ID R1-CORE. 결과는 [리더 인계](../../handoffs/leader-core.md)에 기록합니다.

## 담당과 파일

- 문서: 공통 contracts/acceptance, reference의 분석·규칙·차이 목록, team-tasks 조율.
- 신규 소스: `src/types/furniture.ts`, `src/lib/furniture/configuration/**`.
- 기존 통합 후보: `src/types/shelf.ts`, `src/lib/sharing.ts`, `src/stores/useShelfStore.ts`, `src/stores/useHardwareStore.ts`, `src/components/three/Shelf.tsx`, `LevelingFeet.tsx`, `DimensionOverlay.tsx`, `src/app/configurator/page.tsx`, `src/components/ui/PriceDisplay.tsx`, `src/lib/optimizer/befun/model.ts`.
- 기존 규칙: `src/lib/three/styles/**`, `reference-feet.ts`, `reference-horizontal-splits.ts`, `reference-hardware.ts`, `hardware-state.ts`。

위 목록은 통합 책임 범위입니다. 실제 수정 전 파일별 기존 활성 잠금을 확인하고 필요한 파일만 team-tasks에 등록합니다. 다른 담당의 재질·Scene·Effects나 storefront 작업을 덮어쓰지 않습니다.

## 첫 작업 묶음

1. 기존 store/공유/부품 단위와 분산된 생성기 호출부를 확인하고 의존 관계를 인계 문서에 적습니다.
2. 공통 계약의 타입·registry·legacy 변환 경계를 구현합니다. category/productFamily/generator/UI profile을 분리하고 옷장을 포함합니다.
3. Claude-1에 `FurniturePanelView`와 intent callback, Claude-2에 하드웨어 instance/재질 주입 계약, Codex-보조에 geometry 결과 예시를 게시합니다.
4. 이전 사용자 결함(가로판 통판, 발 위치, Pattern/Mosaic 문·서랍 정렬)을 실제 현재 코드/동일 사례로 재현해 해결/미해결을 분류합니다. 과거 변경 기록만으로 해결 처리하지 않습니다.
5. 첫 통합 제품군과 사례를 확정하고 한 제품군 전체 흐름을 완성합니다. 그다음 나머지 제품군으로 확장합니다.

## 생성 규칙과 부품 사양

한 옵션씩 조사하고 변화 경계 전후를 확인합니다. 규칙 문서에 입력, 필요한 초기 상태, 계산 단위, 근거 사례, 예외, 미확인을 작성한 뒤 일반식을 구현합니다. 특정 화면 좌표의 복사는 금지합니다.

다리 사양에는 kind/spec ID, 외형 치수, 상부 앵커, 개수/배치 경계, 지지 판재와의 관계, 근거와 오차를 포함합니다. 중간 발과 세로판/하판 분절의 관계를 검증합니다. 모든 발을 균등 배치하거나 모든 중간 발이 항상 세로판 중심이라는 미검증 일반화를 하지 않습니다.

가로판 분절은 3D·조립·CNC에서 같은 부품 목록을 사용해야 합니다. 최대 판 길이를 임의 숫자로 자르지 말고 실제 레퍼런스 분절 규칙과 제조 제약을 분리해 기록합니다.

## 완료 기준

공통 타입 게시, 레거시 복구, 한 상태 전이 경로, 제품군별 생성기 선택, 문의/서랍/발 안정 ID, 동일 구조의 3D·치수·조립·CNC 반영, 보류 설정 비교가 필요합니다. [공통 검증 기준](acceptance.md)의 해당 항목이 통과하고 미확인은 별도 남아야 합니다. UI만 연결한 상태를 카테고리 완성으로 보고하지 않습니다.

## R1.2 파일 경계

ConfiguratorIntro 및 상품/저장/공유 진입 UI는 Codex 쇼핑몰 연결 담당 소유입니다. 리더는 공통 적용 함수·직렬화·타입 계약을 제공하고 최종 통합 검증을 담당합니다.


### 리더 중간 검토
[교차 검토 기록과 조율 지시](leader-review.md)를 초안/실제 연결 전/완료 보고 시 확인합니다. 리더는 핵심 생성 규칙과 공통 상태 경계를 직접 구현하고 담당자의 결과를 독립 검증합니다. 1차 우선 과제는 공통 타입·상태 적용 함수 게시이며, 하드웨어 회전 기록의 불일치와 UI 상태 전환 검증 요청을 함께 기록했습니다.
