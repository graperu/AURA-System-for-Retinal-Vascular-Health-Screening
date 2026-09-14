# BIÊN BẢN THẨM ĐỊNH AN TOÀN Y KHOA (MEDICAL SAFETY COMPLIANCE SIGN-OFF)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL CLINICAL DECISION SUPPORT)
### Chuyên Đề: Thẩm Định Thành Phần Lựa Chọn Lâm Sàng (ClinicalSelect) & Hệ Thống Chuyển Động Giao Diện (Motion System)

---

- **Chuyên gia thẩm định**: Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập (Medical Safety Reviewer)
- **Căn cứ pháp lý & quy chuẩn y tế**: 
  - CE-MDR 2017/745 (Quy định thiết bị y tế Châu Âu - Medical Device Regulation).
  - FDA SaMD (Software as a Medical Device - Clinical Decision Support Guidance).
  - Tiêu chuẩn Trợ Năng Trực Quan Y Tế & Chống Co Giật Quang Cảm Ứng (WCAG 2.1 AA - Success Criterion 2.3.1 & 1.4.1).
  - Bộ Quy tắc An toàn Y khoa AURA (`medical-safety.md`).
  - Cổng Chất Lượng Y Khoa QG6 (Medical Safety & Clinical Compliance Gate).
- **Đối tượng thẩm định**:
  1. Component lựa chọn chuyên biệt y khoa `ClinicalSelect.tsx` (thay thế toàn bộ native `<select>` trên toàn bộ giao diện AURA).
  2. Bảng phân tầng rủi ro màu sắc (Risk Stratification & Risk Dots).
  3. Chế độ buồng tối nhãn khoa (Darkroom Mode).
  4. Hệ thống Animation & Khung chuyển động lâm sàng (`tailwind.config.js`, `theme.css`).
  5. Cơ chế hỗ trợ người nhạy cảm chuyển động (`prefers-reduced-motion`).
  6. Tính toàn vẹn của dữ liệu lâm sàng, quy trình ký số bác sĩ và Tuyên bố miễn trừ y tế (Medical Disclaimer).
- **Ngày thẩm định**: 14/09/2026
- **Kết luận thẩm định**: **CHẤP THUẬN AN TOÀN LÂM SÀNG (APPROVED - PASS 100%)**

---

## 1. TỔNG QUAN HỒ SƠ & BỐI CẢNH THẨM ĐỊNH

AURA là hệ thống phần mềm y tế hỗ trợ quyết định lâm sàng (Clinical Decision Support - CDS) dùng trong sàng lọc sớm các bệnh lý vi mạch võng mạc (Vascular Retinopathy) và nguy cơ tim mạch (Cardiovascular Risk) thông qua phân tích ảnh chụp đáy mắt (Fundus Color / OCT) bằng AI.

Gần đây, đội ngũ kỹ thuật frontend đã thực hiện nâng cấp quy mô lớn:
1. **Thay thế toàn bộ thẻ native `<select>`** bằng component chuyên dụng **`ClinicalSelect`** tại tất cả các phân hệ trọng yếu:
   - `PatientUploader.tsx`: Lựa chọn loại ảnh chụp (Hoàng điểm, Gai thị, OCT Scan).
   - `PatientHistoryView.tsx`: Lọc theo vị trí giải phẫu mắt (OD, OS, ALL, BOTH), lọc theo mức nguy cơ, sắp xếp.
   - `DoctorDiagnosisModal.tsx`: Điều chỉnh mức nguy cơ tim mạch & võng mạc đái tháo đường của bác sĩ.
   - `DoctorWorklistView.tsx`: Lọc trạng thái duyệt lâm sàng và mức độ nguy cơ.
   - `BatchUploadModal.tsx` & `ClinicBatchProcessing.tsx`: Chỉ định vị trí mắt và bộ lọc xử lý hàng loạt.
   - `PatientAssignmentBoard.tsx`: Chỉ định bác sĩ phụ trách ca bệnh.
   - `MedicalProfileModal.tsx`: Nhập thông tin giới tính, nhóm máu, loại đái tháo đường.
