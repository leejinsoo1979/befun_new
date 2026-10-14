# 컨피규레이터 로딩 연출

2026-10-14 / codex-assistant / 사용자 직접 요청

공용 SVG+CSS 로더: 초록색 입체 선반 판재가 순차적으로 모이는3.6초 루프, 은은한 원형 배경·빛 스윕·이동 표시선. 3D 번들 자체를 기다리지 않고 표시한다. 임의 진행률/최소 대기시간 없음. SceneReady는 Suspense 해제 후 두 번째 프레임에서 완료 신호,550ms 페이드아웃. 가구 전용 화면은 재질 준비 후 같은 신호. 내부 비동기 액세서리 전체 다운로드 완료를 보장하는 신호는 아니다.

적용: /configurator, ProductConfigurator의 상품 상세, FurnitureConfigurator/FurnitureScene. 기존 가구 모델/가격/설정 변경 없음.

## 검증
- Chrome localhost:3003/configurator에서 느린 연결(2초 지연·400KB/s)로 실제 로딩 표시, 이후 aria-hidden=true/opacity0/pointer-events:none으로 해제 PASS.
- 데스크톱1728×937, 모바일390×844 화면 배치 PASS. reduced-motion에서 animation:none 확인. 진단용 네트워크·캐시·viewport·미디어 설정 모두 복원.
- 캡처: assets/codex-qa/loading/desktop.png, mobile.png. 코드 해시 fingerprint.json.
- 변경 TSX lint 오류0/기존unused import1경고. 전체lint 오류0/9경고.
- 격리 build: webpack 컴파일 성공. TypeScript 실패는 wardrobe-panel.ts:36(section/global target), wardrobe/index.ts:14(인자 개수)의 변경범위 밖2오류. 해당 소스 미수정. 후속 변경은 CSS 그림자 농도만이며 Chrome에서 확인했다.
- 초기 Chrome error0, 느린 연결 재로드 중 ProductMaterialGallery radio name의 hydration mismatch1건 관찰. 원인 미확정이며 로더 자체의 문제로 단정하지 않는다. 전체 콘솔 무오류로 보고하지 않는다.
- React 체크: 프레임 루프의 상태 변경1회, CSS transform/opacity 중심, 숨긴 로더 애니메이션 정지·입력 통과, role=status 및 reduced-motion 지원. 외부 자산/라이브러리 추가 없음.

상품/가구 전용 경로는 공용 컴포넌트 연결·컴파일 확인이며 각각의 전체 브라우저 회귀검증은 미실시.
