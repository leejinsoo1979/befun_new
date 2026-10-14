# 공개 가격 소스 감사 — R5

2026-10-14 / `pricing_audit` / 최초 리더 요청의 읽기 전용 조사. 후속 리더 요청으로 독립 신규 계산기와 산술 테스트를 추가했다(아래 구현 절). 기존 운영 가격/결제 소스·공유 브라우저·네트워크는 변경하거나 호출하지 않았다. 리더가 `team-tasks.md`에 작업 잠금을 등록했다.

## 결론

**공개 번들에는 실제 가격 계산 코드가 있다. 그러나 현재 확보한 파일에는 계산에 필요한 가격 계수표가 없다.** `pricing-analysis.md`의 “화면 차액만 확인”보다 코드 근거는 더 확보되었지만, 임의의 계수나 환율 없이 동일 가격을 계산할 자료는 아직 부족하다.

핵심은 부피×단가가 아니다. 선반·책상 경로는 앞면 면적 기본값, 부품별 길이/둘레/개수, 재질·깊이·카테고리, 마진·물류, 큰 치수 추가금, 색상군, 스타일별 추가금, 지역별 추가금 순서로 계산한다. 옷장에는 별도 제품군별 경로가 있다. 프로모션은 별도의 URL에서 조회한다.

## 확인한 근거와 범위

| 근거 | 확인 결과 |
|---|---|
| `docs/tylko-reference/sources/` | 조립/커넥터 PDF 4개. 가격표나 JS는 이 디렉터리에 없음 |
| `cases/reference-source-001.json` | 공개 번들 URL과 SHA-256 출처 기록 |
| `/tmp/tylko-public-bundle.js` | 실제 파일 존재. SHA-256 `c1c360c5db33998a46a58640949f25204485676b725dbb2457ddb4aad0b00694`로 기존 출처 기록과 일치 |
| 공개 번들 출처 | `https://tylko.com/r_static/dist_vue/vueCrowV2-es6-adcb9eecc6cc1173956e.js` |
| 모듈 483 | `window.cstm.prices.priceeee`, `priceeel`, `window.cstm.region`을 가격 설정으로 전달 |
| 모듈 798 | `@tylkocom/pricing` 초기화, 계수 JSON 조회, 프로모션 조회/캐시 |
| 모듈 802 | `PricingCore`, Jetty/Watty/Type13/Type14/Type23/Type24/Type25/Veneer/Sofa 계산과 반올림 |
| 모듈 2348 `UPDATE_PRICE` | 실제 FPM geometry에 pattern/material/shelf_type/shelf_category를 결합하여 `pricing.getPrice` 호출 |
| 모듈 780 | 일반가격·프로모션 표시 getter와 정수 반올림 |
| `cases/pricing-001.json` | DE Pattern 뒷판 OFF→ON→OFF, 일반 2422→2560→2422 EUR, Club 1502→1587→1502 EUR |

이 조사는 AST로 모듈 경계를 찾고 정적 소스를 읽었다. 원본 웹 애플리케이션을 실행하거나 숨은 런타임 상태를 읽지 않았다. 모듈 번호는 위 SHA 버전에 한정된다. 전체 원본 번들을 저장소에 복사하지 않았다. 읽기 편의를 위한 임시 추출 파일은 `/tmp/pricing-audit-pretty-{483,780,798,802,2348}.js`다.

## 가격표·프로모션 API의 입증된 계약

모듈 798은 계수표 URL을 다음 우선순위로 해석한다.

1. 호출자가 준 `priceConfig.coefficientsUrl`.
2. 주입된 `globalThis.__TYLKO_PRICING_URLS__.coefficientsUrl`.
3. 환경변수 `PRICING_COEFFICIENTS_URL`.

프로모션도 `promoUrl` → 주입 설정 → `PRICING_PROMO_URL` 순서다. 유효한 URL이 없으면 오류를 던진다. **실제 운영 URL 문자열은 이번 로컬 자료에서 확인하지 못했다.** 알려진 `furniture_dna` URL은 구조/기하 자료이며 가격 계수 URL이라고 간주할 수 없다.

계수표 요청은 GET, `Content-Type: application/json`, 10초 타임아웃이며 응답 JSON 전체를 `PricingCore`에 전달한다. 지역별 URL/응답 선택 방식은 URL 캡처 전에는 미확정이다.

프로모션 요청은 GET, 8초 타임아웃이며 다음 query를 보낸다.

| query | 내용 |
|---|---|
| `furniture_type` | 계산기 제품 종류 |
| `material` | 재질/색상 ID 문자열 |
| `shelf_type` | 제품군 ID 문자열 |
| `shelf_category` | 용도 카테고리 |
| `region` | 지역 이름 |
| `pattern` | 존재하는 경우 스타일 코드 |

