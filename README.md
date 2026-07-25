# AURA — Retinal Vascular Health Screening

A clean foundation for a clinician-supporting retinal screening system. AI assists decisions; it does not replace a doctor.

## Stack
React/TypeScript/Vite · Java 21/Spring Boot 3/Maven · Python 3.11/FastAPI · Supabase PostgreSQL/Storage.

Frontend → Spring Boot Backend → FastAPI AI Core. The frontend never calls AI Core directly.

## Local URLs

- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/api/v1/health
- AI Core: http://localhost:8000/health

See [docs/ai-worklog/INDEX.md](docs/ai-worklog/INDEX.md). Current status: foundation/mock.
