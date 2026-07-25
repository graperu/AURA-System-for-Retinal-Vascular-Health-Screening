# AURA — Retinal Vascular Health Screening

AURA is a clean foundation for retinal vascular health screening. It coordinates a web client, a secure clinical backend, and an isolated AI inference service.

> AURA provides decision support only. It does not diagnose disease and does not replace a qualified physician.

## Status

Foundation/mock stage. Authentication, payments, storage, production AI models, clinical validation, and production hardening are not complete.

## Technology and architecture

- Frontend: React, TypeScript, Vite, Axios, React Router
- Backend: Java 21, Spring Boot 3, Maven, Security, JPA, Flyway, PostgreSQL, OpenAPI
- AI Core: Python 3.11, FastAPI, Pydantic, Uvicorn; mock model only
- Data and storage: Supabase PostgreSQL and Supabase Storage

```text
React Frontend → Spring Boot Backend → FastAPI AI Core
```

The frontend never calls AI Core directly.

## Repository

```text
backend/       Spring Boot API and database migrations
frontend/      React web application
ai-core/       FastAPI mock inference service
docs/          Documentation and AI worklogs
postman/       API collections
scripts/       Development automation
.github/       CI workflows
```

## Requirements

Java 21, Maven 3.9+, Node.js 20+, npm, Python 3.11, and optionally Docker Compose.

Copy `.env.example` to `.env` and replace placeholders locally. Never commit `.env` or real credentials.

## Run locally

Backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

AI Core:

```powershell
cd ai-core
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Local URLs

- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/api/v1/health
- Backend Swagger: http://localhost:8080/swagger-ui/index.html
- AI Core health: http://localhost:8000/health
- AI Docs: http://localhost:8000/docs

## Branch workflow

Create work branches from `rebuild/clean-foundation`, commit focused changes, push normally, and open a pull request. Never force-push or merge directly into `main`.

AI session history is indexed in [docs/ai-worklog/INDEX.md](docs/ai-worklog/INDEX.md).
