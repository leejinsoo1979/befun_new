/** Resolved fronts in cm. A generator must select actual compartments first. */
export interface ReferenceFront {
  catalogFront?: { z: number; depth: number; handle: string };
  x: number;
  y: number;
  width: number;
  height: number;
  rowIndex: number;
  type: 'door' | 'drawer';
  hingeSide?: 'left' | 'right';
  family?: 'type01' | 'type02';
  parity?: 'single' | 'double';
  handleAtBottom?: boolean;
}
export interface HardwarePoint { x: number; y: number; z: number }
export interface ReferenceHardwarePart extends HardwarePoint {
  name: 'front' | 'side-left' | 'side-right' | 'bottom' | 'back';
  w: number;
  h: number;
  d: number;
}
export interface ReferenceDoorGeometry {
  thickness: number;
  frontOffsetY: number;
  boundingHeight: number;
  hingeSide: 'left' | 'right';
  handle: HardwarePoint | null;
  handleRotation: number;
  handleKind: 'slim' | 'full-left' | 'full-right';
  handleSize?: { w: number; h: number; d: number };
  hinges: HardwarePoint[];
  openAngle: number;
}
export interface ReferenceDrawerGeometry {
  parts: ReferenceHardwarePart[];
  handle: HardwarePoint;
  openDistance: number;
  handleKind: 'slim' | 'full-top';
  handleSize?: { w: number; h: number; d: number };
}

/** Current Type01/Type02 renderer (modules135/189/335/1036).
 * Type02 replaces the gallery's 19mm envelope with a 16mm laminate front. */
export function calculateReferenceDoorPlacement(front: ReferenceFront, depth: number) {
  if (front.catalogFront) {
    const side = front.hingeSide ?? 'right';
    const line = front.catalogFront.handle === 'line';
    const handleWidth = line ? (side === 'left' ? 1 : 3) : 0;
    const boundingWidth = front.width - (line ? 0 : .4);
    const width = boundingWidth - handleWidth, height = front.height - .4;
    const x = front.x + (side === 'left' ? -boundingWidth/2 : boundingWidth/2);
    const centerOffset = front.x - x;
    const pivotOffsetX = centerOffset + (side === 'left' ? -handleWidth/2 : handleWidth/2);
    return {x,y:front.y,z:front.catalogFront.z,width,height,pivotOffsetX,layerIndex:front.rowIndex,
      reference:{thickness:1.8,frontOffsetY:0,boundingHeight:height,hingeSide:side,
        handle:front.catalogFront.handle==='push'?null:line
          ? {x:centerOffset+(side==='left'?boundingWidth/2-handleWidth:-boundingWidth/2+handleWidth),y:0,z:0}
          : {x:centerOffset,y:height/2-1,z:.9},
        handleKind:(line?(side==='left'?'full-left':'full-right'):'slim') as ReferenceDoorGeometry['handleKind'],
        handleSize:line?{w:handleWidth,h:height,d:1.8}:undefined,
        handleRotation:0,hinges:[],openAngle:(side==='left'?-1:1)*Math.PI/2}};
  }
  const hingeSide = front.hingeSide ?? 'right';
  const type01 = front.family === 'type01';
  const double = front.parity === 'double';
  const left = front.x - front.width / 2 + (double && hingeSide === 'right' ? .15 : .3);
  const right = front.x + front.width / 2 - (double && hingeSide === 'left' ? .15 : .3);
  const boundingWidth = right - left;
  const boundingHeight = front.height - .6;
  const thickness = type01 ? 1.9 : 1.6;
  const handleWidth = type01 ? (hingeSide === 'left' ? 1 : 3) : 0;
  const handleHeight = type01 ? 0 : .1;
  const center = (left + right) / 2;
  const x = hingeSide === 'left' ? left + 2 : right - 2;
  const centerOffset = center - x;
  const pivotOffsetX = centerOffset + (hingeSide === 'left' ? -handleWidth / 2 : handleWidth / 2);
  const bottomHandle = front.handleAtBottom ?? false;
  const reference: ReferenceDoorGeometry = {
    thickness,
    frontOffsetY: (bottomHandle ? 1 : -1) * handleHeight / 2,
    boundingHeight,
    hingeSide,
    handle: !type01 && double && hingeSide === 'left' ? null : {
      x: centerOffset + (hingeSide === 'left' ? boundingWidth / 2 - handleWidth - (type01 ? 0 : 6.5) : -boundingWidth / 2 + handleWidth + (type01 ? 0 : 6.5)),
      y: type01 ? 0 : (bottomHandle ? -1 : 1) * (boundingHeight / 2 - .05), z: 0,
    },
    handleKind: type01 ? (hingeSide === 'left' ? 'full-left' : 'full-right') : 'slim',
    handleSize: type01 ? { w: handleWidth, h: boundingHeight, d: thickness } : undefined,
    handleRotation: !type01 && bottomHandle ? Math.PI : 0,
    hinges: [1, -1].map(sign => ({
      x: centerOffset + (hingeSide === 'left' ? -boundingWidth / 2 + 2.1 : boundingWidth / 2 - 2.1),
      y: sign * (boundingHeight / 2 - 5), z: -thickness / 2,
    })),
    openAngle: (hingeSide === 'left' ? -1 : 1) * 85 * Math.PI / 180,
  };
  return { x, y: front.y, z: depth - thickness / 2, width: boundingWidth - handleWidth,
    height: boundingHeight - handleHeight, pivotOffsetX, layerIndex: front.rowIndex, reference };
}

