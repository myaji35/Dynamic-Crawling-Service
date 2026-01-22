'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Play, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ApiBuilderDemoPage() {
  const router = useRouter()

  // API 설정
  const [projectName, setProjectName] = useState('JSONPlaceholder 테스트 API')
  const [endpoint, setEndpoint] = useState(
    'https://jsonplaceholder.typicode.com/posts'
  )
  const [apiKey, setApiKey] = useState('')
  const [responseFormat, setResponseFormat] = useState<'xml' | 'json'>('json')
  const [dataPath, setDataPath] = useState('')
  const [params, setParams] = useState(
    JSON.stringify({ _limit: '10' }, null, 2)
  )

  // 테스트 결과
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [testError, setTestError] = useState<string | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setTestError(null)
    setTestResult(null)

    try {
      // params 파싱 (안전하게)
      let parsedParams = {}
      try {
        if (params && params.trim()) {
          parsedParams = JSON.parse(params)
        }
      } catch (parseError) {
        throw new Error('파라미터 JSON 형식이 올바르지 않습니다.')
      }

      // 서버 사이드 프록시를 통해 API 호출
      const response = await fetch('/api/test-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
          apiKey: apiKey || undefined,
          params: parsedParams,
          responseFormat,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `API 호출 실패: ${response.status}`)
      }

      if (result.success) {
        setTestResult(result)
      } else {
        throw new Error(result.error || 'API 테스트 실패')
      }
    } catch (error) {
      console.error('API 테스트 실패:', error)
      setTestError(String(error))
    } finally {
      setTesting(false)
    }
  }

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // params 파싱 (안전하게)
      let parsedParams = {}
      try {
        if (params && params.trim()) {
          parsedParams = JSON.parse(params)
        }
      } catch (parseError) {
        throw new Error('파라미터 JSON 형식이 올바르지 않습니다.')
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          dataSourceType: 'api',
          apiConfig: {
            endpoint,
            apiKey: apiKey || undefined,
            method: 'GET',
            params: parsedParams,
            responseFormat,
            dataPath: dataPath || undefined,
          },
          scheduleType: 'manual',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || `프로젝트 생성 실패: ${response.status}`
        )
      }

      setSaveSuccess(true)
      console.log('프로젝트가 성공적으로 생성되었습니다:', result.project)

      // 3초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('프로젝트 저장 실패:', error)
      setSaveError(String(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          대시보드로 돌아가기
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Builder</h1>
            <p className="text-muted-foreground mt-2">
              REST API에서 데이터를 수집하는 프로젝트를 설정하세요
            </p>
          </div>
          <Button
            onClick={handleSave}
            size="lg"
            disabled={saving || !projectName || !endpoint}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 왼쪽: API 설정 */}
        <div className="space-y-6">
          {/* 프로젝트 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 정보</CardTitle>
              <CardDescription>프로젝트 이름을 입력하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="projectName">프로젝트 이름</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="예: 공공데이터 API 프로젝트"
                />
              </div>
            </CardContent>
          </Card>

          {/* API 엔드포인트 */}
          <Card>
            <CardHeader>
              <CardTitle>API 엔드포인트</CardTitle>
              <CardDescription>
                데이터를 가져올 API URL을 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">엔드포인트 URL</Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.example.com/data"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">인증키 (Service Key)</Label>
                <Textarea
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API 인증키를 입력하세요"
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  공공데이터포털의 경우 "일반 인증키 (Decoding)" 값을 입력하세요
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 요청 파라미터 */}
          <Card>
            <CardHeader>
              <CardTitle>요청 파라미터</CardTitle>
              <CardDescription>
                API 호출 시 전달할 파라미터 (JSON 형식)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="params">파라미터 (JSON)</Label>
                <Textarea
                  id="params"
                  value={params}
                  onChange={(e) => setParams(e.target.value)}
                  placeholder='{ "numOfRows": "10", "pageNo": "1" }'
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* 응답 형식 */}
          <Card>
            <CardHeader>
              <CardTitle>응답 형식</CardTitle>
              <CardDescription>
                API 응답 데이터 형식을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="responseFormat">데이터 형식</Label>
                <select
                  id="responseFormat"
                  value={responseFormat}
                  onChange={(e) =>
                    setResponseFormat(e.target.value as 'xml' | 'json')
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="xml">XML</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataPath">데이터 경로</Label>
                <Input
                  id="dataPath"
                  value={dataPath}
                  onChange={(e) => setDataPath(e.target.value)}
                  placeholder="response.body.items.item"
                />
                <p className="text-xs text-muted-foreground">
                  응답에서 실제 데이터 배열이 위치한 경로 (점으로 구분)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 테스트 및 결과 */}
        <div className="space-y-6">
          {/* 테스트 실행 */}
          <Card>
            <CardHeader>
              <CardTitle>API 테스트</CardTitle>
              <CardDescription>설정한 API를 테스트해보세요</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleTest}
                disabled={testing || !endpoint}
                className="w-full"
                size="lg"
              >
                {testing ? (
                  <>
                    <Database className="mr-2 h-4 w-4 animate-spin" />
                    테스트 중...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    API 테스트 실행
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 테스트 결과 */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">✅ 테스트 성공</CardTitle>
                <CardDescription>
                  응답 형식: {testResult.contentType?.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>응답 미리보기 (첫 500자)</Label>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{testResult.preview}</code>
                  </pre>
                  {testResult.fullText && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                        전체 응답 보기
                      </summary>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs mt-2 max-h-96">
                        <code>{testResult.fullText}</code>
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 테스트 에러 */}
          {testError && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">❌ 테스트 실패</CardTitle>
                <CardDescription>
                  API 호출 중 오류가 발생했습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-red-50 p-4 rounded-lg overflow-x-auto text-xs text-red-900">
                  <code>{testError}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 저장 성공 */}
          {saveSuccess && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-600">✅ 저장 성공</CardTitle>
                <CardDescription>
                  프로젝트가 성공적으로 생성되었습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800">
                  프로젝트 &quot;{projectName}&quot;이(가) 저장되었습니다. 잠시
                  후 대시보드로 이동합니다...
                </p>
              </CardContent>
            </Card>
          )}

          {/* 저장 에러 */}
          {saveError && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">❌ 저장 실패</CardTitle>
                <CardDescription>
                  프로젝트 저장 중 오류가 발생했습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-red-50 p-4 rounded-lg overflow-x-auto text-xs text-red-900">
                  <code>{saveError}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 사용 안내 */}
          <Card>
            <CardHeader>
              <CardTitle>API Builder 사용 안내</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ol className="space-y-2">
                <li>
                  <strong>프로젝트 이름:</strong> 프로젝트를 식별할 수 있는
                  이름을 입력합니다.
                </li>
                <li>
                  <strong>엔드포인트 URL:</strong> 데이터를 가져올 API의 전체
                  URL을 입력합니다.
                </li>
                <li>
                  <strong>인증키:</strong> API 제공자가 발급한 인증키를
                  입력합니다. 공공데이터포털의 경우 "일반 인증키 (Decoding)"
                  값을 사용하세요.
                </li>
                <li>
                  <strong>요청 파라미터:</strong> API 호출 시 필요한 파라미터를
                  JSON 형식으로 입력합니다.
                </li>
                <li>
                  <strong>응답 형식:</strong> API가 반환하는 데이터
                  형식(XML/JSON)을 선택합니다.
                </li>
                <li>
                  <strong>데이터 경로:</strong> 응답에서 실제 데이터 배열의
                  위치를 점(.)으로 구분하여 입력합니다.
                </li>
                <li>
                  <strong>테스트:</strong> "API 테스트 실행" 버튼을 클릭하여
                  설정이 올바른지 확인합니다.
                </li>
                <li>
                  <strong>저장:</strong> 테스트 성공 후 "저장" 버튼을 클릭하여
                  프로젝트를 생성합니다.
                </li>
              </ol>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  💡 공공데이터포털 사용 팁
                </p>
                <ul className="mt-2 text-blue-800 dark:text-blue-200 text-sm space-y-1">
                  <li>
                    • 활용신청 후 발급받은 "일반 인증키 (Decoding)" 값을
                    사용하세요
                  </li>
                  <li>
                    • 인증키가 URL 인코딩되어 있으면 디코딩된 값을 입력하세요
                  </li>
                  <li>• 일일 트래픽 제한이 있으므로 80%까지만 사용됩니다</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
