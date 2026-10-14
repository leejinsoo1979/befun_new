# R3 작업자 교차점검 — 2026-10-14 08:25 KST

판정: **전체 승인 보류. UI 운영 연결은 확인했지만, 저장 호환 오류와 다리 어댑터 생명주기 오류를 재현했다.** 진행 중인 조립 안내를 완료본으로 평가하지 않는다. 제품 소스는 이번 점검에서 수정하지 않았다. 담당 잠금을 보존하고 아래 수정·통합을 배정한다.

## 우선 수정 사항

### REVIEW-R3-SAVE-01 / P1 / 왼쪽3 Codex 쇼핑몰

- 위치: `src/app/share/[code]/page.tsx:42`, `src/components/storefront/savedDesign.ts:25–26`.
- 실제 store에서 4행→2행으로 줄이면 비활성 높이를 보관하므로 `rowHeights=[28,28,28,28], numRows=2`가 된다. 기존 전체화면 snapshot은 이 배열을 그대로 저장했다. 새 공유 화면은 엄격한 로컬 parser에 전달하여 정상적인 과거 서버 설계도 거부한다.
- 재현: [입력과 결과](checks/review-r3-old-save.json). 기존 snapshot 거부, 현재 공통 snapshot 수용. 새 snapshot을 고치는 것만으로 이미 저장된 자료는 복구되지 않는다.
- 지시: 기존 서버/URL 자료의 검증된 legacy 정규화 경계를 마련한다. 유효한 numRows와 active row heights를 확인하고 비활성 꼬리만 분리한다. 부족한 행·비정수/범위 밖 numRows·잘못된 활성 높이를 임의 채우거나 통과시키지 않는다. 현재 엄격 검사를 무조건 완화하지 않는다.
- 완료 기준: 구버전 4→2행 서버 응답→공유 화면→편집→재저장까지 활성 구조·문/서랍·재질·다리 보존. 잘못된 자료는 거부. 실제 DB가 없으면 모의 서버 응답임을 표시한다. 기존 검사가 이 자료의 거부를 기대한다면 회귀 호환성 검사를 별도로 추가한다.

### REVIEW-R3-HW-01 / P2 / 왼쪽1 Claude 하드웨어

- 위치: `LongLeg.tsx:30`, `longLegInstance.ts`의 `releaseLongLegInstance`.
- cleanup이 primitive를 `removeFromParent()`하지만 setup은 다시 부착하지 않는다. 실제 설치 React 19/R3F와 원본 GLB로 재현: StrictMode+Suspense 로드 완료 후 mesh 0개, StrictMode 없는 대조군 1개. 같은 root의 재마운트도 0개가 된다.
- [재현기](checks/review-r3-longleg-lifecycle.mjs), [12개 결과](checks/review-r3-longleg-lifecycle.log). 저장소 루트에서 `node --no-warnings docs/development/furniture-parity/checks/review-r3-longleg-lifecycle.mjs`. useGLTF의 비동기 전달만 통제한 reconciler 검사이며 실제 브라우저 재현으로 보고하지 않는다. 진단기는 현 결함 재현 시 exit0이므로 회귀 테스트로 편입할 때 기대값을 mesh 1개로 바꿔야 한다.
- 지시: primitive 부착·분리는 R3F에 맡기고 중복 effect의 수동 detach를 제거하거나 대칭적인 소유권 처리를 구현한다. `dispose={null}` 및 공유 geometry/주입 material 보호를 유지한다. 이 수정은 HW 담당만 한다.
- 완료 기준: 동기/비동기 로드 × StrictMode on/off × 최초/재마운트/단위 변경에서 모델이 유지되고 공유 자원 dispose 0. ASM의 실제 새로고침·원본/3D 전환도 확인. 기존 순수 clone/release 200회 검사만으로 승인하지 않는다.

### REVIEW-R3-CORE-01 / P1 / 리더

