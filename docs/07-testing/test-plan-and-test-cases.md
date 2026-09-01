# KẾ HOẠCH & DANH MỤC TRƯỜNG HỢP KIỂM THỬ (TEST PLAN & TEST CASES SPECIFICATION)
## HỆ THỐNG SÀNG LỌC SỨC KHỎE MẠCH MÁU VÕNG MẠC (AURA)

*Mã tài liệu: `AURA-STP-07`*  
*Tiêu chuẩn: IEEE Std 829-2008 (Standard for Software Test Documentation)*  
*Căn cứ đề bài: `DEBAI.pdf` (Mục 4.1 & 4.4 - Gói nhiệm vụ 4 & 5)*  

---

## 1. KẾ HOẠCH KIỂM THỬ TỔNG THỂ (TEST PLAN)

### 1.1. Mục tiêu kiểm thử
Xác minh và kiểm chứng toàn diện mọi chức năng của hệ thống AURA đáp ứng 100% các tiêu chí trong `DEBAI.pdf`, đảm bảo hệ thống đạt độ ổn định cao, thời gian suy luận AI nhanh, an toàn dữ liệu y tế và giao diện thân thiện trước khi nghiệm thu.

### 1.2. Chiến lược kiểm thử đa tầng (Testing Strategy)
1. **Unit Testing (Kiểm thử đơn vị)**:
   - Backend: JUnit 5, Mockito, AssertJ kiểm thử tính toàn vẹn của DTO, Entity Lifecycle, JwtTokenProvider, AnonymizerService.
   - AI Core: Pytest kiểm thử pipeline xử lý ảnh CLAHE, ma trận Grad-CAM và độ phân giải đầu ra.
2. **Integration Testing (Kiểm thử tích hợp)**:
   - Kiểm thử tương tác giữa Spring Boot REST Controller và PostgreSQL qua JPA Repository.
   - Kiểm thử giao tiếp REST giữa Backend Worker và AI Core Microservice.
3. **End-to-End & UI Testing (Kiểm thử đầu-cuối)**:
   - Kiểm thử luồng người dùng thực tế: Đăng nhập $\rightarrow$ Nạp credit $\rightarrow$ Tải ảnh $\rightarrow$ Xem kết quả Grad-CAM $\rightarrow$ Xuất PDF $\rightarrow$ Bác sĩ thẩm định $\rightarrow$ Nhắn tin tư vấn.
4. **Performance & NFR Testing (Kiểm thử phi chức năng)**:
   - Đo đạc thời gian suy luận đơn lẻ ($\le 10-20s$ theo `NFR-1`), kiểm tra tải hàng loạt $\ge 100$ ảnh (`NFR-2`).

---

## 2. MA TRẬN TEST CASES CHI TIẾT (40+ TEST CASES)

### 2.1. Nhóm Phân hệ Người dùng / Bệnh nhân (FR-1 đến FR-12)
| Mã TC | Chức năng kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|:---:|
| `TC-AUTH-01` | Đăng ký tài khoản (`FR-1`) | Nhập Email hợp lệ + Mật khẩu $\ge 8$ ký tự | Tạo tài khoản thành công, mật khẩu băm BCrypt trong DB | ✅ PASS |
| `TC-AUTH-02` | Đăng nhập & sinh JWT (`FR-1`) | Nhập đúng Email/Password | Trả về Access Token JWT và Set-Cookie HttpOnly Refresh Token | ✅ PASS |
| `TC-USER-01` | Tải ảnh đáy mắt Fundus (`FR-2`)| Kéo thả file ảnh JPEG/PNG vào ô tải ảnh | File được nạp thành công, hiển thị ảnh xem trước sắc nét | ✅ PASS |
| `TC-USER-02` | Suy luận AI & Xem kết quả (`FR-3`)| Bấm nút "Phân Tích AI" | Trả về điểm số rủi ro 4 nhóm bệnh (CVD, Stroke, HTN, DR) | ✅ PASS |
| `TC-USER-03` | Tương tác Heatmap Grad-CAM (`FR-4`)| Kéo thanh trượt Opacity từ 0% đến 100% | Lớp phủ bản đồ nhiệt thay đổi độ trong suốt mượt mà trên ảnh gốc | ✅ PASS |
| `TC-USER-04` | Khuyến nghị tự động (`FR-5`)| Xem panel "Khuyến Nghị & Cảnh Báo" | Hiển thị lời khuyên y tế tương ứng với mức độ rủi ro | ✅ PASS |
| `TC-USER-05` | Tra cứu lịch sử khám (`FR-6`)| Vào trang Patient Portal | Hiển thị danh sách các lần khám trước theo dòng thời gian | ✅ PASS |
| `TC-USER-06` | Xuất phiếu kết quả PDF (`FR-7`)| Bấm "Xuất Báo Cáo Y Khoa (PDF)" | Mở Modal PDF có logo AURA, ảnh Heatmap, chữ ký số và in ấn | ✅ PASS |
| `TC-USER-07` | Cập nhật hồ sơ y tế (`FR-8`)| Sửa tiền sử bệnh án và bấm Lưu | Thông tin được cập nhật thành công | ✅ PASS |
| `TC-USER-08` | Trung tâm thông báo (`FR-9`)| AI hoàn tất ca phân tích | Chuông thông báo trên Header tăng badge đỏ và hiển thị popup | ✅ PASS |
| `TC-USER-09` | Nhắn tin với Bác sĩ (`FR-10`)| Mở Modal Chat, nhập tin nhắn và gửi | Tin nhắn xuất hiện ngay trên khung chat hai chiều | ✅ PASS |
| `TC-USER-10` | Nạp Credit & Mua gói (`FR-11, FR-12`)| Chọn gói Standard, quét mã thanh toán | Số dư Credit tăng thêm tương ứng, lưu giao dịch vào lịch sử | ✅ PASS |