/** Current Type01/Type02 drawer renderer (modules189/334/1034/1035).
 * Parts are local to the returned placement; all values are centimetres. */
export function calculateReferenceDrawerPlacement(front: ReferenceFront, depth: number) {
  const heightMm = Math.round(front.height * 10);
  const depthMm = Math.round(depth * 10);
  const sideHeight = ({ 182: 10.6, 282: 20.6, 382: 30.6 } as Record<number, number>)[heightMm];
  const backHeight = ({ 182: 8.6, 282: 18.6, 382: 28.6 } as Record<number, number>)[heightMm];
  const bottomDepth = ({ 320: 25.8, 400: 33.8, 500: 43.8, 600: 53.8 } as Record<number, number>)[depthMm];
  if (front.catalogFront) {
    const w=front.width-.6,h=front.height-.6,d=front.catalogFront.depth;
    const parts:ReferenceHardwarePart[]=[
      {name:'front',w,h,d:1.8,x:0,y:0,z:d/2-.9},
      {name:'side-left',w:1.2,h:h-3,d:d-3,x:-w/2+.6,y:-1,z:0},
      {name:'side-right',w:1.2,h:h-3,d:d-3,x:w/2-.6,y:-1,z:0},
      {name:'bottom',w:w-2.4,h:1.2,d:d-3,x:0,y:-h/2+1,z:0},
      {name:'back',w:w-2.4,h:h-3,d:1.2,x:0,y:-1,z:-d/2+.6}];
    return {x:front.x,y:front.y,z:front.catalogFront.z,compartmentWidth:front.width,rowHeight:front.height,drawerDepth:d,
      layerIndex:front.rowIndex,reference:{parts,handle:{x:0,y:h/2-1.5,z:d/2-.9},handleKind:'full-top' as const,
        handleSize:{w,h:3,d:1.8},openDistance:d*.8}};
  }
  if (sideHeight === undefined || backHeight === undefined || bottomDepth === undefined) return null;
  const type01 = front.family === 'type01';
  const handleHeight = type01 ? 3 : .1;
  const width = front.width - .6, height = front.height - .6;
  const drawerDepth = bottomDepth + 1.6 + 1.2;
  const parts: ReferenceHardwarePart[] = [
    { name: 'front', w: width, h: height - handleHeight, d: 1.6, x: 0, y: -handleHeight / 2, z: drawerDepth / 2 - .8 },
    { name: 'side-left', w: 1.2, h: sideHeight, d: drawerDepth - 1.6,
      x: -width / 2 + 1.2, y: -height / 2 + sideHeight / 2 + 1.2, z: 0 },
    { name: 'side-right', w: 1.2, h: sideHeight, d: drawerDepth - 1.6,
      x: width / 2 - 1.2, y: -height / 2 + sideHeight / 2 + 1.2, z: 0 },
    { name: 'bottom', w: width - 3.6, h: 1.2, d: bottomDepth,
      x: 0, y: -height / 2 + 3.8, z: 0 },
    { name: 'back', w: width - 3.6, h: backHeight, d: 1.2,
      x: 0, y: -height / 2 + backHeight / 2 + 3.2, z: -drawerDepth / 2 + 1.2 },
  ];
  const reference: ReferenceDrawerGeometry = {
    parts,
    handle: { x: type01 ? 0 : -width / 2 + 6.5, y: height / 2 - (type01 ? 3 : .05), z: drawerDepth / 2 - .8 },
    handleKind: type01 ? 'full-top' : 'slim',
    handleSize: type01 ? { w: width, h: 3, d: 1.6 } : undefined,
    openDistance: .95 * drawerDepth,
  };
  return { x: front.x, y: front.y, z: depth - drawerDepth / 2,
    compartmentWidth: front.width, rowHeight: front.height, drawerDepth,
    layerIndex: front.rowIndex, reference };
}

/** Closed-state physical panels shared by rendering and manufacturing export. */
export function getReferenceDrawerParts(front: ReferenceFront, depth: number): ReferenceHardwarePart[] {
  const placement = calculateReferenceDrawerPlacement(front, depth);
  if (!placement) return [];
  return placement.reference.parts.map(p => ({ ...p,
    x: p.x + placement.x, y: p.y + placement.y, z: p.z + placement.z }));
}
