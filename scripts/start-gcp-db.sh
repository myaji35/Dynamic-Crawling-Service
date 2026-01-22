#!/bin/bash

# .env.gcp 파일에서 설정 로드
if [ -f .env.gcp ]; then
    source .env.gcp
else
    echo "❌ .env.gcp 파일이 없습니다."
    exit 1
fi

# Cloud SQL Proxy 실행
echo "🚀 Cloud SQL Proxy 시작 중..."
./cloud-sql-proxy --port 5432 $GCP_SQL_CONNECTION_NAME > /dev/null 2>&1 &

# PID 저장
echo $! > .cloud-sql-proxy.pid

sleep 2

if ps -p $(cat .cloud-sql-proxy.pid) > /dev/null; then
    echo "✅ Cloud SQL Proxy 시작됨 (PID: $(cat .cloud-sql-proxy.pid))"
    echo "📡 접속 가능: localhost:5432"
    echo "📊 연결 정보: $GCP_SQL_CONNECTION_NAME"
else
    echo "❌ Cloud SQL Proxy 시작 실패"
    rm .cloud-sql-proxy.pid
    exit 1
fi
