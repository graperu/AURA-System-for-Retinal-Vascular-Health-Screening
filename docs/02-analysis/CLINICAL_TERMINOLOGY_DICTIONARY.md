# BIÊN BẢN THẨM ĐỊNH LÂM SÀNG & TỪ ĐIỂN THUẬT NGỮ Y KHOA SONG NGỮ AURA
## (AURA Clinical Domain Specification & Bilingual Medical Terminology Dictionary)

**Cơ quan thẩm định**: Chuyên Gia Miền Y Tế & Nhãn Khoa AURA (Healthcare Domain Analyst)  
**Tiêu chuẩn đối chiếu**: 
- Hướng dẫn Chẩn đoán và Điều trị các Bệnh về Mắt - Bộ Y tế Việt Nam (Quyết định số 3906/QĐ-BYT).
- Hướng dẫn Thực hành Lâm sàng Nhãn khoa - Hội Nhãn khoa Hoa Kỳ (AAO Preferred Practice Patterns).
- Khuyến cáo Phân tầng Nguy cơ Tim mạch - Hội Tim mạch Quốc gia Việt Nam (VNHA) & Trường Môn Tim mạch Hoa Kỳ (ACC/AHA).
- Phân loại Bệnh lý Vi mạch Võng mạc Đái tháo đường Quốc tế (ETDRS & ICDR Scale).
- Thang phân độ Bệnh võng mạc Tăng huyết áp Wong-Mitchell.
- Tiêu chuẩn An toàn Thiết bị Phần mềm Y tế ISO 13485, ISO 14971 và Tiêu chuẩn Bảo mật Dữ liệu Sức khỏe HIPAA Safe Harbor.

---

## 1. NGUYÊN TẮC XÓA BỎ CHUỖI LAI TẠP (ZERO HYBRID STRINGS PRINCIPLE)

### 1.1. Hiện trạng và Rủi ro Lâm sàng
Hệ thống AURA trước đây tồn tại nhiều chuỗi văn bản ghép lai tạp "Tiếng Việt (English)" như:
- *"Bàn Chẩn Đoán Tương Tác CDS (Fundus & Grad-CAM Heatmap Viewer)"*
- *"Ảnh màu đáy mắt hoàng điểm (Fundus Color - Macula Centered)"*
- *"Mắt Phải - OD (Oculus Dexter)"*
- *"Chỉ Số Sinh Học Định Lượng Mạch Máu (Quantitative Biomarkers)"*
- *"Tỷ lệ A/V Ratio"*

**Hệ quả lâm sàng:**
1. **Gây nhiễu thị giác và quá tải nhận thức** cho bác sĩ chuyên khoa trong buồng tối khi cần tập trung soi chiếu tổn thương vi phình mạch hoặc xuất huyết võng mạc.
2. **Gây hoang mang cho bệnh nhân** khi đọc báo cáo sức khỏe cá nhân với các thuật ngữ viết tắt tiếng Latin/Anh xen lẫn.
3. **Phá vỡ tính chuẩn hóa của hệ thống đa ngôn ngữ (i18n)**, cản trở việc mở rộng ra các thị trường y tế quốc tế.

### 1.2. Quy tắc Chuẩn hóa
1. **Tách biệt hoàn toàn hai ngôn ngữ**: Giao diện Tiếng Việt hiển thị 100% thuật ngữ chuyên ngành tiếng Việt chuẩn Bộ Y tế. Giao diện Tiếng Anh hiển thị 100% thuật ngữ chuẩn quốc tế (AAO / AHA / MeSH).
2. **Xử lý ký hiệu viết tắt y khoa quốc tế**: Ký hiệu quốc tế thông dụng trong hồ sơ bệnh án (như OD, OS, OU, AVR, CDR, OCT) được giữ nguyên trong ngoặc đơn ở cả hai ngôn ngữ nhưng tuyệt đối không ghép lặp cụm từ giải nghĩa dài dòng hai thứ tiếng.
3. **Tuân thủ ranh giới CDS (Clinical Decision Support)**: Tuyên bố miễn trừ trách nhiệm y tế (Medical Disclaimer) phải hiện diện bắt buộc và độc lập trên mọi màn hình phân tích và báo cáo xuất ra.

---

## 2. BẢNG ĐỐI CHIẾU THUẬT NGỮ LÂM SÀNG CHUẨN XÁC (VI & EN)

### 2.1. Các Loại Ảnh Chụp Đáy Mắt (Retinal Imaging Modalities / Scan Types)

| Mã Định Danh Key | Thuật Ngữ Tiếng Việt (VI) | Thuật Ngữ Tiếng Anh (EN) | Định Nghĩa Lâm Sàng & Cơ Sở Nhãn Khoa |
| :--- | :--- | :--- | :--- |
| `SCAN_MACULA` | **Ảnh màu đáy mắt hoàng điểm** | **Macula-Centered Fundus Color** | Ảnh chụp tập trung vào hoàng điểm (Fovea/Macula) và vi mạch trung tâm võng mạc. Dùng để phát hiện phù hoàng điểm (DME), thoái hóa hoàng điểm (AMD) và vi phình mạch trung tâm. |
| `SCAN_OPTIC_DISC` | **Ảnh màu đáy mắt gai thị** | **Optic Disc Fundus Color** | Ảnh chụp định tâm vào đĩa thần kinh thị giác (gai thị). Dùng để đo tỷ lệ lõm đĩa thị (CDR), viền thần kinh võng mạc, cung mạch thái dương và sàng lọc Glaucoma. |
| `SCAN_OCT` | **Chụp cắt lớp võng mạc (OCT)** | **Optical Coherence Tomography (OCT)** | Chụp cắt lớp quang học võng mạc độ phân giải siêu cao (độ sâu micrometer). Đánh giá chiều dày hoàng điểm, lớp sợi thần kinh võng mạc (RNFL) và màng trước võng mạc. |

