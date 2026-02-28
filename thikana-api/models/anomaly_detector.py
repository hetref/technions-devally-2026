"""
models/anomaly_detector.py

Detects unusual spending patterns in a user's transaction history.

Three independent detection methods:
  1. Category Z-score   — amount is statistically unusual for that category
  2. Rolling spike      — sudden jump compared to the recent rolling average
  3. Rapid succession   — high-value transaction shortly after another

Each method flags independently. A single transaction can trigger 1, 2, or
all 3 methods — all reasons are collected and surfaced together.

Interface:
    detector = AnomalyDetector()
    result   = detector.detect(transactions, user_id)

Input:  list of transaction dicts (from Firebase or mock)
Output: structured dict — no DataFrames leak out of this class
"""

import pandas as pd
import numpy as np
from scipy.stats import zscore as scipy_zscore
from datetime import datetime

# ── Thresholds (tune here, not buried in the code) ────────────────────────────

CATEGORY_ZSCORE_THRESHOLD = 2.0   # std deviations from category mean
ROLLING_ZSCORE_THRESHOLD  = 2.5   # std deviations from 3-tx rolling average
RAPID_WINDOW_HOURS        = 1.0   # transactions within this window are "rapid"
RAPID_AMOUNT_MULTIPLIER   = 0.8   # must exceed rolling mean × this to qualify
                                  # (0.8 = any near-normal-cost rapid tx is suspicious;
                                  #  catches duplicate charges unlike 1.5 which misses them)
ROLLING_WINDOW            = 3     # how many past transactions form the window


