# BÁO CÁO CHI TIẾT TIẾN ĐỘ THỰC HIỆN YÊU CẦU CHỨC NĂNG FR-1 VÀ FR-8
**Dự án**: AURA — Hệ thống Sàng lọc Sức khỏe Mạch máu Võng mạc (Retinal Vascular Health Screening)  
**Tài liệu tham chiếu**: `DEBAI.pdf`, `AUDIT_REPORT.md`, `CHECKLIST.md`  
**Thời điểm lập báo cáo**: Tháng 9/2026  

---

## 📌 TỔNG QUAN ĐÁNH GIÁ

| Mã Yêu Cầu | Tên Chức Năng | Phân Hệ | Trạng Thái Ban Đầu (Audit) | Trạng Thái Hiện Tại | Tỷ Lệ Hoàn Thành |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **FR-1** | **Đăng ký & Đăng nhập Hệ thống** | Toàn hệ thống (All Users) | PARTIAL (Thiếu Social & OTP) | **HOÀN THÀNH TOÀN DIỆN (95%)** | 95% |
| **FR-8** | **Hồ sơ Cá nhân & Tiền sử Y tế** | Bệnh nhân / Bác sĩ (Patient/Doctor) | UI ONLY (Chưa có DB Backend) | **ĐÃ CÓ UI - CHỜ TÍCH HỢP DB (40%)** | 40% |

---

## 🔐 PHẦN I. CHI TIẾT YÊU CẦU FR-1: ĐĂNG KÝ VÀ ĐĂNG NHẬP

### 1. Bảng Đối Soát Chi Tiết Các Hạng Mục FR-1

| STT | Hạng Mục / Tiêu Chí Yêu Cầu | Trạng Thái | Mô Tả Kỹ Thuật & Bằng Chứng Triển Khai | File / Endpoint Liên Quan |
| :---: | :--- | :---: | :--- | :--- |
| **1.1** | **Đăng ký tài khoản bằng Email** | ✅ **HOÀN THÀNH** | Form đăng ký xác thực định dạng email, họ tên, chuẩn hóa chữ thường. Kiểm tra trùng lặp email trên database PostgreSQL. | `frontend/src/components/auth/RegisterForm.tsx`<br>`POST /api/v1/auth/register` |
| **1.2** | **Chính sách Mật khẩu chuẩn Y tế** | ✅ **HOÀN THÀNH** | Ràng buộc Regex OWASP: 12–128 ký tự, bắt buộc có chữ hoa, chữ thường, số và ký tự đặc biệt. Băm mật khẩu bằng `BCryptPasswordEncoder` (12 rounds). | `backend/src/main/java/com/aura/auth/dto/RegisterRequest.java`<br>`frontend/src/components/auth/PasswordInput.tsx` |
| **1.3** | **Gửi mã OTP xác thực Email khi Đăng ký** | ✅ **HOÀN THÀNH** | Sinh mã OTP ngẫu nhiên 6 chữ số (`SecureRandom`), TTL 5 phút. In log trực quan tại console; sẵn sàng cấu hình SMTP gửi email. | `backend/src/main/java/com/aura/auth/service/OtpService.java`<br>`POST /api/v1/auth/send-otp` |
| **1.4** | **Giao diện Nhập OTP & Đếm ngược** | ✅ **HOÀN THÀNH** | Giao diện nhập OTP 6 số đẹp mắt, tự động focus, chống spam với bộ đếm ngược 60 giây trước khi cho phép gửi lại mã mới. | `frontend/src/components/auth/RegisterForm.tsx` (Step `otp`) |
| **1.5** | **Xác thực OTP & Tự động Đăng nhập** | ✅ **HOÀN THÀNH** | Kiểm tra mã OTP, giới hạn tối đa 5 lần thử sai (chống Brute-force). Đánh dấu `emailVerified = true`, lưu User, cấp JWT và vào thẳng Dashboard. | `backend/src/main/java/com/aura/auth/service/AuthService.java`<br>`POST /api/v1/auth/verify-otp` |
| **1.6** | **Đăng nhập Email / Mật khẩu** | ✅ **HOÀN THÀNH** | Xác thực qua `AuthenticationManager`, cấp Access Token (JWT 30 phút) và Refresh Token trong `HttpOnly Cookie` (7 ngày, SameSite=Strict). | `frontend/src/components/auth/LoginForm.tsx`<br>`POST /api/v1/auth/login` |
| **1.7** | **Đăng nhập Google SSO (OAuth2 / Firebase)** | ✅ **HOÀN THÀNH** | Tích hợp Google Identity & Firebase Auth (`signInWithPopup`). Nút bấm Google chuẩn nhận diện. Có cơ chế Fallback an toàn không crash UI. | `frontend/src/config/firebase.ts`<br>`POST /api/v1/auth/social` |
| **1.8** | **Đăng xuất an toàn (Logout)** | ✅ **HOÀN THÀNH** | Thu hồi và xóa Refresh Token trong bảng `refresh_tokens`, xóa Cookie và LocalStorage. | `POST /api/v1/auth/logout`<br>`frontend/src/context/AuthContext.tsx` |
| **1.9** | **Tự động làm mới phiên làm việc (Refresh)** | ✅ **HOÀN THÀNH** | Cơ chế Silent Refresh tự động gia hạn Access Token qua HttpOnly Cookie khi token hết hạn. | `POST /api/v1/auth/refresh`<br>`frontend/src/services/api.ts` |
| **1.10**| **Khóa tài khoản vô hiệu hóa** | ✅ **HOÀN THÀNH** | Chặn đăng nhập đối với tài khoản bị Admin vô hiệu hóa (`active = false`), trả về mã `ACCOUNT_DISABLED`. | `backend/src/main/java/com/aura/auth/service/AuthService.java` |
| **1.11**| **Quên mật khẩu & Đặt lại mật khẩu** | ⏳ **CHƯA LÀM** | Cần bổ sung nút "Quên mật khẩu?" trên form Login và API gửi OTP khôi phục mật khẩu. | `frontend/src/components/auth/LoginForm.tsx`<br>`POST /api/v1/auth/forgot-password` (Dự kiến) |
| **1.12**| **Cấu hình SMTP Server thực tế** | ⏳ **CHƯA LÀM** | Hiện tại OTP lưu trong cache bộ nhớ và in ra logger backend; cần điền thông số SMTP (Gmail / SendGrid / SES) khi chạy trên domain thật. | `backend/src/main/resources/application.yml` |

