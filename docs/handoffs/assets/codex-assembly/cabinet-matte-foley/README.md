# 무광 판재·체결음 교정

왼쪽5, 2026-10-14. 사용자 지적: 가구 판재가 너무 반짝이고 체결 효과음이 장난감처럼 들림. 이전 cabinet-polish의 합성음 출력 확인과 시각 설정은 당시 기록으로 보존한다.

본인 안내 `panelMaterials.ts`의 양면 라미네이트를 roughness .38 → .86, specularIntensity .18, envMapIntensity .28, clearcoat0/metalness0의 무광 재질로 바꿨다. 색값, 두 넓은 면 배정, 자작 엣지·MDF 홈, 그림자, 공통 materials.ts/R15 조명은 보존했다. `matte-before.jpg`/`matte-after.jpg`는 동일한 완성 영상 시점의 실제 브라우저 캡처다.

790/1450/2300Hz 등의 사인파 합성 클릭은 제거했다. [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds)(CC0)의 목재·금속 접촉 샘플과 [SmallConfusion Mechanical Plastic Click 09](https://freesound.org/people/SmallConfusion/sounds/751087/)(CC BY4.0)의 짧은 실제 녹음을 사용한다. 도구로 원본 음성 청취는 지원되지 않아 사람의 청취 품질 평가 완료로 보고하지 않는다. 기록된 접촉 샘플/주파수 필터/피크·꼬리/브라우저 출력과 이벤트를 검증했다. 실제 OVVO 또는 Blum 장치의 실측 녹음은 아니다.

원본은 선두 정적 구간 제거, EQ, 짧은 fade, 레벨 조정, 목재/기계 클릭 혼합으로 편집했다. public/assembly-guide/audio/SOURCES.md에 원본·라이선스·편집 내역을 기록하고 화면의 기존 모델 정보에서 출처를 연결했다. 몸통 체결에 중복되던 thud/click 4쌍을 하나의 접촉음으로 정리해 전체21회 출력한다. 준비·스프링·닫힘 소리는 더 낮은 레벨이며 재생 속도에 따라 음원 피치를 올리지 않는다. `foley-preview.wav`는 네 최종 음원을 순서대로 포함한다.

오디오를 미리 받아 사용자 재생 동작에서 decode/resume하고, 버퍼를 재사용한다. 무음 프레임마다 React 상태를 갱신하던 부분을 제거했다. mute/pause/seek/reset/unmount는 source와 gain 노드를 정리한다. 로딩 도중 unmount되어도 뒤늦게 출력하거나 상태를 갱신하지 않는 회귀 검사도 추가했다.

64검사 PASS: 실제 PCM 파일 형식·길이·피크·RMS·앞 무음·끝 0값, 이벤트1회/21회·단일 체결·mute/노드 해제/늦은 로드, 기존 OVVO P/R/Tylko5/백7/원본다리5·재질/카메라 회귀. 변경 lint0, 전체lint 오류0/기존8경고, 독립 production build/TypeScript PASS. Chrome 실제58/58초·8부품 완주/21회 출력, 탐색만 수행하면 count21 유지, error/warn0,120fps 관찰. 390px 레이아웃과 음소거는 추가 확인 결과를 verification.json에 기록한다.

이번4소스/검사와5음원/출처만 독립 게시 사본에 포함한다. 공유 생성기/HW/CNC/저장/재질/조명/.git/.next/3003 및 타 작업자 실행은 수정하지 않았다. 정적 다리 안내와 설명용 힌지의 기존 미확인 기구/제조 승인 범위도 유지한다. Git/운영 READY는 PUBLISH.md에 별도로 기록한다.
