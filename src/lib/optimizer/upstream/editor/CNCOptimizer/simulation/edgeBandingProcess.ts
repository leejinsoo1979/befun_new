import type { OptimizedResult } from '../types';
import type { MaterialConfig } from '@/lib/optimizer/upstream/store/core/spaceConfigStore';
import { bandAngles as angles, bandPasses, cursorAt, interpolate, type BandEdge, type MachiningProgram, type Point3, type ReplayBandPass, type ReplayStep } from './program';
import { panelBanding } from './panelBanding';
import { replayPose } from './replayPose';
import { rotatePoint, rotatedBounds, subtractPoint, worldPoint } from './stockTransform';
import { referenceHandlingMmPerSecond } from './panelSawProcess';

/** 공개 S-200 1130 FC 길이/이송. 내부 스테이션 배치는 공정 설명용이며 제조사 CAD가 아니다. */
export const banderReference = {
  length: 4605, feedMmPerMinute: 11000,
  preMill: 510, glue: 850, pressure: 1020, endTrim: 1780, trim: 2450, scrape: 3100, buff: 3650,
} as const;
/** 기존 진입/출구 여유를 판재 사이에도 둔다. 실기종의 최소 투입 간격을 인증하는 값은 아니다. */
export const referenceBandClearance = 180;
export interface BandingOptions { thickness: number; material: MaterialConfig; feedMmPerMinute?: number }
export const bandLength = (size: Point3, edge: BandEdge) => edge === 'top' || edge === 'bottom' ? size[0] : size[1];
export const bandAngle = (edge: BandEdge) => angles[edge];
export function bandPoint(size: Point3, edge: BandEdge, fromLeading: number): Point3 {
  return edge === 'bottom' ? [size[0]-fromLeading,0,size[2]/2] : edge === 'top' ? [fromLeading,size[1],size[2]/2]
    : edge === 'left' ? [0,fromLeading,size[2]/2] : [size[0],size[1]-fromLeading,size[2]/2];
}
type DraftStep = ReplayStep extends infer S ? S extends ReplayStep ? Omit<S, 'id' | 'stockId'> : never : never;

