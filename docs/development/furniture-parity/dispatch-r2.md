# R2.1 — 실제 연결까지 끝내기 위한 담당별 실행 지시

2026-10-14 사용자 ‘지시서 성의없다’ 피드백 반영. **이번 개별 지시서가 이전 R2/R1 지시보다 우선한다.** 이전 R2는 [초안 보관본](dispatch-r2-initial.md)으로 남겼다. 게시 상태이며 수신·착수는 각 작업자의 handoff에서 확인한다.

## 먼저 바로잡은 내용

- 높이 입력은 setHeight 직접 호출이 아니라 행 수→행 높이/판 두께 합산이다. 기존 handler를 공유하도록 UI 지시를 수정했다.
- 기존 StyleSelector는 하드웨어를 reset한다. 새 패널에서만 이를 생략하면 동작이 달라진다. 현재 동작 통일과 이후 레퍼런스 보존 규칙 교정을 분리했다.
- 저장 오류를 db.ts 한 줄 수정으로 끝내지 않는다. 서버 응답 분류와 상품의 로컬 fallback, 공유 페이지의404/503 구분까지 같은 담당에게 위임했다.
- OVVO 외형은 하드웨어 담당 한 명이 만들고 조립 담당이 소비한다. 둘이 별도 치수/모델을 만들지 않는다.
- 공통 상태·옷장 생성·실제 배치의 선행 산출물은 리더 책임으로 구체화했다. 문서 게시를 구현 READY로 표시하지 않는다.

## 화면 왼쪽부터 한 개씩 전달

마지막 사용자 화면 기준이다. 창을 옮겼다면 역할과 세션명을 확인한다. 기본 네 작업자+리더=5명, 별도 조립 담당 포함 현재6명이다.

| 위치 | 담당 / 세션 | 읽고 실행할 개별 지시 | 이번 실제 산출물 |
|---|---|---|---|
| 왼쪽1 | Claude 하드웨어 / claude-graphics | [01-hardware](assignments/01-hardware.md) | PH/RH/PC/RC 교정 모듈·좌표 계약·조립 연결 대조 |
| 왼쪽2 | Claude UI / 이전 claude-optimizer | [02-ui](assignments/02-ui.md) | 실제 store 연결 패널·기존 행수/스타일 handler 공유 |
| 왼쪽3 | Codex 쇼핑몰 | [03-storefront](assignments/03-storefront.md) | DB 초기화 수정·서버/로컬 저장·공유 오류 흐름 |
| 왼쪽4 | Codex 독립 QA | [04-qa](assignments/04-qa.md) | 리더2결함 독립 재검증·다른 산출물 브라우저 교차 확인 |
| 추가 왼쪽5 | Codex 조립 안내 | [05-assembly](assignments/05-assembly.md) | 공유 OVVO 모델 연결·P/R 맞물림/시퀀스 교정 |
| 현재 대화 | 리더 codex-analysis | [00-leader](assignments/00-leader.md) | 공통 저장 계약·옷장 생성·실제 패널/배치/CNC 통합 |

## 각 창에 붙여넣을 실행문

### 왼쪽1

> `docs/development/furniture-parity/assignments/01-hardware.md`의 R2.1-HW를 실행하세요. AGENTS/CLAUDE/team-tasks를 먼저 확인하고 본인 handoff에 수신·파일 잠금을 기록하세요. 공식 PDF를 부품별로 대조해 PH/RH/PC/RC를 교정하고, import 가능한 모듈/축/앵커 계약을 먼저 게시한 뒤 조립 화면 연결까지 확인하세요. 기존 단품 완료 보고나 설명용 문구 추가로 끝내지 말고, 지시서의 HW-01~05 증거를 제출하세요.

### 왼쪽2

> `docs/development/furniture-parity/assignments/02-ui.md`의 R2.1-UI를 실행하세요. 이전 R2의 setHeight 지시는 철회됐습니다. 현재 DimensionPanel의 행 수 계산과 StyleSelector의 효과를 shared handler로 추출해 기존 UI/새 패널이 같은 결과를 내도록 하세요. 이번 위임은 지정 handler 영역뿐입니다. 실제 store 연결·외부값 반영·UI-R2-01~08을 검증하고 리더가 바로 마운트할 import와 교체 범위를 인계하세요. 옷장 fixture를 운영 생성기로 취급하지 마세요.

### 왼쪽3

