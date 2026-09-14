# BIÊN BẢN ĐÁNH GIÁ MÃ NGUỒN ĐỘC LẬP (INDEPENDENT CODE REVIEW REPORT)
## DỰ ÁN AURA - SYSTEM FOR RETINAL VASCULAR HEALTH SCREENING
### Chuyên Đề: Thẩm Định Nâng Cấp Component `ClinicalSelect` & Hệ Thống Chuyển Động (Clinical Motion System)

---

- **Chuyên viên đánh giá**: Chuyên Viên Đánh Giá Mã Nguồn Độc Lập (AURA Independent Code Reviewer)
- **Ngày đánh giá**: 14/09/2026
- **Phạm vi rà soát**:
  1. Component cốt lõi mới: `frontend/src/components/ui/ClinicalSelect.tsx` & barrel export `frontend/src/components/ui/index.ts`.
  2. Mở rộng cấu hình chuyển động: `frontend/tailwind.config.js` & `frontend/src/styles/theme.css`.
  3. 13 màn hình và modal được nâng cấp thay thế thẻ native `<select>`:
     - `frontend/src/components/PatientUploader.tsx`
     - `frontend/src/features/patient/PatientHistoryView.tsx`
     - `frontend/src/components/DoctorDiagnosisModal.tsx`
     - `frontend/src/features/doctor/DoctorWorklistView.tsx`
     - `frontend/src/components/PatientAssignmentBoard.tsx`
     - `frontend/src/components/BatchUploadModal.tsx`
     - `frontend/src/features/clinic/ClinicBatchWorkspace.tsx`
     - `frontend/src/components/ClinicBatchProcessing.tsx`
     - `frontend/src/components/MedicalProfileModal.tsx`
     - `frontend/src/features/admin/AdminAuditWorkspace.tsx`
     - `frontend/src/pages/AdminAuditLogsPage.tsx`
     - `frontend/src/pages/DoctorPatientListPage.tsx`
     - `frontend/src/pages/ClinicPortalPage.tsx`
  4. Bộ kiểm thử tự động: `frontend/src/tests/clinical-ui-components.test.ts`.
- **Kết quả kiểm thử & cổng biên dịch**:
  - `npm test`: 76/76 unit & integration tests PASS (100%).
  - `npm run build` (`tsc && vite build`): Hoàn thành trong 4.27s không có lỗi TypeScript hay bundle.
- **Kết luận khuyến nghị**: **APPROVE WITH SUGGESTIONS** (Chấp thuận nghiệm thu, kèm 4 khuyến nghị tối ưu hóa).

---

## 1. Tóm Tắt Tổng Quan (Summary)
Đợt tái cấu trúc frontend đã triển khai thành công component lựa chọn lâm sàng chuyên biệt `ClinicalSelect`, thay thế triệt để các thẻ native `<select>` thô sơ trên toàn bộ 13 màn hình và modal nghiệp vụ của 4 vai trò (Bệnh nhân, Bác sĩ, Phòng khám, Quản trị viên). Hệ thống chuyển động (Motion System) được tích hợp bài bản qua Tailwind CSS và CSS Variables, sử dụng 100% các thuộc tính tăng tốc phần cứng GPU (`transform`, `opacity`), đảm bảo trải nghiệm tương tác lâm sàng mượt mà và an toàn quang học. Mã nguồn đạt chuẩn bảo mật XSS, quản lý bộ nhớ sự kiện (Event Listener cleanup) chặt chẽ, type safety vững chắc và vượt qua xuất sắc cả 2 cổng chất lượng kiểm thử tự động (100% PASS) và build production.

---

## 2. Đánh Giá Toàn Diện Theo 6 Trục Chuyên Môn

### Trục 1: An Ninh & Quyền Riêng Tư (Security & Privacy) - Đánh giá: XUẤT SẮC (PASS)
- **Chống tấn công XSS qua Label/Sublabel**:
  Toàn bộ các chuỗi nhãn (`option.label`, `option.sublabel`, `placeholder`, `helperText`, `error`) đều được hiển thị qua cú pháp nội suy React JSX (`{option.label}`), tự động escape các ký tự đặc biệt HTML (`<`, `>`, `&`, `"`, `'`). Tuyệt đối không sử dụng `dangerouslySetInnerHTML`.
