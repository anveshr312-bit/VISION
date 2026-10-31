@echo off
title VISION - Frontend Vite Dev Server
setlocal enabledelayedexpansion

echo ===============================================================================
echo VISION: Starting React + Vite 3D Digital Twin Frontend
echo ===============================================================================

cd /d "%~dp0\..\frontend"

if not exist "node_modules" (
    echo [ERROR] node_modules not found in frontend directory.
    echo Running npm install...
    call npm install
)

echo [INFO] Launching Vite Dev Server on http://localhost:5173 ...
call npm run dev
pause

