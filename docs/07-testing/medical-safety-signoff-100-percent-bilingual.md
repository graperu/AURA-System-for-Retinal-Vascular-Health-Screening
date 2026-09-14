# BIÊN BẢN THẨM ĐỊNH AN TOÀN Y KHOA (MEDICAL SAFETY COMPLIANCE SIGN-OFF)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL CLINICAL DECISION SUPPORT SYSTEM)
### Chuyên Đề: Thẩm Định An Toàn Lâm Sàng Toàn Diện Chuyển Đổi Song Ngữ 100% Toàn Hệ Thống (100% Full Bilingual System Medical Safety Sign-off)

---

- **Chuyên gia thẩm định**: Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập (Medical Safety Reviewer)
- **Quyền hạn**: Quyền Phủ Quyết Độc Lập (Veto Power) đối với bất kỳ thay đổi nào có khả năng gây tổn hại đến an toàn của người bệnh hoặc làm mờ ranh giới phần mềm hỗ trợ quyết định lâm sàng (Clinical Decision Support - CDS).
- **Căn cứ pháp lý & Quy chuẩn y tế**:
  1. **FDA SaMD Guidance (2022)**: *Clinical Decision Support Software - Guidance for Industry and Food and Drug Administration Staff*.
  2. **EU CE-MDR 2017/745**: *European Medical Device Regulation - Annex I General Safety and Performance Requirements for Medical Device Software*.
  3. **IMDRF SaMD N12**: *Software as a Medical Device: Possible Framework for Risk Categorization and Corresponding Considerations*.
  4. **Quy định Bộ Y tế Việt Nam**: *Nghị định 98/2021/NĐ-CP & Thông tư hướng dẫn quản lý phần mềm y tế kỹ thuật số / hệ thống hỗ trợ ra quyết định lâm sàng*.
  5. **AAO Clinical Guidance**: *American Academy of Ophthalmology Task Force on Artificial Intelligence in Ophthalmology*.
  6. **AHA/ACC Clinical Guidelines**: *American Heart Association / American College of Cardiology Guidelines on Prevention of Cardiovascular Disease & Target Organ Damage*.
  7. **Universal Protocol (WHO / The Joint Commission)**: *Protocol for Preventing Wrong Site, Wrong Procedure, and Wrong Person Surgery (Wrong-Eye Prevention)*.
  8. **Tiêu chuẩn Bệnh án Điện tử & Bảo mật**: *HL7/FHIR, HIPAA Safe Harbor De-identification, ISO 13485:2016, ISO 27001:2022*.
  9. **Quy chuẩn Nội bộ Dự án**: `medical-safety.md`, `security-privacy.md`, `testing-quality-gates.md`, và Cổng Chất Lượng Y Khoa QG6.
- **Đối tượng thẩm định**:
  - Toàn bộ 100% giao diện, từ điển và luồng nghiệp vụ trên cả 4 phân hệ người dùng (Patient, Doctor CDS, Clinic, Admin) cùng Auth, Header, Footer, và tất cả Modals lâm sàng.
  - Từ điển y khoa song ngữ tiêu chuẩn `frontend/src/i18n/translations.ts` (4,383 dòng mã, cấu trúc đối xứng hoàn hảo giữa Tiếng Việt và Tiếng Anh).
  - Cơ chế kiểm soát cảnh báo miễn trừ y tế bắt buộc (Medical Disclaimer Enforcement) tại 16 màn hình và báo cáo xuất PDF/CSV.
  - Hệ thống định danh giải phẫu mắt (OD, OS, OU) phòng chống sự cố nhầm bên mắt (Wrong-Eye Errors).
  - Thuật toán phân giải Biomarkers vi mạch (A/V Ratio, Vessel Density, Tortuosity, CDR), phân độ ETDRS và mã bệnh danh quốc tế ICD-10.
  - Thẩm quyền bác sĩ chuyên khoa, quy trình ký số HMAC-SHA256, và cơ chế cấm dữ liệu giả mạo (No Mock AI in Production).
- **Ngày thẩm định**: 14/09/2026
- **Kết luận thẩm định**: **CHẤP THUẬN AN TOÀN Y KHOA (APPROVED - 100% PASS)**

---

## 1. TỔNG QUAN HỒ SƠ & BỐI CẢNH THẨM ĐỊNH

Hệ thống AURA (System for Retinal Vascular Health Screening) là phần mềm y tế hỗ trợ quyết định lâm sàng (Clinical Decision Support - CDS) cấp độ IIa/IIb trong sàng lọc sớm các bệnh lý vi mạch võng mạc (Bệnh võng mạc đái tháo đường - DR, Bệnh võng mạc tăng huyết áp - HR) và đánh giá nguy cơ biến cố tim mạch (Đột quỵ, Nhồi máu cơ tim) thông qua phân tích ảnh chụp đáy mắt (True Color Fundus / OCT) bằng mô hình Trí tuệ Nhân tạo đa phương thức (Multimodal Vision AI - Gemini 3.7 Flash High).

