import { Page, Locator } from '@playwright/test'

export class ProjectsPage {
  readonly page: Page
  readonly newProjectButton: Locator
  readonly projectsList: Locator
  readonly searchInput: Locator
  readonly emptyStateMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.newProjectButton = page.locator('button:has-text("새 프로젝트")')
    this.projectsList = page
      .locator('[data-testid="projects-list"]')
      .or(page.locator('table tbody'))
    this.searchInput = page.locator('input[placeholder*="검색"]')
    this.emptyStateMessage = page.locator('text=프로젝트가 없습니다')
  }

  /**
   * 대시보드로 이동
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 새 프로젝트 버튼 클릭
   */
  async clickNewProject(): Promise<void> {
    await this.newProjectButton.click()
    await this.page.waitForURL(/.*\/dashboard\/new/)
  }

  /**
   * 프로젝트 개수 조회
   */
  async getProjectCount(): Promise<number> {
    const items = this.page
      .locator('[data-testid="project-item"]')
      .or(this.page.locator('table tbody tr'))

    try {
      return await items.count()
    } catch {
      return 0
    }
  }

  /**
   * 특정 프로젝트 클릭
   */
  async clickProject(projectName: string): Promise<void> {
    const projectLink = this.page
      .locator(`a:has-text("${projectName}")`)
      .or(this.page.locator(`text=${projectName}`))
    await projectLink.first().click()
  }

  /**
   * 프로젝트 존재 확인
   */
  async hasProject(projectName: string): Promise<boolean> {
    try {
      await this.page
        .locator(`text=${projectName}`)
        .first()
        .waitFor({ state: 'visible', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * 빈 상태 메시지 표시 확인
   */
  async isEmptyStateVisible(): Promise<boolean> {
    try {
      await this.emptyStateMessage.waitFor({ state: 'visible', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * 프로젝트 검색
   */
  async searchProject(query: string): Promise<void> {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(500) // 검색 디바운싱 대기
  }
}
