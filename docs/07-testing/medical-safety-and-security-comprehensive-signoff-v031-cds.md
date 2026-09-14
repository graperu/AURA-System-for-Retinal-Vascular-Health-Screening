# BIÊN BẢN THẨM ĐỊNH ĐỘC LẬP AN TOÀN Y KHOA & AN NINH DỮ LIỆU
## MEDICAL SAFETY & SECURITY COMPREHENSIVE SIGN-OFF REPORT
**Mã Báo Cáo:** `MSS-SIGN-OFF-2026-V031-CDS`  
**Dự Án:** Hệ thống Phần mềm Hỗ trợ Sàng lọc Sức khỏe Vi mạch Võng mạc AURA (AURA Retinal Vascular Health Screening CDS)  
**Vai Trò Thẩm Định:** Chuyên Gia Thẩm Định An Toàn Y Khoa (Medical Safety Reviewer) & Kỹ Sư An Ninh & Quyền Riêng Tư (Security & Privacy Engineer)  
**Ngày Thẩm Định:** 14/09/2026  
**Cổng Chất Lượng Áp Dụng:** Quality Gate QG6 (Medical Safety & Clinical Compliance) & QG7 (Security, Privacy & HIPAA Compliance)  
**Kết Luận Chung:** **CHẤP THUẬN TOÀN DIỆN (APPROVED - 100% PASS)**

---

## 1. PHẠM VI VÀ ĐỐI TƯỢNG THẨM ĐỊNH

Thẩm định độc lập toàn diện các tệp tin và thành phần mã nguồn liên quan đến tính năng Bàn chẩn đoán tương tác CDS, trích xuất tổn thương vi mạch và mặt nạ mạch máu:
1. `frontend/src/components/InteractiveCDSViewer.tsx` (Bàn chẩn đoán tương tác CDS, phổ nhiệt giải phẫu động, bộ lọc quang học Red-Free và định vị tổn thương vi mạch).
2. `frontend/src/services/screeningMapper.ts` (Bộ ánh xạ dữ liệu lâm sàng AI sang định dạng giao diện CDS).
3. `backend/src/main/resources/db/migration/V031__add_detected_anomalies_and_vessel_mask_to_screenings.sql` (Lược đồ cơ sở dữ liệu lưu trữ mảng tổn thương và mặt nạ mạch máu).
4. `backend/src/main/java/com/aura/screening/service/GeminiRetinalAiService.java` (AI Engine Multimodal Vision phân tích võng mạc).
5. `backend/src/main/java/com/aura/screening/service/ScreeningService.java` (Dịch vụ điều phối sàng lọc, xử lý rủi ro và chữ ký số bác sĩ).
6. `backend/src/main/java/com/aura/screening/entity/Screening.java` & `backend/src/main/java/com/aura/screening/dto/ScreeningResponse.java` (Thực thể dữ liệu và DTO phản hồi API).
7. Rà soát liên đới: `ScreeningController.java` và `PatientAccessService.java` (Kiểm soát truy cập RBAC và phòng chống IDOR).

---

## 2. KẾT QUẢ THẨM ĐỊNH THEO 3 TRỤC BẮT BUỘC

### TRỤC 1: AN TOÀN LÂM SÀNG & KHÔNG CHẨN ĐOÁN TỰ ĐỘNG (CLINICAL SAFETY & CDS BOUNDARY)

