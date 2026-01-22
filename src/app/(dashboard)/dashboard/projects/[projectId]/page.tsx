'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PreActionsEditor } from '@/components/PreActionsEditor'

interface PreAction {
  type: 'click' | 'input' | 'wait' | 'scroll'
  selector?: string
  value?: string
  waitAfter?: number
}

interface Project {
  id: string
  name: string
  status: string
  urls: string[]
  selectors: Record<string, string>
  scheduleType: string
  scheduleCron: string | null
  lastRunAt: string | null
  createdAt: string
  crawlingRuns?: any[]
}

interface SortableRowProps {
  fieldName: string
  selector: string
  index: number
  isSelected: boolean
  onEdit: (fieldName: string, selector: string) => void
  onDelete: (fieldName: string) => void
  onToggleSelect: (fieldName: string) => void
}

function SortableRow({
  fieldName,
  selector,
  index,
  isSelected,
  onEdit,
  onDelete,
  onToggleSelect,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldName })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(fieldName)}
          className="h-4 w-4 cursor-pointer"
        />
      </TableCell>
      <TableCell className="text-center text-muted-foreground w-12">
        {index + 1}
      </TableCell>
      <TableCell className="w-16">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex items-center justify-center p-2 hover:bg-muted rounded"
          title="드래그하여 순서 변경"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-muted-foreground"
          >
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>
      </TableCell>
      <TableCell className="font-medium">{fieldName}</TableCell>
      <TableCell className="font-mono text-sm">
        {selector ? (
          <span>{selector}</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-destructive">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Selector 미설정
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(fieldName, selector)}
              className="h-6 px-2 py-0 text-xs"
            >
              🔍 찾기
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(fieldName, selector)}
            className="cursor-pointer hover:bg-accent transition-colors"
          >
            편집
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(fieldName)}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          >
            삭제
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function ProjectDetailPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [sampleData, setSampleData] = useState<any>(null)
  const [runningCrawl, setRunningCrawl] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<{
    name: string
    selector: string
  } | null>(null)
  const [testResult, setTestResult] = useState<{
    count: number
    samples: string[]
    message: string
  } | null>(null)
  const [testing, setTesting] = useState(false)
  const [findingSelector, setFindingSelector] = useState(false)
  const [selectorSuggestions, setSelectorSuggestions] = useState<
    Array<{
      selector: string
      count: number
      samples: string[]
      confidence: number
    }>
  >([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [aiDescription, setAiDescription] = useState('')
  const [editingUrl, setEditingUrl] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [pageRangeDialogOpen, setPageRangeDialogOpen] = useState(false)
  const [startPage, setStartPage] = useState(1)
  const [endPage, setEndPage] = useState(10)
  const [pageParamName, setPageParamName] = useState('page')
  const [crawlingPages, setCrawlingPages] = useState(false)
  const [crawlProgress, setCrawlProgress] = useState('')
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false)
  const [newFieldNames, setNewFieldNames] = useState('')
  const [autoFinding, setAutoFinding] = useState(false)
  const [multiFieldResults, setMultiFieldResults] = useState<
    Array<{
      fieldName: string
      selector: string
      count: number
      samples: string[]
      status: 'finding' | 'success' | 'failed'
    }>
  >([])
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isLoaded && isSignedIn && projectId) {
      fetchProject()
    }
  }, [isLoaded, isSignedIn, projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      } else {
        console.error('프로젝트를 가져오는데 실패했습니다')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('프로젝트 가져오기 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const runSampleCrawl = async () => {
    if (!project) return

    // CSS Selector 검증
    if (project.selectors) {
      const emptySelectors = Object.entries(project.selectors)
        .filter(([_, selector]) => !selector || selector.trim() === '')
        .map(([fieldName, _]) => fieldName)

      if (emptySelectors.length > 0) {
        alert(
          `CSS Selector가 설정되지 않은 필드가 있습니다:\n\n` +
            `${emptySelectors.join(', ')}\n\n` +
            `각 필드의 "편집" 버튼을 클릭하여 CSS Selector를 설정해주세요.`
        )
        return
      }
    }

    setRunningCrawl(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/sample-crawl`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setSampleData(data)
      } else {
        alert('샘플 크롤링 실행 실패')
      }
    } catch (error) {
      console.error('샘플 크롤링 실패:', error)
      alert('샘플 크롤링 실행 중 오류 발생')
    } finally {
      setRunningCrawl(false)
    }
  }

  const deleteProject = async () => {
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        alert('프로젝트 삭제 실패')
      }
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error)
      alert('프로젝트 삭제 중 오류 발생')
    }
  }

  const updateTargetUrl = async () => {
    if (!newUrl.trim()) {
      alert('URL을 입력해주세요')
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [newUrl] }),
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        setEditingUrl(false)
        alert('URL이 업데이트되었습니다!')
      } else {
        alert('업데이트 실패')
      }
    } catch (error) {
      console.error('URL 업데이트 실패:', error)
      alert('업데이트 중 오류 발생')
    }
  }

  const updatePreActions = async (actions: PreAction[]) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preActions: actions.length > 0 ? actions : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      } else {
        alert('사전 액션 업데이트 실패')
      }
    } catch (error) {
      console.error('사전 액션 업데이트 실패:', error)
      alert('업데이트 중 오류 발생')
    }
  }

  const openEditDialog = async (fieldName: string, selector: string) => {
    setEditingField({ name: fieldName, selector })
    setTestResult(null)
    setShowAdvanced(false)
    setAiDescription('')
    setSelectorSuggestions([])
    setEditDialogOpen(true)

    // Selector가 비어있으면 자동으로 제안 받기
    if (!selector || selector.trim() === '') {
      setFindingSelector(true)
      try {
        const response = await fetch(
          `/api/projects/${projectId}/suggest-selector`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldName }),
          }
        )

        if (response.ok) {
          const data = await response.json()

          if (data.success && data.suggestions && data.suggestions.length > 0) {
            setSelectorSuggestions(data.suggestions)

            // 가장 신뢰도 높은 selector 자동 설정
            const bestSuggestion = data.suggestions[0]
            setEditingField({
              name: fieldName,
              selector: bestSuggestion.selector,
            })

            // 테스트 결과도 같이 표시
            setTestResult({
              count: bestSuggestion.count,
              samples: bestSuggestion.samples,
              message: `✨ AI가 자동으로 찾은 Selector입니다. (신뢰도: ${Math.round(bestSuggestion.confidence * 100)}%)`,
            })
          } else {
            setTestResult({
              count: 0,
              samples: [],
              message:
                '⚠️ Selector를 자동으로 찾지 못했습니다. 직접 입력해주세요.',
            })
          }
        }
      } catch (error) {
        console.error('Selector 제안 실패:', error)
        setTestResult({
          count: 0,
          samples: [],
          message: '❌ Selector 찾기 중 오류가 발생했습니다.',
        })
      } finally {
        setFindingSelector(false)
      }
    }
  }

  const findByDescription = async () => {
    if (!aiDescription.trim()) {
      alert('어떤 데이터를 찾고 싶은지 설명해주세요')
      return
    }

    setTesting(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/suggest-from-description`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fieldName: editingField?.name,
            description: aiDescription,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.suggestions && data.suggestions.length > 0) {
          // 첫 번째 제안을 사용
          const firstSelector = data.suggestions[0]
          setEditingField((prev) =>
            prev ? { ...prev, selector: firstSelector } : null
          )
          // 자동으로 테스트
          setTimeout(() => testSelector(), 100)
        }
      }
    } catch (error) {
      console.error('AI 제안 실패:', error)
    } finally {
      setTesting(false)
    }
  }

  const testSelector = async () => {
    if (!editingField) return

    // Selector 검증
    if (!editingField.selector || editingField.selector.trim() === '') {
      alert('CSS Selector를 입력해주세요.')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/test-selector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selector: editingField.selector }),
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult(data)
      } else {
        alert('Selector 테스트 실패')
      }
    } catch (error) {
      console.error('Selector 테스트 실패:', error)
      alert('Selector 테스트 중 오류 발생')
    } finally {
      setTesting(false)
    }
  }

  const saveFieldSelector = async () => {
    if (!editingField || !project) return

    try {
      const updatedSelectors = {
        ...project.selectors,
        [editingField.name]: editingField.selector,
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectors: updatedSelectors }),
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        setEditDialogOpen(false)
        alert('Selector가 업데이트되었습니다!')
      } else {
        alert('업데이트 실패')
      }
    } catch (error) {
      console.error('Selector 업데이트 실패:', error)
      alert('업데이트 중 오류 발생')
    }
  }

  const deleteField = async (fieldName: string) => {
    if (!project) return

    if (!confirm(`"${fieldName}" 필드를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const updatedSelectors = { ...project.selectors }
      delete updatedSelectors[fieldName]

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectors: updatedSelectors }),
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        alert('필드가 삭제되었습니다!')
      } else {
        alert('삭제 실패')
      }
    } catch (error) {
      console.error('필드 삭제 실패:', error)
      alert('삭제 중 오류 발생')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id || !project) return

    const fields = Object.entries(project.selectors)
    const oldIndex = fields.findIndex(([name]) => name === active.id)
    const newIndex = fields.findIndex(([name]) => name === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // 배열 순서 변경
    const newFields = arrayMove(fields, oldIndex, newIndex)

    // 새로운 객체 생성 (순서 유지)
    const updatedSelectors: Record<string, string> = {}
    newFields.forEach(([name, selector]) => {
      updatedSelectors[name] = selector
    })

    // 낙관적 업데이트 (UI 즉시 반영)
    setProject({ ...project, selectors: updatedSelectors })

    // 서버 저장
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectors: updatedSelectors }),
      })

      if (!response.ok) {
        // 실패 시 원래 데이터로 복구
        await fetchProject()
        alert('순서 변경 실패')
      }
    } catch (error) {
      console.error('순서 변경 실패:', error)
      await fetchProject()
      alert('순서 변경 중 오류 발생')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const toggleFieldSelection = (fieldName: string) => {
    console.log('toggleFieldSelection 호출:', fieldName)
    const newSelection = new Set(selectedFields)
    if (newSelection.has(fieldName)) {
      newSelection.delete(fieldName)
      console.log('선택 해제:', fieldName)
    } else {
      newSelection.add(fieldName)
      console.log('선택 추가:', fieldName)
    }
    setSelectedFields(newSelection)
    console.log('현재 선택된 필드 수:', newSelection.size)
  }

  const toggleAllFields = () => {
    console.log('toggleAllFields 호출')
    if (!project || !project.selectors) return
    const allFieldNames = Object.keys(project.selectors)
    if (selectedFields.size === allFieldNames.length) {
      console.log('전체 선택 해제')
      setSelectedFields(new Set())
    } else {
      console.log('전체 선택:', allFieldNames)
      setSelectedFields(new Set(allFieldNames))
    }
  }

  const confirmDeleteSelectedFields = () => {
    if (!project || selectedFields.size === 0) return
    setConfirmDeleteDialogOpen(true)
  }

  const deleteSelectedFields = async () => {
    if (!project) return

    try {
      const updatedSelectors = { ...project.selectors }
      selectedFields.forEach((fieldName) => {
        delete updatedSelectors[fieldName]
      })

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectors: updatedSelectors }),
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        setSelectedFields(new Set())
        setConfirmDeleteDialogOpen(false)
        alert(`${selectedFields.size}개의 필드가 삭제되었습니다!`)
      } else {
        alert('삭제 실패')
      }
    } catch (error) {
      console.error('필드 삭제 실패:', error)
      alert('삭제 중 오류 발생')
    }
  }

  const crawlMultiplePages = async () => {
    if (!project) return

    if (startPage < 1 || endPage < startPage) {
      alert('페이지 범위가 올바르지 않습니다')
      return
    }

    if (endPage - startPage > 100) {
      alert('한 번에 최대 100페이지까지만 크롤링할 수 있습니다')
      return
    }

    setCrawlingPages(true)
    setCrawlProgress(`${startPage}페이지부터 ${endPage}페이지까지 크롤링 중...`)

    try {
      const response = await fetch(`/api/projects/${projectId}/crawl-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startPage,
          endPage,
          pageParamName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCrawlProgress('')
        setPageRangeDialogOpen(false)
        setSampleData(data.data)
        alert(`성공! 총 ${data.itemCount}개의 항목을 수집했습니다.`)
      } else {
        const error = await response.json()
        alert(`크롤링 실패: ${error.error}`)
        setCrawlProgress('')
      }
    } catch (error) {
      console.error('페이지 범위 크롤링 실패:', error)
      alert('크롤링 중 오류 발생')
      setCrawlProgress('')
    } finally {
      setCrawlingPages(false)
    }
  }

  const openAddFieldDialog = () => {
    setNewFieldNames('')
    setMultiFieldResults([])
    setAddFieldDialogOpen(true)
  }

  const autoFindMultipleSelectors = async () => {
    if (!newFieldNames.trim()) {
      alert('필드명을 입력해주세요 (쉼표로 구분)')
      return
    }

    // 쉼표로 구분하여 필드명 배열 생성
    const fieldNames = newFieldNames
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (fieldNames.length === 0) {
      alert('유효한 필드명을 입력해주세요')
      return
    }

    // AI 자동 찾기를 제거하고, 바로 필드를 추가 (selector는 비워둠)
    setMultiFieldResults(
      fieldNames.map((name) => ({
        fieldName: name,
        selector: '',
        count: 0,
        samples: [],
        status: 'success' as const, // 바로 성공으로 표시
      }))
    )
  }

  const saveMultipleFields = async () => {
    const successFields = multiFieldResults.filter(
      (f) => f.status === 'success'
    )

    if (successFields.length === 0) {
      alert('성공적으로 찾은 필드가 없습니다')
      return
    }

    if (!project) return

    try {
      const updatedSelectors = { ...project.selectors }

      successFields.forEach((field) => {
        updatedSelectors[field.fieldName] = field.selector
      })

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectors: updatedSelectors }),
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        setAddFieldDialogOpen(false)
        alert(`${successFields.length}개의 필드가 추가되었습니다!`)
      } else {
        alert('필드 추가 실패')
      }
    } catch (error) {
      console.error('필드 추가 실패:', error)
      alert('필드 추가 중 오류 발생')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      DRAFT: 'outline',
      ACTIVE: 'default',
      PAUSED: 'secondary',
      ERROR: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status === 'DRAFT' && '초안'}
        {status === 'ACTIVE' && '활성'}
        {status === 'PAUSED' && '일시정지'}
        {status === 'ERROR' && '오류'}
      </Badge>
    )
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          ← 대시보드로 돌아가기
        </Button>
      </div>

      <div className="space-y-6">
        {/* 프로젝트 정보 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{project.name}</CardTitle>
                {!editingUrl ? (
                  <div className="mt-2 flex items-center gap-2">
                    <CardDescription>
                      {project.urls?.[0] || 'URL 없음'}
                    </CardDescription>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingUrl(true)
                        setNewUrl(project.urls?.[0] || '')
                      }}
                      className="h-auto p-1 text-xs"
                    >
                      ✏️ URL 변경
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="새 URL 입력"
                      className="text-sm"
                    />
                    <Button size="sm" onClick={updateTargetUrl}>
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUrl(false)}
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>
              {getStatusBadge(project.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  스케줄
                </p>
                <p className="mt-1 font-mono text-sm">
                  {project.scheduleType === 'manual'
                    ? '수동 실행'
                    : project.scheduleType === 'hourly'
                      ? '매시간'
                      : project.scheduleType === 'daily'
                        ? '매일'
                        : project.scheduleType === 'weekly'
                          ? '매주'
                          : project.scheduleType === 'monthly'
                            ? '매월'
                            : project.scheduleType}
                  {project.scheduleCron && ` (${project.scheduleCron})`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  상태
                </p>
                <p className="mt-1 text-sm">{project.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  생성일
                </p>
                <p className="mt-1 text-sm">
                  {new Date(project.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  마지막 실행
                </p>
                <p className="mt-1 text-sm">
                  {project.lastRunAt
                    ? new Date(project.lastRunAt).toLocaleString('ko-KR')
                    : '없음'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={runSampleCrawl}
                disabled={runningCrawl}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                {runningCrawl ? '실행 중...' : '샘플 크롤링 실행 (10개)'}
              </Button>
              <Button
                onClick={() => {
                  // CSS Selector 검증
                  if (project?.selectors) {
                    const emptySelectors = Object.entries(project.selectors)
                      .filter(
                        ([_, selector]) => !selector || selector.trim() === ''
                      )
                      .map(([fieldName, _]) => fieldName)

                    if (emptySelectors.length > 0) {
                      alert(
                        `CSS Selector가 설정되지 않은 필드가 있습니다:\n\n` +
                          `${emptySelectors.join(', ')}\n\n` +
                          `각 필드의 "편집" 버튼을 클릭하여 CSS Selector를 설정해주세요.`
                      )
                      return
                    }
                  }
                  setPageRangeDialogOpen(true)
                }}
                disabled={crawlingPages}
                variant="secondary"
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                {crawlingPages
                  ? '크롤링 중...'
                  : '📊 전체 크롤링 (페이지 범위)'}
              </Button>
              <Button
                variant="destructive"
                onClick={deleteProject}
                className="cursor-pointer hover:opacity-90 transition-opacity"
              >
                프로젝트 삭제
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 데이터 스키마 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  데이터 스키마
                  {project.selectors &&
                    Object.values(project.selectors).filter(
                      (s) => !s || s.trim() === ''
                    ).length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        ⚠️ Selector 미설정{' '}
                        {
                          Object.values(project.selectors).filter(
                            (s) => !s || s.trim() === ''
                          ).length
                        }
                        개
                      </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                  수집하는 데이터 필드 목록
                  {project.selectors &&
                    Object.values(project.selectors).filter(
                      (s) => !s || s.trim() === ''
                    ).length > 0 && (
                      <span className="text-destructive ml-2">
                        - CSS Selector를 설정해야 크롤링이 가능합니다
                      </span>
                    )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedFields.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmDeleteSelectedFields}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    type="button"
                  >
                    🗑️ 선택 삭제 ({selectedFields.size})
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={openAddFieldDialog}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  ➕ 필드 추가
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `/dashboard/projects/${projectId}/selector-helper`,
                      '_blank'
                    )
                  }
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  🎯 Selector 쉽게 찾기
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          project.selectors &&
                          selectedFields.size > 0 &&
                          selectedFields.size ===
                            Object.keys(project.selectors).length
                        }
                        onChange={toggleAllFields}
                        className="h-4 w-4 cursor-pointer"
                        title="전체 선택/해제"
                      />
                    </TableHead>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="w-16 text-center">순서</TableHead>
                    <TableHead>필드명</TableHead>
                    <TableHead>CSS Selector</TableHead>
                    <TableHead className="w-32 text-center">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext
                  items={
                    project.selectors ? Object.keys(project.selectors) : []
                  }
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {project.selectors &&
                      Object.entries(project.selectors).map(
                        ([fieldName, selector], index) => (
                          <SortableRow
                            key={fieldName}
                            fieldName={fieldName}
                            selector={selector}
                            index={index}
                            isSelected={selectedFields.has(fieldName)}
                            onEdit={openEditDialog}
                            onDelete={deleteField}
                            onToggleSelect={toggleFieldSelection}
                          />
                        )
                      )}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          </CardContent>
        </Card>

        {/* 사전 액션 */}
        <PreActionsEditor
          actions={(project.preActions as PreAction[]) || []}
          onChange={updatePreActions}
        />

        {/* 샘플 데이터 */}
        {sampleData && (
          <Card>
            <CardHeader>
              <CardTitle>샘플 데이터</CardTitle>
              <CardDescription>
                최근 실행한 샘플 크롤링 결과 (
                {Array.isArray(sampleData) ? sampleData.length : 0}건)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(sampleData) && sampleData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        {Object.keys(sampleData[0]).map((fieldName) => (
                          <TableHead key={fieldName}>{fieldName}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          {Object.values(item).map((value, i) => (
                            <TableCell key={i}>{value as string}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : Array.isArray(sampleData) && sampleData.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-destructive/30 bg-destructive/5 p-6">
                  <div className="text-center">
                    <p className="mb-3 text-lg font-semibold text-destructive">
                      ⚠️ 데이터를 찾을 수 없습니다
                    </p>
                    <p className="mb-4 text-sm text-muted-foreground">
                      CSS Selector가 올바르지 않아 데이터를 수집하지 못했습니다.
                    </p>
                    <div className="space-y-2 text-left text-sm">
                      <p className="font-medium">해결 방법:</p>
                      <ol className="ml-4 list-decimal space-y-1">
                        <li>
                          위 "데이터 스키마" 섹션에서 각 필드의 "편집" 버튼 클릭
                        </li>
                        <li>
                          올바른 CSS Selector 입력 후 "Selector 테스트" 클릭
                        </li>
                        <li>데이터가 정상적으로 나타나면 "저장" 클릭</li>
                        <li>다시 "샘플 크롤링 실행" 클릭</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
                  {JSON.stringify(sampleData, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        {/* 사용 가이드 */}
        <Card>
          <CardHeader>
            <CardTitle>API 사용 방법</CardTitle>
            <CardDescription>
              수집된 데이터에 접근하는 방법 (추후 API 키 기능 추가 예정)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">프로젝트 ID</p>
                <code className="block rounded bg-muted p-3 text-sm">
                  {project.id}
                </code>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">
                  예상 엔드포인트 (추후 구현)
                </p>
                <code className="block rounded bg-muted p-3 text-sm overflow-x-auto whitespace-pre-wrap">
                  GET /api/data/{project.id}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필드 추가 Dialog - 멀티 필드 */}
      <Dialog open={addFieldDialogOpen} onOpenChange={setAddFieldDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>필드 일괄 추가</DialogTitle>
            <DialogDescription>
              여러 필드명을 쉼표로 구분해서 입력하면 AI가 한 번에 모두
              찾아드립니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 필드명 입력 */}
            <div className="space-y-3">
              <Label htmlFor="newFieldNames">필드명 (쉼표로 구분)</Label>
              <div className="space-y-2">
                <Input
                  id="newFieldNames"
                  value={newFieldNames}
                  onChange={(e) => setNewFieldNames(e.target.value)}
                  placeholder="장기요양기관, 급여종류, 평가결과, 정원, 현원, 주소, 전화번호"
                  className="text-sm"
                  disabled={autoFinding}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !autoFinding) {
                      autoFindMultipleSelectors()
                    }
                  }}
                />
                <Button
                  onClick={autoFindMultipleSelectors}
                  disabled={autoFinding || !newFieldNames.trim()}
                  className="w-full"
                  size="lg"
                >
                  ✅ 모든 필드 추가하기
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 예: "장기요양기관, 급여종류, 평가결과, 정원, 현원, 주소,
                전화번호" (쉼표로 구분)
              </p>
            </div>

            {/* 진행 상황 및 결과 */}
            {multiFieldResults.length > 0 && (
              <div className="space-y-3">
                <Label>
                  필드 찾기 결과 (
                  {
                    multiFieldResults.filter((f) => f.status === 'success')
                      .length
                  }
                  /{multiFieldResults.length})
                </Label>
                <div className="space-y-2">
                  {multiFieldResults.map((result, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${
                        result.status === 'success'
                          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                          : result.status === 'failed'
                            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                            : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {result.status === 'finding' && (
                              <span className="text-sm">🔍</span>
                            )}
                            {result.status === 'success' && (
                              <span className="text-sm">✅</span>
                            )}
                            {result.status === 'failed' && (
                              <span className="text-sm">❌</span>
                            )}
                            <p className="font-medium text-sm">
                              {result.fieldName}
                            </p>
                          </div>

                          {result.status === 'finding' && (
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                              <p className="text-xs text-muted-foreground animate-pulse">
                                Selector를 찾는 중...
                              </p>
                            </div>
                          )}

                          {result.status === 'success' && (
                            <div className="mt-2 space-y-1">
                              {result.selector ? (
                                <>
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {result.selector}
                                  </p>
                                  <p className="text-xs text-green-700 dark:text-green-300">
                                    {result.count}개의 데이터 발견
                                  </p>
                                  {result.samples.length > 0 && (
                                    <div className="mt-1">
                                      <p className="text-xs text-muted-foreground">
                                        미리보기: {result.samples[0]}
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-green-700 dark:text-green-300">
                                  필드 추가 완료 - Selector는 추가 후 개별 설정
                                  가능
                                </p>
                              )}
                            </div>
                          )}

                          {result.status === 'failed' && (
                            <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                              Selector를 찾지 못했습니다
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 안내 메시지 */}
            {multiFieldResults.length === 0 && !autoFinding && (
              <div className="rounded-lg border-2 border-dashed bg-muted/50 p-6">
                <div className="text-center">
                  <p className="mb-3 text-sm font-medium">
                    💡 한 번에 여러 필드를 추가하세요!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    입력한 순서대로 AI가 자동으로 찾아드립니다
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge variant="outline">장기요양기관</Badge>
                    <Badge variant="outline">급여종류</Badge>
                    <Badge variant="outline">평가결과</Badge>
                    <Badge variant="outline">정원</Badge>
                    <Badge variant="outline">현원</Badge>
                    <Badge variant="outline">주소</Badge>
                    <Badge variant="outline">전화번호</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddFieldDialogOpen(false)}
              disabled={autoFinding}
            >
              취소
            </Button>
            <Button
              onClick={saveMultipleFields}
              disabled={
                autoFinding ||
                multiFieldResults.filter((f) => f.status === 'success')
                  .length === 0
              }
            >
              {multiFieldResults.filter((f) => f.status === 'success').length >
              0
                ? `✅ ${multiFieldResults.filter((f) => f.status === 'success').length}개 필드 추가`
                : '필드 추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 페이지 범위 크롤링 Dialog */}
      <Dialog open={pageRangeDialogOpen} onOpenChange={setPageRangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>전체 크롤링 - 페이지 범위 설정</DialogTitle>
            <DialogDescription>
              여러 페이지의 데이터를 한 번에 수집합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <p className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                💡 페이지네이션 정보
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                목록검색 페이지는 총 <strong>4,411페이지</strong>가 있으며,
                페이지당 <strong>10개</strong>의 기관 정보가 표시됩니다.
              </p>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                한 번에 최대 100페이지(1,000개 항목)까지 크롤링할 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startPage">시작 페이지</Label>
                <Input
                  id="startPage"
                  type="number"
                  min={1}
                  value={startPage}
                  onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endPage">종료 페이지</Label>
                <Input
                  id="endPage"
                  type="number"
                  min={1}
                  value={endPage}
                  onChange={(e) => setEndPage(parseInt(e.target.value) || 10)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pageParam">페이지 파라미터 이름 (고급)</Label>
              <Input
                id="pageParam"
                type="text"
                value={pageParamName}
                onChange={(e) => setPageParamName(e.target.value)}
                placeholder="기본값: page"
                className="mt-1 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                URL에 사용되는 페이지 번호 파라미터 (예: ?page=1, ?pageNo=1)
              </p>
            </div>

            {crawlProgress && (
              <div className="rounded border bg-blue-50 p-3 dark:bg-blue-950">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {crawlProgress}
                </p>
              </div>
            )}

            <div className="rounded border bg-muted p-3">
              <p className="text-sm">
                <strong>예상 수집량:</strong> 약{' '}
                {Math.min(
                  (endPage - startPage + 1) * 10,
                  (endPage - startPage + 1) * 10
                )}
                개 항목
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                (페이지당 10개 × {endPage - startPage + 1}페이지)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPageRangeDialogOpen(false)}
              disabled={crawlingPages}
            >
              취소
            </Button>
            <Button onClick={crawlMultiplePages} disabled={crawlingPages}>
              {crawlingPages ? '크롤링 중...' : '크롤링 시작'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 선택 삭제 확인 Dialog */}
      <Dialog
        open={confirmDeleteDialogOpen}
        onOpenChange={setConfirmDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>선택한 필드 삭제</DialogTitle>
            <DialogDescription>
              정말 선택한 {selectedFields.size}개의 필드를 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm font-medium">삭제될 필드:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {Array.from(selectedFields).map((fieldName) => (
                <li key={fieldName}>{fieldName}</li>
              ))}
            </ul>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSelectedFields}
              className="cursor-pointer"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selector 편집 Dialog - 쉬운 버전 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>"{editingField?.name}" 데이터 찾기</DialogTitle>
            <DialogDescription>
              어떤 데이터를 찾고 싶은지 설명만 해주세요!
            </DialogDescription>
          </DialogHeader>

          {editingField && (
            <div className="space-y-6">
              {!showAdvanced ? (
                // 쉬운 모드 - AI에게 설명
                <>
                  <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold">
                      <span className="text-2xl">🤖</span>
                      AI에게 설명하기
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      예: "기관 이름", "주소", "전화번호", "테이블의 첫 번째 열"
                      등
                    </p>
                    <div className="space-y-3">
                      <Input
                        value={aiDescription}
                        onChange={(e) => setAiDescription(e.target.value)}
                        placeholder={`"${editingField.name}"이(가) 어디에 있나요? 간단히 설명해주세요`}
                        className="text-base"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            findByDescription()
                          }
                        }}
                      />
                      <Button
                        onClick={findByDescription}
                        disabled={testing || !aiDescription.trim()}
                        className="w-full"
                        size="lg"
                      >
                        {testing ? '찾는 중...' : '🔍 AI가 자동으로 찾기'}
                      </Button>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(true)}
                      className="text-muted-foreground"
                    >
                      직접 CSS Selector 입력하기 (고급) →
                    </Button>
                  </div>
                </>
              ) : (
                // 고급 모드 - 직접 입력
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>CSS Selector (고급)</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(false)}
                        className="text-muted-foreground"
                      >
                        ← 쉬운 모드로
                      </Button>
                    </div>
                    <Input
                      value={editingField.selector}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          selector: e.target.value,
                        })
                      }
                      placeholder="예: .class-name, #id, div > p"
                      className="font-mono"
                    />
                    <Button
                      onClick={testSelector}
                      disabled={testing}
                      variant="secondary"
                      className="w-full"
                    >
                      {testing ? '테스트 중...' : '테스트'}
                    </Button>
                  </div>
                </>
              )}

              {/* 현재 Selector 표시 */}
              {editingField.selector && (
                <div className="rounded border bg-muted p-3">
                  <p className="text-xs text-muted-foreground">
                    현재 Selector:
                  </p>
                  <code className="text-sm">{editingField.selector}</code>
                </div>
              )}

              {/* 테스트 결과 */}
              {testResult && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 font-medium">{testResult.message}</p>
                  {testResult.count > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-600">
                        ✅ {testResult.count}개의 데이터를 찾았습니다!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        미리보기 (최대 5개):
                      </p>
                      <ul className="list-inside list-disc space-y-1 text-sm">
                        {testResult.samples.map((sample, i) => (
                          <li key={i} className="truncate">
                            {sample}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {testResult.count === 0 && (
                    <div className="mt-2 rounded bg-destructive/10 p-3 text-sm">
                      <p className="font-medium text-destructive">
                        ❌ 데이터를 찾지 못했습니다
                      </p>
                      <p className="mt-2 text-destructive/80">
                        {!showAdvanced
                          ? '다른 방식으로 설명해보거나, "직접 CSS Selector 입력하기"를 시도해보세요.'
                          : 'Selector를 다시 확인해주세요.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={saveFieldSelector}
              disabled={!testResult || testResult.count === 0}
            >
              {testResult && testResult.count > 0 ? '✅ 저장' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
