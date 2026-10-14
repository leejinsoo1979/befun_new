import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Observed hardware sections. Input and returned geometry use cm; source origins retained.
 * Caller owns the geometry and must dispose it. See wardrobe-hardware-observations.md.
 */
type Point = readonly [number, number];
type Ring = { at: number; points: ReadonlyArray<Point> };

function area(points: ReadonlyArray<Point>) {
  return points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p[0] * q[1] - p[1] * q[0];
  }, 0) / 2;
}

function loft(rings: Ring[], axis: 'y' | 'z'): THREE.BufferGeometry {
  const count = rings[0].points.length;
  const vertices: number[] = [];
  const indices: number[] = [];
  rings.forEach(({ at, points }) => points.forEach(([a, b]) => {
    vertices.push(...(axis === 'z' ? [a, b, at] : [a, at, b]));
  }));
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const a = r * count + i; const b = r * count + j;
      const c = (r + 1) * count + j; const d = (r + 1) * count + i;
      indices.push(a, b, c, a, c, d);
    }
  }
  for (const end of [0, rings.length - 1]) {
    const triangles = THREE.ShapeUtils.triangulateShape(rings[end].points.map(([x, y]) => new THREE.Vector2(x, y)), []);
    for (const triangle of triangles) {
      const [a, b, c] = triangle.map(i => end * count + i);
      indices.push(...(end === 0 ? [c, b, a] : [a, b, c]));
    }
  }
  // XZ cross-sections have the opposite handedness to XY cross-sections.
  if ((area(rings[0].points) < 0) !== (axis === 'y')) {
    for (let i = 0; i < indices.length; i += 3) [indices[i], indices[i + 2]] = [indices[i + 2], indices[i]];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function finish(geometry: THREE.BufferGeometry, name: string): THREE.BufferGeometry {
  geometry.scale(0.1, 0.1, 0.1);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.name = name;
  return geometry;
}

function combine(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = parts.map(p => p.index ? p.toNonIndexed() : p.clone());
  const geometry = mergeGeometries(nonIndexed, false);
  nonIndexed.forEach(p => p.dispose());
  parts.forEach(p => p.dispose());
  if (!geometry) throw new Error('Cannot merge wardrobe hardware sections');
  return geometry;
}

function extrusion(points: ReadonlyArray<Point>, length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, steps: 1 });
  geometry.translate(0, 0, -length / 2);
  return geometry;
}

function capsule(radius: number, low: number, high: number, centerX = 0): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= 10; i++) {
    const angle = i * Math.PI / 10;
    points.push([centerX + radius * Math.cos(angle), high + radius * Math.sin(angle)]);
  }
  for (let i = 0; i <= 10; i++) {
    const angle = Math.PI + i * Math.PI / 10;
    points.push([centerX + radius * Math.cos(angle), low + radius * Math.sin(angle)]);
  }
  return points;
}

function positiveLength(value: number): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError('Hardware length must be a positive number in cm');
  return value * 10;
}

/** Capsule rail: 40 mm high × 20 mm deep. Source scales only the X axis. */
export function createWardrobeFrontBar(lengthCm: number): THREE.BufferGeometry {
  const length = positiveLength(lengthCm);
  const geometry = extrusion(capsule(10, -10, 10), length);
  // Profile coordinates are Z,Y. Extrusion axis Z becomes wardrobe X.
  geometry.rotateY(Math.PI / 2);
  return finish(geometry, 'wardrobe-front-bar');
}

/** Source front/back bone displacement, preserving posts instead of scaling them.
 * The requested Z span excludes 7 mm overhang at each end (total bbox = span + 14 mm).
 */