| STT | Tiêu Chí Kiểm Tra | Yêu Cầu Lâm Sàng | Hiện Trạng Trong Mã Nguồn | Đánh Giá |
| :---: | :--- | :--- | :--- | :---: |
| 1.1 | **Tuyên bố miễn trừ y tế bắt buộc** | Luôn hiện diện thường trực trên bàn chẩn đoán CDS, hỗ trợ cả chế độ chuẩn và buồng tối; không bị che khuất hay ẩn đi. | `<MedicalDisclaimer variant={isDarkRoom ? 'subtle' : 'compact'} />` đặt cố định tại chân component `InteractiveCDSViewer.tsx` (dòng 828-831). Chuỗi thông điệp tuân thủ 100% chuẩn y tế: *"Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."* | **ĐẠT (PASS)** |
| 1.2 | **Ranh giới phần mềm CDS** | Không đưa ra chẩn đoán xác định tự động (Definitive Diagnosis); không tự ý kê đơn thuốc hoặc phác đồ điều trị xâm lấn. | Mọi ca sàng lọc mới đều lưu ở trạng thái `ScreeningStatus.ANALYZED`. `generateRecommendations()` trong `ScreeningService.java` chỉ đưa ra lời khuyên sinh hoạt, mốc thời gian tái khám và theo dõi chỉ số. Quyết định lâm sàng cuối cùng thuộc về bác sĩ qua quy trình ký số `addDoctorReview()` (`ScreeningStatus.REVIEWED`). | **ĐẠT (PASS)** |
| 1.3 | **Cơ chế chống False Reassurance** | Khi điểm nguy cơ $\ge 40$ (Moderate, High, Critical) mà mảng tổn thương khu trú rỗng (`anomalies.length === 0`), tuyệt đối cấm hiển thị nhãn xanh "Vi mạch bình thường". Bắt buộc cảnh báo biến đổi vi mạch toàn thể. | Phân nhánh an toàn y tế trong `InteractiveCDSViewer.tsx` (dòng 550-566, 663-679, 738-789): Khi `anomalies.length === 0` và `riskScore >= 40`: Cấm nhãn xanh; hiển thị Banner hổ phách: *"Cảnh báo: Biến đổi vi mạch toàn thể / lan tỏa (Không phát hiện ổ khu trú đơn độc)"* kèm khuyến nghị: *"Chỉ số nguy cơ vi mạch (${riskScore}/100) phản ánh tình trạng biến đổi vi tuần hoàn toàn diện... Vui lòng đối chiếu phổ nhiệt Grad-CAM và tham vấn bác sĩ chuyên khoa."* | **ĐẠT (PASS)** |
| 1.4 | **Bản đồ nhiệt Grad-CAM giải phẫu** | Bám sát giải phẫu OD vs OS (hoàng điểm, gai thị, cung mạch thái dương trên/dưới); tập trung điểm nóng vào tổn thương thực tế. | Hàm `renderAnatomicalHeatmap()` (dòng 194-281): Tự động căn chỉnh hoàng điểm và gai thị theo bên mắt (OD: hoàng điểm phía thái dương bên phải ~64%, gai thị bên trái ~32%; OS: hoàng điểm bên trái ~36%, gai thị bên phải ~68%). Lan tỏa cung mạch thái dương trên/dưới khi nguy cơ $\ge 40$ và hội tụ tâm nhiệt đỏ rực tại chính xác tọa độ tổn thương thực tế. | **ĐẠT (PASS)** |
| 1.5 | **Chuẩn hóa 5 tổn thương vi mạch** | Tuân thủ thuật ngữ nhãn khoa quốc tế (ICDR/AAO) và phân tầng màu sắc y tế cảnh báo trực quan. | 5 loại tổn thương: `Microaneurysm`, `Hemorrhage`, `Hard_Exudate`, `AV_Nipping`, `Focal_Narrowing`. `getAnomalyMedicalTheme()` phân tầng màu sắc: Rose/Đỏ cho Hemorrhage (xuất huyết), Amber/Vàng cho Microaneurysm (vi phình mạch), Yellow cho Hard_Exudate (xuất tiết cứng), Orange cho AV_Nipping (bắt chéo mạch) và Focal_Narrowing (co hẹp lòng mạch). | **ĐẠT (PASS)** |

---

### TRỤC 2: NGUYÊN TẮC KHÔNG MOCK TRONG PRODUCTION (NO MOCK IN PRODUCTION)

| STT | Tiêu Chí Kiểm Tra | Yêu Cầu Kỹ Thuật | Hiện Trạng Trong Mã Nguồn | Đánh Giá |
| :---: | :--- | :--- | :--- | :---: |
| 2.1 | **Nguồn gốc dữ liệu suy luận** | Dữ liệu tổn thương vi mạch xuất phát từ AI Engine thật hoặc bóc tách từ ảnh chụp thật; không sinh tọa độ ngẫu nhiên. | Không sử dụng `Math.random()`. `GeminiRetinalAiService.java` gửi ảnh trực tiếp (Multimodal Vision) tới mô hình `ag/gemini-3.7-flash-high` qua 9router/Cloud Endpoint; AI Engine quét gai thị, hoàng điểm và cây mạch máu để trích xuất mảng JSON `detectedAnomalies` thật. Khi mắt bình thường, prompt bắt buộc trả về `detectedAnomalies: []`. | **ĐẠT (PASS)** |
| 2.2 | **Xử lý sự cố ngoại vi an toàn (Fail-Safe Handling)** | Khi AI Engine mất kết nối, timeout hoặc trả về lỗi, hệ thống phải xử lý an toàn, không trả về dữ liệu giả lập. | Trong `ScreeningService.java` (dòng 391-411): Khi AI trả về rỗng hoặc ngoại lệ mạng, hệ thống đặt trạng thái `ScreeningStatus.FAILED`, gán `riskLevel = null`, `riskScore = null`, `confidence = null`, `detectedAnomalies = "[]"` và lưu thông báo rõ ràng cho bác sĩ. Ảnh chụp gốc được lưu giữ nguyên bản để phân tích lại, không sinh số liệu an tâm giả. | **ĐẠT (PASS)** |
| 2.3 | **Không nhầm lẫn Confidence & Risk Score** | Nghiêm cấm lấy `confidence * 100` làm điểm nguy cơ bệnh nhân. | `screeningMapper.ts` (dòng 80-86) và `ScreeningService.java` (dòng 265-274) phân định rạch ròi: Lấy `riskScore` của bệnh lý (0-100); `confidence` được giữ nguyên là chỉ số độ tin cậy thống kê của mô hình. | **ĐẠT (PASS)** |

