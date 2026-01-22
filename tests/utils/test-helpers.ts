import { Page } from '@playwright/test'

/**
 * 페이지 로딩 대기
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
}

/**
 * 요소가 사라질 때까지 대기
 */
export async function waitForElementToDisappear(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'hidden', timeout })
}

/**
 * 랜덤 문자열 생성
 */
export function generateRandomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 고유한 이메일 생성 (테스트용)
 */
export function generateTestEmail(): string {
  const timestamp = Date.now()
  const random = generateRandomString(6)
  return `test-${timestamp}-${random}@example.com`
}

/**
 * 스크린샷 캡처 (디버깅용)
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `tests/screenshots/${name}.png` })
}
