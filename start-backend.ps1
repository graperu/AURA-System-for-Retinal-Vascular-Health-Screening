# ==========================================================
# AURA System - Start Backend (Local Dev)
# ==========================================================
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# 1. Load environment variables from .env
$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
    Write-Host "[AURA] Loading environment variables from .env..." -ForegroundColor DarkGray
    Get-Content $envFile | Where-Object { $_ -match '^\s*[^#\s]+=' } | ForEach-Object {
        $parts = $_.Split('=', 2)
        $key = $parts[0].Trim()
        $val = $parts[1].Trim().Trim('"').Trim("'")
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}

if (-not $env:SERVER_PORT) { $env:SERVER_PORT = "8081" }

# 2. Start Spring Boot backend
Set-Location "$root\backend"
Write-Host "[AURA] Starting Spring Boot Backend on http://localhost:$env:SERVER_PORT..." -ForegroundColor Cyan
& ".\mvnw.cmd" spring-boot:run
