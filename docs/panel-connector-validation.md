# 패널 커넥터·타공 정합 — 리더 인계

2026-10-13. 사용자 요청은 패널 접합 커넥터의 위치와 대응 타공이다. 이번 변경은 기존 OVVO 가공 경로의 오류 수정이며 Tylko의 고유 배치 공식 또는 실제 제조 승인 완료가 아니다.

## 수정한 경로

- `src/lib/optimizer/connectors/apply.ts`: 접합 길이에서 끝 여유·중심 간격 제약을 동시에 만족하는 배치만 반환한다. 짧은 접합에 무조건 중앙 한 개를 넣던 예외를 제거했다. 배치 불가·모델 불가·판재 두께/형상 불일치는 접합 양쪽의 제조 준비 상태를 차단한다.
- 생성 연산 ID를 `connector:`로 구분한다. 재적용 시 자기 커넥터 연산만 교체하고 기존 힌지 타공·가공 정보·기존 차단 사유를 보존한다. 직접 같은 객체에 재적용할 때 과거 차단 사유를 자동 승인으로 지우지 않는다. 현재 앱은 변경 시 새 판재를 생성한다.
- `src/lib/optimizer/connectors/validation.ts`: 슬롯 중심선 전체와 공구 반경을 검사한다. 판 밖으로 나가는 슬롯, 마구리 면/깊이 불일치, 같은 면 중복, 양면의 가공 깊이가 판 안에서 만나는 충돌을 검출한다. 하나의 커넥터 하우징에서 의도적으로 겹치는 구멍은 별도 그룹으로 처리한다.
- `src/lib/optimizer/befun/toCncPanels.ts`: 커넥터와 Blum 가공을 모두 추가한 뒤 검사한다. 충돌은 `manufacturingReady=false`와 사유로 남기며 기존 MPR 생산 출력 차단 경로가 이를 사용한다.
- 옵티마이저의 3D/분해/가공 시뮬레이션은 동일 manufacturingBoring을 소비한다. 메인 컨피규레이터 Shelf/Panel은 아직 커넥터 가공을 소비하지 않는다.

## 검사와 근거

```sh
node --test scripts/connector-validation/connector.test.mjs
node scripts/tylko-hardware/cnc.test.mjs
node scripts/tylko-hardware/blum-integration.test.mjs
```

- 신규 11개 검사 통과. 간격 전수(카탈로그 규격별 길이1…1200mm), 기존 보링 보존/재적용, 두께 오류, 양면·동일면·슬롯 경로 충돌, 외곽 반경, 실제 Grid의 충돌 차단, MPR 출력 거부를 포함한다.
- 6스타일×너비93/237/393cm×깊이24/32/40cm=54설정(밀도63, 28cm 3행)에서 대응 슬롯 양 끝점을 월드 좌표로 역변환해 비교. 0.101mm 한계는 양쪽0.1mm 반올림 오차를 포함한 계산 경계이며 제조 공차가 아니다. 원본 Tylko 내부 좌표와 비교한 검사가 아니다.
- 기존 CNC 및 Blum 통합 검사 통과. ESLint 오류0. 앞선 독립 스냅샷 `/private/tmp/befun-connector-check-0987g25d`의 webpack build/TypeScript 통과. 이후 병행 작업이 들어간 최신 전체 타입 검사는 assembly-guide 부재 import 및 dev route 타입 오류로 실패했다. 최신 판정은 [리더 중간점검](development/furniture-parity/leader-review.md)을 따른다.
- Chrome3003 `/optimizer`에서 몸통 V-1230P 선택 상태는 확인했다. 첫 선택 호출은 시간 초과였으나 후속 DOM에서 선택됨을 확인했다. 접합 경고·가공 메시·생산 출력 차단까지 브라우저 검증됐다고 주장하지 않는다. 검증 후 몸통/백패널 모두 원래 `없음` 상태로 복원했다.

공식 규격 확인: [OVVO V-1230P](https://ovvotech.com/wp-content/uploads/2022/09/V-1230P-Combined.pdf), [V-1230R](https://ovvotech.com/wp-content/uploads/2022/09/V-1230R-Releasable-Miling-Connector-Instructions.pdf), [V-0930](https://ovvotech.com/wp-content/uploads/2022/09/V-0930-Combined.pdf). 예를 들어 V-1230P의 끝35–80mm·중심150–350mm 제약은 해당 제품 규격이다. 이것을 Tylko가 실제 쓰는 위치/커넥터 규칙으로 간주하지 않는다. 모든 카탈로그 항목의 원문을 새로 전수 대조한 것은 아니다.

## 미완료 — 승인 조건

| 항목 | 현재 | 필요한 후속 |
|---|---|---|
| 양면 충돌 배치 | 실제 생성기 사례에서 발견, 제조 출력 차단 | 대응 접합 양쪽을 함께 옮기는 규칙과 규격 검증; 임의로 한쪽 슬롯만 이동 금지 |
| 메인 컨피규레이터 | 기존 Blum holes만 사용 | 동일 connector plan을 장면·조립·CNC로 공급하고 실제 화면 비교 |
| Tylko 대응 | OVVO 제조사 규격 기반 경로, 동일성 미확인 | 제품별 실제 커넥터·배치 근거와 설치 조건 확보 |
| 접합 범위 | 직교 마구리↔면 AABB 접합 | 같은 평면 가로판 분절 이음, 옷장, 비직교/부분 접합의 명시 규칙 |
| 충돌 범위 | top/bottom 가공끼리 검사 | edge↔face/edge↔edge의 입체 가공 충돌 및 구조 여유 검증 |
| CNC 포맷 | 기존 MPR 차단 경로 검증 | CIX 슬롯 보존, 기계 좌표계/공구번호/반전 설치 조건 검증 |
| 출고 조립 안내 | 별도 codex-assembly 구현 중 | 실제 출고 품번·사전 삽입 상태·순서 확정; 동일 panel/joint ID 공유 |

담당: 접합 규칙/타공/공통 통합은 리더. QA는 독립 검사. 그래픽은 확정된 규격의 외형만 구현. 미확정 연결을 제조 가능 또는 체결 완료로 표시하지 않는다.
