# Story 3: Visual Builder & CI/CD 통합

**Status**: TODO
**Priority**: P1
**Estimated Effort**: 3-4일
**Story Points**: 5

---

## 📋 User Story

**As a** 개발자
**I want** Visual Builder 핵심 기능에 대한 E2E 테스트를 작성하고 GitHub Actions CI/CD 파이프라인에 통합하여
**So that** Visual Builder의 정확성을 보장하고 모든 PR에서 자동으로 테스트를 실행할 수 있다

---

## 🎯 Goals

1. Visual Builder Page Object 작성
2. Visual Builder 핵심 기능 테스트 작성 (4개)
3. GitHub Actions 워크플로우 작성
4. CI/CD 파이프라인 통합 및 검증
5. PR 체크 자동 실행 확인

---

## 📐 Scope

### IN SCOPE

**Page Objects (1개):**

- ✅ `pages/VisualBuilderPage.ts` - Visual Builder 페이지

**테스트 파일 (4개):**

- ✅ `e2e/visual-builder/load-page.spec.ts` - 페이지 로드
- ✅ `e2e/visual-builder/add-field.spec.ts` - 필드 추가
- ✅ `e2e/visual-builder/test-selector.spec.ts` - 셀렉터 테스트
- ✅ `e2e/visual-builder/manage-fields.spec.ts` - 필드 관리

**CI/CD:**

- ✅ `.github/workflows/playwright.yml` - GitHub Actions 워크플로우
- ✅ PR 체크 연동
- ✅ 테스트 리포트 아티팩트 업로드

### OUT OF SCOPE

- ❌ Visual Builder AI 추천 기능 (Phase 2)
- ❌ 페이지 프리뷰 iframe 상세 테스트 (Phase 2)
- ❌ 필드 드래그 앤 드롭 정렬 (Phase 2)
- ❌ 복잡한 CSS 셀렉터 검증 (Phase 2)
- ❌ 셀렉터 저장 기능 (Phase 2)

---

## 🛠️ Technical Implementation

### 1. VisualBuilderPage Page Object

```typescript
// tests/pages/VisualBuilderPage.ts
import { Page, Locator } from '@playwright/test'

export class VisualBuilderPage {
  readonly page: Page
  readonly urlInput: Locator
  readonly loadPreviewButton: Locator
  readonly previewIframe: Locator
  readonly fieldNameInput: Locator
  readonly selectorInput: Locator
  readonly addFieldButton: Locator
  readonly testSelectorButton: Locator
  readonly fieldsList: Locator
  readonly aiSuggestButton: Locator

  constructor(page: Page) {
    this.page = page
    this.urlInput = page.locator('input[id="url"]')
    this.loadPreviewButton = page.locator('button:has-text("페이지 로드")')
    this.previewIframe = page.locator('iframe[data-testid="preview-iframe"]')
    this.fieldNameInput = page.locator('input[placeholder*="필드 이름"]')
    this.selectorInput = page.locator('input[placeholder*="CSS 셀렉터"]')
    this.addFieldButton = page.locator('button:has-text("추가")')
    this.testSelectorButton = page.locator('button:has-text("테스트")')
    this.fieldsList = page.locator('[data-testid="fields-list"]')
    this.aiSuggestButton = page.locator('button:has-text("AI 추천")')
  }

  async goto() {
    await this.page.goto('/dashboard/visual-builder-demo')
    await this.page.waitForLoadState('networkidle')
  }

  async loadPreview(url: string) {
    await this.urlInput.fill(url)
    await this.loadPreviewButton.click()

    // iframe 로딩 대기
    await this.page.waitForTimeout(2000)
  }

  async addField(fieldName: string, selector: string) {
    await this.fieldNameInput.fill(fieldName)
    await this.selectorInput.fill(selector)
    await this.addFieldButton.click()
  }

  async testSelector(selector: string) {
    await this.selectorInput.fill(selector)
    await this.testSelectorButton.click()
  }

  async getFieldsCount(): Promise<number> {
    const items = this.page.locator('[data-testid="field-item"]')
    return await items.count()
  }

  async deleteField(fieldName: string) {
    const fieldItem = this.page.locator(
      `[data-testid="field-item"]:has-text("${fieldName}")`
    )
    const deleteButton = fieldItem.locator('button[aria-label="삭제"]')
    await deleteButton.click()
  }

  async hasField(fieldName: string): Promise<boolean> {
    return await this.page.locator(`text=${fieldName}`).isVisible()
  }
}
```

### 2. 테스트 파일 예시