---

### TRỤC 3: AN NINH THÔNG TIN & BẢO VỆ DỮ LIỆU Y TẾ (SECURITY & HIPAA/PHI COMPLIANCE)

| STT | Tiêu Chí Kiểm Tra | Yêu Cầu An Ninh | Hiện Trạng Trong Mã Nguồn | Đánh Giá |
| :---: | :--- | :--- | :--- | :---: |
| 3.1 | **Bảo vệ dữ liệu định danh (PII/PHI)** | Các trường mới `detected_anomalies` và `vessel_mask_url` không chứa thông tin định danh bệnh nhân. | Cột `detected_anomalies` trong `V031` chỉ lưu mảng JSON các đối tượng vi phẫu hình học (`id`, `type`, `coordinates: {x,y,w,h}`, `confidence`, `description`). Tuyệt đối không chứa tên, ngày sinh, số CMND/CCCD hay mã số bệnh nhân. Payload gửi AI chỉ chứa `eye` và ảnh võng mạc, không chứa PII. | **ĐẠT (PASS)** |
| 3.2 | **Kiểm soát phân quyền RBAC & Chống IDOR** | Endpoint `/api/v1/screenings` phải kiểm soát quyền sở hữu tài nguyên nghiêm ngặt, chống truy cập chéo giữa các bệnh nhân/bác sĩ. | `ScreeningController.java` tích hợp `@PreAuthorize` kết hợp `PatientAccessService`: Bệnh nhân chỉ xem được ca khám của chính mình (`principal.id == patientId`); Bác sĩ chỉ được xem và ký duyệt ca khám của bệnh nhân được phân công có trạng thái `ACTIVE` (`assignmentRepository.existsByDoctorIdAndPatientIdAndStatus`); Cấm bác sĩ ngoài luồng thao tác. | **ĐẠT (PASS)** |
| 3.3 | **Quản lý khóa bí mật & Không lộ Secrets** | Tuyệt đối không commit hoặc in API key, JWT secret, chữ ký số vào mã nguồn hoặc log file. | API Key và Signature Secret được cấu hình qua Spring Boot property placeholders (`${GEMINI_API_KEY:}`, `${REVIEW_SIGNATURE_SECRET:...}`). Các log máy chủ trong `GeminiRetinalAiService.java` và `ScreeningService.java` chỉ ghi thông tin mô hình và UUID, không in API Key hay Private Secret. | **ĐẠT (PASS)** |
| 3.4 | **An toàn Deserialize & Chống Injection** | Xử lý an toàn chuỗi JSON và câu truy vấn database. | Lưu trữ qua Flyway migration an toàn `V031`; thao tác JPA qua PreparedStatement chống SQLi; Deserialize chuỗi JSON bằng `Jackson ObjectMapper` và `JSON.parse` có kiểm tra `Array.isArray()`, loại trừ rủi ro Insecure Deserialization và Prototype Pollution; React JSX render text chống XSS. | **ĐẠT (PASS)** |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC NGHIỆM

1. **Backend Verification (Java 21 / Spring Boot 3.5.x)**:
   - Lệnh kiểm tra: `mvn test-compile`
   - Kết quả: **BUILD SUCCESS** (0 compilation errors).
