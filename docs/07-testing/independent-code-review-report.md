# BIÊN BẢN ĐÁNH GIÁ MÃ NGUỒN ĐỘC LẬP AURA (INDEPENDENT CODE REVIEW REPORT)

**Người thực hiện**: Chuyên Viên Đánh Giá Mã Nguồn (Code Reviewer) độc lập  
**Ngày đánh giá**: 13/09/2026  
**Nhánh Git**: `Dinh` (So sánh với `origin/Dinh` và kiểm tra toàn diện Working Tree Diff)  
**Phạm vi rà soát**: Toàn bộ thay đổi mã nguồn trong backend, frontend, cấu hình và kịch bản kiểm thử.

---

## 1. Tóm Tắt (Summary)
Đợt thay đổi mã nguồn hiện tại đã hoàn thiện nhiều cải tiến quan trọng về an ninh và nghiệp vụ lâm sàng: loại bỏ wildcard CORS, bổ sung kiểm soát chống IDOR nghiêm ngặt cho bác sĩ và bệnh nhân, tách cuộc gọi AI ngoại vi ra ngoài transaction cơ sở dữ liệu để tránh chiếm dụng Connection Pool, động hóa báo cáo lâm sàng và tích hợp đầy đủ các phân hệ bác sĩ (FR-15, FR-16, FR-20, FR-21, FR-28, FR-34, FR-37). Tuy nhiên, quá trình rà soát độc lập phát hiện 01 lỗi mức **CRITICAL** trong logic thanh toán khi tự động cấp lượt quét thành công ngay cả khi API gặp lỗi ngoại lệ, cùng 02 lỗi mức **WARNING** liên quan đến việc sao chép nhầm tham số đánh giá lâm sàng giữa hai mắt (OD/OS) trong tệp CSV và nguy cơ CSV Injection khi xuất Audit Logs. Do đó, mã nguồn cần được khắc phục trước khi chuyển giao cho CEO nghiệm thu chính thức.

---

## 2. Bảng Các Vấn Đề Tìm Thấy (Issues Found)

| Mức Độ | Tệp Tin:Dòng | Mô Tả Ngắn Gọn |
|---|---|---|
| `CRITICAL` | `frontend/src/components/CreditPurchaseModal.tsx:162-167` | Khối `catch` thanh toán tự động cấp lượt quét và chuyển trạng thái `SUCCESS` khi API ném ngoại lệ (Mock Fallback vi phạm an toàn tài chính). |
| `WARNING` | `frontend/src/components/MedicalReportModal.tsx:111-114` | Xuất CSV báo cáo 2 mắt (OD/OS) sử dụng nhầm dữ liệu `odData` cho cả phần đánh giá lâm sàng mắt trái `OS`. |
| `WARNING` | `frontend/src/pages/AdminAuditLogsPage.tsx:842-845` | Xuất CSV Audit Logs ghép chuỗi trực tiếp, thiếu cơ chế khử công thức độc hại (CSV Injection) và thiếu xử lý escape ký tự đặc biệt. |
| `SUGGESTION` | `backend/src/main/java/com/aura/screening/service/ScreeningService.java:85-88` | Gọi nội bộ phương thức `@Transactional saveScreeningRecord` bỏ qua proxy Spring AOP. |
| `SUGGESTION` | `frontend/src/components/CreditPurchaseModal.tsx:82-127` & `frontend/src/components/ClinicCreditPackageSection.tsx:91-146` | Trùng lặp định nghĩa danh mục gói dịch vụ mặc định của phòng khám (`defaultClinicPackages`). |
| `SUGGESTION` | `frontend/src/features/doctor/DoctorRiskAnalyticsView.tsx:13,14,16,21,23` | Import thừa các biểu tượng và thành phần (`SlidersHorizontal`, `Info`, `HeartPulse`, `Button`, `PatientProfile`) không sử dụng. |
| `SUGGESTION` | `frontend/src/features/doctor/DoctorReportsView.tsx:12,13,15,19,20` | Import thừa các thành phần (`SlidersHorizontal`, `Key`, `AlertCircle`, `Button`, `Modal`) không sử dụng. |
| `SUGGESTION` | `frontend/src/features/doctor/DoctorConsultationView.tsx:9,10,12,14` | Import thừa các biểu tượng (`Eye`, `CheckCircle2`, `ShieldCheck`, `Activity`) không sử dụng. |
| `SUGGESTION` | `frontend/src/components/ClinicCreditPackageSection.tsx:20,24,25,29` | Import thừa các biểu tượng và thành phần (`Receipt`, `Sparkles`, `Download`, `LoadingState`) không sử dụng. |