export function createWardrobeCrossBar(depthCm: number): THREE.BufferGeometry {
  const depth = positiveLength(depthCm);
  if (depth <= 2) throw new RangeError('Cross bar span must exceed 0.2 cm');
  const centers = depth - 2;
  const core: Point[] = [[-3.5,-84.79465],[3.5,-84.79465],[5,-83.34658],[5,-56.34658],[3.5,-54.84658],[-3.5,-54.84658],[-5,-56.34658],[-5,-83.34658]];
  const parts = [extrusion(core, centers)];
  const profile = [[0,-84.84658],[4.85445,-84.84658],[6,-83.34658],[6,-2.15221],[7.56045,-1.84658],[8,-1.41548],[8,0.15342],[0,0.15342]];
  for (const z of [-centers / 2, centers / 2]) {
    const post = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 16);
    post.translate(0, 0, z);
    parts.push(post);
  }
  return finish(combine(parts), 'wardrobe-cross-bar');
}

/** Seven measured XY contours reproduce the rounded rear and front bevel of the grip. */
export function createWardrobeGripHandle(): THREE.BufferGeometry {
  return finish(loft(GRIP_RINGS.map(([at, points]) => ({ at, points })), 'z'), 'wardrobe-grip-handle');
}

function resample(points: ReadonlyArray<Point>, count: number): Point[] {
  let ordered = [...points];
  if (area(ordered) < 0) ordered.reverse();
  // Stable seam at the rear clip's furthest left corner for successive sections.
  const first = ordered.reduce((best, p, i) => p[0] < ordered[best][0] ? i : best, 0);
  ordered = [...ordered.slice(first), ...ordered.slice(0, first)];
  const lengths = ordered.map((p, i) => Math.hypot(p[0] - ordered[(i + 1) % ordered.length][0], p[1] - ordered[(i + 1) % ordered.length][1]));
  const total = lengths.reduce((sum, v) => sum + v, 0);
  const result: Point[] = [];
  for (let i = 0; i < count; i++) {
    let along = total * i / count; let edge = 0;
    while (edge < lengths.length - 1 && along > lengths[edge]) along -= lengths[edge++];
    const a = ordered[edge]; const b = ordered[(edge + 1) % ordered.length];
    const t = lengths[edge] ? along / lengths[edge] : 0;
    result.push([THREE.MathUtils.lerp(a[0], b[0], t), THREE.MathUtils.lerp(a[1], b[1], t)]);
  }
  return result;
}

/** Reconstructed folded clip and rounded grip. End loft is a measured approximation,
 * not manufacturing geometry; retain the asymmetric GLB origin when placing it.
 */
export function createWardrobeShortHandle(side: 'left' | 'right'): THREE.BufferGeometry {
  const centerY = 0.9933263;
  const sections = SHORT_REAR_SECTIONS.map(([at, points]) => ({ at, points: resample(points, 256) }));
  const mirrored = [...sections].reverse().map(({ at, points }) => ({ at: centerY * 2 - at, points }));
  const rear = loft([...sections, ...mirrored], 'y');
  const low = -107.50524; const high = 109.491893;
  const rings: Ring[] = [{ at: 0, points: capsule(4, low, high, -2.5) }, { at: 18, points: capsule(4, low, high, -2.5) }];
  for (let i = 1; i <= 11; i++) {
    const angle = i * Math.PI / 22;
    const radius = Math.max(0.0001, 4 * Math.cos(angle));
    rings.push({ at: 18 + 4 * Math.sin(angle), points: capsule(radius, low, high, -2.5) });
  }
  const geometry = combine([rear, loft(rings, 'z')]);
  if (side === 'right') {
    geometry.scale(-1, 1, 1);
    // Negative scale baked into positions reverses face winding.
    const p = geometry.getAttribute('position'); const n = geometry.getAttribute('normal');
    for (let i = 0; i < p.count; i += 3) {
      for (const attribute of [p, n]) {
        const a = new THREE.Vector3().fromBufferAttribute(attribute, i);
        const b = new THREE.Vector3().fromBufferAttribute(attribute, i + 2);
        attribute.setXYZ(i, b.x, b.y, b.z); attribute.setXYZ(i + 2, a.x, a.y, a.z);
      }
    }
  }
  return finish(geometry, `wardrobe-short-handle-${side}`);
}

// Measurements in mm from the local reference models; these are sections, not copied mesh indices.
const GRIP_RINGS: ReadonlyArray<readonly [number, ReadonlyArray<Point>]> = [[-0.0,[[-0.5,-118.5671],[-0.4103,-119.1333],[-0.349,-119.2536],[-0.2536,-119.349],[-0.1333,-119.4103],[-0.0,-119.4314],[0.1333,-119.4103],[0.2536,-119.349],[0.349,-119.2536],[0.4103,-119.1333],[0.5,-118.5671],[0.5,118.5671],[0.4103,119.1333],[0.349,119.2536],[0.2536,119.349],[0.1333,119.4103],[-0.0,119.4314],[-0.1333,119.4103],[-0.2536,119.349],[-0.349,119.2536],[-0.4103,119.1333],[-0.5,118.5671]]],[0.419,[[-2.6048,-118.7328],[-2.437,-119.7918],[-2.0731,-120.5062],[-1.5062,-121.0731],[-0.7918,-121.437],[-0.0,-121.5624],[0.7918,-121.437],[1.5062,-121.0731],[2.0731,-120.5062],[2.437,-119.7918],[2.6048,-118.7328],[2.6048,118.7328],[2.437,119.7918],[2.0731,120.5062],[1.5062,121.0731],[0.7918,121.437],[-0.0,121.5624],[-0.7918,121.437],[-1.5062,121.0731],[-2.0731,120.5062],[-2.437,119.7918],[-2.6048,118.7328]]],[1.611,[[-4.3891,-118.8732],[-4.1552,-120.3501],[-3.5346,-121.568],[-2.568,-122.5346],[-1.3501,-123.1552],[-0.0,-123.369],[1.3501,-123.1552],[2.568,-122.5346],[3.5346,-121.568],[4.1552,-120.3501],[4.3891,-118.8732],[4.3891,118.8732],[4.1552,120.3501],[3.5346,121.568],[2.568,122.5346],[1.3501,123.1552],[-0.0,123.369],[-1.3501,123.1552],[-2.568,122.5346],[-3.5346,121.568],[-4.1552,120.3501],[-4.3891,118.8732]]],[3.395,[[-5.5813,-118.9671],[-5.3032,-120.7231],[-4.5112,-122.2776],[-3.2776,-123.5112],[-1.7231,-124.3032],[-0.0,-124.5761],[1.7231,-124.3032],[3.2776,-123.5112],[4.5112,-122.2776],[5.3032,-120.7231],[5.5813,-118.9671],[5.5813,118.9671],[5.3032,120.7231],[4.5112,122.2776],[3.2776,123.5112],[1.7231,124.3032],[-0.0,124.5761],[-1.7231,124.3032],[-3.2776,123.5112],[-4.5112,122.2776],[-5.3032,120.7231],[-5.5813,118.9671]]],[5.5,[[-6.0,-119.0],[-5.7063,-120.8541],[-4.8541,-122.5267],[-3.5267,-123.8541],[-1.8541,-124.7063],[-0.0,-125.0],[1.8541,-124.7063],[3.5267,-123.8541],[4.8541,-122.5267],[5.7063,-120.8541],[6.0,-119.0],[6.0,119.0],[5.7063,120.8541],[4.8541,122.5267],[3.5267,123.8541],[1.8541,124.7063],[-0.0,125.0],[-1.8541,124.7063],[-3.5267,123.8541],[-4.8541,122.5267],[-5.7063,120.8541],[-6.0,119.0]]],[19,[[-6.0,-119.0],[-5.7063,-120.8541],[-4.8541,-122.5267],[-3.5267,-123.8541],[-1.8541,-124.7064],[-0.0,-125.0],[1.8541,-124.7064],[3.5267,-123.8541],[4.8541,-122.5267],[5.7063,-120.8541],[6.0,-119.0],[6.0,119.0],[5.7063,120.8541],[4.8541,122.5267],[3.5267,123.8541],[1.8541,124.7063],[-0.0,125.0],[-1.8541,124.7063],[-3.5267,123.8541],[-4.8541,122.5267],[-5.7063,120.8541],[-6.0,119.0]]],[20,[[-5.0,-118.9213],[-4.7434,-120.5412],[-4.035,-121.9316],[-2.9316,-123.035],[-1.5412,-123.7434],[-0.0,-123.9875],[1.5412,-123.7434],[2.9316,-123.035],[4.035,-121.9316],[4.7434,-120.5412],[5.0,-118.9213],[5.0,118.9213],[4.7434,120.5412],[4.035,121.9316],[2.9316,123.035],[1.5412,123.7434],[-0.0,123.9875],[-1.5412,123.7434],[-2.9316,123.035],[-4.035,121.9316],[-4.7434,120.5412],[-5.0,118.9213]]]];
const SHORT_REAR_SECTIONS: ReadonlyArray<readonly [number, ReadonlyArray<Point>]> = [[-111.5042,[[-21.6328,-18.948],[-21.7377,-18.511],[-21.7332,-18.4522],[-21.8622,-17.9406],[-2.3809,-18.4507],[-2.3742,-19.4512]]],[-111.35,[[-22.5343,-18.9551],[-22.5453,-19.0783],[-2.404,-19.6057],[-1.688,-19.5693],[-1.1822,-19.4792],[-1.1942,-18.4818],[-22.8112,-17.9157],[-22.7329,-18.1282]]],[-111.2,[[-22.9269,-18.9685],[-23.196,-17.9057],[-0.7042,-18.4946],[-0.6914,-19.4908],[-1.06,-19.5975],[-1.7488,-19.7256],[-2.408,-19.7557],[-22.8911,-19.2193]]],[-110.9,[[-23.709,-17.904],[-23.3506,-19.4021],[-1.4561,-19.9754],[-1.0036,-19.8612],[-0.0308,-19.5063],[-0.0403,-18.3547],[-0.195,-18.4863],[-0.3075,-18.505]]],[-110.6,[[-23.6973,-19.4051],[-24.0505,-17.9262],[-23.3426,-17.9018],[-0.2503,-18.501],[-0.015,-18.298],[-0.0389,-0.1529],[-0.1901,-0.0209],[-0.2991,-0.0001],[0.4008,0],[0.402,-12.6565],[0.4498,-19.4993],[0.1481,-19.6785],[-0.5623,-19.9988]]],[-110.3,[[-23.9553,-19.4239],[-24.3082,-17.9552],[-23.6781,-17.9025],[-0.2502,-18.501],[-0.0149,-18.2976],[-0.0394,-0.1521],[-0.1906,-0.0208],[-0.2998,0],[0.8277,0],[0.8335,-19.3747],[0.4756,-19.7375],[-0.0,-20.013],[-23.6452,-19.4021]]],[-110,[[-24.1526,-19.4481],[-23.3819,-19.4013],[0.2135,-19.9978],[0.6207,-19.8782],[0.9348,-19.5129],[1.1169,-19.2075],[1.1175,0],[-0.2435,-0.0054],[-0.0144,-0.2093],[-0.0406,-18.3553],[-0.1968,-18.4868],[-0.3078,-18.505],[-23.6847,-17.9026],[-24.5063,-17.9851]]],[-109.5,[[-24.3834,-19.4874],[-23.6368,-19.402],[0.2149,-19.9975],[0.7068,-19.8359],[1.1124,-19.5193],[1.2661,-19.3162],[1.3885,-18.9085],[1.3776,0],[-0.2435,-0.0054],[-0.0066,-0.2382],[-0.0408,-18.3556],[-0.1977,-18.487],[-0.3078,-18.505],[-23.6852,-17.9026],[-24.7276,-18.0271]]],[-108.85,[[-24.531,-19.5188],[-23.8736,-19.4154],[-23.3819,-19.4013],[0.2168,-19.9972],[0.6099,-19.8834],[1.0421,-19.5919],[1.3703,-19.1231],[1.4964,-18.6172],[1.5,0],[-0.2434,-0.0054],[-0.0254,-0.1801],[0.0,-0.3],[-0.041,-18.356],[-0.1989,-18.4873],[-0.3078,-18.505],[-23.6859,-17.9026],[-24.671,-18.0153],[-24.8777,-18.0601]]],[-108.504,[[-24.384,-19.4875],[-24.5502,-19.5241],[-24.9004,-18.0655],[-24.2575,-17.9478],[-23.6863,-17.9026],[-0.2499,-18.5009],[-0.026,-18.3267],[0.0,-18.2051],[-0.0547,-0.1277],[-0.2434,-0.0054],[1.5,0],[1.4753,-18.7838],[1.2831,-19.2899],[0.9608,-19.6644],[0.5115,-19.9231],[-0.0006,-20.013],[-23.3819,-19.4013]]]];

const LIGHT_PROFILE_YZ: ReadonlyArray<Point> = [[-10.5006,-21.6118],[-10.5006,-15.5264],[-10.454,-15.1731],[-5.2043,4.3578],[-4.9416,4.9613],[-4.5556,5.4945],[-1.8559,8.2534],[-6.8255,13.1339],[-9.0408,10.9346],[-11.7695,8.2365],[-12.0635,8.0628],[-12.4135,8.0426],[-12.7255,8.1814],[-12.9091,8.3272],[-13.1186,8.5173],[-13.2615,8.68],[-13.4437,9.0021],[-13.5183,9.3994],[-13.4651,9.7656],[-12.1932,13.2162],[-8.1133,24.4712],[-8.0126,24.6359],[-7.8568,24.7565],[-7.6876,24.8006],[-6.0506,24.8006],[-6.0006,24.7506],[-6.0006,22.8006],[-6.7873,22.8006],[-6.9569,22.7565],[-7.1135,22.6359],[-7.2153,22.4712],[-10.6721,13.0814],[-10.6982,12.843],[-10.6172,12.6056],[-10.4508,12.4328],[-10.3529,12.3713],[-10.1246,12.2961],[-9.8745,12.3253],[-9.6697,12.4511],[-6.8452,15.3193],[0.3294,8.2732],[-3.6898,4.2124],[-9.0006,-15.5417],[-9.0006,-22.1603],[-9.0506,-22.2103],[-9.9021,-22.2103],[-10.2014,-22.1301],[-10.4204,-21.911]];

