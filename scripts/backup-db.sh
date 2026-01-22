#!/bin/bash
# Cloud SQL 데이터베이스 백업 스크립트

set -e

BACKUP_DIR="./backups/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dcs_dev_backup_$TIMESTAMP.sql"

# 환경 변수에서 DB 정보 읽기
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="dcs_dev_user"
DB_NAME="dcs_dev"

mkdir -p $BACKUP_DIR

echo "📦 Backing up database..."
echo "   Database: $DB_NAME"
echo "   File: $BACKUP_FILE"

# pg_dump 확인
if ! command -v pg_dump &> /dev/null; then
  echo "❌ Error: pg_dump not found"
  echo "   Install PostgreSQL client tools:"
  echo "   brew install postgresql"
  exit 1
fi

# Cloud SQL Proxy 실행 확인
if ! pgrep -f "cloud-sql-proxy" > /dev/null; then
  echo "⚠️  Warning: Cloud SQL Proxy is not running"
  echo "   Start it with: ./start-db-proxy.sh"
  exit 1
fi

# 비밀번호 입력 안내
echo ""
echo "Enter database password for user '$DB_USER':"

# 백업 실행
pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -F c \
  -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  # 파일 크기 확인
  FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
  echo ""
  echo "✅ Backup completed successfully!"
  echo "   File: $BACKUP_FILE"
  echo "   Size: $FILE_SIZE"
  echo ""
  echo "To restore:"
  echo "   ./scripts/restore-db.sh $BACKUP_FILE"
else
  echo "❌ Backup failed"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# 오래된 백업 정리 (30일 이상)
echo "🧹 Cleaning up old backups (older than 30 days)..."
find $BACKUP_DIR -name "*.sql" -type f -mtime +30 -delete
echo "✅ Cleanup complete"