/** 직사각 재단 뒤, 같은 테이프·두께의 판재를 한 면씩 묶어 연속 투입한다. */
export function appendEdgeBanding(input: MachiningProgram, result: OptimizedResult, options: BandingOptions): MachiningProgram {
  if (!input.setup) throw new Error('엣지 공정에는 작업대가 필요합니다.');
  if (input.steps.some(s => s.kind === 'drill' || s.kind === 'mill')) throw new Error('엣지는 홈·따내기·보링 전에 부착해야 합니다.');
  const feed = options.feedMmPerMinute ?? banderReference.feedMmPerMinute;
  if (![options.thickness, feed].every(v => Number.isFinite(v) && v > 0)) throw new Error('엣지 테이프 두께와 밴더 이송속도를 입력해 주십시오.');
  if (options.thickness > 3) throw new Error('현재 참조 밴더는 3mm 이하 테이프를 사용합니다.');
  const stocks = input.stocks.map(s => ({ ...s })), steps: ReplayStep[] = [...input.steps];
  const end = replayPose(input, input.steps.reduce((n, s) => n + s.durationMs, 0));
  // 기존 작업대와 겹치지 않는 독립 공정. 원장 좌표와 제조 치수는 건드리지 않는다.
  const extent = Math.max(...input.stocks.flatMap(s => s.size));
  const origin: Point3 = [0, input.setup.tableDepth + extent + 1200, 0];
  const stagingTables = [...(input.setup.stagingTables ?? [])];
  const omitted = [...(input.machiningAudit?.omitted ?? [])];
  const time = (from: Point3, to: Point3) => Math.max(100, Math.hypot(...subtractPoint(from, to)) / referenceHandlingMmPerSecond * 1000);
  const positions = [...end.positions], rotations = [...end.angles];
  const groups = new Map<string, number[]>();
  // 앞쪽 판재를 가로질러 꺼내지 않도록 복귀 통로(Y+)에 가까운 판재부터 투입한다.
  const pickup = stocks.map((stock, index) => ({ stock, index,
    back: positions[index][1] + rotatedBounds(stock.size, rotations[index]).maxY })).sort((a, b) => b.back - a.back);
  let previousFinish = '', groupNumber = 0;
  for (const { index, stock } of pickup) {
    if (stock.purpose !== 'panel' || !stock.panel) continue;
    const panel = result.panels.find(p => p.id === stock.panel!.id)!;
    const finish = panelBanding(panel, stock.size[2], options.thickness, options.material);
    omitted.push(...finish.omitted); stock.edgeBands = finish.bands;
    if (!stock.edgeBands.length) continue;
    const key = JSON.stringify([stock.size[2], [...new Set(stock.edgeBands.map(b => JSON.stringify([b.color, b.thickness])))]]);
    // 다른 재질의 대기 판재를 넘어서 집지 않는다. 연속된 동일 재질끼리 묶는다.
    if (key !== previousFinish) { groupNumber++; previousFinish = key; }
    const group = `${groupNumber}:${key}`;
    groups.set(group, [...(groups.get(group) ?? []), index]);
  }
  const moveStock = (index: number, to: Point3, label: string) => {
    if (Math.hypot(...subtractPoint(positions[index], to)) < 1e-6) return;
    steps.push({ kind: 'position', from: positions[index], to, id: `banding-${steps.length}`, stockId: stocks[index].id,
      label, durationMs: time(positions[index], to), station: 'edgebander', handling: 'manual' });
    positions[index] = to;
  };
  let maxQueue = 0, maxWidth = 0;
  // 회수대는 입·출구 컨베이어와 별도다. 각 판재의 자리를 재사용해 라운드마다 대기대가 늘지 않는다.
  const parking = new Map<number, Point3>();
  let outputX = origin[0];
  // 회전 대각선까지 포함한 복귀 통로와 완료 적재 영역을 분리한다.
  const returnSpan = Math.max(...[...groups.values()].flat().map(i => Math.hypot(stocks[i].size[0], stocks[i].size[1])), 0);
  for (const indices of groups.values()) for (const index of indices) {
    const size = Math.hypot(stocks[index].size[0], stocks[index].size[1]);
    // 회수 통로 옆 한 줄에 놓는다. 앞 판재를 꺼내며 뒤 판재의 자리를 가로지르지 않는다.
    const lower: Point3 = [outputX, origin[1] + extent + returnSpan + 700, 0];
    parking.set(index, [lower[0] + size / 2, lower[1] + size / 2, 0]);
    stagingTables.push({ position: lower, size: [size, size] });
    outputX += size + 100;
  }
  const prepare = (index: number, bandIndex: number, leading: number) => {
    const stock = stocks[index], band = stock.edgeBands![bandIndex];
    let position = positions[index], angle = rotations[index];
    const push = (step: DraftStep) => steps.push({ ...step, id: `banding-${steps.length}`, stockId: stock.id });
    const move = (to: Point3, label: string) => {
      moveStock(index, to, label);
      position = to;
    };
    // 되돌림은 기계 옆 회수 동선으로 한다. 기계 내부를 거꾸로 관통하지 않는다.
    let bounds = rotatedBounds(stock.size, angle);
    const sideCenterY = origin[1] + extent + 600 + Math.hypot(stock.size[0], stock.size[1]) / 2;
    move([position[0], sideCenterY - (bounds.minY + bounds.maxY) / 2, 0], '작업자 · 엣지 투입대 이동');
    const targetAngle = angles[band.edge];
    const nextBounds = rotatedBounds(stock.size, targetAngle);
    // 다음 투입 자리의 중심으로 바로 복귀한다. 먼 회수대/기계 길이만큼의 우회를 만들지 않는다.
    const centerX = origin[0] + leading - (nextBounds.maxX - nextBounds.minX) / 2;
    move([centerX - (bounds.minX + bounds.maxX) / 2, position[1], 0], '작업자 · 옆 통로로 다음 면 복귀');
    if (Math.abs(targetAngle - angle) > 1e-6) {
      const center = worldPoint([stock.size[0] / 2, stock.size[1] / 2, 0], position, angle);
      push({ kind: 'turn', center, fromAngle: angle, toAngle: targetAngle, label: '작업자 · 다음 엣지 면으로 회전', durationMs: 1300, station: 'edgebander', handling: 'manual' });
      angle = targetAngle;
      position = subtractPoint(center, rotatePoint([stock.size[0] / 2, stock.size[1] / 2, 0], angle));
      positions[index] = position;
    }
    bounds = rotatedBounds(stock.size, angle);
    // 먼저 대기열의 자기 X 위치에 선 뒤 가이드로 내려온다. 이미 정렬한 판재를 가로지르지 않는다.
    move([position[0], origin[1] - bounds.minY, 0], '작업자 · 기준 가이드에 밀착');
    rotations[index] = angle;
    maxWidth = Math.max(maxWidth, bounds.maxY - bounds.minY);
  };
  for (const indices of groups.values()) {
    // 묶음은 가장 긴 면도 입구에 들어가는 크기로 고정한다. 같은 묶음의 모든 면을 처리한 뒤 적재한다.
    const batches: number[][] = [];
    let pending: number[] = [], queueLength = 0;
    for (const index of indices) {
      const length = Math.max(...stocks[index].edgeBands!.map(b => bandLength(stocks[index].size, b.edge)));
      if (pending.length && queueLength + referenceBandClearance + length > banderReference.length) {
        batches.push(pending); pending = []; queueLength = 0;
      }
      queueLength += (pending.length ? referenceBandClearance : 0) + length;
      pending.push(index);
    }
    if (pending.length) batches.push(pending);
    for (const members of batches) {
      const rounds = Math.max(...members.map(i => stocks[i].edgeBands!.length));
      for (let bandIndex = 0; bandIndex < rounds; bandIndex++) {
        const batch = members.filter(i => stocks[i].edgeBands![bandIndex]);
        let leading = -referenceBandClearance;
        for (const index of batch) {
          prepare(index, bandIndex, leading);
          leading -= bandLength(stocks[index].size, stocks[index].edgeBands![bandIndex].edge) + referenceBandClearance;
        }
        const span = -leading - referenceBandClearance * 2;
        maxQueue = Math.max(maxQueue, span);
        const distance = banderReference.length + span + referenceBandClearance * 2;
        const id = `banding-${steps.length}`;
        const passes: ReplayBandPass[] = batch.map((index, n) => ({ id: n ? `${id}-panel-${n}` : id,
          stockId: stocks[index].id, bandIndex, from: positions[index],
          to: [positions[index][0] + distance, positions[index][1], 0] }));
        steps.push({ ...passes[0], kind: 'band', concurrent: passes.slice(1), station: 'edgebander',
          label: `${batch.length}장 연속 투입 · ${bandIndex + 1}번째 엣지 · 접착·마감`, durationMs: distance / feed * 60000 });
        for (const [n, index] of batch.entries()) positions[index] = passes[n].to;
        // 다음 면이 있으면 출구에서 바로 복귀한다. 완료한 판재만 회수대에 한 번 적재한다.
        for (const index of batch.filter(i => bandIndex + 1 === stocks[i].edgeBands!.length)) {
          const bounds = rotatedBounds(stocks[index].size, rotations[index]), destination = parking.get(index)!;
          moveStock(index, [positions[index][0], origin[1] + extent + 600 - bounds.minY, 0], '작업자 · 엣지 묶음 회수');
          moveStock(index, [destination[0] - (bounds.minX + bounds.maxX) / 2, positions[index][1], 0], '작업자 · 회수대 이동');
          moveStock(index, [positions[index][0], destination[1] - (bounds.minY + bounds.maxY) / 2, 0],
            '작업자 · 엣지 완료 판재 적재');
        }
      }
    }
  }
  if (!steps.some(s => s.kind === 'band')) return { ...input, stocks, machiningAudit: { ...input.machiningAudit!, omitted } };
  stagingTables.push(
    { position: [origin[0] - referenceBandClearance - maxQueue, origin[1], 0], size: [maxQueue, maxWidth] },
    { position: [origin[0] + banderReference.length + referenceBandClearance, origin[1], 0], size: [maxQueue, maxWidth] },
  );
  return { ...input, stocks, steps, setup: { ...input.setup, stagingTables, bander: { origin, length: banderReference.length, feedMmPerMinute: feed } },
    machiningAudit: { ...input.machiningAudit!, omitted }, source: { ...input.source, label: `${input.source.label} → 엣지 접착·마감`, machineModel: `${input.source.machineModel} / 단면 자동 밴더 참조` } };
}

