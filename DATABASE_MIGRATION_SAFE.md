# 안전한 데이터베이스 마이그레이션 체크리스트

## 🎯 목표: 데이터 손실 없이 스키마 변경하기

## ✅ 마이그레이션 전 체크리스트

### 1. 백업 생성 (필수!)

```bash
npm run db:backup
```

- [ ] 백업 파일 생성 확인
- [ ] 백업 파일 크기 확인 (너무 작으면 문제)
- [ ] 백업 파일 경로 기록: `backups/db/dcs_dev_backup_YYYYMMDD_HHMMSS.sql`

### 2. 현재 상태 확인

```bash
# 마이그레이션 상태
npx prisma migrate status

# 현재 데이터 건수
npm run db:studio
```

- [ ] 모든 마이그레이션이 적용되어 있음
- [ ] 데이터 건수 확인 (users: X, projects: Y 등)

### 3. 스키마 변경 계획 수립

**변경 내용:**

- 무엇을 변경할 것인가?
- 왜 변경해야 하는가?
- 기존 데이터에 어떤 영향을 미치는가?

**위험도 평가:**

- [ ] 낮음: 새 필드 추가 (nullable 또는 default 있음)
- [ ] 중간: 필드 타입 변경, 테이블 이름 변경
- [ ] 높음: 필드 삭제, NOT NULL 추가, 관계 변경

### 4. 팀 공유 (협업 시)

- [ ] 팀원들에게 마이그레이션 계획 공유
- [ ] 동시 작업 중인 사람 확인
- [ ] 작업 시간 공지

## 📝 마이그레이션 실행 단계

### Step 1: 마이그레이션 파일 생성

```bash
npm run db:migrate:create
# 이름 입력: 명확하고 설명적인 이름 (예: add_user_avatar_field)
```

- [ ] 마이그레이션 파일 생성됨
- [ ] 파일 경로 확인: `prisma/migrations/TIMESTAMP_NAME/migration.sql`

### Step 2: SQL 검토 (중요!)

```bash
# 생성된 SQL 확인
cat prisma/migrations/*_your_migration_name/migration.sql
```

**확인 사항:**

- [ ] SQL 문법이 올바른가?
- [ ] 데이터 손실이 없는가?
- [ ] ALTER TABLE 문이 안전한가?
- [ ] 인덱스 영향은 없는가?

**위험한 SQL 패턴:**

```sql
-- ❌ 주의: 데이터 손실 위험
DROP COLUMN ...
DROP TABLE ...
ALTER COLUMN ... DROP NOT NULL
TRUNCATE ...

-- ⚠️ 검토 필요
ALTER COLUMN ... TYPE ...  -- 타입 변환 실패 가능
ALTER COLUMN ... SET NOT NULL  -- 기존 NULL 값 처리 필요
```

**안전한 SQL 패턴:**

```sql
-- ✅ 안전
ADD COLUMN ... NULL
ADD COLUMN ... DEFAULT ...
CREATE INDEX ...
ALTER TABLE ... RENAME TO ...
```

### Step 3: 수동 SQL 수정 (필요시)

데이터 보존이 필요한 경우 SQL 수정:

```sql
-- 예: 필드 타입 변경 시 데이터 변환
-- Prisma가 생성한 SQL:
-- ALTER TABLE "users" ALTER COLUMN "age" TYPE INTEGER;

-- 수정된 안전한 SQL:
-- 1. 새 컬럼 추가
ALTER TABLE "users" ADD COLUMN "age_new" INTEGER;

-- 2. 데이터 변환
UPDATE "users" SET "age_new" = CAST("age" AS INTEGER) WHERE "age" ~ '^[0-9]+$';

-- 3. 기존 컬럼 삭제
ALTER TABLE "users" DROP COLUMN "age";

-- 4. 컬럼 이름 변경
ALTER TABLE "users" RENAME COLUMN "age_new" TO "age";
```

### Step 4: 마이그레이션 적용

```bash
npm run db:migrate:dev
```

- [ ] 에러 없이 완료됨
- [ ] 성공 메시지 확인

### Step 5: 검증

```bash
# DB GUI로 확인
npm run db:studio
```

**확인 사항:**

- [ ] 스키마가 예상대로 변경되었는가?
- [ ] 기존 데이터가 보존되었는가?
- [ ] 데이터 건수가 동일한가?
- [ ] 인덱스가 올바르게 생성되었는가?

### Step 6: 애플리케이션 테스트

```bash
# 개발 서버 재시작
npm run dev
```

- [ ] 앱이 정상 실행되는가?
- [ ] 주요 기능 테스트 (CRUD)
- [ ] 에러 로그 확인

