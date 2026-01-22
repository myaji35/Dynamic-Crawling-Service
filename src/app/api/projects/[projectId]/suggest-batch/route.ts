import { NextResponse } from 'next/server'
import { checkAuthorization } from '@/lib/auth'
import * as playwright from 'playwright'

interface SelectorResult {
  fieldName: string
  selector: string
  count: number
  samples: string[]
  status: 'finding' | 'success' | 'failed'
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

    const { fieldNames } = await req.json()

    if (!Array.isArray(fieldNames) || fieldNames.length === 0) {
      return NextResponse.json(
        { error: 'fieldNames must be a non-empty array' },
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

    const results: SelectorResult[] = []
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

      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(2000)

      // 각 필드에 대해 selector 찾기
      for (const fieldName of fieldNames) {
        try {
          // AI를 사용하지 않고 간단한 휴리스틱으로 selector 찾기
          const selector = await findSelectorByFieldName(page, fieldName)

          if (selector) {
            const elements = await page.$$(selector)
            const count = elements.length
            const samples: string[] = []

            for (let i = 0; i < Math.min(3, elements.length); i++) {
              const text = await elements[i].textContent()
              if (text) {
                samples.push(text.trim().substring(0, 100))
              }
            }

            results.push({
              fieldName,
              selector,
              count,
              samples,
              status: count > 0 ? 'success' : 'failed',
            })
          } else {
            results.push({
              fieldName,
              selector: '',
              count: 0,
              samples: [],
              status: 'failed',
            })
          }
        } catch (error) {
          console.error(`Error finding selector for ${fieldName}:`, error)
          results.push({
            fieldName,
            selector: '',
            count: 0,
            samples: [],
            status: 'failed',
          })
        }
      }

      await browser.close()
    } catch (error) {
      if (browser) await browser.close()
      throw error
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Suggest batch error:', error)
    return NextResponse.json(
      { error: '필드 찾기 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 필드명을 기반으로 selector를 찾는 휴리스틱 함수
async function findSelectorByFieldName(
  page: any,
  fieldName: string
): Promise<string | null> {
  console.log(`[findSelectorByFieldName] 필드 찾기 시작: "${fieldName}"`)

  // 필드명 정규화 (공백 제거, 소문자 변환)
  const normalizedFieldName = fieldName.trim()
  const fieldNameLower = normalizedFieldName.toLowerCase()

  // 1. 페이지의 HTML 구조 분석
  const htmlStructure = await page.evaluate(() => {
    const tables = document.querySelectorAll('table')
    const lists = document.querySelectorAll('ul, ol')
    const divs = document.querySelectorAll(
      'div[class*="item"], div[class*="row"], div[class*="card"]'
    )

    return {
      hasTables: tables.length > 0,
      hasLists: lists.length > 0,
      hasItemDivs: divs.length > 0,
      totalElements: document.querySelectorAll('*').length,
    }
  })

  console.log('[findSelectorByFieldName] HTML 구조:', htmlStructure)

  // 2. 테이블 구조에서 찾기 (가장 일반적)
  if (htmlStructure.hasTables) {
    const tableSelectors = await tryTableSelectors(page, normalizedFieldName)
    if (tableSelectors) {
      console.log(
        `[findSelectorByFieldName] 테이블에서 찾음: ${tableSelectors}`
      )
      return tableSelectors
    }
  }

  // 3. 리스트 구조에서 찾기
  if (htmlStructure.hasLists) {
    const listSelectors = await tryListSelectors(page, normalizedFieldName)
    if (listSelectors) {
      console.log(`[findSelectorByFieldName] 리스트에서 찾음: ${listSelectors}`)
      return listSelectors
    }
  }

  // 4. div 기반 구조에서 찾기
  const divSelectors = await tryDivSelectors(page, normalizedFieldName)
  if (divSelectors) {
    console.log(`[findSelectorByFieldName] div에서 찾음: ${divSelectors}`)
    return divSelectors
  }

  // 5. 일반적인 속성 기반 선택자
  const attributeSelectors = await tryAttributeSelectors(
    page,
    normalizedFieldName,
    fieldNameLower
  )
  if (attributeSelectors) {
    console.log(
      `[findSelectorByFieldName] 속성에서 찾음: ${attributeSelectors}`
    )
    return attributeSelectors
  }

  // 6. 텍스트 기반 유사도 매칭 (마지막 수단)
  const fuzzySelector = await tryFuzzyTextMatch(page, normalizedFieldName)
  if (fuzzySelector) {
    console.log(
      `[findSelectorByFieldName] 유사 텍스트에서 찾음: ${fuzzySelector}`
    )
    return fuzzySelector
  }

  console.log(`[findSelectorByFieldName] 필드를 찾지 못함: "${fieldName}"`)
  return null
}

// 테이블 구조에서 selector 찾기
async function tryTableSelectors(
  page: any,
  fieldName: string
): Promise<string | null> {
  const selectors = [
    // th에 필드명이 있는 경우 - 같은 열의 td
    `th:has-text("${fieldName}")`,
    // th에 필드명이 있고 바로 아래 td
    `tr:has(th:has-text("${fieldName}")) td`,
    // td에 필드명이 있고 같은 행의 다음 td
    `tr:has(td:has-text("${fieldName}")) td:nth-child(2)`,
    `tr:has(td:has-text("${fieldName}")) td:last-child`,
  ]

  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector)
      if (elements && elements.length > 0) {
        // 첫 번째 요소에 의미있는 텍스트가 있는지 확인
        const text = await elements[0].textContent()
        if (text && text.trim().length > 0 && text.trim() !== fieldName) {
          return selector
        }
      }
    } catch (e) {
      // 무시
    }
  }

  return null
}

// 리스트 구조에서 selector 찾기
async function tryListSelectors(
  page: any,
  fieldName: string
): Promise<string | null> {
  const selectors = [
    `li:has-text("${fieldName}") span`,
    `li:has-text("${fieldName}") div`,
    `li:has-text("${fieldName}") strong`,
  ]

  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector)
      if (elements && elements.length > 0) {
        const text = await elements[0].textContent()
        if (text && text.trim().length > 0 && text.trim() !== fieldName) {
          return selector
        }
      }
    } catch (e) {
      // 무시
    }
  }

  return null
}

