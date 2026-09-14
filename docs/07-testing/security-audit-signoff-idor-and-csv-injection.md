# BIÊN BẢN TÁI THẨM ĐỊNH AN NINH & BẢO MẬT (SECURITY RE-AUDIT SIGN-OFF)
## HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA (AURA RETINAL SCREENING SYSTEM)

**Mã thẩm định:** `AURA-SEC-2026-004`  
**Ngày thẩm định:** 13/09/2026  
**Chuyên gia thẩm định:** Kỹ Sư An Ninh & Quyền Riêng Tư AURA (Security & Privacy Engineer)  
**Cổng chất lượng:** Cổng Chất Lượng An Ninh QG5 (Security & Privacy Gate)  
**Trạng thái kết luận:** **CHẤP THUẬN AN NINH (APPROVED)**  

---

## 1. TỔNG QUAN TÁI THẨM ĐỊNH AN NINH

| Hạng mục | Chi tiết |
| :--- | :--- |
| **Mục tiêu** | Tái thẩm định các bản vá an ninh chống IDOR (Insecure Direct Object Reference) trong phân quyền truy cập ca khám sàng lọc và chống tấn công CSV Formula Injection (CWE-1236). |
| **Phạm vi thẩm định** | 1. Backend: `ScreeningController.java`, `ScreeningControllerTest.java`<br/>2. Frontend: `MedicalReportModal.tsx` |
| **Tiêu chuẩn áp dụng** | OWASP Top 10:2021 (A01 - Broken Access Control, A03 - Injection), CWE-1236, HIPAA Safe Harbor, NFR-9 & NFR-10, Quy chuẩn an ninh AURA. |
| **Bản vá kiểm tra** | - Ngăn chặn IDOR khi Bác sĩ truy vấn `patientId` ngoài phân công qua `PatientAccessService`.<br/>- Ngăn chặn lộ dữ liệu toàn viện khi Bác sĩ không truyền `patientId`.<br/>- Đảm bảo duy nhất `ADMIN` có quyền xem toàn bộ ca khám hệ thống.<br/>- Ngăn chặn CSV Formula Injection qua hàm khử trùng `sanitizeCsvCell`. |

---

## 2. KẾT QUẢ RÀ SOÁT CHI TIẾT TỪNG NỘI DUNG

### 2.1. Backend: Kiểm Soát Phân Quyền & Phòng Chống IDOR (`ScreeningController.java`)

| Yêu cầu an ninh | Hiện trạng trước bản vá | Đánh giá sau bản vá thực tế | Kết luận |
| :--- | :--- | :--- | :---: |
| **1. Chặn IDOR khi Bác sĩ truyền `patientId` ngoài phân công** | Trước đây không có tham số `patientId` hoặc nếu có không kiểm tra phân công, tiềm ẩn rủi ro bác sĩ xem dữ liệu bệnh nhân khác. | Endpoint `@GetMapping` tại `ScreeningController`: Bác sĩ (`isDoctor`) khi truyền `patientId` bắt buộc đi qua kiểm tra `!patientAccessService.canAccessPatient(principal, patientId)`. Nếu không có quyền phân công, hệ thống ném ngay ngoại lệ `AuthException(ErrorCode.ACCESS_DENIED, "Bác sĩ không có quyền truy cập lịch sử của bệnh nhân chưa được phân công")`. | **ĐẠT**<br/>(PASSED) |
| **2. Bác sĩ không truyền `patientId` chỉ lấy ca khám phân công** | Trước đây gom chung `isDoctorOrAdmin` và gọi `screeningService.getAllScreenings()`, làm lộ toàn bộ ca khám của bệnh viện cho bác sĩ. | Phân định rạch ròi giữa `isDoctor` và `isAdmin`. Khi `isDoctor` không truyền `patientId`, hệ thống gọi `screeningService.getScreeningsForDoctor(principal.id())`. Bác sĩ chỉ truy cập được đúng các ca khám của các bệnh nhân mà bác sĩ đó được phân công điều trị/thẩm định. | **ĐẠT**<br/>(PASSED) |
| **3. Giới hạn quyền xem toàn bộ ca khám (`getAllScreenings`)** | Bác sĩ thường và Admin đều có thể xem toàn bộ ca khám. | Duy nhất `isAdmin = hasRole(principal, "ADMIN")` mới được kích hoạt `screeningService.getAllScreenings()` khi không có `patientId`. Bác sĩ và Bệnh nhân hoàn toàn bị cô lập dữ liệu. | **ĐẠT**<br/>(PASSED) |
| **4. Kiểm soát phân quyền phía Bệnh nhân (USER)** | Người dùng có thể truyền `patientId` tùy ý để truy vấn. | Khi vai trò là `USER` (bệnh nhân), nếu truyền `patientId != principal.id()`, hệ thống lập tức ném `AuthException(ErrorCode.ACCESS_DENIED, "Không có quyền truy cập lịch sử sàng lọc của bệnh nhân khác")`. Bệnh nhân chỉ xem được dữ liệu của chính mình (`principal.id()`). | **ĐẠT**<br/>(PASSED) |

