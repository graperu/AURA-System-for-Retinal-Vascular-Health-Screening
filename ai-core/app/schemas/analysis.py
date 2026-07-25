from enum import Enum
from pydantic import BaseModel, HttpUrl
from uuid import UUID
class ImageType(str, Enum): FUNDUS = "FUNDUS"
class AnalysisRequest(BaseModel):
    analysisId: UUID
    imageUrl: HttpUrl
    imageType: ImageType
class AnalysisResponse(BaseModel):
    analysisId: UUID
    status: str
    riskScore: float
    riskLevel: str
    modelVersion: str
    processingTimeMs: int