> `docs/development/furniture-parity/assignments/03-storefront.md`의 R2.1-SAVE를 실행하세요. ENTRY-SAVE-004 조사에서 멈추지 말고 db/design API와 상품 saveDesign·공유 페이지 오류 표시까지 지정 범위를 수정하세요. 오류 code/HTTP 계약을 따르고 서버 저장과 로컬 보관을 구별하세요. 실제 DB 왕복과 mock 검증을 나눠 보고하세요. 공유 페이지 정상 config 복구는 건드리지 말고 이번 잠금 해제 시 리더에게 알리세요.

### 왼쪽4

> `docs/development/furniture-parity/assignments/04-qa.md`의 R2.1-QA를 실행하세요. QA-L4-04/08 원본 실패 사례로 리더 수정본을 독립 재검증하고 실제 Chrome에서 사용자 가공 보존과 제조 출력 차단을 확인하세요. 이후 HW/UI/SAVE/ASM의 READY 산출물을 같은 사례로 교차 검증하세요. 제품 소스와 실패 기준은 바꾸지 말고 재현·코드 fingerprint·판정·캡처를 남기세요.

### 추가 왼쪽5

> `docs/development/furniture-parity/assignments/05-assembly.md`의 R2.1-ASM을 실행하세요. 현재 OVVO 잘못된 외형/홈/맞물림을 실제 교정하는 작업입니다. 먼저 기존 장면을 재현하고 P/R 동작·15mm 표기의 용도를 공식 도면과 대조하세요. HW-CONTRACT-READY가 올라오면 그 모델을 GuideScene에 연결하고 임의 Housing/Connector를 교체하세요. Tylko5단계는 보존하며 ASM-01~07을 제출하세요.

## 진행 순서와 연결 약속

| 먼저 나와야 하는 것 | 생산자 | 다음 작업자 | 기다리는 동안 할 일 |
|---|---|---|---|
| HW-CONTRACT-READY: 실제 import·mm축·앵커·부품 변환 | HW | ASM/리더/QA | ASM은 기존 문제 캡처·공식 동작 대조·pose 분리 |
| UI-STORE-CONNECTED: 실제 store 컴포넌트·공유 handler | UI | 리더/QA | UI 자체 실제 store 회귀·모바일 검사 |
| SAVE-FLOW-READY: API/화면 오류 흐름 및 공유 page 잠금 해제 | SAVE | 리더/QA | DB 없으면 mock/503/화면까지 완료, 실제 DB 왕복만 blocked |
| CORE-01-READY: 공통 저장/복구 실제 모듈 | 리더 | SAVE/QA | SAVE는 위 서버/화면 오류 작업 진행 |
| ASM-CONNECTED: 실제 공유모델 연결 화면 | ASM | HW/QA/리더 | HW는 단면/방향/치수 근거 검증 |
| CORE-WARDROBE-READY: 옷장 실제 생성 연결 | 리더 | UI/QA | UI는 기존 선반 연결 완료, 옷장 preview는 그대로 보존 |

READY는 구현 산출물/검사/실제 경로가 함께 게시됐다는 뜻이다. 요청 문서만 생겼거나 함수 이름만 적었다면 READY가 아니다. 수신·착수 자동 통신이 확인되지 않았으므로 각 handoff에서 기록하고 사용자 전달 방식을 유지한다.

## 통합 완료 보고 형식

각 담당자는 아래를 본인 handoff에 추가한다. 미리보기/구현/운영 연결/레퍼런스 검증을 하나의 ‘완료’로 합치지 않는다.

```text
R2.1 작업 ID / 실제 세션 / 수신·착수 시각:
수정 파일과 담당 경계:
지시서 사례 ID별 결과(pass/fail/unknown/blocked):
실제 연결 경로·화면 URL·호출 export:
검사 명령·실행 결과·캡처 경로:
다음 담당에게 줄 READY 산출물:
남은 차이 및 근거가 필요한 값:
해제한 파일 잠금 / 계속 잡고 있는 파일:
```

가격·결제·브랜드 정책은 유지한다. 비밀정보는 기록하지 않는다. source 변경은 필요한 검사·lint·타입·격리 build로 검증하고 공유 dev/.next를 파괴하지 않는다. 동시 빌드로 다른 담당 산출물을 덮지 않는다. 리더는 각 READY에서 실제 코드/화면을 읽고 방향과 공통 경계를 재확인한다.
