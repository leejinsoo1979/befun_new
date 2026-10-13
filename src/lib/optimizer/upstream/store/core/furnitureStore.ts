// [Befun shim] 250709in의 배치 가구 store 대신 빈 목록을 제공한다. Befun 패널은 useCncPanelData로 들어온다.
import { create } from 'zustand';
import type { PlacedModule } from '../../editor/shared/furniture/types';

export const useFurnitureStore = create<{ placedModules: PlacedModule[] }>(() => ({ placedModules: [] }));
