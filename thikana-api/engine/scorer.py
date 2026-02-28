"""
engine/scorer.py

Pure scoring logic — NO database calls, NO I/O, NO side effects.
Every function takes plain Python dicts and returns a float in [0.0, 1.0].

SIGNAL WEIGHTS:
  Post feed:
    following_signal  → 0.55  (strongest intent signal — user chose to follow)
    location_signal   → 0.35  (core differentiator for a local-business app)
    recency_signal    → 0.10  (tiebreaker, prevents stale posts dominating)

  Who to Follow:
    location_signal   → 0.70  (proximity is the main reason to follow a local biz)
    activity_signal   → 0.30  (active businesses > ghost accounts)
"""

import math
from datetime import datetime, timezone, timedelta

# ── Tuneable constants ────────────────────────────────────────────────────────

MAX_RADIUS_KM: float = 10.0       # Posts/businesses beyond this radius score 0
RECENCY_WINDOW_HOURS: float = 168  # 7 days — older than this scores 0 on recency
MAX_POST_COUNT: int = 20           # postCount is normalized against this ceiling

POST_WEIGHT_FOLLOWING: float = 0.55
POST_WEIGHT_LOCATION: float = 0.35
POST_WEIGHT_RECENCY: float = 0.10

FOLLOW_WEIGHT_LOCATION: float = 0.70
FOLLOW_WEIGHT_ACTIVITY: float = 0.30


# ── Helpers ───────────────────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula — returns distance between two points in kilometres."""
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


def _parse_utc(dt_value) -> datetime | None:
    """
    Safely parse a datetime from:
      - ISO string:   '2026-02-28T07:30:00Z'
      - datetime obj: already a datetime
      - None / anything else: returns None
    """
    if dt_value is None:
        return None
    if isinstance(dt_value, datetime):
        return dt_value if dt_value.tzinfo else dt_value.replace(tzinfo=timezone.utc)
    if isinstance(dt_value, str):
        try:
            return datetime.fromisoformat(dt_value.replace("Z", "+00:00"))
        except ValueError:
            return None
    # Firebase Timestamp object (has a .timestamp() method)
    if hasattr(dt_value, "timestamp"):
        return datetime.fromtimestamp(dt_value.timestamp(), tz=timezone.utc)
    return None


def _location_signal(user_lat: float, user_lon: float, biz_lat: float, biz_lon: float) -> float:
    """Returns 1.0 at 0km distance, 0.0 at MAX_RADIUS_KM, clipped to [0, 1]."""
    distance = haversine_km(user_lat, user_lon, biz_lat, biz_lon)
    return max(0.0, 1.0 - distance / MAX_RADIUS_KM)


# ── Public scoring functions ──────────────────────────────────────────────────

def score_post(
    post: dict,
    following_ids: set[str],
    user_lat: float,
    user_lon: float,
    business_locations: dict[str, dict],
) -> float:
    """
    Score a single post candidate.

    Args:
        post:               Post dict (must include 'uid', 'createdAt')
        following_ids:      Set of business IDs the user follows
        user_lat/lon:       User's current location
        business_locations: {business_id: {"latitude": ..., "longitude": ...}}

    Returns:  float in [0.0, 1.0]
    """
    business_id = post.get("uid", "")

    # ── Signal 1: Following ────────────────────────────────────────────────────
    following_signal = 1.0 if business_id in following_ids else 0.0

    # ── Signal 2: Location ────────────────────────────────────────────────────
    location_signal = 0.0
    biz_loc = business_locations.get(business_id)
    if biz_loc and biz_loc.get("latitude") and biz_loc.get("longitude"):
        location_signal = _location_signal(
            user_lat, user_lon, biz_loc["latitude"], biz_loc["longitude"]
        )

    # ── Signal 3: Recency ─────────────────────────────────────────────────────
    recency_signal = 0.0
    created_dt = _parse_utc(post.get("createdAt"))
    if created_dt:
        hours_old = (datetime.now(timezone.utc) - created_dt).total_seconds() / 3600
        recency_signal = max(0.0, 1.0 - hours_old / RECENCY_WINDOW_HOURS)

    # ── Weighted sum ──────────────────────────────────────────────────────────
    score = (
        following_signal * POST_WEIGHT_FOLLOWING
        + location_signal * POST_WEIGHT_LOCATION
        + recency_signal * POST_WEIGHT_RECENCY
    )

    return round(score, 4)


def score_business_to_follow(
    business: dict,
    distance_km: float,
) -> float:
    """
    Score a business for the "Who to Follow" list.

    Args:
        business:    Business dict (must include 'postCount')
        distance_km: Pre-computed Haversine distance from the user

    Returns:  float in [0.0, 1.0]
    """
    # ── Signal 1: Location ────────────────────────────────────────────────────
    location_signal = max(0.0, 1.0 - distance_km / MAX_RADIUS_KM)

    # ── Signal 2: Activity (postCount normalised to 0–1) ──────────────────────
    post_count = business.get("postCount", 0) or 0
    activity_signal = min(post_count, MAX_POST_COUNT) / MAX_POST_COUNT

    score = (
        location_signal * FOLLOW_WEIGHT_LOCATION
        + activity_signal * FOLLOW_WEIGHT_ACTIVITY
    )

    return round(score, 4)
