# BIÊN BẢN THẨM ĐỊNH AN TOÀN Y KHOA (MEDICAL SAFETY COMPLIANCE SIGN-OFF)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL CLINICAL DECISION SUPPORT)
### Chuyên Đề: Thẩm Định Hệ Thống Đa Ngôn Ngữ Song Ngữ (Bilingual i18n) & Chính Sách Không Chuỗi Lai Tạp (Zero-Hybrid Strings Policy)

---

- **Chuyên gia thẩm định**: Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập (Medical Safety Reviewer)
- **Căn cứ pháp lý & quy chuẩn y tế**: 
  - **FDA SaMD Guidance (2022)**: *Clinical Decision Support Software - Guidance for Industry and Food and Drug Administration Staff*.
  - **CE-MDR 2017/745**: *European Medical Device Regulation - Annex I General Safety and Performance Requirements*.
  - **IMDRF SaMD N12**: *Software as a Medical Device: Possible Framework for Risk Categorization and Corresponding Considerations*.
  - **Quy định của Bộ Y tế Việt Nam**: *Nghị định 98/2021/NĐ-CP & Thông tư hướng dẫn quản lý trang thiết bị y tế kỹ thuật số / phần mềm hỗ trợ chẩn đoán*.
  - **AAO Clinical Guidance**: *American Academy of Ophthalmology Task Force on Artificial Intelligence in Ophthalmology*.
  - **Quy chuẩn An toàn Phẫu thuật & Thủ thuật (WHO / The Joint Commission)**: *Universal Protocol for Preventing Wrong Site, Wrong Procedure, and Wrong Person Surgery*.
  - **Bộ Quy tắc An toàn Y khoa AURA**: `medical-safety.md`.
  - **Cổng Chất Lượng Y Khoa QG6**: *Medical Safety & Clinical Compliance Quality Gate*.
- **Đối tượng thẩm định**:
  1. Bộ từ điển y khoa song ngữ tiêu chuẩn `frontend/src/i18n/translations.ts`.
  2. Cơ chế phân giải ngôn ngữ và chuyển mạch `frontend/src/context/LanguageContext.tsx` & `LanguageSwitcher.tsx`.
  3. Tính chuẩn xác của Tuyên bố miễn trừ y tế (Medical Disclaimer) trong hai ngôn ngữ Tiếng Việt (VI) và Tiếng Anh (EN).
  4. Hệ thống phân tầng nguy cơ lâm sàng (Risk Stratification: Low, Moderate, High, Critical, Unverified) và cơ chế phòng ngừa Âm tính giả (False Negative).
  5. Danh mục phân định giải phẫu học mắt (OD, OS, OU) và loại ảnh chụp (Fundus Macula, Fundus Optic Disc, OCT) phòng ngừa nhầm lẫn điều trị sai bên mắt (Wrong-eye medical errors).
  6. Tính toàn vẹn của các thuật ngữ viết tắt chuẩn quốc tế trong hồ sơ bệnh án điện tử (EMR/EHR) theo chính sách Zero-Hybrid Strings.
- **Ngày thẩm định**: 14/09/2026
- **Kết luận thẩm định**: **CHẤP THUẬN AN TOÀN Y KHOA (APPROVED - PASS 100%)**

---

## 1. TỔNG QUAN HỒ SƠ & BỐI CẢNH THẨM ĐỊNH

Hệ thống AURA (System for Retinal Vascular Health Screening) là phần mềm y tế hỗ trợ quyết định lâm sàng (Clinical Decision Support - CDS) trong sàng lọc sớm các bệnh lý vi mạch võng mạc (Diabetic Retinopathy, Hypertensive Retinopathy) và nguy cơ biến cố tim mạch (Stroke, Cardiovascular Event) thông qua phân tích hình ảnh đáy mắt (True Color Fundus / OCT) bằng Trí tuệ Nhân tạo đa phương thức (Multimodal Vision AI).

Trong quá trình chuẩn hóa trải nghiệm lâm sàng (Clinical UX) tiệm cận tiêu chuẩn quốc tế, hệ thống đã thực hiện một bước cải tiến giao diện mang tính nền tảng:
1. **Loại bỏ triệt để các chuỗi hiển thị lai tạp "Tiếng Việt (English)"**:
   - Trước đây, nhiều giao diện tồn tại chuỗi ghép đôi lủng củng như: `Bàn Chẩn Đoán Tương Tác CDS (Fundus & Grad-CAM Heatmap Viewer)`, `Ảnh màu đáy mắt hoàng điểm (Fundus Color - Macula Centered)`, `Mắt Phải - OD (Oculus Dexter)`. Những chuỗi này vừa làm giảm tính chuyên nghiệp của hệ thống bệnh án điện tử, vừa gây rối loạn nhận thức thị giác của bác sĩ trong điều kiện làm việc buồng tối cường độ cao.