---

### 2.2. Giải Phẫu Bên Mắt (Ocular Laterality)

| Mã Định Danh Key | Thuật Ngữ Tiếng Việt (VI) | Thuật Ngữ Tiếng Anh (EN) | Gốc Từ Lâm Sàng & Quy Ước Hồ Sơ Bệnh Án |
| :--- | :--- | :--- | :--- |
| `EYE_RIGHT` | **Mắt phải (OD)** | **Right Eye (OD)** | Gốc Latin: *Oculus Dexter*. Bắt buộc hiển thị đồng nhất trên nhãn tải ảnh, bộ lọc và kết luận chẩn đoán. |
| `EYE_LEFT` | **Mắt trái (OS)** | **Left Eye (OS)** | Gốc Latin: *Oculus Sinister*. |
| `EYE_BOTH` | **Cả hai mắt (OU)** | **Both Eyes (OU)** | Gốc Latin: *Oculus Uterque*. Áp dụng khi phân tích đối chiếu đồng thời hai mắt của cùng một ca bệnh. |

---

### 2.3. Bàn Chẩn Đoán Bác Sĩ CDS & Thị Giác AI (Interactive CDS Workspace & XAI)

| Mã Định Danh Key | Thuật Ngữ Tiếng Việt (VI) | Thuật Ngữ Tiếng Anh (EN) | Giải Nghĩa Lâm Sàng Chuyên Sâu |
| :--- | :--- | :--- | :--- |
| `WORKSPACE_TITLE` | **Bàn chẩn đoán tương tác CDS** | **Interactive CDS Workspace** | Không gian làm việc hỗ trợ quyết định lâm sàng (Clinical Decision Support) dành cho bác sĩ nhãn khoa và tim mạch. |
| `HEATMAP_VIEWER` | **Bản đồ nhiệt Grad-CAM** | **Grad-CAM Heatmap Viewer** | Trực quan hóa vùng mạng nơ-ron tích chập AI tập trung chú ý (Attention Map), làm nổi bật tổn thương vi mạch. |
| `MICROVASCULAR_INSPECTION` | **Soi chiếu vi mạch đáy mắt** | **Retinal Microvascular Inspection** | Công cụ phóng đại quang học kiểm tra hình thái các cung mạch thái dương và nhánh vi tuần hoàn. |
| `VESSEL_SEGMENTATION` | **Lớp phân đoạn mạch máu** | **Vessel Segmentation Overlay** | Lớp mặt nạ nhị phân tách cây mạch máu (Arterioles & Venules) khỏi nền biểu mô sắc tố võng mạc. |
| `DARKROOM_MODE` | **Chế độ buồng tối nhãn khoa** | **Ophthalmology Dark Room Mode** | Giao diện tối chuyên dụng (Contrast Ratio $\ge 7:1$) bảo vệ thị lực bác sĩ và tăng độ tương phản khi soi vi phình mạch. |
| `HEATMAP_OPACITY` | **Độ mờ bản đồ nhiệt** | **Heatmap Opacity** | Thanh trượt điều chỉnh độ trong suốt từ 0% (ảnh đáy mắt gốc) đến 100% (bản đồ nhiệt AI toàn phần). |
| `XAI_RATIONALES` | **Luận cứ giải thích AI** | **AI Explainability Rationales** | Các căn cứ đặc trưng hình ảnh giúp bác sĩ hiểu rõ tại sao AI đề xuất mức độ rủi ro tương ứng. |

---

### 2.4. Phân Tầng Nguy Cơ Lâm Sàng (Clinical Risk Stratification)

| Mã Định Danh Key | Thuật Ngữ Tiếng Việt (VI) | Thuật Ngữ Tiếng Anh (EN) | Thang Điểm (0-100) & Tiêu Chuẩn Lâm Sàng (AAO / ACC) |
| :--- | :--- | :--- | :--- |
| `RISK_LOW` | **Nguy cơ thấp** | **Low Risk** | **0 – 39 điểm**: Đáy mắt bình thường, cung mạch lưu thông tốt, không ghi nhận tổn thương vi mạch hay thiếu máu. |
| `RISK_MODERATE` | **Nguy cơ trung bình** | **Moderate Risk** | **40 – 64 điểm**: Xuất hiện co hẹp nhẹ tiểu động mạch, dấu bắt chéo nhẹ hoặc 1–2 vi phình mạch ngoài hoàng điểm. |
| `RISK_HIGH` | **Nguy cơ cao** | **High Risk** | **65 – 79 điểm**: Co thắt động mạch rõ, nhiều vi phình mạch, xuất huyết dạng chấm/vệt, nguy cơ biến cố tim mạch tăng cao. |
| `RISK_CRITICAL` | **Nguy kịch** | **Critical Risk** | **80 – 100 điểm**: Xuất huyết diện rộng, xuất tiết bông, phù hoàng điểm hoặc thiếu máu cực độ; cần can thiệp khẩn cấp. |
| `RISK_UNVERIFIED` | **Cần thẩm định lại** | **Unverified / Needs Re-evaluation** | Ảnh chất lượng kém, nhòe sáng, bóng mờ hoặc độ tự tin AI $< 0.60$. Tuyệt đối không đánh giá là Bình thường để tránh âm tính giả (False Negative). |

