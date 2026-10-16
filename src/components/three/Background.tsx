'use client';

import { useMemo, useEffect, Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { StudioPerson } from './StudioPerson';

interface BackgroundProps {
  shelfWidth: number;
  shelfDepth: number;
  shelfHeight?: number;
}

/**
 * 접지 그림자 데칼 — 선반 바로 아래 바닥에 깔리는 부드러운 그림자 텍스처.
 * 선반 발판 영역을 캔버스에 블러로 그려 평면에 입힌다. (선반은 z=0~depth)
 */
const CONTACT_MARGIN = 14; // cm, 선반 밖으로 번지는 범위

export function ContactShadowDecal({ shelfWidth, shelfDepth }: BackgroundProps) {
  const planeW = shelfWidth + CONTACT_MARGIN * 2;
  const planeD = shelfDepth + CONTACT_MARGIN * 2;

  const texture = useMemo(() => {
    const pxPerCm = 4;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(planeW * pxPerCm);
    canvas.height = Math.ceil(planeD * pxPerCm);
    const ctx = canvas.getContext('2d')!;
    // 사각형을 캔버스 밖에 그리고 그림자만 안쪽으로 오프셋 → 블러된 발판 그림자만 남김
    const off = canvas.width + 100;
    ctx.shadowColor = 'rgba(0,0,0,1)';
    ctx.shadowBlur = CONTACT_MARGIN * pxPerCm * 0.9;
    ctx.shadowOffsetX = off;
    ctx.fillStyle = '#000';
    const inset = (CONTACT_MARGIN - 2) * pxPerCm;
    ctx.fillRect(inset - off, inset, canvas.width - inset * 2, canvas.height - inset * 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [planeW, planeD]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, shelfDepth / 2]} renderOrder={1}>
      <planeGeometry args={[planeW, planeD]} />
      <meshBasicMaterial map={texture} transparent opacity={0.45} depthWrite={false} color="#000000" />
    </mesh>
  );
}

const STUDIO = '/three/reference-studio';

function OriginalStudio({ shelfWidth, shelfHeight = 180, shelfDepth }: BackgroundProps) {
  const background = useGLTF(`${STUDIO}/geometry/bg.glb`);
  const [map, aoMap, alphaMap] = useLoader(THREE.TextureLoader, [
    `${STUDIO}/texture/bg_shadow.png`, `${STUDIO}/texture/bg_ao.png`, `${STUDIO}/texture/bg_alpha.png`,
  ]);
  // 바닥은 거의 수평으로 보이므로 이방성 필터로 그림자/AO 텍스처 번짐을 막는다
  for (const texture of [map, aoMap, alphaMap]) texture.anisotropy = 16;
  const backgroundMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#E4E6E6', map, aoMap, aoMapIntensity: 1, lightMap: aoMap,
    lightMapIntensity: 0, alphaMap, roughness: .44, metalness: 0,
    opacity: .66, transparent: true, envMapIntensity: .88, depthWrite: false,
  }), [map, aoMap, alphaMap]);
  const room = useMemo(() => {
    const clone = background.scene.clone(true);
    clone.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.material = backgroundMaterial;
        object.castShadow = false; object.receiveShadow = true;
        object.userData.excludeFromAO = true;
      }
    });
    return clone;
  }, [background.scene, backgroundMaterial]);
  useEffect(() => () => backgroundMaterial.dispose(), [backgroundMaterial]);
  // Source scene uses metres; Befun uses centimetres. Preserve GLB node rotations.
  // bg scale = dimensions in cm.
  return <group name="reference-studio-background">
    <primitive object={room} scale={[shelfWidth, shelfHeight, shelfDepth]} dispose={null}/>
    <Suspense fallback={null}><StudioPerson shelfWidth={shelfWidth}/></Suspense>
  </group>;
}

export function Background(props: BackgroundProps) {
  return <Suspense fallback={null}><OriginalStudio {...props}/></Suspense>;
}
