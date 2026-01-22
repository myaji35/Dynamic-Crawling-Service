'use client'

import { useState } from 'react'
import { VisualBuilder } from '@/components/visual-builder/VisualBuilder'
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
import { ArrowLeft, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function VisualBuilderDemoPage() {
  const router = useRouter()
  const [demoUrl, setDemoUrl] = useState(
    'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch'
  )
  const [fields, setFields] = useState<Record<string, string>>({})
  const [projectName, setProjectName] = useState('Visual Builder 데모 프로젝트')

  const handleFieldsUpdate = (updatedFields: Record<string, string>) => {
    setFields(updatedFields)
  }

  const handleSave = () => {
    alert(
      '저장 기능은 데모입니다. 실제로는 프로젝트 상세 페이지에서 사용됩니다.'
    )
    console.log('Saved fields:', fields)
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
            <h1 className="text-3xl font-bold">Visual Builder</h1>
            <p className="text-muted-foreground mt-2">
              코드 없이 시각적으로 크롤링 필드를 설정하세요
            </p>
          </div>
          <Button onClick={handleSave} size="lg">
            <Save className="mr-2 h-4 w-4" />
            저장
          </Button>
        </div>
      </div>

      {/* 프로젝트 설정 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>프로젝트 설정</CardTitle>
          <CardDescription>
            데모 목적으로 프로젝트 정보를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="projectName">프로젝트 이름</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="프로젝트 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">대상 URL</Label>
              <Input
                id="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Builder */}
      <VisualBuilder
        projectId="demo-project-id"
        url={demoUrl}
        onFieldsUpdate={handleFieldsUpdate}
        initialFields={{}}
      />

      {/* 선택된 필드 미리보기 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>선택된 필드 미리보기 (JSON)</CardTitle>
          <CardDescription>
            현재 설정된 필드들이 JSON 형태로 표시됩니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
            <code>{JSON.stringify(fields, null, 2)}</code>
          </pre>
        </CardContent>
      </Card>

      {/* 사용법 안내 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Visual Builder 사용법</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ol className="space-y-2">
            <li>
              <strong>페이지 로드:</strong> 왼쪽 패널에서 "페이지 로드" 버튼을
              클릭하여 대상 URL을 미리 봅니다.
            </li>
            <li>
              <strong>AI 추천:</strong> "AI 추천" 버튼을 클릭하면 AI가 자동으로
              페이지의 주요 필드를 감지하고 CSS 셀렉터를 추천합니다.
            </li>
            <li>
              <strong>필드 추가:</strong> 오른쪽 패널에서 필드 이름과 CSS
              셀렉터를 입력하고 "추가" 버튼을 클릭합니다.
            </li>
            <li>
              <strong>셀렉터 테스트:</strong> "테스트" 버튼을 클릭하여 셀렉터가
              올바르게 작동하는지 확인합니다.
            </li>
            <li>
              <strong>저장:</strong> 모든 필드 설정이 완료되면 상단의 "저장"
              버튼을 클릭합니다.
            </li>
          </ol>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              💡 팁: CSS 셀렉터 예시
            </p>
            <ul className="mt-2 text-blue-800 dark:text-blue-200 text-sm">
              <li>
                <code>.title</code> - class가 "title"인 요소
              </li>
              <li>
                <code>#price</code> - id가 "price"인 요소
              </li>
              <li>
                <code>div.product h2</code> - div.product 안의 h2 요소
              </li>
              <li>
                <code>article &gt; .author</code> - article의 직접 자식인
                .author
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
