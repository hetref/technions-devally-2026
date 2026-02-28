"use client";

/**
 * CANVAS RENDERER
 *
 * Elementor-style layout: Container → Columns → Components
 * Handles selection, hover states, drop zones, and flex layout.
 */

import React, { useState, useRef } from "react";
import { componentRegistry } from "../registry";
import useBuilderStore from "@/lib/stores/builderStore";
import { clsx } from "clsx";
import { Box, GripVertical, Layers } from "lucide-react";

// ── Shared UI atoms ────────────────────────────────────────────────────────

/** Small coloured label that appears when a node is selected / hovered */
function NodeLabel({ label, color = "blue", position = "top-left" }) {
  const posMap = {
    "top-left": "-top-3 left-2",
    "top-right": "-top-3 right-2",
  };
  const bgMap = {
    blue: "bg-blue-600",
    violet: "bg-violet-600",
    emerald: "bg-emerald-600",
  };
  return (
    <span
      className={clsx(
        "absolute z-20 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-white shadow-sm pointer-events-none select-none",
        posMap[position],
        bgMap[color],
      )}
    >
      {label}
    </span>
  );
}

/** Corner resize handles shown on selected nodes */
function SelectionHandles() {
  const dot =
    "absolute w-2 h-2 rounded-full bg-blue-600 border-2 border-white shadow pointer-events-none";
  return (
    <>
      <span className={clsx(dot, "-top-1 -left-1")} />
      <span className={clsx(dot, "-top-1 -right-1")} />
      <span className={clsx(dot, "-bottom-1 -left-1")} />
      <span className={clsx(dot, "-bottom-1 -right-1")} />
    </>
  );
}

// ── Root Renderer ──────────────────────────────────────────────────────────

