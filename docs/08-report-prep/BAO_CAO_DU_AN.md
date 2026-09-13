# AURA — Tài liệu phân tích và ôn báo cáo toàn bộ dự án

Ngày kiểm tra: **09/09/2026**, giờ Việt Nam. Source nền: `main`, commit `07eabe4`, cộng các đổi tên migration đã sửa local trong phiên làm việc. Tài liệu này phục vụ giải thích source và demo; không phải xác nhận hệ thống đã hoàn thiện để triển khai thực tế.

Đọc nhanh trước khi báo cáo: [ON_TAP_NHANH.md](ON_TAP_NHANH.md). Tra đường dẫn và dòng code: [BAN_DO_SOURCE.md](BAN_DO_SOURCE.md).

## 1. Cách giới thiệu dự án trong 60–90 giây

> AURA là nền tảng web hỗ trợ quy trình sàng lọc sức khỏe mạch máu võng mạc. Hệ thống có bốn nhóm người dùng: bệnh nhân, bác sĩ, phòng khám và quản trị viên. Bệnh nhân quản lý hồ sơ và ảnh sàng lọc; bác sĩ xem hồ sơ, thẩm định kết quả; phòng khám quản lý thành viên và xử lý theo lô; admin quản lý tài khoản, phân công và cấu hình.
>
> Frontend dùng React và TypeScript. Backend dùng Java 21, Spring Boot, Spring Security và Spring Data JPA, lưu dữ liệu trong PostgreSQL. Dịch vụ AI được tách bằng Python FastAPI và giao tiếp với Java qua HTTP. FE gọi REST API của BE, không kết nối trực tiếp database.
>
> Bản hiện tại đã có nền tảng nghiệp vụ và giao diện, nhưng mức độ hoàn thiện khác nhau giữa các chức năng. Source AI chưa có model weights được cấu hình; một số phần vẫn là mô phỏng. Em sẽ trình bày rõ phần đã nối dữ liệu thật, phần đang mô phỏng và hướng hoàn thiện.

**Không nói**: “AI chính xác X%”, “đã đạt HIPAA/FDA”, “thanh toán VNPay thật”, “toàn bộ chức năng đã pass test”. Source và kiểm tra hiện tại không chứng minh những kết luận đó.

## 2. Kiến trúc và công nghệ thực tế

Luồng chính:

```text
Trình duyệt — React/TypeScript
    │ fetch(), JSON, Authorization: Bearer <access token>
    ▼
Vite proxy khi dev / Nginx proxy khi chạy Docker
    ▼
Java Spring Boot :8081
    ├─ Security filters → Controller → Service → Repository → PostgreSQL :5432
    └─ HTTP → FastAPI :8000 → bộ xử lý ảnh / ranh giới tích hợp model
```

- **FE**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, icon Lucide. Có Firebase SDK cho luồng đăng nhập xã hội. Đây là các họ phiên bản trong `frontend/package.json`; build thực tế dùng Vite **5.4.21**.
- **BE**: Java **21**, Spring Boot **3.5.3**, Spring Web MVC, Spring Security, Spring Data JPA/Hibernate, Bean Validation, Lombok, JJWT **0.13.0**, Springdoc OpenAPI **2.8.5**, Maven wrapper **3.9.16**. Nguồn: `backend/pom.xml` và `.mvn/wrapper/maven-wrapper.properties`.
- **Database**: PostgreSQL 16 trong Docker local; migration bằng Flyway. Cấu hình hiện tại mặc định `ddl-auto: update`, không phải `validate` như README backend cũ mô tả.
- **AI service**: FastAPI, Uvicorn, Pydantic, NumPy, Pillow, OpenCV. `requirements.txt` hiện không khai báo PyTorch/TensorFlow. Không lấy dòng mô tả “PyTorch” trong health endpoint làm bằng chứng có model.
- **Đóng gói**: Docker Compose gồm PostgreSQL, backend, frontend Nginx và AI service. Các thư mục `database`, `infrastructure`, `docs` chứa tài liệu và tài nguyên hỗ trợ.
- **Kiến trúc BE**: modular monolith — các module Java cùng một ứng dụng và database; AI là dịch vụ riêng. Không nên gọi mỗi package Java là một microservice.

Quy mô source đã đếm, không bao gồm build output: **185 file Java**, **39 file TS/TSX trong FE**, **6 file Python trong `ai-service/app`**, **19 controller Java**, **21 JPA entity**. Database local có **22 bảng**, bao gồm `flyway_schema_history`. Số file không phải số tính năng hoàn thiện.

## 3. Frontend: mở file nào và giải thích gì?

### 3.1. Điểm vào và điều hướng