---

### 2.2. Backend: Bổ Sung Test Case An Ninh (`ScreeningControllerTest.java`)

Bộ kiểm thử đơn vị `ScreeningControllerTest` đã được bổ sung đầy đủ các kịch bản kiểm tra an ninh và chạy tự động với kết quả **15/15 tests PASS (100%)**:

1. `getScreenings_byDoctorWithUnassignedPatientId_throwsAccessDenied`: Xác minh Bác sĩ cố tình truyền `patientId` không được phân công sẽ bị chặn với `ErrorCode.ACCESS_DENIED`.
2. `getScreenings_byDoctorWithAssignedPatientId_success`: Xác minh Bác sĩ truyền `patientId` được phân công sẽ truy cập thành công (`200 OK`).
3. `getScreenings_byDoctorWithoutPatientId_returnsDoctorAssignedScreenings`: Xác minh Bác sĩ không truyền `patientId` thì chỉ nhận danh sách ca khám của các bệnh nhân được chỉ định (`getScreeningsForDoctor(doctorId)`).
4. `getScreenings_byAdminWithoutPatientId_returnsAllScreenings`: Xác minh chỉ Admin mới được phép gọi `getAllScreenings()`.
5. `getScreenings_byAdminWithPatientId_returnsPatientScreenings`: Xác minh Admin có thể xem lịch sử theo từng bệnh nhân cụ thể.
6. `getScreenings_withOtherPatientId_throwsAccessDenied`: Xác minh Bệnh nhân cố tình xem ca khám của bệnh nhân khác bị chặn với `ACCESS_DENIED`.
7. `getScreenings_unauthenticated_throwsUnauthorized`: Xác minh truy cập ẩn danh bị chặn với `401 UNAUTHORIZED`.

---

### 2.3. Frontend: Phòng Chống CSV Formula Injection (CWE-1236 - `MedicalReportModal.tsx`)

