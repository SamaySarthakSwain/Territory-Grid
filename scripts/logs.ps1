# scripts/logs.ps1
param(
    [Parameter(Position=0, Mandatory=$true)]
    [ValidateSet("clear", "dump")]
    [string]$Mode,

    [Parameter(Position=1)]
    [string]$DeviceSerial
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$logsDir = Join-Path $projectRoot "logs"

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# Resolve adb
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

if ($Mode -eq "clear") {
    Write-Host "Clearing device logcat buffer..." -ForegroundColor Cyan
    & $adb @adbArgs logcat -c
    Write-Host "Logcat cleared." -ForegroundColor Green
} elseif ($Mode -eq "dump") {
    $appLog = Join-Path $logsDir "app.txt"
    $errLog = Join-Path $logsDir "errors.txt"

    Write-Host "Dumping logcat to $logsDir..." -ForegroundColor Cyan

    # Dump full app logs and error logs
    & $adb @adbArgs logcat -d | Out-File -FilePath $appLog -Encoding utf8
    & $adb @adbArgs logcat -d "*:E" | Out-File -FilePath $errLog -Encoding utf8

    Write-Host "Logs saved to:" -ForegroundColor Green
    Write-Host "  - $appLog"
    Write-Host "  - $errLog"
}
