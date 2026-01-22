import { test, expect } from '@playwright/test'
import { generateTestEmail } from '../../utils/test-helpers'

test.describe('회원가입 플로우', () => {
  test('새 계정 회원가입 페이지 접근', async ({ page }) => {
    await page.goto('/sign-up')

    // 회원가입 페이지 로드 확인
    await expect(
      page.locator('h1,h2').filter({ hasText: /sign up/i })
    ).toBeVisible({
      timeout: 10000,
    })

    // 이메일 입력 필드 확인
    const emailInput = page
      .locator('input[name="emailAddress"]')
      .or(page.locator('input[type="email"]'))
    await expect(emailInput).toBeVisible()
  })

  test.skip('새 계정으로 회원가입 성공', async ({ page }) => {
    // Note: 실제 회원가입은 Clerk에서 이메일 인증이 필요하므로 스킵
    // 이 테스트는 수동 테스트 또는 Clerk Test Mode에서만 가능

    await page.goto('/sign-up')

    const testEmail = generateTestEmail()
    const testPassword = 'TestPassword123!'

    // 이메일 입력
    await page.fill('input[name="emailAddress"]', testEmail)

    // 비밀번호 입력
    await page.fill('input[name="password"]', testPassword)

    // Continue 버튼 클릭
    await page.click('button[type="submit"]')

    // 이메일 인증 페이지로 이동 확인
    await expect(page).toHaveURL(/verify/)
  })
})