- **Bảo vệ dữ liệu nhạy cảm & Quản lý phiên**:
  Trong `AuthContext.tsx`, hàm `logout()` đã được bổ sung cơ chế tự động dọn dẹp các khóa lưu trữ đợt khám của phòng khám trong `localStorage` (`AURA_CLINIC_BATCH_JOB_${userId}`), ngăn chặn rò rỉ dữ liệu thông tin sức khỏe được bảo vệ (PHI) khi dùng chung máy tính tại cơ sở y tế (Shared Kiosk/PC).
- **Không lộ thông tin bí mật (Secrets)**:
  Không phát hiện API key, JWT secret hay private key nào bị lưu cứng trong mã nguồn. Cấu hình Firebase và API client truy xuất an toàn qua biến môi trường `import.meta.env`.

### Trục 2: Hiệu Năng & Quản Lý Bộ Nhớ (Performance) - Đánh giá: XUẤT SẮC (PASS)
- **Quản lý Event Listener & Chống Memory Leak**:
  Trong `ClinicalSelect.tsx`, hook `useEffect` lắng nghe click outside (`mousedown`, `touchstart`) chỉ được đăng ký khi dropdown mở (`isOpen === true`) và lập tức được gỡ bỏ trong cleanup function (`removeEventListener`) khi đóng hoặc unmount component. Sự kiện phím bấm (`onKeyDown`) được gắn trực tiếp trên trigger `<button>`, tự động giải phóng theo chu kỳ vòng đời React.
- **Tăng tốc phần cứng GPU (GPU Acceleration)**:
  Các keyframes chuyển động trong `tailwind.config.js` (`dropdownEnter`, `dropdownExit`, `modalEnter`, `slideUp`, `scaleIn`) hoàn toàn thao tác trên `transform` (`scale`, `translateY`) và `opacity`. Đây là các thuộc tính composite-only, không kích hoạt Layout Recalculation (Reflow) gây giật khung hình trên CPU.
- **Tối ưu hóa Re-render**:
  Hàm tính toán vị trí menu `calculatePlacement` được bọc trong `useCallback`. Các mảng danh mục lựa chọn (`EYE_FILTER_OPTIONS`, `RISK_FILTER_OPTIONS`, `STATUS_FILTER_OPTIONS`, v.v.) tại các trang nghiệp vụ đều được khai báo hằng số cấp module (module-level constants) hoặc bọc trong `useMemo`, triệt tiêu chi phí cấp phát bộ nhớ mảng mới khi component cha re-render.

### Trục 3: Logic Nghiệp Vụ & An Toàn Kiểu Dữ Liệu (Logic & Type Safety) - Đánh giá: RẤT TỐT (PASS WITH SUGGESTION)
- **Hỗ trợ Generic Types `ClinicalSelect<T>`**:
  Thiết kế generic `T extends string | number = string` cho phép component hoạt động chuẩn xác với cả string union (`'OD' | 'OS'`, `RiskLevel`, `SortByType`) lẫn kiểu số (`pageSize: number` trong `ClinicBatchProcessing.tsx`).
- **An toàn giá trị rỗng / biên (Edge Cases)**:
  Khi `value` truyền vào là `undefined`, `null` hoặc không tồn tại trong danh mục `options`, component hiển thị fallback `placeholder` màu slate trung tính an toàn, không gây vỡ giao diện hay lỗi undefined property access.
- **Điều hướng phím bấm & Khóa tương tác Option Disabled**:
  Các phím `ArrowDown` / `ArrowUp` tích hợp vòng lặp nhảy qua các option có `disabled: true`. Phím `Home` và `End` tự động tìm option khả dụng đầu tiên và cuối cùng. Hành động click chuột và phím `Enter` / `Space` đều có chốt chặn kiểm tra `!option.disabled`.

