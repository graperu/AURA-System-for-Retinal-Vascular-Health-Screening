# ==========================================================
# AURA System - Start Frontend (Local Dev)
# ==========================================================
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Set-Location "$root\frontend"
Write-Host "[AURA] Starting Vite Frontend on http://localhost:3000..." -ForegroundColor Green
npm run dev
