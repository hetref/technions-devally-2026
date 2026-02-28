"use client";

import { useWhoToFollow } from "@/hooks/useRecommendations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, UserPlus, Store, RefreshCw } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function WhoToFollow() {
    const userId = auth.currentUser?.uid;
    const { suggestions, loading, error, refetch } = useWhoToFollow(userId, 5);
    const [followingMap, setFollowingMap] = useState({});
    const [processingMap, setProcessingMap] = useState({});

    const handleFollow = async (businessId, businessName) => {
        if (!userId || processingMap[businessId]) return;

        setProcessingMap((prev) => ({ ...prev, [businessId]: true }));

        try {
            const isCurrentlyFollowing = followingMap[businessId];

            if (isCurrentlyFollowing) {
                // Unfollow
                await deleteDoc(
                    doc(db, "users", userId, "following", businessId)
                );
                setFollowingMap((prev) => ({ ...prev, [businessId]: false }));
                toast.success(`Unfollowed ${businessName}`);
            } else {
                // Follow
                await setDoc(
                    doc(db, "users", userId, "following", businessId),
                    { followedAt: serverTimestamp() }
                );
                setFollowingMap((prev) => ({ ...prev, [businessId]: true }));
                toast.success(`Now following ${businessName}!`);
            }
        } catch (err) {
            console.error("Follow/unfollow error:", err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setProcessingMap((prev) => ({ ...prev, [businessId]: false }));
        }
    };

    if (loading) {
        return (
            <Card className="rounded-2xl border border-gray-100 shadow-sm">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="space-y-4">
                        {Array(3)
                            .fill(0)
                            .map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-28" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-8 w-20 rounded-lg" />
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !suggestions.length) return null;

    return (
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                        Suggested for you
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refetch}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="space-y-3">
                    {suggestions.map((biz) => (
                        <div
                            key={biz.id}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-150"
                        >
                            <Avatar className="h-10 w-10 ring-2 ring-orange-100">
                                <AvatarImage
                                    src={biz.profilePic || "/default-avatar.png"}
                                    alt={biz.businessName}
                                />
                                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-orange-400 to-red-500 text-white">
                                    {(biz.businessName || "B")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                    {biz.businessName}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {biz.businessType && (
                                        <span className="flex items-center gap-0.5">
                                            <Store className="h-3 w-3" />
                                            {biz.businessType}
                                        </span>
                                    )}
                                    {biz.distance_km != null && (
                                        <span className="flex items-center gap-0.5">
                                            <MapPin className="h-3 w-3" />
                                            {biz.distance_km < 1
                                                ? `${Math.round(biz.distance_km * 1000)}m`
                                                : `${biz.distance_km.toFixed(1)}km`}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                size="sm"
                                variant={followingMap[biz.id] ? "outline" : "default"}
                                disabled={processingMap[biz.id]}
                                onClick={() =>
                                    handleFollow(biz.id, biz.businessName)
                                }
                                className={`h-8 text-xs font-semibold rounded-lg px-3 transition-all duration-200 ${
                                    followingMap[biz.id]
                                        ? "border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
                                        : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-sm"
                                }`}
                            >
                                {processingMap[biz.id] ? (
                                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : followingMap[biz.id] ? (
                                    "Following"
                                ) : (
                                    <>
                                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                                        Follow
                                    </>
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
