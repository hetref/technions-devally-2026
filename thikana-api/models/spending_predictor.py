"""
models/spending_predictor.py

Predicts next month's spending per category using a weighted moving average
with trend adjustment.

Why NOT RandomForest like the original:
  - RF needs large datasets. With 3-6 months of data we have 3-6 samples
    per category — fitting an ensemble of 50 trees on 6 samples is
    statistically meaningless.
  - The original trained RF on individual transactions and predicted
    "what will a single transaction cost on day X?" — that is NOT the
    same as "what will I spend total in category X next month?"
  - Exponential/weighted moving average is the right model for small
    financial time-series. It's used in production by YNAB, Monzo, etc.

Approach:
  1. Aggregate transactions into monthly totals per category.
  2. Compute a weighted moving average (WMA) of the last N months,
     giving more weight to recent months (exponential decay).
  3. Estimate a trend factor from the average month-over-month % change.
  4. Prediction = WMA × (1 + trend_factor).
  5. Confidence interval = ± 1 std dev of historical monthly totals.
     (Actual variance, not hardcoded ±15%.)
  6. Confidence level is based on data quantity and coefficient of variation.

Interface:
    model  = SpendingPredictor()
    result = model.predict(transactions, user_id)

Input:  list of transaction dicts (from Firebase or mock)
Output: structured dict — no DataFrames, no pandas objects

Improvements over original prediction_model.py:
  - Aggregates to monthly totals first (correct statistical unit)
  - Weighted moving average instead of RF on 6 data points
  - Confidence intervals computed from actual variance (not hardcoded ±15%)
  - No debug print() statements
  - No silent exception swallowing buried in stack traces
  - Works cleanly on sparse data (1-2 months) with appropriate fallback
"""

import pandas as pd
import numpy as np
from datetime import datetime


# ── Configuration ─────────────────────────────────────────────────────────────

WMA_WINDOW        = 3       # months to include in weighted moving average
WMA_WEIGHTS       = [0.6, 0.3, 0.1]  # most-recent → oldest (must sum to 1.0)
MIN_MONTHS_TREND  = 2       # need this many months to estimate a trend
MAX_TREND_FACTOR  = 0.30    # cap trend at ±30% to avoid runaway extrapolation
CV_HIGH_THRESHOLD = 0.30    # coefficient of variation below this → high confidence
CV_MED_THRESHOLD  = 0.60    # coefficient of variation below this → medium confidence


