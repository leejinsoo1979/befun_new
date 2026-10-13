// [Befun shim] 250709in 가구 모듈 카탈로그. Befun에는 배치 모듈이 없으므로 찾지 못함(undefined)을 돌려준다.
/* eslint-disable @typescript-eslint/no-explicit-any */
export function getModuleById(..._args: unknown[]): any {
  return undefined;
}

export function buildModuleDataFromPlacedModule(..._args: unknown[]): any {
  return undefined;
}
