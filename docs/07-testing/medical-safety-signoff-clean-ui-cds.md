# BIÊN BẢN THẨM ĐỊNH AN TOÀN Y KHOA (MEDICAL SAFETY COMPLIANCE SIGN-OFF)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL CLINICAL DECISION SUPPORT)

---

- **Người thẩm định**: Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập (Medical Safety Reviewer)
- **Đối tượng thẩm định**: Toàn bộ thay đổi giao diện theo triết lý Clean UI & CDS Workstation vừa hoàn thiện trên hệ thống AURA.
- **Mã Cổng Chất Lượng**: Quality Gate QG6 / QG7 (Medical Safety & Clinical UI/UX Compliance)
- **Ngày thẩm định**: 14/09/2026
- **Trạng thái phê duyệt**: **CHẤP THUẬN AN TOÀN (APPROVED - PASS 100%)**

---

## 1. TỔNG QUAN HỒ SƠ THẨM ĐỊNH

Hệ thống AURA là phần mềm y tế hỗ trợ quyết định lâm sàng (Clinical Decision Support - CDS) trong sàng lọc sớm các bệnh lý vi mạch võng mạc và nguy cơ tim mạch. Theo quy chuẩn an toàn y khoa (`medical-safety.md`), mọi cập nhật giao diện Clean UI phải bảo tồn tuyệt đối ranh giới an toàn lâm sàng, không làm suy giảm tính minh bạch y tế, không gây hiểu nhầm về chẩn đoán xác định, và không tạo rủi ro âm tính giả (False Negative).

Hồ sơ kiểm tra bao gồm các thành phần giao diện lâm sàng trọng yếu:
1. `frontend/src/components/ui/MedicalDisclaimer.tsx`
2. `frontend/src/components/ui/RiskBadge.tsx`
3. `frontend/src/components/InteractiveCDSViewer.tsx`
4. `frontend/src/components/ClinicalRiskSummaryCard.tsx`
5. `frontend/src/features/patient/PatientScreeningResultView.tsx`
6. `frontend/src/components/RiskAssessmentPanel.tsx`
7. `frontend/src/components/MedicalReportModal.tsx`
8. `frontend/src/components/DoctorDiagnosisModal.tsx` & `frontend/src/components/ClinicalValidationBar.tsx`
9. Bộ kiểm thử tự động lâm sàng: `frontend/src/tests/clinical-ui-components.test.ts` (33/33 tests PASS), `frontend/src/tests/clinical-verification.test.ts` (14/14 tests PASS), `frontend/src/tests/ai-analysis-flow.test.ts` (10/10 tests PASS).

---

## 2. BẢNG KIỂM TRA 6 TIÊU CHÍ AN TOÀN LÂM SÀNG CỐT LÕI (6-PILLAR CLINICAL SAFETY AUDIT)

| STT | Tiêu Chí An Toàn Lâm Sàng | Tiêu Chuẩn Thẩm Định | Hiện Trạng Thực Tế Trong Codebase | Kết Quả |
| :--- | :--- | :--- | :--- | :---: |
| **1** | **Không chẩn đoán xác định tự động (No Definitive Diagnosis)** | Hệ thống tuyệt đối không công bố kết quả AI như chẩn đoán bệnh học cuối cùng; chỉ được định danh là sàng lọc nguy cơ CDS. | Trên toàn bộ banner, thẻ tóm tắt và modal, kết quả AI được gán nhãn: *"Kết Quả Sơ Bộ AI - Chờ Bác Sĩ Thẩm Định"*, *"Đánh Giá Nguy Cơ Lâm Sàng AI"*. | **ĐẠT (PASS)** |
| **2** | **Không kê đơn / can thiệp điều trị tự động (No Automated Prescriptions)** | Không tự ý đưa ra đơn thuốc, liều dùng dược chất, hoặc phác đồ điều trị xâm lấn. | Mục khuyến nghị chỉ hướng dẫn: Khám định kỳ, kiểm soát huyết áp & HbA1c, chế độ dinh dưỡng, dấu hiệu cấp cứu cần đến viện mắt ngay. | **ĐẠT (PASS)** |
| **3** | **Bác sĩ ký duyệt & Thẩm quyền chuyên môn (Doctor Sign-Off)** | Mọi ca có nguy cơ đều phải qua thẩm định của bác sĩ chuyên khoa có chứng chỉ hành nghề, lưu vết chữ ký số PKI SHA-256. | Cung cấp `DoctorDiagnosisModal` và `ClinicalValidationBar` cho phép bác sĩ: Duyệt (APPROVED), Hiệu chỉnh (MODIFIED), Bác bỏ (REJECTED), gán mã ICD-10 và ký số điện tử. | **ĐẠT (PASS)** |
| **4** | **Cảnh báo miễn trừ y tế bắt buộc (Mandatory Medical Disclaimer)** | Xuất hiện đầy đủ, rõ ràng trên mọi màn hình kết quả AI, bàn chẩn đoán CDS và báo cáo xuất ra (PDF/CSV). | Chuỗi tiêu chuẩn xuất hiện tại tất cả 5 màn hình kết quả và được in ngay dòng đầu tiên của tệp CSV xuất ra. | **ĐẠT (PASS)** |
| **5** | **Bảo tồn toàn vẹn ảnh giải phẫu gốc (Preservation of Original Image)** | Ảnh đáy mắt gốc và heatmap phải giữ nguyên tỷ lệ, không bị co giãn, méo mó giải phẫu (`object-contain`). | Áp dụng triệt để `object-contain` cho toàn bộ ảnh True Color Fundus và ảnh lớp phủ Grad-CAM Heatmap. | **ĐẠT (PASS)** |
| **6** | **Kiểm soát rủi ro Âm tính giả (False Negative Prevention)** | Ca không xác định, ảnh mờ, thiếu dữ liệu phải gán nhãn "Cần thẩm định lại", cấm fallback về Bình thường. | `RiskBadge` xử lý mức `UNVERIFIED`, `INCONCLUSIVE`, `null` thành nhãn *"Cần thẩm định lại"* (icon HelpCircle); biomarkers thiếu hiển thị *"Chưa xác định / Chưa đo được"*. | **ĐẠT (PASS)** |

