import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export type OptimizerAccess = 'allowed' | 'login-required' | 'forbidden';

/** `OPTIMIZER_ADMIN_EMAILS`(쉼표 구분)에 있는 계정만 허용. 미설정이면 개발 환경에서만 허용한다. */
export async function checkOptimizerAccess(): Promise<OptimizerAccess> {
  const admins = (process.env.OPTIMIZER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (admins.length === 0) {
    return process.env.NODE_ENV === 'development' ? 'allowed' : 'forbidden';
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return 'login-required';
  return admins.includes(email) ? 'allowed' : 'forbidden';
}
