# BIÊN BẢN THẨM ĐỊNH AN TOÀN Y KHOA VÀ DỮ LIỆU TOÀN DIỆN
## HỆ THỐNG SÀNG LỌC VI MẠCH VÕNG MẠC AURA (AURA CLINICAL RETINAL DECISION SUPPORT)
### Báo Cáo Rà Soát Độc Lập Toàn Bộ Mã Nguồn Frontend & Backend

---

- **Chuyên gia thẩm định**: Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập (Medical Safety Reviewer)
- **Quyền hạn**: Quyền Phủ Quyết Độc Lập (Independent Veto Power)
- **Ngày thẩm định**: 14/09/2026
- **Căn cứ pháp lý & Chuẩn mực Y tế**:
  - **FDA SaMD Guidance (2022)**: *Clinical Decision Support Software - Guidance for Industry and Food and Drug Administration Staff*.
  - **CE-MDR 2017/745**: *European Medical Device Regulation - Annex I General Safety and Performance Requirements*.
  - **Quy định Bộ Y tế Việt Nam**: *Nghị định 98/2021/NĐ-CP & Thông tư hướng dẫn quản lý trang thiết bị y tế kỹ thuật số / phần mềm hỗ trợ chẩn đoán*.
  - **AAO Clinical Guidance**: *American Academy of Ophthalmology Task Force on Artificial Intelligence in Ophthalmology*.
  - **Quy tắc An toàn Y khoa AURA**: `medical-safety.md`.
  - **Cổng Chất Lượng Y Khoa QG6**: *Medical Safety Quality Gate*.
- **Kết luận thẩm định**: **TỪ CHỐI PHÊ DUYỆT (REJECTED) — KÍCH HOẠT PHỦ QUYẾT LÂM SÀNG**
  *(Hệ thống bị từ chối do phát hiện 2 lỗi CRITICAL, 7 lỗi HIGH và các vi phạm giả mạo dữ liệu / lệch ngưỡng rủi ro nghiêm trọng. Bắt buộc khắc phục toàn bộ trước khi tái thẩm định).*

---

## 1. TỔNG QUAN KẾT QUẢ RÀ SOÁT

Đợt rà soát độc lập và toàn diện đã kiểm tra 100% các tệp tin liên quan đến tính toán chỉ số lâm sàng, luồng dữ liệu AI, hiển thị kết quả chẩn đoán, cảnh báo y tế và giao diện người dùng trên cả Frontend (React 18 / TypeScript) và Backend (Spring Boot 3 / Java 21).

### Thống Kê Sự Cố Theo Mức Độ Nghiêm Trọng:
- **CRITICAL (Nguy kịch)**: **2 lỗi** (Che giấu lỗi AI bằng số liệu giả lập; Tự ý gửi thông báo báo động bệnh nhân ở mức CRITICAL khi chưa có bác sĩ ký duyệt).
- **HIGH (Nghiêm trọng)**: **7 lỗi** (Tự ý chỉnh sửa/ghi đè điểm số lâm sàng; Bản đồ nhiệt Grad-CAM giả bằng CSS gradient; Thay thế ảnh DICOM thật bằng ảnh demo tĩnh; Tự động chẩn đoán Phù Hoàng Điểm; Chuỗi nhận định cố định gây Âm tính giả; Lệch ngưỡng rủi ro gây phân loại sai ca Moderate thành Low; Thiếu cảnh báo miễn trừ y tế trên các màn hình và tệp xuất CSV).
- **MEDIUM (Trung bình)**: **4 lỗi** (Lệch ngưỡng rủi ro Backend Bulk Worker; Sai lệch kiểu chuỗi RiskLevel Severe vs Critical; Vẽ ảnh đáy mắt hoạt họa giả lập bằng Canvas; Tệp dữ liệu giả tồn dư mockAiEngine.ts).
- **LOW (Thấp)**: **1 lỗi** (Tên mô hình hiển thị không chính xác trong giao diện chi tiết đợt khám).

---

## 2. BẢNG KIỂM TRA 6 TIÊU CHÍ AN TOÀN LÂM SÀNG (6-PILLAR CLINICAL SAFETY AUDIT)

