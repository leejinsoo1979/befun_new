# 다운로드 상품 이미지 연결 계약 — 카테고리 확장 담당 필독

사용자가 지정한 `befun 섬네일`의 두 CSV를 읽고 31카테고리 1,442세트(2,884개)를 검증·수입했다. 서비스는 `/imgs/product-cards/<sha256>.<ext>`만 사용한다. 원본 바이트를 복사했고 압축/이미지 수정은 하지 않았다. 중복 파일을 저장소에서만 합쳤으며 1,442개 카테고리 membership은 모두 유지한다.

## 카테고리 확장과 연결 방법

- 원본 레코드: `src/lib/catalog-images/manifest.json`. `category`, `sequence`, `productNumber`, `productKey`, `name`, `source`, `categoryPage`, `thumbnail`, `studio` 제공. 순서는 CSV sequence로 정렬한다. 이름은 CSV 원문이며 가격/치수/판매SKU는 이 자료에 없다. 임의 가격/기존SKU를 붙이지 않는다.
- `src/lib/catalog-images/index.ts`의 `downloadedCardEntries`는 전체 레코드. 가능하면 서버에서 필요한 카테고리만 골라 클라이언트로 전달한다. 전체 JSON을 이미지별 요청으로 해석하지 않는다.
- `getDownloadedCardImages(sourceProductUrl, categoryName?)`: 원본 상품 URL(언어별 slug가 달라도 ID+접미사가 동일하면 일치)로 찾는다. **categoryName은 CSV의 한국어 카테고리명**. 정확한 카테고리를 넘기는 것이 우선이다. 카테고리가 없고 서로 다른 세트가 있으면 null. 번호 접미사 `,j`/`,w`/`,s`를 생략하거나 상품명으로 유추하지 않는다.
- **주의: 상품3716771,j(책상),273317,s(소파)는 카테고리에 따라 썸네일/스튜디오컷 역할이 반대다.** 상품번호 단독으로 이미지역할을 덮어쓰지 말고 해당 category+sequence 레코드를 사용한다.
- 카드 이미지 렌더: `<ProductCardImage key={pair.thumbnail} thumbnail={pair.thumbnail} studio={pair.studio} alt={product.name} sizes="..." />`. 기존 relative/정사각형 이미지 컨테이너 안에 넣는다. button/Link는 기존 것을 유지. 이 컴포넌트는 링크·가격·가구상태를 건드리지 않는다.
- 기본은 lazy 썸네일. 마우스 진입(fine pointer) 시 해당 스튜디오컷만 요청하고 디코딩 뒤 페이드인. 도중 기본 이미지를 없애지 않음. 터치기기 기본 유지. 호버 이미지 실패 시 썸네일 유지. 원격요청/임의대체 없음.

## 기존 카드 반영 원칙

`existing-matches.json`은 기존 referenceCatalog의 source URL 또는 기존 thumbnail SHA256 일치 근거만 포함한다. 소스URL 매핑 시 알려진 카테고리 우선, 다음은 기존 원격썸네일 URL 일치. 기존 상품명·가격·크기·카테고리·클릭URL은 변경하지 않았다. 기존 Befun 샘플은 실제 제조SKU 동일성을 주장하지 않으며, 이미 사용하던 이미지가 CSV파일과 바이트 동일한 경우에만 이미지쌍 교체했다.

카테고리 담당은 기존 샘플의 상품명/가격을 새 이미지 번호와 임의 연결하지 말고, 상품 데이터가 없는 다운로드 항목은 별도로 유지한다. 이 작업은 카테고리 확장 자체를 수행하지 않는다.

## 증거와 재실행

- `inventory.json`: 카테고리별 파일수/세트수, 기존카드 매칭/미매칭 사유.
- `image-validation.json`: sharp로 모든 고유 이미지 전체 디코딩 결과.
- 두 원본 CSV는 이 폴더에 복사해 보존.
- 재실행: `python3 scripts/catalog-images/import.py '<원본 폴더>'`.
- 아래 검증은 2026-10-14 작업 종료 시점 기준이다.

## 반영 및 검증 결과

- 기존 카드 48개 중 31개 연결(원본 상품 URL 29개, 기존 썸네일 파일 바이트 일치 2개). 미매칭 17개는 기존 이미지를 보존했다. 전체 1,442개가 서비스에 상품으로 등록됐다는 의미는 아니다. 신규 카테고리/상품 등록은 카테고리 담당 작업이다.
- 31개 카테고리, 1,442세트, 2,884개 파일 참조 검증. 고유 상품 키 1,261개. 동일 파일만 합쳐 고유 파일 2,435개/72,416,712바이트를 public에 복사했다. 파일 누락 0, 페어 오류 0, sharp 전체 디코딩 실패 0.
- `node --test scripts/catalog-images/verify.test.mjs`: 5개 통과. 변경 범위 ESLint 통과. 별도 임시 복사본 `npm run build -- --webpack` 성공. 실행 중인 개발서버를 재시작하지 않았다.
- 실제 Chrome localhost:3003/furniture-c/desk에서 기본→마우스 호버→복귀 확인. 스튜디오 이미지가 로딩되는 동안 기본 이미지는 계속 표시된다. 첫 카드만 호버 이미지를 요청했고 나머지 두 카드는 img 1개를 유지했다. 카드 크기 368×368px 유지, 로드된 이미지 오류 0.
- 390×844 터치 에뮬레이션에서 hover:none, 카드마다 썸네일 img 1개 유지. 첫 카드 터치 후 기존 /reference-product/desk-1 화면 정상 이동. 테스트 후 터치/뷰포트 임시 설정 해제.
- 캡처: [기본](default-desktop.png), [호버](hover-desktop.png), [복귀](returned-desktop.png), [모바일](mobile-default.png).
- 모든 파일과 CSV 연결을 기계적으로 검증했으며, 1,442세트 전체를 사람이 눈으로 비교했다고 주장하지 않는다. 실제 브라우저 시각 검증은 책상 3개 카드와 첫 카드 호버/터치 동작 범위다.

