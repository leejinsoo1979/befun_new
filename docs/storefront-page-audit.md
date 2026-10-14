# 쇼핑몰 페이지 · 규격 점검

2026-10-13 · codex-storefront. 실제 참고 사이트: https://tylko.com/en-uk

## 최신 보완 — 컨피규레이터 하단 스크롤 (첨부 상품 화면 지시)

- 원인: `/configurator`가 3D/GUI에서 끝났고, 모바일 외곽이 `h-[100dvh] overflow-hidden`이었다. 기존 상품 상세의 하단 콘텐츠도 별도 페이지에만 있었다.
- 신규 `configurator/layout.tsx` + `ConfiguratorShell`에서 동일 쇼핑몰 헤더·메뉴·푸터와 상세 콘텐츠를 연결했다. graphics 잠금의 `configurator/page.tsx`, 모바일 패널, Scene/AR/카메라 로직을 수정하지 않았다. 래퍼 CSS는 이 route에만 적용하며 한 화면 고정을 풀고 3D 캔버스에는 명시적인 높이를 남겼다. 중복 기존 헤더를 숨기고 CNC 버튼은 상세 메뉴에서 동일 저장/진입 동작으로 유지했다.
- `ProductDetails`를 6개 상품 상세와 `/configurator`가 함께 사용한다. 갤러리 → 사양 5개 → 브랜드 → 특징 7개 → 공간 사례 → Sound 배너 → 브랜드/소재 → 선물 → 추천 → 쇼룸 → 계정 안내 → 푸터 순서. 8장 갤러리는 첨부 화면의 큰 사진/작은 사진 모자이크로, 그 외 갤러리는 빠짐없이 규칙형으로 배치한다. 모바일은 한 열이며 확대·닫기 지원.
- 첨부 파일의 상품을 원본 목록 링크에서 실제로 열었다: `https://tylko.com/de-de/mobel/regalsysteme/3690311,j,grosses-graue-multiplex-platte-regalsystem-mit-turen-und-schubladen-multiplexplatten-232x243x32cm`. 현재 공개 갤러리의 `wallstorage/original-classic/01p-grey` 8장과 원본 특징/리뷰 사진/스피커/쇼룸 자산을 확인했다. 원본의 현재 사진은 첨부 화면의 이전 짙은 색 사진과 차이가 있다. 브랜드 동영상 URL은 여전히 미확보라 사진으로 표시한다. 리뷰/쇼룸은 Tylko 레퍼런스이며 Befun 실제 후기·매장·보증으로 전환하지 않는다.
- 일반 휠은 캔버스에서 OrbitControls가 소비하기 전에 문서로 전달한다. Ctrl/핀치 확대 및 포인터 회전은 기존 동작을 남겼다. 두 3D 진입점 모두 세로 터치의 `pan-y`를 허용하며 모바일 옵션 영역도 끝에서 문서로 스크롤이 이어진다.
- 데스크톱 브라우저: 캔버스 위 일반 스크롤 후 문서 Y=881, 갤러리 도달 확인. 6개 스타일 버튼 모두 49×60, GUI 제목14px 유지. 모바일390px: 문서 폭390, 옵션 깊이40cm 변경 후 사양90×123×40 표시, 갤러리 확대→닫기 후 body overflow 복구 확인. 상품 상세에도 동일 섹션/사진8장 연결 확인.
- 변경 파일 ESLint 통과, 전체 lint 오류0/기존경고8. 다른 담당 개발서버의 `.next/dev`와 기존 production route 타입이 섞인 첫 tsc는 layout 타입 오류였으므로 공유 서버를 중단하지 않고 `/private/tmp/befun-scroll-preview-1sro1bbp` 독립 스냅샷에서 webpack production build/TypeScript를 검증했다. 전체 원본의 폰트·브랜드 동영상·운영 기능/픽셀 일치 완료를 주장하지 않는다.

## 이전 보완 — 사용자 “계속해” 지시

