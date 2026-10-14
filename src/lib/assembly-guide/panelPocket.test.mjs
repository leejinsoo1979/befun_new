import test from 'node:test';
import assert from 'node:assert/strict';
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Texture, Vector3 } from 'three';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(new URL(`${specifier}.ts`, context.parentURL).href, context);
  return next(specifier, context);
} });
const { createPocketInterior } = await import('./panelPocket.ts');
const { createMdfCutMaterial } = await import('./panelMaterials.ts');

test('face and end recesses have a real floor 12.5mm inward and continuous walls', () => {
  for (const direction of [-1, 1]) {
    const pocket = createPocketInterior([-105, 105], 9.4, 30, 12.5, direction);
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const floor = new Mesh(pocket.floor, material), walls = new Mesh(pocket.walls, material);
    floor.updateMatrixWorld(); walls.updateMatrixWorld();
    for (const z of [-105, 105]) {
      const ray = new Raycaster(new Vector3(0, -direction * 5, z), new Vector3(0, direction, 0));
      const hit = ray.intersectObject(floor)[0];
      assert.ok(hit);
      assert.ok(Math.abs(hit.point.y - direction * 12.5) < 1e-5);
      const side = new Raycaster(new Vector3(0, direction * 6, z), new Vector3(1, 0, 0)).intersectObject(walls)[0];
      assert.ok(side);
      assert.ok(Math.abs(side.point.x - 4.7) < 1e-5);
    }
    assert.equal(pocket.undercutStatus, 'unknown');
    assert.equal(pocket.manufacturingApproved, false);
    pocket.floor.dispose(); pocket.walls.dispose(); material.dispose();
  }
});

test('cut texture is owned, matte MDF rather than laminate and releases on view changes', () => {
  let materials = 0, textures = 0;
  for (const inside of [false, true, false, true]) {
    const cut = createMdfCutMaterial(inside);
    assert.ok(cut.texture instanceof Texture);
    assert.ok(cut.material.roughness > .9);
    assert.equal(cut.material.transparent, inside);
    assert.equal(cut.material.depthWrite, !inside);
    cut.material.addEventListener('dispose', () => materials++);
    cut.texture.addEventListener('dispose', () => textures++);
    cut.material.dispose(); cut.texture.dispose();
  }
  assert.equal(materials, 4); assert.equal(textures, 4);
});
