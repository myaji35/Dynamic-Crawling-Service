import { chromium, Browser, Page } from 'playwright'

// 사전 액션 타입 정의
export interface PreAction {
  type: 'click' | 'input' | 'wait' | 'scroll'
  selector?: string
  value?: string
  waitAfter?: number // 액션 후 대기 시간 (ms)
}

// 브라우저 재사용을 위한 싱글톤 (선택적 최적화)
let globalBrowser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!globalBrowser || !globalBrowser.isConnected()) {
    globalBrowser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
  return globalBrowser
}

// 사전 액션 실행 함수
async function executePreActions(
  page: Page,
  actions: PreAction[]
): Promise<void> {
  if (!actions || actions.length === 0) return

  console.log(`🎬 Executing ${actions.length} pre-actions...`)

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            console.log(`  ▶ Clicking: ${action.selector}`)
            await page.locator(action.selector).first().click()
          }
          break

        case 'input':
          if (action.selector && action.value) {
            console.log(`  ▶ Inputting to: ${action.selector}`)
            await page.locator(action.selector).first().fill(action.value)
          }
          break

        case 'wait':
          if (action.waitAfter) {
            console.log(`  ▶ Waiting: ${action.waitAfter}ms`)
            await page.waitForTimeout(action.waitAfter)
          }
          break

        case 'scroll':
          console.log(`  ▶ Scrolling to bottom`)
          await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight)
          )
          break
      }

      // 액션 후 대기
      if (action.waitAfter && action.type !== 'wait') {
        await page.waitForTimeout(action.waitAfter)
      }
    } catch (error) {
      console.error(`  ⚠️ Pre-action failed:`, error)
      // 액션 실패 시 계속 진행
    }
  }

  console.log(`✅ Pre-actions completed`)
}