- 상품 상세 상단에 실제 Befun `Scene`과 스타일·밀도·치수·뒷판·컬러·행 설정을 재사용했다. 기존 3D 담당 파일은 수정하지 않았다. 변경 구성·계산 금액을 장바구니에 직접 전달하며 전체 화면 이동에서도 유지한다.
- 구성 초기화 전에는 로딩 상태를 보여 이전 제품/default의 가격·치수가 잠깐 표시되는 문제를 막았다. `GridInput.family`와 행별 하드웨어를 카탈로그/상세 가격 계산에도 전달한다.
- 6개 기존 프리셋의 원본 페이지에서 확인한 갤러리 3·8·8·8·7·8장을 연결했다. 썸네일 ↔ 3D 전환, 확대, 사양 5개 펼침 항목, 특징 캐러셀과 관련 디자인 섹션을 추가했다. 원본 영상/운영 약속/리뷰를 Befun의 검증된 주장으로 만들지 않았다.
- 동일한 수납장으로 표시되던 책상·화장대·신발장·협탁·서랍장·레코드 수납장·옷장·월 유닛과 소파 하위 종류·블랭킷·북엔드를 해당 카테고리의 실제 원본 카드로 구분했다. 40개 원본 레퍼런스 상세 경로 추가. 판매 SKU와 구분해서 표시한다. 전체 원본 재고를 동기화한 것은 아니다.
- `/configurator-intro`: 13개 가구 종류 → 지원하는 수납 프리셋의 모델/마감 선택 → 실제 커스터마이저. Befun에 해당 형상/상품이 없는 종류는 레퍼런스 목록으로 연결한다.
- 상품 목록: 이미지 카테고리 4개, 컬렉션 카드 설명/화살표, 오른쪽 620px 필터 drawer, 15색 선택과 다중 조건/실제 결과 수. 브라운 선택 시 수납 프리셋 3개와 URL `colors=brown` 확인.
- 모바일 푸터: 기본 접힘, 그룹별 펼침. 컨피규레이터와 같은 최신 사용자 승인 `/imgs/icon/befun_logo.svg` 그대로 유지했다.
- 서버 저장이 실패할 때 브라우저 저장·자체 구성 공유 링크를 제공한다. `/saved-designs`에서 다시 열고 `/design-preview?design=...`로 새로고침/다른 브라우저에서도 복원한다. 서버 저장과 로컬 저장을 다르게 표시하며 최대 20개 보관한다. JSON 범위·행/하드웨어 모순 검사 17개 통과. 테스트 디자인/장바구니 기록은 삭제했다.
- 로컬 `.env.local`의 비어 있던 NEXTAUTH_SECRET만 생성했다. .gitignore 확인, 기존 값이 있을 때는 보존, 값은 문서/출력/클라이언트에 노출하지 않음. DATABASE_URL·OAuth·결제 키는 변경하지 않았다.

### 최신 실측

| 항목 | 원본 / 적용 |
| --- | --- |
| 컨테이너 | max-width 1632px; mobile padding16, 768px부터32, 1025px부터48, 1440px부터56 + 중앙 여백 |
| 메인 제목 | 390px:32/38.4; 800px:44/48.4; 1728px:54/64.8 |
| 큰 카테고리 10개 | 원본의 mobile/tablet/middle/desktop 폭을 각 버튼에 지정. 번역 글자 수로 줄 배열이 달라지던 문제 수정 |
| 큰 카테고리 높이/글자 | mobile42.4/22; tablet87.2/28; middle91.2/36; desktop96/40 |
| 상세 상단 이름 | 16px / 24px, 700 |
| 상세 구매/저장 버튼 | 높이48px, 16px; 1728px에서 너비388px |
| 상세 가격 | 22px / 30.8px |
| 상세 본문 이름 | 18px / 25.2px |
| 사양 제목/행 | 제목54/64.8; 행18/25.2, padding16px |
| 상세 갤러리 | 4:3, 1728px에서752×564px, 간격16px |
| 상세 특징 카드 | 제목28/39.2, 설명14/21 |
| 가구 선택 페이지 | 제목32/38.4; Back48.4px, Next46.4px |

### 최신 검증과 제한

