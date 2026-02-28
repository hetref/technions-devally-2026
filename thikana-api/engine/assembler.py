"""
engine/assembler.py

Glues fetcher + scorer together into clean, deduplicated results.
This is the ONLY file that coordinates data fetching and scoring.
No Firestore calls here — only calls to fetcher.py and scorer.py.
"""

from engine import fetcher, scorer


def build_feed(
    user_id: str,
    lat: float,
    lon: float,
    limit: int = 20,
) -> list[dict]:
    """
    Build the main post feed for a user.

    Strategy:
      1. Fetch following IDs (1 DB read)
      2. Fetch nearby businesses within radius (1–9 DB reads)
      3. Union: candidate businesses = followed ∪ nearby
      4. Fetch posts for all candidate businesses in ONE batch (1 DB read)
      5. Fetch business metadata for scoring in ONE batch (1 DB read)
      6. Score every post → sort → return top N

    Total DB reads (Firebase): ~4–12 reads regardless of feed size.
    """
    # ── Step 1: Following ─────────────────────────────────────────────────────
    following_ids: list[str] = fetcher.get_following_ids(user_id)
    following_set: set[str] = set(following_ids)

    # ── Step 2: Nearby businesses {biz_id: distance_km} ──────────────────────
    nearby: dict[str, float] = fetcher.get_nearby_businesses(lat, lon)

    # ── Step 3: Union of followed + nearby (exclude the user's own account) ──
    candidate_ids: list[str] = list(
        (following_set | set(nearby.keys())) - {user_id}
    )

    if not candidate_ids:
        return []

    # ── Step 4: Fetch posts for all candidate businesses in ONE call ──────────
    raw_posts: list[dict] = fetcher.get_posts_for_businesses(
        candidate_ids, limit_per_business=5
    )

    # ── Step 5: Fetch business metadata (needed for location scoring) ─────────
    businesses: dict[str, dict] = fetcher.get_businesses_batch(candidate_ids)

    # Map business_id → {"latitude": ..., "longitude": ...}
    biz_locations: dict[str, dict] = {
        biz_id: biz["location"]
        for biz_id, biz in businesses.items()
        if biz.get("location")
    }

    # ── Step 6: Score, deduplicate, sort ──────────────────────────────────────
    seen_post_ids: set[str] = set()
    scored: list[tuple[dict, float]] = []

    for post in raw_posts:
        post_id = post.get("id")
        business_id = post.get("uid")

        # Skip duplicates and the user's own posts
        if post_id in seen_post_ids or business_id == user_id:
            continue
        seen_post_ids.add(post_id)

        s = scorer.score_post(post, following_set, lat, lon, biz_locations)

        # Attach human-readable metadata for the response
        post["score"] = s
        post["recommendation_type"] = (
            "followed" if business_id in following_set else "nearby"
        )
        dist = nearby.get(business_id)
        if dist is not None:
            post["distance_km"] = dist

        # Attach business display info
        biz = businesses.get(business_id, {})
        post["business"] = {
            "businessName": biz.get("businessName", ""),
            "username": biz.get("username", ""),
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
    Build the "Who to Follow" list for a user.

    Strategy:
      1. Fetch following IDs (1 DB read)
      2. Fetch nearby businesses (1–9 DB reads)
      3. Remove already-followed and self
      4. Fetch business metadata (1 DB read)
      5. Score by location + activity → sort → return top N

    Total DB reads (Firebase): ~3–11 reads.
    """
    # ── Step 1: Already following ─────────────────────────────────────────────
    following_ids: list[str] = fetcher.get_following_ids(user_id)
    following_set: set[str] = set(following_ids)

    # ── Step 2: Nearby businesses ─────────────────────────────────────────────
    nearby: dict[str, float] = fetcher.get_nearby_businesses(lat, lon)

    # ── Step 3: Filter out already followed + self ────────────────────────────
    candidates: dict[str, float] = {
        biz_id: dist
        for biz_id, dist in nearby.items()
        if biz_id not in following_set and biz_id != user_id
    }

    if not candidates:
        return []

    # ── Step 4: Fetch business data in one batch ──────────────────────────────
    businesses: dict[str, dict] = fetcher.get_businesses_batch(list(candidates.keys()))

    # ── Step 5: Score each business ───────────────────────────────────────────
    scored: list[tuple[dict, float]] = []

    for biz_id, distance_km in candidates.items():
        biz = businesses.get(biz_id)
        if not biz:
            continue

        s = scorer.score_business_to_follow(biz, distance_km)

        scored.append((
            {
                "id": biz_id,
                "businessName": biz.get("businessName", ""),
                "username": biz.get("username", ""),
                "businessType": biz.get("businessType", ""),
                "distance_km": distance_km,
                "postCount": biz.get("postCount", 0),
                "score": s,
            },
            s,
        ))

    scored.sort(key=lambda x: -x[1])
    return [item for item, _ in scored[:limit]]
