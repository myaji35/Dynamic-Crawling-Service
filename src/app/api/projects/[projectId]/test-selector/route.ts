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

    const { selector } = await req.json()

    if (!selector) {
      return NextResponse.json(
        { error: 'Selector is required' },
        { status: 400 }
      )
    }

    const targetUrl = Array.isArray(project.urls) ? project.urls[0] : ''
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'No target URL configured' },
        { status: 400 }
      )
    }

    let browser
    try {
      browser = await playwright.chromium.launch({ headless: true })
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(2000)

      // Selector 테스트
      const elements = await page.$$(selector)
      const count = elements.length
      const samples: string[] = []

      for (let i = 0; i < Math.min(5, elements.length); i++) {
        const text = await elements[i].textContent()
        if (text) {
          samples.push(text.trim().substring(0, 200))
        }
      }

      await browser.close()

      const message =
        count > 0
          ? `${count}개의 요소를 찾았습니다.`
          : 'Selector와 일치하는 요소를 찾지 못했습니다.'

      return NextResponse.json({
        count,
        samples,
        message,
      })
    } catch (error) {
      if (browser) await browser.close()
      console.error('Test selector error:', error)
      return NextResponse.json({
        count: 0,
        samples: [],
        message: 'Selector 테스트 중 오류가 발생했습니다.',
      })
    }
  } catch (error) {
    console.error('Test selector error:', error)
    return NextResponse.json(
      { error: 'Selector 테스트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
