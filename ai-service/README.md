# AURA AI Core Microservice

Dịch vụ vi mô (Microservice) suy luận trí tuệ nhân tạo xây dựng bằng **Python 3.10**, **FastAPI** và **PyTorch**.

## 1. Tính năng chính
- **Tiền xử lý ảnh võng mạc**: Crop viền đen tự động, chuẩn hóa kích thước $512 \times 512$, cân bằng độ tương phản cục bộ thích ứng (CLAHE).
- **Phân loại 4 nhóm bệnh lý**:
  - `Cardiovascular Risk` (Nguy cơ tim mạch / Xơ vữa vi mạch võng mạc)
  - `Diabetic Retinopathy` (Bệnh võng mạc đái tháo đường)
  - `Glaucoma` (Nguy cơ tăng nhãn áp / Cup-to-Disc Ratio)
  - `AMD` (Thoái hóa hoàng điểm tuổi già)
- **Giải thích quyết định AI (XAI)**: Sinh bản đồ nhiệt **Grad-CAM Heatmap** chỉ rõ các điểm vi phình mạch (Microaneurysms) và cung mạch bất thường.
- **Xử lý hàng loạt (Bulk Processing)**: Hỗ trợ xử lý lô $\ge 100$ ảnh võng mạc.

## 2. Hướng dẫn chạy

### Cài đặt môi trường
```bash
python -m venv venv
# Trên Windows:
.\venv\Scripts\activate
# Trên Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### Chạy trực tiếp dịch vụ (Port 8000)
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Swagger UI Tài liệu API**: `http://localhost:8000/docs`
- **Health Check Endpoint**: `http://localhost:8000/health`

### Chạy bằng Docker
```bash
docker build -t aura-ai-service .
docker run -d -p 8000:8000 --name aura-ai aura-ai-service
```
