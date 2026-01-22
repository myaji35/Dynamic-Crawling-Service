# Tech-Spec: Playwright E2E 테스트 구현 (MVP)

**작성일**: 2025-11-23
**프로젝트**: Dynamic Crawling Service (FlexCrawler)
**스토리 수**: 3개 스토리
**범위**: MVP (P0 + 일부 P1, 15-20개 핵심 테스트)
**접근**: 점진적 확장 (MVP → Full → Comprehensive)

---

## 📋 컨텍스트

### 로드된 문서

- ✅ **playwright-test-plan.md** - 테스트 계획서 (30+ 시나리오 정의)
- ✅ **package.json** - 프로젝트 의존성 및 스크립트 분석
- ✅ **기존 코드베이스** - Brownfield 프로젝트 구조 파악

### 프로젝트 스택

**프레임워크 및 런타임:**

- **Next.js**: 16.0.1 (App Router, Turbopack)
- **Node.js**: 20.x
- **TypeScript**: 5.x (strict 모드)
- **React**: 18.x

**주요 의존성:**

- **@clerk/nextjs**: ^6.35.2 - 사용자 인증
- **@prisma/client**: ^6.19.0 - 데이터베이스 ORM (PostgreSQL)
- **Playwright**: (크롤링 엔진으로 이미 사용 중)
- **Radix UI**: UI 컴포넌트 라이브러리
- **Tailwind CSS**: 유틸리티 스타일링
- **Lucide React**: 아이콘 라이브러리

**개발 도구:**

- **ESLint**: 8.x - 코드 린팅
- **Husky**: Git hooks
- **Prisma**: 데이터베이스 마이그레이션

### 기존 코드 구조 (Brownfield)

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx                    # 대시보드 메인
│   │   │   ├── new/page.tsx                # 프로젝트 생성 (챗봇)
│   │   │   ├── visual-builder-demo/page.tsx # Visual Builder
│   │   │   └── projects/[projectId]/page.tsx # 프로젝트 상세
│   │   └── layout.tsx                       # 대시보드 레이아웃
│   ├── api/
│   │   ├── projects/route.ts               # 프로젝트 API
│   │   ├── dashboard/stats/route.ts        # 통계 API
│   │   └── projects/[projectId]/
│   │       ├── run/route.ts                # 크롤링 실행
│   │       ├── test-selector/route.ts      # 셀렉터 테스트
│   │       └── suggest-batch/route.ts      # AI 추천
│   ├── sign-in/[[...sign-in]]/page.tsx    # Clerk 로그인
│   └── sign-up/[[...sign-up]]/page.tsx    # Clerk 회원가입
├── components/
│   ├── dashboard/
│   │   ├── StatCard.tsx                    # 통계 카드
│   │   ├── ActivityChart.tsx               # 활동 차트
│   │   └── RecentProjects.tsx              # 최근 프로젝트
│   ├── visual-builder/
│   │   └── VisualBuilder.tsx               # Visual Builder 메인
│   └── ui/                                  # Radix UI 컴포넌트
├── lib/
│   ├── crawler/
│   │   └── engine.ts                       # 크롤링 엔진
│   └── db/
│       └── prisma.ts                       # Prisma 클라이언트
└── types/                                   # TypeScript 타입
```

**테스트 패턴 (현재):**

- ❌ E2E 테스트 없음 - **새로 구축 필요**
- ❌ 통합 테스트 없음
- ❌ 유닛 테스트 없음
- ✅ Playwright는 크롤링 엔진(`src/lib/crawler/engine.ts`)에서 이미 사용 중

### 코드 컨벤션 (따를 규칙)

**TypeScript 스타일:**

- Strict 모드 활성화
- 세미콜론 사용
- 싱글 쿼트 선호
- 2 스페이스 들여쓰기

**Import 패턴:**

```typescript
import { Component } from '@/components/Component' // 경로 별칭 사용
import { helper } from '@/lib/utils'
```

**컴포넌트 스타일:**

- 함수형 컴포넌트 + Hooks
- 'use client' 디렉티브 (클라이언트 컴포넌트)
- props 타입 명시적 정의

**파일 네이밍:**

- 컴포넌트: PascalCase (`StatCard.tsx`)
- 유틸리티: camelCase (`test-helpers.ts`)
- 테스트: `*.spec.ts` 또는 `*.test.ts`

---

## 🎯 변경 사항 (The Change)

### 문제 정의

**현재 상황:**
FlexCrawler는 다음 핵심 기능들이 구현되어 있습니다:

- ✅ Clerk 기반 사용자 인증
- ✅ 대시보드 (통계 카드, 활동 차트, 최근 프로젝트)
- ✅ Visual Builder (페이지 프리뷰, AI 추천, 셀렉터 테스트)
- ✅ 프로젝트 관리 (생성, 수정, 삭제, 크롤링 실행)
- ✅ Playwright 기반 크롤링 엔진

**문제점:**

- ❌ **자동화된 E2E 테스트가 전혀 없음**
- ❌ 수동 테스트에만 의존 → 회귀 버그 발견 늦음
- ❌ CI/CD 파이프라인에 품질 게이트 없음
- ❌ 리팩토링 시 안전성 보장 어려움

**영향:**

- 프로덕션 버그 리스크 증가
- 개발 속도 저하 (수동 검증 시간)
- 배포 신뢰도 낮음

### 솔루션 개요

**Playwright 기반 E2E 테스트 스위트 구축 (MVP 접근)**

**핵심 접근법:**

1. **@playwright/test** 프레임워크 사용 (이미 Playwright 사용 중이므로 호환성 최상)
2. **15-20개 핵심 테스트 시나리오** 구현 (P0 우선순위 + 일부 P1)
3. **Page Object Model** 패턴 적용 (유지보수성)
4. **GitHub Actions CI/CD 통합** (자동 실행)
5. **Chromium 브라우저 우선** (다른 브라우저는 Phase 2)

**점진적 확장 계획:**

- **Phase 1 (현재)**: MVP - 핵심 플로우만 (Chromium)
- **Phase 2 (향후)**: 크로스 브라우저 + Mobile
- **Phase 3 (향후)**: 전체 시나리오 (30-40개)

**작동 방식:**

```
개발자 PR 생성 → GitHub Actions 실행 → Playwright 테스트 실행
                                         ↓
                         테스트 성공 → PR 머지 허용
                         테스트 실패 → 실패 원인 리포트, 수정 후 재시도
