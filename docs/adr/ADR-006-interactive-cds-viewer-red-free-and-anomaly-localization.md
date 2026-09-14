# ADR-006: KIẾN TRÚC HIỂN THỊ VI MẠCH VÕNG MẠC RED-FREE, ĐỊNH VỊ TỔN THƯƠNG AI VÀ ĐỒNG BỘ GIẢI PHẪU CDS (FR-04 & FR-14)

## 1. Trạng Thái
**Đã Chấp Thuận (Approved)** - Ngày: 14/09/2026  
**Tác giả**: Solution Architect & Clinical UI/UX Specialist (AURA Core Team)  
**Tham chiếu**: `AURA-BA-SPEC-FR04-FR14-VESSEL-CDS`, `AURA-SDD-CDS-006`

---

## 2. Ngữ Cảnh & Vấn Đề (Context & Problem Statement)
Người dùng và bác sĩ lâm sàng phản ánh trải nghiệm trên Bàn chẩn đoán tương tác CDS (`InteractiveCDSViewer.tsx` và `PatientScreeningResultView.tsx`):
> *"Cái này nó không hoạt động à, sao kéo cái thanh mà không có gì xảy ra hay phân tích võng mạc trực quan chỉ ra các điểm vậy?"*

Qua khảo sát toàn diện mã nguồn từ Backend đến Frontend, Solution Architect xác định các nguyên nhân gốc rễ mang tính hệ thống:

1. **Về Nút 'Lớp mạch máu' (Vessel Overlay Button)**:
   - Biến state `showVesselsOverlay` được khởi tạo và toggle khi click, nhưng hoàn toàn **không xuất hiện** trong cây JSX để render lên ảnh. Nút bấm bị "chết" (Dead UI).

2. **Về Thanh trượt độ mờ bản đồ nhiệt (Heatmap Opacity Slider)**:
   - Khi backend chưa trả về ảnh heatmap thật (Base64/URL), `isMockSampleHeatmap` được kích hoạt. Lớp overlay render một thẻ `div` với `radial-gradient` cố định ở tọa độ `48% 52%` (bị audit y tế chỉ trích là gradient giả), trong khi thẻ `img` bên trong bị ẩn bằng `className="hidden"`.
   - `mix-blend-screen` với dải màu đỏ/vàng trên nền ảnh chụp đáy mắt tự nhiên màu cam/đỏ tạo ra hiệu ứng rất nhạt nhòa, không bám theo giải phẫu gai thị hay hoàng điểm.

3. **Về Điểm tổn thương trực quan (Visual Retinal Markers)**:
   - Mảng `detectedAnomalies` luôn là `[]` (rỗng) do thiếu chuỗi truyền dẫn từ Gemini AI đến Database, DTO và Mapper.
   - Khi mảng rỗng, giao diện luôn hiển thị nhãn xanh `Vi mạch bình thường (0 điểm tổn thương)` ngay cả trên các ca nguy cơ cao (`High` / `Critical`), vi phạm nghiêm trọng quy tắc an toàn y tế chống False Negative / False Reassurance.

---

## 3. Quyết Định Kiến Trúc (Architectural Decisions)

### 3.1. Phân Định Ranh Giới Kiến Trúc Kỹ Thuật (Architectural Boundary Separation)
- **Backend (Spring Boot + Cloud Gemini Vision AI Engine)**:
  - Tích hợp vào AI Prompt chỉ dẫn trích xuất tọa độ không gian chuẩn hóa `{ x, y, width, height }` (0% - 100%) của các tổn thương vi mạch khu trú thật (`Microaneurysm`, `Hemorrhage`, `Hard_Exudate`, `Focal_Narrowing`, `AV_Nipping`).
  - Quản lý lược đồ CSDL qua Flyway migration `V031__add_detected_anomalies_and_vessel_mask_to_screenings.sql`, bổ sung 2 cột `detected_anomalies` và `vessel_mask_url`.
  - Cung cấp DTO `ScreeningResponse` chuẩn hóa với trường `detectedAnomalies` và `vesselMaskUrl`.
  - Tuân thủ Non-blocking I/O ngoài Transaction, không mock dữ liệu.