| STT | Tiêu Chí An Toàn Lâm Sàng | Tiêu Chuẩn SaMD / Y Khoa Bắt Buộc | Hiện Trạng Trong Mã Nguồn AURA | Đánh Giá Lâm Sàng |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Không chẩn đoán xác định tự động (No Definitive Diagnosis)** | Tuyệt đối không đưa ra chẩn đoán xác định; kết quả AI chỉ mang tính chất định hướng nguy cơ sơ bộ. | **VI PHẠM**: `screeningMapper.ts` tự động gán `macularEdemaPresent = true` khi `drScore >= 50`; `ScreeningService.java` tự động thông báo nguy cơ CRITICAL tới bệnh nhân; `MedicalReportModal.tsx` tự động suy diễn chuỗi chẩn đoán khi thiếu dữ liệu đối chiếu. | **KHÔNG ĐẠT (FAIL)** |
| **2** | **Không kê đơn / can thiệp điều trị tự động (No Automated Prescriptions)** | Không tự ý chỉ định thuốc, liều dùng hoặc phác đồ can thiệp xâm lấn. | Đạt yêu cầu. Khuyến nghị chỉ tập trung vào thay đổi lối sống, kiểm soát huyết áp/đường huyết và mốc thời gian tái khám chuyên khoa. | **ĐẠT (PASS)** |
| **3** | **Bác sĩ ký duyệt bắt buộc (Mandatory Doctor Sign-Off)** | Mọi ca sàng lọc có nguy cơ bệnh lý (Moderate, High, Critical) phải có sự tham gia ký số của bác sĩ chuyên khoa. | Bác sĩ có quy trình ký số HMAC-SHA256 (`addDoctorReview`), nhưng hệ thống lại phát thông báo kết quả cảnh báo nguy cơ trực tiếp cho bệnh nhân trước khi bác sĩ kịp duyệt. | **CẢNH BÁO (WARNING)** |
| **4** | **Cảnh báo miễn trừ y tế bắt buộc (Medical Disclaimer Enforcement)** | Thông điệp miễn trừ chuẩn pháp lý phải xuất hiện ở 100% màn hình kết quả, bàn chẩn đoán CDS và báo cáo PDF/CSV. | **VI PHẠM**: Thiếu vắng cảnh báo tại `BatchItemDetailModal`, `DoctorDiagnosisModal`, `ClinicCampaignAnalytics`, `ClinicBatchProcessing`, `ClinicBatchWorkspace`, `DoctorWorklistView`, `PatientHistoryView` và file xuất CSV của phòng khám. | **KHÔNG ĐẠT (FAIL)** |
| **5** | **Bảo tồn toàn vẹn ảnh giải phẫu gốc (Raw Image Preservation)** | Ảnh chụp đáy mắt gốc phải được lưu trữ và hiển thị nguyên vẹn, không bị thay thế bằng ảnh demo. | **VI PHẠM**: `BatchUploadModal.tsx` tự ý tráo đổi file DICOM của bệnh nhân thành ảnh tĩnh `/assets/images/fundus_original.png`; nhiều modal fallback về ảnh tĩnh. | **KHÔNG ĐẠT (FAIL)** |
| **6** | **Kiểm soát rủi ro Âm tính giả (False Negative Prevention) & Cấm Fake AI** | Cấm dùng Mock AI để hoàn thành tính năng; cấm đưa ra kết luận bình thường khi thiếu dữ liệu hoặc ảnh kém. | **VI PHẠM ĐẶC BIỆT NGUY HIỂM**: `AiServiceClient.java` trả số liệu giả mạo (45/100, 30/100) khi AI lỗi; `ClinicalRiskSummaryCard` tự ý ghi đè điểm số và khẳng định "chưa phát hiện tổn thương" khi AI thiếu findings; `PatientPortalPage` đặt ngưỡng Moderate >= 45 bỏ sót điểm 40-44 thành Low. | **KHÔNG ĐẠT (FAIL)** |

---

## 3. DANH SÁCH CHI TIẾT CÁC LỖI TIỀM ẨN AN TOÀN Y KHOA & DỮ LIỆU

### NHÓM 1: MỨC ĐỘ NGUY KỊCH (CRITICAL SEVERITY)

#### 1. Lỗi che giấu sự cố AI bằng số liệu giả lập mặc định (Silent Mock Fallback Masking Pathology)
- **Tệp tin**: `backend/src/main/java/com/aura/bulk/service/AiServiceClient.java`
- **Dòng**: 77 - 99
- **Đoạn mã vi phạm**:
  ```java
  } catch (Exception ex) {
      log.warn("[AI Client] Cloud Gemini API inference exception: {}", ex.getMessage());
  }

  // Fallback default safe metric if API temporary timeout
  return new AiInferenceResultDto(
          UUID.randomUUID().toString(),
          System.currentTimeMillis() - startTime,
          45,
          45,
          "MODERATE",
          30,
          "LOW",
          18.0,
          0.62,
          16.8,
          1.15,
          0.35,
          null,
          0,
          List.of("Phân tích an toàn mặc định")
  );
  ```
- **Hệ quả y khoa**: Khi máy chủ AI gặp lỗi, mất mạng hoặc quá tải, hệ thống âm thầm nuốt lỗi và trả về một kết quả phân tích giả lập với các chỉ số cố định (điểm nguy cơ 45, nguy cơ DR 30 - mức Thấp, nguy cơ đột quỵ 18%, A/V 0.62). Worker nền (`BulkProcessingWorker.java`) nhận kết quả này sẽ ghi nhận ca khám là `COMPLETED` và lưu vào PostgreSQL. Nếu bệnh nhân thực tế đang trong cơn tăng huyết áp ác tính hoặc có xuất huyết võng mạc diện rộng (nguy cơ mù lòa/đột quỵ), tình trạng bệnh lý thật sẽ bị che giấu hoàn toàn bởi kết quả giả mạo.
- **Đề xuất khắc phục**: Tuyệt đối không fallback số liệu giả. Nếu gọi AI thất bại hoặc kết quả null, phải ném ngoại lệ `AiInferenceException` hoặc trả về DTO với trạng thái `FAILED`, để `BulkProcessingWorker` kích hoạt `syncItemAndBatchFailure`, đánh dấu tệp ảnh là `FAILED` kèm thông điệp rõ ràng: *"Lỗi kết nối AI - Ảnh đã lưu an toàn để thẩm định lại"*.

