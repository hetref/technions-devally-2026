"""
models/spending_insights.py

Analyzes a user's transaction history and surfaces 5 types of insights:
  1. spending_patterns   — when they spend (peak day/hour, category timing)
  2. category_analysis   — what they spend on (breakdown, trend, share)
  3. saving_opportunities— where they can cut back (high variance, high frequency)
  4. behavioral_insights — impulse risk, daily velocity, savings ceiling
  5. recommendations     — ranked, actionable suggestions

Interface:
    model  = SpendingInsights()
    result = model.analyze(transactions, user_id)

Input:  list of transaction dicts (from Firebase or mock)
Output: structured dict — no DataFrames, no pandas objects

Improvements over original insights_model.py:
  - Removed dead imports (KMeans, defaultdict — never used)
  - Removed CSV loader (load_data) — accepts list[dict] directly
  - Removed broken instance state (self.spending_patterns etc.)
  - Trend now uses last-month vs previous-month (not first vs last element)
  - Savings potential uses 25th percentile as target (not minimum — min is too optimistic)
  - Velocity trend uses month-over-month, not first-3 vs last-3 transactions
  - All output is plain Python types — no leaking pandas objects
"""

import pandas as pd
import numpy as np
from datetime import datetime, timezone


# ── Minimum data requirements ─────────────────────────────────────────────────

MIN_TRANSACTIONS_FOR_CATEGORY = 2    # need at least this many to analyze a category
MIN_TRANSACTIONS_FOR_TREND    = 2    # need at least 2 monthly data points for a trend


