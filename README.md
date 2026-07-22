# AURA-System-for-Retinal-Vascular-Health-Screening / Hệ Thống Sàng Lọc Sức Khỏe Mạch Máu Võng Mạc

- [English Version](#english-version)
- [Bản Tiếng Việt](#bản-tiếng-việt)

---

# English Version

## 1. Context & Proposed Solution

### Context
* **Early Detection in Preventative Medicine:** In the era of preventative medicine and personalized healthcare, the early detection of systemic health risks has become an essential requirement for enhancing quality of life and reducing the burden of healthcare costs. However, many serious diseases, particularly those related to cardiovascular, diabetic, and neurological conditions, often progress silently and are only discovered in their late stages.
* **Barriers to Access in Vietnam:** Many individuals in Vietnam face barriers in accessing comprehensive, non-invasive, and regular screening methods due to high costs, complex procedures, or a lack of specialized personnel at the grassroots level. The absence of a fast, accurate, and widely deployable screening tool presents a significant challenge.

### Proposed Solution: AURA (AI Understanding Retinal Analysis)
The **Comprehensive AI Understanding Retinal Analysis (AURA)** offers an integrated approach to enhance early detection and prevention of diseases through retinal imaging analysis.

* **Clinical Decision Support, Not Replacement:** AURA acts as a Clinical Decision Support (CDS) tool that assists — not replaces — physicians. The AI system analyzes retinal vasculature to detect subtle vascular abnormalities and provide early disease risk assessments, enabling doctors to make faster and more confident decisions.
* **Expanding Access to Preventive Care:** By connecting to existing fundus cameras and offering cloud-based analysis, AURA makes advanced vascular screening available even to community clinics and mid-tier hospitals. This reduces the need for costly diagnostic infrastructure and helps bring preventive healthcare to underserved regions.
* **Retinal Imaging as a Non-Invasive Health Indicator:** The system leverages the eye as a "window" to systemic health, using retinal vessel morphology to estimate risks of hypertension, diabetes complications, and stroke — transforming routine eye exams into a broader tool for disease risk screening.
* **Data Collaboration and Continuous Learning:** AURA encourages data partnerships between clinics, hospitals, and research institutions. It begins with open datasets for model training and evolves through real-world feedback, strengthening both the AI model and the clinical understanding of vascular health.
* **Ethical, Transparent, and Secure AI Use:** All outputs are interpretable and visually explainable, allowing doctors to validate AI findings. Strict data privacy, patient anonymization, and compliance with medical regulations ensure safe and responsible AI adoption.

> **In essence,** AURA delivers a scalable, ethical, and data-driven solution that empowers healthcare providers to detect cardiovascular risks early, reduce diagnostic barriers, and improve patient outcomes through AI-assisted retinal screening.

---

## 2. Functional Requirements (FR)

### 2.1. User Functional Requirements
- **[FR-1]** Register and log in using email, Google account, or social authentication.
- **[FR-2]** Upload single or multiple retinal (Fundus or OCT) images for analysis.
- **[FR-3]** View AI-generated diagnostic results and risk levels.
- **[FR-4]** Visualize annotated images showing affected vascular areas.
- **[FR-5]** Receive automated health recommendations or warnings.
- **[FR-6]** Access personal analysis history and previous reports.
- **[FR-7]** Download or export diagnostic reports (PDF/CSV).
- **[FR-8]** Manage and update personal profile and medical information.
- **[FR-9]** Receive notifications when AI results are ready.
- **[FR-10]** Communicate with the assigned doctor via in-app messaging.
- **[FR-11]** Purchase or renew analysis service packages.
- **[FR-12]** View payment history and remaining analysis credits.

### 2.2. Doctor Functional Requirements
- **[FR-13]** Log in and manage assigned patient profiles.
- **[FR-14]** Review AI analysis results and annotations.
- **[FR-15]** Validate or correct AI-generated findings.
- **[FR-16]** Add medical notes, diagnoses, or recommendations.
- **[FR-17]** Access patient history, previous analyses, and trend data.
- **[FR-18]** Filter or search patients by ID, name, or risk level.
- **[FR-19]** Provide feedback to improve AI accuracy and model retraining.
- **[FR-20]** Communicate with users (patients) through consultation chat.
- **[FR-21]** View performance summaries or analysis statistics.

### 2.3. Clinic Functional Requirements
- **[FR-22]** Register clinic accounts and verify organization identity.
- **[FR-23]** Manage multiple doctor and user (patient) accounts.
- **[FR-24]** Upload and submit bulk retinal images for AI analysis.
- **[FR-25]** Monitor all patient analysis reports and aggregated risk data.
- **[FR-26]** Generate clinic-wide reports for screening campaigns.
- **[FR-27]** Track number of images analyzed and package usage.
- **[FR-28]** Purchase or renew clinic-level service packages.
- **[FR-29]** Receive alerts for high-risk patients or abnormal trends.
- **[FR-30]** Export summarized statistics for clinical research or management.

### 2.4. Admin Functional Requirements
- **[FR-31]** Manage user, doctor, and clinic accounts (enable, disable, edit).
- **[FR-32]** Define and update user roles and access permissions.
- **[FR-33]** Configure AI parameters, thresholds, and retraining policies.
- **[FR-34]** Manage service packages, pricing, and billing models.
- **[FR-35]** Access global dashboard showing usage, revenue, and AI performance.
- **[FR-36]** View system analytics (image count, risk distribution, error rates).
- **[FR-37]** Handle data compliance, audit logs, and privacy settings.
- **[FR-38]** Approve or suspend clinic registrations.
- **[FR-39]** Manage notification templates and communication policies.

---

## 3. Non-Functional Requirements (NFR)

### 3.1. Performance Requirements
- **[NFR-1]** AI analysis for a single retinal image must complete within 10–20 seconds, depending on image size and model load.
- **[NFR-2]** The system must support bulk processing (≥100 images per batch) with queued or parallel execution.
- **[NFR-3]** Dashboard and result retrieval should load in <3 seconds under normal network conditions.

### 3.2. Reliability & Availability Requirements
- **[NFR-4]** System uptime must be ≥ 99% excluding scheduled maintenance.
- **[NFR-5]** AI Engine must fail gracefully; if analysis fails, the system returns a clear error and preserves all uploaded images.
- **[NFR-6]** Data must be backed up automatically at least once daily.

### 3.3. Scalability Requirements
- **[NFR-7]** The architecture must allow horizontal scaling of AI microservices to handle increased image volume.
- **[NFR-8]** Must support multiple clinics and thousands of users without performance degradation.

### 3.4. Security & Privacy Requirements
- **[NFR-9]** All patient data must be encrypted at rest and in transit (TLS 1.2+; AES-256).
- **[NFR-10]** The system must comply with medical data protection standards (HIPAA-like practices / local health data laws).
- **[NFR-11]** Sensitive data must be anonymized before being used for AI model retraining.
- **[NFR-12]** Access must follow role-based access control (RBAC) for Admin, Clinic, Doctor, and User.

### 3.5. Usability Requirements
- **[NFR-13]** Web UI should be accessible and responsive across desktop, tablet, and mobile.
- **[NFR-14]** Clinicians must be able to upload images and view results with no more than 3 clicks.
- **[NFR-15]** Annotated images and risk explanations must be clear and clinically interpretable.

### 3.6. Maintainability Requirements
- **[NFR-16]** AI models, thresholds, and configurations must be updatable without system downtime.
- **[NFR-17]** Codebase must follow a modular architecture:
  - AI Core Microservice
  - Web Application
  - Admin/Clinic/Doctor modules
  - Database layer
- **[NFR-18]** Logging, auditing, and error tracking must be centralized.

### 3.7. Interoperability Requirements
- **[NFR-19]** Must support integration with common retinal fundus cameras (via cloud upload).
- **[NFR-20]** Export formats must include PDF, CSV, and standardized medical formats where possible.
- **[NFR-21]** AI engine must communicate over standard RESTful API endpoints.

### 3.8. Data Quality & Explainability Requirements
- **[NFR-22]** AI outputs must include explainable elements (heatmaps, annotated vessels, highlighted abnormalities).
- **[NFR-23]** System must track AI version and thresholds attached to each generated report to ensure traceability.

---

## 4. Project Deliverables & Tasks

### 4.1. Theory and Practice (Documentation)
- Students are expected to apply the software development process and UML 2.0 for system modeling.
- **Required Deliverable Documents:**
  - User Requirements
  - Software Requirements Specifications (SRS)
  - Architecture Design & Detailed Design
  - System Implementation Document
  - Testing Document
  - Installation Guide
  - Source Code and deployable software packages

### 4.2. Technology Stack
* **Server-side:**
  - **Server Framework:** .NET, Docker, VPS, etc.
  - **Cloud Services:** Supabase, Cloudinary
  - **AI Core:** Python
  - **Database:** PostgreSQL, MongoDB
* **Client-side:**
  - **Web Client:** React + TypeScript
  - **Mobile:** Flutter *(optional)*

### 4.3. Products
- AI Core Microservice API.
- Clinical Decision Support (CDS) Web Application.
- Admin/Doctor/Client Management Web Application.
- Integrated Retinal Fundus Camera support.

### 4.4. Proposed Tasks & Work Packages
* **Task Package 1:** Design UI Elements for the Web Application
* **Task Package 2:** Develop API for the System
* **Task Package 3:** Develop the Web Application
* **Task Package 4:** Build, Deploy, and Test the System
* **Task Package 5:** Prepare Required Documents:
  - System Analysis and Design
  - Test Plan
  - Installation Manual
  - User Manual

> [!NOTE]
> - Each work group may have many students participating, but there will be one member responsible for the main responsibility of each task.
> - **Notice:** All students are required to understand the reference documents thoroughly and may need to explain them to the viva committee.

---

# Bản Tiếng Việt

## 1. Bối Cảnh & Giải Pháp Đề Xuất

### Bối Cảnh
* **Phát hiện sớm trong Y học Dự phòng:** Trong kỷ nguyên của y học dự phòng và chăm sóc sức khỏe cá nhân hóa, việc phát hiện sớm các nguy cơ sức khỏe hệ thống đã trở thành một yêu cầu thiết yếu nhằm nâng cao chất lượng cuộc sống và giảm bớt gánh nặng chi phí y tế. Tuy nhiên, nhiều bệnh lý nghiêm trọng, đặc biệt là các bệnh liên quan đến tim mạch, tiểu đường và thần kinh, thường tiến triển âm thầm và chỉ được phát hiện ở giai đoạn muộn.
* **Rào cản tiếp cận tại Việt Nam:** Nhiều người dân tại Việt Nam đối mặt với các rào cản trong việc tiếp cận các phương pháp sàng lọc toàn diện, không xâm lấn và định kỳ do chi phí cao, quy trình phức tạp hoặc thiếu nhân lực chuyên môn ở cấp cơ sở. Sự thiếu vắng một công cụ sàng lọc nhanh chóng, chính xác và có thể triển khai rộng rãi là một thách thức lớn.

### Giải Pháp Đề Xuất: AURA (AI Understanding Retinal Analysis)
Hệ thống **Phân Tích Võng Mạc Toàn Diện Bằng Trí Tuệ Nhân Tạo (AURA)** cung cấp một phương pháp tiếp cận tích hợp nhằm nâng cao khả năng phát hiện sớm và phòng ngừa bệnh tật thông qua phân tích ảnh chụp võng mạc.

* **Hỗ Trợ Quyết Định Lâm Sàng, Không Thay Thế Bác Sĩ:** AURA đóng vai trò như một công cụ Hỗ trợ Quyết định Lâm sàng (CDS) giúp hỗ trợ — chứ không thay thế — bác sĩ. Hệ thống AI phân tích hệ thống mạch máu võng mạc để phát hiện các bất thường mạch máu nhỏ và đưa ra đánh giá nguy cơ bệnh lý sớm, giúp các bác sĩ đưa ra quyết định nhanh chóng và tự tin hơn.
* **Mở Rộng Khả Năng Tiếp Cận Chăm Sóc Dự Phòng:** Bằng cách kết nối với các máy chụp ảnh đáy mắt hiện có và cung cấp phân tích dựa trên đám mây, AURA giúp sàng lọc mạch máu tiên tiến có thể tiếp cận được ngay cả ở các phòng khám cộng đồng và bệnh viện tuyến dưới. Điều này giảm bớt nhu cầu về hạ tầng chẩn đoán đắt đỏ và giúp mang dịch vụ y tế dự phòng đến các vùng sâu vùng xa.
* **Hình Ảnh Võng Mạc Là Chỉ Số Sức Khỏe Không Xâm Lấn:** Hệ thống tận dụng mắt như một "cửa sổ" nhìn vào sức khỏe hệ thống, sử dụng hình thái mạch máu võng mạc để ước tính nguy cơ tăng huyết áp, biến chứng tiểu đường và đột quỵ — chuyển đổi các buổi khám mắt định kỳ thành một công cụ rộng hơn để sàng lọc nguy cơ bệnh tật.
* **Hợp Tác Dữ Liệu Và Học Hỏi Liên Tục:** AURA khuyến khích hợp tác dữ liệu giữa các phòng khám, bệnh viện và các viện nghiên cứu. Dự án bắt đầu với các bộ dữ liệu mở để huấn luyện mô hình và phát triển thông qua phản hồi thực tế, giúp củng cố cả mô hình AI và hiểu biết lâm sàng về sức khỏe mạch máu.
* **Sử Dụng AI Đạo Đức, Minh Bạch Và An Toàn:** Tất cả kết quả đầu ra đều có thể giải thích được và trực quan hóa rõ ràng, cho phép bác sĩ xác thực các phát hiện của AI. Quy định bảo mật dữ liệu nghiêm ngặt, ẩn danh hóa thông tin bệnh nhân và tuân thủ các quy định y tế đảm bảo việc áp dụng AI an toàn và có trách nhiệm.

> **Về bản chất,** AURA mang lại một giải pháp có khả năng mở rộng, đảm bảo đạo đức và dựa trên dữ liệu, giúp các nhà cung cấp dịch vụ y tế phát hiện sớm các nguy cơ tim mạch, giảm rào cản chẩn đoán và cải thiện kết quả điều trị của bệnh nhân thông qua sàng lọc võng mạc hỗ trợ bởi AI.

---

## 2. Yêu Cầu Chức Năng (FR)

### 2.1. Yêu Cầu Chức Năng Cho Người Dùng (User)
- **[FR-1]** Đăng ký và đăng nhập bằng email, tài khoản Google hoặc xác thực mạng xã hội.
- **[FR-2]** Tải lên một hoặc nhiều ảnh võng mạc (Fundus hoặc OCT) để phân tích.
- **[FR-3]** Xem kết quả chẩn đoán và mức độ nguy cơ do AI tạo ra.
- **[FR-4]** Trực quan hóa hình ảnh được chú thích hiển thị các vùng mạch máu bị ảnh hưởng.
- **[FR-5]** Nhận các khuyến nghị hoặc cảnh báo sức khỏe tự động.
- **[FR-6]** Truy cập lịch sử phân tích cá nhân và các báo cáo trước đó.
- **[FR-7]** Tải xuống hoặc xuất báo cáo chẩn đoán (PDF/CSV).
- **[FR-8]** Quản lý và cập nhật thông tin cá nhân và thông tin y tế.
- **[FR-9]** Nhận thông báo khi kết quả AI đã sẵn sàng.
- **[FR-10]** Trao đổi với bác sĩ được chỉ định qua tính năng nhắn tin trong ứng dụng.
- **[FR-11]** Mua hoặc gia hạn các gói dịch vụ phân tích.
- **[FR-12]** Xem lịch sử thanh toán và số lượt phân tích còn lại.

### 2.2. Yêu Cầu Chức Năng Cho Bác Sĩ (Doctor)
- **[FR-13]** Đăng nhập và quản lý hồ sơ bệnh nhân được phân công.
- **[FR-14]** Xem kết quả phân tích và chú thích của AI.
- **[FR-15]** Xác nhận hoặc chỉnh sửa các phát hiện do AI tạo ra.
- **[FR-16]** Thêm ghi chú y tế, chẩn đoán hoặc khuyến nghị.
- **[FR-17]** Truy cập lịch sử bệnh nhân, các phân tích trước đó và dữ liệu xu hướng.
- **[FR-18]** Lọc hoặc tìm kiếm bệnh nhân theo ID, tên hoặc mức độ nguy cơ.
- **[FR-19]** Cung cấp phản hồi để cải thiện độ chính xác của AI và cập nhật mô hình.
- **[FR-20]** Trao đổi với người dùng (bệnh nhân) thông qua đoạn chat tư vấn.
- **[FR-21]** Xem tóm tắt hiệu suất hoặc thống kê phân tích.

### 2.3. Yêu Cầu Chức Năng Cho Phòng Khám (Clinic)
- **[FR-22]** Đăng ký tài khoản phòng khám và xác minh danh tính tổ chức.
- **[FR-23]** Quản lý nhiều tài khoản bác sĩ và người dùng (bệnh nhân).
- **[FR-24]** Tải lên và gửi hàng loạt ảnh võng mạc để phân tích bằng AI.
- **[FR-25]** Theo dõi tất cả báo cáo phân tích của bệnh nhân và dữ liệu nguy cơ tổng hợp.
- **[FR-26]** Tạo báo cáo toàn phòng khám cho các chiến dịch sàng lọc.
- **[FR-27]** Theo dõi số lượng ảnh đã phân tích và mức độ sử dụng gói dịch vụ.
- **[FR-28]** Mua hoặc gia hạn các gói dịch vụ cấp phòng khám.
- **[FR-29]** Nhận cảnh báo đối với bệnh nhân có nguy cơ cao hoặc các xu hướng bất thường.
- **[FR-30]** Xuất dữ liệu thống kê tóm tắt phục vụ nghiên cứu lâm sàng hoặc quản lý.

### 2.4. Yêu Cầu Chức Năng Cho Quản Trị Viên (Admin)
- **[FR-31]** Quản lý tài khoản người dùng, bác sĩ và phòng khám (kích hoạt, vô hiệu hóa, chỉnh sửa).
- **[FR-32]** Định nghĩa và cập nhật vai trò người dùng và quyền truy cập.
- **[FR-33]** Cấu hình các tham số AI, ngưỡng cảnh báo và chính sách huấn luyện lại mô hình.
- **[FR-34]** Quản lý các gói dịch vụ, giá cả và mô hình thanh toán.
- **[FR-35]** Truy cập bảng điều khiển chung hiển thị lượng sử dụng, doanh thu và hiệu suất AI.
- **[FR-36]** Xem phân tích hệ thống (số lượng ảnh, phân bố nguy cơ, tỷ lệ lỗi).
- **[FR-37]** Xử lý tuân thủ dữ liệu, nhật ký kiểm tra (audit logs) và cài đặt quyền riêng tư.
- **[FR-38]** Phê duyệt hoặc tạm ngưng đăng ký phòng khám.
- **[FR-39]** Quản lý các mẫu thông báo và chính sách liên lạc.

---

## 3. Yêu Cầu Phi Chức Năng (NFR)

### 3.1. Yêu Cầu Về Hiệu Năng
- **[NFR-1]** Phân tích AI cho một ảnh võng mạc đơn lẻ phải hoàn thành trong vòng 10–20 giây, tùy thuộc vào kích thước ảnh và tải lượng mô hình.
- **[NFR-2]** Hệ thống phải hỗ trợ xử lý hàng loạt (≥100 ảnh mỗi lô) với cơ chế xếp hàng hoặc thực thi song song.
- **[NFR-3]** Bảng điều khiển và truy xuất kết quả phải tải dưới 3 giây trong điều kiện mạng bình thường.

### 3.2. Yêu Cầu Về Độ Tin Cậy & Tính Sẵn Sàng
- **[NFR-4]** Thời gian hoạt động liên tục (uptime) của hệ thống phải đạt ≥ 99%, ngoại trừ thời gian bảo trì định kỳ.
- **[NFR-5]** AI Engine phải xử lý lỗi một cách êm ái; nếu phân tích thất bại, hệ thống phải trả về lỗi rõ ràng và bảo toàn tất cả ảnh đã tải lên.
- **[NFR-6]** Dữ liệu phải được sao lưu tự động ít nhất một lần mỗi ngày.

### 3.3. Yêu Cầu Về Khả Năng Mở Rộng
- **[NFR-7]** Kiến trúc phải cho phép mở rộng quy mô theo chiều ngang (horizontal scaling) của các microservice AI để xử lý lượng ảnh tăng cao.
- **[NFR-8]** Phải hỗ trợ nhiều phòng khám và hàng ngàn người dùng cùng lúc mà không làm suy giảm hiệu năng.

### 3.4. Yêu Cầu Về Bảo Mật & Quyền Riêng Tư
- **[NFR-9]** Tất cả dữ liệu bệnh nhân phải được mã hóa khi lưu trữ và khi truyền tải (TLS 1.2+; AES-256).
- **[NFR-10]** Hệ thống phải tuân thủ các tiêu chuẩn bảo vệ dữ liệu y tế (các thực hành tương đương HIPAA / luật dữ liệu y tế địa phương).
- **[NFR-11]** Dữ liệu nhạy cảm phải được ẩn danh trước khi sử dụng để huấn luyện lại mô hình AI.
- **[NFR-12]** Truy cập phải tuân theo kiểm soát quyền dựa trên vai trò (RBAC) cho Admin, Phòng khám, Bác sĩ và Người dùng.

### 3.5. Yêu Cầu Về Khả Năng Sử Dụng (Usability)
- **[NFR-13]** Giao diện web phải dễ tiếp cận và tương thích tốt trên máy tính để bàn, máy tính bảng và điện thoại di động.
- **[NFR-14]** Nhân viên lâm sàng phải có thể tải ảnh lên và xem kết quả trong vòng không quá 3 lần nhấp chuột.
- **[NFR-15]** Hình ảnh chú thích và giải thích nguy cơ phải rõ ràng và có thể diễn giải về mặt lâm sàng.

### 3.6. Yêu Cầu Về Khả Năng Bảo Trì
- **[NFR-16]** Các mô hình AI, ngưỡng và cấu hình phải có khả năng cập nhật mà không gây gián đoạn hệ thống.
- **[NFR-17]** Mã nguồn phải tuân theo kiến trúc mô-đun:
  - Microservice AI Core
  - Ứng dụng Web
  - Các mô-đun Admin/Clinic/Doctor
  - Lớp Cơ sở dữ liệu
- **[NFR-18]** Việc ghi nhật ký (logging), kiểm tra và theo dõi lỗi phải được tập trung hóa.

### 3.7. Yêu Cầu Về Khả Năng Tương Thích (Interoperability)
- **[NFR-19]** Phải hỗ trợ tích hợp với các máy chụp ảnh đáy mắt thông dụng (qua tải lên đám mây).
- **[NFR-20]** Các định dạng xuất dữ liệu phải bao gồm PDF, CSV và các định dạng y tế chuẩn hóa nếu có thể.
- **[NFR-21]** AI engine phải giao tiếp qua các điểm cuối API RESTful tiêu chuẩn.

### 3.8. Yêu Cầu Về Chất Lượng Dữ Liệu & Khả Năng Giải Thích
- **[NFR-22]** Đầu ra AI phải bao gồm các yếu tố giải thích (bản đồ nhiệt, mạch máu được chú thích, các bất thường được làm nổi bật).
- **[NFR-23]** Hệ thống phải theo dõi phiên bản AI và các ngưỡng được áp dụng cho từng báo cáo để đảm bảo khả năng truy xuất nguồn gốc.

---

## 4. Các Sản Phẩm Bàn Giao & Nhiệm Vụ Dự Án

### 4.1. Lý Thuyết và Thực Hành (Tài Liệu)
- Sinh viên được yêu cầu áp dụng quy trình phát triển phần mềm và UML 2.0 để mô hình hóa hệ thống.
- **Các tài liệu yêu cầu bàn giao:**
  - Tài liệu Yêu cầu Người dùng
  - Đặc tả Yêu cầu Phần mềm (SRS)
  - Thiết kế Kiến trúc & Thiết kế Chi tiết
  - Tài liệu Triển khai Hệ thống
  - Tài liệu Kiểm thử (Test Document)
  - Hướng dẫn Cài đặt
  - Mã nguồn và các gói phần mềm có thể triển khai

### 4.2. Công Nghệ Sử Dụng
* **Phía Máy Chủ (Server-side):**
  - **Khung phát triển:** .NET, Docker, VPS, v.v.
  - **Dịch vụ đám mây:** Supabase, Cloudinary
  - **AI Core:** Python
  - **Cơ sở dữ liệu:** PostgreSQL, MongoDB
* **Phía Trình Khách (Client-side):**
  - **Web Client:** React + TypeScript
  - **Mobile:** Flutter *(tùy chọn)*

### 4.3. Sản Phẩm
- API Microservice AI Core.
- Ứng dụng Web Hỗ trợ Quyết định Lâm sàng (CDS).
- Ứng dụng Web Quản lý Admin/Doctor/Client.
- Tích hợp và hỗ trợ Máy chụp đáy mắt võng mạc.

### 4.4. Đề Xuất Gói Nhiệm Vụ & Công Việc
* **Gói Nhiệm Vụ 1:** Thiết kế Giao diện (UI) cho Ứng dụng Web
* **Gói Nhiệm Vụ 2:** Phát triển API cho Hệ thống
* **Gói Nhiệm Vụ 3:** Phát triển Ứng dụng Web
* **Gói Nhiệm Vụ 4:** Đóng gói, Triển khai và Kiểm thử Hệ thống
* **Gói Nhiệm Vụ 5:** Chuẩn bị các Tài liệu bắt buộc:
  - Phân tích và Thiết kế Hệ thống
  - Kế hoạch Kiểm thử (Test Plan)
  - Hướng dẫn Cài đặt
  - Hướng dẫn Sử dụng

> [!NOTE]
> - Mỗi nhóm làm việc có thể có nhiều sinh viên tham gia nhưng phải có một thành viên chịu trách nhiệm chính cho mỗi gói nhiệm vụ.
> - **Lưu ý:** Tất cả sinh viên bắt buộc phải hiểu rõ các tài liệu tham khảo và phải sẵn sàng giải trình trước Hội đồng chấm đồ án.