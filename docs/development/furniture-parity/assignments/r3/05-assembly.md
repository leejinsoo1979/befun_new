# R3-ASM — 추가 왼쪽5 Codex 조립 안내

## 목표

사용자가 직접 지시한 Befun UI 일관성·Vectary 수준 연출 수정은 먼저 마무리하고 유지한다. 이어 **다리 전용 조립/분리 안내**를 추가한다. 기존 OVVO 공유 모델, Tylko 원본5단계, 백패널7단계는 보존한다.

## 소유 파일

- 수정: src/components/assembly-guide/**, src/lib/assembly-guide/**, src/app/assembly-guide/**, docs/assembly-guide.md, docs/handoffs/assets/codex-assembly/{cinematic,r3-legs}/**.
- 읽기 전용: furniture-hardware/**, public/models/furniture/long-leg.glb, FurnitureLegs.tsx, furniture-base.ts, store/CNC/상품 UI 전체.
- 원본 이미지 추가가 필요하면 public/assembly-guide/legs/** 신규 폴더에만 저장하고 출처를 기록한다. 이미 있는 reference는 재사용한다.

## 순서

1. 현재 cinematic 미제출 수정의 실제 재생·모바일·lint/type/build를 끝내고 기존 인계에 결과를 추가한다. 마지막 부분 수정 이전의 build를 최종 통과로 재사용하지 않는다.
2. hardware-leg-mount-002.json, 사용자4장과 공식영상 https://www.youtube.com/watch?v=y_6rMHwOIzo&t=6s 를 확인한다. 다리 topic을 panel connector/back-panel과 분리한다.
3. 원본 자료 안내를 먼저 연결한다. 분리 순서는 중앙 은색핀 누름→누른 상태로 장착판/다리 슬라이드→나사머리가 큰 입구와 맞으면 판에서 분리. 판재에3나사와 핀이 남는 것을 보여준다. 정확한 이동거리/타공치수는 미확정이다.
4. HW의 LEG-VISUAL-READY를 소비해 같은 원본 다리 그룹을 사용한다. 핀·나사는 고정, 장착판과 몸통은 일체로 이동한다. 아직 계약이 없으면 원본 안내·topic·순수 단계 상태/카메라/입력 검증을 먼저 구현한다. 추정 치수로 자체 하드웨어를 복제하지 않는다.
5. 조립 순서는 실제 영상에 확인된 범위와 분리의 역순 추정을 구분한다. 잠금 전 완료 표시 금지. 패널 클립 색상 대응이나 OVVO15mm를 다리에 적용하지 않는다. unknown 값을 출고 타공지시로 표시하지 않는다.

## 완료 기준

| 사례 | 기대 |
|---|---|
| R3-ASM-01 | 기존3 topic/연속재생/따라조립/속도/모바일 회귀 없음 |
| R3-ASM-02 | 다리 원본 자료와 출처가 실제 화면에서 열림 |
| R3-ASM-03 | 0/50/100%에서 나사3개·핀 위치 고정, plate+rod 일체 이동 |
| R3-ASM-04 | 핀 해제 전 분리 완료 불가, 이동 방향/unknown거리 구분 |
| R3-ASM-05 | 390px/desktop, 재생 중 topic 전환·seek·일시정지에서 초기화/카메라 정상 |
| R3-ASM-06 | HW 담당과 같은 앵커/단위/재질 소유권 대조, 중복 모델 없음 |

LEG-GUIDE-READY에 실제 URL·캡처·검증을 남긴다. 실제 고객 주문 전체 조립 안내는 아직 별도 범위이며 예제1개로 완료 보고하지 않는다.

## 공통 실행 규칙

- [R3 전체 배정](../../dispatch-r3.md)을 먼저 읽고 AGENTS.md/CLAUDE.md 및 docs/team-tasks.md의 현재 잠금을 확인한다. 본인 기존 handoff에 R3 수신·시각·실제 세션·착수 파일을 추가한다. 완료된 R2.1 증거는 지우지 않는다.
- 이 지시서의 허용 파일만 수정한다. 다른 담당 파일은 읽고 변경 요청을 남긴다. 미완료 선행 작업이 있어도 아래 독립 작업은 바로 진행한다.
- 구현, 운영 연결, 레퍼런스 일치, 제조 치수 확정을 각각 판정한다. 미측정 값은 null/unknown으로 남긴다. 추정 시연값을 CNC 타공값으로 넘기지 않는다.
- UI는 Befun 브랜드·기존 버튼/서체/간격을 유지한다. 공유 개발 서버 종료·공유 .next 삭제·타 작업 롤백 금지. 브라우저 검증은 기존 VPN Chrome에서 담당 탭만 사용한다. 남의 탭·전역 viewport를 변경하지 않는다.
- 변경 범위 검사와 lint/type/build 결과를 기록한다. build는 격리 경로에서 실행하고, 소스 fingerprint/시각을 남긴다. 과거 통과를 이번 통과로 적지 않는다.
- 결과는 본인 handoff에 `사례 ID / 입력·초기상태 / 조작 / 기대 / 실제 / pass·fail·unknown·blocked / 증거 경로 / 수정 파일 / READY export 또는 URL / 남은 항목 / 해제 잠금`으로 제출한다. READY를 게시한 뒤 리더 확인을 기다리는 동안 남은 독립 검증을 진행한다.
