# 개발 환경 설정 가이드 (Quickstart)

**작성일**: 2025-01-18
**목적**: DCS 로컬 개발 환경 구축 및 실행 방법

---

## 1. 사전 요구사항

### 필수 소프트웨어

| 도구             | 버전                          | 설치 확인          |
| ---------------- | ----------------------------- | ------------------ |
| Node.js          | 20.x LTS                      | `node -v`          |
| npm              | 10.x                          | `npm -v`           |
| Git              | 최신                          | `git --version`    |
| Docker           | 최신 (PostgreSQL 로컬 실행용) | `docker --version` |
| Google Cloud SDK | 최신 (GCP 배포용)             | `gcloud --version` |

### 계정 및 API 키

1. **OpenAI API 키**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Google Cloud 프로젝트**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Firestore 활성화
   - Cloud Run API 활성화
   - Cloud Pub/Sub API 활성화
   - Cloud Scheduler API 활성화
3. **Vercel 계정** (배포용, 선택사항): [https://vercel.com/signup](https://vercel.com/signup)

---

## 2. 레포지토리 클론 및 의존성 설치

### 2.1 클론

```bash
git clone https://github.com/your-org/dynamic-crawling-service.git
cd dynamic-crawling-service
```

### 2.2 의존성 설치

```bash
# Next.js 프로젝트 의존성
npm install

# Crawling Worker 의존성 (별도 디렉토리)
cd crawling-worker
npm install
cd ..
```

---

## 3. 환경 변수 설정

### 3.1 `.env.local` 파일 생성 (Next.js 앱)

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```bash
# PostgreSQL (로컬 Docker)
DATABASE_URL="postgresql://postgres:password@localhost:5432/dcs_dev"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-key-here" # openssl rand -base64 32로 생성

# OpenAI API
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"

# Google Cloud (Firestore, Pub/Sub)
GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="./gcp-service-account-key.json"

# Cloud Pub/Sub
PUBSUB_TOPIC="crawling-tasks"

# Webhook 암호화
WEBHOOK_ENCRYPTION_KEY="your-aes-256-key" # openssl rand -base64 32로 생성

# 환경
NODE_ENV="development"
```

### 3.2 GCP 서비스 계정 키 생성

1. [GCP Console](https://console.cloud.google.com/) → IAM 및 관리자 → 서비스 계정
2. 새 서비스 계정 생성 (이름: `dcs-dev`)
3. 역할 추가:
   - Firestore 사용자
   - Pub/Sub 게시자
   - Pub/Sub 구독자
4. 키 추가 → JSON 다운로드
5. 프로젝트 루트에 `gcp-service-account-key.json`으로 저장

### 3.3 `.env.example` 확인

프로젝트에는 `.env.example` 파일이 포함되어 있습니다. 이를 참고하여 `.env.local`을 작성하세요.

---

## 4. PostgreSQL 로컬 실행 (Docker Compose)

### 4.1 `docker-compose.yml` 파일 (프로젝트 루트)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: dcs-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: dcs_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 4.2 PostgreSQL 시작

```bash
docker-compose up -d
```

### 4.3 데이터베이스 연결 확인

```bash
docker exec -it dcs-postgres psql -U postgres -d dcs_dev -c "SELECT version();"
```

---

## 5. Prisma 마이그레이션 및 Seed

### 5.1 Prisma 스키마 생성

```bash
npx prisma migrate dev --name init
```

이 명령어는:

- `prisma/schema.prisma`를 기반으로 마이그레이션 파일 생성
- PostgreSQL에 테이블 생성
- Prisma Client 자동 생성

### 5.2 Seed 데이터 생성 (선택사항)

개발용 테스트 데이터를 생성하려면:

```bash
npx prisma db seed
```

**Seed 스크립트** (`prisma/seed.ts`):

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // 테스트 사용자 생성
  const passwordHash = await bcrypt.hash('test1234', 12)

  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash,
      name: '테스트 사용자',
    },
  })

  console.log('✅ 테스트 사용자 생성:', user.email)

  // 테스트 프로젝트 생성
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: '샘플 크롤링 프로젝트',
      description: '개발 테스트용 프로젝트',
      urls: JSON.stringify(['https://example.com']),
      selectors: JSON.stringify({
        제목: 'h1',
        설명: 'p.description',
      }),
      scheduleType: 'manual',
      status: 'active',
    },
  })

  console.log('✅ 테스트 프로젝트 생성:', project.name)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**`package.json`에 추가**:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## 6. Firestore 에뮬레이터 실행 (선택사항)

