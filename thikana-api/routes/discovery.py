"""
routes/discovery.py

Business discovery endpoint — "Who to Follow".
All business logic lives in engine/assembler.py — this file is routes ONLY.
"""

from fastapi import APIRouter, HTTPException, Query
from core import assembler

router = APIRouter(prefix="/discovery", tags=["Discovery"])


@router.get("/who-to-follow/{user_id}")
def get_who_to_follow(
    user_id: str,
    lat:   float = Query(..., description="User's current latitude",  ge=-90,  le=90),
    lon:   float = Query(..., description="User's current longitude", ge=-180, le=180),
    limit: int   = Query(10,  description="Max suggestions to return", ge=1,   le=30),
):
    """
    Returns nearby businesses the user doesn't follow yet.

    Scoring weights:
      - Proximity (distance)  : 70%
      - Activity (post count) : 30%

    Businesses already followed are excluded.
    """
    try:
        suggestions = assembler.build_who_to_follow(user_id, lat, lon, limit)
        return {
            "user_id":     user_id,
            "count":       len(suggestions),
            "suggestions": suggestions,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
