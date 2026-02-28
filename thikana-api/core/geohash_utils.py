"""
core/geohash_utils.py

Pure spatial math — no app logic, no DB calls.
Uses pygeohash (pure Python, no C compiler needed).

PRECISION GUIDE:
  precision=4 → ~40km cell   (city-level)
  precision=5 → ~5km  cell   (neighbourhood-level) ← default
  precision=6 → ~600m cell   (street-level)

9 cells (center + 8 neighbours) at precision=5 covers ~15km search zone.
"""

import pygeohash as pgh
from config import GEOHASH_PRECISION


def encode(lat: float, lon: float, precision: int = GEOHASH_PRECISION) -> str:
    """Encode a lat/lon coordinate into a geohash string."""
    return pgh.encode(lat, lon, precision)


def get_search_cells(lat: float, lon: float, precision: int = GEOHASH_PRECISION) -> list[str]:
    """
    Return the center geohash cell + its 8 neighbours (all 4 sides + 4 corners).
    This is the complete search area used by the nearby-businesses lookup.

    Example for lat=18.52, lon=73.85, precision=5:
    → 9 strings like ['tfe72', 'tfe73', 'tfe70', 'tfe71', ...]
    """
    center = pgh.encode(lat, lon, precision)
    neighbours = [
        pgh.get_adjacent(center, "top"),
        pgh.get_adjacent(center, "bottom"),
        pgh.get_adjacent(center, "right"),
        pgh.get_adjacent(center, "left"),
        pgh.get_adjacent(pgh.get_adjacent(center, "top"),    "right"),  # NE
        pgh.get_adjacent(pgh.get_adjacent(center, "top"),    "left"),   # NW
        pgh.get_adjacent(pgh.get_adjacent(center, "bottom"), "right"),  # SE
        pgh.get_adjacent(pgh.get_adjacent(center, "bottom"), "left"),   # SW
    ]
    return [center] + neighbours  # 9 cells total


def cell_for_business(lat: float, lon: float) -> str:
    """Return the geohash cell a business belongs to (used when indexing)."""
    return encode(lat, lon, GEOHASH_PRECISION)
