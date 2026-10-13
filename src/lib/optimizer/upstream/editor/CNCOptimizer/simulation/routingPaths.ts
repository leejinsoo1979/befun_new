import type { PanelBoringData } from '@/lib/optimizer/upstream/domain/boring/types';
import { getSideNotchContourPoints, resolveBackPanelGrooveLine, resolveDrawerBottomGrooveRect } from '@/lib/optimizer/upstream/domain/boring/exporters/mprExporter';
import type { Point3 } from './program';

export interface RoutingOptions { diameter: number; maxPassDepth: number; rpm: number }
// 기존 MPR 검증용 공구표의 참조값. 실제 공장 공구표/NC가 아니며 공구 설정에서 바꾼다.
export const referenceRouting: RoutingOptions = { diameter: 8, maxPassDepth: 6, rpm: 18000 };
export interface RoutingFeature { id: string; label: string; operation: 'groove' | 'notch'; face?: 'top' | 'bottom'; diameter: number; depth: number; paths: Point3[][]; offcut?: { min: Point3; max: Point3 };
  /** [Befun 확장] 프로파일 커터(커넥터 키홀): 전체 깊이를 한 번에 내려가 이동 후 빠진다. */
  singlePass?: boolean; plunge?: boolean }

/** 제조 형상과 화면 공구 경로를 분리한다. MPR 함수의 좌표/폭/깊이는 쓰기 없이 소비한다. */
export function routingPaths(data: PanelBoringData, map: (p: Point3) => Point3, options: RoutingOptions): RoutingFeature[] {
  if (![options.diameter, options.maxPassDepth, options.rpm].every(v => Number.isFinite(v) && v > 0)) throw new Error('루터 지름·패스 깊이·회전수를 확인해 주십시오.');
  const result: RoutingFeature[] = [];
  const groove = (id: string, label: string, from: Point3, to: Point3, width: number, depth: number) => {
    if (![...from,...to,width,depth].every(Number.isFinite) || width <= 0 || depth <= 0 || depth >= data.thickness) throw new Error(`${data.panelName}: 홈 폭·깊이가 유효하지 않습니다.`);
    // 좁은 홈은 해당 폭의 참조 공구를 선택한다. 실제 장비 보유 공구를 확인했다는 뜻은 아니다.
    const diameter = Math.min(options.diameter, width), r = diameter / 2;
    const length = Math.hypot(to[0]-from[0],to[1]-from[1]);
    const along: Point3 = [(to[0]-from[0])/length,(to[1]-from[1])/length,0];
    const across: Point3 = [-along[1],along[0],0];
    const count = Math.max(1,Math.ceil((width-diameter)/diameter)+1);
    const paths = Array.from({length:count},(_,i) => {
      const offset=count===1?0:-(width-diameter)/2+(width-diameter)*i/(count-1);
      const point=(p:Point3,d:number):Point3 => map([p[0]+across[0]*offset+along[0]*d,p[1]+across[1]*offset+along[1]*d,data.thickness]);
      return [point(from,-r),point(to,r)];
    });
    result.push({id,label,operation:'groove',diameter,depth,paths});
  };
  const back=resolveBackPanelGrooveLine(data);
  if(data.backPanelGroove && !back) throw new Error(`${data.panelName}: 백패널 홈의 가공면을 결정할 수 없습니다.`);
  if(back) {
    if(back.y1-back.width/2<0 || back.y1+back.width/2>data.height) throw new Error(`${data.panelName}: 백패널 홈이 판재 밖입니다.`);
    groove('back-groove','백패널 홈',[back.x1,back.y1,0],[back.x2,back.y2,0],back.width,back.depth);
  }
  for(const [i,g] of (data.groovePositions??[]).entries()) {
    const rect=resolveDrawerBottomGrooveRect(data,g);
    if(!rect || g.y<0 || g.y+g.height>data.width || g.depth!==rect.depth) throw new Error(`${data.panelName}: 서랍 바닥홈이 판재 밖입니다.`);
    const x=rect.x+rect.length/2;
    groove(`drawer-groove-${i}`,'서랍 바닥판 홈',[x,0,0],[x,data.height,0],rect.length,rect.depth);
  }
  for(const [i,n] of (data.sideNotches??[]).entries()) {
    if(!['side-left','side-right'].includes(data.panelType) || ![n.y,n.z,n.fromBottom].every(Number.isFinite)
      || n.y<=0 || n.z<=0 || n.fromBottom<0 || n.fromBottom+n.y>data.width || n.z>=data.height) throw new Error(`${data.panelName}: 목찬넬 따내기 좌표가 유효하지 않습니다.`);
    if(options.diameter>Math.min(n.y,n.z)) throw new Error(`${data.panelName}: 목찬넬 따내기보다 루터 공구가 큽니다.`);
    const raw=getSideNotchContourPoints(data,n), r=options.diameter/2;
    const right=data.panelType==='side-right'||data.panelName.includes('우측');
    const waste=[data.width-n.fromBottom-n.y/2,right?data.height-n.z/2:n.z/2];
    // 윤곽은 완성면, 공구 중심은 잔재 쪽 반지름만큼 이동한다. 모서리는 인접 직선의 교점.
    const segments=raw.slice(1).map((b,j)=>{
      const a=raw[j], length=Math.hypot(b.x-a.x,b.y-a.y), u=[(b.x-a.x)/length,(b.y-a.y)/length];
      const normal=[-u[1],u[0]], sign=Math.sign((waste[0]-(a.x+b.x)/2)*normal[0]+(waste[1]-(a.y+b.y)/2)*normal[1]);
      return {a:[a.x+normal[0]*sign*r,a.y+normal[1]*sign*r],b:[b.x+normal[0]*sign*r,b.y+normal[1]*sign*r],u};
    });
    if(!segments.length) throw new Error(`${data.panelName}: 목찬넬 윤곽이 없습니다.`);
    const first=segments[0],last=segments[segments.length-1];
    const points:number[][]=[[first.a[0]-first.u[0]*options.diameter,first.a[1]-first.u[1]*options.diameter]];
    for(let j=1;j<segments.length;j++) {
      const a=segments[j-1],b=segments[j], cross=a.u[0]*b.u[1]-a.u[1]*b.u[0];
      const t=((b.a[0]-a.a[0])*b.u[1]-(b.a[1]-a.a[1])*b.u[0])/cross;
      points.push([a.a[0]+a.u[0]*t,a.a[1]+a.u[1]*t]);
    }
    points.push([last.b[0]+last.u[0]*options.diameter,last.b[1]+last.u[1]*options.diameter]);
    const corners = [map([data.width-n.fromBottom-n.y,right?data.height-n.z:0,0]), map([data.width-n.fromBottom,right?data.height:n.z,data.thickness])];
    const offcut = {min: corners[0].map((v,j)=>Math.min(v,corners[1][j])) as Point3, max: corners[0].map((v,j)=>Math.max(v,corners[1][j])) as Point3};
    result.push({id:`notch-${i}`,label:'목찬넬 따내기',operation:'notch',diameter:options.diameter,depth:data.thickness,
      offcut,paths:[points.map(p=>map([p[0],p[1],data.thickness]))]});
  }
  return result;
}
