import { placedCuttingShape } from './cuttingBoardShape';
import { OptimizedResult } from '../types';
import {
  resolveDefaultBoringDepthPositions,
  resolveOptimizerDoorBoringPoints,
} from '@/lib/optimizer/upstream/utils/cnc/optimizerMachiningGeometry';
import { assertManufacturingReady } from '@/lib/optimizer/upstream/domain/boring/manufacturingBlock';

const formatPanelMm = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

function isFurnitureRightSidePanel(panel: any): boolean {
  const name = panel?.name || '';
  return !name.includes('서랍') && (name.includes('우측판') || name.includes('우측'));
}

function resolveFurnitureSideDepthPosition(panel: any, depthPosMm: number): number {
  const originalWidth = panel.width || 0;
  return isFurnitureRightSidePanel(panel)
    ? originalWidth - depthPosMm
    : depthPosMm;
}

export class SimpleDXFExporter {
  
  public static exportToDXF(results: OptimizedResult[]): string {
    // 시트 전체를 한 파일로 만들기 전에 검사한다. 일부 시트만 빼고 내보내지 않는다.
    assertManufacturingReady(results.flatMap(result => result.panels ?? []), 'DXF');
    const lines: string[] = [];
    
    // DXF Header section - Complete for AutoCAD compatibility
    lines.push('0');
    lines.push('SECTION');
    lines.push('2');
    lines.push('HEADER');
    lines.push('9');
    lines.push('$ACADVER');
    lines.push('1');
    lines.push('AC1009'); // AutoCAD R12 format
    lines.push('9');
    lines.push('$INSBASE');
    lines.push('10');
    lines.push('0.0');
    lines.push('20');
    lines.push('0.0');
    lines.push('30');
    lines.push('0.0');
    lines.push('9');
    lines.push('$EXTMIN');
    lines.push('10');
    lines.push('0.0');
    lines.push('20');
    lines.push('0.0');
    lines.push('30');
    lines.push('0.0');
    lines.push('9');
    lines.push('$EXTMAX');
    lines.push('10');
    lines.push('10000.0');
    lines.push('20');
    lines.push('5000.0');
    lines.push('30');
    lines.push('0.0');
    lines.push('0');
    lines.push('ENDSEC');
    
    // Tables section (required for AutoCAD)
    lines.push('0');
    lines.push('SECTION');
    lines.push('2');
    lines.push('TABLES');
    lines.push('0');
    lines.push('TABLE');
    lines.push('2');
    lines.push('LTYPE');
    lines.push('70');
    lines.push('1');
    lines.push('0');
    lines.push('LTYPE');
    lines.push('2');
    lines.push('CONTINUOUS');
    lines.push('70');
    lines.push('64');
    lines.push('3');
    lines.push('Solid line');
    lines.push('72');
    lines.push('65');
    lines.push('73');
    lines.push('0');
    lines.push('40');
    lines.push('0.0');
    lines.push('0');
    lines.push('ENDTAB');
    lines.push('0');
    lines.push('TABLE');
    lines.push('2');
    lines.push('LAYER');
    lines.push('70');
    lines.push('1');
    lines.push('0');
    lines.push('LAYER');
    lines.push('2');
    lines.push('0');
    lines.push('70');
    lines.push('0');
    lines.push('62');
    lines.push('7');
    lines.push('6');
    lines.push('CONTINUOUS');
    lines.push('0');
    lines.push('ENDTAB');
    lines.push('0');
    lines.push('ENDSEC');
    
    // Entities section
    lines.push('0');
    lines.push('SECTION');
    lines.push('2');
    lines.push('ENTITIES');
    
    // Process each sheet
    results.forEach((result, sheetIndex) => {
      const offsetX = sheetIndex * (result.stockPanel.width + 200);
      const offsetY = 0;
      
      // Draw stock panel outline (white - color 7)
      // Top line
      lines.push('0');
      lines.push('LINE');
      lines.push('8');
      lines.push('0'); // Layer
      lines.push('62');
      lines.push('7'); // White color
      lines.push('10');
      lines.push(String(offsetX));
      lines.push('20');
      lines.push(String(offsetY));
      lines.push('11');
      lines.push(String(offsetX + result.stockPanel.width));
      lines.push('21');
      lines.push(String(offsetY));
      
      // Right line
      lines.push('0');
      lines.push('LINE');
      lines.push('8');
      lines.push('0');
      lines.push('62');
      lines.push('7'); // White color
      lines.push('10');
      lines.push(String(offsetX + result.stockPanel.width));
      lines.push('20');
      lines.push(String(offsetY));
      lines.push('11');
      lines.push(String(offsetX + result.stockPanel.width));
      lines.push('21');
      lines.push(String(offsetY + result.stockPanel.height));
      
      // Bottom line
      lines.push('0');
      lines.push('LINE');
      lines.push('8');
      lines.push('0');
      lines.push('62');
      lines.push('7'); // White color
      lines.push('10');
      lines.push(String(offsetX + result.stockPanel.width));
      lines.push('20');
      lines.push(String(offsetY + result.stockPanel.height));
      lines.push('11');
      lines.push(String(offsetX));
      lines.push('21');
      lines.push(String(offsetY + result.stockPanel.height));
      
      // Left line
      lines.push('0');
      lines.push('LINE');
      lines.push('8');
      lines.push('0');
      lines.push('62');
      lines.push('7'); // White color
      lines.push('10');
      lines.push(String(offsetX));
      lines.push('20');
      lines.push(String(offsetY + result.stockPanel.height));
      lines.push('11');
      lines.push(String(offsetX));
      lines.push('21');
      lines.push(String(offsetY));
      
      // 원장 패널에 대각선 해치 추가 (45도 각도, 흰색) - 패널 영역 제외
      const hatchSpacing = 50; // 해치 간격 (mm)
      const stockWidth = result.stockPanel.width;
      const stockHeight = result.stockPanel.height;
      const maxDimension = Math.max(stockWidth, stockHeight);
      
      // 패널 영역 정보를 미리 수집
      const panelRegions = result.panels.map(panel => ({
        x: offsetX + panel.x,
        y: offsetY + panel.y,
        width: panel.rotated ? panel.height : panel.width,
        height: panel.rotated ? panel.width : panel.height
      }));
      
      // 점이 패널 내부 또는 패널 사이 톱날 공간에 있는지 확인
      const pointInPanel = (x: number, y: number): boolean => {
        const margin = 5; // 5mm 여유 (톱날 두께 고려)
        const sawBladeSpace = 5; // 패널 사이 톱날 공간
        
        for (const panel of panelRegions) {
          // 패널 자체와 패널 주변의 톱날 공간까지 포함하여 확인
          if (x >= panel.x - margin - sawBladeSpace && 
              x <= panel.x + panel.width + margin + sawBladeSpace &&
              y >= panel.y - margin - sawBladeSpace && 
              y <= panel.y + panel.height + margin + sawBladeSpace) {
            return true;
          }
        }
        return false;
      };
      
      // 왼쪽 아래에서 오른쪽 위로 가는 대각선 (45도)
      for (let i = -maxDimension; i < maxDimension * 2; i += hatchSpacing) {
        // 시작점과 끝점 계산
        let x1 = offsetX + i;
        let y1 = offsetY + stockHeight;
        let x2 = offsetX + i + stockHeight;
        let y2 = offsetY;
        
        // 원장 영역 내로 클리핑
        if (x1 < offsetX) {
          const diff = offsetX - x1;
          x1 = offsetX;
          y1 = offsetY + stockHeight - diff;
        }
        if (y1 > offsetY + stockHeight) {
          const diff = y1 - (offsetY + stockHeight);
          y1 = offsetY + stockHeight;
          x1 = x1 + diff;
        }
        
        if (x2 > offsetX + stockWidth) {
          const diff = x2 - (offsetX + stockWidth);
          x2 = offsetX + stockWidth;
          y2 = offsetY + diff;
        }
        if (y2 < offsetY) {
          const diff = offsetY - y2;
          y2 = offsetY;
          x2 = x2 - diff;
        }
        
        // 유효한 선분인 경우
        if (x1 >= offsetX && x1 <= offsetX + stockWidth &&
            x2 >= offsetX && x2 <= offsetX + stockWidth &&
            y1 >= offsetY && y1 <= offsetY + stockHeight &&
            y2 >= offsetY && y2 <= offsetY + stockHeight) {
          
          // 선분을 작은 세그먼트로 나누어 패널을 피해 그리기
          const segments = 100; // 선분을 100개 세그먼트로 나눔
          let currentX = x1;
          let currentY = y1;
          let segmentStartX = x1;
          let segmentStartY = y1;
          let drawing = !pointInPanel(x1, y1);
          
          for (let j = 1; j <= segments; j++) {
            const t = j / segments;
            const nextX = x1 + (x2 - x1) * t;
            const nextY = y1 + (y2 - y1) * t;
            const inPanel = pointInPanel(nextX, nextY);
            
            if (drawing && inPanel) {
              // 패널 경계에서 선분 끝내기
              if (currentX !== segmentStartX || currentY !== segmentStartY) {
                lines.push('0');
                lines.push('LINE');
                lines.push('8');
                lines.push('0');
                lines.push('62');
                lines.push('7'); // White color
                lines.push('10');
                lines.push(String(segmentStartX));
                lines.push('20');
                lines.push(String(segmentStartY));
                lines.push('11');
                lines.push(String(currentX));
                lines.push('21');
                lines.push(String(currentY));
              }
              drawing = false;
            } else if (!drawing && !inPanel) {
              // 패널 밖에서 새 선분 시작
              segmentStartX = currentX;
              segmentStartY = currentY;
              drawing = true;
            }
            
            currentX = nextX;
            currentY = nextY;
          }
          
          // 마지막 세그먼트 그리기
          if (drawing && (currentX !== segmentStartX || currentY !== segmentStartY)) {
            lines.push('0');
            lines.push('LINE');
            lines.push('8');
            lines.push('0');
            lines.push('62');
            lines.push('7'); // White color
            lines.push('10');
            lines.push(String(segmentStartX));
            lines.push('20');
            lines.push(String(segmentStartY));
            lines.push('11');
            lines.push(String(x2));
            lines.push('21');
            lines.push(String(y2));
          }
        }
      }
      
      // Draw panels
      result.panels.forEach(panel => {
        const panelX = offsetX + panel.x;
        const panelY = offsetY + panel.y;
        
        // 회전 여부에 따른 실제 크기 (뷰어와 동일하게)
        const displayWidth = panel.rotated ? panel.height : panel.width;
        const displayHeight = panel.rotated ? panel.width : panel.height;
        
        // 수동 절삭 패널은 이름 기반 가구 가공 추론 없이 실제 형상만 출력한다.
        if (panel.cuttingBoardShape) {
          const geometry = placedCuttingShape(panel.cuttingBoardShape, panel.rotated);
          geometry.rings.forEach(ring => ring.slice(1).forEach((b, i) => {
            const a = ring[i];
            lines.push('0', 'LINE', '8', '0', '62', '30', '10', String(panelX + a.x), '20', String(panelY + a.y), '11', String(panelX + b.x), '21', String(panelY + b.y));
          }));
          geometry.circles.forEach(c => lines.push('0', 'CIRCLE', '8', '0', '62', '4', '10', String(panelX + c.x), '20', String(panelY + c.y), '40', String(c.radius)));
          lines.push('0', 'TEXT', '8', '0', '10', String(panelX + displayWidth / 2), '20', String(panelY + displayHeight / 2), '40', '15', '1', `${panel.name} ${formatPanelMm(panel.width)} x ${formatPanelMm(panel.height)}`);
          return;
        }

        // Panel outline (orange - color 30)
        // Top line
        lines.push('0');
        lines.push('LINE');
        lines.push('8');
        lines.push('0');
        lines.push('62');
        lines.push('30'); // Orange color
        lines.push('10');
        lines.push(String(panelX));
        lines.push('20');
        lines.push(String(panelY));
        lines.push('11');
        lines.push(String(panelX + displayWidth));
        lines.push('21');
        lines.push(String(panelY));
        
        // Right line
        lines.push('0');
        lines.push('LINE');
        lines.push('8');
        lines.push('0');
        lines.push('62');
        lines.push('30'); // Orange color
        lines.push('10');
        lines.push(String(panelX + displayWidth));
        lines.push('20');
        lines.push(String(panelY));
        lines.push('11');
        lines.push(String(panelX + displayWidth));
        lines.push('21');
        lines.push(String(panelY + displayHeight));
        
        // Bottom line
        lines.push('0');
        lines.push('LINE');
        lines.push('8');
        lines.push('0');
        lines.push('62');
        lines.push('30'); // Orange color
        lines.push('10');
        lines.push(String(panelX + displayWidth));
        lines.push('20');
        lines.push(String(panelY + displayHeight));
        lines.push('11');
        lines.push(String(panelX));
        lines.push('21');
        lines.push(String(panelY + displayHeight));
        
        // Left line
        lines.push('0');
        lines.push('LINE');
        lines.push('8');
        lines.push('0');
        lines.push('62');
        lines.push('30'); // Orange color
        lines.push('10');
        lines.push(String(panelX));
        lines.push('20');
        lines.push(String(panelY + displayHeight));
        lines.push('11');
        lines.push(String(panelX));
        lines.push('21');
        lines.push(String(panelY));
        
        // 치수 표시 - 패널 내부에 표시
        
        // L방향 치수 (가로 치수) - 패널 내부 상단에 표시
        lines.push('0');
        lines.push('TEXT');
        lines.push('8');
        lines.push('0');
        lines.push('62');
        lines.push('7'); // White color
        lines.push('10');
        lines.push(String(panelX + displayWidth / 2));
        lines.push('20');
        lines.push(String(panelY + 35)); // 패널 내부 상단
        lines.push('30');
        lines.push('0');
        lines.push('40');
        lines.push('25'); // 텍스트 높이
        lines.push('1');
        lines.push(formatPanelMm(displayWidth));
        lines.push('72');
        lines.push('1'); // Center horizontally
        lines.push('11');
        lines.push(String(panelX + displayWidth / 2));
        lines.push('21');
        lines.push(String(panelY + 35));
        lines.push('31');
        lines.push('0');
        
        // W방향 치수 (세로 치수) - 패널 내부 좌측에 90도 회전하여 표시
        lines.push('0');
        lines.push('TEXT');
        lines.push('8');
        lines.push('0');
        lines.push('62');
        lines.push('7'); // White color
        lines.push('10');
        lines.push(String(panelX + 35)); // 패널 내부 좌측
        lines.push('20');
        lines.push(String(panelY + displayHeight / 2));
        lines.push('30');
        lines.push('0');
        lines.push('40');
        lines.push('25'); // 텍스트 높이
        lines.push('1');
        lines.push(formatPanelMm(displayHeight));
        lines.push('50');
        lines.push('90'); // 90도 회전
        lines.push('72');
        lines.push('1'); // Center horizontally
        lines.push('11');
        lines.push(String(panelX + 35));
        lines.push('21');
        lines.push(String(panelY + displayHeight / 2));
        lines.push('31');
        lines.push('0');

        // ★★★ 보링/홈가공 표시 ★★★
        const origW = panel.width;
        const origH = panel.height;
        const isDoorPanel = panel.name?.includes('도어') || panel.name?.includes('Door');
        const isDrawerSide = panel.name?.includes('서랍') && (panel.name?.includes('좌측판') || panel.name?.includes('우측판'));
        const isDrawerFront = panel.name?.includes('서랍') && panel.name?.includes('앞판');
        const isFurnitureSide = (panel.name?.includes('좌측') || panel.name?.includes('우측') || panel.name?.includes('측판'))
          && !panel.name?.includes('서랍') && !isDoorPanel;
        const isLeftSide = panel.name?.includes('좌측');

        // DXF 좌표 헬퍼
        const addDxfCircle = (cx: number, cy: number, r: number, color: number = 4) => {
          lines.push('0'); lines.push('CIRCLE');
          lines.push('8'); lines.push('0');
          lines.push('62'); lines.push(String(color));
          lines.push('10'); lines.push(cx.toFixed(2));
          lines.push('20'); lines.push(cy.toFixed(2));
          lines.push('40'); lines.push(r.toFixed(2));
        };
        const addDxfLine = (x1: number, y1: number, x2: number, y2: number, color: number = 4) => {
          lines.push('0'); lines.push('LINE');
          lines.push('8'); lines.push('0');
          lines.push('62'); lines.push(String(color));
          lines.push('10'); lines.push(x1.toFixed(2));
          lines.push('20'); lines.push(y1.toFixed(2));
          lines.push('11'); lines.push(x2.toFixed(2));
          lines.push('21'); lines.push(y2.toFixed(2));
        };
        const addDxfBoring = (cx: number, cy: number, r: number, cs: number, color: number = 4) => {
          addDxfCircle(cx, cy, r, color);
          addDxfLine(cx - cs, cy, cx + cs, cy, color);
          addDxfLine(cx, cy - cs, cx, cy + cs, color);
        };

        // 선반핀/서랍 보링
        if ((panel as any).boringPositions && (panel as any).boringPositions.length > 0 && !isDoorPanel && !isDrawerFront) {
          let depthPos: number[] = [];
          if (isDrawerSide) {
            depthPos = (panel as any).boringDepthPositions?.length > 0
              ? (panel as any).boringDepthPositions
              : resolveDefaultBoringDepthPositions(panel, true);
          } else {
            depthPos = (panel as any).boringDepthPositions?.length > 0
              ? (panel as any).boringDepthPositions
              : resolveDefaultBoringDepthPositions(panel, false);
          }

          ((panel as any).boringPositions as number[]).forEach((bPosMm: number) => {
            const group = (panel as any).boringDepthGroups?.find((item: any) => Math.abs(item.y - bPosMm) < 0.01);
            const depthPosForY = !isDrawerSide && !isDrawerFront && group?.depthPositions?.length > 0
              ? group.depthPositions
              : depthPos;
            const isFixedPanelBoring = group?.boringType === 'fixed-panel'
              || (!group?.boringType && !isDrawerSide && !isDrawerFront && depthPosForY.length >= 3);
            const holeRadius = (isDrawerSide || isDrawerFront ? 3 : (isFixedPanelBoring ? 6 : 5)) / 2;

            depthPosForY.forEach((dPosMm: number) => {
              let sx: number, sy: number;
              if (isDrawerSide || isDrawerFront) {
                if (panel.rotated) {
                  sx = panel.x + dPosMm; sy = panel.y + bPosMm;
                } else {
                  sx = panel.x + bPosMm; sy = panel.y + dPosMm;
                }
              } else if (panel.rotated) {
                const fY = origH - bPosMm;
                const resolvedDepthPosMm = resolveFurnitureSideDepthPosition(panel, dPosMm);
                sx = panel.x + resolvedDepthPosMm * (origH / origW);
                sy = panel.y + fY * (origW / origH);
              } else {
                const resolvedDepthPosMm = resolveFurnitureSideDepthPosition(panel, dPosMm);
                sx = panel.x + resolvedDepthPosMm; sy = panel.y + (origH - bPosMm);
              }
              addDxfBoring(offsetX + sx, offsetY + sy, holeRadius, 2, 4);
            });
          });
        }

        // 도어 힌지 보링
        if (isDoorPanel && (
          ((panel as any).boringPositions?.length ?? 0) > 0 ||
          ((panel as any).screwPositions?.length ?? 0) > 0
        )) {
          const doorPoints = resolveOptimizerDoorBoringPoints(panel);

          doorPoints.cupPoints.forEach((point) => {
            addDxfBoring(offsetX + panel.x + point.x, offsetY + panel.y + point.y, 35 / 2, 3, 4);
          });
          doorPoints.screwPoints.forEach((point) => {
            addDxfBoring(offsetX + panel.x + point.x, offsetY + panel.y + point.y, 3 / 2, 2, 4);
          });
        }

        // 브라켓 타공
        if ((panel as any).isBracketSide && (panel as any).bracketBoringPositions?.length > 0) {
          const bXPos: number[] = (panel as any).bracketBoringDepthPositions || [20, 52];
          ((panel as any).bracketBoringPositions as number[]).forEach((yP: number) => {
            const fY = origH - yP;
            bXPos.forEach((xP: number) => {
              let sx: number, sy: number;
              if (panel.rotated) {
                sx = panel.x + xP * (origH / origW);
                sy = panel.y + fY * (origW / origH);
              } else {
                sx = panel.x + xP; sy = panel.y + fY;
              }
              addDxfBoring(offsetX + sx, offsetY + sy, 1.5, 1.5, 4);
            });
          });
        }

        // 백패널 홈 (가구 측판)
        if (isFurnitureSide) {
          const bpOff = (panel as any).backPanelGroove?.offset ?? 16;
          const gw = (panel as any).backPanelGroove?.width ?? 10;
          const gsX = isLeftSide ? origW - bpOff - gw : bpOff;
          let gx: number, gy: number, gWidth: number, gHeight: number;
          if (panel.rotated) {
            gx = panelX; gy = panelY + gsX;
            gWidth = displayWidth; gHeight = gw;
          } else {
            gx = panelX + gsX; gy = panelY;
            gWidth = gw; gHeight = displayHeight;
          }
          // 홈 사각형 (magenta=6)
          addDxfLine(gx, gy, gx + gWidth, gy, 6);
          addDxfLine(gx + gWidth, gy, gx + gWidth, gy + gHeight, 6);
          addDxfLine(gx + gWidth, gy + gHeight, gx, gy + gHeight, 6);
          addDxfLine(gx, gy + gHeight, gx, gy, 6);
        }

        // 서랍 바닥판 홈
        if (panel.name?.includes('서랍') && (panel as any).groovePositions?.length > 0) {
          ((panel as any).groovePositions as any[]).forEach((groove: any) => {
            const gx = panelX;
            const gy = panelY + groove.y;
            const gWidth = displayWidth;
            const gHeight = groove.height;
            addDxfLine(gx, gy, gx + gWidth, gy, 6);
            addDxfLine(gx + gWidth, gy, gx + gWidth, gy + gHeight, 6);
            addDxfLine(gx + gWidth, gy + gHeight, gx, gy + gHeight, 6);
            addDxfLine(gx, gy + gHeight, gx, gy, 6);
          });
        }
      });

      // Sheet label
      lines.push('0');
      lines.push('TEXT');
      lines.push('8');
      lines.push('0');
      lines.push('10');
      lines.push(String(offsetX + 10));
      lines.push('20');
      lines.push(String(offsetY - 30));
      lines.push('40');
      lines.push('15'); // Text height
      lines.push('1');
      lines.push(`Sheet ${sheetIndex + 1}`);
    });
    
    // End entities
    lines.push('0');
    lines.push('ENDSEC');
    lines.push('0');
    lines.push('EOF');
    
    return lines.join('\r\n');
  }
}
