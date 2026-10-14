// [Befun shim] 250709in의 공간(Room) 3D 뷰어 대신 Befun 선반 판재를 그리고, 원본과 같은 props(meshName 기준 하이라이트·제외)로 동작한다.
// 판재 메시에는 MPR 가공 원본(manufacturingBoring)의 보링·커넥터 슬롯을 실제로 파낸다(src/lib/optimizer/befun/panelGeometry.ts).
import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useBefunCncStore } from '@/lib/optimizer/befun/store';
import { machinedPanelGeometry, panelToWorldMatrix } from '@/lib/optimizer/befun/panelGeometry';
import { getExcludedPanelAliases } from '@/lib/optimizer/upstream/editor/shared/viewer3d/context/ExcludedPanelsContext';

import { previewMaterialSet, previewFaces, groupMachinedFaces } from '@/lib/optimizer/befun/previewMaterials';
import { disposeMaterialSet, type MaterialSet } from '@/lib/three/materials';
import type { CncPanelBox } from '@/lib/optimizer/befun/toCncPanels';

function FinishedPanel({ box, materials, geometry, matrix, offset, selected, dimmed }: {
  box: CncPanelBox; materials: MaterialSet; geometry: THREE.BufferGeometry | null;
  matrix: THREE.Matrix4 | null; offset: THREE.Vector3; selected: boolean; dimmed: boolean;
}) {
  const faces = useMemo(() => {
    const sources = previewFaces(box, materials);
    const shared = new Set(Object.values(materials));
    const clones = new Map<THREE.MeshStandardMaterial, THREE.MeshStandardMaterial>();
    for (const source of sources) if (!clones.has(source)) {
      const clone = source.clone();
      if (source.map) clone.map = source.map.clone();
      clone.side = THREE.DoubleSide;
      clone.emissive.set(selected ? '#ff6b35' : '#000000');
      clone.emissiveIntensity = selected ? 0.35 : 0;
      clone.transparent = dimmed;
      clone.opacity = dimmed ? 0.35 : 1;
      clones.set(source, clone);
    }
    for (const source of new Set(sources)) if (!shared.has(source)) {
      if (source.map && !Object.values(materials).some(m => m.map === source.map)) source.map.dispose();
      source.dispose();
    }
    return sources.map(source => clones.get(source)!);
  }, [box, materials, selected, dimmed]);
  useEffect(() => () => new Set(faces).forEach(material => { material.map?.dispose(); material.dispose(); }), [faces]);
  return geometry && matrix ? <mesh geometry={geometry} material={faces} matrixAutoUpdate={false}
    matrix={new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z).multiply(matrix)} />
    : <mesh material={faces} position={[box.x + offset.x, box.y + offset.y, box.z + offset.z]}>
      <boxGeometry args={[box.w, box.h, box.d]} />
    </mesh>;
}

interface PanelHighlight3DViewerProps {
  highlightedPanelName: string | null;
  highlightedFurnitureId: string | null;
  excludedMeshNames?: Set<string>;
}

