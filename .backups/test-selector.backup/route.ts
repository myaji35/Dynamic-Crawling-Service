import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/prisma'
import { scrapeMultipleData } from '@/lib/crawler'

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

  const { selector } = await req.json()

  if (!selector) {
    return NextResponse.json({ error: 'Selector is required' }, { status: 400 })
  }

  try {
    const results = await scrapeMultipleData(project.targetUrl, selector, 5)

    return NextResponse.json({
      success: true,
      count: results.length,
      samples: results,
      message:
        results.length > 0
          ? `${results.length}개의 요소를 찾았습니다.`
          : '해당 selector로 요소를 찾을 수 없습니다. Selector를 확인해주세요.',
    })
  } catch (error) {
    console.error('Test selector error:', error)
    return NextResponse.json(
      { error: 'Failed to test selector' },
      { status: 500 }
    )
  }
}
