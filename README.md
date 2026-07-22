# AURA – Hệ thống sàng lọc sức khỏe mạch máu võng mạc

AURA là dự án môn Java xây dựng nền tảng hỗ trợ sàng lọc sức khỏe mạch máu võng mạc. Milestone 1 tập trung vào bộ khung kỹ thuật tối thiểu và luồng phân tích mô phỏng từ giao diện đến AI Core.

> Kết quả AI hiện tại là dữ liệu mock phục vụ phát triển. Hệ thống không thay thế chẩn đoán hoặc quyết định của bác sĩ.

## Kiến trúc Milestone 1

```text
React + TypeScript ──HTTP/REST──> Java Spring Boot ──JPA──> PostgreSQL
                                         │
                                         └──HTTP──> Python FastAPI AI Core
```

Frontend chỉ gọi backend Spring Boot. Backend kiểm tra request và gọi AI Core; frontend không gọi trực tiếp AI Core.

MongoDB được dự kiến cho các milestone sau nhưng chưa được cấu hình trong Milestone 1 vì chưa có use case lưu trữ tài liệu cụ thể.

## Công nghệ

- Backend: Java 21, Spring Boot 3, Maven, Spring Web, Spring Data JPA.
- Frontend: React, TypeScript, Vite, React Router, ESLint.
- AI Core: Python, FastAPI, Pydantic, Uvicorn.
- Database hiện tại: PostgreSQL 16.
- Hạ tầng development: Docker Compose.

## Cấu trúc thư mục

```text
backend/
  pom.xml
  src/main/java/com/aura/backend/
    BackendApplication.java
    common/
      config/        CORS và cấu hình HTTP client
      exception/     xử lý lỗi tập trung
      response/      API envelope dùng chung
    analysis/
      client/        REST client gọi AI Core
      controller/    endpoint phân tích
      dto/           contract request/response
      entity/        mô hình JPA nghiệp vụ
      repository/    Spring Data repository
      service/       nghiệp vụ phân tích
    system/
      controller/    health và system info
      dto/           contract trạng thái hệ thống
      service/       kiểm tra dependency
  src/main/resources/application.yml
  src/test/java/     test endpoint tối thiểu
frontend/            React + TypeScript
ai-core/             FastAPI mock service
docs/                tài liệu kiến trúc
scripts/             script kiểm tra
docker-compose.yml
```

## Yêu cầu môi trường

Cách đơn giản nhất là dùng Docker Desktop hoặc Docker Engine có Docker Compose.

Nếu chạy từng service trực tiếp, cần:

- JDK 21.
- Maven 3.9 trở lên.
- Node.js 22 trở lên và npm.
- Python 3.11 trở lên.
- PostgreSQL 16.

## Chạy toàn bộ bằng Docker

Tại thư mục gốc:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Các địa chỉ mặc định:

- Frontend: <http://localhost:5173/dashboard>
- Backend health: <http://localhost:8080/health>
- Backend system info: <http://localhost:8080/api/v1/system/info>
- AI Core health: <http://localhost:8000/health>
- PostgreSQL: `localhost:5432`

Kiểm tra container:

```powershell
docker compose ps
docker compose logs -f backend
```

Dừng hệ thống:

```powershell
docker compose down
```

Không dùng `docker compose down -v` nếu muốn giữ dữ liệu PostgreSQL development.

## Chạy từng service

### PostgreSQL

```powershell
docker compose up postgres
```

### AI Core

```powershell
cd ai-core
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Backend Java

```powershell
cd backend
mvn spring-boot:run
```

Backend dùng các biến `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `AI_CORE_BASE_URL` và `CORS_ALLOWED_ORIGINS`. Giá trị development mặc định nằm trong `application.yml`.

### Frontend

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Frontend lấy URL backend từ `VITE_BACKEND_API_URL`, mặc định là `http://localhost:8080`.

## API hiện có

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/health` | Trạng thái backend, PostgreSQL và AI Core |
| GET | `/api/v1/system/info` | Thông tin hệ thống cho dashboard |
| POST | `/api/v1/analyses/demo` | Validation và chuyển yêu cầu mock tới AI Core |
| GET | AI Core `/health` | Health check AI Core |
| POST | AI Core `/api/v1/analyze` | Phân tích mô phỏng nội bộ |

Backend trả response thống nhất:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "traceId": "..."
}
```

Endpoint demo chỉ nhận UUID và URL ảnh giả lập. Không dùng ảnh hoặc dữ liệu bệnh nhân thật.

## Kiểm tra dự án

```powershell
# Backend
mvn -f backend/pom.xml test

# AI Core
cd ai-core
python -m pytest

# Frontend
cd frontend
npm.cmd ci
npm.cmd run lint
npm.cmd run build

# Docker Compose
docker compose config --quiet
```

Trên PowerShell có thể chạy `powershell -File scripts/verify.ps1` khi Java, Maven, Python, Node và Docker đều có trong `PATH`.

## Phạm vi Milestone 1

Đã triển khai trong bộ khung:

- Backend Java/Spring Boot theo các lớp controller, service, client, repository, entity và DTO.
- PostgreSQL qua Spring Data JPA.
- Luồng frontend → backend → AI Core mock.
- Validation, response envelope, global exception handler và CORS.
- Test Java tối thiểu cho health, system info và demo analysis.
- Dockerfile cho từng service và Docker Compose.

Chưa triển khai trong Milestone 1:

- JWT và đăng nhập hoàn chỉnh.
- Phân quyền RBAC và phân tách dữ liệu phòng khám.
- MongoDB và nghiệp vụ cần lưu document.
- Flyway, OpenAPI và mô hình AI thật.
- Các module bệnh nhân, ca khám, review, báo cáo, thanh toán và thông báo hoàn chỉnh.

## Lỗi thường gặp

- `mvn` không tồn tại: cài Maven và JDK 21, sau đó kiểm tra `mvn --version`.
- Port `8080` đã được sử dụng: đổi `BACKEND_PORT` và `VITE_BACKEND_API_URL` trong `.env`, rồi build lại frontend.
- PostgreSQL unavailable: kiểm tra `docker compose ps` và các biến `DATABASE_*`.
- AI Core unavailable: kiểm tra `docker compose logs ai-core` và `AI_CORE_BASE_URL`.
- CORS: bảo đảm `CORS_ALLOWED_ORIGINS` đúng origin của trình duyệt.
- Docker tải image lỗi: thử lại `docker compose pull` khi kết nối registry ổn định.
