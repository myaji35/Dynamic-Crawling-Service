# Playwright E2E 테스트 계획서

## 📋 개요

**프로젝트**: Dynamic Crawling Service (FlexCrawler)
**테스트 프레임워크**: Playwright
**작성일**: 2025-11-23
**목적**: 대시보드, Visual Builder, 크롤링 엔진의 E2E 테스트 자동화

---

## 🎯 테스트 목표

### 1차 목표 (MVP)

- ✅ 사용자 인증 플로우 테스트
- ✅ 대시보드 통계 표시 검증
- ✅ 프로젝트 생성/수정/삭제 플로우
- ✅ Visual Builder 기본 동작
- ✅ 크롤링 실행 및 결과 검증

### 2차 목표 (확장)

- 🔄 복잡한 셀렉터 시나리오
- 🔄 페이지네이션 처리
- 🔄 에러 핸들링
- 🔄 성능 테스트
- 🔄 크로스 브라우저 테스트

---

## 🏗️ 테스트 구조

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── signin.spec.ts           # 로그인 테스트
│   │   ├── signup.spec.ts           # 회원가입 테스트
│   │   └── logout.spec.ts           # 로그아웃 테스트
│   ├── dashboard/
│   │   ├── stats.spec.ts            # 통계 카드 표시
│   │   ├── activity-chart.spec.ts   # 활동 차트
│   │   ├── recent-projects.spec.ts  # 최근 프로젝트 목록
│   │   └── navigation.spec.ts       # 네비게이션
│   ├── projects/
│   │   ├── create-project.spec.ts   # 프로젝트 생성
│   │   ├── edit-project.spec.ts     # 프로젝트 수정
│   │   ├── delete-project.spec.ts   # 프로젝트 삭제
│   │   └── run-crawling.spec.ts     # 크롤링 실행
│   ├── visual-builder/
│   │   ├── load-preview.spec.ts     # 페이지 프리뷰
│   │   ├── ai-suggestions.spec.ts   # AI 추천
│   │   ├── selector-test.spec.ts    # 셀렉터 테스트
│   │   ├── field-management.spec.ts # 필드 추가/제거
│   │   └── save-fields.spec.ts      # 필드 저장
│   └── crawler/
│       ├── basic-crawl.spec.ts      # 기본 크롤링
│       ├── multiple-urls.spec.ts    # 다중 URL
│       ├── pagination.spec.ts       # 페이지네이션
│       └── error-handling.spec.ts   # 에러 처리
├── integration/
│   ├── api/
│   │   ├── projects-api.spec.ts     # 프로젝트 API
│   │   ├── crawling-api.spec.ts     # 크롤링 API
│   │   └── stats-api.spec.ts        # 통계 API
│   └── database/
│       └── prisma.spec.ts           # 데이터베이스 통합
├── fixtures/
│   ├── auth.ts                      # 인증 픽스처
│   ├── projects.ts                  # 프로젝트 테스트 데이터
│   └── crawl-data.ts                # 크롤링 샘플 데이터
├── utils/
│   ├── test-helpers.ts              # 헬퍼 함수
│   ├── mock-server.ts               # 목 서버
│   └── database-seeder.ts           # DB 시드
└── playwright.config.ts             # Playwright 설정
```

---

## 🧪 주요 테스트 시나리오

### 1. 인증 플로우

#### 1.1 로그인 테스트

```typescript
// tests/e2e/auth/signin.spec.ts
test('사용자는 올바른 자격증명으로 로그인할 수 있다', async ({ page }) => {
  await page.goto('http://localhost:3010')

  // Clerk 로그인 버튼 클릭
  await page.click('text=Sign In')

  // 이메일/비밀번호 입력
  await page.fill('input[name="identifier"]', 'test@example.com')
  await page.fill('input[name="password"]', 'TestPassword123!')
  await page.click('button[type="submit"]')

  // 대시보드로 리다이렉트 확인
  await expect(page).toHaveURL(/.*dashboard/)
  await expect(page.locator('h1')).toContainText('대시보드')
})

