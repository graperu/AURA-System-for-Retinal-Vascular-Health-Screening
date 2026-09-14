# BÁO CÁO TỔNG HỢP CHẤT LƯỢNG & KIỂM THỬ (QA MASTER SIGN-OFF REPORT)
## TÍNH NĂNG: BÀN CHẨN ĐOÁN TƯƠNG TÁC CDS, LỚP PHÂN ĐOẠN MẠCH MÁU, BẢN ĐỒ NHIỆT GRAD-CAM GIẢI PHẪU, TỌA ĐỘ TỔN THƯƠNG VI MẠCH VÀ CƠ CHẾ CHỐNG FALSE REASSURANCE (FR-04, FR-14, NFR-03)

---

- **Người thực hiện**: Trưởng Nhóm Kiểm Thử (QA Lead) — Hệ thống Y tế AURA
- **Mã Cổng Chất Lượng**: Quality Gate QG4 (Testing & Quality Assurance Gate)
- **Thời điểm kiểm định**: 14/09/2026
- **Phạm vi kiểm thử**:
  1. **Frontend**: Bàn chẩn đoán tương tác CDS (`InteractiveCDSViewer.tsx`), Nút toggle Lớp mạch máu & Bộ lọc quang học Red-Free (`aura-red-free-filter` SVG & Canvas 2D engine), Bản đồ nhiệt Grad-CAM giải phẫu OD/OS (`renderAnatomicalHeatmap`), Ghim định vị tổn thương vi mạch (`detectedAnomalies`, Target Pins), Cơ chế chống False Reassurance (Banner Âm tính lâm sàng vs Cảnh báo biến đổi vi mạch toàn thể), Chế độ Buồng tối (`isDarkRoom` Obsidian Fluorescein Angiography simulator).
  2. **Backend**: `ScreeningService`, `GeminiRetinalAiService`, DTO `ScreeningResponse` (trường `detectedAnomalies`, `vesselMaskUrl`), Flyway migrations `V031`, `V032`.
- **Kết luận chính thức**: **ĐẠT CHẤT LƯỢNG TOÀN DIỆN (PASS — 100% ĐỦ ĐIỀU KIỆN NGHIỆM THU CEO)**

---

## 1. MỤC TIÊU & BỐI CẢNH KIỂM THỬ

Hệ thống AURA trang bị bàn chẩn đoán CDS tương tác nhằm hỗ trợ bác sĩ chuyên khoa mắt và tim mạch soi chiếu vi mạch đáy mắt. Kiểm thử toàn diện này tập trung kiểm chứng 4 thành phần cốt lõi:
1. **Lớp phân đoạn mạch máu (Vessel Segmentation Overlay)**: Nút bật/tắt lớp mạch máu kết nối chính xác canvas phủ, áp dụng bộ lọc quang học Red-Free Green Channel (540nm) chuẩn nhãn khoa AAO hoặc nạp `vesselMaskUrl` từ AI backend.
2. **Bản đồ nhiệt Grad-CAM giải phẫu học (Anatomical Heatmap)**: Phổ nhiệt bám sát giải phẫu OD (Mắt Phải: hoàng điểm phía thái dương 64%, gai thị phía mũi 32%) vs OS (Mắt Trái: hoàng điểm 36%, gai thị 68%), mô phỏng quầng nhiệt cung mạch thái dương trên/dưới và các tâm nhiệt đỏ rực tập trung chính xác vào ổ tổn thương thực tế.
3. **Tọa độ tổn thương vi mạch (Spatial Target Pins)**: Render chính xác tại tọa độ $(X\%, Y\%)$, hiệu ứng xung nhịp `animate-ping`, phân loại màu sắc bệnh học chuẩn y tế (Hemorrhage: Rose, Microaneurysm: Amber, Hard Exudate: Yellow, AV Nipping & Focal Narrowing: Orange), tooltip phân tích bệnh học và mở thẻ chi tiết khi tương tác.
4. **Cơ chế chống False Reassurance (An toàn y tế tối thượng)**: Khi điểm số nguy cơ vi mạch $\ge 40$ (nguy cơ trung bình, cao, nguy kịch) mà mảng tổn thương rỗng, nghiêm cấm tuyệt đối nhãn xanh "Vi mạch bình thường" hay banner "Âm tính lâm sàng"; bắt buộc hiển thị nhãn cảnh báo hổ phách "Biến đổi vi mạch toàn thể / lan tỏa".
5. **Chế độ Buồng tối (Dark Room Inspection Mode)**: Giao diện nền tối Obsidian tương phản cao chống lóa, mô phỏng chụp mạch huỳnh quang Fluorescein Angiography (FA) với vi mạch phát huỳnh quang Cyan/Teal.

