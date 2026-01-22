# Tasks: DCS (동적 크롤링 서비스) 전체 시스템

**Input**: Design documents from `/specs/001-ai-chatbot-crawling-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are omitted from this implementation plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Web application structure (Next.js 14 App Router):

- Next.js app: `src/app/`, `src/components/`, `src/lib/`, `src/services/`
- Crawling worker: `crawling-worker/src/`
- Tests: `tests/`
- Prisma schema: `prisma/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 14 project with TypeScript, App Router, and TailwindCSS
- [ ] T002 [P] Install dependencies: React 18, shadcn/ui, Prisma, NextAuth.js v5
- [ ] T003 [P] Configure ESLint, Prettier, and TypeScript strict mode
- [ ] T004 [P] Setup Git hooks with Husky (pre-commit linting)
- [ ] T005 Create project directory structure per plan.md (src/app, src/components, src/lib, src/services, src/types)
- [ ] T006 [P] Configure environment variables template (.env.example)
- [ ] T007 [P] Setup Docker Compose for local PostgreSQL database

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Setup

- [ ] T008 Create Prisma schema with User, Session, VerificationToken models in prisma/schema.prisma
- [ ] T009 [P] Add Project model with JSON fields (urls, selectors) in prisma/schema.prisma
- [ ] T010 [P] Add CrawlingRun and CrawlingTask models in prisma/schema.prisma
- [ ] T011 [P] Add ApiKey model in prisma/schema.prisma
- [ ] T012 Run Prisma migration: npx prisma migrate dev --name init
- [ ] T013 [P] Create Prisma Client singleton in src/lib/db/prisma.ts

### Authentication Foundation

- [ ] T014 Configure NextAuth.js v5 with Credentials provider in src/app/api/auth/[...nextauth]/route.ts
- [ ] T015 [P] Create authentication middleware in src/middleware.ts
- [ ] T016 [P] Implement password hashing utility (bcrypt) in src/lib/utils/password.ts

### Firebase/GCP Foundation

- [ ] T017 Initialize Firebase Admin SDK in src/lib/firestore/client.ts
- [ ] T018 [P] Create Firestore helper functions (getProjectData, saveProjectData) in src/lib/firestore/helpers.ts
- [ ] T019 [P] Setup Cloud Pub/Sub client in src/lib/pubsub/client.ts
- [ ] T020 [P] Create Pub/Sub message publisher utility in src/lib/pubsub/publisher.ts

### Base UI Components

- [ ] T021 Install shadcn/ui CLI and initialize components
- [ ] T022 [P] Add shadcn/ui Button, Input, Card, Dialog components to src/components/ui/
- [ ] T023 [P] Create base Layout component in src/app/layout.tsx
- [ ] T024 [P] Create AuthProvider component in src/app/AuthProvider.tsx

### OpenAI Integration

- [ ] T025 Create OpenAI client wrapper in src/lib/openai/client.ts
- [ ] T026 [P] Implement CSS Selector recommendation function in src/lib/openai/selector-recommender.ts
- [ ] T027 [P] Implement Cron expression generator from natural language in src/lib/openai/cron-generator.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI 챗봇을 통한 크롤링 프로젝트 생성 (Priority: P1) 🎯 MVP

**Goal**: 비개발자가 AI 챗봇과 대화하여 크롤링 프로젝트를 생성하고 샘플 크롤링으로 검증 후 활성화할 수 있음

**Independent Test**: 사용자가 챗봇과 대화하여 프로젝트를 생성하고, 샘플 크롤링 결과를 확인한 후 프로젝트를 활성화하면, 해당 프로젝트가 데이터베이스에 저장되고 대시보드에 표시되는지 확인

### Backend Services for US1

- [ ] T028 [P] [US1] Create ProjectService with createProject method in src/services/project.service.ts
- [ ] T029 [P] [US1] Create SelectorService with recommendSelectors method in src/services/selector.service.ts
- [ ] T030 [P] [US1] Create CrawlingService with executeSampleCrawl method in src/services/crawling.service.ts
- [ ] T031 [P] [US1] Create ChatbotService with conversation state management in src/services/chatbot.service.ts

### API Routes for US1

