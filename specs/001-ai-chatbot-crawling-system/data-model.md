# 데이터 모델: DCS 전체 시스템

**작성일**: 2025-01-18
**목적**: PostgreSQL 및 Firestore 스키마 설계, 관계 정의, 인덱싱 전략

---

## 1. 개요

DCS는 **이중 데이터베이스 전략**을 사용합니다:

- **PostgreSQL**: 사용자, 프로젝트 메타데이터, API 키 등 관계형 데이터
- **Firestore**: 프로젝트별 동적 스키마 크롤링 데이터 (스키마리스)

### 설계 원칙

1. **데이터 격리**: 각 프로젝트의 크롤링 데이터는 완전히 독립적
2. **타입 안전성**: Prisma를 통한 컴파일 타임 타입 체크
3. **성능**: 적절한 인덱스 및 관계 최적화
4. **확장성**: 사용자당 수천 개 프로젝트, 프로젝트당 수십만 데이터 포인트 지원

---

## 2. PostgreSQL 스키마 (Prisma)

### 2.1 User (사용자)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String    // bcrypt hashed
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  projects      Project[]
  apiKeys       ApiKey[]
  sessions      Session[] // NextAuth sessions

  @@map("users")
}
```

**인덱스**:

- `email` (unique) - 로그인 조회
- `createdAt` - 사용자 등록 통계

**설계 결정**:

- `cuid()` 사용: 예측 불가능한 ID로 보안 강화
- `passwordHash`: bcrypt (salt rounds: 12)
- `name` nullable: 초기 회원가입 시 선택사항

---

### 2.2 Project (프로젝트)

```prisma
model Project {
  id                String    @id @default(cuid())
  userId            String
  name              String    // 사용자 정의 프로젝트명
  description       String?

  // 크롤링 설정 (JSON 저장)
  urls              Json      // string[] - 크롤링 대상 URL 목록
  selectors         Json      // Record<string, string> - 필드명 → CSS Selector
  scheduleType      String    // "manual" | "hourly" | "daily" | "weekly" | "monthly"
  scheduleCron      String?   // Cron 표현식 (자동 실행 시)

  // 알림 설정
  notifyGoogleChat  String?   // Google Chat 웹훅 URL (nullable)

  // 메타데이터
  status            String    @default("active") // "active" | "paused" | "archived"
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastRunAt         DateTime? // 마지막 실행 시각

  // Relations
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  crawlingRuns      CrawlingRun[]

  @@map("projects")
  @@index([userId])
  @@index([status])
  @@index([lastRunAt])
}
```

**인덱스**:

- `userId` - 사용자별 프로젝트 목록 조회
- `status` - active/paused 프로젝트 필터링
- `lastRunAt` - 스케줄링 우선순위 판단

**JSON 필드 구조**:

```typescript
// urls 예시
["https://example.com/page1", "https://example.com/page2"]

