# 리더 — 공통 상태·제품 생성·실제 통합 / R2.1-CORE

## 책임과 현재 부족한 것

UI·하드웨어·갤러리·조립 담당의 단품은 상당 부분 끝났으나 실제 상태/생성기/배치/저장 계약이 없어 연결이 멈췄다. 이 병목은 리더 책임이다. 아래 각 산출물은 **계획이며 현재 구현 완료가 아니다**. 문서만 게시하고 READY라고 표시하지 않는다.

## CORE-01 · 설계별 접합 상태와 저장 계약 — 첫 우선순위

현재 optimizer의 `befun-optimizer-connectors`는 브라우저 전역 설정이다. `optimizer/befun/session.ts::readCurrentDesign`, 상품/standalone snapshot, savedDesign parser, sharing URL/공유 복구에서 접합 선택이 빠진다. 다른 설계에 이전 선택이 남는 문제가 있다.

1. 실제 타입/검증/직렬화/복구 모듈을 만든다. `src/types/connectors.ts`의 두 시스템 ID를 재사용하고, 공급사 미확정 규격 버전을 만들어 넣지 않는다. 앱 저장 스키마 버전과 제조 규격 버전은 별개다.
2. 명시적 설계 값과 기존 optimizer 전역 선호를 분리한다. 새 설계/공유 설계에서 어떤 값을 우선하는지 함수 하나로 정하고 검사한다. 누락된 옛 고객 설계는 unknown이며 확인된 OVVO 설치라고 간주하지 않는다.
3. snapshot/restore를 여러 UI에서 다시 구현하지 않도록 단일 실제 함수를 게시한다. restore 실패 시 일부 store만 바뀌지 않도록 입력 검증 후 적용한다. tab/hover/카메라 같은 UI 상태는 설계 데이터에 섞지 않는다.
4. 저장 담당에게 실제 export/signature·legacy 처리 예제·오류 결과·테스트 fixture를 인계한다. storefront 8진입점 연결은 이 시점부터 진행한다.
5. optimizer는 복구된 설계 값을 사용하고 접합 전환 시 `reapplyConnectorSelection` 경로를 유지한다. 사용자 가공 보존 수정이 재생성으로 되돌아가지 않게 한다.

**CORE-01-READY 조건:** 실제 모듈 import 가능, OVVO/clip/legacy unknown/지원하지 않는 버전의 왕복 검사, 설계A→B→A 오염 검사 통과. 문서상의 함수 이름만으로 READY 아님.

## CORE-02 · 실제 옵션 패널 연결

1. R2.1-UI의 행 수/스타일 shared handler와 실제 store 컴포넌트를 리뷰한다. setHeight가 행 수 동작을 대신하지 않는지, 원본 UI와 새 UI가 동일 결과인지 확인한다.
2. 운영 page/모바일 레이아웃 소유자의 변경을 읽고 실제 여섯 제어만 교체한다. 색상·가격·AR·갤러리와 행 개별 편집은 보존한다. 같은 기능의 UI가 중복으로 떠 있지 않게 한다.
3. 스타일 전환의 기존 resetHardware와 사용자 요청의 보존 기대 차이를 별도 사례로 조사한다. 새 UI 한쪽만 무조건 preserve로 바꾸지 않는다.
4. UI-11/12 타입 변경 필요성을 처리할 때 공통 타입은 리더가 한 번 수정하고 소비자에게 인계한다. 미리보기 주석을 운영 지원 상태로 승격하지 않는다.

**완료:** 실제 페이지에서 입력→store→3D→치수/가격 표시가 같은 설계를 가리키고, 모바일/기존 진입도 회귀 통과. 어댑터 단독 검사와 구분한다.

## CORE-03 · 제품군 registry와 옷장 실제 생성

### 시작 기준과 조사

- Edge: `wardrobe.md`와 category-wardrobe-edge-001~005, 기본118×198×60cm, Cabinet/type4.
- Tone: category-wardrobe-tone-001~009, 기본100×200×53cm, Wardrobe/type3.
- 기존 파일의 API 타입 번호를 Befun category와 동일시하지 않는다. category/family/generator/panelProfile/preset을 분리한다.
- 초기 preset과 표시값만으로 내부 치수·판 두께·단 추가 공식을 확정하지 않는다. 기존 VPN Chrome에서 한 옵션씩 바꾸어 부족한 구조 정보를 확보한다.

