#!/bin/bash

cd /app/backend

echo "=== Backend starting ==="
echo "Python: $(python --version 2>&1)"
echo "Working dir: $(pwd)"

# Don't set -e so we can capture errors
export PYTHONUNBUFFERED=1

echo "Starting uvicorn..."
python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 75 2>&1

# If we get here, uvicorn exited
echo "ERROR: Uvicorn exited with code $?"
exit 1
