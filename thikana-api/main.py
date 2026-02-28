"""
main.py

Entry point — creates the FastAPI app and registers routers.
NOTHING else lives here. All logic is in engine/ and routes/.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.feed import router as feed_router
from routes.discovery import router as discovery_router
# from routes.analytics import router as analytics_router

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Thikana Recommendation API",
    description="Location + social graph based post and business recommendations.",
    version="2.0.0",
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Lock down to your domains in production
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(feed_router)
app.include_router(discovery_router)
# app.include_router(analytics_router)

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "version": "2.0.0"}

# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
