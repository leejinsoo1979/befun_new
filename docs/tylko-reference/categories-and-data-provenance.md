# 카테고리 10종: API 범위·데이터 출처·분담 답변

작성: codex-analysis, 2026-10-13. claude-graphics의 착수 전 질문에 대한 답변입니다. **확인한 Bookcase 범위를 10종 전체에 일반화하지 않습니다.** 이번 변경은 문서만이며 기존 생성기를 제거하거나 구현 목표를 변경하지 않았습니다.

## 1. 확인된 API 범위

실제 응답 확보 및 생성 결과 비교에 사용한 조합은 다음 하나입니다.

`/api/v1/furniture_dna/?shelf_type=1&collection_type=Bookcase&dna_version=6`

- 확인한 collection_type 값 목록: `Bookcase`.
- `shelf_type=1`은 조사한 페이지의 Type02/Farbe 데이터와 연결됩니다. Befun의 Solid 경로에 연결했습니다.
- Type01 재질 팔레트/분기 일부는 확인했으나 Type01 전체 생성 DNA는 확보하지 못했습니다. 공개 응답 접근 실패를 데이터 부재로 해석하지 않습니다.
- Classic·Tone·Edge 같은 판매 제품군 명칭과 모든 shelf_type 정수의 대응은 확정하지 않았습니다. 카테고리와 제품군도 서로 다른 축입니다.

| 요청 카테고리 | Befun 기존 slug / 제안 category ID | 확인한 collection_type | 확인한 shelf_type |
|---|---|---|---|
| Sideboards | sideboard | 미확인 | 미확인 |
| Bookcases | bookcase | Bookcase | 1, 조사한 Type02/Farbe 구성에 한함 |
| Wall storage | wallstorage | 미확인 | 미확인 |
| Desks | desk | 미확인 | 미확인 |
| Dressing tables | dressing_table | 미확인 | 미확인 |
| TV Stands | tv-stand | 미확인 | 미확인 |
| Chest of Drawers | chest-of-drawers | 미확인 | 미확인 |
| Shoe Racks | shoerack | 미확인 | 미확인 |
| Bedside Tables | bedside_table | 미확인 | 미확인 |
| Vinyl Storage | vinyl_storage | 미확인 | 미확인 |

위 slug는 현재 Befun storefront의 식별자이며 Tylko API enum이라는 뜻이 아닙니다. 다른 카테고리가 Bookcase DNA를 공유할 수도 있고 별도 데이터/후처리를 쓸 수도 있으나 아직 판정할 근거가 없습니다. Desks/Dressing tables의 하부 빈 공간이 같은 DNA의 조건부 판재인지 별도 생성기인지도 미확인입니다. 단순히 아래 행 몇 개를 지우는 방식으로 구현하지 않습니다.

현재 `ConfiguratorIntro.tsx`에는 13개 선택 항목이 이미 있으며, 10종 외 wallunits/wardrobe/sofas도 포함되어 있습니다. 그중 여러 항목은 프리셋이 비어 카탈로그로 이동합니다. 이 UI 존재는 카테고리별 생성기 구현 완료를 뜻하지 않습니다. 기존 화면을 중복 생성하거나 다른 항목을 임의 삭제하지 않습니다.

## 2. 실제 데이터 사용 방식 — fixture 전용이 아님

현재 서비스 생성기는 DNA/공개 번들에서 읽은 수치와 구조 규칙을 사용합니다.

| 제품 코드 데이터 | 출처와 사용 |
|---|---|
| styles/pattern-rules.json | grasshopper12의 수치 설계표497항목을 정규화, pattern.ts가 직접 import |
| styles/pattern-motion.json | Pattern motion 보정표, 실제 생성 경로에서 사용 |
| styles/mosaic-rules.json | PORTO 셀/행 템플릿·분할/부분뒷판 수치, mosaic.ts가 직접 import |
| reference-grid-slant-grid-rules.json | mesh2169 setup 수치, Grid 생성기가 직접 import |
| reference-grid-slant-slant-rules.json | grasshopper10 수치 규칙, Slant 생성기가 직접 import |
| styles/reference-pixel-gradient-data.json | Pixel/Gradient 템플릿·비율 데이터, 공통 생성기가 직접 import |