- `scripts/storefront-save-validation/r3-consumer.patch`는 제출됐지만 `src/app/configurator/page.tsx`에는 아직 수동 snapshot과 구형 저장 처리가 남아 있다. legacy `state` URL decode도 연결되지 않았다. 담당 미납품이 아닌 **리더 통합 누락**이다.
- UI JSX 마운트를 보존하면서 공통 snapshot/복구 소비와 저장 응답 검증을 통합하고, 실제 전체화면 저장/구 URL 복구/AR 링크를 재검증한다. SAVE-01 구자료 호환 수정은 별도로 필요하다.
- 기존 QA-R2-B01(실제 CNC 사용자 판재·구멍 손실), QA-R2-REFRESH-01은 리더 수정 미완료로 OPEN 유지. 이번에 원본 브라우저 사례를 재실행하지 않았으므로 새 재현으로 표현하지 않는다.

## 담당별 판정과 바로 할 일

| 화면 순서 / 담당 | 확인 결과 | 다음 작업 |
|---|---|---|
| 왼쪽1 Claude 하드웨어 | 원본 GLB·단위·고정/이동 부품 계약 양호. lifecycle 결함 발견 | HW-01 수정 후 ASM과 실제 소비 화면 확인 |
| 왼쪽2 Claude UI | 상품·전체화면·모바일 LegacyShelfPanel 마운트 확인. 최신 원본96검사 독립 통과 | 같은 UI 재작성 불필요. SAVE/리더 통합 후 두 URL의 높이·다리·색상 복구 재검증 |
| 왼쪽3 Codex 쇼핑몰 | 현재 저장/parser/API fixture65검사 통과하나 구자료 회귀 발견. R3 최종 READY 아직 미게시 | SAVE-01 수정. 공통 저장·복구와 구자료 입력 증거를 추가하고 SAVE-BASE-READY 제출 |
| 왼쪽4 Codex QA | 미검증을 unknown/blocked로 구별한 인계는 적절함. 결과가 UI 최종 마운트 이전 시점 | UI-LIVE-READY는 이미 게시됨. UI 후속 검사 바로 착수. SAVE/HW 수정 이후 두 새 회귀 사례를 독립 재검증. CNC는 리더 수정 신호 대기 |
| 추가 왼쪽5 Codex 조립 | 기존 연출·단계 검사는 통과. 다리 topic/원본/공유 LongLeg 소비 코드 작성 중, 최종 READY 없음 | HW-01 수정본 사용. 원본 안내와 정적 3D 관찰을 구분하고 R3-ASM-03의 이동 시연 미구현 여부를 명시. LEG-GUIDE-READY 전 완료 처리 금지 |
| 리더 | Classic/Natural 다리 기능은 연결. 핵심 통합 미완료가 남음 | CORE-01 통합, CNC 손실, 제품군 registry/옷장·Desk 생성기 순서로 이어갈 것 |

옷장·Desk 패널은 preview가 있는 상태이며 운영 생성기 완료가 아니다. DB 실제 왕복도 아직 미검증이다. 다리 제조 타공·실측 이동거리·모든 제품의 Tylko 동치는 이번 통과 범위에 포함되지 않는다.

## 이번 독립 검증

- UI 원본 5파일 **96/96**: [로그](checks/review-r3-ui.log). 기존 별도 런타임을 새 임시폴더에서 사용, 패키지 추가/공용 서버 변경 없음.
- 저장/parser/API fixture **65/65**: [로그](checks/review-r3-save.log). 실제 DB 검증 아님.
- 조립·다리·원본 HW 검사 **40/40**: [로그](checks/review-r3-tests.log). 진행 중 새 다리 조립 전체를 승인한 것이 아님.
- 전체 lint **오류0/기존 경고7**: [로그](checks/review-r3-lint.log).
- 별도 진단에서 위 저장 회귀와 HW lifecycle 실패 확인. 기존 테스트 통과를 제품 전체 완료로 바꾸지 않는다.
- [점검 시점 소스 지문](checks/review-r3-sources.json). 이번 점검은 전체 production build를 재실행하지 않았으며 직전 빌드 통과를 이번 증거로 재사용하지 않는다. 동시 변경 이후 결과는 담당 최종 제출에서 다시 확인한다.

이 문서는 지시 게시이며 자동 전달/수신 확인이 아니다. 각 담당은 자기 인계에 위 사례 ID 수신과 착수/완료를 기록한다.
