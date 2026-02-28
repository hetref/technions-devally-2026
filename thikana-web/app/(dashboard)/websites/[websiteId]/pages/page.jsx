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
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-6xl p-6 sm:p-10">
        
        {/* Breadcrumb Back Link */}
        <Link href="/websites" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-1.5" strokeWidth={2.5}/>
          Back to Projects
        </Link>
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2 truncate max-w-2xl">{website.name} Pages</h1>
            <p className="text-lg text-gray-500 max-w-xl">Design, assemble, and manage all the pages that make up this website.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Page
          </button>
        </div>

        {/* Grid Section */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          
          {/* Create Page Tile */}
          <div 
            onClick={() => setShowCreateModal(true)}
            className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center cursor-pointer hover:bg-white hover:border-gray-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[220px]"
          >
            <div className="mb-3 rounded-full bg-white shadow-sm border border-gray-100 p-4 text-gray-400 group-hover:text-gray-900 group-hover:scale-110 transition-all duration-300">
              <Plus size={26} strokeWidth={2.5} />
            </div>
            <p className="text-base font-bold text-gray-900 tracking-tight">Create New Page</p>
            <p className="text-xs text-gray-500 mt-1 max-w-[180px]">Start with a blank canvas or template.</p>
          </div>

          {/* Page Cards */}
          {pages.map((page) => (
            <div key={page.id} className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-gray-300 min-h-[220px]">
              
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-gray-900 group-hover:text-white transition-colors duration-300">
                  <Paintbrush className="h-5 w-5 text-gray-400 group-hover:text-white" strokeWidth={2} />
                </div>
                {page.slug === "/" && (
                   <span className="bg-blue-50 text-blue-700 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border-blue-100 shadow-sm">Homepage</span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate">{page.name}</h3>
              <p className="text-xs text-gray-500 mt-1 font-mono truncate">{page.slug}</p>
              
              <div className="mt-auto pt-5 border-t border-gray-100/50 flex gap-2 w-full">
                 <Link href={`/websites/${websiteId}/pages/${page.id}`} className="flex-1 w-full">
                   <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 border border-transparent hover:border-gray-900 shadow-sm">
                      <Edit2 size={15} strokeWidth={2.5} />
                      Open Builder
                   </button>
                 </Link>
              </div>
            </div>
          ))}
        </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Create New Page</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">Enter a name for the new page.</p>
            
            <form onSubmit={handleCreatePage}>
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Page Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="e.g. About Us"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 font-medium transition-colors focus:bg-white focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 placeholder:text-gray-400"
                />
                {newPageName && (
                  <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5 font-mono bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <Search size={14} className="text-gray-400"/> / {newPageName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-full bg-white border border-gray-200 px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newPageName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-3.5 text-sm font-bold text-white shadow hover:bg-gray-800 disabled:opacity-50 transition-all"
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
    </div>
  );
}
