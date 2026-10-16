# 확대 화면 그림자 계단 현상 보정

담당: codex-menu-ui / 2026-10-16. 사용자 캡처의 `/legacy-configurator?product=9285749`에서 손잡이 아래 반복되는 톱니 모양을 재현했다.

원인과 변경:

- 설치된 React Three Fiber는 Canvas의 `shadows=true`를 `PCFSoftShadowMap`으로 설정한다. 설치된 Three의 `WebGLProgram.generateShadowMapTypeDefine`은 PCF/VSM만 구분하고 나머지를 Basic으로 처리한다. 일반 선반, 책상·옷장, 원본 상품 편집기의 Canvas3곳에 `shadows="percentage"`를 명시해 지원되는 PCF 필터를 선택했다. node_modules 자체는 변경하지 않았다.
- 공통 ReferenceStudio의 그림자 맵은 데스크톱2048→4096, 뷰어 폭650px 이하에서는2048을 유지한다. GPU의 최대 텍스처 크기로 제한하며 해상도 전환 시 조명을 재생성해 이전 그림자 렌더 타깃을 정리한다.
- 그림자 카메라의 불필요한 아래 범위 -400cm를 가구 폭에 따른 `-max(100,width×0.3)`으로 줄였다. 90cm 가구의 수직 투영 범위는635→335cm로 줄어 작은 손잡이에 더 많은 텍셀이 배정된다. PCF 반경4→1.5로 샘플이 넓게 흩어지는 현상을 줄였다.
- 조명 위치/강도/그림자 강도, 재질·색상·가구 형상, AO 후처리와 카메라 동작은 보존했다.

브라우저 검증(Chrome localhost:3003):

- 화장대9285749의 확대·회전·패닝으로 손잡이/패널 아래 그림자 확인. 기존 큰 톱니가 사라지고 경계가 부드러워졌다. 극단적인 확대에서 모든 픽셀 흔적이 제거됐다고 인증하는 것은 아니다.
- 기본 시점으로 복귀해 인물·바닥 그림자 범위와 가구 표시 확인. 90×73×50cm, 표시 견적₩1,867,008 유지.
- 모바일390×844 전환/데스크톱 복귀에서 정상 렌더, 콘솔 오류0. 뷰포트 임시 설정은 복원했다.
- `/reference-product/desk-1` 및 `/configurator` 공통 소비자 실제 3D·인물·바닥 그림자 표시 확인, 콘솔 오류0.

검증: 전체 `npm run lint` 오류0/기존13경고, 수정4파일 scoped ESLint PASS. 격리 `/private/tmp/befun-thumbnail-build-rgy9dqyb`의 `npm run build -- --webpack` compile/TypeScript/정적26페이지 PASS. 변경이 화면 조정에 한정되어 새 단위 테스트는 추가하지 않았다. 공유3003·.next/기존 실행을 보존했다. 사용자 커밋·푸시 요청에 따라 최신 원격 main 기반의 독립 사본에서 게시 변경을 검증했다.

게시 검증: 원격 `61babaa` 기반 독립 사본 `/private/tmp/befun-shadow-publish-20261016`에서 전체 lint 오류0/기존13경고, `prisma generate` 후 webpack production build·TypeScript·정적26페이지 모두 PASS. 변경4파일은 브라우저 검증한 공유 소스와 바이트 단위로 일치한다. 이번 커밋은 위 그림자 보정과 검증 문서만 포함한다.
