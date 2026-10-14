# 리더 / R1-CORE 진행·인계

## 최신 상태 — 2026-10-13 23:16 이후 중간점검

- 담당: 현재 리더 codex-analysis. 아래 초기 템플릿의 미기입 상태보다 이 기록이 우선한다.
- 실제 구현: `src/types/furniture.ts`에 공통 UI view/intent 게시(R1.3), 기존 UI preview 필드와 호환. UI 담당이 본인 types.ts를 re-export로 교체하도록 지시했다.
- 앞선 구현: 상세 갤러리12종×8장 전환, 커넥터 간격·충돌·보링 보존·두께 불일치 검증. [타공 인계](../panel-connector-validation.md).
- 미구현/리더 책임: 공통 FurnitureState/GeometryResult/HardwareInstance, registry, preset 적용/복구/직렬화, 신규 제품군 생성기와 실제 UI/3D/CNC 연결. UI-02/03/04/08, ENTRY-CONTRACT-001은 대기 유지. 타입 파일 게시만으로 상태 적용 API가 생긴 것은 아니다.
- 검증: 2차 독립 검사43개 통과, 변경 파일 ESLint 통과. 최신 전체 타입 검사는 진행 중 assembly-guide 부재 import와 `.next/dev` route 생성 타입 오류로 실패. 이전 격리 build 통과와 구분한다.
- 후속 우선순위: CORE-REVIEW-002의 실제 상태/적용 경계 → 기존 선반 왕복 → 검증된 제품군을 하나씩 연결 → UI·하드웨어·storefront·QA 재통합. 가짜 제품군 생성기를 게시하지 않는다.
- 검토/담당 지시/미해결: [2차 leader-review](../development/furniture-parity/leader-review.md). 이번 공통 UI 타입과 문서 작성 잠금 해제. 향후 변경은 리더 소유, 새 착수 때 잠금 기록.

기준: [5인 개발 계획](../development/furniture-parity/README.md), [공통 계약 R1.1](../development/furniture-parity/contracts.md).

## 착수

- 실제 세션명: 미기입
- 수신/착수 시각: 미확인
- 상태: 배정 게시
- 적용 계약 버전: R1.1 (문서 계약; 공통 타입 구현 전)
- 수정/잠금 파일: 착수 시 실제 목록 기입

## 첫 산출물과 진행

- 수행 내용:
- 변경 파일:
- 사용한 근거 사례 ID:
- 관찰 사실 / 추정 / 미확인:

## 검증

- 실행 명령·환경:
- 결과와 실패 항목:
- 화면/구조 비교 경로:
- 미검증 범위:

## 공통 계약 변경·연결 요청

요청 ID / 문제 사례 / 현재 계약 / 변경 제안 / 영향 파일·담당 / 호환 및 검증 계획.

## 완료·인계

- 구현 / 실제 연결 / 검증 상태를 각각 기입:
- 리더가 연결할 진입점과 사용법:
- 남은 차이·다음 작업:
- 잠금 해제 파일·시각:

## 2026-10-14 3차 점검 후 직접 수정
QA-L4-04/08 수정. 현재 판재를 유지하는 reapplyConnectorSelection과 생성 주체별 제조 차단 사유 갱신 추가. 검사26+48통과, 타입/격리build통과, 전체lint 오류0/기존경고7. 상세 development/furniture-parity/leader-review.md 3차. 공통 상태/registry/실제 제품군·옷장 생성/접합계획/저장복구 통합은 아직 리더 미완료.

## 사용자 라인업 진행 확인 — 2026-10-14

실제 import 경로 대조: ShortLeg/PlaneLeg는 부품·export만 있고 운영 Shelf 연결이 없다. Desk 전용 생성기 및 옷장 생성기/공통 registry는 아직 없다(`src/lib/furniture` 미생성). FurniturePanel은 preview와 LegacyShelfPanel에서만 사용하며 운영 제품별 UI 마운트가 없다. 따라서 다리 제품·Desk·옷장은 단품/조사 진행과 운영 구현을 구분해야 한다. `configuration.ts`의 loadProductConfiguration은 여전히 공통 grid 선반 경로이다. 이 미연결은 리더 책임이며 작업자 전체 완료로 보고하지 않는다.
