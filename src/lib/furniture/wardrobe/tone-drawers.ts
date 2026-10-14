import type { PanelData } from '@/types/shelf';
import type { WardrobeDrawer, WardrobeFront } from './types';
import type { WardrobeSourcePart } from './source-types';

/** Final Tone display panels, after the engine's intermediate material envelopes.
 * Final renderer evidence: tone-render-fixtures.json. Units here are mm → cm.
 * Display travel is a staggered presentation, not a physical runner specification.
 */
export function resolveToneDrawer(source: WardrobeSourcePart, drawers: WardrobeSourcePart[], faces: WardrobeSourcePart[], sectionId: string, index: number): WardrobeDrawer | null {
  if (!['i', 'b', 'e'].includes(source.subtype ?? '')) return null;
  void faces; // Intermediate external faces do not include final renderer offsets.
  const external = source.subtype === 'e';
  const width = source.x2 - source.x1 - 18;
  const height = source.y2 - source.y1 + 17;
  const depth = source.z2 - source.z1;
  const cx = (source.x1 + source.x2) / 2;
  const cy = (source.y1 + source.y2) / 2 + (external ? -8.5 : 8.5);
  const cz = (source.z1 + source.z2) / 2 + (external ? 12 : 0);
  const panel = (x:number,y:number,z:number,w:number,h:number,d:number,matType:PanelData['matType']):PanelData => ({
    x:x/10,y:y/10,z:z/10,w:w/10,h:h/10,d:d/10,matType,castShadow:true,receiveShadow:true,
  });
  let faceWidth = external ? width + 32 : width;
  let faceHeight = external ? (height === 122 ? 167 : height === 179 ? 224 : 338) : height;
  let faceX = cx, faceY = cy;
  for (const edge of source.extremes ?? []) {
    if (edge === 'left') { faceX -= 4.5; faceWidth += 9; }
    if (edge === 'right') { faceX += 4.5; faceWidth += 9; }
    if (edge === 'top') { faceY += 4.5; faceHeight += 9; }
  }
  const facePanel = panel(faceX,faceY,cz+depth/2-6,faceWidth,faceHeight,12,'backPanel');
  const front:WardrobeFront = {...facePanel,id:`drawer-front-${index}`,sectionId,type:'drawer',hingeSide:null,external,pivotX:facePanel.x,openAngle:0,handle:null};
  const parts = [
    panel(cx,cy,cz-depth/2+6,width,height,12,'backPanel'),
    panel(cx-width/2+6,cy,cz,12,height,depth-24,'verticalBase'),
    panel(cx+width/2-6,cy,cz,12,height,depth-24,'verticalBase'),
    panel(cx,cy-height/2+6,cz,width-24,12,depth-24,'horizontalBase'),
  ];
  const column = drawers.filter(part=>part.x1===source.x1||part.x2===source.x2).sort((a,b)=>b.y1-a.y1);
  const rank = column.findIndex(part=>part.y1===source.y1)+1;
  return {id:`drawer-${index}`,sectionId,front,parts,travelCm:depth*.95*(rank/column.length)/10};
}
