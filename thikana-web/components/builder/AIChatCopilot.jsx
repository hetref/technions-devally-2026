"use client";

/**
 * AI CHAT COPILOT
 *
 * Conversational AI assistant for the website builder.
 * Features:
 * - Floating panel UI (400px width, max 600px height)
 * - Real-time streaming responses
 * - Chat history persistence per page
 * - Collapse/expand functionality
 * - Auto-scroll to latest messages
 * - Keyboard shortcuts (Enter to send, Escape to close)
 */

import { useState, useEffect, useRef } from "react";
import { X, Minimize2, Maximize2, Send, Lightbulb, Sparkles, Loader2, AlertCircle, TrendingUp, Zap, MessageSquare } from "lucide-react";
import useChatStore from "@/lib/stores/chatStore";
import useBuilderStore from "@/lib/stores/builderStore";
import { parseAIResponse, isUndoCommand } from "@/lib/ai/commandParser";
import { executeActions } from "@/lib/ai/actionExecutor";
import { nanoid } from 'nanoid';

export default function AIChatCopilot({ tenantId, siteId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' or 'suggestions'
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Store hooks
  const {
    messages,
    isStreaming,
    currentStreamingId,
    addMessage,
    updateStreamingMessage,
    completeStreaming,
    startStreaming,
    loadHistory,
    getContextMessages,
  } = useChatStore();

  const builderStore = useBuilderStore();
  const { pageId, selectedNodeId } = builderStore;

  // Load chat history when page changes
  useEffect(() => {
    if (pageId) {
      loadHistory(pageId);
    }
  }, [pageId, loadHistory]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Focus input when panel opens to chat tab
  useEffect(() => {
    if (isOpen && !isCollapsed && activeTab === "chat" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isCollapsed, activeTab]);

  // Auto-analyze for suggestions when open and on suggestions tab
  useEffect(() => {
    if (isOpen && activeTab === "suggestions" && !lastAnalyzed) {
      analyzePage();
    }
  }, [isOpen, activeTab, lastAnalyzed]);

  async function analyzePage() {
    if (analyzing) return;
    try {
      setAnalyzing(true);
      
      let brandKit = null;
      try {
        const brandRes = await fetch(`/api/tenants/${tenantId}/brand-kit`);
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          brandKit = brandData.brandKit;
        }
      } catch (e) {
        console.warn('Could not fetch brand kit:', e);
      }

      let siteInfo = null;
      try {
        const siteRes = await fetch(`/api/sites/${siteId}`);
        if (siteRes.ok) {
          const siteData = await siteRes.json();
          siteInfo = { name: siteData.site?.name || 'Your Site' };
        }
      } catch (e) {
        console.warn('Could not fetch site info:', e);
      }

      const res = await fetch('/api/ai/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutJSON: builderStore.getLayoutJSON(), brandKit, siteInfo }),
      });

      if (!res.ok) throw new Error(`Analysis failed`);
      const data = await res.json();
      
      const validComponentTypes = ['Hero', 'CTA', 'Features', 'FormEmbed', 'Text', 'Heading', 'Image', 'Button', 'Gallery', 'Video', 'Navbar', 'Footer'];
      const validSuggestions = (data.suggestions || []).filter(s => {
        if (s.action?.type === 'add_component') return validComponentTypes.includes(s.action.componentType);
        return true;
      });
      
      setSuggestions(validSuggestions);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Error analyzing page:', error);
    } finally {
      setAnalyzing(false);
    }
  }

  async function applySuggestion(suggestion) {
    if (applyingId) return;
    try {
      setApplyingId(suggestion.id);
      const action = suggestion.action;
      let result = null;
      
      if (action.type === 'add_component') {
         result = await executeActions([{
             type: 'ADD_COMPONENT',
             payload: {
                 componentType: action.componentType,
                 position: action.position || 'bottom',
                 props: action.props || {},
                 styles: action.styles || {},
             }
         }], builderStore);
      } else if (action.type === 'improve_component' || action.type === 'reorder') {
        // For non-add actions, just remove the suggestion as advisory
        result = { successCount: 1 };
      }
      
      // Only remove if the action actually succeeded
      if (result && result.successCount > 0) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      } else {
        console.warn('Suggestion action failed:', result);
        alert('Could not apply this suggestion. Please try again.');
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      alert('Failed to apply suggestion. Please try again.');
    } finally {
      setApplyingId(null);
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    try {
      // Check for undo command
      if (isUndoCommand(userMessage)) {
        handleUndoCommand();
        return;
      }

      // Add user message to chat
      addMessage({
        role: "user",
        content: userMessage,
      });

      // Build context for AI request
      const context = buildContext();

      // Send to AI API with streaming
      await sendChatMessage(userMessage, context);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      addMessage({
        role: "assistant",
        content: "I'm having trouble connecting. Please check your internet and try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleUndoCommand = () => {
    const success = builderStore.performUndo();
    
    const responseText = success
      ? "I've undone the last change. Your page has been restored to its previous state."
      : "There's nothing to undo right now.";

    addMessage({
      role: "assistant",
      content: responseText,
    });

    setIsSending(false);
  };

  const buildContext = () => {
    const layoutJSON = builderStore.getLayoutJSON();
    const chatHistory = getContextMessages(20);

    return {
      layoutJSON,
      brandKit: null, // Will be fetched from API in next task
      chatHistory: chatHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      selectedComponentId: selectedNodeId,
      pageId,
    };
  };

  const sendChatMessage = async (message, context) => {
    // Create AI message placeholder for streaming
    const aiMessageId = `ai-${Date.now()}`;
    addMessage({
      id: aiMessageId,
      role: "assistant",
      content: "",
      isStreaming: true,
    });

    startStreaming(aiMessageId);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        
        // Clean JSON blocks out of what we show to the user during streaming
        const displayChunk = fullResponse.replace(/```json\s*\n[\s\S]*?(?:\n```|$)/g, "").trim();
        updateStreamingMessage(aiMessageId, displayChunk || "Thinking...");
      }

      // Parse complete response for actions
      const parsed = parseAIResponse(fullResponse);
      
      // Use parsed text or the streamed display text
      const displayText = fullResponse.replace(/```json\s*\n[\s\S]*?(?:\n```|$)/g, "").trim();
      const finalText = displayText || parsed.text || "Done!";
      
      updateStreamingMessage(aiMessageId, finalText);
      
      // Complete streaming
      completeStreaming(aiMessageId, parsed.actions);

      // Execute actions if any
      if (parsed.actions && parsed.actions.length > 0) {
        const result = await executeActions(parsed.actions, builderStore);
        
        // Log execution results
        console.log("Action execution result:", result);
        
        // If there were failures, add a follow-up message
        if (result.failureCount > 0) {
          const failedActions = result.results
            .filter((r) => !r.success)
            .map((r) => r.errors.join(", "))
            .join("; ");
          
          addMessage({
            role: "assistant",
            content: `Note: Some actions couldn't be completed: ${failedActions}`,
          });
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      
      // Update message with error
      completeStreaming(aiMessageId);
      addMessage({
        role: "assistant",
        content: "I encountered an error processing your request. Please try again.",
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEscape = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all font-bold text-sm uppercase tracking-wider group"
        aria-label="Open SitePilot Assistant"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span>SitePilot Assistant</span>
      </button>
    );
  }

  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border border-purple-200 z-50 w-80">
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
          <div className="flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-purple-600" />
             <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">SitePilot Assistant</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Expand chat"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 w-[400px] max-h-[600px] h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-purple-200 flex flex-col z-50 overflow-hidden"
      role="complementary"
      aria-label="SitePilot Assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
             <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">SitePilot Assistant</h3>
            <p className="text-xs text-gray-500 font-medium">Build faster with AI</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Minimize chat"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === "chat" ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === "suggestions" ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Suggestions
          {suggestions.length > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-700 rounded-full text-[10px] ml-1">
                  {suggestions.length}
              </span>
          )}
        </button>
      </div>

      {activeTab === "chat" ? (
      <>
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Hi! I'm your AI assistant.</p>
            <p className="mt-1">Ask me to add components, change styles, or modify your page.</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={message.id === currentStreamingId}
          />
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            maxLength={1000}
            disabled={isSending || isStreaming}
            aria-label="Type your message"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || isStreaming}
            className="self-end bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-500 text-right">
          {inputValue.length}/1000
        </div>
      </div>
      </>
      ) : (
      /* Suggestions Tab */
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
          {analyzing ? (
            <div className="p-8 text-center h-full flex flex-col justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-700">Analyzing your page...</p>
              <p className="text-xs text-gray-500 mt-1">This will take a few seconds</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-8 text-center h-full flex flex-col justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-black text-gray-900 mb-2">Looking Great!</h4>
              <p className="text-sm text-gray-600 mb-4">
                Your page is well-structured. Keep building!
              </p>
              <button
                onClick={analyzePage}
                disabled={analyzing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-bold inline-flex items-center justify-center"
              >
                Re-analyze Page
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-xl border-2 ${getPriorityColor(
                    suggestion.priority
                  )} transition-all hover:shadow-md bg-white`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getPriorityIcon(suggestion.priority)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 mb-1">
                        {suggestion.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                        {suggestion.description}
                      </p>
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        disabled={applyingId !== null}
                        className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {applyingId === suggestion.id ? (
                           <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Applying...
                           </>
                        ) : (
                          'Apply Suggestion'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 pb-2">
                 <button
                    onClick={analyzePage}
                    disabled={analyzing}
                    className="w-full px-3 py-2 text-xs font-bold text-purple-600 border border-purple-200 hover:bg-purple-50 rounded-lg transition-colors uppercase tracking-wider"
                 >
                    Re-analyze Page
                 </button>
              </div>
            </div>
          )}
      </div>
      )}
    </div>
  );
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={`${message.role} message`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap wrap-break-word">
          {message.content}
        </p>
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}
