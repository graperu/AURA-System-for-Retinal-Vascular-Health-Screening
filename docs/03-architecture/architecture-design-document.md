# TÀI LIỆU THIẾT KẾ KIẾN TRÚC & THIẾT KẾ CHI TIẾT (ARCHITECTURE DESIGN DOCUMENT)
## HỆ THỐNG SÀNG LỌC SỨC KHỎE MẠCH MÁU VÕNG MẠC (AURA)

*Mã tài liệu: `AURA-ADD-03`*  
*Tiêu chuẩn thiết kế: Chuẩn mô hình hóa UML 2.0 & IEEE 1471 / ISO/IEC 42010*  
*Căn cứ đề bài: `DEBAI.pdf` (Mục 4.1 & 4.4)*  

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống AURA được xây dựng theo kiến trúc **Microservices phân tầng (Multi-tier Clean Architecture)**, đảm bảo tính phân tách độc lập giữa tầng giao diện người dùng, tầng xử lý nghiệp vụ & an ninh, tầng suy luận trí tuệ nhân tạo (AI Core) và tầng lưu trữ dữ liệu.

```mermaid
graph TB
    subgraph "Client Layer (Frontend SPA)"
        UI_User["Patient Portal<br/>(React 18 + TS)"]
        UI_Doctor["Doctor CDS Dashboard<br/>(Interactive Viewer)"]
        UI_Clinic["Clinic Batch Portal<br/>(Bulk Upload & Campaign)"]
        UI_Admin["Admin Management<br/>(RBAC & Audit Logs)"]
    end

    subgraph "API Gateway & Application Layer (Spring Boot 3.4 / Java 21)"
        GW["REST API Gateway & Security Filters"]
        AuthModule["Auth & JWT Token Service"]
        ScreeningModule["Screening & Clinical Service"]
        BulkModule["Bulk Batch Queue & Worker"]
        BillingModule["Billing & Credit Quota Service"]
        ChatModule["In-App Consultation Chat Service"]
        AuditModule["HIPAA Audit & Feedback Service"]
    end

    subgraph "AI Core Microservice (Python FastAPI / PyTorch)"
        FastAPI_GW["FastAPI REST Endpoint<br/>(/api/v1/predict)"]
        Preprocessor["CLAHE & Normalization Engine"]
        DeepNet["Multi-Task Retinal DeepNet"]
        GradCAM["Grad-CAM Heatmap Generator"]
    end

    subgraph "Persistence Layer"
        Postgres[(PostgreSQL 16 DB<br/>Flyway Versioned)]
        Storage[(Cloud / Local Storage<br/>Fundus Images & Masks)]
    end

    UI_User -->|HTTPS / REST| GW
    UI_Doctor -->|HTTPS / REST| GW
    UI_Clinic -->|HTTPS / REST| GW
    UI_Admin -->|HTTPS / REST| GW

    GW --> AuthModule
    GW --> ScreeningModule
    GW --> BulkModule
    GW --> BillingModule
    GW --> ChatModule
    GW --> AuditModule

    ScreeningModule -->|Internal HTTP| FastAPI_GW
    BulkModule -->|Async Queue Task| FastAPI_GW

    FastAPI_GW --> Preprocessor --> DeepNet --> GradCAM

    AuthModule --> Postgres
    ScreeningModule --> Postgres
    BillingModule --> Postgres
    ChatModule --> Postgres
    AuditModule --> Postgres
    ScreeningModule --> Storage
```

---

## 2. TỔNG HỢP 14 SƠ ĐỒ CHUẨN UML 2.0 (UML 2.0 DIAGRAMS SUITE)

### Sơ đồ 1: Biểu đồ Use Case Tổng quan Hệ thống (System Use Case Diagram)
```mermaid
graph LR
    actor_user((Bệnh nhân))
    actor_doc((Bác sĩ))
    actor_cli((Phòng khám))
    actor_adm((Quản trị viên))

    subgraph "Hệ Thống AURA"
        UC_Auth(Đăng ký / Đăng nhập JWT)
        UC_Upload(Tải ảnh võng mạc Fundus/OCT)
        UC_ViewAI(Xem kết quả & Grad-CAM Heatmap)
        UC_Export(Xuất báo cáo PDF/CSV)
        UC_Chat(Chat tư vấn chuyên khoa)
        UC_Credit(Nạp credit / Mua gói cước)
        UC_Validate(Thẩm định & Ký duyệt kết quả)
        UC_Retrain(Gửi phản hồi AI Retraining)
        UC_Bulk(Tải ảnh hàng loạt >=100 ảnh)
        UC_ManageUsers(Quản trị tài khoản & RBAC)
        UC_AIConfig(Cấu hình ngưỡng AI & Model)
        UC_Audit(Xem nhật ký kiểm toán Audit Logs)
    end

    actor_user --> UC_Auth
    actor_user --> UC_Upload
    actor_user --> UC_ViewAI
    actor_user --> UC_Export
    actor_user --> UC_Chat
    actor_user --> UC_Credit

    actor_doc --> UC_Auth
    actor_doc --> UC_ViewAI
    actor_doc --> UC_Validate
    actor_doc --> UC_Retrain
    actor_doc --> UC_Chat
    actor_doc --> UC_Export

    actor_cli --> UC_Auth
    actor_cli --> UC_Bulk
    actor_cli --> UC_Credit
    actor_cli --> UC_Export

    actor_adm --> UC_Auth
    actor_adm --> UC_ManageUsers
    actor_adm --> UC_AIConfig
    actor_adm --> UC_Audit
```

---

### Sơ đồ 2: Biểu đồ Use Case Phân hệ Bệnh nhân (Patient Use Case)
```mermaid
graph TD
    User((Bệnh nhân))

    subgraph "Phân hệ Bệnh nhân (User Portal)"
        UC1[Đăng ký & Đăng nhập]
        UC2[Tải lên ảnh chụp đáy mắt]
        UC3[Xem kết quả rủi ro 4 nhóm bệnh]
        UC4[Tương tác bản đồ nhiệt Grad-CAM]
        UC5[Xem khuyến nghị sức khỏe tự động]
        UC6[Tra cứu lịch sử & báo cáo cũ]
        UC7[Tải phiếu kết quả PDF]
        UC8[Nhắn tin với Bác sĩ chỉ định]
        UC9[Nạp credit & Mua gói cước]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
```

---

### Sơ đồ 3: Biểu đồ Use Case Phân hệ Bác sĩ (Doctor Use Case)
```mermaid
graph TD
    Doctor((Bác sĩ chuyên khoa))

    subgraph "Phân hệ Bác sĩ (Doctor CDS)"
        UC10[Quản lý danh sách bệnh nhân]
        UC11[Phân tích ảnh Side-by-Side & Zoom]
        UC12[Đọc chỉ số vi mạch AVR, Tortuosity]
        UC13[Xác nhận / Chỉnh sửa kết luận AI]
        UC14[Nhập chẩn đoán lâm sàng & Ký số]
        UC15[Xem biểu đồ xu hướng bệnh nhân]
        UC16[Gửi phản hồi cải thiện mô hình AI]
        UC17[Tư vấn trực tuyến cho bệnh nhân]
    end

    Doctor --> UC10
    Doctor --> UC11
    Doctor --> UC12
    Doctor --> UC13
    Doctor --> UC14
    Doctor --> UC15
    Doctor --> UC16
    Doctor --> UC17
```

---

### Sơ đồ 4: Biểu đồ Use Case Phân hệ Phòng khám (Clinic Use Case)
```mermaid
graph TD
    Clinic((Đại diện Phòng khám))

    subgraph "Phân hệ Phòng khám (Clinic Portal)"
        UC18[Đăng ký pháp nhân phòng khám]
        UC19[Quản lý bác sĩ & bệnh nhân cơ sở]
        UC20[Tải ảnh hàng loạt >=100 ảnh]
        UC21[Theo dõi tiến độ xử lý lô Batch]
        UC22[Báo cáo tổng hợp chiến dịch tầm soát]
        UC23[Nhận cảnh báo ca nguy cơ khẩn cấp]
        UC24[Xuất dữ liệu nghiên cứu CSV]
        UC25[Mua & Quản lý gói cước tổ chức]
    end

    Clinic --> UC18
    Clinic --> UC19
    Clinic --> UC20
    Clinic --> UC21
    Clinic --> UC22
    Clinic --> UC23
    Clinic --> UC24
    Clinic --> UC25
```

