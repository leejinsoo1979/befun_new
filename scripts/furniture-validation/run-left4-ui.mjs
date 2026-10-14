// Reuse an existing Vitest3/jsdom/testing-library install without changing project dependencies.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';
const root=process.cwd(),deps=process.env.QA_UI_DEPS;
if(!deps){console.error('Set QA_UI_DEPS to an existing node_modules containing vitest, jsdom, @testing-library/react and jest-dom.');process.exit(2);}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'befun-left4-ui-'));
const suiteDir=process.env.QA_UI_SUITES??'scripts/furniture-validation/ui-left4';
for(const f of fs.readdirSync(suiteDir))if(f.endsWith('.txt'))fs.copyFileSync(path.join(suiteDir,f),path.join(dir,f.slice(0,-4)));
fs.symlinkSync(path.resolve(deps),path.join(dir,'node_modules'),'dir');
const config={test:{root:dir,environment:'jsdom',setupFiles:[path.join(dir,'setup.ts')],include:['**/*.test.tsx']},esbuild:{jsx:'automatic'},resolve:{alias:[{find:'@',replacement:root+'/src'},{find:'next/image',replacement:dir+'/next-image.tsx'},{find:'react',replacement:root+'/node_modules/react'},{find:'react-dom',replacement:root+'/node_modules/react-dom'}]}};
fs.writeFileSync(path.join(dir,'vitest.config.mjs'),'export default '+JSON.stringify(config));
const run=spawnSync(path.join(dir,'node_modules/.bin/vitest'),['run','--config',path.join(dir,'vitest.config.mjs'),...(process.env.QA_UI_FILTER?[process.env.QA_UI_FILTER]:[])],{cwd:dir,stdio:'inherit'});process.exit(run.status??1);
