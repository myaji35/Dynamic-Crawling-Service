# 개발 데이터베이스 사용 가이드

GCP Cloud SQL을 사용한 안전한 개발 환경 설정입니다.

## 🎯 목표

- ✅ 개발 중 데이터 손실 방지
- ✅ GCP Cloud SQL을 개발 데이터베이스로 사용
- ✅ 스키마 변경 시에만 마이그레이션
- ✅ 자동 백업으로 안전성 확보

## 🚀 빠른 시작

### 1. Cloud SQL Proxy 시작

```bash
npm run db:proxy
```

새 터미널을 열고:

### 2. 개발 서버 실행

```bash
npm run dev
```

끝입니다! 이제 http://localhost:3000 에 접속하세요.

## 📋 일상적인 작업

### 개발 시작하기

```bash
# 터미널 1: DB Proxy
npm run db:proxy

# 터미널 2: 개발 서버
npm run dev
```

### DB GUI 열기

```bash
npm run db:studio
```

브라우저에서 http://localhost:5555 에서 데이터 확인/편집

### 작업 종료

```bash
# Proxy 종료
npm run db:proxy:stop

# 또는 Ctrl+C (터미널 1)
```

## 🔧 데이터베이스 스키마 변경

### ⚠️ 중요: 스키마 변경 전 항상 백업!

```bash
# 1. 백업
npm run db:backup

# 2. Prisma 스키마 수정
# prisma/schema.prisma 파일 편집

# 3. 마이그레이션 파일 생성 (DB 변경 안 함)
npm run db:migrate:create
# 이름 입력: add_user_avatar

# 4. 생성된 SQL 검토
# prisma/migrations/20250118xxx_add_user_avatar/migration.sql

# 5. 마이그레이션 적용
npm run db:migrate:dev
```

### 안전한 마이그레이션 체크리스트

- [ ] 백업 완료 (`npm run db:backup`)
- [ ] 마이그레이션 SQL 검토
- [ ] 데이터 손실 가능성 확인
- [ ] 팀원들에게 공지
- [ ] 마이그레이션 적용
- [ ] 테스트 실행

## 💾 백업 & 복원

### 백업 생성

```bash
npm run db:backup
```

백업 파일 위치: `backups/db/dcs_dev_backup_YYYYMMDD_HHMMSS.sql`

### 백업 복원

```bash
# 사용 가능한 백업 확인
ls -lh backups/db/

# 복원 (주의!)
npm run db:restore backups/db/dcs_dev_backup_20250118_143000.sql
```

**경고:** 복원은 현재 데이터를 완전히 교체합니다!

## 🚫 금지된 명령어

### 절대 사용하지 마세요!

```bash
# ❌ 데이터 손실 위험
npm run db:push     # 차단됨
npm run db:reset    # 차단됨
prisma db push      # 대신 migrate:dev 사용
prisma migrate reset  # 모든 데이터 삭제!
```

### 대신 사용하세요

```bash
# ✅ 안전한 방법
npm run db:migrate:create   # 마이그레이션 파일만 생성
npm run db:migrate:dev      # 검토 후 적용
npm run db:backup           # 백업
```

## 📊 사용 가능한 명령어

| 명령어                      | 설명                   | 안전성         |
| --------------------------- | ---------------------- | -------------- |
| `npm run db:proxy`          | Cloud SQL 연결 시작    | ✅ 안전        |
| `npm run db:proxy:stop`     | Proxy 종료             | ✅ 안전        |
| `npm run db:studio`         | DB GUI 열기            | ✅ 안전        |
| `npm run db:migrate:create` | 마이그레이션 파일 생성 | ✅ 안전        |
| `npm run db:migrate:dev`    | 마이그레이션 적용      | ⚠️ 스키마 변경 |
| `npm run db:migrate`        | 프로덕션 마이그레이션  | ⚠️ 스키마 변경 |
| `npm run db:backup`         | 백업 생성              | ✅ 안전        |
| `npm run db:restore`        | 백업 복원              | 🚨 데이터 교체 |
| `npm run db:push`           | **차단됨**             | ❌ 금지        |
| `npm run db:reset`          | **차단됨**             | ❌ 금지        |

## 🔍 문제 해결

