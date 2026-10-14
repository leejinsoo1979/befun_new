export function sourceProductKey(source: string): string | null {
  try {
    const parts = decodeURIComponent(new URL(source).pathname).replace(/\/$/, '').split('/');
    const token = parts.at(-1) ?? '';
    const furniture = token.match(/^(\d+,[a-z])(?:,|$)/);
    if (furniture) return furniture[1];
    const family = ({decke:'blanket',blanket:'blanket',buchstutze:'bookend',bookend:'bookend'} as Record<string,string>)[parts.at(-2) ?? ''];
    return family && /^\d+$/.test(token) ? `${family}:${token}` : null;
  } catch { return null; }
}
