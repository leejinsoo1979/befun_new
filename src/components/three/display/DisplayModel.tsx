'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDisplayStore } from './displayStore';
import { originalDisplayMaterials } from './appearanceRegistry';

type Override = {
  original: THREE.Material | THREE.Material[];
  applied: THREE.Material | THREE.Material[];
  edges: THREE.LineSegments;
};

function restore(mesh: THREE.Mesh, entry: Override) {
  if (mesh.material === entry.applied) mesh.material = entry.original;
  mesh.remove(entry.edges);
  entry.edges.geometry.dispose();
  (entry.edges.material as THREE.Material).dispose();
  for (const material of Array.isArray(entry.applied) ? entry.applied : [entry.applied]) material.dispose();
  originalDisplayMaterials.delete(mesh);
}

/** Overrides presentation materials only; source materials and geometry remain intact. */
export function DisplayModel({ name, children }: { name: string; children: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  const entries = useRef(new Map<THREE.Mesh, Override>());
  const appearance = useDisplayStore((s) => s.appearance);

  useEffect(() => {
    const current = entries.current;
    return () => {
      current.forEach((entry, mesh) => restore(mesh, entry));
      current.clear();
    };
  }, [appearance]);

  // Geometry/materials can arrive asynchronously (textures, GLTF, style changes).
  useFrame(() => {
    if (!root.current || appearance === 'realistic') return;
    const active = new Set<THREE.Mesh>();
    root.current.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const mesh = object;
      const previous = entries.current.get(mesh);
      if (previous && mesh.material === previous.applied) { active.add(mesh); return; }
      if (previous) { restore(mesh, previous); entries.current.delete(mesh); }
      const original = mesh.material;
      const source = Array.isArray(original) ? original : [original];
      // Preserve invisible row hitboxes, text and helper planes.
      if (!source.every((m) => m instanceof THREE.MeshStandardMaterial && m.opacity > 0)) return;
      const makeMaterial = (material: THREE.Material) => {
        const base = material as THREE.MeshStandardMaterial;
        if (appearance === 'wireframe') return new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
        return new THREE.MeshPhysicalMaterial({
          color: base.color, transparent: true, opacity: 0.2, depthWrite: false,
          side: THREE.DoubleSide, roughness: 0.24, metalness: 0,
          clearcoat: 0.7, clearcoatRoughness: 0.2,
        });
      };
      const applied = Array.isArray(original) ? original.map(makeMaterial) : makeMaterial(original);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25),
        new THREE.LineBasicMaterial({ color: appearance === 'wireframe' ? '#314d5e' : '#405c69', transparent: true, opacity: appearance === 'wireframe' ? 0.85 : 0.55 }));
      edges.userData.displayOutline = true;
      edges.raycast = () => {};
      mesh.add(edges);
      originalDisplayMaterials.set(mesh, original);
      mesh.material = applied;
      entries.current.set(mesh, { original, applied, edges });
      active.add(mesh);
    });
    entries.current.forEach((entry, mesh) => {
      if (!active.has(mesh)) { restore(mesh, entry); entries.current.delete(mesh); }
    });
  });

  return <group ref={root} name={name}>{children}</group>;
}