---

### 2.5. Chỉ Số Sinh Học Vi Mạch Võng Mạc (Retinal Microvascular Biomarkers)

| Mã Định Danh Key | Thuật Ngữ Tiếng Việt (VI) | Thuật Ngữ Tiếng Anh (EN) | Giá Trị Chuẩn & Ý Nghĩa Y Sinh Học |
| :--- | :--- | :--- | :--- |
| `BIOMARKER_AVR` | **Tỷ lệ động-tĩnh mạch (A/V)** | **Arteriolar-Venular Ratio (AVR)** | **Bình thường: ~0.67 (2:3)**. Giá trị $< 0.60$ biểu hiện co thắt tiểu động mạch khu trú do tăng huyết áp mạn tính. |
| `BIOMARKER_DENSITY` | **Mật độ vi mạch** | **Vessel Density** | Tỷ lệ diện tích mao mạch bao phủ võng mạc (%). Giảm mật độ phản ánh tình trạng tắc nghẽn mao mạch và thiếu máu võng mạc. |
| `BIOMARKER_TORTUOSITY` | **Độ ngoằn ngoèo mạch máu** | **Vascular Tortuosity** | Chỉ số đo độ cong uốn khúc của tiểu động/tĩnh mạch. Tăng độ ngoằn ngoèo liên quan chặt chẽ đến áp lực dòng chảy và xơ cứng mạch máu. |
| `BIOMARKER_CDR` | **Tỷ lệ lõm đĩa thị (C/D)** | **Vertical Cup-to-Disc Ratio (CDR)** | **Bình thường: 0.30 – 0.40**. Ngưỡng nghi ngờ Glaucoma khi $\ge 0.50$ hoặc chênh lệch giữa hai mắt $> 0.20$. |

---

### 2.6. Quyết Định Lâm Sàng Của Bác Sĩ (Doctor Review Decision - FR-15/FR-16)

| Mã Định Danh Key | Thuật Ngữ Tiếng Việt (VI) | Thuật Ngữ Tiếng Anh (EN) | Hành Vi Hệ Thống & Pháp Lý Lâm Sàng |
| :--- | :--- | :--- | :--- |
| `DECISION_APPROVED` | **Chấp thuận kết quả AI** | **Approve AI Findings** | Bác sĩ xác nhận chỉ số và phân tầng rủi ro AI là chính xác, chuyển trạng thái ca khám sang `REVIEWED`. |
| `DECISION_MODIFIED` | **Hiệu chỉnh chẩn đoán** | **Modify Clinical Assessment** | Bác sĩ điều chỉnh mức độ rủi ro (Cardio/DR Risk) và ghi nhận lý do chuyên môn vào ghi chú lâm sàng. |
| `DECISION_REJECTED` | **Bác bỏ kết luận AI** | **Reject AI Assessment** | Bác sĩ bác bỏ phân tích do ảnh lỗi, nhiễu kỹ thuật hoặc AI nhận định sai lệch; yêu cầu chụp lại ảnh. |

---

### 2.7. Tuyên Bố Miễn Trừ Trách Nhiệm Y Tế Bắt Buộc (Mandatory Medical Disclaimer)

| Ngôn Ngữ | Văn Bản Tuyên Bố Pháp Lý Bắt Buộc |
| :--- | :--- |
| **Tiếng Việt (VI)** | **"Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."** |
| **Tiếng Anh (EN)** | **"AI-generated screening results are intended for clinical decision support only and do not replace professional diagnosis by an ophthalmologist or cardiologist."** |

---

### 2.8. Ánh Xạ Danh Mục Bệnh Tật Quốc Tế ICD-10 (FR-16 Clinical Coding)

| Mã ICD-10 | Danh Pháp Tiếng Việt Chuẩn Bộ Y Tế | Danh Pháp Tiếng Anh Chuẩn WHO / AAO | Nhóm Bệnh Học Liên Quan |
| :--- | :--- | :--- | :--- |
| `H35.0` | **Bệnh lý mạch máu võng mạc và biến đổi vi mạch** | **Retinal vascular changes and background retinopathy** | Vi mạch võng mạc tổng quát |
| `H35.03`| **Bệnh võng mạc tăng huyết áp** | **Hypertensive retinopathy** | Biến chứng tim mạch |
| `E11.3` | **Bệnh võng mạc đái tháo đường type 2** | **Type 2 diabetes mellitus with diabetic retinopathy** | Đái tháo đường (ETDRS) |
| `E10.3` | **Bệnh võng mạc đái tháo đường type 1** | **Type 1 diabetes mellitus with diabetic retinopathy** | Đái tháo đường (ETDRS) |
| `I10`    | **Tăng huyết áp vô căn (nguyên phát)** | **Essential (primary) hypertension** | Tim mạch & huyết áp |
| `H40.1` | **Glaucoma góc mở nguyên phát** | **Primary open-angle glaucoma** | Tăng nhãn áp (Tổn thương gai thị) |
| `H35.3` | **Thoái hóa hoàng điểm tuổi già (AMD)** | **Age-related macular degeneration (AMD)** | Hoàng điểm & thị lực trung tâm |
| `I63`    | **Nhồi máu não (Nguy cơ đột quỵ thiếu máu)** | **Cerebral infarction (Ischemic stroke risk)** | Nguy cơ đột quỵ vi mạch não |

---

### 2.9. Khuyến Nghị Sức Khỏe Tự Động An Toàn (Safe Clinical Recommendations)

