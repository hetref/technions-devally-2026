"use client";
import {
    useState,
    useEffect,
    useCallback,
    useMemo,
    Suspense,
    useRef,
} from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileTextIcon,
    MapPinIcon,
    Images,
    SquareChartGantt,
    Globe,
    Calendar,
    User,
    Settings,
    Home,
    Plus,
    Minus,
} from "lucide-react";
import { useGetUserPosts } from "@/hooks/useGetPosts";
import { useGetUserByUsername } from "@/hooks/useGetUser";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    orderBy,
    setDoc,
    deleteDoc,
} from "firebase/firestore";
import PostCard from "@/components/PostCard";
import Link from "next/link";
import ShowProductsTabContent from "@/components/profile/ShowProductsTabContent";
import Image from "next/image";
import toast from "react-hot-toast";
import FollowingDialog from "@/components/profile/FollowingDialog";
import FollowerDialog from "@/components/profile/FollowerDialog";
import PhotosGrid from "@/components/PhotosGrid";
import ShareBusinessDialog from "@/components/profile/ShareBusinessDialog";
import MoreInformationDialog from "@/components/profile/MoreInformationDialog";
import { cn } from "@/lib/utils";
import ShowServicesTabContent from "@/components/profile/ShowServicesTabContent";
import ShowBusinessProperties from "@/components/profile/ShowBusinessProperties";
import { sendNotificationToUser } from "@/lib/notifications";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import "leaflet/dist/leaflet.css";
import Loader from "@/components/Loader";

// Dynamically import Leaflet components to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
    loading: () => (
        <div className="h-[300px] flex justify-center items-center bg-gray-100">
            <Loader />
        </div>
    ),
    ssr: false,
});

// Memoized components
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-[400px]">
        <Loader />
    </div>
);

const EmptyState = ({ icon: Icon, message }) => (
    <div className="text-center py-12">
        <Icon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
    </div>
);

