import { test, expect } from '../../fixtures/auth'
import { VisualBuilderPage } from '../../pages/VisualBuilderPage'

test.describe('셀렉터 테스트', () => {
  let visualBuilderPage: VisualBuilderPage

  test.beforeEach(async ({ authenticatedPage }) => {
    visualBuilderPage = new VisualBuilderPage(authenticatedPage)
    await visualBuilderPage.goto()
  })

  test.skip('유효한 셀렉터 테스트 (페이지 로드 필요)', async ({
    authenticatedPage,
  }) => {
    // Note: 실제 페이지 프리뷰 로드가 필요하므로 일부 환경에서는 스킵

    // 페이지 프리뷰 로드
    await visualBuilderPage.loadPreview('https://books.toscrape.com/')

    // 셀렉터 테스트
    await visualBuilderPage.testSelector('h3 a')

    // 테스트 결과 확인 (매칭된 요소 수 표시)
    await expect(
      authenticatedPage.locator('text=/발견된 요소|elements? found/i')
    ).toBeVisible({ timeout: 5000 })
  })

  test('셀렉터 입력 필드 동작 확인', async () => {
    // 셀렉터 입력
    await visualBuilderPage.selectorInput.fill('.test-selector')

    const value = await visualBuilderPage.selectorInput.inputValue()
    expect(value).toBe('.test-selector')
  })
})
