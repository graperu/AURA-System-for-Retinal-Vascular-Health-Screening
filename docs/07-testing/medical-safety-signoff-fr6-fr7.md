# BIÊN BẢN THẨM ĐỊNH AN TOÀN Y KHOA (MEDICAL SAFETY COMPLIANCE SIGN-OFF)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL SCREENING SYSTEM)
**Mã thẩm định:** `AURA-MSR-2026-003`  
**Ngày thẩm định:** 13/09/2026  
**Chuyên gia thẩm định:** Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập (Medical Safety Reviewer)  
**Phạm vi thẩm định:** Tính năng Lịch sử khám sàng lọc (FR-6) & Báo cáo y tế võng mạc (FR-7)  
**Căn cứ pháp lý & quy chuẩn:** CE-MDR / FDA SaMD / Quyết định 5488/QĐ-BYT / Bộ quy tắc Medical Safety AURA / Cổng chất lượng QG6  

---

## 1. TỔNG QUAN HỒ SƠ THẨM ĐỊNH

| Hạng mục | Nội dung chi tiết |
| :--- | :--- |
| **Tính năng thẩm định** | FR-6: Lịch sử khám & theo dõi tiến trình (Patient History View)<br/>FR-7: Báo cáo y tế sàng lọc vi mạch võng mạc (Medical Report Modal - PDF/CSV) |
| **Đối tượng sử dụng** | Bệnh nhân (USER), Bác sĩ chuyên khoa mắt/tim mạch (DOCTOR) |
| **Tệp tin mã nguồn rà soát** | 1. `frontend/src/components/MedicalReportModal.tsx`<br/>2. `frontend/src/features/patient/PatientHistoryView.tsx`<br/>3. `frontend/src/services/screeningMapper.ts`<br/>4. `frontend/src/pages/PatientPortalPage.tsx` |
| **Tài liệu căn cứ** | `docs/03-architecture/sdd-clinical-screening-and-reporting.md`<br/>`docs/adr/ADR-005-clinical-screening-mapper-and-medical-report.md`<br/>`.kilo/rules/medical-safety.md` |
| **Bộ kiểm thử lâm sàng** | `frontend/src/tests/clinical-verification.test.ts` (14/14 Passed) |

---

## 2. BẢNG ĐÁNH GIÁ 6 TIÊU CHÍ AN TOÀN LÂM SÀNG CỐT LÕI

