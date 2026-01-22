# Story 1: 테스트 인프라 & 인증

**Status**: TODO
**Priority**: P0
**Estimated Effort**: 3-4일
**Story Points**: 5

---

## 📋 User Story

**As a** 개발자
**I want** Playwright E2E 테스트 인프라와 인증 플로우 테스트를 구축하고
**So that** 핵심 사용자 인증 플로우의 정확성을 자동으로 검증할 수 있다

---

## 🎯 Goals

1. Playwright 테스트 프레임워크 설치 및 설정 완료
2. 테스트 디렉토리 구조 생성
3. 인증 픽스처 및 헬퍼 함수 구현
4. Clerk 기반 인증 플로우 E2E 테스트 작성 (4개)
5. 로컬 환경에서 테스트 실행 가능

---

## 📐 Scope

### IN SCOPE

**인프라 설정:**

- ✅ Playwright 설치 (`@playwright/test ^1.40.0`)
- ✅ `playwright.config.ts` 작성 (Chromium만)
- ✅ 테스트 디렉토리 구조 생성:
  - `tests/e2e/auth/`
  - `tests/pages/`
  - `tests/fixtures/`
  - `tests/utils/`
- ✅ `.gitignore` 업데이트 (테스트 결과 제외)
- ✅ `package.json` scripts 추가

**헬퍼 & 픽스처:**

- ✅ `fixtures/auth.ts` - 인증 픽스처 (자동 로그인)
- ✅ `utils/test-helpers.ts` - 공통 헬퍼 함수
- ✅ `utils/database-helpers.ts` - DB 초기화/정리 함수

**Page Objects:**

- ✅ `pages/DashboardPage.ts` - 대시보드 Page Object

**테스트 파일 (4개):**

- ✅ `e2e/auth/signin.spec.ts` - 로그인 테스트
- ✅ `e2e/auth/signup.spec.ts` - 회원가입 테스트
- ✅ `e2e/auth/logout.spec.ts` - 로그아웃 테스트
- ✅ `e2e/auth/dashboard-access.spec.ts` - 인증된 사용자의 대시보드 접근

### OUT OF SCOPE

- ❌ 크로스 브라우저 테스트 (Firefox, WebKit)
- ❌ 모바일 테스트
- ❌ CI/CD 통합 (Story 3에서 처리)
- ❌ 대시보드 상세 기능 테스트 (Story 2/3에서 처리)
- ❌ 비밀번호 재설정 플로우

---

## 🛠️ Technical Implementation

### 1. Playwright 설치

```bash
npm install -D @playwright/test@^1.40.0
npx playwright install chromium
npx playwright install-deps
```

### 2. playwright.config.ts 작성

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
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3010',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

### 3. 디렉토리 구조

```
tests/
├── e2e/
│   └── auth/
│       ├── signin.spec.ts
│       ├── signup.spec.ts
│       ├── logout.spec.ts
│       └── dashboard-access.spec.ts
├── fixtures/
│   └── auth.ts
├── pages/
│   └── DashboardPage.ts
└── utils/
    ├── test-helpers.ts
    └── database-helpers.ts
```

### 4. 인증 픽스처 (fixtures/auth.ts)

```typescript
import { test as base, Page } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Clerk 로그인 플로우
    await page.goto('/sign-in')

    // 이메일/비밀번호 입력
    await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!)
    await page.click('button:has-text("Continue")')
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')

    // 대시보드로 리다이렉트 대기
    await page.waitForURL('/dashboard')

    await use(page)
  },
})

export { expect } from '@playwright/test'
```

### 5. DashboardPage Page Object

```typescript
// tests/pages/DashboardPage.ts
import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly newProjectButton: Locator
  readonly userButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h2:has-text("DCS")')
    this.newProjectButton = page.locator('button:has-text("새 프로젝트")')
    this.userButton = page.locator('[data-testid="user-button"]')
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async isLoaded(): Promise<boolean> {
    return await this.heading.isVisible()
  }
}
```

