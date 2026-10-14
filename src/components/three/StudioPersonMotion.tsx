'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';

const VIDEO = '/three/reference-studio/person/ivory-linen-motion-packed.mp4?v=alpha-interior-2';

/** One decoder keeps RGB and its foreground mask exactly frame-synchronized. */
export function StudioPersonMotion({ fallback, heelDrop }: { fallback: ReactNode; heelDrop: number }) {
  const [material, setMaterial] = useState<THREE.MeshBasicMaterial | null>(null);
  const [shadow, setShadow] = useState<THREE.MeshDepthMaterial | null>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let disposed = false;
    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = VIDEO;
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const motionMaterial = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, alphaTest: 8 / 255,
      depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
    });
    motionMaterial.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
        THREE.ShaderChunk.map_fragment.replace('vMapUv', 'vec2(vMapUv.x * 0.5, vMapUv.y)') +
        '\ndiffuseColor.a *= texture2D(map, vec2(vMapUv.x * 0.5 + 0.5, vMapUv.y)).r;');
    };
    motionMaterial.customProgramCacheKey = () => 'studio-person-packed-alpha-v1';
    // The visible RGB and shadow silhouette share one frame/decoder.
    // The scene's key light projects this cutout onto real floor/wall geometry.
    const shadowMaterial = new THREE.MeshDepthMaterial({
      map: texture, depthPacking: THREE.RGBADepthPacking,
      alphaTest: 0.5, side: THREE.DoubleSide,
    });
    shadowMaterial.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        diffuseColor.a *= texture2D(map, vec2(vMapUv.x * 0.5 + 0.5, vMapUv.y)).r;
      `);
    };
    shadowMaterial.customProgramCacheKey = () => 'studio-person-light-shadow-v2';
    const ready = () => { if (!disposed) { setMaterial(motionMaterial); setShadow(shadowMaterial); } };
    const failed = () => { if (!disposed) setMaterial(null); };
    const play = () => { void video.play().catch(failed); };
    const visibility = () => { if (document.hidden) video.pause(); else play(); };
    video.addEventListener('playing', ready);
    video.addEventListener('error', failed);
    document.addEventListener('visibilitychange', visibility);
    play();
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', visibility);
      video.removeEventListener('playing', ready);
      video.removeEventListener('error', failed);
      video.pause();
      video.removeAttribute('src');
      video.load();
      texture.dispose();
      motionMaterial.dispose();
      shadowMaterial.dispose();
    };
  }, []);
  if (!material) return fallback;
  return <group>
    <mesh key="video-person" position={[-3 * 175 / 1522, 175 / 2 - heelDrop, 0]}
    material={material} customDepthMaterial={shadow ?? undefined} castShadow renderOrder={2} raycast={() => null} userData={{ excludeFromAO: true }}>
    <planeGeometry args={[175 * 448 / 672, 175]}/>
  </mesh>
  </group>;
}
