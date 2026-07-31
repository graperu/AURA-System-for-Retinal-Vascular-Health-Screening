# Kiến trúc AURA Milestone 1

## Tổng quan

```text
Browser
  │
  │ HTTP/REST
  ▼
React + TypeScript
  │
  │ /health, /api/v1/system/info, /api/v1/analyses/demo
  ▼
Java 21 + Spring Boot + Maven
  ├── Spring Data JPA ──> PostgreSQL
  └── RestClient ───────> Python FastAPI AI Core
                              ├── /health
                              └── /api/v1/analyze
```

Backend Spring Boot là API chính. Frontend không được gọi trực tiếp AI Core. Backend chịu trách nhiệm validation, chuẩn hóa response và che giấu địa chỉ nội bộ của AI Core.

## Ranh giới backend

- `analysis`: gom controller, service, client, DTO, entity và repository của luồng phân tích.
- `system`: gom controller, service và DTO cho health/system info.
- `common/config`: cấu hình CORS, timeout và REST client dùng chung.
- `common/exception`: chuyển lỗi thành response thống nhất.
- `common/response`: chứa `ApiEnvelope` và `ApiError` dùng chung giữa các feature.

Cấu trúc này thể hiện OOP ở mức nền tảng nhưng không thêm CQRS, event bus hoặc microservice nghiệp vụ trong Milestone 1.

## Luồng phân tích demo

1. Frontend tạo UUID và tham chiếu ảnh giả.
2. Spring Boot validation `DemoAnalysisRequest`.
3. `AnalysisService` giao việc gọi HTTP cho `AiCoreClient`.
4. AI Core trả kết quả mock có disclaimer.
5. Spring Boot bọc kết quả trong `ApiEnvelope` rồi trả frontend.

AI Core không tải hoặc xử lý ảnh thật. Đây không phải kết quả chẩn đoán y tế.

## Dữ liệu

PostgreSQL là database được kết nối trong Milestone 1 qua Spring Data JPA. Ảnh y tế không được lưu trực tiếp trong PostgreSQL; entity chỉ lưu URL/metadata.

MongoDB thuộc định hướng tổng thể nhưng chưa được thêm trong Milestone 1 vì chưa có use case document cụ thể. Việc chọn dữ liệu đưa vào MongoDB cần được xác định trước khi tạo collection hoặc repository.

## Quyết định giới hạn

- Một backend Spring Boot duy nhất, không chia microservice theo bảng.
- AI Core là microservice Python độc lập.
- Chưa triển khai JWT, đăng nhập hoàn chỉnh, Flyway hoặc OpenAPI.
- Chưa có package auth; các placeholder đăng nhập/JWT đã được loại khỏi Milestone 1.
- Health trả trạng thái riêng của PostgreSQL và AI Core để frontend quan sát dependency.

---

# Kiến trúc AURA Milestone 2 — Auth, RBAC

## Tổng quan luồng xác thực

```text
Browser
  │
  ├─ POST /api/v1/auth/register|login  (email + password)
  ├─ GET  /oauth2/authorization/google (Google, FR-1)
  │
  ▼
Spring Security filter chain (stateless)
  ├── JwtAuthenticationFilter    ─ đọc "Authorization: Bearer <access-token>"
  ├── oauth2Login                ─ redirect Google → OAuth2LoginSuccessHandler
  └── authorizeHttpRequests      ─ RBAC theo path (NFR-12)
        │
        ▼
  AuthController / AdminUserController
        │
        ▼
  AuthService / UserManagementService ──> UserRepository (_user)
        │
        ▼
  JwtService (HS256, access 15' / refresh 7d)
```

## Package `auth` vs package `user`

- `user`: entity/repository của tài khoản (`User`, `Role`, `AuthProvider`) — domain dữ liệu, không biết gì về JWT/Spring Security.
- `auth`: mọi thứ liên quan xác thực (JWT, OAuth2, filter, DTO login/register) — phụ thuộc vào `user` để đọc/ghi tài khoản, không ngược lại.

`User`/`Role` được chuyển từ `analysis.entity` sang package `user` riêng ở Milestone 2, vì FR-31/FR-32 (quản lý & phân quyền user) là một domain độc lập với luồng phân tích ảnh, không nên nằm chung package với `AnalysisReport`.

## Cơ chế token

- **Access token** (15 phút, cấu hình qua `JWT_ACCESS_TTL`): gửi kèm mọi request qua header `Authorization: Bearer`. Stateless — không lưu trong DB, không có session ở server.
- **Refresh token** (7 ngày, `JWT_REFRESH_TTL`): chỉ dùng cho `POST /api/v1/auth/refresh` để lấy cặp token mới (rotation). Cũng là JWT stateless, phân biệt với access token bằng claim `type`.
- **Giới hạn đã biết:** chưa có danh sách thu hồi (revocation list) phía server. Refresh token bị lộ vẫn còn hiệu lực tới khi hết hạn tự nhiên — sẽ bổ sung ở milestone sau bằng một bảng `refresh_token` lưu hash + trạng thái revoked, vô hiệu hoá khi logout / đổi mật khẩu / admin disable tài khoản.

## RBAC (NFR-12)

Hai lớp kiểm soát:
1. **Path-based** trong `SecurityConfiguration` — chặn thô theo tiền tố URL (`/api/v1/admin/**` → `ADMIN`, `/api/v1/doctors/**` → `DOCTOR`/`ADMIN`, `/api/v1/clinics/**` → `CLINIC`/`ADMIN`).
2. **Method-level** bằng `@PreAuthorize("hasRole('ADMIN')")` trên `AdminUserController` — phòng trường hợp rule path bị sửa/xoá nhầm sau này.

