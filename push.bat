@echo off
git add .
git commit -m "Initial commit: Chess.com review clone with FastAPI backend"
git remote add origin https://github.com/Simple-AI-Solution/chess_rev.git
git branch -M main
git push -u origin main
