"""
core/scorer.py

Pure scoring logic — NO database calls, NO I/O, NO side effects.
Every function takes plain Python dicts and returns a float in [0.0, 1.0].
All weights and constants come from config.py.
"""

import math
from datetime import datetime, timezone

import config


# ── Helpers ───────────────────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula — distance between two coordinates in kilometres."""
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
    Parse a datetime from any of these formats:
      - ISO string:        '2026-02-28T07:30:00Z'
      - datetime object:   already a datetime
      - Firebase Timestamp: has a .timestamp() method
      - None:              returns None
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
    if hasattr(dt_value, "timestamp"):
        return datetime.fromtimestamp(dt_value.timestamp(), tz=timezone.utc)
    return None


# ── Public scoring functions ──────────────────────────────────────────────────

def score_post(
    post: dict,
    following_ids: set[str],
    user_lat: float,
    user_lon: float,
    business_locations: dict[str, dict],
) -> float:
    """
    Score a single post candidate. Returns float in [0.0, 1.0].

    Signals:
      following_signal  (config.POST_WEIGHT_FOLLOWING = 0.55)
      location_signal   (config.POST_WEIGHT_LOCATION  = 0.35)
      recency_signal    (config.POST_WEIGHT_RECENCY   = 0.10)
    """
    business_id = post.get("uid", "")

    # Signal 1 — Following (binary: 0 or 1)
    following_signal = 1.0 if business_id in following_ids else 0.0

    # Signal 2 — Location (1.0 at 0km, 0.0 at MAX_RADIUS_KM)
    location_signal = 0.0
    biz_loc = business_locations.get(business_id)
    if biz_loc and biz_loc.get("latitude") and biz_loc.get("longitude"):
        dist = haversine_km(user_lat, user_lon, biz_loc["latitude"], biz_loc["longitude"])
        location_signal = max(0.0, 1.0 - dist / config.MAX_RADIUS_KM)

    # Signal 3 — Recency (1.0 = just posted, 0.0 = older than 7 days)
    recency_signal = 0.0
    created_dt = _parse_utc(post.get("createdAt"))
    if created_dt:
        hours_old = (datetime.now(timezone.utc) - created_dt).total_seconds() / 3600
        recency_signal = max(0.0, 1.0 - hours_old / config.RECENCY_WINDOW_HOURS)

    return round(
        following_signal * config.POST_WEIGHT_FOLLOWING
        + location_signal  * config.POST_WEIGHT_LOCATION
        + recency_signal   * config.POST_WEIGHT_RECENCY,
        4,
    )


def score_business_to_follow(business: dict, distance_km: float) -> float:
    """
    Score a business for the "Who to Follow" list. Returns float in [0.0, 1.0].

    Signals:
      location_signal  (config.FOLLOW_WEIGHT_LOCATION = 0.70)
      activity_signal  (config.FOLLOW_WEIGHT_ACTIVITY = 0.30)
    """
    location_signal = max(0.0, 1.0 - distance_km / config.MAX_RADIUS_KM)

    post_count = business.get("postCount", 0) or 0
    activity_signal = min(post_count, config.MAX_POST_COUNT) / config.MAX_POST_COUNT

    return round(
        location_signal  * config.FOLLOW_WEIGHT_LOCATION
        + activity_signal * config.FOLLOW_WEIGHT_ACTIVITY,
        4,
    )
