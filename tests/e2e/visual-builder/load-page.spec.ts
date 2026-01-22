import { test, expect } from '../../fixtures/auth'
import { VisualBuilderPage } from '../../pages/VisualBuilderPage'

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
    await expect(visualBuilderPage.heading).toBeVisible()

    // 주요 UI 요소 확인
    await expect(visualBuilderPage.urlInput).toBeVisible()
    await expect(visualBuilderPage.loadPreviewButton).toBeVisible()
    await expect(visualBuilderPage.fieldNameInput).toBeVisible()
    await expect(visualBuilderPage.selectorInput).toBeVisible()
    await expect(visualBuilderPage.addFieldButton).toBeVisible()
  })

  test('기본 URL이 입력되어 있음', async () => {
    const defaultUrl = await visualBuilderPage.getDefaultUrl()
    expect(defaultUrl).toBe('https://books.toscrape.com/')
  })
})
