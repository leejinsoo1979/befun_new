import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import ts from 'typescript';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixtures = new URL('./fixtures.mjs', import.meta.url).href;
const mocks = new Set(['@prisma/adapter-pg', '@/generated/prisma/client', 'next-auth', '@/lib/auth']);

export function installTestLoader({ mockServices = true } = {}) {
  return registerHooks({
    resolve(specifier, context, nextResolve) {
      if (mockServices && mocks.has(specifier)) return { url: fixtures, shortCircuit: true };
      if (specifier === 'next/server') return nextResolve('next/server.js', context);
      if (specifier.startsWith('@/')) {
        const path = resolve(root, 'src', specifier.slice(2));
        for (const suffix of ['.ts', '.tsx', '/index.ts']) {
          if (existsSync(path + suffix)) return { url: pathToFileURL(path + suffix).href, shortCircuit: true };
        }
      }
      if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(resolve(root, 'src')).href)) {
        const path = fileURLToPath(new URL(specifier, context.parentURL));
        for (const suffix of ['.ts', '.tsx', '/index.ts']) {
          if (existsSync(path + suffix)) return { url: pathToFileURL(path + suffix).href, shortCircuit: true };
        }
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url.startsWith(pathToFileURL(resolve(root, 'src')).href) && url.endsWith('.ts')) {
        return {
          format: 'module', shortCircuit: true,
          source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
          }).outputText,
        };
      }
      return nextLoad(url, context);
    },
  });
}
