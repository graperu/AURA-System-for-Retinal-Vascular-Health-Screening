# DANH MỤC BẢO VỆ ĐỒ ÁN & CÂU HỎI HỘI ĐỒNG (VIVA DEFENSE CHECKLIST & QA PREPARATION)
## HỆ THỐNG SÀNG LỌC SỨC KHỎE MẠCH MÁU VÕNG MẠC (AURA)

*Căn cứ đề bài: `DEBAI.pdf` (Mục 1 đến Mục 5 - Lưu ý Hội đồng chấm thi)*  

---

## 1. DANH MỤC NGHIỆM THU 100% SẢN PHẨM BÀN GIAO (DELIVERABLES CHECKLIST)

- [x] **1. Mã nguồn hoàn chỉnh & Đóng gói triển khai**:
  - [x] `frontend/`: React 18 + TypeScript + Vite + TailwindCSS (4 phân hệ UI y tế).
  - [x] `backend/`: Java 21 + Spring Boot 3.4 + Spring Security JWT + Flyway Migrations (V001 $\rightarrow$ V010) + PostgreSQL.
  - [x] `ai-service/`: Python 3.10 + FastAPI + PyTorch + OpenCV (CLAHE, Grad-CAM).
  - [x] `docker-compose.yml`: Triển khai 4 container hoàn chỉnh (`postgres`, `backend`, `ai-service`, `frontend`).
- [x] **2. Trọn bộ 7 Tài liệu Đồ án theo chuẩn Quốc tế & UML 2.0**:
  - [x] `docs/01-requirements/user-requirements.md` (Tài liệu Yêu cầu Người dùng - ISO/IEC/IEEE 29148).
  - [x] `docs/01-requirements/software-requirements-specification.md` (Đặc tả SRS chuẩn IEEE Std 830-1998 bao phủ FR-1..39 & NFR-1..23).
  - [x] `docs/03-architecture/architecture-design-document.md` (Tài liệu Kiến trúc & **14 Sơ đồ UML 2.0 chuẩn Mermaid**).
  - [x] `docs/04-database/database-design-document.md` (Thiết kế CSDL quan hệ, Sơ đồ ERD & Từ điển dữ liệu Data Dictionary).
  - [x] `docs/05-api/api-specification-document.md` (Đặc tả RESTful API Swagger/OpenAPI 3.0 cho toàn hệ thống).
  - [x] `docs/07-testing/test-plan-and-test-cases.md` (Kế hoạch kiểm thử & Ma trận 40+ Test Cases bao phủ toàn diện).
  - [x] `docs/08-deployment/installation-and-user-manual.md` (Sổ tay cài đặt & Hướng dẫn sử dụng cho 4 vai trò).

---

## 2. KỊCH BẢN DEMO BẢO VỆ ĐỒ ÁN (VIVA DEMO WALKTHROUGH - 5 PHÚT)

1. **Phân hệ 1 - Bệnh nhân (Patient Portal)**:
   - Đăng nhập tài khoản bệnh nhân.
   - Tải lên ảnh chụp đáy mắt (Fundus Camera).
   - Xem kết quả phân tích AI: Thang điểm rủi ro Tim mạch, Đột quỵ, Tăng huyết áp.
   - Thao tác kéo thanh trượt **Độ mờ Heatmap Grad-CAM** (tương tác trực quan).
   - Mở cửa sổ **Xuất Báo Cáo Y Khoa (PDF)** có logo, mã QR và chữ ký bác sĩ.
   - Mở **Chat tư vấn** với bác sĩ chỉ định.
2. **Phân hệ 2 - Bác sĩ (Doctor CDS Dashboard)**:
   - Chuyển sang vai trò Bác sĩ.
   - Xem danh sách bệnh nhân và xu hướng chỉ số AVR lịch sử.
   - Sử dụng công cụ **Side-by-Side & Zoom** để soi kỹ vi mạch và hiện tượng AV Nicking.
   - Bấm **Thẩm định / Hiệu chỉnh chẩn đoán**, thêm ghi chú y khoa và ký duyệt.
   - Gửi phản hồi lỗi AI (Doctor Feedback) phục vụ tái huấn luyện mô hình.
3. **Phân hệ 3 - Phòng khám (Clinic Batch Portal)**:
   - Chuyển sang vai trò Phòng khám.
   - Kéo thả nộp lô **$\ge 100$ ảnh võng mạc** vào hàng đợi xử lý ngầm (Bulk Queue).
   - Quan sát thanh tiến độ xử lý và biểu đồ phân bổ nguy cơ của chiến dịch.
   - Xuất dữ liệu nghiên cứu **CSV**.
4. **Phân hệ 4 - Quản trị viên (Admin Console)**:
   - Quản lý tài khoản người dùng, duyệt phòng khám mới.
   - Điều chỉnh ngưỡng nhạy cảm chẩn đoán AI trực tuyến (Zero-downtime).
   - Tra cứu nhật ký kiểm toán an toàn y tế (**HIPAA Audit Logs**).

---

## 3. BỘ CÂU HỎI VÀ ĐÁP ÁN TRỌNG TÂM TRƯỚC HỘI ĐỒNG (FAQ)

### Câu 1: Hệ thống giải quyết bài toán gì trong thực tế y tế?
> **Trả lời**: AURA đóng vai trò là công cụ Hỗ trợ Quyết định Lâm sàng (CDS) không xâm lấn, sử dụng mạch máu võng mạc như một "cửa sổ" để sàng lọc sớm nguy cơ bệnh lý tim mạch, đột quỵ và biến chứng đái tháo đường, giúp giảm tải cho bệnh viện tuyến trên và mở rộng khả năng tiếp cận y tế dự phòng tại các trạm y tế, phòng khám cơ sở.

### Câu 2: Tính minh bạch và giải thích được (Explainable AI - XAI) được thực hiện như thế nào?
> **Trả lời**: Hệ thống không dùng mô hình "hộp đen" đơn thuần mà tích hợp thuật toán **Grad-CAM** trích xuất bản đồ kích hoạt gradient từ tầng tích chập cuối cùng (Layer 4) của mạng nơ-ron, tạo ra Heatmap trực quan hóa chính xác các vùng vi mạch bị tổn thương (hẹp động mạch, bắt chéo động-tĩnh mạch, vi phình mạch) để bác sĩ thẩm định.

### Câu 3: Hệ thống đảm bảo an toàn dữ liệu y tế (HIPAA / An ninh) ra sao?
> **Trả lời**: 
> 1. Mã hóa đường truyền bằng TLS 1.2+ và băm mật khẩu bằng BCrypt.
> 2. Phân quyền truy cập nghiêm ngặt dựa trên vai trò (RBAC) với cơ chế Stateless JWT và xoay vòng Refresh Token an toàn.
> 3. Tự động ẩn danh hóa mã định danh bệnh nhân bằng thuật toán HMAC SHA-256 trước khi đưa vào tập dữ liệu tái huấn luyện mô hình.
> 4. Ghi nhận toàn bộ nhật ký truy cập dữ liệu y tế nhạy cảm (PHI) vào bảng `audit_logs`.
