'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useShelfStore } from '@/stores/useShelfStore';
import { calculateGridPanels, type ReferenceOpening } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculatePatternPanels } from '@/lib/three/styles/pattern';
import { calculateMosaicPanels, type MosaicResult } from '@/lib/three/styles/mosaic';

// Billboard meshes stay out of the AO depth pass. A screen-sized translucent
// capsule matches the reference without producing opaque sprite rectangles.
function createDimensionLabel(text: string): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 80;
  const context = canvas.getContext('2d')!;
  context.font = '400 52px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const capsuleWidth = context.measureText(text).width + 26;
  context.fillStyle = 'rgba(90, 90, 90, 0.48)';
  context.beginPath();
  context.roundRect((canvas.width - capsuleWidth) / 2, 7, capsuleWidth, 66, 33);
  context.fill();
  context.fillStyle = '#ffffff';
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  }));
  label.scale.set(10, 5, 1);
  label.renderOrder = 9999;
  label.userData.dimensionLabel = true;
  label.userData.excludeFromAO = true;
  return label;
}

function clearDimensionObjects(group: THREE.Group) {
  for (const child of [...group.children]) {
    group.remove(child);
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const material = child.material as THREE.MeshBasicMaterial;
      material.map?.dispose();
      material.dispose();
    } else if (child instanceof THREE.Line) {
      child.geometry.dispose();
      (child.material as THREE.LineBasicMaterial).dispose();
    }
  }
}

// ── V1 createGuideline 이식: 메인 라인 + 양끝 수직 틱마크 ──

function createGuidelineObjects(
  start: THREE.Vector3,
  end: THREE.Vector3,
): THREE.Object3D[] {
  const material = new THREE.LineBasicMaterial({ color: 0x747474, transparent: true, opacity: 0.75, toneMapped: false });
  const objects: THREE.Object3D[] = [];

  // 메인 라인
  const mainGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
  objects.push(new THREE.Line(mainGeo, material));

  // 수직 방향 계산
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  let perpendicular: THREE.Vector3;
  if (Math.abs(direction.z) < 0.999) {
    perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
  } else {
    perpendicular = new THREE.Vector3(0, 1, 0).normalize();
  }

  const perpendicularLength = 3;

  // 시작점 틱마크
  const startPerpStart = new THREE.Vector3().addVectors(
    start, perpendicular.clone().multiplyScalar(-perpendicularLength / 2),
  );
  const startPerpEnd = new THREE.Vector3().addVectors(
    start, perpendicular.clone().multiplyScalar(perpendicularLength / 2),
  );
  const startGeo = new THREE.BufferGeometry().setFromPoints([startPerpStart, startPerpEnd]);
  objects.push(new THREE.Line(startGeo, material));

  // 끝점 틱마크
  const endPerpStart = new THREE.Vector3().addVectors(
    end, perpendicular.clone().multiplyScalar(-perpendicularLength / 2),
  );
  const endPerpEnd = new THREE.Vector3().addVectors(
    end, perpendicular.clone().multiplyScalar(perpendicularLength / 2),
  );
  const endGeo = new THREE.BufferGeometry().setFromPoints([endPerpStart, endPerpEnd]);
  objects.push(new THREE.Line(endGeo, material));

  return objects;
}

// ── 메인 컴포넌트 ──

