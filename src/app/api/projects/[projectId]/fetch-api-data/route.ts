import { NextResponse } from 'next/server'
import { checkAuthorization } from '@/lib/auth'
import { parseStringPromise } from 'xml2js'
import { checkAndRecordApiUsage } from '@/lib/api-traffic'

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

    // 프로젝트가 API 타입인지 확인
    if (project.dataSourceType !== 'api') {
      return NextResponse.json(
        { error: '이 프로젝트는 API 데이터 소스가 아닙니다.' },
        { status: 400 }
      )
    }

    // API 트래픽 체크 (80% 제한)
    const trafficCheck = await checkAndRecordApiUsage(projectId, 10000, 80.0)

    if (!trafficCheck.allowed) {
      console.warn('[fetch-api-data] 트래픽 제한 초과:', trafficCheck.warning)
      return NextResponse.json(
        {
          error: trafficCheck.warning,
          usage: trafficCheck.usage,
        },
        { status: 429 } // Too Many Requests
      )
    }

    // 경고 메시지 로깅 (70% 이상 사용 시)
    if (trafficCheck.warning) {
      console.warn('[fetch-api-data] 트래픽 경고:', trafficCheck.warning)
    }

    const apiConfig = project.apiConfig as any
    if (!apiConfig || !apiConfig.endpoint) {
      return NextResponse.json(
        { error: 'API 설정이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 요청에서 추가 파라미터 받기 (페이지 번호 등)
    const body = await req.json()
    const { additionalParams = {} } = body

    // API 호출
    const url = new URL(apiConfig.endpoint)

    // 인증키 추가
    if (apiConfig.apiKey) {
      url.searchParams.set('serviceKey', apiConfig.apiKey)
    }

    // 기본 파라미터 추가
    if (apiConfig.params) {
      Object.entries(apiConfig.params).forEach(([key, value]) => {
        url.searchParams.set(key, value as string)
      })
    }

    // 추가 파라미터 추가 (동적 파라미터)
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value as string)
    })

    console.log('[fetch-api-data] API 호출:', url.toString())

    const response = await fetch(url.toString(), {
      method: apiConfig.method || 'GET',
      headers: {
        Accept: 'application/xml,application/json,text/xml,*/*',
      },
    })

    if (!response.ok) {
      console.error(
        '[fetch-api-data] API 응답 에러:',
        response.status,
        response.statusText
      )
      return NextResponse.json(
        { error: `API 호출 실패: ${response.statusText}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    let data: any
    let items: any[] = []

    // XML 파싱
    if (contentType.includes('xml') || apiConfig.responseFormat === 'xml') {
      const xmlText = await response.text()
      console.log(
        '[fetch-api-data] XML 응답 (첫 500자):',
        xmlText.substring(0, 500)
      )

      try {
        const parsed = await parseStringPromise(xmlText, {
          explicitArray: false,
          ignoreAttrs: false,
          mergeAttrs: true,
        })

        console.log(
          '[fetch-api-data] 파싱된 XML:',
          JSON.stringify(parsed, null, 2).substring(0, 1000)
        )

        // dataPath를 사용해서 실제 데이터 배열 추출
        // 예: "response.body.items.item"
        if (apiConfig.dataPath) {
          const paths = apiConfig.dataPath.split('.')
          data = parsed
          for (const path of paths) {
            if (data && data[path] !== undefined) {
              data = data[path]
            } else {
              console.warn(
                `[fetch-api-data] dataPath "${path}" not found in data`
              )
              break
            }
          }
        } else {
          data = parsed
        }

        // 배열로 변환
        if (Array.isArray(data)) {
          items = data
        } else if (data && typeof data === 'object') {
          items = [data]
        }
      } catch (parseError) {
        console.error('[fetch-api-data] XML 파싱 에러:', parseError)
        return NextResponse.json(
          { error: 'XML 파싱 실패', details: String(parseError) },
          { status: 500 }
        )
      }
    }
    // JSON 파싱
    else if (
      contentType.includes('json') ||
      apiConfig.responseFormat === 'json'
    ) {
      const jsonData = await response.json()
      console.log(
        '[fetch-api-data] JSON 응답:',
        JSON.stringify(jsonData, null, 2).substring(0, 1000)
      )

      if (apiConfig.dataPath) {
        const paths = apiConfig.dataPath.split('.')
        data = jsonData
        for (const path of paths) {
          if (data && data[path] !== undefined) {
            data = data[path]
          } else {
            console.warn(
              `[fetch-api-data] dataPath "${path}" not found in data`
            )
            break
          }
        }
      } else {
        data = jsonData
      }

      if (Array.isArray(data)) {
        items = data
      } else if (data && typeof data === 'object') {
        items = [data]
      }
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 응답 형식입니다.' },
        { status: 400 }
      )
    }

    console.log('[fetch-api-data] 추출된 아이템 개수:', items.length)

    return NextResponse.json({
      success: true,
      itemCount: items.length,
      items: items,
      usage: trafficCheck.usage,
      warning: trafficCheck.warning,
    })
  } catch (error) {
    console.error('[fetch-api-data] 에러:', error)
    return NextResponse.json(
      { error: 'API 데이터 가져오기 실패', details: String(error) },
      { status: 500 }
    )
  }
}
