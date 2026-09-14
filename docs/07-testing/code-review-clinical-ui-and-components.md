# BIÊN BẢN ĐÁNH GIÁ MÃ NGUỒN ĐỘC LẬP (INDEPENDENT CODE REVIEW REPORT)
**Dự án**: AURA - System for Retinal Vascular Health Screening  
**Chuyên viên đánh giá**: AURA Independent Code Reviewer  
**Ngày thực hiện**: 14/09/2026  
**Phạm vi đánh giá**: Các thay đổi nâng cấp Clinical UI & CDS Components:
1. `frontend/index.html`
2. `frontend/tailwind.config.js`
3. `frontend/src/styles/theme.css`
4. `frontend/src/components/ui/EyeBadge.tsx`
5. `frontend/src/components/ui/ScanTypeBadge.tsx`
6. `frontend/src/components/ui/DataTable.tsx`
7. `frontend/src/features/patient/PatientHistoryView.tsx`
8. `frontend/src/features/doctor/DoctorWorklistView.tsx`
9. `frontend/src/features/doctor/DoctorReportsView.tsx`
10. `frontend/src/features/clinic/ClinicBatchWorkspace.tsx`
11. `frontend/src/tests/clinical-ui-components.test.ts`

---

## 1. Tóm Tắt Tổng Quan (Summary)
Đợt thay đổi mã nguồn đã mang lại bước tiến lớn trong việc chuẩn hóa hệ thống thiết kế giao diện lâm sàng (Clinical Minimal Design System) cho dự án AURA. Mã nguồn đã bổ sung hai thành phần UI tái sử dụng cốt lõi là `EyeBadge` và `ScanTypeBadge`, tách biệt chuẩn xác định dạng căn lề và kiểu chữ monospace trong `DataTable`, đồng thời hiện đại hóa thanh công cụ lọc - tìm kiếm trên các màn hình làm việc của Bác sĩ, Bệnh nhân và Phòng khám. Toàn bộ 66/66 bài kiểm thử trong suite mới cùng toàn bộ 90/90 kiểm thử frontend đều vượt qua (100% PASS) và bản build production đạt kết quả xuất sắc; tuy nhiên, vẫn còn một số điểm bất đồng bộ logic hiển thị trạng thái và bộ lọc cần được hoàn thiện trước khi nghiệm thu phát hành.

---

## 2. Bảng Các Vấn Đề Tìm Thấy (Issues Found)

| Mức Độ | Tệp Tin:Dòng | Trục Đánh Giá | Mô Tả Ngắn Gọn |
|---|---|---|---|
| `WARNING` | `frontend/src/features/clinic/ClinicBatchWorkspace.tsx:86-93` | Logic / Medical UX | Cột trạng thái xử lý hardcode màu xanh và icon thành công `CheckCircle2` cho mọi dòng, kể cả khi ca ảnh bị lỗi `FAILED`/`ERROR`. |
| `WARNING` | `frontend/src/features/doctor/DoctorWorklistView.tsx:57-67` | Logic Nghiệp Vụ | Bộ lọc `filteredPatients` lọc cứng tuyệt đối `patientRisk === riskFilter`, làm sót bệnh nhân có mức `SEVERE`/`ALARM` khi bấm chọn thẻ "Rất nghiêm trọng". |
| `WARNING` | `frontend/src/features/clinic/ClinicBatchWorkspace.tsx:39-64` | Hiệu Năng (Performance) | Biến lọc `filteredItems` trong workspace hàng loạt chưa được bọc `useMemo`, gây lọc lại mảng trên mọi lượt re-render. |
| `SUGGESTION` | `frontend/src/components/ui/EyeBadge.tsx:16` | Medical Safety | Giá trị mặc định `position = 'OD'` tự động gán nhãn thành Mắt Phải khi thiếu dữ liệu vị trí mắt, nên đổi thành `''` để hiển thị "Chưa xác định". |
| `SUGGESTION` | `frontend/src/features/doctor/DoctorWorklistView.tsx:4,5,11,12,14-16` | Mã Rác (Dead Code) | 7 biểu tượng Lucide (`Users`, `AlertTriangle`, `SlidersHorizontal`, `UserCheck`, `Heart`, `Activity`, `FileText`) được import nhưng không dùng. |
| `SUGGESTION` | `frontend/src/features/clinic/ClinicBatchWorkspace.tsx:6-14` | Mã Rác (Dead Code) | 6 biểu tượng Lucide (`AlertTriangle`, `Clock`, `RotateCcw`, `Filter`, `Play`, `FileText`) được import nhưng không dùng. |

