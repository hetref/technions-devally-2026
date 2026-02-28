"""
routes/analytics.py

Analytics endpoints — financial analysis for a user's transactions.
All logic lives in models/ — this file is routes ONLY.

Current endpoints:
  GET /analytics/anomalies/{user_id}  ← anomaly detection
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query

from models.anomaly_detector import AnomalyDetector

router = APIRouter(prefix="/analytics", tags=["Analytics"])

_detector = AnomalyDetector()   # stateless — shared safely across requests

# ── Data loading helper (mock only) ──────────────────────────────────────────

_MOCK_DB_PATH = Path(__file__).parent.parent / "data" / "mock_db.json"
_mock_cache: dict | None = None

def _get_transactions(user_id: str) -> list[dict]:
    """
    Returns transactions for a user.
    Mock: reads from data/mock_db.json.
    Firebase (Phase 3): query transactions subcollection.
    """
    from config import USE_MOCK

    if USE_MOCK:
        global _mock_cache
        if _mock_cache is None:
            with open(_MOCK_DB_PATH, "r", encoding="utf-8") as f:
                _mock_cache = json.load(f)
        all_txns = _mock_cache.get("transactions", [])
        return [t for t in all_txns if t.get("user_id") == user_id]

    # ── Firebase stub (Phase 3) ───────────────────────────────────────────────
    # from db.firebase import _db
    # txn_ref = _db.collection("users").document(user_id).collection("transactions")
    # return [doc.to_dict() | {"id": doc.id} for doc in txn_ref.stream()]
    raise NotImplementedError("Firebase mode not yet wired for analytics")


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
