from fastapi import FastAPI

from app.routes.analysis import router as analysis_router
from app.routes.health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="AURA AI Core",
        version="1.0.0-milestone.1",
        description="Mock retinal screening analysis service for development only.",
    )
    app.include_router(health_router)
    app.include_router(analysis_router, prefix="/api/v1")
    return app


app = create_app()
