param(
  [string]$EnvFile = '.env.local'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Missing $EnvFile. Copy .env.local.example and set a unique SESSION_SECRET."
}

$content = Get-Content -Raw -LiteralPath $EnvFile
if ($content -match 'SESSION_SECRET\s*=\s*(replace-with|change-me|default)') {
  throw 'SESSION_SECRET still uses the example value.'
}
if ($content -notmatch '(?m)^\s*SESSION_SECRET\s*=\s*[^\r\n]{32,}\s*$') {
  throw 'SESSION_SECRET must be at least 32 characters.'
}

docker compose --env-file $EnvFile -f docker-compose.local.yml -p new-api-local config --quiet
Write-Output 'Local configuration check passed.'
