import { NextResponse } from 'next/server'
import { checkAuthorization } from '@/lib/auth'
import * as playwright from 'playwright'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { userId, project, error } = await checkAuthorization(projectId)

    if (error) {
      return error
    }

    const { startPage, endPage, pageParamName } = await req.json()

    if (!startPage || !endPage) {
      return NextResponse.json(
        { error: 'startPage and endPage are required' },
        { status: 400 }
      )
    }

    if (startPage < 1 || endPage < startPage) {
      return NextResponse.json({ error: 'Invalid page range' }, { status: 400 })
    }

    if (endPage - startPage > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 pages per request' },
        { status: 400 }
      )
    }

    const baseUrl = Array.isArray(project.urls) ? project.urls[0] : ''
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'No target URL configured' },
        { status: 400 }
      )
    }

    const selectors = project.selectors as Record<string, string>
    const paramName = pageParamName || 'page'
    const allData: any[] = []

    let browser
    try {
      browser = await playwright.chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled'],
      })

      // 일반 브라우저처럼 보이도록 설정
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        permissions: [],
        extraHTTPHeaders: {
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      })

      const page = await context.newPage()

      // 자동화 감지 우회
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
      })

      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        try {
          // URL에 페이지 파라미터 추가
          const url = new URL(baseUrl)
          url.searchParams.set(paramName, pageNum.toString())

          await page.goto(url.toString(), {
            waitUntil: 'networkidle',
            timeout: 30000,
          })
          await page.waitForTimeout(2000)

          // 각 selector로 데이터 추출
          const pageData: Record<string, string>[] = []

          // 첫 번째 필드를 기준으로 개수 확인
          const firstField = Object.keys(selectors)[0]
          const firstSelector = selectors[firstField]

          if (!firstSelector) continue

          const elements = await page.$$(firstSelector)
          const itemCount = elements.length

          // 각 아이템에 대해 모든 필드 추출
          for (let i = 0; i < itemCount; i++) {
            const item: Record<string, string> = {}

            for (const [fieldName, selector] of Object.entries(selectors)) {
              if (!selector) continue

              try {
                const fieldElements = await page.$$(selector)
                if (fieldElements[i]) {
                  const text = await fieldElements[i].textContent()
                  item[fieldName] = text?.trim() || ''
                }
              } catch (e) {
                item[fieldName] = ''
              }
            }

            pageData.push(item)
          }

          allData.push(...pageData)
        } catch (pageError) {
          console.error(`Error crawling page ${pageNum}:`, pageError)
          // 해당 페이지 스킵하고 계속
        }
      }

      await browser.close()

      return NextResponse.json({
        data: allData,
        itemCount: allData.length,
        pagesProcessed: endPage - startPage + 1,
      })
    } catch (error) {
      if (browser) await browser.close()
      throw error
    }
  } catch (error) {
    console.error('Crawl pages error:', error)
    return NextResponse.json(
      { error: '페이지 크롤링 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
