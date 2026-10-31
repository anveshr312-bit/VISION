@echo off
title VISION - FastAPI Backend Server
setlocal enabledelayedexpansion

echo ===============================================================================
echo VISION: Starting FastAPI Backend API Server
echo ===============================================================================

cd /d "%~dp0\.."

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment (.venv) not found.
    echo Please run scripts\setup_env.bat first.
    pause
    exit /b 1
)

set "PYTHONPATH=."
echo [INFO] Activating virtual environment...
call .venv\Scripts\activate.bat

echo [INFO] Launching Uvicorn on http://127.0.0.1:8000 ...
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause

