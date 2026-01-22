import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/prisma'
import { getPageHTML } from '@/lib/crawler'

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

  const { fieldName, description } = await req.json()

  if (!fieldName || !description) {
    return NextResponse.json(
      { error: 'Field name and description are required' },
      { status: 400 }
    )
  }

  try {
    // HTML 가져오기
    const html = await getPageHTML(project.targetUrl)
    if (!html) {
      return NextResponse.json(
        { error: 'Failed to fetch page HTML' },
        { status: 500 }
      )
    }

    // 간단한 휴리스틱으로 selector 추천
    // 실제로는 Gemini API를 사용하지만, API 키가 없을 경우를 대비한 fallback
    const selectors = findPossibleSelectors(html, description)

    return NextResponse.json({
      success: true,
      suggestions: selectors.slice(0, 3), // 상위 3개만
      message: `"${description}"에 해당하는 Selector를 찾았습니다.`,
    })
  } catch (error) {
    console.error('Suggest from description error:', error)
    return NextResponse.json(
      { error: 'Failed to find selector' },
      { status: 500 }
    )
  }
}

function findPossibleSelectors(html: string, description: string): string[] {
  const selectors: string[] = []
  const lowerDesc = description.toLowerCase()

  // HTML에서 클래스명 추출
  const classRegex = /class=["']([^"']+)["']/g
  const classes = new Set<string>()
  let match
  while ((match = classRegex.exec(html)) !== null) {
    const classList = match[1].split(/\s+/)
    classList.forEach((cls) => classes.add(cls))
  }

  // 확장된 키워드 패턴
  const patterns = [
    {
      keyword: ['기관', '제목', 'title', '이름', 'name', '장기요양'],
      classPatterns: ['name', 'title', 'dtl', 'detail', 'inst', 'organization'],
      selector: 'h1, h2, h3, .title, .name, a.ulineDtl',
    },
    {
      keyword: ['급여', '종류', '유형', 'type'],
      classPatterns: ['type', 'kind', 'category'],
      selector: '.type, .kind, .category',
    },
    {
      keyword: ['평가', '결과', '등급', 'grade', 'rating'],
      classPatterns: ['grade', 'rating', 'eval', 'score'],
      selector: '.grade, .rating, .eval, .score',
    },
    {
      keyword: ['정원', '인원', 'capacity'],
      classPatterns: ['capacity', 'limit', 'max'],
      selector: '.capacity, .limit',
    },
    {
      keyword: ['현원', '현재', 'current'],
      classPatterns: ['current', 'now', 'present'],
      selector: '.current, .now',
    },
    {
      keyword: ['주소', 'address', 'addr'],
      classPatterns: ['address', 'addr', 'location'],
      selector: '.address, .addr, .location',
    },
    {
      keyword: ['전화', '연락', 'tel', 'phone', '번호'],
      classPatterns: ['tel', 'phone', 'contact'],
      selector: '.tel, .phone, .contact',
    },
  ]

  // 키워드 기반 매칭
  for (const pattern of patterns) {
    if (pattern.keyword.some((kw) => lowerDesc.includes(kw))) {
      // HTML에서 관련 클래스 찾기
      const foundClasses = Array.from(classes).filter((cls) =>
        pattern.classPatterns.some((p) => cls.toLowerCase().includes(p))
      )

      if (foundClasses.length > 0) {
        foundClasses.forEach((cls) => selectors.push(`.${cls}`))
      } else {
        // fallback selector
        selectors.push(pattern.selector)
      }
    }
  }

  // 테이블 패턴 분석
  if (html.includes('<table')) {
    // 테이블의 특정 열 추출
    const tableSelectors = [
      'table tbody tr td:nth-child(1)',
      'table tbody tr td:nth-child(2)',
      'table tbody tr td:nth-child(3)',
      'table tbody tr td a',
      'table tr td',
    ]

    if (lowerDesc.includes('기관') || lowerDesc.includes('이름')) {
      selectors.push(...tableSelectors.slice(0, 1))
    } else {
      selectors.push(...tableSelectors)
    }
  }

  // 링크 패턴 (기관명은 주로 링크)
  if (
    lowerDesc.includes('기관') ||
    lowerDesc.includes('이름') ||
    lowerDesc.includes('제목')
  ) {
    selectors.push(
      'a[class*="dtl"]',
      'a[class*="detail"]',
      'a[name]',
      'a[title]'
    )
  }

  // 중복 제거 및 정렬 (더 구체적인 selector 우선)
  const uniqueSelectors = [...new Set(selectors)]

  // 구체적인 selector 우선 정렬
  return uniqueSelectors.sort((a, b) => {
    const aScore = (a.match(/\./g) || []).length + (a.match(/\[/g) || []).length
    const bScore = (b.match(/\./g) || []).length + (b.match(/\[/g) || []).length
    return bScore - aScore
  })
}