1. `frontend/src/main.tsx`: mount React vào `#root`; bọc `App` bằng `AuthProvider` và `StrictMode`.
2. `frontend/src/context/AuthContext.tsx`: giữ thông tin user, login/logout/refresh; đổi vai trò BE `USER/DOCTOR/CLINIC/ADMIN` thành vai trò FE `patient/doctor/clinic/admin`.
3. `frontend/src/App.tsx`: nếu đang loading thì hiện loading; chưa login thì hiện `LoginPage`; đã login thì chọn portal theo role.
4. `frontend/src/components/SideNavBar.tsx`: menu theo vai trò; callback thay đổi `activeSection`.

**Câu cần thuộc:** “Ứng dụng hiện điều hướng bằng React state `activeSection` và render có điều kiện. Không dùng React Router trong cấu hình dependency hiện tại.”

### 3.2. Bốn màn hình chính

- `PatientPortalPage.tsx`: hồ sơ cá nhân, upload, lịch sử sàng lọc, kết quả, gói dịch vụ và hội thoại. Gọi `patientApi`, `screeningApi`, `billingApi`, `chatApi`.
- `CDSDashboardPage.tsx`: màn hình bác sĩ; chọn bệnh nhân, gọi `doctorApi`, upload cho bệnh nhân, xem kết quả, gửi đánh giá. Có nhánh mở `DoctorPatientListPage`.
- `ClinicPortalPage.tsx`: hồ sơ pháp nhân, thành viên bác sĩ, phân công, quản lý lô và tra cứu lô; dùng các component batch/analytics.
- `AdminAuditLogsPage.tsx`: tên file là audit nhưng chứa nhiều tab: tài khoản, vai trò, phòng khám, thông báo, AI config, audit. Không chỉ là trang log.

### 3.3. Component quan trọng

- `PatientUploader.tsx`: chọn mắt OD/OS, loại scan, chọn file, validate và preview. Dùng `FileReader.readAsDataURL`, rồi gọi callback `onStartAnalysis` của trang cha.
- `InteractiveCDSViewer.tsx`: hiển thị ảnh và các lớp tương tác; đây là UI, không phải model xử lý ảnh.
- `RiskAssessmentPanel.tsx`: trình bày điểm và mức nguy cơ từ object kết quả.
- `screeningMapper.ts`: chuyển dữ liệu `Screening` BE thành `AIRiskResult` FE. Đây là vị trí cần xem khi số liệu giữa BE và UI không khớp.
- `ClinicalValidationBar.tsx`, `DoctorDiagnosisModal.tsx`: lấy đánh giá bác sĩ; callback đưa dữ liệu lên trang cha để gửi API.
- `MedicalProfileModal.tsx`, `LabDocumentsPanel.tsx`: chỉnh hồ sơ và tài liệu xét nghiệm.
- `MedicalReportModal.tsx`: xem báo cáo, xuất CSV bằng `Blob`; in/PDF thông qua `window.print()`. Không phải một dịch vụ BE sinh PDF chuyên biệt.
- `Header.tsx`: user/menu và thông báo, mở kết nối SSE bằng `EventSource`.
- `BatchUploadModal.tsx`, `ClinicBatchProcessing.tsx`, `BatchItemDetailModal.tsx`: upload lô, polling tiến độ, xem từng ảnh.
- `ConsultationChatModal.tsx`: hội thoại mẫu trong state; khác với chat gọi API trong `PatientPortalPage.tsx`.

### 3.4. Các khái niệm React phải giải thích được

- **Component**: một phần UI có props và state riêng. Ví dụ `PatientUploader` tái sử dụng trong trang bệnh nhân và bác sĩ.
- **Props**: dữ liệu/hàm từ cha xuống con. Ví dụ `isAnalyzing`, `onStartAnalysis`.
- **State / useState**: dữ liệu thay đổi làm React render lại, như ô search, modal mở/đóng.
- **useEffect**: đồng bộ với hệ thống bên ngoài, như tải dữ liệu API hoặc đăng ký SSE; cần cleanup connection/timer khi unmount.
- **useMemo**: lưu kết quả tính toán theo dependencies, đang dùng cho lọc/sắp xếp/phân trang danh sách bệnh nhân.
- **Context**: chia sẻ user và các thao tác auth trong cây component.
- **Controlled input**: `value` lấy từ state; `onChange` cập nhật state.
- **TypeScript**: kiểm tra kiểu khi build; không tự validate dữ liệu người dùng ở runtime và không thay validation BE.

## 4. FE kết nối BE như thế nào?

File trung tâm: `frontend/src/services/api.ts`.

1. `API_BASE_URL` lấy từ `VITE_API_BASE_URL`; nếu trống thì gọi URL cùng origin.
2. `request()` thiết lập header, thêm `Authorization: Bearer ...` nếu có access token.
3. `fetch()` gửi HTTP; `credentials: "include"` cho phép gửi cookie phù hợp.
4. `apiFetch()` trả object `success/message/data`; lỗi mạng thành `NETWORK_ERROR`.
5. Nếu response là `401`, một số request sẽ gọi refresh và thử lại. `refreshRequest` gom các refresh đồng thời thành một Promise.
6. Các object `screeningApi`, `doctorApi`, `adminUserApi`… chỉ đóng gói endpoint/payload để component dễ gọi.

