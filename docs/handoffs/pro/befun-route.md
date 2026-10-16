# Befun Pro 경로 브랜딩 교정 · 2026-10-16

사용자 지적: BEFUN 페이지 주소에 `/tylko-pro`가 남아 있었다. 새 대표 주소는 `/befun-pro`, 브라우저 제목은 `Befun Pro | BEFUN`이다.

- 새 전용 route에서 기존 Pro 화면과 번역 metadata·스타일을 그대로 사용한다.
- 데스크톱 메뉴, 모바일 메뉴와 footer의 Pro 링크를 모두 `/befun-pro`로 변경한다. navigation 제목 key도 새 경로로 이동한다.
- `/tylko-pro`는 308 영구 리다이렉트로 `/befun-pro`에 연결하며 query의 단일값·복수값을 보존한다.
- `/tylko-pro/apply`와 `/befun-pro/apply`는 새 페이지의 문의 영역 `/befun-pro#pro-apply`에 연결한다.
- catch-all의 구 Pro 렌더 분기는 제거한다. 기존 화면의 프로젝트·이미지·문의 동작과 사실인 참고 자료 출처, 다른 담당 번역 변경은 유지한다.

## 검증

- Chrome에서 구 주소에 단일·복수 query를 넣어 접속: 새 `/befun-pro`로 이동하고 query 전부 보존.
- 새 페이지 브라우저 제목 `Befun Pro | BEFUN` 확인. 데스크톱 메뉴·펼친 메뉴의 모바일 링크·footer의 Pro 링크 3개 모두 `/befun-pro`, 구 경로 내부 링크 0개 확인.
- HTTP 검사: `/tylko-pro?...` 308 및 새 Location 확인. 구·신규 `/apply`도 모두 308 `/befun-pro#pro-apply` 확인. 브라우저 자동화의 구 apply 해시 이동은 ERR_ABORTED가 발생하여 서버 응답과 새 페이지 직접 진입으로 검증함.
- scoped ESLint PASS. 전체 lint 오류 0 / 기존 경고 13.
- 격리 webpack production build·TypeScript·경로 생성 PASS: `/private/tmp/befun-pro-brand-build.log`. `/befun-pro`와 구 주소 리다이렉트 route 모두 생성 확인. 공유 개발 서버·`.next` 보존.

이 변경에 대한 커밋·푸시는 수행하지 않았다.
