// [Befun shim] react-i18next 대신 250709in 한국어 리소스(locales/ko.json)를 직접 조회한다.
import ko from '../locales/ko.json';

type Options = Record<string, unknown> & { defaultValue?: string };

function lookup(key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), ko);
}

function t(key: string, options?: Options | string): string {
  const opts = typeof options === 'string' ? { defaultValue: options } : options;
  const value = lookup(key);
  const text = typeof value === 'string' ? value : opts?.defaultValue ?? key;
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => String(opts?.[name] ?? ''));
}

const i18n = { language: 'ko', changeLanguage: async (_lng: string) => {} };

export const useTranslation = () => ({
  t,
  i18n,
  ready: true,
  currentLanguage: 'ko',
  changeLanguage: async (_language: string) => {},
  availableLanguages: [{ code: 'ko', name: '한국어' }],
});

export default useTranslation;