*Nguyên tắc tối thượng: CẤM kê đơn thuốc hoặc nhắc đến tên thuốc, hoạt chất và liều dùng.*

| Phân Nhóm Nguy Cơ | Khuyến Nghị Sức Khỏe Tiếng Việt (VI) | Khuyến Nghị Sức Khỏe Tiếng Anh (EN) |
| :--- | :--- | :--- |
| **Nguy cơ thấp (Low Risk)** | - Hệ vi mạch võng mạc khỏe mạnh, chưa phát hiện dấu hiệu tổn thương.<br>- Duy trì chế độ dinh dưỡng giàu chất chống oxy hóa (rau xanh, cá béo).<br>- Tái khám đáy mắt định kỳ mỗi 12 tháng. | - Retinal microvasculature appears healthy with no signs of microvascular lesions.<br>- Maintain an antioxidant-rich diet and regular physical activity.<br>- Schedule a routine retinal screening examination every 12 months. |
| **Nguy cơ trung bình (Moderate Risk)** | - Ghi nhận co hẹp nhẹ vi mạch; khuyến nghị theo dõi huyết áp và đường huyết tại nhà.<br>- Hạn chế thực phẩm nhiều muối và chất béo bão hòa.<br>- Đặt lịch khám chuyên khoa Mắt hoặc Tim mạch trong vòng 3 – 6 tháng. | - Mild microvascular narrowing detected; daily blood pressure and blood glucose monitoring is advised.<br>- Adopt a low-sodium, heart-healthy dietary pattern.<br>- Consult an ophthalmologist or cardiologist within 3 to 6 months for evaluation. |
| **Nguy cơ cao (High Risk)** | - Phát hiện biến đổi mạch máu đáng kể; cần khám chuyên khoa Mắt để soi đáy mắt giãn đồng tử.<br>- Khám Tim mạch toàn diện để đánh giá nguy cơ xơ vữa và biến chứng mạch máu.<br>- Thực hiện tái khám trong vòng 2 – 4 tuần. | - Notable microvascular alterations detected; dilated fundus examination is strongly recommended.<br>- Comprehensive cardiovascular assessment advised to evaluate vascular risk.<br>- Follow up with your specialist physician within 2 to 4 weeks. |
| **Nguy kịch (Critical Risk)** | - Tổn thương vi mạch mức độ nặng; nguy cơ biến cố cấp tính.<br>- Yêu cầu đến cơ sở y tế chuyên khoa Mắt hoặc cấp cứu Tim mạch để kiểm tra ngay lập tức.<br>- Tránh vận động thể lực quá sức trước khi được bác sĩ thăm khám. | - Severe microvascular abnormalities detected; potential risk of acute complications.<br>- Urgent clinical evaluation by an ophthalmologist or emergency cardiology unit required immediately.<br>- Avoid strenuous physical exertion pending urgent medical consultation. |

---

### 2.10. Nhãn Điều Hướng Hệ Thống (Navigation & System Core Labels)

| Mã Định Danh Key | Tiếng Việt (VI) | Tiếng Anh (EN) | Áp Dụng Cho Vai Trò |
| :--- | :--- | :--- | :--- |
| `NAV_DASHBOARD` | **Tổng quan sức khỏe** | **Health Dashboard** | Patient |
| `NAV_UPLOAD` | **Phân tích ảnh mới** | **New Scan Analysis** | Patient |
| `NAV_CDS_VIEWER` | **Bản đồ nhiệt & XAI** | **Heatmap & XAI Viewer** | Patient |
| `NAV_HISTORY` | **Lịch sử & Báo cáo** | **History & Reports** | Patient |
| `NAV_CONSULTATION` | **Tư vấn Bác sĩ** | **Doctor Consultation** | Patient / Doctor |
| `NAV_PROFILE` | **Hồ sơ y tế** | **Medical Profile** | Patient |
| `NAV_BILLING` | **Giao dịch & Lượt khám** | **Billing & Credits** | Patient / Clinic |
| `NAV_DOCTOR_CDS` | **Bàn chẩn đoán ảnh CDS** | **CDS Diagnostic Workspace** | Doctor |
| `NAV_PATIENT_LIST` | **Danh sách bệnh nhân** | **Patient Worklist** | Doctor |
| `NAV_RISK_ANALYTICS` | **Thống kê nguy cơ** | **Risk Analytics** | Doctor |
| `NAV_REPORTS` | **Báo cáo y khoa & Ký duyệt** | **Medical Reports & Sign-off** | Doctor |
| `NAV_BULK_BATCH` | **Sàng lọc hàng loạt** | **Bulk Batch Screening** | Clinic |
| `NAV_CAMPAIGN_ANALYTICS` | **Báo cáo chiến dịch** | **Campaign Analytics** | Clinic |
| `NAV_DOCTORS_MANAGE` | **Quản lý bác sĩ** | **Doctor Management** | Clinic |
| `NAV_USER_MANAGEMENT` | **Quản lý người dùng** | **User Management** | Admin |
| `NAV_RBAC_MATRIX` | **Phân quyền vai trò** | **RBAC Permissions** | Admin |
| `NAV_AI_THRESHOLDS` | **Cấu hình tham số AI** | **AI Model Configuration** | Admin |
| `NAV_AUDIT_LOGS` | **Nhật ký kiểm toán HIPAA** | **HIPAA Audit Trail** | Admin |
| `NAV_LOGOUT` | **Đăng xuất** | **Log Out** | Toàn bộ hệ thống |

---

