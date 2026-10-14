# 사용자 우드 재질 추가

2026-10-14, codex-storefront. 사용자 제공 51539.rar와51537.rar의 재질을 기존 내추럴 목록에 추가했다.

- 51539: 우드 W4 (다크), `N_Wood_W4`. 51537: 우드 W2 (브라운), `N_Wood_W2`. 원본 이름에 없는 수종을 임의로 지정하지 않았다. 기존 Beech/Oak/Walnut은 유지.
- 컬러맵 최대2048px·WebP88, OpenGL normal 최대1024px·losslessWebP, gloss는반전하여roughness최대1024px·WebP90, 견본96px. 종횡비·나뭇결은유지하고 원본RAR/.max/.fbx는웹에복사하지않음.
- 실제원본맵 47,389,645bytes→웹맵/견본 1,140,882bytes, 97.59%감소. 각맵디코딩·크기·SHA 및원본파일출처는 assets.json. 원본RAR 총용량과압축전재질맵용량은서로다른비교값이다.
- 신규 natural-materials loader가 base sRGB/normal·roughness NoColorSpace를구분한다. 맵3종만로드하고5표면은각자texture클론소유. 완료/실패시 원본loadertexture해제, 기존disposeMaterialSet으로소유클론정리. normalScale0.4로과한요철을줄이며원본GL방향유지.
- graphics 잠금 materials.ts는수정하지않음. 새우드키만전용loader, 나머지는기존factory사용. Shelf의material호출만연결하며기하/카메라/가격공식/설계저장형식은유지. CNC preview도같은loader와견본정보소비. 실제생산재질/SKU/새가격계수는발명하지않음.
- Chrome3003 내추럴탭새2재질/견본·다크/브라운나뭇결시각확인, W2→CNC25판재/동일3D재질/2D대표색확인. 영문라벨확인, 한국어/영어/일본어라벨등록. W4 공유미리보기의키/선택새로고침복원확인.
- 검사16PASS(새재질3+기존상품/사진13), scoped ESLint0 및 diffcheck PASS. 현재통합src격리 webpack production build/TypeScript24페이지PASS. 전체lint는타소파작업의basis_transcoder.js require2오류/기존경고로실패; 소유파일미수정, 담당요청게시.
- 단위검사의로컬JSON/legacy URL키왕복과실제브라우저공유페이지복원을구분. 현/configurator는state query를소비하지않아실제복원은공식/design-preview 경로로검사. 이기존route동작을이번재질추가에서변경하지않음. 실제DB/주문/장바구니/파일내보내기검사아님.
- 재현: 두RAR의 Map/Diffuse·Gloss·NormalGL만개별폴더51539/51537로추출한뒤 `node scripts/natural-materials/optimize.mjs <추출폴더>`; `node --test scripts/natural-materials/materials.test.mjs`.
- 로컬적용완료,이번수정커밋/운영게시미수행. 소유파일잠금해제·공유3003/.next유지.

## 2026-10-15 게시 검증

최신 origin/main 3f5c1c9의 독립 사본에서 Natural W4/W2·클래식/단색 그린·보기 외부클릭 완료영역만 추출했습니다. 가격/소파/아바타/카메라/다른 담당 WIP 제외. 완료된 우드 가로결 회전 및 W4 linear gain3.5를 재질 의존 변경으로 포함하고, materials.ts map 회전 보존 +=2행만 반영했습니다. 전체 lint 오류0/기존경고8, webpack production build·TypeScript23페이지 PASS, 재질/상품/사진 회귀16/16 및 그린 재질/책상 복원 계약 PASS. 운영 배포 READY 확인과 구분됩니다.

게시 직전 원격 8c50bc6(조립바·옷장 Space·Natural 재질 연결/자산)이 선행되어 재기반했습니다. 동일 Natural 자산/loader/회전은 선행 커밋을 그대로 소비하며 재추가하지 않습니다. 포맷/라벨 계산만 겹친 네 파일 병합, 앞선 완료 변경 유지. 최종 본인 커밋은 그린·보기 외부클릭·재질 검사/인계가 중심입니다.
