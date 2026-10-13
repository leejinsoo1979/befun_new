import * as THREE from 'three';
import { assembledClone } from '../display/assembledClone';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

const CM_TO_M = 0.01;

/** 오브젝트와 모든 조상이 보이는지 */
function isVisibleInTree(obj: THREE.Object3D): boolean {
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) {
    if (!o.visible) return false;
  }
  return true;
}

/**
 * 멀티 머티리얼(BoxGeometry 6면) 메쉬를 그룹별 단일 머티리얼 메쉬로 분리.
 * USDZExporter는 material 배열을 지원하지 않아 패널이 통째로 빠지기 때문.
 */
function splitByMaterial(mesh: THREE.Mesh): { geometry: THREE.BufferGeometry; material: THREE.Material }[] {
  const { geometry, material } = mesh;
  if (!Array.isArray(material)) return [{ geometry, material }];

  const indexed = geometry.index ? geometry : null;
  if (!indexed || geometry.groups.length === 0) return [{ geometry, material: material[0] }];

  return geometry.groups.map((g) => {
    const sub = new THREE.BufferGeometry();
    for (const name of Object.keys(geometry.attributes)) {
      sub.setAttribute(name, geometry.attributes[name]);
    }
    const src = indexed.index!.array;
    sub.setIndex(new THREE.BufferAttribute(src.slice(g.start, g.start + g.count), 1));
    return { geometry: sub, material: material[g.materialIndex ?? 0] };
  });
}

/**
 * 현재 선반을 AR Quick Look용 USDZ로 변환.
 * - 씬 단위 cm → USDZ 단위 m
 * - 선반은 z=0(벽)~depth에 놓여 있으므로 바닥 중심이 원점이 되도록 이동 (Quick Look이 원점을 바닥에 놓음)
 * - 투명/비표준 머티리얼(행 콜라이더 등)과 숨겨진 메쉬는 제외
 */
export async function exportShelfToUSDZ(shelfRoot: THREE.Object3D, depthCm: number): Promise<Blob> {
  shelfRoot.updateWorldMatrix(true, true);

  const inner = new THREE.Group();
  inner.scale.setScalar(CM_TO_M);
  inner.position.set(0, 0, (-depthCm / 2) * CM_TO_M);
  inner.updateMatrix();

  const exportRoot = assembledClone(shelfRoot);
  exportRoot.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !isVisibleInTree(mesh)) return;

    for (const { geometry, material } of splitByMaterial(mesh)) {
      const std = material as THREE.MeshStandardMaterial;
      if (!std.isMeshStandardMaterial || std.transparent) continue;
      const part = new THREE.Mesh(geometry, std);
      part.applyMatrix4(mesh.matrixWorld);
      inner.add(part);
    }
  });

  const root = new THREE.Group();
  root.add(inner);
  root.updateMatrixWorld(true);

  // 분리용 BufferGeometry는 렌더링되지 않아 GPU 자원이 없으므로 따로 dispose할 필요 없음
  const exporter = new USDZExporter();
  const buffer = await exporter.parseAsync(root, { quickLookCompatible: true, maxTextureSize: 1024 });
  return new Blob([buffer], { type: 'model/vnd.usdz+zip' });
}