---

### Sơ đồ 5: Biểu đồ Use Case Phân hệ Quản trị viên (Admin Use Case)
```mermaid
graph TD
    Admin((Quản trị viên))

    subgraph "Phân hệ Quản trị (Admin Console)"
        UC26[Quản lý tài khoản User/Doctor/Clinic]
        UC27[Phê duyệt / Tạm ngưng phòng khám]
        UC28[Phân quyền vai trò RBAC]
        UC29[Cấu hình tham số AI & Ngưỡng cảnh báo]
        UC30[Quản lý bảng giá & Gói dịch vụ]
        UC31[Xem Dashboard KPI & Thống kê hệ thống]
        UC32[Tra cứu & Xuất Audit Logs HIPAA]
        UC33[Quản lý mẫu thông báo hệ thống]
    end

    Admin --> UC26
    Admin --> UC27
    Admin --> UC28
    Admin --> UC29
    Admin --> UC30
    Admin --> UC31
    Admin --> UC32
    Admin --> UC33
```

---

### Sơ đồ 6: Biểu đồ Hoạt động Sàng lọc Ảnh Đơn lẻ (Activity Diagram - Screening Workflow)
```mermaid
stateDiagram-v2
    [*] --> UploadImage: Người dùng tải ảnh Fundus
    UploadImage --> ValidateFormat: Kiểm tra định dạng & kích thước
    ValidateFormat --> ErrorFormat: Định dạng không hợp lệ
    ErrorFormat --> [*]
    
    ValidateFormat --> CheckCredit: Kiểm tra số dư Credit
    CheckCredit --> InsufficientCredit: Hết credit
    InsufficientCredit --> ShowPurchaseModal: Mở Modal nạp credit
    ShowPurchaseModal --> [*]

    CheckCredit --> DeductCredit: Trừ 1 Credit & Tạo Screening Record (PENDING)
    DeductCredit --> SendToAI: Gửi ảnh sang AI FastAPI Microservice
    SendToAI --> ImagePreprocess: Tiền xử lý CLAHE & Resize 512x512
    ImagePreprocess --> DeepInference: Phân tích mạng nơ-ron đa nhiệm
    DeepInference --> GenerateGradCAM: Tính ma trận Grad-CAM Heatmap
    GenerateGradCAM --> SaveResults: Lưu kết quả & Đổi trạng thái (COMPLETED)
    SaveResults --> DisplayCDS: Hiển thị kết quả trên Interactive CDS Viewer
    DisplayCDS --> [*]
```

---

### Sơ đồ 7: Biểu đồ Hoạt động Xử lý Hàng loạt Ảnh (Activity Diagram - Bulk Batch Processing)
```mermaid
stateDiagram-v2
    [*] --> SelectFiles: Phòng khám chọn thư mục >=100 ảnh
    SelectFiles --> ClientValidation: Validate số lượng và định dạng ảnh
    ClientValidation --> SubmitBatch: Gửi danh sách ảnh lên Backend API
    SubmitBatch --> CreateBatchJob: Khởi tạo BatchJob (QUEUED)
    CreateBatchJob --> EnqueueTasks: Đưa 100+ Task vào BlockingQueue

    state ForkJoin {
        [*] --> Worker1: Luồng xử lý 1
        [*] --> Worker2: Luồng xử lý 2
        [*] --> WorkerN: Luồng xử lý N
        Worker1 --> Anonymize1: Ẩn danh hóa HIPAA (HMAC SHA-256)
        Worker2 --> Anonymize2: Ẩn danh hóa HIPAA (HMAC SHA-256)
        WorkerN --> AnonymizeN: Ẩn danh hóa HIPAA (HMAC SHA-256)
        Anonymize1 --> AI_Call1: Gọi AI Microservice
        Anonymize2 --> AI_Call2: Gọi AI Microservice
        AnonymizeN --> AI_CallN: Gọi AI Microservice
        AI_Call1 --> CollectResult: Thu thập kết quả
        AI_Call2 --> CollectResult
        AI_CallN --> CollectResult
    }

    EnqueueTasks --> ForkJoin
    ForkJoin --> CheckRiskAlert: Kiểm tra bệnh nhân có nguy cơ cao
    CheckRiskAlert --> TriggerAlert: Bật cờ cảnh báo khẩn cấp (High-Risk Alert)
    CheckRiskAlert --> CompleteBatch: Đổi trạng thái Batch (COMPLETED)
    TriggerAlert --> CompleteBatch
    CompleteBatch --> ExportSummary: Xuất báo cáo chiến dịch & CSV
    ExportSummary --> [*]
```