4 role cố định (`USER`, `DOCTOR`, `CLINIC`, `ADMIN`) ánh xạ 1-1 sang Spring Security authority `ROLE_<tên>`. Đổi role của user là hành động của Admin (`PATCH /api/v1/admin/users/{id}/role`, FR-32), có guardrail admin không tự đổi role/tự khoá tài khoản chính mình để tránh tự khoá quyền truy cập hệ thống.

## Đăng ký & vòng đời tài khoản

- `POST /api/v1/auth/register` luôn tạo tài khoản role `USER`, provider `LOCAL`. Tài khoản `DOCTOR`/`CLINIC`/`ADMIN` không tự đăng ký được — được Admin gán quyền sau khi tạo (đúng luồng nghiệp vụ: bác sĩ/phòng khám cần được xác minh trước khi có quyền truy cập dữ liệu bệnh nhân).
- `enabled=false` (FR-31, Admin tắt tài khoản) chặn đăng nhập ngay ở bước `AuthenticationManager` và chặn cả refresh token cũ tiếp tục sinh access token mới.
- Đăng nhập Google (FR-1): tài khoản được find-or-create theo email, provider = `GOOGLE`, không có `password` (cột `password_hash` là null). Người dùng Google không thể đăng nhập bằng mật khẩu qua `/api/v1/auth/login`.

## Chưa làm ở Milestone 2 (để milestone sau)

- Revocation/blacklist cho refresh token khi logout hoặc đổi mật khẩu.
- Đổi mật khẩu, quên mật khẩu (reset qua email).
- Rate limiting cho `/api/v1/auth/login` (chống brute-force).
- Audit log các thao tác đổi role/khoá tài khoản của Admin (NFR-18 nhắc tới logging tập trung nhưng chưa nối vào luồng auth).

---

# Kiến trúc AURA Milestone 2 — Gói dịch vụ & Thanh toán

## Package `billing`

```text
ServicePackage (Admin định nghĩa, FR-34)
      │  scope: INDIVIDUAL | CLINIC
      │
      ▼
POST /api/v1/me/packages/{id}/purchase  (FR-11 user / FR-28 clinic — cùng 1 code path)
      │
      ├─ kiểm tra scope khớp Role của người mua (User→INDIVIDUAL, Clinic→CLINIC)
      ├─ tạo PaymentTransaction (PENDING)
      ├─ gọi PaymentGateway.charge(...)   ← MockPaymentGateway ở Milestone 2
      └─ nếu SUCCEEDED: cộng/gia hạn Subscription (remainingCredits, expiresAt)

GET /api/v1/me/payments        → lịch sử thanh toán (FR-12)
GET /api/v1/me/subscriptions   → số lượt phân tích còn lại (FR-12)
```

## Quyết định thiết kế

- **Một luồng purchase dùng chung cho FR-11 và FR-28**: thay vì viết `UserBillingService` và `ClinicBillingService` riêng, `BillingService.purchaseOrRenew` nhận `ownerId` bất kỳ và tự kiểm tra `Role` của owner có khớp `PackageScope` của gói hay không. Lý do: cơ chế cộng credit/gia hạn hạn dùng và ghi lịch sử thanh toán là **giống hệt nhau** giữa User và Clinic — khác biệt duy nhất là "ai được mua gói nào". Tách riêng 2 service sẽ nhân đôi logic renewal (dễ lệch nhau khi sửa bug).
- **`PaymentGateway` là interface, `MockPaymentGateway` là cài đặt duy nhất** — giống cách `AiCoreClient` tách khỏi AI Core thật. Milestone 2 không tích hợp cổng thanh toán thật (VNPay/Momo/Stripe) vì chưa có tài khoản merchant/sandbox; mọi giao dịch được coi là thành công ngay lập tức. Khi có cổng thật, chỉ cần thêm 1 implementation mới của `PaymentGateway`, không phải sửa `BillingService` hay controller.
- **Gia hạn (renew) cộng dồn, không tạo dòng mới**: mỗi (owner, package) chỉ có đúng 1 `Subscription`. Gia hạn khi gói còn hạn sẽ **cộng thêm credit và kéo dài từ ngày hết hạn hiện tại** (không phải từ hôm nay) — đúng hành vi gia hạn thông thường (không mất phần thời gian còn lại). Nếu gói đã hết hạn, mốc tính lại là thời điểm hiện tại.
- **Giao dịch thất bại vẫn được lưu** vào `PaymentTransaction` (status `FAILED`) để lịch sử thanh toán (FR-12) phản ánh đúng thực tế, không chỉ hiển thị các lần thành công.
- **Danh mục gói (`GET /api/v1/packages`) công khai**, không cần đăng nhập — giống trang bảng giá của một SaaS thông thường, để người dùng xem giá trước khi đăng ký tài khoản.

## Chưa làm ở Milestone 2 (để milestone sau)

- Tích hợp cổng thanh toán thật (VNPay/Momo/Stripe) thay `MockPaymentGateway`.
- Trừ credit thực tế khi tạo `AnalysisReport` mới — hiện `AnalysisController` (Milestone 1) chưa được nối với `Subscription.remainingCredits`; đây là việc cần làm trước khi coi hệ thống credit là "thật".
- Job định kỳ tự động chuyển `Subscription` sang `EXPIRED` khi hết hạn (hiện tại chỉ kiểm tra "lazy" mỗi khi gọi `GET /api/v1/me/subscriptions`).
- Hoàn tiền / hủy gói.