응답의 `value`가 유한한 0~100 숫자일 때 할인율로 수용한다. 캐시 기본 TTL은 300,000ms이며 키에는 shelfType/material/patternCode/shelfCategory/region이 포함된다. 고정 38% 할인이라는 가정은 근거가 없다.

`/api/v1/pricing/omnibus/` POST도 번들에서 발견되지만, 이는 화면의 과거 최저가격 표시 용도다. 기본 가격표 API와 구별해야 한다.

## 선반·책상 Jetty 계산 — 코드에서 확인

모듈 802의 입력 좌표는 mm이며 길이에는 `/1000`을 적용한다. 기하 부피가 아닌 아래 지표를 사용한다. 계수 이름은 계약을 설명하기 위한 원래 키 이름이며 값은 확보되지 않았다.

| 항목 | 계산 방식/필수 계수 |
|---|---|
| 기본값 | 너비(m)×높이(m)×`base` |
| 가로판 | 총 x 길이×`horizontal_length` + 보정된 개수×`horizontal_unit`; 개별 2.3m 이상은 초과 0.1m마다 개수 보정, 합계 보정 개수는 소수 둘째 자리 반올림 |
| 세로판 | 총 y 길이×`vertical_length` + 개수×`vertical_unit` |
| 지지판 | 뒷판에 포함되는 지지판 제외 후 총 y 길이×`support_length` + 개수×`support_unit` |
| 뒷판 | 각 판 x/y 둘레×`backs_perimeter` + 개수×`backs_unit` |
| 문 | 각 문 x/y 둘레×`doors_perimeter` + `doors_unit`, 높이 조건에 `raptor_factor` 적용 |
| 서랍 | x/y 둘레×`drawers_perimeter` + 개수×`drawers_unit` |
| 긴 다리 | 개수×`long_leg_unit`×`raptor_factor`, Type02 TV장/sideboard 조건 보정 |
| 받침대 | 존재할 때 전체 너비(m)×`plinth_length`×`raptor_factor`, sideboard 보정 |
| 칸막이 | subtype에 따른 x/y 길이×`insert_length` + `insert_unit`, `raptor_factor` 적용 |
| 케이블 홀 | 개수×`cable_management_unit`×`raptor_factor` |
| 책상 빔 | 총 x 길이×`desk_beam_length` + 개수×`desk_beam_unit` |

후속 계산 순서도 결과에 영향을 준다.

1. 기본값+부품가격에 Type02 `t02_factor` 또는 veneer `t01v_factor`, 깊이 구간 계수, `category_<category>_factor`를 적용해 trait 가격을 더한다.
2. trait 포함 합계에 `jetty_margin_base` 비례값과 앞면 면적에 따라 제한되는 `maximal_increase`를 더한다.
3. 앞면 면적×`logistic_front_area`, 서랍 수×`logistic_drawers`, `logistic_base`를 더한다.
4. 너비/높이/깊이 추가금 중 **최댓값 하나**를 더한다. 너비는 2950~3100mm 사이 선형 비율, 높이는 2500mm 이상, 깊이는 400/500/600mm 조건이다.
5. `t01_group_*` / `t02_group_*` 색상군 계수를 현재 합계에 적용한다.
6. Pattern/Pixel/Mosaic의 bookcase/TV장 추가금, Mosaic 추가금을 순차 적용한다.
7. Type01/Type02/Veneer별 additional increase 후 regional increase factor를 순차 적용한다.
8. 이 번들 상수 `vatFactor=1.23`, `eurFactor=4.3`으로 `Math.trunc(total×1.23/4.3)`하여 EUR 일반가격을 만든다.
9. `priceeee`를 곱한 후 `Math.round(Number(value.toFixed(8)))`로 지역 일반가격을 만든다.
10. 프로모션은 지역 일반가격에서 `Math.round(price - price×percentage/100)`로 계산한다.

8단계 상수는 **해당 엔진 코드의 사실**이다. 전 시장에 적용할 실제 부가세율 또는 오늘의 FX 환율이라고 해석하거나 KR/US/JP 세금 설정에 그대로 쓰면 안 된다. `priceeee`도 이름과 사용 방식상 통화 변환 배수임은 확인되지만, 시중 환율과 동일한지는 미확인이다.

문 계산에는 환산 후 높이를 `>382`와 `>.382`에 각각 비교하는 조건이 함께 있다. 정상 제품 크기에서는 뒤 조건이 의미 있어 보이지만, 복제 구현에서는 임의로 정리하기 전에 원본 입력/출력 대조가 필요하다.

## 옷장 및 다른 제품군

