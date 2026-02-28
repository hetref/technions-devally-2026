# Thikana Analytics API — Frontend Integration Guide

> **Base URL:** `http://<your-server>:8000`  
> **All endpoints:** `GET` — no request body, no auth (add your auth middleware before shipping)  
> **Interactive docs:** `http://localhost:8000/docs` (Swagger UI, auto-generated)

---

## Quick Start

```js
const BASE = "http://localhost:8000";
const USER = "firebase_uid_here";   // the user's Firebase Auth UID

const [anomalies, insights, recommendations, predictions] = await Promise.all([
  fetch(`${BASE}/analytics/anomalies/${USER}`).then(r => r.json()),
  fetch(`${BASE}/analytics/insights/${USER}`).then(r => r.json()),
  fetch(`${BASE}/analytics/recommendations/${USER}?monthly_income=50000`).then(r => r.json()),
  fetch(`${BASE}/analytics/predictions/${USER}`).then(r => r.json()),
]);
```

---

## Endpoints

### 1. `GET /analytics/anomalies/{user_id}`

Detects unusual transactions using 3 methods: category Z-score, rolling spike, and rapid succession.

#### Query Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `min_severity` | `"medium"` \| `"high"` | `"medium"` | Filter to only show high-confidence anomalies |

#### Example Request

```
GET /analytics/anomalies/user_abc123?min_severity=medium
```

#### Example Response

```json
{
  "user_id": "user_abc123",
  "anomaly_count": 2,
  "anomalies": [
    {
      "transaction_id": "txn_005",
      "amount": 3800.0,
      "category": "Food",
      "timestamp": "2026-02-05T12:30:00+00:00",
      "flags": ["category_spike", "rolling_spike"],
      "details": [
        "Rs.3,800 is 3.0 std devs from Food mean (avg Rs.410, std Rs.38)",
        "Rs.3,800 is 4.2 std devs above recent 3-transaction average (Rs.410)"
      ],
      "severity": "high"
    },
    {
      "transaction_id": "txn_010",
      "amount": 1100.0,
      "category": "Transport",
      "timestamp": "2026-02-18T10:35:00+00:00",
      "flags": ["rapid_succession"],
      "details": [
        "Occurred 0.6h after the previous Transport transaction and is 20% above recent average"
      ],
      "severity": "medium"
    }
  ]
}
```

#### Field Reference

| Field | Type | Description |
|---|---|---|
| `anomaly_count` | int | Total anomalies found |
| `anomalies[].transaction_id` | string | ID of the anomalous transaction |
| `anomalies[].flags` | string[] | Which detection methods fired: `category_spike`, `rolling_spike`, `rapid_succession` |
| `anomalies[].severity` | `"high"` \| `"medium"` | `high` = 2+ flags, `medium` = 1 flag |
| `anomalies[].details` | string[] | Human-readable explanation for each flag |

#### Suggested UI Usage

- 🔴 **Red badge** on wallet/transactions screen for `severity: "high"`
- 🟡 **Yellow alert** for `severity: "medium"`  
- Show `details[]` strings as the alert body text
- Use `?min_severity=high` on the dashboard home card to show only critical alerts

---

### 2. `GET /analytics/insights/{user_id}`

Analyzes overall spending habits: patterns, category breakdown, saving opportunities, behavioral signals, and recommendations.

#### Example Request

```
GET /analytics/insights/user_abc123
```

#### Example Response

