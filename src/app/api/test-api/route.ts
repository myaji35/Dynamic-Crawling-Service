import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

export async function POST(req: Request) {
  try {
    const { endpoint, apiKey, params, responseFormat } = await req.json()

    if (!endpoint) {
      return NextResponse.json(
        { error: 'endpoint is required' },
        { status: 400 }
      )
    }

    // API 호출
    const url = new URL(endpoint)

    // 인증키 추가
    if (apiKey) {
      url.searchParams.set('serviceKey', apiKey)
    }

    // 파라미터 추가
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value as string)
      })
    }

    console.log('[test-api] API 호출:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/xml,application/json,text/xml,*/*',
      },
    })

    console.log('[test-api] 응답 상태:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[test-api] API 응답 에러:', errorText)
      return NextResponse.json(
        {
          error: `API 호출 실패: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    let data: any

    // XML 파싱
    if (contentType.includes('xml') || responseFormat === 'xml') {
      const xmlText = await response.text()
      console.log('[test-api] XML 응답 (첫 500자):', xmlText.substring(0, 500))

      try {
        const parsed = await parseStringPromise(xmlText, {
          explicitArray: false,
          ignoreAttrs: false,
          mergeAttrs: true,
        })

        return NextResponse.json({
          success: true,
          contentType: 'xml',
          preview: xmlText.substring(0, 500),
          fullText: xmlText,
          parsed: parsed,
        })
      } catch (parseError) {
        console.error('[test-api] XML 파싱 에러:', parseError)
        return NextResponse.json({
          success: true,
          contentType: 'xml',
          preview: xmlText.substring(0, 500),
          fullText: xmlText,
          parseError: String(parseError),
        })
      }
    }
    // JSON 파싱
    else if (contentType.includes('json') || responseFormat === 'json') {
      const jsonData = await response.json()
      console.log(
        '[test-api] JSON 응답:',
        JSON.stringify(jsonData, null, 2).substring(0, 500)
      )

      return NextResponse.json({
        success: true,
        contentType: 'json',
        preview: JSON.stringify(jsonData, null, 2).substring(0, 500),
        data: jsonData,
      })
    } else {
      const text = await response.text()
      return NextResponse.json({
        success: true,
        contentType: 'unknown',
        preview: text.substring(0, 500),
        fullText: text,
      })
    }
  } catch (error) {
    console.error('[test-api] 에러:', error)
    return NextResponse.json(
      { error: 'API 테스트 실패', details: String(error) },
      { status: 500 }
    )
  }
}