---

## 3. Chi Tiết Từng Vấn Đề (Detailed Findings)

### 3.1. [CRITICAL] Khối catch thanh toán tự động gán SUCCESS và cấp lượt quét miễn phí khi có lỗi
- **File**: `frontend/src/components/CreditPurchaseModal.tsx:162-167`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề (Problem)**:
  Trong hàm `handleConfirmPurchase`, khi gọi `billingApi.purchase(selectedPackage.id, paymentMethod)`:
  ```typescript
  } catch (e: any) {
    // Fallback update state for demo/sandbox environments
    setIsProcessing(false);
    setPaymentStep('SUCCESS');
    onPurchaseSuccess?.(activeCredits + selectedPackage.scansCount);
    onSuccess?.(selectedPackage.scansCount);
  }
  ```
  Nếu API backend trả về lỗi HTTP 400, 401, 403, 500 hoặc rớt mạng kết nối cổng thanh toán, khối `catch` bắt ngoại lệ này và tự động coi như giao dịch đã thanh toán thành công, đồng thời cộng thẳng `selectedPackage.scansCount` vào tài khoản người dùng (`onPurchaseSuccess`).
  Điều này cho phép người dùng chiếm đoạt lượt quét AI miễn phí bằng cách ngắt kết nối mạng hoặc gửi request lỗi. Hành vi này vi phạm quy tắc an toàn bảo mật tài chính và vi phạm lệnh cấm sử dụng mã giả (mock/fake fallback) trong môi trường sản phẩm.
- **Đề xuất khắc phục (Suggestion)**:
  Xóa bỏ việc gán trạng thái `SUCCESS` và không gọi `onPurchaseSuccess` trong khối `catch`. Phải hiển thị thông báo lỗi cụ thể cho người dùng:
  ```typescript
  } catch (e: any) {
    setIsProcessing(false);
    setPurchaseError(e.message || 'Không thể thực hiện giao dịch thanh toán. Vui lòng kiểm tra lại kết nối hoặc phương thức thanh toán.');
  }
  ```

---

### 3.2. [WARNING] Đánh giá lâm sàng mắt trái (OS) bị sao chép nhầm từ mắt phải (OD) trong tệp CSV
- **File**: `frontend/src/components/MedicalReportModal.tsx:111-114`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề (Problem)**:
  Trong hàm xuất tệp `handleExportCsv` đối với trường hợp khám cả hai mắt (`hasDualData`):
  ```typescript
  ['Ty le A/V Ratio', odData.annotatedMap.arteryVeinRatio.toString(), osData.annotatedMap.arteryVeinRatio.toString(), '>= 0.67', `OD: ${evaluateAvRatio(odData.annotatedMap.arteryVeinRatio).text} | OS: ${evaluateAvRatio(odData.annotatedMap.arteryVeinRatio).text}`],
  ['Mat do vi mach (Vessel Density)', `${odData.annotatedMap.vesselDensityPercentage}%`, `${osData.annotatedMap.vesselDensityPercentage}%`, '15.5% - 19.0%', `OD: ${evaluateVesselDensity(odData.annotatedMap.vesselDensityPercentage).text} | OS: ${evaluateVesselDensity(odData.annotatedMap.vesselDensityPercentage).text}`],
  ['Do uon luon (Tortuosity)', odData.annotatedMap.tortuosityIndex.toString(), osData.annotatedMap.tortuosityIndex.toString(), '< 1.25', `OD: ${evaluateTortuosity(odData.annotatedMap.tortuosityIndex).text} | OS: ${evaluateTortuosity(odData.annotatedMap.tortuosityIndex).text}`],
  ['Ty le Cup/Disc (CDR)', odData.annotatedMap.opticCupToDiscRatio.toString(), osData.annotatedMap.opticCupToDiscRatio.toString(), '< 0.50', `OD: ${evaluateVcdr(odData.annotatedMap.opticCupToDiscRatio).text} | OS: ${evaluateVcdr(odData.annotatedMap.opticCupToDiscRatio).text}`],
  ```
  Phần text đánh giá lâm sàng cho `OS` lại truyền vào số đo của `odData.annotatedMap.*` thay vì `osData.annotatedMap.*`.
  Hậu quả: Khi bác sĩ hoặc bệnh nhân xuất báo cáo CSV, kết luận vi mạch của mắt trái bị hiển thị sai theo mắt phải (ví dụ: mắt phải hẹp nặng nhưng mắt trái bình thường, file CSV lại ghi cả hai mắt đều hẹp nặng). Đây là lỗi nghiệp vụ y khoa trong phiếu báo cáo kết quả.