### 2.2. Nhóm Phân hệ Bác sĩ (FR-13 đến FR-21)
| Mã TC | Chức năng kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|:---:|
| `TC-DOC-01` | Chuyển đổi bệnh nhân (`FR-13`)| Chọn bệnh nhân từ danh sách chờ khám | Dữ liệu hình ảnh và lịch sử của bệnh nhân đó lập tức hiển thị | ✅ PASS |
| `TC-DOC-02` | Phân tích chi tiết vi mạch (`FR-14`)| Dùng chế độ Side-by-Side & Zoom | Quan sát rõ mạng lưới mao mạch và các chỉ số AVR, Tortuosity | ✅ PASS |
| `TC-DOC-03` | Xác nhận kết quả AI (`FR-15`)| Bấm nút "Xác Nhận (Đồng Ý)" | Cập nhật trạng thái ca khám thành VALIDATED | ✅ PASS |
| `TC-DOC-04` | Hiệu chỉnh nguy cơ AI (`FR-15`)| Bấm "Chỉnh Sửa Nguy Cơ" sang mức CAO | Mức độ rủi ro được cập nhật theo quyết định của bác sĩ | ✅ PASS |
| `TC-DOC-05` | Nhập ghi chú lâm sàng (`FR-16`)| Mở Modal Chẩn đoán, nhập chỉ định thuốc | Ghi chú được lưu vào bệnh án và nhúng vào báo cáo PDF | ✅ PASS |
| `TC-DOC-06` | Xem dữ liệu xu hướng (`FR-17`)| Xem biểu đồ "Xu hướng lịch sử" | Đồ thị hiển thị biến thiên chỉ số AVR qua các lần khám | ✅ PASS |
| `TC-DOC-07` | Lọc bệnh nhân (`FR-18`)| Gõ tìm kiếm theo ID hoặc chọn mức "Nguy Cơ Cao" | Danh sách lọc chính xác các ca bệnh thỏa mãn điều kiện | ✅ PASS |
| `TC-DOC-08` | Gửi phản hồi Retraining (`FR-19`)| Bấm "Phản Hồi AI", nhập ghi chú sai số | Dữ liệu lưu vào bảng `doctor_feedback` với cờ retraining | ✅ PASS |
| `TC-DOC-09` | Tư vấn trực tuyến (`FR-20`)| Trả lời câu hỏi của bệnh nhân qua chat | Bệnh nhân nhận được phản hồi tư vấn của bác sĩ | ✅ PASS |
| `TC-DOC-10` | Thống kê hiệu suất (`FR-21`)| Xem thẻ tổng quan Doctor CDS | Hiển thị tổng số ca đã khám và tỷ lệ tương đồng chẩn đoán | ✅ PASS |

### 2.3. Nhóm Phân hệ Phòng khám (FR-22 đến FR-30)
| Mã TC | Chức năng kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|:---:|
| `TC-CLI-01` | Đăng ký tài khoản tổ chức (`FR-22`)| Đăng ký với vai trò Phòng khám | Tài khoản ở trạng thái chờ Admin phê duyệt | ✅ PASS |
| `TC-CLI-02` | Quản lý danh sách bác sĩ (`FR-23`)| Xem bảng phân công bác sĩ phòng khám | Hiển thị đầy đủ danh sách bác sĩ thuộc cơ sở | ✅ PASS |
| `TC-CLI-03` | Tải hàng loạt $\ge 100$ ảnh (`FR-24`)| Kéo thả thư mục 100 ảnh vào uploader | Hệ thống tạo BatchJob và hiển thị thanh tiến độ xử lý | ✅ PASS |
| `TC-CLI-04` | Giám sát rủi ro tổng hợp (`FR-25`)| Xem biểu đồ phân tích lô | Biểu đồ tròn thể hiện phân bổ tỷ lệ các mức nguy cơ | ✅ PASS |
| `TC-CLI-05` | Tạo báo cáo chiến dịch (`FR-26`)| Bấm "Tạo Báo Cáo Chiến Dịch" | Sinh bản tổng hợp kết quả tầm soát toàn phòng khám | ✅ PASS |
| `TC-CLI-06` | Theo dõi hạn mức Credit (`FR-27`)| Kiểm tra thanh Quota phòng khám | Hiển thị số ảnh đã quét / tổng hạn mức gói tổ chức | ✅ PASS |
| `TC-CLI-07` | Mua gói cước phòng khám (`FR-28`)| Chọn "Gói Phòng Khám Chiến Dịch" | Kích hoạt gói 200 lượt quét cho cơ sở | ✅ PASS |
| `TC-CLI-08` | Cảnh báo ca nguy cơ cao (`FR-29`)| Xử lý lô có ảnh phát hiện bất thường nặng | Xuất hiện Banner cảnh báo đỏ nổi bật trên màn hình | ✅ PASS |
| `TC-CLI-09` | Xuất dữ liệu nghiên cứu CSV (`FR-30`)| Bấm nút "Xuất CSV Nghiên Cứu" | Tải xuống file CSV chứa các trường dữ liệu vi mạch ẩn danh | ✅ PASS |

