# 책상·옷장 상세 구성 통일 완료

`FURNITURE-DETAILS-READY` / 2026-10-14 / codex-storefront.

기존 편집기 아래 소개 문구만 있던6상품에 책장의 `ProductMaterialGallery`, `product-details.module.css`, 공통 상세/버튼/아코디언 스타일을 연결했다. 추가된 흐름은 상세 메뉴→소개/특징→원본 갤러리/확대→실시간 제품 사양→브랜드/소재 탐색→기프트카드→관련 디자인→기존 JoinSection이다. 책장용 store/specification을 옷장에 잘못 재사용하지 않고 현재 FurnitureDesign으로 사양을 표시한다.

| 편집 상품 | 원본에서 읽고 로컬로 복사한 상세 사진 | 실제3003/production 로딩 |
|---|---:|---|
| desk-1 Classic 클레이 브라운 |8|8/8 PASS|
| desk-2 Modern 샌드 |8|8/8 PASS|
| desk-3 Classic 블랙 |8|8/8 PASS|
| wardrobe-1 Edge 딥 플럼 |7|7/7 PASS|
| wardrobe-2 Tone 캐시미어·앤티크 핑크 |8|8/8 PASS|
| wardrobe-3 Tone 그래파이트 |8|8/8 PASS|

원본 제품 페이지의 실제 갤러리 DOM을 VPN Chrome에서 읽고 pageAssets로 원본 바이트를 확보했다. [사진 출처/원본 SHA256](source-photos.json). 총47장 전체 디코딩과 바이트 대응 확인. 원격 요청이나 다른가족 대표사진 대체 없음. Edge는 원본 순서1/2/3/5/6/7/8을 유지했으며 가짜4번을 만들지 않았다. 원본 Edge 페이지가 제공하는 depth-60 컬렉션 예시와 편집기의45cm preset은 별개이고, 갤러리에 디자인 예시/3D 확인 안내를 유지했다.

같은 가족의 확보된 갤러리만 색 선택에 표시한다. Classic2색/Tone2조합 전환 시 사진 전체 교체·3D 설정 유지 확인. 없는 색 사진을 만들거나 다른가족으로 대체하지 않는다. 사양에는 편집 폭·구획·내외부 컬러가 바로 반영된다. Graphite60→61cm 편집→갤러리 색 변경/확대/닫기→공유→새로고침 후61cm 및 사양61×275×63 확인. 기존 localStorage 저장/공유 구현은 변경하지 않았다. 확대 닫기/Escape/스크롤 복원 확인; 기존 공통 Dialog의 초점 복귀 완전성은 인증하지 않았다.

실제 CUA 화면에서 데스크톱 갤러리/확대 및 모바일 책상·옷장 배치를 시각 확인했다. 모바일390px에서 document width390, 단일열 배치 및8사진 확인. 저장된 CDP 캡처는 최종 시각 감사에서 page-coordinate 캡처 문제로 빈 프레임이 확인돼 폐기했으며 파일 증거로 주장하지 않는다. 원본47사진 바이트와 실제 로딩·조작 결과는 별도 JSON에 기록했다. 임시 viewport/clipboard 원상복원, 본인 탭/서버 정리.

검증: 기존 카탈로그·상태·desk-ui26 + 사진 출처/복원3 =29/29 PASS. 변경5파일 ESLint0/0, 전체lint0오류/8기존·QA경고. 최초 전체 build는 진행중 R7 TylkoManual의 Image src 타입 오류로 막혀 리더에게 알렸고 리더가 수정했다. **최종 최신 전체 소스 격리 webpack build/TypeScript/17정적페이지 PASS**, R7 제외 없음. 스냅샷 `/private/tmp/befun-furniture-details-build`, 수정5소스 SHA256 일치. 안정 production6상품 console error/warn0. 공유dev3003 일부 빠른 경로 이동에서 header/control/gallery의 useId hydration 속성 경고가 있었으며 이를 숨기지 않고 [검증 기록](verification.json)에 분리했다.

가격/DB/계정·장바구니·결제/배포/공통 생성기 변경 없음. 새 상세는 원래 확인된 컬렉션 사진이며 현재 수정한3D 치수를 사진 렌더에 반영한다고 주장하지 않는다. 일부 기존/새 상세 문구의 전면 다국어 번역은 이번 완료 범위가 아니다. 카테고리 확장 담당의 route 변경을 보존하고 reference-product 분기의 catalogId prop만 추가했다. furniture-design 공유/직접 경로도 같은 편집기를 쓰므로 상세가 함께 표시된다. 신규 다운로드1,442개 상품 전체의 상세/편집 완성을 의미하지 않는다.

소유 소스/사진/검사·인계 잠금 해제. 공유3003 재시작이나 .next 삭제 없음.
