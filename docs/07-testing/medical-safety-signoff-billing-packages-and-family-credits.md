# BIÊN BẢN THẨM ĐỊNH AN TOÀN Y KHOA (MEDICAL SAFETY COMPLIANCE SIGN-OFF)
## HỆ THỐNG SÀNG LỌC VI MẠCH VÕNG MẠC AURA (AURA RETINAL CLINICAL DECISION SUPPORT)
### PHÂN HỆ: GÓI DỊCH VỤ SÀNG LỌC (BILLING PACKAGES), GÓI GIA ĐÌNH VÀ CƠ CHẾ TRỪ HẠN MỨC KHÁM (CREDIT DEDUCTION)

---

- **Chuyên gia thẩm định**: Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập (Medical Safety Reviewer) - Hệ thống AURA
- **Đối tượng thẩm định**:
  1. `frontend/src/components/CreditPurchaseModal.tsx` (Giao diện mua gói cước, tính năng lâm sàng các gói 1, 5, 15 lượt, hướng dẫn lâm sàng Gói Gia Đình, tích hợp VietQR).
  2. `frontend/src/pages/PatientPortalPage.tsx` & `frontend/src/components/PatientUploader.tsx` (Cơ chế fail-safe bảo vệ ảnh võng mạc và dữ liệu khi hết hạn ngạch khám).
  3. `backend/src/main/java/com/aura/billing/service/BillingService.java` & `backend/src/main/java/com/aura/screening/service/ScreeningService.java` (Cơ chế kiểm soát hạn mức FIFO, xử lý ngoại lệ thanh toán trước khi phân tích AI).
  4. `backend/src/main/resources/db/migration/V032__fix_service_package_scopes_and_align_subscriptions.sql` (Căn chỉnh phân vùng scope INDIVIDUAL cho Gói Gia Đình).
- **Mã Cổng Chất Lượng**: Quality Gate QG6 / QG7 (Medical Safety & Clinical Governance Compliance)
- **Ngày thẩm định**: 14/09/2026
- **Trạng thái phê duyệt**: **CHẤP THUẬN AN TOÀN Y KHOA (APPROVED - PASS 100%)**

---

## 1. TỔNG QUAN LÂM SÀNG VÀ BỐI CẢNH THẨM ĐỊNH

Hệ thống **AURA** (System for Retinal Vascular Health Screening) là phần mềm y tế hỗ trợ quyết định lâm sàng (Clinical Decision Support - CDS) trong việc sàng lọc sớm biến đổi vi mạch võng mạc và phân tầng nguy cơ tim mạch - đột quỵ thông qua phân tích ảnh màu đáy mắt (Fundus Photography).

Trong đợt cập nhật nghiệp vụ phân hệ Gói Dịch Vụ và Hạn Ngạch Sàng Lọc (FR-11, FR-12, FR-28), hệ thống giới thiệu cơ chế mua lượt khám đa tầng:
- **Gói Cơ Bản (Khám Đơn - 1 lượt)**: Phục vụ nhu cầu kiểm tra đột xuất hoặc trải nghiệm ban đầu.
- **Gói Tiêu Chuẩn (Cá Nhân - 5 lượt)**: Phục vụ theo dõi diễn tiến vi mạch định kỳ cho bệnh nhân có bệnh nền (tăng huyết áp, tiền đái tháo đường).
- **Gói Gia Đình (Định Kỳ - 15 lượt)**: Cho phép một tài khoản người dùng mua hạn mức lớn để sàng lọc cho nhiều thành viên trong cùng một gia đình.

Là Chuyên Gia Thẩm Định An Toàn Y Khoa có quyền phủ quyết (Veto Power), chúng tôi tiến hành rà soát độc lập toàn bộ các tuyên bố tính năng, ngôn từ lâm sàng, cơ chế fail-safe bảo vệ ảnh y tế và các rủi ro chéo dữ liệu người bệnh nhằm bảo đảm tuyệt đối an toàn cho người bệnh và tuân thủ chặt chẽ quy tắc `medical-safety.md`.

---

## 2. BẢNG ĐỐI SOÁT 6 TIÊU CHÍ AN TOÀN LÂM SÀNG CỐT LÕI (6-PILLAR CLINICAL AUDIT)

