# LEG-GUIDE-READY — R3-ASM

게시 2026-10-14 08:38 KST / codex-assembly / 실제 세션 `01a13548-3202-7aa2-8a54-0ff6840d3f75`.

**READY 범위: 원본 다리 조립·분리 안내 + 공유 GLB 외형 확인 연결.** 정밀 3D 분리 애니메이션·나사/핀/키홀 형상·이동거리/타공치수는 미확정이다. 이 범위를 전체 고객 주문 조립 완료로 보고하지 않는다.

실제 URL: http://localhost:3003/assembly-guide?topic=legs . 원본 자료가 기본이며 ‘공식 영상 재생’은 화면 안의 실제 YouTube 플레이어를 연다. ‘원본 모델’은 HW와 같은 외형만 확인한다.

## 소스·계약 소비

- [공식 영상](https://www.youtube.com/watch?v=y_6rMHwOIzo), [공식 분리 설명서24쪽](https://tylko.com/EN_Disassembly_low_furniture.pdf), 사례 hardware-leg-mount-002와 사용자 실물4장 확인. 공개 GLB는 공급사 제조 CAD가 아니다.
- 실제 VPN Chrome에서 영상1/2/4/7.7/8.8/9.5/11초를 원본 캡처했다. 영상영역만 CUA screenshot clip으로 저장, 색/부품/픽셀 합성 없음. `/public/assembly-guide/legs/sources.json`에 원본 URL·실제 seek 시간·해시 기록. 사용자 브라우저 UI/계정/다른 탭은 자산에 포함하지 않았다.
- 분리: 중앙 핀 확인 → 누름 → 누른 상태로 판/몸통 함께 슬라이드 → 나사머리와 큰 입구 정렬 후 핀 놓고 분리 → 판재의 나사3개·은색핀 확인.
- 조립: 고정 부품/장착판 확인 → 입구 정렬(영상 관찰) → 체결 위치(세부 슬라이드 순서는 분리 역순 추정) → 중앙 핀 잠금 확인 → 장착 확인. 잠금 단계 및 모든 앞 확인 없이 완료할 수 없다.
- LEG-VISUAL-READY 08:13 소비: `longLegContract`의 asset URL/part role/unknown/scale/height, `createLongLegInstance` 팩토리. 원본 노드135°와 노드 scale 보존, GLB m→장면mm의 ×1000은 소비 부모 한 곳. 접지 원점0, 장착면111.477669mm +Y. 기존 FurnitureLegs는 읽기 전용.
- 모델은 판+몸통 한 rigid 메시. GLB에 없는 나사·핀·키홀을 새로 그리지 않았다. 모든 제조 위치/거리 null을 유지한다. 실제 이동은 영상/원본 단계 장면으로 설명한다. 별도 추정 치수표·CNC export 없음.
- geometry는 useGLTF 캐시 소유, scene.clone은 HW 팩토리, material은 LegScene의 Befun 금속 재질 팩토리 결과이며 소비자 dispose. `dispose=null`로 공유 geometry 보존.
- 최초 LongLeg 마운트에서 GLB200/환경120fps인데 메시0 재현: effect cleanup이 StrictMode 재마운트 전에 instance를 detach. HW 잠금은 미수정. 소비자는 같은 HW 팩토리로 primitive를 연결하고 R3F 자연 언마운트를 사용해 새로고침에서도 표시된다. HW 공용 LongLeg 수정 요청은 team-tasks에 기록했다. GLB 로딩은 Suspense 경계로 분리했다.

## 제출 사례

| 사례 ID | 입력·초기상태 / 조작 | 기대 | 실제 / 판정 | 증거 | 수정 파일 |
|---|---|---|---|---|---|
| R3-ASM-01 | 기존 OVVO P/R·Tylko5·백패널7, 전체/따라/속도390px 회귀 | 기존 안내 보존 | 기존35검사 pass. Tylko5 원본 전체 최종 정지, R 전체/따라·P/R 초기화 확인. 최종 백패널7·P7·Tylko5 전체 재생1000 정지 및 데스크톱 확인 완료 | ../cinematic/README.md, mobile-topic-reset.jpg | AssemblyGuide, GuideScene, guide.module.css, playback/cinematicShot/cameraRig |
| R3-ASM-02 | 다리 원본자료→공식영상 열기·닫기 | 실제 자료와 출처 접근 | **pass**. 모바일 iframe 실제7/15초 재생, 닫으면 안내 정지 유지 | mobile-video.jpg, mobile-source.jpg, public/assembly-guide/legs/sources.json | ReferenceLegGuide, legs.ts |
| R3-ASM-03 | 분리03, 현재단계 seek0/500/1000 | 나사/핀은 판재 고정, plate+rod 함께 이동 | **원본 장면 pass / 정밀3D unknown**. 실제7.687→8.785→9.487초로 누름/일체 슬라이드/큰 입구 정렬.3D 고정부품·거리 생성 안 함 | mobile-slide-0/50/100.jpg, 원본 press/slide/entry.jpg | legs.ts, ReferenceLegGuide; LegScene 외형 확인 |
| R3-ASM-04 | 따라모드, 핀02 또는 잠금04 seek50%, 분리/완료 선택 시도 | 앞 단계 확인·종료 전 진행 불가, 거리unknown | **pass**. 핀 중간 체크false·분리04 disabled, 잠금 중간 체크false·완료05 disabled. 순서대로 분리5단계 확인 완료. 역순추정/미측정 표기 | mobile-pin-gate.jpg, mobile-lock-gate.jpg, mobile-removed.jpg, legs.test.mjs | AssemblyGuide, legs.ts |
| R3-ASM-05 | 390px 2× 재생→일시정지→재생→OVVO 전환, backward seek/조립 전환 | 단계·재생·확인·카메라 정상 초기화 | **pass (390px·desktop)**. 정지값35 유지, OVVO step01/progress0/정지. 다리 분리→조립도01/확인초기화. 전체재생14.4초 마지막 정지 | mobile-topic-reset.jpg, mobile-source.jpg, mobile-model.jpg | AssemblyGuide, playback.ts, cameraRig, LegScene |
| R3-ASM-06 | 같은 원본 GLB·provider 단위/앵커/소유권 대조 | 복제 모델 없음, 단위1회, cache 소유 보존 | **소비자 pass / HW 독립 확인 요청**. actual GLB 정점 투영·높이 검사 통과, 최초 새로고침 원본 메시 표시. 원본/모델6회 왕복 후 메시 유지·콘솔 오류/경고0. HW의 공용 어댑터 독립 수정 확인은 요청 상태 | mobile-model.jpg, source-fingerprint.json, legs.test.mjs | LegScene, longLegContract/Instance 읽기 전용 소비 |

## 검증

- 35/35 `node --no-warnings --test src/lib/assembly-guide/*.test.mjs` 통과(기존30 + 다리5).
- 최신 factory/자막 수정 포함 `npm run lint`: exit0, 기존7경고. 변경 범위 eslint0.
- 최신 소스 격리 `/private/tmp/befun-r3-asm-build-5pucdfzx`의 `npm run build -- --webpack`: exit0, 전체 TypeScript 포함. [fingerprint/시각](source-fingerprint.json). 초기 GLB 로딩/마운트 수정 전 build를 최종 통과로 재사용하지 않았다.
- 공용 개발서버/.next/제품/store/CNC/하드웨어 파일/원본GLB 변경 없음. 허용 범위만 수정.

## 남은 항목 / 잠금

- 정확한 3D 핀·나사·키홀·미측정 이동거리/타공치수/내부 잠금 구조/제품별 전체 연결은 unknown. 원본 자료 안내와 제조 검증을 구분한다.
- HW 담당: R3-HW-05 독립 단위/원점/재질소유 대조 요청. 공용 LongLeg StrictMode lifecycle 검토 요청. 소비자 factory는 동일 계약이다.
- READY 게시 후 독립 회귀·데스크톱·반복 전환 검증을 완료했다. 2026-10-14 08:47 KST ASM 소유 잠금 해제. 정밀3D 이동 및 제조 치수 unknown/HW 독립 확인 요청은 유지한다.

## READY 게시 후 추가 검증 — 08:47 KST

- 데스크톱1728×937 원본 클로즈업, 전체 GLB/장착판 확대. 원본↔모델6회 왕복 후 실제 모델 표시, 콘솔error/warn0. [원본](desktop-source.jpg), [전체 모델](desktop-model.jpg), [6회 후](desktop-model-after-6.jpg).
- 수동 드래그 후 재생으로 자동카메라 복귀 및14.4초 마지막정지. [수동](desktop-manual-camera.jpg), [복귀·최종](desktop-camera-return.jpg).
- 최신 공통 UI로 OVVO P7, 백패널7, Tylko 원본5 전체2× 재생 후 모두 최종 slider1000·정지·다시보기. R8 전체1×/따라모드와 같은 물리 시퀀스 검사도 보존. [P](../cinematic/desktop-P-final.jpg), [백패널](../cinematic/desktop-back-panel.jpg), [Tylko](../cinematic/desktop-Tylko-final.jpg).
- 최종390px 모델 표시·자막 대비·document/scrollWidth390, 관찰120fps. 담당 탭의 emulation override와Network 진단을 해제, 검토용 다리 원본 첫 단계·1×·정지로 복원했다. 전역 viewport/다른 탭 조작 없음.
- review-r3.md 수신. R3-ASM-03 **3D 이동 시연은 미구현**이며 자료 안내/정적 3D와 혼동하지 않는다. 공용 LongLeg lifecycle 교정·HW-05 독립 확인은 HW 소유 확인 대기. 소비자는 같은 공개 팩토리로 초기 로딩 결함을 회피했다.
- 허용된 실제 수정: assembly-guide의 컴포넌트·순수단계/시간/카메라·route, 본인 문서/증거, 신규public/assembly-guide/legs 원본캡처와출처. HW/제품/store/CNC/GLB 원본 수정 없음.