class AnomalyDetector:
    """
    Stateless — no model to train, no state between calls.
    Call detect() directly with any transaction list.
    """

    # ── Public API ────────────────────────────────────────────────────────────

    def detect(self, transactions: list[dict], user_id: str) -> dict:
        """
        Run all anomaly detection methods on the given transactions.

        Args:
            transactions: flat list of transaction dicts for ONE user
                          Required fields: amount, category, timestamp
            user_id:      for labelling the response

        Returns:
            {
              "user_id": str,
              "total_transactions": int,
              "anomaly_count": int,
              "anomalies": [
                {
                  "transaction_id": str,
                  "amount": float,
                  "category": str,
                  "timestamp": str,
                  "flags": ["category_spike", "rolling_spike", "rapid_succession"],
                  "details": ["Amount is 8.3 std devs from Food mean (Rs.410)", ...]
                }
              ]
            }
        """
        if not transactions:
            return self._empty_response(user_id)

        df = self._to_dataframe(transactions)

        if df.empty or len(df) < 2:
            return self._empty_response(user_id)

        # Run the three detectors — each adds boolean columns to df
        df = self._flag_category_zscores(df)
        df = self._flag_rolling_spikes(df)
        df = self._flag_rapid_succession(df)

        # Collect all flagged rows
        anomaly_mask = (
            df["is_category_anomaly"]
            | df["is_spike_anomaly"]
            | df["is_rapid_anomaly"]
        )
        anomaly_df = df[anomaly_mask].copy()

        return {
            "user_id": user_id,
            "total_transactions": len(df),
            "anomaly_count": len(anomaly_df),
            "anomalies": self._build_output(anomaly_df, df),
        }

    # ── Detection methods ─────────────────────────────────────────────────────

    def _flag_category_zscores(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Method 1: Is this amount unusual for its category?
        Computes a Z-score per category. Requires >= 2 transactions in a
        category to be meaningful; single-transaction categories score 0.
        """
        # Store category stats for use in detail messages
        self._cat_stats = (
            df.groupby("category")["amount"]
            .agg(cat_mean="mean", cat_std="std")
            .fillna(0)
        )

        df["category_zscore"] = df.groupby("category")["amount"].transform(
            lambda x: (
                scipy_zscore(x, nan_policy="omit")
                if len(x) > 1
                else np.zeros(len(x))
            )
        )
        df["is_category_anomaly"] = (
            df["category_zscore"].abs() > CATEGORY_ZSCORE_THRESHOLD
        )
        return df

    def _flag_rolling_spikes(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Method 2: Is this a sudden spike vs recent transactions?
        Uses a per-user, per-category rolling window of the last N transactions.
        """
        df = df.sort_values(["category", "timestamp"])

        df["rolling_mean"] = df.groupby("category")["amount"].transform(
            lambda x: x.rolling(window=ROLLING_WINDOW, min_periods=1).mean()
        )
        df["rolling_std"] = df.groupby("category")["amount"].transform(
            lambda x: x.rolling(window=ROLLING_WINDOW, min_periods=1).std()
        ).fillna(1)  # avoid divide-by-zero on first transaction

        # Normalise: replace 0 std with 1 to avoid inf Z-score
        df["rolling_zscore"] = (
            (df["amount"] - df["rolling_mean"])
            / df["rolling_std"].replace(0, 1)
        )
        df["is_spike_anomaly"] = (
            df["rolling_zscore"].abs() > ROLLING_ZSCORE_THRESHOLD
        )
        return df

    def _flag_rapid_succession(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Method 3: High-value transaction immediately after another one?
        Flags if:
          - time since last transaction in the same category < RAPID_WINDOW_HOURS
          - AND amount > rolling_mean × RAPID_AMOUNT_MULTIPLIER
        """
        df = df.sort_values(["category", "timestamp"])
        df["time_diff_hrs"] = (
            df.groupby("category")["timestamp"]
            .diff()
            .dt.total_seconds()
            / 3600
        )
        df["is_rapid_anomaly"] = (
            (df["time_diff_hrs"] < RAPID_WINDOW_HOURS)
            & (df["amount"] > df["rolling_mean"] * RAPID_AMOUNT_MULTIPLIER)
        )
        return df

    # ── Output builder ────────────────────────────────────────────────────────

    def _build_output(self, anomaly_df: pd.DataFrame, full_df: pd.DataFrame) -> list[dict]:
        """
        Build the final output list — no pandas objects, only plain Python types.
        Uses vectorized label building instead of a per-row .loc loop.
        """
        records = []

        for _, row in anomaly_df.iterrows():
            flags   = []
            details = []
            cat     = row["category"]

            if row["is_category_anomaly"]:
                flags.append("category_spike")
                cat_mean = self._cat_stats.loc[cat, "cat_mean"] if cat in self._cat_stats.index else 0
                cat_std  = self._cat_stats.loc[cat, "cat_std"]  if cat in self._cat_stats.index else 0
                z = abs(row["category_zscore"])
                details.append(
                    f"Rs.{row['amount']:,.0f} is {z:.1f} std devs from"
                    f" {cat} mean (avg Rs.{cat_mean:,.0f}, std Rs.{cat_std:,.0f})"
                )

            if row["is_spike_anomaly"]:
                flags.append("rolling_spike")
                z = abs(row["rolling_zscore"])
                details.append(
                    f"Rs.{row['amount']:,.0f} is {z:.1f} std devs above"
                    f" recent {ROLLING_WINDOW}-transaction average"
                    f" (Rs.{row['rolling_mean']:,.0f})"
                )

            if row["is_rapid_anomaly"]:
                flags.append("rapid_succession")
                hrs = row["time_diff_hrs"]
                pct = ((row["amount"] / row["rolling_mean"]) - 1) * 100 if row["rolling_mean"] else 0
                details.append(
                    f"Occurred {hrs:.1f}h after the previous {cat} transaction"
                    f" and is {pct:.0f}% above recent average"
                )

            records.append({
                "transaction_id": str(row.get("id", "")),
                "amount":         float(row["amount"]),
                "category":       cat,
                "timestamp":      str(row["timestamp"]),
                "flags":          flags,
                "details":        details,
                "severity":       "high" if len(flags) >= 2 else "medium",
            })

        # Sort by severity first, then by amount descending
        records.sort(key=lambda r: (0 if r["severity"] == "high" else 1, -r["amount"]))
        return records

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _to_dataframe(transactions: list[dict]) -> pd.DataFrame:
        """
        Convert a list of Firebase transaction dicts to a clean DataFrame.
        Handles both ISO strings and Firebase Timestamp objects for the
        timestamp field.
        """
        df = pd.DataFrame(transactions)

        # Normalise timestamp
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
            df = df.dropna(subset=["timestamp"])

        # Normalise amount
        if "amount" in df.columns:
            df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
            df = df.dropna(subset=["amount"])

        # Ensure category exists
        if "category" not in df.columns:
            df["category"] = "Unknown"

        return df.reset_index(drop=True)

    @staticmethod
    def _empty_response(user_id: str) -> dict:
        return {
            "user_id": user_id,
            "total_transactions": 0,
            "anomaly_count": 0,
            "anomalies": [],
        }