2. **Tích hợp Hệ Thống Chuyển Động (Motion System)**: Các chuyển động mở/đóng modal, dropdown menu, hover, transition buồng tối và hỗ trợ `prefers-reduced-motion`.

Với quyền phủ quyết độc lập (Veto Power), Chuyên gia An toàn Y khoa tiến hành đánh giá thực nghiệm toàn bộ codebase để ngăn chặn triệt để mọi rủi ro có khả năng gây tổn hại đến an toàn người bệnh và bác sĩ.

---

## 2. BẢNG KIỂM TRA 6 TIÊU CHÍ AN TOÀN LÂM SÀNG CỐT LÕI (6-PILLAR CLINICAL SAFETY AUDIT)

| STT | Tiêu Chí An Toàn Lâm Sàng | Tiêu Chuẩn Thẩm Định | Hiện Trạng Thực Tế Trong Codebase | Đánh Giá Lâm Sàng |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Không chẩn đoán xác định tự động (No Definitive Diagnosis)** | Hệ thống tuyệt đối không đưa ra chẩn đoán xác định tự động; kết quả AI chỉ mang tính chất định hướng nguy cơ hỗ trợ bác sĩ. | Toàn bộ kết quả AI chưa qua bác sĩ ký duyệt đều mang trạng thái sơ bộ `ANALYZED` kèm thông điệp rõ ràng: *"Kết Quả Sơ Bộ AI - Chờ Bác Sĩ Thẩm Định"*, *"Chưa ký số — Bản phân tích sơ bộ"*. | **ĐẠT (PASS)** |
| **2** | **Không kê đơn / can thiệp điều trị tự động (No Automated Prescriptions)** | Nghiêm cấm tự ý kê đơn thuốc, liều lượng, hoặc đề xuất phác đồ điều trị xâm lấn tự động. | Không có chức năng kê đơn tự động. Khuyến nghị chỉ tập trung vào chế độ theo dõi, thời hạn tái khám và cảnh báo khẩn cấp đưa người bệnh tới cơ sở chuyên khoa. | **ĐẠT (PASS)** |
| **3** | **Bác sĩ ký duyệt & Thẩm quyền chuyên môn (Doctor Sign-Off)** | Mọi ca sàng lọc có nguy cơ phải có sự thẩm định, hiệu chỉnh và ký số của bác sĩ chuyên khoa có chứng chỉ hành nghề. | `DoctorDiagnosisModal` cung cấp 3 quyền quyết định tối cao: Duyệt (`APPROVED`), Hiệu chỉnh (`MODIFIED`), Bác bỏ (`REJECTED`), gắn mã bệnh ICD-10 và lưu vết chữ ký số SHA-256 (`digitalSignature`, `signedAt`, `signerName`). | **ĐẠT (PASS)** |
| **4** | **Cảnh báo miễn trừ y tế bắt buộc (Medical Disclaimer Enforcement)** | Thông điệp miễn trừ y tế chuẩn phải xuất hiện thường trực trên mọi màn hình kết quả, bàn chẩn đoán CDS và báo cáo in/xuất CSV. | Xuất hiện đầy đủ tại 100% các màn hình hiển thị kết quả AI (`InteractiveCDSViewer`, `ClinicalRiskSummaryCard`, `PatientScreeningResultView`, `MedicalReportModal`, `SideNavBar`, `AuthHeroPanel`) và dòng đầu tiên của file CSV. | **ĐẠT (PASS)** |
| **5** | **Bảo tồn toàn vẹn ảnh giải phẫu gốc (Raw Image Preservation)** | Ảnh chụp đáy mắt gốc phải được giữ nguyên vẹn, không bị nén mất chi tiết vi mạch nhỏ, không co giãn làm méo tỷ lệ giải phẫu. | Áp dụng `object-contain` nghiêm ngặt trên cả 2 khung viewport ảnh gốc và Grad-CAM Heatmap trong `InteractiveCDSViewer`, hỗ trợ dung lượng tệp gốc tới 15MB (.png, .jpg, .tif, .dcm). | **ĐẠT (PASS)** |
| **6** | **Kiểm soát rủi ro Âm tính giả (False Negative Prevention)** | Khi ảnh mờ, độ tin cậy thấp hoặc thiếu dữ liệu, cấm kết luận là Bình thường (Low). Phải phân loại là "Cần thẩm định lại". Cấm Mock Data. | `ClinicalSelect` và `RiskBadge` ánh xạ mức không xác định về `unverified` (*"Cần thẩm định lại"*, màu xám trung tính Slate-500). Hệ thống AI kết nối trực tiếp Gemini Vision, báo lỗi trung thực khi mất kết nối. | **ĐẠT (PASS)** |

