import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/prisma'
import { getPageHTML, scrapeMultipleData } from '@/lib/crawler'
import * as cheerio from 'cheerio'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { fieldNames } = await req.json()

  if (!fieldNames || !Array.isArray(fieldNames) || fieldNames.length === 0) {
    return NextResponse.json(
      { error: 'Field names array is required' },
      { status: 400 }
    )
  }

  try {
    // longtermcare.or.kr 전용 빠른 처리
    // "목록검색" 탭 클릭 후 테이블 구조: 12개 컬럼
    // 컬럼 순서: checkbox(1), 순번(2), 기관명(3), 급여종류명(4), 평가결과(5),
    //          정원(6), 현원(7), 건평(8), 대여(9), 목욕차량(10), 주소(11), 전화번호(12)
    const LONGTERMCARE_MAPPING: Record<string, string> = {
      장기요양기관: '#ltco_info_list tbody tr td:nth-child(3)',
      급여종류: '#ltco_info_list tbody tr td:nth-child(4)',
      평가결과: '#ltco_info_list tbody tr td:nth-child(5)',
      정원: '#ltco_info_list tbody tr td:nth-child(6)',
      현원: '#ltco_info_list tbody tr td:nth-child(7)',
      건평: '#ltco_info_list tbody tr td:nth-child(8)',
      대여: '#ltco_info_list tbody tr td:nth-child(9)',
      목욕차량: '#ltco_info_list tbody tr td:nth-child(10)',
      주소: '#ltco_info_list tbody tr td:nth-child(11)',
      전화번호: '#ltco_info_list tbody tr td:nth-child(12)',
      전화: '#ltco_info_list tbody tr td:nth-child(12)',
    }

    // longtermcare.or.kr 사이트인지 확인
    console.log('Target URL:', project.targetUrl)
    const isLongtermCare = project.targetUrl.includes('longtermcare.or.kr')
    console.log('Is longtermcare.or.kr?', isLongtermCare)

    if (isLongtermCare) {
      console.log(
        '🚀 Using optimized longtermcare.or.kr mapping with preActions'
      )

      // preActions를 실행한 후 HTML 가져오기
      console.time('HTML fetch with preActions')
      const preActions = (project.preActions as any) || []
      const html = await getPageHTML(project.targetUrl, preActions)
      console.timeEnd('HTML fetch with preActions')

      if (!html) {
        return NextResponse.json(
          { error: 'Failed to fetch page HTML' },
          { status: 500 }
        )
      }

      // HTML에서 실제로 데이터가 있는지 검증
      const cheerio = await import('cheerio')
      const $ = cheerio.load(html)

      const results = fieldNames.map((fieldName) => {
        const selector = LONGTERMCARE_MAPPING[fieldName]

        if (selector) {
          // 실제 요소 확인
          const elements = $(selector)
          const count = Math.min(elements.length, 10)
          const samples = elements
            .slice(0, 3)
            .map((_, el) => $(el).text().trim())
            .get()

          return {
            fieldName,
            selector,
            count,
            samples,
            status: count > 0 ? ('success' as const) : ('failed' as const),
          }
        } else {
          return {
            fieldName,
            selector: '',
            count: 0,
            samples: [],
            status: 'failed' as const,
          }
        }
      })

      return NextResponse.json({
        success: true,
        results,
      })
    }

    // 일반 사이트 처리 (기존 로직)
    console.time('HTML fetch')
    const preActions = (project.preActions as any) || []
    const html = await getPageHTML(project.targetUrl, preActions)
    console.timeEnd('HTML fetch')

    if (!html) {
      return NextResponse.json(
        { error: 'Failed to fetch page HTML' },
        { status: 500 }
      )
    }

    const $ = cheerio.load(html)

    console.time('Selector finding')
    const results = await Promise.all(
      fieldNames.map(async (fieldName) => {
        try {
          const selectors = findSelectorsFromHTML($, html, fieldName)

          if (selectors.length === 0) {
            return {
              fieldName,
              selector: '',
              count: 0,
              samples: [],
              status: 'failed' as const,
            }
          }

          // 간단한 검증만 수행 (실제 크롤링 없이)
          const firstSelector = selectors[0]
          const elements = $(firstSelector)

          return {
            fieldName,
            selector: firstSelector,
            count: Math.min(elements.length, 10),
            samples: elements
              .slice(0, 3)
              .map((_, el) => $(el).text().trim())
              .get(),
            status:
              elements.length > 0 ? ('success' as const) : ('failed' as const),
          }
        } catch (error) {
          console.error(`Error processing field "${fieldName}":`, error)
          return {
            fieldName,
            selector: '',
            count: 0,
            samples: [],
            status: 'failed' as const,
          }
        }
      })
    )
    console.timeEnd('Selector finding')

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Batch suggest error:', error)
    return NextResponse.json(
      { error: 'Failed to process batch' },
      { status: 500 }
    )
  }
}