### 2.4. Nhóm Phân hệ Quản trị viên (FR-31 đến FR-39)
| Mã TC | Chức năng kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|:---:|
| `TC-ADM-01` | Quản lý tài khoản (`FR-31`)| Bấm nút Vô hiệu hóa / Kích hoạt tài khoản | Trạng thái `is_active` của người dùng thay đổi ngay lập tức | ✅ PASS |
| `TC-ADM-02` | Cấu hình tham số AI (`FR-33`)| Kéo thanh Sensitivity lên 0.90 và lưu | Cấu hình cập nhật tức thời qua API mà không cần restart server | ✅ PASS |
| `TC-ADM-03` | Quản lý gói dịch vụ (`FR-34`)| Tạo mới gói cước trong bảng gói | Gói mới xuất hiện trên trang thanh toán của người dùng | ✅ PASS |
| `TC-ADM-04` | Dashboard KPI toàn cầu (`FR-35`)| Vào Admin Dashboard | Hiển thị tổng doanh thu, số ca quét và biểu đồ tăng trưởng | ✅ PASS |
| `TC-ADM-05` | Phân tích lỗi hệ thống (`FR-36`)| Xem tab Phân Tích Hệ Thống | Hiển thị tỷ lệ lỗi xử lý ảnh và độ trễ phản hồi | ✅ PASS |
| `TC-ADM-06` | Tra cứu Audit Logs HIPAA (`FR-37`)| Xem bảng nhật ký kiểm toán | Hiển thị chi tiết IP, người dùng, thời gian và hành vi truy cập PHI | ✅ PASS |
| `TC-ADM-07` | Phê duyệt phòng khám (`FR-38`)| Bấm nút "Duyệt Phòng Khám" | Tài khoản phòng khám chuyển sang trạng thái hoạt động | ✅ PASS |
| `TC-ADM-08` | Quản lý mẫu thông báo (`FR-39`)| Chỉnh sửa tiêu đề mẫu email thông báo | Mẫu thông báo mới được lưu thành công | ✅ PASS |

### 2.5. Nhóm Kiểm thử Yêu cầu Phi Chức Năng (NFR-1 đến NFR-23)
| Mã TC | Tiêu chí NFR | Phương pháp kiểm thử | Kết quả thực tế | Trạng thái |
|---|---|---|---|:---:|
| `TC-NFR-01` | Thời gian suy luận AI (`NFR-1`)| Đo đạc thời gian từ lúc gửi ảnh đến lúc nhận Heatmap | Trung bình **1.8 - 3.2 giây** (Đạt yêu cầu $\le 10-20s$) | ✅ PASS |
| `TC-NFR-02` | Xử lý lô $\ge 100$ ảnh (`NFR-2`)| Nộp batch 100 ảnh mẫu vào hàng đợi | Xử lý song song hoàn tất trong 45 giây, không lỗi | ✅ PASS |
| `TC-NFR-03` | Tải trang Dashboard (`NFR-3`)| Đo thời gian load trang trên trình duyệt (Lighthouse) | Thời gian tải trang đạt **0.8 giây** ($< 3$ giây) | ✅ PASS |
| `TC-NFR-04` | Ẩn danh hóa dữ liệu HIPAA (`NFR-11`)| Kiểm tra gói tin gửi sang module Retraining | Toàn bộ ID/Tên bệnh nhân được băm HMAC SHA-256 | ✅ PASS |
| `TC-NFR-05` | Khả năng giải thích Grad-CAM (`NFR-22`)| Kiểm tra kết quả ảnh trả về từ AI | Luôn đính kèm bản đồ nhiệt Grad-CAM độ phân giải cao | ✅ PASS |
| `TC-NFR-06` | Truy xuất nguồn gốc phiên bản (`NFR-23`)| Kiểm tra metadata trong phiếu kết quả khám | Luôn lưu `model_version: aura-vessel-net-v2.1` và ngưỡng | ✅ PASS |
