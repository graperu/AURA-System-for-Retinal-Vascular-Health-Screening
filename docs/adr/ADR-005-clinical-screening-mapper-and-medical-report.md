# ADR-005: CHUẨN HÓA ÁNH XẠ DỮ LIỆU SÀNG LỌC, XÓA BỎ MOCK VÀ BẢO ĐẢM TÍNH TOÀN VẸN BÁO CÁO Y KHOA

## 1. Trạng Thái
Đã Chấp Thuận (Approved) - Ngày: 13/09/2026

## 2. Ngữ Cảnh
1. `screeningMapper.ts` trước đây sử dụng công thức `screening.confidence * 100` để tính điểm nguy cơ mạch máu tổng hợp (`overallScore`). Điều này vi phạm nghiêm trọng nguyên tắc an toàn y khoa vì `confidence` là độ tự tin thống kê của mô hình mạng nơ-ron, không phải xác suất hay mức độ nguy cơ lâm sàng.
2. Hàm `generateAnomaliesFromMetrics` tự sinh các tọa độ tổn thương giả lập (`ANO-AV-1`, `ANO-MA-2`, `ANO-HEM-3`) với bounding box cứng. Đây là vi phạm quy định cấm Mock dữ liệu trong môi trường sản xuất (No Mock in Production).
3. Bảng lịch sử khám bệnh tại `PatientPortalPage.tsx` đang triển khai bằng mã HTML `table` inline, bỏ quên component `PatientHistoryView` và thiếu các cột thông tin lâm sàng trọng yếu.
4. `MedicalReportModal.tsx` thiếu Tuyên bố Miễn trừ Trách nhiệm Y tế bắt buộc, cố định chuỗi đánh giá lâm sàng 4 chỉ số sinh học thay vì tính toán động, và hiển thị chữ ký bác sĩ bất kể ca khám đã được phê duyệt hay chưa. Đồng thời, ngày in và xuất CSV bị lấy sai theo `new Date()` hiện tại.

## 3. Quyết Định Kiến Trúc
1. **Sửa dứt điểm công thức tính điểm**: Lấy trực tiếp trường `riskScore` từ CSDL (hoặc trung bình cộng giữa nguy cơ tim mạch và đái tháo đường nếu không có `riskScore`). Cấm hoàn toàn việc lấy `confidence * 100`.
2. **Loại bỏ hàm sinh tọa độ giả lập**: Xóa bỏ hoàn toàn `generateAnomaliesFromMetrics`. Chỉ hiển thị các vùng tổn thương khi AI Core hoặc CSDL thực sự cung cấp dữ liệu.
3. **Ánh xạ toàn diện các trường CSDL**: Bổ sung ánh xạ `riskScore`, `eyePosition`, `scanType`, `icd10Codes`, `doctorNotes`, `digitalSignature`, `signedAt`, `createdAt`.
4. **Tái cấu trúc giao diện Lịch sử khám**: Nâng cấp interface `PatientHistoryItem` với đầy đủ 7 cột thông tin chuẩn Clinical UI, tích hợp `PatientHistoryView` vào `PatientPortalPage.tsx` thay thế bảng inline.
5. **Nâng cấp Báo cáo Y khoa**:
   - Thêm Tuyên bố Miễn trừ Y tế (Medical Disclaimer) trên Web Modal, Print PDF và file CSV.
   - Động hóa cột Đánh giá lâm sàng cho 4 chỉ số sinh học theo ngưỡng y văn chuẩn.
   - Hiển thị danh mục mã bệnh ICD-10.
   - Cổng thẩm định bác sĩ: Chỉ hiển thị tên bác sĩ, chữ ký số HMAC và thời gian ký khi `status === 'REVIEWED'`. Nếu chưa duyệt, hiển thị rõ ràng "Đang chờ Bác sĩ thẩm định" và khuyến nghị từ AI.
   - Sử dụng dấu thời gian `createdAt` thực tế của ca khám khi in PDF và xuất CSV.

## 4. Hệ Quả & Tác Động
- **Tích cực**:
  - Tuân thủ 100% các tiêu chuẩn Medical Safety Rules và quy định của Bộ Y Tế / FDA SaMD.
  - Ngăn ngừa tình trạng False Positive do nhầm lẫn confidence.
  - Loại bỏ hoàn toàn mã giả (Mock data) trong luồng chẩn đoán lâm sàng.
  - Minh bạch hóa tính pháp lý của chữ ký số HMAC-SHA256.
- **Tiêu cực / Ràng buộc**:
  - `frontend-developer` và `backend-developer` phải đồng bộ các kiểu dữ liệu và thuộc tính DTO.
