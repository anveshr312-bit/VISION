#!/usr/bin/env bash
# VISION - Start Frontend Vite Dev Server
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/../frontend"

echo "==============================================================================="
echo "VISION: Starting React + Vite 3D Digital Twin Frontend"
echo "==============================================================================="

if [ ! -d "node_modules" ]; then
    echo "[INFO] node_modules not found. Running npm install..."
    npm install
fi

echo "[INFO] Launching Vite Dev Server on http://localhost:5173 ..."
npm run dev