/** 스테이션을 통과한 길이만 바뀐다. 정지/배속/되감기도 동일 시각으로 복원한다. */
export function bandingAt(program: MachiningProgram, elapsedMs: number) {
  const cursor = cursorAt(program, elapsedMs);
  return bandPasses(program).flatMap(step => {
    const index = step.stepIndex;
    if (index > cursor.index || !program.setup?.bander) return [];
    const stock = program.stocks.find(s => s.id === step.stockId)!;
    const band = stock.edgeBands![step.bandIndex];
    const length = bandLength(stock.size, band.edge), angle = angles[band.edge];
    const bounds = rotatedBounds(stock.size, angle);
    const position = interpolate(step.from, step.to, index === cursor.index ? cursor.progress : 1);
    const leading = position[0] + bounds.maxX - program.setup.bander.origin[0];
    const passed = (at: number) => Math.max(0, Math.min(length, leading - at));
    return [{ id: step.id, stock, band, angle, position, length, leading, active: index === cursor.index,
      millCenter: leading - banderReference.preMill,
      glued: passed(banderReference.glue), pressed: passed(banderReference.pressure), trimmed: passed(banderReference.trim),
      scraped: passed(banderReference.scrape), buffed: passed(banderReference.buff),
      frontCut: leading >= banderReference.endTrim, backCut: leading - length >= banderReference.endTrim }];
  });
}

