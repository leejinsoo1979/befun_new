# Tylko 카테고리×모델 초기 구성 조사

검토 시각: 2026-10-13T11:56:32.481Z
입력 스냅샷: 38 product records; SHA256 f9bd50fb68800c9e8e982bfcaa20725f9da8f8c28407a1dbf00fcd5fe952e14f
intro: 10개 카테고리 / 32개 모델 링크. 리더 수집 파일은 계속 갱신되므로 이 문서는 해당 스냅샷 기준입니다. 독립 검토자는 프로젝트와 브라우저를 수정하지 않았고, 리더가 최종 자료를 통합했습니다. 근거는 cases/category-<slug>-001.json에 보존했습니다.

## 판정 규칙

- **활성 타입**은 응답 preset.shelf_type만 확정값으로 씁니다. DNA 요청에는 선취득(prefetch) 타입이 포함될 수 있으므로 요청이 하나라도 활성으로 승격하지 않습니다.
- **활성 collection**은 preset.configurator_params.additional_parameters.collection_type의 원문 대소문자를 보존합니다. 요청에서만 관찰된 collection은 별도 열에 남깁니다.
- unknown은 자료 미확보입니다. 제품 미지원 또는 옵션 없음이라는 뜻이 아닙니다.
- intro에서 선택하지 못한 모델은 '이번 intro에 링크 없음'입니다. 전 사이트 판매 여부를 부정하지 않습니다.
- UI 옵션은 관찰 시점·설정에서 보인 목록입니다. 선택 상태, disabled 및 조건부 노출은 별도로 기록하며 전 설정에 일반화하지 않습니다.

## 데이터 정합성 점검

- 모든 보유 preset.id가 해당 레코드 제품URL ID와 일치합니다.

## 모델별 매핑