| STT | Tiêu chí an toàn lâm sàng | Tiêu chuẩn bắt buộc | Kết quả rà soát thực tế | Đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Không chẩn đoán xác định tự động**<br/>*(No Definitive Diagnosis)* | Hệ thống CDS chỉ định hướng nguy cơ, không khẳng định kết luận bệnh lý cuối cùng. | - Tên báo cáo phân định rõ ràng: "Phiếu Báo Cáo Y Tế Chính Thức" (đã duyệt) vs "Báo Cáo Sàng Lọc Sơ Bộ AURA AI - Đang Chờ Bác Sĩ Thẩm Định" (chưa duyệt).<br/>- Các đầu mục phân tích rủi ro ghi rõ: "Đánh Giá Nguy Cơ Lâm Sàng Từ Mô Hình AI", thể hiện bằng điểm phần trăm xác suất, không kết luận bệnh nhân đã mắc bệnh.<br/>- Khuyến nghị sơ bộ AI kèm dòng lưu ý: *"Đây là đánh giá định hướng tự động của mô hình AURA AI, chưa phải kết luận lâm sàng chính thức từ bác sĩ."* | **ĐẠT**<br/>(COMPLIANT) |
| **2** | **Không kê đơn / điều trị xâm lấn**<br/>*(No Auto-Prescription)* | Tuyệt đối cấm tự ý kê đơn thuốc, liều dùng, hoặc phác đồ điều trị xâm lấn. | - Mã nguồn và giao diện không chứa bất kỳ logic kê đơn thuốc hay chỉ định thuốc tự động.<br/>- Khuyến nghị mặc định khi AI phân tích xong: Hướng dẫn bệnh nhân đặt lịch tái khám tại cơ sở y tế chuyên khoa mắt hoặc tim mạch để bác sĩ thẩm định. | **ĐẠT**<br/>(COMPLIANT) |
| **3** | **Cổng kiểm duyệt & Ký số của Bác sĩ**<br/>*(Doctor Review & Signature Gate)* | Ca nguy cơ phải qua bác sĩ chuyên khoa duyệt và lưu vết chữ ký số, thời điểm ký, ghi chú lâm sàng. | - Điều kiện nghiêm ngặt: `isReviewed = (result.status === 'REVIEWED' && Boolean(result.digitalSignature))`.<br/>- Ca chưa duyệt: Khóa hoàn toàn hiển thị chữ ký số, hiện badge "Chưa ký số — Bản phân tích sơ bộ", ghi rõ "Chưa có bác sĩ thẩm định", mã ICD-10 ghi nhận chờ bác sĩ chỉ định.<br/>- Ca đã duyệt: Hiển thị đầy đủ định danh bác sĩ, nhãn ký số SHA-256, thời điểm ký thực tế (`signedAt`), mã băm chữ ký điện tử, ghi chú lâm sàng của bác sĩ (`doctorNotes`), danh mục mã ICD-10 chuẩn. | **ĐẠT**<br/>(COMPLIANT) |
| **4** | **Kiểm soát Tuyên bố miễn trừ y tế**<br/>*(Medical Disclaimer Enforcement)* | Thông điệp miễn trừ bắt buộc hiện diện trên Modal UI, Bản in PDF và File xuất CSV. | - **Modal UI**: Banner viền amber nổi bật với icon cảnh báo `AlertTriangle` và nội dung chuẩn: *"Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."*<br/>- **Bản in PDF**: Nằm trong vùng `#printable-report`, không có class `print:hidden`, in đầy đủ trên văn bản giấy/PDF.<br/>- **Tệp CSV**: Đặt ngay tại dòng 1 của tệp xuất: `['TUYEN BO MIEN TRU TRACH NHIEM Y TE', MEDICAL_DISCLAIMER]`. | **ĐẠT**<br/>(COMPLIANT) |
| **5** | **Bảo tồn ảnh gốc & Minh bạch Grad-CAM**<br/>*(Original Image & Grad-CAM Transparency)* | Lưu giữ ảnh màu đáy mắt gốc, hiển thị bản đồ nhiệt Grad-CAM khách quan hỗ trợ bác sĩ. | - Giao diện báo cáo và bàn khám hiển thị song song ảnh chụp đáy mắt màu gốc (True Color Fundus) và bản đồ nhiệt Grad-CAM chồng lớp với hiệu ứng `mix-blend-screen opacity-85`.<br/>- Hỗ trợ đối chiếu đồng thời cả 2 mắt (Mắt Phải OD & Mắt Trái OS) với 4 khung hình độc lập, giúp phát hiện tổn thương bất đối xứng hai bán cầu võng mạc. | **ĐẠT**<br/>(COMPLIANT) |
| **6** | **Kiểm soát False Negative & Chất lượng ảnh**<br/>*(False Negative & Quality Control)* | Ca không đạt quang học hoặc điểm số biên phải được cảnh báo kiểm tra lại thay vì gán bình thường. | - Trạng thái `FAILED` được thể hiện rõ ràng trên bảng lịch sử với icon `XCircle` màu đỏ.<br/>- 4 chỉ số sinh học định lượng có kiểm tra trường hợp `val <= 0` trả về trạng thái cảnh báo *"Chưa đủ dữ liệu phân tích"*, ngăn chặn việc kết luận bình thường giả tạo khi ảnh thiếu dữ liệu đo đạc. | **ĐẠT**<br/>(COMPLIANT) |

---

## 3. RÀ SOÁT CHI TIẾT TỪNG TỆP TIN

### 3.1. `frontend/src/services/screeningMapper.ts`
- **Xử lý Điểm rủi ro (Risk Score)**:
  - Công thức đã chuẩn hóa: `overallScore = Math.round(screening.riskScore ?? screening.overallVascularRiskScore ?? ((cvdScore + drScore) / 2))`.
  - **Triệt tiêu hoàn toàn lỗi lâm sàng nghiêm trọng**: Đã loại bỏ 100% phép tính `screening.confidence * 100`. Độ tin cậy mô hình toán học không còn bị đánh tráo thành điểm nguy cơ bệnh học.
- **Triệt tiêu Tọa độ tổn thương giả lập (No Mock in Production)**:
  - Hàm `generateAnomaliesFromMetrics` cùng các tọa độ gán cứng (`ANO-AV-1`, `ANO-MA-2`, `ANO-HEM-3`) đã bị xóa bỏ hoàn toàn.
  - Mảng tổn thương vi mạch `detectedAnomalies` chỉ trích xuất từ dữ liệu thực do AI/Database cung cấp; nếu không có tổn thương thật, trả về mảng rỗng `[]`.
