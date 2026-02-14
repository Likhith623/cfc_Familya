#!/bin/bash
set -e

cd /app/backend

echo "=== Backend starting at $(date) ==="
echo "Python: $(python --version)"

# Test imports first to catch errors
echo "Testing imports..."
python -c "import sys; sys.path.insert(0, '.'); from main import app; print('✓ Main app imports OK')" 2>&1 || {
    echo "ERROR: Failed to import main app"
    python -c "import sys; sys.path.insert(0, '.'); from main import app" 2>&1
    exit 1
}

echo "Starting uvicorn on 0.0.0.0:8000..."
export PYTHONUNBUFFERED=1
exec python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 75 2>&1
