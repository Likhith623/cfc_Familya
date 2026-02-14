#!/bin/bash
# Backend startup wrapper with error logging
set -e

cd /app/backend

echo "=== Backend startup at $(date) ==="
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Environment variables:"
env | grep -E "SUPABASE|GOOGLE|DEEPGRAM|CARTESIA|CORS" || echo "No API keys found"

echo ""
echo "=== Checking Python imports ==="
python -c "import sys; print('Python path:', sys.path)" || exit 1
python -c "from fastapi import FastAPI; print('✓ FastAPI OK')" || exit 1
python -c "from config import get_settings; print('✓ Config OK')" || exit 1
python -c "from routers import auth; print('✓ Routers OK')" || exit 1

echo ""
echo "=== Starting uvicorn ==="
exec python -m uvicorn main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 75