로컬에서 Firestore를 에뮬레이터로 실행하려면:

### 6.1 Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 6.2 Firestore 에뮬레이터 초기화

```bash
firebase init emulators
```

- Firestore 선택
- 기본 포트: 8080

### 6.3 에뮬레이터 실행

```bash
firebase emulators:start --only firestore
```

### 6.4 `.env.local` 업데이트

```bash
# Firestore 에뮬레이터 사용 시
FIRESTORE_EMULATOR_HOST="localhost:8080"
```

**참고**: 프로덕션에서는 실제 Firestore를 사용하므로 이 변수를 제거하세요.

---

## 7. Next.js 개발 서버 실행

### 7.1 서버 시작

```bash
npm run dev
```

### 7.2 브라우저 접속

```
http://localhost:3000
```

### 7.3 확인 사항

- 랜딩 페이지가 정상적으로 로드되는지 확인
- `/login` 페이지 접속 가능 여부 확인
- 회원가입 및 로그인 테스트

---

## 8. Cloud Pub/Sub 로컬 에뮬레이터 (선택사항)

### 8.1 Pub/Sub 에뮬레이터 실행

```bash
gcloud beta emulators pubsub start --project=your-gcp-project-id
```

### 8.2 환경 변수 설정

터미널에 표시된 `PUBSUB_EMULATOR_HOST` 값을 `.env.local`에 추가:

```bash
PUBSUB_EMULATOR_HOST="localhost:8085"
```

### 8.3 토픽 생성

```bash
# 토픽 생성
gcloud pubsub topics create crawling-tasks --project=your-gcp-project-id

# 구독 생성
gcloud pubsub subscriptions create crawling-tasks-sub --topic=crawling-tasks --project=your-gcp-project-id
```

---

## 9. Crawling Worker 로컬 테스트

### 9.1 Worker 디렉토리로 이동

```bash
cd crawling-worker
```

### 9.2 `.env` 파일 생성

```bash
# Firestore
GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="../gcp-service-account-key.json"

# Pub/Sub
PUBSUB_SUBSCRIPTION="crawling-tasks-sub"

# API 엔드포인트 (상태 업데이트용)
API_BASE_URL="http://localhost:3000"
```

### 9.3 Worker 실행

```bash
npm start
```

**출력 예시**:

```
🚀 Crawling Worker 시작됨
📥 Pub/Sub 메시지 대기 중...
```

### 9.4 테스트 메시지 발행

별도 터미널에서 테스트 메시지를 발행합니다:

```bash
gcloud pubsub topics publish crawling-tasks \
  --message='{"projectId":"clx1a2b3c","runId":"clx5d6e7f","taskId":"clx8g9h0i","url":"https://example.com","selectors":{"제목":"h1"}}'
```

Worker 로그에서 크롤링 진행 상황을 확인합니다.

---

## 10. 테스트 실행

### 10.1 단위 테스트 (Jest)

```bash
npm test
```

### 10.2 통합 테스트

```bash
npm run test:integration
```

### 10.3 E2E 테스트 (Playwright)

```bash
# Playwright 브라우저 설치 (최초 1회)
npx playwright install

# E2E 테스트 실행
npm run test:e2e
```

### 10.4 테스트 커버리지

```bash
npm run test:coverage
```

**목표**: 단위 테스트 커버리지 > 80%

---

## 11. 개발 워크플로우

### 11.1 브랜치 전략

```bash
# Feature 브랜치 생성
git checkout -b feature/001-chatbot-ui

# 작업 후 커밋
git add .
git commit -m "feat: AI 챗봇 UI 컴포넌트 추가"

# main 브랜치에 병합 (PR 후)
git checkout main
git merge feature/001-chatbot-ui
```

### 11.2 코드 포맷팅

```bash
# Prettier 실행
npm run format

# ESLint 검사
npm run lint

# ESLint 자동 수정
npm run lint:fix
```

