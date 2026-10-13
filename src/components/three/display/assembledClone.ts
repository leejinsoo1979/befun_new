import { Mesh, type Object3D } from 'three';
import { originalDisplayMaterials } from './appearanceRegistry.ts';

/** Clone transforms only: geometry/materials stay shared and must not be disposed here. */
export function assembledClone(source: Object3D): Object3D {
  const copy = source.clone(true);
  const restoreMaterials = (original: Object3D, cloned: Object3D) => {
    if (original instanceof Mesh && cloned instanceof Mesh) {
      cloned.material = originalDisplayMaterials.get(original) ?? original.material;
    }
    original.children.forEach((child, i) => restoreMaterials(child, cloned.children[i]));
  };
  restoreMaterials(source, copy);
  copy.traverse((part) => {
    if (part.userData.displayRestoreVisible) part.visible = true;
    if (part.userData.displayDoorPivot) part.rotation.set(0,0,0);
    const pose = part.userData.displayClosedPose as {position:number[];quaternion:number[];scale:number[]}|undefined;
    if(pose) {part.position.fromArray(pose.position);part.quaternion.fromArray(pose.quaternion);part.scale.fromArray(pose.scale);}
    if (part.userData.displayExplodedPart) {
      const anchor = part.userData.assembledPosition as [number, number, number] | undefined;
      part.position.set(...(anchor ?? [0, 0, 0] as [number, number, number]));
      part.rotation.set(0, 0, 0);
    }
  });
  copy.updateMatrixWorld(true);
  return copy;
}