// div 기반 구조에서 selector 찾기
async function tryDivSelectors(
  page: any,
  fieldName: string
): Promise<string | null> {
  const selectors = [
    `div:has-text("${fieldName}") + div`,
    `div:has-text("${fieldName}") span`,
    `label:has-text("${fieldName}") + span`,
    `label:has-text("${fieldName}") + input`,
    `dt:has-text("${fieldName}") + dd`,
  ]

  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector)
      if (elements && elements.length > 0) {
        const text = await elements[0].textContent()
        if (text && text.trim().length > 0 && text.trim() !== fieldName) {
          return selector
        }
      }
    } catch (e) {
      // 무시
    }
  }

  return null
}

// 속성 기반 selector 찾기
async function tryAttributeSelectors(
  page: any,
  fieldName: string,
  fieldNameLower: string
): Promise<string | null> {
  const selectors = [
    `[data-field="${fieldName}"]`,
    `[data-field="${fieldNameLower}"]`,
    `[name="${fieldName}"]`,
    `[name="${fieldNameLower}"]`,
    `[id*="${fieldNameLower}"]`,
    `[class*="${fieldNameLower}"]`,
  ]

  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector)
      if (elements && elements.length > 0) {
        return selector
      }
    } catch (e) {
      // 무시
    }
  }

  return null
}

// 유사 텍스트 매칭
async function tryFuzzyTextMatch(
  page: any,
  fieldName: string
): Promise<string | null> {
  try {
    // 페이지에서 유사한 텍스트를 가진 요소 찾기
    const result = await page.evaluate((targetText: string) => {
      const allElements = Array.from(document.querySelectorAll('*'))
      const targetLower = targetText.toLowerCase()

      for (const el of allElements) {
        const text = el.textContent?.trim() || ''
        if (
          text.toLowerCase().includes(targetLower) &&
          text.length < targetText.length * 3
        ) {
          // 이 요소의 selector를 생성
          let selector = el.tagName.toLowerCase()
          if (el.id) {
            selector = `#${el.id}`
          } else if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(' ').filter((c) => c.length > 0)
            if (classes.length > 0) {
              selector = `${selector}.${classes[0]}`
            }
          }

          // 다음 형제나 자식 요소 찾기
          const nextSibling = el.nextElementSibling
          const firstChild = el.children[0]

          if (nextSibling) {
            return selector + ' + *'
          } else if (firstChild && firstChild.textContent !== text) {
            return selector + ' > *:first-child'
          }
        }
      }

      return null
    }, fieldName)

    if (result) {
      const elements = await page.$$(result)
      if (elements && elements.length > 0) {
        return result
      }
    }
  } catch (e) {
    console.error('[tryFuzzyTextMatch] 에러:', e)
  }

  return null
}