```

**로컬 개발:**

```bash
npx playwright test                 # 모든 테스트 실행
npx playwright test --ui            # UI 모드 (디버깅)
npx playwright test auth/           # 특정 폴더만
npx playwright show-report          # 리포트 보기
```

### 변경 유형

**유형**: Feature Addition (기능 추가)

- 새로운 테스트 인프라 구축
- 기존 코드 변경 없음 (읽기 전용 테스트)

---

## 📐 범위 정의

### IN SCOPE (MVP - Phase 1)

**Story 1: 테스트 인프라 & 인증 (P0, 5-7 테스트)**

- ✅ Playwright 설치 (`@playwright/test ^1.40.0`)
- ✅ `playwright.config.ts` 작성 (Chromium만)
- ✅ 테스트 디렉토리 구조 생성 (핵심만)
- ✅ 기본 인증 픽스처
- ✅ `.gitignore` 업데이트
- ✅ 로그인 플로우 (Clerk)
- ✅ 로그아웃 플로우
- ✅ 회원가입 플로우
- ✅ 대시보드 접근 테스트

**Story 2: 프로젝트 CRUD 핵심 (P0 + 일부 P1, 5-7 테스트)**

- ✅ 프로젝트 생성 (필수 필드만)
- ✅ 프로젝트 목록 조회
- ✅ 프로젝트 상세 보기
- ✅ 프로젝트 수정 (기본 필드)
- ✅ 프로젝트 삭제 (확인 모달)
- ✅ 샘플 크롤링 실행 (단일 URL)

**Story 3: Visual Builder 기본 (P1 핵심, 5-6 테스트)**

- ✅ Visual Builder 페이지 로드
- ✅ CSS 셀렉터 필드 추가
- ✅ 필드 테스트 (셀렉터 유효성)
- ✅ 필드 목록 관리 (추가, 삭제)
- ✅ GitHub Actions CI/CD 통합 (Chromium만)

**총 테스트 수: 15-20개** (P0 + 핵심 P1만)

### OUT OF SCOPE (Phase 2/3로 연기)

**Phase 2로 연기:**

- ❌ 크로스 브라우저 (Firefox, WebKit)
- ❌ 모바일 테스트 (Mobile Chrome, Safari)
- ❌ 대시보드 통계 상세 검증
- ❌ 활동 차트 렌더링 테스트
- ❌ Visual Builder AI 추천 기능
- ❌ 다중 URL 크롤링
- ❌ 페이지네이션 처리

**Phase 3로 연기 (Comprehensive):**

- ❌ 30-40개 전체 테스트 시나리오
- ❌ 성능 테스트 (Lighthouse)
- ❌ 부하 테스트 (K6/Artillery)
- ❌ 보안 테스트 (OWASP ZAP)
- ❌ 접근성 자동 테스트 (axe-core)
- ❌ 시각적 회귀 테스트 (Percy/Chromatic)
- ❌ 유닛 테스트 (Jest + React Testing Library)

---

## 🗂️ 소스 트리 변경

### 새로 생성할 파일 (MVP)

```
프로젝트 루트/
├── playwright.config.ts                        # CREATE - Playwright 설정 (Chromium만)
├── .github/
│   └── workflows/
│       └── playwright.yml                       # CREATE - CI/CD 워크플로우
├── tests/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── signin.spec.ts                  # CREATE - 로그인 테스트
│   │   │   ├── signup.spec.ts                  # CREATE - 회원가입 테스트
│   │   │   ├── logout.spec.ts                  # CREATE - 로그아웃 테스트
│   │   │   └── dashboard-access.spec.ts        # CREATE - 대시보드 접근
│   │   ├── projects/
│   │   │   ├── create-project.spec.ts          # CREATE - 프로젝트 생성
│   │   │   ├── list-projects.spec.ts           # CREATE - 프로젝트 목록
│   │   │   ├── view-project.spec.ts            # CREATE - 프로젝트 상세
│   │   │   ├── edit-project.spec.ts            # CREATE - 프로젝트 수정
│   │   │   ├── delete-project.spec.ts          # CREATE - 프로젝트 삭제
│   │   │   └── run-crawling.spec.ts            # CREATE - 크롤링 실행
│   │   └── visual-builder/
│   │       ├── load-page.spec.ts               # CREATE - 페이지 로드
│   │       ├── add-field.spec.ts               # CREATE - 필드 추가
│   │       ├── test-selector.spec.ts           # CREATE - 셀렉터 테스트
│   │       └── manage-fields.spec.ts           # CREATE - 필드 관리
│   ├── fixtures/
│   │   └── auth.ts                             # CREATE - 인증 픽스처
│   ├── pages/
│   │   ├── DashboardPage.ts                    # CREATE - Page Object
│   │   ├── ProjectsPage.ts                     # CREATE - Page Object
│   │   ├── ProjectDetailPage.ts                # CREATE - Page Object
│   │   └── VisualBuilderPage.ts                # CREATE - Page Object
│   └── utils/
│       ├── test-helpers.ts                     # CREATE - 헬퍼 함수
│       └── database-helpers.ts                 # CREATE - DB 헬퍼 (간소화)
└── package.json                                 # MODIFY - devDependencies 추가
```

**총 파일 수: ~15개** (MVP 범위)

- 테스트 파일: 14개 (5-7 auth + 6 projects + 4 visual-builder)
- Page Objects: 4개
- Fixtures/Utils: 3개
- Config: 2개

### 수정할 파일

```
.gitignore                                       # MODIFY - 테스트 결과 제외
package.json                                     # MODIFY - Playwright 의존성 추가
```

**변경 내용 (.gitignore):**

```gitignore
# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
/tests/downloads/
/tests/videos/
/tests/screenshots/
```

**변경 내용 (package.json):**

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0"
  },
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## 🛠️ 기술적 접근

### Playwright 설정 (playwright.config.ts) - MVP

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [['html'], ['json', { outputFile: 'test-results.json' }]],

  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Phase 2: Firefox, WebKit 추가 예정
    // Phase 2: Mobile browsers 추가 예정
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3010',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

**MVP 결정 (간소화):**

- **baseURL**: `http://localhost:3010` (현재 개발 서버 포트)
- **병렬 실행**: 활성화 (빠른 테스트)
- **재시도**: CI에서만 2회 (로컬은 0회)
- **리포터**: HTML, JSON (JUnit은 Phase 2)
- **브라우저**: Chromium만 (다른 브라우저는 Phase 2)
- **webServer**: 자동으로 Next.js 개발 서버 시작

