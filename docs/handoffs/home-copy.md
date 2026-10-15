# 홈페이지 문구 정리 — 2026-10-15

사용자 지시에 따라 한국어 화면의 어색한 슬로건을 짧은 영문으로 바꾸고, 설명·버튼·안내는 구체적인 한국어로 다듬었습니다. 최근 사용자가 지정한 Hero 3줄과 CTA는 유지합니다.

`src/lib/i18n/messages.ts`의 한국어 표시 사전에서 72개 문구를 교정했습니다. 기존 원문 키는 EN/JA 사전 및 다른 컴포넌트와 공유하므로 그대로 두고 한국어 표시값만 바꿨습니다. 같은 키를 사용하는 공통 가입 영역·푸터·보조 카드에도 적용됩니다.

| 위치 | 변경 예시 |
| --- | --- |
| 브랜드 영상 | Make room for you. |
| 컬렉션 | Pick a colour. Make it yours. |
| 디자인 안내 | Design it. Make it yours. |
| 커뮤니티 | Real homes. Real ideas. |
| 가입 영역 | Your designs, all in one place. |
| 푸터 | Designed by you. Made for your space. |
| 단계 안내 | 직접 디자인하기 / 수납 구성 고르기 / 디자인 확인하기 / 저장하고 공유하기 |
| 로그인 안내 | 로그인하고 저장한 디자인과 주문 내역을 확인하세요. |

추가로 색상·소재 설명, 쇼룸 안내, 저널·공간 사례의 추상적인 제목을 자연스럽게 정리했습니다. 기능, 목적지 링크, 제품명, 가격과 회사 정보는 바꾸지 않았습니다.

검증: Chrome localhost3003 메인 전체 섹션 표시/안내 카드·가입·푸터 실화면 확인, h2 가로 넘침0. 합성 이메일(copy-check@example.com)로 계속하기 클릭 시 기존 /login?email=... 이동 확인(로그인·계정 생성은 실행하지 않음). EN/JA 사전 객체 동등 확인, scoped ESLint/diffcheck 통과, 전체 lint0오류/8기존경고, 공유src 격리 webpack production build/TypeScript25페이지 통과. 실제 화면 확인은 데스크톱이며 지역/전역 뷰포트 설정은 변경하지 않았습니다.

이번 홈페이지 완료분 게시에 포함합니다. 원격 기존 기능을 보존하고 한국어 표시 사전, 메인 검정 버튼, 사용자 확인 Hero 문구 완료분, 원본 소파 표지를 반영합니다. 대기 중인 신규 쇼핑 UI/렌더러/초기값 전체 확장은 포함하지 않습니다.

게시 사본 검증: origin/main 0d1baa1 기준으로 기존 외부상품CTA 제거/책상 수정/가격·소품 완료본을 보존했습니다. 전체 lint0오류8기존경고·기존catalog회귀10/10·production webpack build/TypeScript23페이지 통과. 독립31842서버 Chrome에서 사용자 Hero3줄·검정CTA rgb(30,30,30)/configurator-intro·KO새문구·Uff/Smooth 원본2사진로딩 및2.923비율 확인. 신규 소파renderer·원본preset 전체연결·카테고리UI확장은 이번 게시 범위가 아니므로 원격 기존내부경로를 유지했습니다.
