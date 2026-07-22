from datetime import datetime, timezone

from app.config import get_settings
from app.schemas.analysis import AnalysisRequest, AnalysisResponse


MEDICAL_DISCLAIMER = (
    "Mock screening result only; not a medical diagnosis and not a substitute "
    "for review by a qualified doctor."
)


def analyze_mock(request: AnalysisRequest) -> AnalysisResponse:
    """Return deterministic mock data. No image is downloaded or processed."""
    return AnalysisResponse(
        analysisId=request.analysis_id,
        status="completed_mock",
        findings=["Demo: no urgent vascular indicator detected in simulated output."],
        riskLevel="low_mock",
        confidence=0.87,
        modelVersion=get_settings().model_version,
        processedAt=datetime.now(timezone.utc),
        disclaimer=MEDICAL_DISCLAIMER,
    )
