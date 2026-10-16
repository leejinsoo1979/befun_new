# 보기 메뉴 바깥 클릭 접기

2026-10-14 · codex-storefront · 로컬 적용, 이번 커밋/푸시 미수행.

선반 ViewToolbar와 책상·옷장 FurnitureViewToolbar의 루트 ref 기준으로, 열린 동안만 document pointerdown capture를 구독합니다. 메뉴 밖 클릭/터치 시 접고 내부 옵션 선택 시 유지합니다. 캔버스 컨트롤의 propagation 차단에도 접히며, 이벤트 기본 동작이나 전파는 막지 않습니다. 닫기/언마운트 시 구독 정리. 기존 Escape/포커스 복귀·번역·녹색·카메라·옵션 변경 유지.

검증:
- 실제 Chrome localhost:3003/configurator: 열기 → 후면 선택 후 expanded=true 유지 → 빈 canvas 클릭 후 expanded=false.
- 실제 Chrome /reference-product/desk-1: 열기 → 입체 선택 후 expanded=true 유지 → 빈 canvas 클릭 후 false. 재열기 → Escape 닫기/보기 버튼 포커스 복귀.
- 실제 Chrome /reference-product/wardrobe-2: 열기 → 빈 canvas 클릭 후 false.
- 두 TSX scoped ESLint 및 git diff --check PASS. 전체 npm run lint: 오류 0, 기존 경고 8.
- /private/tmp/befun-natural-verify-2qm69klf 통합 src 스냅샷에 변경 두 파일 복사 후 npm run build -- --webpack: TypeScript/24페이지 PASS. 공유 .next/3003/.git 변경 없음.
- React 검토: 훅 조건부 호출 없음, effect는 expanded에만 의존, ref는 이벤트에서 읽고 리스너 제거 보장. 실제 모바일 터치는 미검증(pointerdown 공통 경로 적용).

소유 잠금 해제: 두 툴바 ref/effect/루트 ref 영역 및 이 인계.

## 2026-10-15 게시 검증

최신 origin/main 3f5c1c9의 독립 사본에서 Natural W4/W2·클래식/단색 그린·보기 외부클릭 완료영역만 추출했습니다. 가격/소파/아바타/카메라/다른 담당 WIP 제외. 완료된 우드 가로결 회전 및 W4 linear gain3.5를 재질 의존 변경으로 포함하고, materials.ts map 회전 보존 +=2행만 반영했습니다. 전체 lint 오류0/기존경고8, webpack production build·TypeScript23페이지 PASS, 재질/상품/사진 회귀16/16 및 그린 재질/책상 복원 계약 PASS. 운영 배포 READY 확인과 구분됩니다.

게시 직전 원격 8c50bc6(조립바·옷장 Space·Natural 재질 연결/자산)이 선행되어 재기반했습니다. 동일 Natural 자산/loader/회전은 선행 커밋을 그대로 소비하며 재추가하지 않습니다. 포맷/라벨 계산만 겹친 네 파일 병합, 앞선 완료 변경 유지. 최종 본인 커밋은 그린·보기 외부클릭·재질 검사/인계가 중심입니다.
