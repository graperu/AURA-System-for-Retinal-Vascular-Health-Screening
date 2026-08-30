from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.v1.endpoints import predict

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AURA PyTorch AI Core Microservice for Retinal Vascular Health Screening & Grad-CAM Heatmap Generation",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Cấu hình CORS cho phép Backend và Frontend truy cập
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn Router API v1
app.include_router(predict.router, prefix=settings.API_V1_STR, tags=["AI Prediction"])


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engine": "PyTorch / OpenCV-CLAHE",
        "device": "CPU / CUDA Auto-detect",
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Welcome to AURA AI Core Microservice API",
        "docsUrl": "/docs",
        "healthUrl": "/health",
    }
