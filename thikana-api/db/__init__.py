"""db/__init__.py

Exports a single `db` object — the active data provider.
The rest of the app only ever does: `from db import db`
It never knows whether it's talking to mock or Firebase.
"""

from config import USE_MOCK

if USE_MOCK:
    from db.mock import MockDB
    db = MockDB()
else:
    from db.firebase import FirebaseDB
    db = FirebaseDB()