**e2e/visual-builder/load-page.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'
import { VisualBuilderPage } from '../pages/VisualBuilderPage'

test.describe('Visual Builder 페이지 로드', () => {
  let visualBuilderPage: VisualBuilderPage

  test.beforeEach(async ({ authenticatedPage }) => {
    visualBuilderPage = new VisualBuilderPage(authenticatedPage)
    await visualBuilderPage.goto()
  })

  test('Visual Builder 페이지가 정상적으로 로드됨', async ({
    authenticatedPage,
  }) => {
    // 페이지 제목 확인
    await expect(
      authenticatedPage.locator('h1:has-text("Visual Builder")')
    ).toBeVisible()

    // 주요 UI 요소 확인
    await expect(visualBuilderPage.urlInput).toBeVisible()
    await expect(visualBuilderPage.loadPreviewButton).toBeVisible()
    await expect(visualBuilderPage.fieldNameInput).toBeVisible()
    await expect(visualBuilderPage.selectorInput).toBeVisible()
    await expect(visualBuilderPage.addFieldButton).toBeVisible()
  })

  test('기본 URL이 입력되어 있음', async () => {
    const defaultUrl = await visualBuilderPage.urlInput.inputValue()
    expect(defaultUrl).toBe('https://books.toscrape.com/')
  })
})
```

**e2e/visual-builder/add-field.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'
import { VisualBuilderPage } from '../pages/VisualBuilderPage'

test.describe('필드 추가', () => {
  let visualBuilderPage: VisualBuilderPage

  test.beforeEach(async ({ authenticatedPage }) => {
    visualBuilderPage = new VisualBuilderPage(authenticatedPage)
    await visualBuilderPage.goto()
  })

  test('새 필드 추가 성공', async ({ authenticatedPage }) => {
    // 필드 추가
    await visualBuilderPage.addField('title', 'h3 a')

    // 필드 목록에 추가되었는지 확인
    await expect(authenticatedPage.locator('text=title')).toBeVisible()
    await expect(authenticatedPage.locator('text=h3 a')).toBeVisible()

    const count = await visualBuilderPage.getFieldsCount()
    expect(count).toBeGreaterThan(0)
  })

  test('여러 필드 추가 가능', async ({ authenticatedPage }) => {
    // 3개 필드 추가
    await visualBuilderPage.addField('title', 'h3 a')
    await visualBuilderPage.addField('price', '.price_color')
    await visualBuilderPage.addField('availability', '.availability')

    const count = await visualBuilderPage.getFieldsCount()
    expect(count).toBe(3)

    // 각 필드 확인
    await expect(visualBuilderPage.hasField('title')).resolves.toBe(true)
    await expect(visualBuilderPage.hasField('price')).resolves.toBe(true)
    await expect(visualBuilderPage.hasField('availability')).resolves.toBe(true)
  })

  test('빈 필드 이름으로 추가 시 에러', async ({ authenticatedPage }) => {
    // 필드 이름 없이 추가 시도
    await visualBuilderPage.selectorInput.fill('h1')
    await visualBuilderPage.addFieldButton.click()

    // 에러 메시지 또는 필드가 추가되지 않음 확인
    const count = await visualBuilderPage.getFieldsCount()
    expect(count).toBe(0)
  })
})
```

**e2e/visual-builder/test-selector.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'
import { VisualBuilderPage } from '../pages/VisualBuilderPage'

