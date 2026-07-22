from fastapi import APIRouter

from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis_service import analyze_mock

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse, response_model_by_alias=True)
def analyze(request: AnalysisRequest) -> AnalysisResponse:
    return analyze_mock(request)