// selectors 예시
{
  "기관명": "h1.title",
  "주소": ".address",
  "전화번호": ".contact-phone"
}
```

**설계 결정**:

- JSON 타입 사용: 프로젝트마다 다른 필드 구조 지원
- `onDelete: Cascade`: 사용자 삭제 시 프로젝트도 자동 삭제
- `scheduleCron` nullable: 수동 실행 프로젝트는 null

---

### 2.3 CrawlingRun (크롤링 실행)

```prisma
model CrawlingRun {
  id              String    @id @default(cuid())
  projectId       String

  // 실행 메타데이터
  status          String    @default("pending") // "pending" | "running" | "completed" | "failed"
  startedAt       DateTime  @default(now())
  completedAt     DateTime?

  // 통계
  totalTasks      Int       // 총 URL 개수
  successTasks    Int       @default(0)
  failedTasks     Int       @default(0)

  // 에러 로그 (실패 시)
  errorMessage    String?   @db.Text

  // Relations
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks           CrawlingTask[]

  @@map("crawling_runs")
  @@index([projectId])
  @@index([status])
  @@index([startedAt])
}
```

**인덱스**:

- `projectId` - 프로젝트별 실행 이력 조회
- `status` - 진행 중 작업 모니터링
- `startedAt` - 시간순 정렬

**설계 결정**:

- `totalTasks`: Pub/Sub 메시지 발행 시 계산 (urls.length)
- `successTasks`, `failedTasks`: Cloud Run 워커가 Firestore 저장 후 증가
- `completedAt` nullable: 진행 중일 때 null

---

### 2.4 CrawlingTask (개별 작업)

```prisma
model CrawlingTask {
  id              String    @id @default(cuid())
  runId           String
  url             String    // 크롤링 대상 URL

  // 작업 상태
  status          String    @default("pending") // "pending" | "success" | "failed"
  startedAt       DateTime?
  completedAt     DateTime?

  // 에러 정보
  errorMessage    String?   @db.Text
  retryCount      Int       @default(0)

  // Firestore 참조 (데이터 저장 위치)
  firestoreDocId  String?   // Firestore 문서 ID

  // Relations
  run             CrawlingRun @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@map("crawling_tasks")
  @@index([runId])
  @@index([status])
  @@index([url])
}
```

**인덱스**:

- `runId` - 실행별 작업 목록 조회
- `status` - 실패 작업 재시도 필터링
- `url` - URL별 이력 조회 (디버깅)

**설계 결정**:

- `firestoreDocId`: Firestore에 저장된 데이터 문서 ID (크로스 참조)
- `retryCount`: 최대 3회까지 재시도 허용
- PostgreSQL에는 메타데이터만, 실제 크롤링 데이터는 Firestore

---

### 2.5 ApiKey (API 키)

```prisma
model ApiKey {
  id              String    @id @default(cuid())
  userId          String
  name            String    // 사용자 정의 키 이름 (예: "Production", "Test")

  // 키 정보
  keyHash         String    @unique // SHA-256 해시
  keyPrefix       String    // 처음 8자 (표시용, 예: "dcs_1234...")

  // 권한 및 상태
  permissions     Json      // string[] - ["read", "write"] 등
  status          String    @default("active") // "active" | "revoked"

  // 사용 통계
  lastUsedAt      DateTime?
  requestCount    Int       @default(0)

  // 메타데이터
  createdAt       DateTime  @default(now())
  expiresAt       DateTime? // null이면 만료 없음

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("api_keys")
  @@index([userId])
  @@index([keyHash])
  @@index([status])
}
```

**인덱스**:

- `userId` - 사용자별 키 목록
- `keyHash` (unique) - 인증 시 조회
- `status` - active 키만 필터링

**JSON 필드 구조**:

```typescript
// permissions 예시
;['read:projects', 'read:data', 'write:projects']
```

**설계 결정**:

- 실제 API 키는 DB에 저장하지 않고 해시만 저장 (보안)
- `keyPrefix`: 사용자가 어떤 키인지 식별 (전체 키 노출 없이)
- `requestCount`: Rate limiting 및 분석용

---

### 2.6 Session (NextAuth 세션)

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

**설계 결정**:

- NextAuth.js v5 Prisma Adapter 표준 스키마
- `expires`: 7일 (헌법 요구사항)

---

## 3. Firestore 컬렉션 구조

### 3.1 프로젝트별 데이터 격리

```
projects/{projectId}/runs/{runTimestamp}/data/{dataId}
```

**경로 설명**:

- `projectId`: PostgreSQL Project.id와 동일 (외래 키 역할)
- `runTimestamp`: CrawlingRun.startedAt의 Unix timestamp (밀리초)
- `dataId`: 자동 생성 문서 ID

**예시**:

```
projects/clx1a2b3c/runs/1705564800000/data/doc1
projects/clx1a2b3c/runs/1705564800000/data/doc2
projects/clx1a2b3c/runs/1705651200000/data/doc1
```

---

### 3.2 문서 구조 (동적 스키마)

**Example 1: 지자체 프로젝트**

```json
{
  "기관명": "서울특별시청",
  "주소": "서울특별시 중구 세종대로 110",
  "전화번호": "02-120",
  "웹사이트": "https://www.seoul.go.kr",

  // 메타데이터 (모든 프로젝트 공통)
  "_metadata": {
    "projectId": "clx1a2b3c",
    "runId": "clx5d6e7f",
    "taskId": "clx8g9h0i",
    "url": "https://example.com/seoul",
    "crawledAt": "2025-01-18T03:00:00Z",
    "crawlDuration": 1234 // 밀리초
  }
}
```

**Example 2: 부동산 프로젝트**

```json
{
  "매물번호": "20250118-001",
  "가격": "5억 8천만원",
  "면적": "84㎡",
  "위치": "서울 강남구 대치동",

  "_metadata": {
    "projectId": "clxaabbcc",
    "runId": "clxddeeff",
    "taskId": "clxgghhii",
    "url": "https://realestate.example.com/item/001",
    "crawledAt": "2025-01-18T10:00:00Z",
    "crawlDuration": 2345
  }
}
```

**공통 필드 규칙**:

- `_metadata`: 모든 문서에 필수 포함 (시스템 관리용)
- 사용자 정의 필드: 프로젝트 설정(Project.selectors)에 따라 동적 생성
- 모든 값은 문자열로 저장 (타입 변환은 클라이언트에서)

---

### 3.3 Firestore 인덱스

**복합 인덱스**:

1. **프로젝트별 최신 데이터 조회**:

   ```
   Collection: projects/{projectId}/runs/{runTimestamp}/data
   Fields: _metadata.crawledAt (Descending)
   ```

2. **실행별 데이터 조회**:
   ```
   Collection: projects/{projectId}/runs/{runTimestamp}/data
   Fields: _metadata.runId (Ascending), _metadata.crawledAt (Descending)
   ```

**단일 필드 인덱스**:

- `_metadata.projectId`
- `_metadata.runId`
- `_metadata.taskId`

**설계 결정**:

- 프로젝트별 서브컬렉션으로 자동 격리
- runTimestamp를 경로에 포함하여 실행별 데이터 분리
- 인덱스 최소화 (Firestore 비용 절감)

---

## 4. 데이터 흐름

### 4.1 프로젝트 생성 플로우

```
1. User → Next.js API → PostgreSQL
   - User, Project 레코드 생성
   - selectors, urls JSON 저장

