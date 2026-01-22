# GCP Cloud SQL PostgreSQL 설정 가이드

모든 프로젝트에서 공유할 수 있는 PostgreSQL 인스턴스를 GCP에 설정합니다.

## 1. Cloud SQL 인스턴스 생성

### Google Cloud Console 사용

1. **GCP Console 접속**
   - https://console.cloud.google.com/
   - SQL 메뉴로 이동

2. **인스턴스 만들기**

   ```
   데이터베이스 엔진: PostgreSQL
   인스턴스 ID: shared-postgres-instance (또는 원하는 이름)
   비밀번호: 강력한 비밀번호 설정
   리전: asia-northeast3 (서울)
   ```

3. **머신 구성 (비용 최적화)**

   ```
   프리셋: 개발
   vCPU: 1 shared core
   메모리: 1.7GB
   스토리지: 10GB SSD
   자동 증가: 활성화
   ```

4. **연결 설정**
   ```
   공개 IP: 활성화
   승인된 네트워크: 0.0.0.0/0 (개발용, 프로덕션에서는 특정 IP만)
   또는
   Cloud SQL Auth Proxy 사용 (권장)
   ```

### gcloud CLI 사용

```bash
# 1. Cloud SQL Admin API 활성화
gcloud services enable sqladmin.googleapis.com

# 2. PostgreSQL 인스턴스 생성
gcloud sql instances create shared-postgres-instance \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-northeast3 \
  --root-password=YOUR_STRONG_PASSWORD \
  --storage-size=10GB \
  --storage-type=SSD \
  --storage-auto-increase

# 3. 공개 IP 접근 허용 (개발용)
gcloud sql instances patch shared-postgres-instance \
  --authorized-networks=0.0.0.0/0

# 4. 연결 정보 확인
gcloud sql instances describe shared-postgres-instance
```

## 2. 데이터베이스 생성

### psql 사용

```bash
# Cloud SQL Proxy 설치 (권장)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# 프록시 실행
./cloud-sql-proxy --port 5432 PROJECT_ID:REGION:shared-postgres-instance

# 별도 터미널에서 연결
psql "host=127.0.0.1 port=5432 user=postgres"

# 또는 직접 연결 (공개 IP 사용 시)
psql "host=INSTANCE_IP port=5432 user=postgres sslmode=require"
```

### 데이터베이스 및 사용자 생성

```sql
-- 1. 프로젝트별 데이터베이스 생성
CREATE DATABASE dcs_dev;        -- Dynamic Crawling Service
CREATE DATABASE project2_dev;
CREATE DATABASE project3_dev;

-- 2. 테스트 데이터베이스
CREATE DATABASE dcs_test;
CREATE DATABASE project2_test;

-- 3. 프로덕션 데이터베이스
CREATE DATABASE dcs_prod;
CREATE DATABASE project2_prod;

-- 4. 사용자 생성 (선택사항)
CREATE USER dcs_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE dcs_dev TO dcs_user;
GRANT ALL PRIVILEGES ON DATABASE dcs_test TO dcs_user;
GRANT ALL PRIVILEGES ON DATABASE dcs_prod TO dcs_user;

-- 5. 생성 확인
\l
```

## 3. 연결 문자열 설정

### 현재 프로젝트 (.env)

```bash
# 로컬 개발 (Cloud SQL Proxy 사용)
DATABASE_URL="postgresql://postgres:PASSWORD@127.0.0.1:5432/dcs_dev"

# 또는 직접 연결 (공개 IP)
DATABASE_URL="postgresql://postgres:PASSWORD@INSTANCE_PUBLIC_IP:5432/dcs_dev?sslmode=require"

# GCP에서 실행 시 (Unix Socket)
DATABASE_URL="postgresql://postgres:PASSWORD@/dcs_dev?host=/cloudsql/PROJECT_ID:REGION:shared-postgres-instance"
```

### 테스트 환경 (.env.test)

```bash
DATABASE_URL="postgresql://postgres:PASSWORD@127.0.0.1:5432/dcs_test"
```

## 4. Cloud SQL Proxy 설정 (로컬 개발)

### 수동 실행

```bash
# 프록시 다운로드 (한 번만)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy
mv cloud-sql-proxy /usr/local/bin/

# 실행
cloud-sql-proxy --port 5432 PROJECT_ID:REGION:shared-postgres-instance
```

### 자동화 스크립트

**scripts/start-gcp-db.sh**

