'use client';
import { StorefrontFrame } from '@/components/storefront/StorefrontFrame';
export function ShopLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontFrame>{children}</StorefrontFrame>;
}
