# Thikana API Documentation

**Base URL:** `http://localhost:8000`  
**Version:** 2.0.0  
**CORS:** Enabled for all origins (lock down in production)

---

## 📋 Table of Contents

1. [Health Check](#health-check)
2. [Social Feed Endpoints](#social-feed-endpoints)
3. [Analytics Endpoints](#analytics-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Frontend Integration Guide](#frontend-integration-guide)

---

## Health Check

### GET `/`

Check if API is running.

**Response:**
```json
{
  "status": "ok",
  "version": "2.0.0"
}
```

---

## Social Feed Endpoints

### 1. GET `/feed/{user_id}`

Get personalized post feed for a user based on location and following.

**Parameters:**
- `user_id` (path, required): User ID
- `lat` (query, required): User's latitude (-90 to 90)
- `lon` (query, required): User's longitude (-180 to 180)
- `limit` (query, optional): Max posts to return (1-50, default: 20)

**Example Request:**
```
GET /feed/user_001?lat=18.5204&lon=73.8567&limit=20
```

**Response:**
```json
{
  "user_id": "user_001",
  "count": 8,
  "posts": [
    {
      "id": "post_004",
      "uid": "biz_003",
      "caption": "Book your hot desk for the week - limited spots!",
      "imageUrl": "",
      "likeCount": 10,
      "createdAt": "2026-02-28T08:00:00Z",
      "score": 0.6234,
      "recommendation_type": "followed",
      "distance_km": 0.52,
      "business": {
        "businessName": "Tech Hub Pune",
        "username": "techhubpune",
        "businessType": "Co-working"
      }
    }
  ]
}
```

**Scoring Algorithm:**
- Following: 55% (user explicitly follows this business)
- Location: 35% (distance-based, 1.0 at 0km, 0.0 at 10km)
- Recency: 10% (time-based, 1.0 = just posted, 0.0 = 7+ days old)

---

### 2. GET `/discovery/who-to-follow/{user_id}`

Get nearby businesses the user doesn't follow yet.

**Parameters:**
- `user_id` (path, required): User ID
- `lat` (query, required): User's latitude (-90 to 90)
- `lon` (query, required): User's longitude (-180 to 180)
- `limit` (query, optional): Max suggestions (1-30, default: 10)

**Example Request:**
```
GET /discovery/who-to-follow/user_001?lat=18.5204&lon=73.8567&limit=10
```

**Response:**
```json
{
  "user_id": "user_001",
  "count": 3,
  "suggestions": [
    {
      "id": "biz_002",
      "businessName": "Pune Bakes",
      "username": "punebakes",
      "businessType": "Bakery",
      "distance_km": 0.48,
      "postCount": 5,
      "score": 0.8123
    }
  ]
}
```

**Scoring Algorithm:**
- Location: 70% (proximity is key for local discovery)
- Activity: 30% (post count normalized to 0-20 range)

---

## Analytics Endpoints

### 3. GET `/analytics/anomalies/{user_id}`

Detect unusual spending patterns.

**Parameters:**
- `user_id` (path, required): User ID
- `min_severity` (query, optional): "medium" or "high" (default: "medium")

**Example Request:**
```
GET /analytics/anomalies/user_001?min_severity=medium
```

**Response:**
```json
{
  "user_id": "user_001",
  "total_transactions": 30,
  "anomaly_count": 4,
  "anomalies": [
    {
      "transaction_id": "txn_005",
      "amount": 3800.0,
      "category": "Food",
      "timestamp": "2026-02-20T14:00:00Z",
      "flags": ["category_spike", "rolling_spike"],
      "details": [
        "Rs.3,800 is 8.3 std devs from Food mean (avg Rs.410, std Rs.120)",
        "Rs.3,800 is 4.2 std devs above recent 3-transaction average (Rs.397)"
      ],
      "severity": "high"
    }
  ]
}
```

**Detection Methods:**
- `category_spike`: Amount is statistically unusual for that category (Z-score > 2.0)
- `rolling_spike`: Sudden jump vs last 3 transactions (Z-score > 2.5)
- `rapid_succession`: High-value tx within 1 hour of previous in same category

**Severity:**
- `high`: 2+ flags triggered
- `medium`: 1 flag triggered

---

### 4. GET `/analytics/insights/{user_id}`

Comprehensive spending behavior analysis.

**Parameters:**
- `user_id` (path, required): User ID

**Example Request:**
```
GET /analytics/insights/user_001
```

**Response:**
```json
{
  "user_id": "user_001",
  "total_transactions": 30,
  "total_spent": 25450.0,
  "date_range": {
    "from": "2026-01-05",
    "to": "2026-02-24"
  },
  "spending_patterns": {
    "peak_spending_day": "Monday",
    "peak_spending_hour": 12,
    "peak_week_of_month": 3,
    "category_timing": {
      "Food": {
        "cheapest_day": "Wednesday",
        "priciest_day": "Friday",
        "day_variance_pct": 15.2
      }
    }
  },
  "category_analysis": {
    "Utilities": {
      "total_spent": 9530.0,
      "average_transaction": 1588.33,
      "median_transaction": 1235.0,
      "transaction_count": 6,
      "share_of_total_pct": 37.4,
      "trend": "increasing"
    }
  },
  "saving_opportunities": [
    {
      "type": "high_variance",
      "category": "Food",
      "description": "Your Food spending varies a lot (avg Rs.410, std Rs.1200). Aiming for the typical lower spend of Rs.390 could save you money.",
      "potential_savings": 1200.0,
      "priority": "high"
    }
  ],
  "behavioral_insights": {
    "impulse_risk": {
      "rapid_transaction_count": 2,
      "amount_at_risk": 16100.0,
      "risk_level": "low",
      "high_risk_hours": [10, 14]
    },
    "spending_velocity": {
      "average_daily_spend": 509.0,
      "month_over_month_pct": 12.5,
      "trend": "increasing"
    },
    "savings_ceiling": {
      "total_potential_savings": 3850.0,
      "by_category": {
        "Utilities": 2100.0,
        "Food": 1200.0,
        "Transport": 550.0
      }
    }
  },
  "recommendations": [
    {
      "category": "Utilities",
      "type": "spending_alert",
      "priority": "high",
      "suggestion": "Your Utilities spend is above average and rising. Consider setting a monthly budget cap.",
      "potential_impact": 1906.0
    }
  ]
}
```

---

### 5. GET `/analytics/recommendations/{user_id}`

Budget recommendations and saving strategies.

**Parameters:**
- `user_id` (path, required): User ID
- `monthly_income` (query, optional): Average monthly income in Rs (default: 0 = unknown)

**Example Request:**
```
GET /analytics/recommendations/user_001?monthly_income=50000
```

**Response:**
```json
{
  "user_id": "user_001",
  "monthly_income": 50000.0,
  "analysis_period": {
    "months": 2,
    "total_spent": 25450.0
  },
  "recommendations": {
    "budget_suggestions": [
      {
        "category": "Utilities",
        "average_monthly": 4765.0,
        "suggested_monthly": 4050.25,
        "potential_savings": 714.75,
        "income_pct": 9.5,
        "priority": "medium"
      }
    ],
    "timing_optimization": [
      {
        "category": "Food",
        "best_day": "Wednesday",
        "worst_day": "Friday",
        "avg_on_best_day": 385.0,
        "savings_pct": 12.5
      }
    ],
    "saving_opportunities": [
      {
        "category": "Utilities",
        "avg_monthly": 4765.0,
        "income_pct": 9.5,
        "trending_up": true,
        "saving_target": 714.75,
        "strategy": "Your Utilities costs have been rising month-over-month.",
        "impact": "medium"
      }
    ],
    "category_tips": [
      {
        "category": "Utilities",
        "avg_monthly": 4765.0,
        "income_pct": 9.5,
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

**Note:** If `monthly_income=0`, percentages are relative to total monthly spend instead.

---

### 6. GET `/analytics/predictions/{user_id}`

Predict next month's spending per category.

**Parameters:**
- `user_id` (path, required): User ID

**Example Request:**
```
GET /analytics/predictions/user_001
```

**Response:**
```json
{
  "user_id": "user_001",
  "prediction_for": "2026-03",
  "months_of_data": 2,
  "total_predicted": 13850.50,
  "predictions": [
    {
      "category": "Utilities",
      "predicted": 5200.0,
      "lower_bound": 4100.0,
      "upper_bound": 6300.0,
      "confidence": "medium",
      "trend": "increasing",
      "trend_pct": 15.2,
      "data_points": 2,
      "note": "2 months of data — some variation in spending"
    },
    {
      "category": "Food",
      "predicted": 4500.0,
      "lower_bound": 4200.0,
      "upper_bound": 4800.0,
      "confidence": "high",
      "trend": "stable",
      "trend_pct": 2.1,
      "data_points": 2,
      "note": "Consistent spending pattern across 2 months"
    }
  ]
}
```

**Algorithm:**
- Weighted moving average (60% recent, 30% mid, 10% old)
- Trend adjustment (capped at ±30%)
- Confidence intervals from actual variance (not hardcoded)
- Confidence levels: high (3+ months, low variance), medium (2+ months), low (1 month or high variance)

---

## Data Models

### User
```typescript
interface User {
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  following: string[];  // Array of business IDs
}
```

### Business
```typescript
interface Business {
  businessName: string;
  username: string;
  businessType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  postCount: number;
  lastPostedAt: string | null;  // ISO 8601 timestamp
}
```

### Post
```typescript
interface Post {
  id: string;
  uid: string;  // Business ID
  caption: string;
  imageUrl: string;
  likeCount: number;
  createdAt: string;  // ISO 8601 timestamp
  // Added by API:
  score?: number;
  recommendation_type?: "followed" | "nearby";
  distance_km?: number;
  business?: {
    businessName: string;
    username: string;
    businessType: string;
  };
}
```

### Transaction
```typescript
interface Transaction {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  timestamp: string;  // ISO 8601 timestamp
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "detail": "Error message here"
}
```

**Common Validation Errors:**
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Limit must be between specified min/max values

---

## Frontend Integration Guide

### 1. Setup API Client

```typescript
// api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchFeed(
  userId: string,
  lat: number,
  lon: number,
  limit: number = 20
) {
  const response = await fetch(
    `${API_BASE_URL}/feed/${userId}?lat=${lat}&lon=${lon}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to fetch feed');
  return response.json();
}

export async function fetchWhoToFollow(
  userId: string,
  lat: number,
  lon: number,
  limit: number = 10
) {
  const response = await fetch(
    `${API_BASE_URL}/discovery/who-to-follow/${userId}?lat=${lat}&lon=${lon}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to fetch suggestions');
  return response.json();
}

export async function fetchAnomalies(
  userId: string,
  minSeverity: 'medium' | 'high' = 'medium'
) {
  const response = await fetch(
    `${API_BASE_URL}/analytics/anomalies/${userId}?min_severity=${minSeverity}`
  );
  if (!response.ok) throw new Error('Failed to fetch anomalies');
  return response.json();
}

export async function fetchInsights(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/analytics/insights/${userId}`
  );
  if (!response.ok) throw new Error('Failed to fetch insights');
  return response.json();
}

export async function fetchRecommendations(
  userId: string,
  monthlyIncome: number = 0
) {
  const response = await fetch(
    `${API_BASE_URL}/analytics/recommendations/${userId}?monthly_income=${monthlyIncome}`
  );
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
}

export async function fetchPredictions(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/analytics/predictions/${userId}`
  );
  if (!response.ok) throw new Error('Failed to fetch predictions');
  return response.json();
}
```

### 2. Get User Location

```typescript
// hooks/useLocation.ts
import { useState, useEffect } from 'react';

export function useLocation() {
  const [location, setLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (err) => {
        setError(err.message);
      }
    );
  }, []);

  return { location, error };
}
```

### 3. Example React Component

```tsx
// components/Feed.tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchFeed } from '@/api/client';
import { useLocation } from '@/hooks/useLocation';

