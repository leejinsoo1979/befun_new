import { create } from 'zustand';

interface UIState {
  hoveredRow: number | null;
  showDimensions: boolean;
  isSharePanelOpen: boolean;
  isMobile: boolean;
  isLoading: boolean;

  // Actions
  setHoveredRow: (row: number | null) => void;
  setShowDimensions: (v: boolean) => void;
  setSharePanelOpen: (v: boolean) => void;
  setIsMobile: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  hoveredRow: null,
  showDimensions: false,
  isSharePanelOpen: false,
  isMobile: false,
  isLoading: true,

  setHoveredRow: (row) => set({ hoveredRow: row }),
  setShowDimensions: (v) => set({ showDimensions: v }),
  setSharePanelOpen: (v) => set({ isSharePanelOpen: v }),
  setIsMobile: (v) => set({ isMobile: v }),
  setIsLoading: (v) => set({ isLoading: v }),
}));