### Proxy 연결 실패

**증상:** `Error: Failed to start Cloud SQL Proxy`

**해결:**

```bash
# 1. 서비스 계정 키 확인
ls -la gcp-dev-db-key.json

# 2. Cloud SQL Proxy 설치 확인
which cloud-sql-proxy

# 3. 인스턴스 이름 확인
# start-db-proxy.sh 파일에서 INSTANCE_CONNECTION_NAME 확인
```

### 데이터베이스 연결 실패

**증상:** `Error: Can't reach database server`

**해결:**

```bash
# 1. Proxy가 실행 중인지 확인
pgrep -f cloud-sql-proxy

# 2. Proxy 재시작
npm run db:proxy:stop
npm run db:proxy

# 3. .env 파일 확인
cat .env | grep DATABASE_URL
```

### 마이그레이션 충돌

**증상:** `Migration xxx is already applied`

**해결:**

```bash
# 1. 마이그레이션 상태 확인
npx prisma migrate status

# 2. 강제 적용 (주의!)
npx prisma migrate resolve --applied "MIGRATION_NAME"

# 3. 백업에서 복원 (최후 수단)
npm run db:restore backups/db/BACKUP_FILE.sql
```

## 🎓 시나리오별 가이드

### 새로운 필드 추가

```bash
# 1. 백업
npm run db:backup

# 2. schema.prisma 수정
# model User {
#   ...
#   avatar String?  // 새 필드
# }

# 3. 마이그레이션 생성
npm run db:migrate:create
# 이름: add_user_avatar

# 4. SQL 확인
cat prisma/migrations/*_add_user_avatar/migration.sql

# 5. 적용
npm run db:migrate:dev
```

### 테이블 이름 변경

```bash
# 1. 백업 (중요!)
npm run db:backup

# 2. schema.prisma 수정
# @@map("new_table_name")

# 3. 마이그레이션 생성
npm run db:migrate:create

# 4. SQL 검토 - 데이터 보존 확인!
# ALTER TABLE old_name RENAME TO new_name;

# 5. 적용
npm run db:migrate:dev
```

### 데이터 타입 변경

```bash
# 1. 백업 (필수!)
npm run db:backup

# 2. 데이터 호환성 확인
# String -> Int: 기존 데이터가 숫자인가?

# 3. schema.prisma 수정

# 4. 마이그레이션 생성
npm run db:migrate:create

# 5. 생성된 SQL 확인 및 수정
# 필요시 데이터 변환 SQL 추가:
# UPDATE users SET age = CAST(age_string AS INTEGER);

# 6. 적용
npm run db:migrate:dev
```

## 📚 참고 문서

- [GCP_DATABASE_SETUP.md](./GCP_DATABASE_SETUP.md) - 초기 설정 가이드
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/mysql/sql-proxy)

## 🆘 긴급 상황

### 실수로 데이터를 삭제했어요!

```bash
# 1. 즉시 작업 중단
# 2. 가장 최근 백업 확인
ls -lt backups/db/ | head -5

# 3. 복원
npm run db:restore backups/db/LATEST_BACKUP.sql

# 4. 데이터 확인
npm run db:studio
```

### 마이그레이션이 실패했어요!

```bash
# 1. 에러 메시지 확인
npx prisma migrate status

# 2. 백업에서 복원
npm run db:restore backups/db/BACKUP_BEFORE_MIGRATION.sql

# 3. 마이그레이션 SQL 수정 후 재시도
```

## ✅ 베스트 프랙티스

1. **매일 백업**: 작업 시작 시 백업 생성
2. **마이그레이션 전 백업**: 스키마 변경 전 필수
3. **SQL 검토**: 자동 생성된 SQL 항상 확인
4. **점진적 변경**: 큰 변경은 여러 마이그레이션으로 분할
5. **팀 공유**: 마이그레이션 전 팀원 공지
6. **테스트**: 마이그레이션 후 기능 테스트

## 🎉 이제 안전하게 개발하세요!

- 데이터는 GCP Cloud SQL에 안전하게 보관됩니다
- 실수로 삭제할 수 없는 안전장치가 있습니다
- 백업으로 언제든 복원 가능합니다

Happy Coding! 🚀
