import { NextResponse } from 'next/server'
import { checkAuthorization } from '@/lib/auth'
import * as playwright from 'playwright'

/**
 * 스마트 CSS Selector 제안 API
 * 최신 크롤링 기술을 활용한 지능형 Selector 찾기
 */

// 한글 필드명을 영문 키워드로 매핑
const fieldKeywords: Record<string, string[]> = {
  장기요양기관: [
    'name',
    'facility',
    'hospital',
    'center',
    'institution',
    '기관명',
    '병원',
    '센터',
    '요양원',
  ],
  급여종류: [
    'type',
    'benefit',
    'service',
    'care',
    'grade',
    '급여',
    '종류',
    '서비스',
  ],
  평가결과: [
    'result',
    'score',
    'grade',
    'evaluation',
    'rating',
    '평가',
    '등급',
    '점수',
  ],
  정원: ['capacity', 'max', 'limit', 'total', '정원', '수용', '최대'],
  현원: ['current', 'occupancy', 'enrolled', 'present', '현원', '현재', '입소'],
  주소: ['address', 'location', 'addr', '주소', '위치', '소재지'],
  전화번호: ['tel', 'phone', 'call', 'contact', '전화', '연락처', '번호'],
  제목: ['title', 'heading', 'subject', 'name', '제목', '제목', '이름'],
  가격: ['price', 'cost', 'amount', 'fee', '가격', '금액', '비용'],
  날짜: ['date', 'time', 'day', 'when', '날짜', '일시', '시간'],
  내용: ['content', 'description', 'text', 'detail', '내용', '설명', '상세'],
  작성자: ['author', 'writer', 'user', 'by', '작성자', '글쓴이', '작성'],
}

// 공통 테이블 selector 패턴
const tablePatterns = [
  'table tbody tr td',
  'table tr td',
  '.table-row td',
  '[role="table"] [role="cell"]',
  'div.table div.row div.cell',
]

// 공통 리스트 selector 패턴
const listPatterns = [
  'ul li',
  'ol li',
  '.list-item',
  '[role="list"] [role="listitem"]',
  'div.list div.item',
]

// 텍스트 유사도 계산 (간단한 버전)
function textSimilarity(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase()
  let score = 0

  keywords.forEach((keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 1
    }
  })

  return score / keywords.length
}