test('잘못된 자격증명으로 로그인 시 에러 메시지 표시', async ({ page }) => {
  await page.goto('http://localhost:3010')
  await page.click('text=Sign In')

  await page.fill('input[name="identifier"]', 'wrong@example.com')
  await page.fill('input[name="password"]', 'wrong')
  await page.click('button[type="submit"]')

  // 에러 메시지 확인
  await expect(page.locator('.error-message')).toBeVisible()
})
```

### 2. 대시보드 테스트

#### 2.1 통계 카드 표시

```typescript
// tests/e2e/dashboard/stats.spec.ts
test('대시보드는 4개의 통계 카드를 표시한다', async ({ page }) => {
  await authenticateUser(page) // 헬퍼 함수
  await page.goto('http://localhost:3010/dashboard')

  // 통계 카드 확인
  const statCards = page.locator('[data-testid="stat-card"]')
  await expect(statCards).toHaveCount(4)

  // 각 카드 내용 검증
  await expect(page.locator('text=총 프로젝트')).toBeVisible()
  await expect(page.locator('text=총 실행 횟수')).toBeVisible()
  await expect(page.locator('text=성공한 실행')).toBeVisible()
  await expect(page.locator('text=성공률')).toBeVisible()
})

test('통계 카드는 실제 데이터를 표시한다', async ({ page }) => {
  // 테스트 프로젝트 생성
  await createTestProject(page, {
    name: '테스트 프로젝트',
    urls: ['https://example.com'],
  })

  await page.goto('http://localhost:3010/dashboard')

  // 프로젝트 카운트 확인 (최소 1개)
  const projectCount = await page
    .locator('[data-testid="total-projects"]')
    .textContent()
  expect(parseInt(projectCount!)).toBeGreaterThanOrEqual(1)
})
```

#### 2.2 활동 차트

```typescript
// tests/e2e/dashboard/activity-chart.spec.ts
test('활동 차트는 최근 7일 데이터를 표시한다', async ({ page }) => {
  await authenticateUser(page)
  await page.goto('http://localhost:3010/dashboard')

  // 차트 컨테이너 확인
  const activityChart = page.locator('[data-testid="activity-chart"]')
  await expect(activityChart).toBeVisible()

  // 7개의 날짜 바 확인
  const dateBars = activityChart.locator('.date-bar')
  await expect(dateBars).toHaveCount(7)

  // 범례 확인
  await expect(page.locator('text=성공')).toBeVisible()
  await expect(page.locator('text=실패')).toBeVisible()
  await expect(page.locator('text=실행 중')).toBeVisible()
})
```

### 3. 프로젝트 관리

#### 3.1 프로젝트 생성

```typescript
// tests/e2e/projects/create-project.spec.ts
test('사용자는 챗봇을 통해 새 프로젝트를 생성할 수 있다', async ({ page }) => {
  await authenticateUser(page)
  await page.goto('http://localhost:3010/dashboard/new')

  // 프로젝트 이름 입력
  await page.fill('input[placeholder*="메시지"]', '테스트 프로젝트')
  await page.click('button:has-text("전송")')

  // 봇 응답 대기
  await page.waitForSelector('text=URL을 알려주세요')

  // URL 입력
  await page.fill('input[placeholder*="메시지"]', 'https://books.toscrape.com')
  await page.click('button:has-text("전송")')

  // 필드 추가
  await page.waitForSelector('text=필드의 이름을 알려주세요')
  await page.fill('input[placeholder*="메시지"]', '제목')
  await page.click('button:has-text("전송")')

  await page.waitForSelector('text="제목" 필드를 추가했습니다')
  await page.fill('input[placeholder*="메시지"]', '완료')
  await page.click('button:has-text("전송")')

  // 스케줄 선택
  await page.waitForSelector('text=크롤링 주기를 선택해주세요')
  await page.fill('input[placeholder*="메시지"]', '1')
  await page.click('button:has-text("전송")')

  // 프로젝트 생성 확인
  await expect(page).toHaveURL(/.*projects\/[a-z0-9]+/)
  await expect(
    page.locator('text=프로젝트가 성공적으로 생성되었습니다')
  ).toBeVisible()
})
```

### 4. Visual Builder

#### 4.1 페이지 프리뷰

```typescript
// tests/e2e/visual-builder/load-preview.spec.ts
test('Visual Builder는 대상 URL을 프리뷰한다', async ({ page }) => {
  await authenticateUser(page)
  await page.goto('http://localhost:3010/dashboard/visual-builder-demo')

  // URL 입력
  await page.fill('input[id="url"]', 'https://books.toscrape.com')

  // 페이지 로드 버튼 클릭
  await page.click('button:has-text("페이지 로드")')

  // 로딩 상태 확인
  await expect(page.locator('text=로딩 중...')).toBeVisible()

  // 프리뷰 로드 완료 대기
  await page.waitForSelector('[data-testid="page-preview"]', { timeout: 30000 })

  // 프리뷰가 표시되는지 확인
  const preview = page.locator('[data-testid="page-preview"]')
  await expect(preview).toBeVisible()
})
```

#### 4.2 AI 셀렉터 추천

```typescript
// tests/e2e/visual-builder/ai-suggestions.spec.ts
test('AI 추천은 자동으로 필드를 감지한다', async ({ page }) => {
  await authenticateUser(page)
  await page.goto('http://localhost:3010/dashboard/visual-builder-demo')

  await page.fill('input[id="url"]', 'https://books.toscrape.com')

  // AI 추천 버튼 클릭
  await page.click('button:has-text("AI 추천")')

  // 추천 결과 대기
  await page.waitForSelector('[data-testid="suggestion-item"]', {
    timeout: 60000,
  })

  // 최소 1개 이상의 추천 확인
  const suggestions = page.locator('[data-testid="suggestion-item"]')
  const count = await suggestions.count()
  expect(count).toBeGreaterThan(0)

  // 추천 항목 구조 확인
  const firstSuggestion = suggestions.first()
  await expect(firstSuggestion.locator('.field-name')).toBeVisible()
  await expect(firstSuggestion.locator('.selector')).toBeVisible()
  await expect(firstSuggestion.locator('.sample-value')).toBeVisible()
  await expect(firstSuggestion.locator('.confidence')).toBeVisible()
})
```

#### 4.3 셀렉터 테스트

```typescript
// tests/e2e/visual-builder/selector-test.spec.ts
test('사용자는 셀렉터를 테스트할 수 있다', async ({ page }) => {
  await authenticateUser(page)
  await page.goto('http://localhost:3010/dashboard/visual-builder-demo')

  // 필드 입력
  await page.fill('input[id="fieldName"]', '제목')
  await page.fill('input[id="selector"]', 'h3 a')

  // 테스트 버튼 클릭
  await page.click('button:has-text("테스트")')

  // 테스트 진행 중 표시
  await expect(page.locator('text=테스트 중...')).toBeVisible()

  // 결과 확인
  await page.waitForSelector('[data-testid="test-result"]', { timeout: 10000 })
  const result = page.locator('[data-testid="test-result"]')

  // 성공 아이콘 또는 샘플 값 확인
  await expect(result.locator('.success-icon, .sample-value')).toBeVisible()
})
```

### 5. 크롤링 실행

#### 5.1 기본 크롤링

```typescript
// tests/e2e/crawler/basic-crawl.spec.ts
test('프로젝트는 샘플 크롤링을 실행할 수 있다', async ({ page }) => {
  await authenticateUser(page)

  // 테스트 프로젝트 생성
  const projectId = await createTestProject(page, {
    name: '크롤링 테스트',
    urls: ['https://books.toscrape.com'],
    selectors: {
      title: 'h3 a',
      price: '.price_color',
    },
  })

  await page.goto(`http://localhost:3010/dashboard/projects/${projectId}`)

  // 샘플 크롤링 실행
  await page.click('button:has-text("샘플 크롤링 실행")')

  // 실행 중 상태 확인
  await expect(page.locator('text=실행 중...')).toBeVisible()

  // 결과 대기 (최대 2분)
  await page.waitForSelector('[data-testid="crawl-results"]', {
    timeout: 120000,
  })

  // 결과 테이블 확인
  const resultsTable = page.locator('[data-testid="crawl-results"] table')
  await expect(resultsTable).toBeVisible()

  // 데이터 행 확인 (최소 1개)
  const rows = resultsTable.locator('tbody tr')
  const rowCount = await rows.count()
  expect(rowCount).toBeGreaterThan(0)

  // 첫 번째 행에 title과 price 데이터 확인
  const firstRow = rows.first()
  await expect(firstRow.locator('td').nth(0)).not.toBeEmpty()
  await expect(firstRow.locator('td').nth(1)).not.toBeEmpty()
})
```

---

## 🛠️ 설정 파일

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }],
  ],

  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3010',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

---

## 📦 필요한 패키지

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0"
  }
}
```

