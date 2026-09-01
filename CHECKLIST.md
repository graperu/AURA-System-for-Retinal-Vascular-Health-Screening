Bạn hãy thực hiện một cuộc KIỂM TRA TOÀN DIỆN dự án AURA hiện tại.

Mục tiêu của lần làm việc này là xác định chính xác chức năng nào:

1. Đã hoạt động đầy đủ.
2. Chỉ có giao diện nhưng chưa hoạt động.
3. Hoạt động một phần.
4. Đang dùng dữ liệu giả/mock.
5. Bị lỗi.
6. Chưa được triển khai.

Không được nhìn giao diện rồi tự kết luận chức năng đã hoàn thành. Mọi kết luận “PASS” phải có bằng chứng chạy thực tế.

# I. QUY TẮC BẮT BUỘC

1. Trước tiên chỉ kiểm tra và báo cáo. Không tự ý sửa code khi chưa hoàn thành báo cáo kiểm tra ban đầu.
2. Phải đọc toàn bộ source code Frontend, Backend, AI Core, database migration, file cấu hình và tài liệu API.
3. Phải chạy dự án trong môi trường thực tế.
4. Phải kiểm tra lỗi build, lỗi TypeScript, lỗi console, lỗi network và lỗi Backend.
5. Phải kiểm tra từng role:

   * User/Patient
   * Doctor
   * Clinic
   * Admin
6. Phải kiểm tra phân quyền bằng Backend, không chỉ kiểm tra việc ẩn nút trên Frontend.
7. Mỗi chức năng được đánh PASS phải có:

   * File code liên quan.
   * API được gọi.
   * Request mẫu.
   * Response thực tế.
   * Database thay đổi thế nào.
   * Cách tái hiện kiểm thử.
8. Nếu chức năng dùng mock data, hard-code, setTimeout hoặc dữ liệu mẫu thì không được đánh PASS.
9. Nếu nút bấm có giao diện nhưng:

   * Không có sự kiện.
   * Không gọi API.
   * Chỉ hiện toast.
   * Chỉ chuyển trang.
   * Chỉ thay đổi state tạm thời.
   * Reload trang là mất dữ liệu.

   thì phải đánh “UI ONLY”, không được đánh “PASS”.
10. Không được tự tạo kết quả kiểm thử giả hoặc nói chung chung như “hoạt động tốt”.
11. Không được bỏ qua chức năng vì “có thể triển khai sau”.
12. Nếu không đủ tài khoản, database, API key hoặc môi trường để kiểm tra, phải ghi “BLOCKED” và nói rõ thiếu gì.
13. Không được sửa yêu cầu nghiệp vụ để làm cho code hiện tại trông như đã đạt.
14. Không được ghi đè kết quả AI khi bác sĩ chỉnh sửa. Phải kiểm tra AI result và doctor review có được lưu riêng hay không.
15. Kết quả AI phải được gọi là kết quả sàng lọc/hỗ trợ quyết định, không được mặc định xem là chẩn đoán chính thức.

# II. BƯỚC 1: KIỂM TRA CẤU TRÚC DỰ ÁN

Hãy báo cáo:

* Công nghệ Frontend.
* Công nghệ Backend.
* Công nghệ AI Core.
* Database đang sử dụng.
* Storage đang sử dụng.
* Cơ chế đăng nhập.
* Cơ chế phân quyền.
* Cơ chế realtime.
* Cơ chế hàng đợi AI.
* Cơ chế thanh toán.
* Cơ chế xuất PDF/CSV.
* Cơ chế logging và audit.
* Các service bên ngoài.
* File `.env.example` có đầy đủ biến cần thiết không.
* Có secret/API key nào bị hard-code trong source không.
* Có README hướng dẫn chạy dự án không.
* Có migration và seed data không.

Sau đó vẽ lại luồng dữ liệu thực tế đang tồn tại trong code:

Frontend → Backend → Database/Storage → AI Core → Backend → Frontend.

Nếu kiến trúc thực tế khác tài liệu, phải chỉ rõ sự khác nhau.

# III. BƯỚC 2: BUILD VÀ CHẠY HỆ THỐNG

Phải thực hiện và ghi lại kết quả:

1. Cài dependency.
2. Build Frontend.
3. Kiểm tra TypeScript.
4. Chạy lint.
5. Build Backend.
6. Chạy database migration.
7. Chạy AI Core.
8. Chạy toàn bộ hệ thống.
9. Kiểm tra console trình duyệt.
10. Kiểm tra Network request.
11. Kiểm tra log Backend.
12. Kiểm tra log AI.
13. Chạy unit test, integration test và E2E test nếu có.

