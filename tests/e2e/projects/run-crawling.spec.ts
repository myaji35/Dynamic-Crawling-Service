import { test, expect } from '../../fixtures/auth'
import { ProjectDetailPage } from '../../pages/ProjectDetailPage'
import {
  createTestProject,
  clearUserProjects,
} from '../../utils/database-helpers'

test.describe('크롤링 실행', () => {
  const testUserId = process.env.TEST_USER_ID || 'test-user-id'
  let projectDetailPage: ProjectDetailPage

  test.beforeEach(async ({ authenticatedPage }) => {
    await clearUserProjects(testUserId)
    projectDetailPage = new ProjectDetailPage(authenticatedPage)
  })

  test('단일 URL 크롤링 실행 버튼 표시', async ({ authenticatedPage }) => {
    const project = await createTestProject(testUserId, {
      name: 'Crawling Test',
      urls: ['https://books.toscrape.com/'],
      selectors: { title: 'h3 a', price: '.price_color' },
    })

    await projectDetailPage.goto(project.id)

    // 크롤링 실행 버튼 확인
    await expect(projectDetailPage.runCrawlingButton).toBeVisible()
  })

  test.skip('크롤링 실행 및 완료 대기', async ({ authenticatedPage }) => {
    // Note: 실제 크롤링은 시간이 오래 걸릴 수 있으므로 일부 환경에서는 스킵
    const project = await createTestProject(testUserId, {
      name: 'Crawling Execution Test',
      urls: ['https://books.toscrape.com/'],
      selectors: { title: 'h3 a', price: '.price_color' },
    })

    await projectDetailPage.goto(project.id)
    await projectDetailPage.runCrawling()

    // 크롤링 실행 중 상태 확인
    const isRunning = await projectDetailPage.isCrawlingRunning()
    if (isRunning) {
      // 크롤링 완료 대기 (최대 60초)
      await projectDetailPage.waitForCrawlingComplete(60000)

      // 결과 표시 확인
      const hasResults = await projectDetailPage.hasResults()
      expect(hasResults).toBeTruthy()
    }
  })

  test('유효하지 않은 URL 프로젝트 생성', async ({ authenticatedPage }) => {
    const project = await createTestProject(testUserId, {
      name: 'Invalid URL Test',
      urls: ['https://invalid-url-that-does-not-exist-12345.com/'],
    })

    await projectDetailPage.goto(project.id)

    // 프로젝트는 생성되었지만 URL이 표시됨
    await expect(authenticatedPage.locator('text=invalid-url')).toBeVisible()
  })
})