test.describe('셀렉터 테스트', () => {
  let visualBuilderPage: VisualBuilderPage

  test.beforeEach(async ({ authenticatedPage }) => {
    visualBuilderPage = new VisualBuilderPage(authenticatedPage)
    await visualBuilderPage.goto()
  })

  test('유효한 셀렉터 테스트 성공', async ({ authenticatedPage }) => {
    // 페이지 프리뷰 로드
    await visualBuilderPage.loadPreview('https://books.toscrape.com/')

    // 셀렉터 테스트
    await visualBuilderPage.testSelector('h3 a')

    // 테스트 결과 확인 (매칭된 요소 수 표시)
    await expect(
      authenticatedPage.locator('text=/발견된 요소: \\d+/')
    ).toBeVisible()
  })

  test('유효하지 않은 셀렉터 테스트', async ({ authenticatedPage }) => {
    await visualBuilderPage.loadPreview('https://books.toscrape.com/')

    // 존재하지 않는 셀렉터
    await visualBuilderPage.testSelector('.nonexistent-class')

    // 0개 발견 메시지
    await expect(authenticatedPage.locator('text=발견된 요소: 0')).toBeVisible()
  })
})
```

**e2e/visual-builder/manage-fields.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'
import { VisualBuilderPage } from '../pages/VisualBuilderPage'

test.describe('필드 관리', () => {
  let visualBuilderPage: VisualBuilderPage

  test.beforeEach(async ({ authenticatedPage }) => {
    visualBuilderPage = new VisualBuilderPage(authenticatedPage)
    await visualBuilderPage.goto()

    // 테스트용 필드 추가
    await visualBuilderPage.addField('title', 'h3 a')
    await visualBuilderPage.addField('price', '.price_color')
  })

  test('필드 삭제 성공', async ({ authenticatedPage }) => {
    const initialCount = await visualBuilderPage.getFieldsCount()
    expect(initialCount).toBe(2)

    // title 필드 삭제
    await visualBuilderPage.deleteField('title')

    const afterCount = await visualBuilderPage.getFieldsCount()
    expect(afterCount).toBe(1)

    // title 필드가 사라졌는지 확인
    await expect(visualBuilderPage.hasField('title')).resolves.toBe(false)
    await expect(visualBuilderPage.hasField('price')).resolves.toBe(true)
  })

  test('모든 필드 삭제 가능', async ({ authenticatedPage }) => {
    await visualBuilderPage.deleteField('title')
    await visualBuilderPage.deleteField('price')

    const count = await visualBuilderPage.getFieldsCount()
    expect(count).toBe(0)

    // 빈 상태 메시지 표시
    await expect(
      authenticatedPage.locator('text=필드가 없습니다')
    ).toBeVisible()
  })

  test('필드 목록이 JSON으로 표시됨', async ({ authenticatedPage }) => {
    // JSON 미리보기 섹션 확인
    const jsonPreview = authenticatedPage.locator('pre code')
    await expect(jsonPreview).toBeVisible()

    // JSON 내용 확인
    const jsonText = await jsonPreview.textContent()
    expect(jsonText).toContain('"title"')
    expect(jsonText).toContain('"h3 a"')
    expect(jsonText).toContain('"price"')
    expect(jsonText).toContain('".price_color"')
  })
})
```

### 3. GitHub Actions 워크플로우

**.github/workflows/playwright.yml:**

```yaml
name: Playwright E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 15
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install chromium --with-deps

      - name: Setup environment variables
        run: |
          echo "DATABASE_URL=${{ secrets.TEST_DATABASE_URL }}" >> $GITHUB_ENV
          echo "TEST_USER_EMAIL=${{ secrets.TEST_USER_EMAIL }}" >> $GITHUB_ENV
          echo "TEST_USER_PASSWORD=${{ secrets.TEST_USER_PASSWORD }}" >> $GITHUB_ENV
          echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${{ secrets.CLERK_PUBLISHABLE_KEY }}" >> $GITHUB_ENV
          echo "CLERK_SECRET_KEY=${{ secrets.CLERK_SECRET_KEY }}" >> $GITHUB_ENV

      - name: Run Playwright tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-videos
          path: test-results/
          retention-days: 7

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: daun/playwright-report-comment@v3
        with:
          report-path: test-results.json
```

### 4. GitHub Secrets 설정

다음 secrets를 GitHub repository settings에 추가:

