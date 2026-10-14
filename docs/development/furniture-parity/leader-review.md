# 리더 중간 교차 검토

2026-10-13. 사용자 요청: 리더가 핵심 작업을 직접 맡고 다른 작업자의 결과를 중간에도 확인하여 방향을 조정한다. 이 문서는 공유 지시/검토 결과이며 각 작업자의 수신 확인을 뜻하지 않는다.

## 검토 시점과 완료 기준

- 첫 구현 초안: 단위·좌표·상태 소유권·근거 사례가 공통 계약과 맞는지 확인한다.
- 실제 연결 직전: props/공통 타입/생성 결과/저장 데이터/3D·조립·CNC 사이에서 정보가 누락되거나 중복 계산되지 않는지 리더가 확인한다.
- 완료 보고: 담당자의 검사 결과에 더해 리더가 같은 사례와 미사용 설정으로 독립 재현한다. 구조·외형·화면 조작을 별도로 기록한다.
- 방향 수정은 문제 파일·재현 근거·담당·수정 범위·재검증 조건을 명시한다. 활성 잠금 파일에 동시에 패치를 넣지 않는다. 담당자는 다음 단계 시작 전 최신 team-tasks와 이 문서를 확인한다.
- 제품군별 검증 범위를 넘어 전체 완료로 확대하지 않는다. 다른 대화의 실시간 자동 감시는 확인되지 않았으며 공유 문서/소스의 실제 변경을 근거로 상태를 판단한다.

## 1차 검토 — 현재 소스와 인계 기록

### CORE-REVIEW-001 — 리더 공통 상태 계약이 실제 연결의 선행 과제

