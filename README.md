# AURA

AURA — AI Understanding Retinal Analysis — is a retinal vascular health
screening and clinical decision-support system.

> AURA supports screening and clinical decisions. It does not diagnose disease
> and does not replace a qualified physician.

## Project status

The repository is being rebuilt from a clean foundation. Phase 1 establishes
the repository boundaries, environment-variable policy, documentation skeleton,
and development workflow. Application code is intentionally not included yet.

## Target architecture

```text
React + TypeScript
        |
        | HTTPS REST API + JWT
        v
Java 21 + Spring Boot 3 modular monolith
        |---- Supabase PostgreSQL
        |---- Supabase Storage (private bucket)
        |
        v
Python + FastAPI AI service
        |
        v
PyTorch model
```

The frontend must never call the AI service directly. Only the backend may use
the Supabase service-role credential or the AI internal token.

## Repository layout

```text
frontend/        React and TypeScript web client
backend/         Spring Boot modular monolith
ai-service/      FastAPI inference service
database/        Database design and operational notes
docs/            Requirements, architecture, API, testing, and deployment docs
infrastructure/  Deployment and infrastructure definitions
.github/         GitHub workflows and repository automation
```

## Local configuration

Environment files contain local secrets and are ignored by Git. Copy only the
relevant `.env.example` file and supply credentials outside source control.
Examples contain placeholders only.

No Supabase project, database, storage bucket, or credentials are provisioned
in Phase 1.

## MVP boundaries

The MVP covers email/password authentication, JWT and RBAC, profile management,
private Fundus image upload, mock AI analysis, analysis history, assigned-patient
access for doctors, and doctor reviews.

Payment, chat, social login, realtime notifications, batch upload, exports,
mobile applications, and automated retraining are outside the MVP.

See [MVP scope](docs/01-requirements/mvp-scope.md) and
[contribution rules](CONTRIBUTING.md).