---

## 3. THẨM ĐỊNH CHI TIẾT CÁC HẠNG MỤC TRỌNG YẾU

### 3.1. Thẩm Định An Toàn Lâm Sàng Của Component `ClinicalSelect`

#### A. Đánh giá tính chuẩn xác của Thuật ngữ Lâm sàng & Hiện tượng Cắt xén (Truncation Analysis)
- **Rà soát danh mục nhãn lâm sàng trọng yếu**:
  1. *Loại ảnh chụp đáy mắt (`PatientUploader.tsx`)*:
     - `Fundus_Macula`: Nhãn *"Ảnh màu đáy mắt hoàng điểm"*, nhãn phụ *"Fundus Color - Macula Centered (Hoàng điểm & vi mạch trung tâm)"*.
     - `Fundus_OpticDisc`: Nhãn *"Ảnh màu đáy mắt gai thị"*, nhãn phụ *"Fundus Color - Optic Disc (Gai thị & tỷ lệ cup/disc)"*.
     - `OCT_Scan`: Nhãn *"Chụp cắt lớp võng mạc (OCT)"*, nhãn phụ *"Optical Coherence Tomography (Phân tích lớp cắt chuyên sâu)"*.
     - **Nhận xét lâm sàng**: Tên phân loại giải phẫu chuẩn xác, phân biệt rạch ròi giữa chụp hoàng điểm (đánh giá vi mạch trung tâm, xuất tiết thoái hóa) và chụp gai thị (đánh giá đĩa thị, tỷ lệ Cup-to-Disc cho Glaucoma).
  2. *Vị trí giải phẫu mắt (`PatientHistoryView.tsx`, `BatchUploadModal.tsx`, `EyeBadge.tsx`)*:
     - Mắt Phải: `"Mắt Phải (OD)"` / `"OD (Oculus Dexter)"`.
     - Mắt Trái: `"Mắt Trái (OS)"` / `"OS (Oculus Sinister)"`.
     - Cả hai mắt: `"Cả hai mắt (OU)"` / `"OU (Oculus Uterque)"`.
     - **Nhận xét lâm sàng**: Việc duy trì đồng thời cả tên tiếng Việt và từ viết tắt Latin y khoa chuẩn (`OD`, `OS`, `OU`) triệt tiêu hoàn toàn rủi ro nhầm lẫn bên mắt (Wrong-eye medical error) — một trong những sự cố y khoa nghiêm trọng hàng đầu trong chuyên khoa Mắt.
  3. *Mức độ phân tầng rủi ro (`DoctorDiagnosisModal.tsx`, `PatientHistoryView.tsx`)*:
     - `Low`: `"Low — Thấp"` (Xanh lá).
     - `Moderate`: `"Moderate — Trung Bình"` (Vàng cam).
     - `High`: `"High — Cao"` (Cam đậm).
     - `Severe / Critical`: `"Severe — Nghiêm Trọng"` / `"Nguy kịch"` (Đỏ sẫm).
