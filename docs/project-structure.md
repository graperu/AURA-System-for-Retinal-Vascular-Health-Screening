# Project Structure

## Root
- `docker-compose.yml` - phối hợp toàn bộ service.
- `.env.example` - biến môi trường mẫu.
- `README.md` - giới thiệu dự án và hướng dẫn nhanh.
- `docs/` - tài liệu chi tiết về kiến trúc, API và kiểm thử.
- `scripts/` - script kiểm tra và chạy.

## Backend
- `backend/pom.xml` - cấu hình Maven.
- `backend/Dockerfile` - xây image backend.
- `backend/src/main/java/com/aura/backend/` - mã nguồn Java.
  - `BackendApplication.java` - entrypoint Spring Boot.
  - `analysis/` - feature phân tích.
    - `controller/` - endpoint REST.
    - `service/` - nghiệp vụ phân tích.
    - `client/` - HTTP client gọi AI Core.
    - `dto/` - request/response contract.
    - `entity/` - đối tượng JPA nếu cần.
    - `repository/` - Spring Data repository.
  - `system/` - health và thông tin hệ thống.
  - `common/` - cấu hình dùng chung, CORS, exception handler và envelope response.
- `backend/src/main/resources/application.yml` - cấu hình datasource, AI Core và CORS.

## Frontend
- `frontend/package.json` - cấu hình npm và dependencies.
- `frontend/vite.config.ts` - cấu hình Vite.
- `frontend/src/` - mã nguồn React.
  - `pages/` - các trang chính, ví dụ `DashboardPage`, `NotFoundPage`.
  - `components/` - component UI chung như `StatusBadge`.
  - `services/` - lớp gọi API frontend.
  - `types/` - định nghĩa kiểu TypeScript dùng chung.
  - `api/` - (tạm thời) nơi chứa các API helper cũ hoặc tiện ích.
  - `main.tsx` - entrypoint ứng dụng.
  - `App.tsx` - cấu trúc route.
  - `styles.css` - kiểu chung.

## AI Core
- `ai-core/Dockerfile` - xây image AI Core.
- `ai-core/requirements.txt` - phụ thuộc Python.
- `ai-core/app/` - mã nguồn FastAPI.
  - `routes/` - endpoint AI.
  - `schemas/` - định nghĩa Pydantic.
  - `services/` - logic mô phỏng.

## Docs
- `docs/api-contract.md` - hợp đồng API.
- `docs/architecture.md` - mô tả kiến trúc và dòng dữ liệu.
- `docs/install-guide.md` - hướng dẫn cài đặt.
- `docs/test-plan.md` - kế hoạch kiểm thử.
- `docs/release-notes.md` - ghi nhận thay đổi.
- `docs/project-structure.md` - cấu trúc thư mục và phân vùng.