class SpendingInsights:
    """
    Stateless — instantiate once, call analyze() many times.
    """

    # ── Public API ────────────────────────────────────────────────────────────

    def analyze(self, transactions: list[dict], user_id: str) -> dict:
        """
        Run all spending analyses on the given transactions.

        Args:
            transactions: flat list of transaction dicts for ONE user.
                          Required fields: amount, category, timestamp
            user_id:      for labelling the response

        Returns:
            {
              "user_id": str,
              "total_transactions": int,
              "total_spent": float,
              "date_range": {"from": str, "to": str},
              "spending_patterns":    {...},
              "category_analysis":    {...},
              "saving_opportunities": [...],
              "behavioral_insights":  {...},
              "recommendations":      [...]
            }
        """
        if not transactions:
            return self._empty_response(user_id)

        df = self._to_dataframe(transactions)

        if df.empty:
            return self._empty_response(user_id)

        return {
            "user_id":             user_id,
            "total_transactions":  len(df),
            "total_spent":         round(float(df["amount"].sum()), 2),
            "date_range": {
                "from": str(df["timestamp"].min().date()),
                "to":   str(df["timestamp"].max().date()),
            },
            "spending_patterns":    self._analyze_patterns(df),
            "category_analysis":    self._analyze_categories(df),
            "saving_opportunities": self._identify_saving_opportunities(df),
            "behavioral_insights":  self._analyze_behavior(df),
            "recommendations":      self._generate_recommendations(df),
        }

    # ── Section 1: Temporal patterns ─────────────────────────────────────────

    def _analyze_patterns(self, df: pd.DataFrame) -> dict:
        """When does this user spend the most?"""

        peak_day  = df.groupby("day_of_week")["amount"].mean().idxmax()
        peak_hour = df.groupby("hour")["amount"].mean().idxmax()
        peak_week = df.groupby("week_of_month")["amount"].mean().idxmax()

        # Per-category: which day has the lowest average (best day to buy)
        category_timing = {}
        for category in df["category"].unique():
            cat = df[df["category"] == category]
            if len(cat) < MIN_TRANSACTIONS_FOR_CATEGORY:
                continue
            by_day = cat.groupby("day_of_week")["amount"].mean()
            if by_day.empty or by_day.max() == 0:
                continue
            category_timing[category] = {
                "cheapest_day":     by_day.idxmin(),
                "priciest_day":     by_day.idxmax(),
                "day_variance_pct": round(
                    (by_day.max() - by_day.min()) / by_day.max() * 100, 1
                ),
            }

        return {
            "peak_spending_day":  peak_day,
            "peak_spending_hour": int(peak_hour),
            "peak_week_of_month": int(peak_week),
            "category_timing":    category_timing,
        }

    # ── Section 2: Category breakdown ────────────────────────────────────────

    def _analyze_categories(self, df: pd.DataFrame) -> dict:
        """Detailed view of each spending category."""
        total = df["amount"].sum()
        result = {}

        for category in df["category"].unique():
            cat = df[df["category"] == category]
            if len(cat) < MIN_TRANSACTIONS_FOR_CATEGORY:
                continue

            cat_total = cat["amount"].sum()
            trend     = self._compute_trend(cat)

            result[category] = {
                "total_spent":         round(float(cat_total), 2),
                "average_transaction": round(float(cat["amount"].mean()), 2),
                "median_transaction":  round(float(cat["amount"].median()), 2),
                "transaction_count":   len(cat),
                "share_of_total_pct":  round(float(cat_total / total * 100), 1),
                "trend":               trend,
            }

        # Sort by total_spent descending
        return dict(
            sorted(result.items(), key=lambda x: -x[1]["total_spent"])
        )

    def _compute_trend(self, cat: pd.DataFrame) -> str:
        """
        Compare last month's average to the previous month's average.
        Returns: 'increasing', 'decreasing', or 'stable'.
        Falls back to 'stable' if there's only 1 month of data.
        """
        monthly = (
            cat.groupby(cat["timestamp"].dt.to_period("M"))["amount"]
            .mean()
            .sort_index()
        )
        if len(monthly) < MIN_TRANSACTIONS_FOR_TREND:
            return "stable"

        last     = float(monthly.iloc[-1])
        previous = float(monthly.iloc[-2])

        if previous == 0:
            return "stable"

        change_pct = (last - previous) / previous * 100

        if change_pct > 10:
            return "increasing"
        elif change_pct < -10:
            return "decreasing"
        return "stable"

    # ── Section 3: Saving opportunities ──────────────────────────────────────

    def _identify_saving_opportunities(self, df: pd.DataFrame) -> list[dict]:
        """
        Two types of savings opportunities:

        1. high_variance — spending in this category is inconsistent.
           If you spent Rs.100 once and Rs.1000 another time on the same thing,
           standardizing towards the lower end has real savings potential.
           Target: 25th percentile (not minimum — minimum is often a lucky one-off)

        2. high_frequency — lots of small transactions in one category.
           Batching purchases often costs less per unit.
        """
        opportunities = []

        for category in df["category"].unique():
            cat = df[df["category"] == category]
            if len(cat) < MIN_TRANSACTIONS_FOR_CATEGORY:
                continue

            mean     = float(cat["amount"].mean())
            std      = float(cat["amount"].std(ddof=1)) if len(cat) > 1 else 0
            cv       = std / mean if mean > 0 else 0   # coefficient of variation
            p25      = float(cat["amount"].quantile(0.25))
            count    = len(cat)
            total    = float(cat["amount"].sum())

            # High-variance opportunity
            if cv > 0.4:   # std > 40% of mean  →  inconsistent spending
                # Savings if all transactions were at the 25th percentile
                savings = max(0.0, (mean - p25) * count)
                opportunities.append({
                    "type":              "high_variance",
                    "category":          category,
                    "description":       (
                        f"Your {category} spending varies a lot "
                        f"(avg Rs.{mean:,.0f}, std Rs.{std:,.0f}). "
                        f"Aiming for the typical lower spend of Rs.{p25:,.0f} "
                        f"could save you money."
                    ),
                    "potential_savings": round(savings, 2),
                    "priority":          "high" if cv > 0.7 else "medium",
                })

            # High-frequency opportunity
            if count > 6 and mean < df["amount"].mean():
                opportunities.append({
                    "type":              "high_frequency",
                    "category":          category,
                    "description":       (
                        f"You made {count} small {category} transactions "
                        f"(avg Rs.{mean:,.0f} each). "
                        f"Consolidating purchases could reduce costs."
                    ),
                    "potential_savings": round(total * 0.15, 2),  # 15% from bulk
                    "priority":          "medium",
                })

        # Sort by potential_savings descending
        opportunities.sort(key=lambda x: -x["potential_savings"])
        return opportunities

    # ── Section 4: Behavioral insights ───────────────────────────────────────

    def _analyze_behavior(self, df: pd.DataFrame) -> dict:
        return {
            "impulse_risk":     self._impulse_risk(df),
            "spending_velocity": self._spending_velocity(df),
            "savings_ceiling":  self._savings_ceiling(df),
        }

    def _impulse_risk(self, df: pd.DataFrame) -> dict:
        """
        Impulse risk: transactions that happened within 1 hour of a previous
        transaction (regardless of category). These clusters suggest unplanned spending.
        """
        sorted_df = df.sort_values("timestamp")
        time_diffs = sorted_df["timestamp"].diff().dt.total_seconds() / 3600
        rapid      = sorted_df[time_diffs < 1.0]

        # Hours where transaction count is above mean + 1 std
        hourly_counts = sorted_df.groupby("hour")["amount"].count()
        if len(hourly_counts) > 1 and hourly_counts.std() > 0:
            risk_hours = hourly_counts[
                hourly_counts > hourly_counts.mean() + hourly_counts.std()
            ].index.tolist()
        else:
            risk_hours = []

        total_amount_at_risk = float(rapid["amount"].sum())
        risk_level = (
            "high"   if len(rapid) > 5
            else "medium" if len(rapid) > 2
            else "low"
        )

        return {
            "rapid_transaction_count": len(rapid),
            "amount_at_risk":          round(total_amount_at_risk, 2),
            "risk_level":              risk_level,
            "high_risk_hours":         [int(h) for h in risk_hours],
        }

    def _spending_velocity(self, df: pd.DataFrame) -> dict:
        """
        How fast is spending increasing month-over-month?
        """
        days_span = max(
            1,
            (df["timestamp"].max() - df["timestamp"].min()).days + 1
        )
        avg_daily = round(float(df["amount"].sum()) / days_span, 2)

        monthly = (
            df.groupby(df["timestamp"].dt.to_period("M"))["amount"]
            .sum()
            .sort_index()
        )

        if len(monthly) >= 2:
            last     = float(monthly.iloc[-1])
            previous = float(monthly.iloc[-2])
            change   = round((last - previous) / previous * 100, 1) if previous else 0
            trend    = "increasing" if change > 5 else ("decreasing" if change < -5 else "stable")
        else:
            change = 0.0
            trend  = "stable"

        return {
            "average_daily_spend":   avg_daily,
            "month_over_month_pct":  change,
            "trend":                 trend,
        }

    def _savings_ceiling(self, df: pd.DataFrame) -> dict:
        """
        Theoretical maximum savings if every category's spend was cut to its
        25th percentile (best realistic target — not the all-time minimum).
        This is the ceiling — real savings will be less.
        """
        total_actual  = float(df["amount"].sum())
        total_optimal = 0.0
        by_category   = {}

        for category in df["category"].unique():
            cat = df[df["category"] == category]
            if len(cat) < MIN_TRANSACTIONS_FOR_CATEGORY:
                continue
            p25      = float(cat["amount"].quantile(0.25))
            actual   = float(cat["amount"].sum())
            optimal  = p25 * len(cat)
            savings  = max(0.0, actual - optimal)
            total_optimal += optimal
            by_category[category] = round(savings, 2)

        return {
            "total_potential_savings": round(max(0.0, total_actual - total_optimal), 2),
            "by_category":            dict(
                sorted(by_category.items(), key=lambda x: -x[1])
            ),
        }

    # ── Section 5: Actionable recommendations ────────────────────────────────

    def _generate_recommendations(self, df: pd.DataFrame) -> list[dict]:
        """
        Produce a prioritized list of recommendations.
        Each recommendation has a category, type, suggestion, and potential_impact.
        """
        recs = []
        overall_mean = float(df["amount"].mean())

        for category in df["category"].unique():
            cat = df[df["category"] == category]
            if len(cat) < MIN_TRANSACTIONS_FOR_CATEGORY:
                continue

            avg   = float(cat["amount"].mean())
            count = len(cat)
            trend = self._compute_trend(cat)

            # High-spend category that is trending up
            if avg > overall_mean * 1.5 and trend == "increasing":
                recs.append({
                    "category":       category,
                    "type":           "spending_alert",
                    "priority":       "high",
                    "suggestion":     (
                        f"Your {category} spend is above average and rising. "
                        f"Consider setting a monthly budget cap."
                    ),
                    "potential_impact": round(avg * count * 0.2, 2),
                })

            # High frequency, could consolidate
            if count > 6 and avg < overall_mean:
                recs.append({
                    "category":       category,
                    "type":           "consolidation",
                    "priority":       "medium",
                    "suggestion":     (
                        f"You made {count} {category} purchases this period. "
                        f"Buying in bulk could save up to 15%."
                    ),
                    "potential_impact": round(avg * count * 0.15, 2),
                })

            # High average spend in a category that could have cheaper alternatives
            if avg > overall_mean * 2:
                recs.append({
                    "category":       category,
                    "type":           "alternative_search",
                    "priority":       "high",
                    "suggestion":     (
                        f"{category} is your highest-cost category "
                        f"(avg Rs.{avg:,.0f} per transaction). "
                        f"Compare prices or look for alternatives."
                    ),
                    "potential_impact": round(avg * 0.25, 2),
                })

        # Deduplicate and sort by priority then potential_impact
        seen = set()
        unique_recs = []
        for r in recs:
            key = (r["category"], r["type"])
            if key not in seen:
                seen.add(key)
                unique_recs.append(r)

        unique_recs.sort(key=lambda x: (
            0 if x["priority"] == "high" else 1,
            -x["potential_impact"],
        ))

        return unique_recs

    # ── Helpers ───────────────────────────────────────────────────────────────

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

        # Add derived time columns once (used by multiple sections)
        df["day_of_week"]   = df["timestamp"].dt.day_name()
        df["hour"]          = df["timestamp"].dt.hour
        df["week_of_month"] = ((df["timestamp"].dt.day - 1) // 7 + 1).clip(1, 5)

        return df.reset_index(drop=True)

    @staticmethod
    def _empty_response(user_id: str) -> dict:
        return {
            "user_id":             user_id,
            "total_transactions":  0,
            "total_spent":         0.0,
            "date_range":          {"from": None, "to": None},
            "spending_patterns":   {},
            "category_analysis":   {},
            "saving_opportunities":[],
            "behavioral_insights": {},
            "recommendations":     [],
        }
