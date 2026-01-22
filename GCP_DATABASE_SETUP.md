# GCP Cloud SQL 개발 데이터베이스 설정 가이드

로컬 개발 시 GCP Cloud SQL을 직접 사용하여 데이터 손실을 방지하는 설정입니다.

## 목표

- ✅ 개발 환경에서 GCP Cloud SQL 직접 사용
- ✅ 스키마 변경 시에만 마이그레이션 (데이터 보존)
- ✅ 로컬 Docker DB는 백업/테스트 용도로만 사용
- ✅ 실수로 데이터 삭제 방지

## 1단계: GCP Cloud SQL 인스턴스 생성

### 1.1 Cloud SQL 인스턴스 생성

```bash
# GCP 프로젝트 설정
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-northeast3"  # 서울

gcloud config set project $PROJECT_ID

# Cloud SQL API 활성화
gcloud services enable sqladmin.googleapis.com

# 개발용 Cloud SQL 인스턴스 생성 (저렴한 설정)
gcloud sql instances create dcs-dev-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=$REGION \
  --network=default \
  --no-assign-ip \
  --root-password="YOUR_SECURE_ROOT_PASSWORD"
```

**비용 절감 팁:**

- `db-f1-micro`: 가장 저렴한 티어 (~$7/월)
- 프로덕션용은 별도 인스턴스 사용 권장

### 1.2 데이터베이스 및 사용자 생성

```bash
# 데이터베이스 생성
gcloud sql databases create dcs_dev \
  --instance=dcs-dev-db

# 사용자 생성
gcloud sql users create dcs_dev_user \
  --instance=dcs-dev-db \
  --password="YOUR_DEV_USER_PASSWORD"

# 사용자 권한 부여 (postgres 클라이언트로 접속 후)
# GRANT ALL PRIVILEGES ON DATABASE dcs_dev TO dcs_dev_user;
```

## 2단계: 로컬에서 Cloud SQL 접속 설정

### 2.1 Cloud SQL Auth Proxy 설치

Cloud SQL Proxy를 사용하면 안전하게 로컬에서 Cloud SQL에 접속할 수 있습니다.

**Mac (Homebrew):**

```bash
brew install --cask google-cloud-sdk
gcloud components install cloud-sql-proxy
```

**또는 직접 다운로드:**

```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

### 2.2 서비스 계정 생성 (개발용)

```bash
# 서비스 계정 생성
gcloud iam service-accounts create dev-db-access \
  --display-name="Development Database Access"

# Cloud SQL Client 권한 부여
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:dev-db-access@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# 키 생성 및 다운로드
gcloud iam service-accounts keys create ./gcp-dev-db-key.json \
  --iam-account=dev-db-access@$PROJECT_ID.iam.gserviceaccount.com

# .gitignore에 추가되었는지 확인
echo "gcp-*.json" >> .gitignore
```

### 2.3 Connection Name 확인

```bash
# Cloud SQL 인스턴스의 Connection Name 가져오기
gcloud sql instances describe dcs-dev-db \
  --format="value(connectionName)"

# 출력 예시: your-project-id:asia-northeast3:dcs-dev-db
# 이 값을 메모해두세요!
```

## 3단계: Cloud SQL Proxy 실행 스크립트 생성

### 3.1 자동 실행 스크립트 생성

프로젝트 루트에 `start-db-proxy.sh` 생성:

```bash
#!/bin/bash
# Cloud SQL Proxy 자동 시작 스크립트

# 설정
INSTANCE_CONNECTION_NAME="your-project-id:asia-northeast3:dcs-dev-db"
SERVICE_ACCOUNT_KEY="./gcp-dev-db-key.json"
LOCAL_PORT=5432

echo "🔌 Starting Cloud SQL Proxy..."
echo "   Instance: $INSTANCE_CONNECTION_NAME"
echo "   Local Port: $LOCAL_PORT"

# 기존 프로세스 종료
pkill -f cloud-sql-proxy 2>/dev/null

# Cloud SQL Proxy 실행 (백그라운드)
cloud-sql-proxy \
  --credentials-file=$SERVICE_ACCOUNT_KEY \
  --port=$LOCAL_PORT \
  $INSTANCE_CONNECTION_NAME &

