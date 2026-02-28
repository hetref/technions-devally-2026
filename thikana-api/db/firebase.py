"""
db/firebase.py

FirebaseDB — live Firestore implementation.
Implements the same DataProvider interface as MockDB.

STATUS: Phase 3 — stubs ready, uncomment when connecting Firebase.
To activate: set USE_MOCK = False in config.py
"""

# from firebase_admin import credentials, firestore, initialize_app
# import firebase_admin
#
# if not firebase_admin._apps:
#     cred = credentials.Certificate("serviceAccountKey.json")
#     initialize_app(cred)
#
# _db = firestore.client()

from config import MAX_RADIUS_KM


class FirebaseDB:
    """
    Live Firestore implementation.
    Total reads per feed request: ~12–15 (regardless of business count).
    """

    def get_user(self, user_id: str) -> dict | None:
        raise NotImplementedError("Phase 3: uncomment Firebase code above")
        # doc = _db.collection("users").document(user_id).get()  # 1 read
        # return doc.to_dict() if doc.exists else None

    def get_following_ids(self, user_id: str) -> list[str]:
        raise NotImplementedError("Phase 3: uncomment Firebase code above")
        # following_ref = _db.collection("users").document(user_id).collection("following")
        # return [doc.id for doc in following_ref.stream()]       # 1 read

    def get_nearby_businesses(
        self,
        lat: float,
        lon: float,
        max_radius_km: float = MAX_RADIUS_KM,
    ) -> dict[str, float]:
        raise NotImplementedError("Phase 3: uncomment Firebase code above")
        # from core.geohash_utils import get_search_cells
        # import math
        #
        # search_cells = get_search_cells(lat, lon)                # free
        #
        # # Step 1: read location_index for 9 geohash cells        → 9 reads
        # business_ids = set()
        # for cell in search_cells:
        #     doc = _db.collection("location_index").document(cell).get()
        #     if doc.exists:
        #         business_ids.update(doc.to_dict().get("business_ids", []))
        #
        # # Step 2: batch-fetch business data              → ceil(n/10) reads
        # businesses = self.get_businesses_batch(list(business_ids))
        #
        # # Step 3: exact Haversine filter                          → free
        # result = {}
        # for biz_id, biz in businesses.items():
        #     loc = biz.get("location")
        #     if not loc:
        #         continue
        #     dist = _haversine_km(lat, lon, loc["latitude"], loc["longitude"])
        #     if dist <= max_radius_km:
        #         result[biz_id] = round(dist, 2)
        # return dict(sorted(result.items(), key=lambda x: x[1]))

    def get_businesses_batch(self, business_ids: list[str]) -> dict[str, dict]:
        raise NotImplementedError("Phase 3: uncomment Firebase code above")
        # if not business_ids:
        #     return {}
        # result = {}
        # batch_size = 10
        # for i in range(0, len(business_ids), batch_size):
        #     batch = business_ids[i:i+batch_size]
        #     query = _db.collection("businesses").where("__name__", "in", batch)
        #     for doc in query.stream():                   # ceil(n/10) reads
        #         result[doc.id] = doc.to_dict()
        # return result

    def get_posts_for_businesses(
        self,
        business_ids: list[str],
        limit_per_business: int = 5,
    ) -> list[dict]:
        raise NotImplementedError("Phase 3: uncomment Firebase code above")
        # if not business_ids:
        #     return []
        # result = []
        # batch_size = 10
        # for i in range(0, len(business_ids), batch_size):
        #     batch = business_ids[i:i+batch_size]
        #     query = (
        #         _db.collection("posts")
        #         .where("uid", "in", batch)
        #         .order_by("createdAt", direction=firestore.Query.DESCENDING)
        #         .limit(limit_per_business * len(batch))
        #     )
        #     result.extend([doc.to_dict() | {"id": doc.id} for doc in query.stream()])
        # return result
