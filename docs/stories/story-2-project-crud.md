# Story 2: 프로젝트 CRUD 테스트

**Status**: TODO
**Priority**: P0
**Estimated Effort**: 3-4일
**Story Points**: 5

---

## 📋 User Story

**As a** 개발자
**I want** 프로젝트 생성, 조회, 수정, 삭제 및 크롤링 실행 플로우에 대한 E2E 테스트를 작성하고
**So that** 핵심 프로젝트 관리 기능의 정확성과 안정성을 보장할 수 있다

---

## 🎯 Goals

1. 프로젝트 관리 Page Objects 작성 (2개)
2. 프로젝트 CRUD 테스트 작성 (6개)
3. 크롤링 실행 테스트 작성
4. 테스트 데이터 격리 및 정리 전략 구현
5. 모든 테스트가 독립적으로 실행 가능하도록 보장

---

## 📐 Scope

### IN SCOPE

**Page Objects (2개):**

- ✅ `pages/ProjectsPage.ts` - 프로젝트 목록/생성 페이지
- ✅ `pages/ProjectDetailPage.ts` - 프로젝트 상세 페이지

**테스트 파일 (6개):**

- ✅ `e2e/projects/create-project.spec.ts` - 프로젝트 생성
- ✅ `e2e/projects/list-projects.spec.ts` - 프로젝트 목록 조회
- ✅ `e2e/projects/view-project.spec.ts` - 프로젝트 상세 보기
- ✅ `e2e/projects/edit-project.spec.ts` - 프로젝트 수정
- ✅ `e2e/projects/delete-project.spec.ts` - 프로젝트 삭제
- ✅ `e2e/projects/run-crawling.spec.ts` - 크롤링 실행

**헬퍼 함수:**

- ✅ `utils/database-helpers.ts`에 프로젝트 생성/삭제 함수 추가
- ✅ 테스트 데이터 격리 전략 구현

### OUT OF SCOPE

- ❌ 프로젝트 검색/필터링 기능 (Phase 2)
- ❌ 프로젝트 페이지네이션 (Phase 2)
- ❌ 프로젝트 복제 기능 (Phase 2)
- ❌ 다중 URL 크롤링 (Phase 2)
- ❌ 스케줄링 설정 상세 테스트 (Phase 2)
- ❌ 크롤링 결과 데이터 검증 (Phase 2)

---

## 🛠️ Technical Implementation

### 1. ProjectsPage Page Object

```typescript
// tests/pages/ProjectsPage.ts
import { Page, Locator } from '@playwright/test'

export class ProjectsPage {
  readonly page: Page
  readonly newProjectButton: Locator
  readonly projectsList: Locator
  readonly searchInput: Locator

  constructor(page: Page) {
    this.page = page
    this.newProjectButton = page.locator('button:has-text("새 프로젝트")')
    this.projectsList = page.locator('[data-testid="projects-list"]')
    this.searchInput = page.locator('input[placeholder*="검색"]')
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async clickNewProject() {
    await this.newProjectButton.click()
    await this.page.waitForURL(/.*\/dashboard\/new/)
  }

  async getProjectCount(): Promise<number> {
    const items = this.page.locator('[data-testid="project-item"]')
    return await items.count()
  }

  async clickProject(projectName: string) {
    await this.page.locator(`text=${projectName}`).first().click()
  }

  async hasProject(projectName: string): Promise<boolean> {
    return await this.page.locator(`text=${projectName}`).isVisible()
  }
}
```

### 2. ProjectDetailPage Page Object