### Page Object Model 패턴

**DashboardPage 예시:**

```typescript
// tests/pages/DashboardPage.ts
import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly statCards: Locator
  readonly totalProjectsCard: Locator
  readonly activityChart: Locator
  readonly recentProjectsList: Locator
  readonly newProjectButton: Locator

  constructor(page: Page) {
    this.page = page
    this.statCards = page.locator('[data-testid="stat-card"]')
    this.totalProjectsCard = page.locator('[data-testid="total-projects"]')
    this.activityChart = page.locator('[data-testid="activity-chart"]')
    this.recentProjectsList = page.locator('[data-testid="recent-projects"]')
    this.newProjectButton = page.locator('button:has-text("새 프로젝트")')
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async getTotalProjects(): Promise<number> {
    const text = await this.totalProjectsCard.textContent()
    return parseInt(text || '0')
  }

  async getStatCardsCount(): Promise<number> {
    return await this.statCards.count()
  }

  async clickNewProject() {
    await this.newProjectButton.click()
  }
}
```

**사용 예:**

```typescript
// tests/e2e/dashboard/stats.spec.ts
import { test, expect } from '@playwright/test'
import { DashboardPage } from '../../pages/DashboardPage'

test('대시보드는 4개의 통계 카드를 표시한다', async ({ page }) => {
  const dashboard = new DashboardPage(page)
  await dashboard.goto()

  const count = await dashboard.getStatCardsCount()
  expect(count).toBe(4)
})
```

### 인증 픽스처

```typescript
// tests/fixtures/auth.ts
import { test as base, Page } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Clerk 로그인 플로우
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')

    // 대시보드로 리다이렉트 대기
    await page.waitForURL('/dashboard')

    await use(page)
  },
})

export { expect } from '@playwright/test'
```

**사용:**

```typescript
import { test, expect } from '../fixtures/auth'

test('인증된 사용자만 대시보드에 접근 가능', async ({ authenticatedPage }) => {
  await expect(authenticatedPage).toHaveURL(/.*dashboard/)
})
```

### 데이터베이스 헬퍼

```typescript
// tests/utils/database-helpers.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL,
})

export async function clearDatabase() {
  await prisma.crawlingTask.deleteMany()
  await prisma.crawlingRun.deleteMany()
  await prisma.project.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
}

export async function createTestProject(userId: string, data: any) {
  return await prisma.project.create({
    data: {
      userId,
      name: data.name || 'Test Project',
      urls: data.urls || ['https://example.com'],
      selectors: data.selectors || { title: 'h1' },
      scheduleType: data.scheduleType || 'manual',
      status: 'active',
    },
  })
}

export async function getProjectStats(userId: string) {
  const totalProjects = await prisma.project.count({ where: { userId } })
  const activeProjects = await prisma.project.count({
    where: { userId, status: 'active' },
  })

  return { totalProjects, activeProjects }
}

export { prisma }
```

---

## 🔌 통합 포인트

### 1. Clerk 인증 통합

- **테스트 환경 변수** (`.env.test`):
  ```env
  TEST_USER_EMAIL=test@example.com
  TEST_USER_PASSWORD=TestPassword123!
  CLERK_SECRET_KEY=sk_test_...
  ```
- **인증 우회 옵션** (선택):
  - Clerk의 테스트 모드 사용
  - 또는 직접 세션 쿠키 설정

### 2. Prisma 데이터베이스 통합

- **테스트 DB 분리**:
  ```env
  TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/flexcrawler_test
  ```
- **각 테스트 전 DB 초기화**:
  ```typescript
  test.beforeEach(async () => {
    await clearDatabase()
  })
  ```

### 3. Next.js 서버 통합

- **playwright.config.ts의 webServer**:
  - 자동으로 `npm run dev` 실행
  - 포트 3010에서 서버 시작 대기
  - 테스트 종료 후 서버 유지 (로컬) 또는 종료 (CI)

### 4. API 엔드포인트 통합