`reference-*.ts`와 스타일 함수는 공개 디코더를 읽고 규칙을 해석해 작성한 TypeScript입니다. 번들 전체나 원본 함수를 그대로 실행하는 래퍼를 배포한 것은 아니지만, **독자 관찰만으로 만든 clean-room 구현도 아닙니다.** 수치·경계·알고리즘은 원본 자료에서 유래합니다. 함수 이름/언어/JSON 형식을 바꾸는 것만으로 출처가 사라지지 않습니다. 별도의 `scripts/tylko-*` fixture는 출력 비교용이며 위 런타임 수치표와 구분합니다.

`src`의 TS/TSX/JS 검색과 생성 경로 검사에서 런타임 `furniture_dna` API 호출은 발견하지 않았습니다. 생성은 프로젝트에 포함된 데이터로 로컬 수행합니다. 다만 storefront에는 `media.tylko.com` 이미지 참조 등이 있으므로 “Tylko로의 런타임 외부 요청이 전혀 없다”는 뜻은 아닙니다. 전체 이미지·폰트·콘텐츠 권리 감사는 이번 범위에서 수행하지 않았습니다.

## 3. 이용 조건과 권리 확인 상태

이전 구현 단계에서 DNA의 상업적 재사용을 허용하는 라이선스나 계약을 확인하지 않았고, 허용된다는 법률 판단도 없습니다. 공개 접근 가능성과 재사용 허가는 별개입니다.