## 3. ĐẶC TẢ FILE NGUỒN TYPESCRIPT CHO FRONTEND (`src/i18n/translations.ts`)

Bảng từ điển cấu trúc dưới dạng Typed Object chuẩn mực, sẵn sàng tích hợp trực tiếp:

```typescript
/**
 * AURA Clinical Decision Support System - Bilingual Medical Dictionary
 * Standardized according to VN Ministry of Health & AAO Guidelines.
 * Strict Zero-Hybrid Policy: No mixed "Tiếng Việt (English)" strings.
 */

export type SupportedLanguage = 'vi' | 'en';

export interface ClinicalTranslationSchema {
  common: {
    systemName: string;
    systemFullName: string;
    medicalDisclaimerTitle: string;
    medicalDisclaimerText: string;
    darkRoomOn: string;
    darkRoomOff: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    vesselOverlay: string;
    opacityLabel: string;
    close: string;
    save: string;
    cancel: string;
    confirm: string;
    loading: string;
    refresh: string;
    printReport: string;
    exportCsv: string;
  };
  navigation: {
    dashboard: string;
    newScan: string;
    cdsWorkspace: string;
    patientList: string;
    historyReports: string;
    consultation: string;
    medicalProfile: string;
    billingCredits: string;
    riskAnalytics: string;
    medicalReportsSignoff: string;
    bulkScreening: string;
    campaignAnalytics: string;
    doctorManagement: string;
    userManagement: string;
    rbacPermissions: string;
    aiConfiguration: string;
    auditLogs: string;
    logout: string;
  };
  eyeLaterality: {
    rightEye: string;
    rightEyeShort: string;
    leftEye: string;
    leftEyeShort: string;
    bothEyes: string;
    bothEyesShort: string;
  };
  scanTypes: {
    maculaCentered: {
      label: string;
      description: string;
    };
    opticDisc: {
      label: string;
      description: string;
    };
    oct: {
      label: string;
      description: string;
    };
  };
  riskLevels: {
    low: string;
    moderate: string;
    high: string;
    critical: string;
    unverified: string;
  };
  biomarkers: {
    avr: {
      label: string;
      abbreviation: string;
      normalRef: string;
      clinicalSignificance: string;
    };
    vesselDensity: {
      label: string;
      unit: string;
      normalRef: string;
      clinicalSignificance: string;
    };
    tortuosity: {
      label: string;
      unit: string;
      normalRef: string;
      clinicalSignificance: string;
    };
    cdr: {
      label: string;
      abbreviation: string;
      normalRef: string;
      clinicalSignificance: string;
    };
  };
  clinicalDecision: {
    title: string;
    approve: string;
    modify: string;
    reject: string;
    doctorNotesPlaceholder: string;
    signerLabel: string;
    signatureVerified: string;
    saveSuccess: string;
  };
  icd10: Record<string, string>;
  recommendations: Record<'low' | 'moderate' | 'high' | 'critical', string[]>;
}

export const translations: Record<SupportedLanguage, ClinicalTranslationSchema> = {
  vi: {
    common: {
      systemName: "AURA",
      systemFullName: "Hệ thống Hỗ trợ Quyết định Lâm sàng Sàng lọc Vi mạch Võng mạc AURA",
      medicalDisclaimerTitle: "Tuyên bố Miễn trừ Trách nhiệm Y tế",
      medicalDisclaimerText:
        "Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.",
      darkRoomOn: "Buồng tối: BẬT",
      darkRoomOff: "Buồng tối",
      zoomIn: "Phóng to",
      zoomOut: "Thu nhỏ",
      resetZoom: "Kích thước chuẩn",
      vesselOverlay: "Lớp phân đoạn mạch máu",
      opacityLabel: "Độ mờ bản đồ nhiệt",
      close: "Đóng",
      save: "Lưu kết luận",
      cancel: "Hủy bỏ",
      confirm: "Xác nhận",
      loading: "Đang tải dữ liệu lâm sàng...",
      refresh: "Làm mới",
      printReport: "In phiếu kết quả",
      exportCsv: "Xuất tệp CSV",
    },
    navigation: {
      dashboard: "Tổng quan sức khỏe",
      newScan: "Phân tích ảnh mới",
      cdsWorkspace: "Bàn chẩn đoán tương tác CDS",
      patientList: "Danh sách bệnh nhân",
      historyReports: "Lịch sử & Báo cáo",
      consultation: "Tư vấn Bác sĩ",
      medicalProfile: "Hồ sơ y tế",
      billingCredits: "Giao dịch & Lượt khám",
      riskAnalytics: "Thống kê nguy cơ",
      medicalReportsSignoff: "Báo cáo y khoa & Ký duyệt",
      bulkScreening: "Sàng lọc hàng loạt",
      campaignAnalytics: "Báo cáo chiến dịch",
      doctorManagement: "Quản lý bác sĩ",
      userManagement: "Quản lý người dùng",
      rbacPermissions: "Phân quyền vai trò",
      aiConfiguration: "Cấu hình tham số AI",
      auditLogs: "Nhật ký kiểm toán HIPAA",
      logout: "Đăng xuất",
    },
    eyeLaterality: {
      rightEye: "Mắt phải (OD)",
      rightEyeShort: "Mắt phải",
      leftEye: "Mắt trái (OS)",
      leftEyeShort: "Mắt trái",
      bothEyes: "Cả hai mắt (OU)",
      bothEyesShort: "Cả hai mắt",
    },
    scanTypes: {
      maculaCentered: {
        label: "Ảnh màu đáy mắt hoàng điểm",
        description: "Tập trung vùng hoàng điểm và hệ thống mao mạch trung tâm võng mạc",
      },
      opticDisc: {
        label: "Ảnh màu đáy mắt gai thị",
        description: "Tập trung gai thị, viền thần kinh và tỷ lệ lõm đĩa thị",
      },
      oct: {
        label: "Chụp cắt lớp võng mạc (OCT)",
        description: "Cắt lớp quang học phân giải cao đánh giá chiều dày và cấu trúc vi mô võng mạc",
      },
    },
    riskLevels: {
      low: "Nguy cơ thấp",
      moderate: "Nguy cơ trung bình",
      high: "Nguy cơ cao",
      critical: "Nguy kịch",
      unverified: "Cần thẩm định lại",
    },
    biomarkers: {
      avr: {
        label: "Tỷ lệ động-tĩnh mạch",
        abbreviation: "A/V",
        normalRef: "Bình thường: ~0.67 (2:3)",
        clinicalSignificance: "Chỉ số co hẹp tiểu động mạch do tăng huyết áp mạn tính",
      },
      vesselDensity: {
        label: "Mật độ vi mạch",
        unit: "%",
        normalRef: "Bình thường: 16.0% – 22.0%",
        clinicalSignificance: "Phản ánh tình trạng tưới máu và thiếu máu cục bộ mao mạch võng mạc",
      },
      tortuosity: {
        label: "Độ ngoằn ngoèo mạch máu",
        unit: "",
        normalRef: "Bình thường: 1.10 – 1.20",
        clinicalSignificance: "Tăng áp lực thành mạch và biến đổi cấu trúc cung mạch võng mạc",
      },
      cdr: {
        label: "Tỷ lệ lõm đĩa thị",
        abbreviation: "C/D",
        normalRef: "Bình thường: 0.30 – 0.40",
        clinicalSignificance: "Chỉ số quan trọng trong sàng lọc và theo dõi bệnh lý Glaucoma",
      },
    },
    clinicalDecision: {
      title: "Quyết định lâm sàng của bác sĩ",
      approve: "Chấp thuận kết quả AI",
      modify: "Hiệu chỉnh chẩn đoán",
      reject: "Bác bỏ kết luận AI",
      doctorNotesPlaceholder: "Nhập ghi chú chẩn đoán phân biệt, khuyến nghị điều trị hoặc giải trình lý do hiệu chỉnh...",
      signerLabel: "Bác sĩ thẩm định & Ký số HMAC",
      signatureVerified: "Chữ ký số hợp lệ",
      saveSuccess: "Đã lưu kết luận lâm sàng và ký số hồ sơ thành công!",
    },
    icd10: {
      "H35.0": "H35.0 — Bệnh lý mạch máu võng mạc và biến đổi vi mạch",
      "H35.03": "H35.03 — Bệnh võng mạc tăng huyết áp",
      "E11.3": "E11.3 — Bệnh võng mạc đái tháo đường type 2",
      "E10.3": "E10.3 — Bệnh võng mạc đái tháo đường type 1",
      "I10": "I10 — Tăng huyết áp vô căn (nguyên phát)",
      "H40.1": "H40.1 — Glaucoma góc mở nguyên phát",
      "H35.3": "H35.3 — Thoái hóa hoàng điểm tuổi già (AMD)",
      "I63": "I63 — Nhồi máu não (Nguy cơ đột quỵ thiếu máu cục bộ)",
    },
    recommendations: {
      low: [
        "Hệ vi mạch võng mạc khỏe mạnh, chưa ghi nhận dấu hiệu tổn thương vi mạch.",
        "Duy trì chế độ dinh dưỡng giàu chất chống oxy hóa và lối sống năng động.",
        "Khám mắt định kỳ mỗi 12 tháng để theo dõi sức khỏe vi mạch võng mạc.",
      ],
      moderate: [
        "Ghi nhận co hẹp nhẹ vi mạch; khuyến nghị theo dõi huyết áp và đường huyết tại nhà.",
        "Hạn chế thực phẩm nhiều muối và mỡ động vật; tăng cường vận động nhẹ.",
        "Khám chuyên khoa Mắt hoặc Tim mạch trong vòng 3 – 6 tháng để kiểm tra chuyên sâu.",
      ],
      high: [
        "Phát hiện biến đổi mạch máu đáng kể; cần khám Mắt soi đáy mắt giãn đồng tử.",
        "Khám Tim mạch toàn diện để đánh giá nguy cơ xơ vữa và biến chứng mạch máu.",
        "Thực hiện tái khám chuyên khoa trong vòng 2 – 4 tuần.",
      ],
      critical: [
        "Tổn thương vi mạch mức độ nặng; nguy cơ biến cố tim mạch hoặc giảm thị lực cấp.",
        "Yêu cầu đến cơ sở y tế chuyên khoa Mắt hoặc cấp cứu Tim mạch để kiểm tra ngay.",
        "Tránh vận động thể lực gắng sức trước khi được bác sĩ chuyên khoa thăm khám.",
      ],
    },
  },
  en: {
    common: {
      systemName: "AURA",
      systemFullName: "AURA Retinal Microvascular Screening & Clinical Decision Support System",
      medicalDisclaimerTitle: "Medical Safety Disclaimer",
      medicalDisclaimerText:
        "AI-generated screening results are intended for clinical decision support only and do not replace professional diagnosis by an ophthalmologist or cardiologist.",
      darkRoomOn: "Dark Room: ON",
      darkRoomOff: "Dark Room",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      resetZoom: "Standard View",
      vesselOverlay: "Vessel Segmentation Overlay",
      opacityLabel: "Heatmap Opacity",
      close: "Close",
      save: "Save Assessment",
      cancel: "Cancel",
      confirm: "Confirm",
      loading: "Loading clinical data...",
      refresh: "Refresh",
      printReport: "Print Medical Report",
      exportCsv: "Export CSV File",
    },
    navigation: {
      dashboard: "Health Dashboard",
      newScan: "New Scan Analysis",
      cdsWorkspace: "Interactive CDS Workspace",
      patientList: "Patient Worklist",
      historyReports: "History & Reports",
      consultation: "Doctor Consultation",
      medicalProfile: "Medical Profile",
      billingCredits: "Billing & Credits",
      riskAnalytics: "Risk Analytics",
      medicalReportsSignoff: "Medical Reports & Sign-off",
      bulkScreening: "Bulk Batch Screening",
      campaignAnalytics: "Campaign Analytics",
      doctorManagement: "Doctor Management",
      userManagement: "User Management",
      rbacPermissions: "RBAC Permissions",
      aiConfiguration: "AI Model Configuration",
      auditLogs: "HIPAA Audit Trail",
      logout: "Log Out",
    },
    eyeLaterality: {
      rightEye: "Right Eye (OD)",
      rightEyeShort: "Right Eye",
      leftEye: "Left Eye (OS)",
      leftEyeShort: "Left Eye",
      bothEyes: "Both Eyes (OU)",
      bothEyesShort: "Both Eyes",
    },
    scanTypes: {
      maculaCentered: {
        label: "Macula-Centered Fundus Color",
        description: "Targeted on foveal center and parafoveal capillary network",
      },
      opticDisc: {
        label: "Optic Disc Fundus Color",
        description: "Targeted on neuroretinal rim, optic cup, and vascular arcades",
      },
      oct: {
        label: "Optical Coherence Tomography (OCT)",
        description: "High-resolution cross-sectional tomographic imaging of retinal layers",
      },
    },
    riskLevels: {
      low: "Low Risk",
      moderate: "Moderate Risk",
      high: "High Risk",
      critical: "Critical Risk",
      unverified: "Unverified / Needs Re-evaluation",
    },
    biomarkers: {
      avr: {
        label: "Arteriolar-Venular Ratio",
        abbreviation: "AVR",
        normalRef: "Normal Reference: ~0.67 (2:3)",
        clinicalSignificance: "Indicator of arteriolar narrowing associated with chronic hypertension",
      },
      vesselDensity: {
        label: "Vessel Density",
        unit: "%",
        normalRef: "Normal Range: 16.0% – 22.0%",
        clinicalSignificance: "Reflects retinal capillary perfusion and non-perfusion ischemia",
      },
      tortuosity: {
        label: "Vascular Tortuosity",
        unit: "",
        normalRef: "Normal Range: 1.10 – 1.20",
        clinicalSignificance: "Associated with increased transluminal pressure and vascular remodeling",
      },
      cdr: {
        label: "Vertical Cup-to-Disc Ratio",
        abbreviation: "CDR",
        normalRef: "Normal Reference: 0.30 – 0.40",
        clinicalSignificance: "Crucial metric for glaucomatous optic neuropathy screening",
      },
    },
    clinicalDecision: {
      title: "Doctor Clinical Decision",
      approve: "Approve AI Findings",
      modify: "Modify Clinical Assessment",
      reject: "Reject AI Assessment",
      doctorNotesPlaceholder: "Enter differential diagnosis notes, therapeutic advice, or override rationale...",
      signerLabel: "Reviewing Specialist & HMAC Signature",
      signatureVerified: "Digital Signature Verified",
      saveSuccess: "Clinical findings and digital signature successfully recorded!",
    },
    icd10: {
      "H35.0": "H35.0 — Retinal vascular changes and background retinopathy",
      "H35.03": "H35.03 — Hypertensive retinopathy",
      "E11.3": "E11.3 — Type 2 diabetes mellitus with diabetic retinopathy",
      "E10.3": "E10.3 — Type 1 diabetes mellitus with diabetic retinopathy",
      "I10": "I10 — Essential (primary) hypertension",
      "H40.1": "H40.1 — Primary open-angle glaucoma",
      "H35.3": "H35.3 — Age-related macular degeneration (AMD)",
      "I63": "I63 — Cerebral infarction (Ischemic stroke risk)",
    },
    recommendations: {
      low: [
        "Retinal microvasculature appears healthy with no visible microvascular lesions.",
        "Maintain an antioxidant-rich diet and active physical routine.",
        "Schedule a routine fundus screening examination every 12 months.",
      ],
      moderate: [
        "Mild microvascular narrowing observed; daily home blood pressure and glucose logging advised.",
        "Reduce dietary sodium and saturated fat intake; engage in moderate exercise.",
        "Consult an ophthalmologist or cardiologist within 3 to 6 months for detailed evaluation.",
      ],
      high: [
        "Notable microvascular alterations detected; dilated funduscopy is strongly recommended.",
        "Undergo a comprehensive cardiovascular evaluation to assess target-organ vascular health.",
        "Schedule a clinical follow-up appointment within 2 to 4 weeks.",
      ],
      critical: [
        "Severe microvascular abnormalities observed; potential acute vascular compromise.",
        "Immediate clinical evaluation at an ophthalmology or emergency cardiology center required.",
        "Avoid strenuous physical exertion pending urgent medical consultation.",
      ],
    },
  },
};
```

