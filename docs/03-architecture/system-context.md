# System context

```text
User or Doctor
      |
      v
React web application
      |
      v
Spring Boot modular monolith
   |                 |
   v                 v
Supabase         FastAPI AI service
PostgreSQL       |
and Storage      v
                 PyTorch model
```

The browser communicates only with Spring Boot. Spring Boot enforces ownership
and role checks before accessing database records, private objects, signed URLs,
or AI analysis.

