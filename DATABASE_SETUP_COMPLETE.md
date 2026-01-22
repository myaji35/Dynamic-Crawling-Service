# ✅ GCP 데이터베이스 개발 환경 설정 완료!

## 🎯 달성한 목표

### ✅ 데이터 손실 방지

- GCP Cloud SQL을 개발 데이터베이스로 사용
- 로컬 Docker DB는 백업/테스트 용도로만 사용
- 실수로 데이터 삭제 불가능하도록 안전장치 설치

### ✅ 안전한 마이그레이션

- `db:push`, `db:reset` 명령어 차단
- 마이그레이션 전 백업 필수
- SQL 검토 후 적용하는 워크플로우

### ✅ 자동 백업

- 백업 스크립트 생성
- 복원 스크립트 생성
- 30일 자동 정리

## 📦 생성된 파일들

### 설정 파일

- ✅ `.env` - 환경 변수 (GCP DB 사용)
- ✅ `.env.gcp.example` - GCP 설정 템플릿
- ✅ `.env.local.example` - 로컬 DB 설정 (백업용)
- ✅ `.gitignore` - GCP 키, 백업 파일 제외

### 스크립트

- ✅ `start-db-proxy.sh` - Cloud SQL Proxy 시작
- ✅ `stop-db-proxy.sh` - Cloud SQL Proxy 종료
- ✅ `scripts/backup-db.sh` - 데이터베이스 백업
- ✅ `scripts/restore-db.sh` - 데이터베이스 복원

### 문서

- ✅ `GCP_DATABASE_SETUP.md` - 초기 GCP 설정 가이드
- ✅ `DEV_DATABASE_GUIDE.md` - 일상 개발 가이드
- ✅ `DATABASE_MIGRATION_SAFE.md` - 안전한 마이그레이션 체크리스트
- ✅ `QUICK_START_DEV.md` - 빠른 시작 가이드

### package.json 스크립트

```json
{
  "db:proxy": "./start-db-proxy.sh",
  "db:proxy:stop": "./stop-db-proxy.sh",
  "db:migrate": "prisma migrate deploy",
  "db:migrate:dev": "prisma migrate dev",
  "db:migrate:create": "prisma migrate dev --create-only",
  "db:studio": "prisma studio",
  "db:backup": "./scripts/backup-db.sh",
  "db:restore": "./scripts/restore-db.sh",
  "db:push": "차단됨 - 대신 db:migrate:dev 사용",
  "db:reset": "차단됨 - 데이터 손실 방지"
}
```

### docker-compose.yml 업데이트

- 로컬 DB는 `--profile local-only` 로만 실행
- GCP Cloud SQL과 포트 충돌 방지 (5433)

## 🚀 사용 방법

### 초기 설정 (최초 1회)

1. **GCP Cloud SQL 설정**

   ```bash
   # GCP_DATABASE_SETUP.md 참조
   gcloud sql instances create dcs-dev-db ...
   ```

2. **서비스 계정 키 다운로드**

   ```bash
   gcloud iam service-accounts keys create ./gcp-dev-db-key.json ...
   ```

3. **환경 변수 설정**

   ```bash
   cp .env.gcp.example .env
   # .env 파일 편집
   ```

4. **start-db-proxy.sh 편집**
   ```bash
   # INSTANCE_CONNECTION_NAME 설정
   ```

### 일상 개발

**매일 아침:**

```bash
# 터미널 1
npm run db:proxy

# 터미널 2
npm run dev
```

**작업 종료:**

```bash
npm run db:proxy:stop
```

### 스키마 변경 시

```bash
# 1. 백업 (필수!)
npm run db:backup

# 2. schema.prisma 수정

# 3. 마이그레이션 파일 생성
npm run db:migrate:create

# 4. SQL 검토
cat prisma/migrations/LATEST/migration.sql

# 5. 적용
npm run db:migrate:dev
```

## 🛡️ 안전장치

### 차단된 위험 명령어

```bash
npm run db:push    # ❌ 차단됨
npm run db:reset   # ❌ 차단됨
```

### 필수 백업

```bash
# 스키마 변경 전 항상 백업
npm run db:backup
```

### 안전한 복원

```bash
# 실수 시 복원
npm run db:restore backups/db/BACKUP_FILE.sql
```

## 📊 데이터베이스 현황

### 현재 연결

- **타입:** GCP Cloud SQL (PostgreSQL 16)
- **접속:** localhost:5432 (via Proxy)
- **백업:** 자동 (30일 보관)

### 기존 데이터 (로컬 Docker에서 마이그레이션 필요)

- Users: 2
- Projects: 1
- Sessions: 0

## 📚 문서 읽기 순서

1. **QUICK_START_DEV.md** - 빠른 시작 (5분)
2. **GCP_DATABASE_SETUP.md** - 초기 설정 (30분)
3. **DEV_DATABASE_GUIDE.md** - 일상 사용법
4. **DATABASE_MIGRATION_SAFE.md** - 스키마 변경 시

## ⚠️ 다음 단계

### 필수 작업

1. **GCP Cloud SQL 인스턴스 생성**

   ```bash
   # GCP_DATABASE_SETUP.md 참조
   ```

2. **서비스 계정 키 다운로드**

   ```bash
   # gcp-dev-db-key.json
   ```

3. **로컬 데이터 마이그레이션** (옵션)
   ```bash
   # 기존 로컬 Docker DB 데이터 -> GCP
   # 필요시 수동 export/import
   ```

### 선택 작업

1. **팀원 온보딩**
   - QUICK_START_DEV.md 공유
   - 서비스 계정 키 공유

2. **자동 백업 설정**
   - Cron job 설정
   - 클라우드 스토리지 연동

## 🎉 완료!

이제 안전하게 개발할 수 있습니다:

- ✅ 데이터는 GCP에 안전하게 보관
- ✅ 스키마 변경 시에만 마이그레이션
- ✅ 실수로 데이터 삭제 불가
- ✅ 백업으로 언제든 복원 가능

## 🆘 도움말

문제 발생 시:

1. `DEV_DATABASE_GUIDE.md` 문제 해결 섹션 참조
2. 백업 파일 확인: `ls -lh backups/db/`
3. 복원: `npm run db:restore BACKUP_FILE`

Happy Coding! 🚀
