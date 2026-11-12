# scripts/build.ps1
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
    $gradlew = "gradle"
}

& $gradlew assembleDebug > $buildLog 2>&1
$exitCode = $LASTEXITCODE

Get-Content $buildLog -Tail 40

if ($exitCode -eq 0) {
    Write-Host "`nBUILD SUCCESSFUL" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nBUILD FAILED with exit code $exitCode" -ForegroundColor Red
    exit $exitCode
}
