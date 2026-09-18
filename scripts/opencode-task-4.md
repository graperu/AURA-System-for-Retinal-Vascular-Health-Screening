Bạn là worker agent cho dự án AURA Retinal Screening. Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening

Nhiệm vụ: Tích hợp Cross-Portal Linking vào các page hiện có.

## Bước 1: Đọc cấu trúc hiện tại

Đọc các file sau để hiểu cấu trúc:
- frontend/src/pages/PatientPortalPage.tsx
- frontend/src/features/doctor/DoctorDashboardView.tsx
- frontend/src/pages/ClinicPortalPage.tsx
- frontend/src/pages/AdminAuditLogsPage.tsx
- frontend/src/components/layout/Sidebar.tsx

## Bước 2: Thêm Cross-Portal Links vào Doctor Dashboard

Trong file frontend/src/features/doctor/DoctorDashboardView.tsx:
- Khi bác sĩ xem một case, thêm link/button để navigate đến hồ sơ bệnh nhân tương ứng
- Thêm onClick handler cho patient name trong bảng case list, khi click thì chuyển đến patient profile
- Đảm bảo dùng bilingual text (isVi pattern) cho tất cả label mới

## Bước 3: Thêm Doctor Info vào Patient Portal

Trong file frontend/src/pages/PatientPortalPage.tsx:
- Hiển thị thông tin bác sĩ được phân công (tên, chuyên khoa)
- Hiển thị trạng thái review: "Đang chờ duyệt" / "Đã duyệt" / "Chưa gửi"
- Dùng StatusBadge component (import từ ../components/ui/StatusBadge)

## Bước 4: Thêm Drill-down Links trong Clinic Portal

Trong file frontend/src/pages/ClinicPortalPage.tsx:
- Từ batch overview, thêm link drill-down vào từng kết quả scan riêng lẻ
- Mỗi row trong bảng kết quả có onClick để xem chi tiết

## Bước 5: Build & Test

Chạy tuần tự trong thư mục frontend/:
  npm run build
  npm test

Sửa bất kỳ lỗi nào cho đến khi cả build và test đều pass 100%.