---

## 2. KẾT QUẢ KIỂM THỬ ĐỊNH LƯỢNG TỪNG PHÂN HỆ

### 2.1. Phân Hệ Frontend (TypeScript + React 18 + Vite)

Lệnh thực thi: `npm test` trong thư mục `frontend/`

| Test Suite | Tệp Kiểm Thử | Tổng Tests | Passed | Failed | Skipped | Tỷ Lệ Đạt |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Clinical UI Components** | `clinical-ui-components.test.ts` | 96 | 96 | 0 | 0 | **100%** |
| **Clinical E2E Verification** | `clinical-verification.test.ts` | 15 | 15 | 0 | 0 | **100%** |
| **AI Analysis Flow** | `ai-analysis-flow.test.ts` | 10 | 10 | 0 | 0 | **100%** |
| **I18n & Zero Hybrid** | `i18n-clinical-system.test.ts` | 29 | 29 | 0 | 0 | **100%** |
| **Credit Purchase Modal** | `credit-purchase-modal.test.ts` | 9 | 9 | 0 | 0 | **100%** |
| **TỔNG HỢP TOÀN BỘ FRONTEND** | **5 Test Suites** | **159** | **159** | **0** | **0** | **100%** |

- **Kiểm tra Biên Dịch TypeCheck & Build (`npm run build: tsc && vite build`)**:
  * Trạng thái: **BUILD SUCCESS (5.66s)**
  * Tệp đóng gói: `dist/index.html` (1.11 kB), `dist/assets/index-BV-07gF-.css` (108.51 kB), `dist/assets/index-yM8Gi7ER.js` (1,000.20 kB).
  * Lỗi TypeScript: **0 lỗi** (Strict Mode hoàn toàn trong sạch).

---

### 2.2. Phân Hệ Backend (Java 21 + Spring Boot 3.5.x + PostgreSQL 16)

Lệnh thực thi: `mvn test "-Dtest=ScreeningServiceTest,ScreeningServiceOptimizedTest,ScreeningControllerTest"` trong `backend/`

| Test Suite | Lớp Kiểm Thử | Tổng Tests | Passed | Failed | Skipped | Trạng Thái |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Screening Service Unit Test** | `ScreeningServiceTest` | 12 | 12 | 0 | 0 | **PASS** |
| **Screening Service Optimized** | `ScreeningServiceOptimizedTest` | 44 | 44 | 0 | 0 | **PASS** |
| **Screening Controller Test** | `ScreeningControllerTest` | 17 | 17 | 0 | 0 | **PASS** |
| **TỔNG HỢP KIỂM THỬ SÀNG LỌC** | **3 Test Classes** | **73** | **73** | **0** | **0** | **BUILD SUCCESS** |

- **Xác nhận DTO `ScreeningResponse`**:
  * Trường `detectedAnomalies` (String JSON array) được trích xuất từ AI engine, lưu vào cột PostgreSQL `detected_anomalies` và ánh xạ đầy đủ sang record DTO.
  * Trường `vesselMaskUrl` (String CDN / Data URI) được trích xuất hoặc fallback từ `vesselMaskBase64`, lưu vào PostgreSQL và ánh xạ chính xác sang record DTO.

---

## 3. ĐỐI CHIẾU CHI TIẾT MA TRẬN YÊU CẦU & ACCEPTANCE CRITERIA

### 3.1. Nhóm Tiêu Chí AI (AC-AI-01 đến AC-AI-04)