export type BandingState = ReturnType<typeof bandingAt>[number];
/** 동시에 통과하는 묶음에서 아직 마감 중인 선두 판재를 좌우 화면이 함께 추적한다. */
export function focusedBanding(states: BandingState[]) {
  const current = states.filter(s => s.active);
  return current.find(s => s.leading >= banderReference.preMill && s.buffed < s.length)
    ?? current.find(s => s.leading < banderReference.preMill) ?? current.at(-1);
}
/** 3D/배치도는 현재 판재가 통과하는 같은 장치를 함께 본다. */
export function bandingContact(state: BandingState) {
  const stations = [
    [banderReference.preMill, '엣지 프리밀링'], [banderReference.pressure, '엣지 공급·압착'],
    [banderReference.endTrim, '엣지 끝단 절단'], [banderReference.trim, '엣지 상하 다듬기'],
    [banderReference.scrape, '엣지 스크레이핑'], [banderReference.buff, '엣지 버핑'],
  ] as const;
  // 판재 중앙이 진행하는 구간의 장치를 선택하고 접점은 판재 끝을 벗어나지 않는다.
  const center = state.leading - state.length / 2;
  const [station, label] = stations.reduce((best, candidate) => Math.abs(candidate[0] - center) < Math.abs(best[0] - center) ? candidate : best);
  const distance = Math.max(0, Math.min(state.length, state.leading - station));
  return { station, label, local: bandPoint(state.stock.size, state.band.edge, distance), distance };
}

/** 다음 면을 밀링하면 앞서 부착한 테이프의 끝도 잘린다. 모서리에 두 띠를 포개지 않는다. */
export function bandTapeRange(state: BandingState, states: BandingState[]) {
  let start = 0, end = state.length;
  const index = states.indexOf(state);
  for (const later of states.slice(index + 1)) {
    if (later.stock.id !== state.stock.id || (['top','bottom'].includes(later.band.edge) === ['top','bottom'].includes(state.band.edge))) continue;
    for (const fromLeading of [0, state.length]) {
      const p = bandPoint(state.stock.size, state.band.edge, fromLeading);
      const edge = later.band.edge;
      const onEdge = edge === 'left' ? p[0] === 0 : edge === 'right' ? p[0] === state.stock.size[0] : edge === 'bottom' ? p[1] === 0 : p[1] === state.stock.size[1];
      const distance = edge === 'bottom' ? state.stock.size[0]-p[0] : edge === 'top' ? p[0] : edge === 'left' ? p[1] : state.stock.size[1]-p[1];
      if (onEdge && later.millCenter >= distance + 40) {
        if (fromLeading === 0) start = Math.max(start, later.band.thickness);
        else end = Math.min(end, state.length-later.band.thickness);
      }
    }
  }
  return { start, end };
}
