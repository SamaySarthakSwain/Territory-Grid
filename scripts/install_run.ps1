# scripts/install_run.ps1
param(
    [string]$DeviceSerial
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Find adb
$adb = "adb"
if (-not (Get-Command "adb" -ErrorAction SilentlyContinue)) {
    $fallbackAdb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
    if (Test-Path $fallbackAdb) {
        $adb = $fallbackAdb
    } else {
        Write-Host "Error: adb command not found. Please install Android SDK platform-tools or add them to PATH." -ForegroundColor Red
        exit 1
    }
}

$adbArgs = @()
if ($DeviceSerial) {
    $adbArgs += "-s", $DeviceSerial
}

Set-Location $projectRoot
$gradlew = Join-Path $projectRoot "gradlew.bat"
if (-not (Test-Path $gradlew)) { $gradlew = "gradle" }

Write-Host "Installing debug APK..." -ForegroundColor Cyan
& $gradlew installDebug

Write-Host "Launching MainActivity..." -ForegroundColor Cyan
& $adb @adbArgs shell am start -n com.yourname.territorygrid/com.yourname.territorygrid.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER

Write-Host "Waiting 3 seconds for app initialization..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Write-Host "Application launched successfully." -ForegroundColor Green
