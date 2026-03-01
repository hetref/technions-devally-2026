"""
db/firebase.py

FirebaseDB — live Firestore implementation.
Implements the same DataProvider interface as MockDB.

Activated when USE_MOCK = False in config.py.
Reads serviceAccountKey.json from the path set in config.KEY_PATH.
"""

import math
import logging
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

import config

logger = logging.getLogger(__name__)

# ── Firebase init (once per process) ─────────────────────────────────────────

def _init_firebase() -> None:
    if not firebase_admin._apps:
        key_path = Path(config.KEY_PATH)
        if not key_path.exists():
            raise FileNotFoundError(
                f"serviceAccountKey.json not found at: {key_path}\n"
                "Set KEY_PATH correctly in config.py"
            )
        cred = credentials.Certificate(str(key_path))
        firebase_admin.initialize_app(cred)
        logger.info(f"Firebase initialised from {key_path}")


_init_firebase()
_db = firestore.client()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _doc_to_dict(doc) -> dict:
    """Convert a Firestore document snapshot to a plain dict with 'id' included."""
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def _batch_fetch(collection_name: str, doc_ids: list[str]) -> dict[str, dict]:
    """
    Fetch multiple documents by ID in batches of 10 (Firestore 'in' query limit).
    Returns {doc_id: doc_data}.

    DB reads: ceil(n / 10)
    """
    if not doc_ids:
        return {}

    result: dict[str, dict] = {}
    batch_size = 10

    for i in range(0, len(doc_ids), batch_size):
        batch = doc_ids[i : i + batch_size]
        # Use document references for batch get — more efficient than 'in' query
        refs = [_db.collection(collection_name).document(doc_id) for doc_id in batch]
        docs = _db.get_all(refs)          # 1 Firestore RPC per batch
        for doc in docs:
            if doc.exists:
                result[doc.id] = _doc_to_dict(doc)

    return result


# ── FirebaseDB class ──────────────────────────────────────────────────────────

