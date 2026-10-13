import { applyBlumBorings } from '@/lib/three/blum/cnc';
import type { Panel } from '@/lib/optimizer/upstream/editor/CNCOptimizer/types';
import type { BefunDesign, BefunShelfModel } from './model';
import { drawerPartSizes } from './model';
import { befunColorLook } from './colors';
import { applyConnectors, type ConnectorReport, type ConnectorSelection } from '@/lib/optimizer/connectors/apply';

const CM_TO_MM = 10;
const mm = (cm: number) => Math.round(cm * CM_TO_MM * 10) / 10;

export interface CncPanelOptions {
  /** 몸통 판재 재질. 250709in 단가표 기준 PB/MDF/PET. */
  bodyMaterial: string;
  /** 판재 두께(mm). 지정하지 않으면 Befun 모델 두께(thickness × 10)를 쓴다. */
  bodyThicknessMm?: number;
  /** 관리자가 고른 접합부 커넥터 */
  connectors?: ConnectorSelection;
}

export const DEFAULT_CNC_PANEL_OPTIONS: CncPanelOptions = { bodyMaterial: 'PB' };

/** 3D 축 번호(0=X, 1=Y, 2=Z). 판재 좌표 x=u축, y=v축, 윗면(top)=+n축. */
export type Axis = 0 | 1 | 2;
export type CncPanelKind = 'horizontal' | 'vertical' | 'back' | 'support' | 'door' | 'drawer';

/** 3D 하이라이트·접합부 계산용 박스. Befun 좌표(cm, 중심)와 옵티마이저 패널을 잇는다. */
export interface CncPanelBox {
  meshName: string;
  panelId: string;
  kind: CncPanelKind;
  w: number;
  h: number;
  d: number;
  x: number;
  y: number;
  z: number;
  frame: { u: Axis; v: Axis; n: Axis };
}

/**
 * Befun 디자인을 250709in 옵티마이저 패널(mm)로 바꾼다.
 * 축 규칙은 250709in과 같다: 가로판 width=길이·height=깊이·결 HORIZONTAL,
 * 세로판 width=깊이·height=길이·결 VERTICAL, 백패널/도어 width×height.
 */
export function toCncPanels(
  design: BefunDesign,
  model: BefunShelfModel,
  options: CncPanelOptions = DEFAULT_CNC_PANEL_OPTIONS,
): { panels: Panel[]; boxes: CncPanelBox[]; connectorReport: ConnectorReport | null } {
  const panels: Panel[] = [];
  const boxes: CncPanelBox[] = [];
  const counters: Record<string, number> = {};
  const textureName = befunColorLook(design.color).swatchName;

  const add = (
    label: string,
    kind: CncPanelKind,
    frame: CncPanelBox['frame'],
    grain: Panel['grain'],
    box: { w: number; h: number; d: number; x: number; y: number; z: number },
    extra: Partial<Panel> = {},
  ) => {
    counters[label] = (counters[label] ?? 0) + 1;
    const name = `${label} ${counters[label]}`;
    const id = `befun_p${panels.length}`;
    const size = [box.w, box.h, box.d];
    panels.push({
      id,
      name,
      width: mm(size[frame.u]),
      height: mm(size[frame.v]),
      thickness: kind === 'door' || kind === 'drawer' ? mm(size[frame.n]) : options.bodyThicknessMm ?? mm(size[frame.n]),
      material: options.bodyMaterial,
      color: design.color,
      textureName,
      quantity: 1,
      grain,
      meshName: name,
      furnitureId: 'befun',
      ...extra,
    });
    boxes.push({ meshName: name, panelId: id, kind, frame, ...box });
  };

  for (const p of model.panels) {
    const box = { w: p.w, h: p.h, d: p.d, x: p.x, y: p.y, z: p.z };
    switch (p.matType) {
      case 'horizontalBase':
      case 'horizontalEdge':
        add('가로판', 'horizontal', { u: 0, v: 2, n: 1 }, 'HORIZONTAL', box);
        break;
      case 'verticalBase':
      case 'verticalEdge':
        add('세로판', 'vertical', { u: 2, v: 1, n: 0 }, 'VERTICAL', box);
        break;
      case 'backPanel':
        add('백패널', 'back', { u: 0, v: 1, n: 2 }, 'VERTICAL', box);
        break;
      case 'supportPanel':
        add('보강대', 'support', { u: 0, v: 1, n: 2 }, 'VERTICAL', box);
        break;
    }
  }

  for (const door of model.doors) {
    add('도어', 'door', { u: 0, v: 1, n: 2 }, 'VERTICAL',
      { w: door.width, h: door.height, d: door.reference?.thickness ?? design.thickness, x: door.x + door.pivotOffsetX, y: door.y + (door.reference?.frontOffsetY ?? 0), z: door.z },
      { isDoor: true });
  }

  for (const drawer of model.drawers) {
    if (drawer.reference) {
      for (const part of drawer.reference.parts) {
        const side = part.name.startsWith('side-');
        const bottom = part.name === 'bottom';
        const label = side ? '측판' : bottom ? '바닥' : part.name === 'front' ? '앞판' : '뒷판';
        add(`서랍 ${label}`, 'drawer', side ? {u:2,v:1,n:0} : bottom ? {u:0,v:2,n:1} : {u:0,v:1,n:2}, 'HORIZONTAL',
          { w:part.w, h:part.h, d:part.d, x:drawer.x+part.x, y:drawer.y+part.y, z:drawer.z+part.z });
      }
      continue;
    }
    const s = drawerPartSizes(drawer, design.thickness);
    const at = { x: drawer.x, y: drawer.y, z: drawer.z };
    add('서랍 앞판', 'drawer', { u: 0, v: 1, n: 2 }, 'HORIZONTAL', { ...s.front, ...at });
    add('서랍 뒷판', 'drawer', { u: 0, v: 1, n: 2 }, 'HORIZONTAL', { ...s.back, ...at });
    add('서랍 바닥', 'drawer', { u: 0, v: 2, n: 1 }, 'HORIZONTAL', { ...s.bottom, ...at });
    add('서랍 측판', 'drawer', { u: 2, v: 1, n: 0 }, 'HORIZONTAL', { ...s.side, ...at });
    add('서랍 측판', 'drawer', { u: 2, v: 1, n: 0 }, 'HORIZONTAL', { ...s.side, ...at });
  }

  const connectorReport = options.connectors ? applyConnectors(panels, boxes, options.connectors) : null;
  applyBlumBorings(panels, boxes, model, design.thickness);
  return { panels, boxes, connectorReport };
}