- **Đề xuất khắc phục (Suggestion)**:
  Chỉnh sửa tham số hàm đánh giá phía `OS` thành `osData.annotatedMap`:
  ```typescript
  `OD: ${evaluateAvRatio(odData.annotatedMap.arteryVeinRatio).text} | OS: ${evaluateAvRatio(osData.annotatedMap.arteryVeinRatio).text}`
  `OD: ${evaluateVesselDensity(odData.annotatedMap.vesselDensityPercentage).text} | OS: ${evaluateVesselDensity(osData.annotatedMap.vesselDensityPercentage).text}`
  `OD: ${evaluateTortuosity(odData.annotatedMap.tortuosityIndex).text} | OS: ${evaluateTortuosity(osData.annotatedMap.tortuosityIndex).text}`
  `OD: ${evaluateVcdr(odData.annotatedMap.opticCupToDiscRatio).text} | OS: ${evaluateVcdr(osData.annotatedMap.opticCupToDiscRatio).text}`
  ```

---

### 3.3. [WARNING] Nguy cơ CSV Injection và lỗi định dạng khi xuất Audit Logs
- **File**: `frontend/src/pages/AdminAuditLogsPage.tsx:842-845`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề (Problem)**:
  Hàm `handleExportLogs` xuất nhật ký kiểm toán sang CSV qua chuỗi data URI:
  ```typescript
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [
      "Mã Log,Thời Gian,Mức Độ,Hành Động,Tài Nguyên,Người Thực Hiện,IP,Trạng Thái",
      ...exportData.map(
        (l: any) =>
          `"${l.id}","${l.timestamp || l.createdAt || ""}","${l.severity || "INFO"}","${l.action || l.title || ""}","${l.resource || l.resourceType || l.details || ""}","${l.actor || l.userEmail || l.user || "Hệ thống"}","${l.ipAddress || l.ip || ""}","${l.status || "SUCCESS"}"`,
      ),
    ].join("\n");
  const encodedUri = encodeURI(csvContent);
  ```
  1. Thiếu hàm vệ sinh ô (Cell Sanitization): Kẻ tấn công có thể đặt tên tài khoản hoặc action chứa các ký tự bắt đầu công thức bảng tính (`=`, `+`, `-`, `@`) để kích hoạt CSV Formula Injection khi Admin mở tệp trên Excel.
  2. Thiếu escape dấu ngoặc kép: Nếu trường `resource` hoặc `action` có chứa ký tự `"`, tệp CSV sẽ bị vỡ cột.
  3. Dùng `data:text/csv` và `encodeURI` thay vì `Blob` + Byte Order Mark (BOM `\uFEFF`) sẽ gây lỗi font chữ tiếng Việt có dấu khi mở bằng Microsoft Excel trên Windows.
- **Đề xuất khắc phục (Suggestion)**:
  Áp dụng chuẩn `sanitizeCsvCell` và xuất qua `Blob` UTF-8 có BOM giống như đã triển khai chuẩn mực trong `MedicalReportModal.tsx`.

---

### 3.4. [SUGGESTION] Gọi nội bộ phương thức @Transactional trong ScreeningService
- **File**: `backend/src/main/java/com/aura/screening/service/ScreeningService.java:85-88`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề (Problem)**:
  Phương thức `saveScreeningRecord` được gán `@Transactional`, nhưng lại được gọi nội bộ qua `this.saveScreeningRecord(screening)` từ `createScreening`. Do Spring AOP sử dụng CGLIB proxy bọc quanh bean, các lời gọi nội bộ (self-invocation) không đi qua proxy nên annotation `@Transactional` trên phương thức này không có hiệu lực bổ sung. Rất may mắn là `screeningRepository.save(screening)` bên trong đã có sẵn `@Transactional` từ Spring Data JPA, nên dữ liệu vẫn được ghi an toàn.
- **Đề xuất khắc phục (Suggestion)**:
  Để code tường minh và tránh nhầm lẫn về kiến trúc, nên bỏ `@Transactional` trên `saveScreeningRecord` hoặc sử dụng `TransactionTemplate` nếu muốn quản lý ranh giới giao dịch rõ ràng.

---

### 3.5. [SUGGESTION] Trùng lặp cấu hình các gói dịch vụ cơ sở
- **File**: `frontend/src/components/CreditPurchaseModal.tsx` & `frontend/src/components/ClinicCreditPackageSection.tsx`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề (Problem)**:
  Cả 2 file đều định nghĩa cứng danh sách `defaultClinicPackages` (các gói 101, 102, 103: 500 lượt, 2.000 lượt, 5.000 lượt).