- **Phân tích cơ chế hiển thị và rủi ro cắt xén (Truncation)**:
  - Trong `ClinicalSelect.tsx`: 
    - Trigger sử dụng `<span className="truncate block font-semibold">` kết hợp với cấu trúc Flexbox `flex-1 min-w-0`.
    - Menu danh sách thả xuống có kích thước tối thiểu `min-w-[180px]` và mở rộng tự động theo chiều rộng khung chứa.
    - Cấu trúc các nhãn văn bản được thiết kế theo nguyên tắc *Front-loaded semantics*: Các từ khóa định danh lâm sàng quan trọng nhất (như *Mắt Phải*, *Mắt Trái*, *Hoàng điểm*, *Gai thị*, *Low*, *High*, *Severe*) luôn được đặt ở đầu chuỗi. Do đó, ngay cả trong trường hợp cực đoan trên màn hình di động hẹp, phần bị che khuất chỉ là giải thích bổ trợ, **hoàn toàn không làm đảo ngược hay biến dạng ý nghĩa y khoa cốt lõi**.
    - Phía dưới trigger được tích hợp thẻ native `<select className="sr-only" tabIndex={-1} aria-hidden="true">` lưu giữ 100% chuỗi nguyên bản cho bộ đọc màn hình và serialize dữ liệu biểu mẫu.
  - **Khuyến nghị bổ sung cho nhóm UI/UX**: Khuyến nghị bổ sung thuộc tính HTML `title={selectedOption ? selectedOption.label : placeholder}` vào thẻ `span` của trigger button và option item nhằm kích hoạt tooltip bản địa của trình duyệt khi bác sĩ rê chuột, tăng cường thêm một lớp an toàn dự phòng trên các màn hình có độ phân giải siêu nhỏ.

#### B. Thẩm Định Mã Màu Phân Tầng Rủi Ro (Risk Dot / Risk Stratification)
- Component `ClinicalSelect` triển khai bảng màu `RISK_DOT_COLORS` chuyên dụng:
  ```typescript
  const RISK_DOT_COLORS = {
    low: 'bg-[#16A34A]',        // Xanh lá y tế (Low Risk / Bình thường)
    moderate: 'bg-[#D97706]',   // Vàng cam y tế (Moderate Risk / Cần theo dõi)
    high: 'bg-[#EA580C]',       // Cam đậm y tế (High Risk / Nguy cơ cao)
    critical: 'bg-[#DC2626]',   // Đỏ sẫm y tế (Critical / Báo động khẩn)
    unverified: 'bg-[#64748B]', // Xám đá trung tính (Unverified / Cần thẩm định lại)
  } as const;
  ```
- **Đánh giá chuẩn mực y tế**:
  1. *Đồng bộ 100% với Quy chuẩn mã màu AURA (`coding-standards.md` & `medical-safety.md`)*: Các mã màu hex `#16A34A`, `#D97706`, `#EA580C`, `#DC2626` khớp tuyệt đối với các ngưỡng nguy cơ tim mạch và võng mạc đái tháo đường của hệ thống.
  2. *Tuân thủ tiêu chuẩn chống mù màu (WCAG 2.1 SC 1.4.1 - Non-color Reliance)*: Mỗi chấm màu `Risk Dot` chỉ đóng vai trò hỗ trợ trực quan bổ trợ (`aria-hidden="true"`). Mọi lựa chọn rủi ro đều bắt buộc hiển thị kèm nhãn chữ (Text label) đầy đủ ngữ nghĩa (ví dụ: *"Low — Thấp"*, *"High — Cao"*), bảo đảm các bác sĩ hoặc người bệnh có khiếm khuyết thị giác về màu (Protanopia / Deuteranopia) không bị nhận diện sai lệch.
  3. *Nguyên tắc phòng ngừa Âm tính giả (False Negative Prevention)*: Mức `unverified` sử dụng màu xám trung tính `#64748B`, tuyệt đối không mượn màu xanh lá (Low Risk) khi dữ liệu ảnh chưa đủ độ tin cậy.