이번 질의로 공식 [독일 약관 목차](https://tylko.com/de-de/terms/)를 확인했습니다. 독일 IP 절 직접 조회는 실패했고, 공식 [독일어 벨기에판 IP 절](https://tylko.com/de-be/terms/geistiges-eigentum) 6.1–6.2에는 제품·서비스의 권리 귀속 및 동의 없는 복제/이용 제한이 명시되어 있습니다. 다른 지역판 조항을 독일판과 동일하다고 확정하지 않습니다. API 전용 라이선스는 확인하지 못했습니다. `https://tylko.com/robots.txt`는 조회 도구에서 실패하여 내용 미확인입니다. robots의 허용 여부를 저작권/상업 재사용 허가로 간주하지 않습니다.

권고: 상업 서비스의 기본 경로로는 **관찰 결과를 요구사항/비교 근거로 기록하고 Befun의 제조 제약에 따른 자체 설계 규칙을 작성하는 방식**을 권합니다. 정확한 DNA 수치표의 동등 재현을 계속 상업적으로 제공하려면 사용 허가·라이선스 확보 및 적용 관할의 전문 검토를 권합니다. 어느 방식도 여기서 법적 안전을 보증할 수 없으며, 외형을 독립 코드로 재현하는 경우에도 디자인권 등 별도 쟁점이 남을 수 있습니다.

이는 구현 경로에 대한 권고입니다. 사용자 목표를 임의 변경하거나 현재 파일을 삭제하는 결정을 내린 것은 아닙니다. 기존 코드 출처를 fixture-only/완전 독자 구현으로 설명해서는 안 됩니다. 현재 코드를 별도 검토 없이 10종 DNA로 확대해도 권리 문제가 해결된다고 주장하지 않습니다.

## 4. 분담과 공통 계약 v1 — 구현 전 문서 계약

분담 자체는 동의합니다. claude-graphics는 기존 선택 화면과 카테고리별 프리셋 UI/데이터 구조, 리더는 대응 조사·생성 규칙·공통 상태/저장/CNC 통합을 맡습니다. 수치 미확인 프리셋은 null이며 “레퍼런스와 동일”로 표시하지 않습니다.

기존 storefront slug를 유지합니다. 새 파일 `src/types/furniture.ts`의 소유자는 리더이며 아래 계약으로 작성할 예정입니다(이번 답변에서는 소스 타입을 아직 추가하지 않았습니다).

```ts
type FurnitureCategory =
  | 'sideboard' | 'bookcase' | 'wallstorage' | 'desk'
  | 'dressing_table' | 'tv-stand' | 'chest-of-drawers'
  | 'shoerack' | 'bedside_table' | 'vinyl_storage';

type FurniturePresetStatus = 'unverified' | 'observed' | 'validated';
interface FurniturePreset {
  id: string;
  version: number;
  category: FurnitureCategory;
  label: string; // Befun UI 한국어 표시명
  status: FurniturePresetStatus;
  config: DesignConfig | null; // 기존 lib/sharing의 전체 입력 계약
  evidenceCaseIds: string[];
}
interface CategorySelectionProps {
  value: FurnitureCategory | null;
  onSelect: (category: FurnitureCategory) => void;
}
interface PresetSelectionProps {
  presets: FurniturePreset[];
  onApply: (presetId: string) => void;
}
```

- 리더가 `DesignConfig`와 `ShelfConfig`에 호환 필드 `furnitureCategory?: FurnitureCategory`, `presetId?: string`, `presetVersion?: number`를 추가합니다. 구 저장 데이터의 category 누락은 기존 선반 동작으로 복구하되 실제로 Bookcase였다고 단정해 덮어쓰지 않습니다.
- `category`는 용도, `style`은 배치, `colorCategory`는 마감입니다. Classic/Tone 등의 UI 이름에서 shelf_type을 직접 추정하지 않습니다. 제품군 식별은 실제 대응이 확인된 뒤 별도 계약으로 추가합니다.
- 전체 `DesignConfig`에 width/depth/style/density/rowHeights/numRows/back/color 및 행별 하드웨어가 포함되어야 합니다. 일부 기본값만 바꾸면서 이전 문의 상태가 남는 프리셋 적용을 금지합니다.
- `onSelect`는 선택 화면 상태만 바꿉니다. `onApply`에서 리더의 단일 적용 함수가 프리셋 유효성 검사 후 shelf/material/hardware를 함께 교체하고 열린 문/서랍·행 선택·조립 상태를 정리합니다. 계산 중 일부 상태가 먼저 노출되지 않도록 통합 시 검증합니다.
- 기존 선반 `DesignConfig`는 책상 다리/무릎 공간/벽걸이 체결을 표현하지 못합니다. 해당 카테고리의 config는 규칙과 구조 계약 확보 전 null로 둡니다. 서랍장 등의 초기값도 관찰 전 임의로 채우지 않습니다.
- API collection_type/shelf_type/dna_version와 출처는 연구 문서의 대응표에 보관합니다. Befun 사용자 저장 모델에 Tylko API enum을 필수 필드로 넣지 않습니다.
- 리더 수정 범위: types/furniture.ts, types/shelf.ts, lib/sharing.ts, stores와 생성기 dispatch/CNC의 통합 부분. claude-graphics는 이 공통 파일을 직접 수정하지 않습니다.
- claude-graphics 수정 범위: 기존 ConfiguratorIntro의 카테고리/프리셋 화면, 신규 lib/furniture/presets.ts 및 카테고리 UI. storefront 담당이 현재 소유 중인지 team-tasks에서 먼저 조율하고 담당자를 한 명으로 정합니다. 기존 storefront/마감 팔레트/가격 정책을 덮어쓰지 않습니다.
- 완료 기준: 열 가지 UI 구분, 검증된 카테고리만 올바른 생성기로 연결, 같은 프리셋 재적용/카테고리 왕복/새로고침/공유복구/문서랍초기화 검증. 프리셋 화면 완성과 카테고리 생성기 완성을 별도 보고합니다.
