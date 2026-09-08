# AURA — Ôn nhanh trước khi thầy hỏi source

Đối chiếu source local ngày 09/09/2026. [Báo cáo đầy đủ](BAO_CAO_DU_AN.md) · [Mở đúng file/dòng](BAN_DO_SOURCE.md).

## 1. Mười ý phải nhớ

1. FE: **React + TypeScript + Vite + Tailwind**, không có React Router/Redux/Axios trong dependency hiện tại.
2. BE: **Java 21, Spring Boot 3.5.3, Spring Security, JPA/Hibernate**, Maven.
3. DB: **PostgreSQL**, schema version bằng **Flyway**.
4. AI: **FastAPI**, source hiện **chưa có model weights**, suy luận bị tắt.
5. FE gọi **fetch → REST API**, không gọi SQL trực tiếp.
6. BE đi qua **Controller → Service → Repository → DB** sau security filters.
7. Password là **BCrypt**; access token là **JWT**; refresh token raw ở **HttpOnly cookie**, hash ở DB.
8. Search bệnh nhân là **lọc FE**; search user admin là **query BE/DB**.
9. Build FE qua; BE test **70 qua / 39 error / tổng 109**, lỗi migration demo seed trên DB mới.
10. Batch AI, payment, một số dashboard/chat có **mô phỏng**; không trình bày là tích hợp thực hoàn chỉnh.

## 2. Nếu thầy bảo “mở code phần này”

**Search bệnh nhân:** Ctrl+P `DoctorPatientListPage.tsx` → tìm `searchTerm` → `value={searchTerm}` → `filteredPatients` → `paginatedPatients` → `.map`.

**Search admin:** Ctrl+P `AdminAuditLogsPage.tsx` → `loadUsers` → `api.ts`/`adminUserApi` → `AdminUserController` → `AdminUserService` → `UserRepository.search`.

**FE nối BE:** `api.ts` → `request`/`fetch` → `vite.config.ts`/`proxy` → controller tương ứng.

**Login:** `LoginForm.tsx` → `AuthContext.tsx`/`login` → `AuthController.java` → `AuthService.java`/`login` → `SecurityConfig.java`/`passwordEncoder`.

**Upload:** `PatientUploader.tsx` → `PatientPortalPage.tsx`/`handleStartAnalysis` → `api.ts`/`screeningApi.create` → `ScreeningController` → `ScreeningService` → Python `predict.py` → `model_engine.py`.

**Bác sĩ đánh giá:** `CDSDashboardPage.tsx`/`handleSaveFeedback` → `screeningApi.doctorReview` → `ScreeningController.reviewScreening` → `ScreeningService.addDoctorReview`.

**Phân quyền:** `SecurityConfig.java` → `@PreAuthorize` ở controller → `PatientAccessService.java`; nêu thêm các route chưa kiểm tra assignment đầy đủ.

**Hồ sơ:** `MedicalProfileModal.tsx` → `patientApi` → `PatientProfileController` → `PatientProfileService` → `PatientMedicalProfileRepository`.

**Batch:** `ClinicBatchProcessing.tsx` → `BulkScreeningController` → `BatchJobQueue` → `BulkProcessingWorker` → `AiServiceClient`.

**Database:** mở entity đúng module → repository → `backend/src/main/resources/db/migration`.

## 3. Bộ 35 câu hỏi và câu trả lời ngắn

### 1. Dự án giải quyết vấn đề gì?

Hỗ trợ quy trình sàng lọc qua ảnh võng mạc: quản lý hồ sơ, ảnh, kết quả, bác sĩ thẩm định và tổ chức phòng khám. Đây là hệ thống hỗ trợ, không phải chẩn đoán tự động thay bác sĩ.

### 2. Em dùng framework gì?

FE dùng React với TypeScript, Vite để dev/build và Tailwind để viết giao diện. BE dùng Spring Boot 3.5.3 với Java 21; Security lo xác thực/phân quyền, Data JPA lo persistence. AI service dùng FastAPI.

### 3. React khác TypeScript và Vite thế nào?

React xây giao diện bằng component; TypeScript bổ sung kiểm tra kiểu cho JavaScript; Vite chạy dev server và build tài nguyên. Tailwind cung cấp utility class cho CSS.

### 4. Tại sao tách FE và BE?

FE tập trung trải nghiệm người dùng. BE kiểm soát nghiệp vụ, quyền truy cập và dữ liệu. Giao tiếp qua API giúp thay UI hoặc tích hợp client khác mà không viết lại toàn bộ nghiệp vụ.

### 5. BE có phải microservices không?

Phần Java là modular monolith: nhiều package nghiệp vụ trong một ứng dụng. Python AI là dịch vụ riêng. Không phải mỗi controller là một microservice.

### 6. Search bar ở đâu?

Với danh sách bệnh nhân, ở DoctorPatientListPage: state searchTerm, input controlled, filteredPatients lọc và chuẩn hóa tiếng Việt, paginatedPatients chia trang rồi render. Với admin search là loadUsers gọi API xuống DB.

