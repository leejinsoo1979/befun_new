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

## OVVO 홈·투명 표시 운영 게시 완료 — 2026-10-14 14:09 KST

- Commit `2cce836814736341f0c17945126f3346e96904f5`, `leejinsoo1979/befun_new` main push 및 ls-remote 동일 확인. 독립 사본 clean. 최신격리 production build/TypeScript/17정적페이지PASS, 공유/게시사본47검사PASS, 변경eslint0/0·전체lint0오류/기존경고7.
- Git source deployment `dpl_8GPYFbrb7ZjJZr6FpCim8QZKnKBY` **READY**, URL https://befun-gv1r20xao-lee-jin-soos-projects.vercel.app · 운영 alias https://befun-new.vercel.app . 로컬 build·Git push·BUILDING·운영READY를 별도 확인했다. 이번 배포는 prebuilt 업로드가 아니다.
- Vercel 빌드 로그에서05:07:25UTC Build Completed,05:07:33UTC Deployment completed 및Ready확인. MCP 빌드로그403은 같은프로젝트/스코프 CLI inspect로 확인완료; deployment metadata의READY/commit/alias도확인. 운영 Chrome 안내에서 MDF홈의벽/바닥·투명하우징/검정커넥터/최종확대 실제확인.
- 포함: assembly-guide10소스/검사파일, 본인전후/내부/단면/모바일증거, 본인 docs/assembly-guide 및 team완료기록. 기준f46b1d5의기존안정본 유지. 제외:공유R5/R6진행중UI/카탈로그/통화/가격, HW원본/CNC/공용materials/제품/route/공유.git/환경변수.
- 앞선f46b1d5 배포 `dpl_5Ztg4nB6nwtbk94JpEsWnPZAZKhe`도이번조회에서READY확인(이전QUEUED기록은당시상태). 다른MMM프로젝트빌드취소없음. 공동3003/.next보존. 제조언더컷·생산BOM·정밀다리·실제전체주문안내미확인범위는 pocket-transparency 인계유지.

## 방향 화살표 운영 게시 완료 — 2026-10-14

- Commit `104ac8505a771434d60e62698def5fc18da70f99`, GitHub main push/ls-remote 동일, 독립사본clean. Git deployment `dpl_5zeaJFgcaxPKdBZ5i9uhrPqUQqxC` **READY**, https://befun-5fr9f7trm-lee-jin-soos-projects.vercel.app · production alias https://befun-new.vercel.app . 로컬build·Git push·BUILDING·READY를구분확인. 이번은Git sourceCI이며 prebuilt업로드아님.
- 운영 Chrome `/assembly-guide?topic=connector`에서 신규 data-motion-arrow=down/visible·64px 벡터 실제표시확인. 변경4소스/본인증거·인계만포함. 공용HW/CNC/재질/상품/상태/리더R7매뉴얼·route/R5/R6진행소스제외. 공유3003/.next/.git미접촉.
- 최종격리build/TypeScript/17정적페이지PASS·기존47검사PASS·변경eslint0/0·전체lint0오류/기존경고7·41소스SHA일치. 삽입/반대해제/일시정지/완료숨김/주제전환/390px/reduced-motion확인. docs/handoffs/assets/codex-assembly/motion-arrows/README.md. 본인31789서버종료·임시탭정리·잠금해제. 다른프로젝트취소없음.

### 캐비넷 모의 조립 게시 — 2026-10-14

- 왼쪽5 캐비넷 Git 반영: `f9dccf9bf5c9aaf59d97e7493aac9233dc0fe4b8` → `https://github.com/leejinsoo1979/befun_new.git` main 정상 push·원격 SHA 일치. 다른 담당자의 `dca8b20`까지 보존해 rebase, force push 없음. 신규기능 초안은 원격에 이미 포함되어 있어 이번 commit은 최종 도어 카메라/검증 인계를 추가한다. Vercel `dpl_F9sgMW164c3tavRsMrhSaBfmPYsn` Git production BUILDING; 업로드 CLI 실행/운영 READY와 구분.

- 왼쪽5 캐비넷 운영 게시: `dpl_F9sgMW164c3tavRsMrhSaBfmPYsn` READY, source=Git/production, SHA=`f9dccf9bf5c9aaf59d97e7493aac9233dc0fe4b8`, `befun-new.vercel.app`·`befun.co.kr`·`www.befun.co.kr` alias 확인. 운영 `/assembly-guide/cabinet` 실제8부품 표시·첫부품선택→커넥터준비→체결→확인 후1/8진행 확인. 별도운영인증 CLIENT_FETCH_ERROR2건 관찰(가구조립동작과분리,기존환경설정담당필요); 로컬조립검증console0과혼동하지않음. 관리자/환경변수/DB소스는미수정.

- 왼쪽5 운영 최종 확인: 위 READY의 실제 alias에서 캐비넷 자동조립8/8·완성화면 확인. 본인 임시31789 생산검증서버 정상종료, 공유3003 유지. 사용자 로컬/운영 캐비넷 탭을 남겼다.


- 왼쪽5 백패널/보강 패널 관통 수정: 8소유 소스/검사+본인 캡처/인계만 격리. 원격0c6ebf4까지 완료 변경 보존. 69검사·최종 production build/TypeScript PASS, lint0오류8기존경고. Git/push/운영READY는 아직 미실행, 별도 기록.

- 왼쪽5 옷장 직접만들기 진입 수정완료: DownloadedCatalog wardrobe promo만 /configurator→/furniture-design/wardrobe-edge. desktop/390px 목록 실제클릭→Edge 옷장118×198×60·3D/외형/내부구성 확인, overflow0/console0. 변경lint0·안정본격리 production build/TypeScript PASS·전체lint0오류8기존경고·diff check PASS. 소파리더 WIP 조건/상세링크 공유본보존·게시사본제외. 이번 좁은 href 잠금해제, docs/handoffs/assets/codex-assembly/wardrobe-create-entry/ 제출.

- 왼쪽5 옷장·책상 뷰어 크기 통일완료: furniture.module.css 공통 크기블록만. 책장상품 기준764px/420px사이드바/왼쪽0/오른쪽74px, 1200이하388·1023이하540·700이하430. 8화면×book/wardrobe/desk DOM viewer 사각형 및 옵션위치/폭일치·overflow0. 최종격리build/TypeScript PASS·lint0오류8기존경고·diffcheck/소유CSS블록SHA일치. 공유녹색/카메라/Space/초기정면/모델/저장/소파WIP미혼입. 반복dev fullscreen스트레스중context loss관찰·기존복구사용, native 안정성미인증/renderer미수정. 이번크기잠금해제, viewer-size-parity/ 인계. Git/운영검증별도.

- 왼쪽5 운영 기준 마감: initial2fe18fa는READY지만 운영책장 구CSS(716/상단100px공백) 때문에3뷰어동일성이FAIL임을 실제측정·기록. 공유R13 완료값 productConfigurator top0/productScene inset0/productViewer764 세규칙만 독립사본에 추가. 원격완료7b44a59 번역/인물경계보정보존. 최신통합 production build/TypeScript PASS·전체lint0오류8기존경고·diffcheck PASS. 최종운영비교는후속READY에서별도확인, 공유책장소스는이미정상이므로재수정안함/타WIP제외.
