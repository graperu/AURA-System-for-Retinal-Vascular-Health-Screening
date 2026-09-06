# TÀI LIỆU ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (REST API SPECIFICATION)
## HỆ THỐNG SÀNG LỌC SỨC KHỎE MẠCH MÁU VÕNG MẠC (AURA)

*Mã tài liệu: `AURA-API-05`*  
*Tiêu chuẩn: OpenAPI 3.0 / Swagger Specification*  
*Căn cứ đề bài: `DEBAI.pdf` (Mục 2, 3.7 & 4.3)*  

---

## 1. QUY ƯỚC CHUNG (API CONVENTIONS)

- **Base URL Backend**: `http://localhost:8081` (hoặc `https://api.aura-screening.vn`)
- **Base URL AI Service**: `http://localhost:8000`
- **Định dạng dữ liệu**: `application/json` (UTF-8) hoặc `multipart/form-data` khi tải ảnh.
- **Xác thực bảo mật**: Bearer Token (JWT Header: `Authorization: Bearer <JWT_ACCESS_TOKEN>`).
- **Cấu trúc phản hồi chuẩn (ApiResponse Envelope)**:
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-08-31T10:30:00Z"
}
```

---

## 2. DANH MỤC CÁC ĐIỂM CUỐI (API ENDPOINTS CATALOG)

### 2.1. Phân hệ Xác thực & Tài khoản (Authentication API)
| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản người dùng mới (`FR-1`) |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập lấy JWT Access Token và Refresh Cookie |
| `POST` | `/api/v1/auth/refresh` | Cookie | Luân chuyển Refresh Token lấy Access Token mới |
| `POST` | `/api/v1/auth/logout` | Authenticated | Đăng xuất và thu hồi Refresh Token hiện tại |
| `GET` | `/api/v1/auth/me` | Authenticated | Lấy thông tin tài khoản và vai trò đang đăng nhập |

### 2.2. Phân hệ Sàng lọc & Chẩn đoán Lâm sàng (Screening API)
| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/screenings` | User/Doctor | Tạo ca khám và gửi ảnh võng mạc phân tích AI (`FR-2, FR-3`) |
| `GET` | `/api/v1/screenings` | Authenticated | Lấy danh sách ca khám của người dùng hiện tại |
| `GET` | `/api/v1/screenings/{id}` | Authenticated | Xem chi tiết ca khám, Grad-CAM heatmap và chỉ số vi mạch (`FR-4`) |
| `PUT` | `/api/v1/screenings/{id}/review`| Doctor/Admin | Bác sĩ thẩm định, ghi chép lâm sàng và ký số (`FR-15, FR-16`) |

### 2.3. Phân hệ Xử lý Hàng loạt Phòng khám (Bulk Screening API - $\ge 100$ ảnh)
| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/bulk-screenings/upload`| Clinic/Admin | Nộp lô $\ge 100$ ảnh vào hàng đợi bất đồng bộ (`FR-24, NFR-2`) |
| `GET` | `/api/v1/bulk-screenings/jobs/{id}`| Clinic/Admin| Kiểm tra tiến độ và kết quả phân tích theo lô |
| `GET` | `/api/v1/bulk-screenings/campaigns`| Clinic/Admin| Xem báo cáo tổng kết chiến dịch tầm soát (`FR-26`) |

### 2.4. Phân hệ Gói cước & Thanh toán (Billing & Subscription API)
| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/service-packages` | Public | Xem danh sách các gói cước cá nhân và phòng khám |
| `POST` | `/api/v1/billing/subscribe/{packageId}`| Authenticated| Khởi tạo giao dịch mua gói cước (`FR-11, FR-28`) |
| `GET` | `/api/v1/billing/subscription` | Authenticated| Xem gói cước đang kích hoạt và số credit còn lại (`FR-12, FR-27`) |
| `GET` | `/api/v1/billing/transactions` | Authenticated| Xem lịch sử các hóa đơn thanh toán |

### 2.5. Phân hệ Tư vấn Trực tuyến (In-App Chat API - FR-10, FR-20)
| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/chat/messages` | Authenticated | Gửi tin nhắn tư vấn (kèm file/ảnh khám) |
| `GET` | `/api/v1/chat/conversation/{userId}`| Authenticated| Lấy toàn bộ lịch sử trò chuyện giữa 2 người dùng |
| `GET` | `/api/v1/chat/screening/{screeningId}`| Authenticated| Lấy tin nhắn liên quan trực tiếp đến ca khám |
| `PUT` | `/api/v1/chat/read/{senderId}` | Authenticated | Đánh dấu các tin nhắn đã đọc |

### 2.6. Phân hệ Đánh giá & Tái Huấn Luyện AI (Doctor Feedback API - FR-19)
| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/doctor/feedback` | Doctor/Admin | Gửi phản hồi hiệu chỉnh kết quả AI phục vụ Retraining |
| `GET` | `/api/v1/doctor/feedback` | Doctor/Admin | Lấy danh sách phản hồi của bác sĩ hiện tại |
| `GET` | `/api/v1/doctor/feedback/screening/{id}`| Doctor/Admin| Lấy phản hồi của ca khám cụ thể |

### 2.7. Phân hệ Quản trị Hệ thống (Admin Console API - FR-31 đến FR-39)
| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | Admin | Quản lý danh sách toàn bộ tài khoản (`FR-31`) |
| `PUT` | `/api/v1/admin/users/{id}/status`| Admin | Khóa hoặc mở khóa tài khoản |
| `PUT` | `/api/v1/admin/clinics/{id}/approve`| Admin| Phê duyệt hồ sơ đăng ký của phòng khám (`FR-38`) |
| `PUT` | `/api/v1/admin/clinics/{id}/suspend`| Admin| Tạm đình chỉ tài khoản phòng khám |
| `GET` | `/api/v1/admin/ai-config` | Admin | Xem cấu hình ngưỡng và mô hình AI (`FR-33`) |
| `PUT` | `/api/v1/admin/ai-config` | Admin | Cập nhật tham số AI trực tuyến (Zero-downtime) |
| `GET` | `/api/v1/admin/audit-logs` | Admin | Tra cứu nhật ký kiểm toán bảo mật HIPAA (`FR-37`) |
| `GET` | `/api/v1/admin/audit-logs/export`| Admin | Xuất file log kiểm toán |

### 2.8. AI Core Microservice API (Python FastAPI - Cổng 8000)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/health` | Kiểm tra sức khỏe máy chủ AI (GPU/CPU, Models) |
| `GET` | `/api/v1/model-info` | Lấy siêu dữ liệu mô hình, phiên bản và ngưỡng chỉ số y khoa (`NFR-23`) |
| `POST` | `/api/v1/predict` | Tiếp nhận chuỗi ảnh base64, trả về nguy cơ và Grad-CAM base64 |
| `POST` | `/api/v1/predict/upload` | Tiếp nhận file ảnh trực tiếp (Multipart) |
| `POST` | `/api/v1/predict/bulk` | Xử lý lô danh sách ảnh nhanh phục vụ Bulk Queue |