```typescript
// tests/pages/ProjectDetailPage.ts
import { Page, Locator } from '@playwright/test'

export class ProjectDetailPage {
  readonly page: Page
  readonly projectName: Locator
  readonly editButton: Locator
  readonly deleteButton: Locator
  readonly runCrawlingButton: Locator
  readonly statusBadge: Locator
  readonly urlsList: Locator

  constructor(page: Page) {
    this.page = page
    this.projectName = page.locator('h1')
    this.editButton = page.locator('button:has-text("수정")')
    this.deleteButton = page.locator('button:has-text("삭제")')
    this.runCrawlingButton = page.locator('button:has-text("크롤링 실행")')
    this.statusBadge = page.locator('[data-testid="project-status"]')
    this.urlsList = page.locator('[data-testid="urls-list"]')
  }

  async goto(projectId: string) {
    await this.page.goto(`/dashboard/projects/${projectId}`)
    await this.page.waitForLoadState('networkidle')
  }

  async clickEdit() {
    await this.editButton.click()
  }

  async clickDelete() {
    await this.deleteButton.click()
  }

  async confirmDelete() {
    // 삭제 확인 모달에서 확인 버튼 클릭
    await this.page.locator('button:has-text("확인")').click()
  }

  async runCrawling() {
    await this.runCrawlingButton.click()
  }

  async getProjectName(): Promise<string> {
    return (await this.projectName.textContent()) || ''
  }

  async getStatus(): Promise<string> {
    return (await this.statusBadge.textContent()) || ''
  }
}
```

### 3. Database Helpers 확장

```typescript
// tests/utils/database-helpers.ts에 추가
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

export async function createTestProject(userId: string, data?: Partial<any>) {
  const timestamp = Date.now()

  return await prisma.project.create({
    data: {
      userId,
      name: data?.name || `Test Project ${timestamp}`,
      urls: data?.urls || ['https://books.toscrape.com/'],
      selectors: data?.selectors || { title: 'h3 a', price: '.price_color' },
      scheduleType: data?.scheduleType || 'manual',
      status: 'active',
    },
  })
}

export async function deleteTestProject(projectId: string) {
  // 관련 크롤링 실행 및 태스크 먼저 삭제
  await prisma.crawlingTask.deleteMany({ where: { projectId } })
  await prisma.crawlingRun.deleteMany({ where: { projectId } })
  await prisma.project.delete({ where: { id: projectId } })
}

export async function clearUserProjects(userId: string) {
  const projects = await prisma.project.findMany({ where: { userId } })

  for (const project of projects) {
    await deleteTestProject(project.id)
  }
}

export async function getProjectByName(name: string) {
  return await prisma.project.findFirst({ where: { name } })
}
```

### 4. 테스트 파일 예시

**e2e/projects/create-project.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'
import { ProjectsPage } from '../pages/ProjectsPage'
import { clearUserProjects } from '../utils/database-helpers'

test.describe('프로젝트 생성', () => {
  let projectsPage: ProjectsPage

  test.beforeEach(async ({ authenticatedPage }) => {
    // 테스트 격리: 기존 프로젝트 삭제
    const userId = process.env.TEST_USER_ID!
    await clearUserProjects(userId)

    projectsPage = new ProjectsPage(authenticatedPage)
    await projectsPage.goto()
  })

  test('새 프로젝트 생성 성공 (챗봇 플로우)', async ({ authenticatedPage }) => {
    await projectsPage.clickNewProject()

    // 챗봇 인터페이스에서 프로젝트 정보 입력
    // Step 1: 프로젝트 이름
    await authenticatedPage.fill(
      'input[placeholder*="프로젝트 이름"]',
      'E2E Test Project'
    )
    await authenticatedPage.click('button:has-text("다음")')

    // Step 2: URL 입력
    await authenticatedPage.fill(
      'input[placeholder*="URL"]',
      'https://books.toscrape.com/'
    )
    await authenticatedPage.click('button:has-text("다음")')

    // Step 3: 스케줄 타입
    await authenticatedPage.click('button:has-text("수동 실행")')
    await authenticatedPage.click('button:has-text("완료")')

    // 프로젝트 생성 완료 후 목록으로 리다이렉트
    await expect(authenticatedPage).toHaveURL(/.*\/dashboard/)
    await expect(
      authenticatedPage.locator('text=E2E Test Project')
    ).toBeVisible()
  })

  test('필수 필드 누락 시 에러 메시지 표시', async ({ authenticatedPage }) => {
    await projectsPage.clickNewProject()

    // 프로젝트 이름 없이 다음 버튼 클릭
    await authenticatedPage.click('button:has-text("다음")')

    // 에러 메시지 확인
    await expect(
      authenticatedPage.locator('text=프로젝트 이름을 입력하세요')
    ).toBeVisible()
  })
})
```

**e2e/projects/list-projects.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'
import { ProjectsPage } from '../pages/ProjectsPage'
import { createTestProject, clearUserProjects } from '../utils/database-helpers'

test.describe('프로젝트 목록 조회', () => {
  let projectsPage: ProjectsPage
  const userId = process.env.TEST_USER_ID!

  test.beforeEach(async ({ authenticatedPage }) => {
    await clearUserProjects(userId)
    projectsPage = new ProjectsPage(authenticatedPage)
  })

  test('프로젝트 목록이 올바르게 표시됨', async ({ authenticatedPage }) => {
    // 테스트 데이터 생성
    await createTestProject(userId, { name: 'Project 1' })
    await createTestProject(userId, { name: 'Project 2' })
    await createTestProject(userId, { name: 'Project 3' })

    await projectsPage.goto()

    const count = await projectsPage.getProjectCount()
    expect(count).toBe(3)

    // 각 프로젝트 이름 확인
    await expect(authenticatedPage.locator('text=Project 1')).toBeVisible()
    await expect(authenticatedPage.locator('text=Project 2')).toBeVisible()
    await expect(authenticatedPage.locator('text=Project 3')).toBeVisible()
  })

  test('프로젝트가 없을 때 빈 상태 메시지 표시', async ({
    authenticatedPage,
  }) => {
    await projectsPage.goto()

    await expect(
      authenticatedPage.locator('text=프로젝트가 없습니다')
    ).toBeVisible()
    await expect(
      authenticatedPage.locator('text=새 프로젝트를 만들어 시작하세요')
    ).toBeVisible()
  })
})
```

