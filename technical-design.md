# 기술 설계 문서: FlexCrawler

## 📋 문서 개요

**버전**: 1.0
**작성일**: 2025-11-23
**작성자**: Mary (Business Analyst) + Technical Team
**목적**: FlexCrawler MVP 및 Phase 2 상세 기술 설계

---

## 🎯 기술 요구사항

### 기능 요구사항 (MVP)

#### 1. 크롤링 설정

- YAML 기반 크롤링 작업 정의
- 기본 Visual Builder (웹 크롤링)
- 템플릿 상속 및 재사용
- 변수 및 파라미터 지원

#### 2. 크롤링 실행

- 정적 웹 페이지 크롤링
- REST API 호출
- CSS/XPath 셀렉터
- 기본 데이터 변환

#### 3. 스케줄링

- Cron 기반 스케줄
- Manual 트리거 (UI/API)
- 재시도 로직
- 타임아웃 관리

#### 4. 데이터 관리

- PostgreSQL 저장
- CSV/JSON export
- 데이터 검증
- 중복 제거

#### 5. 모니터링

- 작업 상태 대시보드
- 실행 로그
- 에러 추적
- 이메일 알림

### 비기능 요구사항

#### 성능

- 동시 크롤링 작업: 100+
- 응답 시간: <200ms (API)
- 처리량: 1,000 requests/min

#### 확장성

- 수평 확장 가능 (워커)
- 멀티 테넌시
- 큐 기반 아키텍처

#### 보안

- JWT 인증
- API Key 관리
- 데이터 암호화
- Rate limiting

#### 신뢰성

- 99.5% uptime (MVP)
- 자동 재시도
- 에러 복구
- 데이터 백업

---

## 🏗️ 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Web UI    │  │  API SDK   │  │  CLI Tool  │       │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘       │
└────────┼───────────────┼───────────────┼───────────────┘
         │               │               │
         └───────────────┴───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │     API Gateway (Next.js)     │
         │   - Authentication (JWT)      │
         │   - Rate Limiting             │
         │   - Request Validation        │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │   Application Server          │
         │      (NestJS Backend)         │
         │                               │
         │  ┌─────────┐  ┌─────────┐   │
         │  │ Job API │  │ Auth    │   │
         │  └────┬────┘  └─────────┘   │
         │       │                      │
         │  ┌────▼─────┐  ┌─────────┐  │
         │  │Scheduler │  │Template │  │
         │  │ Service  │  │ Service │  │
         │  └────┬─────┘  └─────────┘  │
         └───────┼────────────────────┘
                 │
         ┌───────▼────────────────────┐
         │   Message Queue Layer      │
         │     (Bull + Redis)         │
         │                            │
         │  ┌──────────────────────┐ │
         │  │   Job Queue          │ │
         │  │  - web-crawl         │ │
         │  │  - api-fetch         │ │
         │  │  - transform         │ │
         │  └──────┬───────────────┘ │
         └─────────┼──────────────────┘
                   │
         ┌─────────▼──────────────────┐
         │    Worker Pool             │
         │                            │
         │  ┌──────┐  ┌──────┐       │
         │  │Web   │  │API   │       │
         │  │Worker│  │Worker│       │
         │  └──┬───┘  └──┬───┘       │
         │     │         │            │
         │  ┌──▼─────────▼───┐       │
         │  │  Transform     │       │
         │  │  Worker        │       │
         │  └──┬─────────────┘       │
         └─────┼──────────────────────┘
               │
         ┌─────▼──────────────────────┐
         │   Storage Layer            │
         │                            │
         │  ┌──────────────┐          │
         │  │ PostgreSQL   │          │
         │  │ - Metadata   │          │
         │  │ - Jobs       │          │
         │  │ - Results    │          │
         │  └──────────────┘          │
         │                            │
         │  ┌──────────────┐          │
         │  │ Redis        │          │
         │  │ - Cache      │          │
         │  │ - Sessions   │          │
         │  └──────────────┘          │
         │                            │
         │  ┌──────────────┐          │
         │  │ S3/GCS       │          │
         │  │ - Raw Data   │          │
         │  │ - Exports    │          │
         │  └──────────────┘          │
         └────────────────────────────┘
