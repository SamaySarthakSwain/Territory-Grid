# scripts/shot.ps1
param(
    [Parameter(Position=0, Mandatory=$true)]
    [string]$Name,

    [Parameter(Position=1)]
    [string]$DeviceSerial
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$shotsDir = Join-Path $projectRoot "shots"

if (-not (Test-Path $shotsDir)) {
    New-Item -ItemType Directory -Path $shotsDir -Force | Out-Null
}

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

$fileName = if ($Name.EndsWith(".png")) { $Name } else { "$Name.png" }
$targetPath = Join-Path $shotsDir $fileName

Write-Host "Capturing screenshot to $targetPath..." -ForegroundColor Cyan
& $adb @adbArgs exec-out screencap -p > $targetPath
Write-Host "Screenshot captured successfully: $targetPath" -ForegroundColor Green
