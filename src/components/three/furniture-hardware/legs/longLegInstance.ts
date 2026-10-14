import type * as THREE from 'three';

/**
 * 원본 장다리 인스턴스 생성/해제 (R3F 없이 쓰는 순수 함수 — 검사와 컴포넌트가 공유).
 *
 * 소유권:
 *  - geometry: GLTF 로더 캐시(useGLTF) 소유. clone(true)는 geometry를 공유하므로 **여기서 dispose하지 않는다**.
 *  - material: 호출자 주입·호출자 소유. 여기서 dispose하지 않는다. 주입하지 않으면 GLB 기본 재질(로더 소유) 유지.
 *  - 인스턴스(Object3D 트리)만 이 함수의 소유. release는 부모에서 떼어내기만 한다.
 */
export function createLongLegInstance(source: THREE.Object3D, material?: THREE.Material, shadows = true): THREE.Object3D {
  const object = source.clone(true);
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (material) mesh.material = material;
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
  });
  return object;
}

/** 인스턴스 해제 — 공유 geometry/material은 건드리지 않음 */
export function releaseLongLegInstance(instance: THREE.Object3D): void {
  instance.removeFromParent();
}