| Mã AC | Đặc Tả Tiêu Chí Chấp Nhận | Kết Quả Thực Nghiệm & Bằng Chứng Mã Nguồn | Đánh Giá |
| :--- | :--- | :--- | :---: |
| **AC-AI-01** | **Bản đồ nhiệt Grad-CAM bám sát giải phẫu OD/OS**: Gai thị phía mũi, hoàng điểm phía thái dương; phổ nhiệt lan tỏa theo cung mạch thái dương trên/dưới và hội tụ tâm nhiệt đỏ vào tổn thương. | - Test `VIEWER-9` xác minh: OD đặt maculaX = $w \times 0.64$; OS đặt maculaX = $w \times 0.36$.<br>- Điểm nguy cơ $\ge 65$: gradient tâm đỏ `rgba(239, 68, 68, 0.78)`.<br>- Điểm nguy cơ $40..64$: quầng cung mạch thái dương $y \pm h \times 0.22$.<br>- Hotspots tại $(anom.x\%, anom.y\%)$ bán kính $w \times 0.07$ với màu đỏ rực `rgba(220, 38, 38, 0.9)`. | **PASS** |
| **AC-AI-02** | **Lớp phân đoạn mạch máu (Vessel Segmentation)**: Backend trả về `vesselMaskUrl` hoặc Client xử lý Red-Free Green Channel (540nm). | - Backend `ScreeningServiceOptimizedTest.testVesselMaskUrlPersistence` xác nhận `vesselMaskUrl` lưu trữ và ánh xạ DTO chuẩn xác.<br>- Test `VIEWER-7` & `VIEWER-11` xác minh hàm `processVesselOverlayCanvas` tách kênh Green và gán SVG filter `aura-red-free-filter`. | **PASS** |
| **AC-AI-03** | **Trích xuất tọa độ tổn thương vi mạch (`detectedAnomalies`)**: Định vị $(X, Y)$, phân loại bệnh học và độ tin cậy. | - Backend `ScreeningServiceTest.createScreening_withDetectedAnomalies_shouldPersistAndMapToResponse` xác nhận trích xuất mảng JSON 5 trường (`id`, `type`, `coordinates`, `confidence`, `description`).<br>- Test `FR-7.9` xác nhận parse an toàn JSON string thành mảng `VesselAnomalyRegion[]`. | **PASS** |
| **AC-AI-04** | **Đánh giá nguy cơ vi mạch toàn thể (`overallVascularRiskScore`)**: Phân tầng 4 cấp độ lâm sàng (Low, Moderate, High, Critical). | - Test `AI-FLOW.5` & `AI-FLOW.6` xác minh phân tầng nguy cơ tim mạch và võng mạc ĐTĐ.<br>- An toàn fail-safe khi AI timeout hoặc dữ liệu thiếu trường điểm số. | **PASS** |

---

### 3.2. Nhóm Tiêu Chí Giao Diện Lâm Sàng (AC-FE-01 đến AC-FE-06)