---

#### 2. Tự động gửi thông báo báo động nguy cơ CRITICAL cho bệnh nhân khi chưa có bác sĩ ký duyệt (Premature Panic-Inducing Notification)
- **Tệp tin**: `backend/src/main/java/com/aura/screening/service/ScreeningService.java`
- **Dòng**: 346 - 364
- **Đoạn mã vi phạm**:
  ```java
  if (saved.getStatus() == ScreeningStatus.ANALYZED) {
    String severity = saved.getRiskLevel() == RiskLevel.CRITICAL ? "CRITICAL"
        : (saved.getRiskLevel() == RiskLevel.HIGH ? "WARNING" : "SUCCESS");
    userNotificationService.sendNotificationToUser(
        patientId,
        "Kết quả phân tích AI đã sẵn sàng",
        "Ảnh võng mạc của bạn đã được phân tích. Mức độ nguy cơ vi mạch: " + saved.getRiskLevel()
            + (saved.getConfidence() != null ? " (Độ tin cậy: " + saved.getConfidence() + ")" : "") + ".",
        "AI_READY",
        severity,
        "/cds-viewer"
    );
  }
  ```
- **Hệ quả y khoa**: Vi phạm nghiêm trọng Mục 6 trong Quy chế An toàn Y khoa (*"Dừng & Báo cáo CEO khi phát hiện tính năng mới tự động thông báo cho bệnh nhân rằng họ 'đã bị bệnh' mà chưa có sự ký duyệt của bác sĩ"*). Khi AI phân tích sơ bộ xong (trạng thái `ANALYZED`), hệ thống gửi ngay notification có severity `CRITICAL` và công bố mức độ nguy kịch cho bệnh nhân. Điều này gây tâm lý hoảng loạn cực độ cho người bệnh khi chưa có sự tiếp xúc, tư vấn hay xác nhận chuyên môn từ bác sĩ.
- **Đề xuất khắc phục**: Thông báo `AI_READY` gửi cho người bệnh chỉ được mang tính chất trung tính thông báo tiến độ (ví dụ: *"Ảnh võng mạc của bạn đã hoàn tất phân tích sơ bộ và đang được chuyển đến bác sĩ chuyên khoa thẩm định lâm sàng"*), tuyệt đối không đính kèm nhãn `CRITICAL` hay kết luận nguy cơ cho đến khi bác sĩ thực hiện ký duyệt (`DOCTOR_REVIEW`).

---

### NHÓM 2: MỨC ĐỘ NGHIÊM TRỌNG (HIGH SEVERITY)

#### 3. Tự ý can thiệp, biến đổi và ghi đè điểm số nguy cơ lâm sàng của bệnh nhân (Clinical Data Tampering)
- **Tệp tin**: `frontend/src/components/ClinicalRiskSummaryCard.tsx`
- **Dòng**: 154 - 170
- **Đoạn mã vi phạm**:
  ```typescript
  // Chuẩn hóa điểm CVD để đồng bộ với mức rủi ro
  let rawCvdScore = analysisResult.cardiovascularRisk?.score ?? 0;
  if (analysisResult.cardiovascularRisk?.level === 'Low' && rawCvdScore >= 40) {
    rawCvdScore = 25;
  } else if (analysisResult.cardiovascularRisk?.level === 'Moderate' && (rawCvdScore < 40 || rawCvdScore >= 65)) {
    rawCvdScore = 48;
  }
  const cvdLevel = getComputedRiskLevel(rawCvdScore);

  // Chuẩn hóa điểm DR để đồng bộ với mức rủi ro
  let rawDrScore = analysisResult.diabeticRetinopathyRisk?.score ?? 0;
  if (analysisResult.diabeticRetinopathyRisk?.level === 'Low' && rawDrScore >= 40) {
    rawDrScore = 18;
  } else if (analysisResult.diabeticRetinopathyRisk?.level === 'Moderate' && (rawDrScore < 40 || rawDrScore >= 65)) {
    rawDrScore = 48;
  }
  const drLevel = getComputedRiskLevel(rawDrScore);
  ```
- **Hệ quả y khoa**: Component UI tự ý can thiệp làm sai lệch dữ liệu đo lường thật của bệnh nhân. Thay vì hiển thị đúng điểm số do AI tính toán hoặc cảnh báo sự không đồng nhất giữa điểm và mức, code ép buộc ghi đè điểm số thành các hằng số tùy tiện (`25`, `48`, `18`). Bác sĩ hoặc bệnh nhân khi xem thẻ tóm tắt sẽ nhìn thấy điểm số bị làm sai lệch.
- **Đề xuất khắc phục**: Giữ nguyên vẹn điểm số thực tế từ kết quả phân tích. Xóa bỏ hoàn toàn việc gán cứng `rawCvdScore = 25`, `48`, `18`. Nếu có sự không nhất quán giữa điểm số và nhãn nguy cơ, phải phân cấp theo điểm số chuẩn (`getComputedRiskLevel`) mà không được sửa giá trị điểm.