---

## 3. THẨM ĐỊNH CHI TIẾT 4 HẠNG MỤC THEO YÊU CẦU

### 3.1. Kiểm Tra Sự Hiện Diện Bắt Buộc Của Tuyên Bố Miễn Trừ Y Tế (Medical Disclaimer)

- **Nội dung chuẩn hóa**:
  > *"Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."*
- **Thẩm định triển khai kỹ thuật**:
  - Tệp trung tâm `frontend/src/components/ui/MedicalDisclaimer.tsx` định nghĩa hằng số bất biến `MANDATORY_MEDICAL_DISCLAIMER`.
  - Hỗ trợ đầy đủ thuộc tính trợ năng: `role="note"`, `aria-label="Cảnh báo an toàn y khoa CDS"`, kèm icon trực quan (`AlertCircle` cho banner, `ShieldCheck` cho compact).
- **Rà soát 5 màn hình kết quả AI**:
  1. `ClinicalRiskSummaryCard.tsx` (Dòng 532): Sử dụng `<MedicalDisclaimer variant="banner" />` nằm ngay trước khu vực nút bấm hành động cuối thẻ. Nền màu amber nổi bật, không thể bị che khuất.
  2. `InteractiveCDSViewer.tsx` (Dòng 310-313): Tích hợp `<MedicalDisclaimer variant={isDarkRoom ? 'subtle' : 'compact'} />` ngay chân bàn soi CDS, tự động thích ứng chế độ buồng tối (Dark Room) mà không làm lóa mắt người dùng.
  3. `PatientScreeningResultView.tsx` (Dòng 298): Tích hợp `<MedicalDisclaimer variant="compact" />` ngay dưới bảng 4 chỉ số Biomarkers và phía trên các nút xem báo cáo / tư vấn bác sĩ.
  4. `RiskAssessmentPanel.tsx` (Dòng 170): Tích hợp `<MedicalDisclaimer variant="compact" />` bên dưới 3 cột trụ nguy cơ và bảng thông số sinh học vi mạch võng mạc.
  5. `MedicalReportModal.tsx`:
     - Dòng 296: In trực tiếp tuyên bố miễn trừ y tế trên thân phiếu khám bệnh dạng bản in (Print/PDF).
     - Dòng 133 & 162: Đặt tuyên bố miễn trừ y tế ngay tại **Dòng 1** của file xuất CSV (`['TUYEN BO MIEN TRU TRACH NHIEM Y TE', MEDICAL_DISCLAIMER]`), đảm bảo an toàn pháp lý khi dữ liệu được mở ngoài hệ thống.

### 3.2. Thẩm Định Các Cấp Độ Nguy Cơ (Risk Levels) Và Component RiskBadge