- [ ] T032 [P] [US1] Implement POST /api/projects endpoint in src/app/api/projects/route.ts
- [ ] T033 [P] [US1] Implement POST /api/projects/ai/recommend-selectors in src/app/api/projects/ai/recommend-selectors/route.ts
- [ ] T034 [P] [US1] Implement POST /api/projects/ai/generate-cron in src/app/api/projects/ai/generate-cron/route.ts
- [ ] T035 [P] [US1] Implement POST /api/crawling/sample in src/app/api/crawling/sample/route.ts
- [ ] T036 [P] [US1] Implement POST /api/auth/signup in src/app/api/auth/signup/route.ts
- [ ] T037 [P] [US1] Implement POST /api/auth/signin using NextAuth in src/app/api/auth/[...nextauth]/route.ts

### Frontend Components for US1

- [ ] T038 [P] [US1] Create ChatbotDialog component with conversation flow in src/components/chat/ChatbotDialog.tsx
- [ ] T039 [P] [US1] Create MessageBubble component for chat display in src/components/chat/MessageBubble.tsx
- [ ] T040 [P] [US1] Create SampleDataViewer component for crawl results in src/components/chat/SampleDataViewer.tsx
- [ ] T041 [US1] Create project creation workflow handler in src/components/chat/ProjectCreationFlow.tsx
- [ ] T042 [P] [US1] Create LoginForm component in src/components/auth/LoginForm.tsx
- [ ] T043 [P] [US1] Create SignupForm component in src/components/auth/SignupForm.tsx

### Frontend Pages for US1

- [ ] T044 [US1] Create login page in src/app/(auth)/login/page.tsx
- [ ] T045 [US1] Create signup page in src/app/(auth)/signup/page.tsx
- [ ] T046 [US1] Create dashboard home page with "새 프로젝트 생성" button in src/app/(dashboard)/page.tsx
- [ ] T047 [US1] Integrate ChatbotDialog into dashboard layout in src/app/(dashboard)/layout.tsx

### Playwright Crawling Setup for US1

- [ ] T048 [US1] Initialize crawling-worker project with TypeScript and Playwright
- [ ] T049 [P] [US1] Create Playwright crawler module in crawling-worker/src/crawler.ts
- [ ] T050 [P] [US1] Implement CSS selector execution logic in crawling-worker/src/selector.ts
- [ ] T051 [US1] Create sample crawling entry point in crawling-worker/src/sample-crawl.ts

### Integration for US1

- [ ] T052 [US1] Connect ChatbotDialog to backend APIs (recommend-selectors, generate-cron, sample)
- [ ] T053 [US1] Add error handling and loading states to chatbot UI
- [ ] T054 [US1] Implement form validation for project creation (URL format, field names)
- [ ] T055 [US1] Add authentication check to dashboard pages (redirect to login if not authenticated)

**Checkpoint**: User Story 1 완료 - 사용자가 챗봇으로 프로젝트 생성 및 샘플 크롤링 가능

---

## Phase 4: User Story 2 - 프로젝트 모니터링 및 관리 (Priority: P2)

**Goal**: 사용자가 대시보드에서 프로젝트 현황을 실시간 확인하고, 상세 정보/데이터/에러 로그 조회, 재시도/일시정지/재개/삭제/복제 가능

**Independent Test**: 사용자가 대시보드에서 프로젝트 목록을 확인하고, 특정 프로젝트 클릭 시 상세 현황(성공/실패 건수, 최근 데이터, 에러 로그)을 조회하며, 실패 작업을 재시도할 수 있는지 검증

### Backend Services for US2

- [ ] T056 [P] [US2] Add getProjects method to ProjectService in src/services/project.service.ts
- [ ] T057 [P] [US2] Add getProjectById method to ProjectService in src/services/project.service.ts
- [ ] T058 [P] [US2] Add updateProject method to ProjectService (pause/resume/delete) in src/services/project.service.ts
- [ ] T059 [P] [US2] Add cloneProject method to ProjectService in src/services/project.service.ts
- [ ] T060 [P] [US2] Create DataService with getProjectData method in src/services/data.service.ts
- [ ] T061 [P] [US2] Add getCrawlingRuns method to CrawlingService in src/services/crawling.service.ts
- [ ] T062 [P] [US2] Add getCrawlingTasks method to CrawlingService in src/services/crawling.service.ts
- [ ] T063 [P] [US2] Add retryFailedTasks method to CrawlingService in src/services/crawling.service.ts

