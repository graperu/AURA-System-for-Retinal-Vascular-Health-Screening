-- V043: Cấp 5 lượt khám trải nghiệm ban đầu (Trial / Welcome Credits) cho tất cả tài khoản Bệnh nhân
INSERT INTO subscription (owner_id, service_package_id, remaining_credits, expires_at, status, created_at, updated_at)
SELECT 
    u.id AS owner_id,
    COALESCE((SELECT id FROM service_package WHERE scope = 'INDIVIDUAL' ORDER BY id ASC LIMIT 1 OFFSET 1), 2) AS service_package_id,
    5 AS remaining_credits,
    NOW() + INTERVAL '90 days' AS expires_at,
    'ACTIVE' AS status,
    NOW() AS created_at,
    NOW() AS updated_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'USER'
  AND NOT EXISTS (
      SELECT 1 FROM subscription s WHERE s.owner_id = u.id
  )
ON CONFLICT (owner_id, service_package_id) DO UPDATE SET
    remaining_credits = GREATEST(subscription.remaining_credits, 5),
    status = 'ACTIVE',
    expires_at = GREATEST(subscription.expires_at, NOW() + INTERVAL '90 days'),
    updated_at = NOW();
