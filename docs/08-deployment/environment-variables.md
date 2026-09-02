# Environment variables

Use the root or service-specific `.env.example` as a variable-name reference.
Copy placeholders to a local secret store or deployment platform and replace
them there. Do not commit populated environment files.

## Frontend

- `VITE_API_BASE_URL`: public backend API URL

## Backend

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`: least-privilege database connection
- `JWT_SECRET`: signing secret managed outside source control
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: backend-only storage access
- `SUPABASE_STORAGE_BUCKET`: private bucket name
- `AI_SERVICE_URL`, `AI_SERVICE_TOKEN`: internal AI connection

## AI service

- `MODEL_PATH`: deployed model location
- `INTERNAL_API_TOKEN`: internal request authentication

