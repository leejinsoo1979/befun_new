"""Import only supplied assembly evidence; no executable content or archive paths escape public."""
import hashlib, json, re, sys, zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[2]
archive=Path(sys.argv[1]); target=root/'public/assembly/tylko'; target.mkdir(parents=True,exist_ok=True)
records=[]
with zipfile.ZipFile(archive) as z:
 for i in z.infolist():
  parts=Path(i.filename).parts
  if not parts or parts[0]!='tylko_assembly' or i.is_dir() or any(p.startswith('.') or p=='..' for p in parts):continue
  rel=Path(*parts[1:])
  if rel.suffix.lower() not in {'.pdf','.png','.jpg','.jpeg','.webp','.mp4','.json','.md','.txt'}:continue
  data=z.read(i);out=target/rel;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
  records.append({'file':str(rel),'url':'/assembly/tylko/'+str(rel),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
sources=json.loads((target/'sources.json').read_text()); videos=json.loads((target/'videos/index.json').read_text())
def pathurl(p):return '/assembly/tylko/'+p
pdfs=[dict(x,src=pathurl(x['file'])) for x in sources['originalPDFs']]
pdfs.append({'file':'connector.pdf','title':'KNAPP Mod-eez 커넥터 참고 도면 (Tylko 동일품 미확인)','src':pathurl('connector.pdf'),'pages':6})
guides=[]
for p in sorted((target/'guides').glob('*.md')):
 text=p.read_text();title=re.search(r'^# (.+)',text,re.M).group(1)
 source=re.search(r'Source: (https?://\S+)',text).group(1)
 blocks=[]
 for part in re.sub(r'<!--[\s\S]*?-->','',text).split('\n\n'):
  part=part.strip()
  if not part or part.startswith('# ') or part.startswith('Source:'):continue
  img=re.fullmatch(r'!\[([^\]]*)\]\(\.\./([^\)]+)\)',part)
  blocks.append({'kind':'image','src':pathurl(img[2]),'text':img[1]} if img else {'kind':'text','text':part})
 guides.append({'id':p.stem,'title':title,'source':source,'pdf':pathurl('guides/'+p.stem+'.pdf'),'blocks':blocks})
for v in videos:
 actual=next(p for p in (target/'videos').glob('*.mp4') if '['+v['id']+']' in p.name)
 v['file']=str(actual.relative_to(target)); v['src']=pathurl(v['file']);thumb=next((p for p in (target/'videos/thumbnails').iterdir() if '['+v['id']+']' in p.name),None)
 v['poster']=pathurl(str(thumb.relative_to(target))) if thumb else None
manifest={'pdfs':pdfs,'guides':guides,'videos':videos,'images':[r for r in records if r['file'].startswith('images/')],'files':records}
(root/'src/lib/assembly-guide/tylko-manual/assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
report={'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'pdfs':sum(x['file'].endswith('.pdf') for x in records),'videos':len(videos),'guides':len(guides),'images':len(manifest['images']),'files':len(records),'bytes':sum(r['bytes'] for r in records)}
(root/'docs/handoffs/tylko-assembly/import.json').write_text(json.dumps(report,indent=2)+'\n');print(report)
