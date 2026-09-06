# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)
## HỆ THỐNG SÀNG LỌC SỨC KHỎE MẠCH MÁU VÕNG MẠC (AURA)

*Mã tài liệu: `AURA-SRS-02`*  
*Chuẩn cấu trúc: IEEE Std 830-1998*  
*Căn cứ đề bài: `DEBAI.pdf` (Mục 2 & 3)*  

---

## 1. GIỚI THIỆU TỔNG QUAN (INTRODUCTION)

### 1.1. Mục đích tài liệu
Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này xác định toàn bộ các yêu cầu chức năng (39 FRs), yêu cầu phi chức năng (23 NFRs), ràng buộc thiết kế và giao diện ngoại vi cho hệ thống **AURA**. Tài liệu đóng vai trò làm cơ sở để thẩm định, nghiệm thu đồ án trước Hội đồng chấm thi.

### 1.2. Phạm vi hệ thống (System Scope)
Hệ thống AURA là một giải pháp y tế số bao gồm:
- **Client Frontend**: Nền tảng Web Single Page Application (React 18 + TypeScript + TailwindCSS) đa phân hệ.
- **Application Backend**: Dịch vụ lõi xử lý nghiệp vụ, bảo mật, thanh toán và hàng đợi (Spring Boot 3.4 + Java 21).
- **AI Core Microservice**: Máy chủ suy luận học sâu đa nhiệm (Python FastAPI + PyTorch + OpenCV).
- **Database Layer**: Cơ sở dữ liệu quan hệ PostgreSQL với cơ chế tự động migration qua Flyway.

---

## 2. ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### 2.1. Phân hệ Bệnh nhân (User/Patient - FR-1 đến FR-12)
- **`FR-1` [Đăng ký & Đăng nhập]**: Hệ thống phải cung cấp xác thực người dùng bằng Email/Mật khẩu an toàn với BCrypt, hỗ trợ OAuth2 Social login.
- **`FR-2` [Tải ảnh võng mạc]**: Cho phép người dùng tải lên ảnh chụp đáy mắt (Fundus Camera) hoặc ảnh chụp cắt lớp võng mạc (OCT) theo các định dạng PNG, JPG, JPEG, TIFF.
- **`FR-3` [Xem kết quả chẩn đoán]**: Hiển thị kết quả đánh giá nguy cơ tổng thể (Overall Risk Score) và chi tiết 4 phân nhóm: Tim mạch (CVD), Đột quỵ (Stroke), Tăng huyết áp (Hypertension), Bệnh võng mạc (Retinopathy).
- **`FR-4` [Trực quan hóa Grad-CAM]**: Hiển thị bản đồ nhiệt (Heatmap) đè lên ảnh gốc với thanh trượt chỉnh độ mờ (Opacity 0% - 100%) và công cụ zoom chi tiết.
- **`FR-5` [Khuyến nghị sức khỏe tự động]**: Tự động sinh danh mục cảnh báo và lời khuyên y tế dựa trên mức độ rủi ro tính toán được.
- **`FR-6` [Lịch sử cá nhân]**: Lưu trữ và cho phép tra cứu toàn bộ các lần khám trước đó kèm bảng theo dõi chỉ số.
- **`FR-7` [Xuất báo cáo PDF/CSV]**: Cho phép tải phiếu kết quả khám định dạng PDF chuẩn y tế có chữ ký điện tử hoặc xuất tệp CSV.
- **`FR-8` [Quản lý hồ sơ y tế]**: Quản lý thông tin cá nhân, tiền sử bệnh án (đái tháo đường, huyết áp), tuổi và giới tính.
- **`FR-9` [Trung tâm thông báo]**: Gửi thông báo trên giao diện khi ca phân tích AI hoàn thành hoặc có tin nhắn mới từ bác sĩ.
- **`FR-10` [Chat tư vấn in-app]**: Khởi tạo phiên trò chuyện trực tuyến và gửi hình ảnh, kết quả khám đến Bác sĩ được chỉ định.
- **`FR-11` [Mua gói cước & Credit]**: Chọn và thanh toán gói dịch vụ phân tích cá nhân qua cổng thanh toán mô phỏng/QR Code.
- **`FR-12` [Quản lý số dư & Giao dịch]**: Xem số lượt phân tích (Credit) còn lại và lịch sử các hóa đơn giao dịch.

