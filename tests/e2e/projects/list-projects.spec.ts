import { test, expect } from '../../fixtures/auth'
import { ProjectsPage } from '../../pages/ProjectsPage'
import {
  createTestProject,
  clearUserProjects,
} from '../../utils/database-helpers'

test.describe('프로젝트 목록 조회', () => {
  let projectsPage: ProjectsPage
  const testUserId = process.env.TEST_USER_ID || 'test-user-id'

  test.beforeEach(async ({ authenticatedPage }) => {
    await clearUserProjects(testUserId)
    projectsPage = new ProjectsPage(authenticatedPage)
  })

  test('프로젝트 목록이 올바르게 표시됨', async ({ authenticatedPage }) => {
    // 테스트 데이터 생성
    await createTestProject(testUserId, { name: 'Test Project 1' })
    await createTestProject(testUserId, { name: 'Test Project 2' })
    await createTestProject(testUserId, { name: 'Test Project 3' })

    await projectsPage.goto()

    // 프로젝트 개수 확인
    const count = await projectsPage.getProjectCount()
    expect(count).toBeGreaterThanOrEqual(3)

    // 각 프로젝트 이름 확인
    await expect(authenticatedPage.locator('text=Test Project 1')).toBeVisible()
    await expect(authenticatedPage.locator('text=Test Project 2')).toBeVisible()
    await expect(authenticatedPage.locator('text=Test Project 3')).toBeVisible()
  })

  test('프로젝트가 없을 때 빈 상태 메시지 표시', async ({
    authenticatedPage,
  }) => {
    await projectsPage.goto()

    // 빈 상태 메시지 확인
    const isEmpty = await projectsPage.isEmptyStateVisible()

    if (isEmpty) {
      await expect(
        authenticatedPage.locator('text=프로젝트가 없습니다')
      ).toBeVisible()
    } else {
      // 또는 프로젝트 개수가 0
      const count = await projectsPage.getProjectCount()
      expect(count).toBe(0)
    }
  })
})
