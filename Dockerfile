# ============================================================
# Familia — Single Container for GCP Cloud Run
# Runs both FastAPI backend + Next.js frontend
# Next.js proxies /api/v1/* to the backend internally
# ============================================================

# ─── Stage 1: Build Frontend ────────────────────────────────
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

RUN apk add --no-cache libc6-compat

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --prefer-offline

COPY frontend/ .

# Build-time env vars (baked into client JS bundle)
# These are PUBLIC anon keys — safe to include in the image
ARG NEXT_PUBLIC_SUPABASE_URL=https://gagmihbzrxlnwdaubzik.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZ21paGJ6cnhsbndkYXViemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjA0NzMsImV4cCI6MjA4NjU5NjQ3M30.QXK5QAklTyoMXcJsrPbChJGbsmIlSL_MNsXclvd-t6k
ARG NEXT_PUBLIC_API_URL=/api/v1

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ─── Stage 2: Install Backend Dependencies ──────────────────
FROM python:3.11-slim AS backend-builder

WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libjpeg62-turbo-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ─── Stage 3: Production Image ──────────────────────────────
FROM python:3.11-slim

# Install Node.js 18 + supervisor + runtime libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libjpeg62-turbo \
    zlib1g \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=backend-builder /install /usr/local

# ─── Backend ────────────────────────────────────────────────
WORKDIR /app/backend
COPY backend/ .
RUN rm -f .env

# ─── Frontend (standalone build) ────────────────────────────
WORKDIR /app/frontend
RUN mkdir -p /app/frontend/public
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static

# ─── Supervisor Config ──────────────────────────────────────
COPY <<'EOF' /etc/supervisor/conf.d/familia.conf
[supervisord]
nodaemon=true
logfile=/dev/null
logfile_maxbytes=0
user=root

[program:backend]
command=python -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1 --log-level info
directory=/app/backend
autostart=true
autorestart=true
stdout_logfile=/dev/fd/1
stdout_logfile_maxbytes=0
stderr_logfile=/dev/fd/2
stderr_logfile_maxbytes=0

[program:frontend]
command=node server.js
directory=/app/frontend
environment=PORT="%(ENV_PORT)s",HOSTNAME="0.0.0.0",NODE_ENV="production"
autostart=true
autorestart=true
stdout_logfile=/dev/fd/1
stdout_logfile_maxbytes=0
stderr_logfile=/dev/fd/2
stderr_logfile_maxbytes=0
EOF

WORKDIR /app

# Cloud Run injects PORT (default 8080) — Next.js listens on it
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

EXPOSE ${PORT}

# Health check hits the Next.js server which proxies /health to backend
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/familia.conf"]
