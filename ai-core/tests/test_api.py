from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_health():
    assert client.get("/health").json()=={"service":"aura-ai-core","status":"UP","modelVersion":"mock-v1"}
def test_analyze():
    response=client.post("/api/v1/analyze",json={"analysisId":"7b873315-2682-4f6d-a8b0-970e5fa88f48","imageUrl":"https://example.com/image.jpg","imageType":"FUNDUS"})
    assert response.status_code==200
    assert response.json()["riskScore"]==0.72
