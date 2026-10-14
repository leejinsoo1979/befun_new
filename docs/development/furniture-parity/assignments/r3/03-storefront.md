# R3-SAVE — 왼쪽3 Codex 쇼핑몰·저장

> **사용자 추가 요구(2026-10-14): Classic/Natural도 Legs 허용, 실버 메탈/블랙 선택.** 리더가 `legFinish: silver | black`(기본 silver)을 store·3D·저장/공유에 연결했습니다. R3의 Classic/Natural 무효 Legs 사례는 철회하며 재질만 바꾸면 Legs를 유지합니다. 깊이24/Pixel 제약은 유지합니다. 리더의 해당 필드 잠금은 해제됐습니다. 이후 UI/SAVE 작업에서 legFinish와 이 지원 규칙을 보존하세요.


## 목표

리더가 게시한 기존 선반의 실제 snapshot/restore와 baseType 저장을 **모든 현재 저장·복구 진입점에서 검증하고 누락을 수정**한다. src/lib/furniture가 없다는 이유로 이미 존재하는 configuration.ts 연결까지 대기하지 않는다. 새 제품군 공통 schema와 기존 선반은 구별한다.

## 소유 파일

- 수정: src/components/storefront/configuration.ts, savedDesign.ts, savedDesign.test.ts, SavedDesignPages.tsx, src/lib/sharing.ts, src/app/share/[code]/page.tsx, scripts/storefront-save-validation/**.
- 문서: docs/handoffs/codex-storefront-integration.md, scripts/storefront-save-validation/screenshots/r3/**.
- 읽기 전용: ProductConfigurator.tsx, app/configurator/page.tsx(현재 UI 담당 좁은 마운트), stores/**, src/types/**, db.ts·API·schema·env·가격·결제·gallery/**. 소비자에서 수정이 필요하면 대상 handler만 diff로 리더에게 인계한다.

## 순서

1. configuration.ts의 currentConfiguration/restoreSavedConfiguration, savedDesign parser, sharing URL, share page, 로컬 design-preview, 저장 목록을 추적한다. 현재 이미 포함된 baseType을 삭제하거나 새 중복 schema를 만들지 않는다.
2. 복구 순서가 색상→지원 가능한 baseType→하드웨어와 일치하는지 확인한다. Classic/24cm/Pixel에 무효 legs가 들어오면 store의 지원 규칙대로 보정되어야 한다. 구버전 baseType 없음은 standard, 알 수 없는 enum은 기존 검증 규칙대로 처리한다.
3. 허용 파일에서 발견된 누락을 직접 고친다. 스타일·밀도·행높이·문/서랍·색상·뒷판·baseType을 왕복 비교한다. 저장 DTO에 없는 connector/제품군 정보를 임의 형식으로 추가하지 말고 리더에게 실제 필요한 필드와 소비 지점을 제시한다.
4. 서버503→로컬 보관과 실제 서버200을 구별하는 기존 안내를 유지한다. DATABASE_URL 미설정이면 실제 DB 왕복만 blocked로 남기고 나머지 작업을 완료한다. 다른 프로젝트 DB 연결/초기화 금지.
5. ProductConfigurator/configurator 소비자가 여전히 수동 직렬화해 누락된다면 정확한 함수·변경 patch·회귀 사례를 SAVE-CONSUMER-PATCH로 게시한다. 리더가 UI 마운트 파일 해제 뒤 적용한다.

## 완료 기준

| 사례 | 기대 |
|---|---|
| R3-SAVE-01 | Standard/Legs 각각 로컬 저장→목록→복구에서 동일 snapshot |
| R3-SAVE-02 | Pattern·Mosaic + 개별 행 높이·문/서랍이 있는 지원 설정 왕복 일치 |
| R3-SAVE-03 | 기존 URL/구버전 저장(base 없음)/새 URL/새 저장 모두 호환 |
| R3-SAVE-04 | Classic·Pixel·24cm 무효 legs 및 잘못된 enum 처리 명시 |
| R3-SAVE-05 | 503 로컬 fallback과 mock200/실제200 증거 구별, 과거 성공 링크 잔류 없음 |
| R3-SAVE-06 | 복구 후 다시 저장/새로고침/다른 색상 변경 순서 검증 |

SAVE-BASE-READY: 검사 결과와 필요 소비자 patch를 함께 제출한다. gallery8장 전환 완료 작업을 다시 만들지 않는다.

## 공통 실행 규칙

- [R3 전체 배정](../../dispatch-r3.md)을 먼저 읽고 AGENTS.md/CLAUDE.md 및 docs/team-tasks.md의 현재 잠금을 확인한다. 본인 기존 handoff에 R3 수신·시각·실제 세션·착수 파일을 추가한다. 완료된 R2.1 증거는 지우지 않는다.
- 이 지시서의 허용 파일만 수정한다. 다른 담당 파일은 읽고 변경 요청을 남긴다. 미완료 선행 작업이 있어도 아래 독립 작업은 바로 진행한다.
- 구현, 운영 연결, 레퍼런스 일치, 제조 치수 확정을 각각 판정한다. 미측정 값은 null/unknown으로 남긴다. 추정 시연값을 CNC 타공값으로 넘기지 않는다.
- UI는 Befun 브랜드·기존 버튼/서체/간격을 유지한다. 공유 개발 서버 종료·공유 .next 삭제·타 작업 롤백 금지. 브라우저 검증은 기존 VPN Chrome에서 담당 탭만 사용한다. 남의 탭·전역 viewport를 변경하지 않는다.
- 변경 범위 검사와 lint/type/build 결과를 기록한다. build는 격리 경로에서 실행하고, 소스 fingerprint/시각을 남긴다. 과거 통과를 이번 통과로 적지 않는다.
- 결과는 본인 handoff에 `사례 ID / 입력·초기상태 / 조작 / 기대 / 실제 / pass·fail·unknown·blocked / 증거 경로 / 수정 파일 / READY export 또는 URL / 남은 항목 / 해제 잠금`으로 제출한다. READY를 게시한 뒤 리더 확인을 기다리는 동안 남은 독립 검증을 진행한다.
