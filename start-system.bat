@echo off
title AURA Retinal Vascular Health Screening System Launcher
echo =========================================================================
echo       HE THONG SANG LOC SUC KHOE MACH MAU VONG MAC (AURA SYSTEM)
echo            TICH HOP CLOUD AI ENGINE (GEMINI 3.7 FLASH HIGH)
echo =========================================================================
echo.
echo Chon che do khoi chay:
echo [1] Khoi chay toan bo bang Docker Compose (Frontend + Backend + PostgreSQL)
echo [2] Dung toan bo he thong Docker Compose
echo [3] Khoi chay cuc bo (Frontend Vite + Backend Spring Boot) - KHONG CAN DOCKER
echo [4] Chi khoi chay Frontend Web (Vite Dev Server - Port 5173)
echo [5] Chi khoi chay Backend (Java Spring Boot 3.4 - Port 8081)
echo [6] Chay bo Kiem thu Tu dong toan dien (Full Automated Test Suite)
echo.

set /p choice="Nhap lua chon cua ban [1-6]: "

if "%choice%"=="1" (
    echo.
    echo Dang khoi chay he thong bang Docker Compose...
    docker compose up -d --build
    echo.
    echo =========================================================================
    echo He thong AURA da khoi dong thanh cong!
    echo - Web Application: http://localhost:3000
    echo - Backend API ^& Swagger UI: http://localhost:8081/swagger-ui.html
    echo - Cloud AI Engine: Gemini 3.7 Flash High API (San sang)
    echo =========================================================================
    pause
    exit /b
)

if "%choice%"=="2" (
    echo.
    echo Dang dung cac container Docker...
    docker compose down
    echo He thong da dung an toan.
    pause
    exit /b
)

if "%choice%"=="3" (
    echo.
    echo Dang khoi dong dong thoi Frontend va Backend...
    start "AURA 1. Frontend (React + Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"
    start "AURA 2. Backend (Java Spring Boot)" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"
    echo.
    echo =========================================================================
    echo Da mo 2 cua so Terminal rieng biet:
    echo - Frontend URL: http://localhost:5173
    echo - Backend API: http://localhost:8081/swagger-ui.html
    echo =========================================================================
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
    echo Dang khoi chay Backend Java Spring Boot...
    cd /d %~dp0backend
    mvn spring-boot:run
    exit /b
)

if "%choice%"=="6" (
    echo.
    echo Dang chay bo kiem thu tu dong...
    call "%~dp0run-automated-tests.bat"
    pause
    exit /b
)

echo Lua chon khong hop le!
pause