- **직접 API 호출 테스트**:

  ```typescript
  test('프로젝트 API는 유효한 데이터로 프로젝트 생성', async ({ request }) => {
    const response = await request.post('/api/projects', {
      data: {
        name: 'API Test Project',
        urls: ['https://example.com'],
        selectors: { title: 'h1' },
        scheduleType: 'manual',
      },
    })

    expect(response.ok()).toBeTruthy()
    const project = await response.json()
    expect(project.project.name).toBe('API Test Project')
  })
  ```

---

## 💻 개발 컨텍스트

### 참조할 기존 코드

**대시보드 컴포넌트 참조:**

- `src/components/dashboard/StatCard.tsx:13` - 통계 카드 props 구조
- `src/components/dashboard/ActivityChart.tsx:20` - 차트 데이터 형식
- `src/components/dashboard/RecentProjects.tsx:15` - 프로젝트 아이템 구조

**Visual Builder 참조:**

- `src/components/visual-builder/VisualBuilder.tsx:50` - 필드 상태 관리
- `src/components/visual-builder/VisualBuilder.tsx:85` - AI 추천 API 호출
- `src/components/visual-builder/VisualBuilder.tsx:110` - 셀렉터 테스트 로직

**API 엔드포인트 참조:**

- `src/app/api/projects/route.ts:18` - GET /api/projects
- `src/app/api/projects/route.ts:46` - POST /api/projects
- `src/app/api/dashboard/stats/route.ts:10` - GET /api/dashboard/stats
- `src/app/api/projects/[projectId]/run/route.ts:15` - POST /api/projects/:id/run

**크롤링 엔진 참조:**

- `src/lib/crawler/engine.ts:25` - CrawlerEngine 클래스
- `src/lib/crawler/engine.ts:45` - crawl() 메서드
- `src/lib/crawler/engine.ts:75` - extractField() 로직

### 프레임워크 & 라이브러리 (명확한 버전)

**테스트 프레임워크:**

- `@playwright/test`: ^1.40.0
- `@types/node`: ^20.0.0

**기존 프로젝트 스택:**

- `next`: 16.0.1
- `react`: 18.x
- `typescript`: 5.x
- `@clerk/nextjs`: ^6.35.2
- `@prisma/client`: ^6.19.0
- `playwright`: ^1.40.0 (크롤링용)

### 내부 모듈 의존성

**테스트에서 사용할 모듈:**

```typescript
// Prisma 클라이언트
import { prisma } from '@/lib/db/prisma'

// 타입 정의
import type { Project, CrawlingRun } from '@prisma/client'

// 유틸리티
import { cn } from '@/lib/utils'
```

### 설정 변경 사항

**환경 변수 추가 (.env.test):**

```env
# Next.js
DATABASE_URL=postgresql://user:pass@localhost:5432/flexcrawler_test
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Playwright 테스트 계정
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# 테스트 설정
CI=false
NODE_ENV=test
```

**package.json scripts 추가:**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:e2e:codegen": "playwright codegen http://localhost:3010"
  }
}
```

---

## 🎨 기존 패턴 준수

### TypeScript 코딩 스타일

**Import 순서:**

```typescript
// 1. 외부 라이브러리
import { test, expect, Page } from '@playwright/test'
import { prisma } from '@prisma/client'

// 2. 내부 모듈 (@/ 별칭)
import { DashboardPage } from '@/tests/pages/DashboardPage'
import { createTestProject } from '@/tests/utils/database-helpers'

// 3. 타입 import
import type { Project } from '@prisma/client'
```

**함수 스타일:**

```typescript
// 함수형, async/await 사용
async function authenticateUser(page: Page): Promise<void> {
  await page.goto('/sign-in')
  await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!)
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}
```

**에러 처리:**

```typescript
try {
  await page.waitForSelector('[data-testid="result"]', { timeout: 5000 })
} catch (error) {
  throw new Error(`Failed to find result: ${error}`)
}
```

**테스트 작성 패턴:**

```typescript
// Describe 블록으로 그룹화
test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase()
    await authenticateUser(page)
  })

  test('should display 4 stat cards', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    const count = await dashboard.getStatCardsCount()
    expect(count).toBe(4)
  })
})
```

### 셀렉터 전략

**우선순위:**

1. **data-testid** (최우선) - 명시적 테스트용 속성
2. **role + accessible name** - 접근성 기반
3. **text content** - 고정된 텍스트
4. **CSS 클래스** (최후의 수단)

**예시:**

```typescript
// 권장: data-testid
await page.locator('[data-testid="stat-card"]').first()

// 권장: role
await page.getByRole('button', { name: '새 프로젝트' })

// 권장: 텍스트
await page.getByText('총 프로젝트')

// 비권장: CSS 클래스 (변경 가능성 높음)
await page.locator('.stat-card-container')
```

**기존 컴포넌트에 data-testid 추가 필요:**

```typescript
// src/components/dashboard/StatCard.tsx 수정 예시
<Card data-testid="stat-card">
  <CardContent data-testid="stat-value">
    {value}
  </CardContent>
