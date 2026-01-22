import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Get total projects count
    const totalProjects = await prisma.project.count({
      where: { userId },
    })

    // Get active projects count
    const activeProjects = await prisma.project.count({
      where: { userId, status: 'active' },
    })

    // Get total crawling runs
    const totalRuns = await prisma.crawlingRun.count({
      where: {
        project: { userId },
      },
    })

    // Get successful runs count
    const successfulRuns = await prisma.crawlingRun.count({
      where: {
        project: { userId },
        status: 'completed',
      },
    })

    // Calculate success rate
    const successRate =
      totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0

    // Get recent runs (last 7 days) for activity chart
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentRuns = await prisma.crawlingRun.findMany({
      where: {
        project: { userId },
        startedAt: { gte: sevenDaysAgo },
      },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        startedAt: true,
      },
    })

    // Group by date for chart
    const activityByDate: Record<
      string,
      { success: number; failed: number; running: number }
    > = {}

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      activityByDate[dateKey] = { success: 0, failed: 0, running: 0 }
    }

    recentRuns.forEach((run) => {
      const dateKey = run.startedAt.toISOString().split('T')[0]
      if (activityByDate[dateKey]) {
        if (run.status === 'completed') {
          activityByDate[dateKey].success++
        } else if (run.status === 'failed') {
          activityByDate[dateKey].failed++
        } else {
          activityByDate[dateKey].running++
        }
      }
    })

    const activityChart = Object.entries(activityByDate).map(
      ([date, counts]) => ({
        date,
        ...counts,
      })
    )

    // Get recent projects with run info
    const recentProjects = await prisma.project.findMany({
      where: { userId },
      orderBy: { lastRunAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { crawlingRuns: true },
        },
        crawlingRuns: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    })

    return NextResponse.json({
      stats: {
        totalProjects,
        activeProjects,
        totalRuns,
        successfulRuns,
        successRate,
      },
      activityChart,
      recentProjects,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: '통계 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
