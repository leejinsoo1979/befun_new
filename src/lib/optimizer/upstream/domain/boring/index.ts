// [Befun shim] 250709in 가구 모듈별 선반 보링 계산(barrel). CNCOptimizerPro가 배치 모듈마다 호출하는데
// Befun에는 배치 모듈이 없으므로 빈 결과를 돌려준다. 보링 코어(types, exporters 등)는 개별 파일을 직접 import한다.
interface ShelfBoringResult {
  positions: number[];
  details: Array<{ role: string; y: number }>;
}

export function calculateShelfBoringPositions(..._args: unknown[]): ShelfBoringResult {
  return { positions: [], details: [] };
}

export function calculateSectionBoringPositions(..._args: unknown[]): ShelfBoringResult {
  return { positions: [], details: [] };
}