</Card>
```

---

## 📋 구현 스택 (최종)

**런타임:**

- Node.js: 20.x

**테스트 프레임워크:**

- @playwright/test: ^1.40.0
- @types/node: ^20.0.0

**테스트 대상 (기존):**

- Next.js: 16.0.1
- React: 18.x
- TypeScript: 5.x
- @clerk/nextjs: ^6.35.2
- @prisma/client: ^6.19.0

**CI/CD:**

- GitHub Actions
- ubuntu-latest runner

**브라우저:**

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

---

## 🔬 기술 세부사항

### 테스트 격리 전략

**데이터베이스 격리:**

```typescript
// tests/utils/database-helpers.ts
export async function setupTestDatabase() {
  // 테스트 시작 전 DB 초기화
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE projects CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE crawling_runs CASCADE`
}

export async function teardownTestDatabase() {
  await prisma.$disconnect()
}
```

**병렬 실행 격리:**

- Playwright의 worker 메커니즘 활용
- 각 worker는 독립적인 브라우저 컨텍스트 사용
- 데이터 충돌 방지를 위해 고유한 테스트 데이터 생성:
  ```typescript
  const testId = Date.now()
  const testProject = await createTestProject(userId, {
    name: `Test Project ${testId}`,
  })
  ```

### 성능 최적화

**병렬 실행:**

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true, // 모든 테스트 파일 병렬 실행
  workers: process.env.CI ? 1 : undefined, // CI: 순차, 로컬: 병렬
})
```

**목표 실행 시간:**

- 전체 테스트 (30-40개): < 10분
- 개별 테스트: < 30초
- API 테스트: < 5초

### 에러 시나리오 처리

**타임아웃 처리:**

```typescript
test('긴 작업 테스트', async ({ page }) => {
  test.setTimeout(120000) // 2분

  await page.click('button:has-text("크롤링 실행")')
  await page.waitForSelector('[data-testid="results"]', {
    timeout: 90000, // 1.5분
  })
})
```

**네트워크 에러 시뮬레이션:**

```typescript
test('네트워크 실패 시 에러 메시지 표시', async ({ page, context }) => {
  // API 요청 실패 시뮬레이션
  await context.route('**/api/projects', (route) => route.abort())

  await page.click('button:has-text("프로젝트 로드")')
  await expect(page.locator('.error-message')).toBeVisible()
})
```

**플레이키 테스트 방지:**

```typescript
// Bad: 명시적 sleep 사용
await page.waitForTimeout(3000) // ❌

// Good: 조건 기반 대기
await page.waitForSelector('[data-testid="loaded"]') // ✅
await page.waitForLoadState('networkidle') // ✅
```

### 엣지 케이스

**빈 데이터 상태:**

```typescript
test('프로젝트가 없을 때 빈 상태 메시지 표시', async ({ page }) => {
  await clearDatabase()
  await authenticateUser(page)

  const dashboard = new DashboardPage(page)
  await dashboard.goto()

  await expect(page.getByText('프로젝트가 없습니다')).toBeVisible()
})
```

**대용량 데이터:**

```typescript
test('100개 프로젝트 로딩 테스트', async ({ page }) => {
  // 100개 프로젝트 생성
  for (let i = 0; i < 100; i++) {
    await createTestProject(userId, { name: `Project ${i}` })
  }

  await page.goto('/dashboard')

  // 페이지네이션 또는 무한 스크롤 확인
  const projects = page.locator('[data-testid="project-item"]')
  await expect(projects).toHaveCount(10) // 첫 페이지 10개
})
```

---

## 🚀 개발 설정

### 로컬 개발 환경 설정

**1. 의존성 설치:**

```bash
# Playwright 설치
npm install -D @playwright/test @types/node

# Playwright 브라우저 설치
npx playwright install
npx playwright install-deps  # 시스템 의존성
```

**2. 환경 변수 설정:**

```bash
# .env.test 파일 생성
cp .env.example .env.test

# 필수 변수 입력
# - TEST_DATABASE_URL
# - TEST_USER_EMAIL
# - TEST_USER_PASSWORD
# - CLERK_SECRET_KEY
```

**3. 테스트 DB 준비:**

```bash
# PostgreSQL 테스트 DB 생성
createdb flexcrawler_test

# Prisma 마이그레이션 적용
DATABASE_URL=postgresql://...  flexcrawler_test npx prisma migrate deploy
```

**4. 개발 서버 시작 (자동):**

```bash
# Playwright가 자동으로 시작
npx playwright test

# 또는 수동으로 시작
npm run dev  # 다른 터미널에서
```

**5. 테스트 실행:**

```bash
# 모든 테스트
npm run test:e2e

# UI 모드 (추천)
npm run test:e2e:ui

# 헤드풀 모드 (브라우저 보면서)
npm run test:e2e:headed

# 디버그 모드
npm run test:e2e:debug

# 특정 파일만
npx playwright test tests/e2e/dashboard/stats.spec.ts

# 특정 브라우저만
npx playwright test --project=chromium
```

**6. 리포트 확인:**

```bash
npm run test:e2e:report
# 브라우저에서 HTML 리포트 열림
```

---

## 📖 구현 가이드

### 설정 단계 (Setup)

**Pre-implementation Checklist:**

- [ ] Playwright 패키지 설치 확인 (`npm list @playwright/test`)
- [ ] `.env.test` 파일 작성 완료
- [ ] 테스트 DB 생성 및 마이그레이션 적용
- [ ] 테스트 계정 생성 (Clerk)
- [ ] 개발 서버 정상 작동 확인 (`http://localhost:3010`)

### 구현 순서 (MVP - 3 Stories)

**Story 1: 테스트 인프라 & 인증 (P0, 5-7 테스트)**

1. Playwright 설치 및 `playwright.config.ts` 작성 (Chromium만)
2. 디렉토리 구조 생성 (`tests/e2e/`, `tests/pages/`, `tests/fixtures/`, `tests/utils/`)
3. 인증 픽스처 작성 (`fixtures/auth.ts`)
4. 기본 헬퍼 함수 작성 (`utils/test-helpers.ts`, `utils/database-helpers.ts`)
5. `.gitignore` 업데이트
6. Page Object: `DashboardPage.ts` 작성
7. 인증 테스트 작성:
   - `auth/signin.spec.ts` (로그인)
   - `auth/signup.spec.ts` (회원가입)
   - `auth/logout.spec.ts` (로그아웃)
   - `auth/dashboard-access.spec.ts` (대시보드 접근)
