-- V035: Thêm chỉ mục hiệu năng (performance indexes) và ràng buộc toàn vẹn dữ liệu
-- Tối ưu hóa truy vấn ca sàng lọc, tin nhắn tư vấn và đợt khám hàng loạt

-- 1. Chỉ mục cho ca khám sàng lọc theo phòng khám, đợt hàng loạt và bệnh nhân
CREATE INDEX IF NOT EXISTS idx_screenings_clinic_id ON screenings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_screenings_batch_id ON screenings(batch_id);
CREATE INDEX IF NOT EXISTS idx_screenings_patient_created ON screenings(patient_id, created_at DESC);

-- 2. Chỉ mục cho tin nhắn tư vấn trực tuyến (Real-time consultation chat)
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_unread ON chat_messages(receiver_id, is_read);

-- 3. Chỉ mục thời gian tạo tài khoản và thời hạn gói dịch vụ
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_expires_at ON subscription(expires_at);