```bash
#!/bin/bash

# Cloud SQL Proxy 시작
cloud-sql-proxy --port 5432 YOUR_PROJECT_ID:asia-northeast3:shared-postgres-instance &

# PID 저장
echo $! > .cloud-sql-proxy.pid

echo "✅ Cloud SQL Proxy started (PID: $(cat .cloud-sql-proxy.pid))"
echo "📡 Connect to: localhost:5432"
```

**scripts/stop-gcp-db.sh**

```bash
#!/bin/bash

if [ -f .cloud-sql-proxy.pid ]; then
  kill $(cat .cloud-sql-proxy.pid)
  rm .cloud-sql-proxy.pid
  echo "✅ Cloud SQL Proxy stopped"
else
  echo "⚠️  No proxy running"
fi
```

## 5. package.json 스크립트 추가

```json
{
  "scripts": {
    "db:gcp:start": "./scripts/start-gcp-db.sh",
    "db:gcp:stop": "./scripts/stop-gcp-db.sh",
    "db:migrate": "prisma migrate deploy",
    "db:studio": "prisma studio"
  }
}
```

## 6. 비용 관리

### 예상 비용 (서울 리전)

```
db-f1-micro (Shared core, 0.6GB RAM):
- 시간당: ~$0.015
- 월간 (730시간): ~$11 USD

db-g1-small (Shared core, 1.7GB RAM):
- 시간당: ~$0.025
- 월간: ~$18 USD

스토리지 (10GB SSD):
- 월간: ~$1.7 USD

총 예상 비용: 약 $13-20 USD/월
```

### 비용 절감 팁

1. **개발 시간에만 실행**

   ```bash
   # 사용 후 중지
   gcloud sql instances patch shared-postgres-instance --activation-policy=NEVER

   # 재시작
   gcloud sql instances patch shared-postgres-instance --activation-policy=ALWAYS
   ```

2. **자동 백업 최소화**

   ```bash
   gcloud sql instances patch shared-postgres-instance \
     --backup-start-time=03:00 \
     --retained-backups-count=7
   ```

3. **불필요한 로그 비활성화**

## 7. 보안 권장사항

### 프로덕션 환경

1. **IP 화이트리스트 설정**

   ```bash
   gcloud sql instances patch shared-postgres-instance \
     --clear-authorized-networks \
     --authorized-networks=YOUR_OFFICE_IP,YOUR_HOME_IP
   ```

2. **SSL 인증서 사용**

   ```bash
   gcloud sql ssl-certs create client-cert shared-postgres-instance
   ```

3. **IAM 기반 인증**

   ```bash
   gcloud sql users create IAM_USER \
     --instance=shared-postgres-instance \
     --type=CLOUD_IAM_USER
   ```

4. **VPC 피어링** (선택사항)
   - GCP 내부 네트워크로만 접근

## 8. 모니터링

### Cloud Monitoring 대시보드

```bash
# 인스턴스 메트릭 확인
gcloud sql operations list --instance=shared-postgres-instance

# 로그 확인
gcloud logging read "resource.type=cloudsql_database" --limit 50
```

### 알림 설정

1. Cloud Console → Monitoring → Alerting
2. CPU 사용률 > 80% 알림
3. 스토리지 > 80% 알림
4. 연결 수 > 90 알림

## 9. 다른 프로젝트에서 사용하기

### 새 프로젝트 설정

```bash
# 1. 데이터베이스 생성
psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE new_project_dev;"

# 2. .env 파일
echo 'DATABASE_URL="postgresql://postgres:PASSWORD@127.0.0.1:5432/new_project_dev"' > .env

# 3. Prisma 마이그레이션
npx prisma migrate dev
```

## 10. 문제 해결

### 연결 실패 시

```bash
# 1. 인스턴스 상태 확인
gcloud sql instances describe shared-postgres-instance

# 2. 방화벽 규칙 확인
gcloud compute firewall-rules list

# 3. Cloud SQL Proxy 로그 확인
cloud-sql-proxy --port 5432 PROJECT_ID:REGION:shared-postgres-instance --verbose

# 4. psql로 직접 연결 테스트
psql "host=INSTANCE_IP port=5432 user=postgres sslmode=require"
```

### 성능 문제

```sql
-- 느린 쿼리 확인
SELECT pid, query, state, wait_event_type
FROM pg_stat_activity
WHERE state != 'idle';

-- 인덱스 확인
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';
```

## 참고 자료

- [Cloud SQL for PostgreSQL 문서](https://cloud.google.com/sql/docs/postgres)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [가격 계산기](https://cloud.google.com/products/calculator)
