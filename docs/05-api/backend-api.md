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

Authentication and business endpoints are not implemented in this phase.
