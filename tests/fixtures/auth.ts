import { test as base, Page } from '@playwright/test'
import { ensureTestUser } from '../utils/database-helpers'

type AuthFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, context }, use) => {
    // 1. 테스트 사용자 DB 레코드 확보
    const testUserId = process.env.TEST_USER_ID
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com'

    if (testUserId) {
      await ensureTestUser(testUserId, testEmail)
    }

    // 2. Clerk 개발 모드에서 직접 세션 설정
    // Clerk 개발 모드는 __clerk_db_jwt 쿠키로 인증 가능
    await context.addCookies([
      {
        name: '__clerk_db_jwt',
        value: testUserId || '',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ])

    // 3. 대시보드로 직접 이동
    await page.goto('/dashboard')

    // 로그인 확인 - 로그인 페이지로 리다이렉트되지 않았는지 확인
    const currentUrl = page.url()
    if (currentUrl.includes('/sign-in')) {
      // 쿠키 방식이 실패하면 수동 로그인 시도
      console.warn('Cookie auth failed, falling back to manual login')

      // Google OAuth 사용 (가장 간단)
      const googleButton = page.getByRole('button', { name: /google/i }).first()
      await googleButton.waitFor({ state: 'visible', timeout: 5000 })
      await googleButton.click()

      // Google 로그인 팝업 처리는 복잡하므로 대시보드 도달 대기
      await page.waitForURL(/.*dashboard/, { timeout: 30000 })
    }

    await use(page)
  },
})

export { expect } from '@playwright/test'
