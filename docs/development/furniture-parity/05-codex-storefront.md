# 05 — Codex 쇼핑몰 연결 담당

작업 ID R1-ENTRY. 실제 작업 제목: `befun 메인 tylko로 클론코딩`, ID `01a1341b-6348-7bf0-afc8-9c89fb62522b`. 결과는 [쇼핑몰 연결 인계](../../handoffs/codex-storefront-integration.md)에 기록합니다. 수신/착수는 미확인입니다.

## 역할과 파일

기존 카테고리 선택 → 제품군/검증된 초기 구성 → 실제 컨피규레이터 진입과 상품·저장·공유 화면 연결을 담당합니다. 우측 옵션 패널은 Claude UI, 공통 상태/생성 규칙은 리더의 소유입니다.

- 허용: 기존 `src/components/storefront/**`의 카테고리/상품/저장/공유 진입 관련 파일, 신규 `src/lib/furniture/presets.ts`, 본인 handoff.
- 기존 Next route가 필요하면 실제 경로와 목적을 먼저 team-tasks에 등록합니다. 위 디렉터리 소유권이 storefront 전체 재작성을 뜻하지는 않습니다.
- 읽기 전용: `src/app/configurator/page.tsx`, 공통 types, stores, `src/lib/sharing.ts`, 3D/재질/CNC, Claude UI 담당의 `furniture-panels/**`.
- 기존 결제/가격/브랜드 정책 및 다른 담당 작업은 보존합니다.

## 첫 작업

1. 현재 ConfiguratorIntro, ProductConfigurator, 상품 상세·저장 목록·공유 진입에서 configuration이 전달되는 경로를 조사해 목록화합니다.
2. 11개 카테고리/제품군 선택을 실제 레퍼런스 조사와 대조합니다. 기존13개 선택 항목을 임의 삭제하거나 새 시작 화면을 중복 생성하지 않습니다.
3. 공통 타입 게시 전에는 진입점 조사·데이터 매핑 제안과 독립 preview를 진행합니다. 미구현 카테고리를 임의 선반 preset으로 채우지 않습니다.
4. 리더가 공통 preset/apply/serialize 계약을 게시하면 검증된 preset만 실제 경로에 연결합니다. preset 데이터는 단일 registry에 두고 상품과 intro가 서로 다른 기본값을 갖지 않도록 합니다.
5. 상품 → 컨피규레이터, 저장 목록 → 편집, 공유 URL → 복구를 같은 적용 함수로 연결합니다. 선택한 제품군/옵션/구획/문·서랍 정보가 손실되면 결함으로 보고합니다.

## 완료 기준

같은 preset이 어느 진입점에서도 동일 상태를 만들고, 카테고리 왕복 후 이전 문의/서랍 상태가 섞이지 않아야 합니다. 기존 저장 형식 복구는 리더 함수와 함께 검증합니다. 초기 데이터가 비어 있는 제품은 미지원/준비 상태를 정확히 표시합니다.

직접 가격 공식을 바꾸지 않습니다. 표시·저장·구매 전달값이 같은 구성을 가리키는지 확인하되 실제 주문/결제를 테스트 명목으로 실행하지 않습니다. 변경 파일·검증·미해결 차이·리더 연결 요청을 handoff에 기록합니다.

## 이번 우선 구현 — 상세 갤러리 재질 전환

사용자 첨부 화면의 **왼쪽 세 번째 Codex**에게 배정합니다. 이번 배정 범위의 작업을 재개합니다. [갤러리 관찰·구현 인계](../../tylko-reference/gallery-materials.md)를 먼저 구현한 뒤 위 진입·저장 연결 작업을 이어갑니다. ProductDetails.tsx, 갤러리 전용 신규 컴포넌트/데이터/CSS 및 필요한 product-details.module.css를 단독 수정합니다. 착수 시 실제 파일을 team-tasks에 등록합니다. 리더는 해당 소스를 동시에 수정하지 않습니다. 기존의 별도 광원·카메라 작업까지 일괄 재개하는 지시는 아닙니다.


### 상세 갤러리 직접 구현 — 리더 / 사용자 “어서해라” 지시
- 이전 R1-ENTRY 갤러리 배정을 이 좁은 작업에 한해 리더가 회수. storefront 담당은 해당 파일을 동시에 수정하지 말 것. 그 외 진입/저장 연결 배정 유지.
- 잠금: src/components/storefront/ProductDetails.tsx, 신규 ProductMaterialGallery.tsx, material-gallery.module.css, galleryMaterials.ts. 기존 product-details.module.css는 재사용하고 수정하지 않음.
- 재질12종 선택/8장 교체/확대/반응형 및 브라우저 검증을 리더가 직접 완료한다.


최신 상태: 상세 갤러리 재질 전환은 사용자 후속 지시에 따라 리더가 직접 구현·검증했습니다. ProductMaterialGallery.tsx/galleryMaterials.ts/material-gallery.module.css 및 ProductDetails 연결을 보존하세요. 중복 구현하지 않고 기존 진입/저장 연결 배정을 이어갑니다. 상세 결과는 본인 handoff의 최신 완료 기록을 참고하세요.
