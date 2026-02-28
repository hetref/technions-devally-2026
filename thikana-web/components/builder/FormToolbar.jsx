"use client";

/**
 * FORM TOOLBAR
 *
 * Top toolbar for form builder — mirrors site builder Toolbar but with form context.
 * Device preview, undo/redo, save, publish, back navigation.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Eye,
  ArrowLeft,
  Zap,
  Loader2,
  ClipboardList,
} from "lucide-react";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import useUIStore from "@/lib/stores/uiStore";
import { clsx } from "clsx";

export default function FormToolbar({ form, onSave, onPublish, saving }) {
  const router = useRouter();
  const params = useParams();
  const { devicePreview, setDevicePreview } = useUIStore();
  const { canUndo, canRedo, undo, redo } = useHistoryStore();
  const { getLayoutJSON, updateLayoutJSON } = useBuilderStore();

  const handleUndo = () => {
    if (canUndo) {
      const previousState = undo();
      if (previousState) {
        updateLayoutJSON(previousState, false);
      }
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextState = redo();
      if (nextState) {
        updateLayoutJSON(nextState, false);
      }
    }
  };

  const handleBack = () => {
    router.push(`/${params.tenantId}/forms`);
  };

  return (
    <div className="h-14 bg-[#1E293B] flex items-center justify-between px-4 shadow-lg flex-shrink-0">
      {/* Left Side — Logo + Back + Undo/Redo */}
      <div className="flex items-center gap-3">
        {/* Back button + Logo */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          title="Back to Forms"
        >
          <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center group-hover:from-emerald-400 group-hover:to-green-400 transition-all">
            <ClipboardList size={14} className="text-white" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">
              ← Forms
            </span>
            <span className="text-sm font-bold text-white tracking-tight">
              {form?.name || "Form Builder"}
            </span>
          </div>
        </button>

        <div className="w-px h-6 bg-slate-600" />

        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={clsx(
            "p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors",
            !canUndo &&
            "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-300"
          )}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>

        {/* Redo */}
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={clsx(
            "p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors",
            !canRedo &&
            "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-300"
          )}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Center — Device Preview */}
      <div className="flex items-center gap-0.5 bg-slate-700/60 rounded-lg p-0.5">
        {[
          { key: "desktop", Icon: Monitor, label: "Desktop" },
          { key: "tablet", Icon: Tablet, label: "Tablet" },
          { key: "mobile", Icon: Smartphone, label: "Mobile" },
        ].map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => setDevicePreview(key)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
              devicePreview === key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-600"
            )}
            title={label}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Right Side — Save + Publish */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className={clsx(
            "flex items-center gap-1.5 px-4 py-1.5 bg-slate-600 text-white text-xs font-medium rounded-md hover:bg-slate-500 transition-colors",
            saving && "opacity-50 cursor-not-allowed"
          )}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={14} />
              Save Draft
            </>
          )}
        </button>

        <button
          onClick={onPublish}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-medium rounded-md hover:from-emerald-500 hover:to-green-500 transition-all shadow-md shadow-emerald-500/20"
        >
          <Eye size={14} />
          Publish
        </button>
      </div>
    </div>
  );
}
