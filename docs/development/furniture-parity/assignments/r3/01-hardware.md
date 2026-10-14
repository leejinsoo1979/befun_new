# R3-HW — 왼쪽1 Claude 하드웨어·그래픽

## 목표와 현재 기준

OVVO PH/RH/PC/RC의 R2.1 결과와 조립 화면 연결은 보존한다. 다음 일은 **장다리 원본 모델과 실제 체결 구조의 공용 표시 계약**이다. 실제 Shelf에는 리더가 Standard/Legs와 로컬 long-leg.glb를 이미 연결했다. 새로운 임의 다리로 다시 교체하지 않는다.

근거: docs/tylko-reference/hardware-leg-placement-001.md, cases/hardware-leg-mount-002.json, screenshots/hardware-leg-mount-002-user-{1,2,3,4}.png. 사용자 영상은 https://www.youtube.com/watch?v=y_6rMHwOIzo&t=6s . 사진에서 보이는 나사3개+중앙 은색 핀은 판재에 남고, 장착판과 원통 다리가 함께 분리된다.

## 소유 파일

- 수정: src/components/three/furniture-hardware/**, docs/handoffs/claude-2-hardware.md, docs/handoffs/claude-2-hardware-assets/r3-legs/**.
- 읽기 전용: public/models/furniture/long-leg.glb, src/components/three/FurnitureLegs.tsx, src/lib/three/furniture-base.ts, Shelf.tsx, materials.ts, assembly-guide/**, stores/**, CNC 관련 소스.
- 기존 materials.ts 담당권은 유지하되 이번 작업에서 재질/조명 수정은 하지 않는다. 원본 GLB는 덮어쓰지 않는다.

## 바로 할 일

1. observedHardware.ts의 ‘사선 다리’ 해석을 실제 straight cylindrical shaft로 정정한다. 넓은 bbox는 장착판이며 기존 원본 node135°·scale·bounds는 근거 없이 바꾸지 않는다.
2. 원본 GLB 노드·mesh 구성과 좌표를 조사하고 몸통/장착판이 한 rigid group인지 기록한다. import 가능한 표시 어댑터를 furniture-hardware/legs 아래에 만들되 형상 복제/비균일 늘이기는 금지한다. 단위·장착면 법선·원점·접지점·기본회전·재질 소유권을 명시한다.
3. 사진으로 확실한 `moving: leg+plate`, `fixed: 3 screws+central pin` 분류를 공용 계약으로 게시한다. 나사 위치·핀 돌출·열쇠구멍 치수가 원본 asset에 없으면 unknown이다. 설명용 표현이 필요하면 별도 illustrative props로 격리하고 제조 export를 제공하지 않는다.
4. 조립 담당에게 LEG-VISUAL-READY를 본인 handoff와 team-tasks에 게시한다. 원본 노드가 분리되지 않는다면 그 사실과 전체 rigid group 사용법을 제공한다. 움직이지 않아야 할 나사까지 GLB에 포함됐는지 반드시 확인한다.
5. ShortLeg/PlaneLeg/Handle30 기존 단품의 운영 연결 미완료 항목도 표로 정리한다. 관입 깊이·손잡이 판 두께 근거 없는 값은 이번 장다리 값으로 대체하지 않는다.

## 완료 기준

| 사례 | 검사 |
|---|---|
| R3-HW-01 | 원본 대비 전체/측면/장착판 확대 캡처. rod가 곧고 plate 회전/크기가 유지됨 |
| R3-HW-02 | mm↔cm 변환이 한 번만 적용됨. 원본 높이와 렌더 높이 비교 |
| R3-HW-03 | fixed/moving 목록과 unknown 치수 분리, ASM이 import할 실제 경로·예시 |
| R3-HW-04 | 반복 mount/unmount에서 공유 GLB geometry/material을 잘못 dispose하지 않음 |
| R3-HW-05 | ASM 연결 후 양쪽 담당이 같은 앵커/회전/단위를 쓰는지 확인 |

HW-01~04는 리더/CNC/DB를 기다릴 필요가 없다. 05만 ASM 연결 뒤 수행한다.

## 공통 실행 규칙

- [R3 전체 배정](../../dispatch-r3.md)을 먼저 읽고 AGENTS.md/CLAUDE.md 및 docs/team-tasks.md의 현재 잠금을 확인한다. 본인 기존 handoff에 R3 수신·시각·실제 세션·착수 파일을 추가한다. 완료된 R2.1 증거는 지우지 않는다.
- 이 지시서의 허용 파일만 수정한다. 다른 담당 파일은 읽고 변경 요청을 남긴다. 미완료 선행 작업이 있어도 아래 독립 작업은 바로 진행한다.
- 구현, 운영 연결, 레퍼런스 일치, 제조 치수 확정을 각각 판정한다. 미측정 값은 null/unknown으로 남긴다. 추정 시연값을 CNC 타공값으로 넘기지 않는다.
- UI는 Befun 브랜드·기존 버튼/서체/간격을 유지한다. 공유 개발 서버 종료·공유 .next 삭제·타 작업 롤백 금지. 브라우저 검증은 기존 VPN Chrome에서 담당 탭만 사용한다. 남의 탭·전역 viewport를 변경하지 않는다.
- 변경 범위 검사와 lint/type/build 결과를 기록한다. build는 격리 경로에서 실행하고, 소스 fingerprint/시각을 남긴다. 과거 통과를 이번 통과로 적지 않는다.
- 결과는 본인 handoff에 `사례 ID / 입력·초기상태 / 조작 / 기대 / 실제 / pass·fail·unknown·blocked / 증거 경로 / 수정 파일 / READY export 또는 URL / 남은 항목 / 해제 잠금`으로 제출한다. READY를 게시한 뒤 리더 확인을 기다리는 동안 남은 독립 검증을 진행한다.
