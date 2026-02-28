"""
routes/feed.py

Post feed endpoint.
All business logic lives in engine/assembler.py — this file is routes ONLY.
"""

from fastapi import APIRouter, HTTPException, Query
from core import assembler

router = APIRouter(prefix="/feed", tags=["Feed"])


@router.get("/{user_id}")
def get_feed(
    user_id: str,
    lat:   float = Query(..., description="User's current latitude",  ge=-90,  le=90),
    lon:   float = Query(..., description="User's current longitude", ge=-180, le=180),
    limit: int   = Query(20,  description="Max posts to return",      ge=1,    le=50),
):
    """
    Returns a ranked list of posts for the user's home feed.

    Scoring weights:
      - Followed businesses : 55%
      - Nearby businesses   : 35%  (within 10 km)
      - Recency             : 10%  (decay over 7 days)
    """
    try:
        posts = assembler.build_feed(user_id, lat, lon, limit)
        return {
            "user_id": user_id,
            "count":   len(posts),
            "posts":   posts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