Ở chế độ dev, `frontend/vite.config.ts` chuyển `/api` tới `http://localhost:8081`. Ở Docker, `frontend/nginx.conf` chuyển `/api/` tới `http://backend:8081/api/` trong mạng Docker. Hai địa chỉ này không thay thế nhau tùy ý.

Ví dụ request login:

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"<email người dùng>","password":"<mật khẩu>"}
```

Đáp ứng được chuẩn hóa bởi `ApiResponse<T>`: `success`, `message`, `data`, `timestamp`; lỗi có mã và chi tiết tùy loại. Một số endpoint bulk trả body trực tiếp, nên không thể giả định mọi endpoint có envelope giống nhau.

**Không nhầm:** CORS là quy tắc trình duyệt về origin; JWT là xác thực; phân quyền là quyết định user có được thực hiện hành động/truy cập dữ liệu hay không. Ba việc khác nhau.

## 5. Ví dụ thầy hỏi: “Search bar nằm ở đâu?”

### 5.1. Search danh sách bệnh nhân: lọc ở FE

Mở `frontend/src/pages/DoctorPatientListPage.tsx`:

1. `normalizeVietnamese` khoảng dòng **32**: chuyển thường, Unicode NFD, bỏ dấu và đổi `đ` thành `d`.
2. `searchTerm` khoảng dòng **77**: state nội dung tìm kiếm.
3. `fetchPatientsFromDatabase` khoảng dòng **98**: gọi `doctorPatientApi.getPatients({ size: 100 })` để lấy dữ liệu ban đầu.
4. `filteredPatients` khoảng dòng **206**: dùng `.filter()` theo tên/MRN/SĐT/bác sĩ, các bộ lọc khác, rồi `.sort()`.
5. `paginatedPatients`: dùng `.slice()` lấy các phần tử của trang hiện tại.
6. Tìm `value={searchTerm}` để chỉ ô nhập; tìm `paginatedPatients.map` để chỉ phần render.

> “Khi gõ, onChange cập nhật searchTerm. React tính lại filteredPatients bằng useMemo; tên và truy vấn được chuẩn hóa không dấu trước khi includes. Sau đó danh sách được phân trang và render. Hiện search này lọc trên dữ liệu đã tải về, không gửi API mỗi ký tự.”

Hạn chế phải biết: chỉ lấy tối đa 100 hồ sơ ở request ban đầu; có fallback dữ liệu mock; ngày tham chiếu bộ lọc đang hardcode tháng 9/2026. Không nên khẳng định đây là server-side search toàn bộ database.

BE **có** khả năng search riêng trong `PatientSpecification.filterPatients`, nhưng helper `doctorApi.getPatients` hiện gửi tên tham số `q`, trong khi controller nhận `search`. Đây là lệch hợp đồng API cần sửa khi nối search từ FE xuống BE.

### 5.2. Search tài khoản admin: truy vấn xuống database

Chuỗi file để mở:

```text
AdminAuditLogsPage.tsx: input userSearchQuery, nhấn Enter → loadUsers()
  → api.ts: adminUserApi.getUsers(page, size, q, role)
  → GET /api/v1/admin/users?page=0&size=50&q=nam
  → AdminUserController.getAllUsers()
  → AdminUserService.getAllUsers()
  → UserRepository.search()
  → PostgreSQL → PageResponse → setUsersList() → render
```

`UserRepository.search()` dùng JPQL, `LEFT JOIN` qua user_roles/roles, lọc email hoặc fullName bằng `LIKE`, kết hợp `Pageable`. JPQL làm việc trên entity/thuộc tính Java; Hibernate chuyển thành SQL tương ứng.

**Trả lời mở rộng:** “Dữ liệu ít thì client-side filter đơn giản và nhanh sau lần tải đầu. Dữ liệu lớn cần search/phân trang server-side, thống nhất tên tham số, debounce nếu tìm khi gõ, và đánh giá index/query.”

## 6. Backend Java: tổ chức và kiến thức phải thuộc

Thư mục gốc: `backend/src/main/java/com/aura`. Entry point: `AuraApplication.java`.

- `auth`: đăng ký/đăng nhập, token, filter, kiểm tra truy cập bệnh nhân.
- `user`, `role`: tài khoản, vai trò, quan hệ user-role và danh mục quyền.
- `patient`: hồ sơ cá nhân, worklist profile, tài liệu xét nghiệm.
- `doctor`: phân công bác sĩ–bệnh nhân và endpoint nghiệp vụ bác sĩ.
- `screening`: tạo ca, gọi AI, lưu kết quả, thẩm định.
- `clinic`: đăng ký/phê duyệt phòng khám, thành viên, analytics.
- `bulk`: hàng đợi, worker, trạng thái lô, tổng hợp rủi ro/cảnh báo.
- `billing`: gói dịch vụ, giao dịch, subscription và credit.
- `chat`: lưu và đọc hội thoại.
- `notification`: thông báo người dùng, SSE, mẫu thông báo và chính sách.
- `admin`: quản lý tài khoản, role, phân công và AI config.
- `audit`, `feedback`: nhật ký và phản hồi bác sĩ.
- `common`: response, lỗi dùng chung; `system`: health endpoint.

Một luồng Java điển hình:

```text
HTTP → SecurityFilterChain → Controller → Service → JpaRepository → DB
                                            ↓
                                    DTO/Entity → JSON response
