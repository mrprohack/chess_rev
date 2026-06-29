Write-Host "Starting Chess Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd chess-backend; .\venv\Scripts\Activate.ps1; python main.py"

Write-Host "Starting Chess Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd chess-clone; npm run dev"

Write-Host "All services are starting up in separate windows!" -ForegroundColor Cyan
