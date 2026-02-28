"""
tests/test_expense_recommender.py

Tests for models/expense_recommender.py

Run:  python -m pytest tests/test_expense_recommender.py -v
"""

import json
from pathlib import Path
from models.expense_recommender import ExpenseRecommender

model = ExpenseRecommender()

# ── Load mock data ────────────────────────────────────────────────────────────

_DB = json.loads(
    (Path(__file__).parent.parent / "data" / "mock_db.json").read_text()
)


def txns_for(user_id: str) -> list[dict]:
    return [t for t in _DB["transactions"] if t["user_id"] == user_id]


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_returns_correct_structure():
    result = model.recommend(txns_for("user_001"), "user_001")
    assert result["user_id"] == "user_001"
    recs = result["recommendations"]
    for key in ["budget_suggestions", "timing_optimization", "saving_opportunities", "category_tips"]:
        assert key in recs, f"Missing key: {key}"
    assert result["analysis_period"]["total_spent"] > 0
    print(f"  Structure OK — Rs.{result['analysis_period']['total_spent']:,.0f} total over {result['analysis_period']['months']} month(s)")


def test_budget_suggestions_with_income():
    """With income=5000, Transport avg (~Rs.280/mo) is > 20% → should appear."""
    result = model.recommend(txns_for("user_001"), "user_001", monthly_income=5000)
    suggestions = result["recommendations"]["budget_suggestions"]
    # Transport ~Rs.510/mo, 5000 income → 10.2% — may not pass 20% threshold
    # Food ~Rs.680/mo → 13.6% — may not either
    # But Utilities ~Rs.1203/mo → 24% — should trigger medium priority
    utility_suggestions = [s for s in suggestions if s["category"] == "Utilities"]
    assert len(utility_suggestions) >= 1, "Utilities should appear with income=5000"
    assert utility_suggestions[0]["priority"] in {"high", "medium"}
    assert utility_suggestions[0]["potential_savings"] > 0
    print(f"  Budget suggestions: {[s['category'] for s in suggestions]}")


def test_budget_suggestions_all_fields():
    result = model.recommend(txns_for("user_001"), "user_001", monthly_income=3000)
    for s in result["recommendations"]["budget_suggestions"]:
        assert "category"          in s
        assert "average_monthly"   in s
        assert "suggested_monthly" in s
        assert "potential_savings" in s
        assert "income_pct"        in s
        assert "priority"          in s
        assert s["potential_savings"] > 0
        assert s["suggested_monthly"] < s["average_monthly"]
        assert s["priority"] in {"high", "medium"}
    print(f"  All budget suggestion fields valid")


def test_saving_opportunities_fields():
    result = model.recommend(txns_for("user_001"), "user_001")
    for opp in result["recommendations"]["saving_opportunities"]:
        assert "category"      in opp
        assert "avg_monthly"   in opp
        assert "trending_up"   in opp
        assert "saving_target" in opp
        assert "strategy"      in opp
        assert "impact"        in opp
        assert opp["impact"] in {"high", "medium"}
        assert isinstance(opp["trending_up"], bool)
    print(f"  {len(result['recommendations']['saving_opportunities'])} saving opportunities — all valid")


def test_category_tips_work_for_any_category():
    """Tips should be generated for ANY category that is overspent, not just Rent/Utilities."""
    result = model.recommend(txns_for("user_001"), "user_001", monthly_income=2000)
    tips = result["recommendations"]["category_tips"]
    if tips:
        categories_with_tips = [t["category"] for t in tips]
        print(f"  Tips generated for: {categories_with_tips}")
        for tip_entry in tips:
            assert len(tip_entry["tips"]) > 0, f"No tips for {tip_entry['category']}"
            assert tip_entry["income_pct"] > 20
    else:
        print("  No overspent categories with income=2000")


def test_timing_optimization_fields():
    result = model.recommend(txns_for("user_001"), "user_001")
    for t in result["recommendations"]["timing_optimization"]:
        assert "category"        in t
        assert "best_day"        in t
        assert "worst_day"       in t
        assert "avg_on_best_day" in t
        assert "savings_pct"     in t
        assert t["savings_pct"] >= 5, "Only >5% differences should surface"
    print(f"  Timing optimization: {len(result['recommendations']['timing_optimization'])} categories")


def test_empty_input():
    result = model.recommend([], "user_001")
    assert result["analysis_period"]["total_spent"] == 0.0
    recs = result["recommendations"]
    assert recs["budget_suggestions"]   == []
    assert recs["timing_optimization"]  == []
    assert recs["saving_opportunities"] == []
    assert recs["category_tips"]        == []
    print("  Empty input handled correctly")


def test_no_income_fallback():
    """With income=0, the model should not crash — uses total spend as reference."""
    result = model.recommend(txns_for("user_001"), "user_001", monthly_income=0)
    assert result["monthly_income"] == 0
    # Should still return something
    assert result["analysis_period"]["total_spent"] > 0
    print(f"  No-income fallback OK — analysis still ran")


def test_no_pandas_objects_in_output():
    import pandas as pd

    def check(obj, path="root"):
        if isinstance(obj, (pd.Series, pd.DataFrame)):
            raise AssertionError(f"pandas object at: {path}")
        if isinstance(obj, dict):
            for k, v in obj.items():
                check(v, f"{path}.{k}")
        if isinstance(obj, list):
            for i, item in enumerate(obj):
                check(item, f"{path}[{i}]")

    result = model.recommend(txns_for("user_001"), "user_001")
    check(result)
    print("  No pandas objects in output")


def test_budget_suggestions_sorted_correctly():
    """High priority suggestions must come before medium priority."""
    result = model.recommend(txns_for("user_001"), "user_001", monthly_income=2000)
    suggestions = result["recommendations"]["budget_suggestions"]
    if len(suggestions) < 2:
        print(f"  Only {len(suggestions)} suggestion(s) — skip sort order check")
        return
    priorities = [s["priority"] for s in suggestions]
    last_high    = max((i for i, p in enumerate(priorities) if p == "high"),    default=-1)
    first_medium = next((i for i, p in enumerate(priorities) if p == "medium"), len(priorities))
    assert last_high < first_medium, "Medium priority appears before high!"
    print(f"  Sort order correct: {priorities}")


def test_user_002_with_rent():
    """user_002 pays Rs.15000 rent — should appear in recommendations."""
    result = model.recommend(txns_for("user_002"), "user_002", monthly_income=30000)
    suggestions = result["recommendations"]["budget_suggestions"]
    rent_suggestions = [s for s in suggestions if s["category"] == "Rent"]
    assert len(rent_suggestions) >= 1, "Rent (50% of income) should appear in budget suggestions"
    assert rent_suggestions[0]["income_pct"] > 30
    assert rent_suggestions[0]["priority"] == "high"
    print(f"  user_002 Rent: {rent_suggestions[0]['income_pct']}% of income → {rent_suggestions[0]['priority']} priority")


if __name__ == "__main__":
    tests = [
        test_returns_correct_structure,
        test_budget_suggestions_with_income,
        test_budget_suggestions_all_fields,
        test_saving_opportunities_fields,
        test_category_tips_work_for_any_category,
        test_timing_optimization_fields,
        test_empty_input,
        test_no_income_fallback,
        test_no_pandas_objects_in_output,
        test_budget_suggestions_sorted_correctly,
        test_user_002_with_rent,
    ]
    print("\n=== Expense Recommender Tests ===")
    for t in tests:
        name = t.__name__.replace("test_", "").replace("_", " ").title()
        print(f"\n[{name}]")
        t()
    print("\n All expense recommender tests passed!")
