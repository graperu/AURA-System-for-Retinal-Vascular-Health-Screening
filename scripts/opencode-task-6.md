Bạn là worker agent cho dự án AURA Retinal Screening. Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening

Nhiệm vụ: Tích hợp Notification Bell vào Topbar và tạo Online Presence indicator.

## Bước 1: Đọc Topbar hiện tại

Đọc file:
- frontend/src/components/layout/Topbar.tsx
- frontend/src/context/AuthContext.tsx
- frontend/src/context/LanguageContext.tsx

## Bước 2: Thêm Notification Bell vào Topbar

Sửa file frontend/src/components/layout/Topbar.tsx:
- Import và thêm component NotificationBell (nếu chưa có file thì tạo inline)
- Đặt bell icon cạnh avatar/user info ở góc phải topbar
- Bell icon dùng lucide-react icon Bell
- Badge count hiển thị số thông báo chưa đọc (mock data tạm: 3 notifications)
- Click bell mở dropdown panel với danh sách notifications
- Mỗi notification item gồm: icon, title, message, timestamp relative (vd: "5 phút trước")
- Nút "Đánh dấu tất cả đã đọc" ở header dropdown
- Style: bg-white, border border-[#EAECF0], shadow-lg, rounded-2xl, max-h-80 overflow-y-auto
- Bilingual: dùng isVi pattern cho tất cả text

## Bước 3: Thêm Online Status Indicator

Trong Topbar, thêm một dot indicator nhỏ:
- Xanh (w-2 h-2 rounded-full bg-emerald-500) = đang kết nối real-time
- Vàng (bg-amber-500) = đang reconnect
- Đỏ (bg-rose-500) = mất kết nối
- Đặt cạnh avatar hoặc username
- Tooltip: "Kết nối real-time: Đang hoạt động" / "Real-time connection: Active"

## Bước 4: Tạo Mock Notification Data

Trong Topbar hoặc file riêng, tạo mock notifications:
- "Bệnh nhân Trần Thị Mai đã tải ảnh fundus mới" (type: SCAN_UPLOADED)
- "BS. Nguyễn Văn An đã duyệt kết quả #SCR-2026-0918-01" (type: RESULT_REVIEWED)
- "Batch B-2026-0918 đã hoàn tất phân tích AI" (type: BATCH_COMPLETED)
- "Cảnh báo: Phát hiện ca nguy cơ CAO - MRN-78214" (type: ALERT_HIGH_RISK)
- Mỗi notification có: id, type, title, message, timestamp, read (boolean), link (string)

## Bước 5: Build & Test

Chạy tuần tự trong frontend/:
  npm run build
  npm test

Sửa bất kỳ lỗi nào.
