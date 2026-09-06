@echo off
title AURA Retinal Vascular Health Screening System Launcher
echo =========================================================================
echo       HE THONG SANG LOC SUC KHOE MACH MAU VONG MAC (AURA SYSTEM)
echo =========================================================================
echo.
echo Chon che do khoi chay:
echo [1] Khoi chay toan bo bang Docker Compose (Tat ca 4 Containers)
echo [2] Dung toan bo he thong Docker Compose
echo [3] Khoi chay TOAN BO 3 dich vu cuc bo (Frontend + AI + Backend) - KHONG CAN DOCKER
echo [4] Chi khoi chay Frontend Web (Vite Dev Server - Port 5173)
echo [5] Chi khoi chay AI Service (Python FastAPI - Port 8000)
echo [6] Chi khoi chay Backend (Java Spring Boot 3.4 - Port 8081)
echo.

set /p choice="Nhap lua chon cua ban [1-6]: "

if "%choice%"=="1" (
    echo.
    echo Dang khoi chay he thong bang Docker Compose...
    docker-compose up -d --build
    echo.
    echo He thong da khoi dong!
    echo - Web Application: http://localhost:3000
    echo - Backend API ^& Swagger: http://localhost:8081/swagger-ui.html
    echo - AI Core Microservice: http://localhost:8000/docs
    pause
    exit /b
)

if "%choice%"=="2" (
    echo.
    echo Dang dung cac container Docker...
    docker-compose down
    echo He thong da dung.
    pause
    exit /b
)

if "%choice%"=="3" (
    echo.
    echo Dang khoi dong dong thoi ca 3 dich vu...
    start "AURA 1. Frontend (React + Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"
    start "AURA 2. AI Core (Python FastAPI)" cmd /k "cd /d %~dp0ai-service && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    start "AURA 3. Backend (Java Spring Boot)" cmd /k "cd /d %~dp0backend && mvnw.cmd spring-boot:run"
    echo.
    echo Da mo 3 cua so Terminal rieng biet cho Frontend, AI Service, va Backend!
    echo - Frontend URL: http://localhost:5173
    echo - AI Microservice: http://localhost:8000/docs
    echo - Backend API: http://localhost:8081/swagger-ui.html
    pause
    exit /b
)

if "%choice%"=="4" (
    echo.
    echo Dang khoi chay Frontend...
    cd /d %~dp0frontend
    npm run dev
    exit /b
)

if "%choice%"=="5" (
    echo.
    echo Dang khoi chay AI Microservice FastAPI...
    cd /d %~dp0ai-service
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    exit /b
)

if "%choice%"=="6" (
    echo.
    echo Dang khoi chay Backend Java Spring Boot...
    cd /d %~dp0backend
    call mvnw.cmd spring-boot:run
    exit /b
)

echo Lua chon khong hop le!
pause
