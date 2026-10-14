# 카테고리 10종: API 범위·데이터 출처·분담 답변

작성: codex-analysis, 2026-10-13. claude-graphics의 착수 전 질문에 대한 답변입니다. **확인한 Bookcase 범위를 10종 전체에 일반화하지 않습니다.** 이번 변경은 문서만이며 기존 생성기를 제거하거나 구현 목표를 변경하지 않았습니다.

> **2026-10-13 후속 전수 조사:** 아래 1절은 조사 전 답변으로 보존합니다. 최신 결과는 [카테고리 32개 초기 구성 대응표](category-inventory.md)와 본문 마지막의 후속 조사입니다. 현재 10개 카테고리·32개 모델 링크, 7개 collection을 관찰했고 활성 preset 응답은 26개 확보했습니다.

## 1. 확인된 API 범위 — 이전 기록

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

## 5. 후속 전수 조사 — 2026-10-13

기존 VPN Chrome의 독일어 intro에서 요청한 10개 카테고리의 실제 모델 링크 32개를 전부 열고 초기 옵션 UI를 기록했습니다. 각 카테고리의 `cases/category-<slug>-001.json`에 모델별 URL, 시각, slider 범위, 공개 preset의 개별 편집 상태, 관찰 요청, 측정하지 않은 값(null)을 보관합니다. 숫자는 원문을 보존하며 화면 cm와 내부 mm를 동일 좌표로 단정하지 않습니다.

| 카테고리 | Original Classic / Modern의 collection | Edge | Tone |
|---|---|---|---|
| Sideboards | Sideboard | Sideboard | Sideboard |
| Bookcases | Bookcase | Bookcase | Bookcase |
| Wall storage | Bookcase | Wallstorage | Wallstorage |
| Desks | Desk | 이번 intro 링크 없음 | 이번 intro 링크 없음 |
| Dressing tables | Desk | 이번 intro 링크 없음 | 이번 intro 링크 없음 |
| TV Stands | Sideboard | TvStand | Sideboard |
| Chest of Drawers | Sideboard | Chest | Sideboard |
| Shoe Racks | Bookcase | Sideboard | 이번 intro 링크 없음 |
| Bedside Tables | Sideboard | Sideboard | Sideboard |
| Vinyl Storage | VinylStorage, 모델 단계 없이 직접 진입 | 이번 intro 링크 없음 | 이번 intro 링크 없음 |

이 표는 관찰한 초기 제품의 collection입니다. 일부 Modern은 DNA 요청으로만 확인했고 활성 preset이 없는 6개는 상세 표에서 unknown으로 남겼습니다. 동일 category의 모든 상품을 동일 collection으로 일반화하지 않습니다. 실제 관찰 collection은 Bookcase, Sideboard, Desk, VinylStorage, Chest, TvStand, Wallstorage입니다. 소스의 ShoeRack enum은 이번 신발장 초기 제품에서 사용되지 않았습니다.

제품군/type 대응:
- 확보한 Original Classic 활성 preset은0, Modern은1입니다. Veneer2는 별도 마감 분기이며 선취득 요청만으로 현재 선택 상태를 판정하지 않습니다.
- 이번 Edge 7개 활성 preset은 모두4. 함께 요청한5는 veneer 계열이며 활성 타입과 구분합니다.
- Tone 낮은 수납은6/7/8 요청을 사용합니다. 초기 Sideboard는8(다리형), TV/Chest/Bedside는6(Minimalistisch)입니다.7의 벽걸이 렌더 경로는 소스로 확인했으나 이번 초기 preset 중 활성7 사례는 없습니다.
- Tone 책장과 벽수납은14입니다. Tone을 구형 enum3 또는6/7/8 하나로 묶으면 안 됩니다.
- Type01 Bookcase 응답도 이번에 확보했습니다. 기존 '미확보' 상태는 해소했으나 Type01 생성기 구현·동치 검증 완료라는 뜻은 아닙니다.