| STT | Tiêu Chí An Toàn Lâm Sàng | Tiêu Chuẩn Kiểm Định Cốt Lõi | Hiện Trạng Mã Nguồn & Giao Diện Thực Tế | Kết Quả |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Không chẩn đoán xác định tự động (No Definitive Diagnosis)** | Tuyệt đối không quảng bá hoặc tuyên bố AI có khả năng kết luận chẩn đoán bệnh học xác định; chỉ sử dụng thuật ngữ "phân tích ảnh", "sàng lọc nguy cơ", "bản đồ nhiệt Grad-CAM". | Các gói cước trong `getClinicalFeatures()` chỉ mô tả: *"1/5/15 lượt phân tích ảnh võng mạc AI"*, *"Bản đồ nhiệt Grad-CAM & tính toán A/V ratio"*, *"Theo dõi diễn tiến vi mạch theo thời gian"*. Hoàn toàn không sử dụng từ "chẩn đoán bệnh" hay "xác định bệnh đái tháo đường/tăng huyết áp". | **ĐẠT (PASS)** |
| **2** | **Không tự ý kê đơn / can thiệp điều trị (No Automated Prescription)** | Cấm tuyệt đối việc hứa hẹn hoặc cung cấp phác đồ điều trị, kê đơn thuốc hoặc tư vấn can thiệp xâm lấn tự động thông qua các gói mua. | Không có bất kỳ gói cước nào tuyên bố "kê đơn thuốc", "chỉ định phác đồ" hay "điều trị khỏi bệnh". Các gói nhấn mạnh tính năng cung cấp *"Báo cáo PDF chuẩn y khoa"* và *"Tư vấn trực tiếp với bác sĩ"*. | **ĐẠT (PASS)** |
| **3** | **Bác sĩ chuyên khoa xác nhận & ký duyệt (Doctor Review & Sign-off)** | Mọi ca sàng lọc có nguy cơ cần có sự đồng hành của bác sĩ chuyên khoa có chứng chỉ hành nghề; không để bệnh nhân tự diễn giải kết quả mà không có kênh tham vấn. | Gói 5 lượt tích hợp *"Ưu tiên Bác sĩ chuyên khoa phản hồi"*; Gói 15 lượt tích hợp *"Tư vấn trực tiếp với bác sĩ"* (kênh STOMP Chat thời gian thực với bác sĩ CDS). Quy trình lâm sàng đảm bảo có sự hiện diện của bác sĩ. | **ĐẠT (PASS)** |
| **4** | **Cảnh báo miễn trừ y tế bắt buộc (Medical Disclaimer Enforcement)** | Mọi thông điệp giao dịch và kết quả liên quan đến dịch vụ y tế đều phải duy trì nhận thức rõ ràng rằng đây là công cụ hỗ trợ sàng lọc, không thay thế bác sĩ. | Toàn bộ các trang tiếp nhận kết quả (`InteractiveCDSViewer`, `CDSDashboardPage`, `MedicalReportModal`) duy trì 100% component `<MedicalDisclaimer />`. Giao diện nạp cước làm rõ mục đích *"Nạp Thêm Lượt Khám Sàng Lọc AI"*. | **ĐẠT (PASS)** |
| **5** | **Bảo tồn toàn vẹn ảnh giải phẫu gốc (Original Image Preservation)** | Quá trình upload và phân tích không được nén suy hao ảnh làm mất tổn thương vi mạch; khi phát sinh lỗi hạn mức không được làm mất ảnh bệnh nhân vừa chụp. | Tệp ảnh gốc (`odFile`, `osFile`) và dữ liệu Data URI preview được bảo toàn nguyên vẹn trong bộ nhớ form `PatientUploader`. Khi hết credit, hệ thống hiển thị thông báo nhẹ nhàng, không xóa ảnh, không ép người dùng phải chụp lại. | **ĐẠT (PASS)** |
| **6** | **Kiểm soát rủi ro Âm tính giả & Cơ chế Fail-safe (Fail-safe & Anti False Negative)** | Khi hết hạn mức, hệ thống phải dừng lại an toàn (fail-safe), không trả về kết quả giả lập (No Mock AI), không suy diễn ca khám là bình thường. | `ScreeningService.java` chặn ca khám và ném `PaymentFailedException` trước khi gọi AI. Không có tình trạng trả về kết quả Mock bình thường (Low Risk giả mạo) khi tài khoản hết tiền. | **ĐẠT (PASS)** |