8. 모든 인증 테스트 통과 확인

**Story 2: 프로젝트 CRUD (P0 + 일부 P1, 5-7 테스트)**

1. Page Object: `ProjectsPage.ts`, `ProjectDetailPage.ts` 작성
2. 프로젝트 관리 테스트 작성:
   - `projects/create-project.spec.ts` (프로젝트 생성)
   - `projects/list-projects.spec.ts` (프로젝트 목록)
   - `projects/view-project.spec.ts` (프로젝트 상세)
   - `projects/edit-project.spec.ts` (프로젝트 수정)
   - `projects/delete-project.spec.ts` (프로젝트 삭제)
   - `projects/run-crawling.spec.ts` (크롤링 실행)
3. 모든 프로젝트 테스트 통과 확인

**Story 3: Visual Builder & CI/CD (P1, 5-6 테스트)**

1. Page Object: `VisualBuilderPage.ts` 작성
2. Visual Builder 테스트 작성:
   - `visual-builder/load-page.spec.ts` (페이지 로드)
   - `visual-builder/add-field.spec.ts` (필드 추가)
   - `visual-builder/test-selector.spec.ts` (셀렉터 테스트)
   - `visual-builder/manage-fields.spec.ts` (필드 관리)
3. GitHub Actions 워크플로우 작성 (`.github/workflows/playwright.yml`)
4. CI 파이프라인 통합 및 검증
5. 전체 테스트 통과 확인 (15-20개 모두)

### 테스트 전략

**단위별 테스트 범위:**

**E2E 테스트 (tests/e2e/):**

- 전체 사용자 플로우 검증
- 실제 브라우저에서 실행
- 데이터베이스 포함 통합 테스트

**통합 테스트 (tests/integration/):**

- API 엔드포인트 직접 호출
- 데이터베이스 상태 검증
- 빠른 실행 (브라우저 불필요)

**픽스처 (tests/fixtures/):**

- 공통 설정 재사용
- 인증 상태 자동 처리
- 테스트 데이터 제공

**테스트 작성 순서:**

1. 가장 중요한 플로우부터 (P0)
2. Happy path → Error cases
3. 개별 기능 → 통합 시나리오

### Acceptance Criteria (완료 조건) - MVP

**Story 1: 테스트 인프라 & 인증 완료 조건:**

- [ ] Playwright 설치 완료 및 `playwright.config.ts` 작성 (Chromium만)
- [ ] 테스트 디렉토리 구조 생성 완료
- [ ] 인증 픽스처 (`auth.ts`) 작동 확인
- [ ] 데이터베이스 헬퍼 작성 및 테스트
- [ ] `.gitignore` 업데이트 완료
- [ ] `DashboardPage` Page Object 작성
- [ ] 인증 테스트 4개 모두 통과:
  - 로그인, 회원가입, 로그아웃, 대시보드 접근
- [ ] 로컬에서 테스트 실행 가능 (`npm run test:e2e`)

**Story 2: 프로젝트 CRUD 완료 조건:**

- [ ] `ProjectsPage`, `ProjectDetailPage` Page Object 작성
- [ ] 프로젝트 관리 테스트 6개 모두 통과:
  - 생성, 목록, 상세, 수정, 삭제, 크롤링 실행
- [ ] 모든 CRUD 플로우 정상 작동
- [ ] 테스트 격리 확인 (각 테스트 독립 실행 가능)

**Story 3: Visual Builder & CI/CD 완료 조건:**

- [ ] `VisualBuilderPage` Page Object 작성
- [ ] Visual Builder 테스트 4개 모두 통과:
  - 페이지 로드, 필드 추가, 셀렉터 테스트, 필드 관리
- [ ] GitHub Actions 워크플로우 작성 완료
- [ ] CI 파이프라인에서 테스트 자동 실행 확인
- [ ] PR 체크 연동 작동 확인
- [ ] Chromium에서 모든 테스트 통과 (15-20개)
- [ ] 테스트 성공률 >= 95%
- [ ] 평균 실행 시간 < 5분 (MVP 범위, Chromium만)

---

## 📂 개발 리소스

### 파일 경로 참조 (Complete)

**테스트 파일:**

```
tests/
├── e2e/
│   ├── auth/signin.spec.ts
│   ├── auth/signup.spec.ts
│   ├── auth/logout.spec.ts
│   ├── dashboard/stats.spec.ts
│   ├── dashboard/activity-chart.spec.ts
│   ├── dashboard/recent-projects.spec.ts
│   ├── dashboard/navigation.spec.ts
│   ├── projects/create-project.spec.ts
│   ├── projects/edit-project.spec.ts
│   ├── projects/delete-project.spec.ts
│   ├── projects/run-crawling.spec.ts
│   ├── visual-builder/load-preview.spec.ts
│   ├── visual-builder/ai-suggestions.spec.ts
│   ├── visual-builder/selector-test.spec.ts
│   ├── visual-builder/field-management.spec.ts
│   ├── visual-builder/save-fields.spec.ts
│   ├── crawler/basic-crawl.spec.ts
│   ├── crawler/multiple-urls.spec.ts
│   ├── crawler/pagination.spec.ts
│   └── crawler/error-handling.spec.ts
├── integration/api/projects-api.spec.ts
├── integration/api/crawling-api.spec.ts
├── integration/api/stats-api.spec.ts
├── fixtures/auth.ts
├── fixtures/projects.ts
├── fixtures/crawl-data.ts
├── pages/DashboardPage.ts
├── pages/ProjectCreatePage.ts
├── pages/ProjectDetailPage.ts
├── pages/VisualBuilderPage.ts
└── utils/test-helpers.ts
```