### 6. 테스트 파일 예시

**e2e/auth/signin.spec.ts:**

```typescript
import { test, expect } from '@playwright/test'

test.describe('로그인 플로우', () => {
  test('유효한 자격증명으로 로그인 성공', async ({ page }) => {
    await page.goto('/sign-in')

    // 이메일 입력
    await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!)
    await page.click('button:has-text("Continue")')

    // 비밀번호 입력
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('h2:has-text("DCS")')).toBeVisible()
  })

  test('잘못된 비밀번호로 로그인 실패', async ({ page }) => {
    await page.goto('/sign-in')

    await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!)
    await page.click('button:has-text("Continue")')

    await page.fill('input[name="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    // 에러 메시지 확인
    await expect(page.locator('text=Password is incorrect')).toBeVisible()
  })
})
```

**e2e/auth/logout.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'

test.describe('로그아웃 플로우', () => {
  test('로그아웃 후 로그인 페이지로 이동', async ({ authenticatedPage }) => {
    // UserButton 클릭
    await authenticatedPage.locator('[data-testid="user-button"]').click()

    // Sign out 클릭
    await authenticatedPage.locator('button:has-text("Sign out")').click()

    // 홈 또는 로그인 페이지로 리다이렉트 확인
    await expect(authenticatedPage).toHaveURL(/\/$/)
  })
})
```

**e2e/auth/dashboard-access.spec.ts:**

```typescript
import { test, expect } from '@playwright/test'

test.describe('대시보드 접근 제어', () => {
  test('인증되지 않은 사용자는 로그인 페이지로 리다이렉트', async ({
    page,
  }) => {
    await page.goto('/dashboard')

    // Clerk가 자동으로 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/.*sign-in/)
  })

  test('인증된 사용자는 대시보드 접근 가능', async ({ page }) => {
    // 로그인
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!)
    await page.click('button:has-text("Continue")')
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')

    // 대시보드 접근 확인
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('h2:has-text("DCS")')).toBeVisible()
  })
})
```

### 7. 환경 변수 설정

`.env.test` 파일 생성:

```env
# Clerk 인증
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# 테스트 계정
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# 데이터베이스
DATABASE_URL=postgresql://user:pass@localhost:5432/flexcrawler_test

# 환경
NODE_ENV=test
```

### 8. package.json scripts 추가

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

### 9. .gitignore 업데이트

```gitignore
# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
/tests/downloads/
/tests/videos/
/tests/screenshots/

# 환경 변수
.env.test
```

---

## ✅ Acceptance Criteria

### 인프라

- [ ] Playwright 패키지 설치 완료 (`@playwright/test ^1.40.0`)
- [ ] `playwright.config.ts` 작성 완료 (Chromium 프로젝트 설정)
- [ ] 테스트 디렉토리 구조 생성 완료
- [ ] `.gitignore` 업데이트 완료
- [ ] `package.json`에 테스트 스크립트 추가 완료
- [ ] `.env.test` 파일 작성 및 테스트 계정 설정

### 픽스처 & 헬퍼

- [ ] `fixtures/auth.ts` 작성 완료 (authenticatedPage 픽스처)
- [ ] `utils/test-helpers.ts` 작성 완료
- [ ] `utils/database-helpers.ts` 작성 완료 (clearDatabase, setupTestDatabase 함수)

### Page Objects

- [ ] `pages/DashboardPage.ts` 작성 완료

### 테스트 (4개)

- [ ] `e2e/auth/signin.spec.ts` 작성 완료
  - [ ] 유효한 자격증명으로 로그인 성공 테스트
  - [ ] 잘못된 비밀번호로 로그인 실패 테스트
- [ ] `e2e/auth/signup.spec.ts` 작성 완료
  - [ ] 새 계정 회원가입 성공 테스트
  - [ ] 이미 존재하는 이메일로 회원가입 실패 테스트
- [ ] `e2e/auth/logout.spec.ts` 작성 완료
  - [ ] 로그아웃 후 로그인 페이지로 리다이렉트 테스트
- [ ] `e2e/auth/dashboard-access.spec.ts` 작성 완료
  - [ ] 인증되지 않은 사용자 접근 차단 테스트
  - [ ] 인증된 사용자 접근 허용 테스트

### 실행 검증

- [ ] 로컬에서 `npm run test:e2e` 실행 성공
- [ ] 모든 4개 테스트 통과
- [ ] `npm run test:e2e:ui` (UI 모드) 정상 작동
- [ ] 테스트 리포트 생성 확인 (`playwright-report/`)
- [ ] 테스트 실행 시간 < 2분

---

## 📊 Success Metrics

- ✅ 인증 테스트 4개 모두 100% 통과
- ✅ 테스트 성공률 >= 95%
- ✅ Flaky test = 0%
- ✅ 평균 테스트 실행 시간 < 2분

---

## 🔗 Dependencies

**이 스토리가 의존하는 것:**

- Clerk 인증 시스템이 정상 작동 중
- 개발 서버가 `http://localhost:3010`에서 실행 가능
- 테스트 계정 생성 완료

