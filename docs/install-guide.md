# Hướng dẫn cài đặt

## Yêu cầu hệ thống
- Docker Desktop hoặc Docker Engine
- JDK 21
- Maven 3.9+
- Node.js 22+
- Python 3.11+

## Thiết lập môi trường
1. Sao chép file cấu hình môi trường:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Khởi động toàn bộ dịch vụ bằng Docker Compose:
   ```powershell
   docker compose up --build
   ```
3. Mở các địa chỉ sau trong trình duyệt:
   - Frontend: `http://localhost:5173/dashboard`
   - Backend health: `http://localhost:8080/health`
   - Backend system info: `http://localhost:8080/api/v1/system/info`
   - AI Core health: `http://localhost:8000/health`

## Chạy từng service riêng
### AI Core
```powershell
cd ai-core
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Backend
```powershell
cd backend
mvn spring-boot:run
```

### Frontend
```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

## Tắt hệ thống
```powershell
docker compose down
```

> Không dùng `docker compose down -v` nếu bạn muốn giữ dữ liệu PostgreSQL development.