- **Đề xuất khắc phục (Suggestion)**:
  Đưa định nghĩa cấu hình gói mặc định vào tệp hằng số dùng chung (`src/constants/packages.ts`) hoặc cấu hình để ưu tiên nạp 100% động từ API backend `servicePackageApi.list('CLINIC')`.

---

### 3.6. [SUGGESTION] Dọn dẹp các Import không sử dụng (Dead Code)
- **File**:
  - `frontend/src/features/doctor/DoctorRiskAnalyticsView.tsx:13,14,16,21,23`: `SlidersHorizontal`, `Info`, `HeartPulse`, `Button`, `PatientProfile`.
  - `frontend/src/features/doctor/DoctorReportsView.tsx:12,13,15,19,20`: `SlidersHorizontal`, `Key`, `AlertCircle`, `Button`, `Modal`.
  - `frontend/src/features/doctor/DoctorConsultationView.tsx:9,10,12,14`: `Eye`, `CheckCircle2`, `ShieldCheck`, `Activity`.
  - `frontend/src/components/ClinicCreditPackageSection.tsx:20,24,25,29`: `Receipt`, `Sparkles`, `Download`, `LoadingState`.
- **Độ tin cậy (Confidence)**: High
- **Vấn đề (Problem)**: Các import thừa không ảnh hưởng đến logic chạy nhưng làm bẩn code và tăng dung lượng bundle.
- **Đề xuất khắc phục (Suggestion)**: Xóa các import không sử dụng.

---

## 4. Đánh Giá Toàn Diện Theo 6 Trục Nghiệp Vụ

### Trục 1: An Ninh (Security) - Đạt 8.5/10
- **Ưu điểm**:
  - Đã loại bỏ hoàn toàn wildcard `@CrossOrigin(origins = "*")` tại `BulkScreeningController.java`.
  - Kiểm soát chống IDOR chặt chẽ tại `ScreeningController.java` và `DoctorPatientController.java`: Bác sĩ bị chặn truy cập lịch sử của bệnh nhân chưa phân công; Bệnh nhân bị chặn xem lịch sử của người khác.
  - Không có token, API key hoặc mật khẩu bị lộ trong git diff.
- **Tồn đọng**: Cần sửa lỗi mock fallback thanh toán trong `CreditPurchaseModal.tsx` và nguy cơ CSV injection trong `AdminAuditLogsPage.tsx`.

### Trục 2: Hiệu Năng (Performance) - Đạt 9.0/10
- **Ưu điểm**:
  - Đã tách cuộc gọi phân tích AI ngoại vi ra ngoài transaction cơ sở dữ liệu trong `ScreeningService.java`, giải phóng triệt để Connection Pool.
  - Quản lý vòng đời WebSocket STOMP trong `DoctorConsultationView.tsx` chuẩn mực: có cờ `isMounted` và hủy đăng ký topic sạch sẽ (`unsubscribe`) khi component unmount.
  - Áp dụng `useMemo` đúng vị trí để tối ưu render danh sách lớn trong `PatientHistoryView`, `DoctorReportsView`, `DoctorRiskAnalyticsView`.

### Trục 3: Logic Nghiệp Vụ (Business Logic) - Đạt 8.5/10
- **Ưu điểm**:
  - Triển khai đầy đủ và chính xác các tính năng: Bác sĩ ký duyệt và xuất báo cáo (FR-15, FR-16), Tư vấn trực tuyến qua WebSocket (FR-20), Thống kê nguy cơ lâm sàng (FR-21), Quản lý hạn mức và gói dịch vụ phòng khám 500 - 5.000 lượt (FR-28), Quản lý gói billing Admin (FR-34), Nhật ký kiểm toán HIPAA (FR-37).
  - Khắc phục triệt để công thức tính điểm rủi ro: Không còn tình trạng lấy `confidence * 100`, loại bỏ hoàn toàn hàm sinh tổn thương giả lập (`generateAnomaliesFromMetrics`).
- **Tồn đọng**: Cần sửa lỗi hoán đổi dữ liệu đánh giá lâm sàng giữa OD và OS khi xuất tệp CSV trong `MedicalReportModal.tsx`.

### Trục 4: An Toàn Triển Khai (Deploy Safety) - Đạt 10/10
- **Ưu điểm**:
  - Cấu hình tải tệp lớn trong `application.yml` được nâng lên `20MB` (max-file-size) và `25MB` (max-request-size), đáp ứng tốt ảnh đáy mắt độ phân giải cao và tệp zip đợt khám.
  - Chuỗi Flyway migration từ `V001` đến `V026` được bảo toàn nguyên vẹn, không bị can thiệp trái phép.
  - Đảm bảo tương thích ngược đầy đủ ở các DTO và API request/response.

