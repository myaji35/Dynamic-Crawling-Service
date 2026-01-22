#!/bin/bash
# Cloud SQL Proxy 종료 스크립트

echo "🛑 Stopping Cloud SQL Proxy..."

PROXY_PID=$(pgrep -f "cloud-sql-proxy")

if [ -z "$PROXY_PID" ]; then
  echo "ℹ️  Cloud SQL Proxy is not running"
  exit 0
fi

kill $PROXY_PID 2>/dev/null

# 종료 대기
sleep 2

# 확인
if pgrep -f "cloud-sql-proxy" > /dev/null; then
  echo "⚠️  Force killing Cloud SQL Proxy..."
  pkill -9 -f "cloud-sql-proxy"
fi

echo "✅ Cloud SQL Proxy stopped"