```

- `@RestController`: nhận/trả HTTP và JSON.
- `@RequestMapping`, `@GetMapping`, `@PostMapping`: ánh xạ đường dẫn và HTTP method.
- `@RequestBody`: JSON request thành object; `@PathVariable`: lấy `{id}`; `@RequestParam`: lấy query string.
- `@Valid`, `@NotBlank`, `@Size`, `@Pattern`: validate DTO; ví dụ password đăng ký yêu cầu 12–128 ký tự và đủ nhóm ký tự.
- `@Service`: nơi xử lý nghiệp vụ. Constructor injection giúp phụ thuộc rõ ràng và dễ mock test.
- `@Transactional`: Spring quản lý giao dịch quanh method; không có nghĩa mọi hệ thống ngoài như AI/thanh toán cũng rollback được.
- `@Entity`, `@Table`, `@Id`, `@JoinColumn`: ánh xạ object sang bảng và khóa.
- `JpaRepository<Entity, ID>`: cung cấp CRUD. Các tên hàm như `findByEmailIgnoreCase` có thể được Spring Data suy ra truy vấn.
- `@PreAuthorize`: kiểm tra quyền trước method; phải đồng bộ với security filter và kiểm tra quyền trên từng bản ghi.
- `@AuthenticationPrincipal`: lấy user đã xác thực; không tin patientId do FE gửi thay cho danh tính đăng nhập.
- `Optional`: diễn đạt dữ liệu có thể không có; `orElseThrow` chuyển thành lỗi phù hợp.
- `record`: dùng nhiều cho DTO; ngắn gọn, các thành phần được gán khi tạo.
- `GlobalExceptionHandler`: gom xử lý exception thành response lỗi nhất quán.

## 7. Năm luồng nghiệp vụ nên tập trình bày

### 7.1. Đăng nhập bằng email/password

`LoginForm` → `AuthContext.login` → `apiFetch('/api/v1/auth/login')` → `AuthController.login` → `AuthService.login` → `AuthenticationManager` → user details + BCrypt → tạo access JWT và refresh token.

- Password lưu dạng BCrypt, không lưu plaintext và không “giải mã” mật khẩu cũ.
- Access token hiện được FE giữ trong biến và `localStorage`.
- Refresh token raw được trả bằng cookie HttpOnly; database giữ hash SHA-256 trong `refresh_tokens`.
- `RefreshTokenService.rotate` khóa bản ghi qua repository, thu hồi token cũ, phát token mới; phát hiện tái sử dụng sẽ thu hồi các refresh token còn hoạt động.
- `JwtAuthenticationFilter` đọc Bearer header, kiểm tra JWT và load user hiện tại từ DB vào `SecurityContext`.
- `TrustedOriginFilter` kiểm soát origin cho luồng dùng refresh cookie. Mặc định access token 30 phút, refresh 7 ngày theo cấu hình hiện tại.

**Giới hạn:** social login hiện chỉ decode payload token/fallback email mà chưa xác minh token nhà cung cấp đúng cách. OTP lưu trong RAM, có thời hạn 5 phút, cooldown 60 giây, giới hạn 5 lần sai; mã được log ra console, chưa có gửi email thật trong service này.

### 7.2. Upload một ảnh và tạo ca sàng lọc

`PatientUploader` → `PatientPortalPage.handleStartAnalysis` → `screeningApi.create(imageUrl)` → `ScreeningController.createScreening` → `ScreeningService.createScreening` → FastAPI `/api/v1/predict` → lưu `Screening` → map về `AIRiskResult` → UI.

- Ảnh được đọc thành data URL/Base64, gửi trong JSON với trường `imageUrl`; không phải multipart upload trong luồng này.
- Service dựng payload `patientId`, `eye`, `imageBase64`; hiện hardcode mắt `OD` ở điểm gọi AI.
- Lời gọi AI là đồng bộ, timeout request 10 giây; luồng đơn ảnh không đi qua batch queue.
- Khi gọi AI lỗi hoặc kết quả không hợp lệ: lưu trạng thái `FAILED`, bỏ risk/confidence, lưu mô tả lỗi.
- Khi kết quả hợp lệ: đọc điểm/nhóm rủi ro/biomarkers/heatmap, đặt `ANALYZED`, lưu DB, gửi thông báo.
- Controller vẫn có message thành công khi tạo bản ghi; FE phải kiểm tra cả `data.status === 'FAILED'`, không chỉ `success`.

**Điểm cần nói thật:** source AI hiện `analyze_fundus_image()` luôn ném lỗi do chưa cấu hình weights. Container AI đang chạy không khớp source. Không có căn cứ kết luận upload mới tạo ra kết quả model thực đã được kiểm định.

### 7.3. Bác sĩ xem và thẩm định

`CDSDashboardPage` → `doctorApi` để tải bệnh nhân/ca → `DoctorDiagnosisModal` hoặc `ClinicalValidationBar` → `screeningApi.doctorReview` → `POST /api/v1/screenings/{id}/review` → `ScreeningService.addDoctorReview`.

Lưu quyết định `APPROVED/MODIFIED/REJECTED`, ghi chú, các mức nguy cơ điều chỉnh, ICD-10, thời gian ký và trạng thái `REVIEWED`; giữ trường nguy cơ AI ban đầu. Chữ ký hiện là **HMAC-SHA256 bằng secret của hệ thống**, không phải chứng thư số cá nhân/PKI của bác sĩ.

`PatientAccessService` có logic kiểm tra bác sĩ được phân công. Tuy nhiên một số endpoint doctor và list screening hiện chưa áp dụng đầy đủ; xem phần hạn chế. Cũng cần biết `handleSaveFeedback` ở FE chưa kiểm tra `response.success` trước khi hiện toast thành công.

### 7.4. Phòng khám upload theo lô

`BatchUploadModal`/`ClinicBatchProcessing` → `bulkScreeningApi` → `BulkScreeningController.createBulkBatchJob` → `PatientAnonymizerService` → `BatchJobQueue` → `BulkProcessingWorker` → `AiServiceClient` → cập nhật trạng thái → FE polling.

- Queue là `LinkedBlockingQueue` dung lượng 5.000, state nằm trong `ConcurrentHashMap`, bộ đếm `AtomicInteger`.
- Có 4 worker thread trong Java. Không dùng RabbitMQ/Kafka/Redis trong implementation này.
- State lô nằm trong bộ nhớ process, không phải bảng batch bền vững; restart BE có thể mất trạng thái.
- Mã định danh giả được tính bằng HMAC; hàm `stripDicomMetadataHeaders` hiện trả nguyên payload, chưa xử lý metadata DICOM.
- AI client gọi `/api/v1/segment-vessels`, endpoint này không có trong router FastAPI hiện tại; cấu hình `simulate-if-offline: true` cho phép fallback sinh số bằng `Random`.
- Vì thế luồng batch mô phỏng không được dùng làm bằng chứng có AI thật. Worker bắt lỗi nhưng chưa đánh dấu item lỗi đầy đủ trong nhánh catch, có nguy cơ tiến độ bị treo.

### 7.5. Mua gói, chat và thông báo

**Mua gói:** `CreditPurchaseModal` → billing API → `BillingService.purchaseOrRenew` → kiểm tra gói/vai trò → tạo giao dịch → `PaymentGateway` → cộng credit/gia hạn subscription. `AuraPaymentGatewayProvider` được `@Primary` chọn làm implementation; nó sinh mã giao dịch và trả thành công cho số tiền hợp lệ, không gọi mạng thanh toán thật.

**Chat:** bệnh nhân trong `PatientPortalPage` gọi API và lưu `chat_messages`; quyền hội thoại dựa vào quan hệ phân công trong `PatientAccessService`. Riêng `ConsultationChatModal` đang dùng tin mẫu và `setMessages` local — hai UI có mức tích hợp khác nhau.

**Thông báo:** service lưu `user_notifications` và dùng `SseEmitter`; FE nghe `NOTIFICATION`. Hiện FE gửi JWT bằng query `?token=...`, nhưng JWT filter chỉ đọc header Authorization; refresh cookie không tự xác thực stream. Đây là điểm lệch cần sửa trước khi khẳng định SSE chạy end-to-end.

### 7.6. Các module quản trị và hỗ trợ còn lại

**Phòng khám:** `ClinicProfileService` lưu hồ sơ, trạng thái `PENDING/APPROVED/REJECTED`, lý do từ chối và người duyệt. `ClinicMemberService` có bước kiểm tra phòng khám đã duyệt và bác sĩ thuộc phòng khám khi phân công; không nên suy rộng rằng điều kiện đó cũng đã được áp dụng ở bulk endpoint public.

**Admin:** `AdminUserService` tìm/sửa tài khoản, đổi vai trò, khóa/mở; có chặn vô hiệu hóa hoặc hạ vai trò admin hoạt động cuối cùng. `AdminRoleService` lưu mô tả role và danh mục permission. AI config được giữ trong `ConcurrentHashMap` của service, không phải cấu hình model bền vững hay pipeline tự huấn luyện.

**Audit:** `AuditLogService` có `logEvent`, đọc phân trang và xuất tối đa 1.000 log. Tìm kiếm source ứng dụng hiện chỉ thấy định nghĩa `logEvent`, chưa thấy nơi gọi để tự ghi mọi hành động. Bảng/log API tồn tại không chứng minh mọi thao tác đã được audit.

**Feedback:** `DoctorFeedbackService.submitFeedback` ghi phản hồi vào `doctor_feedback`; có API đọc theo bác sĩ/ca. Luồng `CDSDashboardPage.handleSaveFeedback` hiện gọi API review screening, không thấy gọi `feedbackApi` ở component. Cần phân biệt thẩm định ca với tập dữ liệu phản hồi phục vụ huấn luyện; lưu feedback cũng không đồng nghĩa model tự retrain.

## 8. Database: quan hệ và nơi lưu dữ liệu

Các nhóm bảng hiện có:

- **Danh tính**: `users`, `roles`, `user_roles`, `refresh_tokens`, `role_permissions`.
- **Bệnh nhân và phân công**: `patient_medical_profiles`, `patient_profiles`, `patient_lab_documents`, `doctor_patient_assignments`.
- **Sàng lọc và tương tác**: `screenings`, `doctor_feedback`, `chat_messages`, `audit_logs`.
- **Phòng khám**: `clinic_profiles`, `clinic_members`.
- **Dịch vụ/thanh toán**: `service_package`, `subscription`, `payment_transaction`.
- **Thông báo**: `user_notifications`, `notification_templates`, `communication_policies`.
- **Migration**: `flyway_schema_history`.

Quan hệ cần thuộc:

```text
users 1—N user_roles N—1 roles
users 1—N refresh_tokens
users 1—N screenings (patient_id; doctor_id cho người thẩm định)
doctor users 1—N doctor_patient_assignments N—1 patient users
users — patient_medical_profiles (hồ sơ cá nhân gắn user)
users 1—N patient_lab_documents
clinic users 1—N clinic_members N—1 doctor users
users 1—N subscription N—1 service_package
users 1—N payment_transaction N—1 service_package
users 1—N user_notifications
```

Lưu ý: một số quan hệ trong entity screening biểu diễn bằng UUID thay vì `@ManyToOne`; hãy phân biệt quan hệ logic/database với cách ánh xạ Java.

`patient_medical_profiles` và `patient_profiles` là **hai bảng khác nhau**: bảng đầu phục vụ hồ sơ y tế cá nhân gắn tài khoản; bảng sau phục vụ worklist và có thể có `user_id` null. Sự tồn tại của hồ sơ bệnh nhân không đồng nghĩa có tài khoản đăng nhập. MRN là mã hồ sơ, khác UUID và khác email đăng nhập.

Ảnh screening hiện lưu `imageUrl`/data URL và heatmap trong dữ liệu screening; tài liệu xét nghiệm lưu bytes trong PostgreSQL (`BYTEA`). Không mô tả luồng hiện tại là đã upload ảnh lên Supabase Storage nếu không chỉ ra được implementation.

Database local thời điểm kiểm tra có **9 tài khoản**: 6 USER, 1 DOCTOR, 1 CLINIC, 1 ADMIN. Đây là số tài khoản, không phải số bệnh nhân hiển thị trên worklist có dữ liệu mẫu.

### Migration vừa sửa local

- Khôi phục `V007__seed_clinic_role.sql` đúng lịch sử DB cũ.
- Đổi migration clinical review mới thành `V022`.
- Giữ `V017` lab documents, `V018` AI/doctor risk, `V019` clinic.
- Chuyển các file trùng thành `V023` patient profiles, `V024` screening metadata, `V025` seed screening.
- Sửa `V021_...` thành `V021__...` để Flyway nhận diện.

Database local có sẵn demo users đã migrate thành công. **Database hoàn toàn mới vẫn lỗi ở V025**, vì migration seed ca sàng lọc tham chiếu UUID demo users không được tạo trong chuỗi migration. Việc sửa số migration đã xử lý lỗi khởi động trên DB hiện có, chưa giải quyết khả năng cài mới toàn bộ.

## 9. Phần AI: nên trình bày đến mức nào?

Mở `ai-service/app/main.py` → `api/v1/endpoints/predict.py` → `services/model_engine.py`.

- FastAPI định nghĩa route và Pydantic schema cho request/response.
- `/predict` nhận Base64, decode thành ảnh RGB/NumPy, gọi model engine.
- `/predict/upload` nhận multipart file, đọc bằng Pillow.
- Source `/predict/bulk` trả `501` vì chưa cấu hình.
- Source `/model-info` trả `available: false`; `VERSION = None`.
- `RetinalImageProcessor` có hàm crop viền đen, resize 512×512, CLAHE, normalize mean/std và chuyển HWC sang CHW. **Các hàm chuẩn bị tensor tồn tại không có nghĩa đang được chạy trong model engine hiện tại.**
- Implementation CLAHE chuyển RGB sang LAB và tác động lên kênh L; comment “kênh xanh lá” không đúng với code.
- Không tìm thấy quá trình load/training model trong 6 file ứng dụng AI đang phân tích. Không có kết quả đánh giá accuracy/AUC được kiểm chứng trong lượt kiểm tra này.

> Câu trả lời an toàn: “Nhóm đã tách hợp đồng và dịch vụ tích hợp AI. Bản source này chưa cấu hình trọng số model nên chưa thể báo cáo độ chính xác hoặc khả năng chẩn đoán. Các số liệu demo phải được ghi là dữ liệu mẫu/mô phỏng.”

Không biến các thông điệp y khoa hardcode trong UI/source thành bằng chứng chuyên môn hoặc khuyến cáo lâm sàng đã được xác thực.

## 10. Kết quả kiểm tra thực tế và hạn chế ưu tiên

### Đã chạy trong lượt phân tích

- **FE build**: `npm.cmd run build` thành công, exit code 0; TypeScript và Vite build qua. Bundle JS chính khoảng **723,71 kB**, gzip **175,42 kB**; có warning chunk lớn hơn 500 kB.
- **BE test**: `mvnw.cmd -B test` thất bại: **109 test, 70 qua, 0 assertion failure, 39 error, 0 skipped**. 39 error thuộc các nhóm integration/repository không khởi tạo được context do seed `V025` vi phạm FK `screenings_patient_id_fkey` trên DB test mới. Không được nói “109 test pass” hoặc “39 lỗi nghiệp vụ độc lập”.
- **BE local health**: `/api/v1/system/health` trả HTTP 200 và `UP`.
- **FE Docker proxy**: `http://localhost:3000/api/v1/system/health` trả **502**, vì Nginx hướng tới container BE đã dừng trong khi Java đang chạy trên host.
- **AI container**: `/api/v1/model-info` trả metadata model khác source. Đây là bằng chứng image/container chưa đồng bộ, không phải bằng chứng model thực hay độ chính xác.
- Chưa thực hiện một vòng kiểm thử browser đầy đủ tất cả các vai trò; build thành công không chứng minh các chức năng UI đều đúng.

### Những điểm cần biết khi bị hỏi sâu

1. **Social login chưa xác minh token**: `AuthService.loginWithSocial` decode Base64/fallback email và phát token nội bộ. Cần xác minh chữ ký, issuer, audience, hạn dùng và danh tính từ provider trước khi dùng ngoài demo.
2. **Quyền trên dữ liệu bệnh nhân chưa nhất quán**: `PatientAccessService` có kiểm tra phân công nhưng `DoctorPatientController` một số route chỉ kiểm tra role; service đọc/ghi theo patientId không kiểm tra assignment. `ScreeningController.getScreenings` cho doctor đọc toàn bộ; search worklist cũng chưa giới hạn theo doctor. Đây là kết luận đọc source, chưa thử truy cập trái quyền trên dữ liệu người dùng.
3. **Bulk public**: `SecurityConfig` đang `permitAll` với `/api/v1/bulk-screening/**`; lô nhận clinicId từ payload, lưu global trong RAM. Không được khẳng định tenant isolation hoàn chỉnh.
4. **Danh mục quyền động chưa chứng minh enforcement**: có bảng `role_permissions`, nhưng authority trong `AuraUserPrincipal` vẫn dựng từ role. Tắt một permission ở màn admin không đồng nghĩa mọi endpoint đã kiểm tra permission đó.
5. **AI và thanh toán có mô phỏng**: single-image source tắt model; batch có Random fallback; payment provider tự trả success. Phải ghi rõ demo.
6. **SSE chưa khớp cơ chế token**: query token FE không được filter BE đọc. Luồng thông báo realtime chưa được xác nhận hoạt động end-to-end.
7. **Dữ liệu và ngưỡng risk chưa thống nhất**: `screeningMapper` dùng confidence×100 làm overall score, mặc định vài trường về 0/Low và glaucoma về Low; BE chia risk ở 40/65/80, worklist dùng 45/75. Confidence không nên được mặc nhiên đồng nhất với risk score.
8. **Metadata upload chưa truyền đầy đủ**: UI có chọn mắt/loại scan nhưng API helper thường chỉ gửi `imageUrl`, service hardcode OD. Hỗ trợ extension DICOM ở UI không chứng minh đọc DICOM hoàn chỉnh ở AI.
9. **Tạo bệnh nhân sai route ở helper**: `doctorApi.create` POST tới `/api/v1/patient/profile`, trong khi controller này không có POST tạo hồ sơ; route tạo worklist thực là POST `/api/v1/doctor/patients`. Search helper cũng gửi `q` trong khi controller nhận `search`.
10. **Dữ liệu demo lẫn dữ liệu thật**: `DoctorPatientListPage` fallback `MOCK_PATIENTS`, chèn/điều chỉnh hồ sơ Nam và số ca tối thiểu 9; `ClinicAnalyticsService` trả số cố định. Không coi số trên dashboard là báo cáo DB đã đối soát.
11. **Seed làm hỏng cài mới**: V025 phụ thuộc users demo, gây 39 test error. Nên tách demo seed khỏi migration schema hoặc thiết kế migration chạy được trên DB sạch; tránh sửa checksum tùy tiện ở DB đã áp dụng.
12. **Bảo mật triển khai cần hoàn thiện**: có secret mặc định/hardcode; access token ở localStorage; HTTP local; DICOM stripping chưa thực hiện. Những annotation/comment HIPAA không thay thế đánh giá tuân thủ.
13. **Envelope bulk chưa khớp FE**: controller bulk trả DTO/list trực tiếp; `apiFetch` không bọc lại thành `{success,data}`, trong khi polling ở `ClinicBatchProcessing` kiểm tra `res.success && res.data`. Điều này có thể làm UI bỏ qua response HTTP 200 hợp lệ. Cần thống nhất hợp đồng response trước demo lô.

