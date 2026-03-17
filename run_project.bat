@echo off

echo Starting Backend...
start cmd /k "cd backend && npm run dev"

timeout /t 3

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo Project running:
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause