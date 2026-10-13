// [Befun shim] react-router-dom 대신 Next.js App Router 탐색을 쓴다.
// 250709in 경로 중 '/configurator'·'/'는 Befun에도 같은 의미의 경로가 있다.
import NextLink from 'next/link';
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { useCallback, type AnchorHTMLAttributes, type ReactNode } from 'react';

export function useNavigate() {
  const router = useRouter();
  return useCallback((to: string | number, opts?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === 'number') {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (opts?.replace) router.replace(to);
    else router.push(to);
  }, [router]);
}

export function useLocation(): { pathname: string; search: string; hash: string; state: Record<string, unknown> | null } {
  const pathname = usePathname();
  const params = useNextSearchParams();
  const query = params.toString();
  return { pathname, search: query ? `?${query}` : '', hash: '', state: null };
}

export function useSearchParams() {
  const params = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = (next: URLSearchParams | Record<string, string>) => {
    const qs = new URLSearchParams(next as Record<string, string>).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };
  return [new URLSearchParams(params.toString()), set] as const;
}

export function Link({ to, children, ...rest }: { to: string; children?: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <NextLink href={to} {...rest}>{children}</NextLink>;
}