---

#### 4. Khẳng định sai sự thật "Chưa phát hiện tổn thương" khi thiếu dữ liệu (False Reassurance & False Negative Risk)
- **Tệp tin**: `frontend/src/components/ClinicalRiskSummaryCard.tsx`
- **Dòng**: 204 - 215
- **Đoạn mã vi phạm**:
  ```typescript
  const findingsItems = parseClinicalPoints(analysisResult.findings, [
    'Chưa phát hiện tổn thương vi phình mạch hoặc xuất huyết diện rộng.',
    'Cấu trúc vi tuần hoàn hoàng điểm và gai thị tương đối ổn định.',
  ]);
  ```
- **Hệ quả y khoa**: Nếu bản ghi phân tích từ backend bị thiếu trường `findings` (ví dụ do AI chưa kịp phân tích xong hoặc gặp lỗi bóc tách), component tự động hiển thị nhận định an ủi: *"Chưa phát hiện tổn thương vi phình mạch hoặc xuất huyết diện rộng"*. Nếu ca này thực tế là ca bệnh nặng nhưng bị mất chuỗi findings, bệnh nhân sẽ bị ru ngủ bởi thông tin sai lệch (False Negative), dẫn đến chủ quan không đi khám kịp thời.
- **Đề xuất khắc phục**: Khi `analysisResult.findings` rỗng hoặc null, phải hiển thị: *"Chưa có ghi nhận tổn thương chi tiết — Đang chờ bác sĩ chuyên khoa thẩm định"* thay vì tự tiện khẳng định không có tổn thương.

---

#### 5. Giả mạo bản đồ nhiệt Grad-CAM bằng CSS Radial Gradient (Deceptive Visual Heatmap)
- **Tệp tin**: 
  - `frontend/src/components/InteractiveCDSViewer.tsx` (Dòng 52-54, 290-305)
  - `frontend/src/features/patient/PatientScreeningResultView.tsx` (Dòng 27-29, 154-168)
- **Đoạn mã vi phạm**:
  ```tsx
  {isMockSampleHeatmap ? (
    <div
      className="absolute inset-0 m-auto max-h-[340px] w-full rounded-lg pointer-events-none cds-canvas-overlay mix-blend-screen transition-opacity duration-150"
      style={{
        opacity: heatmapOpacity,
        background:
          'radial-gradient(ellipse at 48% 52%, rgba(239, 68, 68, 0.85) 0%, rgba(245, 158, 11, 0.65) 30%, rgba(16, 185, 129, 0.35) 60%, transparent 80%)',
      }}
    >
      {/* Ẩn fallback image để test assertions vẫn tìm thấy tệp nếu cần */}
      <img src={heatmapImg} alt="AI Grad-CAM Heatmap" className="hidden" />
    </div>
  ) : ...
  ```
- **Hệ quả y khoa**: Khi không có dữ liệu bản đồ nhiệt Grad-CAM thật từ AI, hệ thống tự động vẽ một vệt gradient màu đỏ-cam-xanh cố định ở tọa độ (48%, 52%). Bác sĩ hoặc bệnh nhân lầm tưởng đây là vùng tổn thương mà AI đã chú ý, trong khi thực tế đó chỉ là một vòng tròn CSS nhân tạo. Thậm chí đoạn chú thích còn ghi rõ: *"Ẩn fallback image để test assertions vẫn tìm thấy tệp nếu cần"*, chứng tỏ đây là mã giả nhằm đối phó kiểm thử.
- **Đề xuất khắc phục**: Xóa bỏ hoàn toàn lớp phủ CSS fake gradient. Nếu không có heatmap URL từ AI, hiển thị thông báo rõ ràng: *"Chưa có bản đồ nhiệt Grad-CAM cho ảnh này"* và hiển thị ảnh gốc trong trẻo để bác sĩ quan sát.

---

#### 6. Tự động chẩn đoán xác định Phù Hoàng Điểm (Macular Edema) bằng biểu thức gán cứng
- **Tệp tin**: `frontend/src/services/screeningMapper.ts`
- **Dòng**: 105
- **Đoạn mã vi phạm**:
  ```typescript
  diabeticRetinopathyRisk: {
    level: toFrontendRiskLevel(screening.diabeticRetinopathyRiskLevel),
    score: drScore,
    etdrsGrade: screening.etdrsGrade || 'Theo phân tích AURA AI',
    macularEdemaPresent: drScore >= 50,
  },
  ```
- **Hệ quả y khoa**: Phù hoàng điểm đái tháo đường (DME) là một bệnh cảnh lâm sàng độc lập, đòi hỏi đánh giá sự dày lên của võng mạc và xuất tiết cứng tại hoàng điểm (thường xác định qua OCT hoặc soi đáy mắt chuyên sâu). Việc tự ý kết luận `macularEdemaPresent = true` chỉ vì điểm bệnh võng mạc đái tháo đường tổng thể `>= 50` là chẩn đoán xác định tự động sai về mặt chuyên môn y khoa.
- **Đề xuất khắc phục**: Lấy giá trị `macularEdemaPresent` trực tiếp từ trường phân tích cụ thể của AI (`screening.macularEdemaPresent`) hoặc ghi chú là `Chưa xác định (Cần thăm khám chuyên sâu)` nếu không có dữ liệu chẩn đoán phân biệt.

