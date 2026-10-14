# 왼쪽3 · Codex 쇼핑몰 — 서버 저장 실패부터 사용자 복구 화면까지 / R2.1-SAVE

## 이번 작업의 결과

서버 저장이 DB 초기화 오류로 실패하는 원인을 수정하고, 사용자에게 **서버 저장 성공 / 로컬 보관 / 서비스 미준비 / 없는 공유 디자인**이 서로 구별되게 한다. 서버만 고치고 화면 연결을 다시 리더에게 넘기지 않도록 이번에는 필요한 오류 표시 경계까지 위임한다.

기존 갤러리 12재질×8장, 확대/모바일 기능은 완료 범위로 보존한다. ENTRY-SAVE-004와 ENTRY-CONNECTOR-003 감사를 다시 하는 작업이 아니다.

## 확인된 원인과 소비자

- `src/lib/db.ts`는 `new PrismaPg(connectionString)`을 호출하나 설치된 adapter는 Pool 또는 PoolConfig를 받는다.
- DATABASE_URL이 없으면 빈 문자열을 전달한다. 올바른 객체로만 바꾸고 빈 값을 그대로 두면 pg 기본 환경으로 연결할 수 있으므로 미설정 분기를 반드시 별도로 둔다.
- `src/lib/auth.ts`의 `PrismaAdapter(prisma)`가 같은 export를 사용한다. db.ts를 nullable export로 바꾸면 인증 소비자가 깨질 수 있다. 외부 public API를 유지하거나 변경 필요를 먼저 명확히 제시한다.
- `ProductConfigurator.tsx`의 saveDesign은 실패 종류를 구분하지 않고 로컬 fallback한다.
- `src/app/share/[code]/page.tsx`는 모든 non-ok를 없는 디자인처럼 표시한다. 503과404가 구별되어야 한다.

## 단일 소유 파일

직접 수정: `src/lib/db.ts`, `src/app/api/designs/route.ts`, `src/app/api/designs/[code]/route.ts`, `src/components/storefront/ProductConfigurator.tsx`의 saveDesign/결과 안내만, `src/app/share/[code]/page.tsx`의 fetch 오류/재시도 표시만, 신규 `scripts/storefront-save-validation/**`, 본인 handoff.

공유 page의 **정상 config 복구 부분은 리더 잠금**이다. 그 부분을 건드려야 하면 정확한 범위를 handoff에 올린다. 같은 파일은 SAVE의 오류 표시 작업을 먼저 완료·해제한 뒤 리더가 복구 작업을 시작한다. 동시 편집하지 않는다.

읽기 전용: auth.ts, prisma/schema.prisma, .env, generated client, 주문/결제, sharing.ts·savedDesign.ts·공통 접합 스키마. DB 환경값을 발명하거나 로컬 DB를 자동 초기화하지 않는다.

## 이번 오류 응답 계약 — 구현할 계약

기존 성공 응답 `{id, shareCode}`와 조회 응답은 유지한다. 실패 body는 기존 `error`에 안정적인 `code`를 추가한다. 서버 내부 예외나 URL은 반환하지 않는다.

| 상황 | HTTP | code | 화면 처리 |
|---|---|---|---|
| JSON/필수 config 오류 | 400 | INVALID_DESIGN | 입력 오류 표시, 성공 메시지/공유 링크 생성 금지 |
| 내 디자인 목록 익명 접근 | 401 | AUTH_REQUIRED | 기존 로그인 필요 흐름 유지 |
| DATABASE_URL 미설정 | 503 | DESIGN_STORAGE_UNAVAILABLE | 서버 미준비, 검증된 현재 설계의 로컬 보관은 별도 결과로 허용 |
| 설정된 DB의 실행 오류 | 500 | DESIGN_STORAGE_FAILED | 서버 실패 안내, 기존 안전한 로컬 fallback 유지 |
| 정상 DB 조회 결과 없음 | 404 | DESIGN_NOT_FOUND | 없는 디자인 안내 |
| 정상 저장/조회 | 기존200 | 성공 body 유지 | 실제 반환된 code로만 서버 링크 구성 |