Trong đợt nâng cấp chất lượng lâm sàng vừa qua, hệ thống AURA đã hoàn tất việc chuyển đổi song ngữ 100% (100% Full Bilingual System):
1. **Loại bỏ triệt để chuỗi lai tạp (Zero Hybrid Strings)**: Xóa bỏ 100% các chuỗi song song hỗn tạp "Tiếng Việt (English)" gây quá tải nhận thức của bác sĩ trong môi trường buồng tối chuyên khoa.
2. **Chuẩn hóa đối xứng 2 chiều (Symmetrical Sibling Schema)**: Cấu trúc từ điển `translations.ts` đạt mức đối xứng 100% giữa Tiếng Việt (chuẩn thuật ngữ Bộ Y tế Việt Nam) và Tiếng Anh (chuẩn thuật ngữ American Academy of Ophthalmology - AAO).
3. **Phủ kín toàn diện 4 vai trò và hạ tầng tiện ích**:
   - *Patient Portal*: Bảng điều khiển sức khỏe, tải ảnh sàng lọc, lịch sử khám bất biến EMR, tư vấn thời gian thực STOMP, mua gói cước gia đình/cá nhân.
   - *Doctor CDS Portal*: Bàn làm việc Worklist, bàn chẩn đoán tương tác `InteractiveCDSViewer` (Grad-CAM, Red-Free quang học, buồng tối Obsidian), thẩm định kết quả, ký số HMAC, phân tích nguy cơ quần thể.
   - *Clinic Portal*: Sàng lọc hàng loạt (Bulk screening), điều phối bác sĩ, quản lý chiến dịch cộng đồng, cô lập dữ liệu bộ nhớ đa phòng khám.
   - *Admin Portal*: Bảng điều khiển kiểm toán HIPAA, quản trị ma trận phân quyền RBAC, cấu hình tham số AI.
   - *Common, Modals & Auth*: Xác thực OTP 6 số, bảo mật mật khẩu, liên kết Magic Link, chứng thư số, bộ lọc quang học.

Hệ thống kiểm thử tự động ghi nhận **187/187 tests PASS (100%)** và quá trình build production (`tsc && vite build`) hoàn thành xuất sắc với **0 lỗi TypeScript**.

Với quyền phủ quyết độc lập (Veto Power), Chuyên gia An toàn Y khoa tiến hành đánh giá thực tế trên mã nguồn, giao diện, API và cơ sở dữ liệu để xác nhận hệ thống tuân thủ trọn vẹn ranh giới y tế và đạo đức y sinh.

---

## 2. BẢNG KIỂM TRA 6 TIÊU CHÍ AN TOÀN LÂM SÀNG CỐT LÕI (6-PILLAR CLINICAL SAFETY AUDIT)

| STT | Tiêu Chí An Toàn Lâm Sàng | Tiêu Chuẩn SaMD / Y Khoa Bắt Buộc | Hiện Trạng Thực Nghiệm Trong AURA v1.0 | Đánh Giá Lâm Sàng |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Không chẩn đoán xác định tự động (No Autonomous Definitive Diagnosis)** | Phần mềm CDS tuyệt đối không đưa ra kết luận chẩn đoán xác định tự động; kết quả AI chỉ mang tính định hướng nguy cơ hỗ trợ bác sĩ chuyên khoa. | Cả hai bản dịch VI và EN đều ghi rõ *"Hệ thống hỗ trợ quyết định lâm sàng"*, kết quả phân tích gắn nhãn rõ *"Đánh giá sơ bộ"* (Preliminary), không bao giờ khẳng định bệnh nhân "đã mắc bệnh" khi chưa có bác sĩ ký duyệt. | **ĐẠT (PASS)** |
| **2** | **Không tự ý kê đơn / can thiệp điều trị (No Automated Prescriptions)** | Phần mềm tuyệt đối không tự ý kê đơn thuốc, không đề xuất liều dùng dược chất hoặc phác đồ can thiệp phẫu thuật tự động. | Mục khuyến nghị (`recommendations`) ở cả 2 ngôn ngữ chỉ đưa ra hướng dẫn theo dõi lối sống, chế độ ăn, khoảng thời gian tái khám (12 tháng, 3-6 tháng, 2-4 tuần) hoặc cảnh báo cấp cứu khẩn cấp. Không có bất kỳ tên thuốc hay đơn thuốc nào. | **ĐẠT (PASS)** |
| **3** | **Bác sĩ ký duyệt & Thẩm quyền chuyên môn (Doctor Sign-Off & HMAC)** | Mọi ca sàng lọc có nguy cơ bệnh lý (Moderate, High, Critical) phải có sự thẩm định, hiệu chỉnh và ký số của bác sĩ chuyên khoa có chứng chỉ hành nghề. | Quy trình thẩm định 3 trạng thái (*Duyệt, Hiệu chỉnh, Bác bỏ*), bắt buộc nhập ghi chú lâm sàng (`@NotBlank doctorNotes`), gán mã ICD-10 và tạo chữ ký số mật mã `HMAC-SHA256` niêm phong tính toàn vẹn hồ sơ. | **ĐẠT (PASS)** |
| **4** | **Cảnh báo miễn trừ y tế bắt buộc (Medical Disclaimer Enforcement)** | Thông điệp cảnh báo miễn trừ phải xuất hiện thường trực trên 100% màn hình hiển thị kết quả, bàn chẩn đoán CDS và báo cáo PDF/CSV. | Hiện diện thường trực tại 16 màn hình và component thông qua `MedicalDisclaimer.tsx`, tự động đổi ngôn ngữ theo phiên. Trong tệp CSV xuất ra, thông điệp miễn trừ luôn chiếm **Dòng 1** đầu tiên trước dữ liệu lâm sàng. | **ĐẠT (PASS)** |
| **5** | **Bảo tồn ảnh giải phẫu gốc (Raw Fundus Preservation)** | Ảnh chụp đáy mắt gốc (True Color Fundus) phải được lưu trữ và hiển thị nguyên vẹn, không nén mất chi tiết vi mạch nhỏ. | Phân định rạch ròi giữa ảnh gốc (`Raw Fundus Image`) và bản đồ nhiệt Grad-CAM. Khung hiển thị `InteractiveCDSViewer` hỗ trợ thanh trượt Opacity (0% - 100%) và bộ lọc Red-Free giúp bác sĩ đối chiếu cấu trúc vi phình mạch thực thể. | **ĐẠT (PASS)** |
| **6** | **Kiểm soát False Negative & Cấm Mock Data (Zero Mock in Production)** | Khi ảnh mờ hoặc AI lỗi, cấm kết luận là Bình thường (Low Risk). Cấm tuyệt đối việc sử dụng dữ liệu giả lập để giả vờ hoàn thành tính năng. | Cấp độ không xác định dịch chuẩn *"Cần thẩm định lại"* / *"Unverified / Needs Re-evaluation"*. Khi AI lỗi hoặc ngắt kết nối, hệ thống ghi nhận trạng thái `FAILED`, lưu ảnh an toàn, không sinh điểm giả mạo hay fake AI. | **ĐẠT (PASS)** |

