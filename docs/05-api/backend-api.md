# Backend API — Phase 2

## Health

`GET /api/v1/system/health`

Successful response:

```json
{
  "success": true,
  "message": "AURA backend is healthy",
  "data": {
    "service": "aura-backend",
    "status": "UP"
  },
  "timestamp": "ISO-8601"
}
```

This endpoint intentionally does not expose database details, hostnames,
versions, configuration, or dependency health.

## Authentication

- `POST /api/v1/auth/register` — creates an active account with `USER` only.
- `POST /api/v1/auth/login` — returns a Bearer access token and sets an HttpOnly refresh cookie.
- `POST /api/v1/auth/refresh` — rotates the refresh token and returns a new access token.
- `POST /api/v1/auth/logout` — revokes the presented refresh token and clears its cookie.
- `GET /api/v1/auth/me` — returns the authenticated account without internal fields.

Passwords and tokens are never included in error responses. Refresh tokens are
stored only as SHA-256 hashes.

`refresh` and `logout` require an exact configured `Origin`, or a valid
`Referer` whose origin is configured. Missing or untrusted origins receive 403.
Logout uses only the refresh cookie, so it remains available after access-token
expiry. Successful logout clears the cookie with the same name, path,
`SameSite`, and `Secure` settings used when it was issued.

Authentication failures distinguish missing credentials (`UNAUTHORIZED`), an
expired access token (`TOKEN_EXPIRED`), and malformed or incorrectly signed
tokens (`INVALID_TOKEN`). Error bodies never echo credentials or tokens.
