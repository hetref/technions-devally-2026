"use client";

import { useEffect, useState, use } from "react";
import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { getWebsitePages, getWebsite, createPage } from "@/lib/website-operations";
import { Plus, Paintbrush, ArrowLeft, Loader2, Search, Edit2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WebsitePagesDashboard({ params }) {
  const unwrappedParams = use(params);
  const { websiteId } = unwrappedParams;
  
  const { user, loading: authLoading } = useAuth();
  const businessId = user?.uid;
  const router = useRouter();

  const [website, setWebsite] = useState(null);
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!authLoading && businessId) {
      loadData();
    } else if (!authLoading && !businessId) {
      setIsLoading(false);
    }
  }, [businessId, authLoading, websiteId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dbUrl = await getWebsite(businessId, websiteId);
      setWebsite(dbUrl);
      const dbPages = await getWebsitePages(businessId, websiteId);
      setPages(dbPages);
    } catch (err) {
      console.error("Failed to load pages", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!newPageName.trim() || !businessId) return;
    
    setIsCreating(true);
    const slugName = newPageName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const targetSlug = slugName === "home" ? "/" : `/${slugName}`;
    
    try {
      const pageData = {
        name: newPageName.trim(),
        slug: targetSlug,
        sortOrder: pages.length,
        seo: { title: `${website?.name || "Website"} - ${newPageName.trim()}`, description: "" },
        layout: []
      };
      
      const newPage = await createPage(businessId, websiteId, pageData);
      setPages([...pages, newPage]);
      setShowCreateModal(false);
      setNewPageName("");
      router.push(`/websites/${websiteId}/pages/${newPage.id}`);
    } catch (err) {
      console.error("Failed to create page", err);
      alert("Failed to create page. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user || !website) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Not Found</h2>
        <p className="mt-2 text-gray-500">Website might not exist or you do not have access.</p>
        <Link href="/websites" className="mt-4 text-blue-600 font-semibold">
          &larr; Back to Websites
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link href="/websites" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} className="mr-1" />
        Back to Websites
      </Link>
      
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{website.name} Pages</h1>
          <p className="mt-2 text-gray-500">Design and manage all pages for this website.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500 transition-colors"
        >
          <Plus size={18} />
          Create Page
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pages.map((page) => (
          <div key={page.id} className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Paintbrush className="h-5 w-5 text-blue-600" />
              </div>
              {page.slug === "/" && (
                 <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full">Homepage</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 truncate">{page.name}</h3>
            <p className="text-sm text-gray-500 mt-1 font-mono truncate">{page.slug}</p>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
               <Link href={`/websites/${websiteId}/pages/${page.id}`} className="flex-1">
                 <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200">
                    <Edit2 size={14} />
                    Builder
                 </button>
               </Link>
            </div>
          </div>
        ))}

        <div 
          onClick={() => setShowCreateModal(true)}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all min-h-[220px]"
        >
          <div className="mb-3 rounded-full bg-white shadow-sm border border-gray-100 p-3 text-gray-400 group-hover:text-blue-600 transition-colors">
            <Plus size={24} />
          </div>
          <p className="text-sm font-bold text-gray-600">Create New Page</p>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Page</h2>
            <p className="text-sm text-gray-500 mb-6">Enter a name for the new page.</p>
            
            <form onSubmit={handleCreatePage}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="e.g. About Us"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {newPageName && (
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Search size={12} /> URL slug will be: {newPageName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  </p>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newPageName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50"
                >
                  {isCreating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    "Create Page"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
