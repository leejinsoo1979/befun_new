# R4-ASM — 왼쪽5 codex-assembly

## 수신과 현재 범위

2026-10-14 12:19 KST, 기존 세션 `01a13548-3202-7aa2-8a54-0ff6840d3f75` / Log in. 사용자 직접 요청 재질·분해를 유지하며 dispatch-r4.md의 왼쪽5를 수신했다. 새 작업자를 만들지 않았고 공유3003 서버/.next/.git/공용 재질/원본HW/CNC는 수정하지 않는다.

잠금: components/assembly-guide/**, lib/assembly-guide/**, docs/assembly-guide.md, 본 증거 폴더. 수신 전 추가했던 route query 변경은 본인 diff만 회수했다. 제품 진입·route 연결은 리더 요청 범위로 아래에 남긴다.

## 첫 재현·근거

- 전: 사용자 캡처 `before-user-ovvo.png`, OVVO R 8/8. 모든 면이 같은 단색이었다.
- 현재: 시연 소유 재질만 변경. 두 넓은 면은 같은 #e4e7eb 라미네이트, 네 절단면은 기존 Befun 합판 사진 wood002/verticalEdge_diff.jpg. 면 번호와 UV를 판재 로컬 좌표로 고정한다. 홈 주변 분할 메시도 전체 두께에서 같은 U 위치를 사용한다. 실제 자작 수종·접착층 수·라미네이트 두께를 새 제조치수로 선언하지 않는다.
- R 공식 [도면 section4](https://ovvotech.com/wp-content/uploads/2022/09/V-1230R-Releasable-Miling-Connector-Instructions.pdf): 15mm slide→lift. UI4단계는 준비/슬라이드/들기/확인이며, 하우징과 커넥터를 뽑는 동작은 추가하지 않는다.
- P 공식 [Permanent Instructions](https://ovvotech.com/wp-content/uploads/2022/09/V-1230P-Combined.pdf): 영구 압입형. R 절차를 재사용하지 않으며 P 선택시 조립으로 초기화·분해 버튼 비활성.
- R 조립 이동은 기존 HW 예시의 추정값, 15mm를 조립 실측으로 바꾸지 않는다. 들어 분리의80mm는 화면상 분리 여유이며 제조 치수가 아니다. 미확정 내부 언더컷/탄성/전체 주문은 미확정 유지.

## 리더에게 요청하는 최소 입력 계약

읽은 현재 구현: `lib/furniture/design.ts`, `desk/index.ts`, `wardrobe/types.ts`, `desk-panel.ts`, `wardrobe-panel.ts`, DeskModel/WardrobeModel/FurnitureConfigurator. 새로운 저장 형식이나 생성기는 만들지 않았다.

| 항목 | 현재 값/위치 | 조립 안내에 필요한 전달/누락 |
|---|---|---|
| 디자인 원본 | FurnitureDesign version1/kind/family/color/innerColor/config, Desk sectionIds, Wardrobe sections[].id | 동일 FurnitureDesign을 parseFurnitureDesign으로 검증해서 전달. 별도 복사 저장 형식 금지 |
| 생성된 판재 | DeskResult.panels/beams와 WardrobeResult.panels가 PanelData(w/h/d/x/y/z/matType) | PanelData에 안정 partId·sectionId가 없다. React panel-N/index는 제조·조립 ID로 사용할 수 없다. 리더 adapter가 원래 규칙의 역할 기반 안정ID를 공급해야 한다 |
| 문/서랍/기타 | Wardrobe fronts/drawers/bars에는 id/sectionId 있음. Desk fronts/feet는 대부분 index/anchor | 판재와 front/foot/rod 사이 참조를 같은 partId 공간으로 공급. 범용 자체 부품 생성 금지 |
| 치수·좌표 | FurnitureDesign config/sourceGeometryMm은mm, PanelData/DeskResult/WardrobeResult display는cm. DeskModel에 footOffset=1.2cm 적용 | unit 및 origin/적용된 footOffset을 명시. 안내 mm 변환은 한 번만. local 면 축/normal/up와 판재 접촉 앵커도 필요 |
| 접합 방식 | FurnitureDesign/두 공통 생성 결과에는 OVVO P/R 선택 또는 판재쌍 joint graph가 없음 | jointId, partAId/partBId, connector model/type, 두 로컬 앵커와 방향, 해제 가능 여부/공식 근거 공급. null/unknown을 임의 R/핀/CNC 타공으로 대체하지 않음 |
| 재질 | design.color/innerColor 및 matType 있음 | 각 part의 어느 색(외부/내부), broad-face axis, edge finish 지정. 현재 white example을 실제 고객색으로 오인하지 않게 구분 |
| 선택 | FurnitureConfigurator의 selectedSectionId는 지역 state; design 저장/URL에는 포함하지 않음 | 선택 ID·선택 jointId는 transient prop으로 별도 전달. 기존 design 저장 형식에 끼워 넣지 않음 |
| 이동과 순서 | 현재 생성 결과는 외형/문 개폐/케이블 타공; 전체 조립 계획 없음 | 리더/HW가 assembly/release 이동/충돌 선행관계를 verified/inferred/unknown으로 구분해 공급해야 실제 주문 전체 안내 가능 |

리더 요청: FurnitureConfigurator의 제품 진입 버튼에서 현재 FurnitureDesign과 selectedSectionId를 전달하고, 공통 생성 결과→read-only parts/joints adapter를 소유해 주세요. 초기에는 결과에 unsupported가 있거나 joint graph가 없으면 명확히 ‘접합 예시 안내’로 진입해야 합니다. 본 컴포넌트는 `initialTopic`과 `initialJointAction` prop을 제공하며, route query 연결은 리더에게 위임합니다. 실제 design 소비/전체 가구 조립은 아직 연결하지 않았습니다.

## 검증 진행

- 순수 회귀40 PASS, R15mm→lift 연속/탐색/하드웨어 고정/양면 매핑/UV 분할 연속/따라분해 선행확인 검사 포함.
- 격리 production build +TypeScript/static 성공. 최종 자원·렌더 복구 변경 후 다시 검사할 예정이며 이 결과를 재사용하지 않음.
- 공유3003 hot refresh 중 WebGL context-lost 재현. production31789의390px 실제 렌더·분해 progress 이동은 정상. 컨텍스트 손실시 재생을 멈추고 동일단계 재로딩을 제공하는 보완을 검증 중.
- 다리의 정밀 기구 운동은 미구현. 원본5단계/영상과 공유 정적GLB 외형 관찰만 보존.

완료표/최종fingerprint/READY/배포 상태는 검증 후 이어 기록한다.

## R4-ASM-READY — 최종 결과

| 사례 | 입력·조작 | 기대 / 실제 | 판정·증거 |
|---|---|---|---|
| R4-ASM-01 | OVVO R 8/8, 전체 위치→반대편→단면, 분리 뒤 회전 | 두 넓은 면 같은 라미네이트, 엣지 로컬 결 유지 / 동일 확인 | PASS: before-user-ovvo.png, final-front/rear/section.jpg, final-mobile-release.jpg |
| R4-ASM-02 | R분해 전체 재생·중간 탐색·따라분해; P로 전환 | 15mm slide 후 lift, HW각판재에 잔류. P분해금지 / 정상 | PASS: release-slide-half.jpg, release-lift-half.jpg, mobile-follow-complete.jpg,41검사 |
| R4-ASM-03 | P/R재생→일시정지→End탐색→재시작→모델/주제전환. Tylko원본5,백패널7,다리원본5 | 새 주제0%·이전HW/절개 제거, 원본자료·정적모델 구분 / 정상 | PASS: verification.json, back-panel-regression.jpg, leg-reference-regression.jpg |
| R4-ASM-04 | desktop1728×880/390×844, keyboard End·확인 체크·다음 단계 | 390px overflow없음, 해제확인 전lift단계잠김 / 4단계확인완료 | PASS: final-mobile-release.jpg, mobile-follow-complete.jpg; documentWidth390 |
| R4-ASM-05 | 6회주제/P/R/다리자료전환+12회내부재질토글; owned resource18회생성/해제 | GPU자원bounded,borrowed원본유지 / warmed29geometry·7texture·8program;36material+18texture해제 | PASS: resource-cycles.json, tests.log. 최초frame5/1/1은정상완료값과구분 |
| R4-ASM-06 | FurnitureDesign/생성결과 읽고 최소 part/joint/선택 계약 제안 | 공통 생성기·저장형식 재구현 없음 / 리더 요청 기록 | 제안PASS, 실제 제품 연결 미완료: 위 계약 표 |

최종 검사: source fingerprint의36파일을 격리 사본과SHA256 대조,차이0. 최신 production build/전체TypeScript/17정적페이지PASS,전체lint오류0/기존경고7,변경eslint0/0,회귀41PASS. 생성된 .vercel/output을 처음 lint가스캔한실패와 수정 중 일시lint오류는 최종통과와 구분하며최종로그만첨부했다.

Chrome 개발모드 cold texture/Suspense에서 컨텍스트손실을재현했고,texture를Canvas생성전에준비하는수정후 fresh reload와6회전환은ready였다. 손실시일시정지+같은단계재로딩도실제복구확인(context-loss-paused.jpg / final-shared-cold.jpg). 모든브라우저/장치의GPU손실원인을전부제거했다고선언하지않는다.

다리는 원본으로확인된핀누름→슬라이드→분리5단계/영상과정적GLB외형관찰이다. 정밀3D키홀·핀·나사운동은미구현,이동거리/타공치수unknown 유지. OVVO이동은예제접합,전체고객가구조립순서·제조승인은별도다.

이번 ASM소유잠금 해제. 제품쪽 실제 FurnitureDesign 연결·route 버튼은 리더에게 요청했으며, 공통/R4진행중 파일/.git/3003서버는변경하지않았다. 배포는 R4-ASM-READY와별도기록한다.
