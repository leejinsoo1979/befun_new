# 운영·로컬 배포 동기화 — 2026-10-14

## 원인과 반영 범위

운영 `https://befun-new.vercel.app`은 `5acfd9a`를 READY로 배포하고 있었다. 이 커밋은 조립 담당 범위128파일만 추가했으며, 현재 ZIP의 다른 개발 결과는 담지 않았다. 브라우저 캐시가 아니라 실제 게시 소스의 누락이었다.

사용자의 로컬·운영 차이 지적에 따라 전체 `src`, `public`, `scripts`와 관련 인계/원본 근거/화면 캡처를 독립 Git 사본에서 동기화했다. 다른 담당자의 잠금 파일은 읽기만 했고 공유 dev 서버와 `.next`를 수정하지 않았다. 진행 중이던 옷장 납품과 입력 검증 후속까지 수신했다.

동기화 범위: 상품 UI/헤더/보기 메뉴/로딩 연출, 재질별 원본 갤러리, Grid Type01와 다리/소품/손잡이, 책상/Edge·Tone 옷장 구성기와 저장복원, MOVENTO/연결부/CNC 보존. package/lock/schema/config 변경 없음. `.env`, 생성 Prisma, 의존성, 빌드 산출물은 Git 제외.

최종 소스 기준 `2026-10-14T10:45:57.835647+09:00`. 소스/공개 자산/검증 스크립트의 로컬·게시사본 차이0개를 확인했다. fingerprint: `dcd319d66a3276666f9f197b2a830a2e9631115fdc04b071a902c4de17c8e1cb`. 진행 중 다른 작업이 이후 만드는 변경은 이 기준 이후의 새 작업으로 구분한다.

## 검증

- 독립 `npm ci` 후 기본 `npm run build` PASS: Turbopack, 전체 TypeScript, 정적 생성. webpack 통합 검사도 PASS. 네트워크 허용으로 Google font 취득.
- 전체 ESLint 오류0 / 기존 경고7. 기존 원본 CAD/PDF/로그의 CRLF·공백을 보존했다. 신규 수신 코드의 기존 공백/빈 줄4건은 기능 오류가 아니며 다른 담당 소스와의 byte 동기화를 위해 변경하지 않았다.
- 조립/저장/다리/MOVENTO/CNC/케이블 관통/손잡이 focused85검사 PASS.
- 책상/Edge·Tone/하드웨어/Grid/소품/저장 구조7,537검사 PASS. Node에서 Next JSON import를 그대로 읽기 위한 임시 JSON load hook 사용. 초기 hook 없는 Desk panel 실행 실패를 그대로 통과로 세지 않았다.
- 최종 가구 URL·JSON 복원/불법입력/고정 힌지 검사12개 PASS. Desk panel6개 PASS.
- 프로덕션 서버 별도 포트31789에서 상품 기본 화면, Feet→Legs(63→73cm), 테라코타 사진8장+스와치17종, Modern 책상, Tone 옷장 닫힘/열림, 로딩 종료 확인. 각 확인 페이지 console error/warn0.
- 대표 화면 로컬과 동일: 프로모션 알림을 같은 조건으로 닫고 비교. 브라우저 저장 상태는 origin별이므로 이전 알림 닫음 여부는 새 운영 origin과 공유되지 않는다.

원격 push 이후 Vercel 생산 alias의 실제 commit/READY 상태와 운영 브라우저 렌더를 추가 확인한다. 계정 인증·결제·실 DB 저장 전체 흐름과 제조 치수/정밀 CAD 동치를 새로 완료했다는 주장 없음. 기존 하드웨어·조립 인계의 미확인 항목은 보존한다.

## 화면 근거

- [이전 운영](assets/deployment-parity-20261014/production-before.jpg)
- [로컬 기준](assets/deployment-parity-20261014/local-target.jpg)
- [통합본 상품](assets/deployment-parity-20261014/preview-product.jpg)
- [다리 선택](assets/deployment-parity-20261014/preview-legs.jpg)
- [갤러리](assets/deployment-parity-20261014/preview-gallery.jpg)
- [책상](assets/deployment-parity-20261014/preview-desk.jpg)
- [옷장 개방](assets/deployment-parity-20261014/preview-wardrobe-open.jpg)
- [소스 fingerprint](assets/deployment-parity-20261014/source-fingerprint.json)

## 운영 배포 후 검증

GitHub main `8b0f837b0653e5eecc3d0139a067d84c18860a55` push 확인. Vercel `dpl_3qvsrxxa62D5o3fUGG7eQFVeYy9b` READY 및 생산 alias `befun-new.vercel.app` 대응 확인. 실제 Vercel build/TypeScript/static generation 성공 로그도 CLI에서 확인했다.

운영 상품 UI가 로컬 기준과 일치한다. 다리 선택63→73cm, 갤러리 원본8장 로드, 책상3D, Tone 옷장 문 개폐, 다리 원본5단계 안내를 Chrome에서 확인했다. 격리 상품390px에서 가로 넘침0·로딩 종료 확인 후 viewport override 복원. [운영 결과](assets/deployment-parity-20261014/production-after.jpg), [갤러리](assets/deployment-parity-20261014/production-gallery.jpg), [책상](assets/deployment-parity-20261014/production-desk.jpg), [옷장](assets/deployment-parity-20261014/production-wardrobe-open.jpg).

남은 실제 서버 설정: `vercel env ls production --project befun-new --scope lee-jin-soos-projects` 결과 환경변수0개. 운영 `/api/auth/session` HTTP500, runtime `NO_SECRET/MissingSecret`. 따라서 운영 계정·DB 저장은 미완료다. NEXTAUTH_SECRET/DATABASE_URL 및 사용하는 OAuth 자격정보의 운영 설정이 필요하다. 비밀값을 코드에 넣거나 없는 DB/OAuth 계정을 만들지 않았다. 세션 오류를 3D 화면 완료와 혼동하지 않는다.

공유 로컬의 다른 담당 후속 옷장/경첩 작업은 10:45 스냅샷 이후 새 변경이며 기존 잠금을 보존한다. 이 배포 검증 추가는 공유 로컬 인계에만 기록, Git 게시사본은 커밋 후 clean이다.
