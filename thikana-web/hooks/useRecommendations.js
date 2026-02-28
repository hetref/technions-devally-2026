import { useState, useCallback, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    getDocs,
    doc,
    getDoc,
} from "firebase/firestore";

// ── Config (mirrors thikana-api/config.py) ────────────────────────────────
const MAX_RADIUS_KM = 10.0;
const RECENCY_WINDOW_HOURS = 168.0; // 7 days
const POST_WEIGHT_FOLLOWING = 0.55;
const POST_WEIGHT_LOCATION = 0.35;
const POST_WEIGHT_RECENCY = 0.10;
const GEOHASH_PRECISION = 5;

const FOLLOW_WEIGHT_LOCATION = 0.70;
const FOLLOW_WEIGHT_ACTIVITY = 0.30;
const MAX_POST_COUNT = 20;

/** Cache duration in ms — 60 seconds */
const CACHE_TTL = 60_000;

// ── Helpers ───────────────────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371.0;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Simple geohash encoder
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function encodeGeohash(lat, lon, precision = GEOHASH_PRECISION) {
    let minLat = -90, maxLat = 90;
    let minLon = -180, maxLon = 180;
    let hash = "";
    let isEven = true;
    let bit = 0;
    let ch = 0;

    while (hash.length < precision) {
        if (isEven) {
            const mid = (minLon + maxLon) / 2;
            if (lon >= mid) { ch |= 1 << (4 - bit); minLon = mid; } else { maxLon = mid; }
        } else {
            const mid = (minLat + maxLat) / 2;
            if (lat >= mid) { ch |= 1 << (4 - bit); minLat = mid; } else { maxLat = mid; }
        }
        isEven = !isEven;
        if (bit < 4) { bit++; } else { hash += BASE32[ch]; bit = 0; ch = 0; }
    }
    return hash;
}

const NEIGHBOR_MAP = {
    right:  { even: "bc01fg45238967deuvhjyznpkmstqrwx", odd: "p0r21436x8zb9dcf5h7kjnmqesgutwvy" },
    left:   { even: "238967debc01fg45uvhjyznpkmstqrwx", odd: "14telefonkms365h7k9dcfesgutwyp0r2qbxz8" },
    top:    { even: "p0r21436x8zb9dcf5h7kjnmqesgutwvy", odd: "bc01fg45238967deuvhjyznpkmstqrwx" },
    bottom: { even: "14365h7k9dcfesgutwyp0r2qbxz8", odd: "238967debc01fg45uvhjyznpkmstqrwx" },
};
const BORDER_MAP = {
    right:  { even: "bcfguvyz", odd: "prxz" },
    left:   { even: "0145hjnp", odd: "028b" },
    top:    { even: "prxz", odd: "bcfguvyz" },
    bottom: { even: "028b", odd: "0145hjnp" },
};

function getAdjacentGeohash(hash, direction) {
    const lastChar = hash[hash.length - 1];
    const type = hash.length % 2 === 0 ? "odd" : "even";
    let parent = hash.slice(0, -1);
    if (BORDER_MAP[direction][type].indexOf(lastChar) !== -1 && parent.length > 0) {
        parent = getAdjacentGeohash(parent, direction);
    }
    return parent + BASE32[NEIGHBOR_MAP[direction][type].indexOf(lastChar)];
}

function getSearchCells(lat, lon) {
    const center = encodeGeohash(lat, lon);
    try {
        const top = getAdjacentGeohash(center, "top");
        const bottom = getAdjacentGeohash(center, "bottom");
        const right = getAdjacentGeohash(center, "right");
        const left = getAdjacentGeohash(center, "left");
        return [center, top, bottom, right, left,
            getAdjacentGeohash(top, "right"), getAdjacentGeohash(top, "left"),
            getAdjacentGeohash(bottom, "right"), getAdjacentGeohash(bottom, "left"),
        ];
    } catch { return [center]; }
}

function parseTimestamp(ts) {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (ts._seconds) return new Date(ts._seconds * 1000);
    if (ts.seconds) return new Date(ts.seconds * 1000);
    if (typeof ts === "string") return new Date(ts);
    return new Date(ts);
}

function scorePost(post, followingSet, userLat, userLon, bizLocations) {
    const businessId = post.uid || "";
    const followingSignal = followingSet.has(businessId) ? 1.0 : 0.0;

    let locationSignal = 0.0;
    const bizLoc = bizLocations[businessId];
    if (bizLoc) {
        const dist = haversineKm(userLat, userLon, bizLoc.lat, bizLoc.lon);
        locationSignal = Math.max(0.0, 1.0 - dist / MAX_RADIUS_KM);
    }

    let recencySignal = 0.0;
    const date = parseTimestamp(post.createdAt);
    if (date && !isNaN(date.getTime())) {
        const hoursOld = (Date.now() - date.getTime()) / (1000 * 3600);
        recencySignal = Math.max(0.0, 1.0 - hoursOld / RECENCY_WINDOW_HOURS);
    }

    return (
        followingSignal * POST_WEIGHT_FOLLOWING +
        locationSignal * POST_WEIGHT_LOCATION +
        recencySignal * POST_WEIGHT_RECENCY
    );
}

