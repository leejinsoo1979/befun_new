export type Mechanism = 'clip' | 'back' | 'wide' | 'insert' | 'drawer' | 'door' | 'leg' | 'plinth' | 'module' | 'lift' | 'wall' | 'care';
export type Pose = Record<string, number>;
export interface ManualStep { title: string; text: string; pose: Pose; duration: number; }
export interface Chapter { id: string; title: string; mechanism: Mechanism; source: string; videos: string[]; images: number[]; initial: Pose; steps: ManualStep[]; }
const step = (title: string, text: string, pose: Pose = {}, duration = 3): ManualStep => ({ title, text, pose, duration });
const guide = (n: number) => `/assembly/tylko/guides/${({32:'32-back-panels-and-supports',33:'33-extra-wide-shelves-connecting-two-halves',34:'34-aligning-horizontal-and-vertical-elements',35:'35-troubleshooting-inserts-that-don-t-fit',36:'36-drawers-assembly-and-adjustment',37:'37-incorrectly-assembled-elements',38:'38-doors-assembly-and-adjustment',14:'14-securing-your-tylko-to-the-wall'} as Record<number,string>)[n]}.pdf`;
const low = (page: number) => `/assembly/tylko/manuals/EN_Disassembly_low_furniture.pdf#page=${page}`;
const tall = (page: number) => `/assembly/tylko/manuals/EN_Disassembly_tall_furniture.pdf#page=${page}`;

