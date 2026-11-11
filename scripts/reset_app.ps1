# scripts/reset_app.ps1
param(
    [Parameter(Position=0)]
    [string]$DeviceSerial
)

$ErrorActionPreference = "Stop"

$adb = "adb"
if (-not (Get-Command "adb" -ErrorAction SilentlyContinue)) {
    $fallbackAdb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
    if (Test-Path $fallbackAdb) {
        $adb = $fallbackAdb
    } else {
        Write-Host "Error: adb command not found. Add platform-tools to PATH." -ForegroundColor Red
        exit 1
    }
}

$adbArgs = @()
if ($DeviceSerial) {
    $adbArgs += "-s", $DeviceSerial
}

Write-Host "Clearing app data for com.yourname.territorygrid..." -ForegroundColor Cyan
& $adb @adbArgs shell pm clear com.yourname.territorygrid
Write-Host "App state reset completed." -ForegroundColor Green