class FirebaseDB:
    """
    Live Firestore data provider.

    Firestore reads per feed request:
      get_following_ids:       1 read  (subcollection stream)
      get_nearby_businesses:   9 reads (location_index cells) + ceil(n/10) reads
      get_businesses_batch:    ceil(n/10) reads
      get_posts_for_buses:     ceil(n/10) reads per batch of 10 businesses
      ─────────────────────────────────────────────────────────
      Total per feed request:  ~12–20 reads regardless of Firestore size
    """

    # ── get_user ──────────────────────────────────────────────────────────────

    def get_user(self, user_id: str) -> dict | None:
        """
        1 Firestore read.
        Collection: users/{user_id}
        """
        doc = _db.collection("users").document(user_id).get()
        if not doc.exists:
            return None
        return _doc_to_dict(doc)

    # ── get_following_ids ─────────────────────────────────────────────────────

    def get_following_ids(self, user_id: str) -> list[str]:
        """
        1 Firestore read (subcollection stream).
        Collection: users/{user_id}/following
        Each document ID = the business ID being followed.
        """
        following_ref = (
            _db.collection("users")
            .document(user_id)
            .collection("following")
        )
        return [doc.id for doc in following_ref.stream()]

    # ── get_nearby_businesses ─────────────────────────────────────────────────

    def get_nearby_businesses(
        self,
        lat: float,
        lon: float,
        max_radius_km: float = config.MAX_RADIUS_KM,
    ) -> dict[str, float]:
        """
        Geohash-indexed spatial query. Total reads: 9 + ceil(n/10).
        n = number of businesses found in the geohash cells (~10–50 typically).

        Steps:
          1. Compute center + 8 neighbours (9 geohash cells) — free
          2. Read location_index/{cell} for each cell           — 9 reads
          3. Collect unique business_ids from all cells
          4. Batch-fetch businesses/{id} for exact location      — ceil(n/10) reads
          5. Filter by Haversine distance                        — free

        Returns {business_id: distance_km}, sorted by distance ascending.
        """
        from core.geohash_utils import get_search_cells

        search_cells = get_search_cells(lat, lon)   # 9 geohash strings

        # Step 2: read location_index for each cell
        business_ids: set[str] = set()
        for cell in search_cells:
            doc = _db.collection("location_index").document(cell).get()  # 1 read each
            if doc.exists:
                ids = doc.to_dict().get("business_ids", [])
                business_ids.update(ids)

        if not business_ids:
            logger.info(f"No businesses found in location_index for ({lat}, {lon})")
            return {}

        # Step 3: batch-fetch business data
        businesses = _batch_fetch("businesses", list(business_ids))

        # Step 4: exact Haversine filter
        result: dict[str, float] = {}
        for biz_id, biz in businesses.items():
            loc = biz.get("location")
            if not loc:
                continue
            biz_lat = loc.get("latitude")
            biz_lon = loc.get("longitude")
            if biz_lat is None or biz_lon is None:
                continue
            dist = _haversine_km(lat, lon, biz_lat, biz_lon)
            if dist <= max_radius_km:
                result[biz_id] = round(dist, 2)

        return dict(sorted(result.items(), key=lambda x: x[1]))

    # ── get_businesses_batch ──────────────────────────────────────────────────

    def get_businesses_batch(self, business_ids: list[str]) -> dict[str, dict]:
        """
        Batch-fetch business metadata.
        DB reads: ceil(n / 10)
        """
        return _batch_fetch("businesses", business_ids)

    # ── get_posts_for_businesses ──────────────────────────────────────────────

    def get_posts_for_businesses(
        self,
        business_ids: list[str],
        limit_per_business: int = 5,
    ) -> list[dict]:
        """
        Fetch recent posts for a set of businesses.
        Uses Firestore 'in' query (max 10 values), batched automatically.

        DB reads: ceil(n / 10) — each read returns posts for up to 10 businesses.

        limit_per_business caps posts per business so one active business
        can't flood the entire feed.
        """
        if not business_ids:
            return []

        result: list[dict] = []
        batch_size = 10

        # Group posts keyed by business for per-business capping
        by_biz: dict[str, list[dict]] = {}

        for i in range(0, len(business_ids), batch_size):
            batch = business_ids[i : i + batch_size]

            query = (
                _db.collection("posts")
                .where("uid", "in", batch)
                .order_by("createdAt", direction=firestore.Query.DESCENDING)
                .limit(limit_per_business * len(batch))  # upper bound
            )

            for doc in query.stream():
                post = _doc_to_dict(doc)
                uid = post.get("uid", "")
                by_biz.setdefault(uid, []).append(post)

        # Apply per-business cap and flatten
        for uid, posts in by_biz.items():
            result.extend(posts[:limit_per_business])

        return result

    # ── get_user_transactions ─────────────────────────────────────────────────

    def get_user_transactions(self, user_id: str) -> list[dict]:
        """
        Fetch all transactions for a user from Firestore.

        Firestore path:
            transactions/{user_id}/user_transactions/{doc_id}

        Returns a plain list[dict] — no pandas, no DataFrames.
        Timestamps are converted to ISO-8601 strings so the analytics
        models can parse them with pd.to_datetime().

        DB reads: 1 subcollection stream (all transaction docs).
        """
        ref = (
            _db.collection("transactions")
            .document(str(user_id).strip())
            .collection("user_transactions")
        )

        transactions = []
        for doc in ref.stream():
            data = doc.to_dict() or {}
            data["id"]      = doc.id
            data["user_id"] = str(user_id).strip()

            # Convert Firestore Timestamps → ISO string so models can parse uniformly
            ts = data.get("timestamp")
            if hasattr(ts, "isoformat"):          # firebase_admin Timestamp
                data["timestamp"] = ts.isoformat()
            elif hasattr(ts, "_seconds"):          # raw proto Timestamp
                from datetime import datetime, timezone
                data["timestamp"] = datetime.fromtimestamp(
                    ts._seconds, tz=timezone.utc
                ).isoformat()

            transactions.append(data)

        logger.info(
            f"get_user_transactions: fetched {len(transactions)} "
            f"transactions for user '{user_id}'"
        )
        return transactions

    # ── get_user_income ───────────────────────────────────────────────────────

    def get_user_income(self, user_id: str) -> list[dict]:
        """
        Fetch all income entries for a user from Firestore.

        Firestore path:
            transactions/{user_id}/user_income/{doc_id}

        Returns a plain list[dict] with timestamps as ISO-8601 strings.
        """
        ref = (
            _db.collection("transactions")
            .document(str(user_id).strip())
            .collection("user_income")
        )

        incomes = []
        for doc in ref.stream():
            data = doc.to_dict() or {}
            data["id"]      = doc.id
            data["user_id"] = str(user_id).strip()

            ts = data.get("timestamp")
            if hasattr(ts, "isoformat"):
                data["timestamp"] = ts.isoformat()
            elif hasattr(ts, "_seconds"):
                from datetime import datetime, timezone
                data["timestamp"] = datetime.fromtimestamp(
                    ts._seconds, tz=timezone.utc
                ).isoformat()

            incomes.append(data)

        logger.info(
            f"get_user_income: fetched {len(incomes)} "
            f"income entries for user '{user_id}'"
        )
        return incomes
