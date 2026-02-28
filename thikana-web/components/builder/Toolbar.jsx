"use client";

/**
 * TOP TOOLBAR
 *
 * Dark-themed professional toolbar with undo/redo, device preview, save, publish.
 * Publish opens a modal to name the deployment before pushing to S3 + CloudFront.
 */

import { useState, useEffect } from "react";
import {
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Eye,
  RotateCcw,
  Layers,
  Zap,
  Loader2,
  CheckCircle2,
  X,
  Rocket,
  Globe,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Search,
} from "lucide-react";
import useUIStore from "@/lib/stores/uiStore";
import AIPageGenerator from "./AIPageGenerator";
import useHistoryStore from "@/lib/stores/historyStore";
import useBuilderStore, { clearSavedState } from "@/lib/stores/builderStore";
import { clsx } from "clsx";

import { convertJsonToHtml } from "@/lib/publish/jsonToHtml";
import JSZip from "jszip";
import { useAuth } from "@/hooks/useAuth";
import { getPage, savePageData } from "@/lib/website-operations";

// ─── SEO Modal ────────────────────────────────────────────────────────────────

function SEOModal({ siteId, pageId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
  });
  
  const { user } = useAuth();
  const businessId = user?.uid;

  // Load existing SEO on open
  useEffect(() => {
    if (!siteId || !pageId || !businessId) return;
    
    getPage(businessId, siteId, pageId)
      .then(page => {
        if (page?.seo) {
          setSeo(prev => ({ ...prev, ...page.seo }));
        }
        // Pre-fill title from page name if empty
        if (!page?.seo?.title && page?.name) {
          setSeo(prev => ({ ...prev, title: page.name }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [siteId, pageId, businessId]);

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      await savePageData(businessId, siteId, pageId, { seo });
      onClose();
    } catch (error) {
      console.error('Error saving SEO:', error);
      alert('Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Search size={16} className="text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Page SEO Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Page Title
            </label>
            <input
              type="text"
              value={seo.title}
              onChange={(e) => setSeo(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="My Page Title"
            />
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Appears in browser tabs and search results ({seo.title.length}/60 chars)
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Meta Description
            </label>
            <textarea
              value={seo.description}
              onChange={(e) => setSeo(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
              rows={3}
              placeholder="A brief description of this page for search engines..."
            />
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Recommended: 120-160 characters ({seo.description.length}/160)
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Keywords
            </label>
            <input
              type="text"
              value={seo.keywords}
              onChange={(e) => setSeo(prev => ({ ...prev, keywords: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="website, builder, landing page"
            />
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Comma-separated keywords for this page
            </p>
          </div>

          {/* Google Preview */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Preview</p>
            <p className="text-blue-700 text-base font-medium truncate">
              {seo.title || 'Page Title'}
            </p>
            <p className="text-green-700 text-xs truncate mt-0.5">
              https://yoursite.com/page
            </p>
            <p className="text-gray-600 text-xs mt-1 line-clamp-2">
              {seo.description || 'No description set. Search engines will auto-generate one from your page content.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 bg-white text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving…</>
            ) : (
              <>Save SEO</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Publish Modal ────────────────────────────────────────────────────────────

function PublishModal({ siteId, onClose, onSuccess }) {
  const [deploymentName, setDeploymentName] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState(null);

  const handlePublish = async () => {
    setError(null);
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentName: deploymentName.trim() || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Publish failed");
      onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
              <Rocket size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-white">Publish Site</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-slate-400">
            Your site will be uploaded to S3 and the CloudFront CDN will be
            updated instantly. Every publish creates a new versioned snapshot —
            you can roll back at any time.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Deployment name{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={deploymentName}
              onChange={(e) => setDeploymentName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePublish()}
              placeholder="e.g. v1.2 — Added hero section"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-600 text-white text-sm rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <span className="mt-0.5">⚠</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="flex-1 px-4 py-2.5 border border-slate-600 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium rounded-xl hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-60 shadow-lg shadow-blue-500/20"
          >
            {isPublishing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Rocket size={14} />
                Publish now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Success Toast / Banner ───────────────────────────────────────────────────

function PublishSuccessBanner({ result, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-[#0F172A] border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-500/10 p-4 flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 size={16} className="text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Published!</p>
        {result.deploymentName && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {result.deploymentName}
          </p>
        )}
        {result.siteUrl && (
          <a
            href={result.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1.5 transition-colors"
          >
            <Globe size={11} />
            {result.siteUrl.replace("https://", "")}
            <ExternalLink size={10} />
          </a>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────

export default function Toolbar({ saving: autoSaving, lastSaved, saveError, tenantId }) {
  const { user } = useAuth();
  const businessId = user?.uid;
  
  const { devicePreview, setDevicePreview } = useUIStore();
  const { canUndo, canRedo, undo, redo } = useHistoryStore();
  const { getLayoutJSON, updateLayoutJSON, siteId, pageId, getPageLayout } =
    useBuilderStore();

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saved" | "error" | null
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showSEOModal, setShowSEOModal] = useState(false);

  const handleUndo = () => {
    if (canUndo) {
      const previousState = undo();
      if (previousState) updateLayoutJSON(previousState);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextState = redo();
      if (nextState) updateLayoutJSON(nextState);
    }
  };

  const handleSave = async () => {
    const store = useBuilderStore.getState();
    const { siteId, pageId, layoutJSON, currentPageId } = store;

    // ── DB-backed save ──────────────────────────────────────────────────────
    if (businessId && siteId && pageId) {
      setIsSaving(true);
      setSaveStatus(null);
      try {
        const page = layoutJSON?.pages?.find((p) => p.id === currentPageId);
        await savePageData(businessId, siteId, pageId, {
            layout: page?.layout ?? [],
            name: page?.name,
            seo: page?.seo,
        });

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (err) {
        console.error("Save error:", err);
        setSaveStatus("error");
        alert(`Save failed: ${err.message}`);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // ── Demo / localStorage fallback ────────────────────────────────────────
    const fallbackLayout = getLayoutJSON();
    if (fallbackLayout) {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "Thikana_builder_v2",
            JSON.stringify(fallbackLayout)
          );
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 2000);
      } catch {
        alert("Failed to save locally.");
      }
    }
  };

  const handlePublishClick = async () => {
    const store = useBuilderStore.getState();
    const layoutJSON = store.getLayoutJSON();
    
    if (!layoutJSON) {
      alert("No layout found to export.");
      return;
    }

    try {
      setIsPublishing(true);
      const zip = new JSZip();

      // Convert layout to html/css/js
      // If the website has multiple pages we would ideally iterate, but Thikana mostly handles 1 active page or you just loop.
      // We will loop over layoutJSON.pages instead of just one.
      
      for (const page of layoutJSON.pages) {
         try {
           const { html, css, js } = convertJsonToHtml(layoutJSON, page.id);
           
           const folderName = page.slug === "/" ? "" : page.slug.replace(/^\//, "");
           const baseFolder = folderName ? zip.folder(folderName) : zip;
           
           baseFolder.file("index.html", html);
           baseFolder.file("styles.css", css);
           baseFolder.file("script.js", js);
         } catch (e) {
             console.error(`Failed to export page ${page.slug}`, e);
         }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${layoutJSON.site?.name || "website"}-export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      handlePublishSuccess({
         deploymentName: "Website Downloaded Successfully"
      });

    } catch (err) {
      alert("Failed to export: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishSuccess = (result) => {
    setPublishResult(result);
    // Auto-dismiss success banner after 8 seconds
    setTimeout(() => setPublishResult(null), 8000);
  };

  return (
    <>
      <div className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 sm:px-10 z-20 shadow-sm relative shrink-0">
        {/* Left Side — Logo + Undo/Redo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => window.history.back()}
            className="p-2.5 rounded-xl text-gray-400 hover:bg-[#f2f4f2] hover:text-[#0b1411] transition-colors"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2 mr-2">
            <div className="w-10 h-10 bg-[#0b1411] rounded-xl flex items-center justify-center shadow-inner">
              <Zap size={18} className="text-[#d3ff4a]" />
            </div>
            <div>
              <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5">
                PAGE BUILDER
              </p>
              <h1 className="text-xl font-black text-[#1d2321] uppercase tracking-tighter leading-none">
                Thikana
              </h1>
            </div>
          </div>

          <div className="w-px h-10 bg-gray-200" />

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={clsx(
              "p-2.5 rounded-xl text-gray-400 hover:bg-[#f2f4f2] hover:text-[#0b1411] transition-colors",
              !canUndo &&
              "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-gray-400"
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={clsx(
              "p-2.5 rounded-xl text-gray-400 hover:bg-[#f2f4f2] hover:text-[#0b1411] transition-colors",
              !canRedo &&
              "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-gray-400"
            )}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Center — Device Preview */}
        <div className="flex items-center gap-1 bg-[#f2f4f2] rounded-full p-1 border border-gray-100 shadow-inner">
          {[
            { key: "desktop", Icon: Monitor, label: "Desktop" },
            { key: "tablet", Icon: Tablet, label: "Tablet" },
            { key: "mobile", Icon: Smartphone, label: "Mobile" },
          ].map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => setDevicePreview(key)}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                devicePreview === key
                  ? "bg-white text-[#0b1411] shadow-sm transform scale-105"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-200/50"
              )}
              title={label}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Right Side — Actions */}
        <div className="flex items-center gap-4">



          {/* SEO Button */}
          <button
            onClick={() => setShowSEOModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors border border-blue-200"
            title="Page SEO Settings"
          >
            <Search size={14} />
            <span className="hidden sm:inline">SEO</span>
          </button>

          {/* AI Generate Button */}
          <button
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors border border-purple-200"
            title="AI Generate Page"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">AI Generate</span>
          </button>

          <button
            onClick={() => {
              if (confirm("Reset to demo data? All changes will be lost.")) {
                clearSavedState();
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Reset to demo"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <div className="h-8 w-px bg-gray-200 mx-1" />

          {/* Auto-save status indicator */}
          {autoSaving ? (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#8bc4b1]">
              <Loader2 size={12} className="animate-spin" />
              Auto-saving…
            </span>
          ) : lastSaved ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400" title={lastSaved.toLocaleTimeString()}>
              Auto-saved
            </span>
          ) : saveError ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400" title={saveError}>
              Save failed
            </span>
          ) : null}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={clsx(
              "flex items-center gap-2 px-6 py-2.5 h-10 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 shadow-sm hover:shadow-md",
              saveStatus === "saved"
                ? "bg-[#8bc4b1] text-white"
                : "bg-white border border-gray-200 text-[#0b1411] hover:border-[#0b1411]/20 hover:scale-105 active:scale-95",
              isSaving && "opacity-70 cursor-wait"
            )}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveStatus === "saved" ? (
              <CheckCircle2 size={14} />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save"}
          </button>

          <button
            onClick={handlePublishClick}
            className="flex items-center gap-2 px-6 py-2.5 h-10 bg-[#d3ff4a] text-[#0b1411] text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#c0eb3f] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)]"
          >
            {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isPublishing ? "Exporting…" : "Download Source"}
          </button>
        </div>
      </div>


      {/* AI Page Generator Modal */}
      <AIPageGenerator
        tenantId={tenantId}
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerate={(containers) => {
          const currentLayout = getLayoutJSON();
          const currentPage = currentLayout.pages.find(p => p.id === currentLayout.pages[0].id);

          // Replace current page layout with AI-generated containers
          const updatedLayout = {
            ...currentLayout,
            pages: currentLayout.pages.map(p =>
              p.id === currentPage.id
                ? { ...p, layout: containers }
                : p
            )
          };

          updateLayoutJSON(updatedLayout);
        }}
      />

      {showSEOModal && siteId && pageId && (
        <SEOModal
          siteId={siteId}
          pageId={pageId}
          onClose={() => setShowSEOModal(false)}
        />
      )}

      {/* Success Banner */}
      {publishResult && (
        <PublishSuccessBanner
          result={publishResult}
          onClose={() => setPublishResult(null)}
        />
      )}
    </>
  );
}
