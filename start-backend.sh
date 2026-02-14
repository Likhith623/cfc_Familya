#!/bin/bash
set -e  # Exit on any error

cd /app/backend

echo "=== Backend starting ==="
echo "Python: $(python --version 2>&1)"
echo "Working dir: $(pwd)"

# Don't buffer Python output
export PYTHONUNBUFFERED=1

# Quick sanity checks
if [ -z "$SUPABASE_URL" ]; then
    echo "ERROR: SUPABASE_URL environment variable is not set" >&2
    exit 1
fi
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "ERROR: SUPABASE_SERVICE_KEY environment variable is not set" >&2
    exit 1
fi

echo "✓ Environment variables OK"
echo "Starting uvicorn on 0.0.0.0:8000..."

# Start uvicorn - it will handle imports and fail fast if there are issues
exec python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 75