### API Routes for US2

- [ ] T064 [P] [US2] Implement GET /api/projects endpoint in src/app/api/projects/route.ts
- [ ] T065 [P] [US2] Implement GET /api/projects/[id] endpoint in src/app/api/projects/[id]/route.ts
- [ ] T066 [P] [US2] Implement PATCH /api/projects/[id] endpoint in src/app/api/projects/[id]/route.ts
- [ ] T067 [P] [US2] Implement DELETE /api/projects/[id] endpoint in src/app/api/projects/[id]/route.ts
- [ ] T068 [P] [US2] Implement POST /api/projects/[id]/clone endpoint in src/app/api/projects/[id]/clone/route.ts
- [ ] T069 [P] [US2] Implement GET /api/crawling/runs endpoint in src/app/api/crawling/runs/route.ts
- [ ] T070 [P] [US2] Implement GET /api/crawling/runs/[id] endpoint in src/app/api/crawling/runs/[id]/route.ts
- [ ] T071 [P] [US2] Implement GET /api/crawling/tasks endpoint in src/app/api/crawling/tasks/route.ts
- [ ] T072 [P] [US2] Implement POST /api/crawling/retry endpoint in src/app/api/crawling/retry/route.ts
- [ ] T073 [P] [US2] Implement GET /api/data endpoint in src/app/api/data/route.ts

### Frontend Components for US2

- [ ] T074 [P] [US2] Create ProjectList component with status badges in src/components/dashboard/ProjectList.tsx
- [ ] T075 [P] [US2] Create ProjectCard component for grid/list view in src/components/dashboard/ProjectCard.tsx
- [ ] T076 [P] [US2] Create ProjectDetailHeader component (name, status, actions) in src/components/dashboard/ProjectDetailHeader.tsx
- [ ] T077 [P] [US2] Create CrawlingStatsCard component (success/fail counters) in src/components/dashboard/CrawlingStatsCard.tsx
- [ ] T078 [P] [US2] Create RecentDataTable component with pagination in src/components/dashboard/RecentDataTable.tsx
- [ ] T079 [P] [US2] Create ErrorLogTable component with retry buttons in src/components/dashboard/ErrorLogTable.tsx
- [ ] T080 [P] [US2] Create TaskStatusVisualization component (color-coded grid) in src/components/crawling/TaskStatusVisualization.tsx
- [ ] T081 [P] [US2] Create ProjectActionsMenu component (pause/resume/delete/clone) in src/components/dashboard/ProjectActionsMenu.tsx

### Frontend Pages for US2

- [ ] T082 [US2] Update dashboard home page to display project list in src/app/(dashboard)/page.tsx
- [ ] T083 [US2] Create project detail page in src/app/(dashboard)/projects/[id]/page.tsx
- [ ] T084 [US2] Create tabs for recent data, error logs, and settings in project detail page

### Integration for US2

- [ ] T085 [US2] Connect ProjectList to GET /api/projects endpoint
- [ ] T086 [US2] Connect ProjectDetailHeader to GET /api/projects/[id] endpoint
- [ ] T087 [US2] Connect ProjectActionsMenu to PATCH, DELETE, and clone endpoints
- [ ] T088 [US2] Connect RecentDataTable to GET /api/data endpoint with pagination
- [ ] T089 [US2] Connect ErrorLogTable to GET /api/crawling/tasks endpoint (status=failed)
- [ ] T090 [US2] Implement retry button handler calling POST /api/crawling/retry
- [ ] T091 [US2] Add real-time status updates (polling every 3 seconds when crawling active)
- [ ] T092 [US2] Add confirmation dialogs for destructive actions (delete project)

**Checkpoint**: User Story 2 완료 - 사용자가 프로젝트 모니터링 및 관리 가능

---

## Phase 5: User Story 3 - 예약된 자동 크롤링 실행 (Priority: P3)

**Goal**: 시스템이 스케줄에 따라 자동으로 크롤링을 실행하고 결과를 저장하며, 실패 시 자동 재시도 수행

