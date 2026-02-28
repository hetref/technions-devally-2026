"""
tests/test_spending_predictor.py

Tests for models/spending_predictor.py

Run:  python -m pytest tests/test_spending_predictor.py -v
"""

import json
from pathlib import Path
from models.spending_predictor import SpendingPredictor, WMA_WEIGHTS, WMA_WINDOW, MAX_TREND_FACTOR

model = SpendingPredictor()

# ── Load mock data ────────────────────────────────────────────────────────────

_DB = json.loads(
    (Path(__file__).parent.parent / "data" / "mock_db.json").read_text()
)


def txns_for(user_id: str) -> list[dict]:
    return [t for t in _DB["transactions"] if t["user_id"] == user_id]


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_returns_correct_structure():
    result = model.predict(txns_for("user_001"), "user_001")
    assert result["user_id"]         == "user_001"
    assert result["prediction_for"]  is not None
    assert result["months_of_data"]  > 0
    assert result["total_predicted"] > 0
    assert isinstance(result["predictions"], list)
    assert len(result["predictions"]) > 0
    print(f"  Structure OK — predicting {result['prediction_for']}, "
          f"total Rs.{result['total_predicted']:,.0f}")


def test_each_prediction_has_required_fields():
    result = model.predict(txns_for("user_001"), "user_001")
    required = {"category", "predicted", "lower_bound", "upper_bound",
                "confidence", "trend", "trend_pct", "data_points", "note"}
    for pred in result["predictions"]:
        for field in required:
            assert field in pred, f"Missing field '{field}' in prediction for {pred.get('category')}"
        assert pred["confidence"] in {"high", "medium", "low"}
        assert pred["trend"]      in {"increasing", "decreasing", "stable"}
        assert pred["lower_bound"] <= pred["predicted"]
        assert pred["upper_bound"] >= pred["predicted"]
        assert pred["lower_bound"] >= 0
        assert pred["predicted"]   >= 0
    print(f"  All {len(result['predictions'])} predictions have valid fields")


def test_predictions_sorted_by_amount():
    result = model.predict(txns_for("user_001"), "user_001")
    amounts = [p["predicted"] for p in result["predictions"]]
    assert amounts == sorted(amounts, reverse=True), "Should be sorted highest first"
    print(f"  Sorted correctly: {[round(a) for a in amounts]}")


def test_total_predicted_equals_sum():
    result = model.predict(txns_for("user_001"), "user_001")
    sum_of_preds = sum(p["predicted"] for p in result["predictions"])
    assert abs(result["total_predicted"] - sum_of_preds) < 0.02
    print(f"  total_predicted = sum of predictions ✓")


def test_confidence_interval_from_real_variance():
    """Confidence intervals must NOT be hardcoded ±15%."""
    result = model.predict(txns_for("user_001"), "user_001")
    if len(result["predictions"]) > 1:
        ratios = [
            (p["upper_bound"] - p["predicted"]) / p["predicted"]
            for p in result["predictions"]
            if p["predicted"] > 0
        ]
        assert max(ratios) != min(ratios), \
            "All confidence intervals are identical ratio — hardcoded ±15% detected!"
    print(f"  Confidence intervals vary per category — not hardcoded ✓")


def test_single_month_user_gets_low_confidence():
    single_month = [
        {"user_id": "test", "category": "Food", "amount": 500, "timestamp": "2026-02-10T12:00:00Z"},
        {"user_id": "test", "category": "Food", "amount": 400, "timestamp": "2026-02-15T12:00:00Z"},
    ]
    result = model.predict(single_month, "test")
    food_pred = next(p for p in result["predictions"] if p["category"] == "Food")
    assert food_pred["confidence"] == "low"
    assert food_pred["data_points"] == 1
    print(f"  Single-month → low confidence: {food_pred['note']}")


def test_multi_month_high_confidence():
    """Consistent spend across 3 months → high confidence."""
    steady = [
        {"user_id": "t", "category": "Food", "amount": 980,  "timestamp": "2025-11-15T12:00:00Z"},
        {"user_id": "t", "category": "Food", "amount": 1000, "timestamp": "2025-12-15T12:00:00Z"},
        {"user_id": "t", "category": "Food", "amount": 990,  "timestamp": "2026-01-15T12:00:00Z"},
    ]
    result = model.predict(steady, "t")
    food = next(p for p in result["predictions"] if p["category"] == "Food")
    assert food["confidence"] == "high"
    assert food["trend"] == "stable"
    assert abs(food["predicted"] - 990) < 100, \
        f"Prediction {food['predicted']} far from expected ~Rs.990"
    print(f"  Steady spend → high confidence, predicted Rs.{food['predicted']:.0f}")


def test_increasing_trend_extrapolated():
    rising = [
        {"user_id": "t", "category": "Shopping", "amount": 500,  "timestamp": "2025-12-15T12:00:00Z"},
        {"user_id": "t", "category": "Shopping", "amount": 750,  "timestamp": "2026-01-15T12:00:00Z"},
        {"user_id": "t", "category": "Shopping", "amount": 1000, "timestamp": "2026-02-15T12:00:00Z"},
    ]
    result = model.predict(rising, "t")
    pred = next(p for p in result["predictions"] if p["category"] == "Shopping")
    assert pred["trend"] == "increasing"
    assert pred["trend_pct"] > 5
    print(f"  Rising trend: {pred['trend_pct']}%, predicted Rs.{pred['predicted']:.0f}")


def test_trend_capped_at_max():
    extreme = [
        {"user_id": "t", "category": "X", "amount": 100,   "timestamp": "2025-12-15T12:00:00Z"},
        {"user_id": "t", "category": "X", "amount": 10000, "timestamp": "2026-01-15T12:00:00Z"},
    ]
    result = model.predict(extreme, "t")
    pred = next(p for p in result["predictions"] if p["category"] == "X")
    max_possible = 10000 * (1 + MAX_TREND_FACTOR)
    assert pred["predicted"] <= max_possible * 1.01
    print(f"  Extreme trend capped: Rs.{pred['predicted']:.0f} (cap Rs.{max_possible:.0f})")


def test_empty_input():
    result = model.predict([], "user_001")
    assert result["total_predicted"] == 0.0
    assert result["predictions"]     == []
    assert result["prediction_for"]  is None
    print("  Empty input handled correctly")


def test_no_pandas_objects_in_output():
    import pandas as pd

    def check(obj, path="root"):
        if isinstance(obj, (pd.Series, pd.DataFrame)):
            raise AssertionError(f"pandas object found at: {path}")
        if isinstance(obj, dict):
            for k, v in obj.items():
                check(v, f"{path}.{k}")
        if isinstance(obj, list):
            for i, v in enumerate(obj):
                check(v, f"{path}[{i}]")

    check(model.predict(txns_for("user_001"), "user_001"))
    print("  No pandas objects in output")


if __name__ == "__main__":
    tests = [
        test_returns_correct_structure,
        test_each_prediction_has_required_fields,
        test_predictions_sorted_by_amount,
        test_total_predicted_equals_sum,
        test_confidence_interval_from_real_variance,
        test_single_month_user_gets_low_confidence,
        test_multi_month_high_confidence,
        test_increasing_trend_extrapolated,
        test_trend_capped_at_max,
        test_empty_input,
        test_no_pandas_objects_in_output,
    ]
    print("\n=== Spending Predictor Tests ===")
    for t in tests:
        name = t.__name__.replace("test_", "").replace("_", " ").title()
        print(f"\n[{name}]")
        t()
    print("\n All spending predictor tests passed!")
