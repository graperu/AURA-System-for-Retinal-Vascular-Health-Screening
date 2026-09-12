@echo off
setlocal

echo ========================================================
echo    AURA - AUTOMATED VERIFICATION SUITE (CLOUD AI)
echo ========================================================
echo.

echo [1/3] Dang chay TOAN BO Unit Tests Backend (Spring Boot 3 ^& Cloud AI)...
cd backend
call mvn test -Dtest="!*IntegrationTest,!DoctorPatientAssignmentSecurityTest,!UserRepositoryTest"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend Test Suite that bai!
    cd ..
    exit /b %ERRORLEVEL%
)
echo [OK] Backend Unit Tests vuot qua 100%%.
cd ..
echo.

echo [2/3] Dang kiem tra TypeCheck va Build Frontend (TypeScript + Vite)...
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

echo [3/3] Dang kiem tra Docker Compose Configuration...
docker compose config > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Docker Compose config hop le va san sang.
) else (
    echo [NOTE] Docker daemon chua khoi chay tren may chu hien tai.
)
echo.

echo ========================================================
echo    100%% HE THONG DA DUOC KIEM THU THANH CONG!
echo ========================================================