| Mã AC | Đặc Tả Tiêu Chí Chấp Nhận | Kết Quả Thực Nghiệm & Bằng Chứng Giao Diện | Đánh Giá |
| :--- | :--- | :--- | :---: |
| **AC-FE-01** | **Bố cục 2 màn hình đối chiếu song song 1:1**: Màn hình trái hiển thị ảnh chụp đáy mắt gốc; màn hình phải hiển thị lớp phủ Attention AI và đồng bộ tỷ lệ zoom. | - Test `VIEWER-1`: Khởi tạo 2 container với nhãn "Ảnh chụp đáy mắt gốc" và "Bản đồ nhiệt Grad-CAM".<br>- Test `VIEWER-4`: Bộ điều khiển Zoom scale 1:1 từ 80% đến 250% với nút Reset 100%. Không còn chuỗi lai tạp cũ. | **PASS** |
| **AC-FE-02** | **Thanh trượt Opacity điều khiển độ mờ bản đồ nhiệt**: Giá trị mặc định 65%, phạm vi 0.0 - 1.0, bước nhảy 0.05, nhãn trợ năng `aria-label`. | - Test `VIEWER-2`: `type="range"`, `min="0"`, `max="1"`, `step="0.05"`, `value="0.65"`.<br>- Lớp phủ canvas/ảnh nhận trực tiếp `style="opacity:0.65"` và class `pointer-events-none`. | **PASS** |
| **AC-FE-03** | **Nút toggle Lớp mạch máu (`showVesselsOverlay`)**: Bật/tắt lớp phân đoạn mạch máu, gắn kết canvas và bộ lọc Red-Free Green Channel (540nm AAO). | - Test `VIEWER-7`: Nút bấm có icon `Layers`, gắn nhãn "Lớp mạch máu".<br>- Test `VIEWER-11`: Canvas Layer 1 nhận `showVesselsOverlay ? opacity-100 : opacity-0`, kích hoạt SVG filter `feColorMatrix` lọc kênh xanh lục. | **PASS** |
| **AC-FE-04** | **Ghim định vị không gian (Spatial Target Pins) & Phân loại màu bệnh học**: Render đúng tọa độ %, hiệu ứng nhấp nháy `animate-ping`, tooltip hover và click mở thẻ chi tiết. | - Test `VIEWER-8` & `VIEWER-12`: Pin đặt tại `left: X%`, `top: Y%`, nhấp nháy `animate-ping`.<br>- Test `VIEWER-10`: Hemorrhage viền đỏ rose-600; Microaneurysm viền vàng hổ phách amber-400; Hard Exudate viền vàng yellow-300; AV Nipping viền cam orange-500; Focal Narrowing viền cam orange-400.<br>- Tooltip hiển thị tên tiếng Việt, độ tin cậy %, mô tả tổn thương. | **PASS** |
| **AC-FE-05** | **Cơ chế chống False Reassurance (An toàn y tế)**: Khi điểm nguy cơ $\ge 40$ mà mảng tổn thương rỗng, CẤM nhãn xanh "Bình thường", BẮT BUỘC cảnh báo hổ phách "Biến đổi vi mạch toàn thể". | - Test `VIEWER-6`: Risk < 40 & 0 tổn thương $\rightarrow$ Banner xanh `bg-emerald-50`, "Âm tính lâm sàng", legend "Vi mạch bình thường (0 điểm tổn thương)".<br>- Test `VIEWER-6B`: Risk $\ge 40$ & 0 tổn thương $\rightarrow$ Tuyệt đối cấm nhãn xanh, hiển thị Banner hổ phách `bg-amber-50`, icon `AlertCircle`, "Cảnh báo: Biến đổi vi mạch toàn thể / lan tỏa". | **PASS** |
| **AC-FE-06** | **Chế độ Buồng tối (Dark Room)**: Giao diện nền tối Obsidian (`bg-darkroom-card`, `text-cyan-300`), mô phỏng chụp mạch huỳnh quang Fluorescein Angiography (FA). | - Test `VIEWER-3`: Nút bấm chuyển trạng thái "Buồng tối: BẬT", icon `Moon`.<br>- Test `VIEWER-11`: Chế độ Dark Room kích hoạt thuật toán huỳnh quang FA trên canvas (phát quang Cyan/Teal trên nền tối, `#06B6D4` cho mask). | **PASS** |

---

## 4. XÁC MINH CÁC TEST CASES CHUYÊN BIỆT CDS VIEWER (VIEWER-1 ĐẾN VIEWER-12)

```
========================================================================================
MÃ TEST CASE   TÊN TEST CASE CHUYÊN BIỆT                                       KẾT QUẢ
========================================================================================
VIEWER-1       Cấu trúc khởi tạo bàn chẩn đoán CDS 2 màn hình đối chiếu song song PASS (100%)
VIEWER-2       Thanh trượt Opacity 65%, phạm vi 0-1, bước nhảy 0.05 & aria-label  PASS (100%)
VIEWER-3       Nút chuyển chế độ buồng tối (Dark Room) & giao diện Obsidian       PASS (100%)
VIEWER-4       Bộ điều khiển Zoom phóng to, thu nhỏ, đặt lại 100%                 PASS (100%)
VIEWER-5       Hiển thị tọa độ tổn thương vi mạch & thuật ngữ lâm sàng chuẩn      PASS (100%)
VIEWER-6       Xử lý ca BÌNH THƯỜNG (Risk < 40): Banner âm tính lâm sàng & Legend PASS (100%)
VIEWER-6B      Chống False Reassurance (Risk >= 40): Cảnh báo biến đổi toàn thể   PASS (100%)
VIEWER-7       Kích hoạt nút Lớp mạch máu & bộ lọc quang học Red-Free AAO         PASS (100%)
VIEWER-8       Marker tổn thương nhấp nháy animate-ping & tooltip bệnh học        PASS (100%)
VIEWER-9       Thuật toán phổ nhiệt giải phẫu OD vs OS, cung mạch & tâm nhiệt đỏ  PASS (100%)
VIEWER-10      Phân loại màu sắc y tế chuẩn 5 loại tổn thương vi mạch             PASS (100%)
VIEWER-11      Bộ xử lý vi mạch quang học Client-Side Red-Free & Buồng tối FA     PASS (100%)
VIEWER-12      Ghim định vị không gian (Spatial Target Pins) & nhãn trợ năng      PASS (100%)
========================================================================================
TỔNG CỘNG: 13/13 TEST CASES CHUYÊN BIỆT CDS VIEWER ĐẠT CHUẨN XANH (100% PASS)
========================================================================================
```

