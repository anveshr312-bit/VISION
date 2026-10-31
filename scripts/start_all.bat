@echo off
title VISION - Mission Launcher
setlocal enabledelayedexpansion

echo ===============================================================================
echo VISION: Vital Intelligence for System Integrity, Observation & Nostics
echo Master Launcher for Backend and Frontend Services
echo ===============================================================================

set "ROOT_DIR=%~dp0\.."
cd /d "%ROOT_DIR%"

echo [1/3] Launching FastAPI Backend Server in new terminal...
start "VISION - Backend API (Port 8000)" cmd /k "%ROOT_DIR%\scripts\start_backend.bat"

echo [INFO] Waiting 2 seconds for backend initialization...
timeout /t 2 /nobreak >nul

echo [2/3] Launching React Vite Frontend Server in new terminal...
start "VISION - Frontend Dashboard (Port 5173)" cmd /k "%ROOT_DIR%\scripts\start_frontend.bat"

echo [INFO] Waiting 2 seconds for dev server startup...
timeout /t 2 /nobreak >nul

echo [3/3] Opening Dashboard in default web browser...
start http://localhost:5173

echo.
echo ===============================================================================
echo [SUCCESS] VISION System is fully launched!
echo - Backend API:  http://127.0.0.1:8000 (Swagger docs at /docs)
echo - Frontend UI:  http://localhost:5173
echo ===============================================================================