---

## 3. Chi Tiết Từng Vấn Đề & Khuyến Nghị Khắc Phục (Detailed Findings)

### Phát hiện 1: Cột trạng thái hàng loạt hardcode nhãn thành công
- **Tệp tin**: `frontend/src/features/clinic/ClinicBatchWorkspace.tsx:86-93`
- **Mức độ**: `WARNING`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề**:
  Trong bảng danh sách tệp ảnh của chiến dịch khám hàng loạt, cột `Trạng Thái` hiện đang gán cố định:
  ```tsx
  {
    header: 'Trạng Thái',
    accessor: (row) => (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {row.status || 'Đã xử lý'}
      </span>
    ),
  }
  ```
  Hậu quả: Khi một ảnh bị chụp mờ, đục thủy tinh thể hoặc lỗi hệ thống xử lý (`status === 'FAILED'` hoặc `'ERROR'`), badge vẫn được tô màu xanh ngọc lục bảo kèm biểu tượng dấu tích xanh `CheckCircle2`. Điều này vi phạm nghiêm trọng tính trực quan trong Clinical UI, gây hiểu nhầm cho kỹ thuật viên phòng khám rằng tệp đã phân tích thành công.
- **Đề xuất khắc phục**:
  Tận dụng các icon đã import (`AlertTriangle`, `Clock`, `CheckCircle2`) để phân loại trạng thái trực quan:
  ```tsx
  accessor: (row) => {
    const s = (row.status || '').toUpperCase();
    if (s.includes('FAIL') || s.includes('ERROR') || s.includes('LỖI')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/80">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          {row.status || 'Lỗi xử lý'}
        </span>
      );
    }
    if (s.includes('PROCESS') || s.includes('QUEUE') || s.includes('PROGRESS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
          <Clock className="w-3 h-3 text-amber-600" />
          {row.status || 'Đang xử lý'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {row.status || 'Đã xử lý'}
      </span>
    );
  }
  ```

---

### Phát hiện 2: Lệch pha giữa bộ đếm thẻ nguy cơ và bộ lọc danh sách bệnh nhân
- **Tệp tin**: `frontend/src/features/doctor/DoctorWorklistView.tsx:57-67`
- **Mức độ**: `WARNING`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề**:
  Hàm tính thống kê số lượng `riskCounts` (dòng 75) chấp nhận các nhãn tương đương:
  `if (lvl === 'CRITICAL' || lvl === 'SEVERE' || lvl === 'ALARM') counts.critical++;`
  Tuy nhiên, trong `filteredPatients` (dòng 57-58):
  `const patientRisk = (p.riskLevel || 'Low').toUpperCase();`
  `const matchRisk = riskFilter === 'ALL' || patientRisk === riskFilter;`
  Khi bác sĩ nhấp chuột vào thẻ "Rất nghiêm trọng" (`riskFilter = 'CRITICAL'`), các bệnh nhân có nhãn `riskLevel` là `SEVERE` hoặc `ALARM` (đã được tính vào con số trên thẻ) lại bị loại khỏi bảng danh sách lọc.
