"use client";

/**
 * PREVIEW RENDERER
 *
 * Read-only renderer for the page layout. Renders the same Container → Column → Component
 * hierarchy as CanvasRenderer but without any editing UI (no drag/drop, selection, hover,
 * lock overlays, handles, labels).
 */

import React from "react";
import { componentRegistry } from "../registry";
import { clsx } from "clsx";

// ── Root ───────────────────────────────────────────────────────────────────────

export default function PreviewRenderer({ page, theme }) {
  if (!page || !page.layout || page.layout.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-gray-400 gap-3">
        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
        </svg>
        <p className="text-base font-medium">This page has no content yet.</p>
        <p className="text-sm">Go back to the builder and add some sections.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-white">
      {page.layout.map(
        (container) =>
          !container.hidden && (
            <ContainerBlock key={container.id} container={container} />
          ),
      )}
    </div>
  );
}

// ── Container ──────────────────────────────────────────────────────────────────

function ContainerBlock({ container }) {
  const settings = container.settings || {};
  const styles = container.styles || {};
  const isHorizontal = settings.direction !== "vertical";
  const contentWidth = settings.contentWidth || "boxed";
  const maxWidth = settings.maxWidth || 1280;
  const gap = settings.gap ?? 16;

  return (
    <div
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
      <div
        className={clsx("flex", isHorizontal ? "flex-row flex-wrap" : "flex-col")}
        style={{
          maxWidth: contentWidth === "boxed" ? `${maxWidth}px` : "none",
          margin: contentWidth === "boxed" ? "0 auto" : undefined,
          padding: contentWidth === "boxed" ? "0 16px" : undefined,
          gap: `${gap}px`,
          alignItems: isHorizontal ? settings.verticalAlign || "stretch" : undefined,
        }}
      >
        {container.columns.map((column) => (
          <ColumnBlock key={column.id} column={column} isHorizontal={isHorizontal} />
        ))}
      </div>
    </div>
  );
}

// ── Column ─────────────────────────────────────────────────────────────────────

function ColumnBlock({ column, isHorizontal }) {
  return (
    <div
      className={clsx(isHorizontal ? "w-full md:flex-1" : "w-full")}
      style={{
        backgroundColor: column.styles?.backgroundColor,
        paddingTop: column.styles?.paddingTop ? `${column.styles.paddingTop}px` : undefined,
        paddingBottom: column.styles?.paddingBottom ? `${column.styles.paddingBottom}px` : undefined,
        paddingLeft: column.styles?.paddingLeft ? `${column.styles.paddingLeft}px` : undefined,
        paddingRight: column.styles?.paddingRight ? `${column.styles.paddingRight}px` : undefined,
        ...(isHorizontal && { flexBasis: `${(column.width / 12) * 100}%` }),
      }}
    >
      {column.components.map(
        (component) =>
          !component.hidden && (
            <ComponentBlock key={component.id} component={component} />
          ),
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

function ComponentBlock({ component }) {
  const Component = componentRegistry[component.type];

  if (!Component) {
    return null; // silently skip unknown types in preview
  }

  return (
    <Component
      props={component.props}
      styles={component.styles}
      isSelected={false}
      onClick={() => {}} // noop
    />
  );
}