**e2e/projects/edit-project.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { createTestProject, clearUserProjects } from '../utils/database-helpers'

test.describe('프로젝트 수정', () => {
  const userId = process.env.TEST_USER_ID!
  let projectDetailPage: ProjectDetailPage

  test.beforeEach(async ({ authenticatedPage }) => {
    await clearUserProjects(userId)
    projectDetailPage = new ProjectDetailPage(authenticatedPage)
  })

  test('프로젝트 이름 수정 성공', async ({ authenticatedPage }) => {
    const project = await createTestProject(userId, { name: 'Original Name' })

    await projectDetailPage.goto(project.id)
    await projectDetailPage.clickEdit()

    // 프로젝트 이름 수정
    await authenticatedPage.fill('input[name="name"]', 'Updated Name')
    await authenticatedPage.click('button:has-text("저장")')

    // 수정 완료 후 상세 페이지로 리다이렉트
    await expect(
      authenticatedPage.locator('h1:has-text("Updated Name")')
    ).toBeVisible()
  })

  test('URL 추가 성공', async ({ authenticatedPage }) => {
    const project = await createTestProject(userId)

    await projectDetailPage.goto(project.id)
    await projectDetailPage.clickEdit()

    // URL 추가
    await authenticatedPage.click('button:has-text("URL 추가")')
    await authenticatedPage.fill(
      'input[name="url-1"]',
      'https://example.com/page2'
    )
    await authenticatedPage.click('button:has-text("저장")')

    // URL 목록 확인
    await expect(
      authenticatedPage.locator('text=https://example.com/page2')
    ).toBeVisible()
  })
})
```

**e2e/projects/delete-project.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'
import { ProjectsPage } from '../pages/ProjectsPage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import {
  createTestProject,
  clearUserProjects,
  getProjectByName,
} from '../utils/database-helpers'

test.describe('프로젝트 삭제', () => {
  const userId = process.env.TEST_USER_ID!
  let projectsPage: ProjectsPage
  let projectDetailPage: ProjectDetailPage

  test.beforeEach(async ({ authenticatedPage }) => {
    await clearUserProjects(userId)
    projectsPage = new ProjectsPage(authenticatedPage)
    projectDetailPage = new ProjectDetailPage(authenticatedPage)
  })

  test('프로젝트 삭제 성공', async ({ authenticatedPage }) => {
    const project = await createTestProject(userId, {
      name: 'To Delete Project',
    })

    await projectDetailPage.goto(project.id)
    await projectDetailPage.clickDelete()

    // 삭제 확인 모달
    await expect(
      authenticatedPage.locator('text=정말 삭제하시겠습니까?')
    ).toBeVisible()
    await projectDetailPage.confirmDelete()

    // 대시보드로 리다이렉트
    await expect(authenticatedPage).toHaveURL(/.*\/dashboard/)

    // 프로젝트가 목록에서 사라졌는지 확인
    const deleted = await getProjectByName('To Delete Project')
    expect(deleted).toBeNull()
  })

  test('삭제 취소 시 프로젝트 유지', async ({ authenticatedPage }) => {
    const project = await createTestProject(userId, { name: 'Keep Project' })

    await projectDetailPage.goto(project.id)
    await projectDetailPage.clickDelete()

    // 취소 버튼 클릭
    await authenticatedPage.click('button:has-text("취소")')

    // 프로젝트 상세 페이지에 그대로 있음
    await expect(
      authenticatedPage.locator('h1:has-text("Keep Project")')
    ).toBeVisible()

    // DB에서도 존재 확인
    const kept = await getProjectByName('Keep Project')
    expect(kept).not.toBeNull()
  })
})
```