- **Tính chuẩn xác của bảng màu cảnh báo y tế**:
  - `LOW` / `NORMAL`: Nhãn *"Nguy cơ Thấp"*, màu xanh lá y tế (`bg-emerald-50 text-emerald-800 border-emerald-200`), icon `ShieldCheck`. Thể hiện hệ vi mạch bình thường, nguy cơ tim mạch thấp.
  - `MODERATE` / `MEDIUM`: Nhãn *"Nguy cơ Trung bình"*, màu vàng cam y tế (`bg-amber-50 text-amber-800 border-amber-200`), icon `AlertCircle`. Thể hiện dấu hiệu co thắt nhẹ vi mạch.
  - `HIGH`: Nhãn *"Nguy cơ Cao"*, màu cam đậm y tế (`bg-orange-50 text-orange-800 border-orange-200`), icon `AlertTriangle`. Thể hiện tổn thương vi mạch rõ rệt, cần bác sĩ khám sớm.
  - `CRITICAL` / `SEVERE`: Nhãn *"Nguy kịch"*, màu đỏ sẫm in đậm (`bg-red-50 text-red-800 border-red-200 font-bold`), icon `AlertTriangle`. Cảnh báo biến chứng mạch máu cao, đề nghị chuyển viện khẩn cấp.
- **Phòng chống Âm tính giả (False Negative Prevention)**:
  - Mức `UNVERIFIED` / `INCONCLUSIVE` / `REQUIRES_RETEST` và các giá trị không xác định: Hiển thị nhãn *"Cần thẩm định lại"*, tông xám trung tính (`bg-slate-50 text-slate-700 border-slate-200`), icon `HelpCircle`.
  - **Khẳng định an toàn**: Hệ thống tuyệt đối không fallback ca không xác định thành ca "Bình thường" (Low).
  - Đối với các chỉ số sinh học định lượng (A/V Ratio, Vessel Density, Tortuosity, VCDR) trong `ClinicalRiskSummaryCard.tsx`: Khi dữ liệu null, undefined hoặc NaN, hệ thống hiển thị rõ ràng *"Chưa xác định"* / *"Chưa đo được"*, ngăn chặn triệt để hành vi giả lập chỉ số bình thường (No Mock / No Fake Normal).

### 3.3. Thẩm Định Bàn Soi Đáy Mắt CDS (`InteractiveCDSViewer`)

- **Bảo tồn tính toàn vẹn giải phẫu học (`object-contain`)**:
  - Ảnh gốc võng mạc (Left Viewport): `className="max-h-[350px] w-auto object-contain rounded-lg shadow-md"`.
  - Ảnh nền võng mạc (Right Viewport): `className="max-h-[350px] w-auto object-contain rounded-lg"`.
  - Lớp phủ Grad-CAM Heatmap: `className="absolute inset-0 m-auto max-h-[350px] w-auto object-contain rounded-lg pointer-events-none cds-canvas-overlay transition-opacity duration-150"`.
  - **Ý nghĩa lâm sàng**: Giữ nguyên tỷ lệ 1:1 của cấu trúc mạch máu, ngăn ngừa hiện tượng kéo dãn làm sai lệch tỷ lệ lõm gai thị (VCDR) hoặc biến dạng góc phân nhánh động-tĩnh mạch.
- **Thanh trượt Opacity mượt mà & Trực quan**:
  - Sử dụng thẻ input range với cấu hình `min="0" max="1" step="0.05"`, khởi tạo ở mức 65% (mức quan sát tối ưu theo khuyến nghị nhãn khoa).
  - Lớp phủ heatmap có thuộc tính `pointer-events-none` và `transition-opacity duration-150`, cho phép bác sĩ điều chỉnh độ mờ linh hoạt để đối chiếu trực tiếp tổn thương dưới nền ảnh mà không gây lag giật.
  - Tích hợp nhãn trợ năng `aria-label="Độ mờ bản đồ nhiệt AI"`.
- **Chế độ buồng tối khám mắt (Dark Room Mode)**:
  - Tích hợp nút chuyển đổi nhanh buồng tối với biểu tượng Mặt Trăng (`Moon`).
  - Màu nền sử dụng chuẩn Obsidian y tế (`#030712`, `bg-darkroom-bg`), thẻ chẩn đoán sử dụng `bg-darkroom-card`, đường viền `border-darkroom-border`, điểm nhấn màu Cyan `#22D3EE`.
  - Giúp đồng tử bác sĩ không bị lóa khi soi chiếu trong phòng tối chuyên khoa mắt, tăng cường độ tương phản thị giác khi đánh giá các vi phình mạch nhỏ (Microaneurysm).

### 3.4. Thẩm Định Vai Trò Bác Sĩ Trong Chẩn Đoán Lâm Sàng