2. **Triển khai kiến trúc đa ngôn ngữ thuần khiết (Bilingual i18n Architecture)**:
   - Xây dựng từ điển song ngữ chuẩn hóa độc lập `translations.ts` với đầy đủ 2 ngôn ngữ: Tiếng Việt (chuẩn thuật ngữ Bộ Y tế) và Tiếng Anh (chuẩn thuật ngữ Hội Nhãn khoa Hoa Kỳ - AAO).
   - Tích hợp `LanguageContext` hỗ trợ lưu phiên làm việc an toàn, tự động đồng bộ thuộc tính `document.documentElement.lang`, cơ chế fallback an toàn và component chuyển đổi ngôn ngữ `LanguageSwitcher` công thái học (hỗ trợ cả buồng tối Darkroom Mode).

Với quyền phủ quyết độc lập (Veto Power), Chuyên gia An toàn Y khoa tiến hành rà soát chuyên sâu từng mục từ khóa, ngữ nghĩa lâm sàng, tính pháp lý của các tuyên bố miễn trừ trách nhiệm và các thuật ngữ giải phẫu học để bảo đảm an toàn sinh học và an toàn điều trị tuyệt đối cho người bệnh.

---

## 2. BẢNG KIỂM TRA 6 TIÊU CHÍ AN TOÀN LÂM SÀNG CỐT LÕI (6-PILLAR CLINICAL SAFETY AUDIT)

| STT | Tiêu Chí An Toàn Lâm Sàng | Tiêu Chuẩn Thẩm Định SaMD / Y Khoa | Hiện Trạng Thực Tế Trongtranslations.ts & Hệ Thống Giao Diện | Đánh Giá Lâm Sàng |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Không chẩn đoán xác định tự động (No Definitive Diagnosis)** | Hệ thống tuyệt đối không đưa ra chẩn đoán xác định; kết quả AI chỉ mang tính chất định hướng nguy cơ hỗ trợ bác sĩ chuyên khoa. | Cả hai bản dịch (VI & EN) định danh hệ thống nhất quán là *Hệ thống Hỗ trợ Quyết định Lâm sàng (CDS)*. Kết quả phân tích hiển thị trạng thái sơ bộ, khuyến nghị bác sĩ thẩm định trước khi ra kết luận. | **ĐẠT (PASS)** |
| **2** | **Không kê đơn / can thiệp điều trị tự động (No Automated Prescriptions)** | Tuyệt đối không gợi ý dùng thuốc, liều lượng hoặc phác đồ điều trị xâm lấn tự động. | Mục `recommendations` trong từ điển chỉ bao gồm hướng dẫn theo dõi lối sống, khoảng thời gian tái khám (12 tháng, 3-6 tháng, 2-4 tuần) và yêu cầu khám cấp cứu tại cơ sở chuyên khoa khi ở mức nguy kịch. | **ĐẠT (PASS)** |
| **3** | **Bác sĩ ký duyệt & Thẩm quyền chuyên môn (Doctor Sign-Off)** | Mọi ca sàng lọc có nguy cơ phải có sự thẩm định, hiệu chỉnh và ký số của bác sĩ chuyên khoa có chứng chỉ hành nghề. | Phần `clinicalDecision` cung cấp 3 nút hành động tối cao: *Chấp thuận kết quả AI (Approve)*, *Hiệu chỉnh chẩn đoán (Modify)*, *Bác bỏ kết luận AI (Reject)*, kèm nhãn chữ ký số HMAC/PKI và lưu mã ICD-10. | **ĐẠT (PASS)** |
| **4** | **Cảnh báo miễn trừ y tế bắt buộc (Medical Disclaimer Enforcement)** | Tuyên bố miễn trừ chuẩn pháp lý phải xuất hiện thường trực trên mọi màn hình kết quả, bàn chẩn đoán CDS và báo cáo in/xuất CSV. | Xuất hiện ở 100% màn hình qua component `MedicalDisclaimer`, tự động cập nhật ngôn ngữ theo ngữ cảnh phiên và nằm tại **Dòng 1** của file xuất CSV báo cáo lâm sàng. | **ĐẠT (PASS)** |
| **5** | **Bảo tồn toàn vẹn ảnh giải phẫu gốc (Raw Image Preservation)** | Ảnh chụp đáy mắt gốc (True Color Fundus) phải được lưu trữ và hiển thị nguyên vẹn, không bị nén mất chi tiết vi mạch nhỏ. | Từ điển phân biệt rạch ròi *Ảnh chụp đáy mắt gốc (True Color Fundus Scan)* và *Bản đồ nhiệt Grad-CAM (Grad-CAM Heatmap)*; giao diện áp dụng `object-contain` độc lập cho cả 2 khung viewport. | **ĐẠT (PASS)** |
| **6** | **Kiểm soát rủi ro Âm tính giả (False Negative Prevention)** | Khi ảnh mờ hoặc độ tin cậy AI thấp, cấm kết luận là Bình thường (Low Risk). Phải phân loại là "Cần thẩm định lại". Cấm dữ liệu giả (Mock Data). | Mức không xác định được dịch chuẩn: VI: *"Cần thẩm định lại"*, EN: *"Unverified / Needs Re-evaluation"*. Kết nối trực tiếp AI Vision thật, lỗi mạng báo lỗi minh bạch, không sinh điểm giả mạo. | **ĐẠT (PASS)** |

