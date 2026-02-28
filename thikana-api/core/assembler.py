"""
core/assembler.py

Orchestrates the data layer (db/) and scoring layer (core/scorer.py).
No Firestore calls here — only calls to `db` and `scorer`.

DB reads per request (Firebase):
  build_feed:          ~4–12 reads total
  build_who_to_follow: ~3–11 reads total
"""

from db import db
from core import scorer


def build_feed(
    user_id: str,
    lat: float,
    lon: float,
    limit: int = 20,
) -> list[dict]:
    """
    Build the ranked post feed for a user.

    Steps:
      1. Get following IDs           (1 DB read)
      2. Get nearby businesses       (9 + ceil(n/10) reads in Firebase)
      3. Union: followed ∪ nearby candidates
      4. Fetch posts for all candidates in ONE batch
      5. Fetch business metadata in ONE batch
      6. Score → deduplicate → sort → return top N
    """
    # Step 1
    following_ids: list[str] = db.get_following_ids(user_id)
    following_set: set[str] = set(following_ids)

    # Step 2
    nearby: dict[str, float] = db.get_nearby_businesses(lat, lon)

    # Step 3 — union, exclude self
    candidate_ids: list[str] = list(
        (following_set | set(nearby.keys())) - {user_id}
    )
    if not candidate_ids:
        return []

    # Step 4 — ONE batch read for posts
    raw_posts: list[dict] = db.get_posts_for_businesses(
        candidate_ids, limit_per_business=5
    )

    # Step 5 — ONE batch read for business metadata
    businesses: dict[str, dict] = db.get_businesses_batch(candidate_ids)
    biz_locations: dict[str, dict] = {
        biz_id: biz["location"]
        for biz_id, biz in businesses.items()
        if biz.get("location")
    }

    # Step 6 — score, deduplicate, sort
    seen: set[str] = set()
    scored: list[tuple[dict, float]] = []

    for post in raw_posts:
        post_id     = post.get("id")
        business_id = post.get("uid")

        if post_id in seen or business_id == user_id:
            continue
        seen.add(post_id)

        s = scorer.score_post(post, following_set, lat, lon, biz_locations)

        biz = businesses.get(business_id, {})
        dist = nearby.get(business_id)

        post["score"] = s
        post["recommendation_type"] = (
            "followed" if business_id in following_set else "nearby"
        )
        if dist is not None:
            post["distance_km"] = dist
        post["business"] = {
            "businessName": biz.get("businessName", ""),
            "username":     biz.get("username", ""),
            "businessType": biz.get("businessType", ""),
        }

        scored.append((post, s))

    scored.sort(key=lambda x: -x[1])
    return [p for p, _ in scored[:limit]]


def build_who_to_follow(
    user_id: str,
    lat: float,
    lon: float,
    limit: int = 10,
) -> list[dict]:
    """
    Build the "Who to Follow" list — nearby businesses not yet followed.

    Steps:
      1. Get following IDs           (1 DB read)
      2. Get nearby businesses       (9 + ceil(n/10) reads in Firebase)
      3. Filter out already-followed and self
      4. Fetch business metadata in ONE batch
      5. Score → sort → return top N
    """
    # Step 1
    following_ids: list[str] = db.get_following_ids(user_id)
    following_set: set[str] = set(following_ids)

    # Step 2
    nearby: dict[str, float] = db.get_nearby_businesses(lat, lon)

    # Step 3 — filter
    candidates: dict[str, float] = {
        biz_id: dist
        for biz_id, dist in nearby.items()
        if biz_id not in following_set and biz_id != user_id
    }
    if not candidates:
        return []

    # Step 4 — ONE batch read
    businesses: dict[str, dict] = db.get_businesses_batch(list(candidates.keys()))

    # Step 5 — score and sort
    scored: list[tuple[dict, float]] = []
    for biz_id, distance_km in candidates.items():
        biz = businesses.get(biz_id)
        if not biz:
            continue

        s = scorer.score_business_to_follow(biz, distance_km)
        scored.append((
            {
                "id":           biz_id,
                "businessName": biz.get("businessName", ""),
                "username":     biz.get("username", ""),
                "businessType": biz.get("businessType", ""),
                "distance_km":  distance_km,
                "postCount":    biz.get("postCount", 0),
                "score":        s,
            },
            s,
        ))

    scored.sort(key=lambda x: -x[1])
    return [item for item, _ in scored[:limit]]