**e2e/projects/run-crawling.spec.ts:**

```typescript
import { test, expect } from '../fixtures/auth'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { createTestProject, clearUserProjects } from '../utils/database-helpers'

test.describe('크롤링 실행', () => {
  const userId = process.env.TEST_USER_ID!
  let projectDetailPage: ProjectDetailPage

  test.beforeEach(async ({ authenticatedPage }) => {
    await clearUserProjects(userId)
    projectDetailPage = new ProjectDetailPage(authenticatedPage)
  })

  test('단일 URL 크롤링 실행 성공', async ({ authenticatedPage }) => {
    const project = await createTestProject(userId, {
      name: 'Crawling Test',
      urls: ['https://books.toscrape.com/'],
      selectors: { title: 'h3 a', price: '.price_color' },
    })

    await projectDetailPage.goto(project.id)
    await projectDetailPage.runCrawling()

    // 크롤링 실행 중 상태 확인
    await expect(authenticatedPage.locator('text=크롤링 실행 중')).toBeVisible()

    // 크롤링 완료 대기 (최대 60초)
    await expect(authenticatedPage.locator('text=완료')).toBeVisible({
      timeout: 60000,
    })

    // 결과 테이블 표시 확인
    await expect(
      authenticatedPage.locator('[data-testid="crawl-results"]')
    ).toBeVisible()
  })

  test('유효하지 않은 URL로 크롤링 실패', async ({ authenticatedPage }) => {
    const project = await createTestProject(userId, {
      urls: ['https://invalid-url-that-does-not-exist.com/'],
    })

    await projectDetailPage.goto(project.id)
    await projectDetailPage.runCrawling()

    // 에러 메시지 확인
    await expect(authenticatedPage.locator('text=크롤링 실패')).toBeVisible({
      timeout: 30000,
    })
    await expect(
      authenticatedPage.locator('text=URL에 접근할 수 없습니다')
    ).toBeVisible()
  })
})
```

---

## ✅ Acceptance Criteria

### Page Objects

- [ ] `pages/ProjectsPage.ts` 작성 완료
  - [ ] goto(), clickNewProject(), getProjectCount(), clickProject(), hasProject() 메서드 구현
- [ ] `pages/ProjectDetailPage.ts` 작성 완료
  - [ ] goto(), clickEdit(), clickDelete(), confirmDelete(), runCrawling() 메서드 구현

### 헬퍼 함수

- [ ] `utils/database-helpers.ts`에 다음 함수 추가:
  - [ ] createTestProject()
  - [ ] deleteTestProject()
  - [ ] clearUserProjects()
  - [ ] getProjectByName()

### 테스트 (6개)

- [ ] `e2e/projects/create-project.spec.ts` 작성 완료
  - [ ] 새 프로젝트 생성 성공 테스트
  - [ ] 필수 필드 누락 시 에러 테스트
