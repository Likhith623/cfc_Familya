#!/bin/bash
# ============================================================
# Familia — Deploy to GCP Cloud Run
# Usage: ./deploy.sh
# ============================================================

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID env var}"
REGION="${GCP_REGION:-asia-south1}"
BACKEND_SERVICE="familia-api"
FRONTEND_SERVICE="familia-web"
REPO="familia"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🌍 Familia — Cloud Run Deploy        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# ─── Ensure Artifact Registry repo exists ───────────────────
echo -e "${YELLOW}[1/6] Setting up Artifact Registry...${NC}"
gcloud artifacts repositories describe ${REPO} \
    --project=${PROJECT_ID} \
    --location=${REGION} 2>/dev/null || \
gcloud artifacts repositories create ${REPO} \
    --project=${PROJECT_ID} \
    --location=${REGION} \
    --repository-format=docker \
    --description="Familia container images"

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

# ─── Build & Push Backend ───────────────────────────────────
echo -e "${YELLOW}[2/6] Building backend image...${NC}"
gcloud builds submit ./backend \
    --project=${PROJECT_ID} \
    --tag="${REGISTRY}/${BACKEND_SERVICE}:latest" \
    --quiet

# ─── Deploy Backend to Cloud Run ────────────────────────────
echo -e "${YELLOW}[3/6] Deploying backend to Cloud Run...${NC}"
gcloud run deploy ${BACKEND_SERVICE} \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --image="${REGISTRY}/${BACKEND_SERVICE}:latest" \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300 \
    --set-env-vars="PORT=8080" \
    --quiet

# Get the backend URL
BACKEND_URL=$(gcloud run services describe ${BACKEND_SERVICE} \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --format='value(status.url)')

echo -e "${GREEN}✓ Backend deployed: ${BACKEND_URL}${NC}"

# ─── Build Frontend (with backend URL baked in) ─────────────
echo -e "${YELLOW}[4/6] Building frontend image...${NC}"

# Read Supabase vars from frontend/.env if they exist
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
SUPABASE_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"

if [ -f "./frontend/.env" ] && [ -z "$SUPABASE_URL" ]; then
    source <(grep -E '^NEXT_PUBLIC_' ./frontend/.env | sed 's/^/export /')
    SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
    SUPABASE_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
fi

gcloud builds submit ./frontend \
    --project=${PROJECT_ID} \
    --tag="${REGISTRY}/${FRONTEND_SERVICE}:latest" \
    --substitutions="_NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL},_NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_KEY},_NEXT_PUBLIC_API_URL=${BACKEND_URL}/api/v1" \
    --quiet

# ─── Deploy Frontend to Cloud Run ───────────────────────────
echo -e "${YELLOW}[5/6] Deploying frontend to Cloud Run...${NC}"
gcloud run deploy ${FRONTEND_SERVICE} \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --image="${REGISTRY}/${FRONTEND_SERVICE}:latest" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3000 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=60 \
    --quiet

FRONTEND_URL=$(gcloud run services describe ${FRONTEND_SERVICE} \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --format='value(status.url)')

echo -e "${GREEN}✓ Frontend deployed: ${FRONTEND_URL}${NC}"

# ─── Update Backend CORS with frontend URL ──────────────────
echo -e "${YELLOW}[6/6] Updating backend CORS origins...${NC}"
gcloud run services update ${BACKEND_SERVICE} \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --update-env-vars="CORS_ORIGINS=${FRONTEND_URL},http://localhost:3000" \
    --quiet

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ Deployment Complete!           ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║ Frontend: ${FRONTEND_URL}${NC}"
echo -e "${GREEN}║ Backend:  ${BACKEND_URL}${NC}"
echo -e "${GREEN}║ API Docs: ${BACKEND_URL}/docs${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