// Selector 후보 생성
function generateSelectorCandidates(fieldName: string): string[] {
  const candidates: string[] = []
  const keywords = fieldKeywords[fieldName] || [fieldName]

  // 1. 테이블 기반 패턴
  if (['정원', '현원', '급여종류', '평가결과'].includes(fieldName)) {
    tablePatterns.forEach((pattern) => {
      candidates.push(pattern)
      candidates.push(`${pattern}:nth-child(n)`)
    })
  }

  // 2. 속성 기반 selector
  keywords.forEach((keyword) => {
    // class 기반
    candidates.push(`.${keyword}`)
    candidates.push(`[class*="${keyword}"]`)

    // id 기반
    candidates.push(`#${keyword}`)
    candidates.push(`[id*="${keyword}"]`)

    // data 속성 기반
    candidates.push(`[data-field="${keyword}"]`)
    candidates.push(`[data-type="${keyword}"]`)

    // aria-label 기반
    candidates.push(`[aria-label*="${keyword}"]`)

    // 텍스트 내용 포함 (XPath 스타일)
    candidates.push(`*:has-text("${keyword}")`)
  })

  // 3. 주소 필드는 특별 처리
  if (fieldName === '주소') {
    candidates.push('address')
    candidates.push('[itemprop="address"]')
    candidates.push('.address')
    candidates.push('*:has-text("주소") + *')
  }

  // 4. 전화번호 필드는 특별 처리
  if (fieldName === '전화번호') {
    candidates.push('a[href^="tel:"]')
    candidates.push('[itemprop="telephone"]')
    candidates.push('.phone')
    candidates.push('.tel')
    candidates.push('*:has-text("전화") + *')
  }

  // 5. 제목 필드
  if (fieldName === '제목' || fieldName === '장기요양기관') {
    candidates.push('h1')
    candidates.push('h2')
    candidates.push('h3')
    candidates.push('.title')
    candidates.push('[class*="title"]')
    candidates.push('[class*="name"]')
  }

  return candidates
}

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

    const { fieldName } = await req.json()

    if (!fieldName) {
      return NextResponse.json(
        { error: 'Field name is required' },
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
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      })
      const page = await context.newPage()

      // 페이지 로드
      await page.goto(targetUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })

      // 동적 콘텐츠 대기
      await page.waitForTimeout(3000)

      // Selector 후보 생성
      const candidates = generateSelectorCandidates(fieldName)
      const results: Array<{
        selector: string
        count: number
        samples: string[]
        confidence: number
      }> = []

      // 각 후보 테스트
      for (const selector of candidates) {
        try {
          // Playwright의 특수 selector 처리
          let elements
          if (selector.includes(':has-text')) {
            // Playwright의 text selector
            const textMatch = selector.match(/:has-text\("(.+)"\)/)
            if (textMatch) {
              elements = await page
                .locator(`:has-text("${textMatch[1]}")`)
                .all()
            } else {
              continue
            }
          } else {
            // 일반 CSS selector
            elements = await page.$$(selector)
          }

          if (elements && elements.length > 0) {
            const samples: string[] = []

            // 최대 5개 샘플 수집
            for (let i = 0; i < Math.min(5, elements.length); i++) {
              let text = ''

              if (typeof elements[i].textContent === 'function') {
                text = (await elements[i].textContent()) || ''
              } else {
                text = await page.evaluate(
                  (el) => el.textContent || '',
                  elements[i]
                )
              }

              text = text.trim()

              if (text && text.length > 0) {
                samples.push(text.substring(0, 100))
              }
            }

            // 신뢰도 계산
            const keywords = fieldKeywords[fieldName] || [fieldName]
            let confidence = 0

            // 샘플 텍스트에서 키워드 매칭
            samples.forEach((sample) => {
              confidence += textSimilarity(sample, keywords)
            })

            // 요소 개수 기반 보정
            if (elements.length > 0 && elements.length < 100) {
              confidence += 0.2
            }

            // selector 패턴 기반 보정
            if (
              selector.includes(fieldName) ||
              keywords.some((k) => selector.includes(k))
            ) {
              confidence += 0.3
            }

            if (samples.length > 0) {
              results.push({
                selector,
                count: elements.length,
                samples,
                confidence: Math.min(confidence, 1.0),
              })
            }
          }
        } catch (e) {
          // 유효하지 않은 selector는 무시
          continue
        }
      }

      await browser.close()

      // 신뢰도 순으로 정렬
      results.sort((a, b) => b.confidence - a.confidence)

      // 상위 3개만 반환
      const topResults = results.slice(0, 3)

      if (topResults.length > 0) {
        return NextResponse.json({
          success: true,
          suggestions: topResults,
          message: `${fieldName}에 대한 ${topResults.length}개의 Selector를 찾았습니다.`,
        })
      } else {
        // 찾지 못한 경우 기본 제안
        return NextResponse.json({
          success: false,
          suggestions: [
            {
              selector: '',
              count: 0,
              samples: [],
              confidence: 0,
              hint: `"${fieldName}"를 포함하는 요소를 찾지 못했습니다. 페이지의 HTML 구조를 확인해주세요.`,
            },
          ],
          message: 'Selector를 자동으로 찾지 못했습니다. 직접 입력해주세요.',
        })
      }
    } catch (error) {
      if (browser) await browser.close()
      console.error('Selector suggestion error:', error)

      return NextResponse.json(
        {
          success: false,
          message: 'Selector 제안 중 오류가 발생했습니다.',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
