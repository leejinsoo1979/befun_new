import { prisma } from '@/lib/db';
import { getAdmin } from '@/lib/admin';
import { updateUserRole } from '../actions';
import { PROVIDERS, date } from '../format';
import styles from '../admin.module.css';

export default async function AdminUsers() {
  const me = await getAdmin();
  const users = await prisma.user.findMany({
    take: 200, orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true, passwordHash: true, marketingAgreed: true, accounts: { select: { provider: true } }, _count: { select: { orders: true, designs: true } } },
  });
  return (
    <>
      <h1>회원 관리</h1>
      <section className={styles.panel}>
        {users.length === 0 ? <p className={styles.empty}>아직 회원이 없습니다.</p> : (
          <table className={styles.table}>
            <thead><tr><th>가입일</th><th>이름</th><th>이메일</th><th>가입 방법</th><th>주문</th><th>디자인</th><th>마케팅</th><th>권한</th></tr></thead>
            <tbody>{users.map((u) => {
              const methods = [...(u.passwordHash ? ['이메일'] : []), ...u.accounts.map((a) => PROVIDERS[a.provider] ?? a.provider)];
              const self = u.id === me?.id;
              return (
                <tr key={u.id}>
                  <td>{date(u.createdAt)}</td>
                  <td>{u.name ?? '이름 없음'}</td>
                  <td>{u.email ?? <span className={styles.muted}>이메일 미동의</span>}</td>
                  <td>{methods.join(', ') || '-'}</td>
                  <td>{u._count.orders}</td>
                  <td>{u._count.designs}</td>
                  <td>{u.marketingAgreed ? '동의' : '-'}</td>
                  <td>
                    <form action={updateUserRole} className={styles.inline}>
                      <input type="hidden" name="userId" value={u.id} />
                      <span className={styles.pill} data-tone={u.role === 'ADMIN' ? 'admin' : undefined}>{u.role === 'ADMIN' ? '관리자' : '일반'}</span>
                      <input type="hidden" name="role" value={u.role === 'ADMIN' ? 'USER' : 'ADMIN'} />
                      <button type="submit" disabled={self} title={self ? '본인 권한은 바꿀 수 없습니다' : undefined}>{u.role === 'ADMIN' ? '일반으로' : '관리자로'}</button>
                    </form>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </section>
    </>
  );
}
