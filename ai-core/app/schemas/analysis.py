from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from pydantic.alias_generators import to_camel


class ImageType(str, Enum):
    FUNDUS = "Fundus"
    OCT = "OCT"


class AnalysisRequest(BaseModel):
    analysis_id: UUID
    examination_id: UUID
    image_id: UUID
    image_type: ImageType
    image_url: HttpUrl

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AnalysisResponse(BaseModel):
    analysis_id: UUID
    status: str
    findings: list[str]
    risk_level: str
    confidence: float = Field(ge=0, le=1)
    model_version: str
    processed_at: datetime
    disclaimer: str

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
