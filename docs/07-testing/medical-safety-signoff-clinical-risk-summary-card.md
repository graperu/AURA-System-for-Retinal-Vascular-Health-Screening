# BIÊN BẢN THẨM ĐỊNH AN TOÀN Y KHOA (MEDICAL SAFETY COMPLIANCE SIGN-OFF)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL CLINICAL DECISION SUPPORT)
### ĐÁNH GIÁ THAY ĐỔI GIAO DIỆN CLINICAL RISK SUMMARY CARD

---

- **Chuyên viên thẩm định**: Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập (Medical Safety Reviewer)
- **Đối tượng thẩm định**: Tệp giao diện `frontend/src/components/ClinicalRiskSummaryCard.tsx`
- **Mã Cổng Chất Lượng**: Quality Gate QG6 / QG7 (Medical Safety & Clinical Decision Support Compliance)
- **Ngày thẩm định**: 14/09/2026
- **Kết luận phê duyệt**: **CHẤP THUẬN AN TOÀN (APPROVED - PASS 100%)**

---

## 1. TỔNG QUAN HỒ SƠ THẨM ĐỊNH

Theo Quy Tắc An Toàn Y Khoa AURA (`.kilo/rules/medical-safety.md`), AURA được định vị là phần mềm Hỗ trợ Quyết định Lâm sàng (Clinical Decision Support - CDS) và Sàng lọc Ban đầu (Screening Tool). Mọi thành phần giao diện hiển thị kết quả phân tích AI tới người bệnh và bác sĩ phải bảo đảm:
1. Không đưa ra chẩn đoán xác định tự động (Definitive Diagnosis).
2. Không tự ý kê đơn, chỉ định dùng thuốc hoặc can thiệp điều trị xâm lấn.
3. Phân định rõ ràng giữa nhận định sơ bộ của mô hình AI và kết luận thẩm định chính thức của bác sĩ chuyên khoa.
4. Triệt tiêu mọi yếu tố giao diện gây cảm giác an tâm giả tạo (False Sense of Security) có thể dẫn đến rủi ro bỏ sót bệnh lý (False Negative).
5. Duy trì cảnh báo miễn trừ trách nhiệm y tế bắt buộc của Bộ Y tế / CDS.
6. Tuyệt đối không dùng dữ liệu giả định (No Mock in Production) khi thông số lâm sàng chưa được đo lường.

Hồ sơ thẩm định tập trung đánh giá chi tiết các thay đổi trên `frontend/src/components/ClinicalRiskSummaryCard.tsx`.

---

## 2. BẢNG KIỂM TRA 6 TIÊU CHÍ AN TOÀN LÂM SÀNG CỐT LÕI (6-PILLAR CLINICAL SAFETY AUDIT)

