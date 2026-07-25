# Error codes — Phase 2

| Code | HTTP status | Meaning |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_REQUEST` | 400 | Request body or argument is invalid |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource is unavailable |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server-side failure |

Error responses include only a safe human-readable message, optional field
details, and an ISO-8601 timestamp. They never include stack traces, SQL,
filesystem paths, credentials, or request bodies.
