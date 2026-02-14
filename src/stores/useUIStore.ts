import { create } from 'zustand';

interface UIState {
  hoveredRow: number | null;
  selectedRow: number | null;
  showDimensions: boolean;
  isSharePanelOpen: boolean;
  isMobile: boolean;
  isLoading: boolean;
  isFloatingBoxHovered: boolean;
  // Floating box position (canvas-relative px)
  floatingBoxX: number;
  floatingBoxY: number;

  // Actions
  setHoveredRow: (row: number | null) => void;
  setSelectedRow: (row: number | null) => void;
  setShowDimensions: (v: boolean) => void;
  setSharePanelOpen: (v: boolean) => void;
  setIsMobile: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
  setFloatingBoxHovered: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  hoveredRow: null,
  selectedRow: null,
  showDimensions: false,
  isSharePanelOpen: false,
  isMobile: false,
  isLoading: true,
  isFloatingBoxHovered: false,
  floatingBoxX: 0,
  floatingBoxY: 0,

  setHoveredRow: (row) => set({ hoveredRow: row }),
  setSelectedRow: (row) => set({ selectedRow: row }),
  setShowDimensions: (v) => set({ showDimensions: v }),
  setSharePanelOpen: (v) => set({ isSharePanelOpen: v }),
  setIsMobile: (v) => set({ isMobile: v }),
  setIsLoading: (v) => set({ isLoading: v }),
  setFloatingBoxHovered: (v) => set({ isFloatingBoxHovered: v }),
}));
