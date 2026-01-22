'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface RecentProject {
  id: string
  name: string
  status: string
  lastRunAt: string | null
  _count: {
    crawlingRuns: number
  }
  crawlingRuns: Array<{
    id: string
    status: string
    startedAt: Date
    completedAt: Date | null
  }>
}

interface RecentProjectsProps {
  projects: RecentProject[]
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  const router = useRouter()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      active: 'default',
      paused: 'secondary',
      archived: 'outline',
    }
    const labels: Record<string, string> = {
      active: '활성',
      paused: '일시정지',
      archived: '보관됨',
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatLastRun = (dateStr: string | null) => {
    if (!dateStr) return '실행 기록 없음'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 프로젝트</CardTitle>
          <CardDescription>아직 프로젝트가 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/dashboard/new')}>
            첫 프로젝트 만들기
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 프로젝트</CardTitle>
        <CardDescription>최근 실행된 프로젝트 목록</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => {
            const lastRun = project.crawlingRuns[0]
            return (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                <div className="flex items-center gap-4 flex-1">
                  {lastRun && getStatusIcon(lastRun.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{project.name}</h4>
                      {getStatusBadge(project.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{project._count.crawlingRuns}회 실행</span>
                      <span>•</span>
                      <span>{formatLastRun(project.lastRunAt)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/dashboard/projects/${project.id}`)
                  }}
                >
                  상세보기
                </Button>
              </div>
            )
          })}
        </div>
        {projects.length >= 5 && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push('/dashboard')}
          >
            모든 프로젝트 보기
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
