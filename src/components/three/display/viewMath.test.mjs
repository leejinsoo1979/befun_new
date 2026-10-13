import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { fitView, VIEW_DIRECTIONS } from './viewMath.ts';
import { assembledClone } from './assembledClone.ts';
import { originalDisplayMaterials } from './appearanceRegistry.ts';

test('all box corners fit every preset in portrait and landscape, both projections', () => {
  for (const view of Object.keys(VIEW_DIRECTIONS)) for (const aspect of [0.45, 1, 2.5]) {
    for (const [width, height, depth] of [[450, 43, 40], [30, 228, 24], [750, 390, 180]]) {
      const f = fitView(width, height, depth, aspect, view);
      const right = new Vector3().crossVectors(f.up, f.direction).normalize();
      const up = new Vector3().crossVectors(f.direction, right).normalize();
      for (const x of [-width / 2, width / 2]) for (const y of [-height / 2, height / 2]) for (const z of [-depth / 2, depth / 2]) {
        const p = new Vector3(x, y, z);
        const cameraDepth = f.distance - p.dot(f.direction);
        assert.ok(Math.abs(p.dot(up)) < cameraDepth * Math.tan(Math.PI / 9), view);
        assert.ok(Math.abs(p.dot(right)) < cameraDepth * Math.tan(Math.PI / 9) * aspect, view);
        assert.ok(Math.abs(p.dot(up)) < f.halfHeight, view);
        assert.ok(Math.abs(p.dot(right)) < f.halfHeight * aspect, view);
      }
    }
  }
});

test('AR export restores exploded transforms without changing live geometry or display', () => {
  const root = new Group();
  const part = new Group();
  part.position.set(30, 40, 50);
  part.userData.displayExplodedPart = true;
  const panel = new Mesh(new BoxGeometry(2, 38, 40), new MeshStandardMaterial());
  panel.position.set(10, 20, 30);
  part.add(panel); root.add(part);
  const copy = assembledClone(root);
  const clonePanel = copy.children[0].children[0];
  assert.deepEqual(clonePanel.getWorldPosition(new Vector3()).toArray(), [10, 20, 30]);
  assert.deepEqual(part.position.toArray(), [30, 40, 50]);
  assert.equal(clonePanel.geometry, panel.geometry);
  assert.equal(clonePanel.material, panel.material);
  panel.geometry.dispose(); panel.material.dispose();
});


test('AR clone restores real materials from wireframe/transparent without changing the screen', () => {
  const root = new Group();
  const real = new MeshStandardMaterial({ color: '#123456' });
  const transparent = new MeshStandardMaterial({ transparent: true, opacity: 0 });
  const mesh = new Mesh(new BoxGeometry(10, 20, 30), transparent);
  root.add(mesh);
  originalDisplayMaterials.set(mesh, real);
  const copy = assembledClone(root);
  assert.equal(copy.children[0].material, real);
  assert.equal(copy.children[0].material.transparent, false);
  assert.equal(mesh.material, transparent);
  originalDisplayMaterials.delete(mesh);
  real.dispose(); transparent.dispose(); mesh.geometry.dispose();
});