export default function CanvasRenderer({ page, onDrop, onDragOver, lockedByOthers = {}, onNodeSelect, onCanvasBackgroundClick }) {
  const { selectedNodeId, hoveredNodeId, setSelectedNode, setHoveredNode, reorderContainers } =
    useBuilderStore();
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragRef = useRef(null);

  if (!page || !page.layout) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
        <Layers size={32} strokeWidth={1.5} />
        <span className="text-sm">No content to display</span>
      </div>
    );
  }

  const handleContainerDragStart = (e, containerId, containerIndex) => {
    e.stopPropagation();
    dragRef.current = { type: "container", containerId, containerIndex };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", containerId);
  };

  const handleContainerDragEnd = () => {
    setDragOverIndex(null);
    dragRef.current = null;
  };

  const handleDropZoneDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDropZoneDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    const drag = dragRef.current;
    if (!drag || drag.type !== "container") return;

    const fromIndex = drag.containerIndex;
    if (fromIndex !== targetIndex && fromIndex !== targetIndex - 1) {
      // Adjust target index if dragging down
      const adjustedTarget = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
      reorderContainers(fromIndex, adjustedTarget);
    }

    dragRef.current = null;
  };

  return (
    <div
      className="w-full min-h-full bg-white"
      onClick={() => {
        setSelectedNode(null);
        if (onCanvasBackgroundClick) onCanvasBackgroundClick();
      }}
    >
      {page.layout.map(
        (container, index) =>
          !container.hidden && (
            <React.Fragment key={container.id}>
              {/* Drop zone before each container */}
              <div
                onDragOver={(e) => handleDropZoneDragOver(e, index)}
                onDrop={(e) => handleDropZoneDrop(e, index)}
                onDragLeave={() => setDragOverIndex(null)}
                className={clsx(
                  "transition-all duration-200 mx-4",
                  dragOverIndex === index
                    ? "h-12 bg-violet-100 border-2 border-dashed border-violet-400 rounded-lg flex items-center justify-center"
                    : "h-1 hover:h-6 hover:bg-violet-50/50 rounded",
                )}
              >
                {dragOverIndex === index && (
                  <span className="text-xs font-medium text-violet-600">
                    Drop container here
                  </span>
                )}
              </div>

              <ContainerBlock
                container={container}
                containerIndex={index}
                isSelected={selectedNodeId === container.id}
                isHovered={hoveredNodeId === container.id}
                lockedByOthers={lockedByOthers}
                onNodeSelect={onNodeSelect}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNodeSelect) onNodeSelect(container.id);
                  else setSelectedNode(container.id);
                }}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setHoveredNode(container.id);
                }}
                onMouseLeave={() => setHoveredNode(null)}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onContainerDragStart={handleContainerDragStart}
                onContainerDragEnd={handleContainerDragEnd}
              />
            </React.Fragment>
          ),
      )}

      {/* Drop zone after last container */}
      <div
        onDragOver={(e) => handleDropZoneDragOver(e, page.layout.length)}
        onDrop={(e) => handleDropZoneDrop(e, page.layout.length)}
        onDragLeave={() => setDragOverIndex(null)}
        className={clsx(
          "transition-all duration-200 mx-4",
          dragOverIndex === page.layout.length
            ? "h-12 bg-violet-100 border-2 border-dashed border-violet-400 rounded-lg flex items-center justify-center"
            : "h-1 hover:h-6 hover:bg-violet-50/50 rounded",
        )}
      >
        {dragOverIndex === page.layout.length && (
          <span className="text-xs font-medium text-violet-600">
            Drop container here
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONTAINER
// ============================================================================

function ContainerBlock({
  container,
  containerIndex,
  isSelected,
  isHovered,
  lockedByOthers = {},
  onNodeSelect,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDrop,
  onDragOver,
  onContainerDragStart,
  onContainerDragEnd,
}) {
  const [isDragging, setIsDragging] = useState(false);

  // Check if THIS container is locked by another user
  const lockInfo = lockedByOthers[container.id];
  const isLockedByOther = !!lockInfo;
  const settings = container.settings || {};
  const styles = container.styles || {};
  const isHorizontal = settings.direction !== "vertical";
  const contentWidth = settings.contentWidth || "boxed";
  const maxWidth = settings.maxWidth || 1280;
  const gap = settings.gap ?? 16;

  const handleDragStart = (e) => {
    if (isLockedByOther) { e.preventDefault(); return; }
    e.stopPropagation();
    setIsDragging(true);
    onContainerDragStart(e, container.id, containerIndex);
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    setIsDragging(false);
    onContainerDragEnd();
  };

  return (
    <div
      draggable={!isLockedByOther}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={isLockedByOther ? (e) => e.stopPropagation() : onClick}
      onMouseEnter={isLockedByOther ? undefined : onMouseEnter}
      onMouseLeave={isLockedByOther ? undefined : onMouseLeave}
      className={clsx(
        "relative transition-all duration-200 group/container",
        isDragging && "opacity-30",
        isLockedByOther && "cursor-not-allowed",
        !isLockedByOther && isSelected &&
          "ring-2 ring-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.3)]",
        !isLockedByOther && isHovered && !isSelected && "ring-1 ring-violet-300",
      )}
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.textColor || "#1f2937",
        paddingTop: `${styles.paddingTop ?? 40}px`,
        paddingBottom: `${styles.paddingBottom ?? 40}px`,
        paddingLeft: `${styles.paddingLeft ?? 0}px`,
        paddingRight: `${styles.paddingRight ?? 0}px`,
        marginTop: `${styles.marginTop ?? 0}px`,
        marginBottom: `${styles.marginBottom ?? 0}px`,
      }}
    >
      {/* Drag Handle for Container (hidden when locked by another user) */}
      {!isLockedByOther && (
      <div className="absolute -left-10 top-4 opacity-0 group-hover/container:opacity-100 transition-opacity cursor-move z-10">
        <div className="bg-violet-500 text-white p-1.5 rounded shadow-lg">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
      </div>
      )}

      {/* Selection handles */}
      {isSelected && !isLockedByOther && <SelectionHandles />}

      {/* Label */}
      {isSelected && !isLockedByOther && (
        <NodeLabel label="Container" color="violet" position="top-left" />
      )}
      {isHovered && !isSelected && !isLockedByOther && (
        <NodeLabel label="Container" color="violet" position="top-left" />
      )}

      {/* Lock overlay — blocks all interaction when another user is editing */}
      {isLockedByOther && (
        <div
          className="absolute inset-0 z-30 cursor-not-allowed"
          style={{
            border: `2px solid ${lockInfo.color}`,
            borderRadius: 'inherit',
            backgroundColor: `${lockInfo.color}08`,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
        >
          <div
            className="absolute -top-6 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold text-white shadow-sm whitespace-nowrap"
            style={{ backgroundColor: lockInfo.color }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {lockInfo.username} is editing
          </div>
        </div>
      )}

      {/* Inner wrapper — handles content width + flex direction */}
      <div
        data-layout={isHorizontal ? "horizontal" : "vertical"}
        className={clsx(
          "flex",
          isHorizontal ? "flex-row flex-wrap" : "flex-col"
        )}
        style={{
          maxWidth: contentWidth === "boxed" ? `${maxWidth}px` : "none",
          margin: contentWidth === "boxed" ? "0 auto" : undefined,
          padding: contentWidth === "boxed" ? "0 16px" : undefined,
          gap: `${gap}px`,
          alignItems: isHorizontal
            ? settings.verticalAlign || "stretch"
            : undefined,
          pointerEvents: isLockedByOther ? "none" : undefined,
        }}
      >
        {container.columns.map((column, columnIndex) => (
          <Column
            key={column.id}
            column={column}
            columnIndex={columnIndex}
            containerId={container.id}
            isHorizontal={isHorizontal}
            isContainerSelected={isSelected}
            isContainerLockedByOther={isLockedByOther}
            lockedByOthers={lockedByOthers}
            onNodeSelect={onNodeSelect}
            onDrop={onDrop}
            onDragOver={onDragOver}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COLUMN
// ============================================================================

function Column({
  column,
  columnIndex,
  containerId,
  isHorizontal,
  isContainerSelected,
  isContainerLockedByOther = false,
  lockedByOthers = {},
  onNodeSelect,
  onDrop,
  onDragOver,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (event) => {
    setIsDragOver(false);
    if (onDrop) {
      onDrop(event, containerId, columnIndex);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
    if (onDragOver) onDragOver(event);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div
      data-column="true"
      className={clsx(
        "relative transition-all duration-200",
        isDragOver && "ring-2 ring-blue-400 ring-offset-1 rounded-lg",
        isContainerSelected && "outline-1 outline-dashed outline-violet-200",
        // Make columns full width on mobile, grid width on desktop
        isHorizontal ? "w-full md:flex-1" : "w-full",
      )}
      style={{
        minHeight: "50px",
        backgroundColor: column.styles?.backgroundColor,
        paddingTop: column.styles?.paddingTop
          ? `${column.styles.paddingTop}px`
          : undefined,
        paddingBottom: column.styles?.paddingBottom
          ? `${column.styles.paddingBottom}px`
          : undefined,
        paddingLeft: column.styles?.paddingLeft
          ? `${column.styles.paddingLeft}px`
          : undefined,
        paddingRight: column.styles?.paddingRight
          ? `${column.styles.paddingRight}px`
          : undefined,
        // Apply flex-basis for desktop to maintain column widths
        ...(isHorizontal && {
          flexBasis: `${(column.width / 12) * 100}%`,
        }),
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {column.components.length === 0 ? (
        <div
          className={clsx(
            "h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-sm transition-all duration-200",
            isDragOver
              ? "border-blue-500 bg-blue-50/80 text-blue-600 scale-[1.01] shadow-inner"
              : "border-gray-200 text-gray-300 hover:border-gray-300 hover:text-gray-400",
          )}
          style={{ minHeight: "100px" }}
        >
          {isDragOver ? (
            <>
              <Box size={18} />
              <span className="text-xs font-medium">Drop here</span>
            </>
          ) : (
            <span className="text-xl leading-none">+</span>
          )}
        </div>
      ) : (
        <div
          className={clsx(
            "relative transition-all duration-200",
            isDragOver && "bg-blue-50/60 rounded-lg p-1",
          )}
        >
          {column.components.map(
            (component) =>
              !component.hidden && (
                <ComponentRenderer
                  key={component.id}
                  component={component}
                  isContainerLockedByOther={isContainerLockedByOther}
                  lockedByOthers={lockedByOthers}
                  onNodeSelect={onNodeSelect}
                />
              ),
          )}
          {isDragOver && (
            <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none">
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg text-xs font-medium">
                Drop to add
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT RENDERER
// ============================================================================

function ComponentRenderer({ component, isContainerLockedByOther = false, lockedByOthers = {}, onNodeSelect }) {
  const { selectedNodeId, hoveredNodeId, setSelectedNode, setHoveredNode } =
    useBuilderStore();
  const [isDragging, setIsDragging] = useState(false);

  const Component = componentRegistry[component.type];

  // Check if this specific component is locked by another user
  const lockInfo = lockedByOthers[component.id];
  const isLockedByOther = isContainerLockedByOther || !!lockInfo;

  if (!Component) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
        <span className="font-medium">Unknown:</span> &quot;{component.type}
        &quot;
      </div>
    );
  }

  const isSelected = selectedNodeId === component.id;
  const isHovered = hoveredNodeId === component.id;

  const handleDragStart = (e) => {
    if (isLockedByOther) { e.preventDefault(); return; }
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("componentId", component.id);
    e.dataTransfer.setData("isExisting", "true");
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  // Determine which lock label to show (component-level takes priority)
  const activeLock = lockInfo || (isContainerLockedByOther ? null : null);

  return (
    <div
      draggable={!isLockedByOther}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={clsx(
        "group relative transition-all duration-200",
        isDragging && "opacity-50",
        isLockedByOther && "cursor-not-allowed",
        !isLockedByOther && isSelected &&
          "ring-2 ring-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.3)] rounded-sm",
        !isLockedByOther && isHovered && !isSelected && "ring-1 ring-blue-300 rounded-sm",
      )}
      onMouseEnter={(e) => {
        e.stopPropagation();
        if (!isLockedByOther) setHoveredNode(component.id);
      }}
      onMouseLeave={() => setHoveredNode(null)}
    >
      {/* Lock overlay — blocks all click/drag on this component */}
      {isLockedByOther && (
        <div
          className="absolute inset-0 z-30 cursor-not-allowed rounded-sm"
          style={{
            border: `2px solid ${(lockInfo || {}).color || '#f59e0b'}`,
            backgroundColor: `${(lockInfo || {}).color || '#f59e0b'}08`,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
        >
          {/* Show label only for direct component lock (not container inheritance) */}
          {lockInfo && (
            <div
              className="absolute -top-5 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-white shadow-sm whitespace-nowrap"
              style={{ backgroundColor: lockInfo.color }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {lockInfo.username}
            </div>
          )}
        </div>
      )}

      {/* Drag Handle - appears on hover (hidden when locked) */}
      {!isLockedByOther && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10">
          <div className="bg-blue-500 text-white p-1 rounded shadow-lg">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="5" r="1" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </div>
        </div>
      )}

      {/* Selection handles */}
      {isSelected && !isLockedByOther && <SelectionHandles />}

      {/* Label */}
      {isSelected && !isLockedByOther && (
        <NodeLabel label={component.type} color="blue" position="top-right" />
      )}
      {isHovered && !isSelected && !isLockedByOther && (
        <NodeLabel label={component.type} color="blue" position="top-right" />
      )}

      <Component
        props={component.props}
        styles={component.styles}
        isSelected={isSelected && !isLockedByOther}
        onClick={(e) => {
          e.stopPropagation();
          if (isLockedByOther) return;
          if (onNodeSelect) onNodeSelect(component.id);
          else setSelectedNode(component.id);
        }}
      />
    </div>
  );
}
