"""
routes/analytics.py

Analytics endpoints — financial analysis for a user's transactions.
All logic lives in models/ — this file is routes ONLY.

Endpoints:
  GET /analytics/anomalies/{user_id}         ← anomaly detection
  GET /analytics/insights/{user_id}          ← spending insights
  GET /analytics/recommendations/{user_id}   ← expense recommendations
  GET /analytics/predictions/{user_id}       ← next-month spending forecast
  GET /analytics/income-summary/{user_id}    ← income aggregated by month/category
"""

import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Query

from models.anomaly_detector   import AnomalyDetector
from models.spending_insights  import SpendingInsights
from models.expense_recommender import ExpenseRecommender
from models.spending_predictor  import SpendingPredictor

router = APIRouter(prefix="/analytics", tags=["Analytics"])

_detector    = AnomalyDetector()    # stateless — shared safely
_insights    = SpendingInsights()   # stateless — shared safely
_recommender = ExpenseRecommender() # stateless — shared safely
_predictor   = SpendingPredictor()  # stateless — shared safely

# ── Data loading helper ───────────────────────────────────────────────────────

_MOCK_DB_PATH = Path(__file__).parent.parent / "data" / "mock_db.json"
_mock_cache: dict | None = None

def _get_transactions(user_id: str) -> list[dict]:
    """
    Returns expense transactions for a user.
    USE_MOCK=True  → reads from data/mock_db.json
    USE_MOCK=False → reads from Firestore
    Firestore path: transactions/{user_id}/user_transactions/{doc_id}
    """
    from config import USE_MOCK
    if USE_MOCK:
        global _mock_cache
        if _mock_cache is None:
            with open(_MOCK_DB_PATH, "r", encoding="utf-8") as f:
                _mock_cache = json.load(f)
        all_txns = _mock_cache.get("transactions", [])
        return [t for t in all_txns if t.get("user_id") == user_id]

    from db.firebase import FirebaseDB
    db = FirebaseDB()
    return db.get_user_transactions(user_id)


def _get_income(user_id: str) -> list[dict]:
    """
    Returns income entries for a user.
    USE_MOCK=True  → returns empty list (mock has no income data)
    USE_MOCK=False → reads from Firestore
    Firestore path: transactions/{user_id}/user_income/{doc_id}
    """
    from config import USE_MOCK
    if USE_MOCK:
        return []

    from db.firebase import FirebaseDB
    db = FirebaseDB()
    return db.get_user_income(user_id)


def _compute_monthly_income(income_entries: list[dict]) -> float:
    """
    Compute the average monthly income from income entries.
    Falls back to 0 if no entries exist.
    """
    if not income_entries:
        return 0.0

    monthly_totals: dict[str, float] = defaultdict(float)
    for entry in income_entries:
        ts = entry.get("timestamp", "")
        amt = float(entry.get("amount", 0) or 0)
        try:
            dt = datetime.fromisoformat(str(ts).replace(" ", "T").rstrip("Z"))
            key = f"{dt.year}-{dt.month:02d}"
        except Exception:
            key = "unknown"
        monthly_totals[key] += amt

    valid = {k: v for k, v in monthly_totals.items() if k != "unknown"}
    if not valid:
        return 0.0
    return round(sum(valid.values()) / len(valid), 2)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/anomalies/{user_id}")