2. Firestore
   - projects/{projectId} 컬렉션 자동 생성 (첫 크롤링 시)
```

### 4.2 크롤링 실행 플로우

```
1. Cloud Scheduler → Next.js API
   - Project 설정 조회 (PostgreSQL)
   - CrawlingRun 레코드 생성 (status: "pending")

2. Next.js API → Cloud Pub/Sub
   - urls 배열 순회하며 메시지 발행 (256개)
   - 각 메시지: { projectId, runId, taskId, url, selectors }

3. Cloud Run (Playwright) → PostgreSQL
   - CrawlingTask 상태 업데이트 (pending → success/failed)

4. Cloud Run → Firestore
   - projects/{projectId}/runs/{timestamp}/data/{docId} 저장
   - 동적 필드 + _metadata 포함

5. Cloud Run → Next.js API
   - CrawlingRun 통계 업데이트 (successTasks, failedTasks)
   - status를 "completed"로 변경
```

### 4.3 데이터 조회 플로우 (API)

```
1. Client → Next.js API (GET /api/data?projectId=xxx&limit=100)
   - API 키 검증 (ApiKey 테이블)
   - 권한 확인 (permissions 필드)

2. Next.js API → Firestore
   - projects/{projectId}/runs/{timestamp}/data 쿼리
   - 최신순 정렬 (_metadata.crawledAt)
   - 페이지네이션 (limit, offset)

3. Response → Client
   - JSON 배열 반환
   - _metadata 포함 또는 제외 (쿼리 파라미터 기반)
```

---

## 5. 관계 다이어그램

```
User (1) ──────── (N) Project
  │                      │
  │                      │
  │                      └── (N) CrawlingRun
  │                              │
  │                              └── (N) CrawlingTask
  │                                      │
  │                                      └── (0..1) Firestore Document
  │
  └── (N) ApiKey
  └── (N) Session