/** Motion distances and geometry below are explanatory, not manufacturing measurements. */
export const chapters: readonly Chapter[] = [
 {id:'clip-assemble',title:'클립 · 가로/세로판 조립',mechanism:'clip',source:guide(34),videos:[],images:[30,31,32,33,34],initial:{gap:65,slide:11,lateral:12},steps:[
  step('색상과 방향 확인','검정 핀은 검정 클립, 은색 핀은 은색 클립에 대응합니다. 구형 주황도 같은 색끼리 연결합니다. 색만으로 잠금형/비잠금형을 단정하지 않습니다.'),
  step('입구에 핀 정렬','클립은 판의 좁은 단면에 매입되고 상대 핀은 다른 판의 넓은 면에 있습니다. 두 핀 머리를 클립의 넓은 입구에 맞춥니다.',{gap:16,lateral:0}),
  step('접합면 쪽으로 진입','패널을 지지하면서 핀 머리를 입구에 넣습니다. 두 핀이 진입하기 전에는 긴 방향으로 밀지 않습니다.',{gap:0}),
  step('장축 방향으로 체결','핀 머리가 진입한 뒤 판을 밀어 핀 목이 좁은 홈 안으로 이동하게 합니다. 잠금형은 이탈을 막는 저항이 있습니다.',{slide:0}),
  step('끝선과 직각 확인','앞뒤 끝선을 맞추고 느슨한 접합이 없는지 확인합니다. 필요 시 펠트 보호판과 고무망치로 아래에서 위 순서로 조정하며 다른 성인이 가구를 지지합니다.')
 ]},
 {id:'clip-release',title:'클립 · 분해와 방향 교정',mechanism:'clip',source:low(14),videos:['DYpU9nWbrvA','tkMWk3KPwD8','71SSgWoilwE'],images:[55,56,69],initial:{gap:0,slide:0,lateral:0},steps:[
  step('비우고 보호면에 눕히기','도어와 서랍을 제거하고 보호면에 앞면이 아래로 향하도록 놓습니다. 해당 세로판 또는 가까운 가로판 아래에 펠트 보호판을 받칩니다.'),
  step('접합을 역방향으로 풀기','보호판이 받치는 부품과 상대 부품을 확인하고 설명서의 누르는 방향으로 힘을 가합니다. 핀이 입구로 돌아오기 전에 판을 잡아 뜯지 않습니다.',{slide:11}),
  step('풀린 판 분리','연결부가 풀린 뒤 판을 분리합니다. 도해의 바닥→위/위→바닥 방법은 받침 위치가 다릅니다. 원문 14–15쪽을 함께 확인합니다.',{gap:65}),
  step('레일·힌지 방향 확인','레일이 앞쪽으로 빠지고 힌지가 가구 앞쪽을 향해야 합니다. 잘못된 판은 분리한 상태에서 뒤집은 뒤 색상 대응을 다시 확인합니다.'),
  step('재정렬 후 다시 진입','뒤집은 부품의 핀과 입구를 맞추고 접합면으로 접근합니다.',{gap:0}),
  step('다시 체결','클립 장축으로 밀어 끝선을 맞춥니다. 백패널이 있는 행은 테이프로 지지하고 주변 행을 먼저 풀어야 할 수 있습니다.',{slide:0})
 ]},
 {id:'back-assemble',title:'백패널·보강대 장착',mechanism:'back',source:guide(32),videos:['blfcT3pgLCs'],images:[1,2,3,4,8,9],initial:{tilt:.42,bottom:30,spring:0},steps:[
  step('W / S 부품 확인','W는 백패널, S는 보강대입니다. 두 부품 모두 아래쪽은 고정핀, 위쪽은 스프링핀입니다.'),
  step('하단 고정핀부터 넣기','부품을 기울여 하단 핀 두 개를 가로판의 구멍에 먼저 맞춥니다.',{bottom:0}),
  step('상단 스프링핀 누르기','하단 핀을 유지한 채 상단 스프링핀을 누르고 위 가로판 아래로 넣습니다.',{spring:1,tilt:.08}),
  step('양쪽 클릭 체결','상단을 제자리로 밀어 두 스프링핀이 모두 구멍에 복귀하게 합니다.',{tilt:0,spring:0}),
  step('면 정렬·타공 확인','패널이 주변과 평평한지 확인합니다. 맞지 않으면 각 핀 중심과 가장자리 거리, 상대 구멍 중심과 가장자리 거리를 양쪽에서 각각 측정합니다.')
 ]},
 {id:'back-release',title:'백패널 · 낮은 가구 분해',mechanism:'back',source:low(11),videos:['eGsCR6_Cqi4'],images:[13,14,15,16,17,18,19,20,21,22],initial:{tilt:0,bottom:0,spring:0,upper:0,tape:0},steps:[
  step('보호판으로 받치기','도어·서랍을 제거하고 낮은 가구를 보호면에 눕힙니다. 첫 세로판 아래에 펠트 보호판을 받칩니다.'),
  step('테이프로 낙하 지지','백패널에 테이프를 붙이되 팽팽하게 당기지 않습니다. 큰 패널은 2~3줄로 지지합니다.',{tape:1}),
  step('주변 접합을 차례로 풀기','백패널 옆 행의 가로판을 고무망치로 조금씩 풉니다. 보호판을 옆 세로판 아래로 옮겨 같은 행 전체에 반복합니다.',{upper:25}),
  step('풀린 패널 꺼내기','핀에서 풀린 패널을 받쳐 기울이고 꺼냅니다. 단순히 상단을 강제로 잡아당기는 방식이 아닙니다.',{tilt:.4,bottom:30}),
  step('세로판 분해','이제 가까운 가로판 아래를 받치고 세로판을 눌러 해제합니다. 세운 상태의 대안은 낮고 작은 가구에만 원문 조건대로 적용합니다.')
 ]},
 {id:'wide',title:'넓은 선반 · 가로판 분절 연결',mechanism:'wide',source:guide(33),videos:['Zvi9fUoucog','7fkFU6Tz4DA'],images:[23,24,25,26,27,28,29],initial:{gap:85,turn:0},steps:[
  step('분절 접합부 확인','원문은 240cm보다 긴 가구를 모듈로 나누어 연결한다고 설명합니다. 암·수 연결부와 다월을 확인합니다. 이 접합은 가로·세로판 클립과 별개입니다.'),
  step('양쪽 끝선 정렬','두 모듈의 가로판·세로판 끝선을 먼저 맞추고 연결부와 다월을 정렬합니다.',{gap:35}),
  step('모듈 맞대기','도움받아 두 모듈을 천천히 맞댑니다. 접합선은 그대로 남습니다.',{gap:0}),
  step('가로판마다 조이기','각 가로판의 접근 구멍에 육각렌치를 넣어 연결부를 조입니다. 영상의 일반 예시는 가로판당 연결부 2개이며 깊이 24cm는 1개입니다. 해당 제품의 모든 연결부에서 반복합니다. 조임 토크와 내부 캠 형상은 자료에 없습니다.',{turn:1}),
  step('분해는 모든 연결부 해제 후','벽 고정을 풀고 가구를 지지한 상태에서 4mm 육각렌치로 각 연결부를 풉니다. 낮은/높은 분해 매뉴얼은 반시계 두 바퀴를 안내합니다.',{turn:0}),
  step('두 모듈 분리','모든 가로판의 연결부가 풀린 뒤 양쪽을 지지하며 분리합니다. 높은 가구는 세운 상태에서 3명이 작업하는 지침을 적용합니다.',{gap:85})
 ]},
 {id:'insert',title:'인서트 · 내부 선반',mechanism:'insert',source:guide(35),videos:['1eMum5ec0ig'],images:[41,42,43,44,45,46,47,48],initial:{front:70,raise:18},steps:[
  step('8자 연결부 방향','I 부품의 좌우 연결부 방향을 정면에서 확인합니다. 작은 원이 아래를 향한 도해는 잘못된 배치입니다.'),
  step('핀과 입구 맞추기','좌우 핀을 연결부에 맞추고 선반을 안쪽으로 넣습니다. 맞지 않으면 위아래 방향을 확인합니다.',{front:0}),
  step('선반 안착','양쪽 연결부가 함께 걸리도록 선반을 제자리에 내립니다.',{raise:0}),
  step('분리: 위로·앞으로','선반 앞을 잡고 위와 앞쪽으로 부드럽게 움직여 연결부를 해제합니다.',{raise:18,front:25}),
  step('인서트 꺼내기','인서트는 해당 구조에 따라 위 또는 아래에서 장착할 수 있습니다. 분리할 때는 연결부에서 풀린 것을 확인한 뒤 꺼냅니다. 맞지 않을 때에는 핀·8자 연결부 중심에서 앞뒤 가장자리까지 거리를 각각 확인합니다.',{front:70})
 ]},
 {id:'drawer-box',title:'서랍 박스 조립·분해',mechanism:'drawer',source:guide(36),videos:['nQP5VWmSs3k'],images:[49,50],initial:{side:50,back:55,bottom:40,front:0},steps:[
  step('앞판·측판 방향','앞판과 측판의 색상 연결부를 맞춥니다. 측판의 바닥판 구멍은 안쪽을 향해야 합니다.'),
  step('양쪽 측판 체결','앞판에 양쪽 측판을 클릭 체결합니다.',{side:0}),
  step('뒤판 체결','색상을 맞춰 뒤판을 클릭 체결합니다.',{back:0}),
  step('뒤집어서 바닥판 연결','연결된 박스를 뒤집고 바닥판의 핀을 구멍에 맞춰 클릭 체결합니다.',{flip:Math.PI,bottom:0}),
  step('정상 방향으로 복귀','바닥판이 모두 연결된 것을 확인하고 정상 방향으로 놓습니다.',{flip:0}),
  step('분해: 뒤판부터','레일에서 꺼낸 뒤 뒤판을 위로 빼냅니다.',{back:55}),
  step('측판 벌려 바닥 분리','측판을 약간 기울여 바닥판을 꺼냅니다.',{side:8,bottom:40}),
  step('측판 분리','바닥판을 꺼낸 뒤 측판을 위로 분리합니다.',{side:50})
 ]},
 {id:'drawer-rail',title:'서랍 레일 장착·해제·조정',mechanism:'drawer',source:guide(36),videos:['hWDpACJiRWY','tkMWk3KPwD8'],images:[51,52,53,54],initial:{side:0,back:0,bottom:0,front:150,catch:0,raise:0},steps:[
  step('레일 위에 놓기','서랍 레일을 완전히 빼고 서랍을 올립니다. 회색 레일 이와 노란 바닥 연결부가 맞물려야 합니다.'),
  step('밀어서 래치 체결','서랍을 밀어 닫아 클릭 체결합니다.',{front:0}),
  step('열어 체결 확인','다시 열어 양쪽 레일 연결과 간섭을 확인합니다.',{front:150}),
  step('높이 조정','바닥의 검정 레버와 회색 부품으로 앞판 높이를 조정합니다. 회색 부품을 바깥으로 밀면 낮아지고 안쪽으로 밀면 높아집니다.',{raise:4}),
  step('양쪽 노란 캐치 동시에 누르기','분리 시 서랍을 열고 아래의 노란 캐치 두 개를 동시에 누릅니다.',{catch:1,raise:0}),
  step('살짝 들어 앞으로 빼기','캐치를 누른 상태에서 서랍을 조금 들어 앞으로 꺼냅니다. 이후 레일을 안으로 넣습니다.',{front:230,raise:25})
 ]},
 {id:'door',title:'도어 장착·분리',mechanism:'door',source:low(6),videos:[],images:[72,73],initial:{gap:55,angle:1.4,latch:0},steps:[
  step('힌지와 장착판 정렬','도어를 받치고 미리 달린 힌지를 세로판의 장착판에 맞춥니다. 양개형은 각각의 문짝에서 반복합니다.'),
  step('힌지 클릭 체결','힌지 두 곳을 차례로 눌러 장착판에 체결합니다.',{gap:0,latch:1}),
  step('여닫으며 확인','도어를 여닫아 간섭과 틈새를 확인합니다.',{angle:0}),
  step('분해 준비','문을 열고 한 손으로 받칩니다.',{angle:1.4}),
  step('힌지 끝 해제','각 힌지 끝의 해제부를 들어 올립니다. 두 힌지가 모두 풀리기 전에는 문을 놓지 않습니다.',{latch:0}),
  step('문짝 분리','두 힌지가 해제되면 문을 장착판에서 분리합니다.',{gap:55})
 ]},
 {id:'door-adjust',title:'힌지 3축 조정·범퍼',mechanism:'door',source:guide(38),videos:['MtWHpUer6hA','71SSgWoilwE'],images:[74,75,76,77,78],initial:{gap:0,angle:.7,latch:1},steps:[
  step('힌지 종류 확인','Blum과 Tylko/Häfele의 도해를 구분해 확인합니다. 문을 단 상태에서 조정합니다.'),
  step('높이 조정','가운데 조정 나사로 높이를 조정합니다. 설명용 움직임이며 실제 나사 회전당 이동량은 확정하지 않았습니다.',{raise:6}),
  step('평행·좌우 조정','가구 앞 가장자리에 가까운 조정 나사로 문짝의 평행 상태를 맞춥니다.',{shift:5}),
  step('깊이 조정','가장자리에서 먼 조정 나사로 깊이를 맞춥니다.',{depth:6}),
  step('범퍼·최종 틈새','도어가 가구 끝선보다 안으로 지나가면 범퍼를 확인합니다. 힌지 간격·방향, 비슷한 크기 문짝의 위치를 먼저 확인한 뒤 타공 불일치를 측정합니다.',{angle:0,raise:0,shift:0,depth:0})
 ]},
 {id:'legs',title:'다리 장착·핀 해제',mechanism:'leg',source:low(24),videos:['y_6rMHwOIzo'],images:[],initial:{gap:50,slide:12,pin:0},steps:[
  step('3개 나사와 중앙 핀','도어·서랍을 제거하고 보호면에 눕힙니다. 바닥판의 나사 3개와 중앙 은색 핀, 다리 장착판의 키홀을 확인합니다.'),
  step('키홀을 나사에 맞추기','장착판의 넓은 입구를 나사 머리에 맞춥니다. 다리 몸통과 장착판은 함께 움직입니다.',{gap:0}),
  step('슬라이드하여 장착','장착판을 밀어 좁은 키홀에 나사를 걸고 중앙 핀의 잠금을 확인합니다.',{slide:0}),
  step('분리: 중앙 핀 누르기','드라이버로 중앙 은색 핀을 누릅니다. 나사 3개를 풀어 분리하는 방식이 아닙니다.',{pin:1}),
  step('누른 채 판을 밀기','핀을 누른 상태에서 장착판을 위로 밀어 키홀의 넓은 입구로 되돌립니다.',{slide:12}),
  step('다리와 장착판 함께 분리','핀을 놓고 다리·장착판을 함께 당겨 분리합니다. 나사 3개와 핀은 바닥판에 남습니다.',{gap:50,pin:0})
 ]},
 {id:'plinth',title:'플린스 조립·분해',mechanism:'plinth',source:low(21),videos:['lgHYY5T504w'],images:[],initial:{side:0,long:0,rotate:0},steps:[
  step('바닥판 받치기','도어·서랍을 제거하고 보호면에 앞면을 아래로 놓습니다. 바닥 가장자리 아래를 펠트 보호판 두 개로 받칩니다.'),
  step('짧은 부품 풀기','고무망치로 양쪽 짧은 플린스 부품을 조금씩 풀어 구조를 느슨하게 합니다.',{side:10}),
  step('긴 부품 꺼내기','가로로 긴 부품들을 부드럽게 당겨 꺼냅니다.',{long:60}),
  step('짧은 부품 바깥으로 회전','남은 짧은 부품을 바깥쪽으로 돌려 다시 수직으로 세웁니다.',{rotate:Math.PI/2}),
  step('위로 밀고 분리','짧은 부품을 위로 밀고 당겨 바닥판에서 분리합니다.',{side:60}),
  step('재조립: 가로지르는 부품부터','영상 순서대로 바닥을 가로지르는 부품부터 연결한 뒤 짧은 부품을 장착하고, 마지막에 가장 긴 부품을 연결합니다.',{side:0,rotate:0}),
  step('긴 부품 연결·정렬','긴 부품을 연결하고 보호판을 사용해 전체 끝선을 맞춥니다.',{long:0})
 ]},
 {id:'module-low',title:'낮은 가구 · 행 분리·재조립',mechanism:'module',source:low(16),videos:['7fkFU6Tz4DA','bpHEmZBUMAg','DXFkO9fkcBM'],images:[55,63,64],initial:{gap:0,slide:0,tape:0},steps:[
  step('부품 표시·보호면 준비','가구를 비우고 부품 위치를 표시합니다. 도어·서랍·다리 또는 플린스를 제거하고, 넓은 가구는 모듈 접합부를 먼저 풉니다.'),
  step('백패널 지지','백패널을 테이프로 느슨하게 지지하고 행의 모든 연결 위치를 확인합니다.',{tape:1}),
  step('같은 행의 접합 해제','보호판과 고무망치로 같은 행의 연결부를 차례로 풀어줍니다. 두 단 높이 세로판이 가로지르는 행을 임의로 끊지 않습니다.',{slide:25}),
  step('분리된 행 들어내기','양쪽을 함께 지지하면서 분리된 행을 들어내고 백패널을 받쳐 꺼냅니다.',{gap:85}),
  step('재조립: 세로판 정렬','하부 모듈을 보호면에 놓고 세로판의 핀·클립 색상과 방향을 맞춥니다.',{slide:11}),
  step('다음 행 결합','다른 사람이 세로판을 정렬하는 동안 다음 행을 맞추어 놓습니다.',{gap:0}),
  step('밀어 체결·백패널 복원','하부 가로판을 보호하며 체결하고 하단 고정핀→상단 스프링핀 순서로 백패널을 다시 넣습니다.',{slide:0,tape:0})
 ]},
 {id:'module-tall',title:'높은 가구 · 행·백패널 분해',mechanism:'module',source:tall(12),videos:['_yjSDPmH4s8','DXFkO9fkcBM'],images:[],initial:{gap:0,slide:0,tape:0},steps:[
  step('3명과 후면 공간 확보','도어·서랍을 빼고 세 사람이 가구를 지지합니다. 벽 고정을 풀고 후면 작업 공간을 확보합니다.'),
  step('백패널 테이프 지지','백패널을 팽팽하지 않게 테이프로 지지합니다. 두 명이 양쪽에서 전도를 막고 한 명이 작업합니다.',{tape:1}),
  step('같은 행 세로판을 차례로 풀기','앞에서 펠트 보호판을 세로판 하단에 대고 고무망치로 번갈아 풉니다. 이 매뉴얼은 2.5cm 이상 이동을 표시합니다. 이것은 이 작업의 해제량이며 모든 클립의 고유 이동 치수가 아닙니다.',{slide:25}),
  step('한쪽씩 살짝 들어 백패널 회수','한쪽을 조금 들어 뒤쪽 사람이 백패널을 받고, 반대쪽에서도 반복합니다.',{gap:15}),
  step('행 전체 들어내기','양쪽을 동시에 들어 분리된 행을 안전한 보호면에 놓습니다. 느슨한 세로판이 달린 채 운반하지 않습니다.',{gap:100}),
  step('재조립: 모든 세로판 정렬','하부 모듈과 세로판을 맞춘 뒤 다른 성인이 윗행을 지지합니다. 높이가 다른 세로판을 모두 확인합니다.',{slide:11}),
  step('행을 맞대고 체결','행을 조심스럽게 내리고 뒤에서 보호판을 대어 세로판을 번갈아 체결합니다.',{gap:0,slide:0}),
  step('백패널·벽 고정 복구','백패널을 하단부터 다시 체결하고 모든 끝선과 직각을 확인한 뒤 벽 고정을 복구합니다.',{tape:0})
 ]},
 {id:'lifting',title:'가구 세우기',mechanism:'lift',source:'/assembly/tylko/manuals/Tylko_166766_53pages.pdf#page=23',videos:['nO2MPDnBXDk'],images:[],initial:{angle:Math.PI/2},steps:[
  step('모든 부품 체결 확인','가구의 모든 연결이 체결됐는지 먼저 확인합니다. 보호면과 세울 공간을 확보합니다.'),
  step('세로판 중심 가까이 잡기','세로판의 중간에 가까운 곳을 잡습니다. 166766 예시 설명서는 2인 작업을 보여 주지만, 높은 가구 영상은 뒤에서 1명과 앞에서 최소 2명이 함께 들고 큰 가구에는 4명을 권장합니다. 해당 제품의 인원 지침을 따릅니다. 가로판 끝이나 도어를 잡아 들어올리지 않습니다.'),
  step('함께 세우기','가구를 지지하면서 천천히 세웁니다. 바닥이나 다리를 끌지 않습니다.',{angle:0}),
  step('벽 고정 전 최종 정렬','가구를 지지한 채 끝선·직각을 확인하고 제품별 위치에 벽 고정을 설치합니다.')
 ]},
 {id:'wall',title:'벽 고정',mechanism:'wall',source:guide(14),videos:[],images:[79],initial:{bracket:45,screw:25},steps:[
  step('제품별 위치 확인','브래킷 수와 위치는 해당 제품 설명서를 따릅니다. 원문은 가구에 벽 고정 구멍이 미리 뚫려 있지 않다고 명시합니다.'),
  step('벽과 브래킷 맞추기','배선·스위치 등 현장 조건을 확인하고 벽 재질에 맞는 체결 부품을 사용합니다. 제공 가이드의 벽-가구 최대 간격은 5cm입니다.',{bracket:0}),
  step('가구와 벽에 고정','목재용 나사로 가구 쪽을, 벽체에 맞는 고정부품으로 벽 쪽을 고정합니다. 예시 화면의 구멍 위치를 실제 타공 좌표로 사용하지 않습니다.',{screw:0}),
  step('고정 상태 확인','브래킷의 체결과 가구의 안정 상태를 확인한 뒤 사용합니다.')
 ]},
 {id:'transport',title:'운반 보호·스티커·관리',mechanism:'care',source:low(25),videos:['lFmHbD2uVLU'],images:[],initial:{gap:0},steps:[
  step('부품 위치 기록','분해 전에 부품의 위치와 라벨을 기록합니다. 재조립 시 원래 위치를 찾을 수 있어야 합니다.'),
  step('금속 부품 보호','힌지·레일·손잡이가 다른 판을 긁지 않게 배치합니다. 각 판 사이에 골판지를 넣고 돌출 금속은 완충재로 감쌉니다.',{gap:18}),
  step('평평하게 적재','보호한 판을 바닥에 평평하게 쌓습니다. 느슨한 세로판이 달린 모듈은 운반하지 않습니다.'),
  step('스티커와 표면 관리','스티커를 먼저 천천히 떼고 순한 세정제로 닦습니다. 떼기 전에 스티커를 적시면 제거하기 어려워질 수 있습니다. 조립 예시 매뉴얼 마지막 페이지의 표면 관리 안내를 확인하고 열·화기와 과도한 습기를 피합니다.')
 ]}
];

export const chapterById = (id: string) => chapters.find(c => c.id === id) ?? chapters[0];
const clamp = (n: number) => Number.isFinite(n) ? Math.max(0,Math.min(1,n)) : 0;
/** Accumulate each previous step; seeking is deterministic and independent of playback history. */
export function samplePose(chapter: Chapter, index: number, progress: number): Pose {
 const at = Math.max(0,Math.min(chapter.steps.length-1,Number.isFinite(index)?Math.floor(index):0));
 const before = {...chapter.initial};
 for(let i=0;i<at;i++)Object.assign(before,chapter.steps[i].pose);
 const end = {...before,...chapter.steps[at].pose};const t=clamp(progress);const eased=t*t*(3-2*t);
 return Object.fromEntries(Object.entries(end).map(([key,n])=>[key,(before[key]??0)+(n-(before[key]??0))*eased]));
}
export function canComplete(index: number, progress: number, completed: ReadonlySet<number>) {
 return progress>=1 && Number.isInteger(index) && index>=0 && Array.from({length:index},(_,i)=>i).every(i=>completed.has(i));
}
