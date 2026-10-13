// [Befun shim] 250709in의 ThemeProvider 대신 고정 라이트 테마를 제공한다.
import type { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
  color: string;
}

const lightTheme = { theme: { mode: 'light' as ThemeMode, color: 'gray' } };

export const ThemeProvider = ({ children }: { children: ReactNode }) => children;
export const useTheme = () => lightTheme;
export const useOptionalTheme = () => lightTheme;
