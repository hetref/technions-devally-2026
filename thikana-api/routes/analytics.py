"""
routes/analytics.py

Analytics endpoints — financial analysis for a user's transactions.
All logic lives in models/ — this file is routes ONLY.

Endpoints:
  GET /analytics/anomalies/{user_id}         ← anomaly detection
  GET /analytics/insights/{user_id}          ← spending insights
  GET /analytics/recommendations/{user_id}   ← expense recommendations
  GET /analytics/predictions/{user_id}       ← next-month spending forecast
"""

import json
from pathlib import Path
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

# ── Data loading helper (mock only) ──────────────────────────────────────────

_MOCK_DB_PATH = Path(__file__).parent.parent / "data" / "mock_db.json"
_mock_cache: dict | None = None

def _get_transactions(user_id: str) -> list[dict]:
    """
    Returns transactions for a user.

    USE_MOCK=True  → reads from data/mock_db.json  (local dev / tests)
    USE_MOCK=False → reads from Firestore           (production)

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

    # ── Live Firestore ────────────────────────────────────────────────────────
    from db.firebase import FirebaseDB
    db = FirebaseDB()
    return db.get_user_transactions(user_id)



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
        description="Average monthly income in Rs. (0 = unknown, uses total spend as reference)",
        ge=0,
    ),
):
    """
    Generate budget recommendations and saving strategies.

    Returns 4 sections:
      - budget_suggestions   — categories exceeding 20% of income with saving targets
      - timing_optimization  — best day of week to make purchases per category
      - saving_opportunities — categories that are overspent or trending up
      - category_tips        — severity-scaled tips for any overspent category

    Pass ?monthly_income=50000 for income-relative recommendations.
    Without income, percentages are relative to total monthly spend.
    """
    try:
        transactions = _get_transactions(user_id)
        return _recommender.recommend(transactions, user_id, monthly_income)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions/{user_id}")
def get_predictions(user_id: str):
    """
    Predict next month's spending per category using weighted moving average
    with trend adjustment.

    Each prediction includes:
      - predicted:    expected total spend for the category next month
      - lower_bound:  predicted - 1 std dev (68% likely to be above this)
      - upper_bound:  predicted + 1 std dev (68% likely to be below this)
      - confidence:   'high' (3+ stable months) | 'medium' | 'low'
      - trend:        'increasing' | 'decreasing' | 'stable'
      - trend_pct:    average month-over-month % change
    """
    try:
        transactions = _get_transactions(user_id)
        return _predictor.predict(transactions, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
