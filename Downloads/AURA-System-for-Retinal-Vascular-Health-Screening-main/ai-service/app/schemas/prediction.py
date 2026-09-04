from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class BiomarkerMetrics(BaseModel):
    avRatio: float = Field(..., description="Arteriole-to-Venule Ratio (Tỷ lệ Động/Tĩnh mạch)")
    vesselDensityPercent: float = Field(..., description="Mật độ vi mạch võng mạc (%)")
    tortuosityIndex: float = Field(..., description="Chỉ số uốn lượn mạch máu")
    verticalCdr: float = Field(..., description="Tỷ lệ lõm gai thị Cup-to-Disc Ratio")


class DiseasePrediction(BaseModel):
    category: str
    predictedClass: str
    confidence: float
    riskLevel: str
    clinicalNote: str


class FundusPredictionRequest(BaseModel):
    patientId: Optional[str] = None
    eye: str = Field(default="OD", description="OD (Mắt Phải) hoặc OS (Mắt Trái)")
    imageBase64: Optional[str] = None
    imageUrl: Optional[str] = None


class FundusPredictionResponse(BaseModel):
    status: str
    modelVersion: str
    overallVascularRiskScore: int
    predictions: List[DiseasePrediction]
    biomarkers: BiomarkerMetrics
    heatmapBase64: Optional[str] = None
    processingTimeMs: float
    disclaimer: str = "Kết quả từ AI chỉ mang tính chất hỗ trợ sàng lọc ban đầu, không thay thế kết luận chẩn đoán của bác sĩ."


class BulkPredictionItem(BaseModel):
    itemId: str
    patientId: str
    eye: str
    imageUrl: str


class BulkPredictionRequest(BaseModel):
    batchId: str
    items: List[BulkPredictionItem]


class BulkPredictionResponse(BaseModel):
    batchId: str
    totalCount: int
    successCount: int
    results: List[Dict[str, Any]]
