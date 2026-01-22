import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function suggestSelector(
  html: string,
  fieldName: string
): Promise<{ selector: string; confidence: number }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `당신은 웹 스크래핑 전문가입니다. 주어진 HTML에서 "${fieldName}"라는 데이터를 추출하기 위한 최적의 CSS Selector를 찾아주세요.

HTML:
\`\`\`html
${html.substring(0, 8000)}
\`\`\`

요구사항:
1. "${fieldName}" 필드에 해당하는 가장 적절한 CSS Selector를 제시해주세요
2. Selector는 가능한 구체적이고 안정적이어야 합니다
3. 응답은 반드시 다음 JSON 형식으로만 제공해주세요:

{
  "selector": "CSS Selector 문자열",
  "confidence": 0.95,
  "explanation": "이 selector를 선택한 이유"
}

confidence는 0에서 1 사이의 숫자로, 이 selector가 정확할 확률을 나타냅니다.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // JSON 추출 (마크다운 코드블록 제거)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      selector: parsed.selector,
      confidence: parsed.confidence || 0.5,
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    // 기본 selector 반환 (fallback)
    return {
      selector: 'h1',
      confidence: 0.1,
    }
  }
}
