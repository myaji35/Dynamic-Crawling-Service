'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Eye,
  Code,
  Loader2,
  CheckCircle2,
  XCircle,
  MousePointerClick,
  Sparkles,
  FileCode,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface VisualBuilderProps {
  projectId: string
  url: string
  onFieldsUpdate: (fields: Record<string, string>) => void
  initialFields?: Record<string, string>
}

interface PreviewData {
  screenshot?: string
  html?: string
  suggestions?: SelectorSuggestion[]
}

interface SelectorSuggestion {
  fieldName: string
  selector: string
  sampleValue: string
  confidence: number
}

interface SelectedField {
  name: string
  selector: string
  sampleValue?: string
  verified: boolean
}

export function VisualBuilder({
  projectId,
  url,
  onFieldsUpdate,
  initialFields = {},
}: VisualBuilderProps) {
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([])
  const [currentFieldName, setCurrentFieldName] = useState('')
  const [currentSelector, setCurrentSelector] = useState('')
  const [testingSelector, setTestingSelector] = useState(false)

  // 코드 임포트 관련 state
  const [importCode, setImportCode] = useState('')
  const [importLanguage, setImportLanguage] = useState('javascript')
  const [importing, setImporting] = useState(false)

  // 초기 필드 로드
  useEffect(() => {
    if (initialFields && Object.keys(initialFields).length > 0) {
      const fields = Object.entries(initialFields).map(([name, selector]) => ({
        name,
        selector,
        verified: false,
      }))
      setSelectedFields(fields)
    }
  }, [initialFields])

  // 페이지 프리뷰 로드
  const loadPreview = async () => {
    setLoading(true)
    try {
      // crawl-pages API는 페이지네이션용이므로, 첫 페이지만 로드
      const response = await fetch(`/api/projects/${projectId}/crawl-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startPage: 1,
          endPage: 1,
          pageParamName: 'page',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewData({
          ...previewData,
          // 첫 페이지 데이터를 미리보기로 사용
          html: JSON.stringify(data.data, null, 2),
        })
      }
    } catch (error) {
      console.error('페이지 프리뷰 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // AI 셀렉터 추천
  const getSuggestions = async () => {
    setLoading(true)
    try {
      // 일반적인 필드명들로 AI 추천 요청
      const commonFields = [
        '제목',
        '내용',
        '가격',
        '날짜',
        '작성자',
        '카테고리',
      ]

      const response = await fetch(`/api/projects/${projectId}/suggest-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldNames: commonFields }),
      })

      if (response.ok) {
        const data = await response.json()
        // API 응답을 suggestions 형식으로 변환
        const suggestions =
          data.results?.map((result: any) => ({
            fieldName: result.fieldName,
            selector: result.selector,
            sampleValue: result.samples?.[0] || '',
            confidence: result.status === 'success' ? 0.8 : 0.3,
          })) || []

        setPreviewData((prev) => ({
          ...prev,
          suggestions,
        }))
      }
    } catch (error) {
      console.error('AI 추천 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 셀렉터 테스트
  const testSelector = async () => {
    if (!currentSelector.trim()) return

    setTestingSelector(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/test-selector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          selector: currentSelector,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error('셀렉터 테스트 실패:', error)
    } finally {
      setTestingSelector(false)
    }
  }

  // 필드 추가
  const addField = async () => {
    if (!currentFieldName.trim() || !currentSelector.trim()) return

    const testResult = await testSelector()

    const newField: SelectedField = {
      name: currentFieldName,
      selector: currentSelector,
      sampleValue: testResult?.sampleValue,
      verified: !!testResult?.success,
    }

    const updatedFields = [...selectedFields, newField]
    setSelectedFields(updatedFields)

    // 부모 컴포넌트에 업데이트 전달
    const fieldsObject: Record<string, string> = {}
    updatedFields.forEach((field) => {
      fieldsObject[field.name] = field.selector
    })
    onFieldsUpdate(fieldsObject)

    // 입력 필드 초기화
    setCurrentFieldName('')
    setCurrentSelector('')
  }

  // 필드 제거
  const removeField = (index: number) => {
    const updatedFields = selectedFields.filter((_, i) => i !== index)
    setSelectedFields(updatedFields)

    const fieldsObject: Record<string, string> = {}
    updatedFields.forEach((field) => {
      fieldsObject[field.name] = field.selector
    })
    onFieldsUpdate(fieldsObject)
  }

  // 추천 필드 적용
  const applySuggestion = (suggestion: SelectorSuggestion) => {
    setCurrentFieldName(suggestion.fieldName)
    setCurrentSelector(suggestion.selector)
  }

  // 코드 임포트
  const handleImportCode = async () => {
    if (!importCode.trim()) {
      alert('크롤링 코드를 입력해주세요.')
      return
    }

    setImporting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/import-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: importCode,
          language: importLanguage,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // URL이 추출되면 표시
        if (data.url) {
          alert(`✅ URL 추출 성공: ${data.url}`)
        }

        // 필드 자동 추가
        if (data.fields && Object.keys(data.fields).length > 0) {
          const newFields: SelectedField[] = Object.entries(data.fields).map(
            ([name, selector]) => ({
              name,
              selector: selector as string,
              verified: false,
            })
          )

          setSelectedFields([...selectedFields, ...newFields])

          // 부모 컴포넌트에 업데이트 전달
          const fieldsObject: Record<string, string> = {}
          ;[...selectedFields, ...newFields].forEach((field) => {
            fieldsObject[field.name] = field.selector
          })
          onFieldsUpdate(fieldsObject)

          alert(
            `✅ ${Object.keys(data.fields).length}개의 필드가 추출되었습니다!`
          )
        } else {
          alert('⚠️ 필드를 추출하지 못했습니다. 코드를 확인해주세요.')
        }

        // 입력 초기화
        setImportCode('')
      } else {
        const errorData = await response.json()
        alert(`❌ 오류: ${errorData.error || '코드 임포트 실패'}`)
      }
    } catch (error) {
      console.error('코드 임포트 실패:', error)
      alert('❌ 코드 임포트 중 오류가 발생했습니다.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 왼쪽: 프리뷰 및 추천 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            페이지 프리뷰
          </CardTitle>
          <CardDescription>
            대상 URL: <span className="font-mono text-xs">{url}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={loadPreview}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로딩 중...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    페이지 로드
                  </>
                )}
              </Button>
              <Button
                onClick={getSuggestions}
                disabled={loading}
                variant="outline"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI 추천
              </Button>
            </div>

            <Tabs defaultValue="import">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="import">
                  <FileCode className="mr-2 h-4 w-4" />
                  코드 임포트
                </TabsTrigger>
                <TabsTrigger value="suggestions">AI 추천</TabsTrigger>
                <TabsTrigger value="preview">미리보기</TabsTrigger>
              </TabsList>

              {/* 코드 임포트 탭 */}
              <TabsContent value="import" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language">프로그래밍 언어</Label>
                    <select
                      id="language"
                      value={importLanguage}
                      onChange={(e) => setImportLanguage(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border rounded-md"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="other">기타</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="code">크롤링 코드</Label>
                    <textarea
                      id="code"
                      value={importCode}
                      onChange={(e) => setImportCode(e.target.value)}
                      placeholder={`예시 (Python):
from bs4 import BeautifulSoup
import requests

url = "https://example.com"
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

title = soup.select_one('.product-title')
price = soup.select_one('.product-price')
description = soup.select_one('.product-desc')`}
                      className="w-full mt-2 px-3 py-2 border rounded-md font-mono text-sm h-[300px]"
                    />
                  </div>

                  <Button
                    onClick={handleImportCode}
                    disabled={importing || !importCode.trim()}
                    className="w-full"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <FileCode className="mr-2 h-4 w-4" />
                        코드에서 필드 추출
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
                    <p className="font-medium">💡 지원하는 라이브러리:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Python: BeautifulSoup, Scrapy, Selenium</li>
                      <li>JavaScript: Cheerio, Playwright, Puppeteer</li>
                      <li>기타: jQuery 셀렉터, CSS 셀렉터</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* AI 추천 탭 */}
              <TabsContent value="suggestions" className="mt-4">
                {previewData ? (
                  <ScrollArea className="h-[400px]">
                    {previewData.suggestions &&
                    previewData.suggestions.length > 0 ? (
                      <div className="space-y-3">
                        {previewData.suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">
                                {suggestion.fieldName}
                              </h4>
                              <Badge variant="secondary">
                                {Math.round(suggestion.confidence * 100)}%
                                신뢰도
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono mb-2">
                              {suggestion.selector}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              샘플: {suggestion.sampleValue}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>
                          AI 추천 버튼을 클릭하여 자동으로 필드를 감지하세요
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>AI 추천 버튼을 클릭하여 자동으로 필드를 감지하세요</p>
                  </div>
                )}
              </TabsContent>

              {/* 미리보기 탭 */}
              <TabsContent value="preview" className="mt-4">
                {previewData ? (
                  <ScrollArea className="h-[400px]">
                    {previewData.screenshot ? (
                      <img
                        src={previewData.screenshot}
                        alt="페이지 미리보기"
                        className="w-full border rounded"
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>데이터가 로드되었습니다</p>
                      </div>
                    )}
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>페이지 로드 버튼을 클릭하여 미리보기를 확인하세요</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* 오른쪽: 필드 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            필드 설정
          </CardTitle>
          <CardDescription>
            수집할 데이터 필드와 CSS 셀렉터를 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 필드 추가 폼 */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="fieldName">필드 이름</Label>
                <Input
                  id="fieldName"
                  value={currentFieldName}
                  onChange={(e) => setCurrentFieldName(e.target.value)}
                  placeholder="예: 제목, 가격, 설명"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selector">CSS 셀렉터</Label>
                <Input
                  id="selector"
                  value={currentSelector}
                  onChange={(e) => setCurrentSelector(e.target.value)}
                  placeholder="예: .title, #price, div.description"
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testSelector}
                  disabled={!currentSelector.trim() || testingSelector}
                  variant="outline"
                  className="flex-1"
                >
                  {testingSelector ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      테스트 중...
                    </>
                  ) : (
                    <>
                      <MousePointerClick className="mr-2 h-4 w-4" />
                      테스트
                    </>
                  )}
                </Button>
                <Button
                  onClick={addField}
                  disabled={!currentFieldName.trim() || !currentSelector.trim()}
                  className="flex-1"
                >
                  추가
                </Button>
              </div>
            </div>

            {/* 선택된 필드 목록 */}
            <div className="space-y-3">
              <h3 className="font-medium">
                선택된 필드 ({selectedFields.length})
              </h3>
              <ScrollArea className="h-[300px]">
                {selectedFields.length > 0 ? (
                  <div className="space-y-2">
                    {selectedFields.map((field, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 flex items-start justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{field.name}</h4>
                            {field.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-mono truncate">
                            {field.selector}
                          </p>
                          {field.sampleValue && (
                            <p className="text-xs text-muted-foreground mt-1">
                              샘플: {field.sampleValue}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                        >
                          제거
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>아직 추가된 필드가 없습니다</p>
                    <p className="text-xs mt-2">
                      왼쪽의 AI 추천을 사용하거나 직접 필드를 추가하세요
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
