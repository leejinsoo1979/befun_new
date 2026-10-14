# Codex 조립 안내 — R4 재질·분해 인계 및 R2.1/R3 기록

최신: [R4-ASM-READY·검증·실제 디자인 계약 요청](handoffs/assets/codex-assembly/material-disassembly/README.md), [READY](handoffs/assets/codex-assembly/material-disassembly/ready.json). 양면 라미네이트·자작 엣지 및 R15mm슬라이드→들기분해를연결했다. 전체주문가구/정밀다리기구/제조승인은제외한다.

R3 이력: [R3-ASM-01~06 제출](handoffs/assets/codex-assembly/r3-legs/README.md), [LEG-GUIDE-READY](handoffs/assets/codex-assembly/r3-legs/ready.json), [기존 연출 마무리](handoffs/assets/codex-assembly/cinematic/README.md). 원본 다리 안내·공식 영상 재생과 공유 정적 GLB 연결은 납품했으며, 정밀3D 다리 이동 시연은 미구현이다. 아래 R2.1 기록은 당시 결과로 보존한다.

## R2.1 결과와 실제 실행

- [ASM-01~07 제출·동일 시점 전후 캡처·변환·한계](handoffs/assets/codex-assembly/r2/ASM-01-07.md), [기계 판독 manifest](handoffs/assets/codex-assembly/r2/manifest.json).
- OVVO: http://localhost:3003/assembly-guide?topic=connector . 기본 `/assembly-guide`는 Tylko 원본 자료 5단계, `?topic=back-panel`은 백패널 7단계.
- R2.1은 OVVO 예제 접합 교정이다. 실행 경로에서 기존 박스 Housing/임의 Connector를 제거하고 HW 공유 PH/RH/PC/RC로 교체했다. 가공 외곽 침범·PH 회전을 교정하고 미확정 내부 단면을 분리했다. 문구만 추가한 교정이 아니다.
- HW-CONTRACT-READY 소비와 ASM-CONNECTED 게시 완료. HW 담당의 HW-03/HW-05 실제 화면 기준점 확인도 완료(`team-tasks.md` 확인).

## OVVO 모델·동작·포켓

