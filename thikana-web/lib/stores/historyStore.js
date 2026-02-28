/**
 * HISTORY STORE
 *
 * Manages undo/redo functionality
 * Tracks past, present, and future states
 */

import { create } from "zustand";

const MAX_HISTORY_SIZE = 50;

const useHistoryStore = create((set, get) => ({
  // ============================================================================
  // STATE
  // ============================================================================

  past: [],
  present: null,
  future: [],
  canUndo: false,
  canRedo: false,

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  initialize: (initialState) => {
    set({
      past: [],
      present: initialState,
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },

  // ============================================================================
  // PUSH NEW STATE
  // ============================================================================

  pushState: (newState) => {
    set((state) => {
      const newPast = [...state.past, state.present];

      // Limit history size
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newState,
        future: [], // Clear future when new action is taken
        canUndo: true,
        canRedo: false,
      };
    });
  },

  // ============================================================================
  // UNDO/REDO
  // ============================================================================

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;

      const newPast = [...state.past];
      const newPresent = newPast.pop();
      const newFuture = [state.present, ...state.future];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
        canUndo: newPast.length > 0,
        canRedo: true,
      };
    });

    return get().present;
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;

      const newFuture = [...state.future];
      const newPresent = newFuture.shift();
      const newPast = [...state.past, state.present];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
      };
    });

    return get().present;
  },

  // ============================================================================
  // GETTERS
  // ============================================================================

  getPresent: () => {
    return get().present;
  },

  clear: () => {
    set({
      past: [],
      present: null,
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));

export default useHistoryStore;