| 카테고리 | intro 모델 / 제품 | 활성 shelf_type | 활성 collection / configurator | 요청된 type/collection (HTTP) | UI 묶음 | 근거 record index |
|---|---|---|---|---|---|---|
| sideboard | [Original Classic / 4665612,j](https://tylko.com/de-de/mobel/sideboard/4665612,j) | 0 | Sideboard / jetty; configurator_type=2 | 0/Sideboard(200), 2/Sideboard(200) | C | 10 |
| sideboard | [Original Modern / 3516437,j](https://tylko.com/de-de/mobel/sideboard/3516437,j) | unknown | unknown / unknown | 1/Sideboard(200) | C | 2 |
| sideboard | [Edge / 1430061,w](https://tylko.com/de-de/mobel/sideboard/1430061,w) | 4 | Sideboard / watty; configurator_type=3 | 5/Sideboard(200), 4/Sideboard(200) | E | 11 |
| sideboard | [Tone / 907980,w](https://tylko.com/de-de/configure/907980,w) | 8 | Sideboard / watty; configurator_type=3 | 7/Sideboard(200), 6/Sideboard(200), 8/Sideboard(200) | T678 | 12 |
| desk | [Original Classic / 3760569,j](https://tylko.com/de-de/mobel/schreibtisch/3760569,j) | 0 | Desk / jetty; configurator_type=2 | 0/Desk(200) | D | 14 |
| desk | [Original Modern / 3854739,j](https://tylko.com/de-de/mobel/schreibtisch/3854739,j) | 1 | Desk / jetty; configurator_type=2 | 1/Desk(200) | D | 0 |
| dressing_table | [Original Classic / 7389030,j](https://tylko.com/de-de/mobel/schminktisch/7389030,j) | 0 | Desk / jetty; configurator_type=2 | 0/Desk(200) | D | 15 |
| dressing_table | [Original Modern / 7388995,j](https://tylko.com/de-de/mobel/schminktisch/7388995,j) | 1 | Desk / jetty; configurator_type=2 | 1/Desk(200) | D | 1 |
| bookcase | [Original Classic / 7197274,j](https://tylko.com/de-de/mobel/bucherregal/7197274,j) | 0 | Bookcase / jetty; configurator_type=1 | 0/Bookcase(200) | R | 27 |
| bookcase | [Original Modern / 486320,j](https://tylko.com/de-de/mobel/bucherregal/486320,j) | unknown | unknown / unknown | 1/Bookcase(200) | R | 8 |
| bookcase | [Edge / 539982,w](https://tylko.com/de-de/mobel/bucherregal/539982,w) | 4 | Bookcase / watty; configurator_type=3 | 4/Bookcase(200), 5/Bookcase(200) | E | 20 |
| bookcase | [Tone / 1948627,w](https://tylko.com/de-de/configure/1948627,w) | 14 | Bookcase / watty; configurator_type=3 | 14/Bookcase(200) | T14 | 31 |
| wallstorage | [Original Classic / 3690551,j](https://tylko.com/de-de/mobel/regalsystem/3690551,j) | 0 | Bookcase / jetty; configurator_type=1 | 0/Bookcase(200) | R | 26 |
| wallstorage | [Original Modern / 1596673,j](https://tylko.com/de-de/mobel/regalsystem/1596673,j) | 1 | Bookcase / jetty; configurator_type=1 | 1/Bookcase(200) | R | 7, 13 |
| wallstorage | [Edge / 519975,w](https://tylko.com/de-de/mobel/regalsystem/519975,w) | 4 | Wallstorage / watty; configurator_type=3 | 5/Wallstorage(200), 4/Wallstorage(200) | E | 21, 37 |
| wallstorage | [Tone / 1964452,w](https://tylko.com/de-de/configure/1964452,w) | 14 | Wallstorage / watty; configurator_type=3 | 14/Wallstorage(200) | T14 | 32, 33 |
| tv-stand | [Original Classic / 4665733,j](https://tylko.com/de-de/mobel/fernsehtisch/4665733,j) | 0 | Sideboard / jetty; configurator_type=2 | 0/Sideboard(200) | C | 22 |
| tv-stand | [Original Modern / 4665821,j](https://tylko.com/de-de/mobel/fernsehtisch/4665821,j) | unknown | unknown / unknown | 1/Sideboard(200) | C | 3 |
| tv-stand | [Edge / 1614814,w](https://tylko.com/de-de/mobel/fernsehtisch/1614814,w) | 4 | TvStand / watty; configurator_type=3 | 4/TvStand(200), 5/TvStand(200) | E | 16, 34, 35 |
| tv-stand | [Tone / 657770,w](https://tylko.com/de-de/configure/657770,w) | 6 | Sideboard / watty; configurator_type=3 | 6/Sideboard(200), 8/Sideboard(200), 7/Sideboard(200) | T678 | 28 |
| chest-of-drawers | [Original Classic / 5141667,j](https://tylko.com/de-de/mobel/kommode/5141667,j) | 0 | Sideboard / jetty; configurator_type=2 | 0/Sideboard(200) | C | 23 |
| chest-of-drawers | [Original Modern / 5142251,j](https://tylko.com/de-de/mobel/kommode/5142251,j) | unknown | unknown / unknown | 1/Sideboard(200) | C | 4 |
| chest-of-drawers | [Edge / 520406,w](https://tylko.com/de-de/mobel/kommode/520406,w) | 4 | Chest / watty; configurator_type=3 | 4/Chest(200), 5/Chest(200) | E | 17 |
| chest-of-drawers | [Tone / 658504,w](https://tylko.com/de-de/configure/658504,w) | 6 | Sideboard / watty; configurator_type=3 | 7/Sideboard(200), 6/Sideboard(200), 8/Sideboard(200) | T678 | 29 |
| shoerack | [Original Classic / 3516418,j](https://tylko.com/de-de/mobel/schuhregal/3516418,j) | 0 | Bookcase / jetty; configurator_type=1 | 0/Bookcase(200) | R | 24 |
| shoerack | [Original Modern / 3516416,j](https://tylko.com/de-de/mobel/schuhregal/3516416,j) | unknown | unknown / unknown | 1/Bookcase(200) | R | 5 |
| shoerack | [Edge / 1614538,w](https://tylko.com/de-de/mobel/schuhregal/1614538,w) | 4 | Sideboard / watty; configurator_type=3 | 4/Sideboard(200), 5/Sideboard(200) | E | 18, 36 |
| bedside_table | [Original Classic / 3533435,j](https://tylko.com/de-de/mobel/nachttisch/3533435,j) | 0 | Sideboard / jetty; configurator_type=2 | 0/Sideboard(200) | C | 25 |
| bedside_table | [Original Modern / 3763450,j](https://tylko.com/de-de/mobel/nachttisch/3763450,j) | unknown | unknown / unknown | 1/Sideboard(200) | C | 6 |
| bedside_table | [Edge / 1614717,w](https://tylko.com/de-de/mobel/nachttisch/1614717,w) | 4 | Sideboard / watty; configurator_type=3 | 5/Sideboard(200), 4/Sideboard(200) | E | 19 |
| bedside_table | [Tone / 657092,w](https://tylko.com/de-de/configure/657092,w) | 6 | Sideboard / watty; configurator_type=3 | 7/Sideboard(200), 6/Sideboard(200), 8/Sideboard(200) | T678 | 30 |
| vinyl_storage | [직접 구성 링크 / 3763292,j](https://tylko.com/de-de/mobel/schallplattenregal/3763292,j) | 0 | Bookcase / jetty; configurator_type=1 | 0/VinylStorage(200) | V | 9 |

## 화면 옵션 요약

- **R — Original 행 구성** (bookcase, wallstorage, shoerack): Pattern/Grid/Mosaic/Gradient/Pixel 5개 버튼, 밀도 0–100%, 폭, 행 인덱스 기반 높이, 깊이24/32/40cm, 뒷판, Finish Farbe/Multiplexplatte/Furnier, 색. 관찰된 높이 slider aria min0/max9는 높이 cm 범위가 아니라 인덱스이며 실제 높이는 행 조합에 의존합니다. Frame과 Slant 버튼은 해당 스냅샷에서 관찰되지 않았습니다.
- **C — Original 열 구성** (sideboard, tv-stand, chest-of-drawers, bedside_table): Pattern/Grid/Gradient/Mosaic/Frame/Pixel 6개 버튼(현재 선택/정렬에 따라 순서 변화), 폭·높이·깊이24/32/40/50cm, Basis, 뒷판, Finish와 색. 밀도는 chest의 Mosaic 스냅샷에서 보이며 모든 스타일에 공통 노출되지 않습니다. TV Modern은 Abschnitte도 보였습니다. Classic Basis에는 Füße와 Sockel, Modern에는 Füße와 Beine가 관찰됩니다(아래 개별 기록을 우선).
- **D — Original 책상·화장대**: 폭, 높이73cm 고정 안내, 깊이40/50/60cm, 수납 구획수, 다리 공간 위치 slider, 뒷판, 색. 두 카테고리의 안내 문구만 바뀌며 활성 Classic preset은 모두 Desk/mesh2498입니다. 높이 slider나 밀도 slider는 이 UI에서 보이지 않습니다. 뒤판은 수납·다리공간 상태 때문에 설명문만 노출될 수 있습니다.
- **V — 레코드 수납**: 모델 선택 단계 없이 직접 구성 링크. Pattern/Standard Grid/Dense Grid, 폭·행 높이·깊이·뒷판·색. 스냅샷에서24/32cm 버튼 disabled,40cm 가능; 밀도 없음. 이 비활성 상태를 모든 디자인의 영구 규칙으로 단정하지 않습니다.
- **E — Edge**: Aussehen/Ausstattung 탭, 폭·높이·깊이·Spalten, Oberseite mit Kanten, Finish(Farbe/Multiplexplatte/Holzoptik), 색. 책장 깊이27/36/45cm, 벽수납27/36/45/60cm, 낮은 수납군36/45/60cm가 각각 관찰됩니다. 폭이 좁은 제품에는 구획 추가 최소156cm 안내; 신발장173cm 스냅샷에는3구획과 증가 disabled가 보입니다. Ausstattung 내부 항목은 이 수집만으로 모두 확인되지 않았습니다.
- **T678 — Tone 낮은 수납군**: Stil/Größe/Farbe/Layout/Übersicht 단계, Minimalistisch/Hanging/Mit Beinen 3종, 폭·높이 slider+숫자입력, 깊이36/46/56cm radio, 외부·내부색, 구획수. 서랍밀도 Hoch/Niedriges는 sideboard에서 관찰되며 TV 스냅샷에서는 없음. 저층 Tone preset으로 type6와 Minimalistisch가 직접 대응하고 sideboard type8/Mit Beinen은 enum-notes의 별도 리더 관찰 근거이며 현재 products에 preset이 없으면 표에서는 unknown으로 남깁니다. type7↔Hanging은 소스·UI 후보이지만 현재 선택된 preset 직접 사례가 필요합니다.
- **T14 — Tone 책장·벽수납**: Größe/Farbe/Spalten/Griffart/Übersicht 단계이며 위 T678의 3종 Stil 단계가 없습니다. 폭·높이·깊이 slider+숫자입력, Standard/Premium-Matt 마감, 색, 구획수, Griffe/Drucksystem(문에 적용) 옵션. 두 제품 모두 preset type14, skin=plane; 책장 Bookcase, 벽수납 Wallstorage로 분리됩니다.

## 개별 UI 수치 (관찰 설정 기준, cm)

| 카테고리 / 모델 | 표시 slider 값 (aria min..max) | depth 버튼/radio |
|---|---|---|
| sideboard / Original Classic | 200cm [30.0..450.0; value=200.0]; 63cm [33.0..123.0; value=63.0] | button "24cm"; button "32cm"; button "40cm"; button "50cm" |
| sideboard / Original Modern | 116cm [30.0..450.0; value=116.0]; 73cm [43.0..133.0; value=73.0] | button "24cm"; button "32cm"; button "40cm"; button "50cm" |
| sideboard / Edge | 94cm [40.0..600.0; value=94.0]; 108cm [48.0..158.0; value=108.0] | button "36cm"; button "45cm"; button "60cm" |
| sideboard / Tone | 80 [40.0..240.0; value=80.0]; 52cm [32.0..132.0; value=52.0] | radio "36cm" [checked]:; radio "46cm":; radio "56cm": |
| desk / Original Classic | 102cm [90.0..240.0; value=102.0]; (표시 없음) [34.0..68.0; value=68.0] | button "40cm"; button "50cm"; button "60cm" |
| desk / Original Modern | unknown | button "40cm"; button "50cm"; button "60cm" |
| dressing_table / Original Classic | 105cm [90.0..240.0; value=105.0]; (표시 없음) [34.0..68.0; value=34.0] | button "40cm"; button "50cm"; button "60cm" |
| dressing_table / Original Modern | unknown | button "40cm"; button "50cm"; button "60cm" |
| bookcase / Original Classic | 48% [0.0..100.0; value=48.0]; 102cm [30.0..450.0; value=102.0]; 163cm [0.0..9.0; value=4.0] | button "24cm"; button "32cm"; button "40cm" |
| bookcase / Original Modern | 100% [0.0..100.0; value=100.0]; 136cm [30.0..450.0; value=136.0]; 203cm [0.0..9.0; value=6.0] | button "24cm"; button "32cm"; button "40cm" |
| bookcase / Edge | 120cm [40.0..600.0; value=120.0]; 198cm [138.0..300.0; value=198.0] | button "27cm"; button "36cm"; button "45cm" |
| bookcase / Tone | 80 [40.0..600.0; value=80.0]; 194cm [134.0..296.0; value=194.0]; 27 [27.0..65.0; value=27.0] | 깊이 slider 사용(좌측 값 참조) |
| wallstorage / Original Classic | 90% [0.0..100.0; value=90.0]; 120cm [30.0..450.0; value=120.0]; 193cm [0.0..9.0; value=5.0] | button "24cm"; button "32cm"; button "40cm" |
| wallstorage / Original Modern | 0% [0.0..100.0; value=0.0]; 84cm [30.0..450.0; value=84.0]; 223cm [0.0..9.0; value=5.0] | button "24cm"; button "32cm"; button "40cm" |
| wallstorage / Edge | 127cm [40.0..600.0; value=127.0]; 168cm [48.0..300.0; value=168.0] | button "27cm"; button "36cm"; button "45cm"; button "60cm" |
| wallstorage / Tone | 244 [40.0..600.0; value=244.0]; 164cm [44.0..296.0; value=164.0]; 45 [27.0..65.0; value=45.0] | 깊이 slider 사용(좌측 값 참조) |
| tv-stand / Original Classic | 140cm [30.0..450.0; value=140.0]; 63cm [33.0..123.0; value=63.0] | button "24cm"; button "32cm"; button "40cm"; button "50cm" |
| tv-stand / Original Modern | 140cm [30.0..450.0; value=140.0]; 33cm [33.0..123.0; value=33.0] | button "24cm"; button "32cm"; button "40cm"; button "50cm" |
| tv-stand / Edge | 156cm [40.0..600.0; value=156.0]; 48cm [48.0..300.0; value=48.0] | button "36cm"; button "45cm"; button "60cm" |
| tv-stand / Tone | 180 [40.0..240.0; value=180.0]; 45cm [25.0..125.0; value=45.0] | radio "36cm" [checked]:; radio "46cm":; radio "56cm": |
| chest-of-drawers / Original Classic | 80% [0.0..100.0; value=80.0]; 140cm [30.0..450.0; value=140.0]; 83cm [33.0..123.0; value=83.0] | button "24cm"; button "32cm"; button "40cm"; button "50cm" |
| chest-of-drawers / Original Modern | 80% [0.0..100.0; value=80.0]; 190cm [30.0..450.0; value=190.0]; 73cm [43.0..133.0; value=73.0] | button "24cm"; button "32cm"; button "40cm"; button "50cm" |
| chest-of-drawers / Edge | 104cm [40.0..600.0; value=104.0]; 98cm [48.0..158.0; value=98.0] | button "36cm"; button "45cm"; button "60cm" |
| chest-of-drawers / Tone | 77 [40.0..240.0; value=77.0]; 115cm [25.0..125.0; value=115.0] | radio "36cm":; radio "46cm":; radio "56cm" [checked]: |
| shoerack / Original Classic | 72% [0.0..100.0; value=72.0]; 150cm [30.0..450.0; value=150.0]; 53cm [0.0..9.0; value=1.0] | button "24cm"; button "32cm"; button "40cm" |
| shoerack / Original Modern | 12% [0.0..100.0; value=12.0]; 88cm [30.0..450.0; value=88.0]; 43cm [0.0..9.0; value=1.0] | button "24cm"; button "32cm"; button "40cm" |
| shoerack / Edge | 173cm [40.0..600.0; value=173.0]; 48cm [48.0..158.0; value=48.0] | button "36cm"; button "45cm"; button "60cm" |
| bedside_table / Original Classic | 78cm [30.0..450.0; value=78.0]; 63cm [43.0..133.0; value=63.0] | button "24cm"; button "32cm"; button "40cm"; button "50cm" |
| bedside_table / Original Modern | 88cm [30.0..450.0; value=88.0]; 43cm [33.0..123.0; value=43.0] | button "24cm"; button "32cm"; button "40cm"; button "50cm" |
| bedside_table / Edge | 55cm [40.0..600.0; value=55.0]; 48cm [48.0..158.0; value=48.0] | button "36cm"; button "45cm"; button "60cm" |
| bedside_table / Tone | 60 [40.0..240.0; value=60.0]; 25cm [25.0..125.0; value=25.0] | radio "36cm" [checked]:; radio "46cm":; radio "56cm": |
| vinyl_storage / 직접 | 168cm [30.0..450.0; value=168.0]; 83cm [0.0..9.0; value=1.0] | button "24cm" [disabled]; button "32cm" [disabled]; button "40cm" |

## 기존 가정과 충돌 / 수정 필요

1. **카테고리 이름≠generator collection.** Original Classic 신발장3516418의 활성 preset은 Bookcase이며, Modern 신발장도 Bookcase 요청이 관찰됩니다. ShoeRack enum 존재만으로 신발장 카테고리를 그 generator에 연결할 수 없습니다. Edge 신발장1614538의 활성 preset은 type4/Sideboard이며4·5/Sideboard를 선취득합니다. 따라서 관찰된 Original/Edge 신발장은 모두 enum ShoeRack와 다른 collection을 씁니다.
2. **같은 '서랍장'도 모델별 collection 차이.** Original Classic 서랍장5141667은 Sideboard이며 Modern도 같은 요청. Edge 서랍장520406은 Chest 요청이 관찰됩니다. Tone 서랍장658504의 활성 preset은 type6/Sideboard입니다.
3. **Tone을 type3 또는 type6·7·8로 일괄 매핑하면 안 됩니다.** 낮은 수납군은6·7·8 선취득/일부 활성6이며, 책장1948627·벽수납1964452의 활성은14입니다. module39의 TYPE_03→tone 및 TYPE_14→edge fallback은 현행 마케팅 이름의 확정근거로 쓸 수 없습니다.
4. **Wallstorage/TvStand collection은 현재 실응답에 존재합니다.** 옛 module18 CollectionType 선언에 없더라도 Tone 벽수납 preset/API에서 대문자 W의 Wallstorage가 확인됩니다. Edge TV 제품1614814의 요청도 TvStand이며 Original TV의 Sideboard와 다릅니다. 구형 enum 범위로 새 제품을 강제 변환하면 정보를 잃습니다.
5. **Bookcase라도 모두 행 생성기가 아닙니다.** Original Bookcase는 jetty/row 경로인 반면 Tone Bookcase는 watty type14, mesh2590, channels 기반 상태입니다. collection 이름만 보고 Pattern/Mosaic Bookcase 구현을 공유하면 안 됩니다.
6. **Modern Wallstorage 기록 정정.** 이전 페이지 요청이 혼입된 초기 기록은 제외했습니다. 동일 URL1596673의 활성 preset과 재수집 요청은1/Bookcase입니다. 모든 보유 preset ID가 URL 제품 ID와 일치하는지 검사했습니다.
7. **Depth 옵션의 숫자도 모델별로 다릅니다.** Original row24/32/40, Original column24/32/40/50, Desk40/50/60, Edge27/36/45/60 부분집합, Tone 낮은 수납36/46/56, Tone type14는27..65 범위의 slider. 45와46의 차이를 오타로 합치면 안 됩니다.
8. **스타일 이름을 전 제품군에 공유하지 않습니다.** Original row는5개, column은 Frame을 포함한6개, Vinyl은3개, Tone 낮은 수납은3종 외형, Tone14는 문 개폐 방식 옵션을 가집니다. Classic 책장7197274 preset.pattern=0은 구형 enum SLANT와 대응하지만 현재 UI에서 Slant 선택 버튼이 보이지 않으므로 노출 기능으로 확정할 수 없습니다.
9. **높이 입력과 외경의 관계도 family별 다릅니다.** Tone14 책장 preset 외경1940/internal1980, 벽수납1640/internal1680이 직접 기록되어 있습니다. Tone sideboard8의 외경/내부 차이와 방향도 다릅니다. 40mm 감소를 발·상판 공식으로 단정하지 말아야 합니다.
10. **관찰 부재는 미지원 증거가 아닙니다.** intro에서 Desk/Dressing은 Original2종만, Shoerack은Original2+Edge, Vinyl은직접 링크로 관찰됐습니다. Tone 신발장이나 Edge 책상은 이 흐름에 링크가 없다는 사실만 기록합니다.

## 다음 확인 순서

- preset 없는 모든 표 행은 active shelf_type와collection을 응답으로 보완. 이미 여러 타입을 요청한 제품은 특히 prefetch와 선택 상태 구분.
- Edge TvStand/Wallstorage/Chest/Sideboard 및 Tone14의 geometry/재료/허용 범위를 별도 데이터 계열로 조사.
- 카테고리·모델 전환 시 preset, 개별 channel 편집, 소재, 카메라와 크기 유지/초기화 비교.
- slider min/max는 현재 스타일/발/부품 조합의 결과일 수 있으므로 조건부 변화 조사.
- UI가 노출한 옵션과 실행 가능한 선택지를 구분하는 단일 옵션 변경 사례 수집.

## 증거 파일 및 범위

10개 cases/category-*-001.json에32개 모델이 있습니다. 활성 preset26개, 나머지6개 null. 스크린샷32개 중14개는 로딩 preview이며 해당 JSON에 명시했습니다. 이 문서는 초기 제공 옵션 조사이며 모든 경계·개별 편집·다리/분절 공식 검증 완료가 아닙니다.

## 추가: 옷장 — 2026-10-13

요청 범위를 옷장까지 확장해11개 카테고리/34개 초기 모델 링크를 확인했습니다. 옷장 활성 preset2개 추가로 확보하여 전체 활성 응답28개입니다. Edge235218은type4/Cabinet/DNA v6, Tone92243은type3/Wardrobe/DNA v4입니다. Tone 이름만으로type14 또는6/7/8에 연결하지 않습니다. [상세 UI와14개 관찰 사례](wardrobe.md)를 참조하십시오. 초기 모델 수와 조작 사례 수는 서로 다릅니다.