- P=PH/PC/PH, 압입만. R=PH/RC/RH, 진입 후 장축 슬라이드. [P 공식 도면](https://ovvotech.com/wp-content/uploads/2022/09/V-1230P-Combined.pdf), [R 공식 도면](https://ovvotech.com/wp-content/uploads/2022/09/V-1230R-Releasable-Miling-Connector-Instructions.pdf).
- 장면 mm, scale=1. 예제 접합점은 실제 CNC planner `applyConnectors`의 ±105mm를 재사용. 주문 전체 접합계획으로 일반화하지 않는다.
- `guideMounts`의 settled 기준점을 자식에 적용하고 움직이는 판 부모에 절대 샘플 이동을 한 번만 적용한다. HW S의 X→장면Z, Y→X, Z→Y. 끝 PH는 Q·X_Sπ(장면 Zπ), 커넥터는 Q만.
- UI의 A는 고정 받침판=HW 판B, UI의 B는 움직이는 세로판=HW 판A이다.
- R 도면의15mm는 **4. Release의 해제 슬라이드 표기**. 조립 이동값은 HW 예제 pose 차에서 소비하며 `assemblyTravelStatus=inferred`로 반환하고 화면에 추정값으로 표시한다. 해제15를 공식 조립 실측으로 제시하지 않는다. P 해제를 거부하는 별도 해제 sampler는 검사 대상으로만 두고 UI 조립 역재생을 해체 안내로 쓰지 않는다.
- 도면에서 확인된 홈 입구 외곽30×9.4와 깊이12.5±0.5를 구분한다. 미확정 언더컷 구간은 절개 예시로 생략, 임의 직선 목재 벽 제거. 단면 X=0의 남은 양면을 관찰하며, 절단 캡·정밀 가공 단면·탄성을 재현했다고 주장하지 않는다.
- 실제 장착 메시의 관통 정점 외곽 검사로 기존 끝캡1.10517010948mm 침범이 없어졌음을 확인. 표면 접촉·전체 삼각형 충돌·언더컷·공급사 CAD/실물 동일성은 별도 미검증이다.
- geometry는 HW 소유, 주입 재질은 GuideScene 소유·dispose. 하드웨어 디렉터리와 공통 CNC/Shelf/stores는 수정하지 않았다.

## Tylko 5단계 보존 및 피스 지적 교정

- 색상 대응 → 입구 정렬 → 핀 진입 → 장축 슬라이드 → 끝선/직각 확인. [공식 PDF](tylko-reference/sources/connector-clip-003-tylko-aligning.pdf) p2~6과 [공식 기사](https://tylko.elevio.help/en/articles/34-aligning-horizontal-and-vertical-elements)를 사용.
- 기본 화면은 사용자 지정 원본 실물 사진과 공식 PDF의 원본 도해 영역이다. `ReferenceClipGuide`는 확대만 한다. 피스 머리/목/나사산/드라이버 홈 치수를 새로 만들지 않았다. PDF의 작은 핀 그림에서 구체적인 드라이버 홈을 확인했다는 앞선 해석은 철회한다.
- 기존 Tylko 하드웨어 담당 모델의 5단계 시연은 사용자가 `추정 3D`를 선택했을 때만 표시한다. 이 모델의 내부·치수·피스 외형은 실물 재현이 아니다. 기본 원본 모드는 자료 확인 완료로 문구를 구분한다.
- 추정3D는 하드웨어 `TylkoClip/TylkoClipPin/createClipMaterials`, `ILLUSTRATIVE_CLIP/PIN`, `clipContract`를 소비하며 외형을 중복 구현하지 않는다. 은색은 색상 대응 예시이고 판금 실물 모델은 미구현이다.
- 핀 진입 완료 전에는 슬라이드하지 않는다. 클립 로컬 +X를 장면 +Y로 변환하고, 핀 기준 클립 패널 -X 이동으로 상대 핀 좌표가 x=0→travel이 된다. PDF 화살표를 모든 가구의 월드축에 고정하지 않는다.
- 검정↔검정, 구형 주황↔주황, 은색↔은색. 색상별 잠금 역할은 미확정으로 유지한다.

## 백패널·다리 구분

- 백패널은 [사용자 제공 공식 기사](https://tylko.elevio.help/en/articles/32-back-panels-and-supports)의 하단 고정핀 먼저 삽입 → 판 세움 → 상단 스프링핀 복귀/잠금 예시를 유지한다. OVVO/Tylko 클립과 별도 topic·7단계다.
- [다리 도면](tylko-reference/cases/hardware-leg-mount-001.json)의 중앙 핀 누른 채 슬라이드 후 분리는 별도 기구다. 패널 커넥터/백패널 동작을 다리에 재사용하지 않는다. 다리 전용 모델·안내는 이번 실행 경로에 연결하지 않았다.

## 검증과 완료 범위

- `node --no-warnings --test src/lib/assembly-guide/*.test.mjs`: **24/24 통과**, 기존 OVVO4/Tylko4/백패널4 포함. 절대 샘플·단계 경계·두 앵커·실제 장착 메시·역방향 RC 실패·모바일 카메라 투영 검사.
- `npm run lint`: **오류0, 기존 경고7**. 변경 범위 eslint 오류/경고0.
- 격리 `/private/tmp/befun-assembly-check-jrhak3ly`의 `npm run build -- --webpack`: **통과, 전체 TypeScript 포함**. 카메라 tuple 오류를 찾아 수정한 뒤 모바일 CSS·그림자 수정까지 재검사. 공용 개발 서버/.next 보존.
- Chrome 데스크톱1728×937 / 모바일390×844 실제 확인: 재생·일시정지·반복·이전 이동, P→R→P 재생 중 초기화, topic 전환, 내부/정면/측면/절단, 드래그/휠 확대, 자동 시점 복귀. 모바일 보기 버튼288px 겹침을94px로 수정. 문서 가로폭/scrollWidth390, 선택 단계 스크롤 유지. Tylko 확인 버튼은 페이지 정상 스크롤로 접근한다.
- HW 담당 독립 확인: P↔R6회, 콘솔 오류0, 회전/이중 변환 없음. 캡처 경로는 ASM 제출 문서에 기록.
- 실제 주문 전체 판재/안정 panel ID·접합 순서·제조/CAD 검증·정확한 조립 거리·다리 안내·한국어 실제 가청 출력·MP4 내보내기는 미완료다. 예제 교정을 전체 출고 설명서 완성으로 보고하지 않는다.

## R3-ASM 수신·착수 — 2026-10-14 08:10 KST

- 실제 세션 `01a13548-3202-7aa2-8a54-0ff6840d3f75`, Codex `/root` / codex-assembly. [R3 지시](development/furniture-parity/assignments/r3/05-assembly.md)와 전체 배정을 읽었다.
- 허용 잠금: assembly-guide 컴포넌트/lib/route, 본 문서, cinematic/r3-legs 증거. 신규 원본 복사만 public/assembly-guide/legs 허용. 공유 HW·제품·CNC 소스 읽기 전용.
- 기존 미제출 cinematic 최종 검증부터 완료하고 다리 원본 안내·topic·단계/카메라/입력 연결을 진행한다. LEG-VISUAL-READY의 원본 rigid group을 소비하며 나사/핀 위치·이동거리 null을 임의 수치로 채우지 않는다. 기존 R2.1 보고와 증거는 유지한다.

### R3 선행 연출 마무리 — 2026-10-14 08:20 KST

[실제 화면·최신 검증·fingerprint](handoffs/assets/codex-assembly/cinematic/README.md) 제출. Befun 로고/서체/흰색·검정 UI, 중립 배경·스튜디오 광원, 전체 자동 재생·따라 조립 분리, 650ms 카메라 이동, R 내부 절개 캡을 연결했다. 최신 코드의 lint 오류0/기존경고7, 전체 TypeScript 포함 격리 webpack build 통과. 30검사 통과. 위 R2.1의 24검사·구UI·절단캡 미구현 기록은 당시 결과이며 최신 연출 상태는 이 절을 따른다. 하드웨어 교정을 반복하지 않았다.

### LEG-GUIDE-READY — 2026-10-14 08:38 KST

[사례 R3-ASM-01~06·원본 출처·최신 build·남은 검증](handoffs/assets/codex-assembly/r3-legs/README.md), [READY export](handoffs/assets/codex-assembly/r3-legs/ready.json). 실제 URL http://localhost:3003/assembly-guide?topic=legs . 원본 단계·화면 안 공식 영상 + HW 공유 원본 GLB 외형 확인을 연결했다. 핀/나사/키홀·거리 null을 자체 하드웨어로 채우지 않는다. 정밀3D 모션·제조 치수와 원본 안내 완료를 구분한다. 35검사·최신 lint/전체TypeScript 포함 격리 build 통과. 남은 데스크톱/반복 전환 독립 검증 진행, 잠금 유지.

### REVIEW-R3 수신 — 2026-10-14 08:43 KST

리더 review-r3.md의 REVIEW-R3-HW-01 및 ASM 판정을 확인했다. 원본 안내와 정적 3D 관찰을 구분하고 R3-ASM-03의 정밀3D 이동 시연 미구현을 명시했다. 동일 lifecycle 문제를 실제 Chrome에서도 재현했고, HW 잠금을 보존하며 동일 공개 팩토리 소비로 안내 경로를 교정했다. 공용 LongLeg 수정본 자체 검증·독립 HW-05 확인은 HW 담당에게 요청 상태다. 본 소비자는 원본 자산·TRS·scale·geometry 소유권을 그대로 사용한다.

### R3 最종 납품·잠금 해제 — 2026-10-14 08:47 KST

- [LEG-GUIDE-READY 최종 사례·캡처](handoffs/assets/codex-assembly/r3-legs/README.md) 제출. 원본 다리 분리/조립5단계, 공식영상 화면 내 재생, 핀 누름/슬라이드/잠금 확인 gate, 동일 공유GLB 외형 보기. 기존 OVVO P/R·Tylko5·백패널7 보존.
- 최신 소스35검사·lint0오류/기존7경고·격리 webpack build/전체TypeScript 통과. built fingerprint와 제출 코드 일치. Chrome desktop/390px·6회 원본/모델 전환·수동카메라 복귀·초기 새로고침·재생/topic/seek/일시정지·공식 영상 모달 확인, error/warn0.
- 정밀3D 다리 이동 시연 미구현, 핀/나사/키홀·이동/타공 null 유지. 원본 영상의 실제 이동 안내와 정적 GLB 관찰을 별도 판정. 공용 LongLeg HW-01 수정/독립 HW-05 확인은 생산자 요청 상태, 전체 출고/제조 안내 완료 주장 없음.
- 이번 ASM 잠금 해제: components/lib/app assembly-guide 전체, docs/assembly-guide.md, cinematic/r3-legs 증거, 신규public/assembly-guide/legs. 공유 서버/.next 및 타 담당 파일 보존.

## R4-ASM 수신·첫 인계 — 2026-10-14 12:19 KST

왼쪽5, 기존 세션 Log in. [재질·공식 분해·최소 실제 디자인 입력 계약 요청](handoffs/assets/codex-assembly/material-disassembly/README.md). 사용자 직접 요청 수정 진행 중. R4 단독 범위 유지, 제품/route/공통 계약은 리더 소유. 이전 R2.1의 해제 sampler가 검사 전용이었다는 기록은 당시 상태이며, 이번 R4에서 별도 R 공식15mm slide→lift UI를 연결한다. READY와 최종 검사 결과는 완료 후 추가한다.

### R4-ASM-READY — 2026-10-14

[6사례·최종캡처·41검사·자원해제·입력계약](handoffs/assets/codex-assembly/material-disassembly/README.md) 제출. 최신격리 production build/전체TypeScript/17정적페이지PASS,lint오류0/기존경고7,변경eslint0/0. 실제Chrome desktop/390px·6주제전환·12재질토글·따라분해4단계완료·cold texture문제교정확인. source36파일격리SHA차이0. 이번소유잠금해제. 리더의제품버튼/공통parts/joints연결과정밀다리모션은미완료이며,이번예시안내수정완료와구분한다.
