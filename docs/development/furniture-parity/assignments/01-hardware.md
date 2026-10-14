# 왼쪽1 · Claude 하드웨어 — OVVO 부품 교정 / R2.1-HW

## 이번 작업의 결과

조립 화면에 있는 임의 박스형 OVVO 부품을, 공식 자료에 근거한 **PH·RH·PC·RC 네 부품**으로 교체할 수 있게 만든다. 완성된 모델을 왼쪽5가 실제 조립 화면에 연결한다. 단품 캡처만으로 끝내지 않고, 소비자가 사용한 import·변환을 마지막으로 확인한다.

당신은 기존 claude-graphics 세션이다. Tylko 클립·다리·손잡이 단품과 재질 개선은 이미 있으므로 처음부터 만들지 않는다. 이번 우선순위는 사용자가 지적한 OVVO다.

## 현재 코드에서 확인한 문제

- `src/components/assembly-guide/GuideScene.tsx`의 `Housing()`은 벽·바닥·끝캡을 boxGeometry로 구성한다. R receiver도 같은 몸체에 작은 박스를 추가하는 방식이다.
- 같은 파일 `Connector()`는 임의 Shape 압출과 박스를 사용한다. P/R 차이가 압출 길이 정도로 표현돼 공식 자료의 비대칭·체결 구조를 설명하지 못한다.
- 끝캡 모서리 x=4.3, z=14.2가 현재 캡슐 슬롯 끝 반경을 약 1.105mm 초과한다. 실제 공차가 아니라 **현재 두 메시 사이의 모순**이다.
- Tylko 단품의 설명용 32×9×12mm 치수는 OVVO나 실제 Tylko 가공 규격으로 재사용하지 않는다.

## 먼저 읽고 대조할 자료

1. `docs/tylko-reference/ovvo-implementation-audit.md`, `cases/ovvo-audit-001.json`.
2. `sources/ovvo-audit-001-v1230p-instructions.pdf`, `sources/ovvo-audit-001-v1230r-instructions.pdf`, `sources/ovvo-audit-001-v1230r-spec.pdf` — 모두 `docs/tylko-reference/` 아래. 실제 파일명이 다르면 같은 디렉터리에서 확인하고 handoff에 정확한 이름을 기록한다.
3. 해당 `screenshots/ovvo-audit-001-*.png` 및 현재 GuideScene의 정면·측면·착좌 단면.
4. 본인 `docs/handoffs/claude-2-hardware.md`의 좌표/재질 수명 관리 방식.

PDF에 적힌 가공 홈 길이/폭을 부품 자체 외곽 치수라고 옮기지 않는다. 도면 표기·눈대중 비례·미확인 내부 기구를 별도 열로 기록한다. 추가 기술 자료가 필요하면 제조사 원본을 확인한다.

## 수정 소유권

직접 수정: 신규 `src/components/three/furniture-hardware/ovvo/**`, 필요한 본인 `furniture-hardware/index.ts` export, `docs/handoffs/claude-2-hardware.md`, `docs/handoffs/claude-2-hardware-assets/r2-ovvo/**`.

읽기 전용: GuideScene/sequence, optimizer의 ovvo.ts·apply.ts·panelGeometry.ts, Shelf, stores, 공통 타입. 기존 재질/조명 변경은 별도 작업으로 기록한다. 여기 배정을 이유로 범위를 섞지 않는다.

## 구현 순서

1. **기준선 확보:** 현재 PH/RH/PC/RC가 화면에 어떻게 보이는지 캡처하고 네 부품의 역할과 자료 페이지를 표로 만든다. 검증용 입력은 V-1230P/R의 기존 18mm 예제 판재를 사용하되 이것을 모든 두께에 대한 검증으로 일반화하지 않는다.
2. **공개 계약 먼저 게시:** `ovvo/index.ts`를 import 입구로 잡는다. 부품별 geometry factory 또는 React component의 실제 signature, 단위, 원점, 축, 최종 체결 변환, 치수의 근거 상태를 handoff에 게시한다. 파일이 존재하고 import 가능한 시점을 `HW-CONTRACT-READY`로 기록한다. 문서상의 예정 이름만으로 준비 완료라고 하지 않는다.
3. **부품 구현:** PH와 RH를 별도 규격으로 다루고 PC/RC의 방향성을 보존한다. 회전·미러를 이용한 재사용은 실제 구조가 같다는 근거가 있는 곳만 한다. 노출되지 않은 스프링/걸쇠를 임의 정밀 모델로 꾸미지 않는다.
4. **포켓과 대조:** 장착면 법선과 포켓 깊이 방향을 명시한다. 확인된 단면에서 부품이 슬롯 벽을 뚫는지 검사한다. 실제 언더컷 치수가 없으면 unknown으로 남기며, 맞춰 보이려고 전체 부품을 임의 축소하지 않는다.
5. **조립 담당 인계:** 왼쪽5에 부품별 앵커와 재질 소유권, 완성 자세, 테스트 명령을 넘긴다. 왼쪽5가 연결한 장면에서 mm→장면 변환이 한 번만 적용됐는지 함께 확인한다.

## 좌표 계약에 반드시 포함할 내용

- 단위 mm, 원점의 물리적 의미(장착면·입구·중심 중 무엇인지).
- 장축/면 법선/폭 축과 좌표계 handedness. 축 이름만 같고 cross product 방향이 다른 계약을 허용하지 않는다.
- PH/RH 포켓 위치에 적용할 변환과 PC/RC 결합 완료 변환. 오른손 회전 quaternion 또는 matrix로 명시한다.
- geometry 생성/재질/texture의 생성자와 dispose 담당. 소비자가 공유 geometry를 중복 dispose하지 않게 한다.
- 공급사 표기 치수, 관찰 근사치, 미측정 값을 분리. 이 모델을 CNC 자동 가공 표로 export하지 않는다.

## 완료 검증

| ID | 확인 | 통과 증거 |
|---|---|---|
| HW-01 | PH/RH/PC/RC 구별 | 원본 해당 페이지와 같은 방향의 정면·측면 비교, 확인/추정 주석 |
| HW-02 | 기존 끝캡/슬롯 간섭 | 교정 전 재현 및 교정 후 동일 단면 검사. 실제 언더컷 미확정은 별도 unknown |
| HW-03 | 앵커·축·단위 | 동일 계약으로 조립 담당 장면에 연결했을 때 기준점 일치 |
| HW-04 | P/R 방향 | 비대칭 방향을 반대로 두면 검사가 실패하는 사례 포함 |
| HW-05 | 수명/회귀 | 모델 전환·재마운트 시 geometry 오류 없음, 기존 Tylko/legs/handles 검사 유지 |

기존 실행 명령을 재사용한다: `node src/components/three/furniture-hardware/legs.test.mjs`, `node src/components/three/furniture-hardware/handles.test.mjs`, clip 검사는 본인 handoff의 loader 명령. 신규 OVVO 검사 명령은 실제 실행 가능한 형태로 게시한다. 변경 lint·타입·격리 build도 기록한다.

## 인계 및 완료 판정

handoff에 네 부품별 `구현/자료 일치 확인/미확정`, 캡처, 실제 import, 좌표 예제 한 개, 검사 결과를 남긴다. `단품 완료`와 `GuideScene 연결 확인`은 별도 칸이다. 공급사 CAD가 없어서 남은 형상이 있으면 정확히 그 부분을 적는다. “전부 같은 것 같다” 또는 테스트 수만 적고 끝내지 않는다.