설치 명령:

```bash
npm install -D @playwright/test @types/node
npx playwright install
```

---

## 🚀 실행 방법

### 전체 테스트 실행

```bash
npx playwright test
```

### 특정 파일만 실행

```bash
npx playwright test tests/e2e/dashboard/stats.spec.ts
```

### UI 모드로 실행 (디버깅)

```bash
npx playwright test --ui
```

### 특정 브라우저에서만 실행

```bash
npx playwright test --project=chromium
```

### 헤드풀 모드 (브라우저 보면서 실행)

```bash
npx playwright test --headed
```

### 리포트 보기

```bash
npx playwright show-report
```

---

## 🎯 테스트 우선순위

### High Priority (P0)

1. ✅ 사용자 로그인/로그아웃
2. ✅ 프로젝트 생성
3. ✅ 기본 크롤링 실행
4. ✅ 대시보드 통계 표시

### Medium Priority (P1)

5. 🔄 Visual Builder AI 추천
6. 🔄 셀렉터 테스트
7. 🔄 프로젝트 수정/삭제
8. 🔄 활동 차트

### Low Priority (P2)

9. ⏳ 다중 URL 크롤링
10. ⏳ 페이지네이션
11. ⏳ 에러 핸들링
12. ⏳ 크로스 브라우저 테스트

