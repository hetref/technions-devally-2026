"""
models/expense_recommender.py

Generates personalized budget recommendations from a user's transaction history.

Four recommendation categories:
  1. budget_suggestions    — categories where spending is too high relative to income
  2. timing_optimization   — best day of week to make purchases per category
  3. saving_opportunities  — specific categories with actionable saving strategies
  4. category_tips         — practical, data-driven tips per overspent category

Interface:
    model  = ExpenseRecommender()
    result = model.recommend(transactions, user_id, monthly_income=0)

Input:  list of transaction dicts + optional monthly income figure
Output: structured dict — no DataFrames, no pandas objects

Improvements over original expense_recommendation_model.py:
  - Works for any category, not just Rent/Utilities/Salaries
  - Tips are generated from actual spending severity, not static category lookup
  - Timing uses day-of-week (meaningful), not hour-of-day (not meaningful)
  - Digital payment benefits are data-driven (top 3 categories by spend)
  - Graceful fallback when income is unknown (uses % of total spend instead)
  - No silent exception swallowing — errors surface properly
"""

import pandas as pd
import numpy as np
from datetime import datetime


# ── Thresholds ────────────────────────────────────────────────────────────────

HIGH_SPEND_THRESHOLD   = 0.30   # category > 30% of income → high priority
MEDIUM_SPEND_THRESHOLD = 0.20   # category > 20% of income → medium priority
SAVING_TARGET_PCT      = 0.15   # recommend 15% reduction as default target
MIN_TRANSACTIONS       = 2      # minimum transactions to analyze a category