### 7. Gõ “nguyen” sao tìm được “Nguyễn”?

normalizeVietnamese đưa chuỗi về chữ thường, Unicode NFD, bỏ dấu kết hợp và đổi đ thành d, sau đó dùng includes. Đây là logic FE của màn bệnh nhân.

### 8. useState và useMemo ở search để làm gì?

useState giữ từ khóa/bộ lọc. useMemo tính danh sách lọc dựa trên dependencies; khi từ khóa đổi, tính lại rồi render. useMemo không tự gửi API và không phải cơ chế bảo mật.

### 9. Phân trang ở đâu?

Màn bệnh nhân chia trên FE bằng slice sau filter/sort. Admin gửi page/size xuống BE, dùng Pageable/Page và trả PageResponse. Cần nói đúng màn hình đang demo.

### 10. Có 10.000 bệnh nhân thì làm sao?

Không tải hết để lọc FE. Dùng server-side search/pagination, thống nhất search params, giới hạn page size, cân nhắc debounce và đánh giá query/index. Bản hiện tại màn bệnh nhân mới lấy tối đa 100 ở lần tải đầu.

### 11. FE gọi BE bằng gì?

Native fetch trong api.ts, không phải Axios. apiFetch thêm Bearer token, cookie, xử lý JSON/lỗi/refresh; Vite proxy chuyển /api tới localhost:8081 khi dev.

### 12. REST API là gì trong dự án này?

Các endpoint HTTP theo tài nguyên: GET lấy dữ liệu, POST tạo hoặc thực hiện tác vụ, PUT/PATCH cập nhật, DELETE xóa. Ví dụ POST /api/v1/screenings tạo ca; GET lấy danh sách.

### 13. Controller, Service và Repository khác nhau thế nào?

Controller nhận HTTP và DTO; Service xử lý nghiệp vụ; Repository truy cập dữ liệu. Ví dụ search user đi từ AdminUserController qua AdminUserService đến UserRepository.search.

### 14. Dependency injection là gì?

Spring tạo và cấp dependency cho bean qua constructor. Service không tự new repository. Cách này giúp tách trách nhiệm và dễ thay dependency bằng mock khi unit test.

### 15. JPA và Hibernate khác nhau thế nào?

JPA là chuẩn persistence Java; Hibernate là implementation ORM được dùng. Spring Data JPA cung cấp repository abstraction để giảm code CRUD.

### 16. Sao không viết SQL cho mọi hàm?

Spring Data suy ra nhiều query từ tên method và có sẵn CRUD. Khi cần query cụ thể thì dùng @Query/JPQL hoặc Specification. UserRepository.search là ví dụ JPQL.

### 17. DTO khác Entity thế nào?

DTO mô tả dữ liệu vào/ra API; entity ánh xạ bảng DB. Tách DTO giúp tránh lộ field nội bộ và giảm ràng buộc API với schema. Bản này vẫn có endpoint trả entity Screening trực tiếp, nên chưa tách tuyệt đối.

### 18. @Transactional làm gì?

Gom thao tác database thành giao dịch theo cấu hình rollback. Ví dụ cập nhật role hoặc subscription. Gọi HTTP ngoài hệ thống không tự rollback cùng DB; cần thiết kế riêng.

### 19. Mật khẩu lưu thế nào?

Lưu hash BCrypt có salt, không lưu plaintext. Login dùng PasswordEncoder kiểm tra. Quên mật khẩu phải đặt mới, không đọc ngược từ hash.

### 20. Access token và refresh token khác gì?

Access JWT dùng gọi API, thời hạn ngắn. Refresh token dùng xin access mới, có xoay vòng và thu hồi; raw token nằm trong HttpOnly cookie, DB giữ hash. FE hiện lưu access token ở localStorage.

### 21. Authentication và authorization khác nhau thế nào?

Authentication xác định bạn là ai. Authorization kiểm tra bạn được làm gì và được xem bản ghi nào. Có role DOCTOR không tự động được xem mọi bệnh nhân.

### 22. Dự án kiểm tra bác sĩ được phân công ở đâu?

PatientAccessService truy vấn doctor_patient_assignments trạng thái ACTIVE. Tuy vậy các endpoint hiện chưa áp dụng nhất quán; không được khẳng định mọi đường truy cập đã bảo vệ đầy đủ.

### 23. Vì sao 401 khác 403?

401 là thiếu/sai/hết hạn thông tin xác thực; 403 là đã có danh tính nhưng không đủ quyền. Security entry point và access denied handler chuẩn hóa response tương ứng.

### 24. CORS và proxy có vai trò gì?

CORS kiểm soát truy cập khác origin trong trình duyệt. Proxy chuyển request tới server đích; Vite khi dev, Nginx khi Docker. CORS không thay xác thực hay phân quyền.

### 25. Upload ảnh được gửi như thế nào?

PatientUploader đọc FileReader thành Base64 data URL, truyền callback lên trang cha rồi gửi imageUrl trong JSON. Backend lấy Base64 gọi FastAPI. Upload tài liệu xét nghiệm là luồng multipart riêng.

