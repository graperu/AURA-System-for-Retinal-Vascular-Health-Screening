-- FR-32: catalog quyền truy cập theo vai trò (Admin có thể bật/tắt từng quyền)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    permission_code VARCHAR(80) NOT NULL,
    permission_label VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_permission UNIQUE (role_name, permission_code)
);

INSERT INTO role_permissions (id, role_name, permission_code, permission_label, enabled)
VALUES
    (gen_random_uuid(), 'USER', 'SCREENING_CREATE', 'Tạo phiên sàng lọc võng mạc', TRUE),
    (gen_random_uuid(), 'USER', 'PROFILE_MANAGE', 'Quản lý hồ sơ y tế cá nhân', TRUE),
    (gen_random_uuid(), 'USER', 'BILLING_VIEW', 'Xem gói dịch vụ và giao dịch', TRUE),
    (gen_random_uuid(), 'USER', 'CONSULTATION_CHAT', 'Tư vấn trực tuyến với bác sĩ', TRUE),
    (gen_random_uuid(), 'DOCTOR', 'PATIENT_WORKLIST', 'Xem worklist bệnh nhân được phân công', TRUE),
    (gen_random_uuid(), 'DOCTOR', 'SCREENING_REVIEW', 'Thẩm định và ký duyệt kết quả AI', TRUE),
    (gen_random_uuid(), 'DOCTOR', 'CLINICAL_NOTES', 'Ghi chú lâm sàng và mã ICD-10', TRUE),
    (gen_random_uuid(), 'DOCTOR', 'FEEDBACK_SUBMIT', 'Gửi phản hồi huấn luyện lại mô hình', TRUE),
    (gen_random_uuid(), 'DOCTOR', 'CONSULTATION_CHAT', 'Trao đổi với bệnh nhân', TRUE),
    (gen_random_uuid(), 'CLINIC', 'BULK_SCREENING', 'Sàng lọc hàng loạt cho chiến dịch', TRUE),
    (gen_random_uuid(), 'CLINIC', 'CLINIC_MEMBERS', 'Quản lý bác sĩ trực thuộc', TRUE),
    (gen_random_uuid(), 'CLINIC', 'CLINIC_ANALYTICS', 'Xem báo cáo chiến dịch lâm sàng', TRUE),
    (gen_random_uuid(), 'CLINIC', 'CREDIT_PURCHASE', 'Mua và sử dụng credit phòng khám', TRUE),
    (gen_random_uuid(), 'ADMIN', 'USER_MANAGE', 'Quản lý tài khoản người dùng / bác sĩ / phòng khám', TRUE),
    (gen_random_uuid(), 'ADMIN', 'ROLE_MANAGE', 'Định nghĩa vai trò và quyền truy cập', TRUE),
    (gen_random_uuid(), 'ADMIN', 'CLINIC_VERIFY', 'Phê duyệt hồ sơ pháp nhân phòng khám', TRUE),
    (gen_random_uuid(), 'ADMIN', 'ASSIGNMENT_MANAGE', 'Phân công bệnh nhân cho bác sĩ', TRUE),
    (gen_random_uuid(), 'ADMIN', 'AI_CONFIG', 'Cấu hình ngưỡng mô hình AI', TRUE),
    (gen_random_uuid(), 'ADMIN', 'AUDIT_VIEW', 'Xem và xuất nhật ký kiểm toán', TRUE),
    (gen_random_uuid(), 'ADMIN', 'NOTIFICATION_MANAGE', 'Quản lý mẫu thông báo và chính sách liên lạc', TRUE)
ON CONFLICT (role_name, permission_code) DO NOTHING;