export function DimensionOverlay() {
  const { scene, camera, size } = useThree();
  const labelPosition = useMemo(() => new THREE.Vector3(), []);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    for (const child of groupRef.current?.children ?? []) {
      if (child.userData.dimensionLabel) {
        child.quaternion.copy(camera.quaternion);
        child.getWorldPosition(labelPosition).applyMatrix4(camera.matrixWorldInverse);
        const worldPerPixel = camera instanceof THREE.PerspectiveCamera
          ? 2 * Math.abs(labelPosition.z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / size.height
          : camera instanceof THREE.OrthographicCamera
            ? (camera.top - camera.bottom) / camera.zoom / size.height : 1;
        child.scale.set(40 * worldPerPixel, 20 * worldPerPixel, 1);
      }
      // The depth guide collapses in a frontal view; reveal it when rotated.
      if (child.userData.depthDimension) child.visible = Math.abs(camera.position.x) > 15;
    }
  });

  const category = useMaterialStore(s => s.colorCategory);
  const family = category === 'classic' || category === 'natural' ? 'type01' as const : 'type02' as const;
  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const depth = useShelfStore((s) => s.depth);
  const thickness = useShelfStore((s) => s.thickness);
  const style = useShelfStore((s) => s.style);
  const density = useShelfStore((s) => s.density);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const numRows = useShelfStore((s) => s.numRows);
  const doorsCreatedLayers = useHardwareStore(s=>s.doorsCreatedLayers);
  const drawersCreatedLayers = useHardwareStore(s=>s.drawersCreatedLayers);
  const hardwareRowStyles = useHardwareStore(s=>s.rowStyles);
  const hardwareLayers = useMemo(()=>[...new Set([...doorsCreatedLayers,...drawersCreatedLayers])],[doorsCreatedLayers,drawersCreatedLayers]);
  const hasBackPanel = useShelfStore((s) => s.hasBackPanel);

  // 스타일별 패널 계산 결과
  const styleResult = useMemo(() => {
    const input = { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers, hardwareRowStyles, family };
    switch (style) {
      case 'grid': return calculateGridPanels(input);
      case 'slant': return calculateSlantPanels(input);
      case 'pixel': return calculatePixelPanels(input);
      case 'gradient': return calculateGradientPanels(input);
      case 'pattern': return calculatePatternPanels(input);
      case 'mosaic': return calculateMosaicPanels(input);
      default: return calculateGridPanels(input);
    }
  }, [width, height, depth, thickness, style, density, rowHeights, numRows, hasBackPanel, hardwareLayers, hardwareRowStyles, family]);

  // 모든 라벨/가이드라인 생성
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    clearDimensionObjects(group);

    const { panelCount, panelSpacing } = styleResult;

    const bodyHeight = styleResult.bodyHeight ?? height;

    // ── 외경 치수 (V1 동일: 가로 상단, 세로 우측, 깊이 우측 상단) ──

    // 가로 (width) — 상단
    const widthLabel = createDimensionLabel(`${width}`);
    widthLabel.position.set(0, bodyHeight + thickness * 3, depth + 1);
    group.add(widthLabel);

    createGuidelineObjects(
      new THREE.Vector3(-width / 2, bodyHeight + thickness * 3, depth + 1),
      new THREE.Vector3(width / 2, bodyHeight + thickness * 3, depth + 1),
    ).forEach((obj) => group.add(obj));

    // 세로 (height + 조절발) — 우측
    const footHeight = 1; // 조절발 높이 1cm
    const totalHeight = Math.round(bodyHeight + footHeight);
    const heightLabel = createDimensionLabel(`${totalHeight}`);
    heightLabel.position.set(width / 2 + 10, bodyHeight / 2 - footHeight / 2, depth + 1);
    group.add(heightLabel);

    createGuidelineObjects(
      new THREE.Vector3(width / 2 + 10, -footHeight, depth + 1),
      new THREE.Vector3(width / 2 + 10, bodyHeight, depth + 1),
    ).forEach((obj) => group.add(obj));

    // 깊이 (depth) — 우측 상단
    const depthLabel = createDimensionLabel(`${Math.ceil(depth)}`);
    depthLabel.position.set(width / 2 + 10, bodyHeight + thickness * 3, depth / 2);
    depthLabel.userData.depthDimension = true;
    group.add(depthLabel);

    createGuidelineObjects(
      new THREE.Vector3(width / 2 + 10, bodyHeight + thickness * 3, depth),
      new THREE.Vector3(width / 2 + 10, bodyHeight + thickness * 3, 0),
    ).forEach((obj) => { obj.userData.depthDimension = true; group.add(obj); });

    // ── 내경 치수 (스타일별 분기) ──

    if (styleResult.openings) {
      createOpeningInnerLabels(group, depth, styleResult.openings);
    } else switch (style) {
      case 'grid':
        createGridInnerLabels(group, width, height, depth, thickness, panelCount, panelSpacing, rowHeights, numRows);
        break;
      case 'slant':
        createSlantInnerLabels(group, width, height, depth, thickness, panelCount, panelSpacing, rowHeights, numRows);
        break;
      case 'pixel':
        createPixelInnerLabels(group, width, height, depth, thickness, density, rowHeights, numRows);
        break;
      case 'gradient':
        createGradientInnerLabels(group, width, height, depth, thickness, 'internalWidths' in styleResult ? styleResult as { internalWidths: number[] } : {}, rowHeights, numRows);
        break;
      case 'pattern':
        break;
      case 'mosaic':
        if ('cells' in styleResult) {
          for (const cell of (styleResult as MosaicResult).cells) {
            const label = createDimensionLabel(`${Math.floor(cell.width + 1e-8)}`);
            label.position.set(cell.x, cell.y - cell.height / 2 + 5, depth + 1);
            group.add(label);
            const heightLabel = createDimensionLabel(`${Math.floor(cell.height + 1e-8)}`);
            heightLabel.position.set(cell.x - cell.width / 2 + 5, cell.y, depth + 1);
            group.add(heightLabel);
          }
        }
        break;
    }

    return () => clearDimensionObjects(group);
  }, [width, height, depth, thickness, style, density, rowHeights, numRows, styleResult, scene]);

  return <group ref={groupRef} />;
}

// ── V1 createGridLabels 이식 ──

function createGridInnerLabels(
  group: THREE.Group,
  width: number, height: number, depth: number, thickness: number,
  panelCount: number, panelSpacing: number,
  rowHeights: number[], numRows: number,
) {
  // 가로 패널 치수 (각 칸별)
  for (let j = 0; j < panelCount - 1; j++) {
    const leftX = -width / 2 + j * panelSpacing + thickness / 2;
    const rightX = leftX + panelSpacing;
    const labelX = (leftX + rightX) / 2;
    const unitWidth = panelSpacing - thickness;

    let labelY = 1 * (rowHeights[1] + thickness) + thickness - (rowHeights[1] + 1 / 4);

    for (let i = 0; i < numRows; i++) {
      const label = createDimensionLabel(`${unitWidth.toFixed(0)}`);
      label.position.set(labelX - thickness, labelY + thickness, depth + 1);
      group.add(label);

      if (i < rowHeights.length) {
        labelY += rowHeights[i] + thickness;
      }
    }
  }

  // 세로 패널 치수 (각 행 높이)
  let labelY = (rowHeights[0] + thickness) / 2;
  labelY -= rowHeights[0];
  const heightLabelX = -width / 2 + 0.5 * panelSpacing;

  for (let i = 0; i < numRows; i++) {
    if (rowHeights[i] === 18) {
      const gap = 7;
      labelY += rowHeights[i] + thickness + gap;
      const label = createDimensionLabel(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX - 20, labelY, depth + 1);
      group.add(label);
      labelY -= gap;
    } else {
      labelY += rowHeights[i] + thickness;
      const label = createDimensionLabel(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX - 20, labelY, depth + 1);
      group.add(label);
    }
  }
}

// ── V1 createSlantLabels 이식 ──

function createSlantInnerLabels(
  group: THREE.Group,
  width: number, height: number, depth: number, thickness: number,
  panelCount: number, panelSpacing: number,
  rowHeights: number[], numRows: number,
) {
  if (numRows === 1 || width < 78) {
    createGridInnerLabels(group, width, height, depth, thickness, panelCount, panelSpacing, rowHeights, numRows);
    return;
  }

  const adjustedShelfWidth = width - 24;
  // recalculate panelSpacing for slant
  const slantPanelSpacing = (adjustedShelfWidth - thickness) / (panelCount - 1);

  // 가로 패널 치수
  for (let i = 0; i < panelCount - 1; i++) {
    const leftX = -adjustedShelfWidth / 2 + i * slantPanelSpacing + thickness / 2;
    const rightX = leftX + slantPanelSpacing;
    const labelX = (leftX + rightX) / 2;

    let unitWidth: number;
    if (i === 0 || i === panelCount - 2) {
      unitWidth = slantPanelSpacing - thickness / 2;
    } else {
      unitWidth = slantPanelSpacing - thickness;
    }

    let currentY = 0;
    for (let j = 0; j < numRows; j++) {
      if (j % 2 === 0) {
        const label = createDimensionLabel(`${unitWidth.toFixed(0)}`);
        label.position.set(labelX - thickness - unitWidth / 4 + 2, currentY + 5, depth + 1);
        group.add(label);
      } else {
        const label = createDimensionLabel(`${unitWidth.toFixed(0)}`);
        label.position.set(labelX - thickness + unitWidth / 4 + 2, currentY + 5, depth + 1);
        group.add(label);
      }
      currentY += rowHeights[j] + thickness;
    }
  }

  // 세로 패널 치수
  let currentY = 0;
  const heightLabelX = -adjustedShelfWidth / 2 + 0.5 * slantPanelSpacing;

  for (let i = 0; i < numRows; i++) {
    if (rowHeights[i] === 18) {
      const gap = 7;
      currentY += rowHeights[i] / 2 + thickness + gap;
      const label = createDimensionLabel(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX - 16, currentY - 7.5, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2 - gap;
    } else {
      currentY += rowHeights[i] / 2 + thickness;
      const label = createDimensionLabel(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX - 16, currentY - 1, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2;
    }
  }
}

// ── V1 createPixelLabels 이식 ──

function calculateGaps(shelfWidth: number, density: number, thickness: number): number[] {
  let densityRatio: number;
  if (shelfWidth < 110) {
    densityRatio = 0;
  } else if (density >= 50) {
    densityRatio = -(density - 50) / 30;
  } else {
    densityRatio = -(density - 50) / 70;
  }

  if (shelfWidth < 110) {
    const availableSpace = shelfWidth - 4 * thickness;
    const centerGap = Math.min(50, availableSpace - 34) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap) / 2;
    return [sideGap, centerGap, sideGap];
  } else if (shelfWidth < 185) {
    const availableSpace = shelfWidth - 6 * thickness;
    const centerGap = Math.min(50, availableSpace - 68) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap) / 4;
    return [sideGap - 3, sideGap + 3, centerGap, sideGap + 3, sideGap - 3];
  } else if (shelfWidth < 241) {
    const availableSpace = shelfWidth - 8 * thickness;
    const centerGap = (Math.min(50, availableSpace - 85) - 12) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap * 2) / 5;
    return [sideGap - 3, sideGap + 3, centerGap, sideGap, centerGap, sideGap + 3, sideGap - 3];
  } else if (shelfWidth < 319) {
    const availableSpace = shelfWidth - 10 * thickness;
    const centerGap = (Math.min(50, availableSpace - 102) - 15) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap * 3) / 6;
    return [sideGap - 5, sideGap + 2, centerGap + 2, sideGap + 1, centerGap, sideGap + 1, centerGap + 2, sideGap + 2, sideGap - 5];
  } else if (shelfWidth < 396) {
    const availableSpace = shelfWidth - 12 * thickness;
    const centerGap = (Math.min(50, availableSpace - 119) - 10) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap * 4) / 7;
    return [sideGap - 5, sideGap + 3, centerGap + 2, sideGap, centerGap, sideGap, centerGap, sideGap, centerGap + 2, sideGap + 3, sideGap - 5];
  } else {
    const availableSpace = shelfWidth - 14 * thickness;
    const centerGap = (Math.min(50, availableSpace - 136) - 8) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap * 5) / 8;
    return [sideGap - 4, sideGap + 4, centerGap, sideGap, centerGap, sideGap, centerGap, sideGap, centerGap, sideGap, centerGap, sideGap + 4, sideGap - 4];
  }
}