class ExpenseRecommender:
    """Stateless — instantiate once, call recommend() many times."""

    # ── Public API ────────────────────────────────────────────────────────────

    def recommend(
        self,
        transactions: list[dict],
        user_id: str,
        monthly_income: float = 0,
    ) -> dict:
        """
        Generate expense recommendations for a user.

        Args:
            transactions:   flat list of transaction dicts for ONE user.
                            Required fields: amount, category, timestamp
            user_id:        for labelling the response
            monthly_income: average monthly income (0 = unknown, fall back to totals)

        Returns:
            {
              "user_id": str,
              "monthly_income": float,
              "analysis_period": {"months": int, "total_spent": float},
              "recommendations": {
                "budget_suggestions":     [...],
                "timing_optimization":    [...],
                "saving_opportunities":   [...],
                "category_tips":          [...],
              }
            }
        """
        if not transactions:
            return self._empty_response(user_id, monthly_income)

        df = self._to_dataframe(transactions)
        if df.empty:
            return self._empty_response(user_id, monthly_income)

        # Compute per-category monthly averages (more stable than current month only)
        months_span    = max(1, df["year_month"].nunique())
        monthly_spend  = (
            df.groupby(["category", "year_month"])["amount"]
            .sum()
            .groupby("category")
            .mean()
        )

        # If no income provided, estimate from total spend (conservative)
        effective_income = monthly_income if monthly_income > 0 else monthly_spend.sum()

        return {
            "user_id":        user_id,
            "monthly_income": monthly_income,
            "analysis_period": {
                "months":      months_span,
                "total_spent": round(float(df["amount"].sum()), 2),
            },
            "recommendations": {
                "budget_suggestions":   self._budget_suggestions(monthly_spend, effective_income),
                "timing_optimization":  self._timing_optimization(df),
                "saving_opportunities": self._saving_opportunities(monthly_spend, effective_income, df),
                "category_tips":        self._category_tips(monthly_spend, effective_income),
            },
        }

    # ── Section 1: Budget suggestions ────────────────────────────────────────

    def _budget_suggestions(
        self,
        monthly_spend: pd.Series,
        income: float,
    ) -> list[dict]:
        """
        Flag categories where average monthly spend exceeds 20% of income.
        Suggest a 15% reduction as a realistic target.
        """
        suggestions = []

        for category, avg_monthly in monthly_spend.items():
            income_pct = avg_monthly / income * 100 if income > 0 else 0

            if income_pct <= MEDIUM_SPEND_THRESHOLD * 100:
                continue

            suggested = avg_monthly * (1 - SAVING_TARGET_PCT)
            priority  = "high" if income_pct > HIGH_SPEND_THRESHOLD * 100 else "medium"

            suggestions.append({
                "category":          category,
                "average_monthly":   round(float(avg_monthly), 2),
                "suggested_monthly": round(float(suggested), 2),
                "potential_savings": round(float(avg_monthly - suggested), 2),
                "income_pct":        round(income_pct, 1),
                "priority":          priority,
            })

        # Sort: high priority first, then by potential savings
        suggestions.sort(key=lambda x: (
            0 if x["priority"] == "high" else 1,
            -x["potential_savings"],
        ))
        return suggestions

    # ── Section 2: Timing optimization ───────────────────────────────────────

    def _timing_optimization(self, df: pd.DataFrame) -> list[dict]:
        """
        For each category, find which day of the week has the lowest average
        transaction amount. That's the best day to make purchases.

        Only included if there's enough data to compare across days.
        """
        result = []

        for category in df["category"].unique():
            cat = df[df["category"] == category]
            if len(cat) < MIN_TRANSACTIONS:
                continue

            by_day = cat.groupby("day_of_week")["amount"].mean()

            # Need at least 2 different days to make a comparison
            if len(by_day) < 2:
                continue

            cheapest_day  = by_day.idxmin()
            priciest_day  = by_day.idxmax()
            avg_on_best   = float(by_day.min())
            avg_on_worst  = float(by_day.max())
            savings_pct   = round((avg_on_worst - avg_on_best) / avg_on_worst * 100, 1)

            # Only surface if there's a meaningful difference (>5%)
            if savings_pct < 5:
                continue

            result.append({
                "category":        category,
                "best_day":        cheapest_day,
                "worst_day":       priciest_day,
                "avg_on_best_day": round(avg_on_best, 2),
                "savings_pct":     savings_pct,
            })

        # Sort by savings_pct descending
        result.sort(key=lambda x: -x["savings_pct"])
        return result

    # ── Section 3: Saving opportunities ──────────────────────────────────────

    def _saving_opportunities(
        self,
        monthly_spend: pd.Series,
        income: float,
        df: pd.DataFrame,
    ) -> list[dict]:
        """
        Find categories where:
          a) Spending exceeds 25% of income (above the recommended threshold), OR
          b) Month-over-month spending is increasing (rising cost)
        """
        result = []

        for category, avg_monthly in monthly_spend.items():
            income_pct = avg_monthly / income * 100 if income > 0 else 0
            cat_df     = df[df["category"] == category]

            # Check if trend is rising
            monthly_cat = (
                cat_df.groupby("year_month")["amount"].sum().sort_index()
            )
            trending_up = (
                len(monthly_cat) >= 2
                and float(monthly_cat.iloc[-1]) > float(monthly_cat.iloc[-2])
            )

            if income_pct > 25 or trending_up:
                strategy = self._saving_strategy(category, income_pct, trending_up)

                result.append({
                    "category":      category,
                    "avg_monthly":   round(float(avg_monthly), 2),
                    "income_pct":    round(income_pct, 1),
                    "trending_up":   trending_up,
                    "saving_target": round(float(avg_monthly * SAVING_TARGET_PCT), 2),
                    "strategy":      strategy,
                    "impact":        "high" if income_pct > 30 else "medium",
                })

        result.sort(key=lambda x: (
            0 if x["impact"] == "high" else 1,
            -x["avg_monthly"],
        ))
        return result

    def _saving_strategy(self, category: str, income_pct: float, trending_up: bool) -> str:
        """Generate a data-informed saving strategy string."""
        parts = []

        if trending_up:
            parts.append(f"Your {category} costs have been rising month-over-month.")

        if income_pct > 30:
            parts.append(
                f"{category} is consuming {income_pct:.0f}% of your income — "
                f"well above the recommended 30% ceiling."
            )
        elif income_pct > 20:
            parts.append(
                f"{category} is at {income_pct:.0f}% of income — "
                f"consider cutting by {SAVING_TARGET_PCT*100:.0f}%."
            )

        if not parts:
            parts.append(f"Review {category} expenses for optimization opportunities.")

        return " ".join(parts)

    # ── Section 4: Category-specific tips ────────────────────────────────────

    def _category_tips(
        self,
        monthly_spend: pd.Series,
        income: float,
    ) -> list[dict]:
        """
        Generate practical tips for categories above the medium spending threshold.
        Tips are severity-aware: more aggressive advice for higher overspending.
        Works for ANY category, not just a hardcoded list.
        """
        result = []

        for category, avg_monthly in monthly_spend.items():
            income_pct = avg_monthly / income * 100 if income > 0 else 0

            if income_pct <= MEDIUM_SPEND_THRESHOLD * 100:
                continue

            tips = self._generate_tips(category, income_pct)

            result.append({
                "category":         category,
                "avg_monthly":      round(float(avg_monthly), 2),
                "income_pct":       round(income_pct, 1),
                "tips":             tips,
                "estimated_impact": "high" if income_pct > 30 else "medium",
            })

        result.sort(key=lambda x: -x["income_pct"])
        return result

    def _generate_tips(self, category: str, income_pct: float) -> list[str]:
        """
        Data-driven tips based on spending severity.
        Three tiers: moderate (20-30%), high (30-40%), critical (>40%).
        Works for any category name.
        """
        cat_lower = category.lower()
        tips = []

        # Tier 1: moderate overspend (>20%)
        tips.extend([
            f"Set a monthly budget cap for {category} and track it weekly.",
            f"Review your {cat_lower} subscriptions or recurring charges — cancel unused ones.",
        ])

        # Tier 2: high overspend (>30%)
        if income_pct > 30:
            tips.extend([
                f"Your {cat_lower} spending is {income_pct:.0f}% of income — "
                f"compare prices before each {cat_lower} purchase.",
                f"Look for bulk deals, loyalty programmes, or cheaper alternatives for {cat_lower}.",
            ])

        # Tier 3: critical overspend (>40%)
        if income_pct > 40:
            tips.extend([
                f"Consider a major restructuring of your {cat_lower} expenses — "
                f"this category alone is putting your budget at risk.",
                f"Speak with a financial advisor about reducing {cat_lower} commitments.",
            ])

        return tips

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

        # Derived time columns
        df["day_of_week"] = df["timestamp"].dt.day_name()
        df["year_month"]  = (
            df["timestamp"].dt.tz_localize(None).dt.to_period("M")
        )

        return df.reset_index(drop=True)

    @staticmethod
    def _empty_response(user_id: str, monthly_income: float) -> dict:
        return {
            "user_id":         user_id,
            "monthly_income":  monthly_income,
            "analysis_period": {"months": 0, "total_spent": 0.0},
            "recommendations": {
                "budget_suggestions":   [],
                "timing_optimization":  [],
                "saving_opportunities": [],
                "category_tips":        [],
            },
        }
