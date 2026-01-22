# GCP Deployment Guide - Dynamic Crawling Service

This guide covers deploying the Dynamic Crawling Service to Google Cloud Platform.

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vercel    │────▶│  Cloud Run   │────▶│  Firestore  │
│  (Next.js)  │     │   (Worker)   │     │   (Data)    │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    ▲
       │                    │
       ▼                    │
┌─────────────┐     ┌──────────────┐
│  Cloud SQL  │     │   Pub/Sub    │
│ (Postgres)  │     │   (Queue)    │
└─────────────┘     └──────────────┘
```

## Prerequisites

1. **GCP Account** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Docker** installed locally
4. **Node.js 20+** installed

## Step 1: GCP Project Setup

### 1.1 Create Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export REGION="asia-northeast3"  # Seoul

# Create project
gcloud projects create $PROJECT_ID

# Set as default project
gcloud config set project $PROJECT_ID

# Enable billing (do this in console)
```

### 1.2 Enable Required APIs

```bash
# Enable all required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  pubsub.googleapis.com \
  firestore.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com
```

## Step 2: Database Setup

### 2.1 Create Cloud SQL Instance (PostgreSQL)

```bash
# Create Cloud SQL instance
gcloud sql instances create dcs-postgres \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create dcs_production \
  --instance=dcs-postgres

# Create user
gcloud sql users create dcs_user \
  --instance=dcs-postgres \
  --password=YOUR_SECURE_USER_PASSWORD
```

### 2.2 Get Connection String

```bash
# Get connection name
gcloud sql instances describe dcs-postgres --format="value(connectionName)"

# Format: PROJECT_ID:REGION:INSTANCE_NAME
# Example DATABASE_URL:
# postgresql://dcs_user:password@/dcs_production?host=/cloudsql/PROJECT_ID:REGION:dcs-postgres
```

### 2.3 Initialize Firestore

```bash
# Create Firestore database (Native mode)
gcloud firestore databases create --region=$REGION
```

## Step 3: Secrets Management

### 3.1 Store Secrets in Secret Manager

```bash
# Database URL
echo -n "postgresql://dcs_user:password@/dcs_production?host=/cloudsql/$PROJECT_ID:$REGION:dcs-postgres" | \
  gcloud secrets create DATABASE_URL --data-file=-

# NextAuth Secret
openssl rand -base64 32 | gcloud secrets create NEXTAUTH_SECRET --data-file=-

# OpenAI API Key
echo -n "sk-proj-your-openai-key" | gcloud secrets create OPENAI_API_KEY --data-file=-

# Webhook Encryption Key
openssl rand -base64 32 | gcloud secrets create WEBHOOK_ENCRYPTION_KEY --data-file=-
```

## Step 4: Pub/Sub Setup

### 4.1 Create Topic and Subscription

```bash
# Create Pub/Sub topic
gcloud pubsub topics create crawling-tasks

# Create push subscription (will be configured after Cloud Run deployment)
# We'll create this in Step 6 after Cloud Run URL is available
```

## Step 5: Deploy Crawling Worker to Cloud Run

### 5.1 Build and Deploy Using Cloud Build

```bash
# Submit build to Cloud Build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD)
```

**OR** Build and deploy manually:

```bash
# Build Docker image
cd crawling-worker
docker build -t gcr.io/$PROJECT_ID/crawling-worker:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/crawling-worker:latest

# Deploy to Cloud Run
gcloud run deploy crawling-worker \
  --image gcr.io/$PROJECT_ID/crawling-worker:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 60s \
  --max-instances 100 \
  --set-env-vars NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --set-secrets DATABASE_URL=DATABASE_URL:latest \
  --add-cloudsql-instances $PROJECT_ID:$REGION:dcs-postgres
```

### 5.2 Get Cloud Run URL

```bash
# Get service URL
export WORKER_URL=$(gcloud run services describe crawling-worker \
  --region $REGION \
  --format="value(status.url)")

echo "Worker URL: $WORKER_URL"
```

## Step 6: Configure Pub/Sub Push Subscription

```bash
# Create push subscription to Cloud Run
gcloud pubsub subscriptions create crawling-tasks-subscription \
  --topic=crawling-tasks \
  --push-endpoint=$WORKER_URL/pubsub/crawl \
  --ack-deadline=60
```

## Step 7: Deploy Next.js App to Vercel

### 7.1 Create Service Account for Vercel

```bash
# Create service account
gcloud iam service-accounts create vercel-app \
  --display-name="Vercel Application"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:vercel-app@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/firestore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:vercel-app@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:vercel-app@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Create and download key
gcloud iam service-accounts keys create vercel-key.json \
  --iam-account=vercel-app@$PROJECT_ID.iam.gserviceaccount.com
```

### 7.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - DATABASE_URL (from Secret Manager)
# - NEXTAUTH_URL (your vercel.app URL)
# - NEXTAUTH_SECRET (from Secret Manager)
# - OPENAI_API_KEY (from Secret Manager)
# - GOOGLE_CLOUD_PROJECT
# - GOOGLE_APPLICATION_CREDENTIALS (paste JSON content)
# - PUBSUB_TOPIC=crawling-tasks
# - WEBHOOK_ENCRYPTION_KEY (from Secret Manager)
```

## Step 8: Run Database Migrations

```bash
# From your local machine, connect to Cloud SQL
# First, install Cloud SQL Proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy

# Start proxy
./cloud_sql_proxy -instances=$PROJECT_ID:$REGION:dcs-postgres=tcp:5432 &

# Set DATABASE_URL for local Prisma
export DATABASE_URL="postgresql://dcs_user:password@localhost:5432/dcs_production"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Step 9: Setup Cloud Scheduler (Optional)

For scheduled crawling tasks:

```bash
# Create scheduler job example
gcloud scheduler jobs create http daily-crawl \
  --location=$REGION \
  --schedule="0 9 * * *" \
  --uri="https://your-app.vercel.app/api/scheduled/crawl" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_API_KEY"
```

## Step 10: Monitoring & Logging

### 10.1 View Logs

```bash
# Cloud Run logs
gcloud run services logs read crawling-worker --region=$REGION

# Pub/Sub logs
gcloud logging read "resource.type=pubsub_subscription" --limit 50
```

### 10.2 Setup Alerts

```bash
# Create alert for Cloud Run errors
# (Do this in Cloud Console > Monitoring > Alerting)
```

## Testing

### Test Crawling Worker Directly

```bash
# Test health endpoint
curl $WORKER_URL

# Test manual crawl endpoint
curl -X POST $WORKER_URL/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test-123",
    "runId": "run-123",
    "projectId": "proj-123",
    "url": "https://example.com",
    "selectors": {
      "title": "h1"
    }
  }'
```

### Test Pub/Sub Integration

```bash
# Publish test message
gcloud pubsub topics publish crawling-tasks \
  --message='{"taskId":"test-123","runId":"run-123","projectId":"proj-123","url":"https://example.com","selectors":{"title":"h1"}}'
```

## Cost Optimization

### Production Settings

```yaml
# cloudbuild.yaml adjustments for production
--min-instances: 1 # Keep 1 instance warm
--max-instances: 50 # Limit max instances
--memory: 1Gi # Reduce if possible
--cpu: 1 # Reduce if possible
```

### Development Settings

```yaml
# For dev/staging
--min-instances: 0 # Scale to zero
--max-instances: 10
--memory: 512Mi
--cpu: 1
```

## Troubleshooting

### Worker not receiving messages

1. Check Pub/Sub subscription configuration
2. Verify Cloud Run allows unauthenticated requests
3. Check Cloud Run logs for errors

### Database connection issues

1. Verify Cloud SQL instance is running
2. Check Cloud SQL connection is added to Cloud Run
3. Verify DATABASE_URL secret is correct

### Playwright errors

1. Check memory allocation (min 2Gi for Chromium)
2. Verify all dependencies in Dockerfile
3. Check timeout settings

## Security Checklist

- [ ] All secrets stored in Secret Manager
- [ ] Service accounts follow least privilege
- [ ] Cloud SQL has private IP (optional)
- [ ] Cloud Run has authentication for admin endpoints
- [ ] API keys rotated regularly
- [ ] Audit logs enabled

## Next Steps

1. Setup monitoring dashboards
2. Configure auto-scaling policies
3. Implement dead letter queue for failed tasks
4. Setup backup for Cloud SQL
5. Configure CDN for static assets

## Support

For issues, check:

- Cloud Run logs: `gcloud run services logs read crawling-worker`
- Build logs: `gcloud builds list`
- Pub/Sub metrics: Cloud Console > Pub/Sub > Topics
