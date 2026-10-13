// [Befun 확장] 커넥터 슬롯(OVVO 키홀) MPR 출력과 하면 가공 분리. src/lib/optimizer/connectors 참고.
import type { Boring, BoringFace, ConnectorSlot, PanelBoringData } from '../types';
import type { MprMachineProfile } from '../mprProduction';

const f4 = (n: number) => n.toFixed(4);
const EDGE_FACES: BoringFace[] = ['left', 'right', 'front', 'back'];

/**
 * woodWOP 측면 작업 평면(KO). 표준 좌표계 00(상면) 외의 측면 평면 번호는 기계·woodWOP 설정마다 다르다.
 * 공장 시험 가공으로 확인하기 전까지 아래 값은 가정이며, 파일에 확인 필요 주석을 남긴다.
 */
export const EDGE_PLANE_KO: Record<'left' | 'right' | 'front' | 'back', string> = { front: '01', right: '02', back: '03', left: '04' };

/** 하면(bottom) 가공이 있는 판재를 상면 프로그램과 반전 적재 프로그램으로 나눈다. 반전은 X축 기준(y → height − y). */
export function splitBottomSide(panel: PanelBoringData): Array<{ data: PanelBoringData; suffix: string }> {
  const bottomBorings = panel.borings.filter((b) => b.face === 'bottom');
  const bottomSlots = (panel.connectorSlots ?? []).filter((s) => s.face === 'bottom');
  if (!bottomBorings.length && !bottomSlots.length) return [{ data: panel, suffix: '' }];
  const top: PanelBoringData = {
    ...panel,
    borings: panel.borings.filter((b) => b.face !== 'bottom'),
    connectorSlots: (panel.connectorSlots ?? []).filter((s) => s.face !== 'bottom'),
  };
  const flipY = (y: number) => panel.height - y;
  const bottom: PanelBoringData = {
    ...panel,
    panelId: `${panel.panelId}__bottom`,
    panelName: `${panel.panelName} (하면)`,
    borings: bottomBorings.map((b): Boring => ({ ...b, face: 'top', y: flipY(b.y) })),
    connectorSlots: bottomSlots.map((s): ConnectorSlot => ({ ...s, face: 'top', y1: flipY(s.y1), y2: flipY(s.y2) })),
    sideNotches: undefined, groovePositions: undefined, backPanelGroove: undefined,
  };
  return [{ data: top, suffix: '' }, { data: bottom, suffix: '' }];
}

/** 커넥터 슬롯 검증. MPR 생산 파일에 넣기 전 판재 범위·공구 번호를 확인한다. */
export function validateConnectorSlots(panel: PanelBoringData, profile: MprMachineProfile): string[] {
  const errors: string[] = [];
  const eps = 0.0001;
  for (const s of panel.connectorSlots ?? []) {
    const fail = (m: string) => errors.push(`${panel.panelName || panel.panelId}: 커넥터 슬롯 ${s.id} ${m}`);
    if (![s.x1, s.y1, s.x2, s.y2, s.width, s.depth].every(Number.isFinite) || s.width <= 0 || s.depth <= 0) { fail('치수가 유효하지 않습니다.'); continue; }
    if (s.toolNumber === undefined) fail(`— ${s.connector} 커터의 공구 번호가 등록되지 않았습니다.`);
    if (s.face === 'bottom') fail('— 하면 가공은 별도 적재 프로그램이 필요합니다.');
    if ([s.x1, s.x2].some((x) => x < -eps || x > panel.width + eps) || [s.y1, s.y2].some((y) => y < -eps || y > panel.height + eps)) fail('가 판재 범위를 벗어납니다.');
    if (s.face === 'top' || s.face === 'bottom') {
      if (s.depth >= panel.thickness) fail('깊이가 판재 두께 이상입니다.');
    } else {
      if (!profile.horizontalDrilling) fail('— 마구리 가공(앵글헤드) 설정이 없습니다.');
      const z = s.z ?? panel.thickness / 2;
      if (z - s.width / 2 < -eps || z + s.width / 2 > panel.thickness + eps) fail('폭이 판재 두께를 벗어납니다.');
    }
  }
  return errors;
}

function contour(block: number, points: Array<{ x: number; y: number }>, ko: string, z = 0): string {
  const [start, ...rest] = points;
  return `
]${block}
$E0
KP
KO=${ko}
X=${f4(start.x)}
Y=${f4(start.y)}
Z=${f4(z)}

${rest.map((p, i) => `$E${i + 1}
KL
X=${f4(p.x)}
Y=${f4(p.y)}
Z=${f4(z)}
`).join('\n')}
`;
}

/**
 * 커넥터 슬롯 MPR 블록. 키홀 커터는 프로파일 공구라 전체 깊이를 한 번에 내려가 이동 후 같은 경로로 빠진다.
 * - 상면: 표준 좌표계(KO=00) 직선 윤곽 + 105 윤곽 밀링(공구 중심 RK=NOWRK, ZA = 두께 − 깊이).
 * - 마구리: 측면 작업 평면(EDGE_PLANE_KO) 직선 윤곽. 평면 좌표는 (마구리 길이 방향, 두께 방향 높이). 공장 확인 필요.
 */
export function generateConnectorSlotsMpr(panel: PanelBoringData, profile: MprMachineProfile | undefined, startBlock: number): { geometry: string; macros: string } {
  let geometry = '', macros = '';
  (panel.connectorSlots ?? []).forEach((s, index) => {
    const block = startBlock + index;
    const tool = profile ? s.toolNumber ?? 'UNSET' : 'PREVIEW_TOOL';
    if (s.face === 'top') {
      geometry += contour(block, [{ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }], '00');
      macros += `<101 \\Kommentar\\
KM="커넥터 ${s.connector} ${s.label ?? ''} 폭 ${s.width} 깊이 ${s.depth}"

<105 \\Konturfraesen\\
EA="${block}:0"
EE="${block}:1"
TNO="${tool}"
F_="STANDARD"
SM="1"
S_A="STANDARD"
RK="NOWRK"
MDA="SEN"
MDE="SEN_AB"
AB="0"
ZA="${f4(panel.thickness - s.depth)}"
KO="00"

`;
      return;
    }
    if (!EDGE_FACES.includes(s.face)) return;
    const face = s.face as 'left' | 'right' | 'front' | 'back';
    // 마구리 평면 좌표: 가로 = 마구리 길이 방향(left/right는 y, front/back은 x), 세로 = 두께 방향 높이 z
    const along = (x: number, y: number) => (face === 'left' || face === 'right' ? y : x);
    const z = s.z ?? panel.thickness / 2;
    geometry += contour(block, [{ x: along(s.x1, s.y1), y: z }, { x: along(s.x2, s.y2), y: z }], EDGE_PLANE_KO[face]);
    macros += `<101 \\Kommentar\\
KM="커넥터 ${s.connector} ${s.label ?? ''} 마구리 ${face} 폭 ${s.width} 깊이 ${s.depth} — 측면 평면 KO=${EDGE_PLANE_KO[face]} 공장 확인 필요(앵글헤드)"

<105 \\Konturfraesen\\
EA="${block}:0"
EE="${block}:1"
TNO="${tool}"
F_="STANDARD"
SM="1"
S_A="STANDARD"
RK="NOWRK"
MDA="SEN"
MDE="SEN_AB"
AB="0"
ZA="${f4(-s.depth)}"
KO="${EDGE_PLANE_KO[face]}"

`;
  });
  return { geometry, macros };
}