| STT | Tiêu Chí An Toàn Lâm Sàng | Tiêu Chuẩn Thẩm Định | Hiện Trạng Thực Tế Trong `ClinicalRiskSummaryCard.tsx` | Kết Quả |
| :--- | :--- | :--- | :--- | :---: |
| **1** | **Không chẩn đoán xác định tự động (No Definitive Diagnosis)** | Tuyệt đối không công bố kết quả AI như chẩn đoán bệnh học cuối cùng; chỉ gán nhãn hỗ trợ sàng lọc lâm sàng. | Tiêu đề gán nhãn rõ: *"Nhận định lâm sàng từ AI"*, phụ đề *"Đặc điểm vi tuần hoàn và hình thái võng mạc"*, badge *"Phân tích hình ảnh"*. Banner cảnh báo rõ *"Kết Quả Sơ Bộ AI - Chờ Bác Sĩ Thẩm Định"*. | **ĐẠT (PASS)** |
| **2** | **Không kê đơn / can thiệp điều trị tự động (No Automated Prescriptions)** | Không tự ý đưa ra đơn thuốc, tên biệt dược, liều lượng, hay phác đồ can thiệp điều trị tự động. | Mục khuyến nghị y khoa chỉ hướng dẫn: Khám mắt định kỳ 6-12 tháng, kiểm soát huyết áp & HbA1c, chế độ ăn ít muối, tăng cường rau xanh, tập thể dục. Không có bất kỳ chỉ định dùng thuốc nào. Badge gán nhãn *"Hỗ trợ quyết định lâm sàng"*. | **ĐẠT (PASS)** |
| **3** | **Bác sĩ ký duyệt & Thẩm quyền chuyên môn (Doctor Sign-Off)** | Mọi ca có nguy cơ phải qua thẩm định của bác sĩ; ghi chú của bác sĩ phải được phân định minh bạch. | Ghi chú của bác sĩ được tách thành một khối Card độc lập có viền `border-l-4 border-l-teal-600`, icon `UserCheck`, badge `ShieldCheck` hiển thị rõ tên bác sĩ thẩm định (`doctorName`). Banner hiển thị badge phân biệt `Đã Thẩm Định Bởi Bác Sĩ Chuyên Khoa` vs `Chờ Bác Sĩ Thẩm Định`. | **ĐẠT (PASS)** |
| **4** | **Cảnh báo miễn trừ y tế bắt buộc (Mandatory Medical Disclaimer)** | Xuất hiện đầy đủ, rõ ràng trước khi người dùng thực hiện hành động tiếp theo. | Tích hợp `<MedicalDisclaimer variant="banner" />` ngay trên các nút bấm hành động cuối thẻ. Hiển thị thông điệp cảnh báo Bộ Y tế/CDS bắt buộc với nền màu hổ phách và icon `AlertCircle`. | **ĐẠT (PASS)** |
| **5** | **Bảo tồn tính toàn vẹn dữ liệu & Không giả mạo (No Mock Data)** | Dữ liệu hiển thị phải từ kết quả đo lường thật (`AIRiskResult`), không được gán số lý tưởng khi thiếu. | Khi các thông số vi mạch (A/V Ratio, Vessel Density, Tortuosity, VCDR) bị khuyết thiếu, hệ thống hiển thị *"Chưa xác định"* / *"Chưa đo được"*, thanh đo hiển thị dải xám đứt đoạn. Tuyệt đối không gán giá trị giả mạo. | **ĐẠT (PASS)** |
| **6** | **Kiểm soát rủi ro Âm tính giả (False Negative Prevention)** | Loại bỏ triệt để các ký hiệu gợi ý an toàn giả mạo khi phân tích tổn thương võng mạc. | Thay thế icon tích xanh `CheckCircle2` bằng dot chỉ báo vi mạch tròn trung tính `bg-sky-500 ring-4 ring-sky-100` ở danh sách nhận định AI. Ngăn ngừa bệnh nhân lầm tưởng tổn thương bệnh lý là "đã an toàn". | **ĐẠT (PASS)** |

---

## 3. THẨM ĐỊNH CHI TIẾT 5 HẠNG MỤC YÊU CẦU

### 3.1. Ranh Giới CDS & Chẩn Đoán Xác Định (Clinical Decision Support Boundary)
- **Thay đổi tiêu đề**:
  - Tiêu đề cũ: *"Nhận Định Lâm Sàng Của AI (Findings)"* -> Tiêu đề mới: *"Nhận định lâm sàng từ AI"*.
  - Bổ sung phụ đề giải thích: *"Đặc điểm vi tuần hoàn và hình thái võng mạc"*.
  - Badge phân loại: Đổi từ *"Vision AI"* sang *"Phân tích hình ảnh"*.
- **Đánh giá y học**:
  - Việc loại bỏ các thuật ngữ kỹ thuật chung chung ("Findings", "Vision AI") và chuyển sang "Nhận định lâm sàng từ AI" cùng badge "Phân tích hình ảnh" giúp định vị chính xác: Đây là kết quả nhận diện đặc trưng thị giác máy tính trên ảnh đáy mắt, không phải kết luận chẩn đoán bệnh học của bác sĩ chuyên khoa.
  - Khối khuyến nghị bên cạnh mang tiêu đề *"Khuyến nghị y khoa & theo dõi"* kèm badge *"Hỗ trợ quyết định lâm sàng"* (CDS), khẳng định rõ vai trò gợi ý định hướng cho người bệnh và nhân viên y tế.
  - Nội dung khuyến nghị thuần túy là kế hoạch chăm sóc sức khỏe dự phòng (khám định kỳ, theo dõi huyết áp/đường huyết, dinh dưỡng). Hoàn toàn không có hành vi tự ý kê đơn thuốc (kháng sinh, thuốc hạ áp, thuốc giãn mạch, v.v.) hay phác đồ can thiệp phẫu thuật laser.
- **Kết luận**: **ĐẠT (PASS)**.

### 3.2. Thay Thế Icon Tích Xanh Bằng Chỉ Báo Vi Mạch Tròn Trung Tính
- **Thay đổi giao diện**:
  - Tại danh sách các gạch đầu dòng của `findingsItems` (Dòng 986-995):
    ```tsx
    <div className="w-2 h-2 rounded-full bg-sky-500 ring-4 ring-sky-100 shrink-0 mt-1.5" />
    <span className="leading-snug">{point}</span>
    ```
  - Thay thế toàn bộ icon `CheckCircle2` (vòng tròn tích xanh lá) bằng nút tròn vi tuần hoàn màu xanh dương nhẹ (`bg-sky-500 ring-4 ring-sky-100`).