```

---

## 💾 데이터베이스 스키마

### ERD (Entity Relationship Diagram)

```
┌────────────────┐
│  organizations │
├────────────────┤
│ id (PK)        │
│ name           │
│ slug           │
│ plan_type      │
│ created_at     │
└────┬───────────┘
     │
     │ 1:N
     │
┌────▼───────────┐
│   users        │
├────────────────┤
│ id (PK)        │
│ org_id (FK)    │
│ email          │
│ password_hash  │
│ role           │
│ created_at     │
└────┬───────────┘
     │
     │ 1:N
     │
┌────▼───────────┐         ┌─────────────────┐
│   projects     │────1:N──│  job_configs    │
├────────────────┤         ├─────────────────┤
│ id (PK)        │         │ id (PK)         │
│ org_id (FK)    │         │ project_id (FK) │
│ name           │         │ name            │
│ description    │         │ config_yaml     │
│ created_at     │         │ schedule_cron   │
└────────────────┘         │ is_active       │
                           │ created_at      │
                           └────┬────────────┘
                                │
                                │ 1:N
                                │
                           ┌────▼────────────┐
                           │  job_runs       │
                           ├─────────────────┤
                           │ id (PK)         │
                           │ job_config_id   │
                           │ status          │
                           │ started_at      │
                           │ finished_at     │
                           │ error_message   │
                           │ stats_json      │
                           └────┬────────────┘
                                │
                                │ 1:N
                                │
                           ┌────▼────────────┐
                           │  crawled_data   │
                           ├─────────────────┤
                           │ id (PK)         │
                           │ job_run_id (FK) │
                           │ url             │
                           │ data_json       │
                           │ scraped_at      │
                           └─────────────────┘

┌────────────────┐
│  templates     │
├────────────────┤
│ id (PK)        │
│ name           │
│ category       │
│ config_yaml    │
│ is_public      │
│ org_id (FK)    │
│ created_at     │
└────────────────┘

┌────────────────┐
│  api_keys      │
├────────────────┤
│ id (PK)        │
│ org_id (FK)    │
│ key_hash       │
│ name           │
│ last_used_at   │
│ created_at     │
└────────────────┘
```

---

### 테이블 상세 정의

#### 1. organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
  -- free, professional, team, enterprise

  quota_monthly_runs INTEGER NOT NULL DEFAULT 1000,
  quota_used_runs INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
```

#### 2. users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),

  role VARCHAR(50) NOT NULL DEFAULT 'member',
  -- admin, member, viewer

  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
```

#### 3. projects

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_org_id ON projects(org_id);
```

#### 4. job_configs

```sql
CREATE TABLE job_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- 설정
  config_yaml TEXT NOT NULL,
  -- YAML 형식의 크롤링 설정

  -- 스케줄링
  schedule_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  -- manual, cron, webhook
  schedule_cron VARCHAR(100),
  -- 예: "0 9 * * *"

  -- 상태
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,

  -- 템플릿
  template_id UUID REFERENCES templates(id),

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_configs_project_id ON job_configs(project_id);
CREATE INDEX idx_job_configs_is_active ON job_configs(is_active);
CREATE INDEX idx_job_configs_next_run_at ON job_configs(next_run_at);
```

#### 5. job_runs

```sql
CREATE TABLE job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_config_id UUID NOT NULL REFERENCES job_configs(id) ON DELETE CASCADE,

  -- 상태
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- pending, running, completed, failed, cancelled

  trigger_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  -- manual, scheduled, webhook, api

  -- 타이밍
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  duration_ms INTEGER,

  -- 결과
  items_crawled INTEGER DEFAULT 0,
  items_success INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  error_message TEXT,
  error_stack TEXT,

  -- 통계 (JSON)
  stats_json JSONB,
  -- { "requests": 100, "data_size_bytes": 50000, ... }

  -- 메타데이터
  worker_id VARCHAR(100),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_runs_job_config_id ON job_runs(job_config_id);
CREATE INDEX idx_job_runs_status ON job_runs(status);
CREATE INDEX idx_job_runs_created_at ON job_runs(created_at DESC);
```

#### 6. crawled_data

