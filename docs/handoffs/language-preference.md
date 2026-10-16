# 사용자 선택 언어 유지

2026-10-16 · codex-storefront

## 동작

- 사용자 선택을 origin별 `localStorage.befun_region_preference`와 기존 SSR용 `befun_region` 쿠키에 함께 저장.
- 명시적으로 고른 언어를 이동/새로고침/새 탭에서도 유지. 다른 탭에서 사용자가 새로 선택하면 저장 이벤트로 동기화.
- 쿠키가 없을 때 `Accept-Language`로 언어를 다시 고르던 서버 fallback 제거. 선택이 없거나 유효하지 않으면 한국어 기본. 코드에서 IP/VPN 위치를 조회하는 로직은 발견되지 않았음.
- localhost는 포트가 달라도 쿠키를 공유하므로 테스트 포트가 쿠키를 변경할 수 있음. origin별 저장값이 있으면 이를 우선 복원하고 SSR 쿠키를 맞춤.
- 첫 hydration의 서버 쿠키 값이 기존 브라우저 선택을 덮어쓰지 않도록 저장 전 최신 선택을 다시 확인.
- 저장소 차단 시 쿠키/현재 문서 메모리로 동작. 지역/언어의 기존 연결 방식 및 가격 계산·배송 국가·장바구니·디자인·인증 동작은 변경하지 않음.

## 범위

- `src/lib/i18n/I18nProvider.tsx`: 선택 상태 구독, 저장/복구, 서버 화면 갱신.
- `src/lib/i18n/preference.ts`: 검증된 선택 해석 및 브라우저 저장.
- `src/lib/i18n/regions.ts`: 지역 ID 검사.
- `src/lib/i18n/server.ts`: `currentRegion`의 자동 감지 fallback 제거만. 공유 checkout의 타 담당 `localizedMetadata` helper와 번역 사전 작업 보존.
- `scripts/i18n/preference.test.mjs`: 상태/저장/SSR 계약 회귀 검사.

## 검증

- 자동 검사 7 PASS(최신 번역 커밋과 결합한 회귀 검사는 기존 번역 6개 포함 총 13 PASS): 미선택 한국어, 명시한 4지역 우선, 잘못된 값, 포트간 쿠키 충돌 복구, 선택 저장/알림, 탭 동기화, 저장소 차단, 기존 쿠키 마이그레이션 포함.
- scoped ESLint PASS. 공유 checkout 및 원격 main 기준 게시 사본 full lint 오류 0 / 기존 타 파일 경고 13.
- 원격 `888eef75ce67049981585d57f1b7810b7795e643` 기준 검증 후 동시 번역 게시 `1f039ce` 위에 rebase한 독립 게시 사본 `/private/tmp/befun-locale-publish-5g7g_0bk/repo`의 최종 production webpack build/TypeScript PASS. Google Fonts 샌드박스 DNS 제한 재시도 및 동일 Prisma 스키마의 ignored 생성 클라이언트 준비 후 완료.
- 실제 Chrome production `127.0.0.1:31849`: JP 선택 → 커뮤니티 링크 이동 → 새로고침 → 설정 JP 유지. US 선택 → 새로고침 → 새 탭 US 유지. 두 번째 탭 KR 선택 → 첫 탭도 KR 반영.
- 실제 별도 포트 `127.0.0.1:31850` fixture에서 Set-Cookie로 JP 덮어쓰기 → 31849 재진입 시 기존 KR 선택 복구 → 새로고침 KR 유지.
- fixture에서 쿠키 삭제 → 기존 KR 복구. 다시 JP 명시 선택 후 쿠키 삭제 → JP 복구. 기본 한국어 fallback만으로 통과한 것이 아님을 구분.
- 콘솔 error 0. 사용자 `localhost:3003/region-settings`는 KR 상태 확인만 수행했으며 테스트용 외국어 선택은 하지 않음. 격리 테스트를 마친 뒤 KR로 되돌림.
- 동시 게시된 번역 작업과의 server.ts import 충돌은 새 localizedMetadata helper/번역을 보존하고 currentRegion의 자동 감지만 제거해 해결.
- 게시에는 위 언어 유지 파일과 이 문서만 포함. 다른 담당자의 번역/쇼룸/가격/옵티마이저 미게시 변경은 섞지 않음. 공유 Git index/HEAD/3003/.next 유지.

협업 검증 시 사용자 localhost:3003에서 언어를 바꾸지 말고 별도 hostname/격리 서버를 사용한다. 같은 hostname의 포트 분리만으로는 쿠키가 격리되지 않는다.
