import { validateConnectorSlots } from './exporters/connectorMpr'; // [Befun 확장]
import type { PanelBoringData } from './types';
import { collectManufacturingBlock, formatManufacturingBlockMessage } from './manufacturingBlock';

/** 디자인 좌표와 분리해 제조 파트너가 관리하는 MPR 장비 설정. 기본 공구 번호를 추정하지 않는다. */
export interface MprMachineProfile {
  /** 미지정된 기존 설정은 woodWOP 출력을 유지한다. */
  postprocessor?: 'woodwop' | 'swj-cam';
  id: string;
  machineName: string;
  woodwopVersion: string;
  origin: 'lower-left-inner-face-up';
  zOrigin: 'workpiece-bottom';
  maxLength: number;
  maxWidth: number;
  maxThickness: number;
  drillDiameters: number[];
  maxDrillDepth: number;
  horizontalDrilling: boolean;
  router: {
    number: number;
    diameter: number;
    cuttingLength: number;
    maxPassDepth: number;
    throughOvercut: number;
    feedRate: number;
    spindleSpeed: number;
  };
  grooveTool: { number: number; kerf: number; maxDepth: number; feedRate: number };
}

export function validateMprMachineProfile(profile?: MprMachineProfile): string[] {
  if (!profile) return ['제조 파트너의 MPR 장비 설정이 등록되지 않았습니다.'];
  const errors: string[] = [];
  if (profile.postprocessor && !['woodwop', 'swj-cam'].includes(profile.postprocessor)) errors.push('지원하지 않는 MPR 수신 프로그램입니다.');
  // 제공된 ImportMpr.dll은 TNO=113을 하면 윤곽으로 해석한다.
  if (profile.postprocessor === 'swj-cam' && profile.router?.number === 113) errors.push('SWJ CAM에서는 따내기 공구 번호 113이 하면 가공으로 해석됩니다. 다른 공구 번호를 등록하세요.');
  if (![profile.id, profile.machineName, profile.woodwopVersion].every(v => typeof v === 'string' && v.trim())) errors.push('장비 식별자·기종·CAM 버전이 필요합니다.');
  if (profile.origin !== 'lower-left-inner-face-up' || profile.zOrigin !== 'workpiece-bottom') errors.push('지원하는 적재 기준은 가공면 위·좌하단 원점·판재 바닥 Z=0입니다.');
  const positive = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0;
  const fields = [profile.maxLength, profile.maxWidth, profile.maxThickness, profile.maxDrillDepth,
    profile.router?.number, profile.router?.diameter, profile.router?.cuttingLength, profile.router?.maxPassDepth,
    profile.router?.feedRate, profile.router?.spindleSpeed, profile.grooveTool?.number, profile.grooveTool?.kerf, profile.grooveTool?.maxDepth, profile.grooveTool?.feedRate];
  if (!fields.every(positive)) errors.push('장비 범위와 공구 번호·치수·이송·회전수는 0보다 큰 유한한 값이어야 합니다.');
  if (!Number.isInteger(profile.router?.number) || !Number.isInteger(profile.grooveTool?.number)) errors.push('공구 번호는 양의 정수여야 합니다.');
  if (!Number.isFinite(profile.router?.throughOvercut) || profile.router.throughOvercut < 0) errors.push('관통 여유 깊이는 0 이상의 값이어야 합니다.');
  if (!Array.isArray(profile.drillDiameters) || !profile.drillDiameters.length || !profile.drillDiameters.every(positive)) errors.push('장비에 등록된 드릴 지름이 필요합니다.');
  if (typeof profile.horizontalDrilling !== 'boolean') errors.push('수평 보링 지원 여부가 필요합니다.');
  return errors;
}