이 표는 이번 차수에 리더가 정한 앱 오류 계약이며 공급사 규격 버전과 무관하다. 익명 POST 저장은 기존 허용 동작(userId:null)을 유지한다. 목록 GET은 먼저 세션을 확인하여 익명401을 보존한다.

## 구현 순서

1. 설치된 adapter 타입을 다시 확인한 뒤 `{connectionString}` 구성으로 수정한다. 인스턴스 생성과 실제 쿼리 시점을 구분하고, 미설정 상태에서 모듈 import가 사이트 전체를 깨지 않게 한다. PG default 접속이나 가짜 localhost URL로 문제를 숨기지 않는다.
2. dev singleton 재사용 문제를 확인한다. 이전 잘못된 client가 HMR로 계속 살아 있는지 검증하며, 수정 검사는 격리 프로세스에서 한다. 공유 dev 서버를 임의 종료하지 않는다.
3. design API에 위 오류 코드를 구현한다. 잘못된 JSON은 구분하고, DB 오류 로그는 민감값 없이 분류한다. PrismaAdapter와 다른 기존 prisma 소비자의 타입/동작을 깨지 않았는지 확인한다.
4. 상품 saveDesign에 응답 구분을 연결한다. 400을 서버 저장 성공이나 로컬 공유 성공으로 바꾸지 않는다. 로컬 fallback 전에 기존 serializer의 유효성 검사 결과를 사용한다. 저장이 실패한 설계를 기존 저장 목록에서 서버 성공으로 표시하지 않는다.
5. 공유 페이지에서404/503/500/네트워크 실패를 구별한다. 재시도는 같은 code를 다시 읽으며 이전 성공 설계 상태를 잘못된 응답으로 덮지 않는다. 정상 복구 로직은 그대로 둔다.
6. 아래 검사 후 실제 DB 환경이 준비돼 있다면 테스트 설계 저장→조회 왕복을 확인한다. 미설정이면 그 부분은 blocked로 명시하고 수정 가능한 코드/화면은 완료한다.

## 필수 검증

| ID | 조건 | 기대 |
|---|---|---|
| SAVE-01 | URL 없는 별도 프로세스 import | 앱 import 성공, DB 연결 시도 없음 |
| SAVE-02 | URL 없음 + 정상 저장/공유 조회 | 503, 고정 code, 내부 에러/비밀정보 노출 없음 |
| SAVE-03 | `{}` 또는 깨진 JSON POST | 400, 잘못된 성공 링크 없음 |
| SAVE-04 | 익명 목록 GET | 401 유지 |
| SAVE-05 | adapter 구성 + mock DB create/find | 연결 config 형태 정확, success body/조회 config 왕복 보존 |
| SAVE-06 | mock DB 없는 code | 404. 서비스 미준비를404로 위장하지 않음 |
| SAVE-07 | mock DB query 예외 | 500, client에 내부 예외 없음 |
| SAVE-08 | 상품 저장503/네트워크 실패 | 로컬 보관 문구, 서버 링크와 구별, 저장 버튼 pending 해제 |
| SAVE-09 | 공유 페이지503→재시도200 | 재시도 동작 및 정상 복구, 실패 시 임의 초기 설계 표시 없음 |
| SAVE-10 | 실제 DB가 구성됨 | 실제 POST200→GET200, 기록된 테스트 code와 비밀 없는 config diff |

mock 통과를 실제 DB 왕복 통과로 쓰지 않는다. savedDesign 기존17검사, 변경 lint, 타입, 격리 build, 브라우저 오류 상태 캡처를 남긴다.

## 다음 연결 작업

공통 접합 저장 계약은 리더 CORE-01 산출물이다. 그 함수가 실제 게시되면 이미 조사한 8개 진입점에 같은 함수를 연결하는 다음 단계로 넘어간다. 이 작업에서 임의 connectorSelection 스키마를 만들지 않는다. 현재 배정 완료는 **저장 오류와 사용자 오류 흐름 교정**이며 설계별 접합 저장 완료와 다르다.
