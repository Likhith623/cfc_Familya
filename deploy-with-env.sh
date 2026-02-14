#!/bin/bash

# ============================================================
# Familia Cloud Run Deployment Script with Environment Variables
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         Familia - Cloud Run Deployment Script                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ No .env file found${NC}"
    echo ""
    echo "Create a .env file with the following variables:"
    echo "  SUPABASE_URL=your-supabase-url"
    echo "  SUPABASE_ANON_KEY=your-anon-key"
    echo "  SUPABASE_SERVICE_KEY=your-service-key"
    echo "  GOOGLE_TRANSLATE_API_KEY=your-translate-key (optional)"
    echo "  DEEPGRAM_API_KEY=your-deepgram-key (optional)"
    echo "  CARTESIA_API_KEY=your-cartesia-key (optional)"
    exit 1
fi

# Load environment variables from .env
echo "Loading environment variables from .env..."
export $(grep -v '^#' .env | xargs)

# Validate required variables
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}✗ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

echo -e "${GREEN}✓ All required environment variables found${NC}"
echo ""

# Get GCP project ID (or use default)
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Enter your GCP project ID:${NC}"
    read PROJECT_ID
fi

# Get service name (or use default)
SERVICE_NAME="${SERVICE_NAME:-familia}"
REGION="${REGION:-asia-south1}"

echo "Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Service Name: $SERVICE_NAME"
echo "  Region: $REGION"
echo ""

# Build and push image to Artifact Registry
echo "Building and deploying to Cloud Run..."
echo ""

# Build with Cloud Build or deploy directly
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --set-env-vars "\
SUPABASE_URL=$SUPABASE_URL,\
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY,\
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY,\
GOOGLE_TRANSLATE_API_KEY=$GOOGLE_TRANSLATE_API_KEY,\
DEEPGRAM_API_KEY=$DEEPGRAM_API_KEY,\
CARTESIA_API_KEY=$CARTESIA_API_KEY"

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "Your service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