**기존 소스 참조:**

```
src/
├── app/(dashboard)/dashboard/page.tsx
├── app/(dashboard)/dashboard/new/page.tsx
├── app/(dashboard)/dashboard/visual-builder-demo/page.tsx
├── app/(dashboard)/dashboard/projects/[projectId]/page.tsx
├── app/api/projects/route.ts
├── app/api/dashboard/stats/route.ts
├── components/dashboard/StatCard.tsx
├── components/dashboard/ActivityChart.tsx
├── components/visual-builder/VisualBuilder.tsx
└── lib/crawler/engine.ts
```

### 주요 코드 위치

**대시보드 관련:**

- `DashboardPage` 컴포넌트: `src/app/(dashboard)/dashboard/page.tsx:39`
- `StatCard` 컴포넌트: `src/components/dashboard/StatCard.tsx:13`
- `ActivityChart` 데이터 형식: `src/components/dashboard/ActivityChart.tsx:6-10`
- 통계 API: `src/app/api/dashboard/stats/route.ts:10`

**프로젝트 관리:**

- 프로젝트 생성 챗봇: `src/app/(dashboard)/dashboard/new/page.tsx:36`
- 프로젝트 API (GET): `src/app/api/projects/route.ts:18`
- 프로젝트 API (POST): `src/app/api/projects/route.ts:46`
- 크롤링 실행 API: `src/app/api/projects/[projectId]/run/route.ts:15`

**Visual Builder:**

- VisualBuilder 컴포넌트: `src/components/visual-builder/VisualBuilder.tsx:25`
- AI 추천 함수: `src/components/visual-builder/VisualBuilder.tsx:85`
- 셀렉터 테스트 함수: `src/components/visual-builder/VisualBuilder.tsx:110`

**크롤링 엔진:**

- CrawlerEngine 클래스: `src/lib/crawler/engine.ts:13`
- crawl 메서드: `src/lib/crawler/engine.ts:25`
- extractField 메서드: `src/lib/crawler/engine.ts:75`

### 테스트 위치

**E2E 테스트:**

- 인증: `tests/e2e/auth/`
- 대시보드: `tests/e2e/dashboard/`
- 프로젝트: `tests/e2e/projects/`
- Visual Builder: `tests/e2e/visual-builder/`
- 크롤링: `tests/e2e/crawler/`

**통합 테스트:**

- API: `tests/integration/api/`

**헬퍼 & 유틸리티:**

- 픽스처: `tests/fixtures/`
- Page Objects: `tests/pages/`
- 유틸리티: `tests/utils/`

### 업데이트할 문서

**README.md 업데이트:**

```markdown
## 테스트 실행

### E2E 테스트

\`\`\`bash

# 모든 테스트 실행

npm run test:e2e

# UI 모드 (권장)

npm run test:e2e:ui

# 특정 브라우저만

npx playwright test --project=chromium
\`\`\`

### 테스트 작성

- Page Object Model 패턴 사용
- `tests/pages/` 디렉토리에 Page 클래스 작성
- `data-testid` 속성 사용 권장
```

**CONTRIBUTING.md 업데이트:**

```markdown
## Pull Request 체크리스트

- [ ] 모든 E2E 테스트 통과
- [ ] 새로운 기능에 대한 테스트 추가
- [ ] CI 파이프라인 통과
```

**package.json scripts 문서화:**

```json
{
  "scripts": {
    "test:e2e": "모든 E2E 테스트 실행",
    "test:e2e:ui": "UI 모드로 테스트 실행 (디버깅 용이)",
    "test:e2e:headed": "브라우저 보면서 테스트",
    "test:e2e:debug": "디버그 모드 (단계별 실행)",
    "test:e2e:report": "HTML 리포트 보기"
  }
}
```

---

## 🎨 UX/UI 고려사항

**UI 영향:** 없음 (테스트 코드만 추가, 기존 UI 변경 없음)

**단, 테스트 안정성을 위한 마이너 수정 필요:**

### data-testid 속성 추가 권장

**현재 컴포넌트에 추가:**

```typescript
// src/components/dashboard/StatCard.tsx
<Card data-testid="stat-card">
  <CardContent data-testid={`stat-${title.toLowerCase().replace(' ', '-')}`}>
    {value}
  </CardContent>
</Card>

// src/components/dashboard/ActivityChart.tsx
<Card data-testid="activity-chart">
  {/* ... */}
</Card>

// src/components/visual-builder/VisualBuilder.tsx
<div data-testid="visual-builder">
  <Button data-testid="load-preview-btn">페이지 로드</Button>
  <Button data-testid="ai-suggest-btn">AI 추천</Button>
</div>
```

**장점:**

- 테스트 안정성 향상 (CSS 변경에 무관)
- 명시적인 테스트 포인트
- 유지보수 용이

**영향:**

- 사용자에게 보이지 않음
- 번들 사이즈 영향 미미 (< 1KB)
- 프로덕션 빌드에서도 유지 (접근성 도구에도 유용)

---

## 🧪 테스트 접근법

### 테스트 프레임워크 정보

**@playwright/test**: ^1.40.0

- Playwright Test Runner (공식)
- 내장된 assertion 라이브러리
- Page Object Model 지원
- 픽스처 메커니즘
- 병렬 실행 최적화
- 자동 재시도 (flaky test 대응)
- 다중 브라우저 지원

### 테스트 전략 (상세)

**P0 테스트 (필수, 배포 블로킹):**

1. 로그인/로그아웃
2. 프로젝트 생성
3. 샘플 크롤링 실행
4. 대시보드 통계 표시

