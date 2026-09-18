Bạn là AI/Frontend UI agent cho dự án AURA Retinal Screening. Working directory: e:\AURA-System-for-Retinal-Vascular-Health-Screening

Nhiệm vụ: Xây dựng Component "AI Diagnostic Multi-Layer Overlay" cho phép xem mạch máu (Vessel Segmentation), bản đồ nhiệt (Heatmap), và vị trí tổn thương vi mạch (Microaneurysm Detection) như giao diện chẩn đoán chuyên sâu lâm sàng.

## Bước 1: Khảo sát InteractiveCDSViewer.tsx
Đọc file frontend/src/components/InteractiveCDSViewer.tsx để nắm cách render ảnh võng mạc và các overlay hiện tại.

## Bước 2: Tạo Component `VesselHeatmapOverlay.tsx`
Tạo file mới: `frontend/src/components/VesselHeatmapOverlay.tsx`
Bao gồm:
- Sử dụng Canvas HTML5 hoặc SVG đa lớp nằm đè chuẩn xác lên ảnh võng mạc (Fundus Image)
- **Lớp 1: Lưới mạch máu (Vessel Segmentation - Xanh neon #10B981 / #00FF66)**: Vẽ các nhánh động mạch/tĩnh mạch chính tỏa ra từ gai thị (Optic Disc) tới hoàng điểm (Macula). Có thanh trượt độ mờ Opacity (0% - 100%).
- **Lớp 2: Bản đồ nhiệt rủi ro (Risk Heatmap - Gradient Đỏ/Vàng/Cam)**: Hiển thị các điểm nóng tổn thương võng mạc vi mạch (độ phân giải cao với hiệu ứng radial gradient gaussian blur).
- **Lớp 3: Bounding Box Vi phình mạch & Xuất huyết (MA / Hemorrhage Detection - Khung viền vàng #F59E0B)**: Đánh dấu các hình chữ nhật bao quanh tổn thương vi mạch, kèm nhãn phân loại ("MA Detected", "Exudate", "Micro-Bleed").
- Bảng điều khiển (Overlay Control Panel): Cho phép Bác sĩ bật/tắt từng lớp độc lập (Toggle switches: Vessel, Heatmap, Bounding Boxes, Invert Colors).
- Nhãn thông tin góc trên: "AI DIAGNOSTIC OVERLAY", "SCAN: OD/OS", "DR STATUS: NPDR / MODERATE / SEVERE", "A/V RATIO: 0.65".
- Giao diện chuẩn MediRoom / Dark Clinical Diagnostic mode.

## Bước 3: Tích hợp vào `InteractiveCDSViewer.tsx`
Nhúng component `VesselHeatmapOverlay` vào phần trung tâm của `InteractiveCDSViewer.tsx` như một chế độ xem nâng cao ("Chế độ Chẩn đoán Chuyên sâu AI").

## Bước 4: Kiểm tra build
Chạy trong thư mục frontend/:
  npm run build
Đảm bảo 0 lỗi TypeScript.
