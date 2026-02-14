'use client';

import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import type { RowHeight } from '@/types/shelf';

const ROW_HEIGHTS: RowHeight[] = [18, 32, 38];

// v1 비즈니스 규칙: 도어는 32cm 이상, 서랍은 깊이 40cm 이상 + 높이 150cm 이하
const MIN_DOOR_HEIGHT = 32;
const MIN_DRAWER_DEPTH = 39.5;

export function RowControls() {
  const numRows = useShelfStore((s) => s.numRows);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const depth = useShelfStore((s) => s.depth);
  const height = useShelfStore((s) => s.height);
  const setRowHeight = useShelfStore((s) => s.setRowHeight);
  const doorsCreatedLayers = useHardwareStore((s) => s.doorsCreatedLayers);
  const drawersCreatedLayers = useHardwareStore((s) => s.drawersCreatedLayers);
  const toggleDoor = useHardwareStore((s) => s.toggleDoor);
  const toggleDrawer = useHardwareStore((s) => s.toggleDrawer);

  return (
    <div className="mb-5">
      <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wider">
        Row Settings
      </label>
      <div className="space-y-2">
        {Array.from({ length: numRows }, (_, i) => {
          const rh = rowHeights[i] ?? 32;
          const hasDoor = doorsCreatedLayers.includes(i);
          const hasDrawer = drawersCreatedLayers.includes(i);
          const canAddDoor = rh >= MIN_DOOR_HEIGHT;
          const canAddDrawer = depth >= MIN_DRAWER_DEPTH && height <= 150;

          return (
            <div
              key={i}
              className="rounded-lg border border-gray-200 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  Row {i + 1}
                </span>
                <span className="text-xs text-gray-400">{rh}cm</span>
              </div>

              {/* 행 높이 선택 */}
              <div className="mb-2 flex gap-1">
                {ROW_HEIGHTS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setRowHeight(i, h)}
                    className={`flex-1 rounded py-1 text-xs transition-colors ${
                      rh === h
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {h}cm
                  </button>
                ))}
              </div>

              {/* 도어/서랍 토글 */}
              <div className="flex gap-2">
                <button
                  onClick={() => canAddDoor && toggleDoor(i)}
                  disabled={!canAddDoor}
                  className={`flex-1 rounded py-1 text-xs transition-colors ${
                    hasDoor
                      ? 'bg-blue-600 text-white'
                      : canAddDoor
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'cursor-not-allowed bg-gray-50 text-gray-300'
                  }`}
                  title={!canAddDoor ? '칸 높이 32cm부터 도어 장착 가능' : ''}
                >
                  Door {hasDoor ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => canAddDrawer && toggleDrawer(i)}
                  disabled={!canAddDrawer}
                  className={`flex-1 rounded py-1 text-xs transition-colors ${
                    hasDrawer
                      ? 'bg-blue-600 text-white'
                      : canAddDrawer
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'cursor-not-allowed bg-gray-50 text-gray-300'
                  }`}
                  title={!canAddDrawer ? '깊이 40cm, 높이 150cm 이하에서 서랍 장착 가능' : ''}
                >
                  Drawer {hasDrawer ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* 경고 메시지 */}
              {!canAddDoor && rh < MIN_DOOR_HEIGHT && (
                <p className="mt-1 text-[10px] text-amber-500">
                  칸 높이 32cm부터 도어 장착 가능
                </p>
              )}
              {!canAddDrawer && (
                <p className="mt-1 text-[10px] text-amber-500">
                  {depth < MIN_DRAWER_DEPTH
                    ? '깊이 40cm부터 서랍 장착 가능'
                    : '높이 150cm 이하로 서랍 장착 가능'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
