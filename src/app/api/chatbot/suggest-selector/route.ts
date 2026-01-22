import { NextResponse } from 'next/server'
import { scrapeData, getPageHTML } from '@/lib/crawler'
import { suggestSelector } from '@/lib/gemini'

export async function POST(req: Request) {
  const { url, fieldName } = await req.json()

  if (!url || !fieldName) {
    return NextResponse.json(
      { error: 'URL and fieldName are required' },
      { status: 400 }
    )
  }

  try {
    // 1. 페이지 HTML 가져오기
    const html = await getPageHTML(url)
    if (!html) {
      return NextResponse.json(
        { error: 'Failed to fetch page HTML' },
        { status: 500 }
      )
    }

    // 2. Gemini API로 selector 추천받기
    const { selector, confidence } = await suggestSelector(html, fieldName)

    // 3. 추천받은 selector로 샘플 데이터 추출
    const sampleData = await scrapeData(url, selector)

    return NextResponse.json({
      selector,
      sampleData,
      confidence,
    })
  } catch (error) {
    console.error('Error in suggest-selector:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
