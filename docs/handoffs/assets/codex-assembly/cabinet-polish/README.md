# 캐비넷 그림자·체결음·도어 장착 교정

왼쪽5 / codex-assembly, 기존 세션 유지. 사용자 요청: 거친 그림자, 체결 효과음 부재, 닫힌 도어 판재를 통째로 밀어 붙이던 장착 동작을 수정.

캐비넷 경로 `/assembly-guide/cabinet`의 안내 소스만 수정했다. 공통 가구 생성기/CNC 결과/하드웨어 원본/공용 재질/리더 R15 조명/공유 .git/.next/3003은 수정하지 않았다. 독립 게시 사본은 `/private/tmp/befun-assembly-publish-20261014`.

## 동작과 근거

- 열린 도어를 받치고 접근 → 경첩 앞부분 걸기 → 위 경첩 뒤 눌림 → 아래 경첩 뒤 눌림 → 잠금 후 개폐 확인. 기존 부품의 실제 힌지쪽·컵·플레이트 좌표로 클로즈업하며 앞 걸림/뒤 눌림 위치의 작은 설명 표식을 사용한다. 운반 중 미체결 경첩이 몸통에 붙어 따라 늘어나는 동작을 제거했다.
- [Blum 공식 장착 페이지](https://www.blum.com/us/en/products/hingesystems/clip-top-blumotion/assembly/), 그 페이지의 [MD-029/3, 11.24, p.6](https://www.blum.com/file/me164570_md_dok_bau?country=us&language=en)의 1→2 도식을 직접 렌더해 확인했다. [CLIP mounting plate installation/removal p.2](https://www.blum.com/file/cme226128_ma_dok_bus?country=us&language=en)의 실제 사진도 대조했다. 위→아래 순차 잠금과 카메라 시간 배분은 이해를 위한 시연 순서이며 제조사 지정 작업시간이 아니다.
- 기존 공유 `BlumCup` / `BlumPlate`, 공통 `71B3790` / `174H7100E` 계획을 소비한다. 새로운 정밀 하드웨어를 창작하지 않았다. 공유 모델의 컵·플레이트·링크는 설명용 형상이며 정확한 CLIP 래치 내부와 실제 다관절 운동은 미검증이다. 90° 장착 자세, 접근 여유, 뒤 눌림 확대 변위는 표시용이고 가공/주문 출력에 추가하지 않았다.
- 자체 생성한 짧은 판재 접촉음, 플라스틱 커넥터 클릭, 스프링 다보 클릭, 금속 경첩 클릭을 접촉 시점에 출력한다. 녹음한 실물 소리가 아니다. 음소거 가능, 사용자 재생 버튼으로 오디오를 활성화하며 탐색/초기화/일시정지는 노드를 정지한다. 재생 속도에 맞춰 이벤트가 한 번씩 발생한다. `sound-preview.wav`는 같은 합성 PCM 네 종류를 순서대로 담은 검토 파일이다.
- r182의 기본 PCF는 화면 픽셀마다 회전하는 5개 샘플 패턴을 사용한다. 본인 Canvas에서만 고정 VSM 2회 블러, 4096 그림자 맵, 16 블러 샘플, 레이아웃 기준 고정 범위, 2x DPR을 사용한다. 초기 VSM 바닥 자기 그림자 보정도 실제 화면에서 확인했다. 공통 ShaderChunk나 다른 뷰어 설정은 변경하지 않았다. [LightShadow 공식 문서](https://threejs.org/docs/pages/LightShadow.html)의 mapSize/blurSamples/bias를 대조했다.

## 검증

63개 검사 PASS: 기존 OVVO P/R·Tylko5·백패널7·다리5·재질/자원 해제 회귀 포함, 도어 4단계 순서·잠금 독립·프레임/탐색 동치·카메라 연속성·효과음 PCM/단일 이벤트/오디오 노드 종료 추가. 전체 lint 오류0/기존 경고8, 변경 범위 lint0, 독립 production build/TypeScript PASS.

Chrome 데스크톱과 390×844 확인. 실제 전체58.2초/8부품 완주, 25회 오디오 출력, 오디오 realtime context running/48kHz/stereo destination와 종료된 소스 노드 확인. 탐색만 수행할 때 count25 유지, 음소거 후 경첩부터 재생해 완료해도 count25 유지. 물리 스피커의 사용자가 설정한 음량까지 계측한 결과는 아니다. 정지·탐색·모드 변경·초기화·직접8부품 조립과 기존 OVVO R4/P7·Tylko5·백패널7·원본 다리5 주제 전환은 생산 사본에서 PASS. 범위 console error/warn0. 투명24회 전환 후 첫 shader 준비 뒤 geometry143/texture16/program14로 안정, 누적 증가 없음. 초기 self-shadow가 생긴 VSM 시도는 수정 전 중간 상태였으며 최종 캡처에는 없다.

`shadow-before.jpg`/`shadow-after.jpg`: 같은 완성 모습의 전후. `door-hook.jpg`, `door-top-clip.jpg`, `door-bottom-clip.jpg`, `door-check.jpg`: 접근/분리 잠금/체결 후 개폐. `mobile.jpg`: 390px, 문서폭390/스크롤폭390. `source-fingerprint.json`으로 게시 소스와 비교한다. 캡처는 실제 브라우저이며 이미지 재생성 없음.

제조 승인 false 유지. Tylko 클립/다리/백패널 별도 원본 안내와 혼용하지 않는다. 정적 다리 GLB/원본 영상 안내는 여전히 정밀 기구 시뮬레이션 완료가 아니다. 배포 SHA/READY는 별도로 기록한다.
