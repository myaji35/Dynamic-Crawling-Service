import { Page, Locator } from '@playwright/test'

export class VisualBuilderPage {
  readonly page: Page
  readonly heading: Locator
  readonly urlInput: Locator
  readonly loadPreviewButton: Locator
  readonly previewIframe: Locator
  readonly fieldNameInput: Locator
  readonly selectorInput: Locator
  readonly addFieldButton: Locator
  readonly testSelectorButton: Locator
  readonly fieldsList: Locator
  readonly aiSuggestButton: Locator
  readonly saveButton: Locator
  readonly jsonPreview: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h1:has-text("Visual Builder")')
    this.urlInput = page.locator('input[id="url"]')
    this.loadPreviewButton = page.locator('button:has-text("페이지 로드")')
    this.previewIframe = page
      .locator('iframe[data-testid="preview-iframe"]')
      .or(page.locator('iframe').first())
    this.fieldNameInput = page.locator('input[placeholder*="필드 이름"]')
    this.selectorInput = page.locator('input[placeholder*="CSS 셀렉터"]')
    this.addFieldButton = page.locator('button:has-text("추가")')
    this.testSelectorButton = page.locator('button:has-text("테스트")')
    this.fieldsList = page
      .locator('[data-testid="fields-list"]')
      .or(page.locator('div').filter({ hasText: /필드/ }))
    this.aiSuggestButton = page.locator('button:has-text("AI 추천")')
    this.saveButton = page.locator('button:has-text("저장")')
    this.jsonPreview = page.locator('pre code')
  }

  /**
   * Visual Builder 페이지로 이동
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard/visual-builder-demo')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 페이지 로드 확인
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.heading.waitFor({ state: 'visible', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * 페이지 프리뷰 로드
   */
  async loadPreview(url: string): Promise<void> {
    await this.urlInput.fill(url)
    await this.loadPreviewButton.click()

    // iframe 로딩 대기
    await this.page.waitForTimeout(2000)
  }

  /**
   * 필드 추가
   */
  async addField(fieldName: string, selector: string): Promise<void> {
    await this.fieldNameInput.fill(fieldName)
    await this.selectorInput.fill(selector)
    await this.addFieldButton.click()

    // 필드 추가 후 잠시 대기
    await this.page.waitForTimeout(500)
  }

  /**
   * 셀렉터 테스트
   */
  async testSelector(selector: string): Promise<void> {
    await this.selectorInput.fill(selector)
    await this.testSelectorButton.click()

    // 테스트 결과 대기
    await this.page.waitForTimeout(1000)
  }

  /**
   * 필드 개수 조회
   */
  async getFieldsCount(): Promise<number> {
    const items = this.page
      .locator('[data-testid="field-item"]')
      .or(this.page.locator('li').filter({ hasText: /title|price|selector/ }))

    try {
      return await items.count()
    } catch {
      return 0
    }
  }

  /**
   * 필드 삭제
   */
  async deleteField(fieldName: string): Promise<void> {
    const fieldItem = this.page
      .locator(`[data-testid="field-item"]:has-text("${fieldName}")`)
      .or(this.page.locator(`li:has-text("${fieldName}")`))

    const deleteButton = fieldItem
      .locator('button[aria-label="삭제"]')
      .or(fieldItem.locator('button').filter({ hasText: /삭제|delete|×/i }))

    await deleteButton.click()
    await this.page.waitForTimeout(500)
  }

  /**
   * 필드 존재 확인
   */
  async hasField(fieldName: string): Promise<boolean> {
    try {
      await this.page
        .locator(`text=${fieldName}`)
        .first()
        .waitFor({ state: 'visible', timeout: 3000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * JSON 미리보기 텍스트 조회
   */
  async getJsonPreview(): Promise<string> {
    try {
      return (await this.jsonPreview.textContent()) || ''
    } catch {
      return ''
    }
  }

  /**
   * 기본 URL 값 조회
   */
  async getDefaultUrl(): Promise<string> {
    return (await this.urlInput.inputValue()) || ''
  }

  /**
   * AI 추천 버튼 클릭
   */
  async clickAiSuggest(): Promise<void> {
    await this.aiSuggestButton.click()
    await this.page.waitForTimeout(2000) // AI 응답 대기
  }

  /**
   * 저장 버튼 클릭
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click()
  }
}