export default function Feed({ userId }: { userId: string }) {
  const { location, error: locationError } = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location) return;

    fetchFeed(userId, location.lat, location.lon)
      .then((data) => {
        setPosts(data.posts);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [userId, location]);

  if (locationError) return <div>Location error: {locationError}</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="post-card">
          <h3>{post.business.businessName}</h3>
          <p>{post.caption}</p>
          <span>{post.recommendation_type}</span>
          <span>{post.distance_km}km away</span>
          <span>{post.likeCount} likes</span>
        </div>
      ))}
    </div>
  );
}
```

### 4. Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. CORS Configuration

The API currently allows all origins. For production:

```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Lock down
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

---

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:8000/

# Get feed
curl "http://localhost:8000/feed/user_001?lat=18.5204&lon=73.8567&limit=10"

# Get who to follow
curl "http://localhost:8000/discovery/who-to-follow/user_001?lat=18.5204&lon=73.8567"

# Get anomalies
curl "http://localhost:8000/analytics/anomalies/user_001"

# Get insights
curl "http://localhost:8000/analytics/insights/user_001"

# Get recommendations
curl "http://localhost:8000/analytics/recommendations/user_001?monthly_income=50000"

# Get predictions
curl "http://localhost:8000/analytics/predictions/user_001"
```

### Using Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Get feed
response = requests.get(
    f"{BASE_URL}/feed/user_001",
    params={"lat": 18.5204, "lon": 73.8567, "limit": 10}
)
print(response.json())
```