/** 생산 파일은 배치 전체를 검사한 뒤 한꺼번에 생성한다. 일부만 성공한 발주 ZIP을 만들지 않는다. */
export function validateMprProduction(panels: PanelBoringData[], profile?: MprMachineProfile): string[] {
  // 확정되지 않은 가공은 장비 설정보다 먼저 막는다. 설정이 없어도 통과시키지 않는다.
  const blocked = collectManufacturingBlock(panels);
  if (blocked.blocked) return [formatManufacturingBlockMessage(blocked, 'MPR')];
  const errors = validateMprMachineProfile(profile);
  if (errors.length || !profile) return errors;
  if (!panels.length) return ['내보낼 판재가 없습니다.'];
  const eps = 0.0001;
  const positive = (n: number) => Number.isFinite(n) && n > 0;
  for (const panel of panels) {
    const fail = (message: string) => errors.push(`${panel.panelName || panel.panelId}: ${message}`);
    if (![panel.width, panel.height, panel.thickness].every(positive)) { fail('판재 치수가 유효하지 않습니다.'); continue; }
    if (panel.width > profile.maxLength || panel.height > profile.maxWidth || panel.thickness > profile.maxThickness) fail('장비의 가공 가능 판재 크기를 초과합니다.');
    if (panel.isMirrored) fail('미러 판재는 실제 가공 좌표로 변환한 뒤 내보내야 합니다.');
    for (const b of panel.borings) {
      if (![b.x, b.y, b.diameter, b.depth].every(Number.isFinite) || !positive(b.diameter) || !positive(b.depth)) { fail(`보링 ${b.id}의 좌표·지름·깊이가 유효하지 않습니다.`); continue; }
      if (b.x < -eps || b.x > panel.width + eps || b.y < -eps || b.y > panel.height + eps) fail(`보링 ${b.id}가 판재 범위를 벗어납니다.`);
      if (!['top', 'bottom', 'left', 'right', 'front', 'back'].includes(b.face)) { fail(`보링 ${b.id}: 가공면이 유효하지 않습니다.`); continue; }
      if (b.toolNumber !== undefined) fail(`보링 ${b.id}: 개별 공구 번호 대신 공장 드릴 지름 설정을 사용해야 합니다.`);
      if (b.type === 'drawer-rail-slot' || b.slotWidth || b.slotHeight) fail(`보링 ${b.id}: 장공을 원형 보링으로 대체할 수 없습니다.`);
      if (b.face === 'bottom') fail(`보링 ${b.id}: 하면 가공은 별도 적재 프로그램이 필요합니다.`);
      const horizontal = b.face !== 'top' && b.face !== 'bottom';
      if (horizontal && !profile.horizontalDrilling) fail(`보링 ${b.id}: 장비의 수평 보링 설정이 없습니다.`);
      if (b.angle !== undefined && b.angle !== ({left:0,right:180,front:90,back:-90,top:90,bottom:90}[b.face])) fail(`보링 ${b.id}: 비직각 보링은 전용 포스트가 필요합니다.`);
      const diameter = b.note === 'fixed-panel-through' ? 6 : b.diameter;
      const effectiveDepth = b.note === 'fixed-panel-through' ? panel.thickness : b.depth;
      if (!profile.drillDiameters.some(d => Math.abs(d - diameter) < eps)) fail(`보링 ${b.id}: Ø${diameter} 드릴이 장비에 등록되지 않았습니다.`);
      if (effectiveDepth > profile.maxDrillDepth) fail(`보링 ${b.id}: 장비의 보링 깊이를 초과합니다.`);
      if (!horizontal && !b.note?.includes('가장자리 개방') && (b.x - diameter / 2 < -eps || b.x + diameter / 2 > panel.width + eps || b.y - diameter / 2 < -eps || b.y + diameter / 2 > panel.height + eps)) fail(`보링 ${b.id}: 구멍 외곽이 판재 밖으로 나갑니다.`);
      if (horizontal) {
        const edge = {left: b.x, right: b.x - panel.width, front: b.y, back: b.y - panel.height}[b.face as 'left'|'right'|'front'|'back'];
        if (Math.abs(edge) > eps) fail(`보링 ${b.id}: 마구리 보링 시작점이 해당 모서리에 있지 않습니다.`);
        const span = b.face === 'left' || b.face === 'right' ? panel.width : panel.height;
        const across = b.face === 'left' || b.face === 'right' ? b.y : b.x;
        const acrossSpan = b.face === 'left' || b.face === 'right' ? panel.height : panel.width;
        if (across - diameter / 2 < -eps || across + diameter / 2 > acrossSpan + eps) fail(`보링 ${b.id}: 마구리 구멍 외곽이 판재 밖으로 나갑니다.`);
        const z = b.z ?? panel.thickness / 2;
        if (!Number.isFinite(z) || z - diameter / 2 < -eps || z + diameter / 2 > panel.thickness + eps) fail(`보링 ${b.id}: 두께 방향 구멍 외곽이 판재 밖으로 나갑니다.`);
        if (b.depth >= span || diameter > panel.thickness) fail(`보링 ${b.id}: 마구리 보링 깊이·지름이 판재 범위를 초과합니다.`);
      }
    }
    const notches = panel.sideNotches ?? [];
    for (const n of notches) {
      if (![n.y,n.z].every(positive) || !Number.isFinite(n.fromBottom) || n.fromBottom < 0 || n.fromBottom+n.y > panel.width+eps || n.z >= panel.height) fail('목찬넬 따내기가 판재 범위를 벗어납니다.');
      if (!['side-left','side-right'].includes(panel.panelType) || /서랍|도어/.test(panel.panelName)) fail('목찬넬 따내기의 측판 가공면을 결정할 수 없습니다.');
      if (profile.router.diameter > Math.min(n.y, n.z)) fail('목찬넬 따내기보다 공구 지름이 큽니다.');
    }
    for (const b of panel.borings.filter(b => b.face === 'top')) {
      const radius = (b.note === 'fixed-panel-through' ? 6 : b.diameter) / 2;
      const right = panel.panelType === 'side-right' || panel.panelName.includes('우측');
      for (const n of notches) {
        const x0 = panel.width - n.fromBottom - n.y, x1 = panel.width - n.fromBottom;
        const y0 = right ? panel.height - n.z : 0, y1 = right ? panel.height : n.z;
        const closestX = Math.max(x0, Math.min(b.x, x1)), closestY = Math.max(y0, Math.min(b.y, y1));
        if (Math.hypot(b.x - closestX, b.y - closestY) < radius - eps) fail(`보링 ${b.id}가 목찬넬 따내기 영역과 겹칩니다.`);
      }
    }
    const sorted = [...notches].sort((a,b) => a.fromBottom-b.fromBottom);
    if (sorted.some((n,i) => i > 0 && n.fromBottom <= sorted[i-1].fromBottom+sorted[i-1].y+eps)) fail('겹치거나 맞닿은 목찬넬 따내기는 윤곽을 합친 뒤 가공해야 합니다.');
    if (notches.length && panel.thickness+profile.router.throughOvercut > profile.router.cuttingLength) fail('따내기 깊이가 공구 유효 날길이를 초과합니다.');
    if (notches.length && Math.ceil((panel.thickness+profile.router.throughOvercut)/profile.router.maxPassDepth)>1000) fail('따내기 절삭 횟수가 과도합니다. 공구 설정을 확인하세요.');
    if (panel.backPanelGroove) {
      const g=panel.backPanelGroove;
      if (!['side-left','side-right'].includes(panel.panelType) || /서랍|도어/.test(panel.panelName)) fail('백패널 홈의 측판 가공면을 결정할 수 없습니다.');
      if (!Number.isFinite(g.offset) || g.offset < 0 || !positive(g.width) || g.width < profile.grooveTool.kerf || g.offset+g.width>panel.height || !positive(g.depth) || g.depth>=panel.thickness || g.depth>profile.grooveTool.maxDepth) fail('백패널 홈의 위치·폭·깊이가 유효하지 않습니다.');
    }
    // [Befun 확장] 커넥터 슬롯
    errors.push(...validateConnectorSlots(panel, profile));
    for (const g of panel.groovePositions ?? []) {
      if (!Number.isFinite(g.y) || g.y<0 || !positive(g.height) || g.height < profile.grooveTool.kerf || g.y+g.height>panel.width || !positive(g.depth) || g.depth>=panel.thickness || g.depth>profile.grooveTool.maxDepth) fail('서랍 바닥홈의 위치·폭·깊이가 유효하지 않습니다.');
    }
  }
  return errors;
}
