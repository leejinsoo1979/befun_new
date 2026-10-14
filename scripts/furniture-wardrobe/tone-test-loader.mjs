import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
export async function loadToneCore() {
  const root = path.resolve('src/lib/furniture/wardrobe'), output = fs.mkdtempSync(path.join(os.tmpdir(), 'befun-tone-test-'));
  for (const file of fs.readdirSync(root)) {
    if (file.endsWith('.json')) fs.copyFileSync(path.join(root, file), path.join(output, file));
    if (file.endsWith('.ts')) {
      const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
        .replaceAll("'../wardrobe-hinges'","'./wardrobe-hinges'")
        .replace(/from '(\.\/[^']+)'/g, (_, name) => `from '${name.endsWith('.json') ? name : name + '.mjs'}'${name.endsWith('.json') ? ' with {type:"json"}' : ''}`);
      fs.writeFileSync(path.join(output, file.replace('.ts', '.mjs')), code);
    }
  }
  fs.writeFileSync(path.join(output, 'wardrobe-hinges.mjs'), ts.transpileModule(fs.readFileSync(path.join(root, '../wardrobe-hinges.ts'), 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
  return { core: await import(pathToFileURL(path.join(output, 'tone.mjs')).href), cleanup: () => fs.rmSync(output, { recursive: true, force: true }) };
}
export const fingerprintTone = parts => parts.map(part => {
  const keys = ['x1', 'x2', 'y1', 'y2', 'z1', 'z2', 'subtype', 'direction', 'handle', 'extremes'];
  return JSON.stringify(Object.fromEntries(keys.filter(k => part[k] !== undefined && !(k === 'subtype' && part[k] === '')).map(k => [k, typeof part[k] === 'number' ? Math.round(part[k] * 1e7) / 1e7 : part[k]])));
}).sort();