/** Measured asymmetric aluminium section, including the inner retaining lip. */
export function createWardrobeLightProfile(widthCm: number): THREE.BufferGeometry {
  const width = positiveLength(widthCm);
  const geometry = extrusion(LIGHT_PROFILE_YZ, width);
  // Extrusion XY=(Y,Z), local Z becomes wardrobe X. No profile recentering.
  geometry.applyMatrix4(new THREE.Matrix4().set(0,0,1,0, 1,0,0,0, 0,1,0,0, 0,0,0,1));
  return finish(geometry, 'wardrobe-light-profile');
}

/** Three observed faces of the diffuser. The reference asset is open on its back. */
export function createWardrobeLightDiffuser(widthCm: number): THREE.BufferGeometry {
  const width = positiveLength(widthCm);
  const profile: Point[] = [[-9.1407169,10.5265919],[-10.3070848,9.3350662],[-5.5409824,4.6695983],[-4.3746154,5.8611240]];
  const positions: number[] = [];
  for (let i = 0; i < profile.length - 1; i++) {
    const [ay, az] = profile[i]; const [by, bz] = profile[i + 1];
    const left = -width * 0.4993801005; const right = width * 0.5000000354;
    positions.push(left,ay,az, right,ay,az, right,by,bz, left,ay,az, right,by,bz, left,by,bz);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return finish(geometry, 'wardrobe-light-diffuser');
}