**P1 테스트 (중요, 회귀 방지):** 5. Visual Builder 기능 6. 활동 차트 7. 프로젝트 수정/삭제 8. 다중 URL 크롤링

**P2 테스트 (개선):** 9. 페이지네이션 10. 크로스 브라우저 11. 모바일 반응형 12. 에러 핸들링

### 커버리지

**목표:**

- **E2E 커버리지**: 주요 사용자 플로우 90%
- **API 커버리지**: 모든 엔드포인트 100%
- **통합 테스트**: 크리티컬 패스 95%

**측정:**

```bash
# Playwright에는 내장 커버리지 없음
# Istanbul/c8 통합 필요 (별도 작업)
```

**우선순위:**

1. Happy path 100%
2. 주요 에러 케이스 80%
3. 엣지 케이스 50%

---

## 🚢 배포 전략

### 배포 단계

**단계별 배포:**

**1. 로컬 개발 환경 검증**

```bash
# 모든 테스트 통과 확인
npm run test:e2e

# 리포트 확인
npm run test:e2e:report
```

**2. Feature 브랜치 생성**

```bash
git checkout -b feature/playwright-e2e-tests
git add .
git commit -m "Add Playwright E2E test suite

- Set up Playwright with 30+ test scenarios
- Implement Page Object Model pattern
- Add CI/CD integration with GitHub Actions
- Configure cross-browser testing"
git push origin feature/playwright-e2e-tests
```

**3. Pull Request 생성**

- PR 생성 시 GitHub Actions 자동 실행
- 모든 테스트 통과 확인
- 리뷰어 코드 리뷰

**4. Main 브랜치 병합**

```bash
git checkout main
git merge feature/playwright-e2e-tests
git push origin main
```

**5. 향후 PR마다 자동 실행**

- 모든 PR에서 테스트 자동 실행
- 테스트 실패 시 머지 차단
- Quality Gate 역할

### 롤백 계획

**테스트 추가는 기존 기능에 영향 없음**

- 롤백 불필요 (코드만 추가, 변경 없음)
- 단, CI 파이프라인에서 문제 발생 시:

**롤백 단계:**

1. `.github/workflows/playwright.yml` 파일 삭제 또는 비활성화
2. `playwright.config.ts` 제거
3. `tests/` 디렉토리 제거
4. `package.json`에서 Playwright devDependencies 제거
5. 커밋 revert

**롤백 명령:**

```bash
git revert <commit-hash>
git push origin main
```

### 모니터링

**CI/CD 모니터링:**

- GitHub Actions 실행 로그 확인
- 테스트 성공/실패율 추적
- 평균 실행 시간 모니터링

**메트릭:**

- 테스트 성공률: 목표 95% 이상
- 평균 실행 시간: 목표 < 10분
- Flaky test 비율: 목표 < 5%

**알림:**

- GitHub Actions 실패 시 PR 작성자에게 자동 알림
- Slack/Discord 통합 (선택 사항)

---

## ✅ 검증 체크리스트

### 구현 완료 검증

**인프라:**

- [ ] Playwright 설치 완료
- [ ] `playwright.config.ts` 작성
- [ ] 테스트 디렉토리 구조 생성
- [ ] `.env.test` 설정 완료

**테스트 파일:**

- [ ] 인증 테스트 3개
- [ ] 대시보드 테스트 4개
- [ ] 프로젝트 관리 테스트 4개
- [ ] Visual Builder 테스트 5개
- [ ] 크롤링 테스트 4개
- [ ] API 통합 테스트 3개

**패턴 & 헬퍼:**

- [ ] Page Object Model 구현
- [ ] 인증 픽스처 작성
- [ ] 데이터베이스 헬퍼 작성
- [ ] 테스트 유틸리티 작성

**CI/CD:**

- [ ] GitHub Actions 워크플로우 작성
- [ ] PR 체크 연동 확인
- [ ] 아티팩트 업로드 설정

**실행 검증:**

- [ ] 로컬에서 모든 테스트 통과
- [ ] 5개 브라우저 프로젝트 모두 통과
- [ ] CI 환경에서 테스트 통과
- [ ] 평균 실행 시간 < 10분
- [ ] 테스트 성공률 >= 95%

---

## 📊 성공 지표 (MVP)

**정량적 지표:**

1. ✅ **15-20개 핵심 테스트 구현 완료**
2. ✅ **테스트 성공률 95% 이상**
3. ✅ **평균 실행 시간 < 5분** (Chromium만)
4. ✅ **Flaky test < 5%**
5. ✅ **모든 P0 테스트 100% 통과**
6. ✅ **Chromium 브라우저 지원** (Phase 2에서 확장)

**정성적 지표:**

1. ✅ 개발자가 테스트 작성/실행에 자신감
2. ✅ PR 리뷰 시 테스트 결과 신뢰
3. ✅ 회귀 버그 조기 발견 (핵심 플로우)
4. ✅ 배포 프로세스 개선

**향후 확장 (Phase 2/3):**

- Phase 2: 크로스 브라우저 (Firefox, WebKit) + Mobile
- Phase 3: 30-40개 전체 테스트 시나리오

---

이 기술 명세서는 Playwright E2E 테스트 MVP 구현의 완전한 청사진입니다. 개발자는 이 문서만으로 구현을 시작할 수 있습니다.

**MVP 접근의 장점:**

- ✅ **빠른 배포**: 3주 이내 구현 가능
- ✅ **핵심 커버리지**: P0 + 중요 P1 100% 커버
- ✅ **점진적 확장**: Phase 2/3로 자연스럽게 확장
- ✅ **즉각적 가치**: CI/CD 통합으로 즉시 품질 향상
