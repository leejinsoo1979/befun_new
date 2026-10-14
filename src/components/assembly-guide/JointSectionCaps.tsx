'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { AlwaysStencilFunc, BackSide, Color, DecrementWrapStencilOp, DoubleSide, FrontSide, Group, IncrementWrapStencilOp, Mesh, MeshBasicMaterial, NotEqualStencilFunc, Plane, PlaneGeometry, ReplaceStencilOp } from 'three';

type Entry = { source: Mesh; group: Group };

/**
 * Stencil closes only the section of the existing HW mesh. Geometry is borrowed,
 * never changed/disposed; cap rectangles are masked by its actual solid volume.
 * Guide contract: local slot Y maps to world ±X, the inspection plane normal.
 */
export function JointSectionCaps({ sources, active, planes, model }: { sources: readonly RefObject<Group | null>[]; active: RefObject<boolean>; planes: RefObject<Plane[]>; model: string }) {
  const root = useRef<Group>(null);
  const entries = useRef<Entry[]>([]);
  useLayoutEffect(() => {
    const container = root.current;
    const plane = planes.current[0];
    if (!container) return;
    const cleanups: Array<() => void> = [];
    const next: Entry[] = [];
    for (const sourceGroup of sources) sourceGroup.current?.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const source = object;
      const positions = source.geometry.attributes.position;
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let i = 0; i < positions.count; i++) {
        x0 = Math.min(x0, positions.getX(i)); x1 = Math.max(x1, positions.getX(i));
        z0 = Math.min(z0, positions.getZ(i)); z1 = Math.max(z1, positions.getZ(i));
      }
      const order = 10 + next.length * 3;
      const group = new Group();
      const masks = [BackSide, FrontSide].map((side, i) => {
        const operation = i === 0 ? IncrementWrapStencilOp : DecrementWrapStencilOp;
        const material = new MeshBasicMaterial({ side, clippingPlanes: [plane], depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: AlwaysStencilFunc, stencilFail: operation, stencilZFail: operation, stencilZPass: operation });
        const mesh = new Mesh(source.geometry, material);
        mesh.renderOrder = order; mesh.matrixAutoUpdate = false; mesh.frustumCulled = false;
        mesh.onBeforeRender = () => { source.updateWorldMatrix(true, false); mesh.matrixWorld.copy(source.matrixWorld); };
        group.add(mesh);
        return material;
      });
      const sourceMaterial = Array.isArray(source.material) ? source.material[0] : source.material;
      const colour = 'color' in sourceMaterial && sourceMaterial.color instanceof Color ? sourceMaterial.color : new Color('#aeb5bf');
      const capMaterial = new MeshBasicMaterial({ color: colour, side: DoubleSide, stencilWrite: true, stencilRef: 0, stencilFunc: NotEqualStencilFunc, stencilFail: ReplaceStencilOp, stencilZFail: ReplaceStencilOp, stencilZPass: ReplaceStencilOp, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const capGeometry = new PlaneGeometry((x1 - x0) * 1.05, (z1 - z0) * 1.05);
      capGeometry.rotateX(Math.PI / 2); capGeometry.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
      const cap = new Mesh(capGeometry, capMaterial);
      cap.renderOrder = order + 1; cap.matrixAutoUpdate = false; cap.frustumCulled = false;
      cap.onBeforeRender = () => {
        source.updateWorldMatrix(true, false); cap.matrixWorld.copy(source.matrixWorld);
        cap.matrixWorld.elements[12] = plane.constant - .002;
      };
      cap.onAfterRender = renderer => renderer.clearStencil();
      group.add(cap); container.add(group); next.push({ source, group });
      cleanups.push(() => { container.remove(group); masks.forEach(material => material.dispose()); capMaterial.dispose(); capGeometry.dispose(); });
    });
    entries.current = next;
    return () => { entries.current = []; cleanups.forEach(cleanup => cleanup()); };
  }, [sources, planes, model]);

  useFrame(() => {
    if (root.current) root.current.visible = active.current;
    for (let i = 0; i < entries.current.length; i++) {
      let visible = true;
      for (let parent = entries.current[i].source.parent; parent; parent = parent.parent) if (!parent.visible) { visible = false; break; }
      entries.current[i].group.visible = visible;
    }
  });
  return <group ref={root} dispose={null} />;
}