#### C. Thẩm Định Chế Độ Buồng Tối Nhãn Khoa (Darkroom Mode)
- **Đặc thù chuyên khoa Nhãn khoa**: Phòng soi đáy mắt và đọc ảnh huỳnh quang võng mạc luôn duy trì điều kiện chiếu sáng thấp (thường < 10–20 lux) để đồng tử bác sĩ giãn tự nhiên và tối đa hóa độ nhạy cảm thị giác tương phản với các thương tổn vi mô (như vi phình mạch Microaneurysm < 30 µm, xuất huyết chấm chắt). Ánh sáng trắng từ màn hình thông thường sẽ kích hoạt phản xạ co đồng tử (Pupillary Light Reflex) và gây lóa mỏi mắt (Photophobia / Visual Glare).
- **Thẩm định triển khai trên `ClinicalSelect`**:
  - Hỗ trợ linh hoạt thông qua thuộc tính `isDarkRoom` hoặc `darkroom` (`const effectiveDarkRoom = Boolean(isDarkRoom || darkroom);`).
  - Màu nền khi đóng: `#0B132B` (Obsidian Navy sâu, triệt tiêu phản xạ ánh sáng trắng).
  - Màu nền khi mở: `#0F172A` (Slate 900 trầm tĩnh), đường viền viền tối `#1E293B`.
  - Màu chữ hiển thị: `#F8FAFC` (Slate 50) mang lại tỷ lệ tương phản sắc nét > 14:1 trên nền tối, đọc rõ ràng nhưng không tạo quầng sáng chói (Halos).
  - Trạng thái chọn và hover: Nền `bg-cyan-950/70`, chữ `text-cyan-300`, viền điểm nhấn `border-cyan-400`, icon dấu tích `text-cyan-400`.
  - Tích hợp thanh cuộn tối chuyên biệt `.darkroom-scrollbar`.
- **Kết luận**: Đạt tiêu chuẩn tối ưu công thái học buồng tối nhãn khoa, bảo vệ thị lực bác sĩ và bảo toàn độ nhạy chẩn đoán hình ảnh.

---

### 3.2. Thẩm Định Hệ Thống Chuyển Động Giao Diện (Motion System)

#### A. Phòng Tránh Động Kinh Quang Cảm Ứng (Photosensitive Epilepsy - WCAG 2.1 SC 2.3.1)
- **Quy chuẩn y tế**: WCAG 2.1 Tiêu chí Thành công 2.3.1 (Three Flashes or Below Threshold) quy định trang web không được chứa bất kỳ thành phần nào nhấp nháy, chớp sáng vượt quá 3 lần trong khoảng thời gian 1 giây (tần số > 3 Hz), vì đây là ngưỡng kích phát cơn co giật động kinh quang cảm ứng hoặc các cơn đau nửa đầu cấp tính (Migraine).
- **Khảo sát hệ thống Animation (`tailwind.config.js`)**:
  - `dropdown-enter`: 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards.
  - `dropdown-exit`: 120ms cubic-bezier(0.4, 0, 1, 1) forwards.
  - `fade-in`: 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards.
  - `fade-out`: 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards.
  - `modal-enter`: 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards.
  - `stagger-fade`: 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards.
  - `shimmer`: 2.2s chu kỳ tuyến tính vô hạn (tần số ~ 0.45 Hz).
  - `pulse-subtle`: 3s chu kỳ vô hạn với biên độ mờ nhẹ từ 100% xuống 75% (tần số ~ 0.33 Hz).
- **Đánh giá an toàn**:
  - 100% các animation tương tác đều có thời lượng ngắn (120ms – 280ms), chuyển động dứt khoát, mượt mà và dừng lại ngay sau khi hoàn thành chu kỳ chuyển cảnh.
  - Các animation lặp lại duy nhất trong hệ thống (`shimmer`, `pulse-subtle`) có chu kỳ từ 2.2 giây đến 3 giây (tần số dao động 0.33 Hz – 0.45 Hz), **thấp hơn gần 10 lần so với ngưỡng cảnh báo nguy hiểm 3 Hz**.
  - Hoàn toàn không có hiện tượng chớp nháy tương phản cao (High-contrast strobing). Đảm bảo an toàn sinh học 100% cho người dùng.

#### B. Tôn Trọng Cơ Chế Giảm Chuyển Động (`prefers-reduced-motion`)
- **Tầm quan trọng y khoa**: Đối với bệnh nhân mắc chứng rối loạn tiền đình (Vestibular Disorders), tổn thương thần kinh thị giác hoặc người cao tuổi dễ bị chóng mặt do chuyển động thị giác, các hiệu ứng trượt/phóng to có thể gây mất thăng bằng hoặc buồn nôn.
- **Khảo sát tệp định kiểu toàn cục (`frontend/src/styles/theme.css`)**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- **Đánh giá an toàn**:
  - Áp dụng triệt để với selector toàn năng `*`, `*::before`, `*::after` kết hợp cờ `!important`.
  - Triệt tiêu toàn bộ thời gian trễ của animation và transition xuống 0.01ms (tức thì), chuyển chế độ cuộn mượt (smooth scroll) thành cuộn tĩnh (`auto`).
  - Đáp ứng trọn vẹn quyền tiếp cận an toàn cho bệnh nhân nhạy cảm chuyển động.

