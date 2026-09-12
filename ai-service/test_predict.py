import time

import cv2
import numpy as np
import pytest

from app.services.image_processor import RetinalImageProcessor
from app.services.model_engine import RetinalAIModelEngine


def _synthetic_fundus() -> np.ndarray:
    """Cheap synthetic fundus-like image (reddish disc + curved dark strokes
    standing in for vessels) so the classical CV heuristics have something
    non-trivial to segment, without needing a real clinical image on disk."""
    img = np.full((512, 512, 3), (170, 60, 45), dtype=np.uint8)
    for i in range(0, 512, 40):
        pts = np.array([[i, 0], [256, 256], [i, 511]], dtype=np.int32)
        cv2.polylines(img, [pts], False, (60, 20, 15), 2)
    return img


def test_retinal_image_processor():
    dummy_fundus = _synthetic_fundus()
    tensor, enhanced = RetinalImageProcessor.prepare_fundus_tensor(dummy_fundus)
    assert tensor.shape == (3, 512, 512), "Invalid tensor shape"
    assert enhanced.shape == (512, 512, 3), "Invalid enhanced shape"
    print("[OK] RetinalImageProcessor test passed")


def test_model_engine_runs_and_meets_nfr1_timing():
    """NFR-1: single-image analysis must complete within 10-20s.

    This measures the REAL wall-clock time of the classical CV pipeline
    (no mocked/hard-coded timing values)."""
    dummy_fundus = _synthetic_fundus()

    start = time.perf_counter()
    result = RetinalAIModelEngine.analyze_fundus_image(dummy_fundus, eye="OD")
    wall_elapsed_s = time.perf_counter() - start

    assert wall_elapsed_s < 10.0, f"NFR-1 violated: took {wall_elapsed_s:.2f}s (limit 10-20s)"
    assert result["processingTimeMs"] > 0
    assert 0 <= result["biomarkers"]["vesselDensityPercent"] <= 100
    assert 1.0 <= result["biomarkers"]["tortuosityIndex"] <= 2.5
    assert 0.1 <= result["biomarkers"]["verticalCdr"] <= 0.9
    assert result["modelVersion"] == RetinalAIModelEngine.VERSION
    assert "NGUYÊN MẪU" in result["disclaimer"]
    assert len(result["predictions"]) == 3
    print(f"[OK] NFR-1 timing: {wall_elapsed_s * 1000:.1f} ms measured (real, not mocked)")


if __name__ == "__main__":
    test_retinal_image_processor()
    test_model_engine_runs_and_meets_nfr1_timing()
    print("\n=======================================================")
    print(">>> AI MICROSERVICE TESTS PASSED (heuristic CV prototype) <<<")
    print("=======================================================")
