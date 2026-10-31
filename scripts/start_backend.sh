#!/usr/bin/env bash
# VISION - Start FastAPI Backend Server
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

echo "==============================================================================="
echo "VISION: Starting FastAPI Backend API Server"
echo "==============================================================================="

if [ ! -f ".venv/Scripts/python.exe" ] && [ ! -f ".venv/bin/python" ]; then
    echo "[ERROR] Virtual environment (.venv) not found."
    exit 1
fi

export PYTHONPATH=.
if [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

echo "[INFO] Launching Uvicorn on http://127.0.0.1:8000 ..."
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