- 변경 storefront 파일 ESLint 오류/경고0. 전체 lint는 오류0, 다른 담당 파일의 기존 경고11개(동시 작업에 따라 감소 중).
- `node --test src/components/storefront/savedDesign.test.ts`:17개 통과. 새로운 테스트 의존성을 프로젝트에 추가하지 않았다(Node24 로컬 실행).
- `tsc --noEmit` 통과. 최종 `npm run build -- --webpack` 통과.
- 프로덕션 미리보기는 `http://localhost:3014`. 120개 URL(108개 고유 pathname) 검사:117개200, 3개 의도한307(`/account`, `/myshop`, `/investor-relations`). 없는 레퍼런스 상품은404. 개발 서버의 동시 작업 중 발생한 간헐500은 같은 화면 재조회와 별도 프로덕션 검사에서 재현되지 않았다. 개발 중 HMR 안정성을 완전히 해결했다고 판단하지 않는다.
- 월넛 책장 목록 → 상세 → 전체 화면:120×183×32cm,796,000원 유지. 3D 사진 전환과 원본 이미지 브라우저 로딩 확인.
- 치수 변경 → 장바구니 전달, 브라우저 저장 → 공유 링크 열기 → 새로고침 복원, 저장 목록 재조회 확인. 원본/상품/장바구니의 과거 금액 기록은 당시 핵심 생성기에 대한 값이며 공통 가구 알고리즘의 후속 변경에 따라 금액이 달라질 수 있다.
- 390px 상세 canvas390×378px, 문서 폭390px. 메인 390/800/1728 제목·여백 확인. 모바일 푸터 기본 접힘 확인. 큰 버튼의 각 폭/높이는 원본 계산값을 입력했다.
- **전체 원본 픽셀/기능 동치는 여전히 미완료**: 영문 Messina 파일은 공개 CSS에서 URL을 확인했지만 HTTP403 차단으로 확보하지 못했다. 두 번째 브랜드 영상도 원본 탭에서 재생 불가/관찰 소스 없음. 분석 질문에 기록했다.
- 실제 Befun 상품 재고, 모든 원본 상품/필터 결과, 일부 내부 페이지의 상세 콘텐츠·동적 리뷰·운영 위젯은 원본과 같지 않다. 원본 레퍼런스 상품은 Befun 결제로 연결하지 않는다.
- DATABASE_URL 부재로 DB 저장/실제 계정·주문 흐름은 완료 상태가 아니다. 로컬 저장을 서버/계정 저장 완료로 표시하지 않는다. 실제 Befun 정책·쇼룸·문의 수신처·샘플/기프트 발행 조건도 미제공 상태다.

아래는 이전 차수의 페이지 연결과 초기 검증 기록이다.

## 사용자 요구

- 메인에서 빠진 화면과 메뉴/푸터의 목적지를 보완한다.
- 글자와 버튼 크기를 원본 실제 CSS 계산값으로 맞춘다.
- 웹사이트 로고는 컨피규레이터의 로고 파일을 그대로 사용한다. 새 로고를 만들지 않는다.

## 이번 구현

- `StorefrontFrame`: 메인/내부/기존 cart·login·mypage·order·share 공통 내비게이션. 메뉴 5그룹, 모든 카테고리, 고객지원·정책·SNS 링크.
- `BrandLogo`: `/imgs/icon/befun_logo.svg`, 120×28px. 동시 작업자의 최신 사용자 승인 SVG를 유지함. 컨피규레이터와 동일 이미지. 글자·필터로 로고를 생성하지 않음.
- 카테고리, URL 필터, 정렬, 상품 상세 갤러리·확대, 크기/소재 표시, 저장, 실제 커스터마이저 이동.
- 검색, 즐겨찾기 페이지 및 브라우저 저장. 계정/myshop 기존 마이페이지 연결.
- 커뮤니티, 크리에이터 선택, 갤러리, 저널 및 개별 글, 브랜드, Pro, 쇼룸, 컬렉션, 소재 화면.
- FAQ 검색/분류/펼치기, 문의 주제, 주문 상태, 배송, 정책, 쿠키/지역 선택, 기프트 선택, 프레스/투자자 화면.
- 컬러 선택: 수납장 17개/옷장 11개/소파 7개. 원본에서 각 스와치를 실제 클릭하고 picture의 srcset을 수집. CSS 재착색을 제거하고 원본별 이미지를 사용.
- 제작 과정: 원본의 4개 아코디언 사진 카드로 교체. 데스크톱 선택 카드 확대, 모바일 가로 스크롤.
- 가입 섹션의 이메일 입력과 계정 안내 링크. 기존 이메일 로그인에 입력값을 전달. 뉴스레터 발송·쿠폰 지급을 가장하지 않음.

