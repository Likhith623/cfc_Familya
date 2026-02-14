#!/bin/bash
set -e

cd /app/backend

echo "=== Backend starting at $(date) ==="
echo "Python: $(python --version)"

# Start uvicorn directly - let it fail naturally if imports are broken
echo "Starting uvicorn on 0.0.0.0:8000..."
export PYTHONUNBUFFERED=1
exec python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 75
