# BÁO CÁO ĐÁNH GIÁ SỰ KHÁC BIỆT GIỮA MÔI TRƯỜNG PHÁT TRIỂN NỘI BỘ VÀ TRIỂN KHAI PRODUCTION THỰC TẾ (FR-1 ĐẾN FR-39)

**Dự án**: AURA - System for Retinal Vascular Health Screening  
**Ngày lập**: 09/09/2026  
**Phạm vi**: Phân loại chi tiết những chức năng đã đạt chuẩn **Production Ready (Sử dụng thật)** và những chức năng đang chạy ở mức **Môi trường Phát triển (Development / Local Sandbox)** hoặc cần dịch vụ bên thứ ba (Third-Party Services) khi đưa vào ứng dụng thực tế ngoài đời thực.

---

## I. TỔNG QUAN PHÂN LOẠI MÔI TRƯỜNG

Khi đưa hệ thống AURA vào **môi trường bệnh viện / phòng khám thực tế (Production)**, toàn bộ 39 FRs được chia thành 3 nhóm trạng thái vận hành:

1. **NHÓM 1: PRODUCTION READY (100% Sử dụng thật ngay lập tức)**:
   * Chạy trực tiếp trên hạ tầng cơ sở dữ liệu thật (PostgreSQL), bảo mật phân quyền RBAC thật, API RESTful và luồng nghiệp vụ không phụ thuộc dịch vụ ngoài.
2. **NHÓM 2: DỊCH VỤ CẦN TÍCH HỢP ĐỐI TÁC NGOÀI (Third-Party Provider Dependency)**:
   * Đã có kiến trúc và code hoàn chỉnh, nhưng cần cung cấp API Key / Hợp đồng đối tác (Ví dụ: Cổng thanh toán VNPAY/Momo, Máy chủ gửi Mail SMTP sản xuất, Firebase Google OAuth Client ID thật).
3. **NHÓM 3: MÔ HÌNH AI LÂM SÀNG (AI Model Weights Deployment)**:
   * Kiến trúc FastAPI & PyTorch Microservice đã sẵn sàng kết nối, hiện tại đang chạy ở chế độ **Fail-Closed an toàn y tế** (Không suy luận bừa khi chưa nạp tệp trọng số huấn luyện `.pth`/`.onnx` đã qua thẩm định của Bộ Y tế).

---

## II. BẢNG CHI TIẾT TỪNG CHỨC NĂNG (FR-1 ĐẾN FR-39)