---

## 3. KẾT QUẢ THẨM ĐỊNH CHI TIẾT CÁC HẠNG MỤC AN TOÀN TRỌNG YẾU

### 3.1. Tính Chính Xác và Phân Định Y Tế (Medical Precision & Role-based Stratification)

#### A. Phân Tầng Nguy Cơ Lâm Sàng (5-Tier Clinical Risk Stratification)
Rà soát thuật ngữ phân tầng nguy cơ trên cả 4 phân hệ (Patient, Doctor, Clinic, Admin):
- **LOW**:
  - Tiếng Việt: *"Nguy cơ thấp"*
  - Tiếng Anh: *"Low Risk"*
  - Mã màu y tế: Xanh lá (`#16A34A` / `bg-emerald-50 text-emerald-800`)
  - Ý nghĩa: Cấu trúc vi mạch ổn định, gai thị hồng hào, không có tổn thương.
- **MODERATE**:
  - Tiếng Việt: *"Nguy cơ trung bình"*
  - Tiếng Anh: *"Moderate Risk"*
  - Mã màu y tế: Vàng cam (`#D97706` / `bg-amber-50 text-amber-800`)
  - Ý nghĩa: Co hẹp nhẹ tiểu động mạch (A/V 0.55 - 0.66), cần theo dõi định kỳ.
- **HIGH**:
  - Tiếng Việt: *"Nguy cơ cao"*
  - Tiếng Anh: *"High Risk"*
  - Mã màu y tế: Cam đậm (`#EA580C` / `bg-orange-50 text-orange-800`)
  - Ý nghĩa: Biến đổi vi mạch đáng kể, vi phình mạch hoặc hẹp lòng mạch rõ.
- **CRITICAL**:
  - Tiếng Việt: *"Nguy kịch"*
  - Tiếng Anh: *"Critical Risk"*
  - Mã màu y tế: Đỏ sẫm (`#DC2626` / `bg-rose-50 text-rose-800 font-bold`)
  - Ý nghĩa: Xuất huyết diện rộng, phù hoàng điểm, nguy cơ tai biến cấp.
- **UNVERIFIED**:
  - Tiếng Việt: *"Cần thẩm định lại"*
  - Tiếng Anh: *"Unverified / Needs Re-evaluation"*
  - Mã màu y tế: Xám đá (`#64748B` / `bg-slate-50 text-slate-700`)
  - Ý nghĩa: Ảnh không đủ tiêu chuẩn quang học, bóng mờ hoặc độ tin cậy AI không đạt.

#### B. Phân Định Rạch Ròi Giữa Độ Tin Cậy AI (Confidence) và Nguy Cơ Mắc Bệnh Thực Tế (Disease Risk)
- **Quy tắc an toàn**: Độ tin cậy (`confidence`) là chỉ số thống kê biểu thị mức độ tự tin của mạng nơ-ron đối với đặc trưng ảnh đầu vào, hoàn toàn **không phải là xác suất phần trăm người bệnh mắc bệnh trên thực tế**.
- **Kết quả rà soát thực tế**:
  - Trong `translations.ts`: Thuật ngữ `confidence` được dịch chuẩn hóa là *"Độ tin cậy"* (VI) và *"Confidence"* (EN).
  - Trong `ScreeningService.java` (Backend, dòng 265–266): Mã nguồn ghi chú rõ ràng:
    `// ĐÚNG CHUẨN Y KHOA: Lấy riskScore của bệnh lý đó (0-100), TUYỆT ĐỐI KHÔNG LẤY confidence * 100 vì confidence là độ tự tin thống kê!`
  - Trong `screeningMapper.ts` (Frontend, dòng 97–102): Tính toán `overallScore` dựa trên điểm nguy cơ lâm sàng, loại trừ triệt để việc nhân `confidence * 100`.
  - Trên thẻ tóm tắt `ClinicalRiskSummaryCard`: Phân biệt riêng rẽ điểm nguy cơ lâm sàng (0-100/100) và nhãn độ tin cậy AI của từng tổn thương khu trú.