---

## 3. THẨM ĐỊNH CHI TIẾT CÁC HẠNG MỤC AN TOÀN LÂM SÀNG TRỌNG YẾU

### 3.1. Thẩm Định Tuyên Bố Miễn Trừ Trách Nhiệm Y Tế (Medical Disclaimer) Song Ngữ

#### A. Đối chiếu Ngữ nghĩa Pháp lý & Ranh giới SaMD
Tuyên bố miễn trừ y tế là rào chắn pháp lý tối cao phân định phần mềm y tế hỗ trợ quyết định lâm sàng (Clinical Decision Support - CDS) với phần mềm tự động chẩn đoán độc lập (Autonomous Diagnostic Software).

- **Bản Tiếng Việt (Chuẩn hóa theo hướng dẫn của Bộ Y tế Việt Nam)**:
  > *"Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."*
  - **Phân tích lâm sàng**:
    + Cụm từ *"chỉ nhằm mục đích hỗ trợ sàng lọc"* (screening support only): Xác định rõ ràng phạm vi sử dụng, ngăn chặn người bệnh tự ý suy diễn kết quả thành bệnh lý đã xác định.
    + Cụm từ *"không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch"*: Bắt buộc người bệnh phải tìm kiếm sự thăm khám trực tiếp từ bác sĩ chuyên khoa có chứng chỉ hành nghề.
- **Bản Tiếng Anh (Chuẩn hóa theo khuyến cáo của American Academy of Ophthalmology - AAO & FDA CDS Guidance)**:
  > *"AI-generated screening results are intended for clinical decision support only and do not replace professional diagnosis by an ophthalmologist or cardiologist."*
  - **Phân tích lâm sàng**:
    + Sử dụng thuật ngữ pháp lý chuẩn SaMD quốc tế: *"clinical decision support only"*.
    + Khẳng định vai trò của bác sĩ chuyên khoa: *"do not replace professional diagnosis by an ophthalmologist or cardiologist"*.
- **Độ phủ thực tế trên giao diện**:
  Component `MedicalDisclaimer.tsx` được tích hợp công nghệ đa ngôn ngữ phản ứng tức thì (`useLanguage` hook):
  + Tự động chuyển đổi `MANDATORY_MEDICAL_DISCLAIMER_VI` $\leftrightarrow$ `MANDATORY_MEDICAL_DISCLAIMER_EN`.
  + Xuất hiện thường trực tại: Bàn chẩn đoán `InteractiveCDSViewer`, Thẻ tổng quan rủi ro `ClinicalRiskSummaryCard`, Màn hình kết quả người bệnh `PatientScreeningResultView`, Bảng phân tích nguy cơ `RiskAssessmentPanel`, Báo cáo y tế in ấn `MedicalReportModal`, và Dòng 1 của file xuất CSV.

---

### 3.2. Thẩm Định Ngũ Phân Tầng Nguy Cơ Lâm Sàng (5-Tier Risk Stratification) & Kiểm Soát False Negative

