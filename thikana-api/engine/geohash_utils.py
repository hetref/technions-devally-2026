"""
engine/geohash_utils.py

Handles all geohash operations using pygeohash (pure Python, no C compiler needed).
This replaces the broken custom implementation in the old main.py.

PRECISION GUIDE:
  precision=4  → ~40km × 20km cell  (city-level)
  precision=5  → ~5km  × 5km  cell  (neighborhood-level) ← we use this
  precision=6  → ~1km  × 0.6km cell (street-level)

With precision=5, center + 8 neighbors covers roughly a 15km search zone.
"""

import pygeohash as pgh


# Precision used for all geohash operations in the feed
GEOHASH_PRECISION = 5


def encode(lat: float, lon: float, precision: int = GEOHASH_PRECISION) -> str:
    """Encode a lat/lon into a geohash string."""
    return pgh.encode(lat, lon, precision)


def get_search_cells(lat: float, lon: float, precision: int = GEOHASH_PRECISION) -> list[str]:
    """
    Returns the center geohash cell + its 8 neighbors (all adjacent cells).
    This defines the complete search area for nearby businesses.

    pygeohash.geohash_approximate_distance can verify cell sizes, but the
    neighbors function gives us all 8 surrounding cells directly.

    Example: lat=18.52, lon=73.85, precision=5
    → 9 strings like ['tfe72', 'tfe73', ...]
    """
    center = pgh.encode(lat, lon, precision)
    # pygeohash exposes individual neighbor getters
    neighbors = [
        pgh.get_adjacent(center, "top"),
        pgh.get_adjacent(center, "bottom"),
        pgh.get_adjacent(center, "right"),
        pgh.get_adjacent(center, "left"),
        pgh.get_adjacent(pgh.get_adjacent(center, "top"), "right"),    # top-right
        pgh.get_adjacent(pgh.get_adjacent(center, "top"), "left"),     # top-left
        pgh.get_adjacent(pgh.get_adjacent(center, "bottom"), "right"), # bottom-right
        pgh.get_adjacent(pgh.get_adjacent(center, "bottom"), "left"),  # bottom-left
    ]
    return [center] + neighbors  # 1 center + 8 neighbors = 9 cells


def cell_for_business(lat: float, lon: float) -> str:
    """Return the geohash cell a business belongs to (used when indexing businesses)."""
    return encode(lat, lon, GEOHASH_PRECISION)
