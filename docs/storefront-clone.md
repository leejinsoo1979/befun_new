# Befun 쇼핑몰 메인 — Tylko 레퍼런스 구현

담당: codex-storefront · 2026-10-13

## 기준 화면

- https://tylko.com/en-uk (2026-10-13 실제 브라우저 화면)
- 데스크톱 1728 × 880, 모바일 390 × 844 확인.
- 상단 노란 안내 바, 떠 있는 흰색 pill 내비게이션, 화면을 채우는 히어로, 큰 카테고리 버튼, 상품 캐러셀, 컬러 컬렉션, Tone 배너, 4단계 안내, 커뮤니티, 선물 배너, 소재 안내, 쇼룸, 인기 제품, 저널, 가입 안내, 어두운 푸터 순서.

## 변경 파일

- `src/app/page.tsx`: 기존 간단한 소개 화면을 메인 전용 Storefront로 교체.
- `src/components/storefront/Storefront.tsx`: 전체 메인, 메뉴, 검색, 상품/스토리 dialog, 영상 컨트롤, 캐러셀, 상품 필터 및 커스터마이저 연결.
- `src/components/storefront/catalog.ts`: 6개 실제 Befun 수납 가구 프리셋, 팔레트, 기존 grid/pricing 함수로 산출하는 원화 가격. 외형 높이는 기존 DimensionPanel처럼 조절발 1cm 포함, store 높이는 선반 본체만 저장.
- `src/components/storefront/useSavedProducts.ts`: 즐겨찾기를 별도 버전 키로 localStorage에 저장, 탭 간 변경 동기화, SSR hydration 처리.
- `src/components/storefront/storefront.module.css`: 메인에만 적용되는 스타일, 모바일 대응, 키보드 focus, reduced motion.
- `public/imgs/storefront/`: 로컬 레퍼런스 이미지 34개와 `sources.json` 출처 목록.

공통 Header/Footer/ShopLayout, configurator 페이지, stores, 3D 소스, DB와 결제 코드, 의존성은 수정하지 않았다. 프리셋을 고를 때 기존 store API를 호출한다.

## 실제 동작

- 쇼핑 메뉴와 큰 카테고리 버튼 → 해당 제품 필터와 상품 섹션 이동.
- 검색 → 이름/카테고리/컬렉션으로 검색, 결과 없음 처리.
- 상품 하트 → 즐겨찾기 dialog 및 새로고침 후 유지.
- 상품 클릭 → 크기/소재/실제 계산 가격을 보여주는 상세 dialog.
- 상세의 디자인 버튼 및 컬렉션 버튼 → width/rows/depth/color/back panel/door를 설정한 뒤 `/configurator` 이동.
- 상품·커뮤니티·저널 캐러셀 → 화살표/가로 스크롤, 시작·끝 버튼 비활성화.
- 계정과 장바구니 → 기존 `/login`, `/mypage`, `/cart` 연결.
- FAQ와 스토리 → native dialog, ESC/닫기/바깥 클릭, 모달 중 배경 스크롤 차단과 닫을 때 복구.

## 원본과의 차이 및 외부 의존성

완전한 픽셀 동치 또는 전체 쇼핑몰 기능 동치로 판정하지 않는다.

- Befun 브랜드와 한국어 문구, 실제 지원하는 수납 가구 프리셋/가격을 사용하므로 Tylko 상품·영문 문구와 다르다. 원본 이미지와 실제 프리셋 구성은 동일하지 않아 '디자인 예시'를 표시한다.
- 원본 Messina 폰트 대신 기존 한국어 폰트 및 시스템 폰트를 사용한다.
- 첫 히어로는 공개 Cloudflare Stream 플레이어로 원본 영상을 재생한다. Stream SDK로 재생/정지/음소거를 연결했다. MP4 파일 자체는 확보하지 못했으며 스트리밍 서비스의 공개 접근 상태에 의존한다.
- 히어로 포스터와 일부 하단 이미지(브랜드, 선물, 소재, 쇼룸, 저널)는 원본 URL을 브라우저에서 로드한다. 실패 시 확보한 로컬 이미지로 대체한다. 로컬에 있는 상품·컬렉션·4단계·커뮤니티 이미지들은 Next Image로 제공한다. 출처는 `sources.json` 참조.
- 두 번째 브랜드 영상 구간은 같은 원본 포스터 이미지로 구성한다.
- 컬렉션의 색상 변경은 CSS 필터를 통한 분위기 미리보기이며 정확한 소재색 렌더가 아니다. 3D 진입 시 실제 선택한 Befun 색상 ID를 전달한다.
- 라운지 이미지는 공간 연출 참고이며 소파 상품 주문을 제공하지 않는다. 둘러보기는 이를 설명하는 공간 아이디어 dialog다.
- 최근 본 상품 영역은 추천 디자인으로, 뉴스레터 양식은 실제 기존 계정 가입/로그인 진입으로 연결한다. 이메일 수집·메일 발송·가짜 구독 완료를 구현하지 않는다.

