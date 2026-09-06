# HƯỚNG DẪN CÀI ĐẶT & SỔ TAY HƯỚNG DẪN SỬ DỤNG (INSTALLATION & USER MANUAL)
## HỆ THỐNG SÀNG LỌC SỨC KHỎE MẠCH MÁU VÕNG MẠC (AURA)

*Mã tài liệu: `AURA-IUM-08`*  
*Căn cứ đề bài: `DEBAI.pdf` (Mục 4.1 & 4.4 - Gói nhiệm vụ 4 & 5)*  

---

## PHẦN I: HƯỚNG DẪN CÀI ĐẶT & TRIỂN KHAI (INSTALLATION GUIDE)

### 1. Yêu cầu môi trường tiên quyết (Prerequisites)
- **Hệ điều hành**: Windows 10/11, macOS, hoặc Linux (Ubuntu 20.04 LTS+).
- **Docker & Docker Compose**: Docker Desktop phiên bản 24.0+ (khuyến nghị để chạy toàn bộ stack bằng 1 lệnh).
- **Môi trường phát triển cục bộ (nếu chạy không dùng Docker)**:
  - **Java JDK**: Eclipse Temurin hoặc Oracle OpenJDK phiên bản **21 LTS**.
  - **Node.js**: Phiên bản **20 LTS** hoặc 22 LTS (kèm npm).
  - **Python**: Phiên bản **3.10** hoặc 3.11.
  - **PostgreSQL**: Phiên bản 16 (Port 5432).

---

### 2. Triển khai nhanh bằng Docker Compose (Khuyến nghị)

Chỉ với **1 lệnh duy nhất**, hệ thống sẽ tự động khởi động 4 container liên thông:
```bash
# 1. Di chuyển vào thư mục gốc của dự án
cd d:/VERSIONPLUS/AURA-System-for-Retinal-Vascular-Health-Screening

# 2. Khởi chạy toàn bộ hệ thống ở chế độ chạy ngầm
docker-compose up -d --build
```

**Các cổng dịch vụ sau khi khởi chạy:**
- 🌐 **Frontend Web App**: `http://localhost:3000` (hoặc `http://localhost:5173`)
- ☕ **Backend REST API & Swagger UI**: `http://localhost:8081/swagger-ui.html`
- 🐍 **AI Core Microservice API & Docs**: `http://localhost:8000/docs`
- 🐘 **PostgreSQL Database**: `localhost:5432` (Database: `aura_db`, User: `postgres`, Pass: `aura_password123`)

---

### 3. Hướng dẫn chạy thủ công từng thành phần (Local Development)

