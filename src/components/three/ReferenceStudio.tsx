'use client';

import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';

const FACES = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(face => `/three/reference-studio/env/${face}.jpg`);

/** Shared source default preset. Material-specific source branches are not yet mapped. */
export function ReferenceStudio({ width, height, shadows = true, background = true }: {
  width: number; height: number; shadows?: boolean; background?: boolean;
}) {
  const getSceneState = useThree(state => state.get);
  const shadowMapSize = useThree(state => Math.min(state.size.width <= 650 ? 2048 : 4096, state.gl.capabilities.maxTextureSize));
  useLayoutEffect(() => {
    const scene = getSceneState().scene;
    const previous = scene.environmentIntensity;
    // r182 uses the scene intensity (not material.envMapIntensity) when
    // materials inherit scene.environment. Limit the white grazing reflection.
    // Befun visual calibration, not a measured source material specification.
    scene.environmentIntensity = 0.4;
    return () => { scene.environmentIntensity = previous; };
  }, [getSceneState]);
  const [cube] = useLoader(THREE.CubeTextureLoader, [FACES]);
  const environment = useMemo(() => {
    const texture = cube.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [cube]);
  const probe = useMemo(() => {
    const light = LightProbeGenerator.fromCubeTexture(environment);
    light.intensity = .62; // 균일한 주변광을 줄여 면별 명암 대비 확보 (원본 .89)
    return light;
  }, [environment]);
  useEffect(() => () => environment.dispose(), [environment]);
  const halfWidth = 70 + (width - 40) / 2;
  // The old -400 cm lower bound spent most shadow texels below the furniture.
  // Keep the person/floor projection in view while resolving thin handle edges.
  const shadowBottom = -Math.max(100, width * .3);
  return <>
    <primitive object={environment} attach="environment" dispose={null}/>
    {background && <color attach="background" args={['#E4E6E6']}/>}
    <primitive object={probe}/>
    <directionalLight key={shadowMapSize} position={[-252, 352, 526]} intensity={3.3} castShadow={shadows}
      shadow-intensity={.75} shadow-mapSize={[shadowMapSize, shadowMapSize]} shadow-camera-near={100}
      shadow-camera-far={870} shadow-camera-left={-halfWidth - 130} shadow-camera-right={halfWidth}
      shadow-camera-top={Math.max(height + 60, 235)} shadow-camera-bottom={shadowBottom} shadow-bias={-.0005} shadow-normalBias={.12}
      shadow-radius={1.5}/>
    <directionalLight position={[-300, 300, 300]} intensity={.55}/>
    <directionalLight position={[700, 700, 1000]} intensity={.25}/>
  </>;
}