### 카테고리별 원본 세트 수

| 카테고리 | 상품 세트 | 파일 참조 |
|---|---:|---:|
| 사이드보드 | 50 | 100 |
| 책장 | 50 | 100 |
| 선반 시스템 | 50 | 100 |
| 벽면 수납장 | 50 | 100 |
| 책상 | 50 | 100 |
| TV 수납장 | 50 | 100 |
| 서랍장 | 50 | 100 |
| 화장대 | 50 | 100 |
| 신발장 | 50 | 100 |
| 협탁 | 50 | 100 |
| 레코드 수납장 | 50 | 100 |
| 수납 가구 전체 | 50 | 100 |
| 옷장 전체 | 50 | 100 |
| 2인 소파 | 50 | 100 |
| 3인 소파 | 50 | 100 |
| 대형 소파 | 50 | 100 |
| 코너 소파 | 50 | 100 |
| 모듈형 대형 소파 | 50 | 100 |
| 암체어 | 50 | 100 |
| 오토만과 모듈 | 50 | 100 |
| 커버와 쿠션 | 50 | 100 |
| 소파 전체 | 50 | 100 |
| 담요 | 5 | 10 |
| 북엔드 | 16 | 32 |
| 생활 소품 전체 | 21 | 42 |
| 벽걸이 수납장 | 50 | 100 |
| 닫힌 옷장 | 50 | 100 |
| 반개방 옷장 | 50 | 100 |
| 오픈 옷장 | 50 | 100 |
| 서랍형 옷장 | 50 | 100 |
| 전체 상품 | 50 | 100 |

### 미매칭 기존 카드

- {"id": "dressing_table-3", "name": "블랙 서랍 화장대", "reason": "not-in-download", "source": "furniture/dressing_table/7389011,j"}
- {"id": "shoerack-3", "name": "다크 브라운 도어·서랍 신발장", "reason": "not-in-download", "source": "furniture/shoe-rack/9285778,j"}
- {"id": "bedside_table-2", "name": "버터 옐로 서랍 협탁", "reason": "not-in-download", "source": "furniture/bedside-table/1650567,w"}
- {"id": "bedside_table-3", "name": "그린 서랍 협탁", "reason": "not-in-download", "source": "furniture/bedside-table/1614567,w"}
- {"id": "chest-of-drawers-2", "name": "그린 서랍장", "reason": "not-in-download", "source": "furniture/chest-of-drawers/657286,w"}
- {"id": "chest-of-drawers-3", "name": "블랙 서랍장", "reason": "not-in-download", "source": "furniture/chest-of-drawers/520218,w"}
- {"id": "vinyl_storage-2", "name": "핑크 도어 레코드 수납장", "reason": "not-in-download", "source": "furniture/vinyl-storage/3850982,j"}
- {"id": "vinyl_storage-3", "name": "블루 도어 레코드 수납장", "reason": "not-in-download", "source": "furniture/vinyl-storage/4956297,j"}
- {"id": "wardrobe-1", "name": "Edge 딥 플럼 오픈·내부 서랍 옷장", "reason": "not-in-download", "source": "furniture/wardrobe/1936508,w"}
- {"id": "ottomans_and_modules-1", "name": "윌로 그린 가죽 오토만 셰즈 롱", "reason": "not-in-download", "source": "sofa/modules-ottomans/149705,s"}
- {"id": "ottomans_and_modules-2", "name": "라일락 블루 울 오토만", "reason": "not-in-download", "source": "sofa/modules-ottomans/149862,s"}
- {"id": "bookcase-brown", "reason": "no-identical-thumbnail", "image": "unreal_10075703.webp"}
- {"id": "sideboard-brown", "reason": "no-identical-thumbnail", "image": "unreal_10102873.webp"}
- {"id": "sideboard-terra", "reason": "no-identical-thumbnail", "image": "unreal_1258234.webp"}
- {"id": "bookcase-plum", "reason": "no-identical-thumbnail", "image": "unreal_10108489.webp"}
- {"id": "tv-brown", "reason": "no-identical-thumbnail", "image": "unreal_10104713.webp"}
- {"id": "smooth-pink", "reason": "no-identical-thumbnail", "image": "unreal_1596216.webp"}
