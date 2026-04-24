@echo off
echo ==============================================
echo  Vulnerability Prediction Project - Start Script
echo ==============================================

echo [1/3] Starting Backend API Server...
start cmd /k "python launch_backend.py"
timeout /t 5 /nobreak > nul

echo [2/3] Starting Frontend Web Server...
cd frontend
start cmd /k "python -m http.server 8080"
cd ..
timeout /t 2 /nobreak > nul

echo [3/3] Opening Application in Browser...
start http://127.0.0.1:8080

echo.
echo Project is now running! 
echo - Backend available at: http://127.0.0.1:8000
echo - Frontend available at: http://127.0.0.1:8080
echo.
pause
