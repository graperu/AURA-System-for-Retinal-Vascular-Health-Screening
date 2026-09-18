# BÁO CÁO KIỂM LỖI TOÀN DIỆN VÀ RÀ SOÁT SÂU HỆ THỐNG AURA
## (COMPREHENSIVE MULTI-AGENT SYSTEM LOGIC, SECURITY & CLINICAL AUDIT REPORT)
**Hệ Thống Sàng Lọc Sức Khỏe Mạch Máu Võng Mạc (AURA - Retinal Vascular Health Screening)**  
*Thời gian thực hiện:* 18/09/2026  
*Đội ngũ thực hiện:* Hội đồng Kiểm toán Đa tác nhân (Multi-Agent Audit Team):
- **Agent 1:** Backend Concurrency, Security & Cryptographic Auditor
- **Agent 2:** Frontend React 18, State Management & Realtime Infrastructure Auditor
- **Agent 3:** Medical AI, DICOM & Clinical Ophthalmology Domain Specialist  
*Nguyên tắc tối cao:* **CHỈ ĐỌC VÀ PHÂN TÍCH MÃ NGUỒN — TUYỆT ĐỐI KHÔNG CHỈNH SỬA CODE KHI CHƯA CÓ LỆNH.**

---

## MỤC LỤC
1. [TỔNG QUAN ĐÁNH GIÁ ĐỘI NGŨ MULTI-AGENT](#1-tổng-quan-đánh-giá-đội-ngũ-multi-agent)
2. [BẢO MẬT HỆ THỐNG, MẬT MÃ & KIỂM SOÁT TRUY CẬP (SECURITY & CRYPTOGRAPHY)](#2-bảo-mật-hệ-thống-mật-mã--kiểm-soát-truy-cập)
3. [XỬ LÝ ĐỒNG THỜI, RACE CONDITIONS & GIAO DỊCH (CONCURRENCY & TRANSACTIONS)](#3-xử-lý-đồng-thời-race-conditions--giao-dịch)
4. [AN TOÀN Y TẾ, DICOM & CHUẨN ĐOÁN LÂM SÀNG (CLINICAL AI & MEDICAL INTEGRITY)](#4-an-toàn-y-tế-dicom--chuẩn-đoán-lâm-sàng)
5. [HẠ TẦNG THỜI GIAN THỰC & RÒ RỈ BỘ NHỚ FRONTEND (REALTIME & REACT MEMORY)](#5-hạ-tầng-thời-gian-thực--rò-rỉ-bộ-nhớ-frontend)
6. [NGHIỆP VỤ THANH TOÁN, GÓI DỊCH VỤ & CREDIT (BILLING & REVENUE)](#6-nghiệp-vụ-thanh-toán-gói-dịch-vụ--credit)
7. [KIẾN TRÚC DỮ LIỆU, TRUY VẤN CSDL & ĐỒNG BỘ ĐA CỔNG (DATA ARCHITECTURE)](#7-kiến-trúc-dữ-liệu-truy-vấn-csdl--đồng-bộ-đa-cổng)
8. [MA TRẬN RỦI RO & BẢNG TỔNG HỢP LỖ HỔNG (DEFECT RISK MATRIX)](#8-ma-trận-rủi-ro--bảng-tổng-hợp-lỗ-hổng)
9. [LỘ TRÌNH KHẮC PHỤC CHUẨN HÓA (REMEDIATION ROADMAP)](#9-lộ-trình-khắc-phục-chuẩn-hóa)

---

## 1. TỔNG QUAN ĐÁNH GIÁ ĐỘI NGŨ MULTI-AGENT

Sau đợt rà soát đầu tiên, đội ngũ Multi-Agent đã tiến hành thâm nhập sâu vào từng hàm xử lý nhị phân, từng câu lệnh CriteriaBuilder, các hook React phức tạp, các thuật toán biến đổi hình ảnh trên HTML5 Canvas, và giao thức truyền thông mạng WebSocket STOMP / SSE.

### Kết quả tổng hợp:
- **Tổng số lỗi và điểm bất hợp lý phát hiện:** **32 vấn đề nghiêm trọng**.
- **Mức độ Critical (Cực kỳ nguy hiểm):** **9 lỗi** (Chiếm đoạt tài khoản không mật khẩu, SQL Leak 100% bệnh nhân qua mã hóa, Double Top-up thanh toán, OOM crash backend, OOM crash frontend, Fake Diagnostic cartoon eye, Rò rỉ PHI qua DICOM Undefined Sequence, Phân độ ETDRS sai lệch gây can thiệp xâm lấn sai, Biến mất toàn bộ phiên đăng nhập đa tab).
- **Mức độ High (Nghiêm trọng):** **13 lỗi** (Bão kết nối lại WebSocket, Nuốt lỗi HTTP 204 biến thành lỗi đỏ, Lộ token qua URL, Lẫn lộn bệnh lý mắt và tim mạch, Bỏ sót nguy cơ đột quỵ, Ghi đè cấu hình ngôn ngữ, v.v.).
- **Mức độ Medium & Low:** **10 lỗi** (Rò rỉ bộ nhớ Canvas GPU, N+1 query, rò rỉ Blob URL, v.v.).

---

## 2. BẢO MẬT HỆ THỐNG, MẬT MÃ & KIỂM SOÁT TRUY CẬP (SECURITY & CRYPTOGRAPHY)

### 2.1. Chiếm quyền tài khoản tối cao (Account Takeover) qua Social Login không xác thực chữ ký
- **Vị trí:** `backend/src/main/java/com/aura/auth/service/AuthService.java` (dòng 188–255)
- **Bản chất lỗi:** 
  Khi người dùng đăng nhập bằng các nhà cung cấp bên ngoài (Apple, Microsoft, Facebook, GitHub) hoặc token Google không hợp lệ, hệ thống tự ý cắt chuỗi Base64 phần Payload của JWT và giải mã JSON **mà không hề kiểm tra chữ ký số (Signature Verification)**. Thậm chí nếu token không có email, nó lấy trực tiếp trường `email` do client gửi lên trong body:
  ```java
  if (email == null && q.email() != null && !q.email().isBlank()) {
      email = q.email().trim().toLowerCase(Locale.ROOT);
  }
  var user = users.findByEmailIgnoreCase(targetEmail).orElseGet(...);
  return result(user, names);
  ```
- **Hậu quả:** Kẻ tấn công gửi `POST /api/v1/auth/social` với body:
  `{"provider": "apple", "email": "admin@aura.local", "idToken": ""}`
  Backend lập tức cấp phát một Access Token JWT hợp lệ của Quản trị viên (`ROLE_ADMIN`), chiếm toàn quyền kiểm soát hệ thống y tế.

### 2.2. Lộ mã OTP bí mật trong phản hồi API ở mọi môi trường (OTP Leak via API Response)
- **Vị trí:** 
  - `backend/src/main/java/com/aura/auth/service/AuthService.java` (dòng 100–110)
  - `backend/src/main/java/com/aura/auth/controller/AuthController.java` (dòng 30–46)
  - `backend/src/main/java/com/aura/auth/service/OtpService.java` (dòng 121–125)
- **Bản chất lỗi:**
  Phương thức `getOtpDataResponse` đính kèm trường `devOtp` trực tiếp vào phản hồi JSON gửi về client:
  ```java
  String debugOtp = otpService.getLatestOtpForDebug(email);
  if (debugOtp != null) map.put("devOtp", debugOtp);
  ```
  Không hề có cờ kiểm tra môi trường (`dev`/`test` vs `prod`). Bất kỳ ai yêu cầu quên mật khẩu cho tài khoản Bác sĩ/Admin đều đọc được mã OTP ngay trong response body và đổi mật khẩu nạn nhân qua `/reset-password`.

### 2.3. Lỗi Mật mã "Fail-Open" làm rò rỉ Ciphertext và phá hủy tính toàn vẹn (AES-GCM Converter)
- **Vị trí:** `backend/src/main/java/com/aura/common/crypto/AesGcmAttributeConverter.java` (dòng 33–35, 113–116)
- **Bản chất lỗi:**
  1. Trong khối `catch` giải mã:
     ```java
     } catch (Exception e) {
         log.error("AES-256 GCM decryption failed... returning raw data for safety", e);
         return dbData; // Trả về chuỗi mã hóa ENC:... khi giải mã thất bại!
     }
     ```
     Khi tag xác thực mật mã bị sai (do dữ liệu bị tấn công bit-flipping hoặc CSDL bị sửa đổi), thay vì chặn giao dịch (Fail-Closed), converter lại trả chuỗi ciphertext về cho tầng nghiệp vụ. Dữ liệu này được gửi thẳng lên UI, và nếu entity được save lại, dữ liệu sẽ bị mã hóa kép (`ENC:ENC:...`), phá hủy vĩnh viễn dữ liệu y tế gốc.
  2. Khóa mặc định bị gán cứng trong mã nguồn: `AURA_SYSTEM_SECURE_AES_KEY_2026_32BYTES_LEN_!!`.
  3. Prefix Collision: Nếu bệnh nhân nhập triệu chứng bắt đầu bằng chữ `"ENC:"`, hệ thống bỏ qua mã hóa và lưu dạng bản rõ (Plaintext) vào CSDL, vi phạm HIPAA NFR-9.

### 2.4. Kết nối nhận sự kiện Quản trị viên không cần xác thực (Unauthenticated Admin SSE Stream)
- **Vị trí:** `backend/src/main/java/com/aura/controller/RealtimeSseController.java` (dòng 124–136)
- **Bản chất lỗi:**
  Endpoint `/api/v1/events/stream` cho phép truyền thông tin qua query parameters:
  ```java
  if (effectiveUserId == null && userIdParam != null && !userIdParam.isBlank()) {
      effectiveUserId = userIdParam.trim();
      if (roleParam != null && !roleParam.isBlank()) {
          effectiveRole = roleParam.trim();
          effectiveRoles.add(effectiveRole);
      }
  }
  ```
  Kẻ tấn công không cần đăng nhập, chỉ cần mở URL: `/api/v1/events/stream?userId=admin-uuid&role=ADMIN`. Hệ thống nhận diện đây là Admin và truyền phát toàn bộ sự kiện lâm sàng, thông báo tải ảnh và kết quả khám bệnh theo thời gian thực.

### 2.5. Lỗ hổng Nghe lén kênh Chat và Ca khám qua WebSocket STOMP
- **Vị trí:** `backend/src/main/java/com/aura/config/WebSocketConfig.java` (dòng 147–193)
- **Bản chất lỗi:**
  1. Kênh `/topic/chat.{targetUserId}`: Hệ thống chỉ kiểm tra `hasRole(principal, "DOCTOR")`. Bất kỳ bác sĩ nào trong bệnh viện cũng có thể subscribe vào kênh của bệnh nhân và bác sĩ khác để đọc trộm tin nhắn tư vấn riêng tư.
  2. Kênh `/topic/screening-chat.{screeningId}`: Cho phép bất kỳ ai có vai trò `USER` đăng ký lắng nghe mà không kiểm tra ca khám có thuộc quyền sở hữu của họ hay không.

### 2.6. Bypass bộ lọc nguồn tin cậy qua Unnormalized URI (TrustedOriginFilter Bypass)
- **Vị trí:** `backend/src/main/java/com/aura/auth/security/TrustedOriginFilter.java` (dòng 17, 26–28)
- **Bản chất lỗi:**
  Bộ lọc kiểm tra `!PATHS.contains(r.getRequestURI())` với `PATHS = ["/api/v1/auth/refresh", "/api/v1/auth/logout"]`. Kẻ tấn công gửi `POST /api/v1/auth/refresh/` hoặc `POST /api/v1/auth//refresh`. Spring routing vẫn nhận diện đúng controller, nhưng `TrustedOriginFilter` bị đánh lừa là đường dẫn khác, bỏ qua toàn bộ kiểm tra Origin/Referer chống CSRF.

---

## 3. XỬ LÝ ĐỒNG THỜI, RACE CONDITIONS & GIAO DỊCH (CONCURRENCY & TRANSACTIONS)

### 3.1. LỖI KIẾN TRÚC: SQL LIKE trên trường đã mã hóa làm lộ 100% bệnh nhân
- **Vị trí:** 
  - `backend/src/main/java/com/aura/patient/repository/PatientSpecification.java` (dòng 54)
  - `backend/src/main/java/com/aura/patient/entity/PatientProfile.java` (dòng 40–42)
- **Bản chất lỗi:**
  Trường `phone` được mã hóa AES-GCM thành `ENC:<base64>`. Trong CriteriaBuilder:
  ```java
  Predicate phoneMatch = cb.like(cb.lower(root.get("phone")), pattern);
  ```
  PostgreSQL thực thi trực tiếp trên ciphertext. Hậu quả:
  1. Tìm số điện thoại thật (`0912345678`) **luôn trả về 0 kết quả**.
  2. Khi tìm kiếm với từ khóa `"ENC"` hoặc `"ENC:"`, điều kiện `LIKE '%enc%'` **KHỚP VỚI 100% TẤT CẢ BỆNH NHÂN CÓ SỐ ĐIỆN THOẠI TRONG TOÀN HỆ THỐNG**! Đây là lỗ hổng rò rỉ dữ liệu y tế quy mô lớn không chủ ý.

### 3.2. Race Condition Lost Update giữa Nạp tiền và Trừ lượt khám (Billing Concurrency)
- **Vị trí:** `backend/src/main/java/com/aura/billing/service/BillingService.java` (dòng 313–332, 371–386)
- **Bản chất lỗi:**
  - `deductCredits` dùng khóa bi quan `PESSIMISTIC_WRITE` trên bảng `Subscription`.
  - Nhưng hàm nạp tiền `grantOrExtendCredits` (gọi từ Webhook thanh toán) lại dùng `findByOwnerIdAndServicePackageId` — **CÂU LỆNH SELECT THƯỜNG KHÔNG CÓ KHÓA**.
  - Cả `Subscription` và `PaymentTransaction` **đều không có trường `@Version`** (không có Optimistic Lock).
  - Khi một Webhook nạp tiền chạy đồng thời với một ca khám mắt đang trừ tiền, luồng nạp tiền sẽ ghi đè giá trị cũ lên số dư vừa bị trừ, làm mất hoàn toàn giao dịch trừ tiền (Bệnh nhân được khám miễn phí không bị trừ lượt).

### 3.3. Lỗ hổng Check-Then-Act trong Webhook dẫn đến Nhân đôi Lượt khám (Double Top-Up)
- **Vị trí:** `backend/src/main/java/com/aura/billing/service/BillingService.java` (dòng 178–207)
- **Bản chất lỗi:**
  Kiểm tra Idempotency bằng câu lệnh `findByProviderReference` không có khóa hàng CSDL (`FOR UPDATE`). Khi các cổng thanh toán (VNPay, MoMo) gửi retry hoặc redirect đồng thời trong cùng 1 mili-giây, cả 2 luồng đều thấy trạng thái là `PENDING` và cùng gọi `grantOrExtendCredits()`. Người dùng chỉ trả tiền 1 lần nhưng được cộng gấp đôi số lượt khám.

### 3.4. Token Rotation Race Condition làm người dùng bị văng phiên trên mọi thiết bị
- **Vị trí:** `backend/src/main/java/com/aura/auth/service/RefreshTokenService.java` (dòng 46–64)
- **Bản chất lỗi:**
  Hệ thống áp dụng cơ chế chống tái sử dụng token: nếu một token đã bị thu hồi (`revokedAt != null`) được gửi lên, hệ thống sẽ gọi `revokeAllActiveByUserId` để hủy toàn bộ phiên của user.
  Khi người dùng mở 2 tab trình duyệt cùng lúc: sau 30 phút, cả 2 tab cùng bắn request `/api/v1/auth/refresh`. Tab 1 tới trước đổi token thành công; Tab 2 tới sau 10 mili-giây thấy token đã thu hồi, lầm tưởng là bị tấn công và **LẬP TỨC XÓA SẠCH PHIÊN ĐĂNG NHẬP TRÊN TOÀN BỘ MÁY TÍNH VÀ ĐIỆN THOẠI CỦA NGƯỜI DÙNG**. Hệ thống thiếu một Grace Period window (10–30s) cho các request đồng thời hợp lệ.

### 3.5. DoS Cạn kiệt Bộ nhớ Heap Backend qua Unbounded Pagination & BLOB Storage
- **Vị trí:** 
  - `backend/src/main/java/com/aura/doctor/controller/DoctorPatientController.java` (dòng 85–106)
  - `backend/src/main/java/com/aura/patient/service/PatientLabDocumentService.java` (dòng 55–58)
- **Bản chất lỗi:**
  1. `DoctorPatientController` nhận `pageSize` từ client mà không hề có giới hạn trần (Max limit). Kẻ tấn công gửi `?size=2000000` làm backend truy vấn hàng triệu bản ghi, giải mã AES từng dòng và làm sập JVM với lỗi OutOfMemoryError.
  2. `PatientLabDocument` lưu trữ file tài liệu xét nghiệm dạng mảng byte trực tiếp vào cột `BYTEA` trong PostgreSQL. Khi tải xuống, file 10MB được nạp vào RAM dưới dạng hex stream 20MB trong Hibernate session, gây quá tải bộ nhớ khi có nhiều người truy cập.

---

## 4. AN TOÀN Y TẾ, DICOM & CHUẨN ĐOÁN LÂM SÀNG (CLINICAL AI & MEDICAL INTEGRITY)

### 4.1. Sinh ảnh hoạt họa giả (Synthetic Cartoon Eye) khi đọc định dạng DICOM thô
- **Vị trí:** `backend/src/main/java/com/aura/dicom/DicomIngestionService.java` (dòng 330–363)
- **Bản chất lỗi:**
  Khi file DICOM từ máy chụp chuyên dụng (Zeiss, Topcon) sử dụng cú pháp Uncompressed Native Pixel hoặc JPEG 2000, parser không tìm thấy marker `0xFF 0xD8 0xFF`. Thay vì báo lỗi cú pháp không hỗ trợ, code tự ý dùng `Graphics2D` vẽ một vòng tròn đỏ với đĩa thị vàng rồi nén thành PNG gửi cho Gemini phân tích:
  ```java
  g.setColor(new Color(185, 28, 28, 180)); // retinal red
  g.fillOval(cx, cy, radius, radius);
  g.setColor(new Color(254, 240, 138, 220)); // optic disc yellow
  g.fillOval(...);
  ```
  Gemini AI và Bác sĩ sẽ chẩn đoán trên một bức vẽ hoạt họa giả lập thay vì ảnh chụp võng mạc thực sự của bệnh nhân, gây nguy cơ sai lệch kết quả chẩn đoán nghiêm trọng.

### 4.2. Rò rỉ PHI do lỗi Parser DICOM gặp Undefined Length Sequence (`0xFFFFFFFF`)
- **Vị trí:** `backend/src/main/java/com/aura/dicom/DicomIngestionService.java` (dòng 103–125, 244)
- **Bản chất lỗi:**
  Trong chuẩn DICOM, Sequence hoặc Pixel Data có thể có chiều dài không xác định (`0xFFFFFFFF`). Trong Java, giá trị này bị ép thành số âm `-1`. 
  Code kiểm tra `if (valLength < 0) break;` làm parser thoát sớm. Trong hàm ẩn danh `deidentifyDicom`, khi vòng lặp thoát sớm, toàn bộ phần sau của tệp được ghi nguyên vẹn ra output. Nếu thông tin định danh bệnh nhân (`PatientName`, `PatientID`) nằm sau Sequence này, **dữ liệu bệnh nhân hoàn toàn không được ẩn danh**, vi phạm nghiêm trọng luật bảo vệ dữ liệu y tế HIPAA.

### 4.3. Phân độ Bệnh võng mạc đái tháo đường (ETDRS) sai chuẩn y khoa quốc tế
- **Vị trí:** 
  - `backend/src/main/java/com/aura/screening/service/ScreeningService.java` (dòng 512–525)
  - `frontend/src/services/screeningMapper.ts` (dòng 82–101)
- **Bản chất lỗi:**
  Theo Quyết định 3987/QĐ-BYT của Bộ Y tế Việt Nam và Hội Nhãn khoa Hoa Kỳ (AAO), phân loại ETDRS bắt buộc phải dựa trên tổn thương thực thể qua **Quy tắc 4-2-1** (Số điểm xuất huyết ở 4 góc phần tư, chuỗi hạt tĩnh mạch ở 2 góc, bất thường vi mạch IRMA ở 1 góc, và sự xuất hiện của tân mạch NVD/NVE).
  Hệ thống AURA lại **suy diễn cấp độ ETDRS trực tiếp từ điểm số chung `predScore`**:
  `if (predScore >= 80) etdrs = "Cấp độ 4 (PDR - Tăng sinh)"`.
  Một bệnh nhân lớn tuổi bị xơ vữa mạch máu khiến điểm tim mạch cao nhưng mắt chỉ bị NPDR nhẹ (Cấp độ 1) sẽ bị hệ thống kết luận sai thành Cấp độ 4 (Tăng sinh nguy kịch). Điều này có thể dẫn đến chỉ định tiêm thuốc Anti-VEGF nội nhãn hoặc bắn Laser toàn võng mạc (PRP) sai lầm, gây tổn thương thị lực vĩnh viễn cho người bệnh.

### 4.4. Giả lập Biomarker y tế bằng hàm băm tên tệp (Pseudo-random Biomarkers)
- **Vị trí:** `frontend/src/services/mockAiEngine.ts` (dòng 504–510), `BatchItemDetailModal.tsx` (dòng 155–157)
- **Bản chất lỗi:**
  Hệ thống không có thuật toán đo hình thái vi mạch (Parr-Hubbard hay Knudtson). Thay vào đó, các chỉ số sống còn của mắt được tính bằng **phép chia lấy dư trên mã ASCII của tên file**:
  ```ts
  const dynamicAvRatio = Number((0.49 + ((seed + eyeOffset) % 24) / 100).toFixed(2));
  ```
  Chỉ cần đổi tên tệp từ `anh1.jpg` sang `anh2.jpg`, chỉ số co hẹp mạch máu AVR của bệnh nhân có thể nhảy từ mức co hẹp bệnh lý ($0.51$) sang mức hoàn toàn khỏe mạnh ($0.68$).

### 4.5. Lỗ hổng Prompt Injection qua tham số `eyePosition` trong Gemini AI Service
- **Vị trí:** `backend/src/main/java/com/aura/screening/service/GeminiRetinalAiService.java` (dòng 153)
- **Bản chất lỗi:**
  Chuỗi `eye` không được làm sạch hay whitelist mà nối trực tiếp vào prompt:
  `Phân tích ảnh đáy mắt võng mạc (" + eye + ") của bệnh nhân sau:`
  Kẻ tấn công có thể chèn câu lệnh ép LLM bỏ qua hướng dẫn chẩn đoán và trả về điểm số rủi ro bằng 0 để làm sai lệch hồ sơ bệnh án.

---

## 5. HẠ TẦNG THỜI GIAN THỰC & RÒ RỈ BỘ NHỚ FRONTEND (REALTIME & REACT MEMORY)

### 5.1. Bão kết nối lại WebSocket thiếu Jitter (Reconnect Storm / Thundering Herd)
- **Vị trí:** `frontend/src/services/websocketService.ts` (dòng 142)
- **Bản chất lỗi:**
  Thời gian lùi lũy thừa kết nối lại là tất định: `delay = Math.min(30000, 1000 * Math.pow(1.5, this.retryCount))`, hoàn toàn không có ngẫu nhiên hóa (randomized jitter). Khi hạ tầng mạng phục hồi sau sự cố, hàng trăm client sẽ đồng loạt gửi yêu cầu kết nối lại vào cùng các mốc thời gian (1.0s, 1.5s, 2.25s,...), tạo thành bão yêu cầu làm tê liệt WebSocket Gateway.

### 5.2. Rò rỉ bộ nhớ VRAM/GPU nghiêm trọng trong Canvas quang học
- **Vị trí:** `frontend/src/utils/dynamicHeatmapEngine.ts` (dòng 175–186, 264–279)
- **Bản chất lỗi:**
  Mỗi lần render ảnh đáy mắt $3000 \times 3000$, hàm tạo một `tempCanvas` và mảng `Float32Array` tiêu tốn >144MB RAM. Sau khi render xong, `tempCanvas` không hề được giải phóng kích thước (`width = 0, height = 0`). Trình duyệt giữ nguyên GPU Backing Store trong tiến trình GPU. Duyệt qua 10–15 ca khám sẽ ngốn hàng Gigabyte RAM và làm sập tab trình duyệt với lỗi Out-Of-Memory.

### 5.3. Vòng lặp Render vô tận (Infinite Re-render Loop) trong `DynamicHeatmapCanvas`
- **Vị trí:** `frontend/src/components/DynamicHeatmapCanvas.tsx` (dòng 65–72, 99)
- **Bản chất lỗi:**
  Callback `onRenderComplete` được đưa vào dependency array của `useEffect`. Khi component cha truyền inline arrow function, việc gọi `onRenderComplete` làm component cha re-render -> sinh hàm mới -> kích hoạt lại `useEffect`. CPU tăng vọt 100% và đóng băng hoàn toàn giao diện người dùng.

### 5.4. Lỗi phân tích cú pháp biến HTTP 204 No Content thành lỗi thất bại
- **Vị trí:** `frontend/src/services/api.ts` (dòng 45–56, 114)
- **Bản chất lỗi:**
  Hàm `request` luôn gọi `await response.json()` vô điều kiện. Khi backend trả về mã `204 No Content` (khi xóa thành công ca khám, thông báo, hoặc tài liệu), hàm ném lỗi `SyntaxError: Unexpected end of JSON input`. Khối `catch` bắt lỗi và gán `body.success = false`. Dù dữ liệu đã xóa thành công trong CSDL, giao diện vẫn báo lỗi thất bại cho người dùng.

### 5.5. Cưỡng bức ghi đè cài đặt ngôn ngữ về tiếng Việt (Language Persistence Bug)
- **Vị trí:** `frontend/src/context/LanguageContext.tsx` (dòng 54–67)
- **Bản chất lỗi:**
  Trong thân hàm Provider (nằm ngoài `useEffect`):
  ```ts
  if (stored !== 'vi') localStorage.setItem(STORAGE_KEY, 'vi');
  ```
  Mỗi khi người dùng chọn tiếng Anh (`'en'`), tải lại trang F5 sẽ lập tức bị đoạn code này ghi đè ngược về `'vi'`. Người dùng không bao giờ có thể lưu trạng thái tiếng Anh.

### 5.6. Rò rỉ hàng trăm Megabyte bộ nhớ do không thu hồi Blob Object URL
- **Vị trí:** `frontend/src/components/BatchUploadModal.tsx` (dòng 141)
- **Bản chất lỗi:**
  Khi tải lên lô 100 ảnh, code gọi `URL.createObjectURL(file)` nhưng hoàn toàn không gọi `URL.revokeObjectURL()` khi đóng modal hoặc xóa file. Bộ nhớ nhị phân của 100 ảnh (khoảng ~1GB) bị giữ vĩnh viễn trong RAM của trình duyệt.

---

## 6. NGHIỆP VỤ THANH TOÁN, GÓI DỊCH VỤ & CREDIT (BILLING & REVENUE)

### 6.1. Phòng khám sàng lọc hàng loạt miễn phí không giới hạn (Bypass trừ Credit)
- **Vị trí:** 
  - `backend/src/main/java/com/aura/screening/service/ScreeningService.java` (dòng 218–229)
  - `backend/src/main/java/com/aura/bulk/controller/BulkScreeningController.java` (toàn bộ)
  - `backend/src/main/java/com/aura/bulk/worker/BulkProcessingWorker.java` (toàn bộ)
- **Bản chất lỗi:**
  Logic trừ credit chỉ áp dụng cho người dùng cá nhân không phải nhân viên y tế và không có `clinicId`. Khi Phòng khám tải lên hàng loạt hàng nghìn ảnh, hệ thống hoàn toàn không gọi trừ credit của phòng khám, phá vỡ hoàn toàn mô hình kinh doanh của Gói Phòng Khám Chiến Dịch (FR-27, FR-28).

### 6.2. Client tự cộng credit ảo khi thanh toán thất bại
- **Vị trí:** `frontend/src/components/CreditPurchaseModal.tsx` (dòng 489–505)
- **Bản chất lỗi:**
  Khi API `confirmLocalPayment` trả về lỗi 403 (do đang ở môi trường production), khối `catch` nuốt lỗi và tự gọi `onPurchaseSuccess?.(activeCredits + 5)`. Frontend báo nạp thành công, nhưng CSDL vẫn là 0 lượt. Khi bệnh nhân bấm quét ảnh, backend chặn lại với lỗi hết lượt khám.

### 6.3. Lỗi khớp lệnh chuyển khoản VietQR do phân biệt chữ hoa/thường
- **Vị trí:** `backend/src/main/java/com/aura/billing/repository/PaymentTransactionRepository.java` (dòng 19)
- **Bản chất lỗi:**
  Truy vấn `findByTransferContent` trên kiểu `VARCHAR` của PostgreSQL phân biệt chính xác hoa thường. Nếu ngân hàng trả về nội dung chữ thường `aura nap 1 kham...`, hệ thống không tìm thấy đơn hàng và không cộng lượt khám tự động cho khách hàng.

---

## 7. KIẾN TRÚC DỮ LIỆU, TRUY VẤN CSDL & ĐỒNG BỘ ĐA CỔNG (DATA ARCHITECTURE)

### 7.1. Xung đột dữ liệu giữa hai bảng hồ sơ bệnh nhân song song
- **Vị trí:** CSDL: `patient_medical_profiles` (V013) vs `patient_profiles` (V018); Code: `PatientProfileService.java`
- **Bản chất lỗi:**
  Hai bảng lưu trữ trùng lặp toàn bộ thông tin bệnh nhân. Khi Bác sĩ cập nhật hồ sơ qua `DoctorPatientController.updatePatient`, hệ thống chỉ lưu `patient_profiles`. Bệnh nhân đăng nhập vào Cổng Bệnh nhân (đọc từ `patient_medical_profiles`) vẫn thấy dữ liệu cũ. Khi Admin phân công bác sĩ, chỉ `patient_medical_profiles` được cập nhật, làm Bác sĩ không tìm thấy bệnh nhân trong danh sách tìm kiếm của mình.

### 7.2. Phân hệ Sàng lọc Hàng loạt (Bulk Screening) bị cô lập hoàn toàn
- **Vị trí:** `backend/src/main/java/com/aura/bulk/worker/BulkProcessingWorker.java` (dòng 119–217)
- **Bản chất lỗi:**
  Xử lý lô hàng loạt chỉ lưu vào bảng `bulk_screening_items`, không tạo bản ghi trong bảng `screenings`. Hậu quả: Bệnh nhân không xem được kết quả trên Cổng Bệnh nhân, Bác sĩ không mở được ca khám trên CDS Viewer và các báo cáo thống kê phòng khám bị thiếu toàn bộ dữ liệu này.

### 7.3. Hàng đợi Bulk Screening lưu trong RAM, mất toàn bộ dữ liệu khi khởi động lại
- **Vị trí:** `backend/src/main/java/com/aura/bulk/queue/BatchJobQueue.java` (dòng 22–24)
- **Bản chất lỗi:**
  API lấy trạng thái và danh sách đợt khám chỉ đọc từ bộ nhớ RAM (`ConcurrentHashMap`). Mặc dù có bảng trong CSDL, code không đọc từ CSDL để phục hồi. Khi server khởi động lại hoặc chạy clustering, toàn bộ lịch sử đợt khám biến mất và trả về 404.

### 7.4. Phản hồi API phân trang nặng >200MB làm tê liệt trình duyệt
- **Vị trí:** `backend/src/main/java/com/aura/screening/dto/ScreeningResponse.java` (dòng 125)
- **Bản chất lỗi:**
  Trong hàm tóm tắt danh sách `fromEntitySummary`, thuộc tính `imageUrl` chứa chuỗi Base64 15MB của ảnh gốc vẫn được gửi kèm. Danh sách 15 ca khám trả về một payload JSON nặng hơn 200MB, làm nghẽn mạng và sập trình duyệt của bác sĩ.

### 7.5. Mất log kiểm toán khi thao tác nghiệp vụ thất bại (Audit Log Rollback)
- **Vị trí:** `backend/src/main/java/com/aura/audit/aspect/AuditLogAspect.java`, `AuditLogService.java`
- **Bản chất lỗi:**
  `AuditLogService.logEvent` dùng chung giao dịch với nghiệp vụ chính (Propagation.REQUIRED). Khi có lỗi nghiệp vụ ném exception, toàn bộ giao dịch bị rollback, kéo theo bản ghi kiểm toán thất bại (FAILURE) cũng bị xóa khỏi CSDL, làm mất dấu vết tấn công hoặc sự cố y tế.

### 7.6. Phân quyền Role-Permission và Template thông báo của Admin là "Giao diện hình thức"
- **Vị trí:** `AdminRoleService.java`, `CustomUserDetailsService.java`, `UserNotificationService.java`
- **Bản chất lỗi:**
  Admin có thể bật tắt quyền và sửa template thông báo trên UI. Tuy nhiên, Spring Security chỉ kiểm tra tên vai trò thô, không hề kiểm tra quyền con; các service gửi thông báo dùng chuỗi tiếng Việt viết cứng, không hề nạp từ template. Các tính năng quản trị này hoàn toàn không có tác dụng trong thực tế.

---

## 8. MA TRẬN RỦI RO & BẢNG TỔNG HỢP LỖ HỔNG (DEFECT RISK MATRIX)

| Mã Lỗi | Nhóm Phân Loại | Vị Trí Phát Hiện Chính | Mức Độ | Tác Động Tiềm Tàng |
| :--- | :--- | :--- | :---: | :--- |
| **SEC-01** | Xác thực & Bảo mật | `AuthService.java` (Social Login) | **CRITICAL** | Chiếm quyền bất kỳ tài khoản nào (kể cả Admin) qua JWT rác |
| **SEC-02** | Xác thực & Bảo mật | `AuthService.java`, `AuthController.java` | **CRITICAL** | Lộ OTP trong API response, chiếm đoạt tài khoản tùy ý |
| **SEC-03** | Xác thực & Bảo mật | `RealtimeSseController.java` | **CRITICAL** | Nhận toàn bộ sự kiện y tế của Admin không cần đăng nhập |
| **SEC-04** | Quyền riêng tư | `WebSocketConfig.java` | **HIGH** | Nghe lén kênh tư vấn và hội chẩn ca khám qua WebSocket |
| **SEC-05** | Phân quyền (IDOR) | `ScreeningController.java`, `DoctorPatientController.java` | **HIGH** | Phòng khám đọc, sửa, xóa hồ sơ mọi bệnh nhân toàn viện |
| **SEC-06** | Xác thực & CSRF | `TrustedOriginFilter.java` | **HIGH** | Vượt qua bộ lọc Origin bằng URI `/refresh/` hoặc `//` |
| **CON-01** | Concurrency | `PatientSpecification.java` + `PatientProfile.java` | **CRITICAL** | Tìm kiếm phone hỏng, lộ 100% bệnh nhân khi search `"ENC"` |
| **CON-02** | Concurrency | `BillingService.java` (`grantOrExtendCredits`) | **CRITICAL** | Lost update làm mất lượt khám khi thanh toán & khám cùng lúc |
| **CON-03** | Concurrency | `BillingService.java` (`processPaymentSuccess`) | **CRITICAL** | Check-then-act nhân đôi lượt khám miễn phí cho khách hàng |
| **CON-04** | Concurrency | `RefreshTokenService.java` | **HIGH** | Mở 2 tab cùng lúc làm văng phiên đăng nhập trên mọi thiết bị |
| **CON-05** | Hiệu năng & DoS | `DoctorPatientController.java` (`size`) | **HIGH** | OOM Crash Backend khi gửi `?size=1000000` |
| **MED-01** | An toàn Y tế | `DicomIngestionService.java` | **CRITICAL** | Tự vẽ ảnh mắt hoạt họa giả khi không parse được DICOM thô |
| **MED-02** | An toàn Y tế | `DicomIngestionService.java` (Sequence) | **CRITICAL** | Sập parser và rò rỉ dữ liệu PHI bệnh nhân chưa ẩn danh |
| **MED-03** | Lâm sàng | `ScreeningService.java` (ETDRS) | **CRITICAL** | Phân độ ETDRS sai quy tắc 4-2-1, nguy cơ phẫu thuật sai chỉ định |
| **MED-04** | Lâm sàng | `mockAiEngine.ts`, `BatchItemDetailModal.tsx` | **CRITICAL** | Giả lập chỉ số AVR, CDR bằng hàm băm tên tệp ảnh |
| **MED-05** | Lâm sàng | `ScreeningService.java` (Override) | **CRITICAL** | Ghi đè mức nguy cơ cấp cứu nhãn khoa thành LOW |
| **MED-06** | Lâm sàng | `ScreeningService.java` (Stroke) | **HIGH** | Bỏ sót trục bệnh lý Đột quỵ, gộp chung điểm với Tim mạch |
| **MED-07** | Trải nghiệm & UI | `CDSDashboardPage.tsx` | **HIGH** | Nuốt lỗi lưu chẩn đoán của bác sĩ, hiển thị thành công ảo |
| **MED-08** | Lâm sàng | `screeningMapper.ts` (Platt) | **MEDIUM** | Ngụy tạo chỉ số hiệu chuẩn niềm tin Brier Score ở Frontend |
| **AI-01** | Bảo mật AI | `GeminiRetinalAiService.java` | **HIGH** | Prompt Injection qua tham số `eyePosition` |
| **AI-02** | Kỹ thuật AI | `GeminiRetinalAiService.java` | **HIGH** | Parser JSON mong manh, không hỗ trợ Structured Outputs |
| **AI-03** | Hiệu năng AI | `GeminiRetinalAiService.java` | **HIGH** | OOM Backend do nhân bản chuỗi Base64 ảnh lớn trong RAM |
| **AI-04** | Kiến trúc AI | `scripts/aura_clinical_agent.py` | **CRITICAL** | Script mồ côi, dùng thư viện giả định và chẩn đoán qua tên file |
| **FE-01** | Hiệu năng & RAM | `dynamicHeatmapEngine.ts` | **CRITICAL** | Rò rỉ bộ nhớ Canvas GPU >144MB/scan làm sập tab trình duyệt |
| **FE-02** | Hiệu năng & CPU | `DynamicHeatmapCanvas.tsx` | **CRITICAL** | Vòng lặp render vô tận làm CPU tăng 100% treo giao diện |
| **FE-03** | Trải nghiệm & API | `api.ts` (HTTP 204) | **CRITICAL** | Phản hồi 204 No Content bị coi là lỗi, hỏng mọi thao tác xóa |
| **FE-04** | Trải nghiệm | `LanguageContext.tsx` | **HIGH** | Cưỡng bức ghi đè `'vi'` làm mất khả năng đổi sang tiếng Anh |
| **FE-05** | Chuẩn dữ liệu | `types/cds.ts`, `RoleName.java` | **HIGH** | Enum `Unverified` và `PATIENT` gây lỗi 400/500 trên Backend |
| **FE-06** | Hạ tầng mạng | `websocketService.ts` | **HIGH** | Exponential backoff thiếu jitter gây bão kết nối lại |
| **FE-07** | Bộ nhớ RAM | `BatchUploadModal.tsx` | **HIGH** | Rò rỉ ~1GB RAM do không thu hồi `createObjectURL` |
| **BIL-01** | Doanh thu | `ScreeningService.java`, `BulkScreeningController.java` | **HIGH** | Phòng khám dùng dịch vụ miễn phí không bao giờ bị trừ credit |
| **BIL-02** | Nghiệp vụ tiền tệ | `CreditPurchaseModal.tsx` | **MEDIUM** | Client tự cộng credit ảo khi API báo lỗi thanh toán |
| **BIL-03** | Tự động hóa | `PaymentTransactionRepository.java` | **MEDIUM** | Lỗi khớp lệnh chuyển khoản VietQR do phân biệt hoa/thường |
| **DAT-01** | Kiến trúc CSDL | `PatientProfileService.java` | **HIGH** | Trùng lặp 2 bảng bệnh nhân gây bất đồng bộ 2 chiều |
| **DAT-02** | Kiến trúc CSDL | `BulkProcessingWorker.java` | **HIGH** | Sàng lọc hàng loạt bị cô lập, không tạo bản ghi ca khám |
| **DAT-03** | Tính sẵn sàng | `BatchJobQueue.java` | **MEDIUM** | Hàng đợi lưu trong RAM, mất sạch lịch sử khi restart server |
| **DAT-04** | Băng thông mạng | `ScreeningResponse.java` | **HIGH** | Trả về Base64 >200MB trong API danh sách làm nghẽn mạng |
| **AUD-01** | Tuân thủ y tế | `AuditLogAspect.java`, `AuditLogService.java` | **HIGH** | Log kiểm toán thất bại bị xóa sạch khi phương thức bị rollback |

---

## 9. LỘ TRÌNH KHẮC PHỤC CHUẨN HÓA (REMEDIATION ROADMAP)

Quá trình khắc phục cần được chia thành 4 giai đoạn rõ ràng khi bước vào giai đoạn chỉnh sửa code:

### Giai đoạn 1: Vá khẩn cấp các Lỗ hổng Bảo mật & Xác thực (P0 - Immediate)
1. **Xóa bỏ hoàn toàn trường `devOtp`** trong toàn bộ controller và service phản hồi API.
2. **Loại bỏ việc tự parse JWT không kiểm tra chữ ký** trong `AuthService.loginWithSocial`; tích hợp thư viện xác thực chữ ký chính thống (Google IdToken Verifier, v.v.).
3. **Chặn ngay tham số `role=ADMIN` trên URL** của SSE Stream `/api/v1/events/stream`; bắt buộc xác thực qua SecurityContext hoặc Bearer Token hợp lệ.
4. **Siết chặt phân quyền WebSocket STOMP**: Kiểm tra quyền truy cập ca khám và phân công bác sĩ trước khi cho phép subscribe kênh chat.

### Giai đoạn 2: Khắc phục An toàn Y tế & Chuẩn hóa Lâm sàng (P1 - Clinical Safety)
1. **Loại bỏ cơ chế vẽ ảnh hoạt họa giả lập** trong `DicomIngestionService`. Thay thế bằng thư viện y tế chuyên dụng (như `dcm4che`) để đọc đúng Native Pixel Data và xử lý Sequence Undefined Length.
2. **Sửa đổi công thức tính nguy cơ tổng thể**: Lấy giá trị lớn nhất $\max(\text{CardioRisk}, \text{DRRisk})$ để bảo vệ các ca cấp cứu nhãn khoa.
3. **Tách biệt phân loại Đột quỵ** thành một trục độc lập; chuẩn hóa phân độ ETDRS theo đúng bằng chứng tổn thương thực thể (Quy tắc 4-2-1).
4. **Hiển thị thông báo lỗi rõ ràng** khi Bác sĩ lưu chẩn đoán thất bại trong CDS Viewer, không nuốt lỗi âm thầm.

### Giai đoạn 3: Khắc phục Race Conditions, Billing & Bộ nhớ Frontend (P2 - Reliability)
1. **Bổ sung `@Version`** vào `Subscription` và `PaymentTransaction`; áp dụng `PESSIMISTIC_WRITE` đồng bộ cho cả hàm nạp tiền và trừ tiền.
2. **Thêm Grace Period (15–30s)** cho Refresh Token Rotation để tránh văng phiên đa tab.
3. **Sửa hàm `api.ts`** để xử lý an toàn phản hồi `204 No Content` và xóa header Authorization hết hạn khi gọi `/refresh`.
4. **Giải phóng kích thước Canvas** (`tempCanvas.width = 0; tempCanvas.height = 0`) và thu hồi `URL.revokeObjectURL()` trên Frontend.
5. **Thêm Randomized Jitter** vào cơ chế kết nối lại WebSocket.

### Giai đoạn 4: Tái cấu trúc CSDL & Đồng bộ Dữ liệu Hệ thống (P3 - Architecture)
1. **Hợp nhất hai bảng** `patient_profiles` và `patient_medical_profiles` thành một bảng duy nhất liên kết với `users(id)`.
2. **Tách việc lưu trữ ảnh** sang Object Storage (S3 / MinIO / Cloudinary) và chỉ lưu URL trong CSDL thay vì nhúng Base64 vào cột TEXT.
3. **Tự động sinh bản ghi `Screening`** sau khi xử lý lô hàng loạt để đưa vào luồng thẩm định lâm sàng chung.
4. **Cấu hình `Propagation.REQUIRES_NEW`** cho `AuditLogService.logEvent` để đảm bảo log kiểm toán không bị mất khi có lỗi nghiệp vụ.
5. **Bổ sung logic trừ credit cho phòng khám** khi thực hiện khám lẻ hoặc khám hàng loạt.

---
*Báo cáo được hoàn thiện bởi Đội đồng Kiểm toán Đa tác nhân Multi-Agent và lưu trữ tại `docs/BAO_CAO_KIEM_LOI_HE_THONG_TOAN_DIEN.md`.*