Đây là báo cáo phân tích; lượt này không tự sửa các vấn đề nghiệp vụ/bảo mật nói trên. Mỗi điểm cần có patch và kiểm thử riêng.

## 11. Cách chạy để chuẩn bị demo đúng source

**Chọn một chế độ nhất quán.** Hiện BE đã chạy local :8081, PostgreSQL chạy Docker :5432. FE Docker :3000 đang trỏ sai đích cho chế độ này.

Để dùng FE dev với BE local mà không đụng cổng 3000 đang có container:

```powershell
# Terminal tại thư mục gốc dự án; giữ BE local hiện có
cd frontend
npm.cmd run dev -- --port 5173
```

Mở `http://localhost:5173`. Vite vẫn proxy `/api` sang BE :8081; cổng 5173 đã có trong CORS allowlist. Nếu cần cài dependency, dùng `npm.cmd install` trước. `npm.cmd` tránh lỗi PowerShell execution policy với `npm.ps1` trên máy này.

Nếu BE local đã dừng:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Không chạy thêm BE khi cổng 8081 đã có process. Nếu vừa đổi tên migration mà `target/classes` còn bản cũ, cần build sạch bằng `mvnw.cmd clean spring-boot:run` khi ứng dụng đã dừng.

AI Docker hiện không khớp source. Nếu chạy AI từ source mới, phải chấp nhận trạng thái chưa có model; không dựa vào metadata container cũ để giới thiệu source mới.

