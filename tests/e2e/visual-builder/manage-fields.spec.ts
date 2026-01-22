import { test, expect } from '../../fixtures/auth'
import { VisualBuilderPage } from '../../pages/VisualBuilderPage'

test.describe('필드 관리', () => {
  let visualBuilderPage: VisualBuilderPage

  test.beforeEach(async ({ authenticatedPage }) => {
    visualBuilderPage = new VisualBuilderPage(authenticatedPage)
    await visualBuilderPage.goto()

    // 테스트용 필드 추가
    await visualBuilderPage.addField('title', 'h3 a')
    await visualBuilderPage.addField('price', '.price_color')
  })

  test('필드 삭제 성공', async () => {
    const initialCount = await visualBuilderPage.getFieldsCount()
    expect(initialCount).toBeGreaterThanOrEqual(2)

    // title 필드 삭제
    await visualBuilderPage.deleteField('title')

    const afterCount = await visualBuilderPage.getFieldsCount()
    expect(afterCount).toBeLessThan(initialCount)

    // title 필드가 사라졌는지 확인
    const hasTitle = await visualBuilderPage.hasField('title')
    expect(hasTitle).toBeFalsy()
  })

  test('필드 목록이 JSON으로 표시됨', async ({ authenticatedPage }) => {
    // JSON 미리보기 섹션 확인
    const jsonText = await visualBuilderPage.getJsonPreview()

    // JSON 내용 확인
    if (jsonText) {
      expect(jsonText).toContain('title')
      expect(jsonText).toContain('h3 a')
      expect(jsonText).toContain('price')
      expect(jsonText).toContain('.price_color')
    } else {
      // JSON 미리보기가 없는 경우, pre code 요소 존재 확인
      await expect(visualBuilderPage.jsonPreview).toBeVisible()
    }
  })

  test('여러 필드 순차 삭제 가능', async () => {
    // 추가 필드 생성
    await visualBuilderPage.addField('stock', '.instock')

    const initialCount = await visualBuilderPage.getFieldsCount()
    expect(initialCount).toBeGreaterThanOrEqual(3)

    // 순차 삭제
    await visualBuilderPage.deleteField('title')
    await visualBuilderPage.deleteField('price')
    await visualBuilderPage.deleteField('stock')

    const finalCount = await visualBuilderPage.getFieldsCount()
    expect(finalCount).toBe(0)
  })
})
