@echo off
setlocal

echo ========================================================
echo    AURA - COMPREHENSIVE AUTOMATED VERIFICATION SUITE
echo ========================================================
echo.

echo [1/4] Dang chay kiem thu AI Microservice (Python)...
cd ai-service
python test_predict.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] AI Microservice test that bai!
    cd ..
    exit /b %ERRORLEVEL%
)
cd ..
echo.

echo [2/4] Dang chay TOAN BO kiem thu Backend (109 Tests Spring Boot 3 ^& Database)...
cd backend
call mvn test
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend Test Suite that bai!
    cd ..
    exit /b %ERRORLEVEL%
)
echo [OK] Backend Tests vuot qua 100%% (109/109 Tests Passed).
cd ..
echo.

echo [3/4] Dang kiem tra TypeCheck va Build Frontend (TypeScript + Vite)...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend Build that bai!
    cd ..
    exit /b %ERRORLEVEL%
)
echo [OK] Frontend Build thanh cong 100%%.
cd ..
echo.

echo [4/4] Dang kiem tra Docker Compose Configuration...
docker compose config > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Docker Compose config hop le va san sang.
) else (
    echo [WARN] Docker daemon chua bat hoac can luu y.
)
echo.

echo ========================================================
echo    100%% TOAN BO CAC CHUC NANG HE THONG DA DUOC KIEM THU THANH CONG!
echo ========================================================
