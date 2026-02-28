"use client";

/**
 * CANVAS AREA
 *
 * Main editing canvas with device preview, drop zones,
 * collaborative cursor tracking, and block locking.
 *
 * Cursors are tracked ONLY inside this area (not toolbar / sidebars).
 */

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import CanvasRenderer from "../canvas/CanvasRenderer";

import useBuilderStore from "@/lib/stores/builderStore";
import useUIStore from "@/lib/stores/uiStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { defaultComponentProps } from "../registry";
import { clsx } from "clsx";


export default function CanvasArea() {
  const {
    layoutJSON,
    currentPageId,
    addComponent,
    addContainer,
    getLayoutJSON,
    selectedNodeId,
    setSelectedNode,
  } = useBuilderStore();
  const siteId = useBuilderStore((s) => s.siteId);
  const { devicePreview } = useUIStore();
  const { pushState } = useHistoryStore();
  const canvasRef = useRef(null);

  // ── Global settings (colors/fonts) for the entire site ──────────────────
  const [globalFontFamily, setGlobalFontFamily] = useState('Inter, sans-serif');
  const [globalColors, setGlobalColors] = useState({});

  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;

    (async () => {
      try {
        const siteRes = await fetch(`/api/sites/${siteId}`);
        if (!siteRes.ok || cancelled) return;
        const { site } = await siteRes.json();
        const gs = site?.globalSettings || {};

        let effectiveFonts = { heading: 'Poppins', body: 'Inter' };
        let effectiveColors = { primary: '#3B82F6', secondary: '#8B5CF6', tertiary: '#EC4899' };

        // Try to fetch brand kit if in brandkit mode
        if (gs.fontMode !== 'custom' || gs.colorMode !== 'custom') {
          try {
            const bkRes = await fetch(`/api/tenants/${site.tenantId}/brand-kit`);
            if (bkRes.ok && !cancelled) {
              const bk = await bkRes.json();
              if (gs.fontMode !== 'custom' && bk.brandKit?.fonts) {
                effectiveFonts = bk.brandKit.fonts;
              }
              if (gs.colorMode !== 'custom' && bk.brandKit?.colors) {
                effectiveColors = bk.brandKit.colors;
              }
            }
          } catch (e) { /* ignore */ }
        }

        if (gs.fontMode === 'custom' && gs.globalFonts) effectiveFonts = gs.globalFonts;
        if (gs.colorMode === 'custom' && gs.globalColors) effectiveColors = gs.globalColors;

        if (!cancelled) {
          setGlobalFontFamily(`${effectiveFonts.body}, sans-serif`);
          setGlobalColors(effectiveColors);

          // Load Google Fonts
          [effectiveFonts.heading, effectiveFonts.body].forEach(font => {
            if (!font) return;
            const existingLink = document.querySelector(`link[href*="${font.replace(/\s+/g, '+')}"]`);
            if (existingLink) return;
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          });
        }
      } catch (e) { /* ignore */ }
    })();

    return () => { cancelled = true; };
  }, [siteId]);

  // Multiplayer removed
  const updatePresence = () => {};
  const others = [];

  const handlePointerMove = useCallback((e) => {}, []);
  const handlePointerLeave = useCallback(() => {}, []);

  // ── Broadcast which node the local user has selected / is editing ───────
  const handleNodeSelect = useCallback(
    (nodeId) => {
      setSelectedNode(nodeId);
      updatePresence({
        selectedBlockId: nodeId,
        lockedBlockId: nodeId,
      });
    },
    [setSelectedNode, updatePresence]
  );

  const handleCanvasBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    updatePresence({
      selectedBlockId: null,
      lockedBlockId: null,
    });
  }, [setSelectedNode, updatePresence]);

  // Lock states removed
  const lockedByOthers = {};

  // Get current page from layoutJSON and currentPageId
  const currentPage = layoutJSON?.pages?.find((p) => p.id === currentPageId);

  const handleDrop = (event, containerId, columnIndex) => {
    event.preventDefault();
    event.stopPropagation();

    const componentType = event.dataTransfer.getData("componentType");
    const componentId = event.dataTransfer.getData("componentId");
    const isExisting = event.dataTransfer.getData("isExisting") === "true";

    // Save state before modification
    pushState(getLayoutJSON());

    if (isExisting && componentId) {
      // Moving an existing component
      const { moveComponent } = useBuilderStore.getState();
      moveComponent(componentId, containerId, columnIndex);
    } else if (componentType) {
      // Adding a new component from sidebar
      const props = defaultComponentProps[componentType] || {};
      addComponent(containerId, columnIndex, componentType, props);
    }
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
      <div className="flex-1 flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center">
          <div className="text-gray-300 text-lg mb-2 font-black uppercase tracking-widest">No page available</div>
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            The builder is initializing...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      data-lenis-prevent
      className="flex-1 bg-[#fcfdfc] overflow-auto relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="absolute inset-0 bg-[#fefefe] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-60 -z-10" />



      <div className="min-h-full flex items-start justify-center p-6 pl-20 relative z-10">
        <div
          className="builder-canvas bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] border border-gray-100 transition-all duration-300 overflow-hidden my-4"
          data-device={devicePreview}
          style={{
            width: getCanvasWidth(),
            minHeight: "100vh",
            fontFamily: globalFontFamily,
            '--global-primary': globalColors.primary || '#3B82F6',
            '--global-secondary': globalColors.secondary || '#8B5CF6',
            '--global-tertiary': globalColors.tertiary || '#EC4899',
          }}
        >
          <CanvasWithDropZones
            page={currentPage}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            lockedByOthers={lockedByOthers}
            onNodeSelect={handleNodeSelect}
            onCanvasBackgroundClick={handleCanvasBackgroundClick}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CANVAS WITH DROP ZONES
// ============================================================================

function CanvasWithDropZones({ page, onDrop, onDragOver, lockedByOthers, onNodeSelect, onCanvasBackgroundClick }) {
  return (
    <div className="relative">
      <CanvasRenderer
        page={page}
        onDrop={onDrop}
        onDragOver={onDragOver}
        lockedByOthers={lockedByOthers}
        onNodeSelect={onNodeSelect}
        onCanvasBackgroundClick={onCanvasBackgroundClick}
      />
    </div>
  );
}