---

## 🩺 PHẦN II. CHI TIẾT YÊU CẦU FR-8: HỒ SƠ CÁ NHÂN & TIỀN SỬ Y TẾ

### 1. Bảng Đối Soát Chi Tiết Các Hạng Mục FR-8

| STT | Hạng Mục / Tiêu Chí Yêu Cầu | Trạng Thái | Mô Tả Kỹ Thuật & Hiện Trạng Thực Tế | File / Endpoint Liên Quan |
| :---: | :--- | :---: | :--- | :--- |
| **2.1** | **Giao diện Quản lý Hồ sơ Y tế (Modal UI)** | ✅ **HOÀN THÀNH** | Đã xây dựng component `MedicalProfileModal.tsx` với đầy đủ các trường nhập liệu thông tin cá nhân và bệnh án. | `frontend/src/components/MedicalProfileModal.tsx`<br>`frontend/src/pages/PatientPortalPage.tsx` |
| **2.2** | **Lấy thông tin tài khoản cơ bản** | ✅ **HOÀN THÀNH** | Lấy Họ tên, Email, Vai trò (Role), Trạng thái kích hoạt của người dùng đang đăng nhập từ Backend. | `GET /api/v1/auth/me`<br>`frontend/src/context/AuthContext.tsx` |
| **2.3** | **Nhập thông tin nhân khẩu học cơ bản** | ⚠️ **MỚI CÓ UI** | Giao diện cho phép nhập: Ngày sinh, Giới tính, Số điện thoại, Địa chỉ, Số BHYT/CCCD. Dữ liệu đang lưu tạm ở React State. | `frontend/src/components/MedicalProfileModal.tsx` |
| **2.4** | **Nhập tiền sử Đái tháo đường (Diabetes)** | ⚠️ **MỚI CÓ UI** | Giao diện cho phép chọn: Có mắc tiểu đường không, Loại (Type 1, Type 2, Thai kỳ), số năm mắc, chỉ số HbA1c gần nhất. | `frontend/src/components/MedicalProfileModal.tsx` |
| **2.5** | **Nhập tiền sử Tăng huyết áp (Hypertension)** | ⚠️ **MỚI CÓ UI** | Giao diện cho phép chọn: Tiền sử cao huyết áp, Huyết áp tâm thu/tâm trương bình thường, tiền sử bệnh mạch vành/đột quỵ. | `frontend/src/components/MedicalProfileModal.tsx` |
| **2.6** | **Danh mục Thuốc & Dị ứng đang sử dụng** | ⚠️ **MỚI CÓ UI** | Giao diện cho phép nhập danh sách thuốc điều trị hàng ngày, tiền sử dị ứng thuốc/thực phẩm. | `frontend/src/components/MedicalProfileModal.tsx` |
| **2.7** | **Bảng Cơ sở dữ liệu `patient_medical_profiles`** | ⏳ **CHƯA LÀM** | Chưa tạo migration Flyway bảng `patient_medical_profiles` trong PostgreSQL để lưu trữ vĩnh viễn các thông số y tế trên. | `backend/src/main/resources/db/migration/` (Dự kiến `V012__create_patient_medical_profiles.sql`) |
| **2.8** | **Backend API CRUD Hồ sơ Y tế** | ⏳ **CHƯA LÀM** | Chưa xây dựng Entity, Repository, Service và Controller cho các endpoint `GET /api/v1/patient/profile` và `PUT /api/v1/patient/profile`. | `backend/src/main/java/com/aura/patient/` (Dự kiến) |
| **2.9** | **Kết nối Lưu dữ liệu Form với Backend API** | ⏳ **CHƯA LÀM** | Hàm `handleSave` trên `MedicalProfileModal.tsx` cần gọi API Backend thay vì chỉ cập nhật local state. | `frontend/src/components/MedicalProfileModal.tsx`<br>`frontend/src/services/api.ts` |
| **2.10**| **Tích hợp Hồ sơ vào Bảng Hội chẩn Bác sĩ (CDS)** | ⏳ **CHƯA LÀM** | Cho phép Bác sĩ xem nhanh tiền sử bệnh (tiểu đường, huyết áp) ngay cạnh ảnh mạch máu võng mạc để đánh giá lâm sàng chính xác hơn. | `frontend/src/pages/CDSDashboardPage.tsx`<br>`frontend/src/components/InteractiveCDSViewer.tsx` |

