import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { recommendSelectors } from '@/lib/openai/selector-recommender'
import { z } from 'zod'

const recommendSelectorsSchema = z.object({
  sampleUrl: z.string().url('유효한 URL을 입력해주세요.'),
  fields: z.array(z.string()).min(1, '최소 1개 이상의 필드가 필요합니다.'),
})

/**
 * POST /api/chatbot/recommend-selectors
 * AI 기반 CSS Selector 추천
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { sampleUrl, fields } = recommendSelectorsSchema.parse(body)

    // Call OpenAI to recommend selectors
    const recommendations = await recommendSelectors(sampleUrl, fields)

    return NextResponse.json({ recommendations })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || '유효성 검사 오류가 발생했습니다.' },
        { status: 400 }
      )
    }

    console.error('Recommend selectors error:', error)
    return NextResponse.json(
      { error: 'Selector 추천 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
