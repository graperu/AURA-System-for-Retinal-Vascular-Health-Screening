# TÀI LIỆU YÊU CẦU THÔNG TIN & TÀI NGUYÊN TỪ CHỦ SỞ HỮU (OWNER)
**Dự án**: AURA - System for Retinal Vascular Health Screening  
**Tài liệu**: `docs/REQUIRED_INPUT_FROM_OWNER.md`  
**Ngày cập nhật**: 13/09/2026  
**Người lập**: Tổng Giám Đốc Điều Hành (AURA CEO)  

Tài liệu này tổng hợp toàn bộ các thông số cấu hình, khóa xác thực (API Keys), tài khoản dịch vụ bên thứ ba (Third-party Credentials) và hạ tầng cần thiết mà Chủ sở hữu (Owner) có thể cung cấp khi muốn triển khai hệ thống lên môi trường Vận hành Thực tế (Production).

> ⚠️ **LƯU Ý QUAN TRỌNG TỪ BAN ĐIỀU HÀNH**:  
> Toàn bộ hệ thống AURA **đã được thiết lập sẵn cơ chế tự vận hành nội bộ (Self-hosted & Local Fail-safe)**. Bạn **vẫn có thể khởi chạy, kiểm thử và demo 100% các tính năng trên máy tính hoặc qua Docker ngay bây giờ** mà không bị chặn bởi các mục bên dưới. Các mục dưới đây chỉ bắt buộc khi bạn muốn kích hoạt dịch vụ thực tế ra ngoài Internet.

---

## BẢNG DANH MỤC CÁC TÀI NGUYÊN CẦN CUNG CẤP

### 1. Khóa Cấu Hình Xác Thực Google OAuth / Firebase (Google Social Login)
* **1. Cần gì**: 
  - File cấu hình Firebase Web (`firebaseConfig`: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) hoặc Google OAuth 2.0 Web Client ID (`client_id`, `client_secret`).
* **2. Dùng cho chức năng nào**: 
  - `[FR-1]` Đăng nhập và Đăng ký bằng tài khoản Google (`LoginForm.tsx`, `RegisterForm.tsx`).
* **3. Vì sao cần**: 
  - Để kích hoạt popup xác thực tài khoản Google thật từ máy chủ Google Identity Platform. Khi không có khóa này, hệ thống sẽ yêu cầu người dùng sử dụng hình thức đăng nhập bằng Email + Mật khẩu + Xác thực mã OTP qua email.
* **4. Cung cấp ở đâu**: 
  - Cung cấp vào file biến môi trường Frontend: `frontend/.env` (các biến `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`).

---

### 2. Thông Tin Tài Khoản Máy Chủ Gửi Thư SMTP (Email Delivery Service)
* **1. Cần gì**: 
  - Thông số máy chủ gửi thư SMTP: Host (`smtp.gmail.com` hoặc SendGrid), Port (`587`), Tên đăng nhập (Email) và Mật khẩu ứng dụng (App Password 16 ký tự).
* **2. Dùng cho chức năng nào**: 
  - `[FR-1]` Gửi mã OTP xác thực kích hoạt tài khoản đăng ký mới.
  - `[FR-9]`, `[FR-39]` Gửi thông báo email khi kết quả phân tích AI đã sẵn sàng hoặc thông báo lịch tái khám.
* **3. Vì sao cần**: 
  - Để máy chủ Spring Boot có thể gửi email thực tế đến hộp thư đến (Inbox) của người dùng ngoài đời thực. Hiện tại hệ thống đang dùng cấu hình biến môi trường và log an toàn trong môi trường dev.
* **4. Cung cấp ở đâu**: 
  - Cung cấp vào file môi trường Backend hoặc Docker: `docker-compose.yml` (khối `backend.environment`) hoặc `backend/src/main/resources/application.yml`:
    ```yaml
    spring:
      mail:
        host: ${SPRING_MAIL_HOST:smtp.gmail.com}
        port: ${SPRING_MAIL_PORT:587}
        username: ${SPRING_MAIL_USERNAME:your-email@gmail.com}
        password: ${SPRING_MAIL_PASSWORD:your-16-char-app-password}
    ```