### 구현 순서

1. registry 각 항목에 조사된 상태와 실제 구현 지원 상태를 분리한다. 미지원 제품을 기존 선반 preset으로 자동 대체하지 않는다.
2. Edge와 Tone 상태를 별개로 정의한다. 구획은 안정 ID를 갖고 전역/구획 옵션을 나눈다. 기존 case의 초기 상태를 테스트 입력으로 사용하되 하나의 화면 좌표를 생성식으로 박아 넣지 않는다.
3. **Edge부터 세로 슬라이스:** 초기 구조→구획 선택→front open/closed→문 방향→구획 깊이/내부 배치 순으로 생성기와 실제 3D를 연결한다. 구조식이 미확정인 항목은 활성화하지 않고 원본 추가 조사로 해소한다.
4. **Tone 다음:** 높이200/237/높이+238와 Standard237 복귀, 내부/외부 서랍에 따른 전면 구조 변화, 외부/내부 재질 분리, 조명 상태를 연결한다. 서랍 외부 옵션을 z위치 변경 하나로 대체하지 않는다.
5. 원본과 다른 변경 순서·값 복귀·새로고침·다른 초기 디자인을 확인하여 숨은 상태 영향을 기록한다. 특히 구획 수/높이 경계 전후를 확인한다.

**옷장 중간 완료 조건:** Edge와 Tone 각각 최소 한 개의 실제 편집 경로가 UI→생성→저장복구→재생성까지 이어지고 판재/문/서랍 대응을 QA가 확인. 전체 옷장 완료는 나머지 기능까지 검증한 뒤다.

## CORE-04 · 판재 분절·다리·패널 접합과 가공의 단일 계획

1. 원본 접합/분절 규칙의 근거 사례를 판재 ID와 연결한다. 긴 가로판을 외형에서만 나누고 optimizer 분해도에는 통판을 남기지 않는다.
2. 아래 세로판의 지지점과 조절발/다리 배치를 같은 기하에서 계산한다. 사용자 제시 다리 브래킷/핀 해제와 panel clip은 별개 부품이다. 다리 총길이22.5mm를 노출22.5mm로 바로 치환하지 않는다.
3. HW-REQ-04의 `{clipOrigin,clipAxisX,clipNormalZ,pinPanelId,color,dims}`에 실제 joint 위치를 전달한다. 축 handedness와 mm↔cm 변환을 확인한다. 단품 설명용 치수는 제조 타공 규격으로 쓰지 않는다.
4. OVVO는 HW의 시각 모델과 가공 규격을 구분하면서 같은 joint ID/앵커를 소비한다. optimizer 메시의 단순 capsule과 실제 cutter profile 차이를 기록·교정한다.
5. OVVO-AUDIT-005의 품번별 근거 없는 자동 가공을 재검토한다. 상태가 바뀌면 ConnectorBar의 선택 가능 여부·차단 사유와 실제 exporter를 함께 맞춘다.

**완료:** 동일 사례에서 Shelf/분해도/조립/CNC 판재 ID·분절·접합점 대응. 제조 미확정은 계속 차단. 실제 시각 비교와 구조 검사를 따로 기록한다.

## 교차 점검 시점과 소유권

- HW-CONTRACT-READY 때: 축/치수 근거/소비 API 검토. ASM 연결 뒤 같은 joint를 다시 확인한다.
- UI-STORE-CONNECTED 때: 기존 handler 대비 높이/스타일/depth 효과 검토 후 운영 마운트.
- SAVE-FLOW-READY 때: 서버/로컬 결과·공유 오류 구분 검토. 그 담당이 공유 page 잠금을 해제한 뒤 정상 복구 수정 시작.
- 각 CORE READY 때: QA에 정확한 입력·테스트 명령·변경 파일·남은 unknown을 제공한다. fail이면 동일 사례 수정 후 재검증한다.

리더는 types/stores/공통 furniture·sharing/생성기/Shelf/배치/CNC/운영 통합 소유자다. R2.1-SAVE의 db/designAPI와 오류 UI, UI의 좁은 handler 추출, HW/ASM 모듈은 동시에 편집하지 않는다. 다른 담당이 올린 완료 보고를 사용자에게 전달하기 전에 실제 import/화면 연결/검사 증거를 확인한다.
