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

    const { fieldName, description } = await req.json()

    if (!fieldName || !description) {
      return NextResponse.json(
        { error: 'fieldName and description are required' },
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

      // 설명을 기반으로 selector 찾기 (간단한 휴리스틱)
      const suggestions = await findSelectorsByDescription(page, description)

      await browser.close()

      return NextResponse.json({ suggestions })
    } catch (error) {
      if (browser) await browser.close()
      throw error
    }
  } catch (error) {
    console.error('Suggest from description error:', error)
    return NextResponse.json(
      { error: '필드 찾기 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

async function findSelectorsByDescription(
  page: any,
  description: string
): Promise<string[]> {
  const suggestions: string[] = []

  // 키워드 추출 (간단하게)
  const keywords = description
    .split(/[\s,]+/)
    .filter((word) => word.length > 1)
    .map((word) => word.toLowerCase())

  // 1. 텍스트 기반 검색
  for (const keyword of keywords) {
    try {
      const elements = await page.locator(`text=${keyword}`).all()
      if (elements.length > 0) {
        suggestions.push(`text=${keyword}`)
        suggestions.push(`tr:has-text("${keyword}") td:nth-child(2)`)
        suggestions.push(`td:has-text("${keyword}") ~ td`)
      }
    } catch (e) {
      // 무시
    }
  }

  // 2. 일반적인 패턴들
  const commonPatterns = [
    'table tbody tr td:nth-child(2)',
    'table tbody tr td:first-child',
    '.content',
    '.value',
    '.text',
    'span',
    'p',
  ]

  for (const pattern of commonPatterns) {
    try {
      const elements = await page.$$(pattern)
      if (elements.length > 0 && elements.length < 100) {
        suggestions.push(pattern)
      }
    } catch (e) {
      // 무시
    }
  }

  // 중복 제거 및 최대 5개만 반환
  return Array.from(new Set(suggestions)).slice(0, 5)
}
