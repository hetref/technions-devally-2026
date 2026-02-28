"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getWebsites, createWebsite } from "@/lib/website-operations";
import { Plus, Globe, ArrowRight, Loader2, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WebsitesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const businessId = user?.uid;
  const router = useRouter();

  const [websites, setWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!authLoading && businessId) {
      loadWebsites();
    } else if (!authLoading && !businessId) {
      setIsLoading(false);
    }
  }, [businessId, authLoading]);

  const loadWebsites = async () => {
    setIsLoading(true);
    try {
      const sites = await getWebsites(businessId);
      setWebsites(sites);
    } catch (err) {
      console.error("Failed to load websites", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWebsite = async (e) => {
    e.preventDefault();
    if (!newSiteName.trim() || !businessId) return;
    
    setIsCreating(true);
    try {
      const siteData = {
        name: newSiteName.trim(),
        slug: newSiteName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        theme: {
          primaryColor: "#3b82f6",
          fontFamily: "Inter, sans-serif"
        }
      };
      
      const newSite = await createWebsite(businessId, siteData);
      setWebsites([newSite, ...websites]);
      setShowCreateModal(false);
      setNewSiteName("");
      router.push(`/websites/${newSite.id}/pages`);
    } catch (err) {
      console.error("Failed to create website", err);
      alert("Failed to create website. Please try again.");
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

  if (!user) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="mt-2 text-gray-500">You must be logged in as a business to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-6xl p-6 sm:p-10">
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Your Projects</h1>
            <p className="text-lg text-gray-500 max-w-xl">Manage your active websites, edit pages, and launch new ideas to the world.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Website
          </button>
        </div>

        {websites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white py-32 px-6 text-center shadow-sm">
            <div className="mb-6 rounded-full bg-gray-50 p-6 border border-gray-100 shadow-inner">
              <Globe className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900 tracking-tight">No websites yet</h3>
            <p className="mb-8 text-base text-gray-500 max-w-md leading-relaxed">
              Start building your online presence. You can create websites with beautiful designs using our intuitive builder.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-gray-900 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-gray-800 hover:shadow-lg transition-all duration-200"
            >
              Create your first website
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {websites.map((site) => (
              <Link key={site.id} href={`/websites/${site.id}/pages`}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-300">
                  
                  {/* Card Banner */}
                  <div className="relative flex h-36 items-center justify-center bg-gray-50 border-b border-gray-100 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-gray-200/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <LayoutGrid size={48} className="text-gray-300 group-hover:text-gray-400 group-hover:scale-110 transition-all duration-500" strokeWidth={1} />
                  </div>
                  
                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-1 truncate">{site.name}</h3>
                    <p className="text-sm text-gray-500 font-mono truncate">/{site.slug}</p>
                    
                    <div className="mt-8 pt-6 border-t border-gray-100/50">
                      <div className="flex items-center text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        Manage Site
                        <ArrowRight size={16} className="ml-1.5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                  
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Create New Website</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">Give your new website a distinct name to get started.</p>
            
            <form onSubmit={handleCreateWebsite}>
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Website Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="e.g. My Awesome Store"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 font-medium transition-colors focus:bg-white focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 placeholder:text-gray-400"
                />
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
                  disabled={isCreating || !newSiteName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-3.5 text-sm font-bold text-white shadow hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                  {isCreating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    "Create Website"
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