### Trục 4: An Toàn Triển Khai (Deploy Safety) - Đánh giá: XUẤT SẮC (PASS)
- **Khả năng tương thích ngược (Backward Compatibility)**:
  Component hỗ trợ linh hoạt cả hai cách đặt tên prop buồng tối `isDarkRoom` và `darkroom` (`const effectiveDarkRoom = Boolean(isDarkRoom || darkroom);`), đảm bảo hoạt động trơn tru với cả mã nguồn mới và các component CDS cũ.
- **Cổng chất lượng kiểm thử & đóng gói**:
  - `npm test`: 76/76 ca kiểm thử giao diện đạt 100% PASS.
  - `tsc && vite build`: Biên dịch TypeScript và đóng gói Vite thành công tuyệt đối trong 4.27s.

### Trục 5: Chống Trùng Lặp Mã Nguồn (Duplication) - Đánh giá: XUẤT SẮC (PASS)
- Loại bỏ hoàn toàn hơn 20 đoạn mã thẻ `<select>` lặp đi lặp lại rải rác trên 13 tệp giao diện. Toàn bộ logic giao diện, hành vi dropdown, darkroom mode, hiệu ứng mũi tên quay, dot phân tầng nguy cơ và scrollbar tùy biến được tập trung hóa vào duy nhất một component nguyên tử `ClinicalSelect.tsx`.

### Trục 6: Mã Nguồn Rác & Thừa Thãi (Dead Code) - Đánh giá: XUẤT SẮC (PASS)
- Không có bất kỳ lệnh `console.log` debug nào bị bỏ quên trong mã nguồn sản phẩm.
- Toàn bộ 100% các icon Lucide (`ChevronDown`, `Check`, `AlertCircle`) và các hook React được import trong `ClinicalSelect.tsx` đều được sử dụng thực tế.
- Các import không còn dùng tại `ClinicBatchWorkspace.tsx` và `DoctorWorklistView.tsx` đã được dọn sạch sẽ.

---

## 3. Bảng Tổng Hợp Các Vấn Đề Tìm Thấy (Issues Found)

| Mức Độ | Tệp Tin:Dòng | Trục Đánh Giá | Mô Tả Ngắn Gọn |
|---|---|---|---|
| `SUGGESTION` | `frontend/src/components/ui/ClinicalSelect.tsx:297` | Logic & Type Safety | Ép kiểu `e.target.value as unknown as T` trong native select ẩn có thể trả về string khi `T` là number nếu kích hoạt qua native event. |
| `SUGGESTION` | `frontend/src/components/ui/ClinicalSelect.tsx:310-328` | Accessibility (WCAG) | Thiếu `aria-activedescendant` trên combobox trigger trỏ tới ID của `li` option đang được highlight cho Screen Reader. |
| `SUGGESTION` | `frontend/src/components/ui/ClinicalSelect.tsx:133-134` | Keyboard Navigation | Khởi tạo `highlightedIndex = 0` khi `value` không khớp có thể trỏ vào option bị disabled nếu option đầu tiên bị khóa. |
| `SUGGESTION` | `frontend/src/components/ui/ClinicalSelect.tsx:340, 427` | UI/UX & Truncation | Nên bổ sung thuộc tính `title` trên thẻ span của trigger và option để bác sĩ có thể xem toàn văn nhãn dài khi rê chuột. |

---

## 4. Chi Tiết Từng Vấn Đề & Đề Xuất Khắc Phục (Detailed Findings)

### 1. Ép kiểu an toàn trong thẻ Native `<select>` ẩn
- **Tệp tin**: `frontend/src/components/ui/ClinicalSelect.tsx:297`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề**:
  Thẻ native `<select className="sr-only">` dùng để hỗ trợ form serialization bản địa và kiểm thử. Tại dòng 297:
  ```tsx
  onChange={(e) => onChange(e.target.value as unknown as T)}
  ```
  Khi người dùng click trên Custom Dropdown UI, `handleSelectOption` truyền trực tiếp `option.value` (giữ nguyên kiểu `number` hoặc `string`). Tuy nhiên, nếu có luồng tự động (Auto-fill hoặc Headless test) kích hoạt sự kiện `change` trực tiếp trên native select, `e.target.value` luôn là kiểu `string`, dẫn đến việc `onChange` nhận chuỗi `"25"` thay vì số `25`.
