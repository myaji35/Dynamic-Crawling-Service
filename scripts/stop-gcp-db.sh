#!/bin/bash

if [ -f .cloud-sql-proxy.pid ]; then
    PID=$(cat .cloud-sql-proxy.pid)
    if ps -p $PID > /dev/null; then
        kill $PID
        echo "✅ Cloud SQL Proxy 중지됨 (PID: $PID)"
    else
        echo "⚠️  프로세스가 이미 종료됨"
    fi
    rm .cloud-sql-proxy.pid
else
    echo "⚠️  실행 중인 프록시가 없습니다"
fi
