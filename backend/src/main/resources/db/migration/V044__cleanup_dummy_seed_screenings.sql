-- V044: Dọn dẹp triệt để 9 ca khám mẫu/giả lập được seed từ V022 và đồng bộ trạng thái bệnh nhân
-- Đảm bảo biểu đồ xu hướng (Trend Chart) chỉ phản ánh 100% dữ liệu khám thực tế của người dùng.

DELETE FROM screenings 
WHERE id IN (
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000009'
);

-- Xóa các bản ghi lỗi hoặc không có điểm nguy cơ (score = 0 hoặc null) nếu là ca khám thất bại hoặc rỗng
DELETE FROM screenings
WHERE (risk_score IS NULL OR risk_score = 0)
  AND (status = 'FAILED' OR findings IS NULL OR findings = '');

-- Cập nhật đồng bộ lại patient_profiles cho bệnh nhân Nam theo ca khám thật gần nhất (nếu có)
UPDATE patient_profiles
SET 
    risk_score = COALESCE((
        SELECT risk_score FROM screenings 
        WHERE patient_id = '11111111-1111-1111-1111-111111111111' 
          AND risk_score > 0 
        ORDER BY created_at DESC LIMIT 1
    ), 0),
    risk_level = COALESCE((
        SELECT risk_level FROM screenings 
        WHERE patient_id = '11111111-1111-1111-1111-111111111111' 
          AND risk_score > 0 
        ORDER BY created_at DESC LIMIT 1
    ), 'LOW'),
    review_status = COALESCE((
        SELECT status FROM screenings 
        WHERE patient_id = '11111111-1111-1111-1111-111111111111' 
          AND risk_score > 0 
        ORDER BY created_at DESC LIMIT 1
    ), 'PENDING'),
    last_exam_date = (
        SELECT created_at::date FROM screenings 
        WHERE patient_id = '11111111-1111-1111-1111-111111111111' 
          AND risk_score > 0 
        ORDER BY created_at DESC LIMIT 1
    )
WHERE user_id = '11111111-1111-1111-1111-111111111111';
