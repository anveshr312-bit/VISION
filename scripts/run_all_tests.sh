#!/usr/bin/env bash
# VISION - Run All Automated Tests
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

echo "==============================================================================="
echo "VISION: Running Automated Verification Suite"
echo "==============================================================================="

export PYTHONPATH=.
if [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

echo "[1/3] Running Python Tests (Pytest)..."
python -m pytest ml/tests backend/tests -v
PYTEST_EXIT=$?

if [ $PYTEST_EXIT -ne 0 ]; then
    echo "[FAILED] Backend / ML unit tests failed."
    exit $PYTEST_EXIT
fi

echo "[2/3] Running Frontend Smoke Tests..."
cd frontend
node src/tests/smoke.test.js
SMOKE_EXIT=$?

if [ $SMOKE_EXIT -ne 0 ]; then
    echo "[FAILED] Frontend smoke tests failed."
    exit $SMOKE_EXIT
fi

echo "[3/3] Running Frontend Production Build Check..."
npm run build
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
    echo "[FAILED] Frontend build failed."
    exit $BUILD_EXIT
fi

echo "==============================================================================="
echo "[SUCCESS] All tests and builds passed cleanly!"
echo "==============================================================================="

