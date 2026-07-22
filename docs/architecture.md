# Kiến trúc AURA Milestone 1

Frontend React chỉ giao tiếp với API chính ASP.NET Core. API kiểm tra request, điều phối phân tích và gọi AI Core qua HTTP nội bộ. AI Core không tải ảnh và chỉ trả dữ liệu mô phỏng. PostgreSQL lưu dữ liệu nghiệp vụ/metadata; ảnh y tế sẽ thuộc object storage trong milestone sau.

```text
Browser ──HTTP──> AURA.Api (modular monolith) ──EF Core──> PostgreSQL
                         │
                         └──internal HTTP──> FastAPI AI Core
```

Backend chia thành các layer:

- `AURA.Api`: HTTP boundary, response envelope, validation, exception handling.
- `AURA.Application`: use case và interface, không phụ thuộc hạ tầng.
- `AURA.Domain`: entity và quy tắc nghiệp vụ cốt lõi.
- `AURA.Infrastructure`: PostgreSQL, EF Core và HTTP client AI Core.
- `AURA.Modules`: catalog ranh giới module và vai trò; module chỉ nhận class khi nghiệp vụ thật được triển khai.

Quyết định Milestone 1:

- Modular monolith thay vì microservice theo module để giảm chi phí vận hành.
- Migration được dùng cho schema; không dùng `EnsureCreated`.
- Health trả HTTP 200 cùng trạng thái từng dependency để container API vẫn có thể được quan sát khi một dependency suy giảm.
- JWT/RBAC và clinic tenancy mới chỉ được bảo lưu qua ranh giới module và role; chưa tạo xác thực giả.
- Endpoint phân tích là mock, không phải chẩn đoán y tế.
