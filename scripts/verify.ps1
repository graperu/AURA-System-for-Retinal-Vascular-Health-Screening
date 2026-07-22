$ErrorActionPreference = 'Stop'
$repository = Split-Path -Parent $PSScriptRoot

Push-Location (Join-Path $repository 'backend')
try {
    mvn test
} finally { Pop-Location }

Push-Location (Join-Path $repository 'frontend')
try {
    npm.cmd ci
    npm.cmd run lint
    npm.cmd run build
} finally { Pop-Location }

Push-Location (Join-Path $repository 'ai-core')
try {
    python -m pytest
} finally { Pop-Location }

docker compose -f (Join-Path $repository 'docker-compose.yml') config --quiet
