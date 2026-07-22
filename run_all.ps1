Write-Host "Starting Chess Backend..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd backend && .\venv\Scripts\python.exe main.py"

Write-Host "Starting Chess Frontend..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd frontend && npm.cmd run dev"

Write-Host "All services are starting up in separate windows!" -ForegroundColor Cyan
Write-Host "Backend URL: http://127.0.0.1:8001" -ForegroundColor Yellow
Write-Host "Frontend URL: http://127.0.0.1:8000" -ForegroundColor Yellow
