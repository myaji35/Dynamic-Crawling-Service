import { chromium } from 'playwright'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  console.log('페이지 로딩 중...')
  await page.goto(
    'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch.web?siDoCd=11',
    {
      waitUntil: 'networkidle',
      timeout: 30000,
    }
  )

  // 페이지 제목 확인
  const title = await page.title()
  console.log('페이지 제목:', title)

  // "목록검색" 탭 찾기
  const tabs = await page.locator('a, button, .tab, li').all()
  console.log(`\n찾은 요소 개수: ${tabs.length}`)

  for (let i = 0; i < Math.min(tabs.length, 50); i++) {
    const text = await tabs[i].textContent().catch(() => '')

    if (text && (text.includes('목록') || text.includes('검색'))) {
      const className = await tabs[i].getAttribute('class').catch(() => '')
      const tagName = await tabs[i].evaluate((el) => el.tagName)

      console.log(`\n✅ 발견! 인덱스 ${i}:`)
      console.log(`  태그: ${tagName}`)
      console.log(`  텍스트: "${text.trim()}"`)
      console.log(`  클래스: ${className || 'N/A'}`)
    }
  }

  // 목록검색 탭 클릭 시뮬레이션
  console.log('\n\n=== 목록검색 탭 클릭 시도 ===')

  // 여러 가지 selector 시도
  const selectors = [
    'text=목록검색',
    'a:has-text("목록검색")',
    'li:has-text("목록검색")',
    '[role="tab"]:has-text("목록검색")',
    '.tab:has-text("목록검색")',
  ]

  for (const selector of selectors) {
    const element = page.locator(selector).first()
    const isVisible = await element.isVisible().catch(() => false)

    if (isVisible) {
      console.log(`✅ "${selector}" - 발견됨, 클릭 시도...`)
      await element.click()
      await page.waitForTimeout(2000)

      // 클릭 후 테이블 확인
      const tableRows = await page.locator('#ltco_info_list tbody tr').count()
      console.log(`   클릭 후 테이블 행 개수: ${tableRows}`)
      break
    } else {
      console.log(`❌ "${selector}" - 발견 안 됨`)
    }
  }

  await browser.close()
})()
