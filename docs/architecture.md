# Kiến trúc AURA Milestone 1

## Tổng quan

```text
Browser
  │
  │ HTTP/REST
  ▼
React + TypeScript
  │
  │ /health, /api/v1/system/info, /api/v1/analyses/demo
  ▼
Java 21 + Spring Boot + Maven
  ├── Spring Data JPA ──> PostgreSQL
  └── RestClient ───────> Python FastAPI AI Core
                              ├── /health
                              └── /api/v1/analyze
```

Backend Spring Boot là API chính. Frontend không được gọi trực tiếp AI Core. Backend chịu trách nhiệm validation, chuẩn hóa response và che giấu địa chỉ nội bộ của AI Core.

## Ranh giới backend

- `analysis`: gom controller, service, client, DTO, entity và repository của luồng phân tích.
- `system`: gom controller, service và DTO cho health/system info.
- `common/config`: cấu hình CORS, timeout và REST client dùng chung.
- `common/exception`: chuyển lỗi thành response thống nhất.
- `common/response`: chứa `ApiEnvelope` và `ApiError` dùng chung giữa các feature.

Cấu trúc này thể hiện OOP ở mức nền tảng nhưng không thêm CQRS, event bus hoặc microservice nghiệp vụ trong Milestone 1.

## Luồng phân tích demo

1. Frontend tạo UUID và tham chiếu ảnh giả.
2. Spring Boot validation `DemoAnalysisRequest`.
3. `AnalysisService` giao việc gọi HTTP cho `AiCoreClient`.
4. AI Core trả kết quả mock có disclaimer.
5. Spring Boot bọc kết quả trong `ApiEnvelope` rồi trả frontend.

AI Core không tải hoặc xử lý ảnh thật. Đây không phải kết quả chẩn đoán y tế.

## Dữ liệu

PostgreSQL là database được kết nối trong Milestone 1 qua Spring Data JPA. Ảnh y tế không được lưu trực tiếp trong PostgreSQL; entity chỉ lưu URL/metadata.

MongoDB thuộc định hướng tổng thể nhưng chưa được thêm trong Milestone 1 vì chưa có use case document cụ thể. Việc chọn dữ liệu đưa vào MongoDB cần được xác định trước khi tạo collection hoặc repository.

## Quyết định giới hạn

- Một backend Spring Boot duy nhất, không chia microservice theo bảng.
- AI Core là microservice Python độc lập.
- Chưa triển khai JWT, đăng nhập hoàn chỉnh, Flyway hoặc OpenAPI.
- Chưa có package auth; các placeholder đăng nhập/JWT đã được loại khỏi Milestone 1.
- Health trả trạng thái riêng của PostgreSQL và AI Core để frontend quan sát dependency.
