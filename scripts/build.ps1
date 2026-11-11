# scripts/build.ps1
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$logsDir = Join-Path $projectRoot "logs"

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$buildLog = Join-Path $logsDir "build.txt"
Set-Location $projectRoot

Write-Host "Starting Gradle assembleDebug build..." -ForegroundColor Cyan

$gradlew = Join-Path $projectRoot "gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Host "Warning: gradlew.bat not found in $projectRoot yet. Attempting gradle on PATH..." -ForegroundColor Yellow
    $gradlew = "gradle"
}

try {
    & $gradlew assembleDebug *>&1 | Tee-Object -FilePath $buildLog
    Write-Host "`nBuild complete. Showing last 40 lines of build log:" -ForegroundColor Green
    Get-Content $buildLog -Tail 40
} catch {
    Write-Host "Build failed with exception: $_" -ForegroundColor Red
    if (Test-Path $buildLog) {
        Get-Content $buildLog -Tail 40
    }
    exit 1
}