- **Đề xuất khắc phục**:
  Đồng bộ quy tắc so sánh nhãn nguy cơ tương tự như đã làm chuẩn mực tại `PatientHistoryView`:
  ```tsx
  const matchRisk =
    riskFilter === 'ALL' ||
    (riskFilter === 'LOW' && (patientRisk === 'LOW' || patientRisk === 'NORMAL')) ||
    (riskFilter === 'MODERATE' && (patientRisk === 'MODERATE' || patientRisk === 'MEDIUM')) ||
    (riskFilter === 'HIGH' && patientRisk === 'HIGH') ||
    (riskFilter === 'CRITICAL' && (patientRisk === 'CRITICAL' || patientRisk === 'SEVERE' || patientRisk === 'ALARM'));
  ```

---

### Phát hiện 3: Thiếu `useMemo` cho bộ lọc đợt ảnh hàng loạt
- **Tệp tin**: `frontend/src/features/clinic/ClinicBatchWorkspace.tsx:39-64`
- **Mức độ**: `WARNING`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề**:
  Mảng `filteredItems` được thực thi trực tiếp trong thân component không qua `useMemo`:
  `const filteredItems = (batchJob.items || []).filter((it) => { ... });`
  Với các chiến dịch sàng lọc quy mô lớn tại phòng khám (thường chứa hàng trăm đến hàng nghìn ảnh), mỗi khi người dùng nhập từ khóa tìm kiếm hoặc khi trạng thái ngầm cập nhật, thao tác lọc mảng toàn bộ sẽ bị chạy lại không cần thiết.
- **Đề xuất khắc phục**:
  Bọc bằng `useMemo`:
  ```tsx
  const filteredItems = useMemo(() => {
    return (batchJob.items || []).filter((it) => {
      // Logic lọc tìm kiếm & trạng thái
    });
  }, [batchJob.items, searchTerm, statusFilter]);
  ```

---

### Phát hiện 4: Giá trị mặc định của vị trí mắt trong `EyeBadge`
- **Tệp tin**: `frontend/src/components/ui/EyeBadge.tsx:16`
- **Mức độ**: `SUGGESTION`
- **Độ tin cậy (Confidence)**: Medium
- **Vấn đề**:
  Component khai báo mặc định `position = 'OD'`. Nếu một bản ghi ảnh đầu vào bị thiếu trường vị trí mắt (`position === undefined`), giao diện sẽ tự động hiển thị là "Mắt Phải (OD)". Theo nguyên tắc an toàn y tế AURA, không được tự suy diễn thông tin giải phẫu khi chưa có dữ liệu.
- **Đề xuất khắc phục**:
  Chuyển giá trị mặc định thành `position = ''`. Khi đó, component sẽ chuyển vào nhánh an toàn hiển thị nhãn `Chưa xác định` với màu xám trung tính (`bg-slate-50 text-slate-700`).

---

### Phát hiện 5 & 6: Dọn dẹp Imports không sử dụng (Dead Code)
- **Tệp tin**:
  - `frontend/src/features/doctor/DoctorWorklistView.tsx:4, 5, 11, 12, 14, 15, 16`
  - `frontend/src/features/clinic/ClinicBatchWorkspace.tsx:6, 7, 8, 10, 13, 14`
- **Mức độ**: `SUGGESTION`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề**:
  - `DoctorWorklistView`: `Users`, `AlertTriangle`, `SlidersHorizontal`, `UserCheck`, `Heart`, `Activity`, `FileText` không được gọi trong component.
  - `ClinicBatchWorkspace`: `Filter`, `Play`, `FileText` không được dùng; `RotateCcw` có thể dùng để bổ sung nút đặt lại bộ lọc; `AlertTriangle` và `Clock` cần được dùng cho Phát hiện 1.
- **Đề xuất khắc phục**: Xóa bỏ các biểu tượng không dùng để tối ưu kích thước bundle và tuân thủ tiêu chí mã nguồn sạch.

---