Việc chuyển ngữ các mức nguy cơ có liên hệ trực tiếp đến thái độ tiếp cận điều trị của bác sĩ và mức độ lo lắng/tuân thủ của bệnh nhân.

```
+-----------------------------------------------------------------------------------------------+
| BẢNG ĐỐI SOÁT PHÂN TẦNG NGUY CƠ Y KHOA SONG NGỮ AURA                                          |
+-------------+-----------------------+----------------------------------+----------------------+
| Cấp độ Mã   | Tiếng Việt (VI)       | Tiếng Anh (EN)                   | Mã Màu Quy Chuẩn     |
+-------------+-----------------------+----------------------------------+----------------------+
| low         | Nguy cơ thấp          | Low Risk                         | #16A34A (Xanh lá)    |
| moderate    | Nguy cơ trung bình    | Moderate Risk                    | #D97706 (Vàng cam)   |
| high        | Nguy cơ cao           | High Risk                        | #EA580C (Cam đậm)    |
| critical    | Nguy kịch             | Critical Risk                    | #DC2626 (Đỏ sẫm)     |
| unverified  | Cần thẩm định lại     | Unverified / Needs Re-evaluation| #64748B (Xám đá)     |
+-------------+-----------------------+----------------------------------+----------------------+
```

- **Thẩm định cấp độ `unverified` (Chống Âm tính giả - False Negative)**:
  - Trong chẩn đoán sàng lọc vi mạch võng mạc, nguy cơ tồi tệ nhất là bỏ sót ca bệnh (False Negative) do ảnh đáy mắt bị mờ, đục thủy tinh thể, mất nét gai thị hoặc bóng đổ đồng tử.
  - Từ điển đã dịch chuẩn xác `unverified` thành *"Cần thẩm định lại"* (VI) và *"Unverified / Needs Re-evaluation"* (EN).
  - Tuyệt đối không đánh đồng trạng thái không nhận diện được thành "Bình thường" (Normal / Low Risk).
  - Màu sắc gán cho cấp độ này là màu xám đá `#64748B` (Slate-500), tách biệt hoàn toàn với màu xanh lá an toàn của nhóm Nguy cơ thấp.

- **Thẩm định phân biệt giữa "Độ tin cậy của mô hình" (Confidence) và "Xác suất mắc bệnh" (Disease Probability)**:
  - Trong `anomalies`: Mục từ `confidence` được dịch chuẩn xác là *"Độ tin cậy"* (VI) và *"Confidence"* (EN).
  - Trong `biomarkers` và `cdsViewer`: Điểm rủi ro lâm sàng được tách biệt rõ ràng dưới các biến số `overallVascularRiskScore`, `cardiovascularRisk.score` (tính theo thang điểm 0–100 hoặc phần trăm nguy cơ dịch tễ học 3 năm).
  - Hệ thống không hiển thị lẫn lộn giữa độ tự tin nhận diện hình học của mạng nơ-ron (Bouding Box Confidence) và xác suất người bệnh bị tai biến mạch máu não, ngăn ngừa sự nhầm lẫn nghiêm trọng trong diễn giải lâm sàng.

---

### 3.3. Thẩm Định Phân Loại Giải Phẫu Mắt (Eye Laterality) & Phòng Ngừa Sự Cố Nhầm Bên Mắt

Theo Thống kê Biến cố Y khoa Nghiêm trọng (Sentinel Events) của The Joint Commission và Tổ chức Y tế Thế giới (WHO), sự cố can thiệp/phẫu thuật nhầm bên (Wrong-site / Wrong-eye procedures) chiếm tỷ lệ cao trong các sự cố chuyên khoa Mắt. Do đó, việc định danh mắt phải, mắt trái trong hệ thống hồ sơ bệnh án điện tử đòi hỏi độ chính xác tuyệt đối.

- **Rà soát danh mục từ điển `eyeLaterality`**:
  + Mắt Phải:
    - VI: `"Mắt phải (OD)"` | Dạng ngắn: `"Mắt phải"`
    - EN: `"Right Eye (OD)"` | Dạng ngắn: `"Right Eye"`
  + Mắt Trái:
    - VI: `"Mắt trái (OS)"` | Dạng ngắn: `"Mắt trái"`
    - EN: `"Left Eye (OS)"` | Dạng ngắn: `"Left Eye"`
  + Cả hai mắt:
    - VI: `"Cả hai mắt (OU)"` | Dạng ngắn: `"Cả hai mắt"`
    - EN: `"Both Eyes (OU)"` | Dạng ngắn: `"Both Eyes"`
