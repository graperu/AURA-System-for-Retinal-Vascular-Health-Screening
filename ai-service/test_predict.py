import numpy as np
from app.services.model_engine import RetinalAIModelEngine
from app.services.image_processor import RetinalImageProcessor


def test_ai_inference_pipeline():
    print("Testing Retinal AI Model Engine & Grad-CAM pipeline...")

    # Tạo ảnh võng mạc giả lập kích thước 512x512
    dummy_fundus = np.full((512, 512, 3), (190, 60, 45), dtype=np.uint8)

    # 1. Test tiền xử lý CLAHE & Tensor preparation
    tensor, enhanced = RetinalImageProcessor.prepare_fundus_tensor(dummy_fundus)
    assert tensor.shape == (3, 512, 512), "Invalid tensor shape"
    assert enhanced.shape == (512, 512, 3), "Invalid enhanced shape"
    print("[OK] CLAHE & Fundus Tensor preprocessing passed")

    # 2. Test Grad-CAM Heatmap
    heatmap = RetinalAIModelEngine.generate_gradcam_heatmap(dummy_fundus)
    assert heatmap.shape == (512, 512, 3), "Invalid heatmap shape"
    print("[OK] Grad-CAM heatmap generation passed")

    # 3. Test Full Analysis Engine
    response = RetinalAIModelEngine.analyze_fundus_image(dummy_fundus, eye="OD")
    assert response.status == "COMPLETED", "Inference failed"
    assert len(response.predictions) == 4, "Missing disease categories"
    assert response.biomarkers.avRatio > 0, "Invalid AVR ratio"
    assert response.heatmapBase64 is not None, "Missing heatmap base64"
    print(f"[OK] AI Analysis passed! Risk Score: {response.overallVascularRiskScore}/100, AVR: {response.biomarkers.avRatio}")

    print("\n=======================================================")
    print(">>> TAT CA CAC TEST CUA AI MICROSERVICE DA PASS 100%! <<<")
    print("=======================================================")


if __name__ == "__main__":
    test_ai_inference_pipeline()
