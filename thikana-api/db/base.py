"""
db/base.py

Defines the DataProvider interface using Python's Protocol.
Both MockDB and FirebaseDB must implement exactly these methods.

Protocol = structural typing (duck typing with type safety).
No inheritance needed — if a class has these methods, it satisfies the interface.
"""

from typing import Protocol, runtime_checkable


@runtime_checkable
class DataProvider(Protocol):

    def get_user(self, user_id: str) -> dict | None:
        """Fetch a single user's document. Returns None if not found."""
        ...

    def get_following_ids(self, user_id: str) -> list[str]:
        """Return list of business IDs the user follows."""
        ...

    def get_nearby_businesses(
        self,
        lat: float,
        lon: float,
        max_radius_km: float,
    ) -> dict[str, float]:
        """
        Find all businesses within max_radius_km.
        Returns {business_id: distance_km}, sorted by distance ascending.
        """
        ...

    def get_businesses_batch(self, business_ids: list[str]) -> dict[str, dict]:
        """
        Batch-fetch business metadata by IDs.
        Returns {business_id: business_dict}.
        """
        ...

    def get_posts_for_businesses(
        self,
        business_ids: list[str],
        limit_per_business: int = 5,
    ) -> list[dict]:
        """
        Fetch recent posts for a set of businesses.
        Returns flat list (all businesses combined), capped per business.
        """
        ...
