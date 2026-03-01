"use client";

/**
 * TEMPLATE SECTION
 *
 * Shows importable page templates in the LeftSidebar "Templates" tab.
 * Users can preview and import a full page layout, then edit it freely.
 */

import { useState, useCallback } from "react";
import {
  LayoutTemplate,
  Download,
  User,
  Layout,
  Check,
} from "lucide-react";
import { templatePresets } from "@/lib/data/template-presets";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { clsx } from "clsx";

// ─── Icon map for template previews ─────────────────────────────────────────

const iconMap = {
  layout: Layout,
  user: User,
};

// ─── Section badge (mini pills showing what's inside) ───────────────────────

function SectionBadges({ sections }) {
  return (
    <div className="flex flex-wrap gap-1">
      {sections.map((s) => (
        <span
          key={s}
          className="px-1.5 py-0.5 bg-slate-700/80 text-[9px] text-slate-400 rounded"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

// ─── Template Card ──────────────────────────────────────────────────────────

function TemplateCard({ template, onImport }) {
  const Icon = iconMap[template.preview.icon] || Layout;

  return (
    <div className="w-full rounded-lg border border-slate-600 bg-slate-800 overflow-hidden hover:border-blue-400 transition-all duration-200 group">
      {/* Preview banner */}
      <div
        className="h-28 flex flex-col items-center justify-center gap-2 relative"
        style={{
          background: `linear-gradient(135deg, ${template.preview.color}18 0%, ${template.preview.color}08 100%)`,
        }}
      >
        <Icon
          size={28}
          className="text-slate-500 group-hover:text-blue-400 transition-colors"
          style={{ color: template.preview.color }}
        />
        <span
          className="text-xs font-semibold"
          style={{ color: template.preview.color }}
        >
          {template.name}
        </span>
        {/* Section count badge */}
        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-700/90 text-[9px] text-slate-400 rounded">
          {template.layout.length} sections
        </span>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2.5">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          {template.description}
        </p>

        <SectionBadges sections={template.preview.sections} />

        <button
          onClick={() => onImport(template)}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium rounded-md transition-colors"
        >
          <Download size={12} />
          Use Template
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TemplateSection() {
  const importTemplate = useBuilderStore((s) => s.importTemplate);
  const getPageLayout = useBuilderStore((s) => s.getPageLayout);
  const siteId = useBuilderStore((s) => s.siteId);
  const pageId = useBuilderStore((s) => s.pageId);
  const { pushState } = useHistoryStore();
  const getLayoutJSON = useBuilderStore((s) => s.getLayoutJSON);

  const [confirmTemplate, setConfirmTemplate] = useState(null);
  const [imported, setImported] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const doImport = useCallback(
    async (template) => {
      // Push undo state before replacing
      if (getLayoutJSON) pushState(getLayoutJSON());

      importTemplate(template.layout);
      setImported(template.id);
      setConfirmTemplate(null);

      // Persist to DB if we have siteId/pageId
      if (siteId && pageId) {
        try {
          const store = useBuilderStore.getState();
          const layout = store.getPageLayout();
          await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layout }),
          });
        } catch (err) {
          console.error("Failed to save template to DB:", err);
        }
      }

      // Reset the check-mark after 2s
      setTimeout(() => setImported(null), 2000);
    },
    [importTemplate, pushState, getLayoutJSON, siteId, pageId],
  );

  const handleImport = useCallback(
    (template) => {
      const currentLayout = getPageLayout();
      if (currentLayout && currentLayout.length > 0) {
        // Page already has content — confirm before replacing
        setConfirmTemplate(template);
        return;
      }
      doImport(template);
    },
    [getPageLayout, doImport],
  );

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <LayoutTemplate size={12} className="text-slate-500" />
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Page Templates
        </h3>
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed -mt-2">
        Import a pre-built page layout. You can edit every section after importing.
      </p>

      {/* ── Confirmation Dialog ────────────────────────────── */}
      {confirmTemplate && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-[11px] text-amber-200 mb-2">
            Replace current page content with{" "}
            <strong>{confirmTemplate.name}</strong>? This will overwrite your
            existing layout. You can undo with Ctrl+Z.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => doImport(confirmTemplate)}
              className="flex-1 px-3 py-1.5 bg-amber-500 text-slate-900 text-[11px] font-medium rounded hover:bg-amber-400 transition-colors"
            >
              <Download size={11} className="inline mr-1" />
              Replace
            </button>
            <button
              onClick={() => setConfirmTemplate(null)}
              className="flex-1 px-3 py-1.5 bg-slate-700 text-slate-300 text-[11px] rounded hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Template Cards ────────────────────────────────── */}
      <div className="space-y-3">
        {(showAll ? templatePresets : templatePresets.slice(0, 3)).map((template) => (
          <div key={template.id} className="relative">
            <TemplateCard template={template} onImport={handleImport} />
            {/* Imported check overlay */}
            {imported === template.id && (
              <div className="absolute inset-0 bg-green-500/10 border-2 border-green-500 rounded-lg flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-medium">
                  <Check size={14} />
                  Imported!
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!showAll && templatePresets.length > 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2.5 mt-2 text-[11px] font-semibold text-slate-400 bg-slate-800/50 hover:bg-slate-800 hover:text-white rounded-lg transition-colors border border-dashed border-slate-700 hover:border-slate-500"
        >
          Show more templates
        </button>
      )}
    </div>
  );
}
