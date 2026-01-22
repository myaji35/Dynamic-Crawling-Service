#!/bin/bash
# 데이터베이스 복원 스크립트

set -e

if [ -z "$1" ]; then
  echo "❌ Error: No backup file specified"
  echo ""
  echo "Usage: ./scripts/restore-db.sh <backup_file>"
  echo ""
  echo "Available backups:"
  ls -lh ./backups/db/*.sql 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# 환경 변수에서 DB 정보 읽기
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="dcs_dev_user"
DB_NAME="dcs_dev"

echo "⚠️  WARNING: Database Restore"
echo ""
echo "   This will REPLACE all data in database: $DB_NAME"
echo "   From backup: $BACKUP_FILE"
echo ""
echo "   Current data will be DELETED!"
echo ""
read -p "   Type 'RESTORE' to continue: " confirm

if [ "$confirm" != "RESTORE" ]; then
  echo "Cancelled."
  exit 0
fi

# pg_restore 확인
if ! command -v pg_restore &> /dev/null; then
  echo "❌ Error: pg_restore not found"
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

echo ""
echo "📥 Restoring database..."
echo "   Enter database password for user '$DB_USER':"

# 복원 실행
pg_restore \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  --clean \
  --if-exists \
  "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database restored successfully!"
  echo ""
  echo "Run Prisma migrations to ensure schema is up to date:"
  echo "   npm run db:migrate"
else
  echo "❌ Restore failed"
  exit 1
fi
