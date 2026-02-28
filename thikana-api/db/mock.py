"""
db/mock.py

MockDB — reads from data/mock_db.json.
Implements the DataProvider interface from db/base.py.

This is the only file that knows about the JSON file format.
Swap this entire file for db/firebase.py and nothing else changes.
"""

import json
import math
from pathlib import Path

from config import MAX_RADIUS_KM

_MOCK_DB_PATH = Path(__file__).parent.parent / "data" / "mock_db.json"


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


class MockDB:
    """
    Reads data/mock_db.json once and caches it in memory.
    All methods mirror what FirebaseDB will do when implemented.
    """

    def __init__(self):
        with open(_MOCK_DB_PATH, "r", encoding="utf-8") as f:
            self._data = json.load(f)

    # ── Interface methods ─────────────────────────────────────────────────────

    def get_user(self, user_id: str) -> dict | None:
        """
        Firebase equivalent:
            db.collection('users').document(user_id).get()  → 1 read
        """
        return self._data["users"].get(user_id)

    def get_following_ids(self, user_id: str) -> list[str]:
        """
        Firebase equivalent:
            db.collection('users').document(user_id)
              .collection('following').stream()              → 1 read
        """
        user = self._data["users"].get(user_id, {})
        return user.get("following", [])

    def get_nearby_businesses(
        self,
        lat: float,
        lon: float,
        max_radius_km: float = MAX_RADIUS_KM,
    ) -> dict[str, float]:
        """
        Mock: brute-force Haversine over all businesses in JSON (fine for dev).

        Firebase equivalent (scalable — O(1) regardless of business count):
            1. Encode (lat,lon) → geohash (precision=5), get 9 cells  [free]
            2. Read location_index/{cell} for 9 cells               [9 reads]
            3. Collect business_ids from each cell
            4. Batch-fetch businesses/{id}                [ceil(n/10) reads]
            5. Haversine filter for exact distance                    [free]

        Returns {business_id: distance_km}, sorted by distance ascending.
        """
        result: dict[str, float] = {}
        for biz_id, biz in self._data["businesses"].items():
            loc = biz.get("location")
            if not loc:
                continue
            dist = _haversine_km(lat, lon, loc["latitude"], loc["longitude"])
            if dist <= max_radius_km:
                result[biz_id] = round(dist, 2)
        return dict(sorted(result.items(), key=lambda x: x[1]))

    def get_businesses_batch(self, business_ids: list[str]) -> dict[str, dict]:
        """
        Firebase equivalent:
            Firestore 'in' query in batches of 10       [ceil(n/10) reads]
        """
        if not business_ids:
            return {}
        return {
            biz_id: self._data["businesses"][biz_id]
            for biz_id in business_ids
            if biz_id in self._data["businesses"]
        }

    def get_posts_for_businesses(
        self,
        business_ids: list[str],
        limit_per_business: int = 5,
    ) -> list[dict]:
        """
        Firebase equivalent:
            Firestore 'in' query on uid field in batches of 10  [ceil(n/10) reads]

        limit_per_business prevents one very active business flooding the feed.
        """
        if not business_ids:
            return []

        biz_set = set(business_ids)
        by_biz: dict[str, list[dict]] = {}

        for post in self._data["posts"]:
            uid = post.get("uid")
            if uid in biz_set:
                by_biz.setdefault(uid, []).append(post)

        result = []
        for uid, posts in by_biz.items():
            posts.sort(key=lambda p: p.get("createdAt", ""), reverse=True)
            result.extend(posts[:limit_per_business])
        return result
