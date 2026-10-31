@echo off
setlocal enabledelayedexpansion
title VISION - Automated Test Suite

echo ===============================================================================
echo VISION: Turbofan Prognostics ^& Digital Twin - Complete Automated Test Suite
echo ===============================================================================

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found. Please run scripts\setup_env.bat first.
    exit /b 1
)

echo [1/3] Running Python Backend and ML Test Suite via pytest...
set "PYTHONPATH=."
.venv\Scripts\python -m pytest ml/tests backend/tests -v
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Python tests failed with exit code %ERRORLEVEL%.
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Running Frontend Component Smoke Tests...
cd frontend
call node src/tests/smoke.test.js
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Frontend smoke tests failed with exit code %ERRORLEVEL%.
    cd ..
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Running Production Frontend Build Test...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Frontend build failed with exit code %ERRORLEVEL%.
    cd ..
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ===============================================================================
echo [SUCCESS] 100% of Backend, ML, Smoke, and Frontend Tests Passed!
echo ===============================================================================
exit /b 0
