// [Befun shim] 가공비 표시 권한. 접근 제어는 Befun `/optimizer` 라우트에서 하므로 항상 허용한다.
export function canViewManufacturingCostForEmail(_email: string | null | undefined): boolean {
  return true;
}
