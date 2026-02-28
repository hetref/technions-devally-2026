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
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Websites</h1>
          <p className="mt-2 text-gray-500">Manage and build modern applications for your business.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500 transition-colors"
        >
          <Plus size={18} />
          Create Website
        </button>
      </div>

      {websites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-24 px-6 text-center">
          <div className="mb-4 rounded-full bg-blue-100 p-4">
            <Globe className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No websites yet</h3>
          <p className="mb-6 text-sm text-gray-500 max-w-md">
            Start building your online presence. You can create websites with beautiful designs using our intuitive builder.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-blue-600 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Create your first website
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((site) => (
            <Link key={site.id} href={`/websites/${site.id}/pages`}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                  <LayoutGrid size={40} className="text-blue-200" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{site.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">/{site.slug}</p>
                  
                  <div className="mt-auto pt-6">
                    <div className="flex items-center text-sm font-semibold text-blue-600">
                      Manage Pages
                      <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Website</h2>
            <p className="text-sm text-gray-500 mb-6">Give your new website a name to get started.</p>
            
            <form onSubmit={handleCreateWebsite}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="e.g. My Awesome Store"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
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
                  disabled={isCreating || !newSiteName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-50"
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