---

### 3. Khóa API Mô Hình AI Đám Mây Sản Xuất (Cloud AI Production Key)
* **1. Cần gì**: 
  - API Key của Google Gemini (`AIzaSy...`) từ Google AI Studio hoặc API Key OpenRouter (`sk-or-...`).
* **2. Dùng cho chức năng nào**: 
  - `[FR-3]`, `[FR-4]`, `[FR-24]` Phân tích hình ảnh võng mạc Multimodal Vision và trích xuất chỉ số rủi ro vi mạch.
* **3. Vì sao cần**: 
  - Để hệ thống có thể phân tích ảnh 24/7 trực tiếp trên đám mây cho người dùng từ xa mà không phụ thuộc vào máy trạm cá nhân của bạn phải luôn bật và chạy ứng dụng 9router tại cổng 20128.
* **4. Cung cấp ở đâu**: 
  - Cung cấp vào biến môi trường:
    ```bash
    GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
    GEMINI_API_KEY=AIzaSy...
    GEMINI_MODEL=gemini-2.0-flash
    ```
    (trong `docker-compose.yml` hoặc file cấu hình chạy Spring Boot).

---

### 4. Dịch Vụ Lưu Trữ Ảnh Đám Mây Độc Lập (Supabase Storage / Cloudinary) *(Tùy chọn)*
* **1. Cần gì**: 
  - Tài khoản Supabase URL & Service Key hoặc Cloudinary Cloud Name, API Key & API Secret.
* **2. Dùng cho chức năng nào**: 
  - `[FR-2]`, `[FR-24]` Lưu trữ ảnh võng mạc dung lượng lớn trên đám mây đối với các phòng khám tải lên hàng chục ngàn ảnh mỗi tháng.
* **3. Vì sao cần**: 
  - Giảm tải dung lượng lưu trữ trực tiếp (Base64/TEXT) trong database PostgreSQL cục bộ khi quy mô người dùng tăng lên hàng chục ngàn bệnh nhân.
* **4. Cung cấp ở đâu**: 
  - Cung cấp vào cấu hình `backend/src/main/resources/application.yml` (hoặc biến môi trường `SUPABASE_URL`, `SUPABASE_KEY`).

---

### 5. Tên Miền Công Khai & Chứng Chỉ SSL/HTTPS (Domain & TLS Certificate) *(Khi Deploy Production)*
* **1. Cần gì**: 
  - Tên miền chính thức (ví dụ: `aura-retina.vn`, `screening.aura.med`) đã được trỏ DNS về máy chủ VPS/Cloud của bạn, kèm chứng chỉ SSL (Let's Encrypt hoặc Cloudflare SSL).
* **2. Dùng cho chức năng nào**: 
  - Toàn bộ kết nối Web, API và kênh WebSocket STOMP bảo mật qua `https://` và `wss://`.
* **3. Vì sao cần**: 
  - Đáp ứng tiêu chuẩn phi chức năng `[NFR-9]` và `[NFR-10]` (mã hóa đường truyền dữ liệu y tế nhạy cảm theo chuẩn tương đương HIPAA).
* **4. Cung cấp ở đâu**: 
  - Cấu hình tại Reverse Proxy Nginx hoặc Cloudflare Dashboard trước cổng Web frontend (Port 3000) và Backend (Port 8081).

---

## TỔNG KẾT
Toàn bộ các chức năng không phụ thuộc vào các tài khoản dịch vụ ngoài nói trên (Database PostgreSQL, Lưu trữ ca khám, Phân tích AI cục bộ/tunnel, Quản lý bác sĩ, Quản lý bệnh nhân, Lập chiến dịch phòng khám, Quản trị viên, Xuất báo cáo PDF/CSV, Chat thời gian thực WebSocket) **đã được phát triển hoàn thiện 100% và sẵn sàng vận hành**.
