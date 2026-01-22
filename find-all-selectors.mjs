import { chromium } from 'playwright'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  console.log('페이지 로딩...')
  await page.goto(
    'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch.web?siDoCd=11',
    {
      waitUntil: 'networkidle',
      timeout: 30000,
    }
  )

  console.log('\n목록검색 탭 클릭...')
  const listTab = page.locator('text=목록검색').first()
  if (await listTab.isVisible()) {
    await listTab.click()
    await page.waitForTimeout(2000)
  }

  console.log('\nHTML 구조 분석...\n')

  // 첫 번째 데이터 행의 HTML 가져오기
  const firstRow = page.locator('#ltco_info_list tbody tr').first()
  const html = await firstRow.innerHTML()

  console.log('=== 첫 번째 행의 HTML 구조 ===')
  console.log(html.substring(0, 2000))
  console.log('\n...\n')

  // 각 필드 찾기
  const fields = {
    장기요양기관: '#ltco_info_list tbody tr td a.ulineDtl',
    급여종류: '#ltco_info_list tbody tr td i.de',
    평가결과: '#ltco_info_list tbody tr td i.num',
  }

  console.log('\n=== 확인된 필드 ===')
  for (const [field, selector] of Object.entries(fields)) {
    const elements = await page.locator(selector).all()
    if (elements.length > 0) {
      const text = await elements[0].textContent()
      console.log(`✅ ${field}: ${elements.length}개 (예: "${text?.trim()}")`)
    } else {
      console.log(`❌ ${field}: 0개`)
    }
  }

  // 전체 TD의 텍스트 내용 확인
  console.log('\n=== 첫 번째 데이터 TD의 전체 텍스트 ===')
  const dataTd = page.locator('#ltco_info_list tbody tr td').nth(1)
  const fullText = await dataTd.textContent()
  console.log(fullText)

  await browser.close()
})()
