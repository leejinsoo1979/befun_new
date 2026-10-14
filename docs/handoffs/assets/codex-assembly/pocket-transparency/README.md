# OVVO 홈·MDF 절삭면·투명 내부 표시 교정

2026-10-14 · 왼쪽5 / codex-assembly · 기존 세션 유지. 사용자 제공 R 02/08 캡처의 평평한 홈과 내부 커넥터 가림을 재현하여 수정했다.

- [수정 전](before-pocket.png) → [수정 후 실제 화면](after-pocket.jpg): 입구만 그리던 표현과 라미네이트색 바닥을 제거했다. 두 위치의 홈에 안쪽 벽·바닥 geometry와 미세한 MDF 절삭면을 넣었다. A 윗면과 B 아래 끝의 삽입 카메라가 깊이를 보여준다.
- [R 내부](inside-r.jpg), [P 내부](inside-p.jpg): 패널과 하우징은 투명, 검정 연결 커넥터는 불투명으로 남아 보인다. [R 단면](section-r.jpg)의 캡도 원본 재질 투명도를 따른다. 상세 내부 형상이 공급사 CAD로 검증되었다는 의미는 아니다.
- 내부 보기의 직접 선택은 탐색·단계·다시 재생·조립/분해 변경에 유지한다. 주제/OVVO 모델 변경 시에는 기존 자동 연출로 초기화한다. 명시적 투명 선택 중 자동 절개가 개입하지 않는다. 최종 단계의 결합부 확대도 전체 시점에 묶이지 않는다.
- 외부 넓은 양면 라미네이트와 자작 적층 엣지의 로컬 면/UV 배정은 그대로다. 사용자가 이번에 지정한 홈 안쪽 MDF 표현은 시연 재질이며 생산 BOM 확정이 아니다. 공용 materials.ts, HW geometry, CNC, 상품/상태/route, 공유 .git 미수정.

## 확인된 범위와 한계

기존 HW 계약의 입구30×9.4mm, 예시 깊이12.5±0.5mm를 소비한다. 이번 벽은 입구와 깊이를 연결하는 설명용 기본 홈이다. 공급사 언더컷·숨은 내부 가공 형상은 미확정으로 유지하며 `manufacturingApproved=false`이다. R은 기존 공식 해제 슬라이드15mm→lift4단계, P는 영구형 분해 비활성. 조립 추정 이동값을 공식 해제 치수와 혼용하지 않았다. Tylko5·백패널7·다리 원본5와 별도 안내다. 정적 다리GLB를 정밀 기구 시뮬레이션 완료로 보고하지 않는다.

## 검증

47/47 node검사 PASS. 양방향·양앵커의 실제 홈 raycast와 MDF material/texture dispose 검사, 기존 pose/playback/회귀 포함. 변경eslint0/0, 독립 게시 사본 전체lint 오류0/기존경고7, production build+전체TypeScript+17정적페이지PASS. [소스 fingerprint](source-fingerprint.json)에서 안내40파일 사본차이0. [상세 결과](verification.json).

Chrome1728×880 및 [390×844](mobile.jpg) 실제 조작. A/B 홈·P/R 내부·단면·R 해제·P 제한, Tylko원본/추정3D5, 백패널7, 다리원본/정적GLB5, 재생/탐색/초기화/전환 확인. 24회 재질 전환 후 warmed geometry36/texture9/program10 안정. 과거 공용 HMR 오류와 의존성 배열 hot-reload 경고는 이력에 남아 있었으며, 최신 새로고침 후 error/warn0을 별도 확인했다. 공유3003/.next는 재시작하지 않았다.

실제 책상·옷장 전체 부품/접합 연결은 [R4 최소 입력 계약](../material-disassembly/README.md)의 리더 요청 그대로다. 생산 가공 승인·정밀 다리 모션과 별개다. Git/운영 배포는 [게시 인계](../PUBLISH.md)에 따로 기록한다.