**Independent Test**: 특정 시간(1분 후)으로 설정된 프로젝트가 해당 시간에 자동 실행되어 데이터가 수집되고, 대시보드에 새로운 실행 기록이 표시되는지 확인

### Backend Services for US3

- [ ] T093 [P] [US3] Create SchedulerService with getScheduledProjects method in src/services/scheduler.service.ts
- [ ] T094 [P] [US3] Add startCrawlingRun method to CrawlingService in src/services/crawling.service.ts
- [ ] T095 [P] [US3] Add publishCrawlingTasks method to Pub/Sub publisher in src/lib/pubsub/publisher.ts

### API Routes for US3

- [ ] T096 [P] [US3] Implement POST /api/crawling/run endpoint (manual trigger) in src/app/api/crawling/run/route.ts
- [ ] T097 [P] [US3] Implement POST /api/internal/scheduler/trigger endpoint (Cloud Scheduler webhook) in src/app/api/internal/scheduler/trigger/route.ts

### Crawling Worker Implementation for US3

- [ ] T098 [P] [US3] Create Pub/Sub subscription handler in crawling-worker/src/index.ts
- [ ] T099 [P] [US3] Implement message parsing and task execution in crawling-worker/src/task-executor.ts
- [ ] T100 [P] [US3] Add Firestore data saving logic in crawling-worker/src/firestore.ts
- [ ] T101 [US3] Implement retry logic with exponential backoff in crawling-worker/src/retry-handler.ts
- [ ] T102 [P] [US3] Add error logging and task status updates in crawling-worker/src/task-executor.ts
- [ ] T103 [P] [US3] Create Dockerfile for Cloud Run deployment in crawling-worker/Dockerfile

### GCP Infrastructure for US3

- [ ] T104 [US3] Create Cloud Pub/Sub topic 'crawling-tasks' via gcloud CLI
- [ ] T105 [US3] Create Cloud Pub/Sub subscription for crawling-worker
- [ ] T106 [US3] Deploy crawling-worker to Cloud Run
- [ ] T107 [US3] Create Cloud Scheduler job for each project schedule type (daily, weekly, monthly examples)

### Integration for US3

- [ ] T108 [US3] Connect POST /api/crawling/run to Pub/Sub message publishing
- [ ] T109 [US3] Update CrawlingRun status from worker (in-progress → completed/failed)
- [ ] T110 [US3] Update CrawlingTask status from worker (pending → success/failed)
- [ ] T111 [US3] Add automatic retry queue for failed tasks (max 3 retries)
- [ ] T112 [US3] Update Project.lastRunAt timestamp after run completion

**Checkpoint**: User Story 3 완료 - 자동 크롤링 실행 및 재시도 메커니즘 작동

---

## Phase 6: User Story 4 - 수집 데이터 API 제공 (Priority: P4)

**Goal**: 사용자가 API 키를 발급받아 외부 시스템에서 REST API로 수집된 데이터를 조회 가능

**Independent Test**: 사용자가 대시보드에서 API 키를 발급받고, curl/Postman으로 GET 요청을 보내 데이터를 수신할 수 있는지 확인

### Backend Services for US4

- [ ] T113 [P] [US4] Create ApiKeyService with generateApiKey method in src/services/api-key.service.ts
- [ ] T114 [P] [US4] Add validateApiKey method to ApiKeyService in src/services/api-key.service.ts
- [ ] T115 [P] [US4] Add revokeApiKey and regenerateApiKey methods to ApiKeyService in src/services/api-key.service.ts
- [ ] T116 [P] [US4] Implement API key hashing (SHA-256) utility in src/lib/utils/api-key.ts

### API Routes for US4