export default function UserProfile() {
    const router = useRouter();
    const params = useParams();
    const username = params.username;
    const { user: userData, loading: userLoading } = useGetUserByUsername(username);
    const userId = userData?.uid;

    const [currentUser, setCurrentUser] = useState(null);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [showLocationIFrame, setShowLocationIFrame] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [userPhotos, setUserPhotos] = useState([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    // Appointment booking state
    const [bookOpen, setBookOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedStart, setSelectedStart] = useState("");
    const [multiplier, setMultiplier] = useState(1);
    const [computedEnd, setComputedEnd] = useState("");
    const [bookingDescription, setBookingDescription] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);


    // Cleanup refs
    const unsubscribeRefs = useRef([]);

    // Determine if this is a business user profile
    const isBusinessUser = useMemo(() => {
        return !!userData?.businessName || userData?.role === "business" || userData?.role === "member";
    }, [userData]);

    // Helpers for slot computation
    const parseTimeToMinutes = useCallback((hhmm) => {
        const [h, m] = (hhmm || "").split(":");
        const hours = parseInt(h, 10);
        const mins = parseInt(m, 10);
        if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
        return hours * 60 + mins;
    }, []);

    const minutesToTime = useCallback((mins) => {
        const h = Math.floor(mins / 60).toString().padStart(2, "0");
        const m = (mins % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
    }, []);

    const getDayIndexFromISO = useCallback((dateStr) => {
        if (!dateStr) return null;
        const [y, mo, d] = dateStr.split("-").map((x) => parseInt(x, 10));
        const dt = new Date(y, mo - 1, d);
        const jsDay = dt.getDay();
        return (jsDay + 6) % 7; // Monday=0
    }, []);

    // Compute available slots when date changes
    useEffect(() => {
        if (!selectedDate || !userData) {
            setAvailableSlots([]);
            setSelectedStart("");
            setComputedEnd("");
            return;
        }
        if (!userData.acceptAppointments) {
            setAvailableSlots([]);
            return;
        }
        const ops = userData.operationalHours || [];
        const dayIdx = getDayIndexFromISO(selectedDate);
        const info = ops[dayIdx];
        if (!info || !info.enabled) {
            setAvailableSlots([]);
            return;
        }
        const slotMinutes = typeof userData.appointmentSlotMinutes === "number" ? userData.appointmentSlotMinutes : 30;
        const openMins = parseTimeToMinutes(info.openTime);
        const closeMins = parseTimeToMinutes(info.closeTime);
        if (openMins == null || closeMins == null) {
            setAvailableSlots([]);
            return;
        }
        const slots = [];
        for (let t = openMins; t + slotMinutes <= closeMins; t += slotMinutes) {
            slots.push(minutesToTime(t));
        }
        setAvailableSlots(slots);
        setSelectedStart(slots[0] || "");
    }, [selectedDate, userData, getDayIndexFromISO, parseTimeToMinutes, minutesToTime]);

    // Compute end time from start and multiplier
    useEffect(() => {
        if (!selectedStart || !userData) {
            setComputedEnd("");
            return;
        }
        const slotMinutes = typeof userData.appointmentSlotMinutes === "number" ? userData.appointmentSlotMinutes : 30;
        const ops = userData.operationalHours || [];
        const dayIdx = getDayIndexFromISO(selectedDate);
        const info = ops[dayIdx];
        const startMins = parseTimeToMinutes(selectedStart);
        const endMins = startMins + slotMinutes * Math.max(1, Number(multiplier) || 1);
        const closeMins = info && parseTimeToMinutes(info.closeTime);
        if (closeMins != null && endMins <= closeMins) {
            setComputedEnd(minutesToTime(endMins));
        } else {
            setComputedEnd("");
        }
    }, [selectedStart, multiplier, selectedDate, userData, getDayIndexFromISO, parseTimeToMinutes, minutesToTime]);

    const submitBooking = useCallback(async () => {
        if (!currentUser) {
            toast.error("Please log in to book an appointment");
            return;
        }
        if (!userData?.acceptAppointments) {
            toast.error("This business is not accepting appointments");
            return;
        }
        if (!selectedDate) {
            toast.error("Please select a date");
            return;
        }
        if (!selectedStart || !computedEnd) {
            toast.error("Please select a valid time slot");
            return;
        }

        try {
            setBookingLoading(true);
            const token = await currentUser.getIdToken();
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    businessId: userId,
                    date: selectedDate,
                    startTime: selectedStart,
                    endTime: computedEnd,
                    description: bookingDescription,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to book appointment");
            }
            toast.success("Appointment requested successfully");
            setBookOpen(false);
            setSelectedDate("");
            setSelectedStart("");
            setMultiplier(1);
            setBookingDescription("");
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Failed to book appointment");
        } finally {
            setBookingLoading(false);
        }
    }, [currentUser, userData, selectedDate, selectedStart, computedEnd, bookingDescription, userId]);

    const {
        posts,
        loading: postsLoading,
        fetchMorePosts,
        hasMore,
        error: postsError,
    } = useGetUserPosts(userId);

    // Cleanup function for all listeners
    const cleanupListeners = useCallback(() => {
        unsubscribeRefs.current.forEach((unsubscribe) => {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        });
        unsubscribeRefs.current = [];
    }, []);

    // Check if the current user is logged in
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if (authUser) {
                // Redirect to /profile if the user is viewing their own profile
                if (userId && userId === authUser.uid) {
                    router.push("/profile");
                    return;
                }
                setCurrentUser(authUser);
            }
            setLoading(false);
        });

        unsubscribeRefs.current.push(unsubscribe);

        return () => {
            unsubscribe();
        };
    }, [userId, router]);

    // Fetch followers and following counts
    useEffect(() => {
        if (!userId) return;

        const followersRef = collection(db, "users", userId, "followers");
        const followingRef = collection(db, "users", userId, "following");

        const unsubscribeFollowers = onSnapshot(
            followersRef,
            (snapshot) => setFollowersCount(snapshot.size),
            (error) => console.error("Error fetching followers:", error)
        );

        const unsubscribeFollowing = onSnapshot(
            followingRef,
            (snapshot) => setFollowingCount(snapshot.size),
            (error) => console.error("Error fetching following:", error)
        );

        unsubscribeRefs.current.push(unsubscribeFollowers, unsubscribeFollowing);

        return () => {
            unsubscribeFollowers();
            unsubscribeFollowing();
        };
    }, [userId]);

    // Check if current user is following this profile
    useEffect(() => {
        if (!currentUser || !userId) return;

        const followingRef = collection(db, "users", currentUser.uid, "following");
        const unsubscribe = onSnapshot(
            followingRef,
            (snapshot) => {
                const isUserFollowing = snapshot.docs.some((doc) => doc.id === userId);
                setIsFollowing(isUserFollowing);
            },
            (error) => console.error("Error checking follow status:", error)
        );

        unsubscribeRefs.current.push(unsubscribe);

        return () => unsubscribe();
    }, [currentUser, userId]);

    // Fetch user photos
    useEffect(() => {
        if (!userId) {
            setLoadingPhotos(false);
            return;
        }

        setLoadingPhotos(true);
        const photosRef = collection(db, "users", userId, "photos");
        const photosQuery = query(photosRef, orderBy("addedOn", "desc"));

        const unsubscribe = onSnapshot(
            photosQuery,
            (snapshot) => {
                const photos = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setUserPhotos(photos);
                setLoadingPhotos(false);
            },
            (error) => {
                console.error("Error fetching photos:", error);
                setLoadingPhotos(false);
                setUserPhotos([]);
            }
        );

        unsubscribeRefs.current.push(unsubscribe);

        return () => unsubscribe();
    }, [userId]);

    // Optimized handlers
    const handleLoadMore = useCallback(() => {
        if (hasMore && !postsLoading) {
            fetchMorePosts();
        }
    }, [hasMore, postsLoading, fetchMorePosts]);

    const toggleLocationIFrame = useCallback(() => {
        setShowLocationIFrame((prev) => !prev);
    }, []);

    const handleFollowToggle = useCallback(async () => {
        if (!currentUser || !userId || followLoading) return;

        try {
            setFollowLoading(true);

            if (isFollowing) {
                // Unfollow logic
                await Promise.all([
                    deleteDoc(doc(db, "users", userId, "followers", currentUser.uid)),
                    deleteDoc(doc(db, "users", currentUser.uid, "following", userId)),
                ]);

                const currentUserData = await getDoc(doc(db, "users", currentUser.uid));
                const currentUserDoc = currentUserData.exists() ? currentUserData.data() : null;
                const businessName = currentUserDoc?.businessName || currentUserDoc?.displayName || "Someone";

                await sendNotificationToUser(userId, {
                    title: "Lost a Follower",
                    message: `${businessName} has unfollowed you`,
                    type: "follower",
                    sender: "System",
                    whatsapp: false,
                    email: false,
                });

                toast.success("Unfollowed successfully");
            } else {
                // Follow logic
                await Promise.all([
                    setDoc(doc(db, "users", userId, "followers", currentUser.uid), {
                        uid: currentUser.uid,
                        timestamp: new Date(),
                    }),
                    setDoc(doc(db, "users", currentUser.uid, "following", userId), {
                        uid: userId,
                        timestamp: new Date(),
                    }),
                ]);

                const currentUserData = await getDoc(doc(db, "users", currentUser.uid));
                const currentUserDoc = currentUserData.exists() ? currentUserData.data() : null;
                const businessName = currentUserDoc?.businessName || currentUserDoc?.displayName || "Someone";

                await sendNotificationToUser(userId, {
                    title: "New Follower",
                    message: `${businessName} started following you`,
                    type: "follower",
                    sender: "System",
                    whatsapp: false,
                    email: false,
                });

                toast.success("Followed successfully");
            }
        } catch (error) {
            console.error("Error updating follow status:", error);
            toast.error("Failed to update follow status");
        } finally {
            setFollowLoading(false);
        }
    }, [currentUser, userId, isFollowing, followLoading]);

    // Memoized render for posts
    const renderPosts = useMemo(() => {
        if (postsError) {
            return (
                <div className="text-center py-12">
                    <FileTextIcon className="w-12 h-12 text-red-300 mx-auto mb-4" />
                    <p className="text-red-600 mb-2">Failed to load posts</p>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="rounded-full px-6"
                    >
                        Try Again
                    </Button>
                </div>
            );
        }

        if (postsLoading && !posts.length) {
            return (
                <div className="flex justify-center py-8">
                    <Loader />
                </div>
            );
        }

        if (!postsLoading && !posts.length) {
            return (
                <div className="text-center py-12">
                    <FileTextIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No posts yet.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {posts.map((post) => (
                        <div key={post.id} className="w-full">
                            <PostCard post={post} onView={() => router.push(`/feed/${post.id || post.postId}`)} compact />
                        </div>
                    ))}
                </div>
                {hasMore && (
                    <div className="flex justify-center pt-4">
                        <Button
                            variant="outline"
                            onClick={handleLoadMore}
                            disabled={postsLoading}
                            className="rounded-full px-6"
                        >
                            {postsLoading ? (
                                <>
                                    <Loader />
                                    Loading...
                                </>
                            ) : (
                                "Load More"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        );
    }, [posts, postsLoading, hasMore, handleLoadMore, postsError, router]);

    // Formatted date
    const formattedDate = useMemo(() => {
        if (!userData?.createdAt) return "";
        try {
            return new Date(userData.createdAt.toDate()).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            });
        } catch {
            return "";
        }
    }, [userData?.createdAt]);

    if (loading || userLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader />
                <span className="ml-3 text-gray-600">Loading profile...</span>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
                    <p className="text-gray-600 mb-6">This profile doesn&apos;t exist or is not available.</p>
                    <Button
                        onClick={() => router.push("/feed")}
                        className="rounded-2xl px-6 py-3 h-auto bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700"
                    >
                        Go to Feed
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-[1400px] w-full px-4">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Main content */}
                    <main className="flex-1 min-w-0 space-y-8">
                        {/* Profile Card - Enhanced with Fixed Spacing */}
                        <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl pt-0">
                            {/* Cover Image with Gradient Overlay */}
                            <div className="relative h-48 sm:h-56 lg:h-64 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                {isBusinessUser && (
                                    userData?.coverPic ? (
                                        <Dialog>
                                            <DialogTrigger className="z-30 w-full h-full group">
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={userData.coverPic}
                                                        width={1200}
                                                        height={256}
                                                        alt="Cover Image"
                                                        className="object-cover w-full h-full transition-all duration-500 group-hover:scale-105"
                                                        priority
                                                    />
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl font-bold">
                                                        Cover Image
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="mt-4 rounded-2xl overflow-hidden relative h-[400px]">
                                                    <Image
                                                        src={userData.coverPic}
                                                        fill
                                                        alt="Cover Image"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <span className="text-gray-500 font-medium">No Cover Image</span>
                                    )
                                )}
                            </div>

                            {/* Profile info with improved spacing */}
                            <div className="relative px-6 sm:px-8 pb-8 pt-4">
                                {/* Profile picture positioned over cover image */}
                                <div
                                    className={`${isBusinessUser
                                        ? "absolute -top-12 left-8 z-10"
                                        : "flex justify-center -mt-12 mb-6"
                                        }`}
                                >
                                    <Dialog>
                                        <DialogTrigger>
                                            <div className="relative group cursor-pointer bg-white rounded-full">
                                                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white shadow-2xl ring-4 ring-white/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-3xl">
                                                    {userData?.profilePic && (
                                                        <AvatarImage
                                                            src={userData.profilePic}
                                                            alt={userData?.name}
                                                            className="object-cover"
                                                        />
                                                    )}
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm text-center">
                                                        {userData?.profilePic ? (
                                                            isBusinessUser
                                                                ? userData?.businessName?.charAt(0) || "B"
                                                                : userData?.name?.charAt(0) || "U"
                                                        ) : (
                                                            <span className="text-xs px-2 truncate leading-tight">No Profile Image</span>
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {/* Subtle hover ring */}
                                                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold">
                                                    Profile Picture
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="mt-4 rounded-2xl overflow-hidden">
                                                <Image
                                                    src={userData?.profilePic || "/avatar.png"}
                                                    width={400}
                                                    height={400}
                                                    alt="Profile Image"
                                                    className="w-full object-cover"
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* Main content with proper spacing for profile picture */}
                                <div
                                    className={`${isBusinessUser ? "pt-20" : "pt-0"} space-y-6`}
                                >
                                    {/* Name, username and bio section */}
                                    <div className="space-y-4">
                                        {/* Name and badges */}
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="space-y-3">
                                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex flex-wrap items-center gap-3">
                                                        {isBusinessUser
                                                            ? userData?.businessName || userData?.name
                                                            : userData?.name}
                                                    </h1>

                                                    <div className="flex items-center text-gray-600 gap-2 text-lg">
                                                        <div className="p-2 rounded-full bg-gray-100">
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium">
                                                            @{userData?.username}
                                                        </span>
                                                    </div>

                                                    {formattedDate && (
                                                        <div className="flex items-center text-gray-500 gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span className="text-sm">Joined {formattedDate}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action buttons - Follow, Share, etc. */}
                                                <div className="flex flex-wrap gap-3 sm:flex-shrink-0">
                                                    {currentUser && (
                                                        <Button
                                                            onClick={handleFollowToggle}
                                                            variant={isFollowing ? "outline" : "default"}
                                                            className={cn(
                                                                "rounded-2xl px-6 py-3 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-300",
                                                                isFollowing
                                                                    ? "border-2 border-gray-300 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                                                                    : "bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white"
                                                            )}
                                                            disabled={followLoading}
                                                        >
                                                            {followLoading ? (
                                                                <>
                                                                    <Loader />
                                                                    <span className="ml-2">{isFollowing ? "Unfollowing..." : "Following..."}</span>
                                                                </>
                                                            ) : isFollowing ? (
                                                                <>
                                                                    <Minus className="w-4 h-4 mr-2" />
                                                                    Unfollow
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Plus className="w-4 h-4 mr-2" />
                                                                    Follow
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bio section */}
                                            {isBusinessUser && userData?.bio && (
                                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                                                    <p className="text-gray-700 leading-relaxed">
                                                        {userData.bio}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats row with enhanced design */}
                                    <div className="grid grid-cols-4 gap-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-6 border border-gray-200">
                                        {isBusinessUser ? (
                                            <>
                                                <FollowingDialog
                                                    followingCount={followingCount}
                                                    userId={userId}
                                                    viewOnly={true}
                                                    className="flex flex-col items-center"
                                                >
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                                            {followingCount}
                                                        </div>
                                                        <div className="text-sm text-gray-600 font-medium">
                                                            Following
                                                        </div>
                                                    </div>
                                                </FollowingDialog>

                                                <FollowerDialog
                                                    followerCount={followersCount}
                                                    userId={userId}
                                                    viewOnly={true}
                                                    className="flex flex-col items-center pl-4 border-l border-gray-300"
                                                >
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                                            {followersCount}
                                                        </div>
                                                        <div className="text-sm text-gray-600 font-medium">
                                                            Followers
                                                        </div>
                                                    </div>
                                                </FollowerDialog>

                                                <div className="flex flex-col items-center pl-4 border-l border-gray-300">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                                            {posts.length}
                                                        </div>
                                                        <div className="text-sm text-gray-600 font-medium">
                                                            Posts
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center pl-4 border-l border-gray-300">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                                            {userPhotos.length || 0}
                                                        </div>
                                                        <div className="text-sm text-gray-600 font-medium">
                                                            Photos
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="col-span-4 flex justify-center gap-8">
                                                <FollowingDialog
                                                    followingCount={followingCount}
                                                    userId={userId}
                                                    viewOnly={true}
                                                    className="flex flex-col items-center"
                                                >
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                                            {followingCount}
                                                        </div>
                                                        <div className="text-sm text-gray-600 font-medium">
                                                            Following
                                                        </div>
                                                    </div>
                                                </FollowingDialog>

                                                <FollowerDialog
                                                    followerCount={followersCount}
                                                    userId={userId}
                                                    viewOnly={true}
                                                    className="flex flex-col items-center"
                                                >
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                                            {followersCount}
                                                        </div>
                                                        <div className="text-sm text-gray-600 font-medium">
                                                            Followers
                                                        </div>
                                                    </div>
                                                </FollowerDialog>
                                            </div>
                                        )}
                                    </div>

                                    {/* Location map with modern styling */}
                                    {showLocationIFrame && (
                                        <div className="rounded-3xl border border-gray-200 overflow-hidden bg-white shadow-lg">
                                            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                                                <h3 className="font-bold text-lg flex items-center gap-3 text-gray-900">
                                                    <div className="p-2 rounded-xl bg-green-100">
                                                        <MapPinIcon className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    Business Location
                                                </h3>
                                                {userData?.locations?.address && (
                                                    <div className="mt-2 text-gray-700 ml-11">
                                                        {userData.locations.address}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="h-[350px] w-full relative">
                                                {userData?.location?.latitude &&
                                                    userData?.location?.longitude ? (
                                                    <MapComponent
                                                        location={{
                                                            lat: userData.location.latitude,
                                                            lng: userData.location.longitude,
                                                        }}
                                                        name={
                                                            isBusinessUser
                                                                ? userData?.businessName
                                                                : userData?.name
                                                        }
                                                        address={
                                                            userData?.locationAddress || userData?.locations?.address || "Location"
                                                        }
                                                        isCurrentUser={false}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col justify-center items-center h-full bg-gray-50 p-6 gap-4">
                                                        <div className="text-center">
                                                            <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                            <p className="text-gray-500 font-medium">
                                                                No location data available
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Content tabs with modern design */}
                        {isBusinessUser && (
                            <Suspense fallback={<LoadingSpinner />}>
                                <Card className="border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl">
                                    <Tabs defaultValue="posts" className="w-full">
                                        <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
                                            <TabsList className="justify-start h-auto p-0 bg-transparent w-full flex gap-6">
                                                <TabsTrigger
                                                    value="posts"
                                                    className={cn(
                                                        "rounded-none transition-all duration-300 border-b-2 border-transparent",
                                                        "data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                                                        "pb-4 pt-2 font-semibold text-sm flex items-center justify-center gap-2 hover:text-blue-600"
                                                    )}
                                                    title="View Posts"
                                                >
                                                    <div className="p-1.5 rounded-lg bg-blue-100">
                                                        <FileTextIcon className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span className="hidden sm:block">Posts</span>
                                                </TabsTrigger>

                                                <TabsTrigger
                                                    value="photos"
                                                    title="Photos"
                                                    className={cn(
                                                        "rounded-none transition-all duration-300 border-b-2 border-transparent",
                                                        "data-[state=active]:border-green-600 data-[state=active]:text-green-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                                                        "pb-4 pt-2 font-semibold text-sm flex items-center justify-center gap-2 hover:text-green-600"
                                                    )}
                                                >
                                                    <div className="p-1.5 rounded-lg bg-green-100">
                                                        <Images className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <span className="hidden sm:block">Photos</span>
                                                </TabsTrigger>

                                                {userData?.business_categories?.includes("product") && (
                                                    <TabsTrigger
                                                        title="Products"
                                                        value="products"
                                                        className={cn(
                                                            "rounded-none transition-all duration-300 border-b-2 border-transparent",
                                                            "data-[state=active]:border-orange-600 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                                                            "pb-4 pt-2 font-semibold text-sm flex items-center justify-center gap-2 hover:text-orange-600"
                                                        )}
                                                    >
                                                        <div className="p-1.5 rounded-lg bg-orange-100">
                                                            <SquareChartGantt className="w-4 h-4 text-orange-600" />
                                                        </div>
                                                        <span className="hidden sm:block">Products</span>
                                                    </TabsTrigger>
                                                )}

                                                {userData?.business_categories?.includes("service") && (
                                                    <TabsTrigger
                                                        value="services"
                                                        title="Services"
                                                        className={cn(
                                                            "rounded-none transition-all duration-300 border-b-2 border-transparent",
                                                            "data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                                                            "pb-4 pt-2 font-semibold text-sm flex items-center justify-center gap-2 hover:text-indigo-600"
                                                        )}
                                                    >
                                                        <div className="p-1.5 rounded-lg bg-indigo-100">
                                                            <Settings className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                        <span className="hidden sm:block">Services</span>
                                                    </TabsTrigger>
                                                )}

                                                {userData?.business_categories?.includes("real-estate") && (
                                                    <TabsTrigger
                                                        value="properties"
                                                        title="Properties"
                                                        className={cn(
                                                            "rounded-none transition-all duration-300 border-b-2 border-transparent",
                                                            "data-[state=active]:border-teal-600 data-[state=active]:text-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                                                            "pb-4 pt-2 font-semibold text-sm flex items-center justify-center gap-2 hover:text-teal-600"
                                                        )}
                                                    >
                                                        <div className="p-1.5 rounded-lg bg-teal-100">
                                                            <Home className="w-4 h-4 text-teal-600" />
                                                        </div>
                                                        <span className="hidden sm:block">Properties</span>
                                                    </TabsTrigger>
                                                )}
                                            </TabsList>
                                        </div>

                                        {/* Posts Tab Content */}
                                        <TabsContent
                                            value="posts"
                                            className="p-8 focus-visible:outline-none focus:outline-none transition-all duration-300 animate-in fade-in-50"
                                        >
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-2xl font-bold text-gray-900">
                                                        Posts
                                                    </h2>
                                                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                                        {posts.length} posts
                                                    </div>
                                                </div>
                                                {renderPosts}
                                            </div>
                                        </TabsContent>

                                        {/* Photos Tab Content */}
                                        <TabsContent
                                            value="photos"
                                            className="p-8 focus-visible:outline-none focus:outline-none transition-all duration-300 animate-in fade-in-50"
                                        >
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-2xl font-bold text-gray-900">
                                                        Photos
                                                    </h2>
                                                    <div className="text-sm text-gray-500 bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-200">
                                                        {userPhotos.length} photos
                                                    </div>
                                                </div>
                                                {loadingPhotos ? (
                                                    <div className="flex justify-center py-12">
                                                        <Loader />
                                                    </div>
                                                ) : userPhotos.length > 0 ? (
                                                    <PhotosGrid
                                                        userId={userId}
                                                    />
                                                ) : (
                                                    <div className="text-center py-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border border-green-100">
                                                        <div className="p-4 rounded-full bg-green-100 w-fit mx-auto mb-4">
                                                            <Images className="w-12 h-12 text-green-600" />
                                                        </div>
                                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                            No photos yet
                                                        </h3>
                                                        <p className="text-gray-600">
                                                            This business hasn&apos;t added any photos yet.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        {/* Products Tab Content */}
                                        {userData?.business_categories?.includes("product") && (
                                            <TabsContent
                                                value="products"
                                                className="p-8 focus-visible:outline-none focus:outline-none transition-all duration-300 animate-in fade-in-50"
                                            >
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-2xl font-bold text-gray-900">
                                                            Products
                                                        </h2>
                                                        <div className="text-sm text-gray-500 bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-200">
                                                            Business Products
                                                        </div>
                                                    </div>
                                                    {userData && (
                                                        <ShowProductsTabContent
                                                            userId={userId}
                                                            userData={userData}
                                                            isViewOnly={true}
                                                            currentUserView={false}
                                                        />
                                                    )}
                                                </div>
                                            </TabsContent>
                                        )}

                                        {/* Services Tab Content */}
                                        {userData?.business_categories?.includes("service") && (
                                            <TabsContent
                                                value="services"
                                                className="p-8 focus-visible:outline-none focus:outline-none transition-all duration-300 animate-in fade-in-50"
                                            >
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-2xl font-bold text-gray-900">
                                                            Services
                                                        </h2>
                                                        <div className="text-sm text-gray-500 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-200">
                                                            Business Services
                                                        </div>
                                                    </div>
                                                    {userData && (
                                                        <ShowServicesTabContent
                                                            userId={userId}
                                                            userData={userData}
                                                        />
                                                    )}
                                                </div>
                                            </TabsContent>
                                        )}

                                        {/* Properties Tab Content */}
                                        {userData?.business_categories?.includes("real-estate") && (
                                            <TabsContent
                                                value="properties"
                                                className="p-8 focus-visible:outline-none focus:outline-none transition-all duration-300 animate-in fade-in-50"
                                            >
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-2xl font-bold text-gray-900">
                                                            Properties
                                                        </h2>
                                                        <div className="text-sm text-gray-500 bg-teal-50 text-teal-600 px-3 py-1 rounded-full border border-teal-200">
                                                            Real Estate
                                                        </div>
                                                    </div>
                                                    {userData && <ShowBusinessProperties businessId={userId} />}
                                                </div>
                                            </TabsContent>
                                        )}
                                    </Tabs>
                                </Card>
                            </Suspense>
                        )}
                    </main>

                    {/* Right sidebar - Quick Actions */}
                    <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
                        <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl sticky">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                {/* Book Appointment */}
                                {userData?.acceptAppointments && currentUser && (
                                    <Dialog open={bookOpen} onOpenChange={setBookOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start gap-3 py-3 h-auto rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                Book Appointment
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold">Book Appointment</DialogTitle>
                                                <DialogDescription>
                                                    Select a date and time. Slots are in increments of {userData?.appointmentSlotMinutes || 30} minutes.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Date</label>
                                                    <Input
                                                        type="date"
                                                        value={selectedDate}
                                                        onChange={(e) => setSelectedDate(e.target.value)}
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                                {selectedDate && (
                                                    <>
                                                        {availableSlots.length === 0 ? (
                                                            <div className="text-sm text-muted-foreground bg-gray-50 rounded-xl p-3 text-center">Closed on selected date</div>
                                                        ) : (
                                                            <>
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-1">Start Time</label>
                                                                    <select
                                                                        className="w-full border rounded-xl px-3 py-2"
                                                                        value={selectedStart}
                                                                        onChange={(e) => setSelectedStart(e.target.value)}
                                                                    >
                                                                        {availableSlots.map((s) => (
                                                                            <option key={s} value={s}>{s}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-1">Duration (x slots)</label>
                                                                    <Input
                                                                        type="number"
                                                                        min={1}
                                                                        max={8}
                                                                        value={multiplier}
                                                                        onChange={(e) => setMultiplier(Number(e.target.value) || 1)}
                                                                        className="rounded-xl"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-1">End Time</label>
                                                                    <Input type="time" value={computedEnd || ""} readOnly className="rounded-xl" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-1">Notes</label>
                                                                    <Textarea
                                                                        placeholder="Share any details for the business"
                                                                        value={bookingDescription}
                                                                        onChange={(e) => setBookingDescription(e.target.value)}
                                                                        className="rounded-xl"
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setBookOpen(false)}
                                                        className="rounded-2xl"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={submitBooking}
                                                        disabled={bookingLoading || !computedEnd || availableSlots.length === 0}
                                                        className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                                    >
                                                        {bookingLoading ? (
                                                            <>
                                                                <Loader />
                                                                <span className="ml-2">Booking...</span>
                                                            </>
                                                        ) : (
                                                            "Confirm"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                {/* Location */}
                                {userData?.role === "business" && (
                                    <Button
                                        variant="outline"
                                        onClick={toggleLocationIFrame}
                                        className="w-full justify-start gap-3 py-3 h-auto rounded-2xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                                    >
                                        <MapPinIcon className="w-4 h-4" />
                                        {showLocationIFrame ? "Hide Location" : "View Location"}
                                    </Button>
                                )}

                                {/* More Information */}
                                {userData && (
                                    <MoreInformationDialog
                                        userData={userData}
                                        buttonClassName="w-full justify-start gap-3 py-3 h-auto rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    />
                                )}

                                {/* Share Business */}
                                {userData && (
                                    <ShareBusinessDialog
                                        userData={userData}
                                        buttonText="Share"
                                        buttonClassName="w-full justify-start gap-3 py-3 h-auto rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    />
                                )}

                                {/* Website */}
                                {userData?.website && (
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="w-full justify-start gap-3 py-3 h-auto rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                                    >
                                        <Link
                                            href={userData.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Visit Website
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}
