/**
 * BUILDER STORE
 *
 * Elementor-style layout system:
 *   Page → Container → Columns → Components (widgets)
 *
 * Containers are the outer wrapper (direction, content width, gap).
 * Columns live inside containers (adjustable widths).
 * Components/widgets live inside columns.
 *
 * Includes localStorage persistence.
 */

import { create } from "zustand";
import { nanoid } from "nanoid";
import { produce } from "immer";

// ============================================================================
// LOCAL STORAGE PERSISTENCE (v2 key to invalidate old section-based data)
// ============================================================================

const STORAGE_KEY = "Thikana_builder_v2";                                                         

const saveToLocalStorage = (layoutJSON) => {
  try {
    if (typeof window !== "undefined" && layoutJSON) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutJSON));
    }
  } catch (e) {
    console.warn("Failed to save to localStorage:", e);
  }
};

const loadFromLocalStorage = () => {
  try {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    }
  } catch (e) {
    console.warn("Failed to load from localStorage:", e);
  }
  return null;
};

export const clearSavedState = () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      // Also clear old v1 key
      localStorage.removeItem("Thikana_builder_state");
    }
  } catch (e) {
    console.warn("Failed to clear localStorage:", e);
  }
};

// ============================================================================
// STORE
// ============================================================================

const useBuilderStore = create((set, get) => ({
  // STATE
  layoutJSON: null,
  selectedNodeId: null,
  hoveredNodeId: null,
  currentPageId: null,

  // DB-backed identifiers (null while in demo/localStorage mode)
  siteId: null,
  pageId: null,
  theme: null,

  // UNDO/REDO STATE
  undoStack: [],
  redoStack: [],

  // INITIALIZATION  (demo / localStorage fallback — keeps backward compat)
  initializeBuilder: (layoutJSON) => {
    const saved = loadFromLocalStorage();
    const dataToUse = saved || layoutJSON;
    set({
      layoutJSON: dataToUse,
      currentPageId: dataToUse.pages[0]?.id || null,
      selectedNodeId: null,
      hoveredNodeId: null,
      siteId: null,
      pageId: null,
      theme: dataToUse.theme || null,
    });
  },

  // INITIALIZATION  (DB-backed — called from the builder page after API fetch)
  initializeFromAPI: ({ siteId, pageId, theme, page }) => {
    // Wrap the per-page layout in the monolithic shape so all existing ops work
    const layoutJSON = {
      site: { id: siteId, name: page.name },
      theme: theme || {},
      pages: [
        {
          id: pageId,
          name: page.name,
          slug: page.slug,
          seo: page.seo || {},
          layout: page.layout || [],
        },
      ],
    };
    set({
      siteId,
      pageId,
      theme,
      layoutJSON,
      currentPageId: pageId,
      selectedNodeId: null,
      hoveredNodeId: null,
    });
  },

  // Returns only the containers array for the current page (for DB save)
  getPageLayout: () => {
    const { layoutJSON, currentPageId } = get();
    return layoutJSON?.pages?.find((p) => p.id === currentPageId)?.layout || [];
  },

  // SELECTION
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),
  clearSelection: () => set({ selectedNodeId: null }),

  // THEME
  updateTheme: (themeUpdates) => {
    set(
      produce((state) => {
        state.theme = { ...(state.theme || {}), ...themeUpdates };
        if (state.layoutJSON) {
          state.layoutJSON.theme = state.theme;
        }
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  // Replace full theme (used when importing a preset)
  importTheme: (newTheme) => {
    set(
      produce((state) => {
        state.theme = { ...newTheme };
        if (state.layoutJSON) {
          state.layoutJSON.theme = state.theme;
        }
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  // TEMPLATE IMPORT
  // Replaces the current page layout with the template's containers (re-keyed)
  importTemplate: (templateLayout) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;

        // Deep-clone and assign fresh IDs so each import is unique
        const rekey = (layout) =>
          layout.map((container) => ({
            ...container,
            id: nanoid(),
            columns: container.columns.map((col) => ({
              ...col,
              id: nanoid(),
              components: col.components.map((comp) => ({
                ...comp,
                id: nanoid(),
              })),
            })),
          }));

        page.layout = rekey(JSON.parse(JSON.stringify(templateLayout)));
        state.selectedNodeId = null;
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  // PAGE
  setCurrentPage: (pageId) => set({ currentPageId: pageId }),
  getCurrentPage: () => {
    const { layoutJSON, currentPageId } = get();
    return layoutJSON?.pages.find((p) => p.id === currentPageId);
  },

  // ============================================================================
  // CONTAINER OPERATIONS
  // ============================================================================

  /**
   * Add a new container with the given column widths.
   * @param {number[]} columnWidths - Array of column widths (out of 12), e.g. [6,6] or [4,4,4]
   */
  addContainer: (columnWidths = [12]) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;

        page.layout.push({
          id: nanoid(),
          type: "container",
          settings: {
            direction: "horizontal",
            contentWidth: "boxed",
            maxWidth: 1280,
            gap: 16,
            verticalAlign: "stretch",
          },
          styles: {
            paddingTop: 40,
            paddingBottom: 40,
            paddingLeft: 0,
            paddingRight: 0,
            marginTop: 0,
            marginBottom: 0,
          },
          columns: columnWidths.map((w) => ({
            id: nanoid(),
            width: w,
            styles: {},
            components: [],
          })),
        });
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  deleteContainer: (containerId) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        page.layout = page.layout.filter((c) => c.id !== containerId);
        if (state.selectedNodeId === containerId) state.selectedNodeId = null;
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  duplicateContainer: (containerId) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const idx = page.layout.findIndex((c) => c.id === containerId);
        if (idx === -1) return;
        const dup = JSON.parse(JSON.stringify(page.layout[idx]));
        // Give new IDs to everything
        dup.id = nanoid();
        dup.columns.forEach((col) => {
          col.id = nanoid();
          col.components.forEach((comp) => {
            comp.id = nanoid();
          });
        });
        page.layout.splice(idx + 1, 0, dup);
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  updateContainerSettings: (containerId, settings) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const container = page.layout.find((c) => c.id === containerId);
        if (container) {
          container.settings = { ...container.settings, ...settings };
        }
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  updateContainerStyles: (containerId, styles) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const container = page.layout.find((c) => c.id === containerId);
        if (container) {
          container.styles = { ...container.styles, ...styles };
        }
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  reorderContainers: (startIndex, endIndex) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const [removed] = page.layout.splice(startIndex, 1);
        page.layout.splice(endIndex, 0, removed);
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  // ============================================================================
  // COLUMN OPERATIONS
  // ============================================================================

  addColumnToContainer: (containerId) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const container = page.layout.find((c) => c.id === containerId);
        if (!container) return;

        const numCols = container.columns.length + 1;
        const newWidth = Math.floor(12 / numCols);
        container.columns.forEach((col) => {
          col.width = newWidth;
        });
        container.columns.push({
          id: nanoid(),
          width: newWidth,
          styles: {},
          components: [],
        });
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  removeColumnFromContainer: (containerId, columnIndex) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const container = page.layout.find((c) => c.id === containerId);
        if (!container || container.columns.length <= 1) return;

        container.columns.splice(columnIndex, 1);
        const numCols = container.columns.length;
        const newWidth = Math.floor(12 / numCols);
        container.columns.forEach((col) => {
          col.width = newWidth;
        });
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  updateColumnWidth: (containerId, columnIndex, width) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const container = page.layout.find((c) => c.id === containerId);
        if (!container || !container.columns[columnIndex]) return;
        container.columns[columnIndex].width = width;
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  // ============================================================================
  // COMPONENT (WIDGET) OPERATIONS
  // ============================================================================

  /**
   * Add a component/widget to a column.
   * @param {string} containerId
   * @param {number} columnIndex
   * @param {string} componentType
   * @param {object} props
   */
  addComponent: (containerId, columnIndex, componentType, props = {}) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const container = page.layout.find((c) => c.id === containerId);
        if (!container || !container.columns[columnIndex]) return;

        container.columns[columnIndex].components.push({
          id: nanoid(),
          type: componentType,
          props,
          styles: {},
        });
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  deleteComponent: (componentId) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;

        for (const container of page.layout) {
          for (const column of container.columns) {
            column.components = column.components.filter(
              (c) => c.id !== componentId,
            );
          }
        }
        if (state.selectedNodeId === componentId) state.selectedNodeId = null;
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  updateComponentProps: (componentId, props) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;

        for (const container of page.layout) {
          for (const column of container.columns) {
            const comp = column.components.find((c) => c.id === componentId);
            if (comp) {
              comp.props = { ...comp.props, ...props };
              return;
            }
          }
        }
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  updateComponentStyles: (componentId, styles) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;

        for (const container of page.layout) {
          for (const column of container.columns) {
            const comp = column.components.find((c) => c.id === componentId);
            if (comp) {
              comp.styles = { ...comp.styles, ...styles };
              return;
            }
          }
        }
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  duplicateComponent: (componentId) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;

        for (const container of page.layout) {
          for (const column of container.columns) {
            const idx = column.components.findIndex(
              (c) => c.id === componentId,
            );
            if (idx !== -1) {
              const dup = {
                ...JSON.parse(JSON.stringify(column.components[idx])),
                id: nanoid(),
              };
              column.components.splice(idx + 1, 0, dup);
              return;
            }
          }
        }
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  // ============================================================================
  // HELPERS
  // ============================================================================

  getSelectedNode: () => {
    const { layoutJSON, selectedNodeId, currentPageId } = get();
    if (!selectedNodeId || !layoutJSON) return null;

    const page = layoutJSON.pages.find((p) => p.id === currentPageId);
    if (!page) return null;

    for (const container of page.layout) {
      if (container.id === selectedNodeId) return container;
      for (const column of container.columns) {
        for (const component of column.components) {
          if (component.id === selectedNodeId) return component;
        }
      }
    }
    return null;
  },

  getLayoutJSON: () => get().layoutJSON,

  updateLayoutJSON: (layoutJSON, persist = true) => {
    if (!layoutJSON) {
      // Clearing state (e.g., on unmount)
      set({ layoutJSON: null, currentPageId: null, selectedNodeId: null, hoveredNodeId: null });
      return;
    }
    const currentPageId = get().currentPageId;
    // If pages exists and currentPageId is null or not found in pages, reset it
    const pages = layoutJSON?.pages;
    let newCurrentPageId = currentPageId;
    if (pages && pages.length > 0) {
      const pageExists = pages.find((p) => p.id === currentPageId);
      if (!pageExists) {
        newCurrentPageId = pages[0].id;
      }
    }
    set({ layoutJSON, currentPageId: newCurrentPageId, selectedNodeId: null, hoveredNodeId: null });
    if (persist) {
      saveToLocalStorage(layoutJSON);
    }
  },

  // ============================================================================
  // TREE/LAYER OPERATIONS — move, reorder, rename components
  // ============================================================================

  /**
   * Move a component from one column to another.
   */
  moveComponent: (
    componentId,
    targetContainerId,
    targetColumnIndex,
    targetIndex,
  ) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;

        // Find and remove the component from its current location
        let removed = null;
        for (const container of page.layout) {
          for (const column of container.columns) {
            const idx = column.components.findIndex(
              (c) => c.id === componentId,
            );
            if (idx !== -1) {
              [removed] = column.components.splice(idx, 1);
              break;
            }
          }
          if (removed) break;
        }
        if (!removed) return;

        // Insert into target
        const targetContainer = page.layout.find(
          (c) => c.id === targetContainerId,
        );
        if (!targetContainer || !targetContainer.columns[targetColumnIndex])
          return;
        const targetCol = targetContainer.columns[targetColumnIndex];
        const insertIdx =
          targetIndex != null
            ? Math.min(targetIndex, targetCol.components.length)
            : targetCol.components.length;
        targetCol.components.splice(insertIdx, 0, removed);
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  /**
   * Reorder a component within the same column.
   */
  reorderComponent: (containerId, columnIndex, fromIndex, toIndex) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const container = page.layout.find((c) => c.id === containerId);
        if (!container || !container.columns[columnIndex]) return;
        const comps = container.columns[columnIndex].components;
        const [moved] = comps.splice(fromIndex, 1);
        comps.splice(toIndex, 0, moved);
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  /**
   * Rename a container (store display name).
   */
  renameContainer: (containerId, name) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const container = page.layout.find((c) => c.id === containerId);
        if (container) container.name = name;
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  /**
   * Toggle container visibility (for layers panel).
   */
  toggleContainerVisibility: (containerId) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        const container = page.layout.find((c) => c.id === containerId);
        if (container) container.hidden = !container.hidden;
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  /**
   * Toggle component visibility.
   */
  toggleComponentVisibility: (componentId) => {
    set(
      produce((state) => {
        const page = state.layoutJSON.pages.find(
          (p) => p.id === state.currentPageId,
        );
        if (!page) return;
        for (const container of page.layout) {
          for (const column of container.columns) {
            const comp = column.components.find((c) => c.id === componentId);
            if (comp) {
              comp.hidden = !comp.hidden;
              return;
            }
          }
        }
      }),
    );
    saveToLocalStorage(get().layoutJSON);
  },

  // ============================================================================
  // UNDO/REDO OPERATIONS
  // ============================================================================

  /**
   * Create an undo snapshot of the current layout state
   * @param {Object} snapshot - Optional snapshot to store (defaults to current state)
   */
  createUndoSnapshot: (snapshot = null) => {
    const snapshotToStore = snapshot || get().layoutJSON;
    
    if (!snapshotToStore) return;

    set((state) => {
      const newUndoStack = [...state.undoStack, snapshotToStore];
      
      // Limit undo stack to 20 snapshots
      if (newUndoStack.length > 20) {
        newUndoStack.shift();
      }

      return {
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack when new action is performed
      };
    });
  },

  /**
   * Perform undo operation - restore previous state
   * @returns {boolean} True if undo was performed, false if nothing to undo
   */
  performUndo: () => {
    const { undoStack, layoutJSON } = get();

    if (undoStack.length === 0) {
      return false;
    }

    // Get the last snapshot
    const previousState = undoStack[undoStack.length - 1];
    
    // Store current state in redo stack
    set((state) => ({
      layoutJSON: previousState,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, layoutJSON],
      selectedNodeId: null,
      hoveredNodeId: null,
    }));

    saveToLocalStorage(previousState);
    return true;
  },

  /**
   * Perform redo operation - restore next state
   * @returns {boolean} True if redo was performed, false if nothing to redo
   */
  performRedo: () => {
    const { redoStack, layoutJSON } = get();

    if (redoStack.length === 0) {
      return false;
    }

    // Get the last redo state
    const nextState = redoStack[redoStack.length - 1];
    
    // Store current state in undo stack
    set((state) => ({
      layoutJSON: nextState,
      undoStack: [...state.undoStack, layoutJSON],
      redoStack: state.redoStack.slice(0, -1),
      selectedNodeId: null,
      hoveredNodeId: null,
    }));

    saveToLocalStorage(nextState);
    return true;
  },

  /**
   * Check if undo is available
   * @returns {boolean} True if undo stack has items
   */
  canUndo: () => {
    return get().undoStack.length > 0;
  },

  /**
   * Check if redo is available
   * @returns {boolean} True if redo stack has items
   */
  canRedo: () => {
    return get().redoStack.length > 0;
  },

  /**
   * Clear undo/redo stacks
   */
  clearUndoHistory: () => {
    set({
      undoStack: [],
      redoStack: [],
    });
  },
}));

export default useBuilderStore;