- **Ánh xạ trường CSDL đầy đủ**:
  - `riskScore`, `eyePosition`, `scanType`, `icd10Codes` (qua hàm `parseIcd10Codes` hỗ trợ cả JSON array lẫn chuỗi phân tách), `doctorNotes`, `digitalSignature`, `signedAt`, `createdAt`, `doctorName`.

### 3.2. `frontend/src/components/MedicalReportModal.tsx`
- **Bảo đảm tính pháp lý & Tuyên bố miễn trừ**:
  - Thông điệp miễn trừ y tế (`MEDICAL_DISCLAIMER`) xuất hiện đồng nhất tại:
    1. Modal xem trực tiếp (Mục banner cảnh báo vàng cam).
    2. Tệp in phiếu / xuất PDF (được in đầy đủ trong layout khổ giấy A4).
    3. Tệp xuất dữ liệu bảng tính CSV (dòng đầu tiên).
- **Cổng thẩm định bác sĩ 2 trạng thái**:
  - Trạng thái `!isReviewed`: Khóa chữ ký số, tiêu đề là bản sơ bộ, ghi nhận rõ chưa có bác sĩ thẩm định.
  - Trạng thái `isReviewed`: Hiển thị định danh bác sĩ, nhãn xác nhận ký số SHA-256, thời điểm ký thực tế trích xuất từ `signedAt`, chuỗi hash bảo mật và ghi chú chuyên môn.
- **Thời gian khám**:
  - Sử dụng ngày giờ thực tế của ca khám (`examDate = result.createdAt ? new Date(result.createdAt) : new Date()`), chấm dứt lỗi lấy `new Date()` hiện tại của thời điểm mở modal.
- **Báo cáo đối chiếu 2 mắt (Dual-Eye OD & OS)**:
  - Hỗ trợ hiển thị và xuất báo cáo đối chiếu song song Mắt Phải (OD) và Mắt Trái (OS) với đầy đủ 4 ảnh đáy mắt, bảng biomarkers 2 cột và nhận định độc lập từng mắt.

### 3.3. `frontend/src/features/patient/PatientHistoryView.tsx`
- **Cấu trúc bảng lịch sử**:
  - Tái sử dụng thành phần chuẩn `DataTable`, hiển thị đầy đủ 7 cột thông tin y khoa:
    1. Ngày & Giờ Khám (định dạng `vi-VN` 2 dòng: ngày và giờ).
    2. Mắt Khám (OD / OS / Hai mắt).
    3. Loại Ảnh Chụp (Fundus Hoàng Điểm, Đĩa Thị, Cắt lớp OCT).
    4. Mức Độ Nguy Cơ (RiskBadge theo mã màu y tế chuẩn: Low, Moderate, High, Severe).
    5. Điểm Rủi Ro (Thang điểm chuẩn 0-100 với badge phân cấp màu).
    6. Trạng Thái Ca Khám (Phân biệt rõ: "Đã duyệt lâm sàng", "Đã phân tích AI", "Thất bại", "Đang xử lý").
    7. Thao Tác (Nút "Xem Bản Đồ Nhiệt" và "Xuất Báo Cáo").