---

## Running the API

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest tests/ -v
```

**API will be available at:** `http://localhost:8000`  
**Interactive docs:** `http://localhost:8000/docs`  
**Alternative docs:** `http://localhost:8000/redoc`

---

## Configuration

Edit `config.py` to change:

- `USE_MOCK`: Toggle between mock JSON and Firebase
- `MAX_RADIUS_KM`: Search radius for nearby businesses (default: 10km)
- `GEOHASH_PRECISION`: Spatial index precision (default: 5)
- Scoring weights for feed and discovery
- Recency window for posts (default: 7 days)

---

## Notes for Frontend Developers

1. **Location Permission**: Always request location permission before calling feed/discovery endpoints
2. **Error Handling**: Implement proper error handling for network failures and API errors
3. **Loading States**: Show loading indicators while fetching data
4. **Caching**: Consider caching feed data for 5-10 minutes to reduce API calls
5. **Pagination**: Use the `limit` parameter for pagination (though full pagination not yet implemented)
6. **Real-time Updates**: Consider WebSocket or polling for real-time feed updates
7. **Analytics**: Analytics endpoints can be slow (1-2s) — show loading states
8. **Income Privacy**: Make `monthly_income` parameter optional in UI
9. **Date Formatting**: All timestamps are ISO 8601 UTC — convert to local time in frontend
10. **Empty States**: Handle empty responses gracefully (new users, no data)

---

## Future Enhancements

- [ ] Authentication & authorization
- [ ] POST endpoints for creating posts/transactions
- [ ] WebSocket support for real-time updates
- [ ] Pagination for feed endpoints
- [ ] Image upload for posts
- [ ] User profile management
- [ ] Business profile management
- [ ] Follow/unfollow endpoints
- [ ] Like/unlike endpoints
- [ ] Search functionality
- [ ] Filtering by business type
- [ ] Rate limiting
- [ ] Caching layer (Redis)
- [ ] Analytics dashboard aggregations
