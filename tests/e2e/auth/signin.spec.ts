import { test, expect } from '@playwright/test'

test.describe('로그인 플로우', () => {
  test('유효한 자격증명으로 로그인 성공', async ({ page }) => {
    await page.goto('/sign-in')

    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com'
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

    // 이메일 입력
    const emailInput = page.locator('input[name="identifier"]')
    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await emailInput.fill(testEmail)

    // Continue 버튼 클릭 (이메일 폼의 Continue 버튼만 선택)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    // 이메일 인증 코드 화면이 나타나면 "Use another method" 클릭
    const useAnotherMethod = page.getByRole('link', {
      name: 'Use another method',
    })

    try {
      await useAnotherMethod.waitFor({ state: 'visible', timeout: 5000 })
      await useAnotherMethod.click()

      // 비밀번호 옵션이 있는지 확인하고 클릭
      const passwordButton = page.getByRole('button', { name: /password/i })
      await passwordButton.waitFor({ state: 'visible', timeout: 3000 })
      await passwordButton.click()
    } catch (error) {
      // "Use another method"가 없으면 계속 진행 (이미 비밀번호 화면)
      console.log('No "Use another method" found, continuing...')
    }

    // 비밀번호 입력 필드가 활성화될 때까지 대기
    const passwordInput = page.locator('input[name="password"]:not([disabled])')
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 })
    await passwordInput.fill(testPassword)

    // 로그인 제출 (비밀번호 입력 후 Continue 버튼 다시 클릭)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 })
    await expect(page.locator('h2:has-text("DCS")')).toBeVisible()
  })

  test('빈 이메일로 로그인 시도 시 에러', async ({ page }) => {
    await page.goto('/sign-in')

    // Continue 버튼 클릭 (이메일 입력 없이)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    // 에러 메시지 또는 진행되지 않음 확인
    // Clerk는 클라이언트 측에서 검증하므로 URL이 변경되지 않음
    await expect(page).toHaveURL(/.*sign-in/)
  })
})