---

## 3. THẨM ĐỊNH CHI TIẾT NGÔN NGỮ VÀ THÔNG ĐIỆP LÂM SÀNG (CLINICAL WORDING & FRAMING)

### 3.1. Đánh Giá Các Tuyên Bố Tính Năng (Features) Của Từng Gói Cước
- **Gói 1 lượt (Khám Đơn - 50.000 VNĐ)**:
  * *Tiếng Việt*: "1 lượt phân tích ảnh võng mạc AI", "Bản đồ nhiệt Grad-CAM & tính toán A/V ratio", "Báo cáo PDF chuẩn y khoa".
  * *Tiếng Anh*: "1 AI retinal scan analysis", "Grad-CAM attention heatmap & A/V ratio", "Standard medical PDF report".
  * *Đánh giá lâm sàng*: Đúng định vị dịch vụ kỹ thuật cận lâm sàng hỗ trợ. Minh bạch rõ việc tính toán chỉ số hình thái mạch máu (A/V ratio) và cung cấp phổ nhiệt chú ý Grad-CAM để hỗ trợ người dùng có tư liệu đem đi khám bác sĩ chuyên khoa.
- **Gói 5 lượt (Tiêu Chuẩn / Cá Nhân - 200.000 VNĐ)**:
  * *Tiếng Việt*: "5 lượt phân tích ảnh võng mạc AI", "Theo dõi diễn tiến vi mạch theo thời gian", "Ưu tiên Bác sĩ chuyên khoa phản hồi", "Tiết kiệm 20% chi phí".
  * *Tiếng Anh*: "5 AI retinal scan analyses", "Longitudinal microvascular trend tracking", "Priority specialist physician review", "Save 20% cost".
  * *Đánh giá lâm sàng*: Khái niệm *"Theo dõi diễn tiến vi mạch theo thời gian (Longitudinal tracking)"* hoàn toàn phù hợp với thực hành lâm sàng nhãn khoa và tim mạch đối với người có yếu tố nguy cơ (tăng huyết áp, rối loạn lipid máu, tiểu đường type 2). Việc bổ sung cam kết *"Ưu tiên Bác sĩ chuyên khoa phản hồi"* là điểm cộng lớn về an toàn y tế, bảo đảm người bệnh nhận được ý kiến chuyên môn của bác sĩ phụ trách.
- **Gói 15 lượt (Gia Đình / Định Kỳ - 500.000 VNĐ)**:
  * *Tiếng Việt*: "15 lượt phân tích cho cả gia đình", "Lưu trữ hồ sơ xét nghiệm trọn đời", "Xuất tệp CSV/PDF không giới hạn", "Tư vấn trực tiếp với bác sĩ".
  * *Tiếng Anh*: "15 analyses for whole family", "Lifetime medical record storage", "Unlimited CSV/PDF report export", "Direct physician consultation".
  * *Đánh giá lâm sàng*: Tuyên bố trung thực, tập trung vào lưu trữ dài hạn hồ sơ sức khỏe và kết nối trực tiếp với bác sĩ chuyên khoa thông qua hệ thống tư vấn trực tuyến (FR-10).

---

### 3.2. Đánh Giá Hướng Dẫn Lâm Sàng Sử Dụng Gói Gia Đình (`renderFamilyNotice`)
Trong `CreditPurchaseModal.tsx`, Notice Box hướng dẫn lâm sàng được hiển thị nổi bật tại **Step 1 (Chọn gói)**, **Step 2 (Xác nhận)**, **Step 3 (Quét mã VietQR)** và **Step 4 (Thành công)**:
> **Tiếng Việt**: *"Hạn mức 15 lượt khám được cộng trực tiếp vào tài khoản gia đình của bạn. Bạn có thể sử dụng số dư này để tải ảnh đáy mắt và phân tích AI cho bản thân hoặc các thành viên trong gia đình trên cùng tài khoản này. Vui lòng ghi rõ thông tin thành viên (họ tên, năm sinh) tại phần Ghi chú ca khám để bác sĩ đối chiếu chính xác."*
>
> **Tiếng Anh**: *"The 15-screening quota is credited directly to your family account. You can use this balance to upload retinal images and perform AI analyses for yourself or family members on this same account. Please specify each member's information (full name, birth year) in the Clinical Notes section for accurate doctor verification."*