## 4. Đánh Giá Toàn Diện Theo 6 Trục Nghiệp Vụ

1. **An ninh (Security) - ĐẠT (PASS)**:
   - Toàn bộ dữ liệu hiển thị (MRN, họ tên bệnh nhân, ghi chú lâm sàng, mã ca khám, chữ ký số) đều được render an toàn qua JSX, phòng chống triệt để XSS.
   - Không có API key, token hay dữ liệu bí mật nào bị lộ trong code.
   - Các nút bấm hành động đều được gắn `type="button"` ngăn ngừa hành vi submit ngoài ý muốn.
2. **Hiệu năng (Performance) - ĐẠT YÊU CẦU CÓ ĐIỀU KIỆN (PASS WITH WARNING)**:
   - Đã loại bỏ triệt để CSS quy định `letter-spacing: 0.01em` toàn cục trên `p, span, label, div`, loại bỏ hàng loạt layout reflows không đáng có.
   - Các bảng chính ở Bác sĩ và Bệnh nhân đều sử dụng `useMemo` hiệu quả. Cần bổ sung `useMemo` cho `ClinicBatchWorkspace`.
3. **Logic Nghiệp vụ (Business Logic) - ĐẠT YÊU CẦU CÓ ĐIỀU KIỆN (PASS WITH WARNING)**:
   - Tách biệt xuất sắc `align === 'right'` khỏi `font-mono-data` trong `DataTable`, sửa dứt điểm lỗi chữ monospace trên các nút bấm chức năng.
   - Cần đồng bộ quy tắc lọc nguy cơ `CRITICAL` trên Doctor Worklist và trạng thái xử lý ảnh phòng khám.
4. **An toàn Triển khai (Deploy Safety) - ĐẠT (PASS)**:
   - Lệnh biên dịch `tsc && vite build` hoàn thành 100% thành công không có lỗi TypeScript hay Vite chunking.
   - Toàn bộ 90/90 kiểm thử frontend (gồm 66 bài trong bộ test mới) đều đạt 100% PASS.
5. **Chống Trùng lặp (Duplication) - ĐẠT (PASS)**:
   - `EyeBadge` và `ScanTypeBadge` loại bỏ triệt để hàng chục đoạn mã render phân nhánh trùng lặp trước đây, nâng cao tính tái sử dụng và khả năng bảo trì.
6. **Mã nguồn Rác (Dead Code) - ĐẠT YÊU CẦU CÓ ĐIỀU KIỆN (PASS WITH SUGGESTION)**:
   - Cần dọn dẹp các import icon dư thừa trong `DoctorWorklistView` và `ClinicBatchWorkspace`.

---

## 5. Kết Luận Khuyến Nghị (Recommendation)

### **PHÁN QUYẾT: REVISE (YÊU CẦU ĐIỀU CHỈNH NHỎ TRƯỚC KHI BÀN GIAO CEO)**

**Lý do**:
Chất lượng cấu trúc của đợt cập nhật rất tốt, đạt độ hoàn thiện cao về giao diện và kiểm thử. Tuy nhiên, để đảm bảo tính an toàn lâm sàng (Medical UX) và tính nhất quán logic dữ liệu, subagent tác giả cần khắc phục 2 điểm cảnh báo chính:
1. Sửa màu sắc/icon trạng thái trong `ClinicBatchWorkspace` để ca lỗi (`FAILED`) không hiển thị màu xanh và dấu tích thành công.
2. Mở rộng điều kiện lọc nguy cơ `CRITICAL` trong `DoctorWorklistView` khớp với bộ đếm thống kê (`CRITICAL | SEVERE | ALARM`).
3. Bọc `useMemo` cho `filteredItems` và dọn dẹp các import icon dư thừa.

Sau khi subagent tác giả hoàn tất các điều chỉnh trên, bộ mã nguồn sẽ đạt điều kiện phê duyệt **APPROVE** tuyệt đối.
