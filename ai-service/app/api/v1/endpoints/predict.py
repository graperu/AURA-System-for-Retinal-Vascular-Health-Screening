import io
from typing import Optional

import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from PIL import Image

from app.schemas.prediction import FundusPredictionRequest, FundusPredictionResponse
from app.services.image_processor import RetinalImageProcessor
from app.services.model_engine import RetinalAIModelEngine

router = APIRouter()


@router.post("/predict", response_model=FundusPredictionResponse)
async def predict_fundus(request: FundusPredictionRequest):
    if not request.imageBase64:
        raise HTTPException(status_code=400, detail="imageBase64 is required")
    try:
        image_np = RetinalImageProcessor.decode_base64_image(request.imageBase64)
        return RetinalAIModelEngine.analyze_fundus_image(image_np, eye=request.eye)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/predict/upload", response_model=FundusPredictionResponse)
async def predict_fundus_file(
    file: UploadFile = File(...),
    eye: str = Form("OD"),
    patientId: Optional[str] = Form(None),
):
    try:
        contents = await file.read()
        image_np = np.array(Image.open(io.BytesIO(contents)).convert("RGB"))
        return RetinalAIModelEngine.analyze_fundus_image(image_np, eye=eye)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {exc}") from exc


@router.post("/predict/bulk")
async def predict_bulk():
    raise HTTPException(
        status_code=501,
        detail="Bulk inference with real image content is not configured.",
    )


@router.get("/model-info")
async def get_model_info():
    return {
        "available": False,
        "modelName": None,
        "modelVersion": None,
        "message": "No validated model weights are configured. Inference is disabled.",
    }