const PanelHighlight3DViewer: React.FC<PanelHighlight3DViewerProps> = ({ highlightedPanelName, excludedMeshNames }) => {
  const boxes = useBefunCncStore((s) => s.boxes);
  const panels = useBefunCncStore((s) => s.panels);
  const design = useBefunCncStore((s) => s.design);

  const [finishes, setFinishes] = useState<Record<string, MaterialSet>>({});
  const colorKey = JSON.stringify([...new Set(panels.map(panel => panel.color || design?.color || 'C_White'))].sort());
  useEffect(() => {
    let cancelled = false;
    const owned: MaterialSet[] = [];
    Promise.all((JSON.parse(colorKey) as string[]).map(async color => {
      const materials = await previewMaterialSet(color);
      if (cancelled) disposeMaterialSet(materials); else owned.push(materials);
      return [color, materials] as const;
    })).then(entries => { if (!cancelled) setFinishes(Object.fromEntries(entries)); });
    return () => { cancelled = true; owned.forEach(disposeMaterialSet); };
  }, [colorKey]);
  const panelColors = useMemo(() => new Map(panels.map(panel => [panel.id, panel.color || design?.color || 'C_White'])), [panels, design?.color]);

  // 커넥터 가공은 접합면 안쪽이라 조립 상태에서는 가려진다. 분해 보기는 판재를 가구 중심에서 바깥으로 벌린다.
  const [explode, setExplode] = useState(false);
  const center = useMemo(() => new THREE.Vector3(0, (design?.height ?? 0) / 2, (design?.depth ?? 0) / 2), [design]);
  const offsetOf = (x: number, y: number, z: number) => (explode ? new THREE.Vector3(x, y, z).sub(center).multiplyScalar(0.45) : new THREE.Vector3());

  const highlighted = useMemo(
    () => new Set(highlightedPanelName ? getExcludedPanelAliases(highlightedPanelName) : []),
    [highlightedPanelName],
  );

  // 가공이 있는 판재만 CSG로 파낸 형상을 만든다. 나머지는 상자.
  const meshes = useMemo(() => boxes.map((box) => {
    const panel = panels.find((p) => p.id === box.panelId);
    if (!panel?.manufacturingBoring) return { box, geometry: null as THREE.BufferGeometry | null, matrix: null as THREE.Matrix4 | null };
    const data = panel.manufacturingBoring;
    const hasMachining = data.borings.length > 0 || (data.connectorSlots?.length ?? 0) > 0;
    if (!hasMachining) return { box, geometry: null, matrix: null };
    const geometry = machinedPanelGeometry(data);
    groupMachinedFaces(geometry, box);
    return { box, geometry, matrix: panelToWorldMatrix(box) };
  }), [boxes, panels]);

  useEffect(() => () => meshes.forEach((m) => m.geometry?.dispose()), [meshes]);

  const size = Math.max(design?.width ?? 100, design?.height ?? 100);
  const centerY = (design?.height ?? 0) / 2;

  const machinedCount = meshes.filter((m) => m.geometry).length;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    {machinedCount > 0 && (
      <button
        type="button"
        onClick={() => setExplode(!explode)}
        style={{ position: 'absolute', zIndex: 2, right: 8, top: 8, padding: '4px 8px', fontSize: 12, borderRadius: 6,
          border: '1px solid #ccc', background: explode ? '#7c5cff' : '#fff', color: explode ? '#fff' : '#333', cursor: 'pointer' }}
      >
        {explode ? '조립 보기' : '분해 보기(가공 확인)'}
      </button>
    )}
    <Canvas onCreated={({gl}) => { gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1; }} camera={{ position: [size * 0.8, centerY + size * 0.6, size * 2.2], fov: 40, near: 1, far: size * 20 }} style={{ background: '#f5f5f3' }}>
      {/* 가공 홈·구멍 안쪽에 그늘이 지도록 주광을 강하게, 환경광은 약하게 */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#8a857c', 0.6]} />
      <directionalLight position={[size * 0.6, size * 2, size * 1.2]} intensity={1.6} />
      <directionalLight position={[-size, size * 0.5, -size * 0.5]} intensity={0.4} />
      <group position={[0, 0, -(design?.depth ?? 0) / 2]}>
        {meshes.map(({ box: b, geometry, matrix }) => {
          if (excludedMeshNames?.has(b.meshName)) return null;
          const isHighlighted = highlighted.has(b.meshName);
          const materials = finishes[panelColors.get(b.panelId) ?? design?.color ?? 'C_White'];
          if (!materials) return null;
          return <FinishedPanel key={b.meshName} box={b} geometry={geometry} matrix={matrix}
            materials={materials} selected={isHighlighted} dimmed={!!highlightedPanelName && !isHighlighted}
            offset={offsetOf(b.x, b.y, b.z)} />;
        })}
      </group>
      <OrbitControls target={[0, centerY, 0]} makeDefault />
    </Canvas>
    </div>
  );
};

export default PanelHighlight3DViewer;