## 크기 대조

| 항목 | 원본 계산값 | 적용/확인 |
| --- | --- | --- |
| 메인 데스크톱 제목 | 54px / 64.8px, 600, -1px | 동일 계산값 확인 |
| 메인 모바일 제목 | 32px / 38.4px | 390px에서 확인 |
| 메인 CTA 데스크톱 | 200.1 × 64px, 16px, 600 | 고정 규격 |
| 메인 CTA 모바일 | 184.1 × 48px, 16px | 184.09375 × 48px 확인(서브픽셀 반올림) |
| 컬렉션 Explore | 124.3 × 64px, 16px | 동일 규격 |
| 작은 View all/필터 | 높이 48.4px, 16px | 작은 버튼 변형 분리 |
| 제품 이름·크기 | 14px / 19.6px, 400 | 적용 |
| 컬렉션 라벨 | 18px / 25.2px, 600 | 적용 |
| 크리에이터/저널 제목 | 32px / 38.4px, 600 | 적용 |
| 제작 과정 제목 | desktop 54px, lg 44px, md 32px, mobile 24px | 원본 반응형 클래스 대조 |
| 제작 과정 카드 | 1728px에서 높이 668px, 선택 폭 1008px/축소 약155px | flex 비율 6.52 : 1 : 1 : 1 |
| 가입 큰 제목 | 44px / 48.4px, -0.5px | 적용 |
| 쇼룸 제목 | 42px / 46.2px | 별도 적용 |

한국어 UI와 기존 KRW 가격을 유지한다. 한글 번역은 영문과 글리프·줄바꿈이 다르며, 전체 페이지 모든 요소의 픽셀 동치가 검증됐다는 뜻은 아니다.

## 검증

- 이번 변경 파일 ESLint: 오류/경고 없음.
- `tsc --noEmit`: 통과.
- `npm run build -- --webpack`: 프로덕션 컴파일·타입·페이지 생성 통과.
- 전체 `npm run lint`: `Scene.tsx:23` 기존 any 오류 1개 및 변경 범위 밖 경고 13개. 다른 담당 잠금 파일을 수정하지 않음.
- 로컬 서버 메뉴/페이지 76개 URL(64개 고유 pathname) HTTP 200. 첫 검사에서 소파 상세 2개 500 발견 → client 컴포넌트에서 데이터 import하는 서버 경계를 수정 → 두 경로 모두 200 재확인.
- 없는 `/furniture-c/not-a-category`: HTTP 404.
- 홈 화면의 로고 클릭 시 맨 위로 복귀하도록 추가 확인/수정.
- 데스크톱 1728px / 모바일 390px: 로고, 메인 제목/CTA, 메뉴→책장→상세 이동 확인. 가로 문서 폭 390px 유지.
- 상세 저장→즐겨찾기 이동/재로드/해제. 상품 상세의 110×63×32cm, 334,400원 → 실제 configurator 동일 수치/가격 확인.
- 수납장 White, 옷장 Deep Plum, 소파 Powder Pink 선택 시 각각 원본 사진 URL로 전환 확인.

## 아직 실제 서비스/완전 일치가 아닌 부분

HTTP 200은 링크 누락 검사를 의미하며 원본 전체 기능/모든 페이지의 픽셀 일치 완료를 의미하지 않는다.

- 원본의 모든 상품 SKU, 소파/블랭킷/샘플 판매 시스템은 Befun에 없다. 소파는 원본 레퍼런스 상세, 액세서리는 원본 컬렉션 연결. 일부 수납 카테고리는 기존 디자인 예시를 제공한다.
- 문의 API·수신처·WhatsApp·LiveChat 미설정. 문의 화면은 내용을 로컬 파일로 준비하며 전송됐다고 표시하지 않는다.
- 기프트카드 발행/결제, 뉴스레터/프로모션, B2B 조건, 미디어/투자자 데이터 미제공.
- 실제 Befun 쇼룸 주소·사업자 정보·정책 원문·배송비/제작기간/반품 조건 미제공. 원본 사업자의 조건을 Befun 계약으로 만들지 않는다.
- 원본 영문 글꼴과 한글 글리프의 너비는 다름. 전체 내부 페이지의 세부 콘텐츠/동적 리뷰 위젯/상품 목록은 원본과 완전히 같지 않음.
- 두 번째 브랜드 영상은 포스터 이미지이며 모든 영상의 동치 미완료.
- 실제 3D는 기존 Befun 알고리즘/제약 사용. Pattern 등 담당이 분석 중인 전체 기하 동치와는 별개.

