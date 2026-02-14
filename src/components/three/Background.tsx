'use client';

import { useRef, useMemo, Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const floorVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const floorFragmentShader = `
  uniform vec3 colorBack;
  uniform vec3 colorFront;
  varying vec2 vUv;
  void main() {
    vec3 color = mix(colorFront, colorBack, vUv.y);
    float edgeFade = smoothstep(0.0, 0.25, vUv.x) * smoothstep(0.0, 0.25, 1.0 - vUv.x);
    color = mix(colorFront, color, edgeFade);
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface BackgroundProps {
  shelfWidth: number;
}

function Silhouette({ shelfWidth }: { shelfWidth: number }) {
  const texture = useLoader(THREE.TextureLoader, '/imgs/bg/man.png');

  const { width: personWidth, height: personHeight, xPos } = useMemo(() => {
    const img = texture.image;
    const imgAspect = img.width / img.height;
    const h = 170;
    const w = h * imgAspect;
    const x = -(shelfWidth / 2) - w / 2 - 5;
    return { width: w, height: h, xPos: x };
  }, [texture, shelfWidth]);

  return (
    <mesh
      position={[xPos, personHeight / 2, 0.3]}
      renderOrder={1}
    >
      <planeGeometry args={[personWidth, personHeight]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export function Background({ shelfWidth }: BackgroundProps) {
  const floorRef = useRef<THREE.Mesh>(null);
  const bgWidth = 2000;
  const bgDepth = 400;

  const floorUniforms = useMemo(
    () => ({
      colorBack: { value: new THREE.Color('#d6d8d8') },
      colorFront: { value: new THREE.Color('#e9eaea') },
    }),
    []
  );

  return (
    <group>
      {/* 바닥: z축 그라데이션 */}
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, bgDepth / 2]}
      >
        <planeGeometry args={[bgWidth, bgDepth]} />
        <shaderMaterial
          uniforms={floorUniforms}
          vertexShader={floorVertexShader}
          fragmentShader={floorFragmentShader}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 사람 실루엣 - 로딩 실패 시 생략 */}
      <Suspense fallback={null}>
        <Silhouette shelfWidth={shelfWidth} />
      </Suspense>
    </group>
  );
}