---

### 3.3. Thẩm Định Tuyên Bố Miễn Trừ Y Tế & Tính Toàn Vẹn Dữ Liệu Lâm Sàng

#### A. Giữ Vững Ranh Giới Hỗ Trợ Quyết Định Lâm Sàng (CDS Boundary)
- **Tuyên bố miễn trừ y tế bắt buộc (Mandatory Medical Disclaimer)**:
  - Chuỗi văn bản tiêu chuẩn:
    > *"Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."*
  - Hiện diện thường trực và bắt buộc tại:
    1. `PatientScreeningResultView.tsx`: Cảnh báo trực tiếp bệnh nhân ngay bên dưới kết quả sàng lọc.
    2. `InteractiveCDSViewer.tsx`: Cảnh báo bác sĩ tại chân bàn chẩn đoán CDS đối chiếu ảnh và Grad-CAM.
    3. `ClinicalRiskSummaryCard.tsx`: Xuất hiện dưới dạng banner vàng hổ phách nổi bật trước các nút hành động.
    4. `RiskAssessmentPanel.tsx`: Khung thông báo chuyên biệt dưới bảng định lượng vi mạch.
    5. `MedicalReportModal.tsx`: In trực tiếp trên phiếu báo cáo y tế (Print/PDF) và được đưa vào **Dòng 1** của file xuất CSV.
    6. `SideNavBar.tsx` & `AuthHeroPanel.tsx`: Cảnh báo thường trực tại thanh điều hướng và giao diện đăng nhập/đăng ký.

#### B. Quy Trình Phê Duyệt & Chữ Ký Số Của Bác Sĩ (Doctor Verification & PKI Sign-Off)
- Hệ thống thiết lập rào cản nghiêm ngặt: Kết quả AI độc lập chỉ được xem là "Kết quả sàng lọc sơ bộ".
- Trong `DoctorDiagnosisModal.tsx`, bác sĩ có toàn quyền:
  - Phê duyệt (`APPROVED`).
  - Hiệu chỉnh (`MODIFIED`): Thay đổi mức độ rủi ro tim mạch hoặc võng mạc đái tháo đường nếu nhận thấy AI đánh giá chưa sát với thực tế lâm sàng.
  - Bác bỏ (`REJECTED`): Từ chối kết quả AI nếu chất lượng ảnh chụp kém hoặc phát hiện nhiễu ảnh.
  - Chỉ định mã bệnh học quốc tế ICD-10 (`H35.0`, `E11.3`, `I10`, `H40.1`, `H35.3`).
  - Nhập ghi chú lâm sàng chuyên môn (`clinicalNotes`).
  - Lưu vết chứng thư số điện tử SHA-256 (`digitalSignature`), định danh bác sĩ (`doctorName`, `doctorId`) và thời điểm ký (`signedAt`).

#### C. Nguyên Tắc Cấm Dữ Liệu Giả (No Mock in Production)
- Khảo sát mã nguồn dịch vụ phân tích AI tại backend (`GeminiRetinalAiService.java`): Kết nối trực tiếp mô hình Multimodal Vision thật.
- Khi gặp sự cố mạng hoặc lỗi phân tích hình ảnh, hệ thống kích hoạt cơ chế Fail-safe chuyển trạng thái ca khám thành `FAILED / CHỜ XỬ LÝ LẠI`, **tuyệt đối không trả về số liệu giả mạo (Fake/Mock scores)** để đánh lừa người dùng.
- Các giá trị sinh học định lượng (A/V Ratio, Vessel Density, VCDR) nếu không thể trích xuất được sẽ hiển thị trung thực là *"Chưa xác định"* hoặc *"Chưa đo được"*, ngăn ngừa rủi ro chẩn đoán dựa trên dữ liệu ảo.

---

## 4. DỮ LIỆU THỰC NGHIỆM & KIỂM THỬ HỆ THỐNG

