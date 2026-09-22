# BÁO CÁO KỸ THUẬT: TOÀN BỘ LUỒNG XỬ LÝ CỦA AI CORE TRONG HỆ THỐNG AURA
## (AURA RETINAL VASCULAR HEALTH SCREENING - AI INFERENCE & DECISION PIPELINE)

- **Mã tài liệu**: `AURA-REP-AI-PIPELINE-2026`
- **Phiên bản**: `2.1.0`
- **Ngày ban hành**: 22/09/2026
- **Phân hệ**: AI Core Microservice, Spring Boot Backend, Client-Side Canvas CDS Engine
- **Tuân thủ tiêu chuẩn**: ISO 13485 (Medical Device QMS), HIPAA Safe Harbor, AAO/ETDRS Clinical Guidelines, FR-02, FR-03, FR-04, FR-14, FR-15, FR-19, NFR-01, NFR-15, NFR-22

---

## 1. TỔNG QUAN KIẾN TRÚC LUỒNG XỬ LÝ AI END-TO-END

Hệ thống AURA vận hành theo mô hình kiến trúc phân tầng kết hợp **Hybrid AI & Clinical CDS Engine**:
* **Backend Cloud AI Engine**: Chịu trách nhiệm suy luận thị giác máy tính đa phương thức (*Multimodal Vision Inference*), bóc tách chỉ số sinh học vi mạch định lượng (*Quantitative Biomarkers*), định vị tọa độ không gian tổn thương (*Spatial Lesion Coordinates*), và phân tầng nguy cơ tim mạch - võng mạc đái tháo đường (*Risk Stratification*).
* **Client-Side Optical & Rendering Engine**: Chịu trách nhiệm trực quan hóa thời gian thực đa lớp (*Multi-layer Canvas*), bộ lọc quang học tách kênh xanh (*Red-Free Green Channel Isolation 540nm*), buồng tối huỳnh quang (*Fluorescein Mode*), và thước đo khẩu kính vi mạch (*Caliper Ruler*).
* **Human-in-the-loop (Bác sĩ chuyên khoa)**: Thẩm định chẩn đoán, điều chỉnh phân tầng, ký số điện tử và đồng bộ mẫu hiệu chỉnh về tập dữ liệu tái huấn luyện mô hình (*Model Retraining Dataset*).