- **Phân tích tác động tâm lý lâm sàng (Clinical Psychology & Safety)**:
  - Trong tâm lý học thị giác y tế, biểu tượng tích xanh lá (`CheckCircle2`) mang hàm ý "Hoàn thành", "Đạt chuẩn", "Không có lỗi/Không có bệnh".
  - Trong trường hợp bệnh nhân có bệnh lý võng mạc (ví dụ: phát hiện vi phình mạch rải rác, xuất huyết võng mạc chấm que, co thắt tiểu động mạch khu trú), nếu mỗi dòng nhận định này lại đi kèm một dấu tích xanh, bệnh nhân rất dễ ngộ nhận rằng kết quả này là "tốt", tạo ra **Cảm giác an tâm giả tạo (False Sense of Security)**. Hệ quả là bệnh nhân có thể chủ quan không đi khám chuyên khoa mắt, dẫn đến rủi ro âm tính giả và biến chứng mù lòa.
  - Việc chuyển sang chỉ báo dạng chấm vi mạch (`bg-sky-500 ring-4 ring-sky-100`):
    - Đem lại sắc thái trung tính, khách quan, mang tính chất mô tả điểm ảnh/điểm giải phẫu vi tuần hoàn.
    - Không gợi ý cảm xúc chủ quan (không "tốt" cũng không "xấu"), buộc người bệnh phải đọc kỹ nội dung chữ thay vì nhìn lướt qua icon.
  - Đồng thời, ở cột *"Khuyến nghị y khoa & theo dõi"*, việc duy trì icon `CheckCircle2` màu xanh ngọc (`text-emerald-600`) là hoàn toàn phù hợp về mặt công thái học lâm sàng, vì đây là danh sách các hành động tích cực cần tuân thủ (Checklist khuyến cáo).
- **Kết luận**: **ĐẠT (PASS - Điểm sáng cải tiến an toàn y khoa)**.

### 3.3. Tách Biệt Minh Bạch Nguồn Gốc Thông Tin Lâm Sàng
- **Thay đổi cấu trúc giao diện**:
  - Trước đây: Ghi chú của bác sĩ (`doctorNotes`) bị đặt lẫn bên trong phần chân thẻ của Nhận định AI.
  - Hiện tại: Ghi chú của bác sĩ được đưa ra thành một khối giao diện độc lập, nổi bật (Dòng 1034-1054):
    * Đường viền bên trái dày tạo điểm nhấn chuyên môn: `border-l-4 border-l-teal-600`.
    * Nền phân biệt màu ngọc bích y tế: `bg-gradient-to-r from-teal-50/60 via-white to-cyan-50/40`.
    * Icon định danh nhân sự y tế: `UserCheck` và badge xác thực `ShieldCheck` hiển thị rõ họ tên bác sĩ phụ trách (`analysisResult.doctorName || 'Bác sĩ chuyên khoa'`).
    * Trích dẫn nhận định lâm sàng trong dấu ngoặc kép dạng chữ nghiêng (`italic`).
- **Phân định cấp độ thẩm quyền tại Banner tổng hợp**:
  - Khi chưa có bác sĩ ký duyệt: Hiển thị badge màu hổ phách `Kết Quả Sơ Bộ AI - Chờ Bác Sĩ Thẩm Định` (icon `Clock`).
  - Khi đã có bác sĩ ký duyệt: Hiển thị badge màu xanh ngọc `Đã Thẩm Định Bởi Bác Sĩ Chuyên Khoa` (icon `ShieldCheck`).
- **Đánh giá y học**:
  - Đáp ứng trọn vẹn yêu cầu minh bạch hóa nguồn gốc dữ liệu: Người bệnh và đồng nghiệp lâm sàng phân biệt tức thì phần nào là do mô hình AI trích xuất sơ bộ, phần nào là nhận định chuyên môn có giá trị pháp lý của bác sĩ điều trị.
- **Kết luận**: **ĐẠT (PASS)**.

### 3.4. Tuyên Bố Miễn Trừ Trách Nhiệm Y Tế (Medical Disclaimer Enforcement)
- **Vị trí và định dạng**:
  - Dòng 1058: Tích hợp trực tiếp `<MedicalDisclaimer variant="banner" />`.
  - Nằm ở vị trí chiến lược: Ngay phía trên thanh nút bấm hành động (`Xem & In Phiếu Báo Cáo Chi Tiết`, `Trao Đổi Với Bác Sĩ`).
- **Nội dung hiển thị**:
  > *"Tuyên bố Miễn trừ Y tế: Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."*