```
TEST_DATABASE_URL=postgresql://...
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## ✅ Acceptance Criteria

### Page Objects

- [ ] `pages/VisualBuilderPage.ts` 작성 완료
  - [ ] goto(), loadPreview(), addField(), testSelector(), deleteField() 메서드 구현

### 테스트 (4개)

- [ ] `e2e/visual-builder/load-page.spec.ts` 작성 완료
  - [ ] Visual Builder 페이지 로드 테스트
  - [ ] 기본 URL 입력 확인 테스트
- [ ] `e2e/visual-builder/add-field.spec.ts` 작성 완료
  - [ ] 새 필드 추가 성공 테스트
  - [ ] 여러 필드 추가 테스트
  - [ ] 빈 필드 이름 에러 테스트
- [ ] `e2e/visual-builder/test-selector.spec.ts` 작성 완료
  - [ ] 유효한 셀렉터 테스트
  - [ ] 유효하지 않은 셀렉터 테스트
- [ ] `e2e/visual-builder/manage-fields.spec.ts` 작성 완료
  - [ ] 필드 삭제 테스트
  - [ ] 모든 필드 삭제 테스트
  - [ ] JSON 미리보기 표시 테스트

### CI/CD

- [ ] `.github/workflows/playwright.yml` 작성 완료
- [ ] GitHub Secrets 설정 완료
- [ ] PR에서 자동 테스트 실행 확인
- [ ] 테스트 리포트 아티팩트 업로드 확인
- [ ] PR 체크 상태 표시 확인

### 전체 검증

- [ ] 로컬에서 모든 테스트 통과 (Story 1 + 2 + 3 = 15-20개)
- [ ] CI에서 모든 테스트 통과
- [ ] 테스트 성공률 >= 95%
- [ ] 평균 실행 시간 < 5분 (전체)

---

## 📊 Success Metrics

- ✅ Visual Builder 테스트 4개 모두 100% 통과
- ✅ CI/CD 파이프라인 정상 작동
- ✅ PR 자동 테스트 실행 확인
- ✅ 전체 테스트 (15-20개) 성공률 >= 95%
- ✅ Flaky test < 5%
- ✅ CI 실행 시간 < 5분

---

## 🔗 Dependencies

**이 스토리가 의존하는 것:**

- Story 1 완료 (인증 픽스처, 테스트 인프라)
- Story 2 완료 (프로젝트 생성 기능)
- Visual Builder UI가 정상 작동 중
- GitHub repository 접근 권한

**이 스토리에 의존하는 것:**

- 없음 (MVP의 마지막 스토리)

---

## 🐛 Known Issues / Risks

**Risk 1: iframe 테스트 복잡성**

- **설명**: iframe 내부 요소 접근이 복잡할 수 있음
- **완화**: Playwright의 frame API 사용, 필요시 간소화

**Risk 2: CI 환경에서 테스트 DB 접근**

- **설명**: GitHub Actions에서 테스트 DB 연결 실패 가능
- **완화**: Cloud DB 또는 Docker Compose로 PostgreSQL 실행

**Risk 3: CI 실행 시간**

- **설명**: 전체 테스트 실행 시간이 5분을 초과할 수 있음
- **완화**: 병렬 실행 최적화, Chromium만 사용

**Risk 4: GitHub Secrets 관리**

- **설명**: Secrets 노출 또는 만료 위험
- **완화**: 주기적인 Secrets 갱신, 최소 권한 원칙

---

## 🚀 Implementation Order

1. **Day 1: Visual Builder Page Object**
   - `VisualBuilderPage.ts` 작성 및 검증
   - Visual Builder 페이지 수동 테스트로 UI 파악

2. **Day 2: Visual Builder 테스트 (1/2)**
   - `load-page.spec.ts` 작성
   - `add-field.spec.ts` 작성

3. **Day 3: Visual Builder 테스트 (2/2)**
   - `test-selector.spec.ts` 작성
   - `manage-fields.spec.ts` 작성
   - 로컬에서 모든 테스트 통과 확인

4. **Day 4: CI/CD 통합**
   - `.github/workflows/playwright.yml` 작성
   - GitHub Secrets 설정
   - CI에서 테스트 실행 및 검증
   - PR 생성하여 자동 테스트 확인
   - Story 완료 체크리스트 확인

---

## 📚 References

- **Tech-Spec**: `/docs/tech-spec.md`
- **Story 1**: `/docs/stories/story-1-infrastructure-auth.md`
- **Story 2**: `/docs/stories/story-2-project-crud.md`
- **기존 코드**:
  - `src/app/(dashboard)/dashboard/visual-builder-demo/page.tsx` - Visual Builder 데모
  - `src/components/visual-builder/VisualBuilder.tsx` - Visual Builder 컴포넌트
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Playwright CI Docs**: https://playwright.dev/docs/ci

---

## 📖 Additional Notes

### CI/CD Best Practices

1. **테스트 격리**:
   - 각 PR은 독립적인 환경에서 테스트
   - 테스트 DB는 매 실행마다 초기화

2. **빠른 피드백**:
   - 실패한 테스트는 즉시 중단
   - 병렬 실행으로 시간 단축

3. **아티팩트 관리**:
   - 성공 시: HTML 리포트 30일 보관
   - 실패 시: 비디오, 스크린샷 7일 보관

4. **PR 코멘트**:
   - 테스트 결과를 PR에 자동 코멘트
   - 실패 원인 즉시 파악 가능

### 로컬 개발 팁

```bash
# UI 모드로 Visual Builder 테스트 디버깅
npx playwright test e2e/visual-builder --ui

# 특정 테스트만 실행
npx playwright test e2e/visual-builder/add-field.spec.ts

# 헤드풀 모드 (브라우저 보면서)
npx playwright test --headed

# 디버그 모드
npx playwright test --debug
```

---

**Story Created**: 2025-11-23
**Last Updated**: 2025-11-23
