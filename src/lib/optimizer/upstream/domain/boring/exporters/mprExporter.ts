/**
 * MPR 내보내기 (imos 포맷)
 * imos CNC 프로그램 형식 (.mpr)
 */

import { generateConnectorSlotsMpr, splitBottomSide } from './connectorMpr'; // [Befun 확장]
import type {
  PanelBoringData,
  Boring,
  MPRExportSettings,
  BoringExportResult,
  BoringType,
} from '../types';
import { DEFAULT_MPR_EXPORT_SETTINGS } from '../constants';
import { encodeCp949 } from './cp949Encoder';
import { validateMprProduction, type MprMachineProfile } from '../mprProduction';
import { getMprCompanionFiles } from './swjPackage';

// 미리보기는 장비 설정과 분리한다. 생산 출력은 profile의 관통 여유를 사용한다.
const CONTOUR_CUT_DEPTH_MM = 0;
const safeMprText = (text: string) => text.replace(/["\r\n\x00-\x1f]/g, ' ');

// ============================================
// imos MPR 블록 생성
// ============================================

/**
 * [H 헤더 블록 생성
 */
function generateIMOSHeader(panel: PanelBoringData, version: string = '4.0 Alpha'): string {
  return `[H
VERSION="${version}"
OP="2"
INCH="0"

`;
}

/**
 * [001 패널 변수 블록 생성
 */
function generateIMOSVariables(panel: PanelBoringData): string {
  return `[001
l="${formatMprDecimal4(panel.width)}"
KM="length"
w="${formatMprDecimal4(panel.height)}"
KM="width"
t="${formatMprDecimal4(panel.thickness)}"
KM="thickness"
L="l"
KM="length"
B="w"
KM="width"
D="t"
KM="thickness"


`;
}

/**
 * <100 \Werkstck\ 워크피스 블록 생성
 */
function generateWerkstck(): string {
  return `
<100 \\Werkstck\\
LA="l"
BR="w"
DI="t"
AX="0.0000"
AY="0.0000"
FNX="0.0000"
FNY="0.0000"

`;
}

/**
 * <101 \Kommentar\ 주석 블록 생성
 */
function generateKommentar(panel: PanelBoringData, projectName: string = ''): string {
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').slice(0, 19);

  const materialName = panel.material || 'PB_18T';

  return `<101 \\Kommentar\\
KM="오더:   ${safeMprText(projectName)}"
KM="조각:   ${safeMprText(panel.panelName)}"
KM="측정 단위:   mm"
KM="마감 치수:   ${panel.width} x ${panel.height} x ${panel.thickness}"
KM="자재:   ${safeMprText(materialName)}"
KM="바코드:   ${safeMprText(panel.panelId)}"
KM="생성 시간:   ${dateStr}"
KAT="Kommentar"
MNM="파트 정보"
ORI=""

`;
}

/**
 * <102 \BohrVert\ 수직 보링 블록 생성
 */
function formatMprNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatMprCoordinate(value: number): string {
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function formatMprDecimal4(value: number): string {
  return value.toFixed(4);
}

function isFixedPanelThroughBoring(boring: Boring): boolean {
  return boring.note === 'fixed-panel-through';
}

function generateBohrVert(boring: Boring, panel: PanelBoringData): string {
  // 보링 타입별 기본값 설정
  let ti = boring.depth;        // 깊이
  let du = boring.diameter;      // 직경
  let wi = '';                  // 각도 (생략 가능)

  if (isFixedPanelThroughBoring(boring)) {
    ti = panel.thickness;
    du = 6;
  }

  // 각도 설정
  if (boring.angle !== undefined) {
    wi = `\nWI="${formatMprDecimal4(boring.angle)}"`;
  }

  return `<102 \\BohrVert\\
XA="${formatMprDecimal4(boring.x)}"
YA="${formatMprDecimal4(boring.y)}"
TI="${formatMprDecimal4(ti)}"
DU="${formatMprDecimal4(du)}"
BM="${ti >= panel.thickness ? 'LSL' : 'LS'}${boring.face === 'bottom' ? 'U' : ''}"
F_="STANDARD"
AN="1"
${wi ? `${wi}\n` : ''}

`;
}

function getHorizontalBoringAngle(boring: Boring): number {
  switch (boring.face) {
    case 'right':
      return 180;
    case 'front':
      return 90;
    case 'back':
      return -90;
    case 'left':
    default:
      return 0;
  }
}

/**
 * <103 \BohrHoriz\ 수평/측면 보링 블록 생성
 */
function generateBohrHoriz(boring: Boring, panel: PanelBoringData): string {
  const wi = boring.angle ?? getHorizontalBoringAngle(boring);
  const ti = boring.depth;
  const du = boring.diameter;
  const za = boring.z ?? panel.thickness / 2;

  const bm = { left: 'XP', right: 'XM', front: 'YP', back: 'YM' }[boring.face as 'left' | 'right' | 'front' | 'back'];
  return `<103 \\BohrHoriz\\
XA="${formatMprDecimal4(boring.x)}"
YA="${formatMprDecimal4(boring.y)}"
ZA="${formatMprDecimal4(za)}"
TI="${formatMprDecimal4(ti)}"
DU="${formatMprDecimal4(du)}"
BM="${bm}"
BM2="STD"
F_="STANDARD"
AN="1"
WI="${formatMprDecimal4(wi)}"

`;
}

function isRightSidePanel(panel: PanelBoringData): boolean {
  return panel.panelType === 'side-right'
    || panel.panelName.includes('우측판')
    || panel.panelName.includes('우측');
}

function isLeftSidePanel(panel: PanelBoringData): boolean {
  return panel.panelType === 'side-left'
    || panel.panelName.includes('좌측판')
    || panel.panelName.includes('좌측');
}

function isFurnitureSidePanelForBackPanelGroove(panel: PanelBoringData): boolean {
  const name = panel.panelName || '';
  if (panel.panelType !== 'side-left' && panel.panelType !== 'side-right') return false;
  if (name.includes('서랍') || name.includes('도어') || name.includes('Door')) return false;
  if (name.includes('서라운드') || name.includes('커튼박스')) return false;
  return name.includes('좌측') || name.includes('우측') || name.includes('측판');
}

interface SideNotchRect {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

function resolveSideNotchRect(
  panel: PanelBoringData,
  notch: { y: number; z: number; fromBottom: number }
): SideNotchRect | null {
  if (isFurnitureSidePanelForBackPanelGroove(panel)) {
    const notchWidth = Math.max(0, Math.min(notch.z, panel.width));
    const notchHeight = Math.max(0, Math.min(notch.y, panel.height));
    if (notchWidth <= 0 || notchHeight <= 0) return null;

    const startX = isRightSidePanel(panel)
      ? Math.max(0, panel.width - notchWidth)
      : 0;
    const startY = Math.max(0, Math.min(panel.height - notch.fromBottom - notchHeight, panel.height - notchHeight));

    return {
      startX,
      startY,
      width: notchWidth,
      height: notchHeight,
    };
  }

  const notchLength = Math.max(0, Math.min(notch.y, panel.width));
  const notchDepth = Math.max(0, Math.min(notch.z, panel.height));
  if (notchLength <= 0 || notchDepth <= 0) return null;

  const startX = Math.max(0, Math.min(notch.fromBottom, panel.width - notchLength));

  return {
    startX,
    startY: 0,
    width: notchLength,
    height: notchDepth,
  };
}

export interface BackPanelGrooveLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  centerX?: number;
  centerY?: number;
  width: number;
  depth: number;
}

export function resolveBackPanelGrooveLine(panel: PanelBoringData): BackPanelGrooveLine | null {
  if (!isFurnitureSidePanelForBackPanelGroove(panel) || !panel.backPanelGroove) return null;
  if (panel.height <= 26 || panel.width <= 0) return null;
  const previewBackPanelDepthOffset = panel.backPanelGroove.offset;
  const previewGrooveWidth = panel.backPanelGroove.width;
  const grooveCutDepth = panel.backPanelGroove.depth;
  const grooveStartY = isLeftSidePanel(panel)
    ? panel.height - previewBackPanelDepthOffset - previewGrooveWidth
    : previewBackPanelDepthOffset;
  const centerY = grooveStartY + previewGrooveWidth / 2;

  return {
    x1: 0,
    y1: centerY,
    x2: panel.width,
    y2: centerY,
    centerY,
    width: previewGrooveWidth,
    depth: grooveCutDepth,
  };
}

function generateContourBlock(
  blockNumber: number,
  name: string,
  points: Array<{ x: number; y: number }>,
  z: number = 0
): string {
  if (points.length < 2) return '';

  const [start, ...rest] = points;
  const lines = rest.map((point, index) => `$E${index + 1}
KL
X=${formatMprDecimal4(point.x)}
Y=${formatMprDecimal4(point.y)}
Z=${formatMprDecimal4(z)}
`).join('\n');

  const startFields = name === 'NEST'
    ? `X=${formatMprDecimal4(start.x)}
Y=${formatMprDecimal4(start.y)}
Z=${formatMprDecimal4(z)}
KO=00`
    : `KO=00
X=${formatMprDecimal4(start.x)}
Y=${formatMprDecimal4(start.y)}
Z=${formatMprDecimal4(z)}`;

  return `
]${blockNumber}
$E0
KP${name ? ` ${name}` : ''}
${startFields}

${lines}`;
}

function getBackPanelGrooveBlockNumber(panel: PanelBoringData): number | null {
  return resolveBackPanelGrooveLine(panel) ? 2 : null;
}

export function getSideNotchBlockNumber(panel: PanelBoringData, index: number, settings: Pick<MPRExportSettings, 'machineProfile'>): number {
  return (getBackPanelGrooveBlockNumber(panel) && settings.machineProfile?.postprocessor !== 'swj-cam' ? 3 : 2) + index;
}

export function getSideNotchContourPoints(panel: PanelBoringData, notch: { y: number; z: number; fromBottom: number }): Array<{ x: number; y: number }> {
  if (isFurnitureSidePanelForBackPanelGroove(panel)) {
    const notchDepth = Math.max(0, Math.min(notch.z, panel.height));
    const notchHeight = Math.max(0, Math.min(notch.y, panel.width));
    const panelH = panel.width;
    const isRightSide = isRightSidePanel(panel);
    const isTopEdge = Math.abs(notch.fromBottom + notch.y - panelH) < 0.0001;
    const frontEdgeY = isRightSide ? panel.height : 0;
    const notchInnerY = isRightSide ? panel.height - notchDepth : notchDepth;
    const notchBottomX = panel.width - notch.fromBottom;
    const notchTopX = panel.width - notch.fromBottom - notchHeight;

    if (notchDepth <= 0 || notchHeight <= 0) return [];

    const isBottomEdge = Math.abs(notch.fromBottom) < 0.0001;
    if (isTopEdge && isBottomEdge) return [{ x: notchTopX, y: notchInnerY }, { x: notchBottomX, y: notchInnerY }];
    if (isBottomEdge) return [
      { x: notchTopX, y: frontEdgeY },
      { x: notchTopX, y: notchInnerY },
      { x: notchBottomX, y: notchInnerY },
    ];
    return isTopEdge
      ? [
        { x: notchTopX, y: notchInnerY },
        { x: notchBottomX, y: notchInnerY },
        { x: notchBottomX, y: frontEdgeY },
      ]
      : [
        { x: notchTopX, y: frontEdgeY },
        { x: notchTopX, y: notchInnerY },
        { x: notchBottomX, y: notchInnerY },
        { x: notchBottomX, y: frontEdgeY },
      ];
  }

  const rect = resolveSideNotchRect(panel, notch);
  if (!rect) return [];

  const endX = rect.startX + rect.width;
  const endY = rect.startY + rect.height;
  const isFurnitureSide = isFurnitureSidePanelForBackPanelGroove(panel);
  const onTopEdge = isFurnitureSide
    ? Math.abs(endY - panel.height) < 0.001
    : Math.abs(endX - panel.width) < 0.001;
  const onBottomEdge = isFurnitureSide
    ? rect.startY <= 0.001
    : rect.startX <= 0.001;

  if (onTopEdge) {
    if (isFurnitureSide) {
      return isRightSidePanel(panel)
        ? [
          { x: rect.startX, y: endY },
          { x: rect.startX, y: rect.startY },
          { x: endX, y: rect.startY },
        ]
        : [
          { x: endX, y: endY },
          { x: endX, y: rect.startY },
          { x: rect.startX, y: rect.startY },
        ];
    }

    return [
      { x: endX, y: endY },
      { x: rect.startX, y: endY },
      { x: rect.startX, y: rect.startY },
    ];
  }

  if (onBottomEdge) {
    if (isFurnitureSide) {
      return isRightSidePanel(panel)
        ? [
          { x: endX, y: rect.startY },
          { x: rect.startX, y: rect.startY },
          { x: rect.startX, y: endY },
        ]
        : [
          { x: rect.startX, y: rect.startY },
          { x: endX, y: rect.startY },
          { x: endX, y: endY },
        ];
    }

    return [
      { x: rect.startX, y: rect.startY },
      { x: rect.startX, y: endY },
      { x: endX, y: endY },
    ];
  }

  return [
    { x: rect.startX, y: rect.startY },
    { x: rect.startX, y: endY },
    { x: endX, y: endY },
    { x: endX, y: rect.startY },
  ];
}

function generatePanelDisplayGeometry(panel: PanelBoringData, settings: MPRExportSettings): string {
  const sideNotches = panel.sideNotches ?? [];
  const backPanelGrooveLine = resolveBackPanelGrooveLine(panel);
  if (sideNotches.length === 0 && !backPanelGrooveLine) return '';

  let geometry = generateContourBlock(1, 'NEST', [
    { x: 0, y: 0 },
    { x: panel.width, y: 0 },
    { x: panel.width, y: panel.height },
    { x: 0, y: panel.height },
    { x: 0, y: 0 },
  ]);

  // SWJ에는 실제 Nuten만 전달한다. 가공과 무관한 홈 표시 윤곽은 넣지 않는다.
  if (backPanelGrooveLine && settings.machineProfile?.postprocessor !== 'swj-cam') {
    geometry += generateContourBlock(2, '', [
      { x: backPanelGrooveLine.x1, y: backPanelGrooveLine.y1 },
      { x: backPanelGrooveLine.x2, y: backPanelGrooveLine.y2 },
    ], CONTOUR_CUT_DEPTH_MM);
  }

  sideNotches.forEach((notch, index) => {
    const points = getSideNotchContourPoints(panel, notch);
    if (points.length < 2) return;
    geometry += generateContourBlock(getSideNotchBlockNumber(panel, index, settings), '', points, CONTOUR_CUT_DEPTH_MM);
  });

  return geometry;
}

function generateContourMilling(blockNumber: number, endIndex: number, panel: PanelBoringData, settings: MPRExportSettings): string {
  const tool = settings.purpose === 'production' ? settings.machineProfile?.router : undefined;
  // SWJ의 105 리더는 ??=0을 무시한다. 미리보기에는 실행 매크로를 만들지 않는다.
  if (!tool) return `<101 \\Kommentar\\
KM="PREVIEW MILLING EA=${blockNumber}:0 EE=${blockNumber}:${endIndex} RK=${isRightSidePanel(panel) ? 'WRKL' : 'WRKR'}"

`;
  const totalDepth = panel.thickness + tool.throughOvercut;
  const count = tool ? Math.ceil(totalDepth / tool.maxPassDepth) : 1;
  return Array.from({ length: count }, (_, index) => {
    const depth = tool ? Math.min(totalDepth, (index + 1) * tool.maxPassDepth) : panel.thickness;
    return `<105 \\Konturfraesen\\
EA="${blockNumber}:0"
EE="${blockNumber}:${endIndex}"
TNO="${tool?.number ?? 'PREVIEW_TOOL'}"
F_="${tool?.feedRate ?? 'STANDARD'}"
SM="1"
S_A="${tool?.spindleSpeed ?? 'STANDARD'}"
RK="${isRightSidePanel(panel) ? 'WRKL' : 'WRKR'}"
MDA="TAN"
MDE="TAN_AB"
AB="0"
ZA="${formatMprDecimal4(panel.thickness - depth)}"
KO="00"

`;
  }).join('');
}

function generateSideNotchPocket(panel: PanelBoringData, notch: { y: number; z: number; fromBottom: number }, index: number, settings: MPRExportSettings): string {
  const points = getSideNotchContourPoints(panel, notch);
  if (points.length < 2) return '';
  return generateContourMilling(getSideNotchBlockNumber(panel, index, settings), points.length - 1, panel, settings);
}

// 백패널·서랍 홈은 홈 가공 매크로 하나로 출력한다. 표시 윤곽에 별도 밀링을 붙이지 않는다.
function generateGroove(x1: number, y1: number, x2: number, y2: number, width: number, depth: number, settings: MPRExportSettings): string {
  const tool = settings.purpose === 'production' ? settings.machineProfile?.grooveTool : undefined;
  return `<109 \\Nuten\\
XA="${formatMprDecimal4(x1)}"
YA="${formatMprDecimal4(y1)}"
XE="${formatMprDecimal4(x2)}"
YE="${formatMprDecimal4(y2)}"
AN="0"
NB="${formatMprDecimal4(width)}"
RK="NOWRK"
EM="MOD0"
TI="${formatMprDecimal4(depth)}"
T_="${tool?.number ?? 'PREVIEW_TOOL'}"
XY="50.0000"
F_="${tool?.feedRate ?? 'STANDARD'}"
KO="00"

`;
}

function generateBackPanelGroovePocket(panel: PanelBoringData, settings: MPRExportSettings): string {
  const groove = resolveBackPanelGrooveLine(panel);
  return groove ? generateGroove(-1, groove.y1, panel.width + 1, groove.y2, groove.width, groove.depth, settings) : '';
}

/**
 * 서랍 측판 바닥판 끼움 홈.
 *
 * 서랍 측판의 MPR 프레임은 X = 높이(l), Y = 깊이(w)다
 * (resolveOptimizerBoringPoint: x = 높이 위치, y = 깊이 위치 — 앞/뒤판 체결홀과 같은 축).
 * 홈은 바닥에서 groove.y 올라간 자리에서 깊이 방향으로 판 전체를 지나가므로
 * X = groove.y ~ groove.y + 홈폭, Y = 0 ~ w 다.
 * 이전에는 X/Y가 뒤바뀌어 홈이 높이 방향으로 찍혔다(체결홀과 축이 어긋남).
 */
/**
 * 서랍 측판 바닥홈의 MPR 사각 영역 — 도면(판재 세부보기)과 포켓 출력이 같은 값을 쓴다.
 * X = groove.y ~ +홈폭 (l 축, 바닥 기준), Y = 0 ~ w (깊이 방향 전체).
 */
export function resolveDrawerBottomGrooveRect(
  panel: PanelBoringData,
  groove: { y: number; height: number; depth: number }
): { x: number; y: number; length: number; width: number; depth: number } | null {
  const grooveStartX = Math.max(0, Math.min(groove.y, panel.width));
  const grooveWidth = Math.max(0, Math.min(groove.height, panel.width - grooveStartX));
  const grooveDepth = Math.max(0, Math.min(groove.depth, panel.thickness));
  if (panel.height <= 0 || grooveWidth <= 0 || grooveDepth <= 0) return null;
  return { x: grooveStartX, y: 0, length: grooveWidth, width: panel.height, depth: grooveDepth };
}

function generateDrawerBottomGroovePocket(panel: PanelBoringData, groove: { y: number; height: number; depth: number }, settings: MPRExportSettings): string {
  const rect = resolveDrawerBottomGrooveRect(panel, groove);
  return rect ? generateGroove(rect.x + rect.length / 2, -1, rect.x + rect.length / 2, panel.height + 1, rect.length, rect.depth, settings) : '';
}

// ============================================
// 메인 내보내기 함수
// ============================================

/**
 * 단일 패널 imos MPR 생성
 */
export function generateSinglePanelMPR(
  panel: PanelBoringData,
  settings: MPRExportSettings = DEFAULT_MPR_EXPORT_SETTINGS,
  projectName: string = ''
): string {
  const production = settings.purpose === 'production';
  if (production) {
    const errors = validateMprProduction([panel], settings.machineProfile);
    if (errors.length) throw new Error(errors.join('\n'));
  }
  let mpr = '';

  // [H 헤더
  mpr += generateIMOSHeader(panel, settings.version || '4.0 Alpha');

  // [001 변수
  mpr += generateIMOSVariables(panel);

  // 목찬넬/백패널 홈 위치 표시용 윤곽선
  mpr += generatePanelDisplayGeometry(panel, settings);

  // [Befun 확장] 커넥터 슬롯 윤곽(블록 100번부터)
  const connectorSlots = generateConnectorSlotsMpr(panel, production ? settings.machineProfile : undefined, 100);
  mpr += connectorSlots.geometry;

  // <100 워크피스
  mpr += generateWerkstck();

  // <101 주석
  mpr += generateKommentar(panel, projectName);
  if (!production) mpr += '<101 \\Kommentar\\\nKM="PREVIEW ONLY - 가공 비활성 미리보기. 생산 파일은 제조 파트너 내보내기를 사용하세요."\n\n';

  // <102 보링들
  panel.borings.forEach((boring) => {
    if (boring.face === 'top' || boring.face === 'bottom') {
      mpr += generateBohrVert(boring, panel);
    } else {
      mpr += generateBohrHoriz(boring, panel);
    }
  });

  // [Befun 확장] 커넥터 슬롯 가공(보링 다음, 홈·따내기 전)
  mpr += connectorSlots.macros;

  mpr += generateBackPanelGroovePocket(panel, settings);

  panel.groovePositions?.forEach((groove) => {
    mpr += generateDrawerBottomGroovePocket(panel, groove, settings);
  });

  // 고정력이 필요한 보링·홈을 먼저 가공하고, 재료를 분리하는 따내기를 마지막에 수행한다.
  panel.sideNotches?.forEach((notch, index) => {
    mpr += generateSideNotchPocket(panel, notch, index, settings);
  });

  // 파일 끝 마커
  mpr += '!\n';

  // SWJ의 read_routing_contour는 ??=0을 읽어도 밀링을 등록한다.
  return production ? mpr : mpr.replace(/(<(?:102|103|109) [^\n]+\n)/g, '$1??="0"\n');
}

/**
 * imos MPR 내보내기 실행
 */
export function exportToMPR(
  panels: PanelBoringData[],
  settings?: Partial<MPRExportSettings>,
  projectName?: string
): Omit<BoringExportResult, 'files'> & { files: Array<{ filename: string; content: string; size: number; panelId?: string }> } {
  const finalSettings = { ...DEFAULT_MPR_EXPORT_SETTINGS, ...settings };

  try {
    const files: Array<{ filename: string; content: string; size: number; panelId?: string }> = [];

    // [Befun 확장] 하면 가공이 있는 판재는 반전 적재 프로그램을 별도 파일로 만든다.
    const programs = panels.flatMap((panel) => splitBottomSide(panel));
    const errors = validateMprProduction(programs.map(p => p.data), finalSettings.machineProfile);
    if (errors.length) throw new Error(errors.join('\n'));
    const usedNames = new Set<string>();
    // MPR은 패널별 개별 파일
    programs.forEach(({ data: panel, suffix: sideSuffix }) => {
      const content = generateSinglePanelMPR(panel, { ...finalSettings, purpose: 'production' }, projectName);
      // 파일명: panelName으로 (특수문자 제거)
      const safeName = [...panel.panelName.normalize('NFC')].map(char => encodeCp949(char).length === 1 && encodeCp949(char)[0] === 63 ? '_' : char).join('').replace(/[/\\:*?"<>|]/g, '_');
      const baseName = safeName.replace(/[\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').slice(0, 80) || 'panel';
      const stem = (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(baseName) ? `_${baseName}` : baseName) + sideSuffix;
      let filename = `${stem}.mpr`;
      let suffix = 2;
      while (usedNames.has(filename.toLowerCase())) filename = `${stem}_${suffix++}.mpr`;
      usedNames.add(filename.toLowerCase());
      files.push({
        filename,
        content,
        panelId: panel.panelId, // [Befun 확장] 하면 분리 시 파일↔판재 대응
        size: new Blob([encodeMPRContent(content) as BlobPart]).size,
      });
    });

    // 보링 타입별 개수 집계
    const boringsByType: Record<BoringType, number> = {} as Record<BoringType, number>;
    let totalBorings = 0;

    panels.forEach((panel) => {
      panel.borings.forEach((boring) => {
        boringsByType[boring.type] = (boringsByType[boring.type] || 0) + 1;
        totalBorings++;
      });
    });

    return {
      success: true,
      format: 'mpr',
      files,
      summary: {
        totalPanels: panels.length,
        totalBorings,
        boringsByType,
      },
    };
  } catch (error) {
    return {
      success: false,
      format: 'mpr',
      files: [],
      summary: {
        totalPanels: 0,
        totalBorings: 0,
        boringsByType: {} as Record<BoringType, number>,
      },
      error: error instanceof Error ? error.message : 'MPR 내보내기 실패',
    };
  }
}

// ============================================
// 다운로드 헬퍼
// ============================================

/**
 * MPR 파일 다운로드
 */
export function encodeMPRContent(content: string): Uint8Array {
  return encodeCp949(content.replace(/\r?\n/g, '\r\n'));
}

export function encodeMPRZipFileName(filename: string): string {
  return String.fromCharCode(...encodeCp949(filename));
}

export function downloadMPR(content: string, filename: string): void {
  const blob = new Blob([encodeMPRContent(content) as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadMPRAsZip(
  files: Array<{ filename: string; content: string }>,
  zipFilename: string = 'mpr_data.zip',
  machineProfile?: MprMachineProfile
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.filename, encodeMPRContent(file.content), { binary: true });
  });
  getMprCompanionFiles(machineProfile).forEach(file => {
    zip.file(file.filename, encodeMPRContent(file.content), { binary: true });
  });

  const blob = await zip.generateAsync({
    type: 'blob',
    encodeFileName: encodeMPRZipFileName,
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  generateSinglePanelMPR,
  exportToMPR,
  downloadMPR,
  downloadMPRAsZip,
};
