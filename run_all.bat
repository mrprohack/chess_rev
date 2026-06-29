@echo off
echo Starting Chess Backend...
start cmd /k "cd chess-backend && venv\Scripts\activate && python main.py"

echo Starting Chess Frontend...
start cmd /k "cd chess-clone && npm run dev"

echo All services are starting up in separate windows!
