'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useShelfStore } from '@/stores/useShelfStore';
import { calculateGridPanels } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculatePatternPanels } from '@/lib/three/styles/pattern';

// ── V1 createLabel 이식: Canvas 텍스처 Sprite ──

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 160;
  canvas.height = 80;

  // 배경: 어두운 반투명 둥근 사각형
  context.fillStyle = 'rgba(51, 51, 51, 0.8)';
  roundRect(context, 0, 0, canvas.width, canvas.height, 40);
  context.fill();

  // 텍스트: 흰색 볼드
  context.font = 'bold 60px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(10, 5, 1);
  sprite.renderOrder = 9999;

  return sprite;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── V1 createGuideline 이식: 메인 라인 + 양끝 수직 틱마크 ──

function createGuidelineObjects(
  start: THREE.Vector3,
  end: THREE.Vector3,
): THREE.Object3D[] {
  const material = new THREE.LineBasicMaterial({ color: 0x333333 });
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
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const depth = useShelfStore((s) => s.depth);
  const thickness = useShelfStore((s) => s.thickness);
  const style = useShelfStore((s) => s.style);
  const density = useShelfStore((s) => s.density);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const numRows = useShelfStore((s) => s.numRows);
  const hasBackPanel = useShelfStore((s) => s.hasBackPanel);

  // 스타일별 패널 계산 결과
  const styleResult = useMemo(() => {
    const input = { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel };
    switch (style) {
      case 'grid': return calculateGridPanels(input);
      case 'slant': return calculateSlantPanels(input);
      case 'pixel': return calculatePixelPanels(input);
      case 'gradient': return calculateGradientPanels(input);
      case 'pattern': return calculatePatternPanels(input);
      default: return calculateGridPanels(input);
    }
  }, [width, height, depth, thickness, style, density, rowHeights, numRows, hasBackPanel]);

  // 모든 라벨/가이드라인 생성
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // 이전 라벨 제거
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Sprite) {
        child.material.map?.dispose();
        child.material.dispose();
      }
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
      }
    }

    const { panelCount, panelSpacing } = styleResult;

    // ── 외경 치수 (V1 동일: 가로 상단, 세로 우측, 깊이 우측 상단) ──

    // 가로 (width) — 상단
    const widthLabel = createLabelSprite(`${width}`);
    widthLabel.position.set(0, height + thickness * 3, depth + 1);
    group.add(widthLabel);

    createGuidelineObjects(
      new THREE.Vector3(-width / 2, height + thickness * 3, depth + 1),
      new THREE.Vector3(width / 2, height + thickness * 3, depth + 1),
    ).forEach((obj) => group.add(obj));

    // 세로 (height) — 우측
    const heightLabel = createLabelSprite(`${height}`);
    heightLabel.position.set(width / 2 + 10, height / 2, depth + 1);
    group.add(heightLabel);

    createGuidelineObjects(
      new THREE.Vector3(width / 2 + 10, 0, depth + 1),
      new THREE.Vector3(width / 2 + 10, height, depth + 1),
    ).forEach((obj) => group.add(obj));

    // 깊이 (depth) — 우측 상단
    const depthLabel = createLabelSprite(`${Math.ceil(depth)}`);
    depthLabel.position.set(width / 2 + 10, height + thickness * 3, depth / 2);
    group.add(depthLabel);

    createGuidelineObjects(
      new THREE.Vector3(width / 2 + 10, height + thickness * 3, depth),
      new THREE.Vector3(width / 2 + 10, height + thickness * 3, 0),
    ).forEach((obj) => group.add(obj));

    // ── 내경 치수 (스타일별 분기) ──

    switch (style) {
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
        createGradientInnerLabels(group, width, height, depth, thickness, styleResult, rowHeights, numRows);
        break;
      case 'pattern':
        createPatternInnerLabels(group, width, height, depth, thickness, styleResult, rowHeights, numRows);
        break;
      // mosaic: 외경만 표시 (V1 동일)
    }

    return () => {
      // 컴포넌트 언마운트 시 정리
      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if (child instanceof THREE.Sprite) {
          child.material.map?.dispose();
          child.material.dispose();
        }
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
        }
      }
    };
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
      const label = createLabelSprite(`${unitWidth.toFixed(0)}`);
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
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX - 20, labelY, depth + 1);
      group.add(label);
      labelY -= gap;
    } else {
      labelY += rowHeights[i] + thickness;
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
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
    let labelX = (leftX + rightX) / 2;

    let unitWidth: number;
    if (i === 0 || i === panelCount - 2) {
      unitWidth = slantPanelSpacing - thickness / 2;
    } else {
      unitWidth = slantPanelSpacing - thickness;
    }

    let currentY = 0;
    for (let j = 0; j < numRows; j++) {
      if (j % 2 === 0) {
        const label = createLabelSprite(`${unitWidth.toFixed(0)}`);
        label.position.set(labelX - thickness - unitWidth / 4 + 2, currentY + 5, depth + 1);
        group.add(label);
      } else {
        const label = createLabelSprite(`${unitWidth.toFixed(0)}`);
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
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX - 16, currentY - 7.5, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2 - gap;
    } else {
      currentY += rowHeights[i] / 2 + thickness;
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
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
      const label = createLabelSprite(`${unitWidth.toFixed(0)}`);
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
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX - 18, currentY - 7.5, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2 - gap;
    } else {
      currentY += rowHeights[i] / 2 + thickness;
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
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
  styleResult: any,
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
      const label = createLabelSprite(`${unitWidth.toFixed(0)}`);
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
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
      label.position.set(-width / 2 - 7, currentY - 7.5, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2 - gap;
    } else {
      currentY += rowHeights[i] / 2 + thickness;
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
      label.position.set(-width / 2 - 7, currentY - 1, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2;
    }
  }
}

// ── V1 createPatternLabels 이식 (패널 위치 분석 방식) ──

function createPatternInnerLabels(
  group: THREE.Group,
  width: number, height: number, depth: number, thickness: number,
  styleResult: any,
  rowHeights: number[], numRows: number,
) {
  const panels = styleResult.panels;

  // 각 행별로 세로 패널(verticalBase) x 위치를 분석하여 칸 너비 계산
  let currentY = 0;
  for (let row = 0; row < numRows; row++) {
    const rowY = currentY + rowHeights[row] / 2 + thickness;
    const rh = rowHeights[row];

    // 해당 행의 세로 패널 x 위치 추출
    const verticalXPositions: number[] = [];
    for (const p of panels) {
      if (
        p.matType === 'verticalBase' &&
        p.h === rh &&
        Math.abs(p.y - (currentY + rh / 2 + thickness + 0.5)) < rh / 2 + 2
      ) {
        verticalXPositions.push(p.x);
      }
    }

    // 좌우 외곽 패널 위치도 추가
    verticalXPositions.push(-width / 2 + 1); // 왼쪽 외곽
    verticalXPositions.push(width / 2 - 1);  // 오른쪽 외곽 (근사값)

    // 정렬 후 중복 제거
    const sorted = [...new Set(verticalXPositions.map(x => Math.round(x * 10) / 10))].sort((a, b) => a - b);

    // 패널 사이 칸 너비 계산 & 라벨 배치
    for (let i = 0; i < sorted.length - 1; i++) {
      const compartmentWidth = sorted[i + 1] - sorted[i] - thickness;
      if (compartmentWidth > 5) {
        const labelX = sorted[i] + thickness / 2 + compartmentWidth / 2;
        const label = createLabelSprite(`${Math.round(compartmentWidth)}`);
        label.position.set(labelX, rowY, depth + 1);
        group.add(label);
      }
    }

    currentY += rowHeights[row] + thickness;
  }

  // 세로 패널 치수 (행 높이) — 왼쪽 패널 외부
  const heightLabelX = -width / 2 - 15;
  currentY = 0;
  for (let i = 0; i < numRows; i++) {
    if (rowHeights[i] === 18) {
      const gap = 7;
      currentY += rowHeights[i] / 2 + thickness + gap;
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX, currentY - 7.5, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2 - gap;
    } else {
      currentY += rowHeights[i] / 2 + thickness;
      const label = createLabelSprite(`${rowHeights[i].toFixed(0)}`);
      label.position.set(heightLabelX, currentY - 1, depth + 1);
      group.add(label);
      currentY += rowHeights[i] / 2;
    }
  }
}
