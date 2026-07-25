# AI Worklog — Clean Rebuild

## Mục tiêu
Xóa implementation cũ trên branch riêng và dựng foundation AURA mới.
## Branch ban đầu
`appmod/java-upgrade-20260725093538` tại `0be3890`.
## Backup branch
`backup/legacy-before-rebuild-20260725-2310`.
## Branch rebuild
`rebuild/clean-foundation`.
## Commit backup
`ddf3d8f`.
## Nội dung dự án cũ đã xóa
Toàn bộ backend, frontend, AI Core, tài liệu và cấu hình legacy đã được xóa trên branch rebuild.
## Cấu trúc mới đã tạo
Monorepo gồm backend, frontend, ai-core, docs, postman, scripts và GitHub Actions.
## Backend
Spring Boot 3/Java 21, SecurityConfig, health API, AI health client, JPA/Flyway/PostgreSQL và migration roles/users/user_roles.
## Frontend
React/TypeScript/Vite, Router, Axios client, HomePage và NotFoundPage.
## AI Core
FastAPI mock service, schemas, config, service, health/analyze endpoints và tests.
## Docker
Dockerfile cho backend/AI Core và Compose nối backend đến `http://ai-core:8000`.
## File đã tạo
Source foundation, migration, tests, Docker, CI, environment template, README và worklog.
## File đã sửa
Các file skeleton tạm ở commit `3b68c23` được thay bằng implementation đúng đặc tả.
## Lệnh kiểm tra
`mvn test`, `mvn package -DskipTests`, `npm install`, `npm run lint`, `npm run build`, `docker compose config`, Python compile/import/pytest.
## Kết quả kiểm tra
Backend test/package PASS. Frontend install/lint/build PASS. Docker config PASS với cảnh báo biến môi trường chưa được đặt. Python không chạy được vì máy chỉ có Windows Store alias, chưa có Python runtime.
## Commit
`ddf3d8f`, `3b68c23`, `d0804eb`; commit hoàn thiện được ghi trong lịch sử Git sau khi tạo.
## Vấn đề còn lại
Chưa thể chạy AI tests cho tới khi cài Python 3.11. `npm audit` báo 7 high-severity vulnerabilities trong dependency tree.
## Bước tiếp theo
Cài Python 3.11, tạo virtual environment và chạy `python -m pytest`.
## Ghi chú cho AI phiên sau
Không dùng code legacy; tiếp tục từ foundation trên `rebuild/clean-foundation`. Không ghi secret.
