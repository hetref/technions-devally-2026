"""
tests/test_anomaly.py

Tests for models/anomaly_detector.py

Run:  python -m pytest tests/test_anomaly.py -v
"""

from models.anomaly_detector import AnomalyDetector
import json
from pathlib import Path

detector = AnomalyDetector()

# ── Load mock transactions once ───────────────────────────────────────────────

_DB = json.loads(
    (Path(__file__).parent.parent / "data" / "mock_db.json").read_text()
)


def txns_for(user_id: str) -> list[dict]:
    return [t for t in _DB["transactions"] if t["user_id"] == user_id]


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_returns_correct_structure():
    result = detector.detect(txns_for("user_001"), "user_001")
    assert "user_id"            in result
    assert "total_transactions" in result
    assert "anomaly_count"      in result
    assert "anomalies"          in result
    assert result["user_id"]    == "user_001"
    print("  Structure OK")


def test_detects_food_spike():
    """txn_005: Food Rs.3800 vs normal ~Rs.410 — should be category_spike"""
    result = detector.detect(txns_for("user_001"), "user_001")
    food_anomalies = [
        a for a in result["anomalies"]
        if a["category"] == "Food" and a["amount"] == 3800
    ]
    assert len(food_anomalies) == 1, "Food spike txn_005 not detected!"
    assert "category_spike" in food_anomalies[0]["flags"]
    print(f"  Food spike detected: {food_anomalies[0]['flags']}")


def test_detects_rapid_succession():
    """txn_009 + txn_010: Transport within 35 minutes — should be rapid_succession"""
    result = detector.detect(txns_for("user_001"), "user_001")
    rapid = [
        a for a in result["anomalies"]
        if a["category"] == "Transport" and "rapid_succession" in a["flags"]
    ]
    assert len(rapid) >= 1, "Rapid succession Transport not detected!"
    print(f"  Rapid succession detected: {[a['amount'] for a in rapid]}")


def test_detects_utilities_spike():
    """txn_014: Utilities Rs.5800 vs normal ~Rs.1243 — should be flagged"""
    result = detector.detect(txns_for("user_001"), "user_001")
    ut_anomalies = [
        a for a in result["anomalies"]
        if a["category"] == "Utilities" and a["amount"] == 5800
    ]
    assert len(ut_anomalies) == 1, "Utilities spike txn_014 not detected!"
    print(f"  Utilities spike detected with flags: {ut_anomalies[0]['flags']}")


def test_no_anomalies_in_normal_shopping():
    """Shopping txns are all ~Rs.720 avg — no anomalies expected"""
    result = detector.detect(txns_for("user_001"), "user_001")
    shopping_anomalies = [
        a for a in result["anomalies"] if a["category"] == "Shopping"
    ]
    assert len(shopping_anomalies) == 0, (
        f"False positive in Shopping: {shopping_anomalies}"
    )
    print("  No false positives in Shopping")


def test_empty_input_returns_empty():
    result = detector.detect([], "user_001")
    assert result["anomaly_count"] == 0
    assert result["anomalies"]     == []
    print("  Empty input handled correctly")


def test_output_has_no_dataframes():
    """Ensure no pandas objects leak into the output dicts"""
    import pandas as pd
    result = detector.detect(txns_for("user_001"), "user_001")
    for anomaly in result["anomalies"]:
        for key, val in anomaly.items():
            assert not isinstance(val, pd.Series), f"pandas Series leaked in key: {key}"
            assert not isinstance(val, pd.DataFrame), f"DataFrame leaked in key: {key}"
    print("  No pandas objects in output")


def test_severity_assignment():
    """High severity = 2+ flags. Medium = exactly 1 flag."""
    result = detector.detect(txns_for("user_001"), "user_001")
    for anomaly in result["anomalies"]:
        if len(anomaly["flags"]) >= 2:
            assert anomaly["severity"] == "high", f"Expected high for {anomaly['flags']}"
        else:
            assert anomaly["severity"] == "medium"
    print("  Severity assignment correct")


def test_scores_for_user_002():
    """user_002: Rent Rs.15000 twice in 5 minutes — should flag rapid_succession"""
    result = detector.detect(txns_for("user_002"), "user_002")
    rent_rapid = [
        a for a in result["anomalies"]
        if a["category"] == "Rent" and "rapid_succession" in a["flags"]
    ]
    assert len(rent_rapid) >= 1, "Rent rapid succession not detected for user_002!"
    print(f"  user_002 Rent rapid succession: {[a['amount'] for a in rent_rapid]}")


if __name__ == "__main__":
    tests = [
        test_returns_correct_structure,
        test_detects_food_spike,
        test_detects_rapid_succession,
        test_detects_utilities_spike,
        test_no_anomalies_in_normal_shopping,
        test_empty_input_returns_empty,
        test_output_has_no_dataframes,
        test_severity_assignment,
        test_scores_for_user_002,
    ]
    print("\n=== Anomaly Detector Tests ===")
    for t in tests:
        name = t.__name__.replace("test_", "").replace("_", " ").title()
        print(f"\n[{name}]")
        t()
    print("\n All anomaly tests passed!")
