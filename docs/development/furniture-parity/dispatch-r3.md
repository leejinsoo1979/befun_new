# R3 — 장다리 연결 후 즉시 실행할 후속 배정

> **사용자 추가 요구(2026-10-14): Classic/Natural도 Legs 허용, 실버 메탈/블랙 선택.** 리더가 `legFinish: silver | black`(기본 silver)을 store·3D·저장/공유에 연결했습니다. R3의 Classic/Natural 무효 Legs 사례는 철회하며 재질만 바꾸면 Legs를 유지합니다. 깊이24/Pixel 제약은 유지합니다. 리더의 해당 필드 잠금은 해제됐습니다. 이후 UI/SAVE 작업에서 legFinish와 이 지원 규칙을 보존하세요.


게시: 2026-10-14. 사용자의 “애들 니 지시 기다리잖아”에 따른 후속 지시다. **담당/우선순위/파일 소유권은 R3가 R2.1보다 우선한다.** 기존 관찰·테스트·인계는 보존한다. 사용자가 각 작업자에게 직접 내린 더 최신 지시는 먼저 반영하고 충돌을 기록한다.

## 최신 상태를 반영한 변경

- OVVO R2.1 단품 교정 및 조립 import는 완료 범위를 재사용한다.
- LegacyShelfPanel 실제 store 연결은 완료, 운영 마운트는 미완료였다. **이번에는 UI 담당에게 마운트까지 위임**한다.
- Standard/Legs·높이·로컬 원본 모델·baseType 저장은 1차 구현됐다. 제품별 완전 일치와 정밀 타공은 미완료다.
- 기존 선반 configuration.ts는 이미 존재한다. 쇼핑몰 담당은 새 제품군 CORE 계약을 기다리며 기존 선반 작업까지 멈추지 않는다.
- 실제 사용자 판재 소실 QA-R2-B01은 리더 책임이다. QA에게 제품 코드를 고치라고 하지 않는다.
- DB 미설정은 실제 DB 왕복만 차단한다. 다른 작업 전체의 선행 조건이 아니다.

## 왼쪽부터 실행 지시

창 위치는 마지막 사용자 화면 기준이다. 재배치됐다면 역할 이름으로 확인한다. 기본 네 작업자+리더=5명, 별도 조립 담당 포함 현재6명이다.

| 위치 | 역할 | 개별 지시서 | 산출물 |
|---|---|---|---|
| 왼쪽1 | Claude 하드웨어 | [01-hardware](assignments/r3/01-hardware.md) | 원본 장다리·체결부 공용 표시 계약 |
| 왼쪽2 | Claude UI | [02-ui](assignments/r3/02-ui.md) | 높이/Feet 동기화 및 운영 패널 직접 마운트 |
| 왼쪽3 | Codex 쇼핑몰 | [03-storefront](assignments/r3/03-storefront.md) | 기존 선반 저장·공유·baseType 복구 누락 수정 |
| 왼쪽4 | Codex QA | [04-qa](assignments/r3/04-qa.md) | 장다리/운영 UI/저장 독립 검증 및 CNC 원본 재검증 |
| 추가 왼쪽5 | Codex 조립 | [05-assembly](assignments/r3/05-assembly.md) | 기존 연출 마무리와 다리 전용 조립·분리 안내 |
| 현재 대화 | 리더 | [00-leader](assignments/r3/00-leader.md) | CNC 사용자 가공 손실·생성 규칙·제품군/옷장 통합 |

## 그대로 전달할 문장

**왼쪽1 · Claude 하드웨어**

> `docs/development/furniture-parity/assignments/r3/01-hardware.md`를 읽고 R3를 착수하세요. 원본 장다리·체결부 공용 표시 계약이 이번 임무입니다. 기존 인계에 수신·파일 잠금을 기록하고, 명시된 허용 파일을 직접 수정해 검증까지 진행하세요. 리더 선행 작업이 없는 독립 단계부터 시작하고, 완료한 R2.1 일을 반복하지 마세요.