Báo cáo từng lệnh đã chạy và kết quả:

* PASS
* FAIL
* WARNING
* NOT AVAILABLE

Không được che giấu warning hoặc lỗi build.

# IV. BƯỚC 3: KIỂM TRA ĐĂNG NHẬP VÀ PHÂN QUYỀN

Tạo hoặc sử dụng tối thiểu bốn tài khoản:

* Một User/Patient.
* Một Doctor.
* Một Clinic Admin.
* Một System Admin.

Kiểm tra:

1. Đăng ký bằng email.
2. Đăng nhập đúng mật khẩu.
3. Đăng nhập sai mật khẩu.
4. Google/social login có hoạt động thật hay chỉ có nút.
5. Refresh token.
6. Đăng xuất.
7. Token hết hạn.
8. Tài khoản bị khóa.
9. Quên mật khẩu.
10. Đổi mật khẩu.
11. Truy cập route sai role.
12. Gọi API sai role bằng Postman/cURL.
13. Doctor truy cập bệnh nhân không được phân công.
14. Clinic truy cập bệnh nhân của phòng khám khác.
15. User truy cập analysis của người khác.
16. Admin có được đọc dữ liệu y tế hoặc tin nhắn ngoài phạm vi cần thiết hay không.

Nếu Backend trả dữ liệu dù Frontend đã ẩn nút, đánh lỗi bảo mật nghiêm trọng.

# V. BƯỚC 4: KIỂM TRA TỪNG YÊU CẦU CHỨC NĂNG

## A. USER/PATIENT

### FR-1: Đăng ký và đăng nhập

Kiểm tra email, Google/social login, xác minh email, quên mật khẩu, đăng xuất và khóa tài khoản.

### FR-2: Tải ảnh võng mạc

Kiểm tra:

* Một ảnh.
* Nhiều ảnh.
* Fundus.
* OCT.
* Mắt trái.
* Mắt phải.
* File PNG/JPG/DICOM.
* File quá dung lượng.
* File không phải ảnh.
* Ảnh trùng.
* Mất mạng khi upload.
* Upload lại.
* Tiến trình upload.
* Ảnh có thực sự được lưu vào Storage không.
* Metadata có được lưu vào database không.
* Ảnh có được gắn đúng bệnh nhân không.

### FR-3: Xem kết quả AI

Kiểm tra kết quả có lấy từ AI thật hay dữ liệu hard-code.

Kiểm tra:

* Điểm nguy cơ.
* Mức nguy cơ.
* Độ tin cậy.
* Giải thích chỉ số.
* Trạng thái chờ AI.
* AI thất bại.
* Phân tích lại.
* Phiên bản AI.
* Phiên bản threshold.
* Ngày phân tích.

### FR-4: Ảnh chú thích

Kiểm tra:

* Ảnh gốc.
* Ảnh annotated.
* Heatmap.
* Vùng mạch máu bị ảnh hưởng.
* Zoom.
* So sánh ảnh gốc và ảnh AI.
* URL ảnh có được bảo vệ không.
* User khác có mở URL ảnh được không.

### FR-5: Khuyến nghị và cảnh báo

Kiểm tra khuyến nghị lấy từ rule/backend hay hard-code trên giao diện.

Kiểm tra bệnh nhân nguy cơ cao có bị thông báo quá mức hoặc bị xem như chẩn đoán chính thức không.

### FR-6: Lịch sử phân tích

Kiểm tra:

* Danh sách thật từ database.
* Phân trang.
* Lọc theo ngày.
* Lọc theo mắt.
* Lọc theo mức nguy cơ.
* Mở lại báo cáo.
* Reload trang không mất dữ liệu.
* User không xem được lịch sử người khác.

### FR-7: Xuất PDF/CSV

Kiểm tra:

* File có tải thật không.
* Dữ liệu trong file có đúng database không.
* PDF có ảnh, kết quả, bác sĩ và ngày phát hành không.
* CSV có encoding tiếng Việt đúng không.
* Báo cáo chưa được bác sĩ xác nhận có bị ghi là chính thức không.

### FR-8: Hồ sơ cá nhân và y tế

Kiểm tra cập nhật:

* Họ tên.
* Ngày sinh.
* Giới tính.
* Số điện thoại.
* Địa chỉ.
* Tiền sử bệnh.
* Tiểu đường.
* Huyết áp.
* Thuốc đang sử dụng.
* Dị ứng.

Kiểm tra dữ liệu có lưu thật và có validation.

### FR-9: Thông báo

Kiểm tra:

* AI bắt đầu.
* AI hoàn thành.
* AI thất bại.
* Báo cáo được phát hành.
* Tin nhắn mới.
* Thanh toán thành công.
* Sắp hết lượt.

Kiểm tra realtime có hoạt động hay phải refresh.

### FR-10: Nhắn tin bác sĩ

Kiểm tra:

* Gửi tin nhắn thật.
* Bác sĩ nhận được.
* Realtime.
* Đã đọc/chưa đọc.
* Lịch sử tin nhắn.
* User chỉ chat được với bác sĩ được chỉ định.
* Tin nhắn có lưu database.
* Reload trang không mất.
* Kiểm tra upload file nếu có.

### FR-11: Mua và gia hạn gói

Kiểm tra:

* Chọn gói.
* Tạo đơn hàng.
* Thanh toán thành công.
* Thanh toán thất bại.
* Callback/webhook.
* Không cộng lượt hai lần khi webhook gửi lại.
* Gia hạn gói.
* Hủy thanh toán.

Nếu chỉ có nút “Mua gói” và toast thành công, đánh UI ONLY.

### FR-12: Lịch sử thanh toán và lượt còn lại

Kiểm tra:

* Lịch sử lấy từ database.
* Số tiền.
* Mã giao dịch.
* Trạng thái.
* Ngày thanh toán.
* Lượt được cộng.
* Lượt bị trừ.
* Hoàn lượt khi AI lỗi.
* Không cho lượt âm.
* Có transaction ledger hay chỉ sửa trực tiếp số lượt.

## B. DOCTOR

Kiểm tra đầy đủ FR-13 đến FR-21:

* Danh sách bệnh nhân được phân công.
* Chỉ xem đúng bệnh nhân được giao.
* Xem ảnh gốc.
* Xem annotated image/heatmap.
* Xem kết quả AI.
* Xác nhận kết quả AI.
* Chỉnh sửa kết quả AI.
* Yêu cầu phân tích lại.
* Đánh dấu ảnh không đạt chất lượng.
* Thêm ghi chú.
* Thêm chẩn đoán.
* Thêm khuyến nghị.
* Xem lịch sử bệnh nhân.
* Xem xu hướng theo thời gian.
* Tìm theo ID.
* Tìm theo tên.
* Lọc theo mức nguy cơ.
* Gửi feedback AI.
* Chat với bệnh nhân.
* Xem thống kê cá nhân.

Đặc biệt kiểm tra:

1. Kết quả AI nguyên bản có được giữ lại không.
2. Doctor review có bảng dữ liệu riêng không.
3. Có lưu bác sĩ nào chỉnh sửa không.
4. Có lưu thời điểm chỉnh sửa không.
5. Có lưu giá trị trước và sau không.
6. Báo cáo đã phát hành có bị sửa trực tiếp không.
7. Có cơ chế tạo phiên bản báo cáo mới không.

## C. CLINIC

Kiểm tra đầy đủ FR-22 đến FR-30:

* Đăng ký phòng khám.
* Upload giấy tờ xác minh.
* Trạng thái chờ duyệt.
* Admin phê duyệt.
* Admin từ chối.
* Admin tạm ngưng.
* Quản lý bác sĩ.
* Mời bác sĩ.
* Vô hiệu hóa thành viên.
* Quản lý bệnh nhân.
* Phân công bệnh nhân cho bác sĩ.
* Upload batch.
* Ghép ảnh với mã bệnh nhân.
* Kiểm tra ảnh lỗi.
* Theo dõi từng ảnh trong batch.
* Batch thành công một phần.
* Báo cáo toàn phòng khám.
* Thống kê nguy cơ.
* Sử dụng gói dịch vụ.
* Cảnh báo bệnh nhân nguy cơ cao.
* Xuất CSV/PDF thống kê.

Kiểm tra dữ liệu giữa các phòng khám có bị lẫn hay không.

## D. ADMIN

Kiểm tra đầy đủ FR-31 đến FR-39:

* Quản lý User.
* Quản lý Doctor.
* Quản lý Clinic.
* Kích hoạt.
* Vô hiệu hóa.
* Chỉnh sửa.
* Quản lý role.
* Quản lý permission.
* Cấu hình AI.
* Cấu hình threshold.
* Cấu hình chính sách retraining.
* Quản lý gói dịch vụ.
* Quản lý giá.
* Dashboard sử dụng.
* Dashboard doanh thu.
* Thống kê ảnh.
* Phân bố nguy cơ.
* Tỷ lệ AI lỗi.
* Audit log.
* Privacy setting.
* Duyệt phòng khám.
* Tạm ngưng phòng khám.
* Quản lý mẫu notification.