---

### Sơ đồ 8: Biểu đồ Hoạt động Bác sĩ Thẩm định & Tái Huấn Luyện AI (Doctor Validation Activity)
```mermaid
stateDiagram-v2
    [*] --> DoctorLogin: Bác sĩ đăng nhập
    DoctorLogin --> SelectPatient: Chọn ca bệnh cần thẩm định
    SelectPatient --> InspectHeatmap: So sánh ảnh gốc & Heatmap Grad-CAM
    InspectHeatmap --> EvaluateAI: Đánh giá độ chính xác của AI

    state ValidationChoice <<choice>>
    EvaluateAI --> ValidationChoice
    ValidationChoice --> ApproveResult: AI chẩn đoán chính xác
    ValidationChoice --> ModifyResult: AI chẩn đoán sai lệch / Bỏ sót tổn thương

    ApproveResult --> SignReport: Thêm ghi chú & Ký số y khoa
    ModifyResult --> AdjustRisk: Điều chỉnh mức độ nguy cơ & Khoanh vùng tổn thương
    AdjustRisk --> LogFeedback: Gửi phản hồi vào bảng `doctor_feedback`
    LogFeedback --> TagRetrain: Đánh dấu dữ liệu phục vụ Retraining
    TagRetrain --> SignReport

    SignReport --> NotifyPatient: Trả kết quả chính thức cho bệnh nhân
    NotifyPatient --> [*]
```

---

### Sơ đồ 9: Biểu đồ Tuần tự Xác thực & Xoay vòng Refresh Token (Sequence Diagram - Auth & JWT Rotation)
```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (Client)
    participant AuthCtrl as AuthController
    participant AuthSvc as AuthService
    participant TokenSvc as RefreshTokenService
    participant DB as PostgreSQL

    User->>AuthCtrl: POST /api/v1/auth/login (Email, Password)
    AuthCtrl->>AuthSvc: authenticate(email, rawPassword)
    AuthSvc->>DB: findByEmail(email)
    DB-->>AuthSvc: User (PasswordHash)
    AuthSvc->>AuthSvc: verifyPassword(BCrypt)
    AuthSvc->>TokenSvc: createRefreshToken(userId)
    TokenSvc->>DB: INSERT INTO refresh_tokens (token_hash, expires_at)
    TokenSvc-->>AuthSvc: RawRefreshToken
    AuthSvc-->>AuthCtrl: AccessToken (JWT) + RefreshToken (Cookie HttpOnly)
    AuthCtrl-->>User: 200 OK (JWT Token + Set-Cookie)

    Note over User,AuthCtrl: Sau 30 phút, Access Token hết hạn
    User->>AuthCtrl: POST /api/v1/auth/refresh (Cookie: refresh_token)
    AuthCtrl->>TokenSvc: rotateRefreshToken(rawToken)
    TokenSvc->>DB: findByTokenHash(sha256(rawToken))
    DB-->>TokenSvc: RefreshToken Record
    TokenSvc->>TokenSvc: Kiểm tra thu hồi & Hết hạn
    TokenSvc->>DB: UPDATE revoked_at = NOW(), replaced_by = new_id
    TokenSvc->>DB: INSERT INTO refresh_tokens (new_hash)
    TokenSvc-->>AuthCtrl: New AccessToken + New RefreshToken
    AuthCtrl-->>User: 200 OK (New Tokens)
```