- 확인: src/types/furniture.ts와 src/lib/furniture/** 부재. UI는 독립 preview 타입을 사용하고, storefront는 ENTRY-CONTRACT-001에 실제 공통 함수 게시를 요청했다.
- 담당: 리더. 다음 핵심 개발 우선순위를 공통 타입과 기존 cm 상태 어댑터, preset 적용/복구/직렬화 경계로 둔다. 실제 import 경로·signature·오류 결과와 호환 검증을 함께 게시한다.
- storefront는 제안한 가짜 카테고리 생성기를 만들지 않고 진입점 매핑을 계속한다. UI preview 타입을 여러 공유 파일로 복사하지 않는다.
- 상태: 선행 과제 확인, 아직 구현 완료 아님.

### VISUAL-REVIEW-001 — 긴 다리 회전 주석과 쿼터니언 불일치

- 파일: src/components/three/furniture-hardware/specs/observedHardware.ts의 long_leg.
- 기록: Y축45°와 quaternion(0,0.924,0,0.383)을 함께 표기. 기록된 쿼터니언 자체의 회전량은 2*atan2(0.924,0.383)=약134.97°이다. 메시의 원래 방향/상위 노드 보정과 합친 최종 방향은 이 값만으로 확정할 수 없다.
- 담당: Claude 하드웨어. 원본 노드/상위 변환/축과 단위를 다시 확인하고 mesh bounds와 world bounds를 분리해 기록한다. 45°를 임의로135°로 바꾸는 것만으로 검증 완료로 처리하지 않는다.
- 완료 기준: 출처·변환 체인·로컬/적용 후 bounds와 정면/측면 방향 확인. 확인 전 long_leg의 실제 배치 연결 보류. 확인된 short_leg/plane_leg 독립 작업은 계속 가능.

### UI-REVIEW-001 — 상태와 표시 경계 유지

- 확인: FurniturePanel은 props의 컨트롤 순서/구획 ID를 사용하고 intent를 전달한다. 기존 store를 직접 변경하지 않는 방향은 공통 계약과 맞는다.
- 담당: Claude UI. SliderInput의 드래그 중 draft 상태에 대해 pointer cancel, 외부에서 값 보정/거절, 제품군 교체, 선택 구획 교체 시 표시가 최신 view와 일치하는지 검증을 추가한다. 현재 결함 재현 완료가 아닌 통합 전 확인 요청이다.
- 알려지지 않은 step은 null로 보존하되 step=any 입력을 실제 허용 정밀도라고 확정하지 않는다. 가구 상태 적용 시 리더의 검증 결과가 권위값이다.

### QA-REVIEW-001 — 근거 검사와 구조 동치 판정 분리

- 확인: 현재 보고서는 scope를 Evidence audit로 명시하고 pass416/fail0/unknown322를 분리한다. fail0은 가구 구조 동치가 아니다.
- 담당: Codex 검증. 이 구분을 유지하고 공통 결과 타입 게시 후 구조 비교 어댑터를 연결한다. 미확인 좌표와 로딩 preview는 통과로 바꾸지 않는다.
- 리더 재실행: node --test scripts/furniture-validation/audit.test.mjs → 4개 통과.

### VISUAL-REVIEW-002 — 다리 단품 검증 결과의 범위

- 리더 재실행: node src/components/three/furniture-hardware/legs.test.mjs → short_leg/plane_leg 높이·외경·상부 앵커 검사 통과. Node 모듈 유형 경고만 발생.
- 검사는 생성 형상과 기록된 규격의 일치다. 원본 GLB 측정값의 정확성, 실제 가구에서의 발 개수/지지 판재 아래 배치까지 검증한 것이 아니다. 이 배치 통합 검증은 리더 담당이다.

## 현재 조율 상태

네 담당 모두 본인 handoff에 수신·착수를 기록한 것을 확인했다. 각 담당의 완료는 아직 확인하지 않았다. 이번 검토는 진행 중 소스에 대한 중간 검토이며, 타 작업자 소스를 덮어쓰지 않았다. 리더가 위 공통 계약 선행 과제를 우선 처리한다.

## 2차 중간점검 — 사용자 23:16 화면, 실제 소스와 독립 검사

판정: **독립 부품/preview 산출물은 있으나 신규 제품군 서비스 통합은 미완료.** 아래는 2026-10-13 23:16 이후 읽은 저장소 기준이다. 터미널의 “다 했다” 문장만으로 승인하지 않았다. 기존 전체 1,462개 검사를 이번에도 실행했다고 주장하지 않는다.

| 화면 위치/담당 | 실제 확인 | 판정/바로 할 작업 |
|---|---|---|
| 왼쪽1 Claude 하드웨어 | ShortLeg/PlaneLeg/FullHeightHandle30 구현, 단품 검사 재통과. 생성 부품의 앱 소비 import 없음 | 단품만 부분 승인. 아래 VISUAL-REVIEW-003 해결 후 통합 |
| 왼쪽2 Claude UI | 옷장2·기타8 profile preview, props→intent 경계. 실제 page/3D 소비 import 없음 | preview만 부분 승인. 공통 UI 타입으로 전환하고 아래 UI-REVIEW-002/003 보완 |
| 왼쪽3 Codex storefront | 진입8개와 초기모델34개 매핑·갤러리 재검증. family 선택은 기존 색상 대체 경로 | 조사 승인, 신규 제품군 연결 미완료. ENTRY-CONTRACT-001 리더 책임 |
| 왼쪽4 Codex QA | 독립 도구·내부 일관성·갤러리 검사 존재, reference/generated 비교 경계 구분 | 도구 승인. 실제 신규 제품군 동치 unknown 유지, 연결 후 재검증 |
| 추가 왼쪽5 Codex 조립 안내 | 사용자 화면 및 team-tasks의 codex-assembly 착수 기록. `/assembly-guide` 라우트 추가 중 | 기존 5인 배정과 별도 작업. 커넥터 공식 재구현 금지, 아래 ASSEMBLY-REVIEW-001 우선 |
| 리더(현재 대화) | 커넥터 검사 보강 구현. 공통 타입/적용 함수 지연으로 타 담당 연결 막힘 | 핵심 선행 작업 지연은 리더 책임. R1.3 UI 타입 게시, 상태·생성·복구 연결은 여전히 미완료 |

### 검증 근거

- `node --test scripts/connector-validation/connector.test.mjs scripts/furniture-validation/*.test.mjs src/components/three/furniture-hardware/legs.test.mjs src/components/three/furniture-hardware/handles.test.mjs`: **43 tests pass, fail0**. [실행 로그](checks/mid-review-002-tests.log). 이 수치는 커넥터11 + 독립검사30 + 하드웨어 파일2이며 43개 Tylko 동치 사례라는 뜻이 아니다.
- 커넥터 mating 좌표 검사는 6스타일×너비3×깊이3=54설정. CNC 반올림 경계만 검사하며 외부 레퍼런스 실측이 아니다.
- 변경 TypeScript/커넥터 파일 ESLint 통과. 현재 전체 `tsc --noEmit --incremental false`는 **실패**: `.next/dev/types/validator.ts`의 route 타입2건, `src/app/assembly-guide/page.tsx:2`의 부재한 AssemblyGuide import1건. [검사 로그](checks/mid-review-002-typecheck.log). 공유 `.next` 삭제나 서버 재시작으로 다른 작업을 방해하지 않았다.
- UI 담당의 33개 React 테스트는 `.tsx.txt` 보관본을 확인했으며 이번 리더 실행 환경에서는 재실행하지 않았다. 해당 33개를 독립 재통과로 기록하지 않는다.
- 자료 지문은 [mid-review-002-sources.json](checks/mid-review-002-sources.json). 병행 작업 중이므로 이후 수정이 이 판정을 대체할 수 있다.

### CORE-REVIEW-002 — 리더 선행 작업, P1

- 게시 완료: `src/types/furniture.ts`의 UI 경계(R1.3). 기존 preview와 필드 호환; UI 담당이 type re-export로 전환할 수 있다.
- 미완료: 공통 상태·registry·제품군 생성 결과·preset 적용/복구/직렬화. 파일 하나 게시했다고 ENTRY-CONTRACT-001 또는 옷장 생성기 완료로 바꾸지 않는다.
- 리더 후속 순서: 기존 선반 상태의 손실 없는 mm/legacy 어댑터·복구 경계 → 실제 지원 registry와 UI view/intent → 제품군별 구조를 하나씩 3D/CNC/저장에 연결. 검증되지 않은 모델은 기존 선반에 이름만 바꿔 연결하지 않는다.

### UI-REVIEW-002 — 임시 입력이 외부 상태보다 우선, P1 통합 전 수정

- 위치: `controls.tsx:56–86`, `NumberField:94–106`, `FurniturePanel.tsx`의 ControlView key.
- 소스 확인: draft는 pointerUp/blur/keyUp에서만 지워지고 pointerCancel 및 외부 값/범위 변경 시 무효화가 없다. NumberField의 text도 외부 값 변경과 분리된다. ControlView key는 controlId+sectionId만 포함해 제품 profile을 바꿀 때 같은 전역 controlId의 상태가 재사용될 수 있다.
- 재현 테스트 요청: width range change→pointerCancel(blur 없음)→새 view width/range 전달; 숫자 입력 중 profile A→B(같은 controlId/global)→blur; 거절/보정된 값을 view로 재전달. 결과 표시·후속 intent가 이전 제품 임시값을 쓰지 않아야 한다. 이는 소스에서 확인한 누락이며 브라우저 전체 재현 통과/실패 측정은 아직 아니다.
- 담당 Claude UI, 수정 범위 기존 furniture-panels 내부. scope/profile identity 변경 시 임시 상태 폐기, cancel 처리, 외부 권위값과의 동기화 정책을 구현·검증한다. 드래그 중 onChange로 이미 전송된 intent를 pointerCancel이 설계 취소까지 의미하는 것으로 임의 해석하지 않는다.

### UI-REVIEW-003 — 비활성 첫 옵션의 키보드 진입, P2

- `Choice`는 value가 null/미존재이면 index0에 tabIndex0을 지정한다. 이 옵션이 disabled이면 다른 enabled 라디오는 전부 tabIndex=-1이라 Tab으로 그룹에 들어갈 수 없다. 기존 테스트는 중간 disabled를 건너뛰는 경우만 확인했다.
- 담당 Claude UI: value=null 또는 선택값 disabled, 첫 옵션 disabled/나머지 enabled, 전체 disabled를 추가검사. 유효 선택 또는 첫 enabled 옵션에 진입점을 둔다. 미선택인데 선택된 것처럼 aria-checked를 바꾸지 않는다.

### VISUAL-REVIEW-003 — 관찰 수치와 설치 호환은 다름, P1 통합 전 확인

- VISUAL-REVIEW-001의 long_leg 45° 주석/약135° quaternion 불일치가 그대로다. 회전 체인 근거 확보 전 실제 배치 금지.
- short_leg 총22.5mm를 그대로 기존10mm 노출 높이로 대체하지 않는다. 스템의 판재 매입 깊이·노출 높이·바닥/앵커·실제 지지 판재 연결을 리더가 확정해야 한다.
- FullHeightHandle30 채널16.7mm와 기록상 문19mm의 체결 관계는 미확인이다. 좌우 미러만으로 바로 Door에 연결하면 간섭 가능성이 있다. 30/50 단면 사용처, 문 모서리 가공 여부, 정면 축을 그래픽 담당이 관찰하고 리더가 장착 규칙을 확정한다.
- 기존 솔리드 재질 요청 재검토: Shelf의 REFERENCE_COLORS 분기는 현재 createColorMaterials 결과를 그대로 쓴다. 남은 roughness0.7/env0.78은 Classic 분기다. 이를 같은 원인으로 잘못 제거하지 않는다. 환경광 변경 금지는 유지.

### ASSEMBLY-REVIEW-001 — 현재 빌드 경로·접합 데이터, P1

- 2차 점검 시 `/assembly-guide/page.tsx`가 불러오는 `components/assembly-guide/AssemblyGuide`가 없다. 아직 진행 중인 작업의 스냅샷이며 영구 결함이라고 단정하지 않는다. 담당은 컴포넌트 게시 후 TypeScript/build 재검증 결과를 인계한다.
- 조립 단계의 접합점은 리더 `ConnectorReport`의 panel IDs/positions와 manufacturingBoring에서 가져올 것. 화면 편의상 별도 임의 커넥터 좌표를 만들거나 충돌 차단된 판재를 “체결 완료”로 확정하지 않는다. 형상 미확정이면 예시라고 표시한다.
- ViewToolbar는 별도 도구 메뉴 정리 작업과 연결 파일이 겹친다(team-tasks 후속 기록). 조립 담당은 신규 컴포넌트/경로를 제공하고, **현재 보기 메뉴 수정 담당**이 ViewToolbar 진입 링크를 통합한다. 두 담당 모두 같은 파일을 동시에 쓰지 않는다. 수신 확인은 각자 기록한다.

### CONNECTOR-REVIEW-001 — 이번 수정의 완료 범위와 잔여, P1

- 간격 제약·양면 슬롯 충돌·기존 보링 보존·두께 불일치 차단은 코드와 검사로 확인. [상세 인계](../../panel-connector-validation.md).
- 실제 충돌 사례는 감지·제조 출력 차단 상태다. 자동 재배치가 구현됐다는 뜻이 아니다. 메인 Shelf는 Blum holes만 소비하며 패널 커넥터 가공은 아직 연결되지 않았다.
- Tylko 고유 커넥터 위치, 옷장 접합, 동일평면 가로판 이음, edge-face 가공 충돌·CIX 슬롯·기계별 공구/좌표계 검증은 미완료. “완벽한 타공”으로 승인할 수 없다.

### QA 후속 요청

- 리더/UI 수정 후 UI 재현 3종, 하드웨어 설치 앵커, preset→store→3D→CNC→공유 복구를 제품군별로 재검증한다.
- QA-001 서버 저장과 QA-002 미저장 새로고침은 각각 실패/정책 미확정 상태를 유지한다. 로컬 공유 통과로 서버 저장까지 통과 처리하지 않는다.
- 같은 옵션의 Tylko 구조 비교는 실측 reference/generated 쌍을 받은 후 진행한다. 28개 preset 메타데이터만으로 가려진 내부 구조까지 pass 처리하지 않는다.


## 3차 중간점검 — 2026-10-14 사용자 05:36 화면

### 판단

담당자들의 단품/미리보기 완료와 실제 서비스 통합 완료가 분리되어 있다. UI는 접합 미리보기49검사 완료 보고, 하드웨어는 클립/핀 단품과 계약·캡처 완료 보고, 추가 조립 안내는 Tylko5단계 설명 시연 완료 보고다. 리더 상태/registry/제품별 생성·접합계획·저장복구가 선행 병목이다. 작업자에게 같은 미리보기를 다시 만들라고 배정하지 않는다.

| 범위 | 확인한 상태 | 남은 책임 |
|---|---|---|
| 하드웨어 | 클립·핀 설명용 모델/좌표 계약, HW-REQ-04 게시 | 리더가 가구 접합점·축·판 ID 제공. 실제 치수 미확정, 제조용 연결 완료 아님 |
| UI | R1.3 입력 수정, 접합2방식 미리보기. 기존 UI46개 독립 재실행 통과 | 리더 상태/view/intent 연결, 제품군·옷장 실제 생성 연결 |
| storefront | 기존 갤러리 완료, 접합 정보 손실 경로·DB 설정/생성자 오류 인계 | 리더 공통 직렬화/복구 계약과 DB 경계 수정. 로컬 성공을 서버 성공으로 처리 금지 |
| QA | QA-L4-04/08 오류2건 재현 | 이번 리더 수정 이후 독립 재검증 요청 |
| 조립 안내 | Tylko5단계 설명 시연 완료 보고·가구 전체와 별개 | OVVO 외형 교정/실제 제품 계획/다리 설명 미완료 |

### 이번 직접 수정 — QA-L4-04 / QA-L4-08

**수정 전** QA 원본 테스트 실행으로 connector 8pass/1fail, UI47pass/1fail을 재현했다. 원본 QA 검사에는 손대지 않았다.

- 사용자 가공 손실: OptimizerApp 방식 변경이 snapshotDesign을 호출해 현재 CNC 판재를 새 설계 결과로 교체했다. 이제 현재 panels/boxes를 기준으로 판재를 복제하고 접합 플래너의 자동 가공만 교체한다. 사용자 구멍·슬롯·힌지·판재 편집을 보존한다. 신규 설계 최초 진입 스냅샷은 유지한다.
- 차단 사유 잔류: manufacturingBlockOwnership에 생성 주체별 사유를 기록하고 `connector-plan`/`connector-validation`이 각각 자기 사유만 교체한다. 다른 사유와 이유 없는 기존 제조 차단은 보존한다. JSON 왕복 후에도 출처가 유지된다.
- 가공 없는 판재에 차단 표시용으로 만든 빈 데이터는 복귀 시 조건부 정리한다. 사용자가 가공을 추가했거나 다른 차단/가공 정보가 남으면 삭제하지 않는다.
- 방식/품번 변경 후 현재 사용자 가공과 새 접합 가공의 충돌도 다시 검사한다. 자동 생성된 이전 충돌 사유는 최신 결과로 교체한다.

### 검증 결과와 한계

- 기존 QA connector9 + 리더 connector17 = **26/26 통과**. 리더 추가4개는 JSON 왕복의 외부 차단 보존, 이유 없는 차단 보존, 여러 번 방식 전환의 사용자 가공/판재 편집 보존과 입력 불변성, 실제 충돌 생성/해소 재검사다.
- 기존 QA UI/OptimizerApp 검사 **48/48 통과**. QA-L4-07 복귀 원본 일치와 QA-L4-08 사용자 구멍 보존 모두 통과.
- 변경 파일 lint 통과. 전체 lint 오류0/기존 경고7.
- `/private/tmp/befun-leader-qa-fixes-11ye_7h2` 격리 소스에서 전체 tsc 및 webpack production build 통과. 최초 빌드 Google Fonts DNS 실패 후 네트워크 권한 확장으로 같은 빌드를 재실행했다. 공용 dev 서버/.next 변경 없음.
- 실행 로그: checks/leader-qa-fixes-*.log. 실제 Chrome 가공 편집 화면의 재검증은 이번에 수행하지 않았다. 테스트는 실제 OptimizerApp/ConnectorBar/store와 생성기 경계까지이며 무거운 CNC UI는 QA 하네스가 대체한다.
- 사용자 수동 가공의 새로고침 영구 저장을 구현한 것이 아니다. 이번 범위는 같은 optimizer 세션의 접합 설정 변경 보존이다. 기존 출처 없는 차단은 임의 해제하지 않는다.
- 이 검사는 OVVO 외형이나 Tylko 제조 규격의 동치 검사가 아니다. OVVO-AUDIT-001~003과 실제 제품군 통합은 미완료 유지.
