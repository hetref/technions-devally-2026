"use client";

import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import NearbyBusinessMap from "@/components/profile/NearbyBusinessMap";
import WhoToFollow from "@/components/WhoToFollow";
import { usePathname } from "next/navigation";

const WithRecommendationsLayout = ({ children }) => {
    const pathname = usePathname();

    // Detect profile routes (main and sub-routes)
    const isProfileRoute = pathname === "/profile" || pathname.startsWith("/profile/");

    // Check if we're on the feed page
    const isFeedPage = pathname === "/feed";

    // Disable body scroll on feed page
    useEffect(() => {
        if (isFeedPage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isFeedPage]);

    // Profile routes get a 1-column layout
    if (isProfileRoute) {
        return (
            <div className="w-full">
                <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 max-w-[1900px] mx-auto">
                    <main className="w-full">{children}</main>
                </div>
            </div>
        );
    }

    // Feed page gets a 3-column layout: Sidebar | Feed | WhoToFollow
    if (isFeedPage) {
        return (
            <div className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_300px] xl:grid-cols-[340px_1fr_320px] gap-0 lg:gap-6 px-4 lg:px-8 max-w-[1400px] mx-auto">
                    {/* Left Sidebar — Profile + Map */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-20 space-y-4">
                            <Sidebar />
                            <NearbyBusinessMap
                                height="240px"
                                width="100%"
                                cardHeight="400px"
                            />
                        </div>
                    </aside>

                    {/* Center — Feed */}
                    <main className="w-full max-h-screen overflow-y-auto">
                        {children}
                    </main>

                    {/* Right Sidebar — Who to Follow */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-20 space-y-4">
                            <WhoToFollow />
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    // Other pages (search, notifications, etc.) — 2-column layout
    return (
        <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 px-4 lg:px-6 max-w-[1900px] mx-auto">
                <aside className="hidden lg:block">
                    <div className="sticky top-20 space-y-4">
                        <Sidebar />
                    </div>
                </aside>
                <main className="w-full justify-self-start">{children}</main>
            </div>
        </div>
    );
};

export default WithRecommendationsLayout;