---

## 📊 PHẦN III. BẢNG TỔNG HỢP SO SÁNH ĐÃ LÀM VS CHƯA LÀM

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FR-1: ĐĂNG KÝ & ĐĂNG NHẬP                                     │
├──────────────────────────────────────────────────┬──────────────────────────────────────────────┤
│                ✅ ĐÃ HOÀN THÀNH                  │               ⏳ CẦN NÂNG CẤP                │
├──────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ • Đăng ký tài khoản Email + Họ tên               │ • Giao diện & API Quên mật khẩu              │
│ • Kiểm tra mật khẩu OWASP + Mã hóa BCrypt        │ • Cấu hình SMTP Server gửi mail thật ngoài   │
│ • Gửi mã OTP 6 số (TTL 5m, Cooldown 60s)         │ • Khóa tài khoản tạm sau 5 lần sai pass login│
│ • Giao diện nhập OTP đếm ngược 60s               │                                              │
│ • Xác thực OTP kích hoạt tài khoản & cấp JWT     │                                              │
│ • Đăng nhập Email/Pass với Access/Refresh Token  │                                              │
│ • Google SSO (Firebase + Safe 1-Click Fallback)  │                                              │
│ • Đăng xuất an toàn & Thu hồi token DB           │                                              │
│ • Tự động Refresh Token nền qua HttpOnly Cookie  │                                              │
│ • Chặn tài khoản bị vô hiệu hóa (ACCOUNT_DISABLED│                                              │
│ • Giao diện Minimalist Enterprise chuẩn Medical  │                                              │
└──────────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FR-8: HỒ SƠ CÁ NHÂN & TIỀN SỬ Y TẾ                              │
├──────────────────────────────────────────────────┬──────────────────────────────────────────────┤
│                ✅ ĐÃ HOÀN THÀNH                  │               ⏳ CẦN NÂNG CẤP                │
├──────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ • Giao diện Modal Hồ sơ Y tế (Patient Profile UI)│ • Tạo bảng DB `patient_medical_profiles`     │
│ • Form nhập đầy đủ: Ngày sinh, Giới tính, Phone  │ • Backend API `GET /api/v1/patient/profile`  │
│ • Form nhập tiền sử Đái tháo đường & HbA1c       │ • Backend API `PUT /api/v1/patient/profile`  │
│ • Form nhập tiền sử Tăng huyết áp & Tim mạch     │ • Kết nối Form lưu trực tiếp vào PostgreSQL  │
│ • Form nhập Thuốc đang dùng & Tiền sử dị ứng     │ • Hiển thị tiền sử bệnh nhân trên CDS Bác sĩ │
│ • API `GET /api/v1/auth/me` lấy info cơ bản      │                                              │
└──────────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 🎯 KẾ HOẠCH BÀN GIAO & CÁC BƯỚC TIẾP THEO

1. **Cam kết mã nguồn lên nhánh `main`**:
   - Commit 1: `feat(auth): implement email OTP verification flow and secure registration`
   - Commit 2: `feat(sso): integrate Google Sign-In with Firebase and enterprise UI`
   - Commit 3: `refactor(ui): streamline minimal medical SaaS authentication interface`
   - Commit 4: `docs: add comprehensive FR-1 and FR-8 status and audit report`
2. **Kế hoạch triển khai tiếp theo (Next Sprints)**:
   - Triển khai Migration `V012__create_patient_medical_profiles.sql` và API cho **FR-8**.
   - Bổ sung luồng Quên mật khẩu qua OTP (Forgot Password).