---

#### 7. Tráo đổi tệp ảnh DICOM thật của bệnh nhân thành ảnh mẫu tĩnh (Loss of Raw Medical Imaging Integrity)
- **Tệp tin**: `frontend/src/components/BatchUploadModal.tsx`
- **Dòng**: 193 - 198
- **Đoạn mã vi phạm**:
  ```typescript
  const createThumbnailBase64 = (file: File, maxDim: number = 160): Promise<string> => {
    return new Promise((resolve) => {
      const isDicom = /\.dcm|\.dicom|\.tif|\.tiff/i.test(file.name);
      if (isDicom) {
        resolve('/assets/images/fundus_original.png');
        return;
      }
  ```
- **Hệ quả y khoa**: Khi người dùng tải lên tệp ảnh chuẩn y tế DICOM (`.dcm`, `.dicom`) hoặc TIFF, hệ thống tự ý thay thế hình ảnh thu nhỏ xem trước của bệnh nhân bằng tệp ảnh PNG demo có sẵn `/assets/images/fundus_original.png`. Bác sĩ hoặc điều dưỡng khi kiểm tra danh sách tải lên sẽ nhìn thấy ảnh của người khác thay vì ảnh thực tế của bệnh nhân đang sàng lọc.
- **Đề xuất khắc phục**: Đối với tệp DICOM/TIFF chưa giải mã được thumbnail phía client, phải hiển thị một biểu tượng định dạng (DICOM Badge Icon) hoặc nhãn placeholder trung tính, tuyệt đối không được tráo bằng ảnh võng mạc của ca mẫu khác.

---

#### 8. Lệch ngưỡng rủi ro tại PatientPortalPage gây nguy cơ Âm tính giả (False Negative Risk)
- **Tệp tin**: `frontend/src/pages/PatientPortalPage.tsx`
- **Dòng**: 216 - 217
- **Đoạn mã vi phạm**:
  ```typescript
  const computedLevel =
    score >= 80 ? "Critical" : score >= 65 ? "High" : score >= 45 ? "Moderate" : "Low";
  ```
- **Hệ quả y khoa**: Quy chuẩn phân tầng rủi ro y tế của AURA là: Low (<40), Moderate (40-64), High (65-79), Critical (>=80). Tại `PatientPortalPage`, ngưỡng Moderate bị nâng lên `>= 45`. Những bệnh nhân có điểm nguy cơ từ **40 đến 44** (đáng lẽ phải thuộc nhóm Nguy cơ trung bình, cần theo dõi định kỳ) lại bị hệ thống kết luận là **"Low" (Nguy cơ thấp / Bình thường)**. Đây là lỗi bỏ sót bệnh lý (False Negative) trực tiếp.
- **Đề xuất khắc phục**: Sửa ngay biểu thức thành: `score >= 80 ? "Critical" : score >= 65 ? "High" : score >= 40 ? "Moderate" : "Low"`.

---

#### 9. Xuất khẩu dữ liệu lâm sàng CSV thiếu Tuyên bố Miễn trừ Trách nhiệm Y tế
- **Tệp tin**: `backend/src/main/java/com/aura/clinic/service/ClinicAnalyticsService.java`
- **Dòng**: 58 - 82
- **Đoạn mã vi phạm**:
  ```java
  public String generateExportDataCsv(UUID clinicId) {
      if (clinicId == null) {
          return "Screening ID,Patient ID,Eye Position,Scan Type,Risk Level,Risk Score,Status,Created At\n";
      }
      ...
      StringBuilder sb = new StringBuilder();
      sb.append("Screening ID,Patient ID,Eye Position,Scan Type,Risk Level,Risk Score,Status,Created At\n");
  ```
- **Hệ quả y khoa**: Tệp CSV trích xuất kết quả sàng lọc của phòng khám được phát hành trực tiếp mà không có dòng Tuyên bố Miễn trừ Y tế bắt buộc ở dòng đầu tiên. Bất kỳ ai mở tệp dữ liệu này đều có thể sử dụng các chỉ số mà không nhận biết được ranh giới phần mềm hỗ trợ sàng lọc sơ bộ (CDS), vi phạm quy chuẩn pháp lý SaMD và Tiêu chí số 4 trong Cổng An toàn Y khoa.
- **Đề xuất khắc phục**: Thêm dòng cảnh báo vào đầu tệp CSV trước dòng tiêu đề cột:
  `sb.append("# TUYEN BO MIEN TRU Y TE: Ket qua phan tich chi nham muc dich ho tro sang loc va khong thay the chan doan cua bac si chuyen khoa.\n");`

---

### NHÓM 3: MỨC ĐỘ TRUNG BÌNH (MEDIUM SEVERITY)