-- FR-39: mẫu thông báo (email / in-app)
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'EMAIL',
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    description VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notification_templates (id, code, name, channel, subject, body, description, enabled)
VALUES
    (gen_random_uuid(), 'ACCOUNT_ACTIVATED', 'Kích hoạt tài khoản', 'EMAIL',
     'Tài khoản AURA của bạn đã được kích hoạt',
     'Kính gửi {{fullName}},\n\nTài khoản {{email}} đã được Quản trị viên kích hoạt. Bạn có thể đăng nhập cổng AURA để sử dụng dịch vụ sàng lọc võng mạc.\n\nTrân trọng,\nHệ thống AURA',
     'Gửi khi admin kích hoạt tài khoản người dùng, bác sĩ hoặc phòng khám', TRUE),
    (gen_random_uuid(), 'ACCOUNT_DISABLED', 'Vô hiệu hóa tài khoản', 'EMAIL',
     'Tài khoản AURA của bạn đã bị tạm khóa',
     'Kính gửi {{fullName}},\n\nTài khoản {{email}} đã bị vô hiệu hóa. Nếu đây là nhầm lẫn, vui lòng liên hệ quản trị viên hệ thống.\n\nTrân trọng,\nHệ thống AURA',
     'Gửi khi admin khóa / vô hiệu hóa tài khoản', TRUE),
    (gen_random_uuid(), 'ROLE_CHANGED', 'Thay đổi vai trò truy cập', 'EMAIL',
     'Vai trò tài khoản AURA đã được cập nhật',
     'Kính gửi {{fullName}},\n\nVai trò của bạn đã được chuyển thành {{role}}. Quyền truy cập trên cổng AURA sẽ áp dụng ngay ở lần đăng nhập tiếp theo.\n\nTrân trọng,\nHệ thống AURA',
     'Gửi khi admin gán lại vai trò RBAC', TRUE),
    (gen_random_uuid(), 'SCREENING_COMPLETE', 'Kết quả sàng lọc sẵn sàng', 'IN_APP',
     'Kết quả phân tích võng mạc đã sẵn sàng',
     'Phiên sàng lọc {{screeningId}} đã hoàn tất. Vui lòng mở cổng bệnh nhân để xem báo cáo và heatmap Grad-CAM.',
     'Thông báo in-app khi AI hoàn tất phân tích', TRUE),
    (gen_random_uuid(), 'HIGH_RISK_ALERT', 'Cảnh báo nguy cơ cao', 'EMAIL',
     '[Khẩn] Phát hiện nguy cơ mạch máu võng mạc cao',
     'Bệnh nhân {{fullName}} có kết quả nguy cơ cao. Bác sĩ phụ trách cần xem xét trong vòng 24 giờ theo chính sách liên lạc khẩn.',
     'Cảnh báo bác sĩ / phòng khám khi AI đánh giá nguy cơ cao', TRUE),
    (gen_random_uuid(), 'CLINIC_APPROVED', 'Phê duyệt phòng khám', 'EMAIL',
     'Hồ sơ phòng khám đã được xác minh',
     'Kính gửi {{organizationName}},\n\nHồ sơ pháp nhân đã được phê duyệt. Tài khoản CLINIC có thể quản lý bác sĩ, mua credit và chạy sàng lọc hàng loạt.\n\nTrân trọng,\nHệ thống AURA',
     'Gửi khi admin phê duyệt hồ sơ FR-22', TRUE),
    (gen_random_uuid(), 'CLINIC_REJECTED', 'Từ chối hồ sơ phòng khám', 'EMAIL',
     'Hồ sơ phòng khám chưa được chấp nhận',
     'Kính gửi {{organizationName}},\n\nHồ sơ bị từ chối với lý do: {{rejectionReason}}. Vui lòng cập nhật giấy phép và nộp lại.\n\nTrân trọng,\nHệ thống AURA',
     'Gửi khi admin từ chối hồ sơ phòng khám', TRUE)
ON CONFLICT (code) DO NOTHING;

-- FR-39: chính sách liên lạc toàn hệ thống (một bản ghi DEFAULT)
CREATE TABLE IF NOT EXISTS communication_policies (
    id UUID PRIMARY KEY,
    policy_key VARCHAR(64) NOT NULL UNIQUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    high_risk_immediate BOOLEAN NOT NULL DEFAULT TRUE,
    marketing_opt_in_default BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start VARCHAR(5),
    quiet_hours_end VARCHAR(5),
    retention_days INTEGER NOT NULL DEFAULT 365,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO communication_policies (
    id, policy_key, email_enabled, in_app_enabled, sms_enabled,
    high_risk_immediate, marketing_opt_in_default, quiet_hours_start, quiet_hours_end,
    retention_days, notes)
VALUES (
    gen_random_uuid(), 'DEFAULT', TRUE, TRUE, FALSE, TRUE, FALSE, '22:00', '07:00', 365,
    'Không gửi thông báo marketing ngoài giờ 22:00–07:00. Cảnh báo nguy cơ cao được gửi ngay lập tức, bỏ qua giờ yên lặng.')
ON CONFLICT (policy_key) DO NOTHING;
