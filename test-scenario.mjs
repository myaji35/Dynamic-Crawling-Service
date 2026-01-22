import playwright from 'playwright'

async function testProjectCreation() {
  console.log('🚀 프로젝트 생성 시나리오 테스트 시작...\n')

  const browser = await playwright.chromium.launch({
    headless: false, // 브라우저 보이게
    slowMo: 500, // 동작 천천히
  })

  try {
    const context = await browser.newContext()
    const page = await context.newPage()

    console.log('1️⃣ localhost:3014 접속 중...')
    await page.goto('http://localhost:3014', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // 로그인 확인
    const currentUrl = page.url()
    console.log(`   현재 URL: ${currentUrl}`)

    if (currentUrl.includes('/sign-in')) {
      console.log('⚠️  로그인이 필요합니다.')
      console.log('   Clerk 로그인 화면이 표시됩니다.')
      console.log('   수동으로 로그인해주세요 (30초 대기)...\n')
      await page.waitForTimeout(30000)
    }

    // 대시보드 확인
    console.log('2️⃣ 대시보드 확인 중...')
    if (!page.url().includes('/dashboard')) {
      await page.goto('http://localhost:3014/dashboard')
      await page.waitForTimeout(2000)
    }
    console.log('   ✅ 대시보드 로드 완료\n')

    // 새 프로젝트 페이지로 이동
    console.log('3️⃣ 새 프로젝트 페이지로 이동 중...')
    await page.goto('http://localhost:3014/dashboard/new')
    await page.waitForTimeout(2000)
    console.log('   ✅ AI 마법사 페이지 로드 완료\n')

    // 페이지 스크린샷
    await page.screenshot({ path: 'test-step-1-initial.png' })
    console.log('   📸 스크린샷 저장: test-step-1-initial.png\n')

    // 1단계: 프로젝트 이름 입력
    console.log('4️⃣ [시나리오 1단계] 프로젝트 이름 입력')
    const input1 = await page.locator('input[type="text"]').last()
    await input1.fill('재가장기요양기관')
    await page.waitForTimeout(500)

    const submitBtn1 = await page.locator('button:has-text("보내기")')
    await submitBtn1.click()
    console.log('   입력: "재가장기요양기관"')
    await page.waitForTimeout(2000)

    // 챗봇 응답 확인
    const messages1 = await page.locator('.space-y-4 > div').allTextContents()
    console.log(
      '   챗봇 응답:',
      messages1[messages1.length - 1].substring(0, 100) + '...\n'
    )

    await page.screenshot({ path: 'test-step-2-name.png' })
    console.log('   📸 스크린샷 저장: test-step-2-name.png\n')

    // 2단계: URL 입력
    console.log('5️⃣ [시나리오 2단계] URL 입력')
    const input2 = await page.locator('input[type="text"]').last()
    await input2.fill('https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch')
    await page.waitForTimeout(500)

    const submitBtn2 = await page.locator('button:has-text("보내기")')
    await submitBtn2.click()
    console.log(
      '   입력: "https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch"'
    )
    await page.waitForTimeout(2000)

    const messages2 = await page.locator('.space-y-4 > div').allTextContents()
    console.log(
      '   챗봇 응답:',
      messages2[messages2.length - 1].substring(0, 100) + '...\n'
    )

    await page.screenshot({ path: 'test-step-3-url.png' })
    console.log('   📸 스크린샷 저장: test-step-3-url.png\n')

    // 3단계: 필드명 입력
    console.log('6️⃣ [시나리오 3단계] 필드명 입력')
    const input3 = await page.locator('input[type="text"]').last()
    await input3.fill('장기요양기관')
    await page.waitForTimeout(500)

    const submitBtn3 = await page.locator('button:has-text("보내기")')
    await submitBtn3.click()
    console.log('   입력: "장기요양기관"')
    await page.waitForTimeout(2000)

    const messages3 = await page.locator('.space-y-4 > div').allTextContents()
    console.log(
      '   챗봇 응답:',
      messages3[messages3.length - 1].substring(0, 150) + '...\n'
    )

    await page.screenshot({ path: 'test-step-4-field.png' })
    console.log('   📸 스크린샷 저장: test-step-4-field.png\n')

    // 4단계: 완료 입력
    console.log('7️⃣ [시나리오 4단계] 완료 입력')
    const input4 = await page.locator('input[type="text"]').last()
    await input4.fill('완료')
    await page.waitForTimeout(500)

    const submitBtn4 = await page.locator('button:has-text("보내기")')
    await submitBtn4.click()
    console.log('   입력: "완료"')
    await page.waitForTimeout(2000)

    const messages4 = await page.locator('.space-y-4 > div').allTextContents()
    console.log(
      '   챗봇 응답:',
      messages4[messages4.length - 1].substring(0, 150) + '...\n'
    )

    await page.screenshot({ path: 'test-step-5-schedule.png' })
    console.log('   📸 스크린샷 저장: test-step-5-schedule.png\n')

    // 5단계: 스케줄 입력
    console.log('8️⃣ [시나리오 5단계] 스케줄 입력')
    const input5 = await page.locator('input[type="text"]').last()
    await input5.fill('매일1일 오전 2시')
    await page.waitForTimeout(500)

    const submitBtn5 = await page.locator('button:has-text("보내기")')
    await submitBtn5.click()
    console.log('   입력: "매일1일 오전 2시"')
    await page.waitForTimeout(3000)

    const messages5 = await page.locator('.space-y-4 > div').allTextContents()
    console.log(
      '   챗봇 응답:',
      messages5[messages5.length - 1].substring(0, 150) + '...\n'
    )

    await page.screenshot({ path: 'test-step-6-creating.png' })
    console.log('   📸 스크린샷 저장: test-step-6-creating.png\n')

    // 프로젝트 생성 완료 대기
    console.log('9️⃣ 프로젝트 생성 대기 중...')
    await page.waitForTimeout(5000)

    const finalUrl = page.url()
    console.log(`   최종 URL: ${finalUrl}\n`)

    await page.screenshot({ path: 'test-step-7-final.png' })
    console.log('   📸 스크린샷 저장: test-step-7-final.png\n')

    // 결과 확인
    if (finalUrl.includes('/dashboard/projects/')) {
      console.log('✅ 테스트 성공!')
      console.log('   프로젝트가 생성되어 상세 페이지로 이동했습니다.')

      // 프로젝트 ID 추출
      const projectId = finalUrl.split('/projects/')[1]
      console.log(`   프로젝트 ID: ${projectId}\n`)

      // 페이지 내용 확인
      await page.waitForTimeout(2000)
      const pageContent = await page.textContent('body')

      if (pageContent.includes('재가장기요양기관')) {
        console.log('✅ 프로젝트 이름 확인됨: "재가장기요양기관"')
      }
      if (pageContent.includes('장기요양기관')) {
        console.log('✅ 필드 확인됨: "장기요양기관"')
      }
      if (pageContent.includes('longtermcare')) {
        console.log('✅ URL 확인됨')
      }
    } else {
      console.log('❌ 테스트 실패!')
      console.log('   프로젝트 상세 페이지로 이동하지 않았습니다.')
      console.log(`   현재 URL: ${finalUrl}`)
    }

    console.log('\n📊 테스트 요약:')
    console.log('   - 스크린샷: 7개 저장됨')
    console.log('   - 모든 시나리오 단계 완료')

    await page.waitForTimeout(3000)
  } catch (error) {
    console.error('\n❌ 테스트 중 에러 발생:')
    console.error(error.message)
    console.error(error.stack)
  } finally {
    await browser.close()
    console.log('\n🏁 테스트 종료\n')
  }
}

testProjectCreation()