```

**외래 키 제약사항**:

- `Project.userId` → `User.id` (CASCADE)
- `CrawlingRun.projectId` → `Project.id` (CASCADE)
- `CrawlingTask.runId` → `CrawlingRun.id` (CASCADE)
- `ApiKey.userId` → `User.id` (CASCADE)
- `Session.userId` → `User.id` (CASCADE)

---

## 6. 성능 최적화 전략

### 6.1 PostgreSQL

**쿼리 최적화**:

- 대시보드 프로젝트 목록: `WHERE userId = ? AND status = 'active' ORDER BY lastRunAt DESC`
- 인덱스 활용: `(userId, status, lastRunAt)` 복합 인덱스 고려

**연결 풀링**:

- Prisma Client 싱글톤 패턴 (`src/lib/db/prisma.ts`)
- Vercel Serverless 환경: 연결 재사용

### 6.2 Firestore

**쿼리 최적화**:

- 실행별 데이터: `projects/{projectId}/runs/{timestamp}/data` 직접 경로 접근
- 페이지네이션: `startAfter()` 커서 기반 (offset 대신)

**캐싱**:

- 최신 100개 데이터는 클라이언트 캐시 (5분 TTL)
- Vercel Edge Cache 활용 (ISR)

---

## 7. 보안 고려사항

### 7.1 Row-Level Security (RLS)

**Prisma Middleware** 적용:

```typescript
prisma.$use(async (params, next) => {
  // 모든 쿼리에 userId 필터 자동 추가
  if (params.model === 'Project') {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        userId: currentUser.id,
      }
    }
  }
  return next(params)
})
```

### 7.2 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId}/runs/{runId}/data/{dataId} {
      allow read: if request.auth != null &&
                     isProjectOwner(projectId, request.auth.uid);
      allow write: if false; // 오직 Cloud Run 서비스 계정만 쓰기 가능
    }
  }

  function isProjectOwner(projectId, userId) {
    // PostgreSQL에서 검증된 세션만 허용 (NextAuth JWT)
    return request.auth.token.projectIds.hasAny([projectId]);
  }
}
```

### 7.3 API 키 보안

- 생성 시: `crypto.randomBytes(32).toString('hex')` → `dcs_` 접두사 추가
- 저장: SHA-256 해시만 DB에 저장
- 전송: HTTPS 필수, 헤더(`Authorization: Bearer dcs_xxxxx`)

---

## 8. 데이터 마이그레이션 전략

### 8.1 Prisma 마이그레이션

```bash
# 개발 환경
npx prisma migrate dev --name init

# 프로덕션
npx prisma migrate deploy
```

### 8.2 Firestore 마이그레이션

- 스키마리스이므로 마이그레이션 불필요
- 프로젝트별 격리로 영향 범위 최소화
- 필드명 변경 시: 새 프로젝트부터 적용, 기존 데이터는 보존

---

## 9. 백업 및 복구

### 9.1 PostgreSQL

- **Vercel Postgres**: 자동 일일 백업 (7일 보존)
- **수동 백업**: `pg_dump` 주간 실행 (Cloud Storage 저장)

### 9.2 Firestore

- **Firestore Export**: Cloud Scheduler로 매일 자동 내보내기
- **보존 기간**: 30일
- **복구 절차**: `gcloud firestore import` 명령어

---

## 10. 헌법 준수 체크

| 원칙                       | 준수 여부 | 설명                                         |
| -------------------------- | --------- | -------------------------------------------- |
| II. 프로젝트별 동적 스키마 | ✅        | Firestore 스키마리스 + 프로젝트별 서브컬렉션 |
| IV. 확장성과 안정성        | ✅        | 프로젝트별 격리, 인덱스 최적화, CASCADE 정책 |
| V. 관찰 가능성             | ✅        | CrawlingRun/Task 상태 추적, 메타데이터 포함  |

**최종 검증**: ✅ 모든 헌법 원칙 충족

---

## 요약

| 레이어        | 기술                 | 주요 엔티티                                      |
| ------------- | -------------------- | ------------------------------------------------ |
| 메타데이터    | PostgreSQL + Prisma  | User, Project, CrawlingRun, CrawlingTask, ApiKey |
| 크롤링 데이터 | Firestore            | projects/{projectId}/runs/{timestamp}/data       |
| 보안          | RLS + Security Rules | userId 기반 격리, API 키 해싱                    |
| 성능          | 인덱스 + 캐싱        | 복합 인덱스, Edge Cache, 커서 페이지네이션       |

**다음 단계**: Phase 1 - API 계약 명세 작성 (`contracts/` 디렉토리)