- [ ] T117 [P] [US4] Implement POST /api/api-keys endpoint (generate) in src/app/api/api-keys/route.ts
- [ ] T118 [P] [US4] Implement GET /api/api-keys endpoint (list user's keys) in src/app/api/api-keys/route.ts
- [ ] T119 [P] [US4] Implement DELETE /api/api-keys/[id] endpoint (revoke) in src/app/api/api-keys/[id]/route.ts
- [ ] T120 [P] [US4] Implement POST /api/api-keys/[id]/regenerate endpoint in src/app/api/api-keys/[id]/regenerate/route.ts
- [ ] T121 [US4] Implement GET /api/data/export endpoint with API key auth in src/app/api/data/export/route.ts
- [ ] T122 [US4] Create API key authentication middleware in src/middleware/api-key-auth.ts

### Frontend Components for US4

- [ ] T123 [P] [US4] Create ApiKeyList component with masked keys in src/components/settings/ApiKeyList.tsx
- [ ] T124 [P] [US4] Create GenerateApiKeyDialog component in src/components/settings/GenerateApiKeyDialog.tsx
- [ ] T125 [P] [US4] Create ApiKeyDisplay component with copy button in src/components/settings/ApiKeyDisplay.tsx

### Frontend Pages for US4

- [ ] T126 [US4] Add API Keys tab to project detail page in src/app/(dashboard)/projects/[id]/page.tsx
- [ ] T127 [US4] Create API documentation panel with example curl commands

### Integration for US4

- [ ] T128 [US4] Connect GenerateApiKeyDialog to POST /api/api-keys endpoint
- [ ] T129 [US4] Connect ApiKeyList to GET /api/api-keys endpoint
- [ ] T130 [US4] Implement API key revoke and regenerate handlers
- [ ] T131 [US4] Add API key permissions check (read:data) to export endpoint
- [ ] T132 [US4] Update ApiKey.lastUsedAt and requestCount on each API call

**Checkpoint**: User Story 4 완료 - API 키 발급 및 데이터 API 제공

---

## Phase 7: User Story 5 - 프로젝트 설정 수정 (Priority: P5)

**Goal**: 사용자가 기존 프로젝트 설정(필드, 스케줄, URL 등)을 수정하고 샘플 크롤링으로 재검증 가능

**Independent Test**: 사용자가 프로젝트 상세 페이지에서 "설정 수정" 버튼을 클릭하여 챗봇을 다시 열고, 필드나 스케줄을 변경한 후 샘플 크롤링으로 검증하여 저장할 수 있는지 확인

### Backend Services for US5

- [ ] T133 [P] [US5] Add updateProjectSettings method to ProjectService in src/services/project.service.ts
- [ ] T134 [P] [US5] Add validateSettingsChange method to ProjectService in src/services/project.service.ts

### API Routes for US5

- [ ] T135 [P] [US5] Enhance PATCH /api/projects/[id] to support settings updates in src/app/api/projects/[id]/route.ts

### Frontend Components for US5

- [ ] T136 [P] [US5] Create EditProjectDialog component (reuses ChatbotDialog) in src/components/dashboard/EditProjectDialog.tsx
- [ ] T137 [US5] Add "설정 수정" button to ProjectDetailHeader in src/components/dashboard/ProjectDetailHeader.tsx

### Integration for US5

- [ ] T138 [US5] Connect EditProjectDialog to PATCH /api/projects/[id] endpoint
- [ ] T139 [US5] Pre-populate chatbot with current project settings (name, urls, selectors, schedule)
- [ ] T140 [US5] Implement settings change validation (ensure sample crawl succeeds before saving)
- [ ] T141 [US5] Update Cloud Scheduler cron job when schedule changes

**Checkpoint**: User Story 5 완료 - 프로젝트 설정 수정 가능

---

## Phase 8: Notification System (Cross-Cutting for US3)

**Goal**: Google Chat 웹훅을 통한 크롤링 완료/실패 알림

**Note**: This phase supports US3 (automated crawling) but is cross-cutting functionality

### Backend Services for Notifications

- [ ] T142 [P] Create NotificationService with sendGoogleChatNotification method in src/services/notification.service.ts
- [ ] T143 [P] Add formatSuccessMessage and formatFailureMessage helpers in src/services/notification.service.ts

### API Routes for Notifications

- [ ] T144 [P] Implement POST /api/notifications/google-chat/configure in src/app/api/notifications/google-chat/configure/route.ts
- [ ] T145 [P] Implement DELETE /api/notifications/google-chat/configure in src/app/api/notifications/google-chat/configure/route.ts
- [ ] T146 [P] Implement POST /api/notifications/send (internal) in src/app/api/notifications/send/route.ts
- [ ] T147 [P] Implement GET /api/notifications/settings in src/app/api/notifications/settings/route.ts

### Frontend Components for Notifications

- [ ] T148 [P] Create GoogleChatWebhookConfig component in src/components/settings/GoogleChatWebhookConfig.tsx
- [ ] T149 [P] Add webhook configuration to project settings tab

### Integration for Notifications

- [ ] T150 Call NotificationService from crawling-worker after run completion
- [ ] T151 Add webhook URL encryption (AES-256) in storage
- [ ] T152 Add webhook test message on configuration save
- [ ] T153 Handle webhook failures gracefully (log error, don't block crawling)

**Checkpoint**: Notification system 완료 - Google Chat 알림 작동

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 최종 polish, 성능 최적화, 에러 처리, 보안 강화

### Security & Validation

- [ ] T154 [P] Implement Row-Level Security with Prisma middleware in src/lib/db/middleware.ts
- [ ] T155 [P] Add rate limiting middleware (10 req/min for AI endpoints) in src/middleware/rate-limit.ts
- [ ] T156 [P] Add input sanitization for CSS selectors (prevent XSS) in src/lib/utils/sanitize.ts
- [ ] T157 [P] Add URL validation (only http/https protocols) in src/lib/utils/validate.ts
- [ ] T158 [P] Implement CSRF protection for all POST endpoints
- [ ] T159 [P] Add webhook URL encryption/decryption in src/lib/utils/encryption.ts

### Performance Optimization

- [ ] T160 [P] Add database query optimization (connection pooling) in src/lib/db/prisma.ts
- [ ] T161 [P] Implement caching for getProjects with ISR (5 min TTL) in src/app/(dashboard)/page.tsx
- [ ] T162 [P] Add pagination cursors for Firestore queries in src/services/data.service.ts
- [ ] T163 [P] Optimize Firestore indexes per data-model.md

### Error Handling & Logging

- [ ] T164 [P] Create global error handler in src/app/error.tsx
- [ ] T165 [P] Create not-found handler in src/app/not-found.tsx
- [ ] T166 [P] Add structured logging utility (Winston or Pino) in src/lib/logging/logger.ts
- [ ] T167 [P] Add error boundary for chatbot component in src/components/chat/ChatbotErrorBoundary.tsx
- [ ] T168 Implement user-friendly error messages (Korean) for all API errors

### UI/UX Polish

- [ ] T169 [P] Add loading skeletons for project list and detail pages
- [ ] T170 [P] Add toast notifications for success/error feedback (react-hot-toast)
- [ ] T171 [P] Implement dark mode support with next-themes
- [ ] T172 [P] Add empty states for project list, data table, error log
- [ ] T173 [P] Add keyboard shortcuts for common actions (Cmd+K for chatbot)

### Documentation

- [ ] T174 [P] Create API documentation page in src/app/(dashboard)/docs/page.tsx
- [ ] T175 [P] Add inline code comments for complex AI logic (selector recommendation)
- [ ] T176 [P] Create deployment guide in README.md (Vercel + GCP setup)

### Testing Infrastructure (Optional Post-MVP)

- [ ] T177 [P] Setup Jest configuration for unit tests
- [ ] T178 [P] Setup Playwright for E2E tests
- [ ] T179 [P] Create test database seed script in prisma/seed.ts
- [ ] T180 [P] Add CI/CD pipeline (GitHub Actions)

**Final Checkpoint**: 전체 시스템 완료 및 배포 준비

---

## Dependency Graph (User Story Completion Order)

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
    ├── Phase 3 (US1: 프로젝트 생성) 🎯 MVP - MUST COMPLETE FIRST
    │   ↓
    ├── Phase 4 (US2: 모니터링) - Depends on US1 (needs projects to monitor)
    │   ↓
    ├── Phase 5 (US3: 자동 실행) - Depends on US1 (needs projects) + Phase 8 (notifications)
    │   ↓
    ├── Phase 6 (US4: API) - Independent, can run parallel to US2/US3
    │   ↓
    └── Phase 7 (US5: 설정 수정) - Depends on US1 (modifies existing projects)
        ↓
    Phase 8 (Notifications) - Cross-cutting for US3
        ↓
    Phase 9 (Polish)
```

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 9

**Parallel Opportunities**:

- Phase 6 (US4) can be developed in parallel with Phase 4-5
- Phase 8 (Notifications) can start after Phase 3 completes

---

## Parallel Execution Examples

### After Phase 2 Completes

**US1 Tasks (T028-T055)** can be parallelized as follows:

**Parallel Group A** (Backend):

- T028, T029, T030, T031 (Services)
- T032, T033, T034, T035, T036, T037 (API Routes)

**Parallel Group B** (Frontend):

- T038, T039, T040, T042, T043 (Components)

**Parallel Group C** (Worker):

- T048, T049, T050 (Crawler setup)

**Sequential Dependencies**:

- T041 depends on T038-T040 (uses child components)
- T044, T045 depend on T042, T043 (use forms)
- T046, T047 depend on T041 (use ChatbotDialog)
- T051 depends on T049, T050 (uses crawler modules)
- T052 depends on T032-T037 (needs APIs ready)
- T053-T055 depend on T052 (integration layer)

### After US1 Completes

**US2 Tasks (T056-T092)** can be parallelized:

**Parallel Group A** (Backend):

- T056-T063 (Services)
- T064-T073 (API Routes)

**Parallel Group B** (Frontend):

- T074-T081 (Components)

**Sequential**:

- T082-T084 (Pages - need components)
- T085-T092 (Integration - needs APIs and pages)

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Recommended MVP**: User Story 1 Only (Phase 1 + Phase 2 + Phase 3)

**Deliverables**:

- 사용자 회원가입/로그인
- AI 챗봇을 통한 프로젝트 생성
- CSS Selector 자동 추천
- Cron 표현식 자동 생성
- 샘플 크롤링 검증
- 프로젝트 활성화 및 DB 저장

**Value**: 비개발자가 크롤링 프로젝트를 5분 내에 생성 가능 (핵심 가치 검증)

### Incremental Delivery

1. **MVP Release (US1)**: 프로젝트 생성 기능만 배포, 사용자 피드백 수집
2. **Release 2 (US1+US2)**: 대시보드 모니터링 추가, 사용성 개선
3. **Release 3 (US1+US2+US3)**: 자동 크롤링 실행, 완전한 자동화
4. **Release 4 (All US)**: API 제공, 설정 수정 등 전체 기능 완성

---

## Validation Checklist

### Task Format Compliance

✅ All tasks follow `- [ ] [ID] [P?] [Story] Description` format
✅ Task IDs are sequential (T001-T180)
✅ [P] markers identify parallelizable tasks
✅ [Story] labels map to user stories (US1-US5)
✅ File paths included in all implementation tasks

### User Story Mapping

✅ US1 (P1): T028-T055 (28 tasks)
✅ US2 (P2): T056-T092 (37 tasks)
✅ US3 (P3): T093-T112 (20 tasks)
✅ US4 (P4): T113-T132 (20 tasks)
✅ US5 (P5): T133-T141 (9 tasks)
✅ Cross-cutting: T142-T180 (39 tasks)

**Total**: 180 tasks

### Independent Testability

✅ Each user story has clear test criteria in Phase descriptions
✅ US1 can be tested without US2-US5
✅ US2 can be tested independently after US1
✅ US3 can be tested independently after US1
✅ US4 can be tested independently after US1
✅ US5 can be tested independently after US1

### MVP Readiness

✅ MVP scope clearly defined (US1 only)
✅ MVP delivers core value (AI-powered project creation)
✅ Incremental delivery path defined
✅ Critical path identified

---

## Summary

- **Total Tasks**: 180
- **User Story 1 (MVP)**: 28 implementation tasks
- **User Story 2**: 37 tasks
- **User Story 3**: 20 tasks
- **User Story 4**: 20 tasks
- **User Story 5**: 9 tasks
- **Setup & Foundation**: 27 tasks
- **Cross-Cutting**: 39 tasks

**Parallel Opportunities**: 80+ tasks can run in parallel within each phase (marked with [P])

**Suggested MVP**: Phase 1 + Phase 2 + Phase 3 (US1) = 55 tasks total

**Format Validation**: ✅ All tasks follow checklist format with IDs, labels, and file paths