---

### Sơ đồ 10: Biểu đồ Tuần tự Suy luận AI & Grad-CAM (Sequence Diagram - AI Inference Pipeline)
```mermaid
sequenceDiagram
    autonumber
    actor User as Trình duyệt (React Client)
    participant Backend as Spring Boot ScreeningService
    participant AI as FastAPI AI Core Microservice
    participant OpenCV as ImageProcessor (CLAHE)
    participant PyTorch as ModelEngine (DeepNet)
    participant DB as PostgreSQL

    User->>Backend: POST /api/v1/screenings (imageBase64, eye="OD")
    Backend->>DB: INSERT INTO screenings (status="PENDING")
    Backend->>AI: POST /api/v1/predict (imageBase64, eye="OD")
    
    AI->>OpenCV: decode_base64_image()
    OpenCV->>OpenCV: CLAHE (Tăng tương phản vi mạch) + Resize(512,512)
    OpenCV-->>AI: processed_tensor

    AI->>PyTorch: forward(processed_tensor)
    PyTorch->>PyTorch: Extract Feature Maps (Layer 4)
    PyTorch->>PyTorch: Multi-task heads: CVD, Stroke, Hypertension, DR
    PyTorch->>PyTorch: Calculate Grad-CAM Gradients & Heatmap Overlay
    PyTorch-->>AI: Prediction JSON + Grad-CAM Base64 Image

    AI-->>Backend: 200 OK (Predictions, AVR: 0.61, HeatmapBase64)
    Backend->>DB: UPDATE screenings SET status="COMPLETED", risk_level="HIGH", findings=...
    Backend-->>User: 200 OK (ScreeningResponseDto)
```

---

### Sơ đồ 11: Biểu đồ Tuần tự Chat Tư vấn Bác sĩ - Bệnh nhân (Sequence Diagram - In-App Chat)
```mermaid
sequenceDiagram
    autonumber
    actor Patient as Bệnh nhân (Patient)
    participant ChatCtrl as ChatController
    participant ChatSvc as ChatService
    participant DB as PostgreSQL
    actor Doctor as Bác sĩ (Doctor)

    Patient->>ChatCtrl: POST /api/v1/chat/messages (receiverId=DoctorID, messageText="Nhờ BS xem giúp kết quả")
    ChatCtrl->>ChatSvc: sendMessage(senderId, request)
    ChatSvc->>DB: INSERT INTO chat_messages (sender_id, receiver_id, message_text, is_read=false)
    DB-->>ChatSvc: Saved ChatMessage
    ChatSvc-->>ChatCtrl: ChatMessageResponse
    ChatCtrl-->>Patient: 200 OK (Message sent)

    Doctor->>ChatCtrl: GET /api/v1/chat/conversation/{patientId}
    ChatCtrl->>ChatSvc: getConversation(doctorId, patientId)
    ChatSvc->>DB: SELECT FROM chat_messages WHERE ... ORDER BY created_at ASC
    DB-->>ChatSvc: Message List
    ChatSvc-->>ChatCtrl: List<ChatMessageResponse>
    ChatCtrl-->>Doctor: 200 OK (Message history)

    Doctor->>ChatCtrl: PUT /api/v1/chat/read/{patientId}
    ChatCtrl->>ChatSvc: markMessagesAsRead(doctorId, patientId)
    ChatSvc->>DB: UPDATE chat_messages SET is_read=true, read_at=NOW()
    ChatCtrl-->>Doctor: 200 OK
```

---