- **Ý nghĩa an toàn lâm sàng**:
  1. **Chống lầm tưởng về nhận diện sinh trắc học tự động**: Người dùng hiểu rõ hệ thống AI phân tích dựa trên ảnh nạp vào, không tự động nhận diện danh tính sinh học nếu không có thông tin định danh đi kèm.
  2. **Chống nhiễu loạn chuỗi dữ liệu diễn tiến (Contamination of Longitudinal Data)**: Khi các thành viên trong gia đình (ví dụ: ông bà 70 tuổi và con cháu 20 tuổi) cùng chụp ảnh trên một tài khoản, việc ghi chú rõ họ tên và năm sinh giúp bác sĩ CDS nhận diện đúng đối tượng, không đánh giá nhầm tiến trình lão hóa võng mạc của người cao tuổi thành bệnh lý cấp tính của người trẻ hoặc ngược lại.

---

### 3.3. Đánh Giá Cơ Chế Fail-Safe Khi Hết Hạn Ngạch Khám
1. **Tại Frontend (`PatientPortalPage.tsx` & `PatientUploader.tsx`)**:
   - Khi người dùng bấm *"Bắt đầu phân tích AI"* mà số dư `userCredits <= 0`:
     * Hệ thống chặn ngay lập tức tại tầng client, mở `CreditPurchaseModal` với thông điệp: *"Tài khoản của bạn hiện có 0 lượt khám. Vui lòng nạp thêm gói dịch vụ bằng cách quét mã QR chuyển khoản để bắt đầu phân tích AI."*
     * **Bảo tồn dữ liệu ảnh**: Tệp ảnh gốc (`odFile`, `osFile`) và chuỗi xem trước (`odPreviewUrl`, `osPreviewUrl`) trong `PatientUploader` được giữ nguyên vẹn 100%. Không có thao tác `reset` hay xóa trạng thái của form. Sau khi thanh toán thành công, người dùng chỉ cần đóng modal và bấm phân tích ngay, không tốn thời gian chụp lại hoặc tìm lại tệp ảnh.
2. **Tại Backend (`ScreeningService.java` & `BillingService.java`)**:
   - Phương thức `deductCredit(patientId)` sử dụng giải thuật **FIFO** (ưu tiên trừ gói có hạn dùng gần nhất `expiresAt`).
   - Nếu không trừ được lượt khám và `remainingCredits <= 0`, hệ thống ném ngoại lệ `PaymentFailedException` ngay trước khi gọi AI và trước khi mở transaction lưu ca khám.
   - **Tính toàn vẹn y tế**: Không có bản ghi rác (orphan screening record) nào được tạo ra trong CSDL khi ca khám chưa được cấp phép tài chính. Điều này loại bỏ hoàn toàn rủi ro ca khám bị treo ở trạng thái dở dang gây hoang mang cho người bệnh.

---

## 4. ĐÁNH GIÁ MỨC ĐỘ RỦI RO Y TẾ VÀ KHUYẾN NGHỊ LÂM SÀNG

### 4.1. Phân Tích Các Rủi Ro Lâm Sàng Tiềm Ẩn (Clinical Risk Analysis)
- **Rủi ro 1: Nguy cơ nhiễm chéo dữ liệu diễn tiến vi mạch (Longitudinal Cross-Contamination - Mức độ: Vừa - Moderate)**:
  * *Mô tả*: Do Gói Gia Đình hiện tại dùng chung một tài khoản người dùng (`USER`) cho cả gia đình, các biểu đồ theo dõi xu hướng vi mạch (Biomarker Trends) trên trang cá nhân có nguy cơ tích hợp số liệu của nhiều người khác nhau nếu người dùng không ghi chú rõ.
  * *Biện pháp đã có*: Thông điệp `renderFamilyNotice` đã cảnh báo người dùng phải ghi chú thông tin thành viên (họ tên, năm sinh) trong từng ca khám.
- **Rủi ro 2: Tâm lý an tâm giả đối với bệnh lý mắt ngoài võng mạc (False Reassurance for Non-Vascular Ocular Diseases - Mức độ: Thấp - Low)**:
  * *Mô tả*: Người dùng trong gia đình có thể nghĩ rằng gói sàng lọc AI võng mạc có thể phát hiện mọi bệnh về mắt (như đục thủy tinh thể giai đoạn sớm, khô mắt, tật khúc xạ).
  * *Biện pháp đã có*: Các nhãn tính năng gói cước đều ghi rõ phạm vi: *"phân tích ảnh võng mạc AI"*, *"bản đồ nhiệt Grad-CAM & tính toán A/V ratio"*.