- **Đánh giá giá trị an toàn lâm sàng**:
  1. *Lưỡng toàn kỳ mỹ giữa Y khoa Quốc tế và Dễ hiểu cho Bệnh nhân*:
     - Bệnh nhân phổ thông nhìn vào thấy ngay: *"Mắt phải"*, *"Mắt trái"* (hoặc *"Right Eye"*, *"Left Eye"*), không bị bối rối bởi thuật ngữ Latin cổ điển.
     - Bác sĩ chuyên khoa, nhân viên nhãn khoa và hệ thống trao đổi dữ liệu EMR/EHR thấy ngay ký hiệu Latin chuẩn tắc: `OD` (*Oculus Dexter*), `OS` (*Oculus Sinister*), `OU` (*Oculus Uterque*).
  2. *Triệt tiêu chuỗi lai tạp lủng củng*:
     - Loại bỏ chuỗi cũ gây rối mắt: `"Mắt Phải - OD (Oculus Dexter)"` $\rightarrow$ Chuẩn hóa thành `"Mắt phải (OD)"` (VI) và `"Right Eye (OD)"` (EN).
     - Component `EyeBadge.tsx` có cơ chế fallback an toàn: Nếu không có dữ liệu vị trí mắt (`position = undefined`), hệ thống hiển thị nhãn trung tính an toàn *"Chưa xác định"* với màu xám, tuyệt đối không tự động suy đoán thành mắt phải (OD).

---

### 3.4. Thẩm Định Phân Loại Kiểu Chụp Võng Mạc (Scan Modalities / Types)

Mỗi phương thức chụp đáy mắt nhắm vào một vùng giải phẫu khác nhau và phục vụ cho một bài toán chẩn đoán hoàn toàn khác biệt:

- **1. Chụp vùng hoàng điểm (`maculaCentered`)**:
  - VI: Nhãn *"Ảnh màu đáy mắt hoàng điểm"*, mô tả *"Tập trung vùng hoàng điểm và vi mạch trung tâm võng mạc"*.
  - EN: Nhãn *"Macula-Centered Fundus Color"*, mô tả *"Targeted on foveal center and parafoveal capillary network"*.
  - *Ý nghĩa lâm sàng*: Hoàng điểm (Macula/Fovea) quyết định thị lực trung tâm 20/20. Đây là vị trí soi chiếu chính xác các tổn thương vi phình mạch mao mạch (Microaneurysm), xuất tiết cứng (Hard Exudate), phù hoàng điểm đái tháo đường (DME) và thoái hóa hoàng điểm tuổi già (AMD).
- **2. Chụp vùng gai thị / đĩa thị (`opticDisc`)**:
  - VI: Nhãn *"Ảnh màu đáy mắt gai thị"*, mô tả *"Tập trung gai thị, viền thần kinh và tỷ lệ lõm đĩa thị"*.
  - EN: Nhãn *"Optic Disc Fundus Color"*, mô tả *"Targeted on neuroretinal rim, optic cup, and vascular arcades"*.
  - *Ý nghĩa lâm sàng*: Gai thị (Optic Disc) là nơi tập hợp hơn 1 triệu sợi trục thần kinh thị giác. Đây là vị trí bắt buộc để đo tỷ lệ lõm đĩa thị (Cup-to-Disc Ratio - CDR) dùng trong sàng lọc bệnh Glaucoma (cườm nước), phù gai thị do tăng áp lực nội sọ và đánh giá cung mạch lớn quanh đĩa thị.
- **3. Chụp cắt lớp quang học võng mạc (`oct`)**:
  - VI: Nhãn *"Chụp cắt lớp võng mạc (OCT)"*, mô tả *"Phân tích lớp cắt chuyên sâu đánh giá vi mô võng mạc"*.
  - EN: Nhãn *"Optical Coherence Tomography (OCT)"*, mô tả *"High-resolution cross-sectional tomographic imaging of retinal layers"*.
  - *Ý nghĩa lâm sàng*: Phương pháp chẩn đoán hình ảnh cắt lớp vi thể không xâm lấn, cho phép đo độ dày từng lớp võng mạc và lớp sợi thần kinh võng mạc (RNFL).
- **Đánh giá lâm sàng**: Việc phân tách rạch ròi 3 kiểu chụp giúp thuật toán AI và bác sĩ áp dụng đúng quy trình kiểm thử, không đánh giá sai chỉ số CDR trên ảnh hoàng điểm và không phân tích sai xuất tiết trên ảnh gai thị.

