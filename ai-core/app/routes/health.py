from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": get_settings().service_name,
        "timestampUtc": datetime.now(timezone.utc).isoformat(),
    }
