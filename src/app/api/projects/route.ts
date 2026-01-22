import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const createProjectSchema = z
  .object({
    name: z.string().min(1, '프로젝트 이름을 입력해주세요.'),
    description: z.string().optional(),
    dataSourceType: z.enum(['web-scraping', 'api']).default('web-scraping'),

    // 웹 크롤링 설정
    urls: z
      .array(z.string().url('유효한 URL을 입력해주세요.'))
      .optional()
      .default([]),
    selectors: z.record(z.string(), z.string()).optional().default({}),

    // API 설정
    apiConfig: z
      .object({
        endpoint: z.string().url('유효한 엔드포인트 URL을 입력해주세요.'),
        apiKey: z.string().optional(),
        method: z.enum(['GET', 'POST']).default('GET'),
        params: z.record(z.string(), z.string()).optional().default({}),
        responseFormat: z.enum(['xml', 'json']).default('json'),
        dataPath: z.string().optional(),
      })
      .optional(),

    scheduleType: z
      .enum(['hourly', 'daily', 'weekly', 'monthly', 'manual'])
      .default('manual'),
    scheduleCron: z.string().optional(),
    notifyGoogleChat: z.string().url().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.dataSourceType === 'web-scraping') {
        return (
          data.urls &&
          data.urls.length > 0 &&
          data.selectors &&
          Object.keys(data.selectors).length > 0
        )
      }
      if (data.dataSourceType === 'api') {
        return data.apiConfig && data.apiConfig.endpoint
      }
      return false
    },
    {
      message:
        '웹 크롤링 프로젝트는 URL과 셀렉터가 필요하고, API 프로젝트는 API 설정이 필요합니다.',
    }
  )

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { crawlingRuns: true },
        },
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json(
      { error: '프로젝트 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json()
    const data = createProjectSchema.parse(body)

    console.log('Creating project for userId:', userId)

    // Ensure user exists in our database (Clerk webhook should have created it)
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: '', // Will be updated by webhook
        name: '', // Will be updated by webhook
        passwordHash: '', // Not used with Clerk
      },
    })

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description,
        dataSourceType: data.dataSourceType,
        urls: data.urls || [],
        selectors: data.selectors || {},
        apiConfig: data.apiConfig || null,
        scheduleType: data.scheduleType,
        scheduleCron: data.scheduleCron,
        notifyGoogleChat: data.notifyGoogleChat,
        status: 'active',
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || '유효성 검사 오류가 발생했습니다.' },
        { status: 400 }
      )
    }

    console.error('Create project error:', error)
    return NextResponse.json(
      { error: '프로젝트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
