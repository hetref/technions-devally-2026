/**
 * GET /api/feed/[userId]?lat=...&lon=...&limit=20
 *
 * Next.js API route that implements the same recommendation logic as the
 * Python FastAPI backend, but uses the Firebase Admin SDK that's already
 * authenticated in the Next.js app.
 *
 * Scoring weights (same as Python model):
 *   Following signal:  55%
 *   Location signal:   35%  (1.0 at 0km → 0.0 at 10km)
 *   Recency signal:    10%  (1.0 = just posted, 0.0 = 7+ days old)
 */

import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

// ── Config (mirrors thikana-api/config.py) ────────────────────────────────
const MAX_RADIUS_KM = 10.0;
const RECENCY_WINDOW_HOURS = 168.0; // 7 days
const POST_WEIGHT_FOLLOWING = 0.55;
const POST_WEIGHT_LOCATION = 0.35;
const POST_WEIGHT_RECENCY = 0.10;
const GEOHASH_PRECISION = 5;

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

// Simple geohash implementation (precision-5, ~5km cells)
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
      if (lon >= mid) {
        ch |= 1 << (4 - bit);
        minLon = mid;
      } else {
        maxLon = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= 1 << (4 - bit);
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

function getAdjacentGeohash(hash, direction) {
  const NEIGHBORS = {
    right:  { even: "bc01fg45238967deuvhjyznpkmstqrwx", odd: "p0r21436x8zb9dcf5h7kjnmqesgutwvy" },
    left:   { even: "238967debc01fg45telefonkmsuvhjyznpqrwx", odd: "14365h7k9dcfesgutwyp0r2qbxz8" },
    top:    { even: "p0r21436x8zb9dcf5h7kjnmqesgutwvy", odd: "bc01fg45238967deuvhjyznpkmstqrwx" },
    bottom: { even: "14365h7k9dcfesgutwyp0r2qbxz8", odd: "238967debc01fg45telefonkmsuvhjyznpqrwx" },
  };
  const BORDERS = {
    right:  { even: "bcfguvyz", odd: "prxz" },
    left:   { even: "0145hjnp", odd: "028b" },
    top:    { even: "prxz",     odd: "bcfguvyz" },
    bottom: { even: "028b",     odd: "0145hjnp" },
  };

  const lastChar = hash[hash.length - 1];
  const type = hash.length % 2 === 0 ? "odd" : "even";
  let parent = hash.slice(0, -1);

  if (BORDERS[direction][type].indexOf(lastChar) !== -1 && parent.length > 0) {
    parent = getAdjacentGeohash(parent, direction);
  }

  return parent + BASE32[NEIGHBORS[direction][type].indexOf(lastChar)];
}

function getSearchCells(lat, lon) {
  const center = encodeGeohash(lat, lon);
  try {
    const top = getAdjacentGeohash(center, "top");
    const bottom = getAdjacentGeohash(center, "bottom");
    const right = getAdjacentGeohash(center, "right");
    const left = getAdjacentGeohash(center, "left");
    const topRight = getAdjacentGeohash(top, "right");
    const topLeft = getAdjacentGeohash(top, "left");
    const bottomRight = getAdjacentGeohash(bottom, "right");
    const bottomLeft = getAdjacentGeohash(bottom, "left");
    return [center, top, bottom, right, left, topRight, topLeft, bottomRight, bottomLeft];
  } catch {
    // If neighbor computation fails, just use center cell
    return [center];
  }
}

// ── Scoring ───────────────────────────────────────────────────────────────

function scorePost(post, followingSet, userLat, userLon, bizLocations) {
  const businessId = post.uid || "";

  // Following signal (binary)
  const followingSignal = followingSet.has(businessId) ? 1.0 : 0.0;

  // Location signal
  let locationSignal = 0.0;
  const bizLoc = bizLocations[businessId];
  if (bizLoc && bizLoc.latitude != null && bizLoc.longitude != null) {
    const dist = haversineKm(userLat, userLon, bizLoc.latitude, bizLoc.longitude);
    locationSignal = Math.max(0.0, 1.0 - dist / MAX_RADIUS_KM);
  }

  // Recency signal
  let recencySignal = 0.0;
  const createdAt = post.createdAt;
  if (createdAt) {
    let date;
    if (createdAt._seconds) {
      date = new Date(createdAt._seconds * 1000);
    } else if (createdAt.toDate) {
      date = createdAt.toDate();
    } else if (typeof createdAt === "string") {
      date = new Date(createdAt);
    } else {
      date = new Date(createdAt);
    }
    if (!isNaN(date.getTime())) {
      const hoursOld = (Date.now() - date.getTime()) / (1000 * 3600);
      recencySignal = Math.max(0.0, 1.0 - hoursOld / RECENCY_WINDOW_HOURS);
    }
  }

  return (
    followingSignal * POST_WEIGHT_FOLLOWING +
    locationSignal * POST_WEIGHT_LOCATION +
    recencySignal * POST_WEIGHT_RECENCY
  );
}

// ── Main handler ──────────────────────────────────────────────────────────

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lon = parseFloat(searchParams.get("lon"));
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: "lat and lon query params are required" },
        { status: 400 }
      );
    }

    // Step 1: Get following IDs
    const followingSnapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("following")
      .get();
    const followingIds = followingSnapshot.docs.map((d) => d.id);
    const followingSet = new Set(followingIds);

    // Step 2: Get nearby businesses via location_index
    const searchCells = getSearchCells(lat, lon);
    const nearbyBusinessIds = new Set();

    // Fetch location_index documents for all geohash cells
    for (const cell of searchCells) {
      try {
        const cellDoc = await adminDb.collection("location_index").doc(cell).get();
        if (cellDoc.exists) {
          const ids = cellDoc.data()?.business_ids || [];
          ids.forEach((id) => nearbyBusinessIds.add(id));
        }
      } catch (e) {
        // Cell doesn't exist, skip
      }
    }

    // Step 3: Also try to find ALL businesses with location data
    // (fallback if location_index hasn't been populated yet)
    if (nearbyBusinessIds.size === 0) {
      console.log("[Feed API] No location_index entries found, falling back to scanning businesses collection");
      const allBusinesses = await adminDb.collection("businesses").get();
      for (const doc of allBusinesses.docs) {
        const data = doc.data();
        const loc = data.location || data._geoloc;
        if (loc) {
          const bLat = loc.latitude || loc.lat;
          const bLon = loc.longitude || loc.lng;
          if (bLat != null && bLon != null) {
            const dist = haversineKm(lat, lon, bLat, bLon);
            if (dist <= MAX_RADIUS_KM) {
              nearbyBusinessIds.add(doc.id);
            }
          }
        }
      }
    }

    // Step 3b: Union followed + nearby, exclude self
    const candidateIds = [...new Set([...followingIds, ...nearbyBusinessIds])].filter(
      (id) => id !== userId
    );

    if (candidateIds.length === 0) {
      return NextResponse.json({
        user_id: userId,
        count: 0,
        posts: [],
      });
    }

    // Step 4: Fetch business metadata (batch in groups of 10 for Firestore 'in' limit)
    const businesses = {};
    for (let i = 0; i < candidateIds.length; i += 10) {
      const batch = candidateIds.slice(i, i + 10);
      const refs = batch.map((id) => adminDb.collection("businesses").doc(id));
      const docs = await adminDb.getAll(...refs);
      for (const doc of docs) {
        if (doc.exists) {
          businesses[doc.id] = { id: doc.id, ...doc.data() };
        }
      }
    }

    // Build location map
    const bizLocations = {};
    const nearbyDistances = {};
    for (const [bizId, biz] of Object.entries(businesses)) {
      const loc = biz.location || biz._geoloc;
      if (loc) {
        const bLat = loc.latitude || loc.lat;
        const bLon = loc.longitude || loc.lng;
        if (bLat != null && bLon != null) {
          bizLocations[bizId] = { latitude: bLat, longitude: bLon };
          nearbyDistances[bizId] = Math.round(haversineKm(lat, lon, bLat, bLon) * 100) / 100;
        }
      }
    }

    // Step 5: Fetch posts for all candidate businesses
    const allPosts = [];
    for (let i = 0; i < candidateIds.length; i += 10) {
      const batch = candidateIds.slice(i, i + 10);
      const postsQuery = adminDb
        .collection("posts")
        .where("uid", "in", batch)
        .orderBy("createdAt", "desc")
        .limit(5 * batch.length);

      const postsSnapshot = await postsQuery.get();
      for (const doc of postsSnapshot.docs) {
        allPosts.push({ id: doc.id, ...doc.data() });
      }
    }

    // Step 6: Score, deduplicate, sort
    const seen = new Set();
    const scored = [];

    for (const post of allPosts) {
      const postId = post.id;
      const businessId = post.uid;

      if (seen.has(postId) || businessId === userId) continue;
      seen.add(postId);

      const score = scorePost(post, followingSet, lat, lon, bizLocations);
      const biz = businesses[businessId] || {};
      const dist = nearbyDistances[businessId];

      // Convert Firestore Timestamp to ISO string for JSON serialization
      let createdAtStr = null;
      if (post.createdAt) {
        if (post.createdAt._seconds) {
          createdAtStr = new Date(post.createdAt._seconds * 1000).toISOString();
        } else if (post.createdAt.toDate) {
          createdAtStr = post.createdAt.toDate().toISOString();
        } else {
          createdAtStr = post.createdAt;
        }
      }

      scored.push({
        id: postId,
        postId: postId,
        uid: businessId,
        title: post.title || post.caption || "",
        caption: post.caption || post.title || "",
        content: post.content || post.description || "",
        mediaUrl: post.mediaUrl || post.imageUrl || "",
        imageUrl: post.imageUrl || post.mediaUrl || "",
        likeCount: post.likeCount || post.interactions?.likeCount || 0,
        likes: post.likeCount || post.interactions?.likeCount || 0,
        createdAt: createdAtStr,
        score: Math.round(score * 10000) / 10000,
        recommendation_type: followingSet.has(businessId) ? "followed" : "nearby",
        distance_km: dist != null ? dist : null,
        authorName: biz.businessName || biz.business_name || biz.name || "",
        authorUsername: biz.username || "",
        authorProfileImage: biz.profilePic || biz.profileImage || "/default-avatar.png",
        businessType: biz.businessType || biz.business_type || "",
        business: {
          businessName: biz.businessName || biz.business_name || biz.name || "",
          username: biz.username || "",
          businessType: biz.businessType || biz.business_type || "",
          profilePic: biz.profilePic || biz.profileImage || "",
        },
        isLiked: false,
      });
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, limit);

    return NextResponse.json({
      user_id: userId,
      count: results.length,
      posts: results,
    });
  } catch (error) {
    console.error("[Feed API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