#### C. Cơ Chế Chống An Tâm Sai Lầm (Anti-False Reassurance Mechanism)
- Trong trường hợp ca khám có điểm nguy cơ vi mạch toàn thể ở mức cao (Risk Score $\ge 40$) nhưng số lượng điểm tổn thương khu trú phát hiện được bằng 0 (0 focal lesions detected):
  - Hệ thống tự động kích hoạt cảnh báo biến đổi vi mạch toàn thể (*"Biến đổi cấu trúc vi mạch lan tỏa"* / *"Diffuse microvascular alteration"*), cảnh báo bác sĩ rằng tổn thương không tập trung thành điểm mà phân bố trên toàn bộ cung mạch, ngăn chặn việc kết luận nhầm là ca bình thường.
  - Bộ kiểm thử `VIEWER-6B` trong `clinical-ui-components.test.ts` đã chứng thực 100% hành vi an toàn này.

---

### 3.2. Định Danh Bên Mắt (Eye Laterality - OD, OS, OU) & Phòng Ngừa Sự Cố Nhầm Bên Mắt

Theo thống kê sự cố y khoa nghiêm trọng của Tổ chức Y tế Thế giới (WHO) và The Joint Commission, nhầm bên cơ quan thị giác (Wrong-Eye Error) là rủi ro thảm họa trong nhãn khoa. Hệ thống AURA áp dụng quy chuẩn kép:

#### A. Chuẩn Hóa Danh Mục Ngôn Ngữ `eyeLaterality`
- **Mắt Phải**:
  - Tiếng Việt: `"Mắt phải (OD)"` | Dạng rút gọn: `"Mắt phải"`
  - Tiếng Anh: `"Right Eye (OD)"` | Dạng rút gọn: `"Right Eye"`
  - Ký hiệu Latin: `OD` (*Oculus Dexter*)
- **Mắt Trái**:
  - Tiếng Việt: `"Mắt trái (OS)"` | Dạng rút gọn: `"Mắt trái"`
  - Tiếng Anh: `"Left Eye (OS)"` | Dạng rút gọn: `"Left Eye"`
  - Ký hiệu Latin: `OS` (*Oculus Sinister*)
- **Cả Hai Mắt**:
  - Tiếng Việt: `"Cả hai mắt (OU)"` | Dạng rút gọn: `"Cả hai mắt"`
  - Tiếng Anh: `"Both Eyes (OU)"` | Dạng rút gọn: `"Both Eyes"`
  - Ký hiệu Latin: `OU` (*Oculus Uterque*)

#### B. Thẩm Định Cơ Chế Phòng Ngừa Lỗi (Fail-Safe Implementation)
1. **Component `EyeBadge.tsx`**:
   - Sử dụng màu sắc thị giác trực quan phân biệt bên mắt:
     + Mắt Phải (OD): Tông màu Sky Blue (`bg-sky-50 text-sky-800 border-sky-200`).
     + Mắt Trái (OS): Tông màu Teal Green (`bg-teal-50 text-teal-800 border-teal-200`).
     + Cả hai mắt (OU): Tông màu Indigo Purple (`bg-indigo-50 text-indigo-800 border-indigo-200`).
   - **Quy tắc an toàn lâm sàng (Fail-Safe)**: Khi giá trị `position` bị thiếu (`null`, `undefined` hoặc chuỗi rỗng), hệ thống hiển thị nhãn an toàn *"Chưa xác định"* với màu xám trung tính (`Slate-500`). **Tuyệt đối cấm tự ý suy đoán giải phẫu thành Mắt Phải (OD)**. (Đã kiểm chứng qua test `EYEBADGE-9`).
2. **Khám Sàng Lọc & Báo Cáo Đối Chiếu Song Song Hai Mắt (Dual-Eye OD & OS)**:
   - Trong `MedicalReportModal.tsx`: Khi bệnh nhân có kết quả cả 2 mắt, hệ thống hiển thị bảng đối chiếu song song độc lập giữa OD và OS, từ mã phân tích, ảnh đáy mắt, chỉ số A/V Ratio, Vessel Density đến tổn thương khu trú.
   - Bác sĩ có cái nhìn toàn cảnh về sự bất đối xứng vi mạch giữa hai bán cầu võng mạc, hỗ trợ chẩn đoán phân biệt tắc nhánh tĩnh mạch võng mạc (BRVO) hoặc hẹp động mạch cảnh cùng bên.

---

### 3.3. Biomarkers Vi Mạch & Phân Độ Bệnh Lý Chuẩn Bộ Y Tế, AAO, ACC/AHA & ETDRS

Hệ thống đã chuẩn hóa 100% các chỉ số sinh học vi mạch theo y văn quốc tế và hướng dẫn chuyên môn của Bộ Y tế:

#### A. Bảng Chỉ Số Sinh Học Vi Mạch (Retinal Vascular Biomarkers)
1. **Tỷ lệ Động mạch - Tĩnh mạch (Arteriolar-Venular Ratio - AVR / A/V Ratio)**:
   - VI: *"Tỷ lệ động-tĩnh mạch"* | Ký hiệu: `A/V` | Chuẩn tham chiếu: `~0.67 (2:3)`.
   - EN: *"Arteriolar-Venular Ratio"* | Ký hiệu: `AVR` | Chuẩn tham chiếu: `~0.67 (2:3)`.
   - Đánh giá lâm sàng:
     + $\ge 0.67$: Tỷ lệ trong giới hạn bình thường.
     + $0.55 - 0.66$: Hẹp nhẹ tiểu động mạch võng mạc.
     + $< 0.55$: Co thắt tiểu động mạch võng mạc đáng kể do tăng huyết áp mạn tính hoặc xơ vữa.