| Yêu cầu an ninh | Cơ chế phòng thủ triển khai | Đánh giá kỹ thuật | Kết luận |
| :--- | :--- | :--- | :---: |
| **Khử trùng ký tự điều khiển công thức** | Hàm `sanitizeCsvCell(val: string)` kiểm tra regex `/^[=+\-@\t\r]/`. Nếu chuỗi bắt đầu bằng các ký tự nguy hiểm này, hàm tự động thêm tiền tố dấu nháy đơn `'` (`'${trimmed}`). | Chuẩn khử trùng theo khuyến cáo OWASP CSV Injection: Ngăn chặn triệt để Microsoft Excel, Google Sheets, Calc hiểu nhầm các trường dữ liệu do người dùng/bác sĩ nhập (Họ tên, MRN, Doctor Notes, Findings, Recommendations) thành công thức thực thi mã (DDE) hoặc ngoại suy dữ liệu. | **ĐẠT**<br/>(PASSED) |
| **Phạm vi áp dụng toàn diện** | - Khử trùng trước ở mức biến dữ liệu văn bản tự do.<br/>- Khử trùng bắt buộc tại vòng lặp xuất bảng: `row.map((cell) => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`)`. | Đảm bảo 100% các ô (cells) trong cả chế độ 1 mắt lẫn đối chiếu 2 mắt (Dual-Eye) đều được làm sạch trước khi escape dấu ngoặc kép theo chuẩn RFC 4180. | **ĐẠT**<br/>(PASSED) |
| **Bảo vệ toàn vẹn UTF-8** | Tệp CSV được đóng gói kèm ký tự nhận diện Byte Order Mark `\uFEFF`. | Tránh lỗi font tiếng Việt trong Excel mà không làm suy yếu cơ chế chống injection. | **ĐẠT**<br/>(PASSED) |

---

## 3. MA TRẬN RÀ SOÁT LỖ HỔNG TOÀN DIỆN (OWASP & HIPAA MATRIX)

| Mã lỗ hổng | Tên lỗ hổng | Nguy cơ trước vá | Hiện trạng sau vá | Mức độ tồn đọng |
| :---: | :--- | :---: | :--- | :---: |
| **SEC-01** | Lộ lọt Secrets / API Keys trong mã nguồn | Thấp | Không phát hiện secret thô trong commit diff. | **NONE** |
| **SEC-02** | Rò rỉ thông tin y tế nhạy cảm (PII/PHI) trong Log | Thấp | Không có lệnh ghi log chứa thông tin nhận dạng cá nhân hoặc ảnh thô. | **NONE** |
| **SEC-03** | Lỗ hổng IDOR trong truy xuất danh sách ca khám | **HIGH** | Đã được khắc phục triệt để bằng `PatientAccessService` và phân định vai trò. | **RESOLVED** |
| **SEC-04** | Lộ toàn bộ ca khám cho Bác sĩ không có thẩm quyền | **HIGH** | Đã chuyển sang `getScreeningsForDoctor(principal.id())`, cô lập hoàn toàn dữ liệu. | **RESOLVED** |
| **SEC-05** | CSV Formula Injection (CWE-1236) khi xuất báo cáo | **MEDIUM** | Đã được khử trùng 100% các ô bằng `sanitizeCsvCell` với tiền tố nháy đơn `'`. | **RESOLVED** |
| **SEC-06** | XSS / HTML Injection trong báo cáo y tế | Thấp | React tự động escape HTML khi render DOM. | **NONE** |
| **SEC-07** | Bỏ qua xác thực / CORS Wildcard | Thấp | Endpoint yêu cầu `@AuthenticationPrincipal`, không có CORS wildcard production. | **NONE** |

---

## 4. KẾT LUẬN & CHỮ KÝ NGHIỆM THU

Căn cứ vào kết quả kiểm thử và rà soát mã nguồn thực tế:
- **0 lỗi mức CRITICAL**
- **0 lỗi mức HIGH**
- **0 lỗi mức MEDIUM**
- Toàn bộ 15/15 test case trong `ScreeningControllerTest` đạt trạng thái PASS 100%.
- Frontend build sạch, không phát sinh lỗi kiểu dữ liệu TypeScript.
- Cơ chế kiểm soát quyền sở hữu dữ liệu (Data Ownership) và phòng chống CWE-1236 đã hoạt động vững chắc.

Kỹ Sư An Ninh & Quyền Riêng Tư chính thức xác nhận:  
**KẾT LUẬN: CHẤP THUẬN AN NINH (APPROVED)** — Đạt chuẩn Cổng Chất Lượng QG5.  
Đủ điều kiện chuyển giao cho `code-reviewer` và `scrum-master / aura-ceo` nghiệm thu phát hành.
