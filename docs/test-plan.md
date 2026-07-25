# Kế hoạch kiểm thử

## Mục tiêu
- Kiểm tra toàn bộ luồng frontend → backend → AI Core.
- Xác thực API trả về đúng cấu trúc response.
- Đảm bảo Docker Compose khởi động không lỗi.

## Kiểm thử chính

### 1. Health check
- Mục đích: backend / ai-core / postgres đều chạy.
- Cách kiểm tra:
  - `GET http://localhost:8080/health`
  - `GET http://localhost:8000/health`
  - `docker compose ps`

### 2. System info
- Mục đích: backend trả về thông tin hệ thống.
- Cách kiểm tra:
  - `GET http://localhost:8080/api/v1/system/info`

### 3. Demo analysis flow
- Mục đích: frontend gửi yêu cầu phân tích, backend gọi AI Core và trả về kết quả mock.
- Cách kiểm tra:
  - `POST http://localhost:8080/api/v1/analyses/demo`
  - Payload mẫu:
    ```json
    {
      "analysisId": "11111111-1111-1111-1111-111111111111",
      "examinationId": "22222222-2222-2222-2222-222222222222",
      "imageId": "33333333-3333-3333-3333-333333333333",
      "imageType": "Fundus",
      "imageUrl": "https://example.invalid/mock-fundus-image.jpg"
    }
    ```
  - Kết quả mong đợi: HTTP 200 và JSON với các trường `analysisId`, `status`, `findings`, `riskLevel`, `confidence`, `modelVersion`, `processedAt`, `disclaimer`.

### 4. Kiểm thử Docker Compose
- Cách kiểm tra:
  - `docker compose config --quiet`
  - `docker compose up --build`

## Kiểm thử tự động
- Backend: `mvn -f backend/pom.xml test`
- Frontend: `npm.cmd ci && npm.cmd run lint && npm.cmd run build`
- AI Core: `python -m pytest`
- Docker: `docker compose config --quiet`