- **Bảo đảm AI giữ đúng vai trò hỗ trợ CDS**:
  - Khi ca sàng lọc mới chỉ phân tích qua AI và chưa có bác sĩ ký duyệt (`status != 'REVIEWED'`), hệ thống hiển thị các cảnh báo nổi bật:
    - *"Kết Quả Sơ Bộ AI - Chờ Bác Sĩ Thẩm Định"*
    - *"Chưa ký số — Bản phân tích sơ bộ"*
    - *"Lưu ý: Đây là đánh giá định hướng tự động của mô hình AURA AI, chưa phải kết luận lâm sàng chính thức từ bác sĩ."*
- **Quyền quyết định tối cao của Bác sĩ qua `DoctorDiagnosisModal.tsx` & `ClinicalValidationBar.tsx`**:
  - Bác sĩ có toàn quyền thực hiện 3 quyết định lâm sàng:
    1. `APPROVED`: Chấp thuận kết quả gợi ý của AI.
    2. `MODIFIED`: Hiệu chỉnh lại mức độ nguy cơ tim mạch và võng mạc đái tháo đường theo chuyên môn.
    3. `REJECTED`: Bác bỏ hoàn toàn phân tích của AI (trường hợp ảnh kém chất lượng hoặc chẩn đoán sai lệch).
  - Hỗ trợ chọn danh mục mã bệnh lý quốc tế ICD-10 (`H35.0`, `E11.3`, `I10`, `H40.1`, `H35.3`).
  - Cho phép nhập ghi chú chẩn đoán lâm sàng tự do (`clinicalNotes` / `doctorNotes`).
  - Bắt buộc gắn chữ ký số PKI SHA-256 kèm thời điểm ký duyệt (`signedAt`) và danh tính bác sĩ (`signerName`, `signerId`).
  - Chỉ sau khi bác sĩ ký số xác nhận, ca sàng lọc mới được cấp trạng thái `REVIEWED` và xuất phiếu báo cáo y tế chính thức.

---

## 4. KẾT QUẢ THỰC THI KIỂM THỬ TỰ ĐỘNG

Toàn bộ các tiêu chí an toàn lâm sàng trên đã được chứng minh qua bộ kiểm thử tự động toàn diện:
- `frontend/src/tests/clinical-ui-components.test.ts`: **33/33 Tests PASS (100%)**
  - 9/9 Tests Tuyên bố miễn trừ y tế (Medical Disclaimer) trên mọi màn hình.
  - 7/7 Tests RiskBadge (LOW, MODERATE, HIGH, CRITICAL, UNVERIFIED chống False Negative).
  - 6/6 Tests Clean UI Button trạng thái an toàn.
  - 5/5 Tests Bàn chẩn đoán CDS (InteractiveCDSViewer: Opacity, Dark Room, Zoom, object-contain, Anomalies).
  - 6/6 Tests Bảng dữ liệu và trạng thái rỗng lâm sàng.
- `frontend/src/tests/clinical-verification.test.ts`: **14/14 Tests PASS (100%)**
- `frontend/src/tests/ai-analysis-flow.test.ts`: **10/10 Tests PASS (100%)**
- Backend build: **BUILD SUCCESS** (Maven Java 21).

---

## 5. KẾT LUẬN & PHÊ DUYỆT CHÍNH THỨC

Căn cứ trên kết quả rà soát mã nguồn thực tế và dữ liệu kiểm thử thực nghiệm:
1. Hệ thống tuân thủ 100% các tiêu chuẩn trong `medical-safety.md`.
2. Tuyên bố miễn trừ y tế hiện diện đầy đủ, nổi bật trên tất cả các màn hình kết quả và báo cáo PDF/CSV.
3. Rủi ro Âm tính giả (False Negative) được kiểm soát chặt chẽ với cơ chế gán nhãn `UNVERIFIED` / *"Cần thẩm định lại"*.
4. Bàn soi đáy mắt CDS bảo vệ tính toàn vẹn giải phẫu với `object-contain`, thanh trượt Opacity mượt mà và chế độ buồng tối chống lóa chuyên nghiệp.
5. Vị thế và quyền quyết định chuyên môn của bác sĩ được xác lập vững chắc thông qua cơ chế kiểm duyệt, hiệu chỉnh nguy cơ, mã ICD-10 và ký số PKI SHA-256.

### **KẾT LUẬN CHÍNH THỨC:**
# **[X] PASS - CHẤP THUẬN AN TOÀN Y KHOA (APPROVED)**

*Biên bản được phê duyệt độc lập bởi Chuyên Gia Thẩm Định An Toàn Y Khoa AURA (Medical Safety Reviewer) và lưu trữ tại `docs/07-testing/medical-safety-signoff-clean-ui-cds.md` phục vụ lưu vết kiểm toán lâm sàng.*
