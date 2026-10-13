# Tylko 카테고리 10종 기본 설계 측정 — claude-graphics / 2026-10-13

출처: VPN Chrome(m5)에서 `tylko.com/en-de/configurator-intro?productLine=classic` → 카테고리 선택 → Customize로 열린 실제 컨피규레이터 패널 텍스트를 읽음. 가격은 측정 시점 기준.
모든 카테고리는 `/furniture/<slug>/<id>,j` 형태의 **미리 만든 디자인(프리셋)**을 연다. 아래 "첫 스타일"은 목록 첫 항목이자 선택된 기본값.

## 제품군(컨피규레이터 UI) 분류

| 군 | 패널 특징 | 카테고리 |
|---|---|---|
| A | Style: Slant/Pattern/Grid/Mosaic/Gradient/Pixel, Density, Depth 24/32/40, Feet 없음, "Adjust rows" | Bookcase, Wall storage, Shoe rack |
| B | Style에 **Frame** 포함, Depth 24/32/40/**50**, **Feet: Standard/Plinth**, Density 일부만 | Sideboard, TV stand, Chest of drawers, Bedside table |
| C | Style 없음, **높이 73cm 고정**, Depth 40/50/60, **Storage columns**, **Legroom area**, 뒷판 기본 포함 | Desk, Dressing table |
| D | Style: **Pattern / Standard Grid / Dense Grid**, Depth 40만 활성 | Vinyl storage |

## 카테고리별 기본값

| 카테고리 | URL | 기본 스타일 | Density | W×H×D (cm) | Feet | Back | Finish | 제목(색·구성) |
|---|---|---|---|---|---|---|---|---|
| Sideboards | /furniture/sideboard/4665612,j | Frame | – | 200×63×40 | Standard | Off | Plywood | Black, Doors+Drawers |
| Bookcases | /furniture/bookcase/7197274,j | Slant | 48% | 102×163×32 | – | Off | Plywood | Moss Green |
| Wall storage | /furniture/wall-storage/3690551,j | Pattern | 90% | 120×193×32 | – | Off | Plywood | White, Doors |
| Desks | /furniture/desk/3760569,j | – | – | 102×73(고정)×50, 수납열 1 | – | 기본 포함 | – | Yellow, Doors+Backpanels |
| Dressing tables | /furniture/dressing_table/7389030,j | – | – | 105×73(고정)×40, 수납열 1 | – | On | – | Moss Green, Backpanels |
| TV Stands | /furniture/tv-stand/4665733,j | Frame | – | 140×63×32 | Standard | Off | Plywood | White, Doors+Drawers |
| Chest of Drawers | /furniture/chest-of-drawers/5141667,j | Mosaic | 80% (new) | 140×83×40 | Standard | On | Plywood | White, Backpanels |
| Shoe Racks | /furniture/shoe-rack/3516418,j | Gradient | 72% | 150×53×32 | – | Off | Plywood | White, Doors+Drawers |
| Bedside Tables | /furniture/bedside-table/3533435,j | Frame | – | 78×63×40 | Plinth | Off | Plywood | Grey, Doors+Plinth |
| Vinyl Storage | /furniture/vinyl-storage/3763292,j | Dense Grid | – | 168×83×40 | – | On | – | White, Backpanels |

## Befun 현황 대비
- A군은 현재 Befun 엔진(6 스타일·Density·Depth 24/32/40)과 같은 구조 → 프리셋으로 바로 구현 가능.
- B군: **Frame 스타일, Depth 50, Feet(Standard/Plinth)** 가 Befun에 없음.
- C군: 책상/화장대 전용 생성기(수납열 + 다리 공간) 필요.
- D군: Standard/Dense Grid 스타일 필요.
- 각 프리셋의 정확한 칸·도어·서랍 배치는 디자인 id(`…,j`)의 설계 데이터로 확인해야 함(이 문서는 패널 값만 측정).
