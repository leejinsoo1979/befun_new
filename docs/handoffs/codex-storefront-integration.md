# Codex 쇼핑몰 연결 담당 / R3-SAVE · R2.1-SAVE · R1-ENTRY 진행·인계

- 실제 작업: befun 메인 tylko로 클론코딩
- 작업 ID: 01a1341b-6348-7bf0-afc8-9c89fb62522b
- 새 제품군 계약: [R1.3](../development/furniture-parity/contracts.md) — UI view/intent 게시, 공통 상태 적용/저장 계약 미게시. 기존 선반은 아래 R3 READY 함수를 사용.
- 현재 지시서: [R3-SAVE](../development/furniture-parity/assignments/r3/03-storefront.md), 이전 [R2.1-SAVE](../development/furniture-parity/assignments/03-storefront.md)
- 상태: **SAVE-BASE-READY / SAVE-CONSUMER-PATCH 게시. R3 허용 소스의 기존 선반 저장·URL·공유 복구 수정·검증 완료.** 읽기 전용 configurator 소비자의 legacy URL 마운트/수동 snapshot/링크 초기화는 제출 patch의 리더 적용 대기. 실제 DB 왕복만 미설정으로 blocked. 새 제품군·접합 공통 DTO 연결과 구분.
- 실제 세션: `befun 메인 tylko로 클론코딩` / `01a1341b-6348-7bf0-afc8-9c89fb62522b` / 화면 왼쪽 세 번째 Codex
- 착수 시각: 2026-10-13 21:42 KST
- R2.1 수정 파일(과거 완료): db.ts, 두 design API, ProductConfigurator saveDesign/결과 안내, share page fetch 오류/재시도, scripts/storefront-save-validation/**, 본 handoff 및 team-tasks. 당시 정상 복구는 원문 보존했으며 R3에서 별도 위임받아 수정.
- 갤러리 배정 변경: 최신 리더 회수 기록과 소스 추가를 확인. 리더 잠금 4개 소스는 수정하지 않으며 후속 진입 연결 배정을 수행.

## R3 최종 인계 — SAVE-BASE-READY / SAVE-CONSUMER-PATCH

### 수정한 실제 경로

- `configuration.ts`: 현재 snapshot은 활성 행만 사용해 body 높이를 계산하고 문/서랍 배열·행별 mode map을 복사합니다. 미사용 패딩/가변 참조로 저장 당시 설계가 바뀌지 않습니다. restore는 기존 parser로 검증한 뒤 치수·행·스타일을 함께 설정하고 **색상→baseType/legFinish→하드웨어→지원 규칙 보정** 순으로 적용합니다. 유효 입력 true / 무효 입력 false이며 무효 입력은 store를 변경하지 않습니다.
- `savedDesign.ts`: baseType 없음은 Standard, legFinish 없음은 Silver. 잘못된 enum 거부. 지원 여부는 리더의 supportsLongLegs 함수를 재사용합니다. **최신 사용자 “클래식도”에 맞춰 Classic/Natural 모두 Legs·Silver/Black 보존**,24cm/Pixel만 Standard로 보정합니다. 별도 재질 제한을 발명하지 않았습니다. 구버전의 문/서랍 layer를 기존 resolveHardwareRows로 mode에 정규화하며 로컬 저장·공유 URL에는 검증·정규화한 snapshot을 기록합니다. 구버전 중복 항목도 같은 canonical JSON으로 비교합니다.
- `sharing.ts`: 기존 선반 parser를 재사용해 JSON/legacy URL을 검증합니다. 신규 URL에는 colorCategory와 body height를 포함하고 기존 query/hash를 보존합니다. 구 URL은 C_/N_/S_/Mix 색상 계열을 복구하고 활성 행으로 높이를 계산하며 base/finish 기본값을 적용합니다. 한 번/두 번 URL 인코딩 모두 지원. deserialize/decode 반환 타입도 검증된 SavedDesign config라서 restore에 바로 전달됩니다. 새 connector/제품군 schema는 추가하지 않았습니다.
- `share/[code]/page.tsx`: 조회200의 config도 parser를 통과한 경우만 표시·복구합니다. 수동 setter 복구를 실제 restoreSavedConfiguration으로 교체하여 이전 설계 높이에 따른 행 소실과 하드웨어 미보정을 수정했습니다. 표시 높이는 body+baseHeight로 상품/목록과 맞춥니다. R2.1의503/404/500/네트워크·재시도 안내는 유지합니다.
- `SavedDesignPages.tsx`: 손상된/읽을 수 없는 localStorage가 이전 목록을 계속 보여주는 cache를 비웁니다. 기존 목록→design-preview→ProductConfigurator의 실제 restore 연결과 브랜드/버튼/간격은 유지합니다.

### 사례별 검증

공통 입력:163cm×body122cm×40cm,41%,행 `[28,38,18,28]`,뒷판ON,문 `[0,3]`,서랍 `[1,3]`,mode `{0:13,1:31,3:22}`. Legs/Black/Pattern과 Standard/Silver/Mosaic을 각각 검사했습니다. 순수 함수·실제 store 검사와 브라우저/API mock·실제DB는 분리합니다.

| 사례 ID | 입력·초기상태 / 조작 | 기대 / 실제 | 결과·증거 |
|---|---|---|---|
| R3-SAVE-01 | Standard/Legs 실제 store 및 Chrome 로컬 저장→목록→열기→복구 | 전체 snapshot 유지; Legs 총높이133cm,Standard123cm | **pass**. 실제503→로컬 URL의 모든 필드 확인. [브라우저 사례](../../scripts/storefront-save-validation/r3-browser-cases.json), r3-save.test.mjs |
| R3-SAVE-02 | Pattern/Mosaic + 위 개별 행·13/31/22 hardware, 이전 store32cm/1행 | 모든 행·스타일·밀도·하드웨어 복구 | **pass**. 이전 share handler는4행→1행 소실, 수정 후4행/전체필드 동일. [실제 handler/store 회귀](../../scripts/storefront-save-validation/r3-regression.json) |
| R3-SAVE-03 | 구base없음 저장·구 URL·신 URL·4재질·이중encoding | Standard/Silver 기본값,색상계열·행 높이 보존 | **utility/local pass**. `/configurator?state=` 소비 마운트는 아래 patch 리더 적용 대기. 운영 연결 완료로 확대하지 않음 |
| R3-SAVE-04 |24cm/Pixel+Legs,잘못된 enum,Classic/Natural+두 finish |24cm/Pixel→Standard,enum거부;Classic/Natural Legs 유지 | **pass**. 최신 리더 규칙 반영. mock GET200 unknown baseType도 오류/복구버튼0 |
| R3-SAVE-05 | 실제503 vs mock POST200 R3BASE01/02→GET200,다음 불완전200 | 로컬/서버 제목·URL 구분,오래된 성공 링크 없음 | **pass**. 불완전200 대화상자0/버튼활성. **mock200은 실DB 성공 아님**. [Legs 복구 캡처](../../scripts/storefront-save-validation/screenshots/r3/legs-restored.jpg) |
| R3-SAVE-06 | 목록열기→새로고침→재저장,Legs 복구→Classic→Natural→재저장 | reload JSON 동일,재질변경 뒤 Legs/Black·행/hardware 유지 | **pass**. Chrome 공개 링크 DTO 비교 true;Natural N_Oak 저장 확인 |
| 실제DB왕복 | 실제 POST200→GET200 | 실제 저장 JSON 동일 | **blocked**. DATABASE_URL 미설정,다른 프로젝트DB/환경 초기화 없음 |

### SAVE-CONSUMER-PATCH — 리더 적용 요청

대상은 `src/app/configurator/page.tsx`의 **getDesignConfig / URL 복구 useEffect / handleSaveDesign 및 필요한 import**만입니다. 패널 JSX/가격/cart/AR 구현을 수정하지 않습니다. [적용할 diff](../../scripts/storefront-save-validation/r3-consumer.patch)를 게시했고 공유 소스에는 적용하지 않았습니다.

1. getDesignConfig의 수동 DTO는 recalculateRows 이후12개 패딩 rowHeights를 그대로 보내지만 numRows는 활성4행입니다. 이 서버 저장은200이어도 UI/parser 복구가 거부됩니다. currentConfiguration을 재사용해 활성 행/body높이/base/finish/hardware snapshot을 통일합니다. R3 회귀 검사에서 원래 DTO는 null,대체 snapshot은 전체 config 일치입니다.
2. encode/decode 유틸은 존재하지만 configurator page에서 레거시 `?state=`를 읽는 소비가 없습니다. 마운트 effect에서 decode→restore로 연결하며 무효 링크는 오류 안내만 합니다.
3. standalone 저장 시작 시 과거 공유·AR 링크를 지우고 pending 중 재진입을 막습니다.200의 id/8문자 shareCode 검증 이후에만 서버 URL을 만듭니다. 기존 실패 안내/finally/AR 소비는 보존합니다.

`patch --dry-run -p1 -i scripts/storefront-save-validation/r3-consumer.patch` 통과. 별도 preview `/private/tmp/befun-r3-save-consumer-preview.tsx`를 **격리 snapshot에만** 반영해 tsc 통과. ProductConfigurator는 이미 currentConfiguration/restoreSavedConfiguration을 사용하므로 별도 patch가 없습니다. UI 마운트 해제 뒤 리더가 적용·운영 URL/standalone 재저장 검증을 이어 주세요.

### 최종 검증·소스 fingerprint

- R3 18개 + parser26개 = **44/44 pass**, 최종 sharing 반환 타입 변경 포함하여 이번 차수에 실제 실행. Node의 기존 MODULE_TYPELESS_PACKAGE_JSON 경고만 있으며 package.json 변경 없음.
- 전체 `npm run lint`:오류0/기존경고7. 최종 변경 파일 ESLint:오류0/기존 share img 경고1. React 점검: invalid config가 렌더/restore로 들어가지 않음,기존 abort/retry 유지,local list snapshot은 안정된 empty를 반환,브랜드·스타일 변경 없음.
- **최종 격리 webpack build/TypeScript/static generation pass**: `/private/tmp/befun-r3-save-final-rrwzs0xs`. 소스 capture `2026-10-13T23:24:22.900266Z`(08:24 KST),470개 소스 SHA256. 앞선 snapshot은 동시 ASM 작업 중 GuidePlayback.legAction 누락으로 실패했으나 실제 공유 소스에서는 담당자가 이미 추가한 것을 확인해 **격리 복사본의 ASM 소스만 최신화**한 뒤 재검증했습니다. ASM 공유 소스 수정/원복 없음. 첫08:14 snapshot 통과를 최종 통과로 재사용하지 않았습니다.
- [최종 owned6파일 hash·build 일치·검증 결과](../../scripts/storefront-save-validation/r3-verification.json), [검사 실행 방법](../../scripts/storefront-save-validation/README.md). 공개 asset은08:14 격리 복사본을 사용,설치 node_modules는 기존 설치를 읽기 재사용. 공유 `.next`/서버 종료·재시작 없음.
- Chrome:기존 VPN 프로필의 본인 탭만 사용,전역 viewport 변경 없음. design API만 mock했고 Document/다른API는 대체하지 않았습니다. 패턴을 모두 비우고 테스트 탭 닫음. 실제DB 레코드0,로컬에는 명시적 R3 테스트 예시3개가 남습니다. 캡처는 mock 조회 복구 후 실제 옵션의 native JPEG이며AI/이미지편집 없음.

### READY·남은 항목·잠금 해제

READY exports: `currentConfiguration`, `restoreSavedConfiguration`, `parseSavedDesign`, `saveLocalDesign`, `serializeDesignConfig`, `deserializeDesignConfig`, `encodeDesignToURL`, `decodeDesignFromURL`. 운영 연결: `/saved-designs`→`/design-preview?design=...`, `/share/[code]`→`/configurator` 복구. **SAVE-BASE-READY / SAVE-CONSUMER-PATCH 게시,본 차수의 허용 소스·검사·handoff 잠금 해제**. 리더/QA에 이 인계와 team-tasks로 알립니다.

남은 항목: 읽기 전용 소비자 patch의 리더 적용/운영 확인,실제 DB 환경 제공 뒤 왕복검사,새 제품군/접합 DTO의 리더 공통 계약. connector 저장을 임의 형식으로 추가하지 않았으며 기존 ENTRY-CONNECTOR-003의8개 소비 지점 연결 요청을 유지합니다. 구현·운영 연결·원본 일치·제조 치수 확정은 별개입니다.

## R3-SAVE 수신·파일 잠금 — 2026-10-14 08:06 KST

사용자의 [R3-SAVE](../development/furniture-parity/assignments/r3/03-storefront.md) 직접 지시와 [전체 R3](../development/furniture-parity/dispatch-r3.md)를 수신했습니다. 실제 세션: `befun 메인 tylko로 클론코딩` / `01a1341b-6348-7bf0-afc8-9c89fb62522b` / 왼쪽3 Codex 쇼핑몰. 잠금: `src/components/storefront/{configuration.ts,savedDesign.ts,savedDesign.test.ts,SavedDesignPages.tsx}`, `src/lib/sharing.ts`, `src/app/share/[code]/page.tsx`, `scripts/storefront-save-validation/**`, 본 handoff. R3가 이전 공유 page 정상 복구 리더 소유권보다 우선하며 이 파일을 직접 연결합니다.

기존 선반 snapshot/restore와 baseType 저장·URL·로컬 목록·공유 복구를 추적하고 누락을 수정합니다. 색상→지원 baseType→하드웨어 복구 및 구버전/잘못된 enum을 실제 store로 검증합니다. ProductConfigurator/configurator page·store/type·DB/API/env/가격/gallery는 읽기 전용, 필요 소비자 handler 변경은 SAVE-CONSUMER-PATCH로 제출합니다. 새 제품군/connector 중복 schema를 만들지 않으며 DB 미설정은 실제 DB 왕복만 blocked로 남깁니다. 완료된 R2.1 증거는 아래에 보존합니다.

## SAVE-10 후속 재개 — 2026-10-14 07:54 KST

사용자 “안된거 마저해”에 따라 남은 실제 저장 검증과 CORE-01 준비 상태를 재확인했습니다. 실행 환경과 프로젝트 env 파일에 DATABASE_URL이 아직 없습니다. Docker의 실행 PostgreSQL 컨테이너는 `sprintable-main-db-1`(5432), `archi-agent-postgres`(5433)로 다른 프로젝트 이름이며, Befun 연결 대상으로 승인되거나 지정된 근거가 없습니다. 컨테이너 이름·포트만 조회했고 credentials/전체 환경을 출력하거나 그 DB를 연결·초기화하지 않았습니다.

사용자에게 **기존 Befun DB 설정 파일 경로 또는 Befun 전용 개발 DB 신규 구성** 중 필요한 연결 정보를 요청했습니다. assignments/03-storefront.md의 “DB 환경값을 발명하거나 로컬 DB를 자동 초기화하지 않는다” 범위를 유지합니다. 실제 왕복은 아직 blocked이며, 기존 mock 성공을 실제 성공으로 바꾸지 않습니다.

준비 사항: 현재 Prisma schema에 Design/User 및 기존 auth/order 관계가 있고 migrations 디렉터리는 없습니다. 설치 CLI의 `migrate diff --help`에서 빈 schema→현재 datamodel의 SQL 비교 명령을 확인했습니다. DB에 접속하지 않는 diff 실행은 종료0이었지만 SQL/지정 output 파일이 생성되지 않았으므로 **초기화 SQL 준비 성공으로 기록하지 않습니다**. 실제 DB 대상이 정해지면 이 CLI 결과도 확인해야 합니다.

연결 대상 확정 후 실행 순서:

1. 기존 DB이면 읽기 전용으로 연결·Design 테이블 준비 상태를 확인. 신규 구성 선택이면 다른 프로젝트와 분리한 Befun 전용 DB에만 현재 schema를 적용. 기존 DB에 초기화 SQL을 자동 적용하지 않음.
2. 공유 dev 서버를 임의 종료하지 않고 설정 반영을 확인한 뒤 `live.mjs <실제 서버 URL> --round-trip` 실행. 실제 POST200→반환 code GET200→config JSON 비교 및 실제 없는 code404 확인. 테스트 설계1개가 남는 것을 기록.
3. mock을 사용하지 않는 브라우저 상품 저장→서버 공유 링크→공유 조회→기존 정상 config 복구 검증. 서버 성공·로컬 보관 결과를 나누어 기록.

CORE-01의 `src/lib/furniture` 공통 적용/직렬화 함수는 아직 없으므로 접합 방식과 새 제품 진입 연결은 리더 산출물 요청을 유지합니다. 이 후속 확인에서 앱 소스/env/schema/공유 서버 변경 없음. 문서만 갱신했으므로 기존 lint/build 검증을 새로운 실행 결과로 재기록하지 않음. 본 handoff 잠금 해제.

## R2.1-SAVE 최종 인계 — 2026-10-14

### 구현과 실제 연결

- `src/lib/db.ts`: PrismaPg에 `{connectionString}` 설정 객체 전달. 비어 있는 DATABASE_URL에서 기본 PG 환경으로 연결하지 않음. 기존 PrismaClient 타입의 export를 유지하는 lazy proxy로 import 단계에는 client를 생성하지 않고, 실제 DB 접근 시 명시적 DatabaseConfigurationError 발생. Prisma 메서드는 원래 client receiver에 bind. 이전 잘못된 `global.prisma`를 새 개발 cache에서 재사용하지 않으며 URL 누락 상태에서는 이전 cache도 사용하지 않음.
- 두 design API: 정상200 body와 익명 POST/userId:null, 로그인 목록 소유권 필터, share 조회 select 유지. JSON/필수 config의 객체 여부를 검사하되 새로운 설계 schema/접합 필드는 추가하지 않음. 드라이버의 message/cause/query/URL을 출력하지 않고 예외 name/안전한 code만 로그.
- 적용한 오류 계약: **400 INVALID_DESIGN / 401 AUTH_REQUIRED / 503 DESIGN_STORAGE_UNAVAILABLE / 500 DESIGN_STORAGE_FAILED / 404 DESIGN_NOT_FOUND**. 기존 `error` 문구 필드를 유지. 익명 목록은 DB 미설정이어도 먼저401을 반환.
- `ProductConfigurator.tsx`: 400은 입력 오류 안내만 표시하고 링크/로컬 성공으로 바꾸지 않음. 503·500·네트워크 실패는 기존 parseSavedDesign 유효성 확인 후 별도 로컬 보관 결과로 처리. 로컬 보관 이유와 서버 저장 성공 미확인을 명시. 서버200은 유효한 반환 id/8문자 shareCode로만 `/share/{code}` 생성. 잘못된200응답은 오류 안내만 표시하며 오래된 성공 링크 제거. 저장 pending은 finally에서 해제.
- `share/[code]/page.tsx`: 없는 디자인404, 서비스 미준비503, 서버500, 네트워크 오류의 안내를 구분. 재시도는 같은 code를 다시 fetch. AbortController/active guard로 폐기된 요청을 무시하고, 성공 응답의 config 객체만 design에 적용하여 오류 응답으로 이전 성공 객체를 덮지 않음. 실패 시 임의 기본 디자인/복구 버튼을 표시하지 않음.
- **정상 config 복구(handleLoadDesign) 원문 그대로 보존**: 시작 전후 SHA256 `4238a63dff1f0c50a6220a67c4cee8e3a16f69fd90ce03f891c8887224fe2567` 일치. 리더 정상 복구 작업과 동시 편집하지 않음.
- auth/schema/env/generated client/공통 sharing·savedDesign·접합 저장·주문/결제 정책 수정 없음. 라이브러리 추가, DB 초기화/migration, 실제 주문/결제, 공유 dev 서버 종료/재시작·공유 `.next` 삭제 없음.

### 검증 — mock과 실제 서버/DB 구분

| 항목 | 결과 | 실제 검증 범위 |
|---|---|---|
| SAVE-01 별도 프로세스 import | pass | `node scripts/storefront-save-validation/import-smoke.mjs`: 실제 generated client/설치 adapter/auth adapter, mock 없이 import/미설정 접근 guard. 연결·SQL은 없음 |
| SAVE-02~07 서버 회귀 | 21/21 pass | `node --test scripts/storefront-save-validation/save.test.mjs`: 실제 db/route 코드 + 설치 PrismaPg, Prisma query/session은 fixture. adapter 객체·HMR 이전 cache 배제·메서드 bind·401/400/503/500/404·200 JSON/소유권/로그 검사. **실제 DB 성공 아님** |
| 저장 legacy parser | 17/17 pass | 기존 `node --experimental-strip-types --test src/components/storefront/savedDesign.test.ts` |
| 실제3003 API·소비자 | pass | live.mjs --unconfigured: GET share503/code, 잘못된 POST3종400/code, 익명 목록401/code, auth/session200, 주문 GET401, login200, configurator200, 유효 POST503/code. 실제 DB를 configured로 만들지 않음 |
| 실제 상품503 UI | pass | `디자인을 이 브라우저에 보관했습니다`, 서비스 미준비 이유·서버 성공 미확인, design-preview URL 표시 |
| SAVE-08 mock 오류 | pass | CDP design fetch만 mock: 상품400 안내/대화상자0/버튼 enabled,500 별도 로컬 안내, 네트워크 실패 별도 로컬 안내 |
| mock200/불완전200 | pass | 반환 R2SAVE01 서버 링크와 서버 저장 제목 / shareCode 없는200은 오류·대화상자0. **실제 DB 레코드 없음** |
| 공유404/500/네트워크 | pass | 각 API mock에서 별도 안내.404는 없는 디자인,500/네트워크는 재시도 표시. mock 해제 후 실제503로 원복 |
| SAVE-09 공유 재시도 | pass | **실제503 → 같은 R2MOCK01 요청의 mock200**.144cm/grid/density37 표시 후 기존 정상 복구 클릭으로144/37 적용 확인. 실제 DB 조회 성공이 아님 |
| SAVE-10 실제 DB 왕복 | **blocked** | DATABASE_URL 미설정. 실제 POST200→GET200 또는 존재하지 않는 code의 실DB404를 검증하지 않음. DB URL/자격 증명/테이블을 발명·초기화하지 않음 |
| 전체 lint | pass | `npm run lint`: 오류0 / 기존 경고7. 마지막 변경 파일·검사 폴더 ESLint는 오류0 / 공유 page의 기존 img 경고1 |
| 최종 격리 build/type | pass | `/private/tmp/befun-r21-save-build-p6b_0yod`에서 최종 API 입력 보완 포함 `npm run build -- --webpack`: compilation/TypeScript/static generation 통과. 기존 DB 소비자 type 호환 확인 |

API/DB mock, 실제 import/미설정 서버, 브라우저 응답 mock의 범위는 서로 구분합니다. SAVE-10을 나머지 통과로 대체하지 않습니다. localhost 검사의 최초 sandbox EPERM은 승인된 직접 서버 검사로 재시도했으며 앱 오류로 기록하지 않았습니다.

### 재현·산출물

- 실행 방법: [검사 README](../../scripts/storefront-save-validation/README.md). actual DB가 이미 설정된 테스트 서버에서 `live.mjs http://localhost:3003 --round-trip`으로 테스트 설계1개 저장→조회/JSON 비교가 가능하며 삭제/주문/migration은 실행하지 않음.
- [브라우저10개 사례와 실제 DB blocked](../../scripts/storefront-save-validation/browser-cases.json). 테스트 탭의 raw interception patterns는 모두 비워 mock을 해제했고 가짜 서버 링크를 사용자 작업 탭에 남기지 않음. 테스트 탭은 ephemeral.
- [실제 공유503 화면 캡처](../../scripts/storefront-save-validation/screenshots/share-unavailable.jpg). 실제 미설정 서버 응답이며 모의 성공/실DB 왕복 캡처가 아님.

### 리더 알림 / 파일 잠금 해제

**R2.1-SAVE 지정 코드·사용자 오류 흐름 작업 완료, 이번 소스 잠금 해제.** 특히 `src/app/share/[code]/page.tsx` fetch 오류/재시도 편집이 끝났으므로 리더가 정상 config 복구 영역 작업을 시작할 수 있습니다. 정상 복구 원문 보존 해시와 검증 결과를 위에 인계합니다. db/design API/ProductConfigurator의 이번 소스도 해제합니다.

리더에게 남은 사항: 실제 테스트 DB 환경이 제공되면 SAVE-10 실행, CORE-01 공통 상태·접합 직렬화/복구 게시와 다음 연결. R2.1-SAVE 완료를 설계별 접합 저장·새 제품군 통합 완료로 확대하지 않습니다. 이전 ENTRY-SAVE-004의 ‘코드 수정 미완료’ 기록은 과거 감사 시점이며 이번 실제 수정 결과가 우선합니다.

## 진행·근거

### R2.1-SAVE 후속 범위 수신

사용자 assignments/03-storefront.md 직접 지시 수신. 기존 R2 서버 수정에 고정 오류 code 계약과 상품 saveDesign/결과 안내, share page fetch 오류/재시도 처리를 연결합니다. 해당 두 소스 영역 잠금을 추가 등록했으며 정상 config 복구(handleLoadDesign)는 원문 보존합니다. 실제 DB 왕복은 환경 미설정으로 blocked, mock DB/API 성공 검사와 분리합니다. 완료 시 share page 잠금 해제를 team-tasks와 본 handoff에 알려 리더 복구 작업과 겹치지 않게 합니다.

### R2-SAVE 실제 수정 착수 — 2026-10-14 06:18 KST

사용자 R2-SAVE 직접 지시와 dispatch-r2의 왼쪽3 소유권 위임 수신. 수정/잠금: `src/lib/db.ts`, 설계 POST/list 및 `[code]` GET route, 신규 `scripts/storefront-save-validation/**`, 본 handoff. 실제 adapter 인수 오류와 DB 미설정 실패 처리를 수정합니다. env/schema/공통 직렬화/접합 저장/주문·결제·인증 정책은 변경하지 않습니다. 공통 적용 API가 없어도 독립 가능한 서버 수정을 먼저 수행합니다.

### 최신 왼쪽3 후속 착수 — 2026-10-14 00:07 KST

사용자 지시와 terminal-instructions 최신 왼쪽3, connector-systems 및 connector-clip-003/004를 수신했습니다. 현재 조사: 상품 진입/설계 snapshot/서버 저장/로컬 fallback/공유 복구에서 접합 방식이 누락되는 경계, 서버 저장 실패의 실제 상태·로그. 잠금은 본 handoff만이며 공통 저장 구조를 구현하지 않습니다. 접합 system은 OVVO/Tylko 클립을 구분하고 미확정 부품 치수·색상별 잠금 의미·규격 버전을 임의 생성하지 않습니다.

05 및 terminal-instructions 세 번째 지시, R1.2, 갤러리 사례를 읽었습니다. 공통 타입/함수 구현 전에는 진입점 조사와 매핑 제안을 진행하라는 지시에 따라 현재 구현 여부를 구분합니다. 21:42 확인 시 `src/types/furniture.ts`, `src/lib/furniture/**`는 존재하지 않았습니다.

### 실제 진입점과 교체할 적용 지점

| 진입 | 현재 경로/전달값 | 실제 적용 | 리더 계약 연결 지점 |
|---|---|---|---|
| 카테고리 시작 | `/configurator-intro` → category별 고정 CatalogProduct, model은 color/category 변경 | `StorefrontUI.useConfigureProduct` → `loadProductConfiguration` → `/configurator` | 관찰 category/model → 검증 registry 조회 → 동일 preset 적용 함수 |
| 목록/검색/즐겨찾기 | `ProductCard` → `/furniture/{id}`; 6개 legacy 상품 | `CatalogPages.ProductPage` → `ProductConfigurator` effect → `loadProductConfiguration` | 상품 메타데이터에 검증 registry 참조. 렌더 때 동일 적용 함수 |
| 상세 전체 화면 | `/furniture/{id}`의 전체 화면 → `/configurator` | 현재 메모리 store 유지. URL에 preset/config 없음 | 같은 상태를 직렬화·복구할 진입 계약; 새로고침 정책 필요 |
| 상품 저장/공유 | `currentConfiguration()` → POST `/api/designs`; 실패 시 `saveLocalDesign(version1)` | 서버 성공 `/share/{code}`, 실패 `/design-preview?design=...` | 공통 직렬화/검증. 저장 가능 여부·원인 분리 |
| 저장 목록 → 편집 | `/saved-designs` → `/design-preview?design=...` | `parseSavedDesign` → `SharedDesignPage` → `ProductConfigurator(configuration)` → `restoreSavedConfiguration` | legacy 변환과 새 버전 복구도 같은 공통 적용 함수 |
| URL 포함 공유 | `/design-preview?design=...` | version1 validator, 위 로컬 복구와 동일 | 새 family/구획 seed 정보를 보존하는 버전 계약 |
| 서버 공유 | `/share/{code}` → GET `/api/designs/{code}` → 사용자 편집 | storefront 밖 page의 `handleLoadDesign`이 store를 개별 설정한 뒤 `/configurator` | 리더 소유 파일. 공통 함수로 연결 요청, storefront는 직접 수정 안 함 |
| 상단 standalone 저장/장바구니 | `/configurator`의 `getDesignConfig()` | 별도 snapshot 함수와 서버 저장 경로, 로컬 fallback 없음 | 리더 소유 page. 동일 공통 직렬화·적용 계약으로 합류 요청 |

현행 `configuration.ts`는 기존 cm 선반 경계입니다. `loadProductConfiguration`은 hardware reset 후 grid/density50/thickness2/back true와 행·색·도어를 적용합니다. 저장 복구는 rowStyles까지 복구·reconcile합니다. 기존 `currentConfiguration`에는 category/family/generator/panelProfile/presetVersion/schemaVersion/sectionId/hidden seed가 없습니다. 이 구조를 새 가구 registry와 동일하다고 간주하면 제품군·구획 정보를 잃습니다. 가격 계산은 기존 그대로 유지했습니다.

### 기존 13개 선택과 R1 11개 category의 관계

| 기존 선택 | 현행 선택 이후 | 관찰과의 차이 / 연결 방침 |
|---|---|---|
| sideboard | sideboard-terra + 공통 모델4개 색상 대체 | 실제 Classic/Modern/Edge/Tone4종 family별 registry 필요 |
| bookcase | bookcase-brown + 동일 모델4개 색상 대체 | 원본 row/Edge/Tone14 별도 경로 유지 |
| wallstorage | wall-green + 동일 모델4개 색상 대체 | 원본 Classic/Modern Bookcase, Edge/Tone Wallstorage 구분 |
| wardrobe | reference 목록 | 관찰 Edge Cabinet4 / Tone Wardrobe3. 선반으로 대체 금지 |
| desk | reference 목록 | 관찰 Original2종 Desk, 높이/다리공간/구획 지원 확인 후 연결 |
| dressing_table | reference 목록 | 관찰 Original2종 Desk, category는 별도 보존 |
| tv-stand | tv-brown + 동일 모델4개 색상 대체 | Original Sideboard / Edge TvStand / Tone Sideboard 별도 registry |
| chest-of-drawers | reference 목록 | Original Sideboard / Edge Chest / Tone Sideboard 구분 |
| shoerack | reference 목록 | 관찰 Original2+Edge. collection을 이름만으로 ShoeRack에 강제 매핑 금지 |
| bedside_table | reference 목록 | 관찰4종. 실제 크기/하드웨어 적용 계약 필요 |
| vinyl_storage | reference 목록 | 원본은 모델 선택 없이 직접 구성. generic 모델4개 단계 만들지 않음 |
| wallunits | wall-green으로 잘못 대체 | R1 11개 범위 밖. 항목 보존, 별도 근거/registry가 없으면 reference/준비 상태 |
| sofas | reference 목록 | R1 가구 범위 밖. 기존 소파 reference 진입 보존 |

관찰 링크와 현재 Befun legacy SKU는 같은 preset이 아닙니다. 6개 상품의 이름·이미지·색 유사성만으로 아래 원본 ID에 자동 연결하지 않습니다. 모든34개 매핑은 문서 마지막 표에 정리했습니다.

## 검증

### 갤러리 교차 확인 — 리더 구현 보존, 3003 Chrome

- 관찰 JSON과 런타임 `galleryMaterials.ts`의 스와치12종/사진96개 URL 및 배열 순서 정확히 일치(Python read-only 비교).
- 12종을 순서대로 실제 클릭: 각 선택값과 재질별 사진8장 URL 교체 확인. 각 선택 직후 모든8개 이미지가 `complete && naturalWidth > 0`; 오류 안내0개. 이미 캐시된 요청을 포함할 수 있으며 신규 다운로드96회 성공을 별도 주장하지 않음.
- 블루 → 옐로 → 블루 복귀 후 블루 사진8개 모두 로딩 확인. 블루 사진2 확대 열림·Escape 닫힘, 모바일 월넛 사진1의 확대 src 일치·닫기 확인.
- 상단 DOM slider 값 전후 `[50,50,90,4,50]` 동일, 소개 치수 `90cm / 123cm / 32cm` 동일. 갤러리 소스가 공통 가구 store를 import/수정하지 않는 것도 확인. 전체 새 R1 직렬화 상태의 동치는 공통 타입 부재로 미검증.
- 선택 label/input32px, 아이콘24px, 선택 테두리2px `rgb(72,72,70)`, desktop 우측 정렬과 margin-bottom40px 확인. ArrowRight로 블루 다음 캐시미어 선택 확인.
- 모바일390×844: document width390, gallery width390, toolbar client358 / scroll436; 재질 영역만 가로 스크롤. 테스트 viewport 원복.
- `bookcase-plum`: 별도 Edge/deep-plum 사진7장 배열과 스와치0개 확인. wallstorage12종을 다른 제품군에 강제 적용하지 않음.
- 실제 실패 응답 상태 및 원본 모바일 픽셀 동치는 이번 교차 확인에서 미재현/미검증. 오류 상태는 소스 검토만 확인. 별도 카메라·광원/상단 패널 수정 없음.

### 기존 연결 회귀 확인

- `/furniture/bookcase-plum`에서 디자인 저장·공유 클릭 → 서버 저장 불가 안내와 로컬 fallback 공유 링크 확인. 해당 링크에서 `150 × 223 × 32cm`, grid, density50 및 표시가격1,259,200원 유지.
- `/saved-designs`의 동일 디자인 → 디자인 열기 → 새로고침 후 width150/height행7/density50, 표시가격1,259,200원 유지. version1 저장 config의 body height222와 외형 표시223 차이는 기존 조절발1cm 표시 계약. 새 가구 높이에 일반화하지 않음.
- `/configurator-intro` 기존13항목 보존 확인. 옷장 선택 → 다음 → `/furniture-c/wardrobe`의 reference3개 목록(판매 상품 아님) 확인. 아직 실제 옷장 configurator 연결이 아님.
- 기존 `node --experimental-strip-types --test src/components/storefront/savedDesign.test.ts`: 17/17 통과. Node 모듈 유형 경고만 존재.
- `npm run lint`: 오류0 / 기존 영역 경고8, exit0.
- 공유 `.next`를 건드리지 않은 독립 스냅샷 `/private/tmp/befun-entry-check-pb9960i0`에서 `npm run build -- --webpack`: compilation/TypeScript/static generation 통과, exit0. 당시 전체 소스의 검사이며 이번에 제품 소스를 변경했다는 뜻은 아님.
- 실제 주문/결제 및 서버 DB 저장 성공은 검증하지 않음. 문·서랍 포함 신규 family 왕복/seed/section 복구는 공통 함수 게시 후 검증 필요.

## 연결·계약 요청

### ENTRY-CONTRACT-001 — 리더 공통 적용/직렬화 함수 게시 요청

- 현재(2026-10-14 00:01 확인): `src/types/furniture.ts`에는 R1.3 UI view/intent만 게시됐고 `src/lib/furniture/**`, registry/상태 적용/복구/직렬화는 미구현입니다. storefront는 기존 cm 기반 `loadProductConfiguration`, `restoreSavedConfiguration`, `currentConfiguration`을 사용하고 서버 공유 화면은 자체 store 복구 경로를 사용합니다.
- 요청: 리더가 실제 공유 타입 및 preset 조회/적용, configuration 복구/직렬화, legacy cm 변환 함수의 import 경로·signature·실패 결과를 게시해 주세요. 여기의 함수 설명은 API 제안이며 확정 이름/ID가 아닙니다.
- 필요한 입력: 검증된 registry preset 식별자 또는 버전이 있는 저장 configuration. 출력: 지원/검증 여부와 오류 이유. unknown family와 누락 category를 책장으로 자동 변환하지 않는 legacy 결과가 필요합니다.
- 영향: 리더 소유 공통 타입/store/`lib/sharing.ts`/`share/[code]/page.tsx` 및 storefront 소유 intro/ProductConfigurator/SavedDesignPages/configuration. storefront 적용 지점은 같은 리더 함수를 호출하도록 연결 예정입니다.
- 검증 계획: 같은 preset을 intro·상품·저장·공유에서 적용해 동일 configuration인지 비교; 문/서랍이 있는 제품 → 다른 제품 왕복과 재로드; 옛 version1·서버 DesignConfig 복구; 분류·구획·하드웨어 정보 손실과 잘못된 version은 pass와 분리.
- 상태: 리더 함수 게시 대기. 기존 함수의 새 가족 계약 대체 구현이나 가짜 preset 생성은 하지 않습니다.

### ENTRY-MAPPING-002 — 현행 intro의 모델 대체 결함

- 현재 intro는 category별로 고정 legacy 상품 하나를 고르고 Original Classic/Modern/Edge/Tone 이름 선택을 색상 변경으로만 처리합니다. `wallunits` 또한 `wall-green`을 사용합니다. 이것은 관찰된 productFamily/generator/panelProfile 전환이 아닙니다.
- 제안: 11개 관찰 category별 실제 모델 옵션과 검증 registry preset을 연결하고, preset이 미게시/미검증인 선택은 준비 상태로 표시. 기존 13항목 중 wallunits·sofas는 삭제하지 않고 R1 범위 밖 reference 진입으로 유지. 특히 Desk/Dressing은 관찰된 Original2종, Shoerack은 Original2+Edge, Vinyl은 직접 구성으로 처리.
- 영향/소유: registry ID/분류는 리더; `ConfiguratorIntro.tsx`와 카테고리/상품 진입 UI는 storefront. R1.2 타입이 게시되면 source별로 일치하는 registry만 사용합니다.
- 상태: 조사 완료, 실제 서비스 연결은 공통 계약 대기.

### ENTRY-MAPPING-002 후속 — 진입 상태 설계 / 2026-10-14 00:01

terminal-instructions 최신 왼쪽3 지시 및 leader-review 2차 점검을 수신했습니다. 아래는 기존 진입 UI의 연결 설계이며 새 공통 enum/registry/API 구현이 아닙니다. 리더 공식 함수가 게시되기 전 실제 새 제품군 적용은 하지 않습니다.

| 선택의 실제 상태 | 사용자 표시 | 가능한 진입 | 상태 적용/저장 정책 |
|---|---|---|---|
| 현재 등록된 기존 Befun 선반6종 | `기존 Befun 선반 디자인` | 현재 상품 상세·기존 구성 편집 | 기존 구성임을 구분. 모델명을 Edge/Tone으로 바꿔 새 제품군 지원이라고 표시하지 않음 |
| 원본 관찰 및 활성 preset 확보, Befun registry 미검증 | `구성 연결 준비 중` | 원본 디자인 살펴보기·해당 category 목록 | 커스터마이즈/새 가족 저장·장바구니 진입 비활성. 관찰 확보만으로 판매/지원 상태가 되지 않음 |
| 링크 관찰, 활성 preset 미확인6종 | `초기 구성 확인 중` | 원본 디자인 살펴보기·해당 category 목록 | 누락값을 0/기본 선반으로 채우지 않음. 미확인과 지원 불가를 구분 |
| R1 범위 밖 wallunits/sofas | `디자인 레퍼런스` | 기존 reference 목록 | wallunits를 wall-green으로 자동 적용하지 않음. 항목13개는 보존 |
| 리더가 검증한 registry와 적용 함수 모두 제공됨 | `디자인 시작하기` | 공식 preset 적용 성공 후 configurator | apply 결과의 권위 상태를 사용. 선택 category/model과 새 상태 family가 일치해야 진입 허용 |
| 공식 적용 함수가 지원 불가/버전 오류를 반환 | `이 구성을 열 수 없습니다` + 제공된 이유 | 원본/목록/새 디자인 선택 | 이전 상태를 덮어쓰지 않음. 다른 가족으로 자동 변환하거나 주문 진행하지 않음 |

공통 함수 미게시 상태의 안내 문구: `이 모델의 3D 구성 연결을 준비하고 있습니다. 현재 Befun 선반 디자인과 원본 디자인을 살펴볼 수 있습니다.` 기존 선반으로 시작하는 별도 선택에는 실제 Befun 상품명/치수/마감을 표시하며 선택한 Edge/Tone의 대체 구성인 것처럼 연결하지 않습니다.

선택과 적용의 경계:

1. category 선택/왕복은 UI 선택만 변경합니다. 이전 모델 선택을 다른 category의 첫 모델 또는 리더가 지정한 유효 선택으로 갱신하고, 실제 가구 store는 확인된 preset 적용 전까지 변경하지 않습니다. 새 category에 없는 Edge/Tone 선택을 유지하지 않습니다.
2. 모델 목록은34개 관찰 매핑의 category별 목록을 사용합니다. Desk/Dressing의2종, Shoerack3종, Wardrobe2종을 generic4종으로 늘리지 않습니다. Vinyl은 직접 구성 경로로 취급합니다. 영구 preset ID는 리더 registry에서 받습니다.
3. `디자인 시작하기`는 registry 검증 상태와 공식 함수 존재 여부를 함께 확인합니다. 클릭 중 중복 요청을 막고, 적용 성공 뒤에만 경로를 이동합니다. 오류 시 선택/오류 이유를 유지하고 임의 상품 적용을 하지 않습니다.
4. 상품·intro·저장 목록·URL 공유·서버 공유가 같은 공식 복구/적용 경계를 사용합니다. 준비 상태 모델의 클릭으로 hardware reset이나 재질 변경이 일어나면 결함입니다.
5. 저장 링크는 schema/preset version과 category/family/구획/seed를 공식 직렬화 함수의 결과 그대로 전달합니다. 갤러리 선택 재질·확대 사진·UI 탭·선택 구획/카메라를 설계 상태에 임의 추가하지 않습니다.
6. 구 version1 복구는 리더 legacy 결과를 사용합니다. category가 없는 저장 데이터를 새 Bookcase family로 추정하지 않습니다. 복구 가능한 기존 선반은 `기존 선반 구성`으로 구분하고, 새 family를 복구할 수 없는 경우 원인 안내 후 현재 상태를 보존합니다.

연결 후 검증 기준: 준비 상태의 선택/모델 왕복이 기존 width/color/hardware를 변경하지 않을 것; 공식 preset 동일성이8개 진입점에서 유지될 것; category 변경 후 없는 모델을 선택하지 않을 것; 실패·중복 클릭·알 수 없는 저장 version에서 이전 구성이 보존될 것; 서버/로컬 저장 경로를 구분하고 실제 지원 정보와 표시 문구가 일치할 것. 현재는 **설계 완료 / 실제 UI 반영 및 새 제품군 검증 대기**입니다.

## 최신 왼쪽3 결과 — 접합 정보 감사 / 2026-10-14

확인한 사용자 흐름: 접합 방식 선택 → 상품/컨피규레이터 구성 → 서버 저장 또는 로컬 fallback → 공유 링크 → 설계 복구 → 옵티마이저. 접합 규격 버전은 현재 어디에도 확정되지 않았으므로 새 필드명/기본 버전을 추가하지 않았습니다. 아래 경계는 당시 읽은 코드 기준입니다.

| 경계·파일/함수 | 현재 값 전달 | 접합 정보의 누락/분리 위치 |
|---|---|---|
| `catalog.ts:21` CatalogProduct / ConfiguratorIntro / `StorefrontUI.tsx:97` useConfigureProduct | 크기·행·색·도어가 있는 legacy 상품 | 접합 system/검증된 규격 버전 없음. 시작 상품이 접합 방식을 선택하거나 초기화할 공통 경계 부재 |
| `configuration.ts:30` loadProductConfiguration | shelf/material/hardware를 적용 | connector 설정을 읽거나 적용하지 않음. 별도 optimizer 로컬 설정은 이전 값을 그대로 유지 |
| `configuration.ts:42` currentConfiguration | 고객 저장·장바구니 입력 snapshot | 접합 값이 최초 snapshot부터 없음. save/cart만 추가 수정해도 상위 상태·상품 적용이 없는 상태는 해결되지 않음 |
| `configurator/page.tsx:58` getDesignConfig | standalone 저장/장바구니의 별도 snapshot | 동일한 누락. storefront 함수만 바꾸면 이 경로는 여전히 빠짐(리더 소유) |
| `ProductConfigurator.tsx:78` saveDesign → POST | currentConfiguration 결과를 `{config}`로 전송 | 요청 body에 system/규격 버전이 없음. 서버 성공 여부와 별개의 필드 누락 |
| `api/designs/route.ts:22` POST / `prisma/schema.prisma` Design.config / GET `[code]` | 수신 config를 JSON으로 그대로 저장/조회하는 구조 | API가 접합 필드를 골라 삭제하는 코드는 없음. 상위 snapshot에서 누락됨. 확정 필드를 JSON에 포함하는 것만으로 새 DB column이 꼭 필요한 구조는 아님; 실제 저장은 현재 DB 초기화 실패로 미검증 |
| `savedDesign.ts:49` saveLocalDesign | 원본 serialized JSON을 localStorage/URL에 보관 | validator 반환값은 유효성 판단에만 사용. 이 함수 자체가 원본의 추가 필드를 재작성해 삭제하는 것은 아님. 현재 입력 snapshot은 이미 접합 값이 없음 |
| `savedDesign.ts:34` parseSavedDesign | 허용된 config 항목을 새 객체로 재구성 | **추가 접합 정보가 URL에 있더라도 실제 반환 config에서는 조용히 제거됨**. 임시 fixture로 확인; 공통 계약 확정 전 규격 필드를 임의 추가하지 않음 |
| `SavedDesignPages.tsx:11` SharedDesignPage / `:44` 저장 목록 | parse 결과를 표시하고 ProductConfigurator(configuration)에 전달 | 공유 URL/저장 목록 진입이 위 parser를 소비. 목록 링크 원문은 보존하지만 복구에 사용하는 객체는 접합 정보 없음 |
| `configuration.ts:56` restoreSavedConfiguration | shelf/material/hardware만 복구·reconcile | 확정 접합 정보의 적용 함수가 없음. 해당 설계에 맞게 optimizer 전역 설정을 복구하지 못함 |
| `share/[code]/page.tsx:38` handleLoadDesign | 서버 config에서 개별 store setter를 호출 | 서버 JSON에 향후 접합 값이 들어와도 현행 복구는 적용하지 않음(리더 소유) |
| `sharing.ts` DesignConfig / serialize·deserialize / encode·decode | DesignConfig에 접합 항목 없음. 일반 JSON stringify/parse는 runtime 추가 필드를 자체 삭제하지 않음 | legacy `encodeDesignToURL:48`와 `decodeDesignFromURL:68`의 명시 항목 매핑은 접합 값을 제외. 공통 타입/검증/legacy 호환을 함께 변경해야 함 |
| `useCartStore.ts` addItem/persist | 수신 designConfig를 보존 | store 자체의 필드 필터가 원인이 아님. 현재 두 snapshot에서 접합 값이 빠진 채 전달됨. 주문/가격 변경은 이번 범위 밖 |
| `optimizer/befun/session.ts:9` readCurrentDesign → sessionStorage | 가구 치수·스타일·재질·도어·서랍 | connector selection과 규격 버전 없음. 같은 design snapshot에 접합 정보가 결합되지 않음 |
| `optimizer/connectors/settings.ts:3` / `OptimizerApp.tsx:17,35` | `befun-optimizer-connectors`를 따로 읽고 CNC snapshot에 사용 | **브라우저 전역 선택**이지 설계별 설정이 아님. 다른 상품/공유 복구 후에도 이전 선택이 남음. 옛 optimizer 데이터의 system 미기록→OVVO 호환을 옛 고객 설계의 실제 OVVO 선택 근거로 쓰면 안 됨 |

### 실제 재현과 범위

- Chrome3003 `/optimizer`: 시작값 OVVO/몸통 V-1230P/백패널 없음 확인 → Tylko 클립 선택 및 미확정 가공 안내 → 새로고침 이후 클립 유지.
- 이어 `/furniture/bookcase-plum`에서 저장·공유 → 서버 오류 후 `이 브라우저에 디자인이 저장되었습니다` 대화상자. 링크의 version1 config는13항목(스타일/밀도/치수/뒷판/색/행/문·서랍/rowStyles)이며 접합 system/규격 버전 없음.
- 공유 링크 열기 후 기존 표시가격1,259,200원 유지. `/optimizer`로 돌아가면 별도 로컬 설정의 Tylko 클립이 그대로 선택됨. 이것은 설계에서 접합 값을 복구한 결과가 아니라 독립 설정 잔류임. 테스트 후 OVVO로 원복·재로드하여 몸통 V-1230P 보존 확인.
- Node fixture: 유효한 version1 config에 진단용 추가 객체 `connectorSelection:{system:'tylko-clip'}`만 추가 → `parseSavedDesign`은 null이 아닌 객체를 반환하지만 추가 객체를 제거. **이 fixture 필드명은 공통 schema 제안/게시가 아니며 실제 고객 저장 데이터를 변경하지 않음.** 현재 허용 목록 parser의 확장 필드 손실만 검증.
- 기존 savedDesign17검사 재실행 17/17 통과. 기존 검사가 통과해도 새 접합 정보 보존 검사가 있다는 뜻은 아님.
- 실제 서버 DB 저장/접합 포함 서버 round-trip, 새 공통 함수의 왕복, 규격 버전 검증은 아직 미검증. 패널/클립 3D·CNC/조립 동치 검사는 이번 감사 범위 밖.

### ENTRY-CONNECTOR-003 — 리더 공통 상태/저장/복구 연결 요청

- 문제: 고객 설계 snapshot에 system이 없고, 추가 JSON 정보가 있어도 로컬 parser·서버/로컬 복구에서 사라짐. optimizer의 전역 설정이 다른 설계에도 사용될 수 있음.
- 요청: 리더가 system 및 **검증된 규격 참조/버전의 실제 경로·타입·미확정 상태·legacy 호환 정책**을 한 번 정의하고, 공식 snapshot/serialize/validate/apply/restore에 포함해 주세요. 현재 클립의 제조 치수/품번/규격 버전은 미확정이므로 임의 version1/검정=locking 같은 값은 만들지 않습니다.
- legacy: 오래된 optimizer 설정의 system 생략→OVVO는 해당 옛 optimizer 설정에만 적용. 오래된 고객 설계의 미기록 system은 리더가 정의하는 unknown/legacy 결과로 유지하며 실물 접합 방식이었다고 추정하지 않습니다. 지원 불가 또는 버전 오류를 OVVO로 silent fallback하지 않습니다.
- 영향/담당: 리더 — common types/state/sharing/db/API/standalone/shared page/optimizer design↔selection 경계. storefront — 공식 함수 게시 후 catalog/intro/loadProductConfiguration/currentConfiguration/restoreSavedConfiguration/parser/상품·저장 목록의8개 진입 경계에서 소비.
- 준비한 연결 순서: (1) 검증 registry가 전달한 접합 정보를 preset 적용 결과로 받기 (2) 상품·standalone/cart가 같은 공식 snapshot 사용 (3) 서버와 로컬 링크가 같은 공식 직렬화·검증 사용 (4) 로컬 parser의 자체 허용 목록 대신 공식 legacy 변환 결과 소비 (5) 양쪽 공유 복구를 같은 apply 함수로 연결 (6) optimizer가 복구된 설계의 접합 정보로 selection을 만들고 브라우저 전역 값보다 설계 값이 우선하도록 연결. 실제 import 이름/signature는 리더 게시 후 확정합니다.
- 검증 인계: OVVO/클립 각각 저장→같은 브라우저/다른 브라우저→서버/로컬 링크→새로고침→optimizer, 접합 방식과 확정 규격 참조가 동일한지 비교. 접합 변경이 스타일·치수·재질·도어/서랍을 초기화하지 않는지, 이전 설계의 optimizer 가공이 남지 않는지 QA 확인 필요.
- 상태: **연결 요청/패치 적용 지점 준비 완료, 실제 공통 구조/소스 수정 없음.**

## 최신 왼쪽3 결과 — 서버 저장 실패 진단 / 2026-10-14

### 요청/응답을 분리한 재현 (3003, 인증 쿠키 없는 CLI)

| 요청 | HTTP / 응답 | 판단 |
|---|---|---|
| POST `/api/designs`, `{}` | 400 / `설정값이 필요합니다` | route와 JSON 처리, session 조회 뒤 입력 검증까지 도달 |
| POST `/api/designs`, 비밀정보 없는 유효 legacy config | 500 / `디자인 저장 실패` | DB create 경계 실패. 생성 id/shareCode 미반환 |
| GET `/api/designs` | 401 / `로그인 필요` | 익명 사용자 목록 접근의 정상 분기. 이것이 POST500의 원인은 아님 |
| GET `/api/designs/ENTRY007`, 진단용 없는 code | 500 / `디자인 조회 실패` | 인증을 호출하지 않는 조회도 같은 DB 초기화 오류. 정상 DB라면 없는 code404여야 하나 현재 그 단계 이전 실패 |
| 상품 UI의 저장·공유 | 서버 실패 후 version1 local URL/안내 생성 | 서버 저장 성공과 분리해 로컬 fallback 동작 확인 |

### 확인된 최초 실패 경계

- `src/lib/db.ts:4,11`: DATABASE_URL이 없으면 빈 문자열, 이어 `new PrismaPg(connectionString)`을 사용.
- 로컬 `.env.local`에서 DATABASE_URL 미설정/빈 값, NEXTAUTH_SECRET 설정 유무만 확인. `.env`/development env 파일 부재, exec 환경에도 DATABASE_URL 없음. **비밀값은 출력/기록하지 않음.** 실행 서버의 로그도 빈 문자열에 대한 TypeError와 일치하지만 서버 프로세스의 전체 환경을 덤프하지 않았습니다.
- 설치된 `@prisma/adapter-pg/dist/index.d.ts:42`: 생성자는 `pg.Pool | pg.PoolConfig`. 런타임 `index.js:785`는 받은 config를 `new pg.Pool(this.config)`에 전달.
- 현재 서버 stdout의 POST create와 공유 GET 둘 모두 `TypeError: Cannot use 'in' operator to search for 'password' in `를 기록. 이는 실제 패스워드 값 출력이 아니라 Pool 생성자가 문자열에서 속성을 검사하다 발생한 오류 메시지입니다.
- 설치 라이브러리 단독 재현(네트워크 connect/query 없음): `new pg.Pool('')`와 비밀정보 없는 임시 URL 문자열 인수는 같은 TypeError, `{connectionString: 임시 URL}` 객체는 생성/종료 성공. 따라서 URL만 문자열로 채워도 현재 인수 형식 문제는 남습니다.
- TCP5432 listener는 존재하지만 이번 오류는 연결/SQL 실행 이전이므로 **DB 접속 실패·비밀번호 오류·테이블 누락·migration 오류로 결론내리지 않음**. 올바른 adapter와 실제 URL이 준비된 뒤 DB 권한/Design 테이블/왕복을 확인해야 합니다.
- 익명 POST는 `userId:null`을 허용하고 missing config400에 도달했으므로 이번 실패를 로그인/OAuth 미설정 탓으로 돌리지 않습니다. 서버 저장은 실제 create 이전 실패, 로컬 fallback은 별도 성공입니다.

### ENTRY-SAVE-004 — 리더 DB 초기화/API 오류 구분 요청

- 우선 수정 제안: `db.ts:11`에서 설치된 API에 맞는 **`new PrismaPg({ connectionString })`** 형태 사용. 실제 DATABASE_URL 설정·검증도 별도로 필요합니다. 빈 설정으로 pg의 다른 기본 DB에 연결하지 않도록 DB 의존 경계에서 명확한 준비 상태를 반환하는 정책을 리더가 정해 주세요. 이번에는 db/API/env를 수정하지 않았습니다.
- 개발 `globalForPrisma.prisma`가 생성된 client를 재사용하므로 수정 후 기존 잘못된 singleton이 계속 쓰이지 않게 재생성 여부를 확인해야 합니다. 공용 서버 재시작/산출물 삭제는 하지 않았으며 필요한 서버 운영은 리더 조율 사항입니다.
- API: 응답을 입력 오류/DB 미준비/DB 처리 실패/저장 성공으로 구분할 공통 오류 결과가 필요합니다. 내부 예외·접속 문자열은 클라이언트에 보내지 않으며 민감값 없는 서버 진단으로 구분합니다. 새 오류 코드명은 임의 확정하지 않습니다.
- storefront `saveDesign`: 현재 모든 non-ok·네트워크 오류·shareCode 검증 오류를 같은 catch에서 로컬 fallback합니다. 공식 오류 계약이 나오면 사용자 입력 오류와 서버 미준비를 구분하여 저장 결과를 표시하도록 연결 예정입니다. 서버 성공과 로컬 보관을 서로 다른 결과로 계속 유지해야 합니다.
- 리더 소유 `share/[code]/page.tsx`는 모든 non-ok를 `디자인을 찾을 수 없습니다`로 표시하므로 현재500도 없는 디자인처럼 보입니다. 404와500/서비스 미준비를 구분할 연결 요청입니다.
- 수정 후 검증: missing config400, 익명 유효 저장200 및 shareCode8문자, 반환 code GET200과 config 왕복, 없는 code404, 미준비 상태의 명확한 오류와 로컬 fallback. 임의 주문/결제/DB migration은 이번에 실행하지 않았습니다.
- 상태: **서버500 최초 원인 재현·연결 요청 완료, 실제 서버 저장 수정/성공 검증은 미완료.**

### 이번 산출물·검증 경계

- 수정: 본 handoff와 team-tasks 기록만. 34모델 표의 Vinyl 표시 `None`을 원본의 직접 구성 의미로 정정. 갤러리·상품·공통 저장 구조·DB/API·환경·optimizer 제품 소스 변경 없음.
- 진단용 payload/HTTP 응답은 `/private/tmp/befun-entry-save-audit/`에 보관(비밀정보 없는 선반 fixture 및 위 오류 응답). 실제 POST는500으로 실패하여 새 서버 design id가 생성되지 않았습니다.
- CLI의 최초 샌드박스 localhost 접근은 HTTP000이었고 승인된 샌드박스 밖 요청에서 위400/500/401/500을 확인. HTTP000을 앱 응답으로 판정하지 않았습니다.
- 이번에는 문서만 수정하여 앱 lint/build를 재실행하지 않았습니다. 기존 savedDesign17개 검사와 실제 UI/API/설치 라이브러리 단독 재현 결과를 구분해 기록했습니다. DB 성공/새 schema 보존을 통과 처리하지 않습니다.
- 2026-10-14 00:22 KST 이번 감사·진단 인계 완료, 문서 잠금 해제. ENTRY-CONNECTOR-003/ENTRY-SAVE-004는 실제 공통 연결/DB 수정 담당인 리더의 처리 대기입니다.

## 완료·인계

이번에는 리더가 완료한 갤러리를 보존하고 독립 교차 확인했습니다. 진입점8개와 기존13개 선택의 처리, 11category/34개 관찰 모델의 매핑, 상태 정보 손실 지점을 정리했습니다. CORE-REVIEW-001에서 리더도 공통 타입·적용/복구/직렬화가 선행 과제임을 확인했습니다.

**R1-ENTRY 전체 완료 아님:** 실제 공통 타입/registry/functions가 게시되면 `ConfiguratorIntro`, `ProductConfigurator`, `SavedDesignPages`, `configuration`의 기존 적용 지점을 같은 리더 함수로 교체합니다. 리더 소유 standalone/shared 페이지에도 동일 함수 연결이 필요합니다. 현재는 계약 지시에 따라 새 공유 타입이나 가짜 preset을 구현하지 않습니다. 미확인 모델6종과 wallunits/sofas를 임의 선반으로 채우지 않습니다.

2026-10-13 23:12 KST 문서 잠금 해제. 기존 갤러리·3D·store·가격·결제·공유 서버 소스 및 개발서버를 수정/재시작하지 않았습니다. 같은 시각 공통 furniture 타입/함수는 여전히 미게시였습니다. 후속 연결 착수 전 최신 team-tasks와 leader-review/실제 공통 함수 게시를 확인합니다.

## 화면 위치별 배정 보완 — 리더

사용자 21:30 첨부 화면 기준: 왼쪽 세 번째 Codex; R1-ENTRY입니다. [전달 지시문](../development/furniture-parity/terminal-instructions.md)을 확인하세요. 고유 세션명·착수 시각·잠금은 작업자가 기록합니다. 배정 게시이며 구현 완료/착수 확인은 아닙니다.


### 상세 갤러리 직접 구현 — 리더 / 사용자 “어서해라” 지시
- 이전 R1-ENTRY 갤러리 배정을 이 좁은 작업에 한해 리더가 회수. storefront 담당은 해당 파일을 동시에 수정하지 말 것. 그 외 진입/저장 연결 배정 유지.
- 잠금: src/components/storefront/ProductDetails.tsx, 신규 ProductMaterialGallery.tsx, material-gallery.module.css, galleryMaterials.ts. 기존 product-details.module.css는 재사용하고 수정하지 않음.
- 재질12종 선택/8장 교체/확대/반응형 및 브라우저 검증을 리더가 직접 완료한다.


### 상세 갤러리 재질 전환 직접 구현 완료 — 리더 / 2026-10-13
- 사용자 후속 “어서해라”에 따라 리더가 직접 구현. ProductDetails.tsx 연결, 신규 ProductMaterialGallery.tsx/material-gallery.module.css/galleryMaterials.ts. 기존 product-details.module.css·store·3D·가격 코드는 수정하지 않음.
- 기본 컨피규레이터 Original Classic 갤러리: 12종 스와치 우측 정렬, 선택 원형 테두리, 재질별8장 교체, 해당 사진 확대, 키보드 라디오 전환, 모바일 가로 스크롤. 로딩/오류 상태와 이미지별 상태 재설정. 다른 제품군의 기존 사진 배열은 유지.
- Chrome localhost3003: 12종 각각8장 URL 대응 확인. 블루/옐로8장 실제 로딩 성공, 옐로 확대 소스/닫기/스크롤 복원, 방향키 전환, 상단slider 값 전후 동일. 모바일390px에서 페이지폭390/아이콘영역358/스크롤폭436 확인. 스크린샷3장·cases/gallery-materials-001-befun.json 저장.
- 검증: 변경 파일 ESLint 통과; 전체lint 오류0/기존 영역 경고9; 독립 스냅샷 /private/tmp/befun-gallery-check-tr42mp9j에서 npm run build -- --webpack 및 TypeScript 통과. 공유 개발 서버 재시작 없음.
- 제한: 모든96개 이미지의 개별 다운로드 완료/모든 제품군별 재질 이미지/원본 모바일 픽셀 동치는 미검증. 별도상품 탭은 조립모드 중 갤러리가 없어 조작하지 않음. 외부이미지 CDN 의존은 기존 구조와 동일.
- 이번 갤러리 소스 잠금 해제. storefront 담당은 이 구현을 보존하고 나머지 진입/저장 연결 작업을 이어갈 것. 앞의 갤러리 구현대기 지시는 이 완료 기록으로 대체.


## 진입 데이터 매핑 — 34개 관찰 모델

원본 초기 상태는 조사 메타데이터입니다. 아래 shelf_type/collection을 Befun 영구 ID나 검증된 판매 preset으로 승격하지 않습니다. 치수는 관찰 preset의 외형 필드(mm)이며 내부 높이·발 높이·표시 높이와 같다고 가정하지 않습니다. 활성 preset 28개/미확인 6개; 11개 category/34개 링크입니다. 각 행의 실제 적용은 리더 registry/어댑터 게시 이후입니다.

| category | 관찰 모델·원본 진입 | 원본 경로 / collection / active type | 외형 폭 × 높이 × 깊이(mm) | 연결 상태 | 근거 |
|---|---|---|---|---|---|
| sideboard | [Original Classic](https://tylko.com/de-de/mobel/sideboard/4665612,j) | jetty / Sideboard / 0 | 2000 × 630 × 400 | observed / 적용 계약 대기 | [category-sideboard-001](../tylko-reference/cases/category-sideboard-001.json) |
| sideboard | [Original Modern](https://tylko.com/de-de/mobel/sideboard/3516437,j) | unknown / unknown / unknown | unknown | 활성 preset 미확인 / 연결 보류 | [category-sideboard-001](../tylko-reference/cases/category-sideboard-001.json) |
| sideboard | [Edge](https://tylko.com/de-de/mobel/sideboard/1430061,w) | watty / Sideboard / 4 | 940 × 1080 × 360 | observed / 적용 계약 대기 | [category-sideboard-001](../tylko-reference/cases/category-sideboard-001.json) |
| sideboard | [Tone](https://tylko.com/de-de/configure/907980,w) | watty / Sideboard / 8 | 800 × 520 × 360 | observed / 적용 계약 대기 | [category-sideboard-001](../tylko-reference/cases/category-sideboard-001.json) |
| bookcase | [Original Classic](https://tylko.com/de-de/mobel/bucherregal/7197274,j) | jetty / Bookcase / 0 | 1020 × 1630 × 320 | observed / 적용 계약 대기 | [category-bookcase-001](../tylko-reference/cases/category-bookcase-001.json) |
| bookcase | [Original Modern](https://tylko.com/de-de/mobel/bucherregal/486320,j) | unknown / unknown / unknown | unknown | 활성 preset 미확인 / 연결 보류 | [category-bookcase-001](../tylko-reference/cases/category-bookcase-001.json) |
| bookcase | [Edge](https://tylko.com/de-de/mobel/bucherregal/539982,w) | watty / Bookcase / 4 | 1200 × 1980 × 270 | observed / 적용 계약 대기 | [category-bookcase-001](../tylko-reference/cases/category-bookcase-001.json) |
| bookcase | [Tone](https://tylko.com/de-de/configure/1948627,w) | watty / Bookcase / 14 | 800 × 1940 × 270 | observed / 적용 계약 대기 | [category-bookcase-001](../tylko-reference/cases/category-bookcase-001.json) |
| wallstorage | [Original Classic](https://tylko.com/de-de/mobel/regalsystem/3690551,j) | jetty / Bookcase / 0 | 1200 × 1930 × 320 | observed / 적용 계약 대기 | [category-wallstorage-001](../tylko-reference/cases/category-wallstorage-001.json) |
| wallstorage | [Original Modern](https://tylko.com/de-de/mobel/regalsystem/1596673,j) | jetty / Bookcase / 1 | 840 × 2230 × 320 | observed / 적용 계약 대기 | [category-wallstorage-001](../tylko-reference/cases/category-wallstorage-001.json) |
| wallstorage | [Edge](https://tylko.com/de-de/mobel/regalsystem/519975,w) | watty / Wallstorage / 4 | 1270 × 1680 × 360 | observed / 적용 계약 대기 | [category-wallstorage-001](../tylko-reference/cases/category-wallstorage-001.json) |
| wallstorage | [Tone](https://tylko.com/de-de/configure/1964452,w) | watty / Wallstorage / 14 | 2440 × 1640 × 450 | observed / 적용 계약 대기 | [category-wallstorage-001](../tylko-reference/cases/category-wallstorage-001.json) |
| desk | [Original Classic](https://tylko.com/de-de/mobel/schreibtisch/3760569,j) | jetty / Desk / 0 | 1020 × 730 × 500 | observed / 적용 계약 대기 | [category-desk-001](../tylko-reference/cases/category-desk-001.json) |
| desk | [Original Modern](https://tylko.com/de-de/mobel/schreibtisch/3854739,j) | jetty / Desk / 1 | 1200 × 730 × 500 | observed / 적용 계약 대기 | [category-desk-001](../tylko-reference/cases/category-desk-001.json) |
| dressing_table | [Original Classic](https://tylko.com/de-de/mobel/schminktisch/7389030,j) | jetty / Desk / 0 | 1050 × 730 × 400 | observed / 적용 계약 대기 | [category-dressing_table-001](../tylko-reference/cases/category-dressing_table-001.json) |
| dressing_table | [Original Modern](https://tylko.com/de-de/mobel/schminktisch/7388995,j) | jetty / Desk / 1 | 900 × 730 × 400 | observed / 적용 계약 대기 | [category-dressing_table-001](../tylko-reference/cases/category-dressing_table-001.json) |
| tv-stand | [Original Classic](https://tylko.com/de-de/mobel/fernsehtisch/4665733,j) | jetty / Sideboard / 0 | 1400 × 630 × 320 | observed / 적용 계약 대기 | [category-tv-stand-001](../tylko-reference/cases/category-tv-stand-001.json) |
| tv-stand | [Original Modern](https://tylko.com/de-de/mobel/fernsehtisch/4665821,j) | unknown / unknown / unknown | unknown | 활성 preset 미확인 / 연결 보류 | [category-tv-stand-001](../tylko-reference/cases/category-tv-stand-001.json) |
| tv-stand | [Edge](https://tylko.com/de-de/mobel/fernsehtisch/1614814,w) | watty / TvStand / 4 | 1560 × 480 × 360 | observed / 적용 계약 대기 | [category-tv-stand-001](../tylko-reference/cases/category-tv-stand-001.json) |
| tv-stand | [Tone](https://tylko.com/de-de/configure/657770,w) | watty / Sideboard / 6 | 1800 × 450 × 360 | observed / 적용 계약 대기 | [category-tv-stand-001](../tylko-reference/cases/category-tv-stand-001.json) |
| chest-of-drawers | [Original Classic](https://tylko.com/de-de/mobel/kommode/5141667,j) | jetty / Sideboard / 0 | 1400 × 830 × 400 | observed / 적용 계약 대기 | [category-chest-of-drawers-001](../tylko-reference/cases/category-chest-of-drawers-001.json) |
| chest-of-drawers | [Original Modern](https://tylko.com/de-de/mobel/kommode/5142251,j) | unknown / unknown / unknown | unknown | 활성 preset 미확인 / 연결 보류 | [category-chest-of-drawers-001](../tylko-reference/cases/category-chest-of-drawers-001.json) |
| chest-of-drawers | [Edge](https://tylko.com/de-de/mobel/kommode/520406,w) | watty / Chest / 4 | 1040 × 980 × 450 | observed / 적용 계약 대기 | [category-chest-of-drawers-001](../tylko-reference/cases/category-chest-of-drawers-001.json) |
| chest-of-drawers | [Tone](https://tylko.com/de-de/configure/658504,w) | watty / Sideboard / 6 | 770 × 1150 × 560 | observed / 적용 계약 대기 | [category-chest-of-drawers-001](../tylko-reference/cases/category-chest-of-drawers-001.json) |
| shoerack | [Original Classic](https://tylko.com/de-de/mobel/schuhregal/3516418,j) | jetty / Bookcase / 0 | 1500 × 530 × 320 | observed / 적용 계약 대기 | [category-shoerack-001](../tylko-reference/cases/category-shoerack-001.json) |
| shoerack | [Original Modern](https://tylko.com/de-de/mobel/schuhregal/3516416,j) | unknown / unknown / unknown | unknown | 활성 preset 미확인 / 연결 보류 | [category-shoerack-001](../tylko-reference/cases/category-shoerack-001.json) |
| shoerack | [Edge](https://tylko.com/de-de/mobel/schuhregal/1614538,w) | watty / Sideboard / 4 | 1730 × 480 × 450 | observed / 적용 계약 대기 | [category-shoerack-001](../tylko-reference/cases/category-shoerack-001.json) |
| bedside_table | [Original Classic](https://tylko.com/de-de/mobel/nachttisch/3533435,j) | jetty / Sideboard / 0 | 780 × 630 × 400 | observed / 적용 계약 대기 | [category-bedside_table-001](../tylko-reference/cases/category-bedside_table-001.json) |
| bedside_table | [Original Modern](https://tylko.com/de-de/mobel/nachttisch/3763450,j) | unknown / unknown / unknown | unknown | 활성 preset 미확인 / 연결 보류 | [category-bedside_table-001](../tylko-reference/cases/category-bedside_table-001.json) |
| bedside_table | [Edge](https://tylko.com/de-de/mobel/nachttisch/1614717,w) | watty / Sideboard / 4 | 550 × 480 × 360 | observed / 적용 계약 대기 | [category-bedside_table-001](../tylko-reference/cases/category-bedside_table-001.json) |
| bedside_table | [Tone](https://tylko.com/de-de/configure/657092,w) | watty / Sideboard / 6 | 600 × 250 × 360 | observed / 적용 계약 대기 | [category-bedside_table-001](../tylko-reference/cases/category-bedside_table-001.json) |
| vinyl_storage | [직접 구성](https://tylko.com/de-de/mobel/schallplattenregal/3763292,j) | jetty / Bookcase / 0 | 1680 × 830 × 400 | observed / 적용 계약 대기 | [category-vinyl_storage-001](../tylko-reference/cases/category-vinyl_storage-001.json) |
| wardrobe | [Edge](https://tylko.com/de-de/mobel/kleiderschrank/235218,w) | watty / Cabinet / 4 | 1180 × 1980 × 600 | observed / 적용 계약 대기 | [category-wardrobe-edge-001](../tylko-reference/cases/category-wardrobe-edge-001.json) |
| wardrobe | [Tone](https://tylko.com/de-de/mobel/kleiderschrank/92243,w) | watty / Wardrobe / 3 | 1000 × 2000 × 530 | observed / 적용 계약 대기 | [category-wardrobe-tone-001](../tylko-reference/cases/category-wardrobe-tone-001.json) |

## 제공 SVG 로고·패널 로딩 완료 — 2026-10-14 / codex-storefront

- 사용자 원본 SVG의 표시 영역과 mask를 보존. 기본 `befun_logo.svg`는 검정 필터만 추가하고 `befun_logo-white.svg`는 원본 그대로 사용. BrandLogo 색상 선택과 footer 연결, footer 흰 배경 제거. 기존 configurator/assembly 헤더도 기본 asset으로 같은 로고 사용.
- ConfiguratorLoading은 실제 로고를 25개 clip 패널로 나눠 아래부터 순차 조립하고 완성 후 반복. useId로 중복 마스크 ID 방지, 모든 패널의 시작 시각 동기화. ready/unmount 시 animation 정리, reduced-motion에서 완성 로고 정적 표시. SceneReady/3D/AR/저장 로직 수정 없음.
- Chrome localhost:3003 헤더 검정·footer 흰색 원본 로고와 투명 footer 배경 확인. 실제 configurator의 초기 status→ready 전환 관찰. 로딩이 짧아 반복 연출은 별도 격리 사본의 동일 실제 컴포넌트로 확인: 조립 중 부분 로고, 완성 정적 로고, ready=true의 aria-hidden=true / opacity=0 / pointer-events=none 확인. 모든 모바일 viewport에서 애니메이션을 직접 확인한 것은 아님.
- 최종 lint: 오류0/기존 경고7. `/private/tmp/befun-wordmark-build-w_yk1byi` 격리 snapshot의 webpack build, 전체 TypeScript,17개 정적 페이지 생성 PASS. 이후 타담당 옷장 변경은 이 build 검증 범위에 포함하지 않음. 검증용 route는 격리 사본에만 존재하며 프로젝트/커밋에 포함하지 않음. 임시 browser 네트워크·motion 설정 복원, 검증 탭 및 본인 preview 서버 종료.
- 소스7파일은 다른 담당자의 공유 기준점 커밋 `c466e45`에 이미 포함됨을 git diff로 확인. 이번 후속 커밋은 검증 결과·인계·잠금 해제 기록이며 소스를 중복 변경하지 않음. 리더/게시 담당: 제공 로고·로딩 잠금 모두 해제, `c466e45` 소스와 이 인계 사용 가능. push/배포는 본 담당이 수행하지 않음.

검증한 최종 소스 SHA-256:

- `public/imgs/icon/befun_logo.svg`: `256986bcdf3e67357a27edb2595e63f1f9514911ddda3c2c127f2f5d89ab3649`
- `public/imgs/icon/befun_logo-white.svg`: `71316d0761afc333cf3ee674dd10274d1f119472a8159d45d3328fa670e1ecc9`
- `src/components/storefront/StorefrontUI.tsx`: `08567dbb65d648e22a082622b4a09e0f3acab9d7fcc98902210d74a0ed1538a0`
- `src/components/storefront/StorefrontFrame.tsx`: `56835eb4bf8966cfe105d651c5853f16abf84e1597d50017ab1d1757dd015ec5`
- `src/components/storefront/storefront.module.css`: `d39a79b03b580652bdff8af6989d07f7db3594efb2c2ba0f24e63b8f76500826`
- `src/components/ui/ConfiguratorLoading.tsx`: `2dfbf189f45a85fd5794087e9aa47a650538ac58dd324fd3a8b5907bbe879691`
- `src/components/ui/configurator-loading.module.css`: `d4750bf8d8c1361a8ce3acb13f67dd43d9e5d75dc79e92038a61b4afe629dd04`

## 로딩 연출 재수정 — 사용자 피드백 반영 / 2026-10-14

- 이전25조각 skew/3.4초 반복 소거/그림자/빛줄/장식 문구 폐기. 원본 검정 로고의5가로 층을 아래부터110ms 간격으로8px 내려놓아760ms 안에 완성. 완성 로고 유지, 준비 완료 시180ms 해제. CSS 일회 애니메이션으로 Web Animations/ref/effect/동기화 제거. desktop200px/mobile164px, 평평한 배경과 작은 `불러오는 중`만 표시. 로고 자산·SceneReady·준비 조건·3D 변경 없음.
- 실제 동일 컴포넌트를 쓰는 격리 production preview: Chrome 아래 층 opacity .99/.89, 중간 .07, 위0 및110ms 지연 관찰; 완료 로고 유지·반복횟수1 확인.390px/motion 감소 정적 완성 로고 및 ready의 aria-hidden=true/opacity0/pointer-events none 확인. 임시 viewport/motion 복원 및 본인 탭·3037 preview 서버 종료. 검증 route는 프로젝트/커밋 제외.
- 변경 TSX ESLint PASS. 이전 공유508파일 snapshot에 이번2파일만 교체한 격리 webpack build/전체 TypeScript/정적 생성 PASS. 현 공유 작업트리 전체 lint는 별도 담당 `DeskPanel.tsx:20` preserve-manual-memoization 오류1/경고8로 실패하여 해당 담당 확인 필요. 이 오류를 임의 수정하지 않음. 이후 타담당 변경의 전체 build 보장은 아님.
- 이번2소스·본인 handoff·완료 기록만 커밋 대상. 잠금 해제, 리더/게시 담당에게 수정 결과 전달. 이전25패널 인계는 이번 기록으로 대체.
- `src/components/ui/ConfiguratorLoading.tsx` SHA-256: `447bbef3dde87e8d6e6595acea148bddbfc329677180e148fb0a3339055f5da3`
- `src/components/ui/configurator-loading.module.css` SHA-256: `3a6ce6c860837ca9da70801f854d455e77d8e6dbe57f33f36fcbecefefb4a304`

## R4-ENTRY 수신·착수 — 2026-10-14

- 사용자 직접 전달 및 dispatch-r4 왼쪽3 수신. 위임4소스/테스트와 신규 wardrobe-catalog 사례·캡처 단독 잠금. wardrobe-1/2/3 원본 URL 검증 후 실제 FurnitureDesign 진입 연결. 공통 모델/DTO/route는 수정하지 않고 누락 source 필드 보고. 기존 책상3종 보존·회귀 검사.

### R4 원본 초기값 1차 조사 및 리더 요청
- 3종은 기존235218 Edge/92243 Tone 사례와 다른 preset. wardrobe-1 Edge1190×2600×450,2구획 Open_Shelves_Slabs / Full_Shelves_Slabs_bottom_drawer(right),Plum. wardrobe-2 Tone4150×2760×630,5동일너비,3741/3738/3746/3742/3743, Cashmere/Pink,internal/조명off. wardrobe-3 Tone600×2750×630,1구획3743,left,Graphite/Graphite,external/조명off.
- DOM selected series/index 확인. Tone는 DOM에seriesId가 없어 동일관찰 legacy bundle의원본 getThumbnails 순서와대조. 공개preset API는browser ERR_BLOCKED_BY_CLIENT / 별도HTTP403,rawseed/channel keys는미확인. 앱 ID는Befun stable ordered slots이며원본숨은key로표시하지않음.
- 상태DTO/parse복원으로표현불가초기필드는현재없음. 다만Tone generator의기존물리한계 `tone-drawer-runner-travel-unmeasured`, `wardrobe-bar-cross-section-assets` 남음. 실제runnertravel·옷봉단면은리더소유,이카탈로그지원은옵션편집/저장복원지원이며모든물리동치가아님.
- 원본이미지URL보존. 사진실패시storage.avif 다른가족fallback을피하기위해위임된ReferenceCatalogPages 안의wardrobe이미지만오류placeholder로처리예정. 공용StorefrontUI는미수정.

### R4-ENTRY-READY — 옷장 카탈로그 연결 완료 / 2026-10-14

세 상품 모두 **supported**: 현재 서버의 `/furniture-c/wardrobe` → `/reference-product/wardrobe-{1,2,3}`에서 실제 해당 가족 편집기를 표시합니다. 기존 책상 factory/공통 design·생성기·모델·route·FurnitureConfigurator는 본 담당이 수정하지 않았습니다. 원본 저장/장바구니도 조작하지 않았습니다.

| 상품 | 원본에서 확인한 초기 상태 | 진입·입력·저장·복원 결과 |
|---|---|---|
| wardrobe-1 / 1936508,w | Edge,1190×2600×450mm,2구획; Open_Shelves_Slabs / Full_Shelves_Slabs_bottom_drawer,open/closed,right; Deep Plum 내외부,상단 ridge On | 실제 3D PASS; 폭119→120cm 저장→121cm 임시 변경→로컬 불러오기120→URL 공유·새로고침120. 구획 ID/색/레이아웃 유지 |
| wardrobe-2 / 92332,w | Tone,4150×2760×630mm,5동일너비;3741/3738/3746/3742/3743,closed,고정 양문;Cashmere/Pink,internal,조명None | 실제 3D PASS;415→416 저장→417 임시 변경→로컬416→공유·새로고침416. ID/색/레이아웃 유지 |
| wardrobe-3 / 92275,w | Tone,600×2750×630mm,1구획3743,closed,left;Graphite 내외부,external,조명None | 실제 3D PASS;60→61 저장→62 임시 변경→로컬61→공유·새로고침61. ID/색/레이아웃 유지 |

- 근거: [001](../tylko-reference/cases/wardrobe-catalog-001.json), [002](../tylko-reference/cases/wardrobe-catalog-002.json), [003](../tylko-reference/cases/wardrobe-catalog-003.json). 각 원본/실제 Befun/복원 캡처를 연결했습니다. 기존 category-wardrobe 사례의235218/92243과 다른 상품임을 대조했고, 제품군은 실제 TYLKO EDGE/TONE 표시로 판정했습니다. Tone layout은 DOM 선택 index와 같은 공개 원본 Engine thumbnail 순서로 확인했습니다.
- parser 초기 왕복은 원래 값·필드 생략·Befun stable 구획 ID를 그대로 보존합니다. 편집 시 기존 공통 정규화가 Edge localHeight/localDepth=null, Tone 양문에 기본 direction=left를 추가하는 동작은 별도로 기록했습니다. 양문의 실제 고정 좌우 방향은 생성기가 유지합니다. 원본 private channel key는 API403 때문에 미확인이며 앱의1..N을 원본 key라고 주장하지 않습니다.
- 로컬 저장 검사는 본인 GET proxy origin에서 **실제3003 route/컴포넌트**로 수행해 사용자의 기존 localhost 저장을 덮어쓰지 않았습니다. mock 저장 검사가 아닙니다. 초기 실제3003 카테고리→상품 클릭·3D 캡처와 로컬/URL 복원 검증을 구분합니다. proxy에서 React useId hydration 속성 경고를 관찰했으며, 후속 native3003 Tone 진입/Graphite61 URL복원에는 수집된 오류가 없었습니다. 전체 사이트 무경고 주장 아님.
- 이미지 정책 변경을 보존했습니다. 리더 R6 다운로드에서 정확한 `92332,w`/`92275,w`, 카테고리 `옷장 전체` 사진을 연결. 미다운로드 `1936508,w`는 **해당 원본 뷰어 캡처**를 로컬 static import로 사용합니다. Edge raw catalogue CDN 사진의 바이트 동일성은 blocked(원본 이미지 로드0/접근 제한)이며 다른 가족 사진으로 대체하지 않았습니다. 사진 URL은 사례에 출처로 유지합니다. 원본 뷰어의 열린 문 표시와 저장 facade closed는 별개입니다. [최종 카테고리 캡처](../tylko-reference/screenshots/wardrobe-catalog-001-category.jpg)에서 서로 다른 로컬 이미지3개 실제 로딩 확인.
- 검사: catalog/state/기존desk-ui 회귀 **26/26 PASS**, 위임4파일 ESLint 오류0/경고0, 전체 lint 오류0/경고8(타 영역 기존/QA). 최신 격리 `/private/tmp/befun-r4-storefront-build-khmchxr6` webpack production build/TypeScript/17정적페이지 PASS; 수정3개 컴파일 소스 SHA256 일치. [최종 검증 기록](../tylko-reference/cases/wardrobe-catalog-004.json).
- 기존 책상3종 실제3003에서 폭201.5/238.5/161.5cm로 한 옵션 변경→링크 공유→새로고침 후 각각 같은 값 및 canvas1 확인. 저장/책상 연결 재구현 없음. 공유 전 새로고침은 초기 preset으로 돌아가는 기존 동작이며 공유/저장 후 복원을 검사했습니다.
- **리더 요청 유지:** Tone 기존 generator 한계 `tone-drawer-runner-travel-unmeasured`, `wardrobe-bar-cross-section-assets`는 공통 물리·모델 소유 영역입니다. 초기 옵션 중 표현 불가 필드는 확인되지 않았으므로 진입 blocked 상품은0개입니다. 원본 private key/손잡이 제작 치수/runner 이동의 물리 동치까지 완료했다는 뜻은 아닙니다.
- 구매·계정·장바구니 지원 문구 없음. 로컬은 가족별 마지막1개이며 Tone 두 상품은 동일 family 슬롯을 공유합니다. 가격/DB/결제/배포 변경은 수행하지 않았습니다. 공유3003 재시작·공유.next 삭제 없음. 본인 proxy/검증 탭 정리 후 **위임4소스·신규 사례/캡처·본 handoff 잠금 해제**. 리더/QA는 `R4-ENTRY-READY`와 위 사례를 다음 검증 입력으로 사용할 수 있습니다.


### FURNITURE-DETAILS-READY — 책상·옷장 상세 구성 통일 / 2026-10-14
- 사용자 직접 요청 처리: 책상3/옷장3 및 공통 furniture-design 공유 경로에 책장과 같은 공통 상세 갤러리·클릭 확대·소개/특징·실시간 제품 사양·브랜드/소재/기프트/관련 디자인 흐름 연결. 기존 3D/저장/공유·계정/가격/DB/결제 보존.
- 원본 상품별 사진47장(8/8/8/7/8/8) VPN Chrome DOM에서 확인 후 원본 바이트 로컬 제공. 같은 가족의 확인된 사진만 갤러리 색 선택. Edge7장 순서 보존·다른가족사진대체 없음.
- 실제3003 및 안정 production6종 사진 전부 로딩, Classic/Tone 사진 전환 후3D 설정 유지, 확대/닫기/Escape,390px 가로넘침0,Graphite61cm 공유/새로고침/사양 반영 PASS.
- 기존26+사진검사3=29PASS,변경ESLint0/0,전체lint0/8경고. 최초R7타입오류 리더수정 후 최신전체소스 격리build/TypeScript/17페이지PASS(최종R7제외없음). 안정 production console0; 공유dev 빠른경로의 useId 속성 경고는 기록을 분리.
- 상세 증거/한계: [furniture-details 인계](furniture-details/README.md). 수정5소스 빌드 SHA일치. ProductDetails/ProductMaterialGallery 공통 구현 읽기전용 재사용; 카테고리 담당route 변경 보존.
- 신규 FurnitureProductDetails.tsx/furnitureProductPhotos.ts/전용CSS·photos.test.mjs·public/imgs/furniture-details·본인증거, FurnitureConfigurator 하단연결/prop 및 reference-product branch prop 잠금 해제. 공유3003/.next 미접촉, 본인임시서버/탭 정리.