### Sơ đồ 12: Biểu đồ Lớp Thực thể Miền (Domain Class Diagram)
```mermaid
classDiagram
    class User {
        -UUID id
        -String email
        -String passwordHash
        -String fullName
        -boolean active
        -boolean emailVerified
        -Instant createdAt
        +isActive() boolean
        +setActive(boolean) void
    }

    class Role {
        -UUID id
        -RoleName name
        -String description
    }

    class UserRole {
        -UUID id
        -User user
        -Role role
        -Instant assignedAt
    }

    class Screening {
        -UUID id
        -UUID patientId
        -UUID doctorId
        -String imageUrl
        -ScreeningStatus status
        -RiskLevel riskLevel
        -Double confidence
        -String findings
        -String doctorNotes
        -Instant createdAt
    }

    class ServicePackage {
        -UUID id
        -String name
        -PackageScope scope
        -Long priceCents
        -Integer creditsIncluded
        -Integer durationDays
        -Boolean isActive
    }

    class Subscription {
        -UUID id
        -UUID userId
        -ServicePackage servicePackage
        -SubscriptionStatus status
        -Integer creditsRemaining
        -Instant expiresAt
    }

    class AuditLog {
        -UUID id
        -UUID userId
        -String userEmail
        -String action
        -String resourceType
        -String status
        -String details
        -Instant createdAt
    }

    class DoctorFeedback {
        -UUID id
        -UUID doctorId
        -UUID screeningId
        -String aiRiskLevel
        -String doctorRiskLevel
        -Boolean isAccurate
        -String feedbackNotes
        -Boolean includedInRetraining
    }

    class ChatMessage {
        -UUID id
        -UUID senderId
        -UUID receiverId
        -UUID screeningId
        -String messageText
        -Boolean isRead
        -Instant createdAt
    }

    User "1" <-- "*" UserRole
    Role "1" <-- "*" UserRole
    User "1" <-- "*" Screening : patient
    User "1" <-- "*" Subscription
    ServicePackage "1" <-- "*" Subscription
    Screening "1" <-- "*" DoctorFeedback
    User "1" <-- "*" AuditLog
    User "1" <-- "*" ChatMessage : sender
```

---

### Sơ đồ 13: Biểu đồ Trạng thái Ca Khám Sàng Lọc (Screening Lifecycle State Machine)
```mermaid
stateDiagram-v2
    [*] --> PENDING: Khởi tạo ca khám / Tải ảnh lên
    PENDING --> QUEUED: Đưa vào hàng đợi xử lý ngầm (Bulk Queue)
    PENDING --> ANALYZING: Gửi trực tiếp sang AI Microservice
    QUEUED --> ANALYZING: Worker lấy task ra xử lý
    
    ANALYZING --> COMPLETED: AI phân tích & sinh Grad-CAM thành công
    ANALYZING --> FAILED: Lỗi ảnh hỏng / Không nhận dạng được mạch máu
    FAILED --> [*]: Báo lỗi rõ ràng & bảo toàn ảnh (NFR-5)

    COMPLETED --> UNDER_REVIEW: Bác sĩ mở giao diện thẩm định
    UNDER_REVIEW --> VALIDATED: Bác sĩ xác nhận / chỉnh sửa & ký duyệt
    VALIDATED --> [*]: Hoàn tất quy trình sàng lọc lâm sàng
```

---

### Sơ đồ 14: Biểu đồ Triển khai Đa Container (Docker Deployment Diagram)
```mermaid
graph TD
    subgraph "Client Tier"
        Browser["User Web Browser<br/>(Desktop / Mobile)"]
    end

    subgraph "Docker Host Platform (Linux / Windows Host)"
        subgraph "Container: aura-frontend (Port 3000)"
            Nginx["Nginx / Node Server<br/>(React 18 SPA Build)"]
        end

        subgraph "Container: aura-backend (Port 8081)"
            SpringApp["Spring Boot 3.4 Application<br/>(Java 21 OpenJDK JVM)"]
        end

        subgraph "Container: aura-ai-service (Port 8000)"
            FastAPIApp["FastAPI Uvicorn Server<br/>(Python 3.10 + PyTorch + OpenCV)"]
        end

        subgraph "Container: aura-postgres (Port 5432)"
            PostgresEngine["PostgreSQL 16 Alpine<br/>(Volume: postgres_data)"]
        end
    end

    Browser -->|HTTP:3000| Nginx
    Nginx -->|Reverse Proxy / REST| SpringApp
    Browser -->|API Calls:8081| SpringApp
    SpringApp -->|Internal REST:8000| FastAPIApp
    SpringApp -->|JDBC Connection:5432| PostgresEngine
```
