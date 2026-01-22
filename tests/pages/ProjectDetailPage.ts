import { Page, Locator } from '@playwright/test'

export class ProjectDetailPage {
  readonly page: Page
  readonly projectName: Locator
  readonly editButton: Locator
  readonly deleteButton: Locator
  readonly runCrawlingButton: Locator
  readonly statusBadge: Locator
  readonly urlsList: Locator
  readonly crawlResults: Locator

  constructor(page: Page) {
    this.page = page
    this.projectName = page.locator('h1').or(page.locator('h2').first())
    this.editButton = page.locator('button:has-text("수정")')
    this.deleteButton = page.locator('button:has-text("삭제")')
    this.runCrawlingButton = page.locator('button:has-text("크롤링 실행")')
    this.statusBadge = page
      .locator('[data-testid="project-status"]')
      .or(page.locator('span:has-text("active")'))
    this.urlsList = page.locator('[data-testid="urls-list"]')
    this.crawlResults = page
      .locator('[data-testid="crawl-results"]')
      .or(page.locator('table'))
  }

  /**
   * 프로젝트 상세 페이지로 이동
   */
  async goto(projectId: string): Promise<void> {
    await this.page.goto(`/dashboard/projects/${projectId}`)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 수정 버튼 클릭
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click()
  }

  /**
   * 삭제 버튼 클릭
   */
  async clickDelete(): Promise<void> {
    await this.deleteButton.click()
  }

  /**
   * 삭제 확인 (모달)
   */
  async confirmDelete(): Promise<void> {
    const confirmButton = this.page
      .locator('button:has-text("확인")')
      .or(this.page.locator('button:has-text("Delete")'))
      .or(this.page.locator('button:has-text("삭제")'))

    await confirmButton.waitFor({ state: 'visible', timeout: 5000 })
    await confirmButton.click()
  }

  /**
   * 삭제 취소
   */
  async cancelDelete(): Promise<void> {
    const cancelButton = this.page
      .locator('button:has-text("취소")')
      .or(this.page.locator('button:has-text("Cancel")'))

    await cancelButton.click()
  }

  /**
   * 크롤링 실행
   */
  async runCrawling(): Promise<void> {
    await this.runCrawlingButton.click()
  }

  /**
   * 프로젝트 이름 조회
   */
  async getProjectName(): Promise<string> {
    return (await this.projectName.textContent()) || ''
  }

  /**
   * 프로젝트 상태 조회
   */
  async getStatus(): Promise<string> {
    return (await this.statusBadge.textContent()) || ''
  }

  /**
   * 크롤링 실행 중 상태 확인
   */
  async isCrawlingRunning(): Promise<boolean> {
    try {
      await this.page
        .locator('text=크롤링 실행 중')
        .or(this.page.locator('text=Running'))
        .waitFor({ state: 'visible', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * 크롤링 완료 대기
   */
  async waitForCrawlingComplete(timeout = 60000): Promise<void> {
    await this.page
      .locator('text=완료')
      .or(this.page.locator('text=Completed'))
      .waitFor({ state: 'visible', timeout })
  }

  /**
   * 크롤링 결과 표시 확인
   */
  async hasResults(): Promise<boolean> {
    try {
      await this.crawlResults.waitFor({ state: 'visible', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }
}
