"""
test_phase1.py

Run this to verify Phase 1 is working correctly.
Usage:  python test_phase1.py
"""

from engine import assembler


def sep(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)


def test_feed():
    sep("FEED — user_001 (Pune, follows biz_001 + biz_003)")
    posts = assembler.build_feed("user_001", 18.5204, 73.8567, limit=10)
    assert len(posts) > 0, "FAIL: Feed is empty!"
    for p in posts:
        rtype = p["recommendation_type"]
        score = p["score"]
        dist  = p.get("distance_km", "N/A")
        biz   = p["business"]["businessName"]
        cap   = p["caption"][:40]
        print(f"  [{rtype:8}] score={score:.4f}  dist={dist}km  | {biz} | {cap}")
    print(f"\n  ✅  {len(posts)} posts returned")
    return posts


def test_who_to_follow():
    sep("WHO TO FOLLOW — user_001 (Pune, follows biz_001 + biz_003)")
    suggestions = assembler.build_who_to_follow("user_001", 18.5204, 73.8567, limit=10)
    # biz_001 and biz_003 are already followed — must NOT appear
    ids = [s["id"] for s in suggestions]
    assert "biz_001" not in ids, "FAIL: biz_001 already followed, must not appear!"
    assert "biz_003" not in ids, "FAIL: biz_003 already followed, must not appear!"
    for s in suggestions:
        print(f"  score={s['score']:.4f}  dist={s['distance_km']}km  posts={s['postCount']:>2}  | {s['businessName']}")
    print(f"\n  ✅  {len(suggestions)} suggestions returned (already-followed correctly excluded)")
    return suggestions


def test_new_user_no_follows():
    sep("FEED — user_003 (Mumbai, follows nobody)")
    posts = assembler.build_feed("user_003", 19.0760, 72.8777, limit=10)
    for p in posts:
        rtype = p["recommendation_type"]
        score = p["score"]
        biz   = p["business"]["businessName"]
        print(f"  [{rtype:8}] score={score:.4f}  | {biz}")
    # All should be "nearby", none "followed"
    types = {p["recommendation_type"] for p in posts}
    assert "followed" not in types, "FAIL: user_003 follows nobody, should get no 'followed' posts"
    print(f"\n  ✅  {len(posts)} posts returned (all nearby, none followed)")


def test_scores_in_range():
    sep("SCORE VALIDATION — all scores must be in [0.0, 1.0]")
    posts = assembler.build_feed("user_001", 18.5204, 73.8567, limit=20)
    for p in posts:
        s = p["score"]
        assert 0.0 <= s <= 1.0, f"FAIL: score {s} out of range for post {p['id']}"
    print(f"  ✅  All {len(posts)} post scores are in [0.0, 1.0]")

    wtf = assembler.build_who_to_follow("user_001", 18.5204, 73.8567, limit=10)
    for b in wtf:
        s = b["score"]
        assert 0.0 <= s <= 1.0, f"FAIL: score {s} out of range for biz {b['id']}"
    print(f"  ✅  All {len(wtf)} WTF scores are in [0.0, 1.0]")


def test_no_duplicate_posts():
    sep("DEDUPLICATION — no post should appear twice")
    posts = assembler.build_feed("user_001", 18.5204, 73.8567, limit=20)
    ids = [p["id"] for p in posts]
    assert len(ids) == len(set(ids)), f"FAIL: Duplicate post IDs found! {ids}"
    print(f"  ✅  No duplicates in {len(posts)} posts")


if __name__ == "__main__":
    test_feed()
    test_who_to_follow()
    test_new_user_no_follows()
    test_scores_in_range()
    test_no_duplicate_posts()
    print("\n🎉  All Phase 1 tests passed!\n")
