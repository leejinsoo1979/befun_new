import { SYSTEM_32MM } from '../constants';

/** 좁은 밴드·보강대의 연결면: 기존 32mm 피치 두 공을 중심 대칭으로 배치한다. */
export function pairedConnectorPositions(spanMm: number): number[] {
  const start = (spanMm - SYSTEM_32MM.PITCH) / 2;
  // 측판 관통공 Ø6까지 판 안에 들어갈 때만 가공한다.
  return Number.isFinite(start) && start >= 3 ? [start, start + SYSTEM_32MM.PITCH] : [];
}

export function isRearReinforcementPanelName(name = ''): boolean {
  return /(?:^|[\s)])(?:후면\s*)?보강대\s*[12]$/.test(name);
}