PROXY_PID=$!

echo "✅ Cloud SQL Proxy started (PID: $PROXY_PID)"
echo "   Connect to: localhost:$LOCAL_PORT"
echo ""
echo "To stop: pkill -f cloud-sql-proxy"
```

실행 권한 부여:

```bash
chmod +x start-db-proxy.sh
```

### 3.2 종료 스크립트 생성

`stop-db-proxy.sh`:

```bash
#!/bin/bash
echo "🛑 Stopping Cloud SQL Proxy..."
pkill -f cloud-sql-proxy
echo "✅ Cloud SQL Proxy stopped"
```

```bash
chmod +x stop-db-proxy.sh
```

## 4단계: 환경 변수 설정

### 4.1 .env 업데이트

```bash
# PostgreSQL Database (GCP Cloud SQL via Proxy)
DATABASE_URL="postgresql://dcs_dev_user:YOUR_DEV_USER_PASSWORD@localhost:5432/dcs_dev"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI API
OPENAI_API_KEY="sk-proj-your-key"

# Google Cloud
GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="./gcp-dev-db-key.json"

# Cloud Pub/Sub
PUBSUB_TOPIC="crawling-tasks"

# Webhook Encryption
WEBHOOK_ENCRYPTION_KEY="your-encryption-key"

# Environment
NODE_ENV="development"
```

### 4.2 .env.local.backup (로컬 Docker DB용)

로컬 테스트가 필요할 경우를 위해 백업:

```bash
# Local Docker PostgreSQL (Backup/Testing only)
DATABASE_URL="postgresql://postgres:password@localhost:5433/dcs_dev"
```

## 5단계: Prisma 마이그레이션 안전 설정

### 5.1 package.json에 안전한 스크립트 추가

```json
{
  "scripts": {
    "db:proxy": "./start-db-proxy.sh",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:create": "prisma migrate dev --create-only",
    "db:studio": "prisma studio",
    "db:push": "echo '⚠️  WARNING: db:push can cause data loss. Use db:migrate:dev instead.' && read -p 'Continue? (y/N) ' confirm && [ \"$confirm\" = 'y' ] && prisma db push",
    "db:reset": "echo '🚨 DANGER: This will DELETE ALL DATA! Type \"DELETE ALL DATA\" to confirm:' && read confirm && [ \"$confirm\" = 'DELETE ALL DATA' ] && prisma migrate reset"
  }
}
```

### 5.2 마이그레이션 워크플로우

**스키마 변경 시:**

```bash
# 1. Cloud SQL Proxy 시작
npm run db:proxy

# 2. 마이그레이션 파일 생성 (DB 변경 없음)
npm run db:migrate:create
# 파일명 입력: add_new_field

# 3. 생성된 마이그레이션 검토
# prisma/migrations/xxx_add_new_field/migration.sql

# 4. 마이그레이션 적용 (신중하게!)
npm run db:migrate:dev

# 또는 프로덕션용
npm run db:migrate
```

**개발 중 (스키마 변경 없음):**

```bash
# Cloud SQL Proxy만 시작
npm run db:proxy

# 개발 서버 실행
npm run dev
```

## 6단계: 데이터 백업 스크립트

### 6.1 자동 백업 스크립트

`scripts/backup-db.sh`:

```bash
#!/bin/bash
# Cloud SQL 데이터베이스 백업 스크립트

BACKUP_DIR="./backups/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dcs_dev_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "📦 Backing up database..."

# Cloud SQL에서 직접 백업 (gcloud 사용)
gcloud sql export sql dcs-dev-db \
  gs://YOUR_BUCKET_NAME/backups/dcs_dev_$TIMESTAMP.sql \
  --database=dcs_dev

# 또는 로컬로 덤프 (Proxy 사용)
PGPASSWORD=YOUR_DEV_USER_PASSWORD pg_dump \
  -h localhost \
  -p 5432 \
  -U dcs_dev_user \
  -d dcs_dev \
  -F c \
  -f "$BACKUP_FILE"

