/** ADMIN_EMAILS(쉼표 구분)에 있는 이메일은 로그인 시 관리자 권한을 받는다 */
export function isBootstrapAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}