## 🚨 문제 발생 시 복구 절차

### 마이그레이션 실패

```bash
# 1. 에러 메시지 확인
npx prisma migrate status

# 2. 실패한 마이그레이션 상태 확인
# "Failed" 또는 "Partially applied" 상태 확인

# 3. 백업에서 복원
npm run db:restore backups/db/BACKUP_FILE.sql

# 4. 마이그레이션 SQL 수정 후 재시도
```

### 데이터 손실 발견

```bash
# 즉시 백업에서 복원
npm run db:restore backups/db/LATEST_BACKUP.sql

# 데이터 확인
npm run db:studio
```

## 📊 일반적인 변경 시나리오

### 시나리오 1: Nullable 필드 추가

**위험도:** 낮음 ✅

```prisma
model User {
  id     String @id
  name   String
  avatar String?  // 새 필드 (nullable)
}
```

```bash
npm run db:backup
npm run db:migrate:create
# 생성된 SQL 확인:
# ALTER TABLE "users" ADD COLUMN "avatar" TEXT;
npm run db:migrate:dev
```

### 시나리오 2: Default 있는 필드 추가

**위험도:** 낮음 ✅

```prisma
model User {
  id        String   @id
  name      String
  createdAt DateTime @default(now())  // 새 필드 (default)
}
```

```bash
npm run db:backup
npm run db:migrate:create
npm run db:migrate:dev
```

### 시나리오 3: 필드 타입 변경

**위험도:** 중간 ⚠️

```prisma
model User {
  id   String @id
  age  Int     // String -> Int 변경
}
```

```bash
npm run db:backup
npm run db:migrate:create

# SQL 수동 검토 및 수정!
# 데이터 변환 로직 추가 필요

npm run db:migrate:dev
```

### 시나리오 4: NOT NULL 제약 추가

**위험도:** 높음 🚨

```prisma
model User {
  id    String @id
  email String  // String? -> String (NOT NULL)
}
```

**절차:**

1. 기존 NULL 값 확인

```sql
SELECT COUNT(*) FROM users WHERE email IS NULL;
```

2. NULL 값 처리

```sql
UPDATE users SET email = 'default@example.com' WHERE email IS NULL;
```

3. 마이그레이션 적용

```bash
npm run db:migrate:dev
```

### 시나리오 5: 필드 삭제

**위험도:** 높음 🚨

```prisma
model User {
  id   String @id
  name String
  // oldField String  // 삭제됨
}
```

**주의:** 데이터 영구 삭제!

1. 정말 필요한가 재확인
2. 백업 필수
3. 삭제 전 데이터 추출 고려

```sql
-- 데이터 백업
CREATE TABLE users_old_field_backup AS
SELECT id, old_field FROM users;
```

4. 마이그레이션 적용

## 🎓 베스트 프랙티스

### DO ✅

1. **항상 백업 먼저**

   ```bash
   npm run db:backup
   ```

2. **마이그레이션 분리**
   - 큰 변경은 여러 작은 마이그레이션으로 분할
   - 각 마이그레이션은 하나의 목적만

3. **SQL 검토**
   - 자동 생성된 SQL을 항상 검토
   - 데이터 영향 분석

4. **점진적 변경**

   ```
   Step 1: 새 필드 추가 (nullable)
   Step 2: 데이터 마이그레이션
   Step 3: NOT NULL 제약 추가
   ```

5. **테스트 우선**
   - 로컬 DB에서 먼저 테스트
   - 성공 후 GCP 적용

### DON'T ❌

1. **절대 사용 금지**

   ```bash
   prisma db push        # 마이그레이션 없이 스키마 동기화
   prisma migrate reset  # 모든 데이터 삭제
   ```

2. **마이그레이션 스킵 금지**
   - 수동 SQL 실행 후 Prisma 무시

3. **프로덕션 직접 변경 금지**
   - 항상 개발 환경에서 먼저 테스트

4. **여러 마이그레이션 한번에 금지**
   - 한 번에 하나씩

## 📚 참고 자료

- [Prisma Migrate 가이드](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [데이터 타입 변환](https://www.postgresql.org/docs/current/functions-formatting.html)

## 🆘 도움이 필요한가요?

1. 백업 파일 확인: `ls -lh backups/db/`
2. 마이그레이션 상태: `npx prisma migrate status`
3. 복원: `npm run db:restore BACKUP_FILE`
4. 팀원에게 문의

---

**기억하세요:**

- 백업은 생명줄입니다 💾
- SQL 검토는 필수입니다 🔍
- 천천히, 신중하게 🐢
