"""
tests/test_phase1.py

All Phase 1 tests — run from the project root:
  python -m pytest tests/test_phase1.py -v
  OR
  python tests/test_phase1.py
"""

# Force mock mode BEFORE any import that touches db/__init__.py
# This lets tests run against mock data even when the server uses live Firebase.
import config
config.USE_MOCK = True

from core import assembler



def sep(title: str):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")


def test_feed_returns_posts():
    sep("FEED — user_001 (Pune, follows biz_001 + biz_003)")
    posts = assembler.build_feed("user_001", 18.5204, 73.8567, limit=10)
    assert len(posts) > 0, "FAIL: Feed is empty!"
    for p in posts:
        print(
            f"  [{p['recommendation_type']:8}] score={p['score']:.4f}"
            f"  dist={p.get('distance_km', 'N/A')}km"
            f"  | {p['business']['businessName']}"
            f"  | {p['caption'][:35]}"
        )
    print(f"\n  All {len(posts)} posts returned")


def test_who_to_follow_excludes_already_followed():
    sep("WHO TO FOLLOW — user_001 (follows biz_001 + biz_003)")
    suggestions = assembler.build_who_to_follow("user_001", 18.5204, 73.8567, limit=10)
    ids = [s["id"] for s in suggestions]
    assert "biz_001" not in ids, "FAIL: biz_001 is already followed!"
    assert "biz_003" not in ids, "FAIL: biz_003 is already followed!"
    for s in suggestions:
        print(f"  score={s['score']:.4f}  dist={s['distance_km']}km  posts={s['postCount']:>2}  | {s['businessName']}")
    print(f"\n  {len(suggestions)} suggestions (already-followed correctly excluded)")


def test_new_user_gets_only_nearby():
    sep("FEED — user_003 (Mumbai, follows nobody)")
    posts = assembler.build_feed("user_003", 19.0760, 72.8777, limit=10)
    types = {p["recommendation_type"] for p in posts}
    assert "followed" not in types, "FAIL: user_003 follows nobody!"
    for p in posts:
        print(f"  [{p['recommendation_type']:8}] score={p['score']:.4f}  | {p['business']['businessName']}")
    print(f"\n  {len(posts)} posts (all nearby, none followed)")


def test_all_scores_in_range():
    sep("SCORE VALIDATION — all scores must be in [0.0, 1.0]")
    posts = assembler.build_feed("user_001", 18.5204, 73.8567, limit=20)
    for p in posts:
        assert 0.0 <= p["score"] <= 1.0, f"FAIL: post score {p['score']} out of range"
    print(f"  All {len(posts)} post scores are in [0.0, 1.0]")

    wtf = assembler.build_who_to_follow("user_001", 18.5204, 73.8567, limit=10)
    for b in wtf:
        assert 0.0 <= b["score"] <= 1.0, f"FAIL: biz score {b['score']} out of range"
    print(f"  All {len(wtf)} WTF scores are in [0.0, 1.0]")


def test_no_duplicate_posts():
    sep("DEDUPLICATION — no post ID must appear twice")
    posts = assembler.build_feed("user_001", 18.5204, 73.8567, limit=20)
    ids = [p["id"] for p in posts]
    assert len(ids) == len(set(ids)), f"FAIL: Duplicate post IDs! {ids}"
    print(f"  No duplicates across {len(posts)} posts")


if __name__ == "__main__":
    test_feed_returns_posts()
    test_who_to_follow_excludes_already_followed()
    test_new_user_gets_only_nearby()
    test_all_scores_in_range()
    test_no_duplicate_posts()
    print("\n All Phase 1 tests passed!\n")