### Trục 5: Chống Trùng Lặp (Duplication) - Đạt 8.5/10
- **Ưu điểm**: Đã thay thế bảng lịch sử lặp lại trong `PatientPortalPage.tsx` bằng component dùng chung `PatientHistoryView`.
- **Tồn đọng**: Tồn tại định nghĩa trùng lặp cấu hình gói phòng khám giữa `CreditPurchaseModal` và `ClinicCreditPackageSection`.

### Trục 6: Mã Nguồn Rác (Dead Code) - Đạt 8.5/10
- **Ưu điểm**: Không còn các hàm mock data mồ côi trong `screeningMapper.ts`.
- **Tồn đọng**: Còn một số icon và component import thừa tại 4 view mới của frontend.

---

## 6. Biên Bản Tái Thẩm Định (Re-Review Sign-Off)

**Ngày tái thẩm định**: 13/09/2026  
**Chuyên viên thực hiện**: Chuyên Viên Đánh Giá Mã Nguồn (Code Reviewer) độc lập  
**Kết quả kiểm tra lại các bản vá**:

| Vấn Đề Trước Đây | Mức Độ | Tệp Tin:Dòng | Tình Trạng Sau Bản Vá | Đánh Giá Tái Thẩm Định |
|---|---|---|---|:---:|
| Gán `SUCCESS` trong `catch` thanh toán | `CRITICAL` | `frontend/src/components/CreditPurchaseModal.tsx:162-167` | Đã xóa triệt để logic gán `setPaymentStep('SUCCESS')` và `onPurchaseSuccess` trong `catch`. Khi API gặp lỗi, hệ thống hiển thị thông báo lỗi rõ ràng cho người dùng qua `setPurchaseError`. | **ĐÃ GIẢI QUYẾT (RESOLVED)** |
| Đánh giá mắt trái OS sao chép nhầm từ OD | `WARNING` | `frontend/src/components/MedicalReportModal.tsx:111-114` | Đã sửa tham số truyền vào các hàm `evaluateAvRatio`, `evaluateVesselDensity`, `evaluateTortuosity`, `evaluateVcdr` cho `OS` thành `osData.annotatedMap.*` ở cả bảng hiển thị UI và nội dung xuất tệp CSV. | **ĐÃ GIẢI QUYẾT (RESOLVED)** |
| CSV Injection & thiếu UTF-8 BOM Audit Logs | `WARNING` | `frontend/src/pages/AdminAuditLogsPage.tsx:842-845` | Đã bổ sung hàm `sanitizeCsvCell` kiểm tra regex `/^[=+\-@\t\r]/` để khử công thức CSV Injection, escape ký tự `""`, xuất file qua `Blob` UTF-8 kèm tiền tố BOM `\uFEFF`. | **ĐÃ GIẢI QUYẾT (RESOLVED)** |
| Import thừa tại 4 view frontend | `SUGGESTION` | `DoctorRiskAnalyticsView`, `DoctorReportsView`, `DoctorConsultationView`, `ClinicCreditPackageSection` | Đã dọn dẹp toàn bộ các import biểu tượng và component thừa (`SlidersHorizontal`, `Info`, `HeartPulse`, `Button`, `PatientProfile`, `Key`, `AlertCircle`, `Modal`, `Eye`, `CheckCircle2`, `ShieldCheck`, `Activity`, `Receipt`, `Sparkles`, `Download`, `LoadingState`). Lệnh `npm run build` chạy `tsc && vite build` thành công 100%. | **ĐÃ GIẢI QUYẾT (RESOLVED)** |

---

## 7. Kết Luận Khuyến Nghị Chính Thức (Final Recommendation)

### **APPROVE (CHẤP THUẬN CHÍNH THỨC)**

- **Đánh giá tổng thể**: 100% các vấn đề mức `CRITICAL` và `WARNING` đã được tác giả khắc phục triệt để. Toàn bộ các import thừa đã được dọn sạch.
- **Tính toàn vẹn mã nguồn**: Mã nguồn đạt chuẩn an ninh y tế, không có lỗ hổng IDOR, không có nguy cơ CSV Injection, tuân thủ nguyên tắc không sử dụng mock data trong luồng nghiệp vụ thật, không rò rỉ secret, và vượt qua các cổng kiểm thử tự động.
- **Quyết định**: Đủ điều kiện chuyển giao cho CEO (`aura-ceo`) thực hiện nghiệm thu chính thức (Executive Acceptance).