## 검증

- 첫 `npm run build`: Next.js 16.1.6 Turbopack 빌드, TypeScript, 정적 생성 성공 (전체 14페이지).
- 수정 파일 ESLint: 오류/경고 없음.
- 전체 `npm run lint`: 기존 `src/components/three/Scene.tsx:20` no-explicit-any 오류 1개, 기존 경고 15개로 실패. 잠금된 다른 담당 파일은 수정하지 않았다.
- 추가 확인 중 전체 `tsc --noEmit`: 동시 작업 파일 `src/components/three/DimensionOverlay.tsx:208`의 `styleResult.cells` unknown 오류가 확인됨. 메인 코드 오류는 보고되지 않음.
- 두 번째 Turbopack 빌드는 컴파일 단계에서 7분간 응답이 없어 담당자가 시작한 프로세스만 종료하고 webpack 빌드로 재검증.
- Chrome 데스크톱/모바일: 가로 넘침 없음. 원본 히어로 재생과 정지/재개 확인. 원본 영상 비율 938/480을 측정해 모바일/데스크톱 여백 제거.
- 쇼핑 → 책장 필터: 책장 2개만 표시.
- 검색 '월넛': 책장/TV 스탠드 2개, '없는제품': 결과 없음.
- 즐겨찾기: 추가 → 새로고침 유지 → dialog에서 해제 → 빈 상태. 테스트 선택은 원래 빈 상태로 복구.
- 모바일 메뉴 열기/닫기, 컬러 선택 aria-pressed 변경 확인.
- 수납장 Midnight Blue → configurator: width 110cm, 외형 height 63cm(본체 62cm+발 1cm), depth 32cm, Solid/S_Midnight Blue, back panel ON, Grid 2행/하단 도어, 가격 334,400원 일치. 3D 렌더 확인.
- 저널 원본 이미지 4개 브라우저 로드 성공, 검사 시 이미지 실패 없음, 콘솔 error 없음.
- CSS overflow를 x축으로 한정해 전체 페이지 스크롤 및 섹션 앵커 이동 확인.

최종 `npm run build -- --webpack`: JS/CSS 컴파일은 11.8초에 성공했지만 TypeScript 단계에서 위 DimensionOverlay.tsx:208 오류로 실패. 최종 변경 파일 ESLint는 통과. 현재 메인 브라우저 렌더/동작은 확인 완료, 전체 생산 빌드는 공통 3D 담당자의 타입 오류 해결 필요.


## 2026-10-13 추가 지시 반영

누락 페이지·실측 규격 보완 및 컨피규레이터 원본 로고 재사용 결과는 [storefront-page-audit.md](storefront-page-audit.md)에 기록했다. 기존 문서의 메인 전용/팝업 범위는 이전 구현 기록이며 현재는 별도 페이지와 공통 내비게이션으로 확장됐다. 모든 서비스 기능 및 원본 전체 픽셀 동치가 완료된 것은 아니다.


## 최신 계속 작업

상세 상단의 실제 3D/가격/장바구니, 원본 제품별 갤러리, 40개 카테고리 레퍼런스 상세, 가구 선택 시작 페이지, 오른쪽 필터 패널, 모바일 푸터, 로컬 저장·복원 링크를 추가했다. 원본 CSS의 1632px 컨테이너/반응형 여백과 카테고리 10개 버튼의 화면별 폭·높이를 반영했다. 현재 검증 결과와 아직 다른 점은 [storefront-page-audit.md](storefront-page-audit.md)의 “최신 보완”을 기준으로 한다. 이 문서 위의 팝업·CSS 재착색·기존 로고·빌드 실패 설명은 이전 차수의 기록이다.