#### 10. Tạo sinh tổn thương giả mạo (Fake ROI Anomalies) và Heatmap ngẫu nhiên theo mã MRN
- **Tệp tin**: `frontend/src/components/BatchItemDetailModal.tsx`
- **Dòng**: 43 - 135 (Hàm `generateIndividualizedHeatmap`), 189 - 236 (Mảng `anomalies`)
- **Đoạn mã vi phạm**:
  ```typescript
  // Seed giả lập ổn định theo hồ sơ MRN
  let seed = 0;
  for (let i = 0; i < mrn.length; i++) {
    seed = (seed * 31 + mrn.charCodeAt(i)) % 10000;
  }
  ...
  const anomalies: AnomalyItem[] = overallRisk < 40 ? [] : [
    {
      id: 'ANO-MA',
      type: 'Microaneurysm (MA)',
      label: 'Vi Phình Mạch (MA)',
      svgX: isOD ? 195 : 270,
      svgY: 240,
      confidence: 0.94,
      description: 'Dãn nở khu trú mao mạch võng mạc trong bán kính 1.2mm quanh hoàng điểm (FAZ).',
    }, ...
  ```
- **Hệ quả y khoa**: Modal chi tiết đợt khám tự ý vẽ tổn thương vi phình mạch, xuất huyết và Gunn sign giả lập với độ tin cậy gán cứng 94%, 89%, 91% vào các vị trí cố định trên ảnh võng mạc của bệnh nhân khi điểm nguy cơ >= 40. Đồng thời tự băm chuỗi MRN thành seed để vẽ bản đồ nhiệt Canvas giả.
- **Đề xuất khắc phục**: Chỉ hiển thị vùng tổn thương ROI khi có dữ liệu thật từ mảng `detectedAnomalies` do AI Vision trả về. Nếu không có, hiển thị mảng rỗng `[]` và thông báo *"Không có tổn thương vi mạch khu trú được phát hiện"*.

---

#### 11. Không nhất quán ngưỡng phân tầng nguy cơ giữa Bulk Worker và Core Engine
- **Tệp tin**:
  - `backend/src/main/java/com/aura/bulk/worker/BulkProcessingWorker.java` (Dòng 190-198)
  - `backend/src/main/java/com/aura/bulk/queue/BatchJobQueue.java` (Dòng 179-187, 245-253)
- **Đoạn mã vi phạm**:
  ```java
  if (score >= 85 || "Critical".equalsIgnoreCase(level) || "Severe".equalsIgnoreCase(level)) {
      return "CRITICAL";
  } else if (score >= 70 || "High".equalsIgnoreCase(level)) {
      return "HIGH";
  } else if (score >= 40 || "Moderate".equalsIgnoreCase(level)) {
      return "MODERATE";
  ```
- **Hệ quả y khoa**: Trong khi `ScreeningService.java` và AI Engine quy định Critical là `>= 80` và High là `>= 65`, thì `BulkProcessingWorker` và `BatchJobQueue` lại đặt Critical là `>= 85` và High là `>= 70`. Điều này dẫn đến tình trạng cùng một bức ảnh có điểm 82: nếu sàng lọc cá nhân qua `ScreeningService` thì xếp loại `CRITICAL`, nhưng nếu sàng lọc hàng loạt qua phòng khám thì chỉ được xếp loại `HIGH`.
- **Đề xuất khắc phục**: Đồng bộ hóa toàn bộ ngưỡng trong `BulkProcessingWorker` và `BatchJobQueue` về đúng chuẩn: Critical `>= 80`, High `>= 65`, Moderate `>= 40`, Low `< 40`.

---

#### 12. Sai lệch kiểu dữ liệu phân loại nguy cơ (`Severe` vs `Critical`)
- **Tệp tin**:
  - `frontend/src/types/cds.ts` (Dòng 3: `export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe';`)
  - `frontend/src/components/DoctorDiagnosisModal.tsx` (Dòng 11: `{ value: 'Severe', label: 'Severe — Nghiêm Trọng', riskLevel: 'critical' }`)
- **Hệ quả y khoa**: Backend enum chuẩn là `RiskLevel { LOW, MODERATE, HIGH, CRITICAL }`. Frontend định nghĩa kiểu `Severe` làm phát sinh lỗi chuyển đổi dữ liệu và gây nhầm lẫn thuật ngữ lâm sàng quốc tế giữa mức High và Critical.
- **Đề xuất khắc phục**: Chuẩn hóa kiểu dữ liệu frontend sang `Critical` đồng nhất với backend enum.

---

#### 13. Tồn dư tệp mã giả đồ sộ `frontend/src/services/mockAiEngine.ts`
- **Tệp tin**: `frontend/src/services/mockAiEngine.ts` (Toàn bộ 726 dòng)
- **Nội dung**: Chứa danh sách hồ sơ bệnh nhân giả lập (`MOCK_PATIENTS`), các chỉ số sinh hiệu và nhận định gán cứng ("Gunn sign", "tăng huyết áp 154", "vi phình mạch rải rác", "co thắt tiểu động mạch cấp tính", v.v.).
- **Hệ quả y khoa**: Dù không được import vào luồng chạy chính của giao diện, tệp này vẫn tồn tại trong thư mục `services/`, tiềm ẩn nguy cơ vô tình bị import tái kích hoạt mã giả trong các bản cập nhật tiếp theo.
- **Đề xuất khắc phục**: Xóa bỏ hoàn toàn tệp này hoặc chuyển dời vào thư mục kiểm thử `frontend/src/tests/fixtures/mockAiEngine.ts` phục vụ unit test độc lập.

