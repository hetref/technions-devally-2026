/**
 * UI STORE
 *
 * Manages UI state (sidebars, device preview, panels)
 */

import { create } from "zustand";

const useUIStore = create((set) => ({
  // ============================================================================
  // STATE
  // ============================================================================

  devicePreview: "desktop",
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  activeLeftTab: "elements", // 'elements' | 'layers'
  activeRightTab: "properties", // 'properties' | 'styles'

  // ============================================================================
  // ACTIONS
  // ============================================================================

  setDevicePreview: (device) => {
    set({ devicePreview: device });
  },

  toggleLeftSidebar: () => {
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen }));
  },

  toggleRightSidebar: () => {
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen }));
  },

  setLeftSidebarOpen: (open) => {
    set({ leftSidebarOpen: open });
  },

  setRightSidebarOpen: (open) => {
    set({ rightSidebarOpen: open });
  },

  setActiveLeftTab: (tab) => {
    set({ activeLeftTab: tab });
  },

  setActiveRightTab: (tab) => {
    set({ activeRightTab: tab });
  },
}));

export default useUIStore;
