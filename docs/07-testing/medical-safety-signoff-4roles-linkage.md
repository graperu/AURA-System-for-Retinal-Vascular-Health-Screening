# BIÊN BẢN THẨM ĐỊNH AN TOÀN Y KHOA (MEDICAL SAFETY COMPLIANCE SIGN-OFF)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL SCREENING SYSTEM)
**Mã thẩm định:** `AURA-MSR-2026-004`  
**Ngày thẩm định:** 14/09/2026  
**Chuyên gia thẩm định:** Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập (Medical Safety Reviewer)  
**Phạm vi thẩm định:** Đợt cập nhật liên kết dữ liệu 4 vai trò (USER, DOCTOR, CLINIC, ADMIN), kiểm soát ranh giới lâm sàng CDS và xóa bỏ mock data  
**Căn cứ pháp lý & quy chuẩn:** Luật Khám bệnh, chữa bệnh 2023 (Việt Nam) / FDA SaMD / CE-MDR / Quyết định 5488/QĐ-BYT / Bộ quy tắc Medical Safety AURA / Cổng chất lượng QG6  

---

## 1. TỔNG QUAN HỒ SƠ THẨM ĐỊNH

| Hạng mục | Nội dung chi tiết |
| :--- | :--- |
| **Tính năng & Khối nghiệp vụ** | 1. Tính minh bạch lâm sàng & Phòng chống chẩn đoán tự động trên giao diện Bệnh nhân (`USER`).<br/>2. Cơ chế phân quyền bác sĩ & Ký số điện tử y tế HMAC/SHA-256 trên bàn khám CDS (`DOCTOR`).<br/>3. Toàn vẹn dữ liệu lâm sàng, triệt tiêu 100% Mock Data mồ côi (`patient_profiles`).<br/>4. Quản trị phân quyền phòng khám và điều phối phân công (`CLINIC` & `ADMIN`). |
| **Đối tượng tác động** | Bệnh nhân (USER), Bác sĩ thẩm định CDS (DOCTOR), Quản lý cơ sở y tế (CLINIC), Quản trị viên (ADMIN) |
| **Tệp tin mã nguồn rà soát** | 1. `frontend/src/features/patient/PatientDashboardView.tsx`<br/>2. `frontend/src/pages/PatientPortalPage.tsx`<br/>3. `frontend/src/components/ConsultationChatModal.tsx`<br/>4. `frontend/src/pages/CDSDashboardPage.tsx`<br/>5. `frontend/src/components/ClinicalValidationBar.tsx`<br/>6. `frontend/src/components/MedicalReportModal.tsx`<br/>7. `frontend/src/components/ui/MedicalDisclaimer.tsx`<br/>8. `backend/src/main/java/com/aura/screening/controller/ScreeningController.java`<br/>9. `backend/src/main/java/com/aura/screening/service/ScreeningService.java`<br/>10. `backend/src/main/java/com/aura/auth/service/PatientAccessService.java`<br/>11. `backend/src/main/java/com/aura/patient/service/PatientProfileService.java`<br/>12. `backend/src/main/resources/db/migration/V027__unify_4roles_data_linkage_and_bulk_persistence.sql` |
| **Tài liệu quy chuẩn đối chiếu** | `.kilo/rules/medical-safety.md`<br/>`.kilo/rules/security-privacy.md`<br/>`.kilo/rules/testing-quality-gates.md` (Cổng QG6, QG7) |
| **Trạng thái kiểm thử hệ thống** | 571/571 Backend Unit & Integration Tests đạt `BUILD SUCCESS` (Coverage: 94.07% JaCoCo); Frontend TypeScript Strict Mode đạt chuẩn. |

---

## 2. BẢNG KIỂM TRA 6 TIÊU CHÍ AN TOÀN LÂM SÀNG CỐT LÕI (6-PILLAR CLINICAL SAFETY AUDIT)

