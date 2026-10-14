# R3-LEADER — 리더 직접 작업 및 통합 책임

## 우선순위

1. P1 QA-R2-B01: CNCProvider 사용자 편집과 Befun livePanels 동기화에서 추가 판재/가공이 사라지는 실제 경로 수정. QA-R2-REFRESH-01은 별도 원인 확인. 원본 실패검사를 보존하고 CNC-PRESERVE-READY 게시.
2. UI-LIVE-READY 실제 코드·화면 검토. R3에서는 UI에게 운영 마운트를 명시 위임했으므로 같은 파일을 동시에 수정하지 않는다. SAVE-CONSUMER-PATCH는 UI 해제 후 리더 적용.
3. 장다리 위치: 공개 일반 규칙과 실제 제품별 DNA override, 발/다리/Plinth 분리 검증. 현재 일반 fallback을 전 제품 일치라고 하지 않는다. 가로패널 분절선은 실제 부품 경계와 3D seam/분해도/CNC를 같이 확인한다.
4. Desk·다리 가구·옷장: 공통 상태/registry/생성/적용·복구 계약을 실제 코드로 게시한다. 제품군별 우측 UI와 실제 geometry를 연결하고 각 제품을 별도 승인한다. 기존 preview를 생산 생성기로 포장하지 않는다.
5. HW·ASM의 장다리 표시 계약이 실제 Shelf 원본과 일치하는지 확인하고, 제조 타공은 근거 치수만 통합한다. 실물 나사/핀 미확정 형상은 분리한다.

## 소유 경계

리더: stores/**, types/**, lib/three/furniture-base.ts, three/Shelf.tsx·FurnitureLegs.tsx, 스타일 생성 규칙·패널 분절·접합계획·CNC 동기화 핵심, lib/furniture/** 신규 공통 계약, 레퍼런스 문서. 실제 수정 전 파일별 잠금을 team-tasks에 별도로 등록한다.
R3 UI 소유 ProductConfigurator/configurator 마운트와 SAVE 소유 configuration/savedDesign/sharing/share page는 이 배정 동안 리더도 읽기 전용이다. 충돌 시 handoff로 좁은 이전을 먼저 기록한다.

## 중간 개입 기준

각 READY에서 source·검사·화면을 읽고 PASS/수정 요청을 team-tasks에 게시한다. 타입 이름만 문서에 추가하고 CORE READY로 선언하지 않는다. QA 새 P1은 다음 일반기능보다 우선한다. 작업자에게 필요한 입력은 실제 export/파일/단위/적용 예제로 제공한다.

## 공통 실행 규칙

- [R3 전체 배정](../../dispatch-r3.md)을 먼저 읽고 AGENTS.md/CLAUDE.md 및 docs/team-tasks.md의 현재 잠금을 확인한다. 본인 기존 handoff에 R3 수신·시각·실제 세션·착수 파일을 추가한다. 완료된 R2.1 증거는 지우지 않는다.
- 이 지시서의 허용 파일만 수정한다. 다른 담당 파일은 읽고 변경 요청을 남긴다. 미완료 선행 작업이 있어도 아래 독립 작업은 바로 진행한다.
- 구현, 운영 연결, 레퍼런스 일치, 제조 치수 확정을 각각 판정한다. 미측정 값은 null/unknown으로 남긴다. 추정 시연값을 CNC 타공값으로 넘기지 않는다.
- UI는 Befun 브랜드·기존 버튼/서체/간격을 유지한다. 공유 개발 서버 종료·공유 .next 삭제·타 작업 롤백 금지. 브라우저 검증은 기존 VPN Chrome에서 담당 탭만 사용한다. 남의 탭·전역 viewport를 변경하지 않는다.
- 변경 범위 검사와 lint/type/build 결과를 기록한다. build는 격리 경로에서 실행하고, 소스 fingerprint/시각을 남긴다. 과거 통과를 이번 통과로 적지 않는다.
- 결과는 본인 handoff에 `사례 ID / 입력·초기상태 / 조작 / 기대 / 실제 / pass·fail·unknown·blocked / 증거 경로 / 수정 파일 / READY export 또는 URL / 남은 항목 / 해제 잠금`으로 제출한다. READY를 게시한 뒤 리더 확인을 기다리는 동안 남은 독립 검증을 진행한다.
