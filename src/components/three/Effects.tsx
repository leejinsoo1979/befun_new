'use client';

import { useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * GTAO가 G-buffer(노멀/깊이)를 그릴 때 투명 메쉬도 숨긴다.
 * 기본 GTAOPass는 Points/Line만 제외해서, 투명한 행 콜라이더(opacity 0)나
 * 사람 실루엣 평면이 불투명 면처럼 취급되어 AO 얼룩이 생긴다.
 * userData.excludeFromAO 메쉬(벽/바닥)도 제외 — 비스듬한 시점에서 벽-바닥 모서리에 계단 무늬가 생김.
 */
class OpaqueGTAOPass extends GTAOPass {
  _overrideVisibility() {
    // @ts-expect-error -- three 내부 메서드 확장
    super._overrideVisibility();
    // @ts-expect-error -- three 내부 캐시 사용 (_restoreVisibility가 복원)
    const cache: THREE.Object3D[] = this._visibilityCache;
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      const mat = mesh.material;
      const transparent = Array.isArray(mat) ? mat.some((m) => m.transparent) : mat?.transparent;
      if (transparent || mesh.userData.excludeFromAO) {
        mesh.visible = false;
        cache.push(mesh);
      }
    });
  }
}

/**
 * 후처리: 렌더 → GTAO(앰비언트 오클루전) → 톤매핑/색공간 출력
 * 칸 안쪽 모서리와 패널 접합부에 자연스러운 음영을 준다. 단위는 cm.
 */
export function Effects() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const composer = useMemo(() => {
    // HalfFloat + MSAA: 톤매핑 전 HDR 유지, 컴포저 사용 시 사라지는 안티앨리어싱 보완
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    const c = new EffectComposer(gl, target);
    c.addPass(new RenderPass(scene, camera));

    const ao = new OpaqueGTAOPass(scene, camera, 1, 1);
    ao.updateGtaoMaterial({ radius: 12, distanceExponent: 1.5, thickness: 4, scale: 1, samples: 16, distanceFallOff: 1 });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 8, rings: 2, samples: 16 });
    ao.blendIntensity = 0.65;
    c.addPass(ao);

    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
  }, [composer, dpr, size.width, size.height]);

  useEffect(() => () => composer.dispose(), [composer]);

  // priority 1: R3F 기본 렌더를 대체
  useFrame(() => {
    composer.render();
  }, 1);

  return null;
}