---

### NHÓM 4: THIẾU CẢNH BÁO MIỄN TRỪ TRÁCH NHIỆM Y TẾ TRÊN CÁC GIAO DIỆN

Theo Quy chuẩn SaMD và Cổng An toàn Y khoa QG6, mọi giao diện hiển thị dữ liệu đo lường, kết quả phân tích hoặc bàn làm việc lâm sàng đều bắt buộc phải có thông điệp miễn trừ y tế:
> *"Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch."*

Rà soát phát hiện các component và trang sau hoàn toàn thiếu component `<MedicalDisclaimer />`:
1. `frontend/src/components/BatchItemDetailModal.tsx`
2. `frontend/src/components/DoctorDiagnosisModal.tsx`
3. `frontend/src/components/ClinicCampaignAnalytics.tsx`
4. `frontend/src/components/ClinicBatchProcessing.tsx`
5. `frontend/src/features/clinic/ClinicBatchWorkspace.tsx`
6. `frontend/src/features/doctor/DoctorWorklistView.tsx`
7. `frontend/src/features/patient/PatientHistoryView.tsx`
8. `frontend/src/pages/DoctorPatientListPage.tsx`
9. `frontend/src/pages/ClinicPortalPage.tsx`
10. `frontend/src/pages/PatientPortalPage.tsx` (thiếu ở cấp độ khung nhìn tổng quát)

---

## 4. BẢNG TỔNG HỢP VỊ TRÍ VI PHẠM & ĐỀ XUẤT SỬA ĐỔI CHI TIẾT

| STT | Tệp tin (File Path) | Dòng (Lines) | Mức Độ | Mô Tả Vi Phạm | Đề Xuất Khắc Phục Cụ Thể |
| :---: | :--- | :---: | :---: | :--- | :--- |
| 1 | `backend/.../bulk/service/AiServiceClient.java` | 81-99 | **CRITICAL** | Nuốt lỗi AI và trả về kết quả số liệu giả lập (45/100, DR 30). | Ném `AiInferenceException` hoặc trả trạng thái FAILED để đánh dấu ca khám FAILED, không ghi điểm giả vào DB. |
| 2 | `backend/.../screening/service/ScreeningService.java` | 348-360 | **CRITICAL** | Tự động push notification cảnh báo CRITICAL/WARNING cho bệnh nhân trước khi bác sĩ duyệt. | Chỉ gửi thông báo trung tính "Đã có kết quả sơ bộ và đang chuyển bác sĩ duyệt", ẩn nhãn CRITICAL. |
| 3 | `frontend/.../components/ClinicalRiskSummaryCard.tsx` | 154-170 | **HIGH** | Tự ý ghi đè điểm số lâm sàng thành 25, 48, 18. | Xóa logic ép điểm; giữ nguyên giá trị thực từ AI / Bác sĩ. |
| 4 | `frontend/.../components/ClinicalRiskSummaryCard.tsx` | 204-215 | **HIGH** | Tự động báo "Chưa phát hiện tổn thương" khi thiếu findings (False Negative). | Thay bằng: "Đang chờ bác sĩ thẩm định ghi chú lâm sàng". |
| 5 | `frontend/.../components/InteractiveCDSViewer.tsx` | 290-305 | **HIGH** | Vẽ bản đồ nhiệt Grad-CAM giả bằng CSS radial gradient (48%, 52%). | Xóa gradient CSS fake; nếu thiếu heatmap thì hiển thị thông báo "Chưa có bản đồ nhiệt". |
| 6 | `frontend/.../features/patient/PatientScreeningResultView.tsx` | 154-168 | **HIGH** | Lặp lại mã giả Grad-CAM bằng CSS radial gradient. | Đồng bộ hóa: Xóa CSS gradient fake, hiển thị ảnh gốc trong suốt. |
| 7 | `frontend/.../services/screeningMapper.ts` | 105 | **HIGH** | Tự ý kết luận `macularEdemaPresent = drScore >= 50`. | Lấy từ `screening.macularEdemaPresent` hoặc để `false / Chưa xác định`. |
| 8 | `frontend/.../components/BatchUploadModal.tsx` | 196 | **HIGH** | Tráo file DICOM của bệnh nhân thành ảnh demo `/assets/images/fundus_original.png`. | Dùng icon định dạng DICOM placeholder, không tráo ảnh thật của người bệnh. |
| 9 | `frontend/.../pages/PatientPortalPage.tsx` | 217 | **HIGH** | Ngưỡng Moderate `>= 45` khiến điểm 40-44 bị phân loại nhầm thành Low (False Negative). | Sửa điều kiện thành: `score >= 40 ? "Moderate" : "Low"`. |
| 10 | `backend/.../clinic/service/ClinicAnalyticsService.java` | 68 | **HIGH** | Tệp CSV xuất khẩu không có dòng tuyên bố miễn trừ y tế. | Thêm dòng `# TUYEN BO MIEN TRU Y TE: ...` vào dòng 1 của chuỗi CSV xuất ra. |
| 11 | `frontend/.../components/BatchItemDetailModal.tsx` | 43-135, 189-236 | **HIGH** | Sinh tổn thương giả (MA, Gunn sign) và sinh heatmap bằng Canvas hash MRN. | Xóa hàm sinh tổn thương giả; chỉ render khi có `detectedAnomalies` thật. |
| 12 | `frontend/.../components/ClinicBatchProcessing.tsx` | 1395-1396 | **HIGH** | Fallback chỉ số bệnh lý giả `A/V: 0.52` và `DR: 45%` khi thiếu dữ liệu. | Hiển thị `—` hoặc `Chưa có` thay vì tự điền số đo bệnh lý. |
| 13 | `backend/.../bulk/worker/BulkProcessingWorker.java` | 190-198 | **MEDIUM** | Lệch ngưỡng Critical (`>= 85`), High (`>= 70`). | Chuẩn hóa về: Critical `>= 80`, High `>= 65`, Moderate `>= 40`. |
| 14 | `backend/.../bulk/queue/BatchJobQueue.java` | 179-187, 245-253 | **MEDIUM** | Lệch ngưỡng Critical (`>= 85`), High (`>= 70`). | Chuẩn hóa về: Critical `>= 80`, High `>= 65`, Moderate `>= 40`. |
| 15 | `frontend/.../types/cds.ts` | 3 | **MEDIUM** | Dùng kiểu `Severe` thay vì `Critical`. | Đổi kiểu dữ liệu sang `Critical` đồng bộ với PostgreSQL & Java Enum. |
| 16 | `frontend/.../components/DoctorDiagnosisModal.tsx` | 11 | **MEDIUM** | Lựa chọn mức nguy cơ là `Severe` thay vì `Critical`. | Đổi giá trị option sang `Critical`. |
| 17 | `frontend/.../components/PatientUploader.tsx` | 157-244 | **MEDIUM** | Vẽ ảnh đáy mắt hoạt họa giả lập bằng HTML5 Canvas. | Gắn nhãn mờ (Watermark) "ẢNH MẪU TEST" nếu người dùng chọn nạp ảnh mẫu. |
| 18 | `frontend/.../services/mockAiEngine.ts` | 1-726 | **MEDIUM** | Tồn dư 726 dòng mock data với các chuỗi bệnh lý gán cứng. | Xóa hoặc chuyển vào `tests/fixtures/`. |
| 19 | 10 tệp giao diện & modal lâm sàng | N/A | **HIGH** | Thiếu component cảnh báo miễn trừ y tế `<MedicalDisclaimer />`. | Nhúng `<MedicalDisclaimer variant="compact" />` vào 10 vị trí đã liệt kê. |

