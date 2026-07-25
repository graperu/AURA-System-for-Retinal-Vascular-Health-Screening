from app.schemas.analysis import AnalysisRequest, AnalysisResponse
def analyze(request: AnalysisRequest) -> AnalysisResponse:
    return AnalysisResponse(analysisId=request.analysisId,status="COMPLETED",riskScore=0.72,riskLevel="HIGH",modelVersion="mock-v1",processingTimeMs=1000)
