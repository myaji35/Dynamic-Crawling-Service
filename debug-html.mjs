import { chromium } from 'playwright'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  console.log('페이지 로딩...')
  await page.goto('https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch', {
    waitUntil: 'networkidle',
    timeout: 30000,
  })

  console.log('\n목록검색 탭 클릭...')
  const listTab = page.locator('text=목록검색').first()
  if (await listTab.isVisible()) {
    await listTab.click()
    await page.waitForTimeout(2000)
  }

  console.log('\n=== page.content()로 가져온 HTML 확인 ===')
  const html = await page.content()

  // Cheerio로 파싱
  const cheerio = await import('cheerio')
  const $ = cheerio.load(html)

  const selectors = {
    '장기요양기관 (nth-child(3))': '#ltco_info_list tbody tr td:nth-child(3)',
    '급여종류 (nth-child(4))': '#ltco_info_list tbody tr td:nth-child(4)',
    '평가결과 (nth-child(5))': '#ltco_info_list tbody tr td:nth-child(5)',
    '정원 (nth-child(6))': '#ltco_info_list tbody tr td:nth-child(6)',
    '현원 (nth-child(7))': '#ltco_info_list tbody tr td:nth-child(7)',
  }

  console.log('\n=== Cheerio로 파싱한 결과 ===')
  for (const [name, selector] of Object.entries(selectors)) {
    const elements = $(selector)
    const count = elements.length
    const firstText =
      count > 0 ? elements.first().text().trim().substring(0, 50) : null
    console.log(
      `${name}: ${count}개${firstText ? ` (예: "${firstText}")` : ''}`
    )
  }

  console.log('\n=== Playwright locator로 직접 확인 ===')
  for (const [name, selector] of Object.entries(selectors)) {
    const count = await page.locator(selector).count()
    const firstText =
      count > 0 ? await page.locator(selector).first().textContent() : null
    console.log(
      `${name}: ${count}개${firstText ? ` (예: "${firstText.trim().substring(0, 50)}")` : ''}`
    )
  }

  await browser.close()
})()
