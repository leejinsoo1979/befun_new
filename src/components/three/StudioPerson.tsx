'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { StudioPersonMotion } from './StudioPersonMotion';

const PHOTO = '/three/reference-studio/person/ivory-linen-woman.png';
// Original 1024×1536 RGBA image. Visible alpha > 8: y=3..1525.
// 175 cm is a display scale reference, not the photographed person's measured height.
const CM_PER_PIXEL = 175 / (1525 - 3);
// User-requested heel alignment: lower the photo, keeping contact decals on y=0.
const HEEL_DROP_CM = 5;
// Visible alpha spans x314..716. Keep even a yawed edge in front of z=0.
const WALL_CLEARANCE = Math.max(515 - 314, 716 - 515) * CM_PER_PIXEL + 3;

/** Upright camera-facing photograph, anchored at its feet in the studio. */
export function StudioPerson({ shelfWidth }: { shelfWidth: number }) {
  const root = useRef<THREE.Group>(null);
  const facing = useRef<THREE.Group>(null);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const loaded = useLoader(THREE.TextureLoader, PHOTO);
  const texture = useMemo(() => {
    const copy = loaded.clone();
    copy.colorSpace = THREE.SRGBColorSpace;
    copy.needsUpdate = true;
    return copy;
  }, [loaded]);
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1024 * CM_PER_PIXEL, 1536 * CM_PER_PIXEL, 64, 128);
    const positions = plane.attributes.position;
    // The photograph's left toes end at y1507, right toes at y1525.
    // Flatten only the lower ankle area onto the same physical ground plane.
    // Preserve the source pixels and the upper body's proportions.
    for (let i = 0; i < positions.count; i++) {
      const px = positions.getX(i) / CM_PER_PIXEL + 512;
      const py = 768 - positions.getY(i) / CM_PER_PIXEL;
      const leftFoot = 1 - THREE.MathUtils.smoothstep(px, 550, 610);
      const ankle = THREE.MathUtils.smoothstep(py, 1440, 1507);
      positions.setY(i, positions.getY(i) - 18 * CM_PER_PIXEL * leftFoot * ankle);
    }
    positions.needsUpdate = true;
    plane.computeBoundingBox();
    plane.computeBoundingSphere();
    return plane;
  }, []);
  const contact = useMemo(() => {
    const size = 64;
    const pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const r = Math.hypot((x + .5 - size / 2) / (size / 2), (y + .5 - size / 2) / (size / 2));
      pixels[(y * size + x) * 4 + 3] = Math.round(72 * Math.max(0, 1 - r) ** 2);
    }
    const map = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
    map.needsUpdate = true;
    return map;
  }, []);
  useEffect(() => () => { texture.dispose(); contact.dispose(); geometry.dispose(); }, [texture, contact, geometry]);

  useFrame(({ camera }) => {
    if (!root.current || !facing.current) return;
    camera.getWorldPosition(cameraPosition);
    root.current.worldToLocal(cameraPosition);
    // Rotate around the vertical axis only: looking down must not tip the feet up.
    if (cameraPosition.x ** 2 + cameraPosition.z ** 2 > 1e-8) {
      facing.current.rotation.y = Math.atan2(cameraPosition.x, cameraPosition.z);
    }
  });

  return <group ref={root} name="studio-person" position={[-(shelfWidth / 2 + 56), 0, WALL_CLEARANCE]}>
    <group ref={facing}>
      {[480, 675].map(footX => <mesh key={footX}
        position={[(footX - 515) * CM_PER_PIXEL, .03, 0]}
        rotation={[-Math.PI / 2, 0, 0]} renderOrder={1} raycast={() => null}
        userData={{ excludeFromAO: true }}>
        <planeGeometry args={[15, 11]}/>
        <meshBasicMaterial map={contact} transparent depthWrite={false} toneMapped={false}/>
      </mesh>)}
      <StudioPersonMotion heelDrop={HEEL_DROP_CM} fallback={<mesh
        geometry={geometry}
        position={[(512 - 515) * CM_PER_PIXEL, (1525 - 768) * CM_PER_PIXEL - HEEL_DROP_CM, 0]}
        renderOrder={2}
        raycast={() => null}
        userData={{ excludeFromAO: true }}
      >
        <meshBasicMaterial map={texture} transparent alphaTest={8 / 255} depthWrite={false} toneMapped={false} side={THREE.DoubleSide}/>
      </mesh>} />
    </group>
  </group>;
}