**이 스토리에 의존하는 것:**

- Story 2: 프로젝트 CRUD (인증 픽스처 재사용)
- Story 3: Visual Builder & CI/CD (테스트 인프라 재사용)

---

## 🐛 Known Issues / Risks

**Risk 1: Clerk UI 변경**

- **설명**: Clerk의 로그인 UI가 업데이트되면 셀렉터가 깨질 수 있음
- **완화**: data-testid 추가 요청 또는 stable한 셀렉터 사용

**Risk 2: 테스트 계정 관리**

- **설명**: 테스트 계정이 삭제되거나 비밀번호가 변경될 수 있음
- **완화**: `.env.test` 문서화 및 팀 공유

**Risk 3: 네트워크 지연**

- **설명**: Clerk API 응답 지연으로 타임아웃 발생 가능
- **완화**: `navigationTimeout: 30000` 설정으로 충분한 시간 확보

---

## 📝 Testing Strategy

**테스트 격리:**

- 각 테스트는 독립적으로 실행 가능
- 테스트 간 데이터 공유 없음
- `test.beforeEach`에서 초기 상태 설정

**데이터 정리:**

- 인증 테스트는 기존 계정 사용 (DB 정리 불필요)
- 회원가입 테스트는 고유한 이메일 생성 (timestamp 활용)

**재시도 전략:**

- CI 환경에서만 2회 재시도
- 로컬에서는 재시도 없음 (빠른 피드백)

---

## 🚀 Implementation Order

1. **Day 1: 인프라 설정**
   - Playwright 설치
   - `playwright.config.ts` 작성
   - 디렉토리 구조 생성
   - `.gitignore`, `package.json` 업데이트

2. **Day 2: 픽스처 & 헬퍼**
   - `fixtures/auth.ts` 작성
   - `utils/test-helpers.ts` 작성
   - `utils/database-helpers.ts` 작성
   - `pages/DashboardPage.ts` 작성

3. **Day 3: 인증 테스트 작성**
   - `signin.spec.ts` 작성 및 검증
   - `signup.spec.ts` 작성 및 검증
   - `logout.spec.ts` 작성 및 검증
   - `dashboard-access.spec.ts` 작성 및 검증

4. **Day 4: 검증 & 리팩토링**
   - 모든 테스트 통과 확인
   - 코드 리뷰 및 리팩토링
   - 문서 업데이트 (README)
   - Story 완료 체크리스트 확인

---

## 📚 References

- **Tech-Spec**: `/docs/tech-spec.md`
- **Playwright Docs**: https://playwright.dev/docs/intro
- **Clerk Docs**: https://clerk.com/docs
- **기존 코드**: `src/app/(dashboard)/layout.tsx:12` (UserButton)

---

**Story Created**: 2025-11-23
**Last Updated**: 2025-11-23
