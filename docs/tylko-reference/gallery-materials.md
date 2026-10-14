# 상세 갤러리 재질 전환 — 구현 인계

담당: 쇼핑몰 연결 Codex(사용자 화면 왼쪽 세 번째). 리더는 이번 관찰 자료를 제공하며 갤러리 소스를 병행 수정하지 않습니다.

## 확인한 사실

- 출처: https://tylko.com/de-de/mobel/regalsystem/7197227,j — 사용자 기존 VPN Chrome 탭을 조작했습니다.
- [사례 gallery-materials-001](cases/gallery-materials-001.json)에 실제 선택한 12개 스와치와 각각 사진 8장 URL을 기록했습니다. 쿠키/토큰은 포함하지 않습니다.
- 스와치 순서: 화이트, 모스 그린, 그레이, 블랙, 핑크, 옐로, 블루, 캐시미어 베이지, 클레이 브라운, 라이트 오크, 오크, 월넛. 원본 라벨은 JSON에 보존합니다.
- 스와치는 상세 갤러리에만 적용됩니다. 상단 편집 중인 가구 옵션은 유지됩니다. 갤러리 선택을 재질 store에 쓰지 않습니다.
- 데스크톱 우측 정렬, 관찰한 label32×32px/아이콘24×24px, 갤러리와40px 간격. 선택은 어두운 바깥 원형 테두리와 아이콘 사이 여백으로 표시합니다.
- 사진은 위쪽 큰 사진1+우측2장, 아래 작은4장+큰1장의 8장 구성입니다. 사용자 파랑/노랑 캡처와 전체 페이지 캡처가 배치 근거입니다.

## 구현 범위

1. ProductDetails.tsx의 기존 갤러리에 독립 로컬 재질 상태와 스와치 UI를 추가합니다. 새 갤러리 컴포넌트·데이터·CSS 분리를 권장합니다.
2. 스와치를 선택하면 사진8장과 확대 보기 이미지가 선택 재질에 대응해야 합니다. 이미지 전체 CSS 색조 필터로 방·소품 색을 바꾸지 않습니다.
3. 라디오 그룹, 한국어 접근성 이름, 선택 상태와 키보드 focus를 제공합니다. 모바일에서는 아이콘을 가로 스크롤하고 페이지 전체 overflow를 만들지 않습니다. 모바일 대응은 아직 원본 관찰이 아닌 구현 요구입니다.
4. 이미지 로딩·오류 때 배치를 유지합니다. 실패한 사진을 다른 재질 사진으로 조용히 대체하지 않습니다. StorefrontUI.ReferenceImage는 source 변경 시 failed 상태가 남는 구조이므로 key/reset 또는 별도 이미지 컴포넌트를 검토합니다.
5. 현재 기본 /configurator 갤러리는 wallstorage/original-classic/01p-grey입니다. productGalleries에는 다른 제품군 사진도 있으므로 그곳에 wallstorage 세트를 일괄 덮어쓰지 않습니다. 다른 제품군은 추가 관찰 전 기존 갤러리를 보존합니다.
6. 가격·구매·Befun 브랜드·상단 3D 구성은 변경하지 않습니다. 페이지 전체를 새로 구현하는 범위가 아닙니다.

## 검증 및 인계

- 12개 선택지의 선택 상태, 8개 이미지 URL 대응, 로딩 성공/실패 구분, 파랑→노랑→파랑 복귀, 확대/닫기, 상단 옵션 유지 확인.
- 데스크톱/모바일 캡처, 키보드 전환, 불필요한 전체 이미지 선로딩 여부 확인.
- 변경 lint/타입/build와 브라우저 결과를 기록하며 다른 작업자의 dev 서버·빌드 디렉터리를 방해하지 않습니다.
- 결과는 docs/handoffs/codex-storefront-integration.md, 차이는 differences.md에 남깁니다. 현재는 관찰·작업 배정 상태이며 기능 구현 완료가 아닙니다.


