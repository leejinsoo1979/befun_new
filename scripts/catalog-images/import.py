"""Validate the user-provided CSV pairs and import byte-identical local assets.
Usage: python3 scripts/catalog-images/import.py SOURCE_DIRECTORY
No images are downloaded, invented, or paired by directory order.
"""
import csv, hashlib, json, re, shutil, sys
from pathlib import Path
from urllib.parse import urlsplit, unquote
ROOT = Path(__file__).resolve().parents[2]
source = Path(sys.argv[1])
rows = list(csv.DictReader((source / '저장목록.csv').open(encoding='utf-8-sig')))
counts = list(csv.DictReader((source / '카테고리별 개수.csv').open(encoding='utf-8-sig')))
asset_dir = ROOT / 'public/imgs/product-cards'
asset_dir.mkdir(parents=True, exist_ok=True)
doc = ROOT / 'docs/handoffs/catalog-images'
doc.mkdir(parents=True, exist_ok=True)
entries, stats, used, copied = [], [], set(), {}
def key(url):
    parts = unquote(urlsplit(url).path).rstrip('/').split('/')
    token = parts[-1]
    match = re.match(r'^(\d+,[a-z])(?:,|$)', token)
    if match: return match[1]
    family = {'decke':'blanket','blanket':'blanket','buchstutze':'bookend','bookend':'bookend'}.get(parts[-2])
    if family and token.isdigit(): return family + ':' + token
    raise ValueError('Unrecognized product URL: ' + url)
for row in rows:
    identity = (row['카테고리'], row['순번'], row['상품번호'])
    assert identity not in used, identity
    used.add(identity)
    paths = []
    for column, role in [('썸네일 파일','01'), ('스튜디오컷 파일','02')]:
        filename = row[column]
        assert re.fullmatch(r'0*' + re.escape(row['순번']) + '_' + re.escape(row['상품번호']) + '_' + role + r'_.+\.[a-zA-Z]+', filename), filename
        original = source / row['카테고리'] / filename
        assert original.is_file(), original
        content = original.read_bytes()
        digest = hashlib.sha256(content).hexdigest()
        output = digest + original.suffix.lower()
        target = asset_dir / output
        if target.exists(): assert target.read_bytes() == content
        else: shutil.copy2(original, target)
        copied[output] = len(content)
        paths.append('/imgs/product-cards/' + output)
    product_key = key(row['상품 URL'])
    assert product_key.split(',')[0].split(':')[-1] == row['상품번호']
    entries.append(dict(category=row['카테고리'],sequence=int(row['순번']),productNumber=row['상품번호'],productKey=product_key,name=row['상품명'],source=row['상품 URL'],categoryPage=row['카테고리 페이지'],thumbnailSource=row['썸네일 URL'],studioSource=row['스튜디오컷 URL'],thumbnail=paths[0],studio=paths[1]))
for count in counts:
    group = [e for e in entries if e['category'] == count['카테고리']]
    actual = [p for p in (source/count['카테고리']).iterdir() if p.is_file() and not p.name.startswith('.')]
    assert len(group) == int(count['상품 세트'])
    assert len(actual) == len(group)*2 == int(count['이미지 파일'])
    stats.append(dict(category=count['카테고리'],sets=len(group),files=len(actual)))
by_key = {}
for entry in entries: by_key.setdefault(entry['productKey'], []).append(entry)
existing, unmatched = {}, []
# Existing reference catalog source URLs are authoritative; names/prices are not changed.
text = (ROOT/'src/components/storefront/referenceCatalog.ts').read_text()
category = None
index = 0
for line in text.splitlines():
    match = re.match(r"  (?:'([^']+)'|(\w+)): \[", line)
    if match: category = match[1] or match[2]; index = 0
    match = re.match(r"    \['([^']+)', '((?:furniture|sofa|accessories)/[^']+)'", line)
    if not match: continue
    index += 1
    id = f'{category}-{index}'
    candidates = by_key.get(key('https://tylko.com/en-uk/'+match[2]), [])
    # Some aggregate categories reverse thumbnail/studio roles. Prefer the card's
    # known category or its exact existing media URL, never choose an arbitrary pair.
    preferred_category = {'desk':'책상','dressing_table':'화장대','shoerack':'신발장','bedside_table':'협탁','chest-of-drawers':'서랍장','vinyl_storage':'레코드 수납장','wardrobe':'옷장 전체','wallunits':'벽면 수납장','four_plus_seater':'대형 소파','armchairs':'암체어','ottomans_and_modules':'오토만과 모듈','covers':'커버와 쿠션','blankets':'담요','bookends':'북엔드'}.get(category)
    preferred = [e for e in candidates if e['category'] == preferred_category]
    render_match = re.search(r"render\('([^']+)', '([^']+)'\)",line)
    if not preferred and render_match:
        original_url = 'https://media.tylko.com/media/catalogue/catalogue_entry/' + render_match[1] + '/unreal_render_tasks/' + render_match[2] + '.webp'
        preferred = [e for e in candidates if e['thumbnailSource'] == original_url]
    if preferred: candidates = preferred
    unique = {(e['thumbnail'],e['studio']) for e in candidates}
    if len(unique) == 1:
        existing[id] = dict(productKey=candidates[0]['productKey'],thumbnail=candidates[0]['thumbnail'],studio=candidates[0]['studio'],basis='source-product-id',categories=[e['category'] for e in candidates])
    else: unmatched.append(dict(id=id,name=match[1],reason='not-in-download' if not candidates else 'conflicting-pairs',source=match[2]))
# Befun sample IDs have no external SKU. Require BOTH existing primary bytes and unique downloaded pair.
text = (ROOT/'src/components/storefront/catalog.ts').read_text()
for match in re.finditer(r"id: '([^']+)'.*?image: '([^']+)'", text):
    id, filename = match.groups()
    original = ROOT/'public/imgs/storefront'/filename
    if not original.is_file(): continue
    digest = hashlib.sha256(original.read_bytes()).hexdigest()
    candidates = [e for e in entries if Path(e['thumbnail']).stem == digest]
    unique = {(e['productKey'], e['thumbnail'], e['studio']) for e in candidates}
    if len(unique) == 1:
        e = candidates[0]
        existing[id] = dict(productKey=e['productKey'],thumbnail=e['thumbnail'],studio=e['studio'],basis='existing-thumbnail-sha256',originalImage=filename,categories=[e['category'] for e in candidates])
    else: unmatched.append(dict(id=id,reason='no-identical-thumbnail' if not candidates else 'conflicting-pairs',image=filename))
for name in ['저장목록.csv','카테고리별 개수.csv']: shutil.copy2(source/name,doc/name)
def dump(path,value): path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
dump(ROOT/'src/lib/catalog-images/manifest.json',entries)
dump(ROOT/'src/lib/catalog-images/existing-matches.json',existing)
dump(doc/'inventory.json',dict(sets=len(entries),files=len(entries)*2,uniqueProducts=len(by_key),uniqueAssets=len(copied),bytes=sum(copied.values()),categories=stats,matchedExisting=existing,unmatchedExisting=unmatched,missingFiles=[],invalidPairs=[]))
print(json.dumps(dict(sets=len(entries),uniqueAssets=len(copied),matchedExisting=len(existing),unmatchedExisting=len(unmatched)),ensure_ascii=False))
