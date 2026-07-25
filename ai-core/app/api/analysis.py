from fastapi import APIRouter
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.mock_analysis_service import analyze
router = APIRouter(prefix="/api/v1", tags=["analysis"])
@router.post("/analyze", response_model=AnalysisResponse)
def analyze_image(request: AnalysisRequest) -> AnalysisResponse: return analyze(request)