#### 3.1. Khởi động AI Core Microservice (Python FastAPI)
```bash
cd ai-service
# Cài đặt thư viện phụ thuộc
pip install -r requirements.txt
# Khởi chạy server Uvicorn ở cổng 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3.2. Khởi động Backend Application (Spring Boot 3.4 / Java 21)
```bash
cd backend
# Chạy ứng dụng bằng Maven Wrapper (Cổng 8081)
./mvnw spring-boot:run
# Trên Windows:
.\mvnw.cmd spring-boot:run
```

#### 3.3. Khởi động Frontend Web Client (React 18 + Vite)
```bash
cd frontend
# Cài đặt packages nếu chưa có
npm install
# Khởi chạy Vite dev server ở cổng 5173
npm run dev
```

---

## PHẦN II: SỔ TAY HƯỚNG DẪN SỬ DỤNG (USER MANUAL)

### 1. Dành cho Bệnh nhân (Patient User)
1. **Đăng nhập / Chuyển vai trò**: Trên thanh điều hướng trên cùng, người dùng có thể chuyển nhanh sang vai trò **"Bệnh nhân"**.
2. **Tải ảnh chụp đáy mắt**: Tại giao diện chính, kéo thả file ảnh võng mạc (hoặc bấm chọn file) và bấm **"Phân Tích Nguy Cơ AI"**.
3. **Xem kết quả & Grad-CAM Heatmap**: 
   - Quan sát thang đo nguy cơ 4 nhóm bệnh.
   - Kéo thanh trượt **Độ mờ bản đồ nhiệt (Opacity)** để xem vị trí tổn thương vi mạch.
4. **Xuất báo cáo PDF**: Bấm **"Xuất Báo Cáo Y Khoa (PDF)"** để mở bản xem trước phiếu khám y tế có chữ ký số và bấm **"In Báo Cáo"**.
5. **Chat tư vấn**: Bấm nút **"Tư Vấn Với Bác Sĩ"** để mở cửa sổ trò chuyện và gửi câu hỏi trực tiếp.
6. **Nạp Credit**: Bấm **"Nạp Thêm Lượt Phân Tích"** trên thẻ hạn mức để mở cổng thanh toán.

---

### 2. Dành cho Bác sĩ Chuyên khoa (Doctor)
1. **Truy cập Doctor CDS**: Chọn vai trò **"Bác sĩ"** trên thanh điều hướng.
2. **Chọn bệnh nhân**: Chọn bệnh nhân cần duyệt từ thanh danh sách bệnh nhân phía trên.
3. **Phân tích hình ảnh chuyên sâu**:
   - Sử dụng chế độ so sánh **Side-by-Side (Ảnh gốc song song Heatmap)**.
   - Sử dụng tính năng **Zoom & Pan** để soi kỹ các điểm bắt chéo động-tĩnh mạch (AV Nicking) và tỷ lệ AVR.
4. **Thẩm định & Ký duyệt kết quả**:
   - Bấm **"Xác Nhận (Đồng Ý)"** nếu đồng tình với AI.
   - Bấm **"Chỉnh Sửa Nguy Cơ"** để thay đổi mức độ rủi ro theo chuyên môn.
   - Bấm **"Thêm Chẩn Đoán & Ký Duyệt"** để ghi lời khuyên lâm sàng, đơn thuốc và đóng dấu bác sĩ.
5. **Phản hồi mô hình AI**: Bấm **"Phản Hồi AI"** để gửi ghi chú lỗi phục vụ quá trình tái huấn luyện (Retraining).

---

### 3. Dành cho Phòng khám (Clinic)
1. **Truy cập Clinic Portal**: Chọn vai trò **"Phòng khám"**.
2. **Tải ảnh chiến dịch theo lô**: Kéo thả thư mục chứa $\ge 100$ ảnh võng mạc vào khu vực tải lô và bấm **"Gửi Xử Lý Hàng Loạt"**.
3. **Giám sát tiến độ & Cảnh báo**:
   - Theo dõi thanh tiến độ xử lý và biểu đồ phân bổ nguy cơ của chiến dịch.
   - Chú ý banner **Cảnh báo khẩn cấp** đối với các ca bệnh có tổn thương nghiêm trọng.
4. **Xuất báo cáo chiến dịch & CSV**:
   - Bấm **"Tạo Báo Cáo Chiến Dịch"** để xuất bản tóm tắt toàn phòng khám.
   - Bấm **"Xuất CSV Nghiên Cứu"** để tải dữ liệu số hóa ẩn danh phục vụ báo cáo khoa học.

---

### 4. Dành cho Quản trị viên (System Admin)
1. **Truy cập Admin Console**: Chọn vai trò **"Quản trị viên"**.
2. **Quản lý người dùng**: Tra cứu danh sách tài khoản, chuyển đổi vai trò, bấm **"Vô hiệu hóa / Kích hoạt"** người dùng hoặc bấm **"Duyệt Phòng Khám"** cho các cơ sở mới đăng ký.
3. **Cấu hình tham số AI**:
   - Điều chỉnh ngưỡng nhạy cảm chẩn đoán (Sensitivity Slider) và ngưỡng cảnh báo AVR.
   - Bật/tắt cơ chế tự động thu thập dữ liệu tái huấn luyện (Auto-Retrain Policy).
4. **Kiểm toán an toàn thông tin (Audit Logs)**:
   - Tra cứu chi tiết từng thao tác truy cập hồ sơ bệnh án (PHI Access).
   - Bấm **"Xuất File Log (CSV/JSON)"** để phục vụ công tác thanh tra bảo mật y tế.