- [ ] `e2e/projects/list-projects.spec.ts` 작성 완료
  - [ ] 프로젝트 목록 표시 테스트
  - [ ] 빈 상태 메시지 표시 테스트
- [ ] `e2e/projects/view-project.spec.ts` 작성 완료
  - [ ] 프로젝트 상세 정보 표시 테스트
- [ ] `e2e/projects/edit-project.spec.ts` 작성 완료
  - [ ] 프로젝트 이름 수정 테스트
  - [ ] URL 추가 테스트
- [ ] `e2e/projects/delete-project.spec.ts` 작성 완료
  - [ ] 프로젝트 삭제 성공 테스트
  - [ ] 삭제 취소 테스트
- [ ] `e2e/projects/run-crawling.spec.ts` 작성 완료
  - [ ] 단일 URL 크롤링 실행 성공 테스트
  - [ ] 유효하지 않은 URL 크롤링 실패 테스트

### 실행 검증

- [ ] 로컬에서 모든 6개 테스트 통과
- [ ] 각 테스트가 독립적으로 실행 가능
- [ ] 테스트 격리 확인 (beforeEach에서 DB 정리)
- [ ] 테스트 실행 시간 < 3분

---

## 📊 Success Metrics

- ✅ 프로젝트 CRUD 테스트 6개 모두 100% 통과
- ✅ 테스트 성공률 >= 95%
- ✅ Flaky test < 5%
- ✅ 테스트 격리 100% (각 테스트 독립 실행)
- ✅ 평균 테스트 실행 시간 < 3분

---

## 🔗 Dependencies

**이 스토리가 의존하는 것:**

- Story 1 완료 (인증 픽스처, 테스트 인프라)
- 프로젝트 관리 UI가 정상 작동 중
- Prisma 스키마에 Project, CrawlingRun, CrawlingTask 모델 존재

**이 스토리에 의존하는 것:**

- Story 3: Visual Builder 테스트 (프로젝트 생성 후 Visual Builder 사용)

---

## 🐛 Known Issues / Risks

**Risk 1: 챗봇 UI 변경**

- **설명**: 프로젝트 생성 챗봇 UI가 변경될 수 있음
- **완화**: data-testid 추가 또는 stable한 셀렉터 사용

**Risk 2: 크롤링 타임아웃**

- **설명**: 크롤링 실행 테스트에서 네트워크 지연으로 타임아웃 발생 가능
- **완화**: timeout: 60000ms 설정 및 재시도 전략

**Risk 3: 테스트 데이터 충돌**

- **설명**: 병렬 실행 시 동일한 프로젝트 이름으로 충돌 가능
- **완화**: timestamp를 사용한 고유한 프로젝트 이름 생성

---

## 🚀 Implementation Order

1. **Day 1: Page Objects 작성**
   - `ProjectsPage.ts` 작성 및 검증
   - `ProjectDetailPage.ts` 작성 및 검증
   - Database helpers 확장

2. **Day 2: CRUD 테스트 (생성, 조회)**
   - `create-project.spec.ts` 작성
   - `list-projects.spec.ts` 작성
   - `view-project.spec.ts` 작성

3. **Day 3: CRUD 테스트 (수정, 삭제)**
   - `edit-project.spec.ts` 작성
   - `delete-project.spec.ts` 작성

4. **Day 4: 크롤링 & 검증**
   - `run-crawling.spec.ts` 작성
   - 모든 테스트 통과 확인
   - 테스트 격리 검증
   - Story 완료 체크리스트 확인

---

## 📚 References

- **Tech-Spec**: `/docs/tech-spec.md`
- **Story 1**: `/docs/stories/story-1-infrastructure-auth.md`
- **기존 코드**:
  - `src/app/(dashboard)/dashboard/page.tsx` - 프로젝트 목록
  - `src/app/(dashboard)/dashboard/new/page.tsx` - 프로젝트 생성
  - `src/app/(dashboard)/dashboard/projects/[projectId]/page.tsx` - 프로젝트 상세

---

**Story Created**: 2025-11-23
**Last Updated**: 2025-11-23