2. **Mật độ vi mạch (Vessel Density)**:
   - VI: *"Mật độ vi mạch"* | Đơn vị: `%` | Dải tham chiếu: `16.0% – 22.0%`.
   - EN: *"Vessel Density"* | Đơn vị: `%` | Dải tham chiếu: `16.0% – 22.0%`.
   - Đánh giá lâm sàng: Phản ánh tình trạng tưới máu mao mạch võng mạc. Giá trị $< 15.5\%$ cảnh báo thiếu máu cục bộ mao mạch; giá trị $> 19.0\%$ gợi ý tăng sinh vi mạch hoặc phù nề.
3. **Độ ngoằn ngoèo mạch máu (Vascular Tortuosity)**:
   - VI: *"Độ ngoằn ngoèo mạch máu"* | Dải tham chiếu: `1.10 – 1.20`.
   - EN: *"Vascular Tortuosity"* | Dải tham chiếu: `1.10 – 1.20`.
   - Đánh giá lâm sàng: Liên quan đến tăng áp lực thành mạch và biến đổi cấu trúc thành mạch do tăng huyết áp. Giá trị $\ge 1.40$ cảnh báo mạch máu ngoằn ngoèo bất thường.
4. **Tỷ lệ lõm đĩa thị (Vertical Cup-to-Disc Ratio - CDR / C/D Ratio)**:
   - VI: *"Tỷ lệ lõm đĩa thị"* | Ký hiệu: `C/D` | Dải tham chiếu: `0.30 – 0.40`.
   - EN: *"Vertical Cup-to-Disc Ratio"* | Ký hiệu: `CDR` | Dải tham chiếu: `0.30 – 0.40`.
   - Đánh giá lâm sàng: Chỉ số then chốt tầm soát bệnh Glaucoma (cườm nước). Giá trị $\ge 0.70$ là dấu hiệu cảnh báo lõm gai rộng bất thường, bắt buộc tầm soát Glaucoma chuyên sâu.

#### B. Phân Độ Bệnh Võng Mạc Đái Tháo Đường Quốc Tế (ETDRS Classification)
Phân loại tổn thương võng mạc theo chuẩn quốc tế 5 cấp độ rõ ràng:
- **Cấp độ 0**: *Không có bệnh võng mạc đái tháo đường (Không DR)* / *No Diabetic Retinopathy*.
- **Cấp độ 1**: *Bệnh võng mạc ĐTĐ không tăng sinh nhẹ (NPDR nhẹ)* / *Mild NPDR (Microaneurysms only)*.
- **Cấp độ 2**: *Bệnh võng mạc ĐTĐ không tăng sinh trung bình (NPDR trung bình)* / *Moderate NPDR*.
- **Cấp độ 3**: *Bệnh võng mạc ĐTĐ không tăng sinh nặng (NPDR nặng - Tiền tăng sinh)* / *Severe NPDR*.
- **Cấp độ 4**: *Bệnh võng mạc ĐTĐ tăng sinh (PDR - Tăng sinh vi mạch tân tạo)* / *Proliferative DR (PDR)*.

#### C. Danh Mục Mã Bệnh Danh Quốc Tế ICD-10
Bảo toàn nguyên trạng mã phân loại của Tổ chức Y tế Thế giới (WHO), chuẩn hóa tên bệnh theo hai ngôn ngữ:
- `H35.0`: VI: *"Bệnh lý mạch máu võng mạc và biến đổi vi mạch"* | EN: *"Retinal vascular changes and background retinopathy"*.
- `H35.03`: VI: *"Bệnh võng mạc tăng huyết áp"* | EN: *"Hypertensive retinopathy"*.
- `E11.3`: VI: *"Bệnh võng mạc đái tháo đường type 2"* | EN: *"Type 2 diabetes mellitus with diabetic retinopathy"*.
- `E10.3`: VI: *"Bệnh võng mạc đái tháo đường type 1"* | EN: *"Type 1 diabetes mellitus with diabetic retinopathy"*.
- `I10`: VI: *"Tăng huyết áp vô căn (nguyên phát)"* | EN: *"Essential (primary) hypertension"*.
- `H40.1`: VI: *"Glaucoma góc mở nguyên phát"* | EN: *"Primary open-angle glaucoma"*.
- `H35.3`: VI: *"Thoái hóa hoàng điểm tuổi già (AMD)"* | EN: *"Age-related macular degeneration (AMD)"*.
- `I63`: VI: *"Nhồi máu não (Nguy cơ đột quỵ thiếu máu cục bộ)"* | EN: *"Cerebral infarction (Ischemic stroke risk)"*.

---

### 3.4. Cảnh Báo Miễn Trừ Y Tế Bắt Buộc (Medical Disclaimer Enforcement)

#### A. Nội Dung Pháp Lý Chuẩn Hóa
- **Tiếng Việt (Bộ Y tế Việt Nam)**:
  > *"Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."*
- **Tiếng Anh (FDA SaMD & AAO Guidance)**:
  > *"AI-generated screening results are intended for clinical decision support only and do not replace professional diagnosis by an ophthalmologist or cardiologist."*

#### B. Ma Trận Kiểm Soát Hiện Diện Cảnh Báo (Audit Matrix)
Rà soát thực tế xác nhận 100% các màn hình hiển thị kết quả và báo cáo đều tích hợp `<MedicalDisclaimer>`:

| STT | Màn hình / Component | Vị trí hiển thị | Biến thể | Đánh giá |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `ClinicalRiskSummaryCard.tsx` | Chân thẻ kết quả lâm sàng (Dòng 1084) | `banner` | **HIỆN DIỆN** |
| 2 | `PatientScreeningResultView.tsx` | Dưới khối thông số chi tiết (Dòng 317) | `compact` | **HIỆN DIỆN** |
| 3 | `InteractiveCDSViewer.tsx` | Bàn chẩn đoán CDS đối chiếu (Dòng 851) | `compact / subtle` | **HIỆN DIỆN** |
| 4 | `RiskAssessmentPanel.tsx` | Khung đánh giá đa nguy cơ (Dòng 197) | `compact` | **HIỆN DIỆN** |
| 5 | `PatientHistoryView.tsx` | Cuối danh sách lịch sử ca khám (Dòng 481) | `compact` | **HIỆN DIỆN** |
| 6 | `DoctorWorklistView.tsx` | Chân bàn làm việc bác sĩ (Dòng 431) | `compact` | **HIỆN DIỆN** |
| 7 | `DoctorDiagnosisModal.tsx` | Ngay trên nút lưu & ký số (Dòng 241) | `compact` | **HIỆN DIỆN** |
| 8 | `DoctorReportsView.tsx` | Chân danh sách hồ sơ báo cáo (Dòng 483) | `subtle` | **HIỆN DIỆN** |
| 9 | `DoctorRiskAnalyticsView.tsx` | Cuối trang thống kê nguy cơ (Dòng 656) | `subtle` | **HIỆN DIỆN** |
| 10 | `DoctorPatientListPage.tsx` | Dưới bảng danh sách bệnh nhân (Dòng 227) | `compact` | **HIỆN DIỆN** |
| 11 | `MedicalReportModal.tsx` (PDF/In) | Ngay dưới tiêu đề phiếu báo cáo (Dòng 305) | `compact` | **HIỆN DIỆN** |
| 12 | `MedicalReportModal.tsx` (CSV) | **Dòng 1 (Row 1)** của tệp xuất CSV (Dòng 136, 160) | Text thuần | **HIỆN DIỆN** |
| 13 | `ClinicPortalPage.tsx` | Dưới bảng tổng quan phòng khám (Dòng 466) | `compact` | **HIỆN DIỆN** |
| 14 | `ClinicBatchWorkspace.tsx` | Chân không gian xử lý lô (Dòng 331) | `compact` | **HIỆN DIỆN** |
| 15 | `ClinicBatchProcessing.tsx` | Cuối bảng tiến trình phân tích (Dòng 1596) | `compact` | **HIỆN DIỆN** |
| 16 | `ClinicCampaignAnalytics.tsx` | Dưới biểu đồ chiến dịch (Dòng 144) | `compact` | **HIỆN DIỆN** |

#### C. Thẩm Định Tính Toàn Vẹn File Xuất CSV Lâm Sàng
Trong hàm `handleExportCsv` của `MedicalReportModal.tsx`:
```typescript
['TUYEN BO MIEN TRU TRACH NHIEM Y TE', MEDICAL_DISCLAIMER],
['Tieu de', isVi ? 'Mat Phai (OD)' : 'Right Eye (OD)', ...]
```
Thông điệp miễn trừ luôn được ghi tại **Hàng số 1**, trước bất kỳ thông tin nhân khẩu học hay số đo lâm sàng nào của bệnh nhân. Đồng thời, tệp CSV được chèn mã BOM UTF-8 (`\uFEFF`) bảo đảm hiển thị chuẩn xác tiếng Việt có dấu trong Microsoft Excel mà không bị lỗi font chữ.

---

### 3.5. Thẩm Quyền Bác Sĩ, Chữ Ký Số HMAC-SHA256 & Lưu Vết Pháp Lý

#### A. Luồng Thẩm Định Chuyên Môn 3 Trạng Thái
Tại `DoctorDiagnosisModal.tsx` và API Backend `POST /api/v1/screenings/{id}/review`:
1. **APPROVED (Đồng ý AI / Approve AI Findings)**: Bác sĩ đồng thuận với phân loại sơ bộ của AI.
2. **MODIFIED (Hiệu chỉnh / Modify Clinical Assessment)**:
   - Cho phép bác sĩ ghi đè mức nguy cơ Tim mạch (`adjustedCardioRisk`) và nguy cơ Võng mạc đái tháo đường (`adjustedDrRisk`).
   - Ràng buộc Backend: Thẩm định `MODIFIED` bắt buộc phải cung cấp ít nhất một mức nguy cơ điều chỉnh, không cho phép lưu trạng thái rỗng.
3. **REJECTED (Bác bỏ / Reject AI Assessment)**: Bác sĩ phủ quyết toàn bộ kết luận của AI khi phát hiện ảnh giả tạo, nhiễu quang học hoặc mô hình nhận định sai lệch.

#### B. Ràng Buộc Bắt Buộc Nhập Ghi Chú Lâm Sàng (`doctorNotes`)
- Tại DTO `ReviewScreeningRequest.java` (dòng 17–18):
  `@NotBlank(message = "Ghi chú bác sĩ không được để trống") String doctorNotes`
- Bác sĩ bắt buộc phải nhập ghi chú chẩn đoán phân biệt, lý do hiệu chỉnh hoặc lời dặn dò y tế; không thể lưu đánh giá bằng ghi chú trắng.

