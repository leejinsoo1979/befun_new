import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { Box3, Vector3, MeshStandardMaterial } from 'three';
import { createHash } from 'node:crypto';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
const dom=new JSDOM();
globalThis.DOMParser=dom.window.DOMParser;
globalThis.document=dom.window.document;
globalThis.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();});}
};
const manifest=[];
for(const [prefix,name] of [['cad44579144','71B3790'],['cad47382329','174H7100E']]){
  const dir='public/models/blum/source';
  const file=(await fs.readdir(dir)).find(f=>f.startsWith(prefix)&&f.endsWith('.dae'));
  if(!file){manifest.push({part:name,status:'source-not-downloaded'});continue;}
  const {scene}=new ColladaLoader().parse(await fs.readFile(`${dir}/${file}`,'utf8'),'');
  scene.updateMatrixWorld(true);
  const parts=[];
  scene.traverse(o=>{if(o.isMesh){
    const b=new Box3().setFromObject(o);
    parts.push({name:o.name,minMetres:b.min.toArray(),maxMetres:b.max.toArray(),vertices:o.geometry.attributes.position.count});
    const convert=m=>new MeshStandardMaterial({name:m.name,color:m.color,opacity:m.opacity,transparent:m.transparent,metalness:.75,roughness:.28});
    o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
  }});
  const glb=await new GLTFExporter().parseAsync(scene,{binary:true});
  await fs.writeFile(`public/models/blum/${name}.glb`,Buffer.from(glb));
  manifest.push({part:name,status:'converted-not-integrated',source:file,sourceSha256:createHash('sha256').update(await fs.readFile(`${dir}/${file}`)).digest('hex'),glbSha256:createHash('sha256').update(Buffer.from(glb)).digest('hex'),sourceUnit:'millimetres',glbUnit:'metres',geometry:'supplier mesh preserved without decimation',materials:'source colours; PBR metalness/roughness are rendering choices',sizeMetres:new Box3().setFromObject(scene).getSize(new Vector3()).toArray(),parts});
}
await fs.writeFile('public/models/blum/manifest.json',JSON.stringify(manifest,null,2)+'\n');
