@echo off
echo Starting Chess Backend...
start cmd /k "cd backend && venv\Scripts\python.exe main.py"

echo Starting Chess Frontend...
start cmd /k "cd frontend && npm run dev"

echo All services are starting up in separate windows!
echo Backend URL: http://127.0.0.1:8000
echo Frontend URL: http://127.0.0.1:5173
