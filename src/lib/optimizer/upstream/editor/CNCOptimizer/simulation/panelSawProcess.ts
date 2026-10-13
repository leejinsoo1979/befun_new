import type { OptimizedResult } from '../types';
import type { MachiningProgram, Point3, ReplayStock, ReplayStep } from './program';
import { addPoint, flipPoint, localPoint, rotatedBounds, rotatePoint, subtractPoint, worldPoint } from './stockTransform';
import { panelMachining } from './panelMachining';
import { referenceRouting, type RoutingOptions } from './routingPaths';
import { replayPose } from './replayPose';

/** 수동 반송의 화면 재생 기준. 톱 절삭/펜스 속도 및 실제 장비 가공시간과 별개다. */
export const referenceHandlingMmPerSecond = 1000;

/**
 * 한 개의 고정 절단선에서 가공한다. 재투입은 작업자 취급으로 명시한다.
 * 기종/NC 미제공 상태의 공정 참조이며 설비 운전 프로그램으로 내보내지 않는다.
 * 절삭 형상은 판재 로컬, 기계 운동은 고정 작업대 좌표다.
 */
export function panelSawProcess(input: MachiningProgram, result: OptimizedResult, feed: number, routing: RoutingOptions = referenceRouting,
  beforeRouting?: (sawn: MachiningProgram) => MachiningProgram): MachiningProgram {
  let stocks = input.stocks.map(s => ({ ...s }));
  const saw = input.tools.find(t => t.kind === 'saw');
  if (!saw || saw.kind !== 'saw') throw new Error('톱 공구가 없습니다.');
  const size = stocks[0].size, span = Math.max(size[0], size[1]);
  const routerOrigin: Point3 = [span + 650, 0, 0];
  const steps: ReplayStep[] = [], tools = [...input.tools];
  const poses = new Map<string, { position: Point3; angle: number }>();
  // 대기 판재를 원장 좌표로 다시 조립하지 않는다. 비어 있는 가로 자리에 한 장씩 놓는다.
  // 이 간격/작업대는 공정 표시용이며 원본 배치·절단 치수·톱폭과 무관하다.
  const stagingGap = 100;
  const waiting = new Map<string, { x: number; y: number; width: number; height: number }>();
  let waitingWidth = 0, waitingHeight = 0, outputWidth = 0;
  const waitingX = span + 350;
  const outputOrigin: Point3 = [routerOrigin[0] + size[0] + 300, 0, 0];
  const waitingPlace = (stock: ReplayStock): Point3 => {
    const bounds = rotatedBounds(stock.size, poses.get(stock.id)!.angle);
    const width = bounds.maxX - bounds.minX, height = bounds.maxY - bounds.minY;
    const occupied = [...waiting.values()];
    const xs = [0, ...occupied.map(p => p.x + p.width + stagingGap)].sort((a,b) => a-b);
    const ys = [0, ...occupied.map(p => p.y + p.height + stagingGap)].sort((a,b) => a-b);
    // 긴 띠를 가로로 끝없이 늘어놓지 않고 가까운 빈 대기 자리에 둔다.
    const place = ys.flatMap(y => xs.map(x => ({x,y}))).find(p => p.x + width <= span + 1e-6 && occupied.every(q =>
      p.x + width + stagingGap <= q.x || q.x + q.width + stagingGap <= p.x ||
      p.y + height + stagingGap <= q.y || q.y + q.height + stagingGap <= p.y))!;
    const { x, y } = place;
    waiting.set(stock.id, { x, y, width, height });
    waitingWidth = Math.max(waitingWidth, x + width);
    waitingHeight = Math.max(waitingHeight, y + height);
    return [waitingX + x - bounds.minX, -bounds.maxY - 150 - y, 0];
  };
  const machiningAudit = { holeCount: 0, grooveCount: 0, notchCount: 0, omitted: [] as string[] };
  stocks[0].position = [0, -size[1] - 150, 0];
  poses.set(stocks[0].id, { position: stocks[0].position, angle: 0 });
  const id = () => `process-${steps.length}`;
  const duration = (a: Point3, b: Point3) => Math.max(80, Math.hypot(...subtractPoint(a, b)) / feed * 1000);
  const move = (stock: ReplayStock, target: Point3, label: string, station: 'saw' | 'router' = 'saw', handling: 'manual' | 'fence' = 'manual') => {
    const pose = poses.get(stock.id)!;
    if (Math.hypot(...subtractPoint(pose.position, target)) < 1e-6) return;
    steps.push({ id: id(), kind: 'position', stockId: stock.id, from: pose.position, to: target,
      label, station, handling, durationMs: handling === 'manual'
        ? Math.max(80, Math.hypot(...subtractPoint(pose.position, target)) / referenceHandlingMmPerSecond * 1000)
        : duration(pose.position, target) });
    pose.position = target;
  };
  const turn = (stock: ReplayStock, angle: number, station: 'saw' | 'router' = 'saw') => {
    const pose = poses.get(stock.id)!;
    if (Math.abs(angle - pose.angle) < 1e-6) return;
    const center = worldPoint([stock.size[0] / 2, stock.size[1] / 2, 0], pose.position, pose.angle);
    steps.push({ id: id(), kind: 'turn', stockId: stock.id, center, fromAngle: pose.angle, toAngle: angle,
      label: '작업자 · 지지 테이블 위 판재 회전', durationMs: 1800, station, handling: 'manual' });
    pose.angle = angle;
    pose.position = subtractPoint(center, rotatePoint([stock.size[0] / 2, stock.size[1] / 2, 0], angle));
  };
  const clamp = (stock: ReplayStock, closed: boolean, station: 'saw' | 'router' = 'saw') => steps.push({ id: id(), kind: 'clamp', stockId: stock.id,
    from: closed ? 0 : 1, to: closed ? 1 : 0, label: station === 'saw' ? closed ? '누름빔 하강 · 판재 고정' : '누름빔 상승 · 고정 해제'
      : closed ? '라우터 진공 고정' : '라우터 진공 해제', durationMs: 450, station });
  let sawWorld: Point3 = [-saw.diameter, 0, -saw.diameter / 2 - size[2]];
  const travel = (stock: ReplayStock, toWorld: Point3, label: string) => {
    const pose = poses.get(stock.id)!;
    steps.push({ id: id(), kind: 'travel', toolId: saw.id, stockId: stock.id, station: 'saw', label,
      from: localPoint(sawWorld, pose.position, pose.angle), to: localPoint(toWorld, pose.position, pose.angle),
      direction: rotatePoint([0, -1, 0], -pose.angle), durationMs: duration(sawWorld, toWorld) });
    sawWorld = toWorld;
  };
  const park = (stock: ReplayStock) => {
    const pose = poses.get(stock.id)!, bounds = rotatedBounds(stock.size, pose.angle);
    // 조각은 상판 높이에서 이동한다. 허공으로 들어 올리는 가상 반송을 만들지 않는다.
    move(stock, [pose.position[0], -150 - bounds.maxY, 0], '작업자 · 분리 판재를 앞쪽 지지대로 꺼냄');
    // 대기용 각도로 돌렸다가 재투입 때 되돌리는 동작을 만들지 않는다.
    move(stock, waitingPlace(stock), stock.purpose === 'offcut' ? '작업자 · 잔재 분리'
      : stock.purpose === 'panel' ? '작업자 · 완성 판재 반출' : '작업자 · 분리한 띠 재투입 대기');
  };
  const cutByStock = new Map(input.steps.filter(s => s.kind === 'saw').map(s => [s.stockId, s]));
  const axisOf = (s: Extract<ReplayStep, { kind: 'saw' }>) => s.from[0] === s.to[0] ? 'x' : 'y';
  // 옵티마이저의 절단 순서를 그대로 유지한다. 여기서는 이송·고정·공구 접근만 삽입한다.
  const ordered = input.steps.filter((s): s is Extract<ReplayStep, { kind: 'saw' }> => s.kind === 'saw');
  let onSawStockId: string | undefined;
  for (const [cutIndex, cut] of ordered.entries()) {
    const stock = stocks.find(s => s.id === cut.stockId)!;
    const alongY = cut.from[0] === cut.to[0];
    const center = alongY ? cut.from[0] : cut.from[1];
    // 원본 좌표의 작은 쪽을 앞쪽으로 보내 띠를 차례로 분리한다.
    const angle = alongY ? Math.PI / 2 : 0;
    const pose = poses.get(stock.id)!;
    const currentBounds = rotatedBounds(stock.size, pose.angle);
    // 누름빔과 겹치지 않는 앞쪽 회전 영역에서 방향을 바꾼 다음 프로그램 펜스로 이송한다.
    if (onSawStockId !== stock.id) {
      waiting.delete(stock.id);
      move(stock, [span / 2 - (currentBounds.minX + currentBounds.maxX) / 2, -Math.hypot(stock.size[0], stock.size[1]) / 2 - 150 - (currentBounds.minY + currentBounds.maxY) / 2, 0], '작업자 · 앞쪽 테이블로 재투입');
      turn(stock, angle);
    }
    const bounds = rotatedBounds(stock.size, angle);
    const cutPoint = rotatePoint(alongY ? [center, 0, 0] : [0, center, 0], angle);
    const target: Point3 = [onSawStockId === stock.id ? pose.position[0] : -bounds.minX || 0, -cutPoint[1] || 0, 0];
    if (onSawStockId !== stock.id) move(stock, [target[0], -bounds.maxY - 100, 0], '작업자 · 기준면 맞춤');
    move(stock, target, '프로그램 펜스 · 재단 치수로 이송', 'saw', 'fence');
    clamp(stock, true);
    let from = cut.from, to = cut.to;
    if (worldPoint(from, target, angle)[0] > worldPoint(to, target, angle)[0]) [from, to] = [to, from];
    const start = worldPoint(from, target, angle), end = worldPoint(to, target, angle);
    const lowered: Point3 = [start[0], 0, -saw.diameter / 2 - size[2]];
    travel(stock, lowered, '톱 캐리지 · 절단선 아래 시작점 복귀');
    travel(stock, start, '톱날 상승');
    steps.push({ ...cut, label: cut.label, from, to, station: 'saw' });
    sawWorld = end;
    const children = stocks.filter(s => s.availableAfter === cut.id);
    for (const child of children) {
      const delta = subtractPoint(child.sourceOrigin!, stock.sourceOrigin!);
      child.position = worldPoint(delta, target, angle); child.angle = angle;
      poses.set(child.id, { position: child.position, angle });
    }
    travel(stock, [end[0], 0, lowered[2]], '톱날 하강 · 절단선 아래 복귀');
    clamp(stock, false);
    // 앞쪽 조각부터 꺼낸다. 뒤쪽 조각이 앞쪽 판재를 가로질러 지나가지 않게 한다.
    const back = children[children.length - 1], following = back && cutByStock.get(back.id);
    const next = following && ordered[cutIndex + 1]?.id === following.id ? back : undefined;
    onSawStockId = next && following && axisOf(following) === axisOf(cut) ? next.id : undefined;
    // 바로 다음 재단 대상은 옆 대기대로 내보냈다 다시 가져오지 않는다.
    // 방향 전환이 필요할 때만 다음 순회에서 앞 지지대로 당겨 돌린다.
    for (const child of children) if (child !== next) park(child);
  }
  const stagingTables: NonNullable<MachiningProgram['setup']>['stagingTables'] = [];
  if (waitingWidth > 0) stagingTables.push({ position: [waitingX, -150 - waitingHeight, 0], size: [waitingWidth, waitingHeight] });
  let process: MachiningProgram = { ...input, stocks, tools, steps, machiningAudit,
    setup: { kind: 'panel-saw-router', cuttingLength: span, tableDepth: Math.hypot(size[0], size[1]) + 300, routerOrigin, stagingTables },
    source: { label: '옵티마이저 배치 · 재단', machineModel: '고정 절단선 컷쏘 / 라우터 공정 참조', verifiedSequence: false } };
  // 엣지 부착은 직사각 재단이 끝난 뒤, 홈·따내기·보링보다 먼저 한다.
  // 다음 공정은 앞 공정의 실제 종료 위치/각도에서 이어져야 한다.
  if (beforeRouting) {
    process = beforeRouting(process);
    stocks = process.stocks;
    steps.splice(0, steps.length, ...process.steps);
    const end = replayPose(process, steps.reduce((n, s) => n + s.durationMs, 0));
    stocks.forEach((stock, index) => poses.set(stock.id, { position: end.positions[index], angle: end.angles[index] }));
    machiningAudit.omitted.push(...(process.machiningAudit?.omitted ?? []));
  }
  // 원장이 이미 완성 패널 하나인 경우에도 다음 공정에 연결한다.
  for (const stock of stocks.filter(s => s.purpose === 'panel')) {
    if (!poses.has(stock.id)) poses.set(stock.id, { position: stock.position, angle: stock.angle ?? 0 });
    const panel = result.panels.find(p => p.id === stock.panel?.id)!;
    const operations = panelMachining(panel, stock.size[2], routing);
    machiningAudit.omitted.push(...operations.omitted);
    if (!operations.holes.length && !operations.routes.length && !operations.edgeSlots.length) continue;
    waiting.delete(stock.id);
    turn(stock, 0, 'router');
    move(stock, routerOrigin, '작업자 · 재단 판재를 라우터에 투입', 'router');
    clamp(stock, true, 'router');
    // 한 가공면을 모두 마친 뒤 다음 면으로 간다. 면 안의 원본 순서와 모든 가공 수치는 보존한다.
    const faces = new Map<string, typeof operations.holes>();
    for (const hole of operations.holes) {
      const group = faces.get(hole.face) ?? [];
      group.push(hole); faces.set(hole.face, group);
    }
    const bitLength = (diameter: number) => Math.max(90, ...operations.holes.filter(h => h.diameter === diameter).map(h => h.depth + 30));
    const clearance = stock.size[2] + Math.max(90, ...operations.holes.map(h => h.depth + 30)) + 100;
    let flipped = false;
    const safeZ = () => flipped ? stock.size[2] - clearance : clearance;
    const dock = (): Point3 => [-150, flipped ? stock.size[1] + 150 : -150, safeZ()];
    let routerPosition: Point3 = dock();
    let activeTool: string | undefined;
    let activeDirection: Point3 = [0, 0, -1];
    const routerTravel = (to: Point3, direction: Point3, toolId: string, label: string, time?: number) => {
      if (Math.hypot(...subtractPoint(routerPosition, to)) < 1e-6) return;
      steps.push({ id: id(), kind: 'travel', stockId: stock.id, station: 'router', toolId, label,
        from: routerPosition, to, direction, durationMs: time ?? duration(routerPosition, to) });
      routerPosition = to;
    };
    const returnToDock = () => {
      if (!activeTool) return;
      routerTravel([routerPosition[0], routerPosition[1], safeZ()], activeDirection, activeTool, '안전 높이로 복귀');
      routerTravel(dock(), activeDirection, activeTool, '공구 교환 위치로 복귀');
    };
    const refixture = (bottom: boolean) => {
      if (flipped === bottom) return;
      returnToDock();
      clamp(stock, false, 'router');
      steps.push({ id: id(), kind: 'flip', stockId: stock.id, station: 'router', handling: 'manual',
        fromAngle: flipped ? Math.PI : 0, toAngle: bottom ? Math.PI : 0, durationMs: 1800,
        label: bottom ? '작업자 · 들어 올려 하면 위로 반전' : '작업자 · 상면 위로 복귀' });
      clamp(stock, true, 'router');
      // 후퇴 공구는 월드 좌표에 머문다. 다음 경로의 로컬 표현만 새 자세로 환산한다.
      routerPosition = flipPoint(routerPosition, stock.size, Math.PI);
      flipped = bottom;
      activeTool = undefined;
      activeDirection = [0, 0, bottom ? 1 : -1];
    };
    // 하면 가공은 공구 후퇴·고정 해제·반전·재고정 뒤에만 수행한다.
    for (const route of operations.routes) {
      refixture(route.face === 'bottom');
      const length = Math.max(90, route.depth + 30), toolId = `router-${route.diameter}-${length}`;
      if (!tools.some(t => t.id === toolId)) tools.push({ id: toolId, kind: 'drill', purpose: 'milling', diameter: route.diameter,
        length, tipLength: 0, rpm: routing.rpm, appearance: { cuttingLength: length * .7, shankDiameter: route.diameter,
          coreDiameter: route.diameter * .5, flutes: 2, helixAngleDeg: 30, fluteOpeningDeg: 120 } });
      if (activeTool !== toolId) {
        returnToDock();
        steps.push({ id: id(), kind: 'hold', stockId: stock.id, station: 'router', label: `루터 공구 선택 · Ø${route.diameter} mm`, durationMs: 600 });
      }
      activeTool = toolId; activeDirection = [0,0,flipped ? 1 : -1];
      const passes = route.singlePass ? 1 : Math.ceil(route.depth / routing.maxPassDepth); // [Befun 확장] 키홀 커터는 한 번에
      for (let pass=1; pass<=passes; pass++) for (const [pathIndex,path] of route.paths.entries()) {
        const depth = Math.min(route.depth,pass*routing.maxPassDepth);
        const points = path.map(([x,y,z]):Point3=>[x,y,z+(flipped ? depth : -depth)]);
        const first = points[0], last = points[points.length-1];
        routerTravel([routerPosition[0],routerPosition[1],safeZ()],activeDirection,toolId,'루터 안전 높이로 상승');
        routerTravel([first[0],first[1],safeZ()],activeDirection,toolId,'루터 진입점으로 이동');
        // 홈 양끝·열린 따내기 윤곽 바깥에서 내려온다. 판재 안의 공중 이동을 만들지 않는다.
        routerTravel(first,activeDirection,toolId,route.plunge ? '키홀 커터 수직 진입 · 전체 깊이' : '판재 바깥에서 절삭 깊이로 진입',700);
        for(let j=1;j<points.length;j++) steps.push({ id:id(),kind:'mill',stockId:stock.id,station:'router',toolId,
          featureId:route.id,operation:route.operation,face:route.face,depth,from:points[j-1],to:points[j],
          releaseOffcut:route.operation==='notch' && pass===passes && pathIndex===route.paths.length-1 && j===points.length-1 ? route.offcut : undefined,
          label:`${stock.name} · ${route.label} · ${pass}/${passes}회 · 깊이 ${depth} mm`,
          durationMs:Math.max(250,Math.hypot(...subtractPoint(points[j],points[j-1]))/feed*1000) });
        routerPosition = last;
        routerTravel([last[0],last[1],safeZ()],activeDirection,toolId,'홈·따내기 완료 · 공구 상승');
      }
      if(route.operation==='groove') machiningAudit.grooveCount++; else machiningAudit.notchCount++;
    }
    refixture(false);
    // [Befun 확장] 마구리 커넥터 슬롯: 앵글헤드가 마구리 바깥에서 접근 → 진입 → 마구리 길이 방향 이동 → 후퇴.
    for (const slot of operations.edgeSlots) {
      const length = Math.max(60, slot.depth + 30), toolId = `slot-${slot.diameter}-${length}`;
      if (!tools.some(t => t.id === toolId)) tools.push({ id: toolId, kind: 'drill', purpose: 'milling', diameter: slot.diameter,
        length, tipLength: 0, rpm: Math.min(routing.rpm, 18000), appearance: { cuttingLength: slot.depth + 2, shankDiameter: Math.min(slot.diameter, 8),
          coreDiameter: slot.diameter * .5, flutes: 2, helixAngleDeg: 0, fluteOpeningDeg: 120 } });
      if (activeTool !== toolId) {
        returnToDock();
        steps.push({ id: id(), kind: 'hold', stockId: stock.id, station: 'router', label: `앵글헤드 커넥터 커터 선택 · ${slot.label}`, durationMs: 600 });
      }
      const d = slot.direction, scale = (k: number): Point3 => d.map(v => v * k) as Point3;
      const outside = subtractPoint(slot.from, scale(100));
      routerTravel([routerPosition[0], routerPosition[1], safeZ()], activeDirection, toolId, '안전 높이로 상승');
      routerTravel([outside[0], outside[1], safeZ()], d, toolId, '앵글헤드 · 마구리 앞으로 이동');
      routerTravel(outside, d, toolId, '마구리 슬롯 높이로 하강');
      routerTravel(slot.from, d, toolId, '마구리 면 접근', 700);
      steps.push({ id: id(), kind: 'drill', stockId: stock.id, station: 'router', toolId, label: `${stock.name} · ${slot.label} · 진입 ${slot.depth} mm`,
        surface: slot.from, direction: d, depth: slot.depth, durationMs: Math.max(600, slot.depth / 10 * 1000) });
      const inFrom = addPoint(slot.from, scale(slot.depth)), inTo = addPoint(slot.to, scale(slot.depth));
      steps.push({ id: id(), kind: 'mill', stockId: stock.id, station: 'router', toolId, featureId: slot.id, operation: 'groove', face: slot.face, depth: slot.depth,
        from: inFrom, to: inTo, label: `${stock.name} · ${slot.label} · 이동 ${Math.hypot(...subtractPoint(inTo, inFrom)).toFixed(1)} mm`,
        durationMs: Math.max(400, Math.hypot(...subtractPoint(inTo, inFrom)) / feed * 1000) });
      routerPosition = inTo;
      routerTravel(slot.to, d, toolId, '마구리 슬롯 완료 · 공구 후퇴', 600);
      routerTravel(subtractPoint(slot.to, scale(100)), d, toolId, '마구리 바깥으로 이탈');
      activeTool = toolId; activeDirection = d;
      machiningAudit.grooveCount = (machiningAudit.grooveCount ?? 0) + 1;
    }
    // [Befun 확장] 하면 보링은 상면·마구리 보링 뒤 반전 재고정해서 가공한다.
    const bottomHoles = [...faces.values()].flat().filter(h => h.face === 'bottom');
    for (const hole of [...faces.values()].flat().filter(h => h.face !== 'bottom')) {
      const length = bitLength(hole.diameter);
      const toolId = `drill-${hole.diameter}-${length}`;
      if (!tools.some(t => t.id === toolId)) {
        tools.push({ id: toolId, kind: 'drill', diameter: hole.diameter, length, tipLength: 0, rpm: 6000,
          appearance: { cuttingLength: length * .7, shankDiameter: hole.diameter, coreDiameter: hole.diameter * .5, flutes: 2, helixAngleDeg: 30, fluteOpeningDeg: 120 } });
      }
      const changedTool = activeTool !== toolId;
      const sameFace = !changedTool && activeDirection.every((v, i) => v === hole.direction[i]);
      if (changedTool) {
        returnToDock();
        steps.push({ id: id(), kind: 'hold', stockId: stock.id, station: 'router', label: `보링 공구 선택 · Ø${hole.diameter} mm`, durationMs: 600 });
      }
      const safe = subtractPoint(hole.surface, hole.direction.map(v => v * 100) as Point3);
      const end = addPoint(hole.surface, hole.direction.map(v => v * hole.depth) as Point3);
      if (!sameFace) {
        // 다른 가공면으로 갈 때만 상부 안전면을 경유한다. 마구리 사이를 판재 관통하며 이동하지 않는다.
        if (activeTool && !changedTool) routerTravel([routerPosition[0], routerPosition[1], safeZ()], activeDirection, toolId, '가공면 전환 · 안전 높이로 상승');
        routerTravel([safe[0], safe[1], clearance], hole.direction, toolId, '안전 높이에서 보링 위치로 이동');
      }
      routerTravel(safe, hole.direction, toolId, sameFace ? '안전면에서 다음 홀로 이동' : '가공면 바깥에서 접근 높이로 이동');
      routerTravel(hole.surface, hole.direction, toolId, '가공면으로 공구 접근', 700);
      steps.push({ id: id(), kind: 'drill', stockId: stock.id, station: 'router', toolId, label: `${stock.name} · Ø${hole.diameter} / 깊이 ${hole.depth} mm`, surface: hole.surface, direction: hole.direction, depth: hole.depth, durationMs: Math.max(700, hole.depth / 15 * 1000) });
      routerPosition = end;
      routerTravel(safe, hole.direction, toolId, '보링 완료 · 공구 후퇴', 700);
      activeTool = toolId; activeDirection = hole.direction;
      machiningAudit.holeCount++;
    }
    if (bottomHoles.length) {
      refixture(true);
      for (const hole of bottomHoles) {
        const length = bitLength(hole.diameter), toolId = `drill-${hole.diameter}-${length}`;
        if (!tools.some(t => t.id === toolId)) tools.push({ id: toolId, kind: 'drill', diameter: hole.diameter, length, tipLength: 0, rpm: 6000,
          appearance: { cuttingLength: length * .7, shankDiameter: hole.diameter, coreDiameter: hole.diameter * .5, flutes: 2, helixAngleDeg: 30, fluteOpeningDeg: 120 } });
        if (activeTool !== toolId) {
          returnToDock();
          steps.push({ id: id(), kind: 'hold', stockId: stock.id, station: 'router', label: `보링 공구 선택 · Ø${hole.diameter} mm (하면)`, durationMs: 600 });
        }
        const safe = subtractPoint(hole.surface, hole.direction.map(v => v * 100) as Point3);
        routerTravel([routerPosition[0], routerPosition[1], safeZ()], hole.direction, toolId, '안전 높이로 상승');
        routerTravel([hole.surface[0], hole.surface[1], safeZ()], hole.direction, toolId, '하면 보링 위치로 이동');
        routerTravel(safe, hole.direction, toolId, '가공면 바깥에서 접근 높이로 이동');
        routerTravel(hole.surface, hole.direction, toolId, '가공면으로 공구 접근', 700);
        steps.push({ id: id(), kind: 'drill', stockId: stock.id, station: 'router', toolId, label: `${stock.name} · 하면 Ø${hole.diameter} / 깊이 ${hole.depth} mm`, surface: hole.surface, direction: hole.direction, depth: hole.depth, durationMs: Math.max(700, hole.depth / 15 * 1000) });
        routerPosition = addPoint(hole.surface, hole.direction.map(v => v * hole.depth) as Point3);
        routerTravel(safe, hole.direction, toolId, '보링 완료 · 공구 후퇴', 700);
        activeTool = toolId; activeDirection = hole.direction;
        machiningAudit.holeCount++;
      }
      refixture(false);
    }
    // 공구를 바꾸거나 판재 가공이 끝날 때만 대기 위치로 복귀한다.
    returnToDock();
    clamp(stock, false, 'router');
    move(stock, [outputOrigin[0] + outputWidth, outputOrigin[1], 0], '작업자 · 가공 판재 반출', 'router');
    outputWidth += stock.size[0] + stagingGap;
  }
  if (outputWidth > 0) process.setup!.stagingTables!.push({ position: outputOrigin, size: [outputWidth - stagingGap, size[1]] });
  return { ...process, stocks, tools, steps, machiningAudit,
    source: { ...process.source, label: `${process.source.label} → 홈·따내기 → 보링` } };
}
