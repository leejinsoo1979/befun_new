# Desk·Wardrobe 통합 production build 검증

2026-10-14, horizontal_rules. 공유 개발 서버와 `.next`를 변경하지 않고 별도 사본에서 검증했습니다.

## 결과

- **프로덕션 빌드 성공**: Next.js 16.1.6 `next build --webpack`, 종료 코드 0.
- webpack 컴파일 15.2초, 전체 TypeScript 검사, 페이지 데이터 수집, 정적 페이지 17/17 생성, trace 수집 완료.
- `/furniture-design/[family]`는 동적 서버 렌더링 경로로 빌드 결과에 포함됨.
- 전체 ESLint 종료 코드 0: 오류 0, 기존 경고 7. `mypage`, `order/[id]`, `share/[code]`의 img 경고 3개, 기존 shelf `hardware.ts` 미사용 항목 3개, `materials.ts` 미사용 import 1개. 신규 Desk/Wardrobe 파일 오류 없음.
- 공유 개발 `.next/dev/types/validator.ts`에서 보이던 Route constraint 오류 2개는 깨끗한 격리 production 타입 생성에서는 재현되지 않음. 해당 생성물을 수정하거나 삭제하지 않았음.

## 격리 방법과 실행 근거

- 사본: `/tmp/befun-desk-wardrobe-build-crs3ts1g` (`/private/tmp`와 같은 디렉터리).
- 스냅샷: **2026-10-14 10:56:17 KST**, source 파일 512개 SHA256을 사본 `source-manifest.json`에 보존.
- 복사: `src`, `public`, `prisma`, `scripts`, package/config/TypeScript 설정. `.env*`, `*.pem`, `*.key`, `.next`, node_modules, tsbuildinfo는 복사하지 않음.
- 의존성은 기존 `node_modules`로 symlink. 패키지 설치·Prisma 생성·DB migration을 실행하지 않음.
- 환경은 `env -i`로 초기화하고 PATH/HOME/TMPDIR 및 `CI=1`, `NEXT_TELEMETRY_DISABLED=1`만 전달. 실제 인증 키·DB URL 및 테스트용 가짜 키 모두 사용하지 않음.
- 실행: `npm run build -- --webpack`, `npm run lint`.
- 로그: 사본 `build.log`, `build-network.log`, `lint.log`.

## 환경 실패와 코드 실패 구분

첫 sandbox 빌드는 기존 `src/app/layout.tsx`의 Google Fonts 요청에서 `getaddrinfo ENOTFOUND fonts.googleapis.com`으로 실패했습니다. 네트워크 허용 후 같은 소스를 다시 빌드하여 성공했습니다. 폰트 대체·mock·빌드 검사 생략은 하지 않았습니다. 이번 검사에서 코드 컴파일/타입/정적 생성 오류는 발견하지 못했습니다.

## 스냅샷 범위와 미검증 항목

완료 직후 SHA256 비교에서 다음 두 파일이 스냅샷 이후 변경된 것으로 확인됐습니다. 따라서 위 성공을 이 두 파일의 최신 변경에 대한 성공으로 확대하지 않습니다.

- `src/lib/furniture/wardrobe-hinges.ts`
- `src/lib/furniture/wardrobe/edge.ts`

최종 변경 종료 후 필요한 부분만 새 사본에 갱신하여 재빌드할 수 있습니다. 실제 브라우저 조작·외형 비교, 인증·DB 저장·결제 운영 연동은 이 빌드 검증의 범위 밖이며 리더가 별도로 확인합니다. 공유 소스에 대한 수정은 없었습니다.

## 중간 갱신 검증 — 2026-10-14 11:11:08 KST

위 두 파일을 포함한 후속 src 7개와 회귀 fixture/tests를 갱신했습니다. Tone `source.hinges` 연결, 최신 Edge 기하/경첩, 조명 렌더/재질 및 공통 디자인 수정이 포함됩니다. 동일 격리 사본에서 `next build --webpack` 재실행이 종료 코드0으로 통과했습니다 (`build-final.log`; 갱신 목록 `refresh-final.json`, source SHA256 `source-manifest-final.json`).

이 빌드 시작 직후 리더가 UV/모델/컨텍스트 복구 추가 작업 중임을 알렸으므로 **최종 통합 완료 검증으로 취급하지 않습니다**. 안정 스냅샷 알림 후 추가 변경을 반영하여 다시 검사할 예정입니다.
