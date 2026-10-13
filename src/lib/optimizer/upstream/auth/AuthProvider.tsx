// [Befun shim] 250709in Firebase 로그인 대신 사용자 없음(null)을 돌려준다.
export function useAuth(): { user: { email?: string | null; uid?: string } | null } {
  return { user: null };
}
