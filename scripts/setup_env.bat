@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo VISION: Development Environment Setup
echo ========================================================

:: Navigate to repository root directory
cd /d "%~dp0\.."

:: 1. Create Python Virtual Environment
echo.
echo [1/4] Creating Python virtual environment in .venv...
where py >nul 2>&1
if %ERRORLEVEL% equ 0 (
    py -3.12 -m venv .venv 2>nul
    if not exist .venv\Scripts\activate.bat (
        python -m venv .venv
    )
) else (
    python -m venv .venv
)

if not exist .venv\Scripts\activate.bat (
    echo [ERROR] Failed to create virtual environment in .venv.
    exit /b 1
)

:: 2. Activate Virtual Environment and Upgrade Pip
echo.
echo [2/4] Activating .venv and upgrading pip...
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip

:: 3. Install Python Dependencies
echo.
echo [3/4] Installing backend and ML dependencies...
pip install -r backend\requirements.txt
if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] Dependency installation encountered issues. Retrying core ML stack...
    pip install "fastapi>=0.110.0,<0.120.0" "uvicorn[standard]>=0.28.0,<0.35.0" "pydantic>=2.6.0,<3.0.0" "pydantic-settings>=2.2.0" "numpy>=1.26.0" "pandas>=2.2.0" "scipy>=1.12.0" "scikit-learn>=1.4.0" "joblib>=1.3.2" "pytest>=8.0.0" "requests>=2.31.0" "python-multipart>=0.0.9"
)

:: 4. Install Node.js Frontend Dependencies
echo.
echo [4/4] Installing frontend dependencies with npm...
cd frontend
call npm install
cd ..

echo.
echo ========================================================
echo Environment setup completed successfully!
echo ========================================================

