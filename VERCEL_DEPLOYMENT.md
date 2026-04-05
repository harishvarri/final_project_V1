# Vercel Deployment Guide

## Included Files

- `vercel.json`: root Vercel build and rewrite config
- `api/index.py`: Vercel Python entrypoint for the Flask app
- `api/requirements.txt`: lean Python dependencies for the Vercel function
- `.env.example`: backend environment variable template
- `frontend/.env.example`: frontend environment variable template

## Vercel Project Settings

- Root directory: repository root
- Install command: `npm install --prefix frontend`
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/dist`

These are already defined in `vercel.json`.

## Required Environment Variables

### Frontend

- `VITE_API_BASE_URL=/api`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MODEL_PATH` if you provide the model artifact at runtime
- `CONFIDENCE_THRESHOLD` optional

## Important ML Note

The backend now starts safely even when TensorFlow or the model file is missing, which helps deployment succeed. However, live image classification still requires the `civic_issue_model.h5` model and TensorFlow support.

For full production inference, a dedicated Python host like Render, Railway, or Cloud Run is usually a better fit than Vercel for the ML backend.