```sql
CREATE TABLE crawled_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_run_id UUID NOT NULL REFERENCES job_runs(id) ON DELETE CASCADE,

  -- 소스
  url TEXT,
  source_type VARCHAR(50) NOT NULL DEFAULT 'web',
  -- web, api

  -- 데이터
  data_json JSONB NOT NULL,
  -- 크롤링된 실제 데이터

  raw_html TEXT,
  -- 원본 HTML (선택적)

  -- 메타데이터
  scraped_at TIMESTAMP DEFAULT NOW(),
  response_time_ms INTEGER,
  status_code INTEGER,

  -- 검증
  is_valid BOOLEAN DEFAULT TRUE,
  validation_errors JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crawled_data_job_run_id ON crawled_data(job_run_id);
CREATE INDEX idx_crawled_data_scraped_at ON crawled_data(scraped_at DESC);
CREATE INDEX idx_crawled_data_data_json ON crawled_data USING GIN(data_json);
```

#### 7. templates

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  -- ecommerce, news, social, api, etc.

  config_yaml TEXT NOT NULL,
  -- 템플릿 설정

  -- 공유
  is_public BOOLEAN DEFAULT FALSE,
  org_id UUID REFERENCES organizations(id),
  -- NULL = 글로벌 템플릿, NOT NULL = 조직 전용

  -- 통계
  usage_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_public ON templates(is_public);
CREATE INDEX idx_templates_org_id ON templates(org_id);
```

#### 8. api_keys

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  key_hash VARCHAR(255) UNIQUE NOT NULL,
  -- SHA256 해시

  name VARCHAR(255) NOT NULL,
  -- 사용자 식별용

  permissions JSONB,
  -- { "read": true, "write": true, "admin": false }

  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,

  is_active BOOLEAN DEFAULT TRUE,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

#### 9. notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL,
  -- email, slack, webhook

  config_json JSONB NOT NULL,
  -- { "email": "team@company.com" } or { "webhook_url": "..." }

  triggers JSONB NOT NULL,
  -- { "on_success": true, "on_failure": true, "on_threshold": 100 }

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_org_id ON notifications(org_id);
```

---

## 🔧 기술 스택 상세

### Frontend

#### Next.js 14 App Router

```
app/
├── (auth)/
│   ├── sign-in/
│   └── sign-up/
├── (dashboard)/
│   ├── projects/
│   │   └── [id]/
│   │       ├── jobs/
│   │       │   ├── [jobId]/
│   │       │   └── new/
│   │       └── settings/
│   ├── templates/
│   └── settings/
└── api/
    ├── jobs/
    ├── runs/
    └── templates/
```

#### 주요 라이브러리

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-flow": "^11.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "zod": "^3.x",
    "react-hook-form": "^7.x",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.x",
    "lucide-react": "latest",
    "recharts": "^2.x",
    "monaco-editor": "^0.45.x"
  }
}
```

---

### Backend

#### NestJS 구조

```
src/
├── app.module.ts
├── main.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   │
│   ├── jobs/
│   │   ├── jobs.module.ts
│   │   ├── jobs.service.ts
│   │   ├── jobs.controller.ts
│   │   ├── dto/
│   │   │   ├── create-job.dto.ts
│   │   │   └── update-job.dto.ts
│   │   └── entities/
│   │       └── job.entity.ts
│   │
│   ├── scheduler/
│   │   ├── scheduler.module.ts
│   │   ├── scheduler.service.ts
│   │   └── cron.processor.ts
│   │
│   ├── crawler/
│   │   ├── crawler.module.ts
│   │   ├── processors/
│   │   │   ├── web-crawler.processor.ts
│   │   │   ├── api-fetcher.processor.ts
│   │   │   └── transformer.processor.ts
│   │   └── services/
│   │       ├── playwright.service.ts
│   │       ├── axios.service.ts
│   │       └── parser.service.ts
│   │
│   ├── templates/
│   │   ├── templates.module.ts
│   │   ├── templates.service.ts
│   │   └── templates.controller.ts
│   │
│   └── notifications/
│       ├── notifications.module.ts
│       ├── notifications.service.ts
│       └── providers/
│           ├── email.provider.ts
│           └── slack.provider.ts
│
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   └── pipes/
│
└── config/
    ├── database.config.ts
    ├── redis.config.ts
    └── queue.config.ts