```json
{
  "user_id": "user_abc123",
  "total_transactions": 25,
  "total_spent": 45230.0,
  "date_range": { "from": "2026-01-05", "to": "2026-02-18" },

  "spending_patterns": {
    "peak_spending_day": "Wednesday",
    "peak_spending_hour": 12,
    "peak_week_of_month": 1,
    "category_timing": {
      "Food": {
        "cheapest_day": "Monday",
        "priciest_day": "Saturday",
        "day_variance_pct": 18.5
      }
    }
  },

  "category_analysis": {
    "Utilities": {
      "total_spent": 8750.0,
      "average_transaction": 1250.0,
      "median_transaction": 1220.0,
      "transaction_count": 7,
      "share_of_total_pct": 19.3,
      "trend": "stable"
    },
    "Food": {
      "total_spent": 4050.0,
      "average_transaction": 450.0,
      "median_transaction": 415.0,
      "transaction_count": 10,
      "share_of_total_pct": 8.9,
      "trend": "increasing"
    }
  },

  "saving_opportunities": [
    {
      "type": "high_variance",
      "category": "Transport",
      "description": "Your Transport spending varies a lot (avg Rs.510, std Rs.890). Aiming for Rs.120 could save you money.",
      "potential_savings": 3120.0,
      "priority": "high"
    }
  ],

  "behavioral_insights": {
    "impulse_risk": {
      "rapid_transaction_count": 3,
      "amount_at_risk": 4450.0,
      "risk_level": "medium",
      "high_risk_hours": [12, 20]
    },
    "spending_velocity": {
      "average_daily_spend": 832.0,
      "month_over_month_pct": 12.5,
      "trend": "increasing"
    },
    "savings_ceiling": {
      "total_potential_savings": 8200.0,
      "by_category": {
        "Transport": 3120.0,
        "Food": 1800.0,
        "Utilities": 900.0
      }
    }
  },

  "recommendations": [
    {
      "category": "Transport",
      "type": "spending_alert",
      "priority": "high",
      "suggestion": "Your Transport spend is above average and rising. Consider setting a monthly budget cap.",
      "potential_impact": 12240.0
    }
  ]
}
```

#### Field Reference — `spending_patterns`

| Field | Description |
|---|---|
| `peak_spending_day` | Day of week with highest avg transaction |
| `peak_spending_hour` | Hour (0–23) with highest avg transaction |
| `category_timing[cat].cheapest_day` | Best day to buy in this category |
| `category_timing[cat].day_variance_pct` | % price difference across days |

#### Field Reference — `category_analysis`

| Field | Description |
|---|---|
| `share_of_total_pct` | What % of all spending is this category |
| `trend` | `"increasing"` \| `"decreasing"` \| `"stable"` (month-over-month) |

#### Field Reference — `behavioral_insights`

| Field | Description |
|---|---|
| `impulse_risk.risk_level` | `"low"` \| `"medium"` \| `"high"` |
| `impulse_risk.high_risk_hours` | Hours when rapid spending tends to occur |
| `spending_velocity.month_over_month_pct` | % change in total spend vs last month |
| `savings_ceiling.total_potential_savings` | Max possible savings (25th percentile target) |

#### Suggested UI Usage

- **Spending breakdown pie/donut chart** → `category_analysis` (use `share_of_total_pct`)
- **Trend arrow** on each category card → `category_analysis[cat].trend`
- **"Best day to buy" tip** → `spending_patterns.category_timing[cat].cheapest_day`
- **Impulse risk chip** → `behavioral_insights.impulse_risk.risk_level`
- **Savings potential banner** → `behavioral_insights.savings_ceiling.total_potential_savings`

---

### 3. `GET /analytics/recommendations/{user_id}`

Generates actionable budget recommendations based on spending patterns and optional income.

#### Query Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `monthly_income` | float | `0` | User's average monthly income in Rs. Without it, percentages are relative to total spend. |

#### Example Request

```
GET /analytics/recommendations/user_abc123?monthly_income=50000
```

#### Example Response

```json
{
  "user_id": "user_abc123",
  "monthly_income": 50000.0,
  "analysis_period": {
    "months": 2,
    "total_spent": 45230.0
  },
  "recommendations": {
    "budget_suggestions": [
      {
        "category": "Utilities",
        "average_monthly": 1250.0,
        "suggested_monthly": 1062.5,
        "potential_savings": 187.5,
        "income_pct": 25.0,
        "priority": "medium"
      }
    ],
    "timing_optimization": [
      {
        "category": "Food",
        "best_day": "Monday",
        "worst_day": "Saturday",
        "avg_on_best_day": 380.0,
        "savings_pct": 18.5
      }
    ],
    "saving_opportunities": [
      {
        "category": "Transport",
        "avg_monthly": 1530.0,
        "income_pct": 3.1,
        "trending_up": true,
        "saving_target": 229.5,
        "strategy": "Your Transport costs have been rising month-over-month.",
        "impact": "medium"
      }
    ],
    "category_tips": [
      {
        "category": "Utilities",
        "avg_monthly": 1250.0,
        "income_pct": 25.0,
        "tips": [
          "Set a monthly budget cap for Utilities and track it weekly.",
          "Review your utilities subscriptions or recurring charges — cancel unused ones."
        ],
        "estimated_impact": "medium"
      }
    ]
  }
}
```