---

## 4. KẾT LUẬN & HƯỚNG DẪN BÀN GIAO CHO FRONTEND DEVELOPER

1. **Ngừng toàn bộ việc nối chuỗi thủ công**: `frontend-developer` thay thế toàn bộ các chuỗi cứng dạng `label (English Sublabel)` bằng việc gọi `t('...')` từ file từ điển chuẩn trên.
2. **Đối với các thẻ Badge và Select Option**:
   - Khi ở chế độ VI: Hiển thị thuần Việt chuẩn (ví dụ: `Ảnh màu đáy mắt hoàng điểm`, phụ đề: `Tập trung vùng hoàng điểm và vi mạch trung tâm võng mạc`).
   - Khi ở chế độ EN: Hiển thị thuần Anh chuẩn (ví dụ: `Macula-Centered Fundus Color`, phụ đề: `Targeted on foveal center and parafoveal capillary network`).
3. **Đối với cảnh báo y tế (Medical Disclaimer)**:
   - Sử dụng đúng 100% nguyên văn đã được thẩm định pháp lý lâm sàng ở Mục 2.7. Tuyệt đối không tự ý biên tập rút gọn làm giảm tính răn đe an toàn y tế.
4. **Đối với mã bệnh ICD-10**:
   - Khắc phục các nhãn trong `DoctorDiagnosisModal.tsx` và `ClinicalValidationBar.tsx` để hiển thị tương ứng theo ngôn ngữ được chọn của người dùng.

