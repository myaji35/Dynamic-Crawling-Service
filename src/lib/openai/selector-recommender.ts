import { openai } from './client'
import { chromium } from 'playwright'

export interface SelectorRecommendation {
  selector: string
  confidence: number
  sampleValue: string
  reasoning: string
}

export interface SelectorRecommendations {
  [fieldName: string]: SelectorRecommendation
}

/**
 * Recommend CSS selectors for given field names using OpenAI GPT-4
 */
export async function recommendSelectors(
  sampleUrl: string,
  fields: string[]
): Promise<SelectorRecommendations> {
  // Fetch HTML using Playwright
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(sampleUrl, { waitUntil: 'networkidle', timeout: 30000 })
    const html = await page.content()
    await browser.close()

    // Call OpenAI to analyze HTML and recommend selectors
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `당신은 HTML 전문가로 CSS Selector를 추천합니다. 주어진 HTML과 필드명을 분석하여 가장 적합한 CSS Selector를 찾아주세요.`,
        },
        {
          role: 'user',
          content: `다음 HTML에서 이 필드들에 대한 CSS Selector를 추천해주세요:
필드: ${fields.join(', ')}

HTML (처음 5000자):
${html.slice(0, 5000)}

각 필드에 대해 다음 정보를 JSON 형식으로 반환해주세요:
{
  "필드명": {
    "selector": "CSS selector",
    "confidence": 0.0-1.0,
    "sampleValue": "추출된 샘플 값",
    "reasoning": "왜 이 selector를 선택했는지 한 문장 설명"
  }
}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return result as SelectorRecommendations
  } catch (error) {
    await browser.close()
    throw error
  }
}
