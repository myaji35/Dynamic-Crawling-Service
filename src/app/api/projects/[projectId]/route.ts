import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkAuthorization } from '@/lib/auth'
import { z } from 'zod'

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  urls: z.array(z.string().url()).min(1).optional(),
  selectors: z.record(z.string(), z.string()).optional(),
  scheduleType: z
    .enum(['hourly', 'daily', 'weekly', 'monthly', 'manual'])
    .optional(),
  scheduleCron: z.string().optional().nullable(),
  notifyGoogleChat: z.string().url().optional().nullable(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { project, error } = await checkAuthorization(projectId)
    if (error) return error

    const projectWithDetails = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        crawlingRuns: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { crawlingRuns: true },
        },
      },
    })

    return NextResponse.json({ project: projectWithDetails })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json(
      { error: '프로젝트 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { error } = await checkAuthorization(projectId)
    if (error) return error

    const body = await req.json()
    const data = updateProjectSchema.parse(body)

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data,
    })

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || '유효성 검사 오류가 발생했습니다.' },
        { status: 400 }
      )
    }

    console.error('Update project error:', error)
    return NextResponse.json(
      { error: '프로젝트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { error } = await checkAuthorization(projectId)
    if (error) return error

    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ message: '프로젝트가 삭제되었습니다.' })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: '프로젝트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
