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
try:
    from main import app
    print('✓ Successfully imported FastAPI app')
except Exception as e:
    print(f'✗ Failed to import app: {e}')
    import traceback
    traceback.print_exc()
    exit(1)
" || exit 1

echo "Starting uvicorn on 0.0.0.0:8000..."
exec python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 75
