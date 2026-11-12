# Territory Grid // Web Simulation Runner
param(
    [int]$Port = 8088
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "LAUNCHING TERRITORY GRID WEB SIMULATION" -ForegroundColor Cyan
Write-Host "Serving: design_refs/html/ at http://localhost:$Port" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

Start-Process "http://localhost:$Port"
python -m http.server $Port --directory "$PSScriptRoot\..\design_refs\html"