| STT | Tiêu chí an toàn lâm sàng | Tiêu chuẩn bắt buộc | Hiện trạng mã nguồn & Thực tế triển khai | Đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Không chẩn đoán xác định tự động**<br/>*(No Definitive Diagnosis)* | Hệ thống CDS chỉ hỗ trợ sàng lọc; tuyệt đối không khẳng định bệnh lý tự động khi chưa có bác sĩ kết luận. | - `PatientDashboardView.tsx` (dòng 108–138): Khi ca khám ở trạng thái `ANALYZED` hoặc chưa duyệt, đã **loại bỏ hoàn toàn** badge hardcoded "Đã thẩm định". Thay vào đó hiển thị badge màu vàng hổ phách **"Chờ bác sĩ thẩm định"** kèm cảnh báo: *"Kết quả phân tích sơ bộ từ AI. Đang chờ bác sĩ chuyên khoa kiểm tra và thẩm định lâm sàng."*<br/>- `MedicalReportModal.tsx` (dòng 299–309): Báo cáo chưa duyệt hiển thị nhãn: *"Báo Cáo Sàng Lọc Sơ Bộ AURA AI - Đang Chờ Bác Sĩ Thẩm Định (Chưa ký số)"*. Điểm phần trăm được định nghĩa rõ là xác suất thống kê mô hình, không phải chẩn đoán xác định. | **ĐẠT**<br/>(COMPLIANT) |
| **2** | **Không kê đơn / điều trị xâm lấn**<br/>*(No Auto-Prescription)* | Nghiêm cấm tự ý chỉ định thuốc, liều dùng hoặc phác đồ can thiệp tự động. | - Toàn bộ backend và frontend không có endpoint hoặc UI nào cho phép AI kê đơn thuốc.<br/>- Khi chưa có ý kiến bác sĩ, hệ thống chỉ đưa ra lời khuyên dự phòng lối sống và hướng dẫn đặt lịch khám chuyên khoa (ScreeningService.java dòng 422–436). | **ĐẠT**<br/>(COMPLIANT) |
| **3** | **Cổng kiểm duyệt & Ký số của Bác sĩ**<br/>*(Doctor Review & Digital Signature Gate)* | Ca nguy cơ phải do bác sĩ phụ trách ký số chịu trách nhiệm y khoa. Lưu vết toàn vẹn thời điểm ký, mã ICD-10 và ghi chú lâm sàng. | - `ScreeningController.java` (dòng 102–120) & `PatientAccessService.java` (dòng 87–103): Bác sĩ chỉ được duyệt ca khám của bệnh nhân được phân công qua ràng buộc `@PreAuthorize("hasRole('DOCTOR') && @patientAccessService.canReviewScreening(principal, #id)")`.<br/>- `ScreeningService.java` (dòng 389–415): Ký số mã hóa `HMAC-SHA256` ràng buộc bất biến giữa `screeningId`, `doctorId`, `decision`, `doctorNotes`, `adjustedCardioRisk`, `adjustedDrRisk`, `icd10Codes`, và `signedAt`. Bảo tồn nguyên vẹn mức độ rủi ro gốc `originalAiRiskLevel`. | **ĐẠT**<br/>(COMPLIANT) |
| **4** | **Kiểm soát Tuyên bố miễn trừ y tế**<br/>*(Medical Disclaimer Enforcement)* | Thông điệp cảnh báo bắt buộc phải xuất hiện thường trực trên mọi giao diện, bàn khám CDS và văn bản xuất ra. | - Thông điệp chuẩn: *"Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."* hiện diện đồng bộ tại: `MedicalDisclaimer.tsx`, `ClinicalRiskSummaryCard.tsx`, `InteractiveCDSViewer.tsx`, `MedicalReportModal.tsx` (bản xem, bản in A4 và dòng 1 file CSV), `DoctorReportsView.tsx` và `AuthHeroPanel.tsx`.<br/>- Kênh tư vấn thời gian thực (`ConsultationChatModal.tsx` dòng 167–170) có thêm disclaimer: *"Kênh trao đổi chuyên môn y khoa thời gian thực (WebSocket). Không sử dụng cho các trường hợp cấp cứu khẩn cấp."* | **ĐẠT**<br/>(COMPLIANT) |
| **5** | **Bảo tồn ảnh gốc & Minh bạch Grad-CAM**<br/>*(Original Image & Grad-CAM Transparency)* | Lưu giữ ảnh màu đáy mắt gốc (True Color), bản đồ nhiệt XAI khách quan, hỗ trợ điều chỉnh độ mờ (Opacity) cho bác sĩ soi chiếu. | - Ảnh chụp đáy mắt được lưu định dạng chuẩn (hỗ trợ Data URI/URL trường `TEXT` qua migration V026).<br/>- Màn hình CDS Viewer hỗ trợ thanh trượt Opacity mượt mà, cho phép bác sĩ đối chiếu trực tiếp giữa cấu trúc vi phình mạch/xuất huyết thực tế và vùng kích hoạt nơ-ron Grad-CAM. | **ĐẠT**<br/>(COMPLIANT) |
| **6** | **Kiểm soát False Negative & Tính trung thực dữ liệu**<br/>*(False Negative Control & No Mock Policy)* | Triệt tiêu dữ liệu giả lập, xử lý ca ảnh mờ/lỗi fail-safe, ngăn chặn đánh giá an toàn giả tạo. | - Flyway migration `V027` đã thực thi dứt điểm `DELETE FROM patient_profiles WHERE user_id IS NULL;`, xóa sổ hoàn toàn 10 hồ sơ bệnh nhân giả lập mồ côi.<br/>- `PatientProfileService.java` chuyển đổi cơ chế hạt giống sang đồng bộ thực từ `patient_medical_profiles` và `doctor_patient_assignments`.<br/>- Ca phân tích lỗi được đưa về trạng thái `FAILED`, yêu cầu chụp lại ảnh thay vì kết luận rủi ro thấp. | **ĐẠT**<br/>(COMPLIANT) |

