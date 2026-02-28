"""
config.py — Single source of truth for ALL settings.

To switch from mock data to Firebase: change USE_MOCK to False.
To change search radius: change MAX_RADIUS_KM.
Nothing else in the codebase needs to change for either.
"""

# ── Data source ───────────────────────────────────────────────────────────────
USE_MOCK= False  # True → mock JSON, False → live Firebase

# ── Firebase ──────────────────────────────────────────────────────────────────
# serviceAccountKey.json lives one folder up (in the Recommendation model/ root)
import os
from pathlib import Path
KEY_PATH: str = str(Path(__file__).parent.parent / "serviceAccountKey.json")

# ── Spatial settings ──────────────────────────────────────────────────────────
MAX_RADIUS_KM: float = 10.0          # businesses beyond this are ignored
GEOHASH_PRECISION: int = 5           # precision-5 ≈ 5×5 km cell

# ── Scoring — Post feed ───────────────────────────────────────────────────────
RECENCY_WINDOW_HOURS: float = 168.0  # 7 days — posts older than this score 0
POST_WEIGHT_FOLLOWING: float = 0.55
POST_WEIGHT_LOCATION: float  = 0.35
POST_WEIGHT_RECENCY: float   = 0.10

# ── Scoring — Who to Follow ───────────────────────────────────────────────────
MAX_POST_COUNT: int = 20             # postCount is normalised against this ceiling
FOLLOW_WEIGHT_LOCATION: float = 0.70
FOLLOW_WEIGHT_ACTIVITY: float = 0.30
