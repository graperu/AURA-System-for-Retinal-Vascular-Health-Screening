# AURA – Hệ thống sàng lọc sức khỏe mạch máu võng mạc

AURA Milestone 1 là nền tảng kỹ thuật chạy được từ giao diện đến API, PostgreSQL và dịch vụ phân tích mô phỏng. Mục tiêu hiện tại là tạo một monorepo rõ ràng, dễ học và đủ ranh giới để phát triển dần các yêu cầu nghiệp vụ sau này.

> AI trong dự án chỉ hỗ trợ sàng lọc. Kết quả mock hoặc kết quả AI tương lai không thay thế chẩn đoán và quyết định của bác sĩ.

## Kiến trúc hiện tại

```text
React + TypeScript ──REST──> ASP.NET Core Web API ──EF Core──> PostgreSQL
                                      │
                                      └──HTTP nội bộ──> Python FastAPI AI Core
```

Frontend không gọi trực tiếp AI Core. Backend là API công khai duy nhất và trả response nhất quán gồm `success`, `data`, `error`, `traceId`. Xem thêm [quyết định kiến trúc](docs/architecture.md).

## Cấu trúc thư mục

```text
frontend/                     React, TypeScript, Vite, Router, ESLint
backend/
  src/AURA.Api/               controller và HTTP pipeline
  src/AURA.Application/       use case và abstraction
  src/AURA.Domain/            domain entity
  src/AURA.Infrastructure/    EF Core, PostgreSQL, AI HTTP client
  src/AURA.Modules/           catalog module và role nền tảng
  tests/AURA.Api.Tests/       integration test API
ai-core/app/                  FastAPI route, schema, service, config
ai-core/tests/                pytest
docs/                         tài liệu kỹ thuật
scripts/                      lệnh kiểm chứng
docker-compose.yml            môi trường tích hợp
```

Các module dự kiến gồm Identity, Clinics, Doctors, Patients, Examinations, RetinalImages, Analyses, Reviews, Reports, Payments, Chat, Notifications, Administration, Audit và AI Models. Milestone 1 không sinh class rỗng cho từng module.

## Yêu cầu môi trường

- Docker Desktop/Engine có Docker Compose; hoặc
- .NET SDK 8 trở lên, Node.js 22 LTS trở lên, npm và Python 3.11 trở lên;
- PostgreSQL 16 nếu chạy backend cục bộ không qua Docker.

## Chạy toàn bộ bằng Docker

```bash
cp .env.example .env
docker compose up --build
```

Trên PowerShell dùng `Copy-Item .env.example .env`. Các địa chỉ mặc định:

- Frontend: <http://localhost:5173>
- Backend/Swagger: <http://localhost:8080/swagger>
- Backend health: <http://localhost:8080/health>
- AI Core health (chỉ phục vụ kiểm tra phát triển): <http://localhost:8000/health>
- PostgreSQL: `localhost:5432`

Dừng stack bằng `docker compose down`. Dùng `docker compose down -v` chỉ khi chủ động muốn xóa dữ liệu PostgreSQL development.

## Chạy từng service khi phát triển

### PostgreSQL

Có thể chỉ chạy database: `docker compose up postgres`. Connection string mặc định development nằm trong `backend/src/AURA.Api/appsettings.json` và không dùng cho production.

### AI Core

```bash
cd ai-core
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

### Backend

```bash
cd backend
dotnet restore AURA.sln
dotnet run --project src/AURA.Api
```

Để áp migration lúc khởi động, đặt `Database__MigrateOnStartup=true`. Swagger chỉ bật khi `ASPNETCORE_ENVIRONMENT=Development`.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Tạo `frontend/.env.local` nếu backend không ở `http://localhost:8080`.

## Biến môi trường

| Biến | Mặc định mẫu | Ý nghĩa |
|---|---|---|
| `POSTGRES_DB` | `aura` | Tên database development |
| `POSTGRES_USER` | `aura` | User database development |
| `POSTGRES_PASSWORD` | `aura_dev_password` | Mật khẩu mẫu, phải đổi ngoài development |
| `BACKEND_PORT` | `8080` | Port API trên host |
| `FRONTEND_PORT` | `5173` | Port giao diện trên host |
| `AI_CORE_PORT` | `8000` | Port AI Core trên host |
| `VITE_BACKEND_API_URL` | `http://localhost:8080` | URL backend mà trình duyệt truy cập |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Origin được backend cho phép qua CORS |
| `ConnectionStrings__Postgres` | xem Compose | Override connection string .NET |
| `AiCore__BaseUrl` | `http://ai-core:8000` | URL nội bộ do backend sử dụng |

Không đưa `.env` thật vào Git. Giá trị trong `.env.example` chỉ dành cho development.

## API Milestone 1

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/health` | Trạng thái API, PostgreSQL và AI Core |
| GET | `/api/v1/system/info` | Thông tin service và dependency |
| POST | `/api/v1/analyses/demo` | Backend validation → AI Core mock |
| GET | AI Core `/health` | Health nội bộ |
| POST | AI Core `/api/v1/analyze` | Phân tích mô phỏng nội bộ |

Payload demo gồm GUID `analysisId`, `examinationId`, `imageId`, `imageType` (`Fundus` hoặc `OCT`) và URL `imageUrl`. Không dùng dữ liệu bệnh nhân hoặc ảnh thật.

## Test, lint và build

```bash
# Backend
dotnet restore backend/AURA.sln
dotnet build backend/AURA.sln -c Release --no-restore
dotnet test backend/AURA.sln -c Release --no-build

# AI Core (sau khi cài requirements-dev.txt)
cd ai-core && python -m pytest

# Frontend
cd frontend && npm ci && npm run lint && npm run build

# Kiểm tra Compose
docker compose config --quiet
```

Trên Windows có thể chạy toàn bộ kiểm tra cục bộ bằng `powershell -File scripts/verify.ps1`.

## Đã có và chưa có

Đã có: dashboard tối thiểu, trạng thái dependency qua backend, luồng demo frontend → backend → AI Core, validation request, global exception handler, structured JSON logging, CORS qua cấu hình, EF Core/Npgsql, migration `system_records`, Swagger development, test API và AI Core, Dockerfile/healthcheck cho mọi service.

Chưa có: đăng nhập/JWT/RBAC, clinic tenancy, nghiệp vụ bệnh nhân/ca khám/ảnh/review/report/payment/chat/notification/audit, object storage, mô hình AI thật và xử lý ảnh. Đây là chủ ý giới hạn Milestone 1.

## Lỗi thường gặp

- `port is already allocated`: đổi port tương ứng trong `.env` rồi build lại frontend nếu đổi URL backend.
- Backend báo PostgreSQL unavailable: kiểm tra `docker compose ps` và connection string; chờ health database chuyển sang healthy.
- AI Core unavailable: kiểm tra `docker compose logs ai-core`; backend dùng hostname nội bộ `ai-core`, trình duyệt không dùng hostname này.
- CORS trên frontend: thêm đúng origin trình duyệt vào `Cors__AllowedOrigins__0` và khởi động lại backend.
- Migration lỗi do database cũ: chỉ với dữ liệu development có thể chủ động chạy `docker compose down -v`, sau đó tạo lại stack.
- PowerShell chặn `npm.ps1`: dùng `npm.cmd`.
- Python launcher không chạy: xác nhận Python đã cài và có trong `PATH`, hoặc chạy test qua Docker.