---

## 5. ĐÁNH GIÁ AN TOÀN Y TẾ & BẢO MẬT (MEDICAL SAFETY & SECURITY AUDIT)

1. **Khắc phục lỗi thanh trượt Opacity**:
   - State `heatmapOpacity` kết nối trực tiếp vào thuộc tính GPU CSS `opacity` trên canvas Layer 1 và hình ảnh/canvas Layer 2, phản hồi tức thì ($0\text{ ms}$ latency).
2. **Khắc phục lỗi nút Lớp mạch máu**:
   - `showVesselsOverlay` điều khiển lớp Canvas vi mạch Red-Free tách kênh Green 540nm theo chuẩn quốc tế AAO, đồng bộ bật/tắt chính xác.
3. **Hiển thị trực quan điểm tổn thương**:
   - Dòng chảy dữ liệu từ AI Vision Engine $\rightarrow$ PostgreSQL `detected_anomalies` $\rightarrow$ DTO `ScreeningResponse` $\rightarrow$ Frontend Mapper $\rightarrow$ Ghim Target Pins thông suốt 100%. Bác sĩ lâm sàng nhìn thấy ngay các ổ vi phình mạch, xuất huyết nhấp nháy trên nền võng mạc.
4. **Bảo tồn an toàn y tế tuyệt đối (No False Reassurance)**:
   - Ca khám có nguy cơ cao (Risk Score $\ge 40$) nhưng không phát hiện tổn thương khu trú đơn lẻ không bị dán nhãn xanh "Bình thường", mà cảnh báo rõ về tình trạng tổn thương vi mạch lan tỏa để bác sĩ lưu tâm.
5. **Medical Disclaimer luôn hiện diện**:
   - Cảnh báo y tế bắt buộc Bộ Y Tế & AAO luôn hiển thị ở cuối bàn chẩn đoán CDS.
6. **Tuân thủ quy chuẩn bảo mật**:
   - Không chứa bất kỳ API key, token bí mật hay dữ liệu giả lập (mock data) trong môi trường kiểm thử.

---

## 6. TUYÊN BỐ KÝ DUYỆT CHẤT LƯỢNG (QA SIGN-OFF DECLARATION)

Căn cứ vào kết quả kiểm thử tự động toàn diện trên toàn bộ hệ thống:
- **Frontend Test Suites**: **159/159 tests PASS (100%)**
- **Frontend Build Integrity**: **BUILD SUCCESS** (0 lỗi TypeScript, 0 lỗi biên dịch Vite)
- **Backend Screening Test Suites**: **73/73 tests PASS (100%)**
- **Backend Build Integrity**: **BUILD SUCCESS** (Maven compile & test-compile thành công)
- **Toàn bộ 13/13 test cases chuyên biệt CDS Viewer** (VIEWER-1 đến VIEWER-12) đạt chuẩn 100%.
- **Toàn bộ 4 tiêu chí AC-AI (01..04) và 6 tiêu chí AC-FE (01..06)** đều được xác nhận đạt yêu cầu nghiệm thu.

Tôi — **Trưởng Nhóm Kiểm Thử (QA Lead)** của Hệ thống Y tế AURA — chính thức:

### **TUYÊN BỐ KÝ DUYỆT CHẤT LƯỢNG (QA SIGN-OFF: PASS)**
**XÁC NHẬN TÍNH NĂNG ĐỦ ĐIỀU KIỆN CHUYỂN BÀN GIAO CHO CEO VÀ HỘI ĐỒNG Y KHOA NGHIỆM THU.**

*Chữ ký điện tử QA Lead*: `AURA-QA-LEAD-SIGN-OFF-CDS-VIEWER-20260914-PASS`
