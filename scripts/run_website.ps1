# Territory Grid // Web Simulation Runner
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "LAUNCHING TERRITORY GRID WEB SIMULATION" -ForegroundColor Cyan
Write-Host "Serving: design_refs/html/ at http://localhost:8080" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

Start-Process "http://localhost:8080"
python -m http.server 8080 --directory "$PSScriptRoot\..\design_refs\html"