Checklist trước buổi báo cáo:

- Mở đúng workspace và bản source đang trình bày; nhớ các đổi tên migration còn ở local.
- Kiểm tra `http://localhost:8081/api/v1/system/health` và `/api` qua FE đang dùng.
- Mở DevTools → Network, bật Preserve log nếu cần giải thích request.
- Chuẩn bị sẵn các file trong bản đồ source, dùng Ctrl+P và Ctrl+G tới dòng.
- Không đưa mật khẩu cá nhân, access token hoặc cookie vào slide/báo cáo chụp màn hình.
- Chọn một tài khoản phù hợp dữ liệu demo; tài khoản cá nhân và `patient@aura.com` là hai user khác nhau dù tên gần giống.
- Không hứa demo live model/thanh toán/email thật; nếu trình bày mock phải ghi nhãn rõ.

## 12. Kịch bản trình bày 10 phút và thứ tự ôn

**Phút 0–1:** giới thiệu bài toán, 4 vai trò, giới hạn hỗ trợ sàng lọc.

**Phút 1–2:** kiến trúc React → REST → Spring Boot → PostgreSQL và dịch vụ FastAPI.

**Phút 2–4:** minh họa login hoặc search admin; mở Network và lần theo 4 lớp Java.

**Phút 4–6:** mở search bệnh nhân: state → input → filter/useMemo → slice → render. So sánh server-side search.

**Phút 6–8:** giải thích upload và bác sĩ review bằng source; chỉ rõ nơi gọi AI, nơi lưu DB và nơi kiểm tra trạng thái FAILED.

**Phút 8–9:** database, FK, migration, JWT/BCrypt và phân quyền.

**Phút 9–10:** kết quả build/test, phần mô phỏng và kế hoạch hoàn thiện.

Nếu còn 2 giờ ôn: 20 phút kiến trúc/stack; 30 phút search FE + API; 30 phút login/upload/review Java; 20 phút database/migration; 20 phút tự hỏi đáp và thao tác mở source. Ưu tiên hiểu một luồng đầu–cuối thật chắc hơn học thuộc tên toàn bộ file.

Hướng hoàn thiện nên trình bày: đồng bộ source/container; tách seed demo để DB sạch migrate được; sửa xác minh social token và kiểm tra assignment; thống nhất request/response giữa FE–BE; loại bỏ hoặc ghi nhãn mock; sau đó tích hợp model/payment/email thực và chạy lại integration tests.