```

#### 주요 라이브러리

```json
{
  "dependencies": {
    "@nestjs/core": "^10.x",
    "@nestjs/common": "^10.x",
    "@nestjs/jwt": "^10.x",
    "@nestjs/passport": "^10.x",
    "@nestjs/bull": "^10.x",
    "bull": "^4.x",
    "prisma": "^5.x",
    "@prisma/client": "^5.x",
    "playwright": "^1.40.x",
    "axios": "^1.x",
    "cheerio": "^1.x",
    "js-yaml": "^4.x",
    "node-cron": "^3.x",
    "ioredis": "^5.x"
  }
}
```

---

### 크롤링 워커

#### Web Crawler (Playwright)

```typescript
// processors/web-crawler.processor.ts
import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { chromium } from 'playwright'

@Processor('web-crawl')
export class WebCrawlerProcessor {
  @Process()
  async handleCrawl(job: Job) {
    const { url, selectors, config } = job.data

    const browser = await chromium.launch({
      headless: true,
    })

    try {
      const page = await browser.newPage()
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: config.timeout || 30000,
      })

      // 데이터 추출
      const data = {}
      for (const [key, selector] of Object.entries(selectors)) {
        const element = await page.$(selector)
        data[key] = await element?.textContent()
      }

      await job.progress(100)
      return data
    } finally {
      await browser.close()
    }
  }
}
```

#### API Fetcher

```typescript
// processors/api-fetcher.processor.ts
import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import axios from 'axios'

@Processor('api-fetch')
export class ApiFetcherProcessor {
  @Process()
  async handleFetch(job: Job) {
    const { endpoint, method, auth, params } = job.data

    const headers = {}

    // 인증 처리
    if (auth?.type === 'bearer') {
      headers['Authorization'] = `Bearer ${auth.token}`
    } else if (auth?.type === 'api_key') {
      headers[auth.header_name] = auth.api_key
    }

    const response = await axios({
      url: endpoint,
      method: method || 'GET',
      headers,
      params,
      timeout: 30000,
    })

    return response.data
  }
}
```

---

## 🔐 보안 설계

### 인증 & 권한

#### JWT 인증

```typescript
// auth.service.ts
async login(email: string, password: string) {
  const user = await this.usersService.findByEmail(email);

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    throw new UnauthorizedException();
  }

  const payload = {
    sub: user.id,
    email: user.email,
    org_id: user.org_id,
    role: user.role,
  };

  return {
    access_token: this.jwtService.sign(payload),
    refresh_token: this.jwtService.sign(payload, {
      expiresIn: '7d',
    }),
  };
}
```

#### RBAC (Role-Based Access Control)

```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler()
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// 사용 예
@Post()
@Roles('admin', 'member')
@UseGuards(JwtAuthGuard, RolesGuard)
async createJob(@Body() dto: CreateJobDto) {
  // ...
}
```

#### API Key 인증

```typescript
// api-key.guard.ts
@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-api-key']

    if (!apiKey) return false

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

    const key = await this.apiKeysService.findByHash(keyHash)

    if (!key || !key.is_active) return false

    // 사용 기록
    await this.apiKeysService.updateLastUsed(key.id)

    request.org_id = key.org_id
    return true
  }
}
```

---

### Rate Limiting

```typescript
// rate-limit.guard.ts
import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 조직별 제한
    return req.org_id || req.ip
  }

  protected async getLimit(): Promise<number> {
    // 플랜별 제한
    const org = await this.getOrganization(req.org_id)

    switch (org.plan_type) {
      case 'free':
        return 10 // 10 req/min
      case 'professional':
        return 100
      case 'team':
        return 500
      case 'enterprise':
        return 5000
      default:
        return 10
    }
  }
}
```

---

## 📊 모니터링 & 로깅

### 로깅 구조

```typescript
// logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common'
import * as winston from 'winston'

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger

  constructor() {
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    })
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context })
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context })
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context })
  }
}
```

### 메트릭 수집

```typescript
// metrics.service.ts
import { Injectable } from '@nestjs/common'
import { InjectRedis } from '@nestjs-modules/ioredis'
import Redis from 'ioredis'