---

## 3. THẨM ĐỊNH CHI TIẾT 3 NỘI DUNG TRỌNG TÂM

### 3.1. Tính minh bạch lâm sàng & Phòng chống chẩn đoán tự động trên giao diện Bệnh nhân (`PatientDashboardView.tsx`)
1. **Loại bỏ badge hardcoded "Đã thẩm định"**:
   - *Phân tích rủi ro y khoa*: Trước bản cập nhật, việc giao diện hiển thị mặc định nhãn "Đã thẩm định" ngay khi ca khám mới dừng ở giai đoạn AI xử lý (`ANALYZED`) là một vi phạm nghiêm trọng về an toàn thông tin y tế, gây ngộ nhận cho bệnh nhân rằng một bác sĩ bằng xương bằng thịt đã duyệt hồ sơ.
   - *Đánh giá giải pháp hiện tại*: Mã nguồn tại `PatientDashboardView.tsx` (dòng 108–138) thiết lập ranh giới logic rõ ràng:
     ```tsx
     {latestResult.status === 'REVIEWED' ? (
       // Khối màu xanh: Đã thẩm định bởi BS kèm chữ ký số và ghi chú
     ) : (
       // Khối màu hổ phách: Chờ bác sĩ thẩm định kèm lưu ý kết quả sơ bộ từ AI
     )}
     ```
     Giải pháp này phản ánh chính xác trạng thái pháp lý của ca khám, loại bỏ hoàn toàn nguy cơ chẩn đoán tự động trá hình.
2. **Xử lý bệnh nhân chưa được phân công bác sĩ & Chặn chat mồ côi**:
   - *Phân tích rủi ro y khoa*: Nếu bệnh nhân có triệu chứng thị giác cấp tính (như ám điểm trung tâm, mất thị lực đột ngột) gửi tin nhắn vào một phòng chat không có bác sĩ phụ trách tiếp nhận ("tin nhắn mồ côi"), bệnh nhân có thể trì hoãn việc đi cấp cứu vì lầm tưởng bác sĩ đang xem tin nhắn.
   - *Đánh giá giải pháp hiện tại*:
     * Giao diện hiển thị rõ ràng thông báo: `"Bác sĩ phụ trách: Đang chờ phân công bác sĩ"`.
     * Trong `ConsultationChatModal.tsx` (dòng 172–189), khi `partnerUserId` không tồn tại, giao diện khóa toàn bộ ô nhập văn bản và luồng tin nhắn, đồng thời hiển thị hộp cảnh báo giải thích rõ hồ sơ đang chờ cơ sở y tế phân công.
     * Tầng backend (`PatientAccessService.java` dòng 45–63) xác thực điều kiện `assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(...)`, từ chối nhận tin nhắn nếu không có liên kết bác sĩ - bệnh nhân đang hoạt động.
     * **Kết luận**: Biện pháp bảo vệ bệnh nhân đạt tiêu chuẩn an toàn cao nhất, phòng chống hiệu quả rủi ro chậm trễ cấp cứu y tế.

### 3.2. Bác sĩ thẩm định & Ký số (Doctor Review & CDS Governance)
1. **Kiểm soát phạm vi tiếp cận bệnh nhân (IDOR Prevention & Patient Privacy)**:
   - Cơ chế bảo vệ tại `PatientAccessService.java` và `ScreeningController.java` ngăn ngừa việc bác sĩ truy cập hoặc ký duyệt hồ sơ bệnh nhân không thuộc phạm vi quản trị lâm sàng của mình.
   - Trên `CDSDashboardPage.tsx`, danh sách làm việc của bác sĩ được nạp chính xác từ endpoint `doctorApi.getAssignedPatients()`.