### 2.2. Phân hệ Bác sĩ (Doctor - FR-13 đến FR-21)
- **`FR-13` [Quản lý hồ sơ bệnh nhân]**: Truy cập và quản lý danh sách bệnh nhân được phân công tiếp nhận.
- **`FR-14` [Xem kết quả phân tích chuyên sâu]**: Xem các chỉ số hình thái học vi mạch: Tỷ lệ động/tĩnh mạch (AVR), độ xoắn vặn mạch máu (Tortuosity), hiện tượng bắt chéo động-tĩnh mạch (AV Nicking).
- **`FR-15` [Xác nhận & Hiệu chỉnh kết quả AI]**: Bác sĩ có quyền phê duyệt, hạ cấp hoặc nâng cấp mức độ nguy cơ do AI đề xuất.
- **`FR-16` [Nhập ghi chú lâm sàng & Ký số]**: Ghi chép kết luận y khoa, chẩn đoán phân biệt và khuyến nghị điều trị.
- **`FR-17` [Xem dữ liệu xu hướng]**: Biểu đồ hóa sự thay đổi các chỉ số vi mạch của bệnh nhân qua các mốc thời gian khám.
- **`FR-18` [Bộ lọc & Tìm kiếm nâng cao]**: Lọc bệnh nhân theo mã định danh (Patient ID), họ tên, khoảng ngày khám, hoặc mức độ nguy cơ (Cao/Báo động).
- **`FR-19` [Phản hồi tái huấn luyện AI]**: Gửi mẫu nhãn hiệu chỉnh kèm chú thích vùng tổn thương về kho dữ liệu tái huấn luyện mô hình (Model Retraining).
- **`FR-20` [Phòng tư vấn trực tuyến]**: Tiếp nhận và phản hồi câu hỏi của bệnh nhân qua giao diện chat chuyên dụng.
- **`FR-21` [Thống kê hiệu suất]**: Báo cáo tổng số ca đã thẩm định, độ tương đồng chẩn đoán giữa Bác sĩ và AI (Inter-observer Agreement).

### 2.3. Phân hệ Phòng khám (Clinic - FR-22 đến FR-30)
- **`FR-22` [Đăng ký tài khoản tổ chức]**: Quy trình đăng ký và nộp hồ sơ xác thực pháp nhân phòng khám.
- **`FR-23` [Quản lý Bác sĩ & Bệnh nhân]**: Gán quyền bác sĩ vào cơ sở, phân công bệnh nhân cho từng bác sĩ trực thuộc.
- **`FR-24` [Tải lên hàng loạt ảnh ($\ge 100$ ảnh)]**: Tiếp nhận thư mục ảnh chụp chiến dịch tầm soát, tự động đưa vào hàng đợi xử lý ngầm (Bulk Processing Queue).
- **`FR-25` [Giám sát rủi ro tổng hợp]**: Biểu đồ phân bổ tỷ lệ nguy cơ của toàn bộ tập bệnh nhân trong chiến dịch.
- **`FR-26` [Tạo báo cáo chiến dịch]**: Tổng hợp và xuất báo cáo tổng kết chiến dịch tầm soát quy mô phòng khám.
- **`FR-27` [Theo dõi hạn mức Credit]**: Thanh giám sát dung lượng credit đã sử dụng và còn lại của tài khoản tổ chức.
- **`FR-28` [Mua gói cước cấp phòng khám]**: Mua các gói dung lượng lớn (Gói 100, 500, 1000 lượt phân tích).
- **`FR-29` [Cảnh báo bệnh nhân nguy cơ cao]**: Banner cảnh báo khẩn cấp khi phát hiện ca bệnh có tổn thương mạch máu nghiêm trọng.
- **`FR-30` [Xuất dữ liệu nghiên cứu CSV]**: Xuất tập dữ liệu ẩn danh kèm các chỉ số vi mạch phục vụ nghiên cứu lâm sàng.

### 2.4. Phân hệ Quản trị viên (Admin - FR-31 đến FR-39)
- **`FR-31` [Quản trị tài khoản toàn hệ thống]**: Kích hoạt, vô hiệu hóa, chỉnh sửa thông tin người dùng, bác sĩ, phòng khám.
- **`FR-32` [Quản trị vai trò & Phân quyền RBAC]**: Thiết lập vai trò (ROLE_USER, ROLE_DOCTOR, ROLE_CLINIC, ROLE_ADMIN).
- **`FR-33` [Cấu hình tham số mô hình AI]**: Điều chỉnh ngưỡng phát hiện rủi ro (Sensitivity, Specificity, AVR threshold) linh hoạt qua API.
- **`FR-34` [Quản lý bảng giá & Gói dịch vụ]**: Thêm mới, cập nhật giá cước, số lượt credit và thời hạn sử dụng gói cước.
- **`FR-35` [Dashboard Quản trị Tổng quan]**: Giám sát doanh thu, số lượt quét ảnh, biểu đồ phân tích thời gian thực.
- **`FR-36` [Phân tích lỗi hệ thống]**: Báo cáo tỷ lệ lỗi xử lý ảnh, thời gian phản hồi trung bình của máy chủ AI.
- **`FR-37` [Kiểm toán bảo mật & Nhật ký Audit]**: Ghi nhận toàn bộ thao tác truy cập dữ liệu y tế (PHI) theo chuẩn HIPAA, hỗ trợ xuất log.
- **`FR-38` [Phê duyệt / Tạm ngưng phòng khám]**: Xem xét hồ sơ và bấm duyệt hoặc tạm khóa tài khoản phòng khám.
- **`FR-39` [Quản lý mẫu thông báo]**: Cấu hình mẫu email thông báo và chính sách cảnh báo người dùng.