#### Field Reference

| Field | Description |
|---|---|
| `budget_suggestions[].priority` | `"high"` (>30% of income) or `"medium"` (>20%) |
| `budget_suggestions[].potential_savings` | Rs. saved per month if spending hits suggested target |
| `timing_optimization[].savings_pct` | % cheaper on best day vs worst day |
| `saving_opportunities[].trending_up` | `true` = cost rising month-over-month |
| `category_tips[].tips` | Array of actionable tip strings — display as bullet list |

#### Suggested UI Usage

- **Budget donut** with warning ring when `income_pct > 30` → `budget_suggestions`
- **"Best day to shop" cards** → `timing_optimization`
- **Rising cost alert** when `trending_up: true` → `saving_opportunities`
- **Tips carousel** on category detail screen → `category_tips[cat].tips`

---

### 4. `GET /analytics/predictions/{user_id}`

Predicts next month's spending per category using weighted moving average with trend adjustment.

#### Example Request

```
GET /analytics/predictions/user_abc123
```

#### Example Response

```json
{
  "user_id": "user_abc123",
  "prediction_for": "2026-03",
  "months_of_data": 2,
  "total_predicted": 25800.0,
  "predictions": [
    {
      "category": "Utilities",
      "predicted": 8750.0,
      "lower_bound": 6980.0,
      "upper_bound": 10520.0,
      "confidence": "medium",
      "trend": "stable",
      "trend_pct": 1.2,
      "data_points": 2,
      "note": "2 months of data — some variation in spending"
    },
    {
      "category": "Food",
      "predicted": 4600.0,
      "lower_bound": 4200.0,
      "upper_bound": 5000.0,
      "confidence": "high",
      "trend": "increasing",
      "trend_pct": 8.5,
      "data_points": 3,
      "note": "Consistent spending pattern across 3 months"
    }
  ]
}
```

#### Field Reference

| Field | Description |
|---|---|
| `prediction_for` | `"YYYY-MM"` — the month being predicted |
| `predictions[].predicted` | Expected total spend (Rs.) for this category next month |
| `predictions[].lower_bound` | predicted − 1 std dev (68% chance of being above this) |
| `predictions[].upper_bound` | predicted + 1 std dev (68% chance of being below this) |
| `predictions[].confidence` | `"high"` (3+ stable months), `"medium"`, `"low"` (< 2 months) |
| `predictions[].trend` | `"increasing"` \| `"decreasing"` \| `"stable"` |
| `predictions[].trend_pct` | Average month-over-month % change |
| `predictions[].note` | Human-readable explanation of confidence level |

#### Suggested UI Usage

- **Next month forecast card** → total_predicted with a bar or progress ring
- **Per-category forecast rows** with a range bar: `lower_bound ↔ upper_bound`
- **Confidence chip** → green for `"high"`, yellow for `"medium"`, grey for `"low"`
- **Trend arrow** → ↑ increasing / ↓ decreasing / → stable (use `trend_pct` for %)

---

## Error Responses

All endpoints return standard HTTP errors:

```json
{ "detail": "error message here" }
```

| Status | Meaning |
|---|---|
| `200` | OK — data returned |
| `404` | User not found (no transactions) — show empty state |
| `500` | Server error — show retry button |

---

## Running the Server

```powershell
# From updated-recomendation-model/
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Switch between mock data and live Firestore by changing one line in `config.py`:

```python
USE_MOCK = True   # local dev / testing
USE_MOCK = False  # production (reads from Firestore)
```

---

## Firestore Data Structure Required

Transactions must be stored at:

```
transactions/
  {user_id}/                         ← document (Firebase Auth UID)
    user_transactions/
      {auto_id}/                     ← one document per transaction
        amount:    number             ← e.g. 3800
        category:  string             ← e.g. "Food"
        timestamp: Timestamp          ← Firestore Timestamp
```

---

## Running Tests

```powershell
cd 'c:\...\updated-recomendation-model'

# All analytics model tests (42 tests, ~5 seconds, no Firebase needed)
python -m pytest tests/test_anomaly.py tests/test_insights.py tests/test_expense_recommender.py tests/test_spending_predictor.py -v
```
