import { test, expect } from '../../fixtures/auth'
import { ProjectsPage } from '../../pages/ProjectsPage'
import { clearUserProjects } from '../../utils/database-helpers'

test.describe('프로젝트 생성', () => {
  let projectsPage: ProjectsPage
  const testUserId = process.env.TEST_USER_ID || 'test-user-id'

  test.beforeEach(async ({ authenticatedPage }) => {
    // 테스트 격리: 기존 프로젝트 삭제
    await clearUserProjects(testUserId)

    projectsPage = new ProjectsPage(authenticatedPage)
    await projectsPage.goto()
  })

  test('새 프로젝트 생성 페이지 접근', async ({ authenticatedPage }) => {
    await projectsPage.clickNewProject()

    // 프로젝트 생성 페이지 확인
    await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/new/)

    // 프로젝트 생성 UI 요소 확인
    await expect(
      authenticatedPage.locator('h1,h2').filter({ hasText: /프로젝트/i })
    ).toBeVisible()
  })

  test('필수 필드 없이 다음 버튼 클릭 시 진행 안됨', async ({
    authenticatedPage,
  }) => {
    await projectsPage.clickNewProject()

    // URL 확인
    const currentUrl = authenticatedPage.url()

    // 다음 버튼 클릭 시도 (필드 입력 없이)
    const nextButton = authenticatedPage
      .locator('button:has-text("다음")')
      .or(authenticatedPage.locator('button:has-text("Next")'))

    if (await nextButton.isVisible()) {
      await nextButton.click()
      await authenticatedPage.waitForTimeout(1000)

      // URL이 변경되지 않았거나 에러 메시지 표시
      const newUrl = authenticatedPage.url()
      expect(newUrl).toBe(currentUrl)
    }
  })
})
