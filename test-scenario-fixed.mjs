import playwright from 'playwright'

async function testProjectCreation() {
  console.log('🚀 프로젝트 생성 시나리오 자동 테스트 시작...\n')

  const browser = await playwright.chromium.launch({
    headless: true, // 백그라운드 실행
  })

  try {
    const context = await browser.newContext()
    const page = await context.newPage()

    console.log('1️⃣ localhost:3014 접속 중...')
    await page.goto('http://localhost:3014', {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
    await page.waitForTimeout(2000)

    const currentUrl = page.url()
    console.log(`   현재 URL: ${currentUrl}`)

    if (currentUrl.includes('/sign-in')) {
      console.log('❌ 로그인이 필요합니다. 수동 로그인 후 다시 시도해주세요.\n')
      await browser.close()
      return
    }

    console.log('   ✅ 로그인 상태 확인\n')

    // 새 프로젝트 페이지로 이동
    console.log('2️⃣ 새 프로젝트 페이지로 이동 중...')
    await page.goto('http://localhost:3014/dashboard/new', {
      waitUntil: 'networkidle',
    })
    await page.waitForTimeout(2000)
    console.log('   ✅ AI 마법사 페이지 로드 완료\n')

    await page.screenshot({ path: 'test-step-1-initial.png' })
    console.log('   📸 스크린샷: test-step-1-initial.png\n')

    // 1단계: 프로젝트 이름 입력
    console.log('3️⃣ [Step 1] 프로젝트 이름 입력: "재가장기요양기관"')
    const input1 = await page.locator('input[type="text"]').last()
    await input1.fill('재가장기요양기관')
    await page.waitForTimeout(500)

    // "전송" 버튼 클릭 (수정됨!)
    const submitBtn1 = await page.locator('button:has-text("전송")')
    await submitBtn1.click()
    console.log('   ✅ 전송 완료')
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'test-step-2-name.png' })
    console.log('   📸 스크린샷: test-step-2-name.png\n')

    // 2단계: URL 입력
    console.log('4️⃣ [Step 2] URL 입력')
    const input2 = await page.locator('input[type="text"]').last()
    await input2.fill('https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch')
    await page.waitForTimeout(500)

    const submitBtn2 = await page.locator('button:has-text("전송")')
    await submitBtn2.click()
    console.log('   ✅ 전송 완료')
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'test-step-3-url.png' })
    console.log('   📸 스크린샷: test-step-3-url.png\n')

    // 3단계: 필드명 입력
    console.log('5️⃣ [Step 3] 필드명 입력: "장기요양기관"')
    const input3 = await page.locator('input[type="text"]').last()
    await input3.fill('장기요양기관')
    await page.waitForTimeout(500)

    const submitBtn3 = await page.locator('button:has-text("전송")')
    await submitBtn3.click()
    console.log('   ✅ 전송 완료')
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'test-step-4-field.png' })
    console.log('   📸 스크린샷: test-step-4-field.png\n')

    // 4단계: 완료 입력
    console.log('6️⃣ [Step 4] 완료 입력')
    const input4 = await page.locator('input[type="text"]').last()
    await input4.fill('완료')
    await page.waitForTimeout(500)

    const submitBtn4 = await page.locator('button:has-text("전송")')
    await submitBtn4.click()
    console.log('   ✅ 전송 완료')
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'test-step-5-schedule.png' })
    console.log('   📸 스크린샷: test-step-5-schedule.png\n')

    // 5단계: 스케줄 입력
    console.log('7️⃣ [Step 5] 스케줄 입력: "매일1일 오전 2시"')
    const input5 = await page.locator('input[type="text"]').last()
    await input5.fill('매일1일 오전 2시')
    await page.waitForTimeout(500)

    const submitBtn5 = await page.locator('button:has-text("전송")')
    await submitBtn5.click()
    console.log('   ✅ 전송 완료')
    await page.waitForTimeout(3000)

    await page.screenshot({ path: 'test-step-6-creating.png' })
    console.log('   📸 스크린샷: test-step-6-creating.png\n')

    // 프로젝트 생성 완료 대기
    console.log('8️⃣ 프로젝트 생성 대기 중...')
    await page.waitForTimeout(5000)

    const finalUrl = page.url()
    console.log(`   최종 URL: ${finalUrl}\n`)

    await page.screenshot({ path: 'test-step-7-final.png' })
    console.log('   📸 스크린샷: test-step-7-final.png\n')

    // 결과 확인
    console.log('═══════════════════════════════════════')
    console.log('           테스트 결과 요약')
    console.log('═══════════════════════════════════════\n')

    if (finalUrl.includes('/dashboard/projects/')) {
      console.log('✅ 테스트 성공!\n')

      const projectId = finalUrl.split('/projects/')[1]
      console.log(`   프로젝트 ID: ${projectId}`)

      // 페이지 내용 확인
      await page.waitForTimeout(2000)
      const pageText = await page.textContent('body')

      const checks = []

      if (pageText.includes('재가장기요양기관')) {
        console.log('   ✅ 프로젝트 이름: "재가장기요양기관" 확인')
        checks.push(true)
      } else {
        console.log('   ❌ 프로젝트 이름 확인 실패')
        checks.push(false)
      }

      if (pageText.includes('장기요양기관')) {
        console.log('   ✅ 필드명: "장기요양기관" 확인')
        checks.push(true)
      } else {
        console.log('   ❌ 필드명 확인 실패')
        checks.push(false)
      }

      if (pageText.includes('longtermcare')) {
        console.log('   ✅ URL 확인')
        checks.push(true)
      } else {
        console.log('   ❌ URL 확인 실패')
        checks.push(false)
      }

      console.log('\n───────────────────────────────────────')
      console.log(`통과: ${checks.filter((c) => c).length}/${checks.length}`)
      console.log('───────────────────────────────────────\n')

      console.log('📸 저장된 스크린샷:')
      console.log('   1. test-step-1-initial.png')
      console.log('   2. test-step-2-name.png')
      console.log('   3. test-step-3-url.png')
      console.log('   4. test-step-4-field.png')
      console.log('   5. test-step-5-schedule.png')
      console.log('   6. test-step-6-creating.png')
      console.log('   7. test-step-7-final.png\n')
    } else {
      console.log('❌ 테스트 실패!\n')
      console.log(`   예상 URL: /dashboard/projects/[projectId]`)
      console.log(`   실제 URL: ${finalUrl}\n`)
    }
  } catch (error) {
    console.log('\n❌ 테스트 중 에러 발생:\n')
    console.error(`   에러 메시지: ${error.message}`)
    if (error.stack) {
      console.error(`\n   스택 트레이스:\n${error.stack}`)
    }
  } finally {
    await browser.close()
    console.log('═══════════════════════════════════════')
    console.log('🏁 테스트 종료')
    console.log('═══════════════════════════════════════\n')
  }
}

testProjectCreation()
