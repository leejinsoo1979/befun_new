import type { FurnitureDesign } from './design';
import type { DeskChannelKind, DeskInput } from './desk';

// Initial visible configurations observed on the three catalog source pages.
// Evidence and remaining unmeasured state: desk-catalog-entry-001.json.
const DESKS: Record<string, {
  family: 'desk-classic' | 'desk-modern'; color: string;
  widthMm: number; depthMm: DeskInput['depthMm']; legroomPosition: number; channels: DeskChannelKind[];
}> = {
  'desk-1': { family: 'desk-classic', color: 'C_Clay Brown', widthMm: 2000, depthMm: 600, legroomPosition: 1, channels: ['drawer', 'door-drawer'] },
  'desk-2': { family: 'desk-modern', color: 'Sand+Midnight Blue', widthMm: 2400, depthMm: 500, legroomPosition: 0, channels: ['some-door', 'some-door', 'drawer', 'drawer'] },
  'desk-3': { family: 'desk-classic', color: 'C_Black', widthMm: 1600, depthMm: 500, legroomPosition: 1, channels: ['opening', 'door-drawer'] },
};

// VPN Chrome observations and original-engine thumbnail order, not photo names.
// Evidence: wardrobe-catalog-001..003.json. IDs are stable catalog column slots.
const WARDROBES: Record<string, Extract<FurnitureDesign, { kind: 'wardrobe' }>> = {
  'wardrobe-1': {
    version: 1, kind: 'wardrobe', family: 'wardrobe-edge', color: 'W_Plum', innerColor: 'W_Plum',
    config: {
      model: 'edge', widthMm: 1190, heightMm: 2600, depthMm: 450, topEdge: true,
      sections: [
        { id: '1', seriesId: 'Open_Shelves_Slabs', facade: 'open' },
        { id: '2', seriesId: 'Full_Shelves_Slabs_bottom_drawer', facade: 'closed', doorDirection: 'right' },
      ],
    },
  },
  'wardrobe-2': {
    version: 1, kind: 'wardrobe', family: 'wardrobe-tone', color: 'T_Cashmere', innerColor: 'T_Pink',
    config: {
      model: 'tone', widthMm: 4150, heightMm: 2760, depthMm: 630,
      toneWidthPattern: '11111', drawerStyle: 'internal', lighting: false,
      sections: [3741, 3738, 3746, 3742, 3743].map((seriesId, index) => ({ id: String(index + 1), seriesId, facade: 'closed' })),
    },
  },
  'wardrobe-3': {
    version: 1, kind: 'wardrobe', family: 'wardrobe-tone', color: 'T_Graphite', innerColor: 'T_Graphite',
    config: {
      model: 'tone', widthMm: 600, heightMm: 2750, depthMm: 630,
      toneWidthPattern: '1', drawerStyle: 'external', lighting: false,
      sections: [{ id: '1', seriesId: 3743, facade: 'closed', doorDirection: 'left' }],
    },
  },
};

export function catalogFurnitureDesign(id: string): FurnitureDesign | null {
  if (Object.hasOwn(WARDROBES, id)) return structuredClone(WARDROBES[id]);
  if (!Object.hasOwn(DESKS, id)) return null;
  const preset = DESKS[id];
  if (!preset) return null;
  return {
    version: 1, kind: 'desk', family: preset.family, color: preset.color, innerColor: 'S_White',
    sectionIds: preset.channels.map((_, index) => `storage-${index + 1}`),
    config: {
      family: preset.family === 'desk-classic' ? 'type01' : 'type02',
      widthMm: preset.widthMm, depthMm: preset.depthMm,
      storageColumns: preset.channels.length, legroomPosition: preset.legroomPosition,
      hasBackPanel: true,
      channels: preset.channels.map(kind => ({ kind, doorDirection: 'right' })),
    },
  };
}
