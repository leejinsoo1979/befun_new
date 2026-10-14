/** Offline reference capture. No downloaded renderer is imported by the app. */
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
const bundle = fs.readFileSync(process.env.TONE_SOURCE_BUNDLE ?? '/tmp/tylko-wardrobes-bundle.js', 'utf8');
if (!bundle.includes('r(r.s=1872)')) throw new Error('Unrecognized source bootstrap');
const context = vm.createContext({ console });
vm.runInContext(bundle.replace('r(r.s=1872)', 'globalThis.requireModule=r'), context);
const convert = context.requireModule(1016).toToneDoorSegment;
const source = JSON.parse(fs.readFileSync('scripts/furniture-wardrobe/tone-source-fixtures.json', 'utf8'));
const cases = source.map(fixture => ({ id: fixture.id, doors: fixture.expected.doors,
  expected: fixture.expected.doors.map(door => {
    const segment = convert(door, [], { name: 'verification', colors: {} }, 'one');
    const panel = segment.geometries[0];
    return {
      x: (segment.position.x + panel.position.x) * 100,
      y: (segment.position.y + panel.position.y) * 100,
      z: (segment.position.z + panel.position.z) * 100,
      w: panel.size.x * 100, h: panel.size.y * 100, d: panel.size.z * 100,
      pivotX: segment.position.x * 100,
      openAngle: segment.segmentTag.motion.open * Math.PI / 180,
    };
  }),
}));
fs.writeFileSync('scripts/furniture-wardrobe/tone-front-fixtures.json', JSON.stringify({
  source: 'Public wardrobe renderer module 1016; cm/radians; closed panels and nominal angles only',
  sha256: createHash('sha256').update(bundle).digest('hex'), cases,
}) + '\n');
console.log(`Captured ${cases.length} cases / ${cases.reduce((n, c) => n + c.doors.length, 0)} door panels`);
