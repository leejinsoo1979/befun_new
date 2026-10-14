# Tone wardrobe core — 2026-10-14

담당: horizontal_rules. Tone wardrobe 전용 생성기를 독립 구현했다. 현재 Tone sideboard(type6/7/8), Tone bookcase(type14)와 공유하는 규칙으로 간주하지 않는다.

## 근거와 범위

- 공개 Wardrobe DNA version4, shelf_type3, mesh2321. 저장 원본 `/tmp/tylko-wardrobe-tone-dna.json`, 공개 legacy 엔진 `/tmp/tylko-wardrobes-bundle.js`.
- 실제 저장 preset으로 성공한 Engine1888과 `getGeometry`를 비교했다. 현행 Nuxt 엔진으로 Tone DNA가 성공했다고 주장하지 않는다.
- 원본 module1674: 외경 폭에 따른 mesh setup 선택, local_x 배분. 1670/1671: Tone 프레임/몸통 정리, 옷봉/서랍/조명/분절. 1676: 내부·외부 서랍 스택과 도어 방향. 1965: 문 분리/핸들 활성. 1975: mm 공개 geometry 변환.
- 생산 코드는 번들 함수 복사 대신 데이터에서 정리한 12개 내부 구성 레시피와 독립 치수 계산으로 작성했다. 오프라인 검증 스크립트에서만 저장된 공개 번들을 실행하며 앱 startup은 실행하지 않는다.

## API와 소유 파일

- `normalizeToneWardrobe(input): WardrobeInput`
- `generateToneWardrobe(input): WardrobeResult`
- `generateToneSourceGeometry(input): WardrobeSourceGeometry`
- `toneWardrobeLayoutOptions(input?, sectionId?): {id:number,seriesId:number,label:string}[]`
- `getToneWidthOptions(input): {id:string,label:string,widthsMm:number[]}[]`
- 구현 `src/lib/furniture/wardrobe/tone.ts`, 데이터 `tone-rules.json`.
- 공통 index/types/adapter/UI/store는 각 담당 소유. adapter에 안정 section IDs를 전달한다. `sourceGeometryMm`는 원본식 mm bbox, 일반 panels/fronts는 공통 adapter의 cm 결과다.
- `source.drawer_fronts`는 clean f 외부 서랍 프런트 bbox다. 실제 렌더 기하 변환은 wardrobe_geometry 담당 `tone-drawers.ts`에서 수행한다.

## 확인된 규칙

- 너비400~6000mm, 깊이400~800mm, UI 단위10mm. 높이2000/2370mm 및2380~3600mm의10mm 단계. 허용되지 않는 중간 낮은 높이는 가까운 기본 높이로 보정한다.
- setup 범위 판정에는 **외경 폭**을 쓴다. 열 분배에 쓰는 축간 전체 길이는 외경−42mm. 좌우 각21mm에는18mm 몸통판의반폭9mm와12mm 프레임이 포함된다.
- 가변 비율은 큰열의 폭을 먼저 `round(totalAxisWidth * 2 / ratioSum)`로 확정하고 작은열에 잔여를 배정한다. 균등 비율은 정수 나눗셈 나머지를 앞열부터 배정한다.
- `toneWidthPattern`은 전체열 비율 문자열. 예1500mm는12/11/21. 가변 setup에서만 지원하며 모든 열의 실제 선택지 합집합을API에서 반환한다. 원본 개별열 UI는이중3개옵션을노출한다. 반환 `widthsMm`는 **칸막이 축간 폭**이다. 이값에서18mm를빼야 몸통 내경이다.
- 5090mm 중첩 setup 경계는후행가변6열을선택한다. 단일조건식으로앞쪽5열을먼저고르면원본과달라진다.
- 내부 레시피12종3738~3749. drawerStyle에 따라DNA300/400의별도레시피를적용한다. 외부서랍선택이단순프런트추가가아니라내부선반/서랍수를바꾼다.
- 깊이≤520mm에서옷봉이있고축간폭≤509mm인열은밀집선반3749로자동보정된다. 깊이>520mm는가로옷봉,얕은깊이는전후옷봉장치이며넓은열에2개생성된다.
- 몸통판18mm,백패널12mm,외프레임12mm,하부마스킹35×14mm. 외경UI높이와실제최상단판면을같은값으로간주하지않는다. 예2000mm입력에서프레임측판상단1989mm,2370mm입력에서2358mm.
- 프레임가로분절은2700mm이상에서실제세로축중앙후보를선택한다. 동일거리일때오른쪽축. 필요한경우두절단점. 프레임측판은2700mm초과시1959mm에서분절,몸통세로판은2684mm이상시1976mm에서분절한다.
- 문축폭610mm초과는양개문. 높은문은원본높이조건에서1959mm분절한다. 실제문간극/힌지pivot은공통wardrobe front resolver가처리한다.
- Tone 문방향은전역`doors_direction`상태이다. 좁은열의방향을바꾸면왼쪽양개문들의손잡이면도변한다. normalize는이값을모든section의doorDirection에보존해비율이동/저장복원에서유지한다. 양쪽단문만있는2열은좌문좌힌지/우문우힌지규칙을따른다.
- 내부서랍높이150mm,정해진셀높이에따라1/2/3/4/6개와간격을계산한다. 외부서랍앞판은338/224mm스택,4mm간격. 외부몸체깊이는50mm단위및602mm상한을사용한다.
- 조명은중간서랍선반생략을바꾸며,첫내부서랍subtype을변경한다. 조명anchor는원본평면좌표(y1=y2)이며그평면을임의두께판재로단정하지않는다.

