import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateCronExpression } from '@/lib/openai/cron-generator'
import { z } from 'zod'

const generateCronSchema = z.object({
  naturalLanguage: z.string().min(1, '스케줄 설명을 입력해주세요.'),
})

/**
 * POST /api/chatbot/generate-cron
 * 자연어를 Cron 표현식으로 변환
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { naturalLanguage } = generateCronSchema.parse(body)

    // Call OpenAI to generate cron expression
    const cronResult = await generateCronExpression(naturalLanguage)

    return NextResponse.json(cronResult)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || '유효성 검사 오류가 발생했습니다.' },
        { status: 400 }
      )
    }

    console.error('Generate cron error:', error)
    return NextResponse.json(
      { error: 'Cron 표현식 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