`getPrice(input, furnitureType='jetty')`는 타입 인자로 경로를 나눈다. Watty 경로 안에서도 shelf_type에 따라 별도 계산기가 있다. 타입 번호는 코드 enum과 실제 제품 사례를 함께 대조해야 하며 마케팅 이름만으로 선택하면 안 된다.

- TYPE03(3): 너비 기반 기본값, 바/선반/서랍/세로벽/추가높이/조명, 카테고리, 깊이/duotone 마진, 지역 추가금. 조명은 마진 계산에서 별도 취급된다.
- TYPE13(4): 벽·선반·문·뒷판·바·서랍·케이블 홀, 카테고리별 마진, 부피 기반 물류, 색상군, ridges, 지역 추가금. 벽/선반/뒷판에 면적과 개수가 함께 들어가며 서랍 깊이별 단가 키가 있다.
- VENEER_TYPE13(5), TYPE23(6), TYPE24(7), TYPE25(8), TYPE14(14): 각각 별도 계수 키와 계산기. Type13을 모든 옷장/sideboard의 공통식으로 쓰지 않는다.
- Sofa는 별도 부품 기반 경로이며 이 R5의 선반/책상/옷장 완료 근거에 포함하지 않는다.

## 현재 확보된 지역 자료

두 기존 HTML의 Nuxt 데이터에서 인덱스 참조를 해제해 아래를 확인했다.

| 로컬 캡처 | 지역/언어/통화 | 가격 설정 |
|---|---|---|
| `/tmp/tylko-desk-type01-page.html` | DE / germany / de_DE / EUR | priceeee=1, priceeel=€, priceIso=EUR |
| `/tmp/tylko-wardrobe-edge-page.html` | DE / germany / de_DE / EUR | 동일 |

SHA-256은 각각 `934ea3208e387110d2abb3daefca5191adfd217f3999e57898e90039d742ee23`, `45761c8c300a8d7b9bc419756b03b1735d3592ddbd2e9ea08fff7771e1c7915d`다. 두 HTML의 공개 pricing config 문자열은 `coefficientsUrl:"",promoUrl:""`였다. 따라서 이것만으로 실제 요청 주소를 복원할 수 없다.

KR/US/JP 원본 가격 계수·환산 배수·프로모션 응답은 이번 로컬 자료에서 찾지 못했다. EU 전체가 DE와 같은 가격이라고 검증되지 않았다. KR/US/JP/EU 선택 기능을 만드는 요구와 해당 시장의 Tylko 동가를 입증하는 문제는 각각 완료 근거가 필요하다.

## Befun 연결 지점 및 필수 공백

현 `src/lib/pricing.ts`는 기존 V1 규칙(부피×8원, 일부 색상+20%, 1000원 반올림, 고정20% 할인)이다. `PriceDisplay.tsx`는 생성된 PanelData의 부피만 전달한다. 따라서 이 입력만으로는 위 Jetty 계산을 구현할 수 없다. `FurnitureConfigurator.tsx`의 Desk/Wardrobe에는 현재 가격 표시 연결 자체가 없다.

가능한 구현 경로는 다음과 같다.

1. **가격 입력 adapter**: mm 구조 좌표/부품 subtype/제품군·스타일·색상 ID/카테고리를 손실 없이 전달한다. 시각적 메시의 중복 판재, 뒷판용 지지판, 분절된 가로판을 원본의 경제적 부품 개수와 혼동하지 않도록 한다. Wardrobe의 `sourceGeometryMm`은 출발점으로 쓸 수 있으나 필수 필드와 source type별 매핑 검사가 필요하다.
2. **계수 snapshot**: 실제 관찰된 공개 요청의 응답, 지역, 시각, SHA, 버전을 기록한다. 계수 누락을 0이나 임의 숫자로 대체하지 않는다. 동일 엔진에 snapshot을 넣어 참조가격을 재현한다.
3. **지역별 정책**: market, locale, currency, price-list version, conversion multiplier, rounding, promotion policy를 명시한다. 표시 언어 변경만으로 금액 자체가 변하지 않게 한다. KR/US/JP 자료가 없다면 해당 시장 가격을 Tylko와 동가라고 표시하지 않는다.
4. **견적 계약**: 일반/할인 가격, 통화, market, 계산 버전, 디자인 fingerprint, 출처/추정 여부를 함께 반환한다. 기존 숫자만 있는 cart/order 저장값은 통화 간 혼합 방지가 필요하다.
5. **서버 검증**: 현 `/api/orders`는 클라이언트 `item.price`를 합산·저장한다. 새로운 다통화 견적 연결 시 서버가 디자인과 market에 맞는 견적을 재계산/검증하는 계약이 필요하다. 화면 환산만 변경해서 기존 KRW 결제에 외화 숫자를 넣으면 안 된다.
6. **대조검사**: coefficient snapshot + 동일 원본 geometry를 넣어 엔진 결과를 확인하고, 독립 화면 사례에서 일반/프로모션 가격까지 대조한다. 가격001의 숨은 전체 상태는 null이므로 현재는 완전한 계산 fixture가 아니다.

