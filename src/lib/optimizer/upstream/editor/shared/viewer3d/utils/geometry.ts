// [Befun shim] 250709in 공간 내경 계산. 모듈 조회(getModuleById shim)에만 쓰이므로 0을 돌려준다.
export function calculateInternalSpace(_spaceInfo: unknown) {
  return { width: 0, height: 0, depth: 0, startX: 0, startY: 0, startZ: 0 };
}