2. **Clinical UI & Safety Test Suite (`frontend/src/tests/clinical-ui-components.test.ts`)**:
   - **96/96 Tests PASS (100%)**, trong đó:
     * `DISCLAIMER-1` đến `DISCLAIMER-9`: Tuyên bố miễn trừ y tế luôn hiện diện bắt buộc trên các màn hình lâm sàng.
     * `VIEWER-6`: Xử lý ca bình thường (0 tổn thương khu trú, nguy cơ thấp) hiển thị Banner âm tính lâm sàng.
     * `VIEWER-6B`: Xử lý ca nguy cơ $\ge 40$ khi 0 tổn thương khu trú kích hoạt Banner cảnh báo biến đổi vi mạch toàn thể (Anti False Reassurance).
     * `VIEWER-7` & `VIEWER-11`: Bộ lọc quang học Red-Free tách kênh xanh lá 540nm và Chế độ Buồng tối Fluorescein.
     * `VIEWER-8` & `VIEWER-10`: Marker tổn thương vi mạch nhấp nháy trực quan và phân loại màu sắc y tế chuẩn.
     * `VIEWER-9`: Thuật toán phổ nhiệt giải phẫu động bám sát cấu trúc hoàng điểm / gai thị OD và OS.
3. **Clinical E2E Verification Suite (`frontend/src/tests/clinical-verification.test.ts`)**:
   - **15/15 Tests PASS (100%)**, bao gồm kiểm tra tính toàn vẹn của `mapScreeningToAIRiskResult` và phân giải an toàn `detectedAnomalies`.
4. **AI Analysis Workflow Suite (`frontend/src/tests/ai-analysis-flow.test.ts`)**:
   - **10/10 Tests PASS (100%)**.

---

## 4. BẢNG KIỂM TRA 6 TIÊU CHÍ AN TOÀN LÂM SÀNG CỐT LÕI (AURA MEDICAL SAFETY CHECKLIST)

- [x] **Tiêu chí 1 - Không chẩn đoán xác định tự động**: Hệ thống định vị là công cụ hỗ trợ quyết định lâm sàng (CDS), ca khám chưa duyệt luôn ở trạng thái `ANALYZED`.
- [x] **Tiêu chí 2 - Không kê đơn / can thiệp điều trị tự động**: Khuyến nghị chỉ mang tính dự phòng và nhắc nhở thời hạn tái khám.
- [x] **Tiêu chí 3 - Bác sĩ ký duyệt bắt buộc**: Bác sĩ có thẩm quyền điều chỉnh, gán mã ICD-10 và tạo chữ ký số HMAC-SHA256 bất biến.
- [x] **Tiêu chí 4 - Cảnh báo miễn trừ y tế hiện diện thường trực**: `<MedicalDisclaimer />` hiện diện tại mọi màn hình kết quả và CDS.
- [x] **Tiêu chí 5 - Bảo tồn tính toàn vẹn ảnh gốc**: Ảnh màu đáy mắt được giữ nguyên tỷ lệ, hỗ trợ thanh trượt Opacity đưa về 0% để đối chiếu tổn thương thực thể.
- [x] **Tiêu chí 6 - Kiểm soát triệt để False Negative & False Reassurance**: Ca nguy cơ cao không tổn thương khu trú được chuyển hướng cảnh báo lan tỏa; ca lỗi không sinh số liệu giả.

---

## 5. KẾT LUẬN & TUYÊN BỐ KÝ DUYỆT (SIGN-OFF DECLARATION)

Căn cứ vào kết quả thẩm định độc lập mã nguồn, kiểm tra an ninh cơ sở dữ liệu và xác nhận dữ liệu kiểm thử thực nghiệm:
- Tính năng Bàn chẩn đoán tương tác CDS (`InteractiveCDSViewer`), bộ chuyển đổi dữ liệu (`screeningMapper`), kịch bản cơ sở dữ liệu (`V031`), dịch vụ AI (`GeminiRetinalAiService`) và nghiệp vụ sàng lọc (`ScreeningService`) đạt 100% tiêu chuẩn An toàn Y sinh (Medical Safety) và An ninh Dữ liệu Y tế (HIPAA/PHI Security).
- Không phát hiện bất kỳ lỗi An toàn Y khoa hay Lỗ hổng An ninh nào ở mức độ `CRITICAL` hoặc `HIGH`.

### QUYẾT ĐỊNH PHÊ DUYỆT:
# **[X] CHẤP THUẬN AN TOÀN Y KHOA & AN NINH (APPROVED - PASS 100%)**

*Ký duyệt bởi:*  
**Chuyên Gia Thẩm Định An Toàn Y Khoa (Medical Safety Reviewer)**  
**Kỹ Sư An Ninh & Quyền Riêng Tư (Security & Privacy Engineer)**  
*Dự án AURA - Retinal Vascular Health Screening System*
