# LLD (Low-Level Design) - Dynamic Crawling Service (DCS)

**버전**: 2.0  
**최종 수정일**: 2025-01-21  
**작성자**: Engineering Team  
**상태**: Draft

---

## 📋 목차

1. [시스템 아키텍처](#시스템-아키텍처)
2. [데이터베이스 설계](#데이터베이스-설계)
3. [API 명세](#api-명세)
4. [컴포넌트 설계](#컴포넌트-설계)
5. [크롤링 엔진 설계](#크롤링-엔진-설계)
6. [스케줄링 시스템](#스케줄링-시스템)
7. [보안 설계](#보안-설계)
8. [성능 최적화](#성능-최적화)
9. [에러 처리](#에러-처리)
10. [배포 아키텍처](#배포-아키텍처)

---

## 시스템 아키텍처

### 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                         사용자 (웹 브라우저)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application                           │
│  ┌──────────────────────┐        ┌──────────────────────┐       │
│  │   Frontend (React)   │        │  Backend API Routes  │       │
│  │  - Dashboard UI      │◄──────►│  - Project CRUD      │       │
│  │  - Chatbot UI        │        │  - Chatbot API       │       │
│  │  - shadcn/ui         │        │  - Data API          │       │
│  │  - Tailwind CSS      │        │  - Auth Middleware   │       │
│  └──────────────────────┘        └──────────┬───────────┘       │
│                                              │                   │
└──────────────────────────────────────────────┼───────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
         ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
         │  Clerk Auth      │      │   PostgreSQL     │      │  Gemini AI API   │
         │  (사용자 인증)    │      │  (프로젝트 설정,  │      │  (CSS Selector   │
         │                  │      │   수집 데이터)    │      │   추천)          │
         └──────────────────┘      └──────────────────┘      └──────────────────┘
                                               │
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
         ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
         │ Cloud Scheduler  │      │  Cloud Pub/Sub   │      │   Cloud Run      │
         │ (스케줄 트리거)   │─────►│   (작업 큐)      │─────►│ (크롤링 엔진)    │
         │                  │      │                  │      │  - Playwright    │
         └──────────────────┘      └──────────────────┘      └──────────────────┘
```

### 주요 컴포넌트

#### 1. Next.js Application

- **역할**: 프론트엔드 UI 및 백엔드 API 제공
- **기술 스택**: Next.js 16+, React 19, TypeScript
- **배포**: Cloud Run 또는 Vercel

#### 2. PostgreSQL Database

- **역할**: 프로젝트 설정, 사용자 데이터, 수집 데이터 저장
- **기술**: PostgreSQL 15+, Prisma ORM
- **배포**: Cloud SQL (프로덕션), SQLite (로컬)

#### 3. Crawling Engine

- **역할**: 실제 웹 크롤링 수행
- **기술**: Playwright, Node.js
- **배포**: Cloud Run (컨테이너)

#### 4. GCP Services

- **Cloud Scheduler**: Cron 기반 스케줄 트리거
- **Cloud Pub/Sub**: 비동기 작업 큐
- **Cloud Run**: 서버리스 컨테이너 실행

#### 5. External Services

- **Clerk**: 사용자 인증 및 세션 관리
- **Gemini AI**: CSS Selector 자동 추천

---

## 데이터베이스 설계

### ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id (PK)         │
│ clerkId         │◄──────────┐
│ email           │           │
│ name            │           │
│ createdAt       │           │
│ updatedAt       │           │
└─────────────────┘           │
                              │ 1:N
                              │
┌─────────────────┐           │
│    Project      │───────────┘
├─────────────────┤
│ id (PK)         │
│ name            │
│ status          │
│ targetUrls      │ (JSON Array)
│ dataSchema      │ (JSON)
│ schedule        │
│ webhookUrl      │
│ apiKey          │
│ ownerId (FK)    │
│ createdAt       │
│ updatedAt       │
│ lastRunAt       │
│ nextRunAt       │
└─────────────────┘
        │
        │ 1:N
        │
        ▼
┌─────────────────┐
│      Run        │
├─────────────────┤
│ id (PK)         │
│ projectId (FK)  │
│ status          │
│ totalTasks      │
│ successCount    │
│ failureCount    │
│ startedAt       │
│ completedAt     │
└─────────────────┘
        │
        │ 1:N
        │
        ▼
┌─────────────────┐
│      Task       │
├─────────────────┤
│ id (PK)         │
│ runId (FK)      │
│ targetUrl       │
│ status          │
│ retryCount      │
│ error           │
│ createdAt       │
│ completedAt     │
└─────────────────┘
        │
        │ 1:N
        │
        ▼
┌─────────────────┐
│      Data       │
├─────────────────┤
│ id (PK)         │
│ taskId (FK)     │
│ projectId (FK)  │
│ runId (FK)      │
│ jsonData        │ (JSONB)
│ scrapedAt       │
└─────────────────┘
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 사용자 모델
model User {
  id        String    @id @default(cuid())
  clerkId   String    @unique // Clerk 사용자 ID
  email     String    @unique
  name      String?
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([clerkId])
  @@index([email])
}

// 프로젝트 모델
model Project {
  id          String    @id @default(cuid())
  name        String
  status      ProjectStatus @default(DRAFT)
  targetUrls  Json      // Array of URLs to crawl
  dataSchema  Json      // { fieldName: { selector: string, type: string } }
  schedule    String?   // Cron expression
  webhookUrl  String?   // Google Chat webhook URL
  apiKey      String    @unique @default(cuid())

  owner       User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  ownerId     String

  runs        Run[]
  data        Data[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  lastRunAt   DateTime?
  nextRunAt   DateTime?

  @@index([ownerId])
  @@index([status])
  @@index([apiKey])
}

enum ProjectStatus {
  DRAFT      // 생성 중
  ACTIVE     // 활성화 (스케줄링 중)
  PAUSED     // 일시정지
  ERROR      // 에러 상태
}

// 크롤링 실행 모델
model Run {
  id            String    @id @default(cuid())
  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId     String

  status        RunStatus @default(PENDING)
  totalTasks    Int       @default(0)
  successCount  Int       @default(0)
  failureCount  Int       @default(0)

  tasks         Task[]
  data          Data[]

  startedAt     DateTime  @default(now())
  completedAt   DateTime?

  @@index([projectId])
  @@index([status])
  @@index([startedAt])
}

enum RunStatus {
  PENDING    // 대기 중
  RUNNING    // 실행 중
  COMPLETED  // 완료
  FAILED     // 실패
}

// 개별 크롤링 작업 모델
model Task {
  id          String     @id @default(cuid())
  run         Run        @relation(fields: [runId], references: [id], onDelete: Cascade)
  runId       String

  targetUrl   String
  status      TaskStatus @default(PENDING)
  retryCount  Int        @default(0)
  error       String?

  data        Data[]

  createdAt   DateTime   @default(now())
  completedAt DateTime?

  @@index([runId])
  @@index([status])
}

enum TaskStatus {
  PENDING    // 대기 중
  RUNNING    // 실행 중
  SUCCESS    // 성공
  FAILED     // 실패
}

// 수집된 데이터 모델
model Data {
  id         String   @id @default(cuid())

  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId     String

  run        Run      @relation(fields: [runId], references: [id], onDelete: Cascade)
  runId      String

  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId  String

  jsonData   Json     // 동적 스키마 데이터 (JSONB)
  scrapedAt  DateTime @default(now())

  @@index([projectId])
  @@index([runId])
  @@index([taskId])
  @@index([scrapedAt])
}
```

### 인덱스 전략

| 테이블  | 인덱스 컬럼                  | 목적                        |
| ------- | ---------------------------- | --------------------------- |
| User    | clerkId, email               | 사용자 조회 성능            |
| Project | ownerId, status, apiKey      | 프로젝트 필터링 및 API 인증 |
| Run     | projectId, status, startedAt | 실행 이력 조회              |
| Task    | runId, status                | 작업 상태 조회              |
| Data    | projectId, runId, scrapedAt  | 데이터 조회 및 정렬         |

---

## API 명세

### API 버전 및 Base URL

- **버전**: v1
- **Base URL**: `/api/v1`
- **인증**: Clerk Session Token (Cookie 기반)

### 1. 프로젝트 관리 API

#### POST /api/v1/projects

프로젝트 생성 (챗봇 완료 시 호출)

**Request**

```json
{
  "name": "전국 지자체 복지기관",
  "targetUrls": ["https://example.com/page1", "https://example.com/page2"],
  "dataSchema": {
    "기관명": { "selector": "h1.title", "type": "string" },
    "주소": { "selector": "p.address", "type": "string" }
  },
  "schedule": "0 3 1 * *",
  "webhookUrl": "https://chat.googleapis.com/v1/spaces/..."
}
```

**Response** (201 Created)

```json
{
  "id": "clxxx",
  "name": "전국 지자체 복지기관",
  "status": "DRAFT",
  "apiKey": "dcs_xxx",
  "createdAt": "2025-01-21T10:00:00Z"
}
```

#### GET /api/v1/projects

사용자의 모든 프로젝트 조회

**Query Parameters**

- `status` (optional): DRAFT | ACTIVE | PAUSED | ERROR
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 20)

**Response** (200 OK)

```json
{
  "projects": [
    {
      "id": "clxxx",
      "name": "전국 지자체 복지기관",
      "status": "ACTIVE",
      "lastRunAt": "2025-01-21T03:00:00Z",
      "nextRunAt": "2025-02-01T03:00:00Z",
      "successRate": 95.5
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

#### GET /api/v1/projects/:projectId

특정 프로젝트 상세 조회

**Response** (200 OK)

```json
{
  "id": "clxxx",
  "name": "전국 지자체 복지기관",
  "status": "ACTIVE",
  "targetUrls": ["..."],
  "dataSchema": { ... },
  "schedule": "0 3 1 * *",
  "webhookUrl": "...",
  "lastRunAt": "2025-01-21T03:00:00Z",
  "nextRunAt": "2025-02-01T03:00:00Z",
  "stats": {
    "totalRuns": 12,
    "successCount": 2800,
    "failureCount": 120
  }
}
```

#### PUT /api/v1/projects/:projectId

프로젝트 설정 수정

**Request**

```json
{
  "name": "새 프로젝트명",
  "schedule": "0 9 * * *",
  "status": "PAUSED"
}
```

**Response** (200 OK)

```json
{
  "id": "clxxx",
  "name": "새 프로젝트명",
  "status": "PAUSED",
  "updatedAt": "2025-01-21T10:30:00Z"
}
```

#### DELETE /api/v1/projects/:projectId

프로젝트 삭제 (수집 데이터 포함)

**Response** (204 No Content)

---

### 2. 챗봇 API

#### POST /api/v1/chatbot/suggest-selector

AI CSS Selector 추천

**Request**

```json
{
  "url": "https://example.com",
  "fieldName": "기관명"
}
```

**Response** (200 OK)

```json
{
  "selector": "h1.organization-name",
  "sampleData": "서울시 A복지관",
  "confidence": 0.95
}
```

**Error Response** (500 Internal Server Error)

```json
{
  "error": "AI_SELECTOR_NOT_FOUND",
  "message": "해당 필드를 자동으로 찾지 못했습니다."
}
```

#### POST /api/v1/projects/:projectId/sample-crawl

샘플 크롤링 실행

**Request**

```json
{
  "maxSamples": 5
}
```

**Response** (200 OK)

```json
{
  "samples": [
    {
      "기관명": "서울시 A복지관",
      "주소": "서울시 강남구 ..."
    },
    {
      "기관명": "서울시 B복지관",
      "주소": "서울시 서초구 ..."
    }
  ],
  "count": 2
}
```

---

### 3. 데이터 접근 API

#### GET /api/v1/data/:projectId

프로젝트 데이터 조회 (API 키 인증)

**Headers**

```
X-API-Key: dcs_xxx
```

**Query Parameters**

- `limit` (optional): 최대 반환 건수 (default: 100, max: 1000)
- `offset` (optional): 오프셋 (default: 0)
- `startDate` (optional): 시작 날짜 (ISO 8601)
- `endDate` (optional): 종료 날짜 (ISO 8601)

**Response** (200 OK)

```json
{
  "status": "success",
  "projectId": "clxxx",
  "projectName": "전국 지자체 복지기관",
  "lastUpdated": "2025-01-21T03:00:00Z",
  "total": 2560,
  "data": [
    {
      "기관명": "서울시 A복지관",
      "주소": "서울시 강남구 ...",
      "scrapedAt": "2025-01-21T03:05:00Z"
    }
  ]
}
```

**Error Response** (401 Unauthorized)

```json
{
  "error": "INVALID_API_KEY",
  "message": "유효하지 않은 API 키입니다."
}
```

---

### 4. 실행 이력 API

#### GET /api/v1/projects/:projectId/runs

프로젝트의 실행 이력 조회

**Response** (200 OK)

```json
{
  "runs": [
    {
      "id": "run_xxx",
      "status": "COMPLETED",
      "totalTasks": 256,
      "successCount": 245,
      "failureCount": 11,
      "startedAt": "2025-01-21T03:00:00Z",
      "completedAt": "2025-01-21T03:25:00Z"
    }
  ]
}
```

#### GET /api/v1/runs/:runId/tasks

특정 실행의 작업 목록 조회

**Response** (200 OK)

```json
{
  "tasks": [
    {
      "id": "task_xxx",
      "targetUrl": "https://example.com/page1",
      "status": "SUCCESS",
      "retryCount": 0,
      "completedAt": "2025-01-21T03:05:00Z"
    },
    {
      "id": "task_yyy",
      "targetUrl": "https://example.com/page2",
      "status": "FAILED",
      "retryCount": 3,
      "error": "네트워크 타임아웃",
      "completedAt": "2025-01-21T03:10:00Z"
    }
  ]
}
```

#### POST /api/v1/tasks/:taskId/retry

실패한 작업 재시도

**Response** (200 OK)

```json
{
  "taskId": "task_yyy",
  "status": "PENDING",
  "message": "작업이 재시도 큐에 등록되었습니다."
}
```

---

## 컴포넌트 설계

### 프론트엔드 폴더 구조

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx
│   │   └── sign-up/
│   │       └── [[...sign-up]]/
│   │           └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # 프로젝트 목록
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx            # 프로젝트 상세
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx        # 프로젝트 수정
│   │   │   └── new/
│   │   │       └── page.tsx            # 챗봇 (새 프로젝트)
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   └── v1/
│   │       ├── projects/
│   │       │   ├── route.ts            # GET, POST /projects
│   │       │   └── [id]/
│   │       │       ├── route.ts        # GET, PUT, DELETE /projects/:id
│   │       │       ├── sample-crawl/
│   │       │       │   └── route.ts
│   │       │       └── runs/
│   │       │           └── route.ts
│   │       ├── chatbot/
│   │       │   └── suggest-selector/
│   │       │       └── route.ts
│   │       ├── data/
│   │       │   └── [projectId]/
│   │       │       └── route.ts
│   │       └── runs/
│   │           └── [id]/
│   │               └── tasks/
│   │                   └── route.ts
│   ├── layout.tsx
│   ├── page.tsx                        # 랜딩 페이지
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectStats.tsx
│   │   └── RunHistory.tsx
│   ├── chatbot/
│   │   ├── ChatbotContainer.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   └── SampleDataPreview.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/
│   ├── db.ts                           # Prisma client
│   ├── auth.ts                         # Clerk helpers
│   ├── crawler.ts                      # Crawler service
│   ├── gemini.ts                       # Gemini AI service
│   ├── pubsub.ts                       # Pub/Sub client
│   ├── scheduler.ts                    # Scheduler helpers
│   └── utils.ts                        # 유틸리티 함수
├── services/
│   ├── projectService.ts
│   ├── chatbotService.ts
│   └── dataService.ts
├── types/
│   ├── project.ts
│   ├── run.ts
│   └── api.ts
└── middleware.ts                       # Clerk 인증 미들웨어
```

### 주요 React 컴포넌트

#### 1. ChatbotContainer.tsx

챗봇 대화 인터페이스

```typescript
interface ChatbotContainerProps {
  onProjectCreated: (projectId: string) => void
}

export function ChatbotContainer({ onProjectCreated }: ChatbotContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentStep, setCurrentStep] = useState<ChatbotStep>('PROJECT_NAME')

  // 챗봇 로직
  // ...
}
```

#### 2. ProjectList.tsx

프로젝트 목록 표시

```typescript
export function ProjectList() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/v1/projects').then((res) => res.json()),
  })

  // 렌더링 로직
  // ...
}
```

#### 3. ProjectStats.tsx

프로젝트 통계 시각화

```typescript
interface ProjectStatsProps {
  projectId: string
}

export function ProjectStats({ projectId }: ProjectStatsProps) {
  // 통계 데이터 조회 및 차트 렌더링
  // ...
}
```

---

## 크롤링 엔진 설계

### 크롤링 워커 구조

```
crawling-worker/
├── src/
│   ├── index.ts                # 메인 엔트리포인트
│   ├── crawler.ts              # Playwright 크롤러
│   ├── pubsub.ts               # Pub/Sub 구독자
│   ├── storage.ts              # 데이터 저장 로직
│   └── types.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Crawler 구현 (Playwright)

```typescript
// crawling-worker/src/crawler.ts

import { chromium, Browser, Page } from 'playwright'

export interface CrawlTask {
  taskId: string
  runId: string
  projectId: string
  targetUrl: string
  dataSchema: Record<string, { selector: string; type: string }>
}

export interface CrawlResult {
  taskId: string
  status: 'SUCCESS' | 'FAILED'
  data?: Record<string, any>
  error?: string
}

export class Crawler {
  private browser: Browser | null = null

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  async crawl(task: CrawlTask): Promise<CrawlResult> {
    if (!this.browser) {
      await this.initialize()
    }

    const page = await this.browser!.newPage()

    try {
      // 페이지 로드
      await page.goto(task.targetUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })

      // 데이터 추출
      const data: Record<string, any> = {}

      for (const [fieldName, config] of Object.entries(task.dataSchema)) {
        const element = await page.$(config.selector)
        if (element) {
          const text = await element.textContent()
          data[fieldName] = text?.trim() || null
        } else {
          data[fieldName] = null
        }
      }

      await page.close()

      return {
        taskId: task.taskId,
        status: 'SUCCESS',
        data,
      }
    } catch (error) {
      await page.close()

      return {
        taskId: task.taskId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }
}
```

### Pub/Sub 구독자

```typescript
// crawling-worker/src/pubsub.ts

import { PubSub } from '@google-cloud/pubsub'
import { Crawler } from './crawler'
import { saveResult } from './storage'

const pubsub = new PubSub()
const crawler = new Crawler()

export async function startSubscriber() {
  const subscription = pubsub.subscription('crawling-tasks-sub')

  subscription.on('message', async (message) => {
    const task = JSON.parse(message.data.toString())

    console.log(`Processing task: ${task.taskId}`)

    const result = await crawler.crawl(task)
    await saveResult(result)

    message.ack()
  })

  console.log('Crawler worker started')
}
```

---

## 스케줄링 시스템

### Cloud Scheduler 설정

```yaml
# scheduler-config.yaml

- name: check-scheduled-projects
  schedule: '* * * * *' # 매분 실행
  timeZone: 'Asia/Seoul'
  httpTarget:
    uri: 'https://your-app.run.app/api/v1/scheduler/trigger'
    httpMethod: POST
    headers:
      Content-Type: 'application/json'
    oidcToken:
      serviceAccountEmail: 'scheduler@project.iam.gserviceaccount.com'
```

### 스케줄 트리거 API

```typescript
// src/app/api/v1/scheduler/trigger/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { publishCrawlTasks } from '@/lib/pubsub'

export async function POST(request: NextRequest) {
  const now = new Date()

  // 실행할 프로젝트 조회
  const projects = await prisma.project.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ nextRunAt: { lte: now } }, { nextRunAt: null }],
    },
  })

  for (const project of projects) {
    // Run 생성
    const run = await prisma.run.create({
      data: {
        projectId: project.id,
        status: 'PENDING',
        totalTasks: project.targetUrls.length,
      },
    })

    // Task 생성 및 Pub/Sub 발행
    for (const url of project.targetUrls) {
      const task = await prisma.task.create({
        data: {
          runId: run.id,
          targetUrl: url,
          status: 'PENDING',
        },
      })

      await publishCrawlTask({
        taskId: task.id,
        runId: run.id,
        projectId: project.id,
        targetUrl: url,
        dataSchema: project.dataSchema,
      })
    }

    // nextRunAt 업데이트
    const nextRun = calculateNextRun(project.schedule)
    await prisma.project.update({
      where: { id: project.id },
      data: { nextRunAt: nextRun },
    })
  }

  return NextResponse.json({ success: true })
}
```

---

## 보안 설계

### 인증 및 권한

1. **사용자 인증**: Clerk
   - Session 기반 인증
   - JWT 토큰 검증

2. **API 키 인증**: 데이터 API
   - SHA-256 해싱 저장
   - 요청 시 해시 비교

3. **권한 검증**
   - 프로젝트 소유권 확인
   - Middleware에서 자동 검증

### 데이터 암호화

```typescript
// lib/encryption.ts

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

---

## 성능 최적화

### 데이터베이스 최적화

1. **인덱스 활용**
   - 자주 조회되는 컬럼에 인덱스 설정
   - 복합 인덱스 활용

2. **커넥션 풀**

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

3. **쿼리 최적화**
   - N+1 문제 방지 (include 사용)
   - 필요한 필드만 select

### 캐싱 전략

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = await redis.get(key)

  if (cached) {
    return cached as T
  }

  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))

  return data
}
```

---

## 에러 처리

### 에러 타입 정의

```typescript
// types/errors.ts

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource}을(를) 찾을 수 없습니다.`, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '인증이 필요합니다.') {
    super('UNAUTHORIZED', message, 401)
  }
}
```

### 에러 핸들러

```typescript
// lib/errorHandler.ts

import { NextResponse } from 'next/server'
import { AppError } from '@/types/errors'

export function handleError(error: unknown) {
  console.error(error)

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
      },
      { status: error.statusCode }
    )
  }

  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
      message: '서버 오류가 발생했습니다.',
    },
    { status: 500 }
  )
}
```

---

## 배포 아키텍처

### Cloud Run 배포

```dockerfile
# Dockerfile

FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

### 환경 변수

```bash
# .env.production

# Database
DATABASE_URL="postgresql://user:password@host:5432/db"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_xxx"
CLERK_SECRET_KEY="sk_xxx"

# Gemini AI
GEMINI_API_KEY="xxx"

# GCP
GCP_PROJECT_ID="xxx"
PUBSUB_TOPIC="crawling-tasks"

# Encryption
ENCRYPTION_KEY="xxx"

# Redis (optional)
REDIS_URL="xxx"
REDIS_TOKEN="xxx"
```

---

## 관련 문서

- [PRD](file:///Users/gangseungsig/Documents/02_GitHub/09_Dynamic%20Crawling%20Service/prd.md)
- [상세 기능 명세](file:///Users/gangseungsig/Documents/02_GitHub/09_Dynamic%20Crawling%20Service/specs/001-ai-chatbot-crawling-system/spec.md)
- [개발 계획](file:///Users/gangseungsig/Documents/02_GitHub/09_Dynamic%20Crawling%20Service/plan.md)

---

**문서 승인**

- [ ] Engineering Lead
- [ ] Backend Developer
- [ ] Frontend Developer
- [ ] DevOps Engineer
