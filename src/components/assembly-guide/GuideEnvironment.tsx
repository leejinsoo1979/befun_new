'use client';

import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { WebGLRenderer } from 'three';

function reportRenderer(gl: WebGLRenderer) {
  gl.domElement.dataset.rendererState = gl.getContext().isContextLost() ? 'context-lost' : 'ready';
  gl.domElement.dataset.renderGeometries = String(gl.info.memory.geometries);
  gl.domElement.dataset.renderTextures = String(gl.info.memory.textures);
  gl.domElement.dataset.renderPrograms = String(gl.info.programs?.length ?? 0);
}

/** Befun studio lightformers; one soft shadow light across all guide topics. */
export function GuideEnvironment() {
  const gl = useThree(state => state.gl);
  const sample = useRef({ seconds: 0, frames: 0 });
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const report = () => reportRenderer(gl);
    report();
    const interval = window.setInterval(report, 1000);
    return () => window.clearInterval(interval);
  }, [gl]);
  useFrame(({ gl }, delta) => {
    if (process.env.NODE_ENV !== 'development') return;
    sample.current.seconds += delta; sample.current.frames++;
    if (sample.current.seconds >= 1) {
      gl.domElement.dataset.renderFps = (sample.current.frames / sample.current.seconds).toFixed(1);
      sample.current = { seconds: 0, frames: 0 };
    }
  });
  return <>
    <ambientLight intensity={.3} />
    <Environment resolution={256} frames={1} environmentIntensity={1.1}>
      <Lightformer form="rect" intensity={2} position={[0, 6, 3]} rotation-x={Math.PI / 2} scale={[12, 8, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[-6, 2, 4]} rotation-y={Math.PI / 3} scale={[5, 7, 1]} />
      <Lightformer form="rect" intensity={.9} position={[6, 2, 4]} rotation-y={-Math.PI / 3} scale={[5, 7, 1]} />
      <Lightformer form="rect" intensity={.6} position={[0, 1.5, 7]} scale={[10, 4, 1]} />
      <Lightformer form="rect" intensity={.3} position={[0, -3, 2]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
    </Environment>
    <directionalLight position={[-180, 300, 220]} intensity={2.3} castShadow shadow-mapSize={[1536, 1536]} shadow-radius={3} shadow-camera-left={-220} shadow-camera-right={220} shadow-camera-top={300} shadow-camera-bottom={-160} shadow-camera-near={1} shadow-camera-far={1100} shadow-bias={-.00015} shadow-normalBias={.18} />
    <directionalLight position={[160, 80, -200]} intensity={.7} />
  </>;
}
