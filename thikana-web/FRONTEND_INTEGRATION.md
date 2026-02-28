# Thikana Recommendation API — Frontend Integration Guide

> For the **Next.js** app team. Everything you need to integrate with the recommendation model.

---

## Table of Contents

1. [What the API does](#what-the-api-does)
2. [Running the API locally](#running-the-api-locally)
3. [API Endpoints](#api-endpoints)
   - [GET /feed/{user_id}](#get-feeduser_id)
   - [GET /discovery/who-to-follow/{user_id}](#get-discoverywho-to-followuser_id)
4. [What you must write to Firestore](#what-you-must-write-to-firestore)
   - [On business registration / location update](#1-on-business-registration--location-update)
   - [On post created](#2-on-post-created)
   - [On post deleted](#3-on-post-deleted)
   - [On business location change](#4-on-business-location-change)
5. [Firestore data schema required](#firestore-data-schema-required)
6. [Next.js code snippets](#nextjs-code-snippets)
   - [Install dependencies](#install-dependencies)
   - [Geohash utility](#geohash-utility)
   - [Firestore write helpers](#firestore-write-helpers)
   - [API fetch hooks](#api-fetch-hooks)
   - [Feed component example](#feed-component-example)
7. [Environment variables](#environment-variables)
8. [Error handling](#error-handling)
9. [FAQ](#faq)

---

## What the API does

The recommendation model is a **FastAPI** Python backend. Your Next.js app calls it via HTTP — it is **separate** from your Firestore.

| Endpoint | What it returns |
|---|---|
| `/feed/{user_id}` | Ranked list of posts for the user's home feed |
| `/discovery/who-to-follow/{user_id}` | Nearby businesses the user should follow |

**Ranking signals:**

| Signal | Feed weight | Who to Follow weight |
|---|---|---|
| Is from a followed business | **55%** | — |
| Distance from user location | **35%** | **70%** |
| Post freshness (recency) | **10%** | — |
| Business posting activity | — | **30%** |

---

## Running the API Locally

```bash
cd updated-recomendation-model
pip install -r requirements.txt
uvicorn main:app --reload
# API runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

In your Next.js `.env.local`:
```
NEXT_PUBLIC_RECOMMENDATION_API=http://localhost:8000
```

---

## API Endpoints

### `GET /feed/{user_id}`

Returns a ranked list of posts for the user's home feed.

#### Request

```
GET /feed/user_abc123?lat=18.5204&lon=73.8567&limit=20
```

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `user_id` | path | ✅ | — | Firebase Auth UID of the current user |
| `lat` | query | ✅ | — | User's current latitude |
| `lon` | query | ✅ | — | User's current longitude |
| `limit` | query | ❌ | `20` | Max posts to return (1–50) |

> ⚠️ **`lat` and `lon` are required.** Always send fresh browser GPS — not stored coordinates from Firestore. Fresh coordinates give accurate nearby results.

#### Response `200 OK`

```json
{
  "user_id": "user_abc123",
  "count": 7,
  "posts": [
    {
      "id": "post_001",
      "uid": "biz_001",
      "caption": "Fresh cutting chai is ready! Come visit us.",
      "imageUrl": "https://...",
      "likeCount": 48,
      "createdAt": "2026-02-28T07:30:00Z",
      "score": 0.9974,
      "recommendation_type": "followed",
      "distance_km": 0.07,
      "business": {
        "businessName": "Chai Corner",
        "username": "chaicorner",
        "businessType": "Cafe"
      }
    },
    {
      "id": "post_003",
      "uid": "biz_002",
      "caption": "Freshly baked croissants every morning!",
      "imageUrl": "https://...",
      "likeCount": 35,
      "createdAt": "2026-02-28T06:00:00Z",
      "score": 0.3842,
      "recommendation_type": "nearby",
      "distance_km": 0.62,
      "business": {
        "businessName": "Pune Bakes",
        "username": "punebakes",
        "businessType": "Bakery"
      }
    }
  ]
}
```

#### Key response fields

| Field | Description |
|---|---|
| `recommendation_type` | `"followed"` or `"nearby"` — show a label badge in post card UI |
| `score` | Float 0.0–1.0 — ranking score (higher = more relevant) |
| `distance_km` | Distance from user to the business |
| `business` | Author info already included — no extra Firestore read needed |

---

### `GET /discovery/who-to-follow/{user_id}`

Returns nearby businesses the user doesn't follow yet.

#### Request

```
GET /discovery/who-to-follow/user_abc123?lat=18.5204&lon=73.8567&limit=10
```

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `user_id` | path | ✅ | — | Firebase Auth UID |
| `lat` | query | ✅ | — | User's current latitude |
| `lon` | query | ✅ | — | User's current longitude |
| `limit` | query | ❌ | `10` | Max suggestions (1–30) |

#### Response `200 OK`

```json
{
  "user_id": "user_abc123",
  "count": 3,
  "suggestions": [
    {
      "id": "biz_002",
      "businessName": "Pune Bakes",
      "username": "punebakes",
      "businessType": "Bakery",
      "distance_km": 0.62,
      "postCount": 5,
      "score": 0.7316
    }
  ]
}
```

---

## What You Must Write to Firestore

> **This is the most critical section.** The API only reads Firestore — your Next.js app writes it.  
> If these writes don't happen correctly, the recommendation model won't work.

### 1. On Business Registration / Location Update

**Write to `businesses/{businessId}`:**
```js
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

await setDoc(doc(db, "businesses", businessId), {
  businessName: "...",
  username: "...",
  businessType: "...",
  location: {
    latitude: lat,
    longitude: lon,
  },
  postCount: 0,           // ← REQUIRED by recommendation model
  lastPostedAt: null,     // ← REQUIRED by recommendation model
}, { merge: true });
```

**Also write to `location_index/{geohashCell}`:**
```js
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import ngeohash from "ngeohash";

const geohashCell = ngeohash.encode(lat, lon, 5); // precision = 5

await setDoc(doc(db, "location_index", geohashCell), {
  business_ids: arrayUnion(businessId),
}, { merge: true }); // merge:true is critical — don't overwrite other businesses
```

---

### 2. On Post Created

```js
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

// Step 1: Create the post (same as you do now)
await addDoc(collection(db, "posts"), {
  uid: businessId,
  caption: caption,
  imageUrl: imageUrl,
  likeCount: 0,
  createdAt: serverTimestamp(),
});

// Step 2: Update business counters  ← ADD THIS
await updateDoc(doc(db, "businesses", businessId), {
  postCount: increment(1),
  lastPostedAt: serverTimestamp(),
});
```

---

### 3. On Post Deleted

```js
import { doc, deleteDoc, updateDoc, increment } from "firebase/firestore";

// Step 1: Delete the post
await deleteDoc(doc(db, "posts", postId));

// Step 2: Decrement counter  ← ADD THIS
await updateDoc(doc(db, "businesses", businessId), {
  postCount: increment(-1),
});
```

---

### 4. On Business Location Change

```js
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import ngeohash from "ngeohash";

const oldCell = ngeohash.encode(oldLat, oldLon, 5);
const newCell = ngeohash.encode(newLat, newLon, 5);

if (oldCell !== newCell) {
  // Remove from old geohash cell
  await updateDoc(doc(db, "location_index", oldCell), {
    business_ids: arrayRemove(businessId),
  });

  // Add to new geohash cell
  await setDoc(doc(db, "location_index", newCell), {
    business_ids: arrayUnion(businessId),
  }, { merge: true });
}

// Update the business document
await updateDoc(doc(db, "businesses", businessId), {
  location: { latitude: newLat, longitude: newLon },
});
```

---

## Firestore Data Schema Required

### `businesses/{businessId}`
```
businessName    string      "Chai Corner"
username        string      "chaicorner"
businessType    string      "Cafe"
location
  latitude      number      18.5204
  longitude     number      73.8567
postCount       number      18          ← REQUIRED
lastPostedAt    timestamp               ← REQUIRED
```

### `location_index/{geohashCell}`
```
business_ids    array       ["biz_001", "biz_003", "biz_005"]
```
Document ID is a precision-5 geohash string e.g. `"tfe72"` (covers ~5×5 km area).

### `users/{userId}/following/{businessId}` subcollection
Each document's **ID** = the followed business's ID. No specific fields required inside.

### `posts/{postId}`
```
uid             string      "biz_001"   ← business who posted
caption         string
imageUrl        string
likeCount       number      48          ← keep denormalized, update on like/unlike
createdAt       timestamp
```

---

## Next.js Code Snippets

### Install Dependencies

```bash
npm install ngeohash
# ngeohash is pure JS — no build issues, works in both browser and Node.js
```

---

### Geohash Utility

Create `lib/geohash.js`:

```js
import ngeohash from "ngeohash";

/**
 * Encode a lat/lon into a precision-5 geohash cell.
 * Must match the precision used by the Python backend (config.GEOHASH_PRECISION = 5).
 */
export function encodeGeohash(lat, lon, precision = 5) {
  return ngeohash.encode(lat, lon, precision);
}
```

---

### Firestore Write Helpers

Create `lib/firestoreWrites.js`:

```js
import {
  doc, setDoc, updateDoc, deleteDoc,
  arrayUnion, arrayRemove, increment, serverTimestamp,
  collection, addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // your Firebase init file
import { encodeGeohash } from "@/lib/geohash";

/** Call when a business sets or updates their location */
export async function registerBusinessLocation(businessId, businessData, lat, lon) {
  const geohashCell = encodeGeohash(lat, lon);

  await Promise.all([
    // Write to businesses collection
    setDoc(doc(db, "businesses", businessId), {
      ...businessData,
      location: { latitude: lat, longitude: lon },
      postCount: 0,
      lastPostedAt: null,
    }, { merge: true }),

    // Write to location_index
    setDoc(doc(db, "location_index", geohashCell), {
      business_ids: arrayUnion(businessId),
    }, { merge: true }),
  ]);
}

/** Call when a business creates a post */
export async function createPost(businessId, postData) {
  await Promise.all([
    addDoc(collection(db, "posts"), {
      uid: businessId,
      likeCount: 0,
      createdAt: serverTimestamp(),
      ...postData,
    }),
    updateDoc(doc(db, "businesses", businessId), {
      postCount: increment(1),
      lastPostedAt: serverTimestamp(),
    }),
  ]);
}

/** Call when a business deletes a post */
export async function deletePost(businessId, postId) {
  await Promise.all([
    deleteDoc(doc(db, "posts", postId)),
    updateDoc(doc(db, "businesses", businessId), {
      postCount: increment(-1),
    }),
  ]);
}

/** Call when a business changes their location */
export async function updateBusinessLocation(businessId, oldLat, oldLon, newLat, newLon) {
  const oldCell = encodeGeohash(oldLat, oldLon);
  const newCell = encodeGeohash(newLat, newLon);

  const writes = [
    updateDoc(doc(db, "businesses", businessId), {
      location: { latitude: newLat, longitude: newLon },
    }),
  ];

  if (oldCell !== newCell) {
    writes.push(
      updateDoc(doc(db, "location_index", oldCell), {
        business_ids: arrayRemove(businessId),
      }),
      setDoc(doc(db, "location_index", newCell), {
        business_ids: arrayUnion(businessId),
      }, { merge: true }),
    );
  }

  await Promise.all(writes);
}
```

---

### API Fetch Hooks

Create `hooks/useRecommendations.js`:

```js
import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_RECOMMENDATION_API;

/**
 * Gets the user's current GPS coordinates from the browser.
 * Returns null if permission denied.
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

/** Hook: fetch the user's post feed */
export function useFeed(userId, limit = 20) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { lat, lon } = await getCurrentPosition();
        const url = new URL(`${API_BASE}/feed/${userId}`);
        url.searchParams.set("lat", lat);
        url.searchParams.set("lon", lon);
        url.searchParams.set("limit", limit);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setPosts(data.posts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  return { posts, loading, error };
}

/** Hook: fetch Who to Follow suggestions */
export function useWhoToFollow(userId, limit = 10) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { lat, lon } = await getCurrentPosition();
        const url = new URL(`${API_BASE}/discovery/who-to-follow/${userId}`);
        url.searchParams.set("lat", lat);
        url.searchParams.set("lon", lon);
        url.searchParams.set("limit", limit);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setSuggestions(data.suggestions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  return { suggestions, loading, error };
}
```

---

### Feed Component Example

```jsx
// components/Feed.jsx
"use client";

import { useFeed } from "@/hooks/useRecommendations";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export default function Feed() {
  const [user] = useAuthState(auth);
  const { posts, loading, error } = useFeed(user?.uid);

  if (loading) return <p>Loading feed...</p>;
  if (error)   return <p>Could not load feed. Enable location access.</p>;
  if (!posts.length) return <p>No posts near you yet. Follow some local businesses!</p>;

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="post-card">
          {/* Recommendation badge */}
          <span className="badge">
            {post.recommendation_type === "followed" ? "✓ Following" : `📍 ${post.distance_km} km away`}
          </span>

          <p>{post.caption}</p>

          <small>
            {post.business.businessName} · {post.business.businessType}
          </small>
        </div>
      ))}
    </div>
  );
}
```

---

## Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_RECOMMENDATION_API=http://localhost:8000
```

For production (after deployment):
```bash
NEXT_PUBLIC_RECOMMENDATION_API=https://your-deployed-api.onrender.com
```

---

## Error Handling

| HTTP Status | Meaning | What to show |
|---|---|---|
| `200` | Success | Render posts/suggestions |
| `400` | Invalid lat/lon values | Check your coordinate logic |
| `404` | User not found | Ensure user document exists in Firestore |
| `500` | Server error | Show generic error, retry once |

**Empty `posts` array** means user follows nobody AND is far from all businesses.  
Show: *"No posts near you yet. Follow some local businesses!"*

---

## FAQ

**Q: Should I call the API from client-side or via a Next.js API route?**  
A: Call it from **client-side** directly using the hooks above. No need for a Next.js proxy — the recommendation API already handles CORS.

**Q: What if the user denies location permission?**  
A: The API won't work correctly without coordinates. Show a UI prompt explaining that location is needed for their feed. Don't call the API without it.

**Q: How often should I refresh the feed?**  
A: Fetch once on page load. Add a pull-to-refresh trigger that re-calls. Don't auto-poll. Cache for max 60 seconds — nearby posts change often.

**Q: My `location_index` collection doesn't exist yet. What do I do?**  
A: Ask the backend to run a one-time migration script. Going forward, these snippets maintain it automatically whenever a business registers or changes their location.

**Q: What does `recommendation_type` mean?**  
A: Either `"followed"` (user follows this business) or `"nearby"` (it's close by but not followed yet). Use it to show a badge like *"✓ Following"* or *"📍 0.4 km away"* on the post card.

**Q: The API is running locally. How do I test from my phone?**  
A: Replace `localhost` with your machine's local IP (e.g. `192.168.1.5:8000`) in `.env.local`. Both devices must be on the same WiFi network.