---

### 3.5. Thẩm Định Danh Mục Chỉ Số Sinh Học Vi Mạch (Biomarkers) & Bệnh Học Quốc Tế ICD-10

- **Chỉ số sinh học vi mạch (`biomarkers`)**:
  + **Tỷ lệ động-tĩnh mạch (`avr`)**:
    - VI: *"Tỷ lệ động-tĩnh mạch"* | Viết tắt: `"A/V"` | Tham chiếu: *"Bình thường: ~0.67 (2:3)"* | Ý nghĩa: *"Chỉ số co hẹp tiểu động mạch do tăng huyết áp mạn tính"*.
    - EN: *"Arteriolar-Venular Ratio"* | Viết tắt: `"AVR"` | Tham chiếu: *"Normal Reference: ~0.67 (2:3)"* | Ý nghĩa: *"Indicator of arteriolar narrowing associated with chronic hypertension"*.
  + **Mật độ vi mạch (`vesselDensity`)**:
    - VI: *"Mật độ vi mạch"* | Đơn vị: `"%"` | Tham chiếu: *"Bình thường: 16.0% – 22.0%"* | Ý nghĩa: *"Phản ánh tình trạng tưới máu và thiếu máu cục bộ mao mạch võng mạc"*.
    - EN: *"Vessel Density"* | Đơn vị: `"%"` | Tham chiếu: *"Normal Range: 16.0% – 22.0%"* | Ý nghĩa: *"Reflects retinal capillary perfusion and non-perfusion ischemia"*.
  + **Độ ngoằn ngoèo mạch máu (`tortuosity`)**:
    - VI: *"Độ ngoằn ngoèo mạch máu"* | Tham chiếu: *"Bình thường: 1.10 – 1.20"* | Ý nghĩa: *"Tăng áp lực thành mạch và biến đổi cấu trúc cung mạch võng mạc"*.
    - EN: *"Vascular Tortuosity"* | Tham chiếu: *"Normal Range: 1.10 – 1.20"* | Ý nghĩa: *"Associated with increased transluminal pressure and vascular remodeling"*.
  + **Tỷ lệ lõm đĩa thị (`cdr`)**:
    - VI: *"Tỷ lệ lõm đĩa thị"* | Viết tắt: `"C/D"` | Tham chiếu: *"Bình thường: 0.30 – 0.40"* | Ý nghĩa: *"Chỉ số quan trọng trong sàng lọc và theo dõi bệnh lý Glaucoma"*.
    - EN: *"Vertical Cup-to-Disc Ratio"* | Viết tắt: `"CDR"` | Tham chiếu: *"Normal Reference: 0.30 – 0.40"* | Ý nghĩa: *"Crucial metric for glaucomatous optic neuropathy screening"*.
- **Danh mục mã bệnh ICD-10 (`icd10`)**:
  + `H35.0`: Bệnh lý mạch máu võng mạc và biến đổi vi mạch (*Retinal vascular changes and background retinopathy*).
  + `H35.03`: Bệnh võng mạc tăng huyết áp (*Hypertensive retinopathy*).
  + `E11.3`: Bệnh võng mạc đái tháo đường type 2 (*Type 2 diabetes mellitus with diabetic retinopathy*).
  + `E10.3`: Bệnh võng mạc đái tháo đường type 1 (*Type 1 diabetes mellitus with diabetic retinopathy*).
  + `I10`: Tăng huyết áp vô căn (*Essential (primary) hypertension*).
  + `H40.1`: Glaucoma góc mở nguyên phát (*Primary open-angle glaucoma*).
  + `H35.3`: Thoái hóa hoàng điểm tuổi già (*Age-related macular degeneration - AMD*).
  + `I63`: Nhồi máu não / Nguy cơ đột quỵ thiếu máu cục bộ (*Cerebral infarction / Ischemic stroke risk*).
- **Đánh giá**: Toàn bộ mã bệnh ICD-10 giữ nguyên mã chữ số quốc tế của Tổ chức Y tế Thế giới (WHO), chỉ chuyển ngữ phần mô tả lâm sàng tương ứng với từng ngôn ngữ được chọn.

---

## 4. XÁC NHẬN CHÍNH SÁCH ZERO-HYBRID STRINGS & BẢO TỒN THUẬT NGỮ VIẾT TẮT CHUẨN QUỐC TẾ

