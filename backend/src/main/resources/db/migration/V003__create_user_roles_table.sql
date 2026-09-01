CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_roles_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
