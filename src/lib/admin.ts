import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * 관리자 확인 — 세션 토큰이 아니라 DB의 현재 role을 기준으로 판단한다(권한 회수 즉시 반영).
 * 관리자가 아니면 null.
 */
export async function getAdmin() {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, role: true } });
  return user?.role === 'ADMIN' ? user : null;
}

/** 공장 화면 접근(관리자 또는 공장 담당자). DB role 기준. 아니면 null */
export async function getFactoryStaff() {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, role: true } });
  return user?.role === 'ADMIN' || user?.role === 'FACTORY' ? user : null;
}