class SpendingPredictor:
    """
    Stateless — no training step, no model to fit.
    Call predict() directly with any transaction list.
    """

    # ── Public API ────────────────────────────────────────────────────────────

    def predict(self, transactions: list[dict], user_id: str) -> dict:
        """
        Predict next month's spending per category.

        Args:
            transactions: flat list of transaction dicts for ONE user.
                          Required fields: amount, category, timestamp
            user_id:      for labelling the response

        Returns:
            {
              "user_id": str,
              "prediction_for": str,          # "YYYY-MM" of next month
              "months_of_data": int,
              "total_predicted": float,
              "predictions": [
                {
                  "category":      str,
                  "predicted":     float,
                  "lower_bound":   float,     # predicted - 1 std dev
                  "upper_bound":   float,     # predicted + 1 std dev
                  "confidence":    str,       # "high" | "medium" | "low"
                  "trend":         str,       # "increasing" | "decreasing" | "stable"
                  "trend_pct":     float,     # avg month-over-month % change
                  "data_points":   int,       # months of history used
                  "note":          str,       # explanation of confidence
                }
              ]
            }
        """
        if not transactions:
            return self._empty_response(user_id)

        df = self._to_dataframe(transactions)
        if df.empty:
            return self._empty_response(user_id)

        # Aggregate: monthly total spend per category
        monthly = (
            df.groupby(["category", "year_month"])["amount"]
            .sum()
            .reset_index()
        )

        next_month    = self._next_month_label(df)
        predictions   = []
        total_predicted = 0.0

        for category in monthly["category"].unique():
            cat_monthly = (
                monthly[monthly["category"] == category]
                .sort_values("year_month")["amount"]
                .tolist()
            )
            pred = self._predict_category(category, cat_monthly)
            predictions.append(pred)
            total_predicted += pred["predicted"]

        # Sort by predicted amount descending
        predictions.sort(key=lambda x: -x["predicted"])

        return {
            "user_id":        user_id,
            "prediction_for": str(next_month),
            "months_of_data": int(monthly["year_month"].nunique()),
            "total_predicted": round(total_predicted, 2),
            "predictions":    predictions,
        }

    # ── Core prediction logic ─────────────────────────────────────────────────

    def _predict_category(self, category: str, monthly_totals: list[float]) -> dict:
        """
        Predict next month's total for one category.

        Args:
            category:      category name
            monthly_totals: list of monthly amounts, oldest first

        Returns a single prediction dict.
        """
        n = len(monthly_totals)

        # ── Base prediction: weighted moving average ──────────────────────────
        if n >= WMA_WINDOW:
            # Take the last WMA_WINDOW months and apply weights
            window   = monthly_totals[-WMA_WINDOW:]
            weights  = WMA_WEIGHTS[:WMA_WINDOW]
            base_prediction = sum(w * v for w, v in zip(weights, reversed(window)))
        elif n >= 2:
            # Fewer months than window — use equal weights on what we have
            weights = [1 / n] * n
            base_prediction = sum(w * v for w, v in zip(weights, monthly_totals))
        else:
            # Only 1 month — use it directly
            base_prediction = monthly_totals[0]

        # ── Trend factor ──────────────────────────────────────────────────────
        if n >= MIN_MONTHS_TREND:
            mom_changes = [
                (monthly_totals[i] - monthly_totals[i - 1]) / monthly_totals[i - 1]
                for i in range(1, n)
                if monthly_totals[i - 1] > 0
            ]
            avg_trend = float(np.mean(mom_changes)) if mom_changes else 0.0
            # Cap: don't extrapolate more than ±30% in one step
            trend_factor = max(-MAX_TREND_FACTOR, min(MAX_TREND_FACTOR, avg_trend))
        else:
            avg_trend    = 0.0
            trend_factor = 0.0

        predicted = max(0.0, base_prediction * (1 + trend_factor))

        # ── Confidence interval from historical variance ───────────────────────
        if n >= 2:
            std_dev = float(np.std(monthly_totals, ddof=1))
        else:
            # Only 1 data point — use 20% of the value as uncertainty
            std_dev = monthly_totals[0] * 0.20

        lower = max(0.0, predicted - std_dev)
        upper = predicted + std_dev

        # ── Confidence level ─────────────────────────────────────────────────
        mean = float(np.mean(monthly_totals))
        cv   = (std_dev / mean) if mean > 0 else 1.0

        if n >= 3 and cv < CV_HIGH_THRESHOLD:
            confidence = "high"
            note       = f"Consistent spending pattern across {n} months"
        elif n >= 2 and cv < CV_MED_THRESHOLD:
            confidence = "medium"
            note       = f"{n} months of data — some variation in spending"
        else:
            confidence = "low"
            note       = (
                "Only 1 month of data — prediction is an estimate"
                if n < 2
                else f"High variance in {category} spending (CV={cv:.0%})"
            )

        # ── Trend label ───────────────────────────────────────────────────────
        trend_pct = round(avg_trend * 100, 1)
        if trend_pct > 5:
            trend = "increasing"
        elif trend_pct < -5:
            trend = "decreasing"
        else:
            trend = "stable"

        return {
            "category":    category,
            "predicted":   round(predicted, 2),
            "lower_bound": round(lower, 2),
            "upper_bound": round(upper, 2),
            "confidence":  confidence,
            "trend":       trend,
            "trend_pct":   trend_pct,
            "data_points": n,
            "note":        note,
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _next_month_label(df: pd.DataFrame):
        """Return the Period for the month after the latest transaction."""
        latest = df["year_month"].max()
        return latest + 1

    @staticmethod
    def _to_dataframe(transactions: list[dict]) -> pd.DataFrame:
        df = pd.DataFrame(transactions)

        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
            df = df.dropna(subset=["timestamp"])

        if "amount" in df.columns:
            df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
            df = df.dropna(subset=["amount"])

        if "category" not in df.columns:
            df["category"] = "Unknown"

        df["year_month"] = df["timestamp"].dt.tz_localize(None).dt.to_period("M")

        return df.reset_index(drop=True)

    @staticmethod
    def _empty_response(user_id: str) -> dict:
        return {
            "user_id":         user_id,
            "prediction_for":  None,
            "months_of_data":  0,
            "total_predicted": 0.0,
            "predictions":     [],
        }
