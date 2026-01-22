#!/bin/bash
# Cloud SQL Proxy 자동 시작 스크립트

# 설정 (여기를 실제 값으로 변경하세요)
INSTANCE_CONNECTION_NAME="${INSTANCE_CONNECTION_NAME:-your-project-id:asia-northeast3:dcs-dev-db}"
SERVICE_ACCOUNT_KEY="${GOOGLE_APPLICATION_CREDENTIALS:-./gcp-dev-db-key.json}"
LOCAL_PORT=5432

echo "🔌 Starting Cloud SQL Proxy..."
echo "   Instance: $INSTANCE_CONNECTION_NAME"
echo "   Credentials: $SERVICE_ACCOUNT_KEY"
echo "   Local Port: $LOCAL_PORT"
echo ""

# 서비스 계정 키 파일 확인
if [ ! -f "$SERVICE_ACCOUNT_KEY" ]; then
  echo "❌ Error: Service account key file not found: $SERVICE_ACCOUNT_KEY"
  echo ""
  echo "Please:"
  echo "  1. Create a service account in GCP Console"
  echo "  2. Download the key as JSON"
  echo "  3. Save it as: $SERVICE_ACCOUNT_KEY"
  echo ""
  echo "Or see: GCP_DATABASE_SETUP.md"
  exit 1
fi

# cloud-sql-proxy 설치 확인
if ! command -v cloud-sql-proxy &> /dev/null; then
  echo "❌ Error: cloud-sql-proxy not found"
  echo ""
  echo "Install with:"
  echo "  brew install --cask google-cloud-sdk"
  echo "  gcloud components install cloud-sql-proxy"
  echo ""
  echo "Or download from:"
  echo "  https://cloud.google.com/sql/docs/mysql/sql-proxy"
  exit 1
fi

# 기존 프로세스 종료
EXISTING_PID=$(pgrep -f "cloud-sql-proxy.*$INSTANCE_CONNECTION_NAME")
if [ ! -z "$EXISTING_PID" ]; then
  echo "⚠️  Stopping existing Cloud SQL Proxy (PID: $EXISTING_PID)..."
  kill $EXISTING_PID 2>/dev/null
  sleep 2
fi

# Cloud SQL Proxy 실행 (백그라운드)
echo "Starting proxy..."
cloud-sql-proxy \
  --credentials-file="$SERVICE_ACCOUNT_KEY" \
  --port=$LOCAL_PORT \
  "$INSTANCE_CONNECTION_NAME" &

PROXY_PID=$!

# 프로세스 시작 대기
sleep 2

# 프로세스 확인
if ps -p $PROXY_PID > /dev/null; then
  echo ""
  echo "✅ Cloud SQL Proxy started successfully!"
  echo "   PID: $PROXY_PID"
  echo "   Connect to: localhost:$LOCAL_PORT"
  echo ""
  echo "To stop: ./stop-db-proxy.sh"
  echo "         or: kill $PROXY_PID"
else
  echo ""
  echo "❌ Failed to start Cloud SQL Proxy"
  echo "   Check the error messages above"
  exit 1
fi