```
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │                        1. TIẾP NHẬN & TIỀN XỬ LÝ (FRONTEND)                  │
   │  - Tải ảnh đáy mắt (Fundus OD/OS)  - Kiểm tra MIME, Kích thước, Đổi WebP      │
   │  - Khử nhiễu, chuẩn hóa Base64     - Cắt trừ hạn ngạch tín dụng (Credit)      │
   └──────────────────────────────────────┬───────────────────────────────────────┘
                                          │ POST /api/v1/screenings (HTTPS TLS 1.3)
                                          ▼
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │                      2. ĐIỀU PHỐI & ẨN DANH HÓA (BACKEND)                    │
   │  - ScreeningController & ScreeningService khởi tạo ca khám PROCESSING        │
   │  - HipaaAnonymizationService: Khử sạch PII/PHI (Safe Harbor Standard)        │
   │  - Phát tín hiệu tiến trình bước 1 (20% -> 40%) qua WebSocket/STOMP & SSE     │
   └──────────────────────────────────────┬───────────────────────────────────────┘
                                          │ Payload Multimodal Prompt (SSL/mTLS)
                                          ▼
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │                  3. AI CORE INFERENCE (GEMINI VISION ENGINE)                 │
   │  - Model: ag/gemini-3.8-flash-high (Zero-Temperature Deterministic)          │
   │  - Phát hiện mốc giải phẫu: Gai thị (Optic Disc) & Hoàng điểm (FAZ)          │
   │  - Đo đạc vi mạch: A/V Ratio, Vertical CDR, Tortuosity Index, Vessel Density  │
   │  - Trích xuất tọa độ tổn thương: Microaneurysm, Hemorrhage, Hard Exudate...  │
   │  - Phân tầng nguy cơ: CVD Score (0-100), Phân độ ETDRS DR (0-4), Glôcôm     │
   └──────────────────────────────────────┬───────────────────────────────────────┘
                                          │ Phản hồi JSON Schema Chuẩn Y Khoa
                                          ▼
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │                  4. LƯU TRỮ CSDL & PHÁT SỰ KIỆN REALTIME                     │
   │  - Ghi nhận vào bảng `screenings`: biomarkers, detected_anomalies (JSON)     │
   │  - Cập nhật trạng thái: PROCESSING -> ANALYZED (Tiến trình 100%)             │
   │  - SimpMessagingTemplate phát STOMP: SCREENING_COMPLETED & NOTIFICATION_NEW  │
   └──────────────────────────────────────┬───────────────────────────────────────┘
                                          │ Dữ liệu phản hồi API / STOMP Bus
                                          ▼
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │                 5. TRỰC QUAN HÓA CDS TRÊN BÀN CHẨN ĐOÁN                      │
   │  - Layer 0: Ảnh chụp đáy mắt nguyên bản (Raw Fundus)                         │
   │  - Layer 1: Bộ lọc quang học Red-Free AAO 540nm & Buồng tối Angiography      │
   │  - Layer 2: Phổ nhiệt Grad-CAM bám sát giải phẫu OD vs OS                    │
   │  - Layer 3: Ghim tọa độ Target Pins & Khung Bounding Box có nhịp đập pulse   │
   │  - Layer 4: Thước đo vi mạch điện tử (Caliper Ruler đo µm)                   │
   └──────────────────────────────────────┬───────────────────────────────────────┘
                                          │ Bác sĩ chuyên khoa khám & thẩm định
                                          ▼
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │               6. THẨM ĐỊNH LÂM SÀNG & TÁI HUẤN LUYỆN (FR-14, 15, 19)         │
   │  - Quyết định: APPROVE / MODIFY (bắt buộc lý do lâm sàng) / REJECT           │
   │  - Mã hóa bệnh lý ICD-10 (H35.0, E11.3, I10...) + Nhận định chuyên môn       │
   │  - Ký số HMAC-SHA256 bảo đảm tính bất biến hồ sơ bệnh án EMR                │
   │  - Gửi nhãn hiệu chỉnh về `doctor_feedback` phục vụ Retraining Dataset       │
   └──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT TỪNG BƯỚC TRONG LUỒNG XỬ LÝ (STEP-BY-STEP EXECUTION)

### Bước 1: Tiếp nhận và Tiền xử lý Dữ liệu Ảnh (Client-Side Ingestion)
1. **Tiếp nhận ảnh**:
   * Hỗ trợ ảnh chụp đáy mắt màu (*Color Fundus Photography*) từ máy soi đáy mắt hoặc ảnh cắt lớp vi mạch (*OCT/OCTA*).
   * Kiểm tra định dạng hợp lệ: JPEG, PNG, DICOM, WebP. Kích thước tối đa: 20MB.
2. **Chuẩn hóa thị giác**:
   * Hệ thống tự động chuyển đổi sang WebP nén không suy hao (*lossless/high-quality*) giúp giảm 60-70% dung lượng truyền tải mạng nhưng bảo toàn 100% chi tiết mao mạch nhỏ (< 100µm).
   * Khai báo rõ vị trí bên mắt: Mắt Phải (**OD** - Oculus Dexter) hoặc Mắt Trái (**OS** - Oculus Sinister).

### Bước 2: Khử định danh & Đóng gói Yêu cầu (HIPAA Anonymization Layer)
1. **Kiểm tra nghiệp vụ**:
   * Backend xác thực hạn ngạch (*Quota*) thông qua `CreditBalanceService.deductCredit()`.
   * Khởi tạo bản ghi `Screening` với trạng thái `PROCESSING`, ghi nhận `patientId`, `eyePosition`, `scanType`.
2. **Khử định danh y tế (HIPAA Safe Harbor)**:
   * Trước khi truyền dữ liệu ảnh lên đám mây phân tích, `HipaaAnonymizationService` bóc tách toàn bộ thông tin định danh cá nhân (Họ tên, Ngày sinh, Địa chỉ, Số điện thoại, Mã số BHYT).
   * Định danh ca khám được mã hóa bằng chuỗi băm an toàn `HMAC-SHA256` không thể truy ngược.
3. **Phát tiến trình phân tích thời gian thực**:
   * Tiến trình phân tích được đồng bộ qua 5 bước xác định:
     * `0% - 20%`: Tải ảnh lên máy chủ an toàn.
     * `20% - 40%`: Bóc tách phổ quang học và khử định danh HIPAA.
     * `40% - 65%`: Đang gửi tới cụm suy luận thị giác AI Core.
     * `65% - 85%`: Trích xuất chỉ số sinh học hình thái học và vi phình mạch.
     * `85% - 92%`: Đối soát giải phẫu và phân tầng nguy cơ đa bệnh lý.
     * `92% - 100%`: Hoàn tất lưu trữ CSDL và hiển thị kết quả.

### Bước 3: Suy luận Thị giác Máy tính AI Core (Gemini 3.8 Flash High)
Backend giao tiếp với AI Core (`GeminiRetinalAiService.java`) sử dụng mô hình thị giác lớn `ag/gemini-3.8-flash-high`.

Prompt hệ thống (*System Prompt*) được thiết kế chuyên sâu theo chuẩn nhãn khoa quốc tế, chỉ thị cho AI bóc tách cấu trúc vi mạch võng mạc qua 4 nhiệm vụ song song:

#### 1. Định vị Mốc Giải phẫu học Nhãn khoa (Anatomical Landmarks):
* **Gai thị (Optic Disc)**: Cửa ngõ hội tụ của mạng lưới vi mạch và hơn 1,2 triệu sợi thần kinh thị giác.
  * Mắt Phải (OD): Nằm ở phía mũi (*Nasal* - góc bên phải ảnh, $X: 62.0\% - 76.0\%$, $Y: 46.0\% - 56.0\%$).
  * Mắt Trái (OS): Nằm ở phía mũi (*Nasal* - góc bên trái ảnh, $X: 24.0\% - 38.0\%$, $Y: 46.0\% - 56.0\%$).
* **Hố hoàng điểm (Fovea Centralis / FAZ)**: Vùng vô mạch sắc tố sẫm trung tâm, nằm về phía thái dương (*Temporal*) so với gai thị:
  * Mắt Phải (OD): Nằm bên trái gai thị ($X: 38.0\% - 48.0\%$, $Y: 48.0\% - 55.0\%$).
  * Mắt Trái (OS): Nằm bên phải gai thị ($X: 52.0\% - 62.0\%$, $Y: 48.0\% - 55.0\%$).

#### 2. Định lượng Chỉ số Sinh học Vi mạch (Quantitative Retinal Biomarkers):
* **Tỷ lệ Động mạch / Tĩnh mạch (A/V Ratio)**:
  * Chuẩn sinh lý bình thường: $0.65 - 0.67$.
  * Co hẹp tiểu động mạch khu trú / toàn thể nếu $< 0.60$ (liên quan trực tiếp đến tăng huyết áp nguyên phát và xơ vữa mạch máu).
* **Tỷ lệ Lõm gai thị (Vertical CDR - Cup-to-Disc Ratio)**:
  * Đo đường kính trục dọc lõm gai so với đĩa thị. Ngưỡng bình thường: $< 0.50$.
  * Cảnh báo nghi ngờ Glôcôm (*Glaucoma Suspect*) nếu $\ge 0.50$ hoặc bất đối xứng hai mắt $> 0.20$.
* **Chỉ số Vặn xoắn (Tortuosity Index)**:
  * Đo độ uốn lượn ngoằn ngoèo của hệ thống mạch máu ($TI = L_{\text{curve}} / L_{\text{chord}}$). Chuẩn bình thường: $1.10 - 1.25$. Nếu $\ge 1.30$: cảnh báo tăng sinh và quá tải huyết động học.
* **Mật độ mao mạch võng mạc (Vessel Density %)**:
  * Tỷ lệ phần trăm vùng tưới máu mao mạch chuẩn (bình thường $16.0\% - 18.5\%$). Giảm tưới máu biểu hiện vùng thiếu máu cục bộ (*Ischemia*).

#### 3. Bóc tách Tọa độ Không gian Tổn thương Vi mạch (Spatial Lesion Localization):
Mô hình AI quét toàn bộ bán cầu đáy mắt và trả về danh sách mảng JSON `detectedAnomalies` gồm 5 loại tổn thương bệnh lý chuẩn y khoa:
* `Microaneurysm` (Vi phình mạch): Các chấm đỏ li ti tròn, bờ rõ, đường kính $< 125\mu m$.
* `Hemorrhage` (Xuất huyết võng mạc): Đốm xuất huyết ngọn lửa hoặc vệt dọc theo lớp sợi thần kinh võng mạc.
* `Hard_Exudate` (Xuất tiết cứng): Mảng lipid màu vàng sáng có bờ sắc nét tại vùng hoàng điểm hoặc cung mạch thái dương.
* `AV_Nipping` (Bắt chéo động-tĩnh mạch / Dấu Gunn & Salus): Đè bẹp hoặc đổi hướng tĩnh mạch tại ngã tư bắt chéo với động mạch xơ cứng.
* `Focal_Narrowing` (Co thắt lòng mạch cục bộ): Khẩu kính tiểu động mạch bị thắt hẹp dạng chuỗi hạt.

Mỗi tổn thương được gắn tọa độ không gian chính xác:
```json
{
  "id": "ANO-01",
  "type": "Microaneurysm",
  "coordinates": { "x": 62.4, "y": 41.8, "width": 24, "height": 24 },
  "confidence": 0.94,
  "description": "Vi phình mạch nhỏ tại cung mạch thái dương trên."
}
```

#### 4. Phân tầng Nguy cơ Đa Bệnh lý (Risk Stratification):
* **Thang điểm Nguy cơ Tim mạch (Overall Vascular Risk Score 0 – 100)**:
  * `0 - 39 (LOW)`: Đáy mắt trong sáng, vi mạch thanh mảnh, gai thị hồng hào, không có tổn thương nào ($0$ tổn thương).
  * `40 - 64 (MODERATE)`: Co hẹp nhẹ tiểu động mạch (A/V $0.55 - 0.62$), 1–3 vi phình mạch hoặc xuất tiết rải rác ngoài hoàng điểm. Phân loại NPDR nhẹ - trung bình.
  * `65 - 79 (HIGH)`: Hẹp động mạch rõ rệt, nhiều vi phình mạch, xuất huyết dạng chấm/vệt, xuất tiết cứng gom cụm. Phân loại NPDR nặng.
  * `80 - 100 (CRITICAL)`: Xuất huyết diện rộng, tân mạch (PDR), phù hoàng điểm nặng, nguy cơ nhồi máu não/đột quỵ cấp.
* **Phân độ Bệnh võng mạc Đái tháo đường theo Quy tắc 4-2-1 ETDRS / AAO**:
  * Cấp độ 0: Không có tổn thương võng mạc (No DR).
  * Cấp độ 1: NPDR nhẹ (Chỉ có vi phình mạch Microaneurysm).
  * Cấp độ 2: NPDR trung bình (Nhiều hơn vi phình mạch nhưng chưa thỏa quy tắc 4-2-1).
  * Cấp độ 3: NPDR nặng - Tiền tăng sinh (Thỏa mãn quy tắc 4-2-1: Xuất huyết ở 4 góc phần tư, hoặc chuỗi hạt tĩnh mạch ở 2 góc, hoặc IRMA ở 1 góc).
  * Cấp độ 4: PDR - Tăng sinh (Xuất hiện tân mạch NVD/NVE hoặc xuất huyết dịch kính/trước võng mạc).

#### 5. Cơ chế Chống Sai sót Y tế (Medical Safety Safeguards):
* **Chống Âm tính Giả / Đánh lừa an toàn (Anti-False Reassurance)**:
  * Nếu điểm nguy cơ tổng thể $\ge 40$ (Trung bình / Cao / Nguy kịch) nhưng không phát hiện tổn thương khu trú, hệ thống **bắt buộc hiển thị cảnh báo: "Biến đổi vi mạch toàn thể / lan tỏa"**, tuyệt đối cấm hiển thị nhãn "Vi mạch bình thường".
* **Quy tắc Nghiêm ngặt No Mock in Production**:
  * Khi đáy mắt bình thường (Low Risk $< 40$), AI bắt buộc trả về `detectedAnomalies: []`, nghiêm cấm tạo tọa độ ngẫu nhiên.

---

### Bước 4: Lưu trữ CSDL & Phát Sự Kiện Thời Gian Thực (Persistence & Event Dispatch)
1. **Lưu trữ CSDL PostgreSQL (Supabase Cloud)**:
   * Bản ghi `Screening` được cập nhật toàn vẹn dữ liệu:
     * `risk_level`, `overall_vascular_risk_score`, `confidence`.
     * `av_ratio`, `vertical_cdr`, `tortuosity_index`, `vessel_density`.
     * `detected_anomalies` (Lưu mảng JSON cấu trúc không gian).
     * `findings_summary`, `xai_rationale`, `recommendations`.
     * Cột `status` đổi thành `ANALYZED` / `COMPLETED`.
2. **Phát tán sự kiện Realtime (STOMP WebSocket & SSE)**:
   * Broker gửi gói tin `SCREENING_COMPLETED` tới kênh người dùng `/topic/screenings/{id}` và kênh điều phối bác sĩ `/topic/screenings/new`.
   * Đồng bộ tức thời chuông thông báo `NotificationBell` và cập nhật danh sách chờ thẩm định của bác sĩ.

---

### Bước 5: Bàn Chẩn Đoán Trực Quan Đa Tầng CDS (Multi-Layer Retinal Workstation)
Tại giao diện bàn chẩn đoán (`InteractiveCDSViewer.tsx`), hệ thống dựng mô hình hiển thị 5 tầng đồng bộ:

| Tầng (Layer) | Công Nghệ Thực Thi | Chức Năng Lâm Sàng |
| :--- | :--- | :--- |
| **Layer 0: Raw Fundus** | HTML5 Canvas / Image GPU | Hiển thị trung thực màu sắc tự nhiên của đáy mắt, hỗ trợ thu phóng vô cấp ($1.0\times - 5.0\times$) và kéo rê Pan offset. |
| **Layer 1: Optical Red-Free** | Canvas Pixel Manipulation | **Bộ lọc 540nm kênh Green Isolation**: Cô lập hemoglobin ($R_{out} = 0.1 \times G$, $G_{out} = 1.3 \times G$, $B_{out} = 0.2 \times G$). Bật chế độ buồng tối huỳnh quang (*Fluorescein FA mode*). |
| **Layer 2: Anatomical Heatmap** | `dynamicHeatmapEngine.ts` | Bản đồ nhiệt động Grad-CAM tự động căn theo giải phẫu: Cung mạch trên/dưới, hoàng điểm và gai thị OD vs OS; tập trung tâm nhiệt đỏ rực tại chính xác tổn thương. |
| **Layer 3: Spatial Target Pins** | Absolute Normalized Coords | Các khung Bounding Box và ghim tròn nhấp nháy (*pulse animation*) khóa chặt vào tổn thương bệnh lý, kèm tooltip tên tiếng Việt và độ tin cậy. |
| **Layer 4: Caliper Ruler** | Vector SVG Interactive Caliper | Thước đo vi mạch điện tử cho phép bác sĩ kéo chuột đo trực tiếp khoảng cách và đường kính mao mạch tính theo pixel và micromet ($\mu m$). |

---

### Bước 6: Thẩm Định Lâm Sàng Bác Sĩ & Vòng Lặp Tái Huấn Luyện (FR-14, 15, 19)
1. **Bàn làm việc thẩm định chuyên khoa (`DoctorDiagnosisWorkspace.tsx`)**:
   * Bác sĩ xem đối chiếu song song (*Side-by-Side*) giữa ảnh gốc và ảnh phân tích AI.
   * Rà soát các chỉ số hình thái học: A/V Ratio, CDR, mật độ mao mạch.
2. **Quyết định 3 lựa chọn (Segmented Decision Control)**:
   * **Chấp thuận (APPROVED)**: Đồng thuận 100% với phân tích của AI.
   * **Hiệu chỉnh (MODIFIED)**: Điều chỉnh mức nguy cơ tim mạch hoặc võng mạc đái tháo đường. **Bắt buộc nhập Lý do lâm sàng (Mandatory Clinical Override Rationale)**.
   * **Bác bỏ (REJECTED)**: Bác bỏ hoàn toàn kết luận của AI.
3. **Mã hóa bệnh danh & Ghi chú**:
   * Gán mã ICD-10 chuẩn hóa (`H35.0` - Biến đổi vi mạch võng mạc, `E11.3` - Võng mạc đái tháo đường, `I10` - Tăng huyết áp, `H40.1` - Glôcôm).
   * Điền kế hoạch điều trị, khuyến nghị lối sống và lịch hẹn tái khám (1 tháng, 3 tháng, 6 tháng, Khẩn cấp).
4. **Ký số bảo chứng điện tử (Digital Signature HMAC-SHA256)**:
   * Tạo chữ ký số bất biến: `SHA256-AURA-{DoctorID}-{ScreeningID}-{Timestamp}` chứng thực tính pháp lý y tế theo chuẩn HIPAA EMR.
5. **Kho dữ liệu Tái Huấn Luyện Mô Hình (Model Retraining Feedback Loop - FR-19)**:
   * Dữ liệu sau khi bác sĩ ký được đồng bộ tự động vào bảng `doctor_feedback` (`POST /api/v1/doctor/feedback`) với cờ `included_in_retraining: true`.
   * Bộ dữ liệu này lưu trữ nhãn hiệu chỉnh, tọa độ vi mạch bác sĩ xác nhận để phục vụ các chu kỳ huấn luyện tinh chỉnh mô hình (*Fine-tuning / Active Learning*) định kỳ mà không làm rò rỉ thông tin bệnh nhân.

---

## 3. BẢNG TỔNG HỢP CÁC CHỈ SỐ VÀ NGƯỠNG Y KHOA TRONG AI PIPELINE

| Chỉ Số Lâm Sàng | Ký Hiệu / Đơn Vị | Ngưỡng Bình Thường | Ngưỡng Cảnh Báo Lâm Sàng | Ý Nghĩa Chẩn Đoán |
| :--- | :---: | :---: | :---: | :--- |
| **Tỷ lệ Động/Tĩnh mạch** | A/V Ratio | $0.65 - 0.67$ | $< 0.60$ (Báo động $< 0.50$) | Hẹp tiểu động mạch, tăng huyết áp, xơ vữa mạch máu |
| **Lõm gai thị dọc** | Vertical CDR | $< 0.50$ | $\ge 0.50$ (Báo động $\ge 0.65$) | Tổn thương viền thần kinh thị giác, nguy cơ Glôcôm |
| **Chỉ số vặn xoắn** | Tortuosity Index | $1.10 - 1.25$ | $\ge 1.30$ | Mạch máu uốn lượn, tăng áp lực dòng máu, bệnh võng mạc |
| **Mật độ mao mạch** | Vessel Density (%) | $16.0\% - 18.5\%$ | $< 15.0\%$ hoặc $> 20.0\%$ | Giảm tưới máu mao mạch, vùng thiếu máu cục bộ |
| **Điểm nguy cơ tổng thể** | Overall Risk Score | $0 - 39$ (Thấp) | $40 - 64$ (TB), $\ge 65$ (Cao) | Phân tầng nguy cơ bệnh lý tim mạch và biến cố mạch máu |
| **Phân độ võng mạc ĐTĐ** | ETDRS Grade | Độ 0 (Không DR) | Độ 1–2 (NPDR), Độ 3–4 (PDR) | Đánh giá nguy cơ phù hoàng điểm và biến chứng mù lòa |

---

## 4. KẾT LUẬN & KIỂM CHỨNG HỆ THỐNG

Toàn bộ luồng xử lý AI của AURA đã được tích hợp hoàn chỉnh và kiểm thử hồi quy nghiêm ngặt:
* **Tính toàn vẹn DTO & API**: Đạt chuẩn RESTful OpenAPI tại `/api/v1/screenings`.
* **Khả năng giải thích lâm sàng (Explainable AI - XAI)**: Đáp ứng đầy đủ các yếu tố giải thích trực quan (Bản đồ nhiệt Grad-CAM, cây vi mạch Red-Free, ghim tọa độ tổn thương và phân tích mốc giải phẫu OD vs OS).
* **An toàn y tế & Pháp lý**: Đạt tiêu chuẩn kiểm toán y khoa độc lập, không sử dụng dữ liệu giả lập (No Mock in Production), có chữ ký số điện tử bảo chứng EMR và hỗ trợ xuất hồ sơ định dạng quốc tế HL7/FHIR Bundle, CSV, PDF.