Kiểm tra cấu hình AI mới có làm thay đổi báo cáo cũ hay không. Báo cáo cũ phải giữ model version và threshold version tại thời điểm phân tích.

# VI. BƯỚC 5: KIỂM TRA LUỒNG END-TO-END GIỮA CÁC ROLE

Phải chạy luồng hoàn chỉnh sau:

1. Admin tạo gói dịch vụ.
2. Clinic đăng ký.
3. Admin duyệt Clinic.
4. Clinic tạo hoặc mời Doctor.
5. Clinic tạo Patient.
6. Clinic phân công Patient cho Doctor.
7. Patient đăng nhập.
8. Patient mua hoặc được cấp lượt.
9. Patient tải ảnh.
10. Backend lưu ảnh.
11. Backend trừ hoặc giữ lượt.
12. Backend tạo Analysis.
13. AI nhận công việc.
14. AI xử lý.
15. AI trả kết quả và annotated image.
16. Backend lưu kết quả.
17. Doctor nhận thông báo.
18. Doctor mở ca.
19. Doctor xác nhận hoặc chỉnh sửa.
20. Doctor phát hành báo cáo.
21. Patient nhận thông báo.
22. Patient xem báo cáo.
23. Patient tải PDF.
24. Patient nhắn Doctor.
25. Doctor trả lời.
26. Clinic xem thống kê.
27. Admin xem audit log.

Phải dùng cùng một dữ liệu xuyên suốt luồng. Không được kiểm tra từng màn hình bằng các dữ liệu mẫu không liên quan nhau.

# VII. BƯỚC 6: KIỂM TRA TRẠNG THÁI ANALYSIS

Xác định code hiện tại có các trạng thái tương đương không:

* UPLOADED
* VALIDATING
* QUEUED
* PROCESSING
* AI_COMPLETED
* DOCTOR_REVIEW
* VERIFIED
* CORRECTED
* REANALYSIS_REQUIRED
* PUBLISHED
* FAILED
* CANCELLED

Kiểm tra:

* Chuyển trạng thái có hợp lệ không.
* User có thể tự sửa trạng thái không.
* Có trường hợp bỏ qua Doctor Review không.
* AI lỗi có bảo toàn ảnh không.
* Retry có tạo job trùng không.
* Hai request đồng thời có xử lý trùng không.

# VIII. BƯỚC 7: KIỂM TRA DATABASE

Hãy liệt kê toàn bộ bảng/collection hiện tại và đánh giá có đủ cho nghiệp vụ không.

Tối thiểu cần kiểm tra các nhóm:

* Users và Roles.
* Patient Profile.
* Doctor Profile.
* Clinics và Clinic Members.
* Doctor–Patient Assignment.
* Analysis Cases.
* Retinal Images.
* AI Jobs.
* AI Results.
* AI Findings.
* Annotations.
* Doctor Reviews.
* Reports và Report Versions.
* Conversations và Messages.
* Notifications.
* Packages.
* Subscriptions.
* Payments.
* Credit Transactions.
* AI Model Versions.
* Threshold Configurations.
* Audit Logs.
* Consent Records.

Với mỗi bảng, báo cáo:

* Mục đích.
* Primary key.
* Foreign key.
* Quan hệ.
* Trường quan trọng.
* Thiếu constraint gì.
* Có nguy cơ mất hoặc lẫn dữ liệu không.

# IX. BƯỚC 8: KIỂM TRA BẢO MẬT

Kiểm tra tối thiểu:

* SQL injection.
* XSS.
* CSRF.
* Upload file độc hại.
* File giả mạo phần mở rộng.
* Broken Object Level Authorization.
* Truy cập URL ảnh trực tiếp.
* Token lưu ở đâu.
* Password hashing.
* Rate limit.
* CORS.
* Secret hard-code.
* Log có lộ thông tin y tế không.
* API có trả thừa dữ liệu không.
* Người dùng sửa request để đổi `patientId`.
* Doctor sửa request để mở bệnh nhân khác.
* Clinic truy cập dữ liệu clinic khác.
* User tải báo cáo của người khác.
* Dữ liệu nhạy cảm có bị lưu trong localStorage không.

Không được tuyên bố “HIPAA compliant” nếu dự án chưa có bằng chứng kiểm soát và quy trình tuân thủ tương ứng.

# X. BƯỚC 9: KIỂM TRA PHI CHỨC NĂNG

Đánh giá NFR-1 đến NFR-23:

