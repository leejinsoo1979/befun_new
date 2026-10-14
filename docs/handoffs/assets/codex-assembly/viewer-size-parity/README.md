# 옷장·책상 뷰어 크기 통일

왼쪽5 / 2026-10-14. 사용자 wardrobe-2 캡처 및 책상도 동일 요청 수신. 단일 furniture.module.css의 공통 레이아웃만 수정한다.

책장 상품 `/furniture/bookcase-brown`을 기준으로 삼았다. 기존 옷장·책상은 왼쪽32px/별도 max1800/가변높이약620px/760px 전환 지점을 사용했다. 책장 상품은 왼쪽0/오른쪽74px/420px 옵션 패널/높이764px였다. generic `/configurator`는 자체 화면 높이 clamp가 있는 별도 경로이므로 상품 뷰어의 기준과 구분했다.

공통 옷장·책상 layout를 상품 책장과 동일하게 설정: desktop 764px 뷰어,420px sidebar/74px 오른쪽 여백, gap0/왼쪽0/최대폭 제한 없음/옵션 위16px. 1200px 이하388px sidebar,1023px 이하 단일열+540px 뷰어,700px 이하430px 뷰어+옵션 좌우12px. 전체 화면 fixed 전환 동안 빈 grid cell로 기존 뷰어 자리를 유지한다. 제품별 컨트롤 수에 따른 옵션 패널 높이는 보존한다.

viewport-matrix.json: 1728/1200/1024/1023/768/700/390/1920의8화면, 각 book/wardrobe/desk3경로. 실제 DOM viewer x/y/width/height와 옵션 x/y/width가 모두0.01px 이내 동일, 가로넘침0. desktop/모바일 전후 캡처 포함. 최초 옵션 selector가 상세본문 aside를 잡아 잘못 측정한 결과는 올바른 productOptions/편집 aside로 다시 측정해 대체했다.

독립 최신 안정본+본인 CSS 블록만 최종 production build/TypeScript PASS, 전체 lint0오류8기존경고, diff check PASS. 공유본과 게시사본의 소유 CSS 블록 SHA 일치. 구현을 그대로 복제하는 CSS unit test는 추가하지 않았다. 기존 카메라·모델/치수·저장/공유/가격·초기정면·녹색 테마 WIP는 미수정/미혼입. 다른 담당의 공유 .git/.next/3003·실행 보존.

전체 화면 검증에서는 full-window fallback 진입/복귀의 크기(1920×1080→1426×764,390×844→390×430)를 확인했다. 반복 live dev 리로드/화면전환 중 GPU context loss와 자동 전체화면 종료를 관찰했다. 본인 비교 탭만 정리하고 기존 복구 버튼/리로드를 사용했으며 렌더러 소스를 수정하지 않았다. Native fullscreen 안정성까지 인증하지 않는다. 최종 게시의 정상 화면 검증은 후속 결과에 구분한다.

Commit/push/운영 READY는 PUBLISH.md와 verification.json 후속 기록으로 구분한다.

## 운영 책장 기준 추가 마감

초기2fe18fa READY 뒤 운영3경로를비교하니책장716px/y116·canvas664px/y168이었다. 로컬의기존 R13완료값3규칙이 미게시였다. 실제실패측정은 production-before-baseline-fix.json. 운영까지통일하기위해 productConfigurator top0/productScene inset0/productViewer764만 추가게시한다. 공유파일의다른WIP는복사하지않는다. 최신원격7b44a59 보존·최종build/TypeScript/lint PASS. 최종READY와운영3경로일치는별도기록.