### 11.3 타입 체크

```bash
# TypeScript 타입 체크
npm run type-check
```

---

## 12. 디버깅 도구

### 12.1 Prisma Studio (데이터베이스 GUI)

```bash
npx prisma studio
```

브라우저에서 `http://localhost:5555` 접속하여 데이터베이스를 시각적으로 확인할 수 있습니다.

### 12.2 React DevTools

브라우저 확장 프로그램 설치:

- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools)

### 12.3 Next.js 디버거 (VS Code)

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

---

## 13. 배포 준비

### 13.1 Vercel 배포 (Next.js)

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 연결
vercel

# 프로덕션 배포
vercel --prod
```

### 13.2 Cloud Run 배포 (Crawling Worker)

```bash
cd crawling-worker

# Docker 이미지 빌드
docker build -t gcr.io/your-gcp-project-id/crawling-worker .

# GCP에 이미지 푸시
docker push gcr.io/your-gcp-project-id/crawling-worker

# Cloud Run 배포
gcloud run deploy crawling-worker \
  --image gcr.io/your-gcp-project-id/crawling-worker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 14. 트러블슈팅

### 문제 1: Prisma 마이그레이션 실패

**증상**:

```
Error: P1001: Can't reach database server at localhost:5432
```

**해결**:

- PostgreSQL Docker 컨테이너가 실행 중인지 확인: `docker ps`
- 포트 5432가 다른 프로세스에 의해 사용되고 있지 않은지 확인: `lsof -i :5432`

### 문제 2: OpenAI API 호출 실패

**증상**:

```
Error: Invalid API key
```

**해결**:

- `.env.local`에 `OPENAI_API_KEY`가 올바르게 설정되었는지 확인
- API 키가 유효한지 [OpenAI 대시보드](https://platform.openai.com/usage)에서 확인

### 문제 3: Firestore 권한 에러

**증상**:

```
Error: Missing or insufficient permissions
```

**해결**:

- GCP 서비스 계정에 "Firestore 사용자" 역할이 부여되었는지 확인
- `GOOGLE_APPLICATION_CREDENTIALS` 경로가 올바른지 확인

### 문제 4: Pub/Sub 메시지 수신 안 됨

**증상**:
Worker가 실행 중이지만 메시지를 수신하지 못함

**해결**:

- 토픽과 구독이 생성되었는지 확인:
  ```bash
  gcloud pubsub topics list
  gcloud pubsub subscriptions list
  ```
- 구독이 올바른 토픽에 연결되었는지 확인

---

## 15. 다음 단계

개발 환경 설정이 완료되었습니다. 이제 다음 단계를 진행하세요:

1. **명세서 읽기**: `specs/001-ai-chatbot-crawling-system/spec.md`
2. **API 계약 확인**: `specs/001-ai-chatbot-crawling-system/contracts/`
3. **작업 목록 확인**: `specs/001-ai-chatbot-crawling-system/tasks.md` (Phase 2에서 생성)
4. **첫 번째 작업 시작**: 챗봇 UI 컴포넌트 구현

---

## 16. 유용한 명령어 요약

| 작업            | 명령어                   |
| --------------- | ------------------------ |
| 개발 서버 실행  | `npm run dev`            |
| DB 마이그레이션 | `npx prisma migrate dev` |
| DB GUI 열기     | `npx prisma studio`      |
| 테스트 실행     | `npm test`               |
| 포맷팅          | `npm run format`         |
| Lint 검사       | `npm run lint`           |
| 타입 체크       | `npm run type-check`     |
| Docker 시작     | `docker-compose up -d`   |
| Docker 중지     | `docker-compose down`    |

---

## 17. 추가 리소스

- **Next.js 공식 문서**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Prisma 가이드**: [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **Playwright 문서**: [https://playwright.dev/](https://playwright.dev/)
- **Google Cloud 문서**: [https://cloud.google.com/docs](https://cloud.google.com/docs)
- **OpenAI API 참조**: [https://platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)

---

**헌법 준수 확인**: ✅ 개발 환경 설정은 모든 기술 스택과 호환되며, 헌법 원칙을 지원합니다.
