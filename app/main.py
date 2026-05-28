from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import learning, profile, stats, subscriptions, telegram
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router, prefix="/api")
app.include_router(learning.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")
app.include_router(telegram.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
