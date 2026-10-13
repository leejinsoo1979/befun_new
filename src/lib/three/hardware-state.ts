/** Public row-style codes (hardware-source-001): tens=drawers, units=doors. */
export type HardwareMode = 'none' | 'some' | 'max';
export type HardwareRowStyles = Record<number, number>;
export function hardwareModes(code = 11): { doors: HardwareMode; drawers: HardwareMode } {
  const mode = (n: number): HardwareMode => n === 3 ? 'max' : n === 2 ? 'some' : 'none';
  return { doors: mode(code % 10), drawers: mode(Math.floor(code / 10)) };
}
export function changeHardwareMode(code: number, kind: 'doors' | 'drawers', mode: HardwareMode): number {
  const modes = hardwareModes(code);
  const other = kind === 'doors' ? 'drawers' : 'doors';
  modes[kind] = mode;
  if (mode === 'max') modes[other] = 'none';
  else if (mode === 'some' && modes[other] === 'max') modes[other] = 'some';
  const value = {none:1,some:2,max:3};
  return value[modes.drawers] * 10 + value[modes.doors];
}
export function resolveHardwareRows(doors: number[], drawers: number[], saved: HardwareRowStyles = {}): HardwareRowStyles {
  return Object.fromEntries([...new Set([...doors,...drawers])].map(row => [row,
    saved[row] ?? (drawers.includes(row) ? (doors.includes(row) ? 22 : 21) : 12)]));
}
export function effectiveHardwareStyle(code: number, row: number, rowHeights: number[], depth: number): number {
  let result = code;
  const top = rowHeights.slice(0,row+1).reduce((sum,h)=>sum+h+2,0);
  if (depth < 32 || top > 157.8) result = ({21:11,22:12,31:11} as Record<number,number>)[result] ?? result;
  if ((rowHeights[row] ?? 28) < 28) result = ({12:11,13:11,22:21} as Record<number,number>)[result] ?? result;
  return result;
}