- **Đề xuất khắc phục**:
  Tìm ngược lại option gốc theo giá trị chuỗi trước khi phát sinh callback:
  ```tsx
  onChange={(e) => {
    const rawVal = e.target.value;
    const matched = options.find((opt) => String(opt.value) === rawVal);
    onChange(matched ? matched.value : (rawVal as unknown as T));
  }}
  ```

---

### 2. Bổ sung `aria-activedescendant` cho W3C APG Combobox Pattern
- **Tệp tin**: `frontend/src/components/ui/ClinicalSelect.tsx:310-328, 398-453`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề**:
  Hiện tại trigger button có `role="combobox"` và menu có `role="listbox"`. Khi người dùng bấm phím mũi tên lên/xuống, con trỏ focus vẫn ở trên trigger button trong khi `highlightedIndex` thay đổi. Một số bộ đọc màn hình (Screen Reader) chuyên dụng cần thuộc tính `aria-activedescendant` để đọc to tên option đang được focus ảo.
- **Đề xuất khắc phục**:
  1. Gắn id cho từng option: `id={`${selectId}-opt-${index}`}` trên thẻ `<li>`.
  2. Bổ sung trên trigger `<button>`:
     ```tsx
     aria-activedescendant={
       isOpen && highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined
     }
     ```

---

### 3. Tối ưu hóa chỉ số Highlight ban đầu tránh Option Disabled
- **Tệp tin**: `frontend/src/components/ui/ClinicalSelect.tsx:133-134`
- **Độ tin cậy (Confidence)**: Medium
- **Vấn đề**:
  Khi mở menu (`isOpen = true`), nếu `value` chưa được chọn (`idx = -1`), code hiện tại mặc định chọn index 0:
  ```tsx
  setHighlightedIndex(idx >= 0 ? idx : 0);
  ```
  Nếu option tại vị trí 0 bị `disabled: true`, thì con trỏ trực quan sẽ nằm trên một item bị khóa (dù người dùng nhấn Enter vẫn không chọn được do có guard check).
- **Đề xuất khắc phục**:
  Nên tìm vị trí của item không bị disable đầu tiên:
  ```tsx
  const firstEnabledIdx = options.findIndex((opt) => !opt.disabled);
  setHighlightedIndex(idx >= 0 ? idx : Math.max(0, firstEnabledIdx));
  ```

---

### 4. Thuộc tính `title` chống hiểu nhầm do cắt chữ (Truncation Tooltip)
- **Tệp tin**: `frontend/src/components/ui/ClinicalSelect.tsx:340, 427`
- **Độ tin cậy (Confidence)**: High
- **Vấn đề**:
  Các nhãn phân tích y tế (như *"Ảnh màu đáy mắt hoàng điểm - Macula Centered"*) có thể bị thu ngắn kèm dấu `...` khi hiển thị trong container hẹp trên máy tính bảng hoặc màn hình nhỏ.
- **Đề xuất khắc phục**:
  Bổ sung `title={selectedOption ? selectedOption.label : placeholder}` vào trigger `<span>` và `title={option.label}` vào option item để hiển thị tooltip nguyên văn khi bác sĩ rê chuột.

---

## 5. Kết Luận Khuyến Nghị (Recommendation)

### **KHUYẾN NGHỊ: APPROVE WITH SUGGESTIONS**
- **Đánh giá tổng thể**: Hệ thống mã nguồn mới được triển khai với chất lượng chuyên môn rất cao, tuân thủ chặt chẽ tiêu chuẩn an toàn y khoa, bảo mật, hiệu năng và kiến trúc Clean UI của AURA.
- **Điều kiện bàn giao**: Không có lỗi chặn `CRITICAL` hay `WARNING`. Toàn bộ 4 phát hiện trên đều ở mức `SUGGESTION` nhằm nâng cao tính hoàn thiện và có thể áp dụng trong các chu kỳ cải tiến định kỳ tiếp theo mà không ảnh hưởng tới tiến độ nghiệm thu hiện tại.
- **Báo cáo**: Đã gửi biên bản lưu trữ tại `docs/07-testing/code-review-clinical-select-and-motion.md` và trình CEO nghiệm thu chính thức.
