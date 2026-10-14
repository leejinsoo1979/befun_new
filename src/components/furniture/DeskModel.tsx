'use client';

import { Suspense, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { FiEdit2 } from 'react-icons/fi';
import styles from './furniture.module.css';
import type { Material } from 'three';
import type { MaterialSet } from '@/lib/three/materials';
import { calculateDeskGeometry, type DeskInput } from '@/lib/furniture/desk';
import { calculateReferenceDoorPlacement, calculateReferenceDrawerPlacement } from '@/lib/three/reference-hardware';
import { createBlumShelfPlans } from '@/lib/three/blum/boring';
import { Panel } from '@/components/three/Panel';
import { DeskPanel } from './DeskPanel';
import { Door } from '@/components/three/Door';
import { Drawer } from '@/components/three/Drawer';
import { BlumPlate } from '@/components/three/blum/BlumHardware';
import { ShortLeg } from '@/components/three/furniture-hardware/legs';

export interface DeskModelProps {
  config: DeskInput;
  materials: MaterialSet;
  open: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (id: string) => void;
  sectionIds: string[];
  onEditLegroom?: () => void;
  /** Root owns this material; the model never recolours or disposes it. */
  footMaterial?: Material;
}

/** Geometry coordinates remain cm and rear z=0. Canvas/camera/materials belong
 * to the caller. Source display-height offset is applied exactly once here. */
export function DeskModel({ config, materials, open, selectedSectionId, onSelectSection, sectionIds, footMaterial, onEditLegroom }: DeskModelProps) {
  const geometry = useMemo(() => calculateDeskGeometry(config), [config]);
  const depth = config.depthMm / 10;
  const doors = useMemo(() => geometry.fronts.filter(front => front.type === 'door')
    .map(front => calculateReferenceDoorPlacement(front, depth)), [geometry.fronts, depth]);
  const drawers = useMemo(() => geometry.fronts.filter(front => front.type === 'drawer')
    .flatMap(front => {
      const placement = calculateReferenceDrawerPlacement(front, depth);
      return placement ? [placement] : [];
    }), [geometry.fronts, depth]);
  const doorPlans = useMemo(() => createBlumShelfPlans(doors, geometry.panels, geometry.boardThickness), [doors, geometry]);
  const panelHardware = useMemo(() => geometry.panels.map((_, index) => {
    const mounts = doorPlans.flatMap(plan => plan.mounts.filter(mount => mount.panelIndex === index));
    return { mounts, holes: mounts.flatMap(mount => mount.holes), openings: geometry.cableOpenings.filter(opening => opening.panelIndex === index) };
  }), [geometry.panels, geometry.cableOpenings, doorPlans]);
  const sectionForColumn = (index: number) => {
    const storage = geometry.columns[index]?.storageIndex;
    return storage === null || storage === undefined ? undefined : sectionIds[storage];
  };

  return (
    <group name="befun-desk" position={[0, geometry.footOffset, 0]} userData={{
      furnitureKind: 'desk', panelCount: geometry.panels.length, beamCount: geometry.beams.length,
      doorCount: doors.length, drawerCount: drawers.length, footCount: geometry.feet.length,
      selectedSectionId: selectedSectionId ?? null, bodyHeight: geometry.bodyHeight,
      footOffset: geometry.footOffset, totalHeight: geometry.totalHeight,
      unsupported: geometry.unsupported, cableOpeningCount: geometry.cableOpenings.length,
      footGeometry: { sourceMinYmm: -20, sourceMaxYmm: 0, reusedModelHeightMm: 22.5, exactParity: false },
    }}>
      {geometry.columns.map(column => {
        const sectionId = column.storageIndex === null ? null : sectionIds[column.storageIndex];
        const label = column.storageIndex === null ? '다리 공간 편집' : `수납 ${column.storageIndex + 1} 편집`;
        return <Html key={`edit-${column.index}`} position={[column.x, -5, depth + 2]} center zIndexRange={[20, 10]}>
          <button type="button" className={styles.deskEditButton} aria-label={label} title={label} data-desk-edit-label={label}
            onClick={() => { if (sectionId) onSelectSection?.(sectionId); else onEditLegroom?.(); }}><FiEdit2 /></button>
        </Html>;
      })}
      {geometry.panels.map((panel, index) => (
        <group key={`panel-${index}`}>
          <DeskPanel panel={panel} materials={materials} bores={panelHardware[index].holes}
            openings={panelHardware[index].openings} />
          {panelHardware[index].mounts.map((mount, mountIndex) => <BlumPlate key={mountIndex} mount={mount} />)}
        </group>
      ))}
      {geometry.beams.map((beam, index) => <Panel key={`beam-${index}`} w={beam.w} h={beam.h} d={beam.d}
        position={[beam.x, beam.y, beam.z]} matType={beam.matType} materials={materials} castShadow receiveShadow />)}
      {/* The shared observed ShortLeg is 22.5mm tall; source gallery foot boxes
          span -20..0mm. Preserve the source top anchor, without inventing an
          insertion offset or stretching the mesh to conceal this difference. */}
      {geometry.feet.map((foot, index) => <group key={`foot-${index}`} position={[foot.x, foot.y, foot.z]} scale={0.1}>
        <ShortLeg material={footMaterial ?? materials.verticalEdge} castShadow />
      </group>)}
      <Suspense fallback={null}>
        {doors.map((placement, index) => {
          const sectionId = sectionForColumn(placement.layerIndex);
          return <group key={`door-${placement.layerIndex}-${index}`} userData={{ sectionId }}
            onClick={event => { if (sectionId && onSelectSection) { event.stopPropagation(); onSelectSection(sectionId); } }}>
            <Door placement={placement} materials={materials} isOpen={open} thickness={geometry.boardThickness} blum={doorPlans[index]} />
          </group>;
        })}
        {drawers.map((placement, index) => {
          const sectionId = sectionForColumn(placement.layerIndex);
          return <group key={`drawer-${placement.layerIndex}-${index}`} userData={{ sectionId }}
            onClick={event => { if (sectionId && onSelectSection) { event.stopPropagation(); onSelectSection(sectionId); } }}>
            <Drawer placement={placement} materials={materials} isOpen={open} thickness={geometry.boardThickness} />
          </group>;
        })}
      </Suspense>
      {geometry.openings.map((opening, index) => {
        const sectionId = sectionForColumn(opening.rowIndex);
        if (!sectionId || !onSelectSection) return null;
        return <mesh key={`opening-${index}`} visible={false} position={[opening.x, opening.y, depth + 0.01]}
          userData={{ sectionId, selected: sectionId === selectedSectionId, selectionCollider: true }}
          onClick={event => { event.stopPropagation(); onSelectSection(sectionId); }}>
          <boxGeometry args={[opening.width, opening.height, 0.02]} />
        </mesh>;
      })}
    </group>
  );
}