- **Đánh giá an toàn pháp lý y khoa**:
  - Banner sử dụng nền vàng hổ phách (`bg-amber-50/90 border-amber-200 text-amber-900`), icon cảnh báo `AlertCircle` màu cam đậm.
  - Hỗ trợ đầy đủ thuộc tính trợ năng: `role="note"`, `aria-label="Cảnh báo an toàn y khoa CDS"`.
  - Người dùng không thể thực hiện bất kỳ thao tác nào (in báo cáo hay tư vấn) mà không nhìn thấy tuyên bố miễn trừ y tế này.
- **Kết luận**: **ĐẠT (PASS)**.

### 3.5. Không Sử Dụng Dữ Liệu Giả (No Mock Data in Production)
- **Kiểm tra nguồn dữ liệu**:
  - Toàn bộ điểm số tổng hợp và điểm thành phần (`overallVascularRiskScore`, `cardiovascularRisk.score`, `diabeticRetinopathyRisk.score`, `glaucomaRisk.score`) đều được ánh xạ trực tiếp từ đối tượng phân tích thật `AIRiskResult`.
  - Các thông số sinh học vi mạch (`rawAvRatio`, `rawVesselDensity`, `rawTortuosity`, `rawVcdr`) được đọc từ `annotatedMap` do AI trả về.
- **Xử lý an toàn khi khuyết thiếu dữ liệu (Clinical Fail-Safe)**:
  - Dòng 194 có ghi chú an toàn: `// Biomarkers data - An toàn lâm sàng: Không tự ý fallback số lý tưởng giả mạo`.
  - Khi một thông số sinh học nhận giá trị `null`, `undefined` hoặc `NaN`:
    * Giá trị số: Hiển thị rõ ràng *"Chưa xác định"*.
    * Nhãn trạng thái: Hiển thị badge màu xám *"Chưa đo được"* kèm icon `HelpCircle`.
    * Thanh đo trực quan `BiomarkerRangeBar`: Chuyển sang thanh rỗng màu xám viền nét đứt (`border-dashed border-slate-300`), không hiển thị con trỏ định vị để tránh gây hiểu lầm.
    * Đánh giá lâm sàng: Hiển thị rõ *"Chưa đủ dữ liệu để phân tích..."*.
  - Tuyệt đối không hardcode số liệu lý tưởng (như 0.67 hoặc 17.5%) để "làm đẹp" giao diện.
- **Kết luận**: **ĐẠT (PASS)**.

---

## 4. KẾT QUẢ KIỂM THỬ HỆ THỐNG VÀ ĐỘ ỔN ĐỊNH MÃ NGUỒN

- **Bộ kiểm thử tự động Frontend**: Đạt **134/134 tests PASS (100%)**
  - `clinical-ui-components.test.ts`: 88/88 tests PASS (Bao gồm nhóm test CRSC-1 đến CRSC-10 cho `ClinicalRiskSummaryCard`).
  - `clinical-verification.test.ts`: 14/14 tests PASS.
  - `ai-analysis-flow.test.ts`: 10/10 tests PASS.
  - `i18n-clinical-system.test.ts`: 22/22 tests PASS.
- **Kiểm tra biên dịch & đóng gói sản phẩm**:
  - Lệnh kiểm tra: `npm run build` (`tsc && vite build`).
  - Kết quả: **BUILD SUCCESS**, 0 lỗi TypeScript, 0 lỗi cú pháp giao diện.

---

## 5. KẾT LUẬN & PHÊ DUYỆT CHÍNH THỨC

Căn cứ trên các bằng chứng rà soát mã nguồn thực tế và kết quả kiểm thử lâm sàng tự động:
1. Giao diện `ClinicalRiskSummaryCard.tsx` đã giữ vững ranh giới phần mềm hỗ trợ sàng lọc (CDS), không vi phạm các quy chuẩn đạo đức y sinh.
2. Các thay đổi về mặt thị giác (đặc biệt là việc thay thế icon tích xanh bằng chỉ báo vi mạch tròn trung tính) có tác động tích cực sâu sắc trong việc bảo vệ tâm lý người bệnh và loại trừ rủi ro âm tính giả.
3. Sự phân tách độc lập giữa nhận định AI và ý kiến chuyên môn của bác sĩ đảm bảo tính minh bạch y tế cao nhất.
4. Tuyên bố miễn trừ y tế bắt buộc và cơ chế xử lý dữ liệu khuyết thiếu không giả mạo đáp ứng 100% tiêu chuẩn Cổng Chất Lượng Y Khoa QG6/QG7.

**KẾT LUẬN CUỐI CÙNG**: **CHẤP THUẬN AN TOÀN (APPROVED - PASS)**.
Giao diện đủ điều kiện an toàn y khoa để phát hành trên môi trường sản xuất (Production Ready).

---
*Biên bản được lập bởi Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập AURA.*
