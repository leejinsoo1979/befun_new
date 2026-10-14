# 조립 안내 게시 검증

2026-10-14. 원본 ZIP 작업폴더에는 Git 메타데이터가 없어 원격 main 0b0e434 기준의 독립 Git 사본에서 조립 범위만 게시한다.

- src의 assembly-guide 컴포넌트/lib/route, 원본 자산, 본인 R2/R3/연출 인계, 실행에 필요한 미게시 HW 공용 모듈을 포함한다. 기존 상품/store/CNC/layout/package/schema 파일은 수정하지 않는다.
- 게시 사본의 node 조립 검사35/35, lint 오류0/기존 main 경고8, 네트워크 허용 후 실제 webpack production build/전체 TypeScript/static generation 통과. 첫 sandbox 폰트 fetch 실패를 통과로 기록하지 않는다.
- .env와 node_modules/generated Prisma는 검증에만 사용하며 Git 제외. 정밀3D 다리 이동/제조 치수 unknown은 R3 보고대로 유지한다.

## R4-ASM 게시 결과 — 2026-10-14

- 첫commit `3576d1c3a087d3b04523740c9531694daccd172a`: push/원격동일확인, Git배포 `dpl_7XDsKMce3TiVsuHrQgUNRSJEmQWT` **READY**, `befun-new.vercel.app` alias연결. 운영URL `/assembly-guide?topic=connector`에서 양면/자작엣지문구·분해4단계·실제재생 progress21 확인.
- 최종가공면보정commit `f46b1d5841e01b9995c9ba4f4aecbb3b3159c670`: push/원격동일확인,격리 build/TypeScript/17정적페이지PASS,42testsPASS,lint0오류7기존경고. Git배포 `dpl_5Ztg4nB6nwtbk94JpEsWnPZAZKhe` **QUEUED**. 최종commit의운영READY는아직확인되지않음. 업로드한prebuilt배포라고표시하지않음(이번은Git source CI).
- 포함: ASM재질/분해/가공면·소유자원해제/texture-before-Canvas·context복구/본인증거와인계. 제외:공동R4진행중소스, 공용재질/HW/CNC/제품/route,새다리정밀기구,환경변수/.git.
- 독립게시사본clean. 공유.git/3003서버/.next 유지. 제31789검증서버와임시탭만정리. 별도MMM프로젝트build취소는실행하지않음.
- 실제제품공통계약/안내진입버튼은리더요청기록이며대기로독립ASM수정을중단하지않았음. R4-ASM-READY는예제수정완료와검증제출,전체주문/제조승인과구분.