- **Bộ lọc & Tìm kiếm**:
  - Lọc theo Vị trí Mắt (`ALL`, `OD`, `OS`, `BOTH`).
  - Lọc theo Mức độ Nguy cơ (`ALL`, `LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
  - Tìm kiếm toàn văn theo mã khám, tên bác sĩ, ghi chú lâm sàng.
  - Nút làm mới dữ liệu (`RefreshCw`) kết nối trực tiếp với backend.

### 3.4. `frontend/src/pages/PatientPortalPage.tsx`
- **Loại bỏ mã trùng lặp & Thống nhất kiến trúc**:
  - Bảng HTML `<table>` inline thô sơ cũ tại tab Lịch sử khám đã được thay thế hoàn toàn bằng component chuyên dụng `PatientHistoryView`.
  - Kết nối luồng dữ liệu hai chiều: Bấm "Xem Bản Đồ Nhiệt" nạp chi tiết ca khám vào `InteractiveCDSViewer`; bấm "Xuất Báo Cáo" mở `MedicalReportModal`.
  - Dữ liệu lịch sử nạp trực tiếp từ API backend (`screeningApi.getAll()`) với các trường lâm sàng thật từ CSDL PostgreSQL.

---

## 4. THẨM ĐỊNH TÍNH KHOA HỌC CỦA CÁC CHỈ SỐ BIOMARKERS ĐỊNH LƯỢNG

Hệ thống đã triển khai 4 hàm đánh giá tự động dựa trên ngưỡng tham chiếu y văn quốc tế:

1. **Tỷ lệ Động mạch / Tĩnh mạch võng mạc (Arteriolar-to-Venular Ratio - A/V Ratio)**:
   - Ngưỡng chuẩn sinh học: $\ge 0.67$ (tỷ lệ bình thường 2:3).
   - Phân loại đánh giá:
     * $val \le 0$: *"Chưa đủ dữ liệu phân tích"* (xử lý fail-safe).
     * $val \ge 0.67$: *"Tỷ lệ A/V trong giới hạn bình thường (≥ 0.67)"* (Xanh emerald).
     * $0.55 \le val < 0.67$: *"Hẹp nhẹ tiểu động mạch võng mạc (0.55 - 0.66)"* (Vàng amber).
     * $val < 0.55$: *"Co thắt tiểu động mạch võng mạc đáng kể (< 0.55)"* (Đỏ rose).
   - *Cơ sở y học*: Hẹp tiểu động mạch võng mạc khu trú hoặc lan tỏa là dấu hiệu tiền lâm sàng quan trọng của bệnh võng mạc tăng huyết áp (Keith-Wagener-Barker Grade I-II) và nguy cơ đột quỵ thiếu máu não cục bộ.

2. **Mật độ Vi Mạch Võng Mạc (Vessel Density Percentage)**:
   - Ngưỡng chuẩn sinh học: $15.5\% - 19.0\%$.
   - Phân loại đánh giá:
     * $val \le 0$: *"Chưa đủ dữ liệu phân tích"*.
     * $val < 15.5\%$: *"Giảm tưới máu vi mạch võng mạc (< 15.5%)"* (Đỏ rose).
     * $val > 19.0\%$: *"Tăng sinh vi mạch hoặc phù nề (> 19.0%)"* (Vàng amber).
     * $15.5\% \le val \le 19.0\%$: *"Mật độ tưới máu mao mạch đạt tiêu chuẩn (15.5% - 19.0%)"* (Xanh emerald).
   - *Cơ sở y học*: Giảm mật độ mao mạch vùng cực sau cảnh báo thiếu máu võng mạc (retinal ischemia) trong bệnh võng mạc đái tháo đường (DR); tăng mật độ bất thường có thể do tân mạch (neovascularization) hoặc ứ trệ tuần hoàn tĩnh mạch.

3. **Chỉ số Uốn Lượn Mạch Máu (Vascular Tortuosity Index)**:
   - Ngưỡng chuẩn sinh học: $< 1.25$.
   - Phân loại đánh giá:
     * $val \le 0$: *"Chưa đủ dữ liệu phân tích"*.
     * $val < 1.25$: *"Độ uốn lượn mạch máu bình thường (< 1.25)"* (Xanh emerald).
     * $1.25 \le val < 1.40$: *"Uốn lượn trung bình liên quan huyết áp (1.25 - 1.40)"* (Vàng amber).
     * $val \ge 1.40$: *"Mạch máu ngoằn ngoèo bất thường (≥ 1.40)"* (Đỏ rose).
   - *Cơ sở y học*: Sự gia tăng độ uốn lượn của các nhánh mạch máu phản ánh tình trạng quá tải áp lực thành mạch kéo dài do tăng huyết áp mạn tính, rối loạn lipid máu hoặc tắc nghẽn tĩnh mạch võng mạc.

4. **Tỷ lệ Lõm Gai / Gai Thị Theo Trục Đứng (Vertical Cup-to-Disc Ratio - VCDR)**:
   - Ngưỡng chuẩn sinh học: $< 0.50$.
   - Phân loại đánh giá:
     * $val \le 0$: *"Chưa đủ dữ liệu phân tích"*.
     * $val < 0.50$: *"Hình thái gai thị bình thường (< 0.50)"* (Xanh emerald).
     * $0.50 \le val < 0.70$: *"Lõm gai mở rộng sinh lý/nghi ngờ sớm (0.50 - 0.69)"* (Vàng amber).
     * $val \ge 0.70$: *"Lõm gai rộng bất thường, cần tầm soát Glaucoma (≥ 0.70)"* (Đỏ rose).
   - *Cơ sở y học*: VCDR là chỉ số kinh điển trong tầm soát bệnh Glocom (tăng nhãn áp). VCDR $\ge 0.70$ hoặc bất cân xứng giữa hai mắt $> 0.2$ đòi hỏi phải chỉ định đo thị trường và đo nhãn áp cấp thiết.

---

## 5. BẰNG CHỨNG THỰC NGHIỆM LÂM SÀNG (AUTOMATED TEST SUITE)

Bộ kiểm thử lâm sàng chuyên biệt `frontend/src/tests/clinical-verification.test.ts` đã được thực thi và đạt kết quả tuyệt đối:

```text
=================================================================
   AURA CLINICAL E2E VERIFICATION SUITE (FR-6 & FR-7)
=================================================================

--- 1. Kiểm thử Luồng Lịch Sử Khám Sàng Lọc (FR-6) ---
  [PASS] FR-6.1: Bảng lịch sử có cấu trúc đầy đủ 7 cột thông tin chuẩn
  [PASS] FR-6.2: Bộ lọc theo Vị trí Mắt (ALL / OD / OS / BOTH)
  [PASS] FR-6.3: Bộ lọc theo Mức Độ Rủi Ro (LOW / MODERATE / HIGH / CRITICAL)
  [PASS] FR-6.4: Ô tìm kiếm đa trường (Mã khám, Bác sĩ, Ghi chú lâm sàng)
  [PASS] FR-6.5: Nạp ca khám được chọn vào Viewer và Modal Báo cáo

--- 2. Kiểm thử Xuất Báo Cáo Y Tế & An Toàn Lâm Sàng (FR-7) ---
  [PASS] FR-7.1: Tuyên bố miễn trừ trách nhiệm y tế (Medical Disclaimer) đầy đủ và chính xác
  [PASS] FR-7.2: Trích xuất và hiển thị danh mục mã ICD-10 linh hoạt
  [PASS] FR-7.3: Đánh giá lâm sàng sinh học vi mạch thay đổi linh hoạt theo số đo thực tế
  [PASS] FR-7.4: Cổng kiểm tra bác sĩ (Ca chưa duyệt ANALYZED vs Ca đã duyệt REVIEWED)
  [PASS] FR-7.5: Tệp CSV xuất ra có BOM UTF-8, định danh chuẩn và ngày khám chính xác
  [PASS] FR-7.6: mapScreeningToAIRiskResult tuân thủ an toàn y khoa, không sinh điểm giả
  [PASS] FR-7.7: Báo cáo đối chiếu song song 2 mắt (Dual Eye OD & OS) và xuất CSV
  [PASS] FR-7.8: Xử lý an toàn các giá trị biên (Edge Cases: null MRN, invalid date, score = 0/100)
  [PASS] NFR-3: Hiệu năng xử lý và lọc danh sách (Phản hồi < 50ms, đáp ứng chuẩn NFR-3 < 3s)

=================================================================
   KẾT QUẢ KIỂM THỬ: 14/14 TESTS ĐÃ ĐẠT (100% PASS)
=================================================================
```

Biên dịch mã nguồn Frontend: `tsc && vite build` hoàn thành không phát sinh lỗi (`built in 20.56s`).

---

## 6. KẾT LUẬN THẨM ĐỊNH CHÍNH THỨC

Căn cứ vào kết quả thẩm định độc lập về ranh giới can thiệp y tế, đạo đức y sinh, kiểm soát rủi ro âm tính giả, tính pháp lý chữ ký số và bằng chứng thực nghiệm mã nguồn:

### **KẾT LUẬN: CHẤP THUẬN AN TOÀN (APPROVED)**

- **Cổng Chất Lượng Y Khoa (QG6)**: **ĐẠT (PASS)**.
- **Ranh giới CDS**: Được kiểm soát chặt chẽ; không có chẩn đoán xác định tự động; không có kê đơn thuốc tự động.
- **Cổng ký duyệt Bác sĩ**: Hoàn toàn minh bạch, chống giả lập trạng thái đã duyệt; lưu vết đầy đủ chữ ký điện tử HMAC-SHA256, thời điểm ký và ghi chú chuyên môn.
- **Tuyên bố miễn trừ y tế**: Hiện diện bắt buộc 100% trên giao diện người dùng, bản in PDF và tệp xuất CSV.
- **Tính toàn vẹn dữ liệu**: Đã triệt tiêu hoàn toàn mã giả (`generateAnomaliesFromMetrics`) và công thức sai lệch (`confidence * 100`).
- **Khuyến nghị tiếp theo**: Bàn giao hồ sơ thẩm định cho `code-reviewer` và `scrum-master` để tiến hành các bước kiểm tra chất lượng tiếp theo theo quy trình dự án.