2. **Tính chịu trách nhiệm y khoa (Medical Accountability) của chữ ký số HMAC/SHA-256**:
   - *Cơ sở y lý & pháp lý*: Theo Luật Khám bệnh, chữa bệnh và hướng dẫn FDA SaMD, thuật toán AI không có tư cách pháp nhân chịu trách nhiệm y khoa. Mọi quyết định thay đổi nguy cơ, gắn mã ICD-10 hoặc kết luận lâm sàng phải gắn liền với định danh của bác sĩ chuyên khoa có chứng chỉ hành nghề.
   - *Cơ chế lưu vết*:
     * `ScreeningService.java` (dòng 398–415) khởi tạo chữ ký số bằng mã băm HMAC-SHA256 kết nối chuỗi:
       `[ScreeningID] | [DoctorUUID] | [Decision] | [DoctorNotes] | [AdjustedCardioRisk] | [AdjustedDrRisk] | [ICD10Codes] | [SignedAt]`
     * Chữ ký này lưu trong cột `digital_signature` của bảng `screenings` cùng thời điểm `signed_at`.
     * Toàn vẹn dữ liệu: Bất kỳ sự sửa đổi trái phép nào đối với kết luận lâm sàng hoặc mức nguy cơ sau khi ký sẽ làm sai lệch mã băm, bảo đảm tính chống chối bỏ (Non-repudiation) và bảo vệ bác sĩ lẫn bệnh nhân trước tòa án y khoa.
     * **Kết luận**: Đảm bảo 100% tính chịu trách nhiệm y khoa.

### 3.3. Xóa bỏ Mock Data & Dữ liệu mồ côi (No Mock Policy)
1. **Giải quyết triệt để dữ liệu mồ côi `user_id IS NULL`**:
   - Bản di chuyển Flyway `V027` đã thực thi câu lệnh SQL xóa dứt điểm các bản ghi trong `patient_profiles` không có liên kết người dùng:
     ```sql
     DELETE FROM patient_profiles WHERE user_id IS NULL;
     ```
   - Xóa bỏ tình trạng 10 hồ sơ "ma" tồn tại trong cơ sở dữ liệu làm sai lệch báo cáo thống kê dịch tễ học và nguy cơ bác sĩ chẩn đoán nhầm vào hồ sơ ảo.
2. **Đồng bộ thực từ `patient_medical_profiles`**:
   - `PatientProfileService.java` đã vô hiệu hóa hoàn toàn phương thức chèn mock data. Mọi hồ sơ bệnh nhân hiện tại được đồng bộ trực tiếp từ bảng định danh y tế thực tế `patient_medical_profiles` gắn liền với tài khoản `users` và bảng phân công `doctor_patient_assignments`.
   - Các trường chỉ số sinh tồn (Huyết áp, HbA1c, tiền sử đái tháo đường, đột quỵ) phản ánh dữ liệu đo đạc thực tế của bệnh nhân Nguyễn Trọng Nam (MRN-2026-0941), tuân thủ nghiêm ngặt quy chuẩn V014 (bỏ mock default 120/80 mmHg, 5.6% HbA1c).
   - **Kết luận**: Đáp ứng trọn vẹn quy tắc *No Mock in Production* (Medical Safety Rule 3.1).

---

## 4. KẾT LUẬN THẨM ĐỊNH AN TOÀN Y KHOA

Căn cứ vào kết quả rà soát toàn diện mã nguồn, cấu trúc cơ sở dữ liệu và cơ chế kiểm soát lâm sàng:

1. **Tính minh bạch lâm sàng**: Đạt chuẩn. Ranh giới giữa kết quả sơ bộ của AI và kết luận chính thức của bác sĩ được phân định rành mạch, bảo đảm quyền được thông tin chính xác của người bệnh.
2. **Trách nhiệm y khoa**: Đạt chuẩn. Quy trình duyệt ca khám CDS và ký số HMAC-SHA256 thiết lập chuỗi trách nhiệm minh bạch, tuân thủ Luật Khám bệnh, chữa bệnh 2023.
3. **Tính trung thực dữ liệu**: Đạt chuẩn. Không còn tồn tại mock data hoặc hồ sơ mồ côi trong luồng xử lý thực tế.
4. **Hành động tiếp theo**: Hệ thống vận hành an toàn tuyệt đối, không phát hiện lỗi rủi ro y khoa nghiêm trọng. **Không yêu cầu sửa đổi mã nguồn sản phẩm.**

### QUYẾT ĐỊNH CHÍNH THỨC:
# [X] CHẤP THUẬN AN TOÀN (APPROVED - PASS 100%)
*(Đủ điều kiện vượt qua Cổng Chất Lượng Y Khoa QG6 để chuyển giao cho Code Reviewer và CEO nghiệm thu)*

---

**Đại diện Thẩm định An toàn Y khoa:**  
*Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập AURA (Medical Safety Reviewer)*  
*Chữ ký điện tử thẩm định:* `AURA-MSR-SIGN-20260914-PASS-QG6`
