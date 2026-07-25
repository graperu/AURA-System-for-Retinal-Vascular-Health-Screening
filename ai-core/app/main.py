from fastapi import FastAPI
from app.api.analysis import router
from app.core.config import settings
app = FastAPI(title=settings.app_name)
@app.get("/health")
def health(): return {"service":"aura-ai-core","status":"UP","modelVersion":settings.model_version}
app.include_router(router)
