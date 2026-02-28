"use client";

import { useEffect, useState, use } from "react";
import * as React from "react";
import Toolbar from "@/components/builder/Toolbar";
import LeftSidebar from "@/components/builder/LeftSidebar";
import RightSidebar from "@/components/builder/RightSidebar";
import CanvasArea from "@/components/builder/CanvasArea";

import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { useAutosave } from "@/hooks/useAutosave";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getWebsite, getPage } from "@/lib/website-operations";

export default function WebsiteBuilderPage({ params }) {
  // Fix React is not defined by using React.use directly with correct import
  const unwrappedParams = use(params);
  const { websiteId, pageId } = unwrappedParams;
  
  const { user, userData, loading: authLoading } = useAuth();
  const businessId = user?.uid;

  const { initializeFromAPI } = useBuilderStore();
  const { initialize: initializeHistory } = useHistoryStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const loadSiteAndPage = async () => {
      if (!businessId || !websiteId || !pageId) return;

      setIsLoading(true);
      setLoadError(null);

      try {
        // 1. Fetch site metadata
        const site = await getWebsite(businessId, websiteId);
        if (!site) throw new Error("Website not found or access denied.");

        // 2. Fetch specific page
        const page = await getPage(businessId, websiteId, pageId);
        if (!page) throw new Error("Page not found.");

        // 3. Initialize builder with this page
        initializeFromAPI({
          siteId: site.id,
          pageId: page.id,
          theme: site.theme || {},
          page,
        });

        // Sync history
        initializeHistory({
          site: { id: site.id, name: site.name },
          theme: site.theme || {},
          pages: [page],
        });
      } catch (err) {
        console.error("Failed to load builder:", err);
        setLoadError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && businessId) {
      loadSiteAndPage();
    } else if (!authLoading && !businessId) {
       setLoadError("User not found or not authenticated.");
       setIsLoading(false);
    }
  }, [businessId, websiteId, pageId, authLoading]);

  // ── Autosave: watches Zustand layoutJSON changes
  const { saving, lastSaved, error: saveError } = useAutosave({ 
    businessId,
    siteId: websiteId, 
    pageId: pageId 
  });

  if (authLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#0b1411] mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Builder…</p>
        </div>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center">
          <h2 className="text-3xl font-black text-[#1d2321] uppercase tracking-tighter mb-2">Failed to Load</h2>
          <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">{loadError || "Not authenticated."}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-4 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[var(--tw-colors-gray-800)] shadow-lg hover:scale-105 active:scale-95 transition-all focus:outline-none"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#fcfdfc] text-gray-900 overflow-hidden text-base">
      <Toolbar saving={saving} lastSaved={lastSaved} saveError={saveError} siteId={websiteId} />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <CanvasArea />
        <RightSidebar />
      </div>
    </div>
  );
}
