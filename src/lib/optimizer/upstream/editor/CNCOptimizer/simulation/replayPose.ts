import { cursorAt, interpolate, MILL_FACE_DIRECTION, type MachiningProgram, type Point3 } from './program';
import { flipPoint, flippedWorldPoint, rotatePoint, rotatedBounds, subtractPoint } from './stockTransform';

/** 공구·누름빔·판재의 좌표와 회전을 같은 시각에서 계산한다. 탐색에도 상태가 남지 않는다. */
export function replayPose(program: MachiningProgram, elapsedMs: number) {
  const cursor = cursorAt(program, elapsedMs);
  const step = program.steps[Math.min(cursor.index, program.steps.length - 1)];
  const stockPose = (id: string, through: number, progress: number) => {
    const stock = program.stocks.find(s => s.id === id)!;
    let position = stock.position, angle = stock.angle ?? 0, flip = 0;
    for (let i = 0; i <= through && i < program.steps.length; i++) {
      const current = program.steps[i], linear = i === through ? progress : 1;
      // 밴더 옆 수동 반송만 가감속한다. 접착 이송/절삭의 실제 속도 계약은 그대로다.
      const t = current.station === 'edgebander' && current.handling === 'manual'
        ? linear * linear * (3 - 2 * linear) : linear;
      if (current.kind === 'band') {
        const pass = current.stockId === id ? current : current.concurrent?.find(p => p.stockId === id);
        if (pass) position = interpolate(pass.from, pass.to, t);
        continue;
      }
      if (current.stockId !== id) continue;
      if (current.kind === 'flip') flip = current.fromAngle + (current.toAngle - current.fromAngle) * t;
      if (current.kind === 'position') position = interpolate(current.from, current.to, t);
      if (current.kind === 'turn') {
        const difference = current.toAngle - current.fromAngle;
        const turn = current.station === 'edgebander' ? Math.atan2(Math.sin(difference), Math.cos(difference)) : difference;
        angle = t === 1 ? current.toAngle : current.fromAngle + turn * t;
        position = subtractPoint(current.center, rotatePoint([stock.size[0] / 2, stock.size[1] / 2, 0], angle));
      }
    }
    return { position, angle, flip };
  };
  const poses = program.stocks.map(s => stockPose(s.id, cursor.index, cursor.progress));
  const positions = poses.map(p => p.position), angles = poses.map(p => p.angle), flips = poses.map(p => p.flip);
  const completed = (id: string) => program.steps.findIndex(s => s.id === id) < cursor.index;
  const visible = program.stocks.map(s => (!s.availableAfter || completed(s.availableAfter)) && (!s.retiredAfter || !completed(s.retiredAfter)));
  let clamp = 0;
  let fence: { minX: number; maxX: number; y: number } | undefined;
  let foundClamp = false;
  for (let i = Math.min(cursor.index, program.steps.length - 1); i >= 0; i--) {
    const s = program.steps[i];
    if (!fence && s.kind === 'position' && s.handling === 'fence') {
      const at = stockPose(s.stockId, i, i === cursor.index ? cursor.progress : 1);
      const b = rotatedBounds(program.stocks.find(stock => stock.id === s.stockId)!.size, at.angle);
      fence = { minX: at.position[0] + b.minX, maxX: at.position[0] + b.maxX, y: at.position[1] + b.maxY + 26 };
    }
    if (!foundClamp && s.kind === 'clamp') { clamp = s.from + (s.to - s.from) * (i === cursor.index ? cursor.progress : 1); foundClamp = true; }
    if (fence && foundClamp) break;
  }
  let toolIndex = Math.min(cursor.index, program.steps.length - 1);
  while (toolIndex >= 0 && !('toolId' in program.steps[toolIndex])) toolIndex--;
  const toolStep = program.steps[toolIndex];
  const tool = step?.station !== 'edgebander' && toolStep && 'toolId' in toolStep ? program.tools.find(t => t.id === toolStep.toolId) : undefined;
  const progress = toolIndex === cursor.index ? cursor.progress : 1;
  let local: Point3 | undefined;
  let direction: Point3 = [0, 0, -1];
  if (toolStep?.kind === 'saw' || toolStep?.kind === 'travel' || toolStep?.kind === 'mill') {
    local = interpolate(toolStep.from, toolStep.to, progress);
    if (toolStep.kind === 'saw') {
      const x = toolStep.to[0] - toolStep.from[0], y = toolStep.to[1] - toolStep.from[1], length = Math.hypot(x, y);
      direction = [y / length, -x / length, 0];
    } else direction = toolStep.kind === 'mill' ? MILL_FACE_DIRECTION[toolStep.face ?? 'top'] : toolStep.direction; // [Befun 확장] 마구리 면
  }
  if (toolStep?.kind === 'drill') {
    direction = toolStep.direction;
    local = toolStep.surface.map((v, i) => v + direction[i] * toolStep.depth * progress) as Point3;
  }
  // 재투입할 때 이미 후퇴한 공구가 판재에 붙어서 움직이지 않는다.
  const offset = toolStep ? stockPose(toolStep.stockId, toolIndex, progress) : undefined;
  const toolStock = toolStep ? program.stocks.find(s => s.id === toolStep.stockId) : undefined;
  const position = tool && local && offset && toolStock ? flippedWorldPoint(local, toolStock.size, offset.flip, offset.position, offset.angle) : undefined;
  if (!tool) local = undefined;
  if (offset && toolStock) direction = rotatePoint(flipPoint(direction, toolStock.size, offset.flip, true), offset.angle);
  return { cursor, step, tool, positions, angles, flips, visible, local, position, direction, clamp, fence, station: step?.station ?? 'saw' };
}