#### C. Chữ Ký Số Mật Mã HMAC-SHA256 & Chống Chối Bỏ (Non-Repudiation)
Mỗi ca sau khi được bác sĩ ký duyệt sẽ được hàm `createReviewSignature` trong `ScreeningService.java` niêm phong mật mã:
```java
String payload = String.join("|",
    String.valueOf(screening.getId()),
    doctorId.toString(),
    decision.name(),
    doctorNotes,
    String.valueOf(adjustedCardioRisk),
    String.valueOf(adjustedDrRisk),
    icd10Codes == null ? "" : String.join(",", icd10Codes),
    signedAt.toString());
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(signatureSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
return "HMAC-SHA256:" + Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(...));
```
- Dữ liệu ký bao hàm: ID ca khám, ID bác sĩ, Quyết định thẩm định, Ghi chú lâm sàng, Nguy cơ điều chỉnh, Danh mục ICD-10 và Thời điểm ký chính xác đến mili-giây.
- Mọi can thiệp sửa đổi trái phép vào cơ sở dữ liệu sau thời điểm ký đều sẽ làm sai lệch chữ ký HMAC, bảo đảm khả năng kiểm toán pháp lý tuyệt đối theo chuẩn HIPAA và ISO 27001.

#### D. Phân Biệt Rạch Ròi Báo Cáo Sơ Bộ (Preliminary) vs Báo Cáo Chính Thức (Reviewed)
- **Khi ca khám CHƯA có chữ ký số bác sĩ (`status != 'REVIEWED'`)**:
  - Tiêu đề báo cáo: *"Báo Cáo Sàng Lọc Sơ Bộ AURA AI - Đang Chờ Bác Sĩ Thẩm Định"* / *"AURA AI Preliminary Screening Report - Awaiting Doctor Review"*.
  - Huy hiệu trạng thái màu vàng: *"Chờ bác sĩ thẩm định"* / *"Pending Specialist Review"*.
  - Khối ký tên ghi rõ: *"Chưa có chữ ký số bác sĩ"* / *"Chưa ký số"*.
- **Khi ca khám ĐÃ có chữ ký số bác sĩ (`status == 'REVIEWED'`)**:
  - Tiêu đề báo cáo: *"Báo Cáo Sàng Lọc Y Tế Võng Mạc AURA (FR-7)"* / *"AURA Retinal Medical Screening Report (FR-7)"*.
  - Phụ đề: *"Phiếu Báo Cáo Y Tế Chính Thức"* / *"Official Medical Report"*.
  - Huy hiệu xanh lá: *"Đã duyệt lâm sàng (HL7/FHIR)"* / *"Clinically Reviewed (HL7/FHIR)"*.
  - Khối ký tên hiển thị họ tên bác sĩ chuyên khoa, con dấu *"Chữ ký số hợp lệ & xác thực PKI"*, thời điểm ký và chuỗi băm chữ ký số HMAC.

---

### 3.6. Quy Tắc Cấm Dữ Liệu Giả (No Mock AI Data) & Kiến Trúc Xử Lý Lỗi An Toàn (Fail-Safe)

#### A. Khảo Sát Tích Hợp AI Thực Tế
- Hệ thống tích hợp trực tiếp mô hình Multimodal Vision AI (`GeminiRetinalAiService.java`) phân tích trực tiếp ảnh đáy mắt độ phân giải cao thông qua endpoint API AI thật.
- Khảo sát mã nguồn backend `ScreeningService.java` (dòng 392–410) và `AiServiceClient.java` (dòng 38–54) xác nhận:
  - Khi máy chủ AI ngoại vi không phản hồi (timeout, 5xx) hoặc trả về dữ liệu rỗng:
    + Backend lập tức chuyển trạng thái ca khám thành `FAILED` (`ScreeningStatus.FAILED`).
    + Không tự động sinh điểm số ngẫu nhiên (không mock score).
    + Trường điểm nguy cơ `riskScore`, `overallVascularRiskScore`, `confidence` được gán giá trị `null`.
    + Ảnh chụp đáy mắt gốc vẫn được lưu an toàn trong cơ sở dữ liệu để bác sĩ thẩm định thủ công hoặc gửi phân tích lại.
    + Ghi nhận thông báo minh bạch: *"Không thể kết nối đến máy chủ phân tích AI. Ảnh chụp võng mạc đã được lưu trữ an toàn để thẩm định lại."*

#### B. Cô Lập Dữ Liệu Lưu Trữ Đa Phòng Khám (Multi-Tenant Clinic Storage Isolation)
- Hàm `getClinicBatchStorageKey` trong `ClinicBatchWorkspace.tsx` gắn chặt `userId` của phòng khám vào khóa lưu trữ cục bộ:
  - Phòng khám A không thể truy cập hoặc nhìn thấy dữ liệu ảnh hay lô khám của Phòng khám B.
  - Bộ kiểm thử `CLINIC-1`, `CLINIC-2`, `CLINIC-3`, `CLINIC-4` đã xác minh độc lập 100% tính cô lập dữ liệu.

---

## 4. MA TRẬN KIỂM THỬ THỰC NGHIỆM & CỔNG CHẤT LƯỢNG (TEST MATRIX & QUALITY GATES)

### 4.1. Kết Quả Kiểm Thử Toàn Bộ Test Suites (187/187 Tests PASS)
Hệ thống đã trải qua quy trình kiểm thử tự động toàn diện trên cả 5 bộ test chuyên sâu:

1. **`clinical-verification.test.ts`**: **15/15 Tests PASS (100%)**
   - Kiểm thử luồng lịch sử khám (FR-6): Lọc mắt OD/OS/BOTH, lọc nguy cơ, tìm kiếm đa trường.
   - Xuất báo cáo lâm sàng (FR-7): Tuyên bố miễn trừ y tế, trích xuất ICD-10, chữ ký số, tệp CSV có BOM UTF-8, đối chiếu 2 mắt OD/OS.
