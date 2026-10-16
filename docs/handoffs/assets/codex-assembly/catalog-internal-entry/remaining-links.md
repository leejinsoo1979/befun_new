# 상품 외부 링크 제거 후속 — 2026-10-15

사용자의 “그대로 Tylko로 넘어간다 / 원본디자인보기가 왜 있나” 후속 수신. 이전 all/15 교정 외에 legacy SourceProductPage, Smooth 상세, accessories fallback의 외부 CTA가 남아 있었다. SourceProductPage의 원본 제품 버튼과 액세서리 원본 컬렉션 버튼을 내부 Link로 교체했다. 공유 Smooth 상세는 작업 직전 재독에서 다른 담당이 /sofa-configurator?model=smooth로 교정한 것을 확인했으며 그 수정은 덮어쓰지 않았다.

사진과 같은 초기 구성이 미확정인 항목은 새 디자인 또는 내부 목록으로 연결한다. 기존 편집 가능 상품 초기값·카드/사진/source identity는 보존. SourceProductPage의 일반 가구는 /configurator, desk·dressing_table은 /furniture-design/desk-classic, wardrobe는 /furniture-design/wardrobe-edge, sofa는 내부 소파 목록으로 안내한다. 액세서리는 내부 가구 목록으로 연결.

## 로컬 검증
- 실제 all/15 탭: Befun 새 디자인 만들기 → /configurator, 본문 외부 링크0.
- dressing_table-1 실제 클릭 → desk-classic, 3D·옵션 정상 표시.
- shoerack-1 390px 실제 클릭 → /configurator, 가로 넘침0.
- smooth-khaki 실제 클릭 → /sofa-configurator?model=smooth, Smooth 편집기 정상 표시(다른 담당 수정 보존).
- scoped ESLint/diffcheck PASS, 전체 공유 lint0오류/기존8경고. React 검증 스킬로 의미 있는 내부 링크·동일 탭 이동·기존 hook/부수효과 무변경 확인.

## 독립 게시 사본
원격완료702cd9d fast-forward 보존. SourceProductPage 함수와 CatalogPages 외부 CTA2분기만 변경. stable all/15에는 외부 source 분기가 이미 없으므로 미게시 DownloadedCatalog initializer를 복사하지 않음. stable에는 아직 소파 편집기 route가 없으므로 Smooth 상세는 /furniture-c/sofas 내부 목록으로 연결. 공유의 새 Smooth 편집기 버튼은 보존하고, 미완료 소파 모델/카탈로그 initializer/source 이미지 데이터/공통 생성기/다른 담당 WIP는 게시 제외.

webpack production·TypeScript23페이지PASS, 기존 catalog 회귀10/10PASS, 게시 사본의 최초 일반 lint는 기존 .vercel/output 생성물209오류로 실패했다. 생성물만 CLI ignore-pattern으로 제외한 전체 source lint 재검사는0오류/기존8경고PASS, scopedlint·diffcheckPASS(공유 eslint 설정은 수정하지 않음). 격리3029 실클릭: legacy 상세→desk-classic, Smooth→내부 소파 목록, 390px all/15→configurator. 게시2파일과 build 사본 hash 일치. 공유.git/.next/3003와 기존 실행은 변경하지 않음.

Git/운영 READY는 아래 후속 상태로 구분한다. 이 기록은 앞선 README의 SourceProductPage 대상외 범위를 갱신한다.
