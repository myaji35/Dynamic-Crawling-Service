import { test, expect } from '../../fixtures/auth'
import { VisualBuilderPage } from '../../pages/VisualBuilderPage'

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
    const hasTitle = await visualBuilderPage.hasField('title')
    expect(hasTitle).toBeTruthy()

    // CSS 셀렉터도 표시되는지 확인
    await expect(authenticatedPage.locator('text=h3 a')).toBeVisible()
  })

  test('여러 필드 추가 가능', async () => {
    // 3개 필드 추가
    await visualBuilderPage.addField('title', 'h3 a')
    await visualBuilderPage.addField('price', '.price_color')
    await visualBuilderPage.addField('availability', '.availability')

    // 각 필드 확인
    const hasTitle = await visualBuilderPage.hasField('title')
    const hasPrice = await visualBuilderPage.hasField('price')
    const hasAvailability = await visualBuilderPage.hasField('availability')

    expect(hasTitle).toBeTruthy()
    expect(hasPrice).toBeTruthy()
    expect(hasAvailability).toBeTruthy()
  })

  test('빈 필드 이름으로 추가 시 에러 또는 추가 안됨', async () => {
    const initialCount = await visualBuilderPage.getFieldsCount()

    // 필드 이름 없이 추가 시도
    await visualBuilderPage.selectorInput.fill('h1')
    await visualBuilderPage.addFieldButton.click()

    await visualBuilderPage.page.waitForTimeout(500)

    // 필드가 추가되지 않음
    const afterCount = await visualBuilderPage.getFieldsCount()
    expect(afterCount).toBe(initialCount)
  })
})
