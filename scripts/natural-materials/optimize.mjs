import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const sourceRoot = process.argv[2];
if (!sourceRoot) throw new Error('Pass the directory containing the extracted 51539 and 51537 Map folders.');
const root = process.cwd();
const packs = [
  { archive: '51539', key: 'N_Wood_W4', slug: 'w4', label: '우드 W4 (다크)', diffuse: 'W_4 Diffuse.png', gloss: 'W_4_Gloss.png', normal: 'W_4_Normal GL.png' },
  { archive: '51537', key: 'N_Wood_W2', slug: 'w2', label: '우드 W2 (브라운)', diffuse: 'W2_Diffuse.jpg', gloss: 'W_22_Gloss2.png', normal: 'W_22_Normal GL.png' },
];
const catalog = {};
const evidence = [];
for (const pack of packs) {
  const input = name => path.join(sourceRoot, pack.archive, 'Map', name);
  const url = `/imgs/textures/imported-natural-${pack.slug}`;
  const output = name => path.join(root, 'public', url, name);
  await fs.mkdir(path.dirname(output('base.webp')), { recursive: true });
  const base = await sharp(input(pack.diffuse)).resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88, effort: 6 }).toBuffer();
  const normal = await sharp(input(pack.normal)).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).webp({ lossless: true, effort: 6 }).toBuffer();
  // Glossiness and roughness have opposite meanings; GL normal maps keep their Y direction.
  const roughness = await sharp(input(pack.gloss)).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).greyscale().negate().webp({ quality: 90, effort: 6 }).toBuffer();
  const thumbnailUrl = `/imgs/natural_color/imported-wood-${pack.slug}.webp`;
  const thumbnail = await sharp(base).resize(96, 96, { fit: 'cover' }).webp({ quality: 85, effort: 6 }).toBuffer();
  for (const [name, bytes] of [['base.webp', base], ['normal.webp', normal], ['roughness.webp', roughness]]) await fs.writeFile(output(name), bytes);
  await fs.writeFile(path.join(root, 'public', thumbnailUrl), thumbnail);
  const { channels } = await sharp(base).stats();
  const surface = '#' + channels.slice(0, 3).map(channel => Math.round(channel.mean).toString(16).padStart(2, '0')).join('');
  catalog[pack.key] = { label: pack.label, base: `${url}/base.webp`, normal: `${url}/normal.webp`, roughness: `${url}/roughness.webp`, thumbnail: thumbnailUrl, surface };
  const sources = [];
  for (const filename of [pack.diffuse, pack.normal, pack.gloss]) {
    const bytes = await fs.readFile(input(filename));
    const { width, height } = await sharp(bytes).metadata();
    sources.push({ entry: `Map/${filename}`, bytes: bytes.length, width, height, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  const assets = [];
  for (const [assetUrl, bytes] of [[`${url}/base.webp`, base], [`${url}/normal.webp`, normal], [`${url}/roughness.webp`, roughness], [thumbnailUrl, thumbnail]]) {
    const { width, height } = await sharp(bytes).metadata();
    assets.push({ url: assetUrl, bytes: bytes.length, width, height, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  evidence.push({ archive: `${pack.archive}.rar`, key: pack.key, sources, assets, sourceMapBytes: sources.reduce((sum, item) => sum + item.bytes, 0), webBytes: assets.reduce((sum, item) => sum + item.bytes, 0) });
}
await fs.writeFile(path.join(root, 'src/lib/three/imported-natural-textures.json'), JSON.stringify(catalog, null, 2) + '\n');
await fs.writeFile(path.join(root, 'docs/handoffs/natural-materials/assets.json'), JSON.stringify(evidence, null, 2) + '\n');
for (const item of evidence) console.log(`${item.key}: ${item.sourceMapBytes} -> ${item.webBytes} bytes (${(100 * (1 - item.webBytes / item.sourceMapBytes)).toFixed(1)}% smaller)`);
