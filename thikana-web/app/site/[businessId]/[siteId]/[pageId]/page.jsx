"use client";

/**
 * SITE PREVIEW PAGE
 *
 * /site/[businessId]/[siteId]/[pageId]
 *
 * Fetches the page layout from Firestore and renders it in a clean,
 * full-screen preview using PreviewRenderer. Includes a floating
 * toolbar at the top to switch devices or go back to the editor.
 */

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import PreviewRenderer from "@/components/canvas/PreviewRenderer";
import { componentRegistry } from "@/components/registry";
import { getWebsite, getPage } from "@/lib/website-operations";
import {
  Loader2,
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Pencil,
  X,
  ExternalLink,
  Eye,
} from "lucide-react";
import { clsx } from "clsx";

const DEVICE_WIDTHS = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export default function SitePreviewPage({ params }) {
  const { businessId, siteId, pageId } = use(useMemo(() => params, [params]));
  const router = useRouter();

  const [page, setPage] = useState(null);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [device, setDevice] = useState("desktop");
  const [showToolbar, setShowToolbar] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!businessId || !siteId || !pageId) return;
      setLoading(true);
      setError(null);

      try {
        const [siteData, pageData] = await Promise.all([
          getWebsite(businessId, siteId),
          getPage(businessId, siteId, pageId),
        ]);

        if (!pageData) throw new Error("Page not found.");
        setSite(siteData);
        setPage(pageData);
      } catch (err) {
        console.error("Preview load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [businessId, siteId, pageId]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto">
              <Loader2 className="animate-spin h-8 w-8 text-gray-800" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Loading Preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !page) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Preview Unavailable
          </h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            {error || "The page could not be found."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Floating Toolbar */}
      {showToolbar && (
        <div className="shrink-0 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            {/* Left: back + site info */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                title="Back to editor"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <div className="hidden sm:flex items-center gap-2">
                <Eye size={14} className="text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Preview
                </span>
                {site?.name && (
                  <>
                    <span className="text-gray-300">—</span>
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">
                      {site.name}
                    </span>
                  </>
                )}
                {page?.name && (
                  <span className="text-xs text-gray-400 truncate max-w-[120px]">
                    / {page.name}
                  </span>
                )}
              </div>
            </div>

            {/* Center: Device switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              {[
                { key: "desktop", Icon: Monitor, label: "Desktop" },
                { key: "tablet", Icon: Tablet, label: "Tablet" },
                { key: "mobile", Icon: Smartphone, label: "Mobile" },
              ].map(({ key, Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setDevice(key)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                    device === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                  title={label}
                >
                  <Icon size={14} />
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  router.push(`/websites/${siteId}`)
                }
                className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Edit in Builder"
              >
                <Pencil size={13} />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setShowToolbar(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Hide toolbar (press Escape to show)"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden toolbar — show hint */}
      {!showToolbar && (
        <button
          onClick={() => setShowToolbar(true)}
          className="fixed top-3 right-3 z-40 flex items-center gap-2 px-3 py-2 bg-gray-900/80 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-900 transition-colors shadow-lg"
        >
          <Eye size={12} />
          Show Toolbar
        </button>
      )}

      {/* Escape key to toggle toolbar */}
      <EscapeKeyHandler onEscape={() => setShowToolbar((v) => !v)} />

      {/* Preview Frame */}
      <div className="flex-1 overflow-auto flex justify-center py-4 px-4">
        <div
          className={clsx(
            "bg-white shadow-2xl transition-all duration-300 ease-in-out overflow-auto rounded-lg",
            device !== "desktop" && "border border-gray-200"
          )}
          style={{
            width: DEVICE_WIDTHS[device],
            maxWidth: "100%",
            minHeight: "100%",
            ...(site?.theme?.fontFamily && {
              fontFamily: site.theme.fontFamily,
            }),
          }}
        >
          <PreviewRenderer page={page} theme={site?.theme} />
        </div>
      </div>
    </div>
  );
}

// ── Helper: listen for Escape key ──────────────────────────────────────────

function EscapeKeyHandler({ onEscape }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEscape]);

  return null;
}
