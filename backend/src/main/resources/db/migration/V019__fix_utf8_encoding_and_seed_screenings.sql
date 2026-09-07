-- V019: Khắc phục encoding tiếng Việt và Seed 9 ca khám sàng lọc lịch sử cho Bệnh nhân Nguyễn Trọng Nam

-- 1. Chuẩn hóa UTF-8 cho họ tên người dùng
UPDATE users SET full_name = 'Bệnh nhân Nguyễn Trọng Nam' WHERE id = '11111111-1111-1111-1111-111111111111' OR email = 'patient@aura.com';
UPDATE users SET full_name = 'BS. CKII Nguyễn Thị Thanh' WHERE id = '22222222-2222-2222-2222-222222222222' OR email = 'doctor@aura.com';
UPDATE users SET full_name = 'Phòng khám Đa khoa AURA' WHERE id = '33333333-3333-3333-3333-333333333333' OR email = 'clinic@aura.com';
UPDATE users SET full_name = 'Quản trị viên Hệ thống' WHERE id = '44444444-4444-4444-4444-444444444444' OR email = 'admin@aura.com';

-- 2. Seed 9 ca khám sàng lọc vi mạch võng mạc cho Bệnh nhân Nguyễn Trọng Nam (MRN-2026-0941)
INSERT INTO screenings (
    id, patient_id, doctor_id, image_url, status, risk_level, confidence,
    findings, doctor_notes, eye_position, scan_type, file_name, file_size, mime_type,
    risk_score, av_ratio, vessel_density, cardiovascular_risk_score, diabetic_retinopathy_risk_score,
    stroke_risk_score, tortuosity_index, vertical_cdr, created_at, updated_at
) VALUES 
-- Ca 1: Gần nhất (03/09/2026 21:12:51)
(
    'a1000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'HIGH', 0.85,
    'Bắt chéo động-tĩnh mạch (Gunn sign), hẹp lòng mạch tiểu động mạch độ II, co hẹp vi mạch đáy mắt.',
    'Bệnh nhân có dấu hiệu co hẹp động mạch nhỏ. Cần kiểm soát HA mục tiêu < 130/80 và tái khám sau 6 tháng.',
    'Both_OD_OS', 'Fundus_Macula', 'fundus_dual_scan_20260903.png', 3245120, 'image/png',
    85, 0.52, '14.8%', 82, 64, 18, 1.42, 0.38,
    '2026-09-03 21:12:51+07', '2026-09-03 21:30:00+07'
),
-- Ca 2: (15/08/2026 09:30:15)
(
    'a1000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'HIGH', 0.88,
    'Hiện tượng Salus sign độ I, tỷ lệ A/V 0.54, vi phình mạch rải rác cực sau OD.',
    'Đã tư vấn chế độ ăn giảm muối, kết hợp thuốc chẹn thụ thể ARB theo toa Tim mạch.',
    'Right_OD', 'Fundus_Macula', 'fundus_scan_OD_20260815.dcm', 4512000, 'application/dicom',
    82, 0.54, '15.1%', 79, 58, 17, 1.39, 0.37,
    '2026-08-15 09:30:15+07', '2026-08-15 10:15:00+07'
),
-- Ca 3: (28/07/2026 14:22:00)
(
    'a1000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'HIGH', 0.82,
    'Đáy mắt mắt trái OS: vi mạch uốn lượn nhẹ, chưa phát hiện xuất huyết võng mạc hay xuất tiết cứng.',
    'Mắt trái duy trì ổn định hơn mắt phải. Tiếp tục đo huyết áp tại nhà 2 lần/ngày.',
    'Left_OS', 'Fundus_Macula', 'fundus_scan_OS_20260728.png', 2890100, 'image/png',
    76, 0.56, '15.4%', 74, 52, 16, 1.35, 0.36,
    '2026-07-28 14:22:00+07', '2026-07-28 15:00:00+07'
),
-- Ca 4: (10/06/2026 10:05:40)
(
    'a1000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'HIGH', 0.86,
    'Sàng lọc cắt lớp quang học OCT gai thị: lớp sợi thần kinh RNFL chưa ghi nhận khuyết lõm hình nêm.',
    'Hình thái gai thị bình thường, tỷ lệ C/D 0.36 an toàn đối với bệnh Glaucoma.',
    'Both_OD_OS', 'OCT_Scan', 'oct_disc_scan_20260610.dcm', 8920150, 'application/dicom',
    78, 0.55, '15.2%', 76, 48, 16, 1.36, 0.36,
    '2026-06-10 10:05:40+07', '2026-06-10 11:00:00+07'
),
-- Ca 5: (02/05/2026 16:45:10)
(
    'a1000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'HIGH', 0.84,
    'Chụp màu đĩa thị (Optic Disc-centered): bờ gai rõ, không phù gai, động mạch phân nhánh cân xứng.',
    'Bác sĩ ghi nhận tiến triển xơ cứng vi mạch mức độ vừa. Khuyến khích tập thể dục nhẹ.',
    'Both_OD_OS', 'Fundus_OpticDisc', 'fundus_disc_20260502.png', 3120400, 'image/png',
    80, 0.53, '15.0%', 78, 55, 17, 1.38, 0.37,
    '2026-05-02 16:45:10+07', '2026-05-02 17:15:00+07'
),
-- Ca 6: (12/04/2026 08:50:30)
(
    'a1000000-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'HIGH', 0.89,
    'Tái khám định kỳ sau đợt tăng huyết áp cấp (165/100 mmHg). Động mạch thái dương trên co hẹp rõ.',
    'Bác sĩ chuyên khoa Mắt hội chẩn cùng Tim mạch điều chỉnh phác đồ hạ áp.',
    'Right_OD', 'Fundus_Macula', 'fundus_urgent_OD_20260412.png', 3540200, 'image/png',
    86, 0.50, '14.5%', 84, 60, 19, 1.45, 0.38,
    '2026-04-12 08:50:30+07', '2026-04-12 09:30:00+07'
),
-- Ca 7: (18/03/2026 11:15:00)
(
    'a1000000-0000-0000-0000-000000000007',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'HIGH', 0.81,
    'Khám toàn diện 2 mắt: hoàng điểm khô ráo, phản xạ hoàng điểm bình thường, A/V ratio đạt 0.55.',
    'Kết quả chẩn đoán hình ảnh: Bệnh võng mạc tăng huyết áp độ II giai đoạn ổn định.',
    'Both_OD_OS', 'Fundus_Macula', 'fundus_screening_20260318.png', 3310500, 'image/png',
    79, 0.55, '15.3%', 77, 46, 16, 1.34, 0.35,
    '2026-03-18 11:15:00+07', '2026-03-18 11:50:00+07'
),
-- Ca 8: (14/02/2026 15:30:20)
(
    'a1000000-0000-0000-0000-000000000008',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'MODERATE', 0.83,
    'Mắt trái OS kiểm tra trước đợt nghỉ Tết: mạch máu thông thoáng, không ghi nhận nghẽn tắc tĩnh mạch nhánh.',
    'Tư vấn chế độ dinh dưỡng ngày Tết, hạn chế rượu bia và thức ăn nhiều dầu mỡ.',
    'Left_OS', 'Fundus_Macula', 'fundus_checkup_OS_20260214.png', 2950600, 'image/png',
    72, 0.58, '15.7%', 70, 42, 15, 1.30, 0.34,
    '2026-02-14 15:30:20+07', '2026-02-14 16:00:00+07'
),
-- Ca 9: (18/01/2026 09:00:00)
(
    'a1000000-0000-0000-0000-000000000009',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'HIGH', 0.87,
    'Ca khám khởi đầu đăng ký chương trình Tầm soát Vi mạch Võng mạc AURA AI Clinic.',
    'Hồ sơ ban đầu được tạo lập. Bắt đầu lộ trình theo dõi sức khỏe vi mạch định kỳ 6 tháng.',
    'Both_OD_OS', 'Fundus_Macula', 'fundus_baseline_20260118.png', 3420800, 'image/png',
    84, 0.53, '14.9%', 81, 56, 18, 1.40, 0.37,
    '2026-01-18 09:00:00+07', '2026-01-18 10:00:00+07'
)
ON CONFLICT (id) DO UPDATE SET
    findings = EXCLUDED.findings,
    risk_score = EXCLUDED.risk_score,
    av_ratio = EXCLUDED.av_ratio,
    vessel_density = EXCLUDED.vessel_density;
