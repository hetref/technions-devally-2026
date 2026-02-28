"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import PostCard from "@/components/PostCard";
import WhoToFollow from "@/components/WhoToFollow";
import { userEmailStatus } from "@/lib/userStatus";
import { sendEmailVerification } from "firebase/auth";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import PostCardSkeleton from "@/components/PostCardSkeleton";
import { MapPin, RefreshCw, AlertCircle, Compass, ArrowUp } from "lucide-react";

import { useFeed } from "@/hooks/useRecommendations";

const FeedPage = () => {
    const currentUserId = auth.currentUser?.uid;
    const { posts, loading, error, hasMore, locationDenied, fetchFeed } = useFeed(currentUserId, 15);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const scrollContainerRef = useRef(null);

    // Track scroll position for "back to top" button
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setShowScrollTop(container.scrollTop > 600);
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Check for email verification
    if (userEmailStatus() === false) {
        const verifyEmailHandler = async () => {
            await sendEmailVerification(auth.currentUser)
                .then(() => {
                    toast.success("Verification email sent!");
                })
                .catch((error) => {
                    toast.error("Error sending verification email: " + error.code);
                });
        };
        return (
            <div className="flex flex-col gap-4 justify-center items-center min-h-[500px]">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center max-w-md">
                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-amber-800 font-medium">Please verify your email to continue</p>
                </div>
                <Button onClick={verifyEmailHandler} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                    Verify Email
                </Button>
            </div>
        );
    }

    // Manual refresh with animation
    const handleManualRefresh = useCallback(async () => {
        if (!currentUserId || isRefreshing) return;
        setIsRefreshing(true);
        await fetchFeed(true);
        setIsRefreshing(false);
    }, [currentUserId, fetchFeed, isRefreshing]);

    // Location denied state
    if (locationDenied) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-6 max-w-md mx-auto px-4">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Compass className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Location Access Required
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        To show you posts from nearby businesses and personalized recommendations,
                        we need access to your location. Your location data is only used to find
                        relevant content near you.
                    </p>
                    <Button
                        onClick={handleManualRefresh}
                        className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                    >
                        <MapPin className="h-4 w-4 mr-2" />
                        Enable Location & Retry
                    </Button>
                </div>
            </div>
        );
    }

    // Loading skeleton
    if (loading && posts.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-2 py-6" ref={scrollContainerRef}>
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-6 px-1">
                    <div className="h-7 w-32 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-9 w-28 bg-gray-200 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-6">
                    {Array(4)
                        .fill(0)
                        .map((_, index) => (
                            <PostCardSkeleton key={index} />
                        ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (!loading && posts.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-2 py-6">
                <div className="flex flex-col justify-center items-center min-h-[50vh] space-y-6">
                    {error ? (
                        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center max-w-md">
                            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                            <p className="text-red-700 font-medium mb-1">Something went wrong</p>
                            <p className="text-sm text-red-600 mb-4">{error}</p>
                            <Button
                                onClick={handleManualRefresh}
                                className="bg-red-600 hover:bg-red-700 rounded-xl"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Compass className="h-10 w-10 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Your feed is empty
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                No posts near you yet. Follow some local businesses to fill your feed with updates!
                            </p>

                            {/* Show who to follow in empty state */}
                            <div className="w-full max-w-sm mx-auto mb-6">
                                <WhoToFollow />
                            </div>

                            <Button
                                onClick={handleManualRefresh}
                                variant="outline"
                                className="rounded-xl border-gray-200"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Feed
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-2 py-6" ref={scrollContainerRef}>
            {/* Feed Header */}
            <div className="flex items-center justify-between mb-6 px-1">
                <h1 className="text-xl font-bold text-gray-900">Your Feed</h1>
                <Button
                    onClick={handleManualRefresh}
                    disabled={loading || isRefreshing}
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 rounded-xl border-gray-200 hover:border-orange-200 hover:bg-orange-50 transition-all duration-200"
                >
                    <RefreshCw
                        className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            {/* Error banner (non-blocking) */}
            {error && !locationDenied && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-amber-800 font-medium">{error}</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            Showing cached results. Pull to refresh when ready.
                        </p>
                    </div>
                </div>
            )}

            {/* Who To Follow - inline at top of feed */}
            <div className="mb-6">
                <WhoToFollow />
            </div>

            {/* Posts */}
            <div className="space-y-5">
                {posts.map((post) => (
                    <div key={post.id} className="relative group">
                        {/* Recommendation Badge */}
                        <div className="absolute top-4 left-4 z-10">
                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-sm transition-opacity duration-200 ${
                                    post.recommendation_type === "followed"
                                        ? "bg-green-100/90 text-green-700 border border-green-200/50"
                                        : "bg-blue-100/90 text-blue-700 border border-blue-200/50"
                                }`}
                            >
                                {post.recommendation_type === "followed" ? (
                                    <>
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="h-3 w-3" />
                                        {post.distance_km != null
                                            ? post.distance_km < 1
                                                ? `${Math.round(post.distance_km * 1000)}m away`
                                                : `${post.distance_km.toFixed(1)} km away`
                                            : "Nearby"}
                                    </>
                                )}
                            </span>
                        </div>

                        <PostCard
                            post={post}
                            onView={() => {}}
                            showDistance={post.recommendation_type !== "followed"}
                            distanceText={
                                post.distance_km != null
                                    ? post.distance_km < 1
                                        ? `${Math.round(post.distance_km * 1000)}m away`
                                        : `${post.distance_km.toFixed(1)} km away`
                                    : ""
                            }
                        />
                    </div>
                ))}
            </div>

            {/* Load More / End of Feed */}
            <div className="mt-6 mb-8">
                {loading && posts.length > 0 && (
                    <div className="flex items-center justify-center py-6">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-3 text-sm text-gray-500">Loading more posts...</span>
                    </div>
                )}
                {hasMore && !loading ? (
                    <Button
                        onClick={() => fetchFeed(false)}
                        variant="outline"
                        className="w-full py-5 rounded-2xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 transition-all duration-200"
                    >
                        Load more posts
                    </Button>
                ) : (
                    !loading &&
                    posts.length > 0 && (
                        <div className="text-center py-8">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Compass className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-400">
                                You&apos;re all caught up! Follow more places for more updates.
                            </p>
                        </div>
                    )
                )}
            </div>

            {/* Scroll to top FAB */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="h-5 w-5 text-gray-600" />
                </button>
            )}
        </div>
    );
};

export default FeedPage;
