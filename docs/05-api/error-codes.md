# Error codes — Phase 2

| Code | HTTP status | Meaning |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_REQUEST` | 400 | Request body or argument is invalid |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource is unavailable |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server-side failure |
| `EMAIL_ALREADY_EXISTS` | 409 | Registration email is already used |
| `INVALID_CREDENTIALS` | 401 | Login credentials are invalid |
| `ACCOUNT_DISABLED` | 401 | Account is inactive |
| `UNAUTHORIZED` | 401 | Authentication is required |
| `ACCESS_DENIED` | 403 | Authenticated principal lacks authority |
| `INVALID_TOKEN` / `TOKEN_EXPIRED` | 401 | Access token cannot be accepted |
| `REFRESH_TOKEN_INVALID` / `REFRESH_TOKEN_REVOKED` | 401 | Refresh token cannot be used |

Error responses include only a safe human-readable message, optional field
details, and an ISO-8601 timestamp. They never include stack traces, SQL,
filesystem paths, credentials, or request bodies.
