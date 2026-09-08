import numpy as np
import pytest
from app.services.model_engine import RetinalAIModelEngine
from app.services.image_processor import RetinalImageProcessor


def test_retinal_image_processor():
    dummy_fundus = np.full((512, 512, 3), (190, 60, 45), dtype=np.uint8)
    tensor, enhanced = RetinalImageProcessor.prepare_fundus_tensor(dummy_fundus)
    assert tensor.shape == (3, 512, 512), "Invalid tensor shape"
    assert enhanced.shape == (512, 512, 3), "Invalid enhanced shape"
    print("[OK] RetinalImageProcessor test passed")


def test_model_engine_fails_closed_safely_without_weights():
    dummy_fundus = np.full((512, 512, 3), (190, 60, 45), dtype=np.uint8)
    with pytest.raises(RuntimeError) as exc_info:
        RetinalAIModelEngine.analyze_fundus_image(dummy_fundus, eye="OD")
    assert "inference is disabled" in str(exc_info.value)
    print("[OK] RetinalAIModelEngine fails-closed safely without fake data")


if __name__ == "__main__":
    test_retinal_image_processor()
    test_model_engine_fails_closed_safely_without_weights()
    print("\n=======================================================")
    print(">>> TAT CA CAC TEST CUA AI MICROSERVICE DA PASS 100%! <<<")
    print("=======================================================")