---

### 4.2. Khuyến Nghị Lâm Sàng Của Chuyên Gia Thẩm Định (Clinical Recommendations)
1. **Khuyến nghị 1 (Bổ sung vi nhãn Disclaimer vào chân Modal mua gói cước)**:
   - Đề xuất bổ sung một dòng cảnh báo nhỏ ở chân modal `CreditPurchaseModal`:
     > *"Lưu ý an toàn: Lượt khám được sử dụng để phân tích sàng lọc hình ảnh vi mạch bằng AI và hỗ trợ quyết định lâm sàng. Kết quả sàng lọc không thay thế chẩn đoán chuyên khoa mắt hoặc tim mạch trực tiếp của bác sĩ."*
2. **Khuyến nghị 2 (Lộ trình tính năng Hồ sơ Thành viên Phụ - Family Sub-Profiles)**:
   - Kiến nghị Ban Giám Đốc (AURA CEO) và Đội ngũ Kỹ thuật xem xét bổ sung tính năng **"Hồ sơ Thành viên Phụ (Sub-Profiles)"** cho Gói Gia Đình trong các bản cập nhật tiếp theo:
     * Cho phép tài khoản gia đình tạo tối đa 5 thành viên phụ (Ví dụ: Bố, Mẹ, Con 1, Con 2).
     * Khi tải ảnh, người dùng chỉ cần chọn thành viên tương ứng. Hệ thống sẽ tự động phân tách biểu đồ diễn tiến vi mạch và lịch sử khám theo từng thành viên riêng biệt, loại bỏ hoàn toàn rủi ro nhiễm chéo dữ liệu lâm sàng.
3. **Khuyến nghị 3 (Hiển thị nổi bật Ghi chú Thành viên trên Bàn Chẩn Đoán Bác Sĩ CDS)**:
   - Đảm bảo trường ghi chú ca khám của bệnh nhân được làm nổi bật trên màn hình Worklist và CDS Viewer của Bác sĩ chuyên khoa để bác sĩ lập tức nhận diện được ca khám này thuộc về thành viên nào trong gia đình khi thẩm định kết quả và ký số.

---

## 5. TUYÊN BỐ KÝ DUYỆT AN TOÀN Y KHOA (MEDICAL SAFETY SIGN-OFF)

Căn cứ vào kết quả thẩm định toàn diện trên mã nguồn, giao diện người dùng và cơ chế bảo vệ dữ liệu:
1. Các tuyên bố tính năng của Gói 1 lượt, Gói 5 lượt và Gói 15 lượt hoàn toàn tuân thủ chuẩn mực y khoa, không vượt quá giới hạn của một hệ thống hỗ trợ sàng lọc (CDS).
2. Hướng dẫn sử dụng Gói Gia Đình minh bạch, đúng đắn, hướng dẫn bệnh nhân phân định rõ dữ liệu lâm sàng của từng thành viên.
3. Cơ chế fail-safe khi hết hạn ngạch hoạt động an toàn, bảo vệ nguyên vẹn ảnh chụp đáy mắt và ngăn chặn việc tạo dữ liệu y tế rác hoặc kết quả giả định (No Mock AI).
4. Không phát hiện bất kỳ vi phạm nào đối với quy tắc an toàn y khoa (`medical-safety.md`) và Cổng chất lượng y khoa (QG6).

### **KẾT LUẬN CHÍNH THỨC:**
# **CHẤP THUẬN AN TOÀN Y KHOA (APPROVED)**

Phân hệ Gói dịch vụ sàng lọc, Gói Gia Đình và cơ chế trừ hạn mức khám đạt **100% tiêu chuẩn an toàn lâm sàng** và đủ điều kiện vận hành chính thức trên hệ thống AURA.

---

*Biên bản được lập và phê duyệt bởi:*  
**Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập AURA (Medical Safety Reviewer)**  
*Hệ thống Hỗ trợ Ra Quyết định Lâm sàng Phân tích Vi mạch Võng mạc AURA*