---

## 📊 커버리지 목표

- **E2E 테스트**: 주요 사용자 플로우 90% 커버
- **API 테스트**: 모든 엔드포인트 100% 커버
- **통합 테스트**: 크리티컬 패스 95% 커버

---

## 🔄 CI/CD 통합

### GitHub Actions 예시

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 📝 베스트 프랙티스

### 1. Page Object Model 사용

```typescript
// tests/pages/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
  }

  async getStatCards() {
    return this.page.locator('[data-testid="stat-card"]')
  }

  async getTotalProjects() {
    const text = await this.page
      .locator('[data-testid="total-projects"]')
      .textContent()
    return parseInt(text!)
  }
}
```

### 2. 재사용 가능한 픽스처

```typescript
// tests/fixtures/auth.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // 자동 로그인
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'test@example.com')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await use(page)
  },
})
```

### 3. 데이터 격리

- 각 테스트는 독립적으로 실행
- 테스트 전에 DB 초기화
- 테스트 후 생성된 데이터 정리

### 4. 안정적인 셀렉터 사용

- `data-testid` 속성 사용 권장
- CSS 클래스명보다 의미 있는 속성 선호
- 텍스트 기반 셀렉터는 최소화

---

## 🐛 트러블슈팅

### 타임아웃 에러

```typescript
// 타임아웃 늘리기
test('긴 작업', async ({ page }) => {
  test.setTimeout(120000) // 2분
  // ...
})
```

### 불안정한 테스트

```typescript
// 명시적 대기 사용
await page.waitForSelector('[data-testid="result"]')
await page.waitForLoadState('networkidle')
```

### Clerk 인증 문제

- 테스트 환경에 Clerk 테스트 키 설정
- 또는 인증 우회 메커니즘 구현

---

이 문서는 FlexCrawler의 Playwright E2E 테스트 기반을 제공합니다. 다음 단계는 BMAD 워크플로우를 통해 상세한 구현 계획을 수립하는 것입니다.