즉시 다음으로 확보할 자료: 브라우저에서 실제 관찰된 계수/프로모션 요청 URL과 JSON, 해당 요청의 지역·제품군·시각, 동일 구성의 완전한 가격 입력, EUR 이외 시장의 지원 여부·환산 설정. API 주소를 추측해서 요청하거나 가격 차액만으로 계수표를 발명할 필요는 없다.

## 검증 상태

- 출처 SHA 일치, 모듈 정적 경로, HTML Nuxt 가격/시장 데이터 해제 확인 완료.
- `/tmp/*.json`에서 `type_01_regional_increase_factor`, `coefficientsUrl`, `logistic_front_area`를 검색했으나 계수 snapshot 발견되지 않음. 임시 디렉터리 전체나 외부 시스템에 존재하지 않는다고 단정하지는 않음.
- 가격 엔진 숫자 실행 대조, 원본 네트워크 재관찰, KR/US/JP 가격표, 운영 통합은 미완료.
- 최초 조사 시 문서만 추가. 이후 신규 계산기의 검증은 아래와 같다.

## 후속 구현 — 계수 미설정 시 가격 없음

리더의 명시적 후속 요청으로 다음 두 파일만 추가했다. 기존 화면/카트/주문과의 연결은 리더 담당이다.

- `src/lib/commerce/reference-pricing.ts`
- `scripts/commerce/reference-pricing.test.mjs`

`calculateReferenceShelfPrice(input, snapshot)`은 공개 코드에서 확인한 산술 단계를 독립 TypeScript로 구현한다. 원본 번들/모듈을 import하거나 복사해 실행하지 않는다. 상용 계수·환율·프로모션 기본값은 하나도 포함하지 않는다.

입력 계약:

- `kind:'shelf'`, `family:'classic'|'modern'|'veneer'`, 6개 `style`, 지원 선반 `category`, 원본 `materialId`.
- `widthMm/heightMm/depthMm`, `{x1,x2,y1,y2}` 경제적 부품 배열: horizontals/verticals/supports/backs/doors/drawers/inserts. inserts에는 orientation도 필요하다.
- `longLegCount`, `hasPlinth`, `cableManagementCount`. 배열·개수는 모두 명시하며 누락을 0으로 추정하지 않는다.
- Desk/Wardrobe 종류와 desk 카테고리는 거부한다. 알려지지 않은 Classic/Modern 재질 ID도 무료 색상으로 간주하지 않는다.

snapshot 계약:

- `version`, `market`, `currency`, `sourceUrl`, `capturedAt`, `coefficients`.
- `vatFactor`, `eurFactor`, `regionalMultiplier`를 호출자가 명시한다. 코드에서 KR/US/JP/EU 값으로 추정하지 않는다.
- `promotionPercent:null`이면 할인 가격은 null이며, 0은 명시된 0%와 구별한다.

결과는 `status:'available'` 및 10단계 항목, `regularEur`, `regular`, `promotional`, market/currency/snapshotVersion 또는 `status:'unavailable'`와 이유다. 선택된 계산 경로의 계수가 없거나 유한하지 않으면 `missing-coefficients`와 키 목록을 반환한다. 일부 원본 코드의 누락 키→0 관용 처리는 안전한 미설정 표시를 위해 유지하지 않았다. 숫자 결과의 유한성/안전정수, 양수 변환계수, 유효한 면적 구간을 검사한다.

검증:

- `node --test scripts/commerce/reference-pricing.test.mjs`: **11 PASS**. 누락 rate/다른 제품군 거부, 명시적 0, Modern 전체 단계 산술, 치수 추가금 최댓값, 긴 가로판 개수, 지지판/뒷판 중복제외, 문/서랍/다리/케이블, Mosaic 누적 순서, Modern 색상군 우선순위/Veneer 분기, EUR 절사→지역 반올림, 잘못된 값 포함.
- 위 가격들은 **테스트 전용 합성 계수**다. 실제 Tylko 계수/가격 동치 검사로 주장하지 않는다.
- 두 신규 파일 targeted ESLint **0 오류/0 경고**, 신규 계산기 strict isolated `tsc --noEmit` **PASS**.
- 전체 lint/build는 리더 통합 검증 담당이며 이 하위 작업에서는 실행하지 않았다. 계수표·실제 가격입력 미확보, 운영 adapter 미연결이므로 실제 판매 가능한 견적은 아직 없음.
