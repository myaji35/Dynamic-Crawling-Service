import { test, expect } from '../../fixtures/auth'
import { ProjectDetailPage } from '../../pages/ProjectDetailPage'
import {
  createTestProject,
  clearUserProjects,
} from '../../utils/database-helpers'

test.describe('프로젝트 수정', () => {
  const testUserId = process.env.TEST_USER_ID || 'test-user-id'
  let projectDetailPage: ProjectDetailPage

  test.beforeEach(async ({ authenticatedPage }) => {
    await clearUserProjects(testUserId)
    projectDetailPage = new ProjectDetailPage(authenticatedPage)
  })

  test('프로젝트 수정 페이지 접근', async ({ authenticatedPage }) => {
    const project = await createTestProject(testUserId, {
      name: 'Original Name',
    })

    await projectDetailPage.goto(project.id)

    // 수정 버튼 클릭
    await projectDetailPage.clickEdit()

    // 수정 페이지 또는 수정 모드로 진입 확인
    // (구현에 따라 URL이 변경되거나 모달이 표시될 수 있음)
    const currentUrl = authenticatedPage.url()
    const hasEditForm =
      currentUrl.includes('edit') ||
      (await authenticatedPage.locator('form').isVisible())

    expect(hasEditForm).toBeTruthy()
  })
})
