"""
╔══════════════════════════════════════════════════╗
║              🌍 FAMILIA API                      ║
║    Real people. Real bonds. No borders.          ║
║    Technology bridges language.                   ║
║    Humans create family.                          ║
╚══════════════════════════════════════════════════╝
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings

from routers import auth, profiles, matching, chat, contests, games, family_rooms, safety, translation, voice

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Familia - Cross-cultural human connection platform. Real people, real bonds, no borders.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(matching.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(contests.router, prefix="/api/v1")
app.include_router(games.router, prefix="/api/v1")
app.include_router(family_rooms.router, prefix="/api/v1")
app.include_router(safety.router, prefix="/api/v1")
app.include_router(translation.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "app": "Familia",
        "tagline": "Real people. Real bonds. No borders.",
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "familia-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
