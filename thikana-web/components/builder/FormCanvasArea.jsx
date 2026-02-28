"use client";

/**
 * FORM CANVAS AREA
 *
 * Main form editing canvas that mirrors the site builder canvas.
 * Uses the same CanvasRenderer as the site builder, supports all components,
 * with device preview and drop zones. Form-themed accent colors.
 */

import CanvasRenderer from "../canvas/CanvasRenderer";
import useBuilderStore from "@/lib/stores/builderStore";
import useUIStore from "@/lib/stores/uiStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { defaultComponentProps } from "../registry";
import { clsx } from "clsx";

export default function FormCanvasArea() {
  const {
    layoutJSON,
    currentPageId,
    addComponent,
    getLayoutJSON,
  } = useBuilderStore();
  const { devicePreview } = useUIStore();
  const { pushState } = useHistoryStore();

  // Get current page from layoutJSON and currentPageId
  const currentPage = layoutJSON?.pages?.find((p) => p.id === currentPageId);

  const handleDrop = (event, containerId, columnIndex) => {
    event.preventDefault();
    event.stopPropagation();

    const componentType = event.dataTransfer.getData("componentType");
    if (!componentType) return;

    const props = defaultComponentProps[componentType] || {};

    // Save state before modification
    pushState(getLayoutJSON());

    addComponent(containerId, columnIndex, componentType, props);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const getCanvasWidth = () => {
    switch (devicePreview) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      case "desktop":
      default:
        return "100%";
    }
  };

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <div className="text-gray-400 text-lg mb-2">Loading form canvas...</div>
          <div className="text-gray-500 text-sm">
            The form builder is initializing...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F1F5F9] canvas-grid overflow-auto">
      <div className="min-h-full flex items-start justify-center p-6">
        <div
          className="bg-white shadow-xl rounded-lg transition-all duration-300 overflow-hidden"
          style={{
            width: getCanvasWidth(),
            minHeight: "100vh",
          }}
        >
          <div className="relative">
            <CanvasRenderer
              page={currentPage}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