---

## 5. KẾT LUẬN THẨM ĐỊNH AN TOÀN Y KHOA

Căn cứ quyền hạn phủ quyết lâm sàng độc lập (Clinical Veto Power) và đối chiếu toàn diện với các quy định an toàn phần mềm y tế (SaMD), Chuyên Gia Thẩm Định An Toàn Y Khoa đưa ra kết luận chính thức:

### **KẾT QUẢ: TỪ CHỐI PHÊ DUYỆT (REJECTED)**

### **Lý do từ chối chính**:
1. Tồn tại cơ chế nuốt lỗi và tự ý tạo dữ liệu lâm sàng giả mạo (`AiServiceClient.java`, `BatchItemDetailModal.tsx`, `InteractiveCDSViewer.tsx`), vi phạm đạo đức y sinh và quy tắc cấm dữ liệu giả trong môi trường y tế.
2. Vi phạm Điều kiện Dừng Khẩn cấp của Dự án: Tự động gửi thông báo trực tiếp cho bệnh nhân với mức độ nguy cơ `CRITICAL` khi chưa có chữ ký số xác nhận của bác sĩ chuyên khoa.
3. Nguy cơ Âm tính giả (False Negative): Ngưỡng đánh giá tại `PatientPortalPage` làm lọt các ca nguy cơ 40-44 điểm thành Bình thường, và `ClinicalRiskSummaryCard` tự ý cam đoan "không có tổn thương" khi hệ thống bị mất chuỗi kết quả.
4. Thiếu hụt Tuyên bố Miễn trừ Y tế bắt buộc trên hàng loạt màn hình lâm sàng và tệp dữ liệu CSV xuất khẩu.

### **Yêu cầu đối với Đội ngũ Kỹ thuật & Code Reviewer**:
- Đội ngũ kỹ sư cần tiến hành sửa đổi triệt để toàn bộ 19 điểm vi phạm theo đúng danh mục đề xuất ở Mục 4.
- Sau khi hoàn thành các sửa đổi, yêu cầu kích hoạt lại quy trình kiểm thử Cổng Chất lượng QG6 để Chuyên Gia An Toàn Y Khoa tiến hành tái thẩm định.

---
**Chuyên Gia Thẩm Định An Toàn Y Khoa Độc Lập AURA**  
*(Medical Safety Reviewer — Sign-off Veto Recorded)*
