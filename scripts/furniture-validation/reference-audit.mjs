import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const present = v => v !== undefined && v !== null;
const idFromUrl = url => typeof url === 'string' ? url.match(/\/(\d+),[a-z]/)?.[1] ?? null : null;
// Explicitly separate inventory model records from edited wardrobe states.
export function adapt(doc, file) {
  if (Array.isArray(doc.models)) return doc.models.map((m, i) => ({
    id: `${doc.caseId}#${i}:${m.model}`, caseId: doc.caseId, kind: 'inventory', file,
    url: m.sourceUrl, initial: m.initialState, preset: m.initialState?.publicPreset,
    presetId: m.initialState?.presetId, current: null, steps: m.steps, geometry: m.geometry,
    measurement: m.precision, screenshots: m.screenshots, options: m.optionUiSnapshot,
  }));
  if (/^category-wardrobe-/.test(doc.caseId ?? '')) return [{
    id: doc.caseId, caseId: doc.caseId, kind: 'wardrobe-edit', file,
    url: doc.sourceUrl, initial: doc.initialState, preset: doc.initialState?.preset,
    presetId: doc.initialState?.preset?.id, current: doc.currentInternalParameters,
    steps: doc.steps, geometry: doc.geometry, measurement: doc.measurement,
    screenshots: doc.screenshots, options: doc.ui,
  }];
  if (!doc.caseId) return [{ id: file, kind: 'derived-artifact', file }];
  return [{ id: doc.caseId, caseId: doc.caseId, kind: 'other-case', file,
    url: doc.sourceUrl ?? doc.url, initial: doc.initialState,
    steps: doc.actions ?? doc.operations, options: doc.inputs ?? doc.inputOptions ?? doc.options,
    measurement: doc.measurement ?? doc.precision, screenshots: doc.screenshots,
  }];
}
export function shotEntries(shots) {
  if (typeof shots === 'string') return [{path: shots}];
  if (Array.isArray(shots)) return shots.flatMap(shotEntries);
  if (shots && typeof shots === 'object') return typeof shots.path === 'string' ? [shots] : Object.values(shots).flatMap(shotEntries);
  return [];
}
export function auditRecord(record, exists = fs.existsSync) {
  const checks=[];
  const check=(field,status,detail)=>checks.push({field,status,detail});
  if(record.kind==='derived-artifact') {check('adapter','not-applicable','Derived results; not a reference observation');return checks;}
  check('initialState',record.initial ? 'pass':'unknown', 'Presence only; does not establish reproducibility');
  check('actions',record.steps?.length ? 'pass':'unknown','Recorded action sequence');
  check('inputOptions',record.options ? 'pass':'unknown','Presence only; completeness not inferred');
  const urlId=idFromUrl(record.url);
  if(['inventory','wardrobe-edit'].includes(record.kind)) {
    check('presetIdentity', !urlId || !present(record.presetId) ? 'unknown' : String(record.presetId)===urlId ? 'pass':'fail', `URL product=${urlId}; initial preset=${record.presetId ?? 'unknown'}`);
    if(record.preset && present(record.preset.id)) check('presetPayloadIdentity', String(record.preset.id)===String(record.presetId)?'pass':'fail','Payload ID must agree with initial preset ID');
    check('geometry','unknown','No calibrated component coordinates/topology in this inventory adapter');
    check('manufacturingPrecision','unknown','UI labels and public preset dimensions do not establish manufacturing precision');
  }
  if(record.kind==='wardrobe-edit') {
    check('editedInternalState',present(record.current)?'pass':'unknown','Initial preset never substitutes for edited internal parameters');
    check('units',record.measurement?.uiUnit==='cm' && record.measurement?.apiDimensionUnit==='mm'?'pass':'unknown','UI cm and API mm are separate; no conversion of slider row indices');
    check('sliderStep',present(record.measurement?.sliderStep)?'pass':'unknown','Null remains unknown');
  } else check('units',record.measurement?.unit ? 'pass':'unknown','Explicit unit needed per measurement field; prose precision is not a normalization rule');
  const shots=shotEntries(record.screenshots);
  if(!shots.length) check('screenshots','unknown','No screenshot evidence');
  for(const shot of shots) {
    const local=shot.path.startsWith('docs/') ? path.join(root,shot.path) : shot.path.startsWith('../') ? path.join(root,'docs/tylko-reference/cases',shot.path) : path.join(root,'docs/tylko-reference',shot.path);
    const available=exists(local);
    check(`screenshot:${shot.path}`,available?'pass':'fail','File existence only');
    check(`visualEvidence:${shot.path}`, 'unknown',shot.status==='loading-preview-only'?'Loading preview is unusable for visual equivalence':available?'File present; camera/options/calibration equivalence not verified':'Missing screenshot');
  }
  return checks;
}
export function runAudit(directory=path.join(root,'docs/tylko-reference/cases')) {
  const records=[], duplicateIds=[],seen=new Set();
  for(const file of fs.readdirSync(directory).filter(f=>f.endsWith('.json')).sort()) {
    const doc=JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));
    if(doc.caseId) {if(seen.has(doc.caseId))duplicateIds.push({file,caseId:doc.caseId});seen.add(doc.caseId);}
    records.push(...adapt(doc,file));
  }
  const results=records.map(r=>({id:r.id,kind:r.kind,file:r.file,initialProductUrl:r.url??null,checks:auditRecord(r)}));
  const inventory=records.filter(r=>r.kind==='inventory');
  const edits=records.filter(r=>r.kind==='wardrobe-edit');
  return {generatedAt:new Date().toISOString(), scope:'Evidence audit, NOT furniture equivalence', duplicateIds,
    counts:{files:fs.readdirSync(directory).filter(f=>f.endsWith('.json')).length,inventoryModels:inventory.length,
      activePresets:inventory.filter(r=>present(r.presetId)).length,unknownActivePresets:inventory.filter(r=>!present(r.presetId)).length,
      uniqueInitialProducts:new Set([...inventory,...edits].map(r=>r.url)).size,
      uniqueKnownInitialPresets:new Set([...inventory,...edits].filter(r=>present(r.presetId)).map(r=>r.url)).size,wardrobeEdits:edits.length,wardrobeInitialProducts:new Set(edits.map(r=>r.url)).size,
      loadingPreviews:records.flatMap(r=>shotEntries(r.screenshots)).filter(s=>s.status==='loading-preview-only').length,
      pass:results.flatMap(r=>r.checks).filter(c=>c.status==='pass').length,
      fail:results.flatMap(r=>r.checks).filter(c=>c.status==='fail').length,
      unknown:results.flatMap(r=>r.checks).filter(c=>c.status==='unknown').length},results};
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const report=runAudit();fs.writeFileSync(path.join(root,'scripts/furniture-validation/reference-results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({counts:report.counts,duplicateIds:report.duplicateIds},null,2));
 process.exitCode=report.counts.fail || report.duplicateIds.length ? 1:0;
}
