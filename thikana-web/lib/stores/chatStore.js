/**
 * CHAT STORE
 *
 * Manages AI chat state, message history, and localStorage persistence.
 * Each page has its own isolated chat history stored by pageId.
 *
 * Features:
 * - Message management (add, update, complete streaming)
 * - localStorage persistence (page-specific)
 * - Context message limiting (last 20 for AI requests)
 * - History storage limiting (last 50 messages)
 * - Streaming state management
 */

import { create } from "zustand";
import { nanoid } from "nanoid";

// ============================================================================
// LOCAL STORAGE PERSISTENCE
// ============================================================================

const STORAGE_PREFIX = "Thikana_chat_";
const MAX_STORED_MESSAGES = 50;
const CONTEXT_MESSAGE_LIMIT = 20;

/**
 * Save chat history to localStorage for a specific page
 * @param {string} pageId - The page ID
 * @param {Array} messages - Array of message objects
 */
const saveToLocalStorage = (pageId, messages) => {
  try {
    if (typeof window !== "undefined" && pageId) {
      const key = `${STORAGE_PREFIX}${pageId}`;
      // Only store last 50 messages to prevent excessive storage usage
      const messagesToStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(key, JSON.stringify(messagesToStore));
    }
  } catch (e) {
    console.warn("Failed to save chat history to localStorage:", e);
  }
};

/**
 * Load chat history from localStorage for a specific page
 * @param {string} pageId - The page ID
 * @returns {Array|null} Array of messages or null if not found
 */
const loadFromLocalStorage = (pageId) => {
  try {
    if (typeof window !== "undefined" && pageId) {
      const key = `${STORAGE_PREFIX}${pageId}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    }
  } catch (e) {
    console.warn("Failed to load chat history from localStorage:", e);
  }
  return null;
};

/**
 * Clear chat history from localStorage for a specific page
 * @param {string} pageId - The page ID
 */
const clearFromLocalStorage = (pageId) => {
  try {
    if (typeof window !== "undefined" && pageId) {
      const key = `${STORAGE_PREFIX}${pageId}`;
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn("Failed to clear chat history from localStorage:", e);
  }
};

// ============================================================================
// STORE
// ============================================================================

const useChatStore = create((set, get) => ({
  // STATE
  messages: [],
  isStreaming: false,
  currentStreamingId: null,
  currentPageId: null,

  /**
   * Add a new message to the chat history
   * @param {Object} message - Message object with role, content, etc.
   */
  addMessage: (message) => {
    const id = message.id || nanoid();
    const timestamp = message.timestamp || Date.now();
    
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id,
          timestamp,
        },
      ],
    }));

    // Auto-save to localStorage
    const { currentPageId, messages } = get();
    if (currentPageId) {
      saveToLocalStorage(currentPageId, messages);
    }
  },

  /**
   * Update a streaming message by appending new text chunks
   * @param {string} id - Message ID
   * @param {string} chunk - Text chunk to append
   */
  updateStreamingMessage: (id, text) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id
          ? { ...msg, content: text }
          : msg
      ),
    }));
  },

  /**
   * Mark a streaming message as complete
   * @param {string} id - Message ID
   * @param {Array} actions - Optional array of parsed actions
   */
  completeStreaming: (id, actions = null) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id
          ? { 
              ...msg, 
              isStreaming: false,
              ...(actions && { actions })
            }
          : msg
      ),
      isStreaming: false,
      currentStreamingId: null,
    }));

    // Save to localStorage after streaming completes
    const { currentPageId, messages } = get();
    if (currentPageId) {
      saveToLocalStorage(currentPageId, messages);
    }
  },

  /**
   * Start streaming a new message
   * @param {string} id - Message ID
   */
  startStreaming: (id) => {
    set({
      isStreaming: true,
      currentStreamingId: id,
    });
  },

  /**
   * Load chat history for a specific page from localStorage
   * @param {string} pageId - The page ID
   */
  loadHistory: (pageId) => {
    if (!pageId) return;

    const saved = loadFromLocalStorage(pageId);
    set({
      messages: saved || [],
      currentPageId: pageId,
      isStreaming: false,
      currentStreamingId: null,
    });
  },

  /**
   * Save current chat history to localStorage
   * @param {string} pageId - The page ID (optional, uses currentPageId if not provided)
   */
  saveHistory: (pageId = null) => {
    const { currentPageId, messages } = get();
    const targetPageId = pageId || currentPageId;
    
    if (targetPageId) {
      saveToLocalStorage(targetPageId, messages);
    }
  },

  /**
   * Clear chat history for the current page
   */
  clearHistory: () => {
    const { currentPageId } = get();
    
    set({
      messages: [],
      isStreaming: false,
      currentStreamingId: null,
    });

    if (currentPageId) {
      clearFromLocalStorage(currentPageId);
    }
  },

  /**
   * Get the last N messages for AI context (default: 20)
   * @param {number} limit - Number of messages to return
   * @returns {Array} Array of recent messages
   */
  getContextMessages: (limit = CONTEXT_MESSAGE_LIMIT) => {
    const { messages } = get();
    return messages.slice(-limit);
  },

  /**
   * Get all messages
   * @returns {Array} Array of all messages
   */
  getMessages: () => {
    return get().messages;
  },

  /**
   * Check if currently streaming
   * @returns {boolean}
   */
  getIsStreaming: () => {
    return get().isStreaming;
  },

  /**
   * Get current streaming message ID
   * @returns {string|null}
   */
  getCurrentStreamingId: () => {
    return get().currentStreamingId;
  },
}));

export default useChatStore;
