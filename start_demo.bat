@echo off
echo ============================================================
echo   Health Saathi - Hackathon Demo Launcher
echo ============================================================
echo.
echo [Step 1] Starting Flask Backend (port 5050)...
cd /d "%~dp0health-analysis-service"
start "Backend - Health Saathi" cmd /k "python app.py"

echo [Step 2] Starting React Frontend (port 5173)...
cd /d "%~dp0frontend"
start "Frontend - Health Saathi" cmd /k "npm run dev"

echo.
echo ============================================================
echo   Both servers are starting!
echo ============================================================
echo.
echo   Backend  : http://localhost:5050
echo   Frontend : http://localhost:5173
echo.
echo   NOW RUN NGROK IN A SEPARATE TERMINAL:
echo.
echo   For Backend  : ngrok http 5050
echo   For Frontend : ngrok http 5173
echo.
echo   After ngrok starts, copy the backend URL and update:
echo   frontend\.env  -^>  VITE_API_BASE_URL=https://xxxx.ngrok-free.app
echo   Then restart the frontend (Ctrl+C and npm run dev again)
echo.
echo ============================================================
pause
