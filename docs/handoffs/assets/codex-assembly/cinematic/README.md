# Befun 조립 연출 수정 — R3 선행 마무리

2026-10-14 08:20 KST / codex-assembly / 세션 01a13548-3202-7aa2-8a54-0ff6840d3f75.

실제 URL: http://localhost:3003/assembly-guide?topic=connector . 기존 R2.1 접합 모델과 원본 자료는 보존했다.

## 구현·실제 화면

- 실제 [Vectary Roof](https://app.vectary.com/p/3KgOF6DnX1gdg9PNp8Bee9)의 전체→체결부 이동, 적은 조작, 중립 배경·재질을 관찰했다. [기존 Befun 상품](http://localhost:3003/furniture/sideboard-terra)의 공식 SVG 로고·Helvetica Neue/Arial/한국어 폰트, 검정 pill 버튼, 흰색 UI를 적용했다. Vectary 자산은 복제하지 않았다.
- 아이보리·큰 사이드바 제거, 전체 화면 중심 모델·작은 보기 메뉴·하단 단계/시간축. Befun 스튜디오 Lightformer 배치와 공유 도장 재질 팩토리 사용. 얇은 방향 화살표.
- 전체 보기: 자동 다음 단계, R22초/P18.8초/Tylko15.4초(1×). 따라 조립: 단계 종료에서 정지, 확인 후 다음 단계. 0.5/1/1.5/2×. 긴 프레임에서도 실제 경과시간을 소비하여 저FPS가 재생시간을 늘리지 않는다.
- 카메라 650ms 이동 후 실제 움직이는 부품 추적. 전체 위치·확대·반대편·정면/측면/단면, 수동 회전·재생 시 자동 복귀.
- R 슬라이드 내부 절개와 실제 HW 메시 stencil 캡. [Three.js 공식 clipping stencil 예제](https://threejs.org/examples/webgl_clipping_stencil.html)의 마스크 방식으로 기존 메시 절단면만 닫는다. HW 정점/치수 변경 없음, 새 하우징 모델 생성 없음. 내부 언더컷/CAD/탄성은 여전히 미확정이다.
- HDR 적용 시 브라우저의 흰 캔버스 현상을 관찰했고 현재는 Befun Lightformer 환경에서 정상 렌더를 확인했다. 확정되지 않은 원인은 단정하지 않는다.

## 검증

- 최신 절개 캡/ref 수정 포함 `npm run lint`: exit0, 기존 경고7. 소비 `GuidePlayback.continuous/reference` 선언 일치.
- `node --no-warnings --test src/lib/assembly-guide/*.test.mjs`: 30/30. 기존24 + 프레임시간/seek4 + 실제 메시 카메라 투영2.
- 08:14 이후 최신 소스 복사한 `/private/tmp/befun-assembly-cinematic-check`에서 `npm run build -- --webpack`: exit0, 전체 TypeScript 통과. [소스 해시/시각](source-fingerprint.json). 첫 자기경로 복사 실패 후 실행된 이전 스냅샷 build는 최종 증거로 사용하지 않았다. 후속 올바른 절대경로 복사본의 통과만 기록했다.
- Chrome 담당 탭: R 전체22초 마지막 단계 자동 정지, 따라 조립 중간50%→끝→확인→다음 단계, P/R 및 topic 초기화. Tylko 원본 전체5단계 재생·최종 정지. 390×844에서 document/scrollWidth390, 원본 자료·단계·버튼 접근 정상. 마지막 절개 화면도 실제 캡처.
- 개발용 캔버스 telemetry 약120fps는 이 Mac/Chrome 한 장비에서 관찰한 값이며 전체 기기 성능 보장이 아니다.
- 원본 데이터/공용 서버/.next/스토어/제품/CNC 변경 없음. 그림자·재질·카메라/시간/브랜드 UI만 이 담당 범위에서 수정.

## 증거

- [참조 Vectary](reference-vectary.jpg), [참조 Befun](reference-befun.jpg)
- [데스크톱 진입](desktop-joint.jpg), [데스크톱 슬라이드 절개](desktop-slide.jpg)
- [390px 슬라이드 절개](mobile-slide.jpg), [390px 원본 자료](mobile-source.jpg)

캡처는 실제 CUA 브라우저의 JPEG 바이트이며 생성 이미지가 아니다. 이전 전후 비교는 ../r2/ASM-01-07.md 그대로 유지한다. 공급사 CAD/미확정 조립거리·전체 주문 조립/가청 한국어 출력/MP4는 이번 연출 완료 범위가 아니다.
