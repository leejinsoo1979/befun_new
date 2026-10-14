import type { OrderStatus } from '@/generated/prisma/enums';
import { ORDER_STATUS } from '../_lib/format';
import styles from '../admin.module.css';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <span className={`${styles.badge} ${styles[`tone-${s.tone}`]}`}>{s.label}</span>;
}
export function Badge({ tone, children }: { tone: 'gray' | 'blue' | 'amber' | 'violet' | 'green' | 'red' | 'ink'; children: React.ReactNode }) {
  return <span className={`${styles.badge} ${styles[`tone-${tone}`]}`}>{children}</span>;
}