## URL 검사 결과

| URL | HTTP |
| --- | --- |
| `/about-tylko` | 200 |
| `/account` | 200 |
| `/collaborations/reisinger` | 200 |
| `/contact` | 200 |
| `/contact?topic=cancellation` | 200 |
| `/contact?topic=chat` | 200 |
| `/contact?topic=issue` | 200 |
| `/contact?topic=order_status` | 200 |
| `/contact?topic=whatsapp` | 200 |
| `/cookie-settings` | 200 |
| `/creators` | 200 |
| `/digital-services-act` | 200 |
| `/e-gift-card/1` | 200 |
| `/faq` | 200 |
| `/furniture-c` | 200 |
| `/furniture-c/accessories` | 200 |
| `/furniture-c/armchairs` | 200 |
| `/furniture-c/bedside_table` | 200 |
| `/furniture-c/blankets` | 200 |
| `/furniture-c/bookcase` | 200 |
| `/furniture-c/bookends` | 200 |
| `/furniture-c/chaise_longues` | 200 |
| `/furniture-c/chest-of-drawers` | 200 |
| `/furniture-c/corner_sofas` | 200 |
| `/furniture-c/covers` | 200 |
| `/furniture-c/desk` | 200 |
| `/furniture-c/dressing_table` | 200 |
| `/furniture-c/four_plus_seater` | 200 |
| `/furniture-c/ottomans_and_modules` | 200 |
| `/furniture-c/shoerack` | 200 |
| `/furniture-c/sideboard` | 200 |
| `/furniture-c/sideboard?features=hanging&productLines=3,6,7,8` | 200 |
| `/furniture-c/sofas` | 200 |
| `/furniture-c/storage` | 200 |
| `/furniture-c/three_seater` | 200 |
| `/furniture-c/tv-stand` | 200 |
| `/furniture-c/two_seater` | 200 |
| `/furniture-c/vinyl_storage` | 200 |
| `/furniture-c/wallstorage` | 200 |
| `/furniture-c/wallunits` | 200 |
| `/furniture-c/wardrobe` | 200 |
| `/furniture-c/wardrobe?features=internalDrawers` | 200 |
| `/furniture-c/wardrobe?types=fullyClosed` | 200 |
| `/furniture-c/wardrobe?types=fullyOpen` | 200 |
| `/furniture-c/wardrobe?types=partiallyOpen` | 200 |
| `/furniture-c?additional=newArrival` | 200 |
| `/furniture-c?additional=topSeller` | 200 |
| `/furniture/sideboard-terra` | 200 |
| `/gallery` | 200 |
| `/inspirations` | 200 |
| `/investor-relations-login` | 200 |
| `/journal` | 200 |
| `/journal/berlin-workshop` | 200 |
| `/journal/moco-museum` | 200 |
| `/journal/reisinger` | 200 |
| `/journal/sabine-marcelis` | 200 |
| `/login` | 200 |
| `/material-samples` | 200 |
| `/mypage` | 200 |
| `/myshop` | 200 |
| `/press` | 200 |
| `/privacy_policy` | 200 |
| `/product-lines` | 200 |
| `/region-settings` | 200 |
| `/review-list` | 200 |
| `/search` | 200 |
| `/shipping` | 200 |
| `/showrooms` | 200 |
| `/sofa/smooth-khaki` | 200 |
| `/sofa/smooth-pink` | 200 |
| `/terms` | 200 |
| `/terms-gift-card` | 200 |
| `/terms/user-account-and-promo-codes` | 200 |
| `/tylko-pro` | 200 |
| `/tylko-sound` | 200 |
| `/wishlist` | 200 |