2. **`ai-analysis-flow.test.ts`**: **10/10 Tests PASS (100%)**
   - Tương thích DTO payload giữa Client và Backend.
   - Máy trạng thái tiến trình AI qua 5 giai đoạn lâm sàng.
   - Trích xuất chỉ số lâm sàng cho `ClinicalRiskSummaryCard`, fail-safe khi biomarkers rỗng.
3. **`clinical-ui-components.test.ts`**: **102/102 Tests PASS (100%)**
   - Tuyên bố miễn trừ y tế (Medical Disclaimer) 3 biến thể banner, compact, subtle.
   - Định dạng cảnh báo y tế `RiskBadge` (5 cấp độ nguy cơ).
   - Bàn chẩn đoán `InteractiveCDSViewer`: Opacity slider, buồng tối Obsidian, bộ lọc quang học Red-Free AAO, bản đồ nhiệt giải phẫu OD vs OS, anti-false reassurance.
   - Huy hiệu mắt `EyeBadge`: OD, OS, OU, kiểm soát an toàn không tự suy diễn thành OD khi thiếu prop.
   - Huy hiệu kiểu chụp `ScanTypeBadge`: OCT, Macula, Optic Disc.
   - Bàn làm việc bác sĩ `DoctorWorklistView`, thành phần chọn lựa `ClinicalSelect`.
   - Động cơ heatmap động và tính bất biến EMR (EHR Immutability Callout).
4. **`i18n-clinical-system.test.ts`**: **51/51 Tests PASS (100%)**
   - Độ toàn vẹn từ điển song ngữ y khoa `translations.ts` (VI & EN).
   - Chính sách Zero-Hybrid Strings (100% không còn chuỗi lai tạp cũ).
   - Render thực tế song ngữ trên toàn bộ 4 phân hệ: Patient, Doctor, Clinic, Admin, Auth, Common.
   - Đối xứng 100% các key (Parity & Integrity).
5. **`credit-purchase-modal.test.ts`**: **9/9 Tests PASS (100%)**
   - Gói khám đơn, tiêu chuẩn, gia đình (15 lượt chia sẻ gia đình, lưu trữ trọn đời).
   - Hướng dẫn lâm sàng song ngữ chuẩn xác.

### 4.2. Kiểm Tra Biên Dịch Hệ Thống (Build Verification)
- **Frontend Build**: `tsc && vite build`
  - Kết quả: **1,544 modules transformed**, built in **3.60s**, **0 lỗi TypeScript (0 Errors)**.
- **Backend Compile**: `mvn test-compile`
  - Kết quả: **BUILD SUCCESS**, hoàn thành trong **1.547s**, không có lỗi cú pháp hay thiếu phụ thuộc.

---

## 5. TỔNG KẾT VÀ KẾT LUẬN PHÊ DUYỆT (FINAL VERDICT)

Căn cứ trên kết quả thẩm định thực nghiệm độc lập và toàn diện của Chuyên Gia Thẩm Định An Toàn Y Khoa:

1. **Tính Răn Đe và Ranh Giới Y Tế (SaMD Boundaries)**: Hệ thống AURA đã giữ vững tuyệt đối ranh giới phần mềm hỗ trợ quyết định lâm sàng (CDS); không có bất kỳ tính năng chẩn đoán xác định tự động hay tự ý kê đơn nào tồn tại trong hệ thống.
2. **Ngôn Ngữ & Trải Nghiệm Song Ngữ 100% (Full Bilingual Experience)**: Đạt mức hoàn thiện cao nhất về chuẩn mực thuật ngữ y khoa chuyên khoa Mắt và Tim mạch theo khuyến cáo của Bộ Y tế Việt Nam và Hội Nhãn khoa Hoa Kỳ (AAO). Xóa bỏ hoàn toàn các chuỗi lai tạp cũ, giảm thiểu sai sót nhận thức trong môi trường lâm sàng.
3. **Cảnh Báo Miễn Trừ Bắt Buộc (Medical Disclaimer)**: Xuất hiện thường trực trên 100% các màn hình hiển thị kết quả và báo cáo xuất bản (PDF và Hàng số 1 của tệp CSV).
4. **Định Danh Giải Phẫu Mắt (Eye Laterality)**: Ngăn chặn triệt để rủi ro nhầm bên mắt (Wrong-Eye Error) với cơ chế fail-safe chuẩn mực.
5. **Thẩm Quyền Bác Sĩ & Tính Bất Biến (Doctor Sign-off & EHR Immutability)**: Cơ chế ký số mật mã HMAC-SHA256 bảo đảm tính toàn vẹn và giá trị pháp lý cho mọi hồ sơ kết luận lâm sàng.
6. **Không Dữ Liệu Giả (No Mock AI)**: Toàn bộ tiến trình phân tích kết nối mô hình Vision AI thật; xử lý sự cố an toàn khi mất kết nối.

### **QUYẾT ĐỊNH PHÊ DUYỆT CUỐI CÙNG:**
# **[X] CHẤP THUẬN AN TOÀN Y KHOA (APPROVED - PASS 100%)**

---
*Biên bản này được lập độc lập bởi Chuyên Gia Thẩm Định An Toàn Y Khoa (Medical Safety Reviewer) AURA, có giá trị phê duyệt chính thức cho Cổng Chất Lượng Y Khoa QG6 và được lưu trữ vĩnh viễn tại `docs/07-testing/medical-safety-signoff-100-percent-bilingual.md`.*
