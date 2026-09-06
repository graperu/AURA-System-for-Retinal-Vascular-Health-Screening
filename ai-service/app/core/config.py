from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "AURA AI Core Microservice"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://backend:8081",
    ]
    
    # Model Thresholds
    GLAUCOMA_THRESHOLD: float = 0.70
    DR_CONFIDENCE_THRESHOLD: float = 0.75
    AMD_THRESHOLD: float = 0.65
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