* AI một ảnh có hoàn thành trong 10–20 giây không.
* Batch 100 ảnh có hoạt động không.
* Dashboard dưới 3 giây không.
* AI lỗi có trả thông báo rõ ràng không.
* Ảnh có được giữ lại khi AI lỗi không.
* Có backup hằng ngày không.
* Có thể scale AI service không.
* TLS có được sử dụng không.
* Dữ liệu lưu trữ có mã hóa không.
* Dữ liệu retraining có được ẩn danh không.
* Giao diện có responsive không.
* Quy trình upload và xem kết quả có quá ba lần nhấp không.
* Heatmap có dễ hiểu không.
* Có centralized logging không.
* Có audit log không.
* Có model version và threshold version không.

Nếu chưa thể đo lường, đánh “NOT VERIFIED”, không được tự đánh PASS.

# XI. CÁCH CHẤM KẾT QUẢ

Chỉ dùng các trạng thái sau:

* PASS: Hoạt động đầy đủ và có bằng chứng.
* PARTIAL: Hoạt động một phần.
* UI ONLY: Chỉ có giao diện.
* MOCK: Dùng dữ liệu hoặc dịch vụ giả.
* FAIL: Có code nhưng kiểm thử thất bại.
* MISSING: Chưa triển khai.
* BLOCKED: Không thể kiểm tra vì thiếu môi trường hoặc quyền.
* NOT VERIFIED: Có dấu hiệu tồn tại nhưng chưa đủ bằng chứng.

# XII. ĐỊNH DẠNG BÁO CÁO BẮT BUỘC

Tạo bảng cho từng FR:

| FR | Chức năng | Trạng thái | Bằng chứng | API | Database | Lỗi/thiếu | Mức ưu tiên |
| -- | --------- | ---------- | ---------- | --- | -------- | --------- | ----------- |

Trong cột bằng chứng phải ghi cụ thể:

* Tên file và vị trí code.
* Endpoint.
* Request/response thực tế.
* Bảng database bị thay đổi.
* Test case đã chạy.
* Ảnh chụp hoặc log nếu có.

Sau bảng FR, tạo thêm:

## 1. Tổng kết

* Tổng số PASS.
* Tổng số PARTIAL.
* Tổng số UI ONLY.
* Tổng số MOCK.
* Tổng số FAIL.
* Tổng số MISSING.
* Tổng số BLOCKED.
* Tổng số NOT VERIFIED.

## 2. Lỗi nghiêm trọng

Liệt kê lỗi làm sai nghiệp vụ, mất dữ liệu, lộ dữ liệu hoặc sai phân quyền.

## 3. Chức năng đang giả vờ hoàn thành

Liệt kê tất cả màn hình/nút có tồn tại nhưng chưa có xử lý thật.

## 4. Khoảng trống giữa Frontend và Backend

Liệt kê màn hình nào chưa có API, API nào chưa được FE sử dụng và kiểu dữ liệu nào không khớp.

## 5. Khoảng trống giữa Backend và AI

Liệt kê AI endpoint, job queue, callback, model version, retry và lỗi chưa được xử lý.

## 6. Kế hoạch sửa

Chia thành:

* P0: Bảo mật, mất dữ liệu, sai phân quyền, sai nghiệp vụ y tế.
* P1: Luồng chính không hoạt động.
* P2: Chức năng quan trọng chưa đầy đủ.
* P3: Giao diện, trải nghiệm và tối ưu.

Mỗi công việc phải ghi:

* File cần sửa.
* API cần tạo hoặc sửa.
* Database migration cần thiết.
* FE cần thay đổi.
* Test case xác nhận hoàn thành.

# XIII. ĐIỀU KIỆN ĐƯỢC GỌI LÀ HOÀN THÀNH

Một FR chỉ được đánh PASS khi đáp ứng đầy đủ:

1. Có giao diện nếu chức năng cần giao diện.
2. Nút và form hoạt động.
3. Có API thật.
4. Backend kiểm tra quyền.
5. Dữ liệu được lưu hoặc đọc từ database thật.
6. Reload trang không làm mất dữ liệu.
7. Có xử lý loading.
8. Có xử lý empty state.
9. Có xử lý lỗi.
10. Có validation.
11. Có kiểm thử trường hợp thành công.
12. Có kiểm thử trường hợp thất bại.
13. Không dùng mock/hard-code.
14. Không có lỗi console hoặc network.
15. Có bằng chứng kiểm thử.

Bây giờ hãy bắt đầu bằng việc kiểm tra cấu trúc repository và lập báo cáo hiện trạng. Không sửa code trước khi báo cáo audit ban đầu hoàn tất. Nếu repository quá lớn, hãy chia kiểm tra thành từng giai đoạn nhưng vẫn phải duy trì một bảng tổng hợp FR-1 đến FR-39.
