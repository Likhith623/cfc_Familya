# 🔧 Fixing the Backend Connection Issue

## Problem

Your Cloud Run deployment shows this error:
```
Failed to proxy http://127.0.0.1:8000/api/v1/auth/login Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Root Cause:** The FastAPI backend is not starting because required environment variables (Supabase credentials) are missing in Cloud Run.

## Solution

You need to configure environment variables in Cloud Run for your backend to connect to Supabase.

### Option 1: Using the Automated Script (Recommended)

1. **Create a `.env` file** in the project root with your credentials:

```bash
# Required - Your Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Optional - API keys for additional features
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key
DEEPGRAM_API_KEY=your-deepgram-key
CARTESIA_API_KEY=your-cartesia-key
```

2. **Run the deployment script:**

```bash
./deploy-with-env.sh
```

This script will:
- Load variables from your `.env` file
- Build and deploy to Cloud Run
- Automatically configure all environment variables

### Option 2: Manual Configuration via Console

1. **Go to Cloud Run Console:**
   - Open [Google Cloud Console](https://console.cloud.google.com/run)
   - Select your `familia` service

2. **Edit the service:**
   - Click "Edit & Deploy New Revision"
   - Scroll to "Variables & Secrets"
   - Click "Environment variables" tab

3. **Add these variables:**
   
   **Required:**
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key

   **Optional (for full features):**
   - `GOOGLE_TRANSLATE_API_KEY`: For translation
   - `DEEPGRAM_API_KEY`: For speech-to-text
   - `CARTESIA_API_KEY`: For text-to-speech

4. **Deploy the new revision**

### Option 3: Using gcloud CLI

```bash
gcloud run services update familia \
  --region asia-south1 \
  --set-env-vars "\
SUPABASE_URL=https://your-project.supabase.co,\
SUPABASE_ANON_KEY=your-anon-key,\
SUPABASE_SERVICE_KEY=your-service-key,\
GOOGLE_TRANSLATE_API_KEY=your-translate-key,\
DEEPGRAM_API_KEY=your-deepgram-key,\
CARTESIA_API_KEY=your-cartesia-key"
```

## Finding Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. You'll find:
   - **Project URL** = `SUPABASE_URL`
   - **anon public** key = `SUPABASE_ANON_KEY`
   - **service_role** key = `SUPABASE_SERVICE_KEY` (click "Reveal" to see it)

## Verification

After deploying with environment variables, check the logs:

```bash
gcloud run logs read --service familia --region asia-south1 --limit 50
```

You should see:
```
✓ Successfully imported FastAPI app
Starting uvicorn on 0.0.0.0:8000...
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Testing

Open your Cloud Run URL and try logging in. The backend should now respond correctly.

## What Changed

We've improved:
1. **Better error messages** - The backend now clearly reports missing environment variables
2. **Startup validation** - Tests Python imports before starting the server
3. **Enhanced logging** - Shows diagnostic information during startup
4. **Deployment script** - Automates the deployment with correct environment variables

## Need Help?

If you still see errors after setting environment variables, share the new logs and we can debug further.