---

## 3. ĐẶC TẢ YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 3.1. Hiệu năng (Performance - NFR-1 đến NFR-3)
- **`NFR-1`**: Thời gian suy luận AI cho 1 ảnh đơn lẻ phải hoàn thành trong **$\le 10 - 20$ giây** (Thực tế FastAPI đạt $< 3$ giây).
- **`NFR-2`**: Hệ thống phải hỗ trợ xử lý hàng loạt **$\ge 100$ ảnh mỗi lô** qua cơ chế hàng đợi bất đồng bộ (Asynchronous Queue).
- **`NFR-3`**: Thời gian phản hồi và tải trang Dashboard dưới điều kiện mạng tiêu chuẩn phải **$< 3$ giây**.

### 3.2. Độ tin cậy & Tính sẵn sàng (Reliability - NFR-4 đến NFR-6)
- **`NFR-4`**: Tính sẵn sàng của hệ thống đạt **$\ge 99\%$** thời gian hoạt động.
- **`NFR-5`**: AI Engine phải có cơ chế xử lý lỗi êm dịu (Graceful Failure), trả về mã lỗi rõ ràng và bảo toàn ảnh gốc khi lỗi.
- **`NFR-6`**: Dữ liệu CSDL PostgreSQL được cấu hình tự động sao lưu định kỳ tối thiểu 1 lần/ngày.

### 3.3. Khả năng mở rộng (Scalability - NFR-7 đến NFR-8)
- **`NFR-7`**: Kiến trúc hỗ trợ mở rộng quy mô theo chiều ngang (Horizontal Scaling) cho cụm AI Microservice không trạng thái (Stateless).
- **`NFR-8`**: Đáp ứng đồng thời nhiều tổ chức phòng khám và hàng ngàn người dùng mà không gây nghẽn cổ chai.

### 3.4. An toàn & Bảo mật thông tin (Security & Privacy - NFR-9 đến NFR-12)
- **`NFR-9`**: Dữ liệu đường truyền bắt buộc mã hóa qua giao thức TLS 1.2+ (HTTPS), mật khẩu băm chuẩn BCrypt (Cost 12).
- **`NFR-10`**: Tuân thủ hướng dẫn bảo vệ dữ liệu y tế nhạy cảm (HIPAA-compliant practices).
- **`NFR-11`**: Ẩn danh hóa thông tin định danh bệnh nhân (HMAC SHA-256) trước khi đưa vào kho dữ liệu AI Retraining.
- **`NFR-12`**: Kiểm soát truy cập phân quyền nghiêm ngặt dựa trên vai trò (Role-Based Access Control - RBAC).

### 3.5. Khả năng sử dụng & Trải nghiệm (Usability - NFR-13 đến NFR-15)
- **`NFR-13`**: Giao diện Web Responsive hoàn hảo trên Desktop, Tablet và Mobile.
- **`NFR-14`**: Bác sĩ/Bệnh nhân có thể tải ảnh và xem kết quả chẩn đoán trong vòng **không quá 3 lần nhấp chuột**.
- **`NFR-15`**: Kết quả trực quan hóa Grad-CAM và các chỉ số hình thái học mạch máu phải có chú thích lâm sàng rõ ràng.

### 3.6. Khả năng bảo trì & Kiến trúc (Maintainability - NFR-16 đến NFR-18)
- **`NFR-16`**: Cập nhật mô hình AI hoặc ngưỡng cảnh báo qua API mà không cần dừng hệ thống (Zero-downtime).
- **`NFR-17`**: Mã nguồn tổ chức theo kiến trúc phân tầng mô-đun (Clean Architecture / Microservices).
- **`NFR-18`**: Quản lý tập trung ghi log (Logging), kiểm toán (Auditing) và truy vết lỗi (Error Tracking).

### 3.7. Khả năng tương thích (Interoperability - NFR-19 đến NFR-21)
- **`NFR-19`**: Hỗ trợ tích hợp ảnh chụp từ các dòng máy Fundus phổ biến qua Cloud Upload.
- **`NFR-20`**: Hỗ trợ xuất dữ liệu ra các định dạng chuẩn PDF y tế và CSV.
- **`NFR-21`**: Giao tiếp giữa các thành phần hệ thống hoàn toàn qua RESTful API chuẩn OpenAPI 3.0.

### 3.8. Chất lượng & Khả năng giải thích của AI (Explainability - NFR-22 đến NFR-23)
- **`NFR-22`**: Kết quả dự đoán bắt buộc phải đính kèm bản đồ chú thích trực quan (Grad-CAM Explainable AI).
- **`NFR-23`**: Gắn kèm mã phiên bản mô hình (`model_version`) và ngưỡng tính toán trên từng phiếu kết quả để phục vụ truy xuất nguồn gốc.
