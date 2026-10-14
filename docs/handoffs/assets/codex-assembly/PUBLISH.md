# 조립 안내 게시 검증

2026-10-14. 원본 ZIP 작업폴더에는 Git 메타데이터가 없어 원격 main 0b0e434 기준의 독립 Git 사본에서 조립 범위만 게시한다.

- src의 assembly-guide 컴포넌트/lib/route, 원본 자산, 본인 R2/R3/연출 인계, 실행에 필요한 미게시 HW 공용 모듈을 포함한다. 기존 상품/store/CNC/layout/package/schema 파일은 수정하지 않는다.
- 게시 사본의 node 조립 검사35/35, lint 오류0/기존 main 경고8, 네트워크 허용 후 실제 webpack production build/전체 TypeScript/static generation 통과. 첫 sandbox 폰트 fetch 실패를 통과로 기록하지 않는다.
- .env와 node_modules/generated Prisma는 검증에만 사용하며 Git 제외. 정밀3D 다리 이동/제조 치수 unknown은 R3 보고대로 유지한다.
