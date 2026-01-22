import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly newProjectButton: Locator
  readonly userButton: Locator
  readonly statCards: Locator
  readonly visualBuilderLink: Locator
  readonly dashboardLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h2:has-text("DCS")')
    this.newProjectButton = page.locator('button:has-text("새 프로젝트")')
    this.userButton = page
      .locator('[data-testid="userButton"]')
      .or(page.locator('button[aria-label="User button"]'))
    this.statCards = page.locator('[data-testid="stat-card"]')
    this.visualBuilderLink = page.locator('button:has-text("Visual Builder")')
    this.dashboardLink = page.locator('button:has-text("대시보드")')
  }

  /**
   * 대시보드로 이동
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard')
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
   * 새 프로젝트 버튼 클릭
   */
  async clickNewProject(): Promise<void> {
    await this.newProjectButton.click()
    await this.page.waitForURL(/.*\/dashboard\/new/)
  }

  /**
   * Visual Builder로 이동
   */
  async clickVisualBuilder(): Promise<void> {
    await this.visualBuilderLink.click()
    await this.page.waitForURL(/.*visual-builder/)
  }

  /**
   * 통계 카드 개수 확인
   */
  async getStatCardsCount(): Promise<number> {
    return await this.statCards.count()
  }

  /**
   * 사용자 버튼 클릭 (로그아웃용)
   */
  async clickUserButton(): Promise<void> {
    await this.userButton.click()
  }
}
