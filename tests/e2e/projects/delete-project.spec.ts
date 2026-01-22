import { test, expect } from '../../fixtures/auth'
import { ProjectDetailPage } from '../../pages/ProjectDetailPage'
import {
  createTestProject,
  clearUserProjects,
  getProjectByName,
} from '../../utils/database-helpers'

test.describe('프로젝트 삭제', () => {
  const testUserId = process.env.TEST_USER_ID || 'test-user-id'
  let projectDetailPage: ProjectDetailPage

  test.beforeEach(async ({ authenticatedPage }) => {
    await clearUserProjects(testUserId)
    projectDetailPage = new ProjectDetailPage(authenticatedPage)
  })

  test('프로젝트 삭제 성공', async ({ authenticatedPage }) => {
    const project = await createTestProject(testUserId, {
      name: 'To Delete Project',
    })

    await projectDetailPage.goto(project.id)
    await projectDetailPage.clickDelete()

    // 삭제 확인 모달 표시 확인
    const confirmDialog =
      authenticatedPage.locator('text=정말 삭제하시겠습니까?') ||
      authenticatedPage.locator('[role="dialog"]')

    if (await confirmDialog.isVisible()) {
      await projectDetailPage.confirmDelete()
    }

    // 대시보드로 리다이렉트 확인
    await expect(authenticatedPage).toHaveURL(/.*\/dashboard/, {
      timeout: 10000,
    })

    // DB에서 프로젝트가 삭제되었는지 확인
    const deleted = await getProjectByName('To Delete Project')
    expect(deleted).toBeNull()
  })

  test('삭제 취소 시 프로젝트 유지', async ({ authenticatedPage }) => {
    const project = await createTestProject(testUserId, {
      name: 'Keep Project',
    })

    await projectDetailPage.goto(project.id)
    await projectDetailPage.clickDelete()

    // 삭제 확인 모달에서 취소 클릭
    const confirmDialog = authenticatedPage.locator('[role="dialog"]')
    if (await confirmDialog.isVisible()) {
      await projectDetailPage.cancelDelete()

      // 프로젝트 상세 페이지에 그대로 있음
      const projectName = await projectDetailPage.getProjectName()
      expect(projectName).toContain('Keep Project')
    }

    // DB에서도 존재 확인
    const kept = await getProjectByName('Keep Project')
    expect(kept).not.toBeNull()
  })
})