- **Frontend (React 18 + Clinical Canvas 2D Engine)**:
  - **Mô hình phân lớp 4 tầng**: Layer 0 (Ảnh gốc) -> Layer 1 (Cây mạch máu quang học Canvas) -> Layer 2 (Bản đồ nhiệt Grad-CAM) -> Layer 3 (Ghim định vị Target Pins).
  - **Bộ lọc quang học Red-Free (Chuẩn nhãn khoa quốc tế AAO - 540nm)**: Sử dụng Canvas 2D cô lập kênh Green ($G$), tăng cường tương phản mao mạch tức thì ($0\text{ ms}$ latency), phân màu động mạch (đỏ/cam) vs tĩnh mạch (xanh lam).
  - **Chế độ Buồng Tối (`isDarkRoom`)**: Mô phỏng kỹ thuật chụp mạch huỳnh quang đáy mắt (Fluorescein Angiography - FA) với cây mạch máu phát huỳnh quang Cyan `#06B6D4` trên nền Obsidian `#0B0F17`.
  - **Sinh phổ nhiệt giải phẫu động**: Thay thế gradient giả lập `48% 52%` bằng phổ nhiệt động bám theo gai thị (OD vs OS), hoàng điểm macula và cung mạch thái dương dựa trên điểm số nguy cơ thật `overallVascularRiskScore`.
  - **Xử lý Zero-State an toàn lâm sàng**: Cấm hiển thị nhãn xanh "Vi mạch bình thường" nếu điểm nguy cơ $\ge 40$. Hiển thị cảnh báo biến đổi vi mạch toàn thể / lan tỏa (Diffuse vascular alterations).

---

## 4. Đặc Tả Chi Tiết Kỹ Thuật

### 4.1. Cơ Chế Lọc Quang Học Red-Free (Green Channel Isolation)
$$\begin{cases}
R_{out} = 0.1 \times G_{in} \\
G_{out} = 1.3 \times G_{in} \\
B_{out} = 0.2 \times G_{in}
\end{cases}$$
Hemoglobin hấp thụ mạnh ánh sáng xanh lục, giúp các vi mạch, vi phình mạch và vết xuất huyết trở nên nổi bật với độ tương phản cực đại so với hắc mạc nền.

### 4.2. Khắc Phục Thanh Trượt Opacity (0% -> 100%)
- Mức 0%: Ẩn hoàn toàn lớp overlay, hiển thị ảnh đáy mắt nguyên bản 100%.
- Mức 1% - 99%: Điều chỉnh alpha của lớp vi mạch Red-Free / Heatmap một cách tuyến tính trên GPU.
- Mức 100%: Lớp vi mạch hoặc bản đồ nhiệt hiển thị sắc nét nhất.

### 4.3. Kích Hoạt Nút 'Lớp Mạch Máu' (Vessel Overlay)
- `showVesselsOverlay = true`: Kích hoạt lớp Canvas Red-Free hoặc Perfusion Mask.
- `showVesselsOverlay = false`: Tắt hoàn toàn lớp phủ vi mạch, phục vụ đối chiếu A/B tức thì giữa ảnh màu tự nhiên và ảnh vi mạch tăng cường.

---

## 5. Hệ Quả & Tác Động (Consequences)

### Tích cực:
1. Giải quyết triệt để phản ánh của người dùng: Kéo thanh trượt tạo ra thay đổi quang học rõ ràng 100%, nút lớp mạch máu hoạt động mượt mà tức thì.
2. Nâng tầm trải nghiệm lâm sàng đạt chuẩn công cụ soi đáy mắt quốc tế (Zeiss, Topcon).
3. Loại bỏ hoàn toàn nguy cơ False Reassurance khi ca khám nguy cơ cao có mảng tổn thương rỗng.
4. Tái lập luồng dữ liệu thật cho các ca nguy cơ cao từ AI Gemini đến giao diện, không còn sử dụng bất kỳ đoạn mã giả (Mock) nào.

### Ràng buộc kỹ thuật:
1. `backend-developer` phải thực thi migration `V031` và cập nhật prompt trong `GeminiRetinalAiService.java`.
2. `frontend-developer` phải triển khai Canvas Red-Free filter và bảo đảm toàn bộ các test suite `clinical-ui-components.test.ts` và `i18n-clinical-system.test.ts` giữ vững kết quả PASS 100%.