### 상세 갤러리 재질 전환 직접 구현 완료 — 리더 / 2026-10-13
- 사용자 후속 “어서해라”에 따라 리더가 직접 구현. ProductDetails.tsx 연결, 신규 ProductMaterialGallery.tsx/material-gallery.module.css/galleryMaterials.ts. 기존 product-details.module.css·store·3D·가격 코드는 수정하지 않음.
- 기본 컨피규레이터 Original Classic 갤러리: 12종 스와치 우측 정렬, 선택 원형 테두리, 재질별8장 교체, 해당 사진 확대, 키보드 라디오 전환, 모바일 가로 스크롤. 로딩/오류 상태와 이미지별 상태 재설정. 다른 제품군의 기존 사진 배열은 유지.
- Chrome localhost3003: 12종 각각8장 URL 대응 확인. 블루/옐로8장 실제 로딩 성공, 옐로 확대 소스/닫기/스크롤 복원, 방향키 전환, 상단slider 값 전후 동일. 모바일390px에서 페이지폭390/아이콘영역358/스크롤폭436 확인. 스크린샷3장·cases/gallery-materials-001-befun.json 저장.
- 검증: 변경 파일 ESLint 통과; 전체lint 오류0/기존 영역 경고9; 독립 스냅샷 /private/tmp/befun-gallery-check-tr42mp9j에서 npm run build -- --webpack 및 TypeScript 통과. 공유 개발 서버 재시작 없음.
- 제한: 모든96개 이미지의 개별 다운로드 완료/모든 제품군별 재질 이미지/원본 모바일 픽셀 동치는 미검증. 별도상품 탭은 조립모드 중 갤러리가 없어 조작하지 않음. 외부이미지 CDN 의존은 기존 구조와 동일.
- 이번 갤러리 소스 잠금 해제. storefront 담당은 이 구현을 보존하고 나머지 진입/저장 연결 작업을 이어갈 것. 앞의 갤러리 구현대기 지시는 이 완료 기록으로 대체.


### 2026-10-14 원본 사진 로컬 제공 — 리더
- 사용자 교정: 신규 3D 상세 갤러리 대신 실제 Tylko 원본 이미지를 사용. 잘못 추가한 LiveDesignGallery/LiveDesignViews는 제거했고 이번 갤러리 작업의 Shelf 변경은 원복했다. 기존 상판 이음선 수정은 보존했다.
- `public/imgs/tylko-gallery/`: 선반 wallstorage와 sideboard/cplus 각각 Classic 12종·Modern 17종 × 사진8장 = 총464장, 원본 SVG 아이콘29개. 493개 파일의 존재/크기/SHA-256 기록. 이미지 가공·색조 필터 없음. 인증정보/쿠키/토큰/응답 헤더 저장 없음.
- 갤러리는 상단 현재 색상에 대응하는 로컬 사진 세트를 선택한다. 갤러리 아이콘은 사진만 전환하며, 이후 상단 색상을 바꾸면 해당 색상으로 다시 맞춘다. 선택 테두리/8장 배열/확대 보기/키보드 라디오/모바일 가로 스크롤 유지.
- 소스: `galleryClassicMaterials.json`, `galleryModernMaterials.json`, `gallerySideboardPhotos.json`, `galleryMaterials.ts`, `ProductMaterialGallery.tsx`, `ProductDetails.tsx`. 외부 CDN 의존 제거 범위는 위 두 갤러리 제품군이다. 다른 제품군 기존 사진은 보존했다.
- 실제 Chrome3003 확인: 사이드보드 Solid Midnight Blue 사진8장 로드, 하단 Butter Yellow 전환·확대, 상단 Classic C_Blue 변경 시 사진과 선택상태 자동 전환. /configurator Classic Blue/Yellow 원본8장 표시. 모바일390px에서 페이지폭390px·갤러리 모든 img 동일 origin 확인. 추가3D갤러리 없음(canvas1개).
- 자료: `cases/gallery-materials-004-local.json`, `screenshots/gallery-004-*.png`. 58개 사진 세트 모두8장이고 AVIF 파일 헤더 확인. 브라우저로 모든464장을 개별 시각 검수했다고 주장하지 않는다.
- 검증: 변경파일 ESLint 오류0, 전체lint 오류0/기존경고7. 격리 webpack 컴파일 성공. 전체 TypeScript/build는 타 담당 수정 중인 `AssemblyGuide.tsx:47`의 `GuidePlayback.continuous/reference` 타입 누락으로 실패. 갤러리 파일의 TypeScript 오류는 없었음. 공유 .next/서버 재시작 없음.
- 남음: bookcase/chest/tvstand/Edge/Tone 제품군 원본 로컬화·색상 대응, 미대응 Befun 색상(N_Beech 및 일부Mix), 스타일별 별도 촬영 세트 존재 여부. 고정된 원본 사진을 임의 사용자 칸배치와 동일한 렌더라고 표시하지 않는다. 구조/스타일 변경에 따른 정확한 사진 일치는 완료로 처리하지 않는다.