function createPixelInnerLabels(
  group: THREE.Group,
  width: number, height: number, depth: number, thickness: number,
  density: number, rowHeights: number[], numRows: number,
) {
  if (numRows === 1 || width < 78) {
    // Grid 방식 폴백 — 외경만 (이미 메인에서 그림)
    return;
  }

  const gaps = calculateGaps(width, density, thickness);

  // 가로 패널 치수
  let x = -width / 2 + thickness / 2;
  for (let i = 0; i < gaps.length; i++) {
    const unitWidth = gaps[i];
    const labelX = x + unitWidth / 2;
    let currentY = 0;

    for (let row = 0; row < numRows; row++) {
      const label = createDimensionLabel(`${unitWidth.toFixed(0)}`);
      label.position.set(labelX, currentY + 6, depth + 1);
      group.add(label);
      currentY += rowHeights[row] + thickness;
    }

    x += unitWidth + thickness;
  }

  // 세로 패널 치수
  let currentY = 0;
  const heightLabelX = -width / 2 + gaps[0] / 2;

  for (let i = 0; i < numRows; i++) {
    if (rowHeights[i] === 18) {
      const gap = 7;
      currentY += rowHeights[i] / 2 + thickness + gap;
      const label = createDimensionLabel(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX - 18, currentY - 7.5, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2 - gap;
    } else {
      currentY += rowHeights[i] / 2 + thickness;
      const label = createDimensionLabel(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX - 18, currentY - 1, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2;
    }
  }
}

// ── V1 createGradientLabels 이식 ──

function createGradientInnerLabels(
  group: THREE.Group,
  width: number, height: number, depth: number, thickness: number,
  styleResult: { internalWidths?: number[] },
  rowHeights: number[], numRows: number,
) {
  if (width < 60) return; // V1: fallback to grid

  const internalWidths: number[] = styleResult.internalWidths || [];

  // 가로 패널 치수
  let x = -width / 2 + thickness / 2;
  for (let i = 0; i < internalWidths.length; i++) {
    const unitWidth = internalWidths[i];
    const labelX = x + unitWidth / 2;
    let currentY = 0;

    for (let j = 0; j < numRows; j++) {
      const label = createDimensionLabel(`${unitWidth.toFixed(0)}`);
      label.position.set(labelX, currentY + 6, depth + 1);
      group.add(label);
      currentY += rowHeights[j] + thickness;
    }

    x += unitWidth + thickness;
  }

  // 세로 패널 치수
  let currentY = 0;
  for (let i = 0; i < numRows; i++) {
    if (rowHeights[i] === 18) {
      const gap = 7;
      currentY += rowHeights[i] / 2 + thickness + gap;
      const label = createDimensionLabel(`${rowHeights[i].toFixed(0)}`);
      label.position.set(-width / 2 - 7, currentY - 7.5, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2 - gap;
    } else {
      currentY += rowHeights[i] / 2 + thickness;
      const label = createDimensionLabel(`${rowHeights[i].toFixed(0)}`);
      label.position.set(-width / 2 - 7, currentY - 1, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2;
    }
  }
}

// Use the same openings as the geometry, including cells spanning two rows.
function createOpeningInnerLabels(group: THREE.Group, depth: number, openings: ReferenceOpening[]) {
  for (const cell of openings) {
    // Public dimension renderer omits openings smaller than 60 mm.
    if (Math.min(cell.width, cell.height) < 6) continue;
    const widthLabel = createDimensionLabel(`${Math.floor(cell.width + 1e-8)}`);
    widthLabel.position.set(cell.x, cell.y - cell.height / 2 + 6, depth + 1);
    group.add(widthLabel);
    if (!cell.openLeft) {
      const heightLabel = createDimensionLabel(`${Math.floor(cell.height + 1e-8)}`);
      heightLabel.position.set(cell.x - cell.width / 2 + 5, cell.y, depth + 1);
      group.add(heightLabel);
    }
  }
}
