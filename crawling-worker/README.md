# Crawling Worker Service

Cloud Run service for processing crawling tasks via Pub/Sub.

## Overview

This service:

- Receives crawling tasks from Cloud Pub/Sub
- Uses Playwright to crawl web pages
- Stores results in Firestore
- Updates task status in PostgreSQL

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for local testing)
- PostgreSQL (main app database)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values
```

### Run Locally

```bash
# Development with auto-reload
npm run dev

# Build
npm run build

# Production
npm start
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8080

# Manual crawl (for testing)
curl -X POST http://localhost:8080/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test-123",
    "runId": "run-123",
    "projectId": "proj-123",
    "url": "https://example.com",
    "selectors": {
      "title": "h1",
      "description": "meta[name=\"description\"]"
    }
  }'
```

## Docker

### Build

```bash
docker build -t crawling-worker .
```

### Run

```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e GOOGLE_CLOUD_PROJECT="your-project" \
  crawling-worker
```

## Deployment

See [GCP_DEPLOYMENT.md](../GCP_DEPLOYMENT.md) for full deployment guide.

Quick deploy:

```bash
# From project root
gcloud builds submit --config=cloudbuild.yaml
```

## Architecture

```
Pub/Sub Topic → Push Subscription → Cloud Run (This Service)
                                          ↓
                                    ┌─────┴─────┐
                                    ↓           ↓
                                Firestore   PostgreSQL
                                (Data)      (Metadata)
```

## Environment Variables

| Variable                         | Description                          | Required           |
| -------------------------------- | ------------------------------------ | ------------------ |
| `PORT`                           | HTTP server port                     | No (default: 8080) |
| `DATABASE_URL`                   | PostgreSQL connection string         | Yes                |
| `GOOGLE_CLOUD_PROJECT`           | GCP project ID                       | Yes                |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key          | Yes (local only)   |
| `NODE_ENV`                       | Environment (development/production) | No                 |

## API Endpoints

### `GET /`

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "service": "crawling-worker",
  "timestamp": "2025-01-18T..."
}
```

### `POST /pubsub/crawl`

Pub/Sub push endpoint (called by Cloud Pub/Sub).

**Request:**

```json
{
  "message": {
    "data": "base64-encoded-json",
    "attributes": {}
  }
}
```

### `POST /crawl`

Manual crawl endpoint for testing.

**Request:**

```json
{
  "taskId": "task-123",
  "runId": "run-123",
  "projectId": "proj-123",
  "url": "https://example.com",
  "selectors": {
    "title": "h1",
    "price": ".price"
  }
}
```

**Response:**

```json
{
  "taskId": "task-123",
  "url": "https://example.com",
  "data": {
    "title": "Example Title",
    "price": "$99.99"
  },
  "timestamp": "2025-01-18T...",
  "status": "success"
}
```

## Monitoring

### Logs

```bash
# View Cloud Run logs
gcloud run services logs read crawling-worker --region asia-northeast3

# Follow logs
gcloud run services logs tail crawling-worker --region asia-northeast3
```

### Metrics

- Request count
- Request latency
- Error rate
- Container instance count

Access in Cloud Console → Cloud Run → crawling-worker → Metrics

## Troubleshooting

### High Memory Usage

Playwright/Chromium requires significant memory. Ensure:

- Cloud Run memory allocation ≥ 2Gi
- `--disable-dev-shm-usage` flag is set (already in code)

### Timeout Errors

- Increase Cloud Run timeout (max 60s)
- Optimize page load strategy
- Use `waitUntil: 'domcontentloaded'` instead of `'networkidle'`

### Connection Refused (Database)

- Verify DATABASE_URL is correct
- Check Cloud SQL connector is configured
- Ensure service account has Cloud SQL Client role

## Performance

### Browser Reuse

The worker reuses a single browser instance across requests for better performance. The browser is only relaunched if disconnected.

### Concurrency

Configured for 10 concurrent requests per container instance. Adjust in `cloudbuild.yaml`:

```yaml
--concurrency: 10
```

## Security

- Service runs as non-root user (future improvement)
- Secrets stored in Secret Manager
- No sensitive data in logs
- Push endpoint allows unauthenticated (secured by Pub/Sub)