**왼쪽2 · Claude UI**

> `docs/development/furniture-parity/assignments/r3/02-ui.md`를 읽고 R3를 착수하세요. 높이/Feet 동기화 및 운영 패널 직접 마운트이 이번 임무입니다. 기존 인계에 수신·파일 잠금을 기록하고, 명시된 허용 파일을 직접 수정해 검증까지 진행하세요. 리더 선행 작업이 없는 독립 단계부터 시작하고, 완료한 R2.1 일을 반복하지 마세요.

**왼쪽3 · Codex 쇼핑몰**

> `docs/development/furniture-parity/assignments/r3/03-storefront.md`를 읽고 R3를 착수하세요. 기존 선반 저장·공유·baseType 복구 누락 수정이 이번 임무입니다. 기존 인계에 수신·파일 잠금을 기록하고, 명시된 허용 파일을 직접 수정해 검증까지 진행하세요. 리더 선행 작업이 없는 독립 단계부터 시작하고, 완료한 R2.1 일을 반복하지 마세요.

**왼쪽4 · Codex QA**

> `docs/development/furniture-parity/assignments/r3/04-qa.md`를 읽고 R3를 착수하세요. 장다리/운영 UI/저장 독립 검증 및 CNC 원본 재검증이 이번 임무입니다. 기존 인계에 수신·파일 잠금을 기록하고, 명시된 허용 파일을 직접 수정해 검증까지 진행하세요. 리더 선행 작업이 없는 독립 단계부터 시작하고, 완료한 R2.1 일을 반복하지 마세요.

**추가 왼쪽5 · Codex 조립**

> `docs/development/furniture-parity/assignments/r3/05-assembly.md`를 읽고 R3를 착수하세요. 기존 연출 마무리와 다리 전용 조립·분리 안내이 이번 임무입니다. 기존 인계에 수신·파일 잠금을 기록하고, 명시된 허용 파일을 직접 수정해 검증까지 진행하세요. 리더 선행 작업이 없는 독립 단계부터 시작하고, 완료한 R2.1 일을 반복하지 마세요.

## 연결 순서와 충돌 방지

| 생산자 | READY | 소비자 | 기다리지 않고 진행할 범위 |
|---|---|---|---|
| HW | LEG-VISUAL-READY | ASM/리더 | ASM은 원본 자료·topic·단계 상태·기존 연출 검증 |
| UI | UI-LIVE-READY | QA/리더 | UI 실제 마운트는 추가 리더 승인 없이 진행 |
| SAVE | SAVE-BASE-READY / SAVE-CONSUMER-PATCH | QA/리더 | 기존 저장 유틸·복구 검증, DB만 별도 blocked |
| 리더 | CNC-PRESERVE-READY | QA | QA 장다리/저장/UI 선행 검증 |
| ASM | LEG-GUIDE-READY | HW/QA/리더 | HW는 원본 앵커·소유권·단위 검사 |

ProductConfigurator.tsx와 app/configurator/page.tsx는 UI의 마운트 영역만 허용한다. SAVE는 해당 파일을 수정하지 않고 소비자 patch를 제시한다. 리더가 UI 잠금 해제 후 반영한다. configuration.ts/savedDesign.ts/sharing/share page는 SAVE 단독 담당, 공통 store/타입/CNC는 리더 단독 담당이다. HW와 ASM은 별도 외형을 만들지 않고 공개 계약으로 연결한다.

## 상태 기록

문서 게시와 실제 전달·수신·구현은 별도다. 배정 시점에는 R3 수신 미확인. 작업자는 본인 handoff에 수신/착수/READY/완료/남은 항목을 남긴다. 리더의 전달 결과는 team-tasks에 추가한다. 기존 증거는 삭제하지 않으며 완료된 갤러리·OVVO를 재작업 대상으로 되돌리지 않는다.