## 검증

- 개발중8,640조합원본대조로기본12레시피/깊이/높이/분절규칙을정리했다. 이후별도width-pattern/혼합열/전역도어상호작용을추가검증했다.
- 최종heldout720조합: **720/720 PASS**. 외경폭40~600cm의모든10mm폭값을포함하는순열표본,11개높이,13개깊이,12시리즈혼합,내부/외부서랍,조명,가변너비비율,좌우방향을비교했다. 모든곱조합을검사한것은아니다.
- 비교: slabs/walls/backs/frame/masking_bars/doors/drawers/bars/lighting/components 전체bbox,subtype,도어방향,핸들활성,외곽플래그. 배열순서는구조와별개로정규화하며좌표정규화정밀도1e-7mm.
- 원본출력155개를 `scripts/furniture-wardrobe/tone-source-fixtures.json`에동결했다. `tone.test.mjs`에서구조/JSON저장복원/안정ID/비율/좁은열보정/전역방향을회귀검사한다.
- 실행: `node scripts/furniture-wardrobe/tone.test.mjs` PASS. `node scripts/furniture-wardrobe/tone-capture.mjs`는로컬공개원본이있을때720개다시대조한다. sourcepaths는TONE_SOURCE_BUNDLE/TONE_SOURCE_DNA환경변수로변경가능하다.
- `eslint src/lib/furniture/wardrobe/tone.ts` 오류없음. 전체tsc의공유개발route오류와동시개발파일누락은리더격리빌드에서별도확인한다. 본담당이앱전체빌드나실제Chrome렌더완료를선언하지않는다.

## 남은 범위 / 미확인

- 실제옷봉/조명/경첩asset단면과설치부품mesh,재질/화면동일성은bbox대조와별개이다.
- 내부opening명시좌표는공통adapter미구현상태이며임의숫자를넣지않았다.
- Tone개별열높이/깊이,임의mm고정열너비,open facade는현재이모델에서지원근거가없으므로unsupported로남긴다. 공개local_x비율편집과혼동하지않는다.
- UI의단문방향비활성/폭옵션3개노출/원본색팔레트와실제저장·복원화면확인은리더통합범위.
- physical도어는공통resolver와연결. 서랍물리상자/앞판도공통담당의actualgetRender대조결과를별도로인계받아야한다.

Tone core 파일잠금해제. 공통파일·기존다른스타일·브라우저미수정.

## 후속 — Tone 중간 경첩 생성 연결 (2026-10-14)

- `generateToneSourceGeometry()`가 공통 `generateToneHingeEnvelopes()`로 생성한 `source.hinges`를 반환합니다. 경첩 규칙 함수를 다시 복사하지 않고 기존 독립 구현을 사용합니다.
- 원본 module1670의 처리 순서에서 경첩은 선반 trim/두께 변경/서랍 바닥 선반 삭제보다 앞서 생성됩니다. 따라서 recipe 선반을 18mm 상태로 복제하여 보존합니다. recipe의 추가 선반도 원본에서는 `Ss`이며 장애물에 포함됩니다. 바닥판 `Sb`는 포함하지 않습니다.
- module1965의 원본 도어 끝 여유: 위쪽은 최상단 −5mm / 중간 2mm, 아래쪽은 최하단 6mm / 중간 2mm. 이를 경첩 helper의 offset 입력에 전달합니다. 갤러리 문 경계를 실제 앞판 여유가 적용된 경계로 중복 보정하지 않습니다.
- 경첩 bbox는 source 순서상 **문 여유 적용 전 축과 선반 장애물**로 계산되며 제조용 보링 사양으로 확대하지 않습니다. 안정 section ID를 `m_config_id`에 보존합니다.
- 실제 원본 engine1888 `getGeometry().hinges`까지 기존 전체 비교 목록에 추가하여 **720/720 설정 PASS**. 동결155개 fixture도 경첩 bbox/방향을 포함하도록 갱신했습니다. 별도 72개 높이·깊이·서랍·조명 파일럿 조합도 PASS입니다.
- 회귀18개 PASS: 통합 저장/복원12개, 경첩 원본·mesh·Edge 비교5개, Tone155개 fixture와 경첩 개수/ID/높이 경계1개. 변경 범위 ESLint PASS.
- 이전 남은 범위 중 개구부와 서랍 실제 기하는 현재 공통 adapter/물리 서랍 담당이 연결했으며, 관련 검증은 `wardrobe-core.md`를 참고합니다. 설치부품의 실제 제조·강도·보링 검증은 여전히 별도 범위입니다.
