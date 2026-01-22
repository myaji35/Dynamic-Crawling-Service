import { test, expect } from '../../fixtures/auth'

test.describe('로그아웃 플로우', () => {
  test('로그아웃 후 홈 페이지로 이동', async ({ authenticatedPage }) => {
    // 인증된 페이지에서 시작
    await expect(authenticatedPage).toHaveURL(/.*dashboard/)

    // UserButton 클릭 (여러 셀렉터 시도)
    const userButton =
      authenticatedPage
        .locator('[data-testid="userButton"]')
        .or(authenticatedPage.locator('button[aria-label="User button"]'))
        .or(authenticatedPage.locator('button:has-text("User")')) ||
      authenticatedPage.locator('div[role="button"]').first()

    await userButton.waitFor({ state: 'visible', timeout: 10000 })
    await userButton.click()

    // Sign out 메뉴 대기 후 클릭
    const signOutButton = authenticatedPage.locator(
      'button:has-text("Sign out")'
    )
    await signOutButton.waitFor({ state: 'visible', timeout: 5000 })
    await signOutButton.click()

    // 홈 페이지 또는 로그인 페이지로 리다이렉트 확인
    await expect(authenticatedPage).toHaveURL(/\/$|\/sign-in/, {
      timeout: 10000,
    })
  })
})