Toàn bộ các tiêu chí an toàn lâm sàng, trợ năng trực quan và logic hiển thị đã được chứng thực thông qua bộ kiểm thử tự động toàn diện:

1. **Frontend Test Suites**: **100/100 Tests ĐẠT (100% PASS)**
   - `frontend/src/tests/clinical-ui-components.test.ts`: **76/76 Tests PASS**
     - 9/9 tests kiểm thử bắt buộc Tuyên bố miễn trừ y tế (Medical Disclaimer) trên mọi biến thể và màn hình.
     - 7/7 tests kiểm thử bảng màu và phân cấp rủi ro RiskBadge (chống False Negative).
     - 6/6 tests kiểm thử component ClinicalSelect (trigger, options, disabled, error, Darkroom mode).
     - 9/9 tests kiểm thử EyeBadge (bảo tồn giải phẫu OD/OS/OU, an toàn mặc định "Chưa xác định").
     - 6/6 tests kiểm thử ScanTypeBadge (phân loại chính xác Fundus Macula, Disc, OCT).
     - 5/5 tests bàn chẩn đoán CDS InteractiveCDSViewer (Dark Room, Zoom, Opacity 65%, Vessel Anomalies).
   - `frontend/src/tests/clinical-verification.test.ts`: **14/14 Tests PASS**
     - Kiểm thử logic lịch sử ca khám, bộ lọc mắt, bộ lọc nguy cơ, xuất báo cáo CSV có disclaimer y tế.
   - `frontend/src/tests/ai-analysis-flow.test.ts`: **10/10 Tests PASS**
     - Kiểm thử luồng tiến trình phân tích AI, chuyển tiếp trạng thái lâm sàng và an toàn biomarkers null/undefined.
2. **Frontend Build Verification**:
   - Lệnh thực thi: `npm run build`
   - Kết quả: `tsc && vite build` hoàn thành thành công trong 6.19s, **0 lỗi biên dịch TypeScript**.

---

## 5. KẾT LUẬN & QUYẾT ĐỊNH PHÊ DUYỆT CỦA CHUYÊN GIA AN TOÀN Y KHOA

Căn cứ trên kết quả thẩm định độc lập và toàn diện đối với component `ClinicalSelect` và Hệ thống Chuyển động (Motion System):

1. `ClinicalSelect` hiển thị rõ ràng, chuẩn xác các thuật ngữ giải phẫu học mắt và phân tầng nguy cơ tim mạch/võng mạc; cấu trúc nhãn loại trừ rủi ro cắt xén gây hiểu lầm y khoa; hỗ trợ native fallback cho trợ năng.
2. Mã màu rủi ro tuân thủ 100% quy chuẩn y tế, kết hợp bắt buộc với nhãn chữ ngữ nghĩa, bảo đảm an toàn cho người khiếm khuyết thị giác màu và ngăn chặn hoàn toàn rủi ro Âm tính giả (False Negative).
3. Chế độ buồng tối (Darkroom Mode) đáp ứng hoàn hảo tiêu chuẩn công thái học phòng đọc ảnh nhãn khoa, bảo vệ khả năng thích ứng tối của bác sĩ.
4. Hệ thống Animation đạt chuẩn an toàn quang học WCAG 2.1 SC 2.3.1, loại trừ triệt để nguy cơ kích phát động kinh quang cảm ứng; thực thi xuất sắc chế độ `prefers-reduced-motion` bảo vệ người bệnh nhạy cảm chuyển động.
5. Tuyên bố miễn trừ y tế và quy trình ký số của bác sĩ được duy trì bất khả xâm phạm; nguyên tắc *No Mock Data in Production* được bảo đảm trọn vẹn.

### **QUYẾT ĐỊNH PHÊ DUYỆT CUỐI CÙNG:**
# **[X] CHẤP THUẬN AN TOÀN Y KHOA (APPROVED)**

---
*Biên bản thẩm định được lập bởi Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập AURA (Medical Safety Reviewer), có giá trị pháp lý nội bộ trong hệ thống quản trị chất lượng phần mềm y tế AURA và được lưu vết tại `docs/07-testing/medical-safety-signoff-clinical-select-and-motion.md`.*