### 4.1. Khảo Sát Tính Triệt Để Của Chính Sách Zero-Hybrid Strings
Qua kiểm tra quét toàn diện mã nguồn (`SCAN-1` & `SCAN-2` trong bộ test `i18n-clinical-system.test.ts`):
- Toàn bộ các chuỗi lai tạp cũ đã bị triệt tiêu 100%:
  + `Bàn Chẩn Đoán Tương Tác CDS (Fundus & Grad-CAM Heatmap Viewer)` $\rightarrow$ Đã thay thế thành `Bàn chẩn đoán tương tác CDS — Bản đồ nhiệt Grad-CAM` (VI) hoặc `Interactive CDS Workspace — Grad-CAM Heatmap` (EN).
  + `Fundus Color - Macula Centered` $\rightarrow$ Không còn tồn tại dưới dạng chuỗi lai ghép trong giao diện tiếng Việt.
  + `Fundus Color - Optic Disc` $\rightarrow$ Đã được chuyển dịch tách bạch.
  + `Oculus Dexter` / `Oculus Sinister` $\rightarrow$ Đã tinh gọn thành mã chuẩn `(OD)` / `(OS)`.

### 4.2. Bảo Tồn Thuật Ngữ Viết Tắt Chuẩn Quốc Tế Cần Thiết
Chính sách Zero-Hybrid Strings **không đồng nghĩa với việc xóa bỏ cực đoan các thuật ngữ viết tắt y khoa quốc tế**. Hệ thống vẫn bảo lưu trọn vẹn các ký hiệu thiết yếu trong hồ sơ bệnh án điện tử (EMR):
1. `OD` (*Oculus Dexter*), `OS` (*Oculus Sinister*), `OU` (*Oculus Uterque*): Xuất hiện kèm trong dấu ngoặc đơn ở cả hai bản ngữ, bảo đảm bác sĩ không cần suy đoán.
2. `OCT` (*Optical Coherence Tomography*): Giữ nguyên chuẩn viết tắt trong cả tiếng Việt lẫn tiếng Anh.
3. `AVR` / `A/V Ratio`: Giữ nguyên ký hiệu tỷ lệ động mạch - tĩnh mạch.
4. `CDR` / `C/D Ratio`: Giữ nguyên ký hiệu tỷ lệ lõm gai thị.
5. `ICD-10`: Giữ nguyên mã số phân loại bệnh học quốc tế của WHO.
6. `Grad-CAM` (*Gradient-weighted Class Activation Mapping*): Giữ nguyên tên kỹ thuật giải thích mô hình AI chuẩn trong khoa học dữ liệu và y khoa.

### 4.3. Đánh Giá Trải Nghiệm Chuyển Đổi Ngôn Ngữ (`LanguageSwitcher`)
- Nút chuyển đổi `LanguageSwitcher` được thiết kế công thái học:
  + Hiển thị rõ ràng mã ngôn ngữ hiện tại `VI / EN`.
  + Tự động thích ứng chế độ buồng tối `isDarkRoom` với độ tương phản sắc nét, tránh gây lóa mắt cho bác sĩ trong phòng soi đáy mắt.
  + Chuyển đổi ngôn ngữ tức thời không cần tải lại trang (Zero reload flicker), bảo toàn nguyên vẹn trạng thái phân tích hình ảnh đang hiển thị trên bàn chẩn đoán CDS.

---

## 5. DỮ LIỆU THỰC NGHIỆM & KIỂM THỬ HỆ THỐNG TOÀN DIỆN

Toàn bộ các tiêu chí an toàn y khoa, độ toàn vẹn từ điển song ngữ và việc loại bỏ chuỗi lai tạp đã được chứng thực thông qua 4 bộ kiểm thử tự động độc lập:

