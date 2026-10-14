# 옷장: Edge / Tone 및 제품별 우측 UI

조사: codex-analysis, 2026-10-13. 기존 VPN Chrome의 독일어 configurator-intro에서 실제 제공 링크를 따라 조사했습니다. 관찰 사실과 미확인 구현 규칙을 구분합니다. 이번에는 제품 코드를 변경하지 않았습니다.

## 모델 및 실제 데이터 대응

| 항목 | Edge 옷장 | Tone 옷장 |
|---|---|---|
| 초기 제품 | [235218,w](https://tylko.com/de-de/mobel/kleiderschrank/235218,w) | [92243,w](https://tylko.com/de-de/mobel/kleiderschrank/92243,w) |
| 초기 외경 | 118 ×198 ×60cm | 100 ×200 ×53cm |
| 활성 shelf_type | 4 | 3 |
| collection_type | Cabinet | Wardrobe |
| DNA version | 6 | 4 |
| configurator | watty / type3 | watty / type3 |
| geom_id | 2590 | 2321 |
| 추가 요청 | type5/Cabinet도 선취득 | type3/Wardrobe |
| 기본 편집 상태 | preset의 channels/lines, material9, skin=edge, flatTop=false | channels/lines, material0, lighting=false, drawer_style=internal |

현재 intro의 옷장 모델 선택은 Edge/Tone 두 가지입니다. Classic/Modern 옷장의 전 사이트 판매 여부를 조사한 것은 아닙니다. **Tone의 type3은 이 옷장에서 현재 사용됩니다.** 이전 문서에서 type3을 구형 명칭이라고 지적한 것은 낮은 수납/책장에 일괄 적용하지 말라는 의미입니다. Tone 낮은 수납6/7/8, Tone 책장·벽수납14, Tone 옷장3을 분리해야 합니다. 카테고리 enum wardrobe와 collection Wardrobe/Cabinet도 다른 축입니다.

## 우측 패널: Edge 옷장

가격 아래 `Aussehen(외형)` / `Ausstattung(내부 구성)` 탭이 있습니다. 구매·저장 버튼은 각 패널 아래에 있습니다. 가격·사업 규칙은 Befun 정책을 유지합니다.

외형 탭의 순서:
1. 폭 슬라이더: 초기118, aria 범위40–600cm.
2. 높이 슬라이더: 초기198, aria 범위138–300cm. 초기 천장 높이208cm 안내.
3. 깊이 버튼:27/36/45/60cm, 초기60.
4. 구획(Spalten): 초기118cm에서는 구획 추가에 최소156cm가 필요하다는 안내. 이 경계 전후 실제 변화는 아직 미검증.
5. 상부 돌출 테두리(Oberseite mit Kanten): Mit/Aus, 초기Mit.
6. 마감: Farbe/Multiplexplatte/Holzoptik, 초기Farbe.
7. 색상 스와치11개. 정확한 색명·재질 수치는 이번 단계 미측정.

내부 구성 탭의 순서:
1. 구획 선택(Abschnitt1/2), 해당 구획 강조.
2. 내부 배치 썸네일 가로 캐러셀, 다음 썸네일 버튼.
3. 전면(Fassade): Offen / Mitte offen / Unten offen / Nichts offen.
4. 케이블 통로 추가.
5. 문 방향 Links/Rechts — 문이 있는 전면에서 노출.
6. 개별 기둥 높이(Säulenhöhe) 슬라이더와 해당 구획의 천장 높이 안내.
7. 개별 구획 깊이(Abschnittstiefe)27/36/45/60 버튼.

확인한 상호작용:
- `edge-002→003`: 구획2 전면을 Nichts offen→Offen으로 변경하면 문 방향 UI가 사라집니다.
- `edge-003→004`: Nichts offen으로 복귀하면 문 방향 UI가 다시 나타납니다.
- `edge-004→005`: 두 번째 내부 배치 썸네일을 선택하면 중간 옷봉을 가진 구성이 보입니다. 나머지 썸네일 전체의 구성 목록·치수는 미확인입니다.
- 메타데이터 수집 시 원본 URL을 새로고침해 초기 preset으로 복귀했습니다. 편집 내용을 서버에 저장하거나 장바구니에 추가하지 않았습니다.

근거: `cases/category-wardrobe-edge-001.json`부터`005.json`, 각 사례의 PNG와 조작 순서.

## 우측 패널: Tone 옷장

외형/내부 구성 탭이라는 큰 틀은 같지만 Edge와 제어 항목·방식이 다릅니다.

외형 탭의 순서:
1. 폭 슬라이더:100cm, aria40–600.
2. 높이:200cm /237cm /Höhe+ 버튼.
3. 깊이 슬라이더:53cm, aria40–80. Edge의 네 가지 깊이 버튼과 다릅니다.
4. 실측 안내 링크.
5. 조명: Keine/Innen, 초기Keine.
6. 외부색 스와치3개.
7. 내부색 스와치5개.
8. 샘플 주문 안내.

높이 동작은 단일 사례에서 확인했습니다:
- `tone-001→002`:200cm에서 Höhe+ 클릭 시238cm로 바뀌며238–360cm 슬라이더가 나타납니다. 초기 천장 여유 안내는248cm입니다.
- `tone-002→003`: Standard로 돌아오면237cm를 선택합니다. 원래200cm로 자동 복귀하지 않습니다.
- 이후200cm를 명시적으로 선택해 원래 높이로 복귀했습니다.
- 위 범위는 DOM 속성 관찰이며 모든 높이에서의 단 추가/문 분할 공식까지 검증한 것이 아닙니다.

내부 구성 탭:
- 내부 배치 썸네일 캐러셀.
- 구획 너비94cm와 전체 옷장 너비100cm 표시, 구획 관련 아이콘/도움말. 그 차이6cm를 판 두께 공식이라고 단정하지 않습니다.
- Schubladen: Innen(내부)/Außen(외부), 배치가 바뀐다는 안내.
- `tone-004→005`: 외부 서랍 전환 시 문·서랍 전면 구성이 실제 변경됩니다. 단순히 같은 서랍의 z좌표만 바꾸는 옵션으로 취급하지 않습니다.
- `tone-005→006`: 내부 서랍으로 복귀 확인.

조명/복귀:
- `tone-006→007`: 외형 탭에서 Innen 조명을 켜면 플러그를 위해 뒤쪽4cm 여유가 필요하다는 안내가 나타납니다.
- `tone-007→008`: Keine로 복귀.
- `tone-009`: 원본 제품 URL 새로고침 후100×200×53cm, 조명없음, 초기 내부서랍 구성을 다시 확인했습니다. 공유 URL/저장 후 복구와는 별개입니다.

근거: `cases/category-wardrobe-tone-001.json`부터`009.json`. API의 전체 초기 configurator_params와 개별 편집 상태는 사례 initialState에 보관했습니다. 변경 후 내부 직렬화 상태는 이번에는 확보하지 않아 currentInternalParameters=null입니다. UI 변화/조작 이력으로 재현하며 정확한 형상 좌표는 미측정입니다.

## 구현 전달 규칙

공통 우측 패널 하나에 모든 옵션을 나열하지 않습니다. **제품군 + 생성 구조 + 현재 편집 상태**가 패널의 순서·범위·선택지·노출 여부를 결정해야 합니다.

- category는 용도이고 UI profile/생성기 구분과 같지 않습니다. wardrobe라도 Edge Cabinet과 Tone Wardrobe를 분리합니다.
- 전역 치수와 선택 구획 치수의 입력·저장 위치를 분리합니다. 구획을 바꿨을 때 다른 구획의 문/서랍/높이/깊이를 덮어쓰지 않습니다.
- 문 방향은 실제 전면 상태에 따라 표시합니다. 숨겨졌을 때 값 유지/초기화는 추가 검증 전 결정하지 않습니다.
- 높이+와 Standard 전환, 내부/외부 서랍 변경은 구조 변화로 처리합니다. 화면만 바꿔서는 안 됩니다.
- 리더: 공통 상태 계약, 생성기/판재/CNC/다리/문·서랍 배치. graphics: 확정된 profile의 제어 화면·3D 외형. 기존 파일 소유권은 team-tasks를 확인합니다.
- wardrobe를 기존10종 타입에 정식 추가해야 하나 이번 조사에서는 공통 소스를 변경하지 않았습니다. 기존 ConfiguratorIntro의 옷장 항목을 중복 생성하지 않습니다.

## 미확인 / 후속

모든 내부 배치·경계값·재질별 제약, 폭156cm 전후 구획 변화, 개별 높이/깊이 조합, 상부 테두리 변화, 다리/받침·가로판 분절·보강 및 체결 치수, 조명 부품 형상/색온도, 모바일 패널, 변경 순서와 저장/복구, Befun 구조·시각 동치는 미완료입니다. API 접근 확인은 재사용 라이선스 확인과 별개이며 기존 출처 문서의 설명을 유지합니다.

## 2026-10-14 구현 상태 갱신

Edge/Tone 실제 생성기·우측 편집·경첩·옷봉·조명·문/서랍·저장 URL을 연결했습니다. [최신 통합 검사](../handoffs/desk-wardrobe-integration.md), [Edge 근거](../handoffs/wardrobe-core.md), [Tone 근거](../handoffs/wardrobe-tone-core.md). 초기 미구현 기록을 보존하며, 제조치수 미확인과 물리판 최대1mm 차이는 미해결입니다.

## R8 최종 표시 단계 교정 / 2026-10-14

Tone 중간 getRender 판재와 최종 표시를 혼동한 검증 누락을 수정했다. 최종 폭/높이/외부 전면과 위→아래 차등 인출을 72설정·1,170판재에서 검증했다. 뷰어는 선반의 공통 배경·후처리·fitView와 보기 메뉴 CSS를 사용한다. 상세 근거/화면/남은 차이: [R8 검증](../handoffs/wardrobe-viewer-review/README.md). 사례 `wardrobe-viewer-r8-001`; 전체 시각 동치 미완료.