def get_anomalies(
    user_id: str,
    min_severity: str = Query(
        "medium",
        description="Minimum severity to include: 'medium' or 'high'",
        pattern="^(medium|high)$",
    ),
):
    """
    Detect unusual transactions in a user's spending history.

    Detection methods:
      - category_spike:    amount is statistically unusual for that category
      - rolling_spike:     sudden jump vs the last 3 transactions
      - rapid_succession:  high-value tx shortly after another in same category

    Each anomaly gets a severity: 'high' (2+ flags) or 'medium' (1 flag).
    """
    try:
        transactions = _get_transactions(user_id)
        result = _detector.detect(transactions, user_id)

        # Filter by severity if requested
        if min_severity == "high":
            result["anomalies"] = [
                a for a in result["anomalies"] if a["severity"] == "high"
            ]
            result["anomaly_count"] = len(result["anomalies"])

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/{user_id}")
def get_insights(user_id: str):
    """
    Analyze a user's spending habits and surface actionable insights.

    Returns 5 sections:
      - spending_patterns    — peak day/hour, best day by category
      - category_analysis    — breakdown, share, trend per category
      - saving_opportunities — high-variance and high-frequency categories
      - behavioral_insights  — impulse risk, daily velocity, savings ceiling
      - recommendations      — ranked, actionable suggestions
    """
    try:
        transactions = _get_transactions(user_id)
        return _insights.analyze(transactions, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{user_id}")
def get_recommendations(
    user_id: str,
    monthly_income: float = Query(
        0,
        description="Average monthly income in Rs. (0 = auto-calculated from Firestore income)",
        ge=0,
    ),
):
    """
    Generate budget recommendations and saving strategies.
    If monthly_income is 0 (default), it is auto-calculated from the user's
    income entries in Firestore so recommendations are always income-relative.
    """
    try:
        transactions = _get_transactions(user_id)
        # Auto-calculate income from Firestore if not provided
        if monthly_income == 0:
            income_entries = _get_income(user_id)
            monthly_income = _compute_monthly_income(income_entries)
        return _recommender.recommend(transactions, user_id, monthly_income)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions/{user_id}")
def get_predictions(user_id: str):
    """
    Predict next month's spending per category using weighted moving average
    with trend adjustment.
    """
    try:
        transactions = _get_transactions(user_id)
        return _predictor.predict(transactions, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/income-summary/{user_id}")
def get_income_summary(user_id: str):
    """
    Aggregate income data for the user.

    Returns:
      - total_income:       float — all-time total
      - monthly_average:    float — average income per month
      - monthly_breakdown:  list  — [{month, total, count}] sorted ascending
      - category_breakdown: list  — [{category, total, count}] sorted by total desc
      - date_range:         {from, to}
      - total_entries:      int
    """
    try:
        income_entries = _get_income(user_id)

        if not income_entries:
            return {
                "user_id": user_id,
                "total_income": 0,
                "monthly_average": 0,
                "monthly_breakdown": [],
                "category_breakdown": [],
                "date_range": {"from": None, "to": None},
                "total_entries": 0,
            }

        monthly: dict[str, dict] = defaultdict(lambda: {"total": 0.0, "count": 0})
        categories: dict[str, dict] = defaultdict(lambda: {"total": 0.0, "count": 0})
        timestamps = []

        for entry in income_entries:
            amt = float(entry.get("amount", 0) or 0)
            cat = entry.get("category", "Other") or "Other"
            ts_raw = entry.get("timestamp", "")

            try:
                dt = datetime.fromisoformat(str(ts_raw).replace(" ", "T").rstrip("Z"))
                month_key = f"{dt.year}-{dt.month:02d}"
                timestamps.append(dt)
            except Exception:
                month_key = "Unknown"

            monthly[month_key]["total"] += amt
            monthly[month_key]["count"] += 1
            categories[cat]["total"] += amt
            categories[cat]["count"] += 1

        total_income = sum(v["total"] for v in monthly.values())
        valid_months = {k: v for k, v in monthly.items() if k != "Unknown"}
        monthly_average = round(
            sum(v["total"] for v in valid_months.values()) / max(1, len(valid_months)), 2
        )

        monthly_breakdown = sorted(
            [{"month": k, "total": round(v["total"], 2), "count": v["count"]} for k, v in monthly.items()],
            key=lambda x: x["month"],
        )
        category_breakdown = sorted(
            [{"category": k, "total": round(v["total"], 2), "count": v["count"]} for k, v in categories.items()],
            key=lambda x: -x["total"],
        )

        return {
            "user_id": user_id,
            "total_income": round(total_income, 2),
            "monthly_average": monthly_average,
            "monthly_breakdown": monthly_breakdown,
            "category_breakdown": category_breakdown,
            "date_range": {
                "from": str(min(timestamps).date()) if timestamps else None,
                "to":   str(max(timestamps).date()) if timestamps else None,
            },
            "total_entries": len(income_entries),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
