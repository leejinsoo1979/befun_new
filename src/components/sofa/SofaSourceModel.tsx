'use client';

import { useEffect, useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { Mesh, MeshPhysicalMaterial } from 'three';
import { sofaGeometry, type SofaDesign, type PlacedSofaModule } from '@/lib/sofa/design';
import { sourceFeet } from '@/lib/sofa/source-feet';
import { createSourceMaterial } from '@/lib/sofa/source-material';
import { sofaSourceAssets as assets, sourceFabric, sourceModule } from '@/lib/sofa/source-model';

const dracoLoader = new DRACOLoader().setDecoderPath('/three/sofa/draco/').setWorkerLimit(2);

/** Native feet keep their own painted-metal material, never the upholstery texture. */
function SourceFeet({ part, design }: { part: PlacedSofaModule; design: SofaDesign }) {
  const definition = useMemo(() => sourceFeet(part, design.model), [part, design.model]);
  const model = useLoader(GLTFLoader, assets[definition.asset].local, loader => { loader.setDRACOLoader(dracoLoader); });
  const material = useMemo(() => new MeshPhysicalMaterial({ color: 2039582, roughness: .43, metalness: .11, envMapIntensity: .94 }), []);
  useEffect(() => () => material.dispose(), [material]);
  const instances = useMemo(() => definition.positions.map(() => {
    const scene = model.scene.clone(true);
    scene.traverse(node => {
      if (node instanceof Mesh) { node.material = material; node.castShadow = true; node.receiveShadow = false; }
    });
    return scene;
  }), [model, material, definition.positions]);
  return <group name="sofa-original-feet">{instances.map((scene, index) => <primitive key={index} object={scene} position={definition.positions[index]} dispose={null} />)}</group>;
}

/** Only modules/materials in the current design are fetched. Loader caches share the source data. */
function SourcePart({ part, design, selected, onSelect }: { part: PlacedSofaModule; design: SofaDesign; selected: number | null; onSelect: (index: number | null) => void }) {
  const { gl } = useThree();
  const definition = sourceModule(part, design);
  const fabric = sourceFabric(design.model, design.material);
  const models = useLoader(GLTFLoader, definition.ids.map(id => assets[id].local), loader => { loader.setDRACOLoader(dracoLoader); });
  const textureIds = fabric ? [fabric.color, fabric.normal, definition.gi, ...(fabric.sheenMap ? [fabric.sheenMap] : [])] : [definition.gi];
  const textures = useLoader(KTX2Loader, textureIds.map(id => assets[id].local), loader => {
    loader.setTranscoderPath('/three/sofa/basis/').detectSupport(gl);
  });
  const materials = useMemo(() => {
    const fabric = sourceFabric(design.model, design.material);
    const material = fabric
      ? createSourceMaterial(fabric, textures, gl.capabilities.getMaxAnisotropy())
      : new MeshPhysicalMaterial({ color: '#b6a68d', roughness: 1 });
    return [material];
  }, [textures, design.material, design.model, gl]);
  useEffect(() => () => {
    const maps = new Set(materials.flatMap(material => [material.map, material.normalMap, material.sheenRoughnessMap, material.lightMap, material.aoMap]));
    maps.forEach(texture => texture?.dispose()); materials.forEach(material => material.dispose());
  }, [materials]);
  const instances = useMemo(() => models.map(model => {
    const scene = model.scene.clone(true);
    scene.traverse(node => {
      if (node instanceof Mesh) { node.material = materials[0]; node.castShadow = true; node.receiveShadow = false; }
    });
    return scene;
  }), [models, materials]);

  return <group userData={{ sofaSelected: part.index === selected }}
    position={[part.x / 1000, 0, part.z / 1000]} rotation={[0, definition.rotation, 0]}
    onClick={event => { event.stopPropagation(); onSelect(part.index); }}>
    {instances.map((scene, index) => <primitive key={definition.ids[index]} object={scene} dispose={null} />)}
    <SourceFeet part={part} design={design} />
  </group>;
}

export default function SofaSourceModel({ design, selected, onSelect }: { design: SofaDesign; selected: number | null; onSelect: (index: number | null) => void }) {
  const geometry = sofaGeometry(design);
  return <group position={[0, 0, -geometry.totalDepth / 2000]}>
    {geometry.placed.map(part => <SourcePart key={part.index} part={part} design={design} selected={selected} onSelect={onSelect} />)}
  </group>;
}