---

## 5. ĐẶC TẢ CHUẨN HÓA THẺ TÓM TẮT NGUY CƠ LÂM SÀNG (`ClinicalRiskSummaryCard`)

Nhằm khắc phục triệt để phản ánh từ người dùng về việc chèn các chuỗi tiếng Anh trong ngoặc gây rối mắt và cản trở khả năng đọc nhanh (như `Nhận Định Lâm Sàng Của AI (Findings)`, `Khuyến Nghị Y Khoa & Theo Dõi (Recommendations)`), quy chuẩn hiển thị cho thẻ tóm tắt được quy định như sau:

| Vị Trí Thành Phần | Chuỗi Cũ (Gặp Lỗi Lai Ghép) | Chuỗi Chuẩn Hóa Tiếng Việt (VI) | Chuỗi Chuẩn Hóa Tiếng Anh (EN) | Lý Do Y Khoa & Trải Nghiệm Lâm Sàng |
| :--- | :--- | :--- | :--- | :--- |
| **Tiêu đề Nhận định** | `Nhận Định Lâm Sàng Của AI (Findings)` | **Nhận định lâm sàng từ AI** *(hoặc Phát hiện lâm sàng gợi ý)* | **AI Clinical Findings** | Bỏ hậu tố `(Findings)`. Đảm bảo người dùng hiểu rõ đây là nhận định tự động từ thuật toán AI mà không bị vấp thị giác. |
| **Badge nguồn nhận định** | `Vision AI` | **Phân tích hình ảnh** | **Vision Analysis** | Thay biệt ngữ kỹ thuật bằng ngôn ngữ chức năng y tế rõ ràng. |
| **Tiêu đề Khuyến nghị** | `Khuyến Nghị Y Khoa & Theo Dõi (Recommendations)` | **Khuyến nghị chăm sóc & theo dõi** *(hoặc Khuyến nghị y khoa & theo dõi)* | **Clinical Recommendations & Follow-up** | Bỏ hậu tố `(Recommendations)`. Ngôn ngữ tự nhiên, nhấn mạnh hành động chăm sóc dự phòng. |
| **Badge nguồn khuyến nghị** | `Khuyến cáo CDS` | **Hỗ trợ quyết định lâm sàng** | **CDS Advisory** | Biệt ngữ "CDS" được diễn giải thành mục đích hỗ trợ y khoa, tránh nhầm lẫn cho bệnh nhân. |
| **Banner đầu thẻ** | `Tóm Tắt Nguy Cơ Vi Mạch Lâm Sàng (CDS)` | **Tóm tắt nguy cơ vi mạch võng mạc** | **Retinal Vascular Risk Summary** | Thuần ngữ y khoa, không lồng ghép từ viết tắt hệ thống kỹ thuật vào tiêu đề chính. |
| **Thẻ nguy cơ 1** | `Tim Mạch 3 Năm (CVD)` | **Nguy cơ tim mạch 3 năm** | **3-Year Cardiovascular Risk** | Trực quan cho bệnh nhân; bác sĩ có thể dùng ký hiệu `(CVD)` trong tooltip giải thích. |
| **Thẻ nguy cơ 2** | `Võng Mạc ĐTĐ (DR)` | **Bệnh võng mạc đái tháo đường** | **Diabetic Retinopathy** | Tránh viết tắt "ĐTĐ", định danh chuẩn bệnh học theo Bộ Y tế. |
| **Thẻ nguy cơ 3** | `Thiên Đầu Thống (Glaucoma)` | **Tăng nhãn áp (Glaucoma)** | **Glaucoma Risk** | Bỏ từ cổ "Thiên đầu thống" gây lo lắng quá mức; dùng thuật ngữ chính quy "Tăng nhãn áp". |
| **Tiêu đề khối chỉ số** | `Thông Số Mạch Máu Chi Tiết (Dành Cho Bác Sĩ Tham Khảo)` | **Chỉ số vi mạch chuyên sâu** | **Detailed Microvascular Metrics** | Tinh gọn tiêu đề; đối tượng tham khảo được chuyển thành dòng phụ đề (caption). |

