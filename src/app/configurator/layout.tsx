import type { ReactNode } from 'react';
import { ConfiguratorShell } from '@/components/storefront/ConfiguratorShell';

export default function ConfiguratorLayout({ children }: { children: ReactNode }) {
  return <ConfiguratorShell>{children}</ConfiguratorShell>;
}