1. **Bộ kiểm thử hệ thống Đa ngôn ngữ Lâm sàng (`i18n-clinical-system.test.ts`)**: **19/19 Tests PASS (100%)**
   - `I18N-1` & `I18N-2`: Đầy đủ 2 từ điển vi/en, bao phủ 100% 15 phân hệ nghiệp vụ y tế.
   - `I18N-3`: Tuyên bố miễn trừ y tế khớp 100% hướng dẫn Bộ Y tế và AAO.
   - `I18N-4`: Đầy đủ 5 phân tầng nguy cơ lâm sàng chuẩn.
   - `I18N-5`: Phân định vị trí mắt OD/OS/OU an toàn.
   - `ZERO-HYBRID-1` & `ZERO-HYBRID-2`: 0 chuỗi lai tạp cũ trong cả 2 từ điển.
   - `DOT-NOTATION-1` & `DOT-NOTATION-2`: Truy xuất đa tầng chuẩn xác, fallback an toàn không gây crash ứng dụng.
   - `SWITCHER-1`, `2`, `3`: LanguageSwitcher render chuẩn, có accessibility và hỗ trợ buồng tối.
   - `LIVE-RENDER-1`, `2`, `3`: InteractiveCDSViewer và MedicalDisclaimer render thực tế tách bạch 100% giữa VI và EN.
   - `SCAN-1` & `SCAN-2`: Quét toàn diện codebase xác nhận không còn chuỗi lai tạp.
   - `PARITY-1` & `PARITY-2`: Đối xứng 100% các trường giữa VI và EN, không có trường nào null/undefined.

2. **Các bộ kiểm thử Lâm sàng & UI phụ trợ**:
   - `clinical-ui-components.test.ts`: **78/78 Tests PASS (100%)** (Disclaimer, RiskBadge, ClinicalSelect, EyeBadge, ScanTypeBadge, InteractiveCDSViewer).
   - `clinical-verification.test.ts`: **14/14 Tests PASS (100%)** (FR-6, FR-7, xuất CSV có Disclaimer).
   - `ai-analysis-flow.test.ts`: **10/10 Tests PASS (100%)** (Tiến trình AI, ClinicalRiskSummaryCard, an toàn biomarkers).
   - **TỔNG CỘNG TEST SUITES FRONTEND: 121/121 TESTS ĐẠT (100% PASS)**.

3. **Kiểm tra Biên dịch Toàn dự án (Frontend Build Verification)**:
   - Lệnh thực thi: `npm run build`
   - Kết quả: `tsc && vite build` hoàn thành thành công trong **11.05s**, **0 lỗi biên dịch TypeScript (0 Errors)**.

---

## 6. KẾT LUẬN & QUYẾT ĐỊNH PHÊ DUYỆT CỦA CHUYÊN GIA AN TOÀN Y KHOA

Căn cứ trên kết quả thẩm định độc lập toàn diện đối với Hệ thống Đa Ngôn Ngữ Song Ngữ (Bilingual i18n) và Chính sách Không Chuỗi Lai Tạp (Zero-Hybrid Strings):

1. **Bộ từ điển y khoa song ngữ (`translations.ts`)** đạt chuẩn mực cao nhất về tính chính xác thuật ngữ y học lâm sàng; đáp ứng đầy đủ các yêu cầu pháp lý về phần mềm thiết bị y tế (SaMD) theo khuyến cáo của Bộ Y tế Việt Nam, FDA và Hội Nhãn khoa Hoa Kỳ (AAO).
2. **Tuyên bố miễn trừ y tế (Medical Disclaimer)** được triển khai đồng bộ, chính xác và bất khả xâm phạm ở cả hai ngôn ngữ trên 100% các màn hình hiển thị kết quả và báo cáo xuất ra.
3. **Phân tầng nguy cơ 5 cấp độ** rành mạch, bảo đảm nguyên tắc kiểm soát rủi ro Âm tính giả (False Negative Prevention) với nhãn *"Cần thẩm định lại"* / *"Unverified"* cho các ca không đủ điều kiện quang học.
4. **Phân loại giải phẫu mắt (OD, OS, OU)** kết hợp hài hòa giữa ngôn ngữ tự nhiên và từ viết tắt Latin y khoa chuẩn thế giới, loại trừ triệt để nguy cơ nhầm lẫn điều trị sai bên mắt.
5. **Chính sách Zero-Hybrid Strings** đã loại bỏ hoàn toàn các chuỗi lai tạp phản cảm, đồng thời bảo tồn trọn vẹn các ký hiệu viết tắt chuyên khoa cần thiết trong bệnh án điện tử quốc tế.

### **QUYẾT ĐỊNH PHÊ DUYỆT CUỐI CÙNG:**
# **[X] CHẤP THUẬN AN TOÀN Y KHOA (APPROVED - PASS 100%)**

---
*Biên bản thẩm định được lập bởi Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập AURA (Medical Safety Reviewer), có giá trị pháp lý nội bộ trong hệ thống quản trị chất lượng phần mềm y tế AURA và được lưu vết tại `docs/07-testing/medical-safety-signoff-i18n-and-zero-hybrid.md`.*
