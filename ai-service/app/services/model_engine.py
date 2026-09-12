"""Inference boundary for retinal fundus analysis.

SCOPE / HONESTY NOTE:
No trained, validated deep-learning model weights are bundled with this
repository (none exist to bundle — training/validating one on real clinical
data is out of scope here). Previously this class raised RuntimeError
unconditionally ("fail closed") specifically to avoid presenting hard-coded
placeholder numbers as if they were real patient findings — that safety
intent is preserved below.

What changed: instead of mocking NFR-1 (the <=10-20s single-image processing
time requirement), this engine now runs a real, deterministic classical
image-processing pipeline (OpenCV — see vessel_analysis.py) and measures
genuine wall-clock time around it, so NFR-1 can be verified honestly.

The disease "predictions" and biomarkers below are heuristic proxies derived
from that classical pipeline, NOT the output of a validated diagnostic model.
This is reflected in `modelVersion` and `disclaimer` on every response, and
must stay that way until a real, validated model is trained and integrated.
"""
import time

import numpy as np

from app.core.config import settings
from app.services import vessel_analysis as va
from app.services.image_processor import RetinalImageProcessor

MODEL_VERSION = "aura-cv-heuristic-v0.1 (classical OpenCV prototype, no trained model weights)"

HEURISTIC_DISCLAIMER = (
    "Kết quả được tạo bởi pipeline xử lý ảnh cổ điển (OpenCV: CLAHE, phân đoạn mạch máu, "
    "ước lượng đĩa/lõm thị) mang tính NGUYÊN MẪU cho việc đo NFR-1 (thời gian xử lý). "
    "Đây KHÔNG phải mô hình học sâu đã huấn luyện và kiểm định lâm sàng, và KHÔNG được dùng "
    "để chẩn đoán bệnh nhân thật. Cần tích hợp một mô hình đã kiểm định trước khi triển khai "
    "thực tế."
)

_CLINICAL_NOTE = "Ước lượng heuristic từ xử lý ảnh cổ điển, chưa qua kiểm định lâm sàng."


class RetinalAIModelEngine:
    VERSION = MODEL_VERSION

    @classmethod
    def analyze_fundus_image(cls, image_np: np.ndarray, eye: str = "OD") -> dict:
        start = time.perf_counter()

        _tensor, enhanced = RetinalImageProcessor.prepare_fundus_tensor(image_np)
        field_mask = va.fov_mask(enhanced)
        vessel_mask = va.segment_vessels(enhanced)

        vessel_density = va.vessel_density_percent(vessel_mask, field_mask)
        tortuosity = va.tortuosity_index(vessel_mask)
        av_ratio = va.av_ratio_estimate(enhanced, vessel_mask)
        cdr = va.cdr_estimate(enhanced)

        overlay = va.build_heatmap_overlay(enhanced, vessel_mask)
        heatmap_b64 = RetinalImageProcessor.encode_image_to_base64(overlay)

        predictions = cls._heuristic_predictions(cdr, tortuosity, vessel_density)
        overall_risk = cls._overall_risk(predictions)

        elapsed_ms = (time.perf_counter() - start) * 1000.0

        return {
            "status": "COMPLETED_HEURISTIC_PROTOTYPE",
            "modelVersion": cls.VERSION,
            "overallVascularRiskScore": overall_risk,
            "predictions": predictions,
            "biomarkers": {
                "avRatio": av_ratio,
                "vesselDensityPercent": vessel_density,
                "tortuosityIndex": tortuosity,
                "verticalCdr": cdr,
            },
            "heatmapBase64": heatmap_b64,
            "processingTimeMs": round(elapsed_ms, 2),
            "disclaimer": HEURISTIC_DISCLAIMER,
        }

    @staticmethod
    def _heuristic_predictions(cdr: float, tortuosity: float, vessel_density: float) -> list:
        glaucoma_conf = round(min(max(cdr, 0.0), 1.0), 3)
        dr_conf = round(min(max((tortuosity - 1.0) / 1.5, 0.0), 1.0), 3)
        amd_conf = round(min(max((30.0 - vessel_density) / 30.0, 0.0), 1.0), 3)

        def risk_level(conf: float, threshold: float) -> str:
            if conf >= threshold:
                return "HIGH"
            if conf >= threshold * 0.6:
                return "MODERATE"
            return "LOW"

        return [
            {
                "category": "Glaucoma",
                "predictedClass": "Suspect" if glaucoma_conf >= settings.GLAUCOMA_THRESHOLD else "Normal",
                "confidence": glaucoma_conf,
                "riskLevel": risk_level(glaucoma_conf, settings.GLAUCOMA_THRESHOLD),
                "clinicalNote": _CLINICAL_NOTE,
            },
            {
                "category": "Diabetic Retinopathy",
                "predictedClass": "Suspect" if dr_conf >= settings.DR_CONFIDENCE_THRESHOLD else "Normal",
                "confidence": dr_conf,
                "riskLevel": risk_level(dr_conf, settings.DR_CONFIDENCE_THRESHOLD),
                "clinicalNote": _CLINICAL_NOTE,
            },
            {
                "category": "AMD",
                "predictedClass": "Suspect" if amd_conf >= settings.AMD_THRESHOLD else "Normal",
                "confidence": amd_conf,
                "riskLevel": risk_level(amd_conf, settings.AMD_THRESHOLD),
                "clinicalNote": _CLINICAL_NOTE,
            },
        ]

    @staticmethod
    def _overall_risk(predictions: list) -> int:
        conf = max(p["confidence"] for p in predictions)
        return int(round(conf * 100))
