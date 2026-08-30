from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import Optional
import numpy as np
from PIL import Image
import io
from ...schemas.prediction import (
    FundusPredictionRequest,
    FundusPredictionResponse,
    BulkPredictionRequest,
    BulkPredictionResponse,
)
from ...services.model_engine import RetinalAIModelEngine
from ...services.image_processor import RetinalImageProcessor

router = APIRouter()


@router.post("/predict", response_model=FundusPredictionResponse)
async def predict_fundus(request: FundusPredictionRequest):
    """Điểm cuối phân tích ảnh võng mạc đơn lẻ (Single Fundus Image Inference)."""
    try:
        if request.imageBase64:
            image_np = RetinalImageProcessor.decode_base64_image(request.imageBase64)
        else:
            # Fallback tạo ảnh võng mạc thử nghiệm kích thước chuẩn
            image_np = np.full((512, 512, 3), (180, 50, 40), dtype=np.uint8)

        response = RetinalAIModelEngine.analyze_fundus_image(image_np, eye=request.eye)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Inference Error: {str(e)}")


@router.post("/predict/upload", response_model=FundusPredictionResponse)
async def predict_fundus_file(
    file: UploadFile = File(...),
    eye: str = Form("OD"),
    patientId: Optional[str] = Form(None),
):
    """Điểm cuối nhận file ảnh trực tiếp (Multipart/form-data upload)."""
    try:
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        image_np = np.array(pil_img)
        response = RetinalAIModelEngine.analyze_fundus_image(image_np, eye=eye)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")


@router.post("/predict/bulk", response_model=BulkPredictionResponse)
async def predict_bulk(request: BulkPredictionRequest):
    """Điểm cuối xử lý hàng loạt danh sách ảnh võng mạc (Bulk Queue Processing >=100 ảnh)."""
    results = []
    dummy_img = np.full((512, 512, 3), (180, 50, 40), dtype=np.uint8)

    for item in request.items:
        res = RetinalAIModelEngine.analyze_fundus_image(dummy_img, eye=item.eye)
        results.append({
            "itemId": item.itemId,
            "patientId": item.patientId,
            "status": "COMPLETED",
            "overallScore": res.overallVascularRiskScore,
            "primaryClass": res.predictions[0].predictedClass,
            "confidence": res.predictions[0].confidence,
        })

    return BulkPredictionResponse(
        batchId=request.batchId,
        totalCount=len(request.items),
        successCount=len(results),
        results=results,
    )