/**
 * Gets the user's current GPS coordinates from the browser.
 */
function getCurrentPosition() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ lat: 19.076, lon: 72.877 });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve({ lat: 19.076, lon: 72.877 }),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    });
}

// ── Helper: extract business location ─────────────────────────────────────
function extractBizLocation(biz) {
    const loc = biz.location || biz._geoloc;
    if (!loc) return null;
    const lat = loc.latitude ?? loc.lat;
    const lon = loc.longitude ?? loc.lng;
    if (lat == null || lon == null) return null;
    return { lat, lon };
}

// ═══════════════════════════════════════════════════════════════════════════
// useFeed — fetches recommended posts directly from Firestore (client-side)
// ═══════════════════════════════════════════════════════════════════════════

export function useFeed(userId, limit = 15) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [locationDenied, setLocationDenied] = useState(false);
    const cacheRef = useRef({ data: null, timestamp: 0 });

    const fetchFeed = useCallback(async (isRefresh = false) => {
        if (!userId) { setLoading(false); return; }

        // Cache check
        if (!isRefresh && cacheRef.current.data && Date.now() - cacheRef.current.timestamp < CACHE_TTL) {
            setPosts(cacheRef.current.data);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { lat, lon } = await getCurrentPosition();
            setLocationDenied(false);
            console.log("[Feed] User at:", lat, lon);

            // 1. Get following IDs
            const followingSnap = await getDocs(
                collection(db, "users", userId, "following")
            );
            const followingIds = followingSnap.docs.map((d) => d.id);
            const followingSet = new Set(followingIds);
            console.log("[Feed] Following:", followingIds.length, "businesses");

            // 2. Get nearby businesses via location_index
            const searchCells = getSearchCells(lat, lon);
            const nearbyIds = new Set();

            for (const cell of searchCells) {
                try {
                    const cellDoc = await getDoc(doc(db, "location_index", cell));
                    if (cellDoc.exists()) {
                        const ids = cellDoc.data()?.business_ids || [];
                        ids.forEach((id) => nearbyIds.add(id));
                    }
                } catch { /* skip */ }
            }
            console.log("[Feed] Nearby from location_index:", nearbyIds.size);

            // 2b. Fallback: scan businesses collection if location_index is empty
            if (nearbyIds.size === 0) {
                console.log("[Feed] Fallback: scanning businesses collection");
                const allBizSnap = await getDocs(collection(db, "businesses"));
                for (const bizDoc of allBizSnap.docs) {
                    const loc = extractBizLocation(bizDoc.data());
                    if (loc) {
                        const dist = haversineKm(lat, lon, loc.lat, loc.lon);
                        if (dist <= MAX_RADIUS_KM) nearbyIds.add(bizDoc.id);
                    }
                }
                console.log("[Feed] Fallback found:", nearbyIds.size, "nearby businesses");
            }

            // 3. Union candidates
            const candidateIds = [...new Set([...followingIds, ...nearbyIds])].filter(
                (id) => id !== userId
            );
            console.log("[Feed] Total candidates:", candidateIds.length);

            if (candidateIds.length === 0) {
                setPosts([]);
                setHasMore(false);
                cacheRef.current = { data: [], timestamp: Date.now() };
                setLoading(false);
                return;
            }

            // 4. Fetch business metadata (batch in groups of 10)
            const businesses = {};
            const bizLocations = {};
            const nearbyDistances = {};

            for (let i = 0; i < candidateIds.length; i += 10) {
                const batch = candidateIds.slice(i, i + 10);
                for (const bizId of batch) {
                    try {
                        const bizDoc = await getDoc(doc(db, "businesses", bizId));
                        if (bizDoc.exists()) {
                            const data = bizDoc.data();
                            businesses[bizId] = data;
                            const loc = extractBizLocation(data);
                            if (loc) {
                                bizLocations[bizId] = loc;
                                nearbyDistances[bizId] = Math.round(haversineKm(lat, lon, loc.lat, loc.lon) * 100) / 100;
                            }
                        }
                    } catch { /* skip */ }
                }
            }

            // 5. Fetch posts for candidates (batch in groups of 10)
            const allPosts = [];
            for (let i = 0; i < candidateIds.length; i += 10) {
                const batch = candidateIds.slice(i, i + 10);
                try {
                    const postsQuery = query(
                        collection(db, "posts"),
                        where("uid", "in", batch),
                        orderBy("createdAt", "desc"),
                        firestoreLimit(5 * batch.length)
                    );
                    const postsSnap = await getDocs(postsQuery);
                    for (const postDoc of postsSnap.docs) {
                        allPosts.push({ id: postDoc.id, ...postDoc.data() });
                    }
                } catch (e) {
                    console.warn("[Feed] Posts query error for batch:", e.message);
                }
            }
            console.log("[Feed] Found", allPosts.length, "posts");

            // 6. Score, deduplicate, sort
            const seen = new Set();
            const scored = [];

            for (const post of allPosts) {
                if (seen.has(post.id) || post.uid === userId) continue;
                seen.add(post.id);

                const score = scorePost(post, followingSet, lat, lon, bizLocations);
                const biz = businesses[post.uid] || {};
                const dist = nearbyDistances[post.uid];

                scored.push({
                    id: post.id,
                    postId: post.id,
                    uid: post.uid,
                    title: post.title || post.caption || "",
                    caption: post.caption || post.title || "",
                    content: post.content || post.description || "",
                    mediaUrl: post.mediaUrl || post.imageUrl || "",
                    imageUrl: post.imageUrl || post.mediaUrl || "",
                    likeCount: post.likeCount || post.interactions?.likeCount || 0,
                    likes: post.likeCount || post.interactions?.likeCount || 0,
                    createdAt: post.createdAt,
                    score: Math.round(score * 10000) / 10000,
                    recommendation_type: followingSet.has(post.uid) ? "followed" : "nearby",
                    distance_km: dist != null ? dist : null,
                    authorName: biz.businessName || biz.business_name || biz.name || "",
                    authorUsername: biz.username || "",
                    authorProfileImage: biz.profilePic || biz.profileImage || "/default-avatar.png",
                    businessType: biz.businessType || biz.business_type || "",
                    isLiked: false,
                });
            }

            scored.sort((a, b) => b.score - a.score);
            const results = scored.slice(0, limit);

            if (isRefresh) {
                setPosts(results);
            } else {
                setPosts((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const unique = results.filter((p) => !existingIds.has(p.id));
                    return [...prev, ...unique];
                });
            }

            cacheRef.current = { data: results, timestamp: Date.now() };
            setHasMore(results.length >= limit);
        } catch (err) {
            console.error("[Feed] Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, limit]);

    useEffect(() => {
        fetchFeed(true);
    }, [fetchFeed]);

    return { posts, loading, error, hasMore, locationDenied, fetchFeed };
}

// ═══════════════════════════════════════════════════════════════════════════
// useWhoToFollow — finds nearby businesses the user doesn't follow yet
// ═══════════════════════════════════════════════════════════════════════════

export function useWhoToFollow(userId, limit = 10) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSuggestions = useCallback(async () => {
        if (!userId) { setLoading(false); return; }

        try {
            setLoading(true);
            setError(null);

            const { lat, lon } = await getCurrentPosition();

            // Get following IDs
            const followingSnap = await getDocs(
                collection(db, "users", userId, "following")
            );
            const followingSet = new Set(followingSnap.docs.map((d) => d.id));

            // Get all businesses
            const allBizSnap = await getDocs(collection(db, "businesses"));
            const candidates = [];

            for (const bizDoc of allBizSnap.docs) {
                const bizId = bizDoc.id;
                if (followingSet.has(bizId) || bizId === userId) continue;

                const data = bizDoc.data();
                const loc = extractBizLocation(data);
                if (!loc) continue;

                const dist = haversineKm(lat, lon, loc.lat, loc.lon);
                if (dist > MAX_RADIUS_KM) continue;

                const distRounded = Math.round(dist * 100) / 100;
                const postCount = data.postCount || 0;

                const locationSignal = Math.max(0.0, 1.0 - dist / MAX_RADIUS_KM);
                const activitySignal = Math.min(postCount, MAX_POST_COUNT) / MAX_POST_COUNT;
                const score = locationSignal * FOLLOW_WEIGHT_LOCATION + activitySignal * FOLLOW_WEIGHT_ACTIVITY;

                candidates.push({
                    id: bizId,
                    businessName: data.businessName || data.business_name || data.name || "",
                    username: data.username || "",
                    businessType: data.businessType || data.business_type || "",
                    profilePic: data.profilePic || data.profileImage || "",
                    distance_km: distRounded,
                    postCount,
                    score: Math.round(score * 10000) / 10000,
                });
            }

            candidates.sort((a, b) => b.score - a.score);
            setSuggestions(candidates.slice(0, limit));
        } catch (err) {
            console.error("[WhoToFollow] Error:", err);
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