중요한 UI/구조 차이:
- Original 행 구성에서 현재 보인 스타일 버튼은 Pattern/Grid/Mosaic/Gradient/Pixel 5개입니다. 구형 Slant enum과 현재 선택 UI를 구분합니다. 열 구성은 Frame을 포함한6개, Vinyl은 Pattern/Standard Grid/Dense Grid 3개입니다.
- Desk와 Dressing table은 Desk 전용 열 구조입니다. UI 높이73cm 고정, 폭90–240cm, 깊이40/50/60cm, 수납 구획 수·다리 공간 위치를 사용합니다. 기존 책장의 아래 행 삭제로 구현하지 않습니다.
- Vinyl 초기 구성은 깊이40cm,24/32 비활성, 뒷판 Mit이며 Ohne 비활성, 밀도 UI 없음. 이 초기 상태의 제약과 소스의 rowAlwaysOn을 구분해 기록했습니다.
- Edge 깊이는 카테고리별27/36/45/60의 부분집합입니다. Tone 낮은 수납은36/46/56, Tone14는27–65cm slider입니다.45와46을 합치지 않습니다.
- Tone14는 Original Bookcase와 다른 생성 경로·상태 구조입니다. 같은 collection 이름만으로 기존 스타일 함수를 연결하지 않습니다.

조사 범위와 한계:
- 32종 모두 초기 옵션 DOM을 확인했고, 활성 preset 응답26종을 확보했습니다. 나머지6종의 추가 요청 확인 도중 Chrome 연결 변경과 로딩 정지를 관찰했습니다. 이미 확보한 자료는 보존했습니다.
- screenshot32개 중18개는 렌더된 개요,14개는 로딩 preview입니다. 각 JSON에 상태를 명시했으며 로딩 이미지를 구조/시각 비교 근거로 사용하지 않습니다.
- 자동 기록 중 이전 페이지의 요청이 혼입된 Modern Wallstorage 사례를 검출·격리하고 실제 URL과 preset ID로 재확인했습니다. 최종 활성값1/Bookcase입니다. 일부 초기 요청 누락은 이벤트 버퍼 truncation이 원인이며 캐시라고 확정하지 않습니다.
- 카테고리별 생성 공식, 모든 범위 경계, 문·서랍 개별 편집, 변경 순서, 재질·카메라 및 Befun 동치 검증은 후속 작업입니다. 이번에는 제품 코드를 수정하지 않았습니다.

## 6. 구현 분담 보완 — 사용자 후속 질문 반영

리더가 레퍼런스 규칙·공통 상태·생성기·통합을 소유하고, 확인한 규격을 공유 문서로 전달해 독립 작업을 분담합니다. 여러 작업자가 각자 추정한 생성 공식을 동시에 넣지 않습니다.

- 리더: category와 제품군/생성기 식별을 분리하는 공통 계약, 판재 분절, 다리 좌표·수량·종류, 문/서랍 좌표 및 CNC 데이터 일관성.
- claude-graphics: 확정된 규격을 입력받는 다리·손잡이 등의 외형/재질, 기존 카테고리 선택/프리셋 UI. 생성/배치 공식 변경은 리더에게 문서 요청.
- 보조 작업자: 구조 비교 도구와 독립 검증, assigned 파일만 수정. 담당 이름과 잠금은 team-tasks가 기준.
- 다리 사양은 유형, 관찰 제품/옵션, 외형 치수·정밀도, 몸체 기준 좌표, 발 개수 변화 경계, 판재 분절/하단 세로판과의 관계, 체결부 미확인 항목, 비교 사례를 포함해야 합니다. 현재 이 정밀 사양은 미완료입니다.
- 중간 조절발을 전체 폭의 등간격으로 가정하지 않습니다. 하단 세로판·가로판 분절과의 관계를 레퍼런스로 검증한 뒤 반영합니다. 화면에서 숨겨진 연결부를 추측으로 확정하지 않습니다.
- 공통 계약v1의 DesignConfig만으로 Desk/Edge/Tone을 표현할 수 없습니다. `category`와 별도 Befun 제품군/생성 구조를 먼저 설계하고 미구현 프리셋 config는 null을 유지합니다. Tylko 내부 enum을 서비스 영구 식별자로 강제하지 않습니다.
- 순서: 공통 상태 계약 → 한 카테고리/제품군 구현 → 보류 사례로 구조/시각 재검증 → 다음 계열 확대. UI 프리셋 완성과 생성기 완성을 별도 보고합니다.
