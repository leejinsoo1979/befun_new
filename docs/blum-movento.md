# Blum MOVENTO — Befun 400mm 적용

## 출처와 적용 범위

- 사용자 지정 mmmcraft 저장소: https://github.com/leejinsoo1979/250709in.git
- 원본 커밋: `7ecfd99aabe98e1984d74ffe6056f86f9d296281`.
- 원본 `MoventoDrawerCad.tsx`, `moventoMembers.ts`, `moventoDepth.ts`를 Befun cm 좌표계에 이식. 원본 GLB·DAE·출처는 `public/models/blum/movento/`에 보존했다. 파일 해시는 `manifest.json` 참조.
- 적용 품번: **760H3500S 좌우 + T51.7601 잠금장치**. 원본 350mm 형상을 늘리거나 줄이지 않는다. glTF m→Befun cm 변환은 100배 한 번만 적용한다.

## 400mm 깊이와 선택

외부 가구 깊이와 레일 호칭 길이는 다르다. 가져온 표에서 400mm 레일은 최소 403mm 설치 공간이 필요하므로 외부 깊이400mm에 적용하지 않는다. 350mm 레일은 최소353mm다.

선택 계산은 서랍 앞판 뒤쪽 좌표에서 뒤쪽 장애물 기준을 뺀 깊이를 사용한다. 현재 참조형400mm 구성은 384−20=364mm로350mm가 선택된다. 뒤쪽 기준20mm는 판 두께를 이용한 보수적 기준이며 모든 보강대·백패널 변형의 정밀 간섭 검증을 뜻하지 않는다. 깊이320/240mm에는 이350mm 자산을 축소하여 넣지 않는다.

## 개폐와 모델 구성

고정 레일은 캐비닛에 남고, 서랍 레일·잠금장치는 실제 서랍 위치를 따라간다. 가운데 레일은 이동량의 절반을 따른다. 참조형 서랍 인출거리는350mm 이내로 제한한다.

긴 레일 몸통은 원본 프로젝트의 DXF 단면 재구성이고 앞 브래킷·잠금 부품은 공급사 CAD 기반이다. 가운데 부재의 반속도 운동은 근사이며 실제 내부 동기화·댐퍼 기구 전체를 재현한 것은 아니다.

## 검증

- PASS: `node --test scripts/blum-cad/movento.test.mjs` 3개. 길이 경계, Type01/02 깊이400 선택, 원본 GLB 해시와 실제 장면 단위/깊이 범위.
- PASS: 변경 TS/TSX ESLint. 전체 `npm run lint` 오류0/경고7.
- PASS: 격리 복사본 `/private/tmp/befun-movento-build-asd6ltcn`에서 `next build --webpack` 및 TypeScript. 최초 폰트 네트워크 제한 실패 후 네트워크 허용 재실행 통과. 공유 `.next` 수정 없음.
- PASS: 실제 Chrome `localhost:3003/furniture/sideboard-terra`, Grid110×63×40cm, Solid, 백패널ON, 맨아래 서랍Max. 열림·닫힘, 아래 보기+반투명에서 좌우 레일·잠금장치 표시, 콘솔error0 확인.
- 캡처: [열림](handoffs/assets/codex-qa/movento/open.png), [하부](handoffs/assets/codex-qa/movento/underside.png), [닫힘](handoffs/assets/codex-qa/movento/closed.png). 코드 해시: `handoffs/assets/codex-qa/movento/fingerprint.json`.
- React 검토: 비동기 로더 정리 시 완료 콜백 무시, Promise/원본 geometry 공유 캐시, 인스턴스 Object3D 분리 및 `dispose={null}` 유지. 전역 캐시는 선택한350mm/잠금장치 자산 범위로 제한된다.

## 미확인 / 후속

이번 변경은 3D 하드웨어 표시 연결이다. 기존 목재 서랍상자와 CNC 가공 데이터는 변경하지 않았다. 원본 표준 상자 길이 NL−10 및 판 두께 조건과 Befun 기존 상자의 차이, 측판 간격·노칭·나사·잠금장치 타공 위치는 제조 검증이 남아 있다. `manufacturingReady:false`는 표시 메타데이터이며 제조 출력 게이트를 새로 구현한 것은 아니다. 이를 제조 승인으로 사용하지 않는다.

다른 깊이용 레일, 모든 폭·높이·스타일의 간섭, 조립/분해 시퀀스는 미확인이다. 경첩은 별도 작업이며 mmmcraft의71B7550D를 Befun71B3790 인셋용으로 바꿔치기하지 않았다.