echo "✅ Backup saved to: $BACKUP_FILE"
```

### 6.2 복원 스크립트

`scripts/restore-db.sh`:

```bash
#!/bin/bash
# 데이터베이스 복원 스크립트

if [ -z "$1" ]; then
  echo "Usage: ./restore-db.sh <backup_file>"
  exit 1
fi

BACKUP_FILE=$1

echo "⚠️  This will RESTORE database from: $BACKUP_FILE"
read -p "Continue? (y/N) " confirm

if [ "$confirm" != "y" ]; then
  echo "Cancelled."
  exit 0
fi

PGPASSWORD=YOUR_DEV_USER_PASSWORD pg_restore \
  -h localhost \
  -p 5432 \
  -U dcs_dev_user \
  -d dcs_dev \
  --clean \
  "$BACKUP_FILE"

echo "✅ Database restored"
```

## 7단계: 개발 워크플로우

### 일상적인 개발

```bash
# 1. Cloud SQL Proxy 시작
npm run db:proxy

# 2. 개발 서버 실행 (다른 터미널)
npm run dev

# 3. 필요시 DB GUI 열기
npm run db:studio
```

### 스키마 변경 시

```bash
# 1. 백업 (중요!)
./scripts/backup-db.sh

# 2. 마이그레이션 파일 생성
npm run db:migrate:create

# 3. SQL 검토 후 적용
npm run db:migrate:dev
```

## 8단계: 팀 협업 설정

### 8.1 .env.template 생성

팀원들을 위한 템플릿:

```bash
# PostgreSQL Database (GCP Cloud SQL)
DATABASE_URL="postgresql://dcs_dev_user:PASSWORD_HERE@localhost:5432/dcs_dev"

# Get your service account key from team lead
GOOGLE_APPLICATION_CREDENTIALS="./gcp-dev-db-key.json"

# Other variables...
```

### 8.2 README 업데이트

팀원 온보딩 가이드:

```markdown
## Development Setup

1. Install Cloud SQL Proxy:
   \`\`\`bash
   brew install --cask google-cloud-sdk
   \`\`\`

2. Get service account key from team lead
   - Save as `gcp-dev-db-key.json`

3. Start database proxy:
   \`\`\`bash
   npm run db:proxy
   \`\`\`

4. Run development server:
   \`\`\`bash
   npm run dev
   \`\`\`
```

## 비용 최적화

### 개발 DB 비용 절감

```bash
# 사용하지 않을 때 인스턴스 중지
gcloud sql instances patch dcs-dev-db --activation-policy=NEVER

# 다시 시작
gcloud sql instances patch dcs-dev-db --activation-policy=ALWAYS
```

### 자동 중지 스크립트

```bash
# 평일 야간/주말 자동 중지 (Cloud Scheduler 사용)
# 비용 절감: 약 50%
```

## 문제 해결

### Proxy 연결 실패

```bash
# 1. 서비스 계정 권한 확인
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:dev-db-access@*"

# 2. Proxy 로그 확인
cloud-sql-proxy --debug ...
```

### 마이그레이션 실패

```bash
# 1. 현재 마이그레이션 상태 확인
npx prisma migrate status

# 2. 마이그레이션 히스토리 확인
SELECT * FROM _prisma_migrations;

# 3. 강제 해결 (마지막 수단)
npx prisma migrate resolve --applied "MIGRATION_NAME"
```

## 보안 체크리스트

- [ ] `gcp-*.json` 파일이 .gitignore에 있는지 확인
- [ ] 강력한 데이터베이스 비밀번호 사용
- [ ] 서비스 계정은 최소 권한만 부여
- [ ] IP 화이트리스트 설정 (선택사항)
- [ ] 정기적인 백업 자동화

## 요약

**개발 시작:**

```bash
npm run db:proxy    # Cloud SQL 연결
npm run dev         # 개발 서버
```

**스키마 변경:**

```bash
./scripts/backup-db.sh              # 백업
npm run db:migrate:create           # 마이그레이션 생성
npm run db:migrate:dev              # 적용
```

**데이터 보존:** ✅ GCP Cloud SQL 사용으로 데이터 손실 방지!