@Injectable()
export class MetricsService {
  constructor(@InjectRedis() private redis: Redis) {}

  async recordJobRun(orgId: string, success: boolean) {
    const key = `metrics:jobs:${orgId}:${new Date().toISOString().slice(0, 10)}`
    await this.redis.hincrby(key, success ? 'success' : 'failed', 1)
    await this.redis.expire(key, 86400 * 30) // 30일 보관
  }

  async getJobStats(orgId: string, days = 7) {
    const stats = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = `metrics:jobs:${orgId}:${date.toISOString().slice(0, 10)}`
      const data = await this.redis.hgetall(key)
      stats.push({
        date: date.toISOString().slice(0, 10),
        success: parseInt(data.success || '0'),
        failed: parseInt(data.failed || '0'),
      })
    }
    return stats.reverse()
  }
}
```

---

## 🚀 배포 아키텍처

### GCP 인프라

```
┌─────────────────────────────────────────┐
│         Cloud Load Balancer             │
│         (HTTPS, SSL Termination)        │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
┌────────▼──────┐  ┌────▼────────────┐
│  Cloud Run    │  │  Cloud Run      │
│  (Frontend)   │  │  (Backend API)  │
│  Next.js      │  │  NestJS         │
│  Auto-scale   │  │  Auto-scale     │
└───────────────┘  └────┬────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
┌────────▼──────┐  ┌───▼──────┐  ┌───▼──────────┐
│  Cloud SQL    │  │MemoryStore│  │Cloud Storage│
│  PostgreSQL   │  │  Redis    │  │   (GCS)     │
│  HA Config    │  │           │  │ - Raw Data  │
└───────────────┘  └───────────┘  │ - Exports   │
                                  └─────────────┘

┌─────────────────────────────────────────┐
│     Compute Engine (Worker Pool)        │
│  ┌──────────┐  ┌──────────┐            │
│  │ Worker 1 │  │ Worker 2 │  ...       │
│  │          │  │          │            │
│  └──────────┘  └──────────┘            │
│  Auto-scaling based on queue depth     │
└─────────────────────────────────────────┘
```

### Docker Compose (로컬 개발)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: flexcrawler
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - '3001:3001'
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/flexcrawler
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/flexcrawler
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

## 🧪 테스트 전략

### 단위 테스트

```typescript
// jobs.service.spec.ts
describe('JobsService', () => {
  let service: JobsService
  let prisma: PrismaService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [JobsService, PrismaService],
    }).compile()

    service = module.get<JobsService>(JobsService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should create a job', async () => {
    const dto = {
      name: 'Test Job',
      config_yaml: 'version: 1.0',
    }

    const result = await service.create(dto)
    expect(result.name).toBe('Test Job')
  })
})
```

### 통합 테스트

```typescript
// jobs.e2e-spec.ts
describe('Jobs (e2e)', () => {
  let app: INestApplication
  let token: string

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    // 로그인 후 토큰 획득
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
    token = response.body.access_token
  })

  it('/jobs (POST)', () => {
    return request(app.getHttpServer())
      .post('/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Job', config_yaml: '...' })
      .expect(201)
  })
})
```

---

## 📈 성능 최적화

### 캐싱 전략

```typescript
// cache.interceptor.ts
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@InjectRedis() private redis: Redis) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest()
    const cacheKey = `cache:${request.url}:${request.org_id}`

    // 캐시 확인
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return of(JSON.parse(cached))
    }

    // 캐시 없으면 실행 후 저장
    return next.handle().pipe(
      tap(async (data) => {
        await this.redis.setex(cacheKey, 300, JSON.stringify(data))
      })
    )
  }
}
```

### 데이터베이스 최적화

```sql
-- 인덱스 추가
CREATE INDEX CONCURRENTLY idx_job_runs_compound
  ON job_runs(job_config_id, status, created_at DESC);

-- 파티셔닝 (대용량 데이터)
CREATE TABLE crawled_data_2025_01 PARTITION OF crawled_data
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

**문서 버전**: 1.0
**최종 수정**: 2025-11-23
**다음 단계**: UX 디자인, MVP 개발 계획
