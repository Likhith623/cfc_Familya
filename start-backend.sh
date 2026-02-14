#!/bin/bash
set -e  # Exit on any error

cd /app/backend

echo "=== Backend starting ==="
echo "Python: $(python --version 2>&1)"
echo "Working dir: $(pwd)"
echo "Python path: $(which python)"

# Don't buffer Python output
export PYTHONUNBUFFERED=1

# Check if required environment variables are set
echo "Checking environment variables..."
if [ -z "$SUPABASE_URL" ]; then
    echo "WARNING: SUPABASE_URL is not set"
fi
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "WARNING: SUPABASE_SERVICE_KEY is not set"
fi

# Test if we can import the app
echo "Testing Python imports..."
python -c "
import sys
import traceback
try:
    from main import app
    print('✓ Successfully imported FastAPI app', flush=True)
except Exception as e:
    print(f'✗ Failed to import app: {e}', file=sys.stderr, flush=True)
    print('\nFull traceback:', file=sys.stderr, flush=True)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to import FastAPI app. Check error above." >&2
    sleep 3600  # Keep container alive so we can see logs
fi

echo "Starting uvicorn on 0.0.0.0:8000..."
exec python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 75
