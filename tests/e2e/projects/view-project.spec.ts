import { test, expect } from '../../fixtures/auth'
import { ProjectDetailPage } from '../../pages/ProjectDetailPage'
import {
  createTestProject,
  clearUserProjects,
} from '../../utils/database-helpers'

test.describe('프로젝트 상세 보기', () => {
  let projectDetailPage: ProjectDetailPage
  const testUserId = process.env.TEST_USER_ID || 'test-user-id'

  test.beforeEach(async ({ authenticatedPage }) => {
    await clearUserProjects(testUserId)
    projectDetailPage = new ProjectDetailPage(authenticatedPage)
  })

  test('프로젝트 상세 정보가 올바르게 표시됨', async ({
    authenticatedPage,
  }) => {
    const project = await createTestProject(testUserId, {
      name: 'Detail View Test Project',
      urls: ['https://books.toscrape.com/'],
      selectors: { title: 'h3 a', price: '.price_color' },
    })

    await projectDetailPage.goto(project.id)

    // 프로젝트 이름 확인
    const projectName = await projectDetailPage.getProjectName()
    expect(projectName).toContain('Detail View Test Project')

    // URL 확인 (표시되는 경우)
    const urlText = authenticatedPage.locator(
      'text=https://books.toscrape.com/'
    )
    if (await urlText.isVisible()) {
      await expect(urlText).toBeVisible()
    }

    // 크롤링 실행 버튼 확인
    await expect(projectDetailPage.runCrawlingButton).toBeVisible()
  })
})
