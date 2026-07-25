# API Contract

## Backend public API

### GET /health
- Mục đích: kiểm tra trạng thái backend, PostgreSQL và AI Core.
- Response chung:
  - `success`: boolean
  - `data`: object
  - `error`: null hoặc object
  - `traceId`: string

### GET /api/v1/system/info
- Mục đích: trả về thông tin hệ thống cho dashboard.
- Response `data` mẫu:
  ```json
  {
    "name": "AURA Java API",
    "version": "1.0.0-milestone.1",
    "environment": "default",
    "status": "healthy",
    "database": { "status": "healthy" },
    "aiCore": { "status": "healthy" },
    "timestampUtc": "2026-07-25T15:30:00Z"
  }
  ```

### POST /api/v1/analyses/demo
- Mục đích: nhận yêu cầu phân tích mô phỏng và gọi AI Core.
- Request body:
  ```json
  {
    "analysisId": "11111111-1111-1111-1111-111111111111",
    "examinationId": "22222222-2222-2222-2222-222222222222",
    "imageId": "33333333-3333-3333-3333-333333333333",
    "imageType": "Fundus",
    "imageUrl": "https://example.invalid/mock-fundus-image.jpg"
  }
  ```
- Response `data` mẫu:
  ```json
  {
    "analysisId": "11111111-1111-1111-1111-111111111111",
    "status": "completed",
    "findings": [
      "No suspicious retinal vascular changes detected.",
      "Visual acuity appears stable."
    ],
    "riskLevel": "low",
    "confidence": 0.92,
    "modelVersion": "mock-v1",
    "processedAt": "2026-07-25T15:30:00Z",
    "disclaimer": "This is a mock analysis for development purposes only."
  }
  ```

## AI Core internal API

### GET /health
- Mục đích: health check AI Core.
- Response:
  ```json
  {
    "status": "UP",
    "serviceName": "aura-ai-core",
    "modelVersion": "mock-v1"
  }
  ```

### POST /api/v1/analyze
- Mục đích: nhận payload phân tích từ backend và trả về kết quả mô phỏng.
- Request body:
  ```json
  {
    "analysisId": "11111111-1111-1111-1111-111111111111",
    "examinationId": "22222222-2222-2222-2222-222222222222",
    "imageId": "33333333-3333-3333-3333-333333333333",
    "imageType": "Fundus",
    "imageUrl": "https://example.invalid/mock-fundus-image.jpg"
  }
  ```
- Response `data` mẫu:
  ```json
  {
    "analysisId": "11111111-1111-1111-1111-111111111111",
    "status": "completed",
    "findings": [
      "No suspicious retinal vascular changes detected.",
      "Visual acuity appears stable."
    ],
    "riskLevel": "low",
    "confidence": 0.92,
    "modelVersion": "mock-v1",
    "processedAt": "2026-07-25T15:30:00Z",
    "disclaimer": "This is a mock analysis for development purposes only."
  }
  ```

## Response envelope chung

Backend trả về tất cả response theo định dạng:
```json
{
  "success": true,
  "data": {...},
  "error": null,
  "traceId": "..."
}
```

Nếu lỗi xảy ra, backend trả về:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AI_CORE_UNAVAILABLE",
    "message": "AI Core is not reachable"
  },
  "traceId": "..."
}
```