export async function scrapeData(
  url: string,
  selector: string
): Promise<string | null> {
  let browser: Browser | null = null
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()

    // Playwright는 자동으로 요소를 기다립니다
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // Playwright의 locator API 사용 (auto-waiting)
    const element = page.locator(selector).first()
    const text = await element.textContent({ timeout: 5000 }).catch(() => null)

    // 앞의 번호 제거 (예: "1.기관명" → "기관명")
    const cleanedText = text?.trim().replace(/^\d+\.\s*/, '')
    return cleanedText || null
  } catch (error) {
    console.error('Error during scraping:', error)
    return null
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export async function scrapeMultipleData(
  url: string,
  selector: string,
  limit: number = 10
): Promise<string[]> {
  let browser: Browser | null = null
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // Playwright의 locator.all() 사용 - 더 안정적
    const elements = await page.locator(selector).all()
    const results: string[] = []

    for (let i = 0; i < Math.min(elements.length, limit); i++) {
      const text = await elements[i].textContent()
      if (text?.trim()) {
        // 앞의 번호 제거 (예: "1.기관명" → "기관명")
        const cleanedText = text.trim().replace(/^\d+\.\s*/, '')
        results.push(cleanedText)
      }
    }

    return results
  } catch (error) {
    console.error('Error during scraping:', error)
    return []
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// 여러 selector를 한 번에 처리 (성능 최적화) - Playwright 버전
export async function scrapeMultipleFields(
  url: string,
  selectors: Record<string, string>,
  limit: number = 10,
  preActions?: PreAction[] // 사전 액션 추가
): Promise<Record<string, string[]>> {
  let browser: Browser | null = null
  try {
    console.time('Browser launch')
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()

    // 네트워크 최적화: 이미지 로딩 비활성화 (선택적)
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg}', (route) =>
      route.abort()
    )

    console.timeEnd('Browser launch')

    console.time('Page load')
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    console.timeEnd('Page load')

    // 사전 액션 실행
    if (preActions && preActions.length > 0) {
      await executePreActions(page, preActions)
    }

    console.time('Data extraction')
    const results: Record<string, string[]> = {}
    const debugInfo: Record<string, any> = {}

    // 각 필드를 병렬로 처리 (Playwright의 강점)
    const fieldEntries = Object.entries(selectors)
    await Promise.all(
      fieldEntries.map(async ([fieldName, selector]) => {
        try {
          const elements = await page.locator(selector).all()
          const values: string[] = []

          debugInfo[fieldName] = {
            selector: selector,
            elementsFound: elements.length,
            firstElement:
              elements.length > 0
                ? await elements[0].innerHTML().catch(() => 'N/A')
                : null,
          }

          // 각 요소의 텍스트 추출을 병렬로 처리
          const textPromises = elements
            .slice(0, limit)
            .map((el) => el.textContent().catch(() => null))
          const texts = await Promise.all(textPromises)

          for (const text of texts) {
            if (text?.trim()) {
              // 앞의 번호 제거 (예: "1.기관명" → "기관명")
              const cleanedText = text.trim().replace(/^\d+\.\s*/, '')
              values.push(cleanedText)
            }
          }

          results[fieldName] = values
        } catch (error) {
          console.error(`Error extracting field "${fieldName}":`, error)
          results[fieldName] = []
        }
      })
    )

    console.timeEnd('Data extraction')

    console.log('Page evaluation debug:', debugInfo)

    // 서버 측 로그
    console.log('Extraction results summary:')
    for (const [field, values] of Object.entries(results)) {
      console.log(`  ${field}: ${values.length} items found`)
    }

    return results
  } catch (error) {
    console.error('Error during multi-field scraping:', error)
    return Object.fromEntries(Object.keys(selectors).map((key) => [key, []]))
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export async function getPageHTML(
  url: string,
  preActions?: PreAction[]
): Promise<string | null> {
  let browser: Browser | null = null
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // 사전 액션 실행
    if (preActions && preActions.length > 0) {
      await executePreActions(page, preActions)
    }

    const html = await page.content()
    return html
  } catch (error) {
    console.error('Error getting page HTML:', error)
    return null
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * 여러 페이지를 순회하며 데이터 수집 - Playwright 최적화 버전
 * 병렬 컨텍스트로 여러 페이지 동시 크롤링
 */
export async function scrapeMultiplePages(
  baseUrl: string,
  selector: string,
  startPage: number = 1,
  endPage: number = 10,
  pageParamName: string = 'page',
  onProgress?: (currentPage: number, itemsCollected: number) => void
): Promise<string[]> {
  let browser: Browser | null = null
  const allResults: string[] = []

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    // 병렬 처리 (최대 3개 페이지 동시)
    const CONCURRENT_PAGES = 3
    const pageNumbers = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    )

    for (let i = 0; i < pageNumbers.length; i += CONCURRENT_PAGES) {
      const batch = pageNumbers.slice(i, i + CONCURRENT_PAGES)

      const batchResults = await Promise.all(
        batch.map(async (pageNum) => {
          const context = await browser!.newContext()
          const page = await context.newPage()

          try {
            const url = new URL(baseUrl)
            url.searchParams.set(pageParamName, pageNum.toString())

            await page.goto(url.toString(), {
              waitUntil: 'networkidle',
              timeout: 30000,
            })

            const elements = await page.locator(selector).all()
            const texts = await Promise.all(
              elements.map((el) => el.textContent().catch(() => null))
            )

            const pageData = texts
              .filter((text): text is string => Boolean(text?.trim()))
              .map((text) => {
                // 앞의 번호 제거 (예: "1.기관명" → "기관명")
                return text!.trim().replace(/^\d+\.\s*/, '')
              })

            if (onProgress) {
              onProgress(pageNum, allResults.length + pageData.length)
            }

            return pageData
          } catch (error) {
            console.error(`Error scraping page ${pageNum}:`, error)
            return []
          } finally {
            await context.close()
          }
        })
      )

      // 배치 결과 병합
      for (const result of batchResults) {
        allResults.push(...result)
      }

      // 서버 부하 방지 딜레이
      if (i + CONCURRENT_PAGES < pageNumbers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return allResults
  } catch (error) {
    console.error('Error during multi-page scraping:', error)
    return allResults
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * JavaScript 기반 페이지네이션 처리 (버튼 클릭) - Playwright 버전
 */
export async function scrapeWithPagination(
  url: string,
  selector: string,
  maxPages: number = 10,
  nextButtonSelector: string = 'a.next, button.next, .pagination .next',
  onProgress?: (currentPage: number, itemsCollected: number) => void
): Promise<string[]> {
  let browser: Browser | null = null
  const allResults: string[] = []

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        // 현재 페이지 데이터 수집
        const elements = await page.locator(selector).all()
        const texts = await Promise.all(
          elements.map((el) => el.textContent().catch(() => null))
        )

        const pageData = texts
          .filter((text): text is string => Boolean(text?.trim()))
          .map((text) => {
            // 앞의 번호 제거 (예: "1.기관명" → "기관명")
            return text!.trim().replace(/^\d+\.\s*/, '')
          })

        allResults.push(...pageData)

        if (onProgress) {
          onProgress(pageNum, allResults.length)
        }

        // 다음 버튼 확인 (Playwright의 자동 대기)
        const nextButton = page.locator(nextButtonSelector).first()
        const isVisible = await nextButton.isVisible().catch(() => false)

        if (!isVisible) {
          console.log('No more pages to scrape')
          break
        }

        // 다음 페이지로 이동 (Playwright는 자동으로 navigation 대기)
        await nextButton.click()
        await page.waitForLoadState('networkidle', { timeout: 30000 })

        // 서버 부하 방지 딜레이
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error on page ${pageNum}:`, error)
        break
      }
    }

    return allResults
  } catch (error) {
    console.error('Error during pagination scraping:', error)
    return allResults
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// 브라우저 정리 함수 (앱 종료 시 호출)
export async function closeBrowser() {
  if (globalBrowser) {
    await globalBrowser.close()
    globalBrowser = null
  }
}