function findSelectorsFromHTML(
  $: cheerio.CheerioAPI,
  html: string,
  fieldName: string
): string[] {
  const selectors: string[] = []
  const lowerName = fieldName.toLowerCase()

  console.log(`\n=== Finding selectors for "${fieldName}" ===`)

  // longtermcare.or.kr 전용 하드코딩 매핑
  // "목록검색" 탭 클릭 후 테이블 구조: 12개 컬럼
  const LONGTERMCARE_FIELD_MAPPING: Record<string, string> = {
    장기요양기관: '#ltco_info_list tbody tr td:nth-child(3)',
    급여종류: '#ltco_info_list tbody tr td:nth-child(4)',
    평가결과: '#ltco_info_list tbody tr td:nth-child(5)',
    정원: '#ltco_info_list tbody tr td:nth-child(6)',
    현원: '#ltco_info_list tbody tr td:nth-child(7)',
    건평: '#ltco_info_list tbody tr td:nth-child(8)',
    대여: '#ltco_info_list tbody tr td:nth-child(9)',
    목욕차량: '#ltco_info_list tbody tr td:nth-child(10)',
    주소: '#ltco_info_list tbody tr td:nth-child(11)',
    전화번호: '#ltco_info_list tbody tr td:nth-child(12)',
    전화: '#ltco_info_list tbody tr td:nth-child(12)',
  }

  // 먼저 하드코딩 매핑 확인
  if (LONGTERMCARE_FIELD_MAPPING[fieldName]) {
    console.log(
      `✅ Using predefined mapping for "${fieldName}": ${LONGTERMCARE_FIELD_MAPPING[fieldName]}`
    )
    selectors.push(LONGTERMCARE_FIELD_MAPPING[fieldName])
    return selectors
  }

  // 1. 테이블 구조 분석 (fallback)
  const tables = $('table')
  console.log(`Found ${tables.length} tables in HTML`)

  // 데이터 행이 많은 테이블 찾기 (실제 목록 테이블)
  let mainTable: cheerio.Cheerio | null = null
  let maxRows = 0

  tables.each((_, table) => {
    const rowCount = $(table).find('tbody tr').length
    if (rowCount > maxRows) {
      maxRows = rowCount
      mainTable = $(table)
    }
  })

  console.log(`Main data table has ${maxRows} rows`)

  if (mainTable && maxRows > 0) {
    // 키워드 매핑 (확장)
    const fieldKeywords: Record<string, string[]> = {
      장기요양기관: ['기관', '명칭', '시설'],
      기관: ['기관', '명칭', '시설'],
      급여종류: ['급여', '종류', '유형'],
      급여: ['급여', '종류', '유형'],
      평가결과: ['평가', '등급', '결과'],
      평가: ['평가', '등급', '결과'],
      정원: ['정원', '인원'],
      현원: ['현원', '현재'],
      주소: ['주소', '소재지', '위치'],
      전화번호: ['전화', '연락'],
      전화: ['전화', '연락'],
    }

    // 필드명에 해당하는 키워드 찾기
    let matchedKeywords: string[] = []
    for (const [key, keywords] of Object.entries(fieldKeywords)) {
      if (lowerName.includes(key.toLowerCase())) {
        matchedKeywords = keywords
        console.log(
          `Matched field type: "${key}" with keywords:`,
          matchedKeywords
        )
        break
      }
    }

    if (matchedKeywords.length === 0) {
      console.log(`No keyword match found for "${fieldName}"`)
    }

    // 메인 테이블 헤더 분석
    console.log(`\nAnalyzing main data table...`)

    // thead 또는 첫 번째 tr의 th/td 찾기
    let headers = mainTable.find('thead tr th, thead tr td')
    if (headers.length === 0) {
      headers = mainTable.find('tbody tr:first th, tbody tr:first td')
      console.log(
        `No thead found, checking first tbody row. Found ${headers.length} headers`
      )
    } else {
      console.log(`Found ${headers.length} headers in thead`)
    }

    if (headers.length > 0) {
      console.log(`Header texts:`)
      headers.each((colIndex, header) => {
        const headerText = $(header).text().toLowerCase().trim()
        console.log(`  Column ${colIndex + 1}: "${headerText}"`)

        // 키워드 매칭
        if (matchedKeywords.length > 0) {
          const matchedKeyword = matchedKeywords.find((kw) =>
            headerText.includes(kw)
          )
          if (matchedKeyword) {
            // nth-child는 1부터 시작
            selectors.push(`table tbody tr td:nth-child(${colIndex + 1})`)
            console.log(
              `  ✅ MATCHED "${fieldName}" to column ${colIndex + 1} via keyword "${matchedKeyword}"`
            )
          }
        }
      })
    } else {
      console.log(`No headers found in main table`)
    }

    // 헤더를 찾지 못한 경우 특정 열 번호 할당
    if (selectors.length === 0) {
      console.log(`No header match found, using default column mapping...`)

      const defaultColumns: Record<string, number> = {
        기관: 3,
        장기요양: 3,
        급여: 4,
        평가: 5,
        정원: 6,
        현원: 7,
        건평: 8,
        대여: 9,
        목욕: 10,
        주소: 11,
        전화: 12,
      }

      for (const [key, colNum] of Object.entries(defaultColumns)) {
        if (lowerName.includes(key)) {
          selectors.push(`table tbody tr td:nth-child(${colNum})`)
          console.log(`  📍 Using default column ${colNum} for "${fieldName}"`)
          break
        }
      }
    }
  }

  // 2. 클래스 기반 매칭
  const classPatterns: Record<string, string[]> = {
    기관: ['dtl', 'detail', 'name', 'title', 'inst'],
    급여: ['type', 'kind', 'category', 'service'],
    평가: ['grade', 'rating', 'eval', 'score', 'result'],
    정원: ['capacity', 'limit', 'max', 'total'],
    현원: ['current', 'now', 'present'],
    주소: ['address', 'addr', 'location', 'place'],
    전화: ['tel', 'phone', 'contact', 'call'],
  }

  for (const [key, patterns] of Object.entries(classPatterns)) {
    if (lowerName.includes(key)) {
      patterns.forEach((pattern) => {
        // 클래스 속성 검색
        $(`[class*="${pattern}"]`).each((_, elem) => {
          const classes = $(elem).attr('class')?.split(/\s+/) || []
          classes.forEach((cls) => {
            if (cls.toLowerCase().includes(pattern)) {
              selectors.push(`.${cls}`)
            }
          })
        })
      })
    }
  }

  // 3. 특수 패턴
  if (lowerName.includes('기관')) {
    selectors.push('.ulineDtl', 'a.ulineDtl', 'a[name="btn_detail"]')
  }

  // 4. ID 기반 매칭
  $('[id]').each((_, elem) => {
    const id = $(elem).attr('id') || ''
    if (id.toLowerCase().includes(lowerName.substring(0, 3))) {
      selectors.push(`#${id}`)
    }
  })

  // 중복 제거
  const uniqueSelectors = [...new Set(selectors)]
  console.log(
    `\n📊 Final result for "${fieldName}": Found ${uniqueSelectors.length} unique selectors`
  )
  if (uniqueSelectors.length > 0) {
    console.log(`   First selector: ${uniqueSelectors[0]}`)
  } else {
    console.log(`   ⚠️ No selectors found!`)
  }
  console.log(`=== End "${fieldName}" ===\n`)

  return uniqueSelectors
}
