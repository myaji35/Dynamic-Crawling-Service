# 개발 환경 빠른 시작 가이드

## 🚀 5분 안에 시작하기

### 전제 조건

- Node.js 20+ 설치됨
- GCP 계정 (Cloud SQL 사용)
- gcloud CLI 설치됨

## 📋 초기 설정 (최초 1회만)

### 1. GCP Cloud SQL 설정

자세한 가이드: [GCP_DATABASE_SETUP.md](./GCP_DATABASE_SETUP.md)

**간단 요약:**

```bash
# GCP 프로젝트 설정
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Cloud SQL 인스턴스 생성 (약 5분 소요)
gcloud sql instances create dcs-dev-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-northeast3

# DB 및 사용자 생성
gcloud sql databases create dcs_dev --instance=dcs-dev-db
gcloud sql users create dcs_dev_user \
  --instance=dcs-dev-db \
  --password="YOUR_SECURE_PASSWORD"
```

### 2. 서비스 계정 키 생성

```bash
# 서비스 계정 생성
gcloud iam service-accounts create dev-db-access \
  --display-name="Development Database Access"

# 권한 부여
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:dev-db-access@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# 키 다운로드
gcloud iam service-accounts keys create ./gcp-dev-db-key.json \
  --iam-account=dev-db-access@$PROJECT_ID.iam.gserviceaccount.com
```

### 3. Cloud SQL Proxy 설치

**Mac:**

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

### 4. 환경 변수 설정

```bash
# Connection Name 가져오기
gcloud sql instances describe dcs-dev-db --format="value(connectionName)"
# 출력: your-project-id:asia-northeast3:dcs-dev-db

# .env 파일 생성
cp .env.gcp.example .env

# .env 편집
# DATABASE_URL="postgresql://dcs_dev_user:YOUR_PASSWORD@localhost:5432/dcs_dev"
# GOOGLE_CLOUD_PROJECT="your-project-id"
```

### 5. start-db-proxy.sh 설정

```bash
# 파일 편집
# INSTANCE_CONNECTION_NAME을 실제 값으로 변경
nano start-db-proxy.sh
```

### 6. 의존성 설치 및 마이그레이션

```bash
# 패키지 설치
npm install

# Proxy 시작
npm run db:proxy

# 새 터미널에서 마이그레이션
npm run db:migrate

# 성공하면 Proxy 종료
# Ctrl+C
```

## ✅ 일상 개발 워크플로우

### 매일 아침

```bash
# 터미널 1: DB Proxy
npm run db:proxy

# 터미널 2: 개발 서버
npm run dev
```

브라우저: http://localhost:3000

### 작업 종료

```bash
# Proxy 종료
npm run db:proxy:stop

# 또는 터미널에서 Ctrl+C
```

## 🔧 자주 사용하는 명령어

```bash
# DB GUI 열기
npm run db:studio

# 백업 생성
npm run db:backup

# 마이그레이션 (스키마 변경 시)
npm run db:migrate:create   # 파일만 생성
npm run db:migrate:dev      # 적용

# 프로젝트 빌드
npm run build

# Lint
npm run lint
```

## 📚 주요 문서

- **DEV_DATABASE_GUIDE.md** - 데이터베이스 사용 가이드
- **DATABASE_MIGRATION_SAFE.md** - 안전한 마이그레이션
- **GCP_DATABASE_SETUP.md** - GCP 초기 설정
- **GCP_DEPLOYMENT.md** - 프로덕션 배포

## 🆘 문제 해결

### Proxy 연결 실패

```bash
# 서비스 계정 키 확인
ls -la gcp-dev-db-key.json

# Proxy 재시작
npm run db:proxy:stop
npm run db:proxy
```

### DB 연결 실패

```bash
# .env 확인
cat .env | grep DATABASE_URL

# Proxy 실행 확인
pgrep -f cloud-sql-proxy
```

### 마이그레이션 에러

```bash
# 상태 확인
npx prisma migrate status

# 최신 백업 복원
npm run db:restore backups/db/LATEST.sql
```

## 🎯 체크리스트

초기 설정:

- [ ] GCP Cloud SQL 인스턴스 생성됨
- [ ] 서비스 계정 키 다운로드됨
- [ ] Cloud SQL Proxy 설치됨
- [ ] .env 파일 설정됨
- [ ] start-db-proxy.sh 편집됨
- [ ] 의존성 설치됨
- [ ] 마이그레이션 완료됨

매일:

- [ ] Proxy 실행 중
- [ ] 개발 서버 실행 중
- [ ] http://localhost:3000 접속 가능

## 🎉 준비 완료!

이제 안전하게 개발할 수 있습니다:

- ✅ 데이터는 GCP에 안전하게 보관
- ✅ 자동 백업으로 손실 방지
- ✅ 실수 방지 안전장치 작동

Happy Coding! 🚀
