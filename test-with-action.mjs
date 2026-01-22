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

  console.log('\n=== 테이블 구조 분석 (목록검색 탭 클릭 후) ===')

  // 테이블 행 개수 확인
  const tableRows = await page.locator('#ltco_info_list tbody tr').count()
  console.log(`테이블 행 개수: ${tableRows}`)

  if (tableRows > 0) {
    // 첫 번째 행의 TD 개수 확인
    const firstRowTds = await page
      .locator('#ltco_info_list tbody tr')
      .first()
      .locator('td')
      .count()
    console.log(`첫 번째 행의 TD 개수: ${firstRowTds}`)

    // 첫 번째 행의 HTML 구조
    const firstRowHtml = await page
      .locator('#ltco_info_list tbody tr')
      .first()
      .innerHTML()
    console.log('\n=== 첫 번째 행 HTML (일부) ===')
    console.log(firstRowHtml.substring(0, 800))

    // 각 필드 selector 테스트
    console.log('\n=== 필드별 요소 개수 ===')

    const selectors = {
      '장기요양기관 (a.ulineDtl)': 'a.ulineDtl',
      '장기요양기관 (nth-child(3))': '#ltco_info_list tbody tr td:nth-child(3)',
      '급여종류 (i.de)': 'i.de',
      '급여종류 (nth-child(4))': '#ltco_info_list tbody tr td:nth-child(4)',
      '평가결과 (i.num)': 'i.num',
      '평가결과 (nth-child(5))': '#ltco_info_list tbody tr td:nth-child(5)',
      '정원 (nth-child(6))': '#ltco_info_list tbody tr td:nth-child(6)',
      '현원 (nth-child(7))': '#ltco_info_list tbody tr td:nth-child(7)',
      '주소 (nth-child(11))': '#ltco_info_list tbody tr td:nth-child(11)',
      '전화번호 (nth-child(12))': '#ltco_info_list tbody tr td:nth-child(12)',
    }

    for (const [name, selector] of Object.entries(selectors)) {
      const count = await page.locator(selector).count()
      const firstText =
        count > 0 ? await page.locator(selector).first().textContent() : null
      console.log(
        `${name}: ${count}개${firstText ? ` (예: "${firstText.trim().substring(0, 50)}")` : ''}`
      )
    }

    // 실제 TD별 내용 확인
    console.log('\n=== 첫 번째 행의 각 TD 내용 ===')
    for (let i = 1; i <= Math.min(firstRowTds, 12); i++) {
      const tdText = await page
        .locator('#ltco_info_list tbody tr')
        .first()
        .locator(`td:nth-child(${i})`)
        .textContent()
      console.log(`TD ${i}: "${tdText?.trim().substring(0, 80)}"`)
    }
  } else {
    console.log('⚠️ 테이블에 데이터가 없습니다!')
  }

  await browser.close()
})()
