#!/bin/bash
# Quick redeploy to Cloud Run
set -e

SERVICE_NAME="familia"
REGION="asia-south1"

echo "🚀 Redeploying to Cloud Run..."
echo "This will use the existing environment variables already configured."
echo ""

gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated

echo ""
echo "✓ Deployment complete!"
echo "Check logs with:"
echo "  gcloud run logs read --service $SERVICE_NAME --region $REGION --limit 50"
