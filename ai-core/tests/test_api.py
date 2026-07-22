from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_analyze_returns_mock_result_and_disclaimer() -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "analysisId": "7d3a2ac6-45be-4f78-9916-7028aa433edb",
            "examinationId": "03259d3a-430f-4d3f-ab6a-f75720f7da5d",
            "imageId": "43d453b8-f482-442c-bb5f-6257500682fb",
            "imageType": "Fundus",
            "imageUrl": "https://example.invalid/demo-retinal-image.jpg",
        },
    )
    body = response.json()
    assert response.status_code == 200
    assert body["status"] == "completed_mock"
    assert body["modelVersion"] == "mock-retinal-v1"
    assert "not a medical diagnosis" in body["disclaimer"]


def test_analyze_validates_image_type() -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "analysisId": "7d3a2ac6-45be-4f78-9916-7028aa433edb",
            "examinationId": "03259d3a-430f-4d3f-ab6a-f75720f7da5d",
            "imageId": "43d453b8-f482-442c-bb5f-6257500682fb",
            "imageType": "MRI",
            "imageUrl": "https://example.invalid/demo.jpg",
        },
    )
    assert response.status_code == 422