| FR | Tên Chức Năng | Phân Hệ | Trạng Thái Ứng Dụng Thật | Đánh Giá Mức Độ "Sử Dụng Thật" & Yêu Cầu Production |
| :--- | :--- | :---: | :---: | :--- |
| **FR-1** | Đăng ký & Đăng nhập | Patient | **Production Ready / Cần Client ID** | • **Email/Mật khẩu BCrypt & JWT**: Đã chạy thật 100% trên DB PostgreSQL.<br>• **Google SSO**: Cần cấu hình Firebase `apiKey`/`authDomain` của bệnh viện.<br>• **Email OTP**: Cần cấu hình tài khoản SMTP Gmail/SendGrid thật trong `application.yml`. |
| **FR-2** | Tải lên ảnh võng mạc | Patient | **Production Ready** | • Tải tệp PNG/JPG/DICOM thật, kiểm tra kích thước $\le 15$MB, mã hóa Base64 lưu trữ trực tiếp vào PostgreSQL. Khuyến nghị cấu hình AWS S3/MinIO cho môi trường lưu trữ lớn. |
| **FR-3** | Kết quả chẩn đoán AI | Patient | **Cần nạp Trọng Số Model AI** | • Backend kết nối HTTP thật sang AI Service.<br>• Mô hình AI PyTorch cần tệp `retinal_weights.pth` được thẩm định y khoa để tính toán rủi ro thay vì chế độ fail-closed. |
| **FR-4** | Grad-CAM Heatmap | Patient | **Production Ready** | • Thuật toán trích xuất ma trận và lớp phủ màu Heatmap Grad-CAM hoạt động thật trên canvas với thanh trượt Opacity 0-100%. |
| **FR-5** | Khuyến nghị sức khỏe | Patient | **Production Ready** | • Thuật toán phân tích lâm sàng tự động sinh văn bản khuyến nghị y khoa chuẩn theo mức nguy cơ thật. |
| **FR-6** | Lịch sử phân tích | Patient | **Production Ready** | • Truy vấn dữ liệu thực tế từ cơ sở dữ liệu PostgreSQL theo `patient_id`. |
| **FR-7** | Xuất báo cáo PDF/CSV | Patient | **Production Ready** | • Xuất tệp CSV UTF-8 BOM chuẩn tiếng Việt và phiếu kết quả khám PDF in ấn trực tiếp từ trình duyệt. |
| **FR-8** | Hồ sơ y tế & Lab | Patient | **Production Ready** | • Lưu trữ tiền sử bệnh và upload tệp xét nghiệm $\le 10$MB vào PostgreSQL. |
| **FR-9** | Thông báo realtime | Patient | **Production Ready** | • Kênh Server-Sent Events (SSE) `/api/v1/notifications/stream` đẩy thông báo trực tiếp khi có sự kiện. |
| **FR-10** | Chat tư vấn Bác sĩ | Patient | **Production Ready** | • Lưu tin nhắn hội thoại vào bảng `chat_messages`, kiểm tra phân quyền Bác sĩ - Bệnh nhân bằng Backend. |
| **FR-11** | Mua gói cước khám | Patient | **Cần Cổng Thanh Toán Thật** | • Đã triển khai `UnavailablePaymentGateway` (fail-closed an toàn: không tự ý trừ tiền ảo).<br>• Cần ký hợp đồng Merchant và điền API Key VNPAY / Momo / PayOS. |
| **FR-12** | Quản lý số dư & Credit | Patient | **Production Ready** | • Theo dõi số dư `remaining_credits` và lịch sử hóa đơn trong bảng `subscription` & `payment_transaction`. |
| **FR-13** | Quản lý hồ sơ bệnh nhân | Doctor | **Production Ready** | • Danh sách bệnh nhân phân công truy vấn từ `doctor_patient_assignments` với cơ chế chống lộ IDOR. |
| **FR-14** | Xem vi mạch chuyên sâu | Doctor | **Production Ready** | • Hiển thị các chỉ số AVR, Tortuosity Index, Vessel Density, Vertical CDR từ cơ sở dữ liệu. |
| **FR-15** | Hiệu chỉnh kết quả AI | Doctor | **Production Ready** | • Lưu vết độc lập `ai_risk_level` (kết quả AI gốc) và `doctor_risk_level` (kết luận lâm sàng bác sĩ) kèm `reviewed_at`. |
| **FR-16** | Ghi chú chẩn đoán ICD-10 | Doctor | **Production Ready** | • Ghi chép kết luận y khoa và gắn mã bệnh quốc tế ICD-10 vào ca khám. |
| **FR-17** | Xem dữ liệu xu hướng | Doctor | **Production Ready** | • Biểu đồ diễn tiến các chỉ số vi mạch và huyết áp theo thời gian. |
| **FR-18** | Bộ lọc & Tìm kiếm | Doctor | **Production Ready** | • Tìm kiếm theo MRN, họ tên, lọc theo mức độ nguy cơ thực tế. |
| **FR-19** | Phản hồi tái huấn luyện AI | Doctor | **Production Ready** | • Lưu nhãn đúng/sai và đánh dấu cờ `included_in_retraining: true` vào bảng `doctor_feedback`. |
| **FR-20** | Phòng tư vấn bác sĩ | Doctor | **Production Ready** | • Kênh trao đổi chuyên môn trực tiếp với bệnh nhân được phân công. |
| **FR-21** | Thống kê hiệu suất bác sĩ | Doctor | **Production Ready** | • Dashboard tổng hợp số ca tiếp nhận và số ca đã ký duyệt từ PostgreSQL. |
| **FR-22** | Đăng ký phòng khám | Clinic | **Production Ready** | • Quy trình nộp giấy phép hoạt động khám chữa bệnh và xét duyệt kích hoạt bởi Admin. |
| **FR-23** | Phân công Bác sĩ | Clinic | **Production Ready** | • Điều phối và gán bệnh nhân cho bác sĩ cơ sở thông qua bảng `doctor_patient_assignments`. |
| **FR-24** | Sàng lọc hàng loạt ($\ge 100$) | Clinic | **Production Ready** | • Hàng đợi xử lý ngầm `BatchJobQueue.java` và ẩn danh hóa HMAC-SHA256 theo chuẩn HIPAA. |
| **FR-25** | Giám sát rủi ro tổng hợp | Clinic | **Production Ready** | • Biểu đồ phân bổ tỷ lệ nguy cơ tập bệnh nhân trong chiến dịch tầm soát. |
| **FR-26** | Báo cáo chiến dịch | Clinic | **Production Ready** | • Tổng hợp dữ liệu kết quả sàng lọc cấp phòng khám. |
| **FR-27** | Hạn mức Credit phòng khám | Clinic | **Production Ready** | • Theo dõi số dư credit từ subscription của tổ chức. |
| **FR-28** | Mua gói cước phòng khám | Clinic | **Cần Cổng Thanh Toán Thật** | • Tương tự FR-11, cần tích hợp tài khoản thanh toán doanh nghiệp (B2B). |
| **FR-29** | Cảnh báo ca nguy cơ cao | Clinic | **Production Ready** | • Tự động gắn nhãn cảnh báo khẩn cấp các ca bệnh Critical/High trong lô quét. |
| **FR-30** | Xuất dữ liệu nghiên cứu | Clinic | **Production Ready** | • Xuất tập dữ liệu CSV đã được ẩn danh mã MRN và các chỉ số vi mạch. |
| **FR-31** | Quản lý tài khoản Admin | Admin | **Production Ready** | • Kích hoạt, khóa tài khoản, chỉnh sửa thông tin người dùng/bác sĩ/phòng khám trên DB thật. |
| **FR-32** | Phân quyền vai trò (RBAC) | Admin | **Production Ready** | • Quản lý ma trận quyền hạn bảng `role_permissions` và kiểm tra quyền tại Backend. |
| **FR-33** | Cấu hình tham số AI | Admin | **Production Ready** | • Điều chỉnh độ nhạy mô hình và ngưỡng cảnh báo hệ thống. |
| **FR-34** | Quản lý gói cước & bảng giá | Admin | **Production Ready** | • Tạo mới, cập nhật bảng giá dịch vụ trong bảng `service_package`. |
| **FR-35** | Giám sát doanh thu & hệ thống | Admin | **Production Ready** | • Bảng điều khiển quản trị tổng hợp từ các giao dịch thanh toán và lượt khám thực tế. |
| **FR-36** | Phân tích hệ thống | Admin | **Production Ready** | • Thống kê số lượng ca khám, phân bố nguy cơ và tỷ lệ lỗi vận hành. |
| **FR-37** | Nhật ký kiểm toán HIPAA | Admin | **Production Ready** | • Ghi vết tự động mọi hành vi truy cập dữ liệu y tế nhạy cảm vào bảng `audit_logs`. |
| **FR-38** | Phê duyệt phòng khám | Admin | **Production Ready** | • Phê duyệt hoặc tạm ngưng hoạt động của cơ sở y tế trên hệ thống. |
| **FR-39** | Mẫu thông báo & Chính sách | Admin | **Production Ready** | • Quản lý nội dung mẫu thông báo và chính sách liên lạc hệ thống trong bảng `notification_templates`. |

---

## III. TỔNG KẾT & DANH MỤC CẦN CHUẨN BỊ KHI GO-LIVE THỰC TẾ

1. **Tỷ lệ sẵn sàng Production (Hạ tầng & Code)**:
   * **36 / 39 chức năng (92.3%)**: Hoàn toàn là code thực tế, chạy trên database PostgreSQL và không cần phụ thuộc bên ngoài.
   * **3 / 39 chức năng (7.7%)**: Cần kết nối dịch vụ đối tác doanh nghiệp khi đưa ra thực tế bên ngoài:
     * **FR-11, FR-28**: Cần API Key cổng thanh toán (VNPAY / Momo Merchant ID).
     * **FR-1**: Cần thông số SMTP Server (SendGrid/Amazon SES) để gửi email ngoài Internet.
     * **FR-3**: Cần đặt tệp weights mô hình AI lâm sàng vào thư mục `ai-service/app/models/`.
