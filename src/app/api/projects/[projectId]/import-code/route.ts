import { NextResponse } from 'next/server'
import { checkAuthorization } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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

    const { code, language } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'code is required and must be a string' },
        { status: 400 }
      )
    }

    // Gemini를 사용해서 코드 분석
    const prompt = `
다음은 웹 크롤링 코드입니다. 이 코드를 분석해서 다음 정보를 추출해주세요:

1. 대상 URL (target_url)
2. 수집하는 데이터 필드와 CSS 셀렉터 (fields)

응답 형식 (JSON만 출력):
{
  "url": "추출된 URL",
  "fields": {
    "필드명1": "CSS 셀렉터1",
    "필드명2": "CSS 셀렉터2"
  }
}

크롤링 코드:
\`\`\`${language || 'unknown'}
${code}
\`\`\`

참고:
- Python의 경우: BeautifulSoup의 select(), find(), find_all() 등을 확인
- JavaScript의 경우: querySelector(), $(), page.$() 등을 확인
- 필드명은 변수명이나 키 이름을 참고
- CSS 셀렉터가 아닌 XPath나 다른 방식이면 CSS 셀렉터로 변환
- URL이 여러 개면 첫 번째 것만 추출

You are a web scraping expert. Analyze the code and extract URL and CSS selectors. Always respond in valid JSON format only. Do not include any markdown formatting or code blocks in your response.
`

    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.3,
      },
    })

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    if (!text) {
      return NextResponse.json(
        { error: '코드 분석에 실패했습니다.' },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(text)

    return NextResponse.json({
      url: parsed.url || '',
      fields: parsed.fields || {},
      originalCode: code,
      language: language || 'unknown',
    })
  } catch (error) {
    console.error('Import code error:', error)
    return NextResponse.json(
      { error: '코드 임포트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
