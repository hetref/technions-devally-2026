"""
engine/fetcher.py

The ONLY place that touches the data source (currently: mock JSON).
When you move to Firebase, you change ONLY this file — nothing else.

Design goals:
  - All reads are batched (no N+1 loops)
  - Each method reads the minimum data needed
  - Returns plain Python dicts (no Firebase objects leak out)

DB READ COUNT per feed request (with mock JSON it's just 1 file read total):
  Firebase equivalent target → ≤ 5 Firestore calls for a full feed request
"""

import json
import math
from pathlib import Path
from typing import Optional

from engine.geohash_utils import get_search_cells, cell_for_business, encode


# ── Data source toggle ────────────────────────────────────────────────────────
# Set USE_MOCK = True  → reads from data/mock_db.json
# Set USE_MOCK = False → reads from Firebase (Phase 3)
USE_MOCK = True

_MOCK_DB_PATH = Path(__file__).parent.parent / "data" / "mock_db.json"


# ── Mock data loader (loaded once, cached in memory) ─────────────────────────

_mock_cache: dict | None = None

def _load_mock() -> dict:
    """Load the mock JSON database once and cache it in memory."""
    global _mock_cache
    if _mock_cache is None:
        with open(_MOCK_DB_PATH, "r", encoding="utf-8") as f:
            _mock_cache = json.load(f)
    return _mock_cache


# ── Internal helper ───────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Public fetcher functions ──────────────────────────────────────────────────

def get_user(user_id: str) -> dict | None:
    """
    Fetch a single user's data.
    Firebase equivalent: db.collection('users').document(user_id).get()  → 1 read
    """
    if USE_MOCK:
        db = _load_mock()
        return db["users"].get(user_id)
    # ── Firebase stub (Phase 3) ──────────────────────────────────────────────
    # doc = db_client.collection("users").document(user_id).get()
    # return doc.to_dict() if doc.exists else None
    raise NotImplementedError("Firebase mode not yet implemented")


def get_following_ids(user_id: str) -> list[str]:
    """
    Return list of business IDs the user follows.
    Firebase equivalent: db.collection('users').document(user_id)
                           .collection('following').stream()  → 1 read
    """
    if USE_MOCK:
        db = _load_mock()
        user = db["users"].get(user_id, {})
        return user.get("following", [])
    raise NotImplementedError("Firebase mode not yet implemented")


def get_nearby_businesses(
    lat: float,
    lon: float,
    max_radius_km: float = 10.0,
) -> dict[str, float]:
    """
    Find all businesses within max_radius_km of (lat, lon).
    Returns {business_id: distance_km} — sorted by distance ascending.

    Mock:     Computes Haversine for every business in the JSON file.
    Firebase: Query location_index for geohash cells, then batch-fetch
              businesses → exact Haversine filter. That's 9 + ceil(n/10) reads total.

    The returned distance is the exact Haversine value — not just a geohash estimate.
    """
    if USE_MOCK:
        db = _load_mock()
        result: dict[str, float] = {}
        for biz_id, biz in db["businesses"].items():
            loc = biz.get("location")
            if not loc:
                continue
            dist = _haversine_km(lat, lon, loc["latitude"], loc["longitude"])
            if dist <= max_radius_km:
                result[biz_id] = round(dist, 2)
        # Sort by distance ascending
        return dict(sorted(result.items(), key=lambda x: x[1]))

    # ── Firebase stub (Phase 3) ──────────────────────────────────────────────
    # Step 1: get geohash search cells (9 cells) — free, no Firestore read
    # search_cells = get_search_cells(lat, lon)
    #
    # Step 2: batch-read location_index for those cells (up to 9 reads)
    # business_ids = set()
    # for cell in search_cells:
    #     doc = db_client.collection("location_index").document(cell).get()
    #     if doc.exists:
    #         business_ids.update(doc.to_dict().get("business_ids", []))
    #
    # Step 3: batch-fetch businesses (ceil(n/10) reads)
    # businesses = get_businesses_batch(list(business_ids))
    #
    # Step 4: exact Haversine filter
    # result = {}
    # for biz_id, biz in businesses.items():
    #     loc = biz.get("location")
    #     if not loc: continue
    #     dist = _haversine_km(lat, lon, loc["latitude"], loc["longitude"])
    #     if dist <= max_radius_km:
    #         result[biz_id] = round(dist, 2)
    # return dict(sorted(result.items(), key=lambda x: x[1]))
    raise NotImplementedError("Firebase mode not yet implemented")


def get_businesses_batch(business_ids: list[str]) -> dict[str, dict]:
    """
    Batch-fetch business metadata by IDs.
    Returns {business_id: business_dict}.

    Firebase equivalent: Firestore 'in' query in batches of 10
                         → ceil(n/10) reads total.
    """
    if not business_ids:
        return {}
    if USE_MOCK:
        db = _load_mock()
        return {
            biz_id: db["businesses"][biz_id]
            for biz_id in business_ids
            if biz_id in db["businesses"]
        }
    raise NotImplementedError("Firebase mode not yet implemented")


def get_posts_for_businesses(
    business_ids: list[str],
    limit_per_business: int = 5,
) -> list[dict]:
    """
    Fetch recent posts for a set of businesses.
    Returns a flat list of post dicts (all businesses combined).

    Mock:     Filters in-memory.
    Firebase: Firestore 'in' query on 'uid' field in batches of 10.
              → ceil(n/10) reads.  Each read can return many posts.

    limit_per_business caps how many posts per business to prevent one
    very active business from flooding the feed.
    """
    if not business_ids:
        return []

    if USE_MOCK:
        db = _load_mock()
        biz_set = set(business_ids)
        # Group posts by business
        by_biz: dict[str, list[dict]] = {}
        for post in db["posts"]:
            uid = post.get("uid")
            if uid in biz_set:
                by_biz.setdefault(uid, []).append(post)

        # Sort each business's posts by createdAt desc, keep top N
        result = []
        for uid, posts in by_biz.items():
            posts.sort(key=lambda p: p.get("createdAt", ""), reverse=True)
            result.extend(posts[:limit_per_business])
        return result

    raise NotImplementedError("Firebase mode not yet implemented")
