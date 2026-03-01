/**
 * GET /api/discovery/who-to-follow/[userId]?lat=...&lon=...&limit=10
 *
 * Returns nearby businesses the user doesn't follow yet.
 * Scoring: 70% proximity + 30% activity (post count).
 */

import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

const MAX_RADIUS_KM = 10.0;
const MAX_POST_COUNT = 20;
const FOLLOW_WEIGHT_LOCATION = 0.70;
const FOLLOW_WEIGHT_ACTIVITY = 0.30;

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

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lon = parseFloat(searchParams.get("lon"));
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: "lat and lon query params are required" },
        { status: 400 }
      );
    }

    // Get following IDs
    const followingSnapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("following")
      .get();
    const followingSet = new Set(followingSnapshot.docs.map((d) => d.id));

    // Get all businesses with location data
    const allBusinesses = await adminDb.collection("businesses").get();
    const candidates = [];

    for (const doc of allBusinesses.docs) {
      const bizId = doc.id;
      // Skip already followed and self
      if (followingSet.has(bizId) || bizId === userId) continue;

      const data = doc.data();
      const loc = data.location || data._geoloc;
      if (!loc) continue;

      const bLat = loc.latitude || loc.lat;
      const bLon = loc.longitude || loc.lng;
      if (bLat == null || bLon == null) continue;

      const dist = haversineKm(lat, lon, bLat, bLon);
      if (dist > MAX_RADIUS_KM) continue;

      const distRounded = Math.round(dist * 100) / 100;
      const postCount = data.postCount || 0;

      // Score
      const locationSignal = Math.max(0.0, 1.0 - dist / MAX_RADIUS_KM);
      const activitySignal = Math.min(postCount, MAX_POST_COUNT) / MAX_POST_COUNT;
      const score =
        locationSignal * FOLLOW_WEIGHT_LOCATION +
        activitySignal * FOLLOW_WEIGHT_ACTIVITY;

      candidates.push({
        id: bizId,
        businessName: data.businessName || data.business_name || data.name || "",
        username: data.username || "",
        businessType: data.businessType || data.business_type || "",
        profilePic: data.profilePic || data.profileImage || "",
        distance_km: distRounded,
        postCount: postCount,
        score: Math.round(score * 10000) / 10000,
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    const results = candidates.slice(0, limit);

    return NextResponse.json({
      user_id: userId,
      count: results.length,
      suggestions: results,
    });
  } catch (error) {
    console.error("[Who-to-Follow API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
