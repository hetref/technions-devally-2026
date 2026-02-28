"""
tests/test_insights.py

Tests for models/spending_insights.py

Run:  python -m pytest tests/test_insights.py -v
"""

import json
from pathlib import Path
from models.spending_insights import SpendingInsights

model = SpendingInsights()

# ── Load mock data ────────────────────────────────────────────────────────────

_DB = json.loads(
    (Path(__file__).parent.parent / "data" / "mock_db.json").read_text()
)


def txns_for(user_id: str) -> list[dict]:
    return [t for t in _DB["transactions"] if t["user_id"] == user_id]


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_returns_correct_structure():
    result = model.analyze(txns_for("user_001"), "user_001")
    required_keys = [
        "user_id", "total_transactions", "total_spent", "date_range",
        "spending_patterns", "category_analysis", "saving_opportunities",
        "behavioral_insights", "recommendations",
    ]
    for key in required_keys:
        assert key in result, f"Missing key: {key}"
    assert result["user_id"] == "user_001"
    print(f"  Structure OK — {result['total_transactions']} transactions, Rs.{result['total_spent']:,.0f} total")


def test_total_spent_is_correct():
    txns = txns_for("user_001")
    result = model.analyze(txns, "user_001")
    expected = sum(t["amount"] for t in txns)
    assert abs(result["total_spent"] - expected) < 0.01, (
        f"total_spent {result['total_spent']} != expected {expected}"
    )
    print(f"  total_spent correct: Rs.{result['total_spent']:,.2f}")


def test_category_analysis_has_all_categories():
    txns = txns_for("user_001")
    result = model.analyze(txns, "user_001")
    categories_in_data = {t["category"] for t in txns}
    categories_in_result = set(result["category_analysis"].keys())
    # All categories with >= 2 transactions must appear
    for cat in categories_in_data:
        count = sum(1 for t in txns if t["category"] == cat)
        if count >= 2:
            assert cat in categories_in_result, f"Category '{cat}' missing from analysis"
    print(f"  Categories present: {list(categories_in_result)}")


def test_category_shares_sum_to_100():
    result = model.analyze(txns_for("user_001"), "user_001")
    total_pct = sum(
        v["share_of_total_pct"]
        for v in result["category_analysis"].values()
    )
    # May not be exactly 100 if some categories are excluded (< 2 tx)
    assert total_pct <= 100.1, f"Shares sum to {total_pct} — exceeds 100%"
    print(f"  Category shares sum: {total_pct:.1f}%")


def test_trend_field_is_valid():
    result = model.analyze(txns_for("user_001"), "user_001")
    valid_trends = {"increasing", "decreasing", "stable"}
    for cat, data in result["category_analysis"].items():
        assert data["trend"] in valid_trends, (
            f"Category {cat} has invalid trend: {data['trend']}"
        )
    print("  All trend values are valid")


def test_saving_opportunities_have_required_fields():
    result = model.analyze(txns_for("user_001"), "user_001")
    required = {"type", "category", "description", "potential_savings", "priority"}
    for opp in result["saving_opportunities"]:
        for field in required:
            assert field in opp, f"saving_opportunity missing field: {field}"
        assert opp["potential_savings"] >= 0, "Potential savings cannot be negative"
        assert opp["priority"] in {"high", "medium"}, f"Invalid priority: {opp['priority']}"
    print(f"  {len(result['saving_opportunities'])} saving opportunities — all valid")


def test_behavioral_insights_structure():
    result = model.analyze(txns_for("user_001"), "user_001")
    behavior = result["behavioral_insights"]
    assert "impulse_risk"      in behavior
    assert "spending_velocity" in behavior
    assert "savings_ceiling"   in behavior

    impulse = behavior["impulse_risk"]
    assert impulse["risk_level"] in {"low", "medium", "high"}
    assert isinstance(impulse["rapid_transaction_count"], int)
    assert impulse["amount_at_risk"] >= 0

    velocity = behavior["spending_velocity"]
    assert velocity["trend"] in {"increasing", "decreasing", "stable"}
    assert velocity["average_daily_spend"] > 0

    ceiling = behavior["savings_ceiling"]
    assert ceiling["total_potential_savings"] >= 0
    print(f"  Impulse risk: {impulse['risk_level']}, Velocity: {velocity['trend']}, "
          f"Ceiling: Rs.{ceiling['total_potential_savings']:,.0f}")


def test_recommendations_are_sorted_by_priority():
    result = model.analyze(txns_for("user_001"), "user_001")
    recs = result["recommendations"]
    if len(recs) < 2:
        print("  Too few recommendations to check order")
        return
    # High priority should come before medium
    priorities = [r["priority"] for r in recs]
    last_high = max((i for i, p in enumerate(priorities) if p == "high"), default=-1)
    first_medium = next((i for i, p in enumerate(priorities) if p == "medium"), len(priorities))
    assert last_high < first_medium, "Medium priority recommendation comes before high!"
    print(f"  {len(recs)} recommendations — correctly sorted by priority")


def test_empty_input():
    result = model.analyze([], "user_001")
    assert result["total_transactions"] == 0
    assert result["total_spent"]        == 0.0
    assert result["category_analysis"] == {}
    assert result["recommendations"]   == []
    print("  Empty input handled correctly")


def test_no_pandas_objects_in_output():
    import pandas as pd

    def check_no_pandas(obj, path="root"):
        if isinstance(obj, (pd.Series, pd.DataFrame)):
            raise AssertionError(f"pandas object found at: {path}")
        if isinstance(obj, dict):
            for k, v in obj.items():
                check_no_pandas(v, f"{path}.{k}")
        if isinstance(obj, list):
            for i, v in enumerate(obj):
                check_no_pandas(v, f"{path}[{i}]")

    result = model.analyze(txns_for("user_001"), "user_001")
    check_no_pandas(result)
    print("  No pandas objects in output")


def test_user_002_analyze():
    result = model.analyze(txns_for("user_002"), "user_002")
    assert result["user_id"] == "user_002"
    assert result["total_transactions"] > 0
    # Rent should be the biggest category for user_002
    cats = result["category_analysis"]
    if "Rent" in cats:
        rent_share = cats["Rent"]["share_of_total_pct"]
        print(f"  user_002 Rent share: {rent_share}%")
        assert rent_share > 50, "Rent should dominate user_002's spending"
    print(f"  user_002 OK: Rs.{result['total_spent']:,.0f} total across {result['total_transactions']} transactions")


if __name__ == "__main__":
    tests = [
        test_returns_correct_structure,
        test_total_spent_is_correct,
        test_category_analysis_has_all_categories,
        test_category_shares_sum_to_100,
        test_trend_field_is_valid,
        test_saving_opportunities_have_required_fields,
        test_behavioral_insights_structure,
        test_recommendations_are_sorted_by_priority,
        test_empty_input,
        test_no_pandas_objects_in_output,
        test_user_002_analyze,
    ]
    print("\n=== Spending Insights Tests ===")
    for t in tests:
        name = t.__name__.replace("test_", "").replace("_", " ").title()
        print(f"\n[{name}]")
        t()
    print("\n All spending insights tests passed!")
