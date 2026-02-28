import { useState, useCallback, useEffect, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_RECOMMENDATION_API || "http://localhost:8000";

/** Cache duration in ms — 60 seconds as recommended by API docs */
const CACHE_TTL = 60_000;

/**
 * Gets the user's current GPS coordinates from the browser.
 * Rejects if permission denied or geolocation unsupported.
 */
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}

/**
 * Normalizes a single API post into the shape PostCard expects.
 * Handles field name differences between the API response and Firestore schema.
 */
function normalizePost(post) {
    return {
        ...post,
        postId: post.id,
        title: post.title || post.caption || "",
        caption: post.caption || post.title || "",
        content: post.content || post.description || post.caption || "",
        mediaUrl: post.mediaUrl || post.imageUrl || "",
        imageUrl: post.imageUrl || post.mediaUrl || "",
        likes: post.likeCount || post.interactions?.likeCount || 0,
        likeCount: post.likeCount || post.interactions?.likeCount || 0,
        authorName: post.business?.businessName || post.authorName || "",
        authorUsername: post.business?.username || post.authorUsername || "",
        authorProfileImage: post.business?.profilePic || post.authorProfileImage || "/default-avatar.png",
        businessType: post.business?.businessType || post.businessType || "",
        isLiked: false,
    };
}

/** Hook: fetch the user's post feed */
export function useFeed(userId, limit = 15) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [locationDenied, setLocationDenied] = useState(false);
    const cacheRef = useRef({ data: null, timestamp: 0 });
    const abortRef = useRef(null);

    const fetchFeed = useCallback(async (isRefresh = false) => {
        if (!userId) {
            setLoading(false);
            return;
        }

        // Use cache if valid and not a manual refresh
        if (
            !isRefresh &&
            cacheRef.current.data &&
            Date.now() - cacheRef.current.timestamp < CACHE_TTL
        ) {
            setPosts(cacheRef.current.data);
            setLoading(false);
            return;
        }

        // Abort any in-flight request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            setLoading(true);
            setError(null);

            let lat, lon;
            try {
                const coords = await getCurrentPosition();
                lat = coords.lat;
                lon = coords.lon;
                setLocationDenied(false);
            } catch (locationErr) {
                console.warn("Location unavailable:", locationErr.message);
                setLocationDenied(true);
                setError("Location access is required for your personalized feed. Please enable location permissions.");
                setLoading(false);
                return;
            }

            const url = new URL(`${API_BASE}/feed/${userId}`);
            url.searchParams.set("lat", lat);
            url.searchParams.set("lon", lon);
            url.searchParams.set("limit", limit);

            const res = await fetch(url.toString(), { signal: controller.signal });

            if (!res.ok) {
                if (res.status === 404) throw new Error("User not found. Please complete your profile setup.");
                if (res.status === 400) throw new Error("Invalid location data. Please try refreshing.");
                throw new Error(`Failed to load feed (${res.status}). Please try again.`);
            }

            const data = await res.json();
            const newPosts = (data.posts || []).map(normalizePost);

            if (isRefresh) {
                setPosts(newPosts);
            } else {
                setPosts((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const unique = newPosts.filter((p) => !existingIds.has(p.id));
                    return [...prev, ...unique];
                });
            }

            // Cache the result
            cacheRef.current = { data: newPosts, timestamp: Date.now() };
            setHasMore(newPosts.length >= limit);
        } catch (err) {
            if (err.name === "AbortError") return;
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, limit]);

    useEffect(() => {
        fetchFeed(true);
        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, [fetchFeed]);

    return { posts, loading, error, hasMore, locationDenied, fetchFeed };
}

/** Hook: fetch Who to Follow suggestions */
export function useWhoToFollow(userId, limit = 10) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSuggestions = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            let lat, lon;
            try {
                const coords = await getCurrentPosition();
                lat = coords.lat;
                lon = coords.lon;
            } catch (locationErr) {
                console.warn("Location error for who-to-follow:", locationErr.message);
                setLoading(false);
                return;
            }

            const url = new URL(`${API_BASE}/discovery/who-to-follow/${userId}`);
            url.searchParams.set("lat", lat);
            url.searchParams.set("lon", lon);
            url.searchParams.set("limit", limit);

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            setSuggestions(data.suggestions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, limit]);

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    return { suggestions, loading, error, refetch: fetchSuggestions };
}
