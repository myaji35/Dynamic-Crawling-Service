import { test, expect } from '@playwright/test'
import { test as authTest } from '../../fixtures/auth'

test.describe('대시보드 접근 제어', () => {
  test('인증되지 않은 사용자는 로그인 페이지로 리다이렉트', async ({
    page,
  }) => {
    await page.goto('/dashboard')

    // Clerk가 자동으로 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 })
  })

  authTest(
    '인증된 사용자는 대시보드 접근 가능',
    async ({ authenticatedPage }) => {
      // 인증 픽스처를 통해 이미 로그인된 상태

      // 대시보드 URL 확인
      await expect(authenticatedPage).toHaveURL(/.*dashboard/)

      // 대시보드 헤더 확인
      await expect(
        authenticatedPage.locator('h2:has-text("DCS")')
      ).toBeVisible()

      // 새 프로젝트 버튼 확인
      await expect(
        authenticatedPage.locator('button:has-text("새 프로젝트")')
      ).toBeVisible()
    }
  )
})
