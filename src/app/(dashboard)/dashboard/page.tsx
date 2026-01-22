'use client'

import { useEffect, useState } from 'react'
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
import { useRouter } from 'next/navigation'
import { StatCard } from '@/components/dashboard/StatCard'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { RecentProjects } from '@/components/dashboard/RecentProjects'
import {
  FolderKanban,
  PlayCircle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Settings,
} from 'lucide-react'

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
  _count?: {
    crawlingRuns: number
  }
}

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalRuns: number
  successfulRuns: number
  successRate: number
}

interface ActivityData {
  date: string
  success: number
  failed: number
  running: number
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activityChart, setActivityChart] = useState<ActivityData[]>([])
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDashboardData()
    }
  }, [isLoaded, isSignedIn])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/dashboard/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
        setActivityChart(statsData.activityChart)
        setRecentProjects(statsData.recentProjects)
      }

      // Fetch all projects for the table
      const projectsResponse = await fetch('/api/projects')
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData.projects || [])
      }
    } catch (error) {
      console.error('대시보드 데이터 가져오기 실패:', error)
    } finally {
      setLoading(false)
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
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status === 'active' && '활성'}
        {status === 'paused' && '일시정지'}
        {status === 'archived' && '보관됨'}
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

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-muted-foreground mt-2">
            크롤링 프로젝트를 관리하고 모니터링하세요
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            설정
          </Button>
          <Button size="lg" onClick={() => router.push('/dashboard/new')}>
            <Plus className="mr-2 h-4 w-4" />새 프로젝트
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="총 프로젝트"
            value={stats.totalProjects}
            description={`활성: ${stats.activeProjects}개`}
            icon={FolderKanban}
          />
          <StatCard
            title="총 실행 횟수"
            value={stats.totalRuns}
            description="전체 크롤링 실행"
            icon={PlayCircle}
          />
          <StatCard
            title="성공한 실행"
            value={stats.successfulRuns}
            description={`성공률: ${stats.successRate}%`}
            icon={CheckCircle2}
          />
          <StatCard
            title="성공률"
            value={`${stats.successRate}%`}
            description="전체 실행 대비"
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Activity Chart and Recent Projects */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {activityChart.length > 0 && <ActivityChart data={activityChart} />}
        {recentProjects.length > 0 && (
          <RecentProjects projects={recentProjects} />
        )}
      </div>

      {/* Projects Table */}
      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>프로젝트가 없습니다</CardTitle>
            <CardDescription>
              새 프로젝트를 만들어 데이터 수집을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/new')}>
              <Plus className="mr-2 h-4 w-4" />첫 프로젝트 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>모든 프로젝트</CardTitle>
            <CardDescription>총 {projects.length}개의 프로젝트</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>프로젝트명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>대상 URL</TableHead>
                  <TableHead>스케줄</TableHead>
                  <TableHead>실행 횟수</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {project.urls[0]}
                      {project.urls.length > 1 &&
                        ` 외 ${project.urls.length - 1}개`}
                    </TableCell>
                    <TableCell>
                      {project.scheduleType === 'manual' && '수동'}
                      {project.scheduleType === 'hourly' && '매시간'}
                      {project.scheduleType === 'daily' && '매일'}
                      {project.scheduleType === 'weekly' && '매주'}
                      {project.scheduleType === 'monthly' && '매월'}
                    </TableCell>
                    <TableCell>{project._count?.crawlingRuns || 0}회</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/projects/${project.id}`)
                        }
                      >
                        상세보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
