import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/prisma'
import { scrapeMultiplePages } from '@/lib/crawler'

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

  const { startPage, endPage, pageParamName } = await req.json()

  if (!startPage || !endPage) {
    return NextResponse.json(
      { error: 'Start page and end page are required' },
      { status: 400 }
    )
  }

  if (startPage < 1 || endPage < startPage) {
    return NextResponse.json({ error: 'Invalid page range' }, { status: 400 })
  }

  if (endPage - startPage > 100) {
    return NextResponse.json(
      { error: 'Page range too large. Maximum 100 pages per request.' },
      { status: 400 }
    )
  }

  try {
    const dataSchema = project.dataSchema as Record<
      string,
      { selector: string }
    >
    const allData: Record<string, string[]> = {}

    // 각 필드별로 데이터 수집
    for (const [fieldName, fieldConfig] of Object.entries(dataSchema)) {
      const results = await scrapeMultiplePages(
        project.targetUrl,
        fieldConfig.selector,
        startPage,
        endPage,
        pageParamName || 'page'
      )

      allData[fieldName] = results
    }

    // 데이터를 개별 항목으로 변환
    const itemCount = Math.max(
      ...Object.values(allData).map((arr) => arr.length)
    )
    const items = []

    for (let i = 0; i < itemCount; i++) {
      const item: Record<string, string> = {}
      for (const [fieldName, values] of Object.entries(allData)) {
        item[fieldName] = values[i] || ''
      }
      items.push(item)
    }

    // 데이터베이스에 저장
    const crawlResult = await prisma.crawlResult.create({
      data: {
        projectId: project.id,
        data: items,
        itemCount: items.length,
      },
    })

    return NextResponse.json({
      success: true,
      crawlResultId: crawlResult.id,
      itemCount: items.length,
      pageRange: `${startPage}-${endPage}`,
      data: items,
      message: `${startPage}페이지부터 ${endPage}페이지까지 총 ${items.length}개 항목을 수집했습니다.`,
    })
  } catch (error) {
    console.error('Multi-page crawl error:', error)
    return NextResponse.json(
      { error: 'Failed to crawl multiple pages' },
      { status: 500 }
    )
  }
}