### 26. AI chạy mô hình gì? Độ chính xác bao nhiêu?

Source hiện chưa cấu hình weights; model engine chủ động báo lỗi. Không có cơ sở báo cáo tên backbone đang chạy hay accuracy thực. Metadata container cũ và mô phỏng không chứng minh hiệu năng model.

### 27. Nếu AI lỗi thì sao?

Luồng đơn ảnh đánh dấu Screening FAILED, xóa risk/confidence và lưu thông tin lỗi; FE kiểm tra trạng thái để thông báo. Luồng batch còn fallback mô phỏng, cần ghi rõ sự khác biệt.

### 28. Chữ ký bác sĩ thực hiện thế nào?

Service tạo HMAC-SHA256 từ dữ liệu review bằng secret hệ thống, lưu thời gian ký và người ký. Chưa phải chữ ký số dựa trên chứng thư cá nhân/PKI.

### 29. Batch xử lý song song thế nào?

LinkedBlockingQueue nhận task; 4 worker thread lấy task và gọi AI client. ConcurrentHashMap lưu trạng thái, AtomicInteger đếm. Dữ liệu queue/state nằm RAM, chưa bền vững sau restart.

### 30. Đã tích hợp thanh toán thật chưa?

Chưa. Có interface PaymentGateway và nghiệp vụ transaction/subscription, nhưng implementation @Primary đang sinh reference rồi trả success, không gọi VNPay/MoMo thật.

### 31. Chat/notification đã realtime chưa?

Chat bệnh nhân có API lưu DB; modal chat khác còn local mock. Có SSE notification nhưng FE truyền token bằng query, filter BE chỉ đọc header, nên luồng stream hiện còn vấn đề tích hợp.

### 32. Có bao nhiêu bảng và tài khoản?

Database local lúc kiểm tra có 22 bảng kể cả Flyway history, 21 entity Java, 9 tài khoản: 6 USER, 1 DOCTOR, 1 CLINIC, 1 ADMIN. Số hồ sơ/mẫu trên UI không bằng số user.

### 33. Vì sao phải dùng migration?

Để quản lý thứ tự/version thay đổi schema và tái tạo DB. Flyway lưu lịch sử/checksum. Vừa sửa trùng số migration và khôi phục V007 cũ; DB sạch còn lỗi seed tham chiếu demo user chưa tồn tại.

### 34. Kiểm thử ra sao?

FE đã qua TypeScript/Vite build. BE có JUnit/Mockito và Testcontainers PostgreSQL. Lượt chạy hiện tại 109 test: 70 qua, 39 lỗi khởi tạo do V025 seed, không phải toàn bộ test pass. Test có mock chỉ chứng minh phạm vi được mock, không chứng minh dịch vụ ngoài chạy thật.

### 35. Nếu có thời gian sẽ ưu tiên gì?

Đồng bộ source/container và sửa migration DB sạch; xác minh social token và siết quyền bệnh nhân/bulk; thống nhất API FE–BE, trạng thái lỗi và risk score; tách mock; tích hợp model/payment/email thực; hoàn thiện integration tests.

## 4. Cách trả lời khi chưa nhớ dòng code

> “Em sẽ lần theo thao tác: component nhận sự kiện ở FE, gọi helper API, sang controller nhận endpoint, service xử lý và repository truy vấn. Em mở từng phần để giải thích chính xác.”

Dùng Ctrl+Shift+F tìm chữ trên nút/placeholder, sau đó tìm tên handler. Với BE, tìm phần URL hoặc `@GetMapping`/`@PostMapping`. Không đoán theo tên file vì một số file chứa nhiều chức năng.

## 5. Năm câu không nên nói nhầm

- “Có giao diện là đã có backend đầy đủ.” → Kiểm tra event có gọi API và API có ghi DB không.
- “API success nghĩa là AI đã phân tích thành công.” → Cần kiểm tra thêm Screening.status và dữ liệu kết quả.
- “Mọi dữ liệu Nam trên màn hình là tài khoản Gmail của em.” → Có user demo riêng và dữ liệu mock riêng.
- “Docker đang chạy là code vừa pull.” → Image có thể cũ; AI container hiện đã được xác nhận khác source.
- “Health UP nghĩa là mọi tính năng chạy.” → Health chỉ xác nhận endpoint phản hồi; không chứng minh model/payment/search/auth end-to-end.

## 6. Chuẩn bị màn hình demo

BE local hiện ở 8081; FE Docker ở 3000 đang có lỗi proxy 502. Với BE local còn chạy, mở terminal trong `frontend`, chạy `npm.cmd run dev -- --port 5173`, rồi mở `http://localhost:5173` để dùng đúng proxy Vite tới BE local.

Chuẩn bị DevTools Network và 6 file: `App.tsx`, `api.ts`, `DoctorPatientListPage.tsx`, `AuthService.java`, `ScreeningService.java`, `UserRepository.java`. Không mở token/mật khẩu khi chia sẻ màn hình.
